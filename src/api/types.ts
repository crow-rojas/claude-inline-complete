export interface CompletionRequest {
  prompt: string;
  systemPrompt: string;
  model: string;
  maxTokens: number;
  stopSequences: string[];
  signal?: AbortSignal;
}

export interface CompletionResponse {
  text: string;
}

export interface ICompletionBackend {
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  dispose(): void;
}
