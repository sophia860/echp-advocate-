import OpenAI from 'openai'
import type { GenerateRequest, GenerateResponse } from './index.js'

let cached: OpenAI | null = null
function client() {
  if (cached) return cached
  cached = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })
  return cached
}

export async function generateOpenAI(req: GenerateRequest): Promise<GenerateResponse> {
  const openai = client()

  const messages = [
    { role: 'system' as const, content: req.system },
    ...req.messages.map(m => ({ role: m.role, content: m.content })),
  ]

  const response = await openai.chat.completions.create({
    model: req.model,
    messages,
    ...(req.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
  })

  const text = response.choices[0]?.message?.content ?? ''
  const u = response.usage
  return {
    text,
    usage: {
      inputTokens: u?.prompt_tokens ?? 0,
      outputTokens: u?.completion_tokens ?? 0,
    },
  }
}
