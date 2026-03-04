import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getSystemPrompt, buildUserPrompt } from './promptBuilder';

describe('promptBuilder', () => {
  describe('getSystemPrompt', () => {
    it('returns a non-empty string with HOLE FILLER instructions', () => {
      const prompt = getSystemPrompt();
      assert.ok(prompt.length > 0);
      assert.ok(prompt.includes('HOLE FILLER'));
      assert.ok(prompt.includes('{{FILL_HERE}}'));
      assert.ok(prompt.includes('<COMPLETION>'));
    });

    it('includes few-shot examples', () => {
      const prompt = getSystemPrompt();
      assert.ok(prompt.includes('Example 1'));
      assert.ok(prompt.includes('Example 4'));
    });
  });

  describe('buildUserPrompt', () => {
    it('wraps prefix and suffix around {{FILL_HERE}}', () => {
      const result = buildUserPrompt('const x = ', ';');
      assert.ok(result.includes('const x = {{FILL_HERE}};'));
    });

    it('includes QUERY tags', () => {
      const result = buildUserPrompt('a', 'b');
      assert.ok(result.includes('<QUERY>'));
      assert.ok(result.includes('</QUERY>'));
    });

    it('ends with <COMPLETION> for assistant prefill', () => {
      const result = buildUserPrompt('a', 'b');
      assert.ok(result.trimEnd().endsWith('<COMPLETION>'));
    });

    it('handles empty suffix', () => {
      const result = buildUserPrompt('function foo() {', '');
      assert.ok(result.includes('function foo() {{{FILL_HERE}}'));
    });
  });
});
