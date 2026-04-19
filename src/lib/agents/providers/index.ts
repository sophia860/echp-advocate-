// Provider abstraction. All agents call generate(...) regardless of vendor.

import type { ProviderName, UsageRecord } from '../types.js'
import { generateGemini } from './gemini.js'
import { generateOpenAI } from './openai.js'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GenerateRequest {
  provider: ProviderName
  model: string
  system: string
  messages: ChatMessage[]
  /** Hint to the provider that JSON output is required. */
  jsonMode?: boolean
}

export interface GenerateResponse {
  text: string
  usage: UsageRecord
}

/**
 * Resolve the actual provider to use. If OPENAI_API_KEY is missing we fall
 * back to Gemini transparently so the swarm never hard-fails on missing
 * optional credentials.
 */
function resolveProvider(provider: ProviderName): ProviderName {
  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    return 'gemini'
  }
  return provider
}

export async function generate(req: GenerateRequest): Promise<GenerateResponse> {
  const provider = resolveProvider(req.provider)
  if (provider === 'openai') {
    return generateOpenAI(req)
  }
  // For Gemini we may need to swap to a Gemini default model if caller
  // requested an OpenAI model name and we fell back.
  const model = req.provider === 'openai' && provider === 'gemini'
    ? 'gemini-2.0-flash'
    : req.model
  return generateGemini({ ...req, model, provider: 'gemini' })
}
