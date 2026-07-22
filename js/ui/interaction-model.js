import { ACTION_TYPES, ALL_GEM_TYPES } from '../constants.js';
import { getPaymentPlan } from '../engine/payments.js';
import { effectiveCost } from '../engine/rules.js';

function sameGems(left, right) {
  return ALL_GEM_TYPES.every((gem) => (left[gem] ?? 0) === (right[gem] ?? 0));
}

export function cardActionOptions(legalActions, source, level, index) {
  const wantedTypes = source === 'reserved'
    ? [ACTION_TYPES.BUY_RESERVED_CARD]
    : [ACTION_TYPES.BUY_MARKET_CARD, ACTION_TYPES.RESERVE_MARKET_CARD];
  return legalActions.filter((action) => wantedTypes.includes(action.type)
    && action.index === index
    && (source === 'reserved' || action.level === level));
}

export function gemDraftAction(legalActions, draft) {
  return legalActions.find((action) => {
    if (action.type === ACTION_TYPES.TAKE_DIFFERENT_GEMS) {
      const expected = Object.fromEntries(action.gems.map((gem) => [gem, 1]));
      return sameGems(expected, draft);
    }
    if (action.type === ACTION_TYPES.TAKE_SAME_GEMS) {
      return sameGems({ [action.gem]: 2 }, draft);
    }
    return false;
  }) ?? null;
}

export function paymentPreview(player, card) {
  const { tokens: payment, affordable } = getPaymentPlan(player, card);
  const remaining = Object.fromEntries(ALL_GEM_TYPES.map((gem) => [gem, player.gems[gem] - payment[gem]]));
  return {
    originalCost: { ...card.cost },
    discountedCost: effectiveCost(player, card),
    payment,
    remaining,
    affordable,
  };
}
