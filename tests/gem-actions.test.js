import test from 'node:test';
import assert from 'node:assert/strict';
import { performAction } from '../js/engine/actions.js';
import { getLegalActions, playerGemCount } from '../js/engine/rules.js';
import { PHASES } from '../js/constants.js';
import { makeCard, makeState } from './helpers.js';

test('9 枚宝石的玩家可拿三色，随后必须归还两枚至上限 10', () => {
  const state = makeState();
  Object.assign(state.players[0].gems, { white: 2, blue: 2, green: 2, red: 2, black: 1 });

  const afterTake = performAction(state, {
    type: 'TAKE_DIFFERENT_GEMS',
    gems: ['white', 'blue', 'green'],
  });

  assert.equal(playerGemCount(afterTake.players[0]), 12);
  assert.equal(afterTake.phase, PHASES.RETURNING_GEMS);
  assert.equal(afterTake.pending.returnCount, 2);

  assert.throws(() => performAction(afterTake, {
    type: 'RESERVE_DECK_CARD', level: 1,
  }), /当前阶段不允许/);
  assert.throws(() => performAction(afterTake, {
    type: 'BUY_RESERVED_CARD', index: 0,
  }), /当前阶段不允许/);

  const afterReturn = performAction(afterTake, {
    type: 'RETURN_GEMS',
    gems: { white: 1, blue: 1 },
  });
  assert.equal(playerGemCount(afterReturn.players[0]), 10);
  assert.equal(afterReturn.phase, PHASES.TURN_TRANSITION);
});

test('公共池只有 3 枚某色时不能拿两枚，4 枚时可以', () => {
  const state = makeState();
  state.tokenPool.red = 3;
  assert.throws(() => performAction(state, {
    type: 'TAKE_SAME_GEMS', gem: 'red',
  }), /至少需要 4 枚/);

  state.tokenPool.red = 4;
  const next = performAction(state, { type: 'TAKE_SAME_GEMS', gem: 'red' });
  assert.equal(next.players[0].gems.red, 2);
  assert.equal(next.tokenPool.red, 2);
});

test('合法行动枚举只返回当前玩家能执行的结构化主要行动', () => {
  const state = makeState();
  state.market[1].push(makeCard({ id: 'free', cost: {} }));
  const actions = getLegalActions(state, state.players[0].id);

  assert.ok(actions.some((action) => action.type === 'TAKE_DIFFERENT_GEMS'));
  assert.ok(actions.some((action) => action.type === 'TAKE_SAME_GEMS'));
  assert.ok(actions.some((action) => action.type === 'BUY_MARKET_CARD'));
  assert.ok(actions.some((action) => action.type === 'RESERVE_MARKET_CARD'));
});
