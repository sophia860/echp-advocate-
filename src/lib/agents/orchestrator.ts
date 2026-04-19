// Multi-agent orchestrator.
//
// Hard caps (env-tunable) keep cost and runtime bounded:
//   SWARM_MAX_AGENTS, SWARM_MAX_DEPTH, SWARM_MAX_TOKENS,
//   SWARM_MAX_WALL_MS, SWARM_MAX_TURNS_PER_AGENT
//
// The orchestrator never persists data and never makes network calls beyond
// the configured LLM providers.

import { generate, type ChatMessage } from './providers/index.js'
import { getAgent } from './registry.js'
import { executeTool, type Blackboard, type ToolContext } from './tools.js'
import type {
  AgentDefinition,
  AgentReply,
  SwarmRunOptions,
  SwarmRunResult,
  ToolCall,
  TraceEvent,
  UsageRecord,
} from './types.js'

interface Caps {
  maxAgents: number
  maxDepth: number
  maxTokens: number
  maxWallMs: number
  maxTurnsPerAgent: number
}

function readCaps(opts: SwarmRunOptions): Caps {
  const num = (envVar: string, fallback: number) => {
    const v = process.env[envVar]
    const n = v ? Number(v) : NaN
    return Number.isFinite(n) && n > 0 ? n : fallback
  }
  return {
    maxAgents: Math.min(opts.maxAgents ?? num('SWARM_MAX_AGENTS', 8), 16),
    maxDepth: Math.min(opts.maxDepth ?? num('SWARM_MAX_DEPTH', 2), 4),
    maxTokens: num('SWARM_MAX_TOKENS', 120_000),
    maxWallMs: num('SWARM_MAX_WALL_MS', 90_000),
    maxTurnsPerAgent: num('SWARM_MAX_TURNS_PER_AGENT', 6),
  }
}

interface RunState {
  caps: Caps
  startedAt: number
  agentCount: number
  totalInput: number
  totalOutput: number
  trace: TraceEvent[]
  blackboard: Blackboard
  /** Set when any cap is exceeded; subsequent agents short-circuit. */
  budgetExceeded: false | string
}

function over(state: RunState): false | string {
  if (state.budgetExceeded) return state.budgetExceeded
  if (Date.now() - state.startedAt > state.caps.maxWallMs) return 'wall_clock'
  if (state.totalInput + state.totalOutput > state.caps.maxTokens) return 'tokens'
  if (state.agentCount >= state.caps.maxAgents) return 'agent_count'
  return false
}

function safeParseReply(text: string): AgentReply {
  // Strip code-fence wrappers just in case the model adds them.
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '').trim()
  }
  try {
    const parsed = JSON.parse(cleaned) as unknown
    if (parsed && typeof parsed === 'object') {
      return parsed as AgentReply
    }
  } catch {
    /* fall through */
  }
  // If the model failed to produce JSON, treat the whole text as the final.
  return { final: text.trim() }
}

async function runAgent(
  state: RunState,
  def: AgentDefinition,
  task: string,
  depth: number,
  parent?: string,
): Promise<string> {
  const reason = over(state)
  if (reason) {
    state.trace.push({
      type: 'system_warning',
      message: `Skipping agent ${def.role} — budget exceeded (${reason}).`,
    })
    return `[budget exceeded: ${reason}]`
  }

  state.agentCount += 1
  const agentId = `${def.role}#${state.agentCount}`

  state.trace.push({ type: 'agent_start', agentId, role: def.role, depth, task, parent })

  const allowedTools = new Set(def.tools)
  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: `TASK:\n${task}\n\nReply with the JSON object format described in your instructions.`,
    },
  ]

  let finalOutput: string | null = null
  let finishReason: 'final' | 'turn_cap' | 'budget' | 'error' = 'final'

  for (let turn = 1; turn <= state.caps.maxTurnsPerAgent; turn++) {
    const budget = over(state)
    if (budget) {
      finishReason = 'budget'
      finalOutput = `[budget exceeded mid-run: ${budget}]`
      break
    }

    let reply: AgentReply
    let usage: UsageRecord
    try {
      const res = await generate({
        provider: def.provider,
        model: def.model,
        system: def.systemPrompt,
        messages,
        jsonMode: true,
      })
      usage = res.usage
      reply = safeParseReply(res.text)
    } catch (err) {
      state.trace.push({
        type: 'system_warning',
        message: `${agentId} provider error: ${(err as Error).message}`,
      })
      finishReason = 'error'
      finalOutput = `[provider error: ${(err as Error).message}]`
      break
    }

    state.totalInput += usage.inputTokens
    state.totalOutput += usage.outputTokens
    state.trace.push({ type: 'agent_message', agentId, turn, reply, usage })

    // Echo the assistant's raw JSON back into the conversation so it sees its
    // own prior turn when we send tool results.
    messages.push({ role: 'assistant', content: JSON.stringify(reply) })

    // If a final was provided, we're done (even if tool_calls also present).
    if (typeof reply.final === 'string' && reply.final.trim().length > 0) {
      finalOutput = reply.final
      break
    }

    const calls = Array.isArray(reply.tool_calls) ? reply.tool_calls : []
    if (calls.length === 0) {
      // Nothing to do — nudge the agent to finish next turn.
      messages.push({
        role: 'user',
        content:
          'You produced no tool_calls and no final. Either call a tool or return a final answer now.',
      })
      continue
    }

    const ctx: ToolContext = {
      blackboard: state.blackboard,
      allow: name => allowedTools.has(name),
      spawn: async (role, subTask) => {
        if (depth + 1 > state.caps.maxDepth) {
          return `[spawn refused: max depth ${state.caps.maxDepth} reached]`
        }
        if (state.agentCount >= state.caps.maxAgents) {
          return `[spawn refused: max agents ${state.caps.maxAgents} reached]`
        }
        let subDef: AgentDefinition
        try {
          subDef = getAgent(role)
        } catch (err) {
          return `[spawn refused: ${(err as Error).message}]`
        }
        return runAgent(state, subDef, subTask, depth + 1, agentId)
      },
      finish: (output: string) => {
        finalOutput = output
      },
    }

    const toolResults: string[] = []
    for (const call of calls) {
      const res = await executeTool(call as ToolCall, ctx)
      state.trace.push({
        type: 'tool_call',
        agentId,
        turn,
        tool: call.name,
        args: call.args,
        result: res.output,
        ok: res.ok,
      })
      toolResults.push(`Tool "${call.name}" -> ${res.output}`)
      if (call.name === 'finish') break
    }

    if (finalOutput !== null) break

    messages.push({
      role: 'user',
      content: `Tool results:\n${toolResults.join('\n')}\n\nContinue.`,
    })
  }

  if (finalOutput === null) {
    finalOutput = '[turn cap reached without finish]'
    finishReason = 'turn_cap'
  }

  state.trace.push({ type: 'agent_finish', agentId, output: finalOutput, reason: finishReason })
  return finalOutput
}

export async function runSwarm(task: string, opts: SwarmRunOptions = {}): Promise<SwarmRunResult> {
  const caps = readCaps(opts)
  const state: RunState = {
    caps,
    startedAt: Date.now(),
    agentCount: 0,
    totalInput: 0,
    totalOutput: 0,
    trace: [],
    blackboard: new Map(),
    budgetExceeded: false,
  }

  if (opts.context) {
    state.blackboard.set('document', opts.context)
  }

  const lessonsBlock =
    opts.priorLessons && opts.priorLessons.length > 0
      ? `\n\nLessons from prior runs in this session (apply them):\n- ${opts.priorLessons
          .slice(-5)
          .join('\n- ')}`
      : ''

  const coordinatorTask = `${task}${
    opts.context ? `\n\nDocument context is on the blackboard under key "document".` : ''
  }${lessonsBlock}`

  const coordinator = getAgent('Coordinator')
  let result: string
  try {
    result = await runAgent(state, coordinator, coordinatorTask, 0)
  } catch (err) {
    result = `Swarm failed: ${(err as Error).message}`
    state.trace.push({ type: 'system_warning', message: result })
  }

  // Try to extract a Critic "LESSON:" line from the trace, if any.
  let lesson: string | undefined
  for (const ev of state.trace) {
    if (ev.type === 'agent_finish' && /Critic#/.test(ev.agentId)) {
      const m = ev.output.match(/LESSON:\s*(.+)/)
      if (m) lesson = m[1].trim()
    }
  }

  return {
    result,
    trace: state.trace,
    usage: {
      totalInputTokens: state.totalInput,
      totalOutputTokens: state.totalOutput,
      agents: state.agentCount,
      wallMs: Date.now() - state.startedAt,
    },
    lesson,
  }
}
