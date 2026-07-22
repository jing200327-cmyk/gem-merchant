import { ACTION_TYPES, AI_LEVELS, GEM_TYPES } from '../constants.js';
import { determineWinners } from '../engine/scoring.js';
import { playerPrestige } from '../engine/rules.js';

const MAIN_ACTIONS = new Set([
  ACTION_TYPES.TAKE_DIFFERENT_GEMS, ACTION_TYPES.TAKE_SAME_GEMS,
  ACTION_TYPES.BUY_MARKET_CARD, ACTION_TYPES.BUY_RESERVED_CARD,
  ACTION_TYPES.RESERVE_MARKET_CARD, ACTION_TYPES.RESERVE_DECK_CARD,
]);

export function createStatistics(totalGames) {
  const difficultyMap = () => Object.fromEntries(Object.values(AI_LEVELS).map((level) => [level, 0]));
  return {
    games: totalGames, completedGames: 0, errorGames: 0, noLegalActionGames: 0, infiniteGameGuards: 0,
    totalRounds: 0, shortestGame: null, longestGame: 0, totalFinalScore: 0, totalPlayerSeats: 0,
    totalWinningScore: 0, cardPurchasesByLevel: { 1: 0, 2: 0, 3: 0 },
    cardPurchasesByColor: Object.fromEntries(GEM_TYPES.map((gem) => [gem, 0])),
    noblesAwarded: 0, reserveActions: 0, mainActions: 0, goldSpent: 0, cardPurchases: 0,
    firstPlayerWinCredits: 0, winCreditsByDifficulty: difficultyMap(), seatsByDifficulty: difficultyMap(),
    firstSeatsByDifficulty: difficultyMap(), tiedGames: 0,
  };
}

export function collectGame(statistics, state) {
  const rounds = Math.max(...state.players.map((player) => player.actionCount));
  const winners = determineWinners(state);
  const winnerCredit = 1 / winners.length;
  const winnerIds = new Set(winners.map((winner) => winner.id));
  statistics.completedGames += 1;
  statistics.totalRounds += rounds;
  statistics.shortestGame = statistics.shortestGame === null ? rounds : Math.min(statistics.shortestGame, rounds);
  statistics.longestGame = Math.max(statistics.longestGame, rounds);
  statistics.totalWinningScore += winners[0].prestige;
  statistics.tiedGames += winners.length > 1 ? 1 : 0;

  state.players.forEach((player, index) => {
    statistics.totalFinalScore += playerPrestige(player);
    statistics.totalPlayerSeats += 1;
    statistics.noblesAwarded += player.nobles.length;
    const difficulty = player.controller?.difficulty;
    if (difficulty) statistics.seatsByDifficulty[difficulty] += 1;
    if (index === 0 && difficulty) statistics.firstSeatsByDifficulty[difficulty] += 1;
    if (winnerIds.has(player.id) && difficulty) statistics.winCreditsByDifficulty[difficulty] += winnerCredit;
    if (index === 0 && winnerIds.has(player.id)) statistics.firstPlayerWinCredits += winnerCredit;
    for (const card of player.cards) {
      statistics.cardPurchasesByLevel[card.level] += 1;
      statistics.cardPurchasesByColor[card.bonus] += 1;
      statistics.cardPurchases += 1;
    }
  });

  for (const entry of state.actionLog) {
    if (MAIN_ACTIONS.has(entry.action.type)) statistics.mainActions += 1;
    if ([ACTION_TYPES.RESERVE_MARKET_CARD, ACTION_TYPES.RESERVE_DECK_CARD].includes(entry.action.type)) statistics.reserveActions += 1;
    for (const event of entry.events) if (event.type === 'CARD_PURCHASED') statistics.goldSpent += event.payment.gold;
  }
}

export function collectError(statistics, error) {
  statistics.errorGames += 1;
  if (error.code === 'NO_LEGAL_ACTION') statistics.noLegalActionGames += 1;
  if (error.code === 'MAX_ROUNDS_EXCEEDED') statistics.infiniteGameGuards += 1;
}

function ratio(numerator, denominator) {
  return denominator ? numerator / denominator : 0;
}

export function finalizeStatistics(statistics, elapsedMs) {
  const completed = statistics.completedGames;
  return {
    games: statistics.games, completedGames: completed, errorGames: statistics.errorGames,
    noLegalActionGames: statistics.noLegalActionGames, infiniteGameGuards: statistics.infiniteGameGuards,
    averageRounds: ratio(statistics.totalRounds, completed), shortestGame: statistics.shortestGame ?? 0,
    longestGame: statistics.longestGame, averageFinalScore: ratio(statistics.totalFinalScore, statistics.totalPlayerSeats),
    averageWinningScore: ratio(statistics.totalWinningScore, completed),
    cardPurchasesByLevel: statistics.cardPurchasesByLevel, cardPurchasesByColor: statistics.cardPurchasesByColor,
    noblesAwarded: statistics.noblesAwarded, nobleFrequencyPerGame: ratio(statistics.noblesAwarded, completed),
    reserveActionRate: ratio(statistics.reserveActions, statistics.mainActions),
    goldUsageRate: ratio(statistics.goldSpent, statistics.cardPurchases),
    firstPlayerWinRate: ratio(statistics.firstPlayerWinCredits, completed),
    firstSeatGamesByDifficulty: statistics.firstSeatsByDifficulty,
    winRateByDifficulty: Object.fromEntries(Object.values(AI_LEVELS).map((level) => [
      level, ratio(statistics.winCreditsByDifficulty[level], statistics.seatsByDifficulty[level]),
    ])),
    tieRate: ratio(statistics.tiedGames, completed), elapsedMs,
    gamesPerSecond: elapsedMs ? statistics.games / (elapsedMs / 1000) : 0,
  };
}
