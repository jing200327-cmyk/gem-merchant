import test from 'node:test';
import assert from 'node:assert/strict';
import { ACTION_TYPES } from '../js/constants.js';
import {
  cardActionOptions,
  gemDraftAction,
  paymentPreview,
} from '../js/ui/interaction-model.js';
import { makeCard, makeState } from './helpers.js';

test('卡牌草稿只从对应的合法购买或预定动作生成选项', () => {
  const legal = [
    { type: ACTION_TYPES.BUY_MARKET_CARD, level: 2, index: 1 },
    { type: ACTION_TYPES.RESERVE_MARKET_CARD, level: 2, index: 1 },
    { type: ACTION_TYPES.BUY_MARKET_CARD, level: 1, index: 0 },
  ];
  assert.deepEqual(cardActionOptions(legal, 'market', 2, 1), [
    { type: ACTION_TYPES.BUY_MARKET_CARD, level: 2, index: 1 },
    { type: ACTION_TYPES.RESERVE_MARKET_CARD, level: 2, index: 1 },
  ]);
});

test('宝石草稿只有精确匹配合法动作时才可确认', () => {
  const legal = [
    { type: ACTION_TYPES.TAKE_DIFFERENT_GEMS, gems: ['white', 'blue', 'green'] },
    { type: ACTION_TYPES.TAKE_SAME_GEMS, gem: 'red' },
  ];
  assert.deepEqual(gemDraftAction(legal, { white: 1, blue: 1, green: 1 }), legal[0]);
  assert.deepEqual(gemDraftAction(legal, { red: 2 }), legal[1]);
  assert.equal(gemDraftAction(legal, { white: 1, blue: 1 }), null);
});

test('支付预览只读取玩家和卡牌，不修改它们', () => {
  const state = makeState();
  const player = state.players[0];
  player.gems.white = 1;
  player.gems.gold = 2;
  const card = makeCard({ cost: { white: 3, blue: 0, green: 0, red: 0, black: 0 } });
  const before = structuredClone({ player, card });
  const preview = paymentPreview(player, card);
  assert.deepEqual(preview.payment, { white: 1, blue: 0, green: 0, red: 0, black: 0, gold: 2 });
  assert.deepEqual({ player, card }, before);
});
