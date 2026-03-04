import * as vscode from 'vscode';

export interface ExtensionConfig {
  enabled: boolean;
  debounceMs: number;
  model: string;
  maxTokensSingleLine: number;
  maxTokensMultiLine: number;
  cliPath: string;
  cliTimeoutMs: number;
  prefixLines: number;
  suffixLines: number;
}

export function getConfig(): ExtensionConfig {
  const cfg = vscode.workspace.getConfiguration('claude-inline');
  return {
    enabled: cfg.get<boolean>('enabled', true),
    debounceMs: cfg.get<number>('debounceMs', 350),
    model: cfg.get<string>('model', 'claude-haiku-4-5-latest'),
    maxTokensSingleLine: cfg.get<number>('maxTokensSingleLine', 64),
    maxTokensMultiLine: cfg.get<number>('maxTokensMultiLine', 128),
    cliPath: cfg.get<string>('cliPath', 'claude'),
    cliTimeoutMs: cfg.get<number>('cliTimeoutMs', 8000),
    prefixLines: cfg.get<number>('prefixLines', 100),
    suffixLines: cfg.get<number>('suffixLines', 30),
  };
}
