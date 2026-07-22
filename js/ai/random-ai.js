import { chooseDeterministically } from './ai-utils.js';

export function chooseRandomAction(state, playerId, legalActions) {
  return chooseDeterministically(legalActions, state, playerId, 'RANDOM');
}
