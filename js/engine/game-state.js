import {
  AI_LEVELS,
  ALL_GEM_TYPES,
  GEM_POOL_BASE,
  GEM_TYPES,
  GOLD_POOL,
  PHASES,
  PLAYER_TYPES,
  VERSION,
} from '../constants.js';
import { generateCardsByLevel } from '../data/card-generator.js';
import { NOBLES } from '../data/nobles.js';
import { clone, createStateSnapshot } from '../utils/clone.js';
import { createRandom, normalizeSeed, shuffle } from '../utils/random.js';
import { validateImportedState } from './state-validator.js';

function emptyGems() {
  return Object.fromEntries(ALL_GEM_TYPES.map((gem) => [gem, 0]));
}

function normalizeNoble(noble) {
  return {
    ...clone(noble),
    points: noble.points ?? 3,
    cost: Object.fromEntries(GEM_TYPES.map((gem) => [gem, noble.cost?.[gem] ?? 0])),
  };
}

function normalizeController(config = {}) {
  if (config.type !== PLAYER_TYPES.AI) return { type: PLAYER_TYPES.HUMAN, difficulty: null };
  const difficulty = Object.values(AI_LEVELS).includes(config.difficulty)
    ? config.difficulty
    : AI_LEVELS.RANDOM;
  return { type: PLAYER_TYPES.AI, difficulty };
}

export function createGameState(playerNames, options = {}) {
  if (!Array.isArray(playerNames) || playerNames.length < 2 || playerNames.length > 4) {
    throw new Error('玩家人数必须为 2 至 4 人');
  }
  const seed = normalizeSeed(options.seed ?? Date.now());
  const cardsByLevel = options.cardsByLevel ?? generateCardsByLevel(seed);
  const decks = clone(cardsByLevel);
  const market = { 1: [], 2: [], 3: [] };
  for (const level of [1, 2, 3]) {
    market[level] = decks[level].splice(Math.max(0, decks[level].length - 4));
  }
  const random = createRandom(seed ^ 0x9e3779b9);
  const nobleSource = options.nobles ?? shuffle(NOBLES, random).slice(0, playerNames.length + 1);
  const base = GEM_POOL_BASE[playerNames.length];
  const playerConfigs = options.playerConfigs ?? [];
  const snapshotLimit = Number.isInteger(options.snapshotLimit) && options.snapshotLimit >= 0
    ? options.snapshotLimit
    : null;

  const state = {
    schemaVersion: 1,
    gameVersion: VERSION,
    seed,
    players: playerNames.map((name, index) => ({
      id: `player-${index + 1}`,
      name: String(name || `玩家${index + 1}`).trim().slice(0, 12),
      controller: normalizeController(playerConfigs[index]),
      gems: emptyGems(),
      cards: [],
      reserved: [],
      nobles: [],
      actionCount: 0,
    })),
    tokenPool: { white: base, blue: base, green: base, red: base, black: base, gold: GOLD_POOL },
    decks,
    market,
    availableNobles: nobleSource.map(normalizeNoble),
    currentPlayerIndex: 0,
    turnNumber: 1,
    phase: PHASES.AWAITING_ACTION,
    pending: null,
    finalRound: { triggered: false, playerId: null, turnNumber: null },
    gameOver: false,
    historyPolicy: { snapshotLimit },
    actionLog: [],
    snapshots: [],
  };
  if (snapshotLimit !== 0) {
    state.snapshots.push({ reason: 'GAME_CREATED', state: createStateSnapshot(state) });
  }
  return state;
}

export function currentPlayer(state) {
  return state.players[state.currentPlayerIndex];
}

export function exportGameState(state) {
  return JSON.stringify(state);
}

export function importGameState(serialized) {
  if (typeof serialized === 'string' && serialized.length > 1_000_000) {
    throw new Error('存档文件过大');
  }
  const state = typeof serialized === 'string' ? JSON.parse(serialized) : clone(serialized);
  validateImportedState(state);
  for (const player of state.players) {
    player.controller ??= { type: PLAYER_TYPES.HUMAN, difficulty: null };
  }
  state.historyPolicy ??= { snapshotLimit: null };
  return state;
}
