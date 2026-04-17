import { describe, expect, test } from 'bun:test'

import { getBridgeCommandSafety } from '../../bridge/bridgeCommandPolicy.js'
import plan from './index.js'

describe('plan bridge invocation safety', () => {
  test('allows headless plan mode operations over Remote Control', () => {
    expect(getBridgeCommandSafety(plan, '')).toEqual({ ok: true })
    expect(getBridgeCommandSafety(plan, 'write a migration plan')).toEqual({
      ok: true,
    })
  })

  test('blocks /plan open over Remote Control', () => {
    expect(getBridgeCommandSafety(plan, 'open')).toEqual({
      ok: false,
      reason:
        "Opening the local editor via /plan open isn't available over Remote Control.",
    })
  })
})
