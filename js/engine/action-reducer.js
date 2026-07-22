import {
  ACTION_TYPES,
  ALL_GEM_TYPES,
  GEM_TYPES,
  MAX_HELD_GEMS,
  MAX_RESERVED,
  PHASES,
} from '../constants.js';
import { clone, cloneStateForTransition, createStateSnapshot } from '../utils/clone.js';
import { applyPaymentInPlace, getPaymentPlan } from './payments.js';
import { canAfford, eligibleNobles, playerGemCount } from './rules.js';
import { acknowledgeTurnInPlace, finalizeTurnInPlace } from './turn-manager.js';

export class InvalidActionError extends Error {}

const MAIN_ACTIONS = new Set([
  ACTION_TYPES.TAKE_DIFFERENT_GEMS,
  ACTION_TYPES.TAKE_SAME_GEMS,
  ACTION_TYPES.BUY_MARKET_CARD,
  ACTION_TYPES.BUY_RESERVED_CARD,
  ACTION_TYPES.RESERVE_MARKET_CARD,
  ACTION_TYPES.RESERVE_DECK_CARD,
]);

function refillMarket(state, level, index) {
  if (state.decks[level].length) {
    state.market[level].splice(index, 0, state.decks[level].pop());
  }
}

function awardNoble(state, player, nobleId, events) {
  const index = state.availableNobles.findIndex((noble) => noble.id === nobleId);
  if (index < 0) throw new InvalidActionError('贵族已不在公共区域');
  const [noble] = state.availableNobles.splice(index, 1);
  player.nobles.push(noble);
  events.push({ type: 'NOBLE_VISITED', playerId: player.id, nobleId });
}

function resolveNoblesAndTurn(state, events) {
  const player = state.players[state.currentPlayerIndex];
  const eligible = eligibleNobles(state, player);
  if (eligible.length === 1) {
    awardNoble(state, player, eligible[0].id, events);
  } else if (eligible.length > 1) {
    state.phase = PHASES.CHOOSING_NOBLE;
    state.pending = { nobleIds: eligible.map((noble) => noble.id) };
    events.push({ type: 'NOBLE_CHOICE_REQUIRED', nobleIds: state.pending.nobleIds });
    return state;
  }
  return finalizeTurnInPlace(state);
}

function resolveAfterMainAction(state, events) {
  const player = state.players[state.currentPlayerIndex];
  const excess = playerGemCount(player) - MAX_HELD_GEMS;
  if (excess > 0) {
    state.phase = PHASES.RETURNING_GEMS;
    state.pending = { returnCount: excess };
    events.push({ type: 'GEM_RETURN_REQUIRED', count: excess });
    return state;
  }
  return resolveNoblesAndTurn(state, events);
}

function takeDifferent(state, player, action, events) {
  const gems = action.gems ?? [];
  const unique = new Set(gems);
  if (!gems.length || gems.length > 3 || unique.size !== gems.length) {
    throw new InvalidActionError('必须选择 1 至 3 种不同的普通宝石');
  }
  for (const gem of gems) {
    if (!GEM_TYPES.includes(gem) || state.tokenPool[gem] < 1) {
      throw new InvalidActionError('所选宝石库存不足');
    }
    state.tokenPool[gem] -= 1;
    player.gems[gem] += 1;
  }
  events.push({ type: 'GEMS_TAKEN', gems: Object.fromEntries(gems.map((gem) => [gem, 1])) });
}

function takeSame(state, player, action, events) {
  if (!GEM_TYPES.includes(action.gem) || state.tokenPool[action.gem] < 4) {
    throw new InvalidActionError('拿取两枚同色宝石时，公共池至少需要 4 枚');
  }
  state.tokenPool[action.gem] -= 2;
  player.gems[action.gem] += 2;
  events.push({ type: 'GEMS_TAKEN', gems: { [action.gem]: 2 } });
}

function buyCard(state, player, action, events) {
  const fromMarket = action.type === ACTION_TYPES.BUY_MARKET_CARD;
  const collection = fromMarket ? state.market[action.level] : player.reserved;
  const card = collection?.[action.index];
  if (!card || !canAfford(player, card)) throw new InvalidActionError('无法购买该卡牌');
  const plan = getPaymentPlan(player, card);
  applyPaymentInPlace(state, player.id, card, plan);
  collection.splice(action.index, 1);
  if (fromMarket) refillMarket(state, action.level, action.index);
  player.cards.push(card);
  events.push({ type: 'CARD_PURCHASED', playerId: player.id, cardId: card.id, payment: plan.tokens });
}

function reserveCard(state, player, action, events) {
  if (player.reserved.length >= MAX_RESERVED) throw new InvalidActionError('预留卡牌已达上限');
  let card;
  if (action.type === ACTION_TYPES.RESERVE_MARKET_CARD) {
    card = state.market[action.level]?.[action.index];
    if (!card) throw new InvalidActionError('市场中没有该卡牌');
    state.market[action.level].splice(action.index, 1);
    refillMarket(state, action.level, action.index);
  } else {
    card = state.decks[action.level]?.pop();
    if (!card) throw new InvalidActionError('所选牌堆已经耗尽');
  }
  player.reserved.push(card);
  if (state.tokenPool.gold > 0) {
    state.tokenPool.gold -= 1;
    player.gems.gold += 1;
  }
  events.push({ type: 'CARD_RESERVED', playerId: player.id, cardId: card.id });
}

function returnGems(state, player, action, events) {
  const returned = { ...action.gems };
  const total = Object.values(returned).reduce((sum, count) => sum + count, 0);
  if (total !== state.pending.returnCount) throw new InvalidActionError(`必须归还 ${state.pending.returnCount} 枚宝石`);
  for (const gem of ALL_GEM_TYPES) {
    const count = returned[gem] ?? 0;
    if (!Number.isInteger(count) || count < 0 || count > player.gems[gem]) {
      throw new InvalidActionError('归还宝石数量无效');
    }
    player.gems[gem] -= count;
    state.tokenPool[gem] += count;
  }
  events.push({ type: 'GEMS_RETURNED', gems: returned });
}

function logTransition(before, next, action, events) {
  next.actionLog.push({
    sequence: next.actionLog.length + 1,
    turnNumber: before.turnNumber,
    playerId: before.players[before.currentPlayerIndex].id,
    action: clone(action),
    events: clone(events),
  });
  const limit = next.historyPolicy?.snapshotLimit;
  if (limit !== 0) {
    next.snapshots.push({ reason: action.type, state: createStateSnapshot(next) });
    if (Number.isInteger(limit) && limit >= 0 && next.snapshots.length > limit) {
      next.snapshots = next.snapshots.slice(-limit);
    }
  }
  return next;
}

export function performAction(state, action) {
  const events = [];
  if (!action?.type) throw new InvalidActionError('动作缺少类型');

  if (action.type === ACTION_TYPES.ACKNOWLEDGE_TURN) {
    const next = acknowledgeTurnInPlace(cloneStateForTransition(state));
    return logTransition(state, next, action, events);
  }
  if (MAIN_ACTIONS.has(action.type) && state.phase !== PHASES.AWAITING_ACTION) {
    throw new InvalidActionError('当前阶段不允许执行主要行动');
  }
  if (action.type === ACTION_TYPES.RETURN_GEMS && state.phase !== PHASES.RETURNING_GEMS) {
    throw new InvalidActionError('当前阶段不允许归还宝石');
  }
  if (action.type === ACTION_TYPES.CHOOSE_NOBLE && state.phase !== PHASES.CHOOSING_NOBLE) {
    throw new InvalidActionError('当前阶段不允许选择贵族');
  }

  let next = cloneStateForTransition(state);
  const player = next.players[next.currentPlayerIndex];
  if (action.type === ACTION_TYPES.TAKE_DIFFERENT_GEMS) takeDifferent(next, player, action, events);
  else if (action.type === ACTION_TYPES.TAKE_SAME_GEMS) takeSame(next, player, action, events);
  else if (action.type === ACTION_TYPES.BUY_MARKET_CARD || action.type === ACTION_TYPES.BUY_RESERVED_CARD) buyCard(next, player, action, events);
  else if (action.type === ACTION_TYPES.RESERVE_MARKET_CARD || action.type === ACTION_TYPES.RESERVE_DECK_CARD) reserveCard(next, player, action, events);
  else if (action.type === ACTION_TYPES.RETURN_GEMS) {
    returnGems(next, player, action, events);
    next = resolveNoblesAndTurn(next, events);
    return logTransition(state, next, action, events);
  } else if (action.type === ACTION_TYPES.CHOOSE_NOBLE) {
    if (!next.pending.nobleIds.includes(action.nobleId)) throw new InvalidActionError('该贵族不在可选列表中');
    awardNoble(next, player, action.nobleId, events);
    next = finalizeTurnInPlace(next);
    return logTransition(state, next, action, events);
  } else {
    throw new InvalidActionError('未知动作类型');
  }

  next = resolveAfterMainAction(next, events);
  return logTransition(state, next, action, events);
}
