import test from 'node:test';
import assert from 'node:assert/strict';
import { performAction } from '../js/engine/actions.js';
import { eligibleNobles } from '../js/engine/rules.js';
import { PHASES } from '../js/constants.js';
import { addBonuses, makeNoble, makeState } from './helpers.js';

function takeTurn(state) {
  return performAction(state, {
    type: 'TAKE_DIFFERENT_GEMS',
    gems: ['white', 'blue', 'green'],
  });
}

test('回合结束仅满足一个贵族时自动获得', () => {
  const state = makeState(['A', 'B'], [makeNoble('n1', { white: 3 })]);
  addBonuses(state.players[0], { white: 3 });

  const next = takeTurn(state);

  assert.deepEqual(next.players[0].nobles.map((noble) => noble.id), ['n1']);
  assert.equal(next.availableNobles.length, 0);
  assert.equal(next.phase, PHASES.TURN_TRANSITION);
});

test('同时满足多个贵族时进入选择，选择一个后另一个留在公共区', () => {
  const state = makeState(['A', 'B'], [
    makeNoble('white', { white: 3 }),
    makeNoble('blue', { blue: 3 }),
  ]);
  addBonuses(state.players[0], { white: 3, blue: 3 });

  const choosing = takeTurn(state);
  assert.equal(choosing.phase, PHASES.CHOOSING_NOBLE);
  assert.deepEqual(choosing.pending.nobleIds.sort(), ['blue', 'white']);

  const selected = performAction(choosing, { type: 'CHOOSE_NOBLE', nobleId: 'white' });
  assert.deepEqual(selected.players[0].nobles.map((noble) => noble.id), ['white']);
  assert.deepEqual(selected.availableNobles.map((noble) => noble.id), ['blue']);
  assert.equal(selected.phase, PHASES.TURN_TRANSITION);
  assert.throws(() => performAction(selected, {
    type: 'CHOOSE_NOBLE', nobleId: 'blue',
  }), /当前阶段不允许/);
});

test('宝石与黄金不计入贵族条件', () => {
  const state = makeState(['A', 'B'], [makeNoble('n1', { white: 3, blue: 3 })]);
  Object.assign(state.players[0].gems, { white: 8, blue: 8, gold: 5 });

  assert.deepEqual(eligibleNobles(state, state.players[0]), []);
});
