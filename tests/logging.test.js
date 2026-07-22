import test from 'node:test';
import assert from 'node:assert/strict';
import { performAction } from '../js/engine/actions.js';
import { makeState } from './helpers.js';

test('每个结构化动作同时产生动作日志和可回溯状态快照', () => {
  const state = makeState();
  const next = performAction(state, {
    type: 'TAKE_DIFFERENT_GEMS', gems: ['white', 'blue', 'green'],
  });

  assert.equal(state.actionLog.length, 0, '规则引擎不应修改传入状态');
  assert.equal(next.actionLog.length, 1);
  assert.equal(next.actionLog[0].action.type, 'TAKE_DIFFERENT_GEMS');
  assert.ok(next.actionLog[0].events.some((event) => event.type === 'GEMS_TAKEN'));
  assert.equal(next.snapshots.length, 2);
  assert.equal(next.snapshots[1].reason, 'TAKE_DIFFERENT_GEMS');
});
