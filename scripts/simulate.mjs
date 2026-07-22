import { AI_LEVELS } from '../js/constants.js';
import { simulateBatch } from '../js/simulation/simulator.js';

function argument(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((value) => value.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

const games = Number.parseInt(argument('games', '1000'), 10);
const baseSeed = Number.parseInt(argument('seed', '20260722'), 10);
const maxRounds = Number.parseInt(argument('max-rounds', '200'), 10);
const snapshotLimit = Number.parseInt(argument('snapshot-limit', '1'), 10);
const requestedLevels = argument('levels', 'RANDOM,GREEDY,PLANNER,RANDOM').split(',');
const playerConfigs = requestedLevels.map((value, index) => ({
  name: `AI-${index + 1}`,
  type: 'AI',
  difficulty: AI_LEVELS[value.toUpperCase()] ?? AI_LEVELS.RANDOM,
}));

const report = simulateBatch({ games, playerConfigs, baseSeed, maxRounds, snapshotLimit });
console.log(JSON.stringify(report, null, 2));
if (report.errorGames > 0) process.exitCode = 1;
