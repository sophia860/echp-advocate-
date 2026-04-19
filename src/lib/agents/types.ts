// Shared types for the multi-agent orchestration layer.
//
// Design note: the agent loop is provider-agnostic. Each agent is asked to
// reply with a single JSON object describing either tool calls to execute or
// a final answer. This avoids coupling to a specific vendor function-calling
// schema and lets the same agent definition run on Gemini or OpenAI.

export type ProviderName = 'gemini' | 'openai'

export interface AgentDefinition {
  /** Stable identifier used in traces and the registry. */
  id: string
  /** Human-readable role (e.g. "Coordinator", "LegalCiter"). */
  role: string
  /** System prompt for this agent. */
  systemPrompt: string
  /** Names of tools (from src/lib/agents/tools.ts) this agent may call. */
  tools: string[]
  /** Provider to use for this agent. Falls back to Gemini if OpenAI key is missing. */
  provider: ProviderName
  /** Provider-specific model identifier. */
  model: string
}

export interface ToolCall {
  name: string
  args: Record<string, unknown>
}

export interface AgentReply {
  /** Free-form private reasoning the agent wants to record. */
  thought?: string
  /** Tools the agent wants the orchestrator to execute. */
  tool_calls?: ToolCall[]
  /** Final answer for this agent. When set, the agent's loop terminates. */
  final?: string
}

export interface UsageRecord {
  inputTokens: number
  outputTokens: number
}

export type TraceEvent =
  | { type: 'agent_start'; agentId: string; role: string; depth: number; task: string; parent?: string }
  | { type: 'agent_message'; agentId: string; turn: number; reply: AgentReply; usage: UsageRecord }
  | { type: 'tool_call'; agentId: string; turn: number; tool: string; args: Record<string, unknown>; result: string; ok: boolean }
  | { type: 'agent_finish'; agentId: string; output: string; reason: 'final' | 'turn_cap' | 'budget' | 'error' }
  | { type: 'system_warning'; message: string }

export interface SwarmRunResult {
  result: string
  trace: TraceEvent[]
  usage: {
    totalInputTokens: number
    totalOutputTokens: number
    agents: number
    wallMs: number
  }
  /** A short "lesson" the Critic produced for the next run, if any. */
  lesson?: string
}

export interface SwarmRunOptions {
  /** Caller-supplied lessons from prior runs in the same browser session. */
  priorLessons?: string[]
  /** Document content (or other context) to include in the coordinator's task. */
  context?: string
  /** Override caps (server still applies its own ceilings). */
  maxAgents?: number
  maxDepth?: number
}
