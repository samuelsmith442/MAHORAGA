import { createError, ErrorCode } from "../../lib/errors";
import type { CompletionParams, CompletionResult, LLMProvider } from "../types";

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? "gpt-4o-mini";
    this.baseUrl = (config.baseUrl ?? "https://api.openai.com/v1").trim().replace(/\/+$/, "");
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const body: Record<string, unknown> = {
      model: params.model ?? this.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.max_tokens ?? 1024,
    };

    if (params.response_format) {
      body.response_format = params.response_format;
    }

    const MAX_RETRIES = 3;
    const RETRY_DELAYS_MS = [8_000, 15_000, 30_000];

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429 && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS_MS[attempt] ?? 30_000;
        console.warn(`Rate limited (429), retrying in ${delay / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw createError(ErrorCode.PROVIDER_ERROR, `OpenAI API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as OpenAIResponse;
      const content = data.choices[0]?.message?.content ?? "";

      return {
        content,
        usage: {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
        },
      };
    }

    throw createError(ErrorCode.PROVIDER_ERROR, "Rate limited after max retries");
  }
}

export function createOpenAIProvider(config: OpenAIConfig): OpenAIProvider {
  return new OpenAIProvider(config);
}
