import { ACTION_TYPES, ALL_GEM_TYPES } from '../constants.js';
import {
  InvalidActionError,
  performAction as reduceAction,
} from './action-reducer.js';

export { InvalidActionError } from './action-reducer.js';

function validateReturnPayload(action) {
  if (!action.gems || typeof action.gems !== 'object' || Array.isArray(action.gems)) {
    throw new InvalidActionError('归还宝石格式无效');
  }
  const hasUnknownGem = Object.keys(action.gems)
    .some((gem) => !ALL_GEM_TYPES.includes(gem));
  if (hasUnknownGem) throw new InvalidActionError('归还动作包含未知宝石');
}

export function performAction(state, action) {
  if (action?.type === ACTION_TYPES.RETURN_GEMS) validateReturnPayload(action);
  return reduceAction(state, action);
}
