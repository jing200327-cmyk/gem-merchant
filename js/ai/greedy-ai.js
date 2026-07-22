import { evaluateAction } from './evaluator.js';
import { chooseDeterministically } from './ai-utils.js';

export function chooseGreedyAction(state, playerId, legalActions, namespace = 'GREEDY') {
  const scored = legalActions.map((action) => ({
    action,
    score: evaluateAction(state, playerId, action),
  }));
  const bestScore = Math.max(...scored.map((item) => item.score));
  const tolerance = Math.max(1, Math.abs(bestScore) * 0.1);
  const candidates = scored
    .filter((item) => item.score >= bestScore - tolerance)
    .map((item) => item.action);
  return chooseDeterministically(candidates, state, playerId, namespace);
}
