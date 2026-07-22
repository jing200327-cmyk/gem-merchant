import { PHASES, WIN_SCORE } from '../constants.js';
import { cloneStateForTransition } from '../utils/clone.js';
import { playerPrestige } from './rules.js';

function actionCountsAreEqual(players) {
  return players.every((player) => player.actionCount === players[0].actionCount);
}

export function finalizeTurnInPlace(state) {
  const player = state.players[state.currentPlayerIndex];
  if (state.gameOver) throw new Error('游戏已经结束');

  if (!state.finalRound.triggered && playerPrestige(player) >= WIN_SCORE) {
    state.finalRound = {
      triggered: true,
      playerId: player.id,
      turnNumber: state.turnNumber,
    };
  }

  player.actionCount += 1;
  state.pending = null;

  if (state.finalRound.triggered && actionCountsAreEqual(state.players)) {
    state.gameOver = true;
    state.phase = PHASES.GAME_OVER;
    return state;
  }

  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  state.turnNumber += 1;
  state.phase = PHASES.TURN_TRANSITION;
  state.pending = { nextPlayerId: state.players[state.currentPlayerIndex].id };
  return state;
}

export function finalizeTurn(state) {
  return finalizeTurnInPlace(cloneStateForTransition(state));
}

export function acknowledgeTurnInPlace(state) {
  if (state.phase !== PHASES.TURN_TRANSITION) {
    throw new Error('当前阶段不允许开始下一回合');
  }
  state.phase = PHASES.AWAITING_ACTION;
  state.pending = null;
  return state;
}

export function acknowledgeTurn(state) {
  return acknowledgeTurnInPlace(cloneStateForTransition(state));
}
