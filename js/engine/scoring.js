import { playerPrestige } from './rules.js';

export function rankPlayers(state) {
  return state.players
    .map((player, seat) => ({
      ...player,
      seat,
      prestige: playerPrestige(player),
      purchasedCardCount: player.cards.length,
    }))
    .sort((left, right) => (
      right.prestige - left.prestige
      || left.purchasedCardCount - right.purchasedCardCount
      || left.seat - right.seat
    ));
}

export function determineWinners(state) {
  const ranking = rankPlayers(state);
  if (!ranking.length) return [];
  const best = ranking[0];
  return ranking.filter((player) => (
    player.prestige === best.prestige
    && player.purchasedCardCount === best.purchasedCardCount
  ));
}
