import { GoogleGenAI } from '@google/genai'
import type { GenerateRequest, GenerateResponse } from './index.js'

let cached: GoogleGenAI | null = null
function client() {
  if (cached) return cached
  cached = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })
  return cached
}

export async function generateGemini(req: GenerateRequest): Promise<GenerateResponse> {
  const ai = client()

  // Gemini does not use the standard {role:'system'} message; we pass the
  // system prompt via systemInstruction. We map our messages into Gemini's
  // contents format. 'assistant' becomes 'model'.
  const contents = req.messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const response = await ai.models.generateContent({
    model: req.model,
    contents,
    config: {
      systemInstruction: req.system,
      ...(req.jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  })

  const text = response.text ?? ''
  // Gemini response usage shape is { promptTokenCount, candidatesTokenCount }.
  const u = (response as unknown as { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }).usageMetadata
  return {
    text,
    usage: {
      inputTokens: u?.promptTokenCount ?? estimateTokens(req.system + req.messages.map(m => m.content).join('\n')),
      outputTokens: u?.candidatesTokenCount ?? estimateTokens(text),
    },
  }
}

function estimateTokens(s: string): number {
  // Rough fallback when the API doesn't report usage.
  return Math.ceil(s.length / 4)
}
