export type AutomationStatePhase = 'standby' | 'sleeping'

export type AutomationStateMetadata = {
  enabled: boolean
  phase: AutomationStatePhase | null
  next_tick_at: number | null
  sleep_until: number | null
}
