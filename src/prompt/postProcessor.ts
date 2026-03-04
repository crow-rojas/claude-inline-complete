export function postProcess(raw: string, multiLine: boolean): string {
  let text = raw;

  // Strip XML tags
  text = text.replace(/<\/?COMPLETION>/g, '');

  if (!multiLine) {
    // Single-line: truncate at first newline
    const newlineIdx = text.indexOf('\n');
    if (newlineIdx !== -1) {
      text = text.substring(0, newlineIdx);
    }
  } else {
    // Multi-line: indentation-based truncation
    text = truncateByIndentation(text);
  }

  // Strip trailing whitespace
  text = text.replace(/\s+$/, '');

  // Reject empty results
  if (text.length === 0) {
    return '';
  }

  return text;
}

function truncateByIndentation(text: string): string {
  const lines = text.split('\n');
  if (lines.length === 0) return '';

  // Determine base indentation from the first non-empty line
  let baseIndent = 0;
  for (const line of lines) {
    if (line.trim().length > 0) {
      baseIndent = getIndentLevel(line);
      break;
    }
  }

  const result: string[] = [];
  let foundContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      // Keep empty lines within content
      if (foundContent) {
        result.push(line);
      }
      continue;
    }

    foundContent = true;
    const indent = getIndentLevel(line);

    // If we've dropped below base indent level, stop.
    // At base indent: include closing braces/brackets then stop,
    // otherwise keep going (same-level statements are part of the completion).
    if (result.length > 0 && indent < baseIndent) {
      // Include closing characters below base indent
      if (/^[\s]*[}\])]/.test(line)) {
        result.push(line);
      }
      break;
    }

    result.push(line);
  }

  return result.join('\n');
}

function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}
