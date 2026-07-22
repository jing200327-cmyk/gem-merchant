import { AI_LEVELS, PLAYER_TYPES } from '../constants.js';
import { chooseAiAction } from '../ai/ai-controller.js';
import { performAction } from '../engine/actions.js';
import { createGameState } from '../engine/game-state.js';
import { clone } from '../utils/clone.js';
import { collectError, collectGame, createStatistics, finalizeStatistics } from './statistics.js';

export class SimulationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function normalizeConfigs(playerConfigs) {
  if (!Array.isArray(playerConfigs) || playerConfigs.length < 2 || playerConfigs.length > 4) {
    throw new Error('模拟器需要 2 至 4 个 AI 席位');
  }
  return playerConfigs.map((config, index) => ({
    name: config.name || `AI-${index + 1}`,
    type: PLAYER_TYPES.AI,
    difficulty: Object.values(AI_LEVELS).includes(config.difficulty) ? config.difficulty : AI_LEVELS.RANDOM,
  }));
}

function rotateConfigs(playerConfigs, offset) {
  const normalized = normalizeConfigs(playerConfigs);
  const rotation = offset % normalized.length;
  return normalized.map((_, index) => normalized[(index + rotation) % normalized.length]);
}

export function simulateGame({ playerConfigs, seed = 1, maxRounds = 200, snapshotLimit = 1 } = {}) {
  const configs = normalizeConfigs(playerConfigs);
  let state = createGameState(configs.map((config) => config.name), { seed, playerConfigs: configs, snapshotLimit });
  const initialState = clone(state);
  const maximumSteps = maxRounds * configs.length * 5;
  let steps = 0;

  while (!state.gameOver) {
    if (steps >= maximumSteps || Math.max(...state.players.map((player) => player.actionCount)) >= maxRounds) {
      throw new SimulationError('MAX_ROUNDS_EXCEEDED', `对局超过 ${maxRounds} 轮`);
    }
    const player = state.players[state.currentPlayerIndex];
    const action = chooseAiAction(state, player.id, player.controller.difficulty);
    if (!action) throw new SimulationError('NO_LEGAL_ACTION', `${player.name} 在 ${state.phase} 没有合法动作`);
    state = performAction(state, action);
    steps += 1;
  }
  return { initialState, state, steps };
}

export function replayGame(initialState, actionLog) {
  let state = clone(initialState);
  for (const entry of actionLog) state = performAction(state, entry.action);
  return state;
}

export function simulateBatch({
  games = 100,
  playerConfigs,
  baseSeed = 1,
  maxRounds = 200,
  snapshotLimit = 1,
  rotateSeats = true,
} = {}) {
  const statistics = createStatistics(games);
  const startedAt = performance.now();
  for (let index = 0; index < games; index += 1) {
    try {
      const configs = rotateSeats ? rotateConfigs(playerConfigs, index) : playerConfigs;
      const result = simulateGame({
        playerConfigs: configs,
        seed: (baseSeed + index) >>> 0 || 1,
        maxRounds,
        snapshotLimit,
      });
      collectGame(statistics, result.state);
    } catch (error) {
      collectError(statistics, error);
    }
  }
  return finalizeStatistics(statistics, performance.now() - startedAt);
}
