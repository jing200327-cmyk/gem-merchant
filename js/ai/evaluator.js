import { ACTION_TYPES, GEM_TYPES, MAX_HELD_GEMS } from '../constants.js';
import { getPaymentPlan } from '../engine/payments.js';
import { canAfford, playerBonuses, playerGemCount, playerPrestige } from '../engine/rules.js';
import { actionCard, cardResourceGap } from './ai-utils.js';

function visibleCards(state, player) {
  return [...state.market[1], ...state.market[2], ...state.market[3], ...player.reserved];
}

function colorDemand(state, player, gem) {
  const bonuses = playerBonuses(player);
  return visibleCards(state, player).reduce(
    (sum, card) => sum + Math.max(0, card.cost[gem] - bonuses[gem]),
    0,
  );
}

function bonusValue(state, player, gem) {
  const demand = colorDemand(state, player, gem);
  const weakest = Math.min(...Object.values(playerBonuses(player)));
  return Math.min(6, demand) + (playerBonuses(player)[gem] === weakest ? 2 : 0);
}

function nobleProgressValue(state, player, bonusGem) {
  const bonuses = playerBonuses(player);
  return state.availableNobles.reduce((score, noble) => {
    if (!noble.cost[bonusGem] || bonuses[bonusGem] >= noble.cost[bonusGem]) return score;
    const missing = GEM_TYPES.reduce(
      (sum, gem) => sum + Math.max(0, noble.cost[gem] - bonuses[gem]),
      0,
    );
    return score + Math.max(1, 7 - missing);
  }, 0);
}

function opponentThreat(state, player, card) {
  return state.players
    .filter((candidate) => candidate.id !== player.id)
    .reduce((best, opponent) => {
      if (canAfford(opponent, card)) return Math.max(best, 2);
      if (cardResourceGap(opponent, card) <= 1) return Math.max(best, 1);
      return best;
    }, 0);
}

function gemsAfterAction(player, action) {
  const gems = { ...player.gems };
  if (action.type === ACTION_TYPES.TAKE_DIFFERENT_GEMS) {
    for (const gem of action.gems) gems[gem] += 1;
  } else if (action.type === ACTION_TYPES.TAKE_SAME_GEMS) {
    gems[action.gem] += 2;
  }
  return gems;
}

function evaluateTake(state, player, action) {
  const cards = visibleCards(state, player);
  const before = cards.map((card) => cardResourceGap(player, card));
  const afterGems = gemsAfterAction(player, action);
  const improvements = cards.map((card, index) => before[index] - cardResourceGap(player, card, afterGems));
  const bestProgress = Math.max(0, ...improvements);
  const coverage = improvements.filter((value) => value > 0).length;
  const colors = action.type === ACTION_TYPES.TAKE_SAME_GEMS ? [action.gem] : action.gems;
  const demand = colors.reduce((sum, gem) => sum + colorDemand(state, player, gem), 0);
  const overflow = Math.max(0, playerGemCount(player) + colors.length - MAX_HELD_GEMS);
  return bestProgress * 18 + coverage * 4 + Math.min(12, demand) - overflow * 12;
}

function evaluateReturn(state, player, action) {
  return -Object.entries(action.gems).reduce((cost, [gem, count]) => {
    const scarcityCost = gem === 'gold' ? 18 : colorDemand(state, player, gem);
    return cost + scarcityCost * count;
  }, 0);
}

export function evaluateAction(state, playerId, action) {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) return Number.NEGATIVE_INFINITY;
  if (action.type === ACTION_TYPES.RETURN_GEMS) return evaluateReturn(state, player, action);
  if (action.type === ACTION_TYPES.CHOOSE_NOBLE) {
    return state.availableNobles.find((noble) => noble.id === action.nobleId)?.points * 100 || 0;
  }
  if (action.type === ACTION_TYPES.ACKNOWLEDGE_TURN) return 0;
  if (action.type === ACTION_TYPES.TAKE_DIFFERENT_GEMS || action.type === ACTION_TYPES.TAKE_SAME_GEMS) {
    return evaluateTake(state, player, action);
  }
  if (action.type === ACTION_TYPES.RESERVE_DECK_CARD) return 3 + (state.tokenPool.gold > 0 ? 8 : 0);

  const card = actionCard(state, player, action);
  if (!card) return Number.NEGATIVE_INFINITY;
  if (action.type === ACTION_TYPES.RESERVE_MARKET_CARD) {
    return card.points * 12
      + opponentThreat(state, player, card) * 15
      + (state.tokenPool.gold > 0 ? 8 : 0)
      + nobleProgressValue(state, player, card.bonus) * 3;
  }

  const payment = getPaymentPlan(player, card).tokens;
  const tokenCost = Object.values(payment).reduce((sum, count) => sum + count, 0);
  const endgameMultiplier = playerPrestige(player) >= 12 ? 35 : 0;
  return card.points * (100 + endgameMultiplier)
    + bonusValue(state, player, card.bonus) * 15
    + nobleProgressValue(state, player, card.bonus) * 20
    - payment.gold * 12
    - tokenCost * 2;
}
