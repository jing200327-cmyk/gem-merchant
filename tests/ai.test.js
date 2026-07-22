import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTION_TYPES, AI_LEVELS, PHASES } from '../js/constants.js';
import { chooseAiAction } from '../js/ai/ai-controller.js';
import { performAction } from '../js/engine/actions.js';
import { getLegalActions } from '../js/engine/rules.js';
import { addBonuses, makeCard, makeNoble, makeState } from './helpers.js';

function assertChosenFromLegal(state, level = AI_LEVELS.RANDOM) {
  const playerId = state.players[state.currentPlayerIndex].id;
  const before = structuredClone(state);
  const legal = getLegalActions(state, playerId);
  const action = chooseAiAction(state, playerId, level);
  assert.ok(legal.some((candidate) => JSON.stringify(candidate) === JSON.stringify(action)));
  assert.deepEqual(state, before, 'AI 决策不能修改 state');
  return action;
}

test('三档 AI 只选择合法动作且不修改 state，随机 AI 具有确定性', () => {
  for (const level of Object.values(AI_LEVELS)) assertChosenFromLegal(makeState(), level);
  const state = makeState();
  const first = assertChosenFromLegal(state);
  const second = chooseAiAction(state, state.players[0].id, AI_LEVELS.RANDOM);
  assert.deepEqual(second, first);
});

test('AI 可以处理归还、贵族选择、回合确认和游戏结束', () => {
  const state = makeState(['A', 'B'], [
    makeNoble('white', { white: 3 }), makeNoble('blue', { blue: 3 }),
  ]);
  Object.assign(state.players[0].gems, { white: 2, blue: 2, green: 2, red: 2, black: 1 });
  let current = performAction(state, {
    type: ACTION_TYPES.TAKE_DIFFERENT_GEMS, gems: ['white', 'blue', 'green'],
  });
  assert.equal(assertChosenFromLegal(current).type, ACTION_TYPES.RETURN_GEMS);

  const nobleState = makeState(['A', 'B'], [
    makeNoble('white', { white: 3 }), makeNoble('blue', { blue: 3 }),
  ]);
  addBonuses(nobleState.players[0], { white: 3, blue: 3 });
  current = performAction(nobleState, {
    type: ACTION_TYPES.TAKE_DIFFERENT_GEMS, gems: ['white', 'blue', 'green'],
  });
  assert.equal(assertChosenFromLegal(current).type, ACTION_TYPES.CHOOSE_NOBLE);

  const transition = makeState();
  transition.phase = PHASES.TURN_TRANSITION;
  transition.currentPlayerIndex = 1;
  transition.pending = { nextPlayerId: transition.players[1].id };
  assert.equal(assertChosenFromLegal(transition).type, ACTION_TYPES.ACKNOWLEDGE_TURN);

  transition.phase = PHASES.GAME_OVER;
  transition.gameOver = true;
  transition.pending = null;
  assert.equal(chooseAiAction(transition, transition.players[1].id, AI_LEVELS.RANDOM), null);
});

test('AI 在唯一合法动作时可以购买预留卡或从牌堆盲抽预留', () => {
  const buyState = makeState();
  for (const gem of ['white', 'blue', 'green', 'red', 'black']) buyState.tokenPool[gem] = 0;
  buyState.players[0].reserved.push(makeCard({ id: 'reserved-free', points: 1 }));
  assert.equal(assertChosenFromLegal(buyState).type, ACTION_TYPES.BUY_RESERVED_CARD);

  const reserveState = makeState();
  for (const gem of ['white', 'blue', 'green', 'red', 'black']) reserveState.tokenPool[gem] = 0;
  reserveState.decks[2].push(makeCard({ id: 'hidden', level: 2 }));
  assert.deepEqual(assertChosenFromLegal(reserveState), {
    type: ACTION_TYPES.RESERVE_DECK_CARD, level: 2,
  });
});

test('贪心 AI 优先购买更高声望卡，规划 AI 会为高价值目标行动', () => {
  const state = makeState();
  state.market[3].push(
    makeCard({ id: 'small', level: 3, points: 1 }),
    makeCard({ id: 'large', level: 3, points: 5 }),
  );
  const greedy = chooseAiAction(state, state.players[0].id, AI_LEVELS.GREEDY);
  const planner = chooseAiAction(state, state.players[0].id, AI_LEVELS.PLANNER);
  assert.equal(state.market[greedy.level][greedy.index].id, 'large');
  assert.equal(state.market[planner.level][planner.index].id, 'large');
});

