import * as vscode from 'vscode';
import { ICompletionBackend } from '../api/types';
import { getConfig } from '../config';
import { gatherContext } from '../prompt/contextGatherer';
import { isMultiLineContext } from '../prompt/multiLineDetector';
import { getSystemPrompt, buildUserPrompt } from '../prompt/promptBuilder';
import { postProcess } from '../prompt/postProcessor';
import { CompletionCache } from './cache';
import { Debouncer } from './debouncer';
import { StatusBarManager } from '../statusBar/statusBarManager';

export class ClaudeCompletionProvider implements vscode.InlineCompletionItemProvider {
  private backend: ICompletionBackend;
  private cache = new CompletionCache();
  private debouncer = new Debouncer();
  private activeController: AbortController | null = null;
  private statusBar: StatusBarManager;

  constructor(backend: ICompletionBackend, statusBar: StatusBarManager) {
    this.backend = backend;
    this.statusBar = statusBar;
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionList | undefined> {
    try {
      return await this.doProvide(document, position, context, token);
    } catch (err) {
      console.error('[claude-inline] Error providing completions:', err);
      return undefined;
    }
  }

  private async doProvide(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionList | undefined> {
    const config = getConfig();

    // Guard: disabled
    if (!config.enabled) return undefined;

    // Guard: line too short
    const lineText = document.lineAt(position.line).text;
    const linePrefix = lineText.substring(0, position.character);
    if (linePrefix.trim().length < 2) return undefined;

    // Cache check
    const prevLineText =
      position.line > 0 ? document.lineAt(position.line - 1).text : '';
    const cacheKey = CompletionCache.makeKey(
      document.uri.toString(),
      position.line,
      position.character,
      lineText,
      prevLineText
    );

    const cached = this.cache.get(cacheKey);
    if (cached) {
      return new vscode.InlineCompletionList([
        new vscode.InlineCompletionItem(cached),
      ]);
    }

    // Debounce for automatic triggers only
    const isExplicit =
      context.triggerKind === vscode.InlineCompletionTriggerKind.Invoke;
    if (!isExplicit) {
      const requestId = await this.debouncer.debounce(config.debounceMs);
      if (this.debouncer.isStale(requestId) || token.isCancellationRequested) {
        return undefined;
      }
    }

    // Cancel any previous in-flight request
    if (this.activeController) {
      this.activeController.abort();
    }
    const controller = new AbortController();
    this.activeController = controller;

    // Bridge CancellationToken to AbortSignal
    const cancelDisposable = token.onCancellationRequested(() => {
      controller.abort();
    });

    try {
      this.statusBar.setLoading(true);

      // Gather context
      const codeContext = gatherContext(
        document,
        position,
        config.prefixLines,
        config.suffixLines
      );

      // Detect multi-line
      const multiLine = isMultiLineContext(
        codeContext.linePrefix,
        codeContext.suffix,
        codeContext.languageId
      );

      // Build prompt
      const systemPrompt = getSystemPrompt();
      const userPrompt = buildUserPrompt(codeContext.prefix, codeContext.suffix);

      // Determine stop sequences
      const stopSequences = ['</COMPLETION>'];
      if (!multiLine) {
        stopSequences.push('\n');
      }

      // Call backend
      const response = await this.backend.complete({
        prompt: userPrompt,
        systemPrompt,
        model: config.model,
        maxTokens: multiLine
          ? config.maxTokensMultiLine
          : config.maxTokensSingleLine,
        stopSequences,
        signal: controller.signal,
      });

      // Check if cancelled during request
      if (controller.signal.aborted || token.isCancellationRequested) {
        return undefined;
      }

      // Post-process
      const completion = postProcess(response.text, multiLine);
      if (!completion) return undefined;

      // Cache the result
      this.cache.set(cacheKey, completion);

      return new vscode.InlineCompletionList([
        new vscode.InlineCompletionItem(completion),
      ]);
    } finally {
      cancelDisposable.dispose();
      if (this.activeController === controller) {
        this.activeController = null;
      }
      this.statusBar.setLoading(false);
    }
  }

  setBackend(backend: ICompletionBackend): void {
    this.backend = backend;
    this.cache.clear();
  }

  dispose(): void {
    this.debouncer.dispose();
    if (this.activeController) {
      this.activeController.abort();
    }
    this.cache.clear();
  }
}
