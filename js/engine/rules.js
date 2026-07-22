import {
  ACTION_TYPES,
  ALL_GEM_TYPES,
  GEM_TYPES,
  MAX_RESERVED,
  PHASES,
} from '../constants.js';

export function playerGemCount(player) {
  return Object.values(player.gems).reduce((sum, count) => sum + count, 0);
}

export function playerBonuses(player) {
  const bonuses = Object.fromEntries(GEM_TYPES.map((gem) => [gem, 0]));
  for (const card of player.cards) bonuses[card.bonus] += 1;
  return bonuses;
}

export function playerPrestige(player) {
  const cardPoints = player.cards.reduce((sum, card) => sum + card.points, 0);
  return cardPoints + player.nobles.reduce((sum, noble) => sum + noble.points, 0);
}

export function effectiveCost(player, card) {
  const bonuses = playerBonuses(player);
  return Object.fromEntries(
    GEM_TYPES.map((gem) => [gem, Math.max(0, (card.cost[gem] ?? 0) - bonuses[gem])]),
  );
}

export function canAfford(player, card) {
  const cost = effectiveCost(player, card);
  const shortfall = GEM_TYPES.reduce(
    (sum, gem) => sum + Math.max(0, cost[gem] - player.gems[gem]),
    0,
  );
  return shortfall <= player.gems.gold;
}

export function eligibleNobles(state, player) {
  const bonuses = playerBonuses(player);
  return state.availableNobles.filter((noble) => (
    GEM_TYPES.every((gem) => bonuses[gem] >= (noble.cost[gem] ?? 0))
  ));
}

function combinations(items, size, start = 0, prefix = [], result = []) {
  if (prefix.length === size) {
    result.push([...prefix]);
    return result;
  }
  for (let index = start; index < items.length; index += 1) {
    prefix.push(items[index]);
    combinations(items, size, index + 1, prefix, result);
    prefix.pop();
  }
  return result;
}

function enumerateGemReturns(player, required) {
  const actions = [];
  const selected = {};
  function visit(index, remaining) {
    if (index === ALL_GEM_TYPES.length) {
      if (remaining === 0) actions.push({ type: ACTION_TYPES.RETURN_GEMS, gems: { ...selected } });
      return;
    }
    const gem = ALL_GEM_TYPES[index];
    const maximum = Math.min(player.gems[gem], remaining);
    for (let count = 0; count <= maximum; count += 1) {
      if (count) selected[gem] = count;
      else delete selected[gem];
      visit(index + 1, remaining - count);
    }
    delete selected[gem];
  }
  visit(0, required);
  return actions;
}

function getMainActions(state, player) {
  const actions = [];
  const availableColors = GEM_TYPES.filter((gem) => state.tokenPool[gem] > 0);
  const takeCount = Math.min(3, availableColors.length);
  for (const gems of combinations(availableColors, takeCount)) {
    if (gems.length) actions.push({ type: ACTION_TYPES.TAKE_DIFFERENT_GEMS, gems });
  }
  for (const gem of GEM_TYPES.filter((color) => state.tokenPool[color] >= 4)) {
    actions.push({ type: ACTION_TYPES.TAKE_SAME_GEMS, gem });
  }
  for (const level of [1, 2, 3]) {
    state.market[level].forEach((card, index) => {
      if (canAfford(player, card)) actions.push({ type: ACTION_TYPES.BUY_MARKET_CARD, level, index });
      if (player.reserved.length < MAX_RESERVED) actions.push({ type: ACTION_TYPES.RESERVE_MARKET_CARD, level, index });
    });
    if (player.reserved.length < MAX_RESERVED && state.decks[level].length) {
      actions.push({ type: ACTION_TYPES.RESERVE_DECK_CARD, level });
    }
  }
  player.reserved.forEach((card, index) => {
    if (canAfford(player, card)) actions.push({ type: ACTION_TYPES.BUY_RESERVED_CARD, index });
  });
  return actions;
}

export function getLegalActions(state, playerId) {
  const player = state.players.find((candidate) => candidate.id === playerId);
  const current = state.players[state.currentPlayerIndex];
  if (!player || player !== current || state.gameOver || state.phase === PHASES.GAME_OVER) return [];
  if (state.phase === PHASES.RETURNING_GEMS) {
    return enumerateGemReturns(player, state.pending.returnCount);
  }
  if (state.phase === PHASES.CHOOSING_NOBLE) {
    return state.pending.nobleIds.map((nobleId) => ({ type: ACTION_TYPES.CHOOSE_NOBLE, nobleId }));
  }
  if (state.phase === PHASES.TURN_TRANSITION) {
    return [{ type: ACTION_TYPES.ACKNOWLEDGE_TURN }];
  }
  if (state.phase !== PHASES.AWAITING_ACTION) return [];
  return getMainActions(state, player);
}
