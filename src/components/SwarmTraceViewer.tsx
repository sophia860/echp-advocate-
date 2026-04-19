import { useState } from 'react'
import { ChevronDown, ChevronRight, Bot, Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { SwarmTraceEvent, SwarmUsage } from '../lib/ai-client'

interface Props {
  trace: SwarmTraceEvent[]
  usage: SwarmUsage
  lesson?: string
}

/**
 * Dev-only viewer for the swarm trace. Renders a collapsible tree showing
 * every agent, message, tool call and budget warning so we can inspect how
 * the swarm "worked together" on a request.
 *
 * Only mounted when `?debug=swarm` is in the URL (see lib/swarm-session.ts).
 */
export default function SwarmTraceViewer({ trace, usage, lesson }: Props) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-xs">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-center justify-between font-mono text-[11px] font-semibold text-amber-900"
      >
        <span className="flex items-center gap-1">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          SWARM TRACE — {usage.agents} agent{usage.agents === 1 ? '' : 's'}, {' '}
          {usage.totalInputTokens + usage.totalOutputTokens} tokens, {' '}
          {usage.wallMs}ms
        </span>
        {lesson && <span className="text-amber-700">lesson captured</span>}
      </button>

      {expanded && (
        <div className="mt-3 space-y-1 font-mono">
          {trace.map((ev, i) => (
            <TraceLine key={i} ev={ev} />
          ))}
          {lesson && (
            <div className="mt-2 rounded bg-amber-100 p-2 text-amber-900">
              <span className="font-semibold">Lesson for next run:</span> {lesson}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TraceLine({ ev }: { ev: SwarmTraceEvent }) {
  const indent = (ev.depth ?? 0) * 12

  switch (ev.type) {
    case 'agent_start':
      return (
        <div style={{ paddingLeft: indent }} className="flex items-start gap-1 text-blue-800">
          <Bot size={12} className="mt-0.5" />
          <span>
            <strong>{ev.agentId}</strong> started{ev.parent ? ` (spawned by ${ev.parent})` : ''}
            {ev.task && <span className="ml-1 text-slate-600"> — {truncate(ev.task, 120)}</span>}
          </span>
        </div>
      )
    case 'agent_message':
      return (
        <div style={{ paddingLeft: indent + 12 }} className="text-slate-700">
          <span className="text-slate-500">{ev.agentId} t{ev.turn}:</span>{' '}
          {ev.reply?.thought ? <em>{truncate(ev.reply.thought, 160)}</em> : <em className="text-slate-400">(no thought)</em>}
          {ev.usage && (
            <span className="ml-2 text-slate-400">
              [{ev.usage.inputTokens}+{ev.usage.outputTokens}t]
            </span>
          )}
        </div>
      )
    case 'tool_call':
      return (
        <div
          style={{ paddingLeft: indent + 12 }}
          className={`flex items-start gap-1 ${ev.ok ? 'text-emerald-800' : 'text-red-700'}`}
        >
          <Wrench size={12} className="mt-0.5" />
          <span>
            <strong>{ev.tool}</strong>({truncate(JSON.stringify(ev.args ?? {}), 80)}) →{' '}
            <span className="text-slate-600">{truncate(ev.result ?? '', 140)}</span>
          </span>
        </div>
      )
    case 'agent_finish':
      return (
        <div style={{ paddingLeft: indent }} className="flex items-start gap-1 text-emerald-700">
          <CheckCircle2 size={12} className="mt-0.5" />
          <span>
            <strong>{ev.agentId}</strong> finished ({ev.reason}) — {truncate(ev.output ?? '', 140)}
          </span>
        </div>
      )
    case 'system_warning':
      return (
        <div className="flex items-start gap-1 text-amber-800">
          <AlertTriangle size={12} className="mt-0.5" />
          <span>{ev.message}</span>
        </div>
      )
    default:
      return null
  }
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1) + '…'
}
