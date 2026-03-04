import * as vscode from 'vscode';
import { AuthResult } from '../auth/authDetector';

export class StatusBarManager {
  private item: vscode.StatusBarItem;
  private loading = false;
  private authType: AuthResult['type'] = 'none';
  private enabled = true;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.item.command = 'claude-inline.toggle';
    this.update();
    this.item.show();
  }

  setAuth(auth: AuthResult): void {
    this.authType = auth.type;
    this.update();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.update();
  }

  setLoading(loading: boolean): void {
    this.loading = loading;
    this.update();
  }

  private update(): void {
    if (this.authType === 'none') {
      this.item.text = '$(warning) Claude: No Auth';
      this.item.tooltip = 'No authentication configured. Set ANTHROPIC_API_KEY or run "claude login".';
      return;
    }

    if (!this.enabled) {
      this.item.text = '$(circle-slash) Claude: Off';
      this.item.tooltip = 'Click to enable Claude inline completions';
      return;
    }

    if (this.loading) {
      this.item.text = '$(sync~spin) Claude';
      this.item.tooltip = 'Claude is generating a completion...';
      return;
    }

    const mode = this.authType === 'api_key' ? 'API' : 'CLI';
    this.item.text = `$(sparkle) Claude (${mode})`;
    this.item.tooltip = `Claude inline completions enabled (${mode} mode). Click to toggle.`;
  }

  dispose(): void {
    this.item.dispose();
  }
}
