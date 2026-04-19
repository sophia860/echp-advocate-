// Allow-listed tool implementations available to agents.
//
// Tools are pure functions over per-request state (the blackboard) plus the
// orchestrator handle for spawn_subagent. No filesystem, no network beyond
// what an agent's LLM call already does.

import { lookupLaw } from './legal-corpus.js'
import type { ToolCall } from './types.js'

export type Blackboard = Map<string, string>

export interface ToolContext {
  blackboard: Blackboard
  /** Spawn a sub-agent. Returns its final output string. */
  spawn: (role: string, task: string) => Promise<string>
  /** Marks the agent as finished. */
  finish: (output: string) => void
  /** Returns true if a tool name is permitted for this agent. */
  allow: (toolName: string) => boolean
}

export interface ToolResult {
  ok: boolean
  output: string
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

export async function executeTool(call: ToolCall, ctx: ToolContext): Promise<ToolResult> {
  if (!ctx.allow(call.name)) {
    return { ok: false, output: `Tool "${call.name}" is not permitted for this agent.` }
  }

  switch (call.name) {
    case 'search_blackboard': {
      const key = asString(call.args.key)
      if (!key) return { ok: false, output: 'search_blackboard requires "key".' }
      const v = ctx.blackboard.get(key)
      return { ok: true, output: v ?? `(no entry for "${key}")` }
    }

    case 'write_blackboard': {
      const key = asString(call.args.key)
      const value = asString(call.args.value)
      if (!key) return { ok: false, output: 'write_blackboard requires "key".' }
      // Keep blackboard entries bounded to avoid runaway memory.
      const trimmed = value.length > 20_000 ? value.slice(0, 20_000) + '\n…[truncated]' : value
      ctx.blackboard.set(key, trimmed)
      return { ok: true, output: `stored "${key}" (${trimmed.length} chars)` }
    }

    case 'cite_law': {
      const topic = asString(call.args.topic)
      if (!topic) return { ok: false, output: 'cite_law requires "topic".' }
      const hits = lookupLaw(topic, 3)
      const formatted = hits
        .map(h => `- ${h.citation} — ${h.summary}`)
        .join('\n')
      return { ok: true, output: formatted }
    }

    case 'spawn_subagent': {
      const role = asString(call.args.role)
      const task = asString(call.args.task)
      if (!role || !task) {
        return { ok: false, output: 'spawn_subagent requires "role" and "task".' }
      }
      try {
        const out = await ctx.spawn(role, task)
        return { ok: true, output: out }
      } catch (err) {
        return { ok: false, output: `spawn failed: ${(err as Error).message}` }
      }
    }

    case 'finish': {
      const output = asString(call.args.output)
      ctx.finish(output)
      return { ok: true, output: '(finished)' }
    }

    default:
      return { ok: false, output: `Unknown tool: ${call.name}` }
  }
}
