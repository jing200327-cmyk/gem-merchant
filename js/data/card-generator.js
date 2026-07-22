import { GEM_TYPES } from '../constants.js';
import { createRandom, shuffle } from '../utils/random.js';

const LEVEL_SPECS = {
  1: [[1, 6, 0], [2, 8, 0], [2, 3, 1], [3, 10, 0], [3, 4, 1], [4, 5, 0], [4, 4, 1]],
  2: [[5, 8, 1], [5, 3, 2], [6, 8, 1], [6, 4, 2], [7, 5, 2], [7, 2, 3]],
  3: [[7, 4, 3], [8, 4, 3], [9, 4, 4], [10, 4, 4], [11, 2, 5], [12, 2, 5]],
};

function generateCard(level, costTotal, points, id, random) {
  const cost = Object.fromEntries(GEM_TYPES.map((gem) => [gem, 0]));
  const colors = shuffle(GEM_TYPES, random);
  const requested = costTotal <= 3 ? 1 + Math.floor(random() * 2) : 2 + Math.floor(random() * 3);
  const usedColors = colors.slice(0, Math.min(requested, GEM_TYPES.length, costTotal));
  let remaining = costTotal;
  for (const gem of usedColors) {
    cost[gem] = 1;
    remaining -= 1;
  }
  while (remaining > 0) {
    cost[usedColors[Math.floor(random() * usedColors.length)]] += 1;
    remaining -= 1;
  }
  return {
    id,
    level,
    cost,
    bonus: GEM_TYPES[Math.floor(random() * GEM_TYPES.length)],
    points,
  };
}

export function generateCardsByLevel(seed = Date.now()) {
  const random = createRandom(seed);
  const cardsByLevel = { 1: [], 2: [], 3: [] };
  for (const level of [1, 2, 3]) {
    let index = 0;
    for (const [costTotal, count, points] of LEVEL_SPECS[level]) {
      for (let copy = 0; copy < count; copy += 1) {
        cardsByLevel[level].push(generateCard(level, costTotal, points, `l${level}-${index}`, random));
        index += 1;
      }
    }
    cardsByLevel[level] = shuffle(cardsByLevel[level], random);
  }
  return cardsByLevel;
}
