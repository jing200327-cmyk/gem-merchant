import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTION_TYPES, PHASES } from '../js/constants.js';
import { performAction } from '../js/engine/actions.js';
import { getLegalActions } from '../js/engine/rules.js';
import { addBonuses, makeNoble, makeState } from './helpers.js';

test('getLegalActions 在归还阶段枚举精确归还数量', () => {
  const state = makeState();
  Object.assign(state.players[0].gems, { white: 2, blue: 2, green: 2, red: 2, black: 1 });
  const returning = performAction(state, {
    type: ACTION_TYPES.TAKE_DIFFERENT_GEMS,
    gems: ['white', 'blue', 'green'],
  });

  const legal = getLegalActions(returning, returning.players[0].id);
  assert.ok(legal.length > 0);
  assert.ok(legal.every((action) => action.type === ACTION_TYPES.RETURN_GEMS));
  assert.ok(legal.every((action) => Object.values(action.gems).reduce((sum, count) => sum + count, 0) === 2));
});

test('getLegalActions 在贵族选择阶段只返回候选贵族', () => {
  const state = makeState(['A', 'B'], [
    makeNoble('white', { white: 3 }),
    makeNoble('blue', { blue: 3 }),
  ]);
  addBonuses(state.players[0], { white: 3, blue: 3 });
  const choosing = performAction(state, {
    type: ACTION_TYPES.TAKE_DIFFERENT_GEMS,
    gems: ['white', 'blue', 'green'],
  });

  assert.equal(choosing.phase, PHASES.CHOOSING_NOBLE);
  assert.deepEqual(
    getLegalActions(choosing, choosing.players[0].id).map((action) => action.nobleId).sort(),
    ['blue', 'white'],
  );
});

test('TURN_TRANSITION 只允许确认回合，GAME_OVER 不再返回动作', () => {
  const state = makeState();
  const transition = performAction(state, {
    type: ACTION_TYPES.TAKE_DIFFERENT_GEMS,
    gems: ['white', 'blue', 'green'],
  });
  assert.deepEqual(getLegalActions(transition, transition.players[1].id), [
    { type: ACTION_TYPES.ACKNOWLEDGE_TURN },
  ]);

  transition.phase = PHASES.GAME_OVER;
  transition.gameOver = true;
  assert.deepEqual(getLegalActions(transition, transition.players[1].id), []);
});
