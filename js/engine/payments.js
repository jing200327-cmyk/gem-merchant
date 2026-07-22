import { ALL_GEM_TYPES, GEM_TYPES } from '../constants.js';
import { clone } from '../utils/clone.js';
import { effectiveCost } from './rules.js';

export function getPaymentPlan(player, card) {
  const cost = effectiveCost(player, card);
  const tokens = Object.fromEntries(ALL_GEM_TYPES.map((gem) => [gem, 0]));
  let goldNeeded = 0;
  for (const gem of GEM_TYPES) {
    tokens[gem] = Math.min(cost[gem], player.gems[gem]);
    goldNeeded += cost[gem] - tokens[gem];
  }
  tokens.gold = goldNeeded;
  return { tokens, affordable: goldNeeded <= player.gems.gold };
}

function validatePlan(player, card, plan) {
  const expected = getPaymentPlan(player, card);
  if (!expected.affordable) throw new Error('玩家无法支付该卡牌');
  for (const gem of ALL_GEM_TYPES) {
    if (plan.tokens[gem] !== expected.tokens[gem]) throw new Error('支付方案无效');
    if (plan.tokens[gem] > player.gems[gem]) throw new Error('持有宝石不足');
  }
}

export function applyPaymentInPlace(state, playerId, card, plan) {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error('玩家不存在');
  validatePlan(player, card, plan);
  for (const gem of ALL_GEM_TYPES) {
    player.gems[gem] -= plan.tokens[gem];
    state.tokenPool[gem] += plan.tokens[gem];
  }
  return state;
}

export function applyPayment(state, playerId, card, plan = null) {
  const next = clone(state);
  const player = next.players.find((candidate) => candidate.id === playerId);
  const resolvedPlan = plan ?? getPaymentPlan(player, card);
  return applyPaymentInPlace(next, playerId, card, resolvedPlan);
}
