import { ACTION_TYPES, ALL_GEM_TYPES, GEM_TYPES, PHASES } from '../constants.js';

const SAFE_ID = /^[a-zA-Z0-9_-]{1,64}$/;
const PHASE_VALUES = new Set(Object.values(PHASES));
const ACTION_VALUES = new Set(Object.values(ACTION_TYPES));

function assert(condition, message = '存档内容无效') {
  if (!condition) throw new Error(message);
}

function validInteger(value, maximum = 100) {
  return Number.isInteger(value) && value >= 0 && value <= maximum;
}

function validateTokens(tokens) {
  assert(tokens && typeof tokens === 'object');
  for (const gem of ALL_GEM_TYPES) assert(validInteger(tokens[gem], 20));
}

function validateCard(card) {
  assert(card && SAFE_ID.test(card.id));
  assert([1, 2, 3].includes(card.level));
  assert(GEM_TYPES.includes(card.bonus));
  assert(validInteger(card.points, 10));
  assert(card.cost && GEM_TYPES.every((gem) => validInteger(card.cost[gem], 20)));
}

function validateNoble(noble) {
  assert(noble && SAFE_ID.test(noble.id));
  assert(validInteger(noble.points, 10));
  assert(noble.cost && GEM_TYPES.every((gem) => validInteger(noble.cost[gem], 10)));
}

function validatePlayer(player) {
  assert(player && SAFE_ID.test(player.id));
  assert(typeof player.name === 'string' && player.name.trim().length > 0 && player.name.length <= 12);
  validateTokens(player.gems);
  assert(Array.isArray(player.cards) && player.cards.length <= 100);
  assert(Array.isArray(player.reserved) && player.reserved.length <= 3);
  assert(Array.isArray(player.nobles) && player.nobles.length <= 10);
  player.cards.forEach(validateCard);
  player.reserved.forEach(validateCard);
  player.nobles.forEach(validateNoble);
  assert(validInteger(player.actionCount, 10000));
}

export function validateImportedState(state) {
  assert(state && typeof state === 'object' && !Array.isArray(state));
  assert(state.schemaVersion === 1, '无法识别的存档格式');
  assert(Array.isArray(state.players) && state.players.length >= 2 && state.players.length <= 4);
  state.players.forEach(validatePlayer);
  assert(Number.isInteger(state.currentPlayerIndex)
    && state.currentPlayerIndex >= 0
    && state.currentPlayerIndex < state.players.length);
  assert(validInteger(state.turnNumber, 10000) && state.turnNumber > 0);
  assert(PHASE_VALUES.has(state.phase));
  assert(typeof state.gameOver === 'boolean');
  validateTokens(state.tokenPool);
  for (const level of [1, 2, 3]) {
    assert(Array.isArray(state.market?.[level]) && state.market[level].length <= 4);
    assert(Array.isArray(state.decks?.[level]) && state.decks[level].length <= 50);
    state.market[level].forEach(validateCard);
    state.decks[level].forEach(validateCard);
  }
  assert(Array.isArray(state.availableNobles) && state.availableNobles.length <= 10);
  state.availableNobles.forEach(validateNoble);
  assert(Array.isArray(state.actionLog) && state.actionLog.length <= 10000);
  for (const entry of state.actionLog) {
    assert(entry && entry.action && ACTION_VALUES.has(entry.action.type));
  }
  assert(Array.isArray(state.snapshots) && state.snapshots.length <= 1000);
  return state;
}
