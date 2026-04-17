// Client-side wrapper that proxies all AI calls through the Express server.
// This keeps GEMINI_API_KEY server-side only and out of the browser bundle.

async function callAI(action: string, params: Record<string, unknown>): Promise<string> {
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

  const data = await response.json();
  return data.result as string;
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
