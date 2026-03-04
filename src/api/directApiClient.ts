import Anthropic from '@anthropic-ai/sdk';
import { ICompletionBackend, CompletionRequest, CompletionResponse } from './types';

export class DirectApiClient implements ICompletionBackend {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    try {
      const response = await this.client.messages.create(
        {
          model: request.model,
          max_tokens: request.maxTokens,
          temperature: 0,
          stop_sequences: request.stopSequences,
          system: request.systemPrompt,
          messages: [
            { role: 'user', content: request.prompt },
            { role: 'assistant', content: '<COMPLETION>' },
          ],
        },
        { signal: request.signal }
      );

      const block = response.content[0];
      if (block && block.type === 'text') {
        return { text: block.text };
      }
      return { text: '' };
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return { text: '' };
      }
      throw err;
    }
  }

  dispose(): void {
    // No cleanup needed for SDK client
  }
}
