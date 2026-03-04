export function isMultiLineContext(
  linePrefix: string,
  suffix: string,
  languageId: string
): boolean {
  const trimmed = linePrefix.trimEnd();

  // Opening block characters
  if (trimmed.endsWith('{') || trimmed.endsWith('(') || trimmed.endsWith('[')) {
    return true;
  }

  // Arrow function
  if (trimmed.endsWith('=>')) {
    return true;
  }

  // Python/Ruby colon at end of line
  if (
    (languageId === 'python' || languageId === 'ruby') &&
    trimmed.endsWith(':')
  ) {
    return true;
  }

  // Block keywords with empty/whitespace-only suffix on the line
  const suffixFirstLine = suffix.split('\n')[0]?.trim() ?? '';
  const blockKeywords = /\b(function|def|class|if|else|for|while|switch|case|do|try|catch)\b/;

  if (blockKeywords.test(trimmed) && suffixFirstLine === '') {
    return true;
  }

  // Empty line inside an indented block (line is all whitespace and has indentation)
  if (linePrefix.length > 0 && linePrefix.trim() === '' && linePrefix.length >= 2) {
    return true;
  }

  return false;
}
