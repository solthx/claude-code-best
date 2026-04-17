import { feature } from 'bun:bundle'
import { notifyAutomationStateChanged } from 'src/bridge/automationStateMetadata.js'

const SLEEP_WAKE_CHECK_INTERVAL_MS = 500

function isProactiveAutomationEnabled(): boolean {
  if (!(feature('PROACTIVE') || feature('KAIROS'))) {
    return false
  }

  const mod =
    require('src/proactive/index.js') as typeof import('src/proactive/index.js')
  return mod.isProactiveActive()
}

function isProactiveSleepAllowed(): boolean {
  if (!(feature('PROACTIVE') || feature('KAIROS'))) {
    return true
  }

  const mod =
    require('src/proactive/index.js') as typeof import('src/proactive/index.js')
  return mod.isProactiveActive()
}

function hasQueuedWakeSignal(): boolean {
  const queue =
    require('src/utils/messageQueueManager.js') as typeof import('src/utils/messageQueueManager.js')
  return queue.hasCommandsInQueue()
}

export function shouldInterruptSleep(): boolean {
  return !isProactiveSleepAllowed() || hasQueuedWakeSignal()
}

export function notifySleepStarted(sleepUntil: number): void {
  if (!isProactiveAutomationEnabled()) {
    return
  }

  notifyAutomationStateChanged({
    enabled: true,
    phase: 'sleeping',
    next_tick_at: null,
    sleep_until: sleepUntil,
  })
}

export function notifySleepFinished(): void {
  notifyAutomationStateChanged(
    isProactiveAutomationEnabled()
      ? {
          enabled: true,
          phase: null,
          next_tick_at: null,
          sleep_until: null,
        }
      : null,
  )
}

export async function waitForSleepCompletion(
  durationSeconds: number,
  abortController: AbortController,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let wakeCheck: ReturnType<typeof setInterval> | null = null
    let settled = false

    const cleanup = () => {
      if (timer !== null) {
        clearTimeout(timer)
        timer = null
      }
      if (wakeCheck !== null) {
        clearInterval(wakeCheck)
        wakeCheck = null
      }
      abortController.signal.removeEventListener('abort', onAbort)
    }

    const finish = () => {
      if (settled) return
      settled = true
      cleanup()
      resolve()
    }

    const interrupt = () => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error('interrupted'))
    }

    const onAbort = () => {
      interrupt()
    }

    timer = setTimeout(finish, durationSeconds * 1000)

    // Abort via user interrupt.
    if (abortController.signal.aborted) {
      interrupt()
      return
    }
    abortController.signal.addEventListener('abort', onAbort, { once: true })

    // Poll proactive state and the shared command queue so new work can wake
    // Sleep without waiting for the full duration.
    wakeCheck = setInterval(() => {
      if (shouldInterruptSleep()) {
        interrupt()
      }
    }, SLEEP_WAKE_CHECK_INTERVAL_MS)
  })
}
