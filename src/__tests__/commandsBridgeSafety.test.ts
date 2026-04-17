import { describe, expect, test } from 'bun:test'

import {
  getBridgeCommandSafety,
  isCoreBridgeSafeCommand,
} from '../bridge/bridgeCommandPolicy.js'
import clear from '../commands/clear/index.js'
import plan from '../commands/plan/index.js'
import proactive from '../commands/proactive.js'

describe('isCoreBridgeSafeCommand', () => {
  test('keeps local-jsx commands blocked in the core bridge allowlist', () => {
    expect(isCoreBridgeSafeCommand(plan)).toBe(false)
    expect(isCoreBridgeSafeCommand(proactive)).toBe(false)
  })

  test('continues allowing explicit local bridge-safe commands', () => {
    expect(isCoreBridgeSafeCommand(clear)).toBe(true)
  })
})

describe('getBridgeCommandSafety', () => {
  test('allows approved local-jsx commands over Remote Control', () => {
    expect(getBridgeCommandSafety(plan, '')).toEqual({ ok: true })
    expect(getBridgeCommandSafety(proactive, '')).toEqual({ ok: true })
  })

  test('blocks /plan open over Remote Control', () => {
    expect(getBridgeCommandSafety(plan, 'open')).toEqual({
      ok: false,
      reason:
        "Opening the local editor via /plan open isn't available over Remote Control.",
    })
  })
})
