import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Debouncer } from './debouncer';

describe('Debouncer', () => {
  let debouncer: Debouncer;

  afterEach(() => {
    debouncer?.dispose();
  });

  it('resolves after delay', async () => {
    debouncer = new Debouncer();
    const start = Date.now();
    await debouncer.debounce(50);
    const elapsed = Date.now() - start;
    assert.ok(elapsed >= 45, `Expected >= 45ms, got ${elapsed}ms`);
  });

  it('returns incrementing request IDs', async () => {
    debouncer = new Debouncer();
    const id1 = await debouncer.debounce(10);
    const id2 = await debouncer.debounce(10);
    assert.ok(id2 > id1);
  });

  it('marks old IDs as stale when debounced again', async () => {
    debouncer = new Debouncer();
    // Start a debounce but don't await it yet
    const promise1 = debouncer.debounce(100);
    // Immediately start another - this cancels the first timer
    const promise2 = debouncer.debounce(10);

    const id2 = await promise2;
    assert.ok(!debouncer.isStale(id2));

    // id from promise1 would have been 1, but it was cancelled
    assert.ok(debouncer.isStale(1));
  });
});
