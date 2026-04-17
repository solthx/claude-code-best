import {
  getSessionMetadataSnapshot,
  notifySessionMetadataChanged,
} from '../utils/sessionState.js'
import type { AutomationStateMetadata } from '../utils/sessionMetadataTypes.js'

export type { AutomationStateMetadata } from '../utils/sessionMetadataTypes.js'

function normalizeAutomationState(
  state: AutomationStateMetadata | null | undefined,
): AutomationStateMetadata | null {
  if (!state || state.enabled !== true) {
    return null
  }

  return {
    enabled: true,
    phase:
      state.phase === 'standby' || state.phase === 'sleeping'
        ? state.phase
        : null,
    next_tick_at:
      typeof state.next_tick_at === 'number' ? state.next_tick_at : null,
    sleep_until:
      typeof state.sleep_until === 'number' ? state.sleep_until : null,
  }
}

function automationStatesEqual(
  a: AutomationStateMetadata | null,
  b: AutomationStateMetadata | null,
): boolean {
  return (
    a?.enabled === b?.enabled &&
    a?.phase === b?.phase &&
    a?.next_tick_at === b?.next_tick_at &&
    a?.sleep_until === b?.sleep_until
  )
}

export function notifyAutomationStateChanged(
  state: AutomationStateMetadata | null | undefined,
): void {
  const nextState = normalizeAutomationState(state)
  const currentState = normalizeAutomationState(
    getSessionMetadataSnapshot().automation_state ?? null,
  )
  if (automationStatesEqual(nextState, currentState)) {
    return
  }

  notifySessionMetadataChanged({
    automation_state: nextState ? { ...nextState } : null,
  })
}
