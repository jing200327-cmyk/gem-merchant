import { ACTION_TYPES, AI_LEVELS } from '../constants.js';
import { getLegalActions } from '../engine/rules.js';
import { chooseGreedyAction } from './greedy-ai.js';
import { choosePlannerAction } from './planner-ai.js';
import { chooseRandomAction } from './random-ai.js';

const RESERVE_ACTIONS = new Set([
  ACTION_TYPES.RESERVE_MARKET_CARD,
  ACTION_TYPES.RESERVE_DECK_CARD,
]);

function avoidReservationDeadlock(state, playerId, legalActions) {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player || player.reserved.length < 2) return legalActions;
  const alternatives = legalActions.filter((action) => !RESERVE_ACTIONS.has(action.type));
  return alternatives.length ? alternatives : legalActions;
}

export function chooseAiAction(state, playerId, difficulty = AI_LEVELS.RANDOM) {
  const legalActions = getLegalActions(state, playerId);
  if (!legalActions.length) return null;
  const candidates = avoidReservationDeadlock(state, playerId, legalActions);
  if (difficulty === AI_LEVELS.PLANNER) return choosePlannerAction(state, playerId, candidates);
  if (difficulty === AI_LEVELS.GREEDY) return chooseGreedyAction(state, playerId, candidates);
  return chooseRandomAction(state, playerId, candidates);
}
