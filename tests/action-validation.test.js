import test from 'node:test';
import assert from 'node:assert/strict';
import { performAction } from '../js/engine/actions.js';
import { makeState } from './helpers.js';

test('归还动作拒绝用未知字段伪造归还数量', () => {
  const state = makeState();
  Object.assign(state.players[0].gems, {
    white: 2, blue: 2, green: 2, red: 2, black: 1,
  });
  const returning = performAction(state, {
    type: 'TAKE_DIFFERENT_GEMS', gems: ['white', 'blue', 'green'],
  });

  assert.throws(() => performAction(returning, {
    type: 'RETURN_GEMS', gems: { white: 1, imaginary: 1 },
  }), /未知宝石/);
});
