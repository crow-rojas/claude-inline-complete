import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isMultiLineContext } from './multiLineDetector';

describe('multiLineDetector', () => {
  describe('opening block characters', () => {
    it('detects opening brace', () => {
      assert.ok(isMultiLineContext('function foo() {', '', 'typescript'));
    });

    it('detects opening parenthesis', () => {
      assert.ok(isMultiLineContext('doSomething(', '', 'typescript'));
    });

    it('detects opening bracket', () => {
      assert.ok(isMultiLineContext('const arr = [', '', 'typescript'));
    });
  });

  describe('arrow function', () => {
    it('detects arrow function', () => {
      assert.ok(isMultiLineContext('const fn = () =>', '', 'typescript'));
    });
  });

  describe('Python/Ruby colon', () => {
    it('detects colon in Python', () => {
      assert.ok(isMultiLineContext('def foo():', '', 'python'));
    });

    it('detects colon in Ruby', () => {
      assert.ok(isMultiLineContext('class Foo:', '', 'ruby'));
    });

    it('does NOT detect colon in TypeScript', () => {
      assert.ok(!isMultiLineContext('const x:', ' number', 'typescript'));
    });
  });

  describe('block keywords', () => {
    it('detects function keyword with empty suffix', () => {
      assert.ok(isMultiLineContext('function foo()', '', 'typescript'));
    });

    it('detects class keyword with empty suffix', () => {
      assert.ok(isMultiLineContext('class MyClass', '', 'typescript'));
    });

    it('does NOT trigger when suffix has content on same line', () => {
      assert.ok(!isMultiLineContext('if (true)', ' return;', 'typescript'));
    });
  });

  describe('empty indented line', () => {
    it('detects whitespace-only line with indentation', () => {
      assert.ok(isMultiLineContext('    ', '\n}', 'typescript'));
    });

    it('does NOT trigger for single space', () => {
      assert.ok(!isMultiLineContext(' ', '', 'typescript'));
    });
  });

  describe('single-line cases', () => {
    it('returns false for simple expression', () => {
      assert.ok(!isMultiLineContext('const x = ', ';', 'typescript'));
    });

    it('returns false for method call mid-expression', () => {
      assert.ok(!isMultiLineContext('console.log(value', ')', 'typescript'));
    });
  });
});
