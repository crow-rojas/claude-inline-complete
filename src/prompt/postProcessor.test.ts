import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { postProcess } from './postProcessor';

describe('postProcessor', () => {
  describe('XML tag stripping', () => {
    it('strips <COMPLETION> tags', () => {
      assert.equal(postProcess('<COMPLETION>foo</COMPLETION>', false), 'foo');
    });

    it('handles text without tags', () => {
      assert.equal(postProcess('foo', false), 'foo');
    });
  });

  describe('single-line mode', () => {
    it('truncates at first newline', () => {
      assert.equal(postProcess('line1\nline2\nline3', false), 'line1');
    });

    it('returns full text if no newline', () => {
      assert.equal(postProcess('single line', false), 'single line');
    });

    it('strips trailing whitespace', () => {
      assert.equal(postProcess('code   ', false), 'code');
    });

    it('returns empty for whitespace-only', () => {
      assert.equal(postProcess('   ', false), '');
    });
  });

  describe('multi-line mode', () => {
    it('keeps multi-line content', () => {
      const input = '  const a = 1;\n  const b = 2;';
      const result = postProcess(input, true);
      assert.ok(result.includes('const a = 1;'));
      assert.ok(result.includes('const b = 2;'));
    });

    it('stops at base indent level (includes closing brace)', () => {
      const input = '  const a = 1;\n  return a;\n}';
      const result = postProcess(input, true);
      assert.ok(result.includes('const a = 1;'));
      assert.ok(result.includes('return a;'));
      assert.ok(result.includes('}'));
    });

    it('strips trailing whitespace', () => {
      const input = '  code here   \n';
      const result = postProcess(input, true);
      assert.ok(!result.endsWith(' '));
      assert.ok(!result.endsWith('\n'));
    });

    it('returns empty for empty input', () => {
      assert.equal(postProcess('', true), '');
    });
  });
});
