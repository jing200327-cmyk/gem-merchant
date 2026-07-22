import { PLAYER_TYPES } from '../constants.js';
import { chooseAiAction } from './ai-controller.js';

export function createBrowserAiRunner({ getState, dispatch, onError }) {
  let timer = null;

  function cancel() {
    clearTimeout(timer);
    timer = null;
  }

  function schedule() {
    cancel();
    const state = getState();
    if (!state || state.gameOver) return;
    const player = state.players[state.currentPlayerIndex];
    if (player.controller?.type !== PLAYER_TYPES.AI) return;
    const allAi = state.players.every((candidate) => candidate.controller?.type === PLAYER_TYPES.AI);
    timer = setTimeout(() => {
      const current = getState();
      if (!current || current.gameOver) return;
      const active = current.players[current.currentPlayerIndex];
      if (active.id !== player.id || active.controller?.type !== PLAYER_TYPES.AI) return;
      const action = chooseAiAction(current, active.id, active.controller.difficulty);
      if (!action) {
        onError(`${active.name} 在 ${current.phase} 没有合法动作`);
        return;
      }
      dispatch(action);
    }, allAi ? 35 : 280);
  }

  return { cancel, schedule };
}
