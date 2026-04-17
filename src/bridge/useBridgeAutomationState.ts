import { feature } from 'bun:bundle'
import { useEffect, useSyncExternalStore } from 'react'
import { notifyAutomationStateChanged } from './automationStateMetadata.js'

const PROACTIVE_NO_OP_SUBSCRIBE = (_cb: () => void) => () => {}
const PROACTIVE_FALSE = () => false
const PROACTIVE_NULL = (): number | null => null

type ProactiveModule = {
  subscribeToProactiveChanges?: (cb: () => void) => () => void
  isProactiveActive?: () => boolean
  getNextTickAt?: () => number | null
}

export function useBridgeAutomationState({
  proactiveModule,
  isLoading,
  queuedCommandsLength,
  hasActiveLocalJsxUI,
  isInPlanMode,
  hasInitialMessage,
}: {
  proactiveModule: ProactiveModule | null
  isLoading: boolean
  queuedCommandsLength: number
  hasActiveLocalJsxUI: boolean
  isInPlanMode: boolean
  hasInitialMessage: boolean
}): boolean {
  const proactiveActive = useSyncExternalStore<boolean>(
    proactiveModule?.subscribeToProactiveChanges ?? PROACTIVE_NO_OP_SUBSCRIBE,
    proactiveModule?.isProactiveActive ?? PROACTIVE_FALSE,
  )
  const proactiveNextTickAt = useSyncExternalStore<number | null>(
    proactiveModule?.subscribeToProactiveChanges ?? PROACTIVE_NO_OP_SUBSCRIBE,
    proactiveModule?.getNextTickAt ?? PROACTIVE_NULL,
  )

  useEffect(() => {
    if (!feature('BRIDGE_MODE')) {
      return
    }

    if (!proactiveActive) {
      notifyAutomationStateChanged(null)
      return
    }

    if (isLoading) {
      return
    }

    if (
      proactiveNextTickAt !== null &&
      queuedCommandsLength === 0 &&
      !hasActiveLocalJsxUI &&
      !isInPlanMode &&
      !hasInitialMessage
    ) {
      notifyAutomationStateChanged({
        enabled: true,
        phase: 'standby',
        next_tick_at: proactiveNextTickAt,
        sleep_until: null,
      })
      return
    }

    notifyAutomationStateChanged({
      enabled: true,
      phase: null,
      next_tick_at: null,
      sleep_until: null,
    })
  }, [
    hasActiveLocalJsxUI,
    hasInitialMessage,
    isInPlanMode,
    isLoading,
    proactiveActive,
    proactiveNextTickAt,
    queuedCommandsLength,
  ])

  return proactiveActive
}
