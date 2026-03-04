import * as vscode from 'vscode';

export interface CodeContext {
  prefix: string;
  suffix: string;
  linePrefix: string;
  languageId: string;
  filePath: string;
}

export function gatherContext(
  document: vscode.TextDocument,
  position: vscode.Position,
  prefixLines: number,
  suffixLines: number
): CodeContext {
  const startLine = Math.max(0, position.line - prefixLines);
  const endLine = Math.min(document.lineCount - 1, position.line + suffixLines);

  // Prefix: from startLine to cursor position
  const prefixRange = new vscode.Range(startLine, 0, position.line, position.character);
  const prefix = document.getText(prefixRange);

  // Suffix: from cursor position to endLine
  const suffixRange = new vscode.Range(
    position.line,
    position.character,
    endLine,
    document.lineAt(endLine).text.length
  );
  const suffix = document.getText(suffixRange);

  // The text on the current line before the cursor
  const linePrefix = document.lineAt(position.line).text.substring(0, position.character);

  return {
    prefix,
    suffix,
    linePrefix,
    languageId: document.languageId,
    filePath: document.uri.fsPath,
  };
}
