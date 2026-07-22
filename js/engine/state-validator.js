import { AI_LEVELS, PHASES, PLAYER_TYPES } from '../constants.js';
import { validateImportedState as validateShape } from './state-shape-validator.js';

function assert(condition, message = '存档内容无效') {
  if (!condition) throw new Error(message);
}

function validateController(controller) {
  if (controller === undefined) return;
  assert(controller && Object.values(PLAYER_TYPES).includes(controller.type));
  if (controller.type === PLAYER_TYPES.AI) {
    assert(Object.values(AI_LEVELS).includes(controller.difficulty));
  } else {
    assert(controller.difficulty === null);
  }
}

function validatePhaseInvariant(state) {
  assert(Boolean(state.gameOver) === (state.phase === PHASES.GAME_OVER));
  assert(state.finalRound && typeof state.finalRound.triggered === 'boolean');
  assert(state.finalRound.playerId === null
    || state.players.some((player) => player.id === state.finalRound.playerId));
  assert(state.finalRound.turnNumber === null
    || (Number.isInteger(state.finalRound.turnNumber) && state.finalRound.turnNumber > 0));

  if (state.phase === PHASES.RETURNING_GEMS) {
    assert(Number.isInteger(state.pending?.returnCount)
      && state.pending.returnCount > 0
      && state.pending.returnCount <= 10);
  } else if (state.phase === PHASES.CHOOSING_NOBLE) {
    assert(Array.isArray(state.pending?.nobleIds) && state.pending.nobleIds.length > 1);
    const availableIds = new Set(state.availableNobles.map((noble) => noble.id));
    assert(state.pending.nobleIds.every((id) => availableIds.has(id)));
  } else if (state.phase === PHASES.TURN_TRANSITION) {
    assert(state.pending?.nextPlayerId === state.players[state.currentPlayerIndex].id);
  } else {
    assert(state.pending === null);
  }
}

export function validateImportedState(state) {
  validateShape(state);
  assert(Number.isInteger(state.seed) && state.seed > 0);
  assert(typeof state.gameVersion === 'string' && state.gameVersion.length <= 20);
  state.players.forEach((player) => validateController(player.controller));
  if (state.historyPolicy !== undefined) {
    const limit = state.historyPolicy?.snapshotLimit;
    assert(limit === null || (Number.isInteger(limit) && limit >= 0 && limit <= 1000));
  }
  validatePhaseInvariant(state);
  for (const snapshot of state.snapshots) {
    assert(snapshot && typeof snapshot.reason === 'string' && snapshot.reason.length <= 64);
    assert(snapshot.state && typeof snapshot.state === 'object');
    validateShape({ ...snapshot.state, snapshots: [] });
  }
  return state;
}
