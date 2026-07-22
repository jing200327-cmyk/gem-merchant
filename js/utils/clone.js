export function clone(value) {
  return structuredClone(value);
}

function clonePending(pending) {
  if (!pending) return null;
  return {
    ...pending,
    ...(pending.nobleIds ? { nobleIds: [...pending.nobleIds] } : {}),
  };
}

export function cloneStateForTransition(state) {
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      gems: { ...player.gems },
      cards: [...player.cards],
      reserved: [...player.reserved],
      nobles: [...player.nobles],
    })),
    tokenPool: { ...state.tokenPool },
    decks: { 1: [...state.decks[1]], 2: [...state.decks[2]], 3: [...state.decks[3]] },
    market: { 1: [...state.market[1]], 2: [...state.market[2]], 3: [...state.market[3]] },
    availableNobles: [...state.availableNobles],
    pending: clonePending(state.pending),
    finalRound: { ...state.finalRound },
    historyPolicy: { ...state.historyPolicy },
    actionLog: [...state.actionLog],
    snapshots: [...state.snapshots],
  };
}

export function createStateSnapshot(state) {
  const snapshot = cloneStateForTransition(state);
  snapshot.actionLog = [];
  snapshot.snapshots = [];
  return snapshot;
}
