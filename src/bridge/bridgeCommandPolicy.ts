import type { Command } from '../types/command.js'
import { getCommandName } from '../types/command.js'

const BRIDGE_SAFE_LOCAL_COMMAND_NAMES = new Set([
  'compact',
  'clear',
  'cost',
  'summary',
  'release-notes',
  'files',
])

export type BridgeCommandSafety =
  | { ok: true }
  | { ok: false; reason?: string }

export function isCoreBridgeSafeCommand(cmd: Command): boolean {
  if (cmd.type === 'local-jsx') return false
  if (cmd.type === 'prompt') return true
  return BRIDGE_SAFE_LOCAL_COMMAND_NAMES.has(getCommandName(cmd))
}

function getLocalJsxBridgeError(
  cmd: Command,
  args: string,
): string | undefined {
  switch (cmd.name) {
    case 'plan': {
      const subcommand = args.trim().split(/\s+/)[0]
      if (subcommand === 'open') {
        return "Opening the local editor via /plan open isn't available over Remote Control."
      }
      return undefined
    }
    case 'proactive':
      return undefined
    default:
      return `/${getCommandName(cmd)} isn't available over Remote Control.`
  }
}

export function getBridgeCommandSafety(
  cmd: Command,
  args: string,
): BridgeCommandSafety {
  if (cmd.type === 'local-jsx') {
    const reason = getLocalJsxBridgeError(cmd, args)
    return reason ? { ok: false, reason } : { ok: true }
  }

  if (!isCoreBridgeSafeCommand(cmd)) {
    return { ok: false }
  }

  return { ok: true }
}
