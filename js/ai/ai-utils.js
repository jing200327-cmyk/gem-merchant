import { ACTION_TYPES, GEM_TYPES } from '../constants.js';
import { createRandom } from '../utils/random.js';
import { effectiveCost } from '../engine/rules.js';

export function actionCard(state, player, action) {
  if (action.type === ACTION_TYPES.BUY_MARKET_CARD || action.type === ACTION_TYPES.RESERVE_MARKET_CARD) {
    return state.market[action.level]?.[action.index] ?? null;
  }
  if (action.type === ACTION_TYPES.BUY_RESERVED_CARD) {
    return player.reserved[action.index] ?? null;
  }
  return null;
}

export function cardResourceGap(player, card, gems = player.gems) {
  const cost = effectiveCost(player, card);
  let coloredGap = 0;
  for (const gem of GEM_TYPES) coloredGap += Math.max(0, cost[gem] - gems[gem]);
  return Math.max(0, coloredGap - gems.gold);
}

function hashText(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function decisionRandom(state, playerId, namespace = 'AI') {
  const text = `${state.seed}:${state.turnNumber}:${state.actionLog.length}:${playerId}:${namespace}`;
  return createRandom(hashText(text));
}

export function chooseDeterministically(items, state, playerId, namespace) {
  if (!items.length) return null;
  const random = decisionRandom(state, playerId, namespace);
  return items[Math.floor(random() * items.length)];
}

export function actionKey(action) {
  return JSON.stringify(action);
}
