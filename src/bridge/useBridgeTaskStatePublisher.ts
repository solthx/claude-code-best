import { feature } from 'bun:bundle'
import { type FSWatcher, watch } from 'fs'
import { useEffect, type RefObject } from 'react'
import type { ReplBridgeHandle } from './replBridge.js'
import { logForDebugging } from '../utils/debug.js'
import { errorMessage } from '../utils/errors.js'
import {
  buildTaskStateMessage,
  getTaskStateSnapshotKey,
} from './taskStateMessage.js'
import {
  getTaskListId,
  getTasksDir,
  listTasks,
  onTasksUpdated,
} from '../utils/tasks.js'

const TASK_STATE_DEBOUNCE_MS = 50
const TASK_STATE_POLL_MS = 5000

export function useBridgeTaskStatePublisher({
  handleRef,
  replBridgeSessionActive,
  replBridgeOutboundOnly,
}: {
  handleRef: RefObject<ReplBridgeHandle | null>
  replBridgeSessionActive: boolean
  replBridgeOutboundOnly: boolean
}): void {
  useEffect(() => {
    if (!feature('BRIDGE_MODE')) {
      return
    }
    if (!replBridgeSessionActive || replBridgeOutboundOnly) {
      return
    }

    let cancelled = false
    let debounceTimer: ReturnType<typeof setTimeout> | undefined
    let pollTimer: ReturnType<typeof setInterval> | undefined
    let watcher: FSWatcher | null = null
    let watchedDir: string | null = null
    let lastPublishedSnapshotKey: string | null = null
    let lastPublishedHandle: ReplBridgeHandle | null = null

    const schedulePublish = (): void => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        debounceTimer = undefined
        void publishTaskState()
      }, TASK_STATE_DEBOUNCE_MS)
      debounceTimer.unref?.()
    }

    const rewatch = (dir: string): void => {
      if (dir === watchedDir && watcher !== null) return
      watcher?.close()
      watcher = null
      watchedDir = dir
      try {
        watcher = watch(dir, schedulePublish)
        watcher.unref()
      } catch {
        // Writers ensure the directory exists; if it does not yet, the poll
        // timer and in-process task signal still converge the snapshot.
      }
    }

    const publishTaskState = async (): Promise<void> => {
      const handle = handleRef.current
      if (!handle) return

      const taskListId = getTaskListId()
      rewatch(getTasksDir(taskListId))

      try {
        const tasks = await listTasks(taskListId)
        if (cancelled || handleRef.current !== handle) return
        const snapshotKey = getTaskStateSnapshotKey(taskListId, tasks)
        if (
          snapshotKey === lastPublishedSnapshotKey &&
          handle === lastPublishedHandle
        ) {
          return
        }
        handle.writeSdkMessages([buildTaskStateMessage(taskListId, tasks)])
        lastPublishedSnapshotKey = snapshotKey
        lastPublishedHandle = handle
      } catch (err) {
        logForDebugging(
          `[bridge:repl] Failed to publish task_state: ${errorMessage(err)}`,
          { level: 'error' },
        )
      }
    }

    void publishTaskState()
    const unsubscribe = onTasksUpdated(schedulePublish)
    pollTimer = setInterval(() => {
      void publishTaskState()
    }, TASK_STATE_POLL_MS)
    pollTimer.unref?.()

    return () => {
      cancelled = true
      unsubscribe()
      if (debounceTimer) clearTimeout(debounceTimer)
      if (pollTimer) clearInterval(pollTimer)
      watcher?.close()
    }
  }, [handleRef, replBridgeOutboundOnly, replBridgeSessionActive])
}
