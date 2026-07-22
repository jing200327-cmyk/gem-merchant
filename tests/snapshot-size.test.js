import test from 'node:test';
import assert from 'node:assert/strict';
import { performAction } from '../js/engine/actions.js';
import { makeState } from './helpers.js';

test('状态快照不递归复制日志或其他快照', () => {
  const state = makeState();
  const next = performAction(state, {
    type: 'TAKE_DIFFERENT_GEMS', gems: ['white', 'blue', 'green'],
  });
  const latest = next.snapshots.at(-1).state;

  assert.deepEqual(latest.actionLog, []);
  assert.deepEqual(latest.snapshots, []);
});
