import { createGameState } from '../js/engine/game-state.js';

export function makeCard({
  id = 'card',
  level = 1,
  points = 0,
  bonus = 'white',
  cost = {},
} = {}) {
  return {
    id,
    level,
    points,
    bonus,
    cost: { white: 0, blue: 0, green: 0, red: 0, black: 0, ...cost },
  };
}

export function makeNoble(id, cost, points = 3) {
  return {
    id,
    points,
    cost: { white: 0, blue: 0, green: 0, red: 0, black: 0, ...cost },
  };
}

export function makeState(names = ['A', 'B'], nobles = []) {
  return createGameState(names, {
    seed: 7,
    cardsByLevel: { 1: [], 2: [], 3: [] },
    nobles,
  });
}

export function addBonuses(player, bonuses) {
  for (const [color, count] of Object.entries(bonuses)) {
    for (let index = 0; index < count; index += 1) {
      player.cards.push(makeCard({ id: `${color}-${index}`, bonus: color }));
    }
  }
}
