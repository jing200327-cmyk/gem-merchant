import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPayment, getPaymentPlan } from '../js/engine/payments.js';
import { makeCard, makeState, addBonuses } from './helpers.js';

test('折扣后优先支付同色宝石，并用两个黄金补足差额', () => {
  const state = makeState();
  const player = state.players[0];
  addBonuses(player, { white: 2, blue: 1 });
  Object.assign(player.gems, { white: 1, blue: 1, red: 1, gold: 2 });
  const card = makeCard({ cost: { white: 3, blue: 3, red: 2 } });

  const plan = getPaymentPlan(player, card);

  assert.deepEqual(plan.tokens, {
    white: 1, blue: 1, green: 0, red: 1, black: 0, gold: 2,
  });
  const paidState = applyPayment(state, player.id, card, plan);
  assert.equal(paidState.players[0].gems.gold, 0);
  assert.equal(paidState.tokenPool.gold, state.tokenPool.gold + 2);
});
