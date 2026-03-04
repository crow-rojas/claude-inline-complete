import * as vscode from 'vscode';
import { detectAuth } from './auth/authDetector';
import { createCompletionBackend } from './api/completionClient';
import { ClaudeCompletionProvider } from './completion/completionProvider';
import { StatusBarManager } from './statusBar/statusBarManager';
import { getConfig } from './config';

let provider: ClaudeCompletionProvider | undefined;
let statusBar: StatusBarManager | undefined;

export async function activate(context: vscode.ExtensionContext) {
  console.log('[claude-inline] Activating extension...');

  // Status bar
  statusBar = new StatusBarManager();
  context.subscriptions.push(statusBar);

  // Detect auth
  const auth = await detectAuth();
  statusBar.setAuth(auth);

  if (auth.type === 'none') {
    console.log('[claude-inline] No auth configured. Extension idle.');
    vscode.window.showWarningMessage(
      'Claude Inline: No authentication found. Set ANTHROPIC_API_KEY or run "claude login".'
    );
  }

  // Create backend
  const config = getConfig();
  const backend = createCompletionBackend(auth, config.cliTimeoutMs);

  if (backend) {
    context.subscriptions.push({ dispose: () => backend.dispose() });

    // Create provider
    provider = new ClaudeCompletionProvider(backend, statusBar);
    context.subscriptions.push(provider);

    // Register inline completion provider for all file types
    const registration = vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**' },
      provider
    );
    context.subscriptions.push(registration);

    statusBar.setEnabled(config.enabled);
  }

  // Toggle command
  const toggleCmd = vscode.commands.registerCommand(
    'claude-inline.toggle',
    () => {
      const cfg = vscode.workspace.getConfiguration('claude-inline');
      const current = cfg.get<boolean>('enabled', true);
      cfg.update('enabled', !current, vscode.ConfigurationTarget.Global);
    }
  );
  context.subscriptions.push(toggleCmd);

  // Watch config changes
  const configWatcher = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('claude-inline.enabled')) {
      const enabled = getConfig().enabled;
      statusBar?.setEnabled(enabled);
    }
  });
  context.subscriptions.push(configWatcher);

  console.log('[claude-inline] Extension activated.');
}

export function deactivate() {
  console.log('[claude-inline] Extension deactivated.');
}
