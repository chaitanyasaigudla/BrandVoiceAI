import { ChatGroq } from '@langchain/groq';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { logger } from '../lib/logger';

export interface LlmCompletion {
  text: string;
  tokensUsed: number;
  provider: 'GROQ' | 'GEMINI';
  model: string;
}

function usableKey(value: string | undefined): string {
  const key = (value || '').trim();
  if (!key || key.startsWith('your-')) return '';
  return key;
}

function messageText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) return String((part as { text: unknown }).text ?? '');
        return '';
      })
      .join('');
  }
  return content ? JSON.stringify(content) : '';
}

/**
 * Groq is the primary chat model. Gemini is attached with LangChain's fallback chain.
 */
export class LangChainService {
  async complete(systemPrompt: string, userPrompt: string, temperature = 0.4): Promise<LlmCompletion> {
    const groqKey = usableKey(process.env.GROQ_API_KEY);
    const geminiKey = usableKey(process.env.GOOGLE_AI_API_KEY);
    const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    const groq = groqKey
      ? new ChatGroq({ apiKey: groqKey, model: groqModel, temperature, maxTokens: 1500 })
      : null;
    const gemini = geminiKey
      ? new ChatGoogleGenerativeAI({
          apiKey: geminiKey,
          model: geminiModel,
          temperature,
          maxOutputTokens: 1500,
        })
      : null;

    if (!groq && !gemini) {
      throw new Error('No AI provider API key configured (GROQ_API_KEY or GOOGLE_AI_API_KEY)');
    }

    if (groq && gemini) {
      const chain = groq.withFallbacks({ fallbacks: [gemini as unknown as BaseChatModel] });
      try {
        logger.info(`LangChain fallback chain: Groq (${groqModel}) -> Gemini (${geminiModel})`);
        return await this.invoke(chain as any, 'GROQ', groqModel, systemPrompt, userPrompt);
      } catch (error: any) {
        logger.error('LangChain Groq+Gemini chain failed', { error: error.message });
        throw new Error(`AI generation failed: ${error.message}`);
      }
    }

    const only = (groq || gemini) as BaseChatModel;
    const provider = groq ? 'GROQ' : 'GEMINI';
    const model = groq ? groqModel : geminiModel;
    logger.info(`LangChain single provider: ${provider} (${model})`);
    return this.invoke(only, provider, model, systemPrompt, userPrompt);
  }

  private async invoke(
    model: BaseChatModel,
    provider: 'GROQ' | 'GEMINI',
    modelName: string,
    systemPrompt: string,
    userPrompt: string
  ): Promise<LlmCompletion> {
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);
    const reportedModel = String(
      response.response_metadata?.model_name ||
        response.response_metadata?.model ||
        modelName
    );
    const resolvedProvider = reportedModel.toLowerCase().includes('gemini') ? 'GEMINI' : provider;
    return {
      text: messageText(response.content),
      tokensUsed: response.usage_metadata?.total_tokens || 0,
      provider: resolvedProvider,
      model: reportedModel,
    };
  }
}

export const langchainService = new LangChainService();
