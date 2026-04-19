// Client-side wrapper that proxies all AI calls through the Express server.
// This keeps GEMINI_API_KEY server-side only and out of the browser bundle.

async function postAI(action: string, params: Record<string, unknown>): Promise<unknown> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...params }),
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      if (body?.error) detail = body.error;
    } catch {
      // ignore JSON parse failure; use statusText
    }
    throw new Error(`AI request failed (${response.status}): ${detail}`);
  }

  return response.json();
}

async function callAI(action: string, params: Record<string, unknown>): Promise<string> {
  const data = (await postAI(action, params)) as { result?: string };
  return (data.result ?? "") as string;
}

export async function askNavigator(
  prompt: string,
  history: { role: string; parts: { text: string }[] }[] = []
): Promise<string> {
  try {
    return await callAI("askNavigator", { prompt, history });
  } catch (error) {
    console.error("AI Error:", error);
    return "I'm sorry, I'm having trouble connecting right now. Please try again.";
  }
}

export async function analyzeDocument(docContent: string, docType: string): Promise<string> {
  try {
    return await callAI("analyzeDocument", { docContent, docType });
  } catch (error) {
    console.error("AI Error:", error);
    return "Error analyzing document.";
  }
}

export async function scanProvision(docContent: string): Promise<string> {
  try {
    return await callAI("scanProvision", { docContent });
  } catch (error) {
    console.error("AI Error:", error);
    return "Error scanning provision.";
  }
}

export async function getNextSteps(appCase: unknown): Promise<string> {
  try {
    return await callAI("getNextSteps", { appCase });
  } catch (error) {
    console.error("AI Error:", error);
    return "Review your case dashboard for current deadlines.";
  }
}

// --- Swarm orchestration -----------------------------------------------------
// These types intentionally mirror src/lib/agents/types.ts but are duplicated
// here so the client bundle does not pull in server-only modules.

export interface SwarmUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
  agents: number;
  wallMs: number;
}

export interface SwarmTraceEvent {
  type: string;
  agentId?: string;
  role?: string;
  depth?: number;
  task?: string;
  parent?: string;
  turn?: number;
  reply?: { thought?: string; tool_calls?: unknown[]; final?: string };
  tool?: string;
  args?: Record<string, unknown>;
  result?: string;
  ok?: boolean;
  output?: string;
  reason?: string;
  message?: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface SwarmRunPayload {
  result: string;
  trace: SwarmTraceEvent[];
  usage: SwarmUsage;
  lesson?: string;
}

export async function runSwarm(
  task: string,
  opts: { context?: string; priorLessons?: string[] } = {}
): Promise<SwarmRunPayload> {
  const data = (await postAI("runSwarm", {
    task,
    context: opts.context,
    priorLessons: opts.priorLessons,
  })) as SwarmRunPayload;
  return data;
}
