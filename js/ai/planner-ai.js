import { ACTION_TYPES, PHASES } from '../constants.js';
import { playerPrestige } from '../engine/rules.js';
import { actionCard, cardResourceGap, chooseDeterministically } from './ai-utils.js';
import { chooseGreedyAction } from './greedy-ai.js';

function targetCandidates(state, player, legalActions) {
  return legalActions
    .filter((action) => [
      ACTION_TYPES.BUY_MARKET_CARD,
      ACTION_TYPES.BUY_RESERVED_CARD,
      ACTION_TYPES.RESERVE_MARKET_CARD,
    ].includes(action.type))
    .map((action) => ({ action, card: actionCard(state, player, action) }))
    .filter((item) => item.card)
    .map((item) => ({
      ...item,
      gap: cardResourceGap(player, item.card),
      targetScore: item.card.points * 45 + item.card.level * 5 - cardResourceGap(player, item.card) * 12,
    }));
}

function targetProgress(player, target, action) {
  const gems = { ...player.gems };
  if (action.type === ACTION_TYPES.TAKE_DIFFERENT_GEMS) {
    for (const gem of action.gems) gems[gem] += 1;
  } else if (action.type === ACTION_TYPES.TAKE_SAME_GEMS) {
    gems[action.gem] += 2;
  }
  return target.gap - cardResourceGap(player, target.card, gems);
}

export function choosePlannerAction(state, playerId, legalActions) {
  if (state.phase !== PHASES.AWAITING_ACTION) {
    return chooseGreedyAction(state, playerId, legalActions, 'PLANNER_PHASE');
  }
  const player = state.players.find((candidate) => candidate.id === playerId);
  const targets = targetCandidates(state, player, legalActions)
    .sort((left, right) => right.targetScore - left.targetScore);
  const target = targets[0];
  if (!target) return chooseGreedyAction(state, playerId, legalActions, 'PLANNER_FALLBACK');

  const matchingBuy = targets.find((item) => (
    item.card.id === target.card.id
    && [ACTION_TYPES.BUY_MARKET_CARD, ACTION_TYPES.BUY_RESERVED_CARD].includes(item.action.type)
  ));
  if (matchingBuy && (target.card.points >= 2 || playerPrestige(player) >= 12 || target.gap === 0)) {
    return matchingBuy.action;
  }

  const threat = state.players.some((opponent) => (
    opponent.id !== player.id && cardResourceGap(opponent, target.card) <= 1
  ));
  const reserve = targets.find((item) => (
    item.card.id === target.card.id && item.action.type === ACTION_TYPES.RESERVE_MARKET_CARD
  ));
  if (reserve && threat && target.card.points >= 2) return reserve.action;

  const progress = legalActions
    .filter((action) => [ACTION_TYPES.TAKE_DIFFERENT_GEMS, ACTION_TYPES.TAKE_SAME_GEMS].includes(action.type))
    .map((action) => ({ action, progress: targetProgress(player, target, action) }));
  const bestProgress = Math.max(0, ...progress.map((item) => item.progress));
  if (bestProgress > 0) {
    return chooseDeterministically(
      progress.filter((item) => item.progress === bestProgress).map((item) => item.action),
      state,
      playerId,
      'PLANNER_TARGET',
    );
  }
  if (reserve && target.gap <= 2) return reserve.action;
  return chooseGreedyAction(state, playerId, legalActions, 'PLANNER_GREEDY');
}
