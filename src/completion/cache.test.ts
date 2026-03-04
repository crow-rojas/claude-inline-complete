import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CompletionCache } from './cache';

describe('CompletionCache', () => {
  it('stores and retrieves values', () => {
    const cache = new CompletionCache();
    cache.set('key1', 'value1');
    assert.equal(cache.get('key1'), 'value1');
  });

  it('returns undefined for missing keys', () => {
    const cache = new CompletionCache();
    assert.equal(cache.get('missing'), undefined);
  });

  it('evicts entries beyond max size', () => {
    const cache = new CompletionCache(2);
    cache.set('a', '1');
    cache.set('b', '2');
    cache.set('c', '3'); // should evict 'a'
    assert.equal(cache.get('a'), undefined);
    assert.equal(cache.get('b'), '2');
    assert.equal(cache.get('c'), '3');
  });

  it('expires entries after TTL', async () => {
    const cache = new CompletionCache(100, 50); // 50ms TTL
    cache.set('key', 'value');
    assert.equal(cache.get('key'), 'value');

    await new Promise((r) => setTimeout(r, 60));
    assert.equal(cache.get('key'), undefined);
  });

  it('clears all entries', () => {
    const cache = new CompletionCache();
    cache.set('a', '1');
    cache.set('b', '2');
    cache.clear();
    assert.equal(cache.get('a'), undefined);
    assert.equal(cache.get('b'), undefined);
  });

  describe('makeKey', () => {
    it('creates a deterministic key', () => {
      const key1 = CompletionCache.makeKey('file.ts', 10, 5, 'const x =', 'import y');
      const key2 = CompletionCache.makeKey('file.ts', 10, 5, 'const x =', 'import y');
      assert.equal(key1, key2);
    });

    it('produces different keys for different inputs', () => {
      const key1 = CompletionCache.makeKey('file.ts', 10, 5, 'a', 'b');
      const key2 = CompletionCache.makeKey('file.ts', 10, 6, 'a', 'b');
      assert.notEqual(key1, key2);
    });
  });
});
