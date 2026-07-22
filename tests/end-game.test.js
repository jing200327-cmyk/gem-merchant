import test from 'node:test';
import assert from 'node:assert/strict';
import { acknowledgeTurn, finalizeTurn } from '../js/engine/turn-manager.js';
import { determineWinners } from '../js/engine/scoring.js';
import { makeCard, makeNoble, makeState } from './helpers.js';

function addPoints(player, points, cardCount = 1) {
  const perCard = Math.floor(points / cardCount);
  let remainder = points;
  for (let index = 0; index < cardCount; index += 1) {
    const cardPoints = index === cardCount - 1 ? remainder : perCard;
    remainder -= cardPoints;
    player.cards.push(makeCard({ id: `p-${index}`, points: cardPoints }));
  }
}

function finishCurrentTurn(state) {
  const finished = finalizeTurn(state);
  return finished.gameOver ? finished : acknowledgeTurn(finished);
}

for (const scenario of [
  { trigger: 0, remaining: 3 },
  { trigger: 1, remaining: 2 },
  { trigger: 2, remaining: 1 },
  { trigger: 3, remaining: 0 },
]) {
  test(`四人局 ${'ABCD'[scenario.trigger]} 达到 15 分后仅完成当前轮`, () => {
    let state = makeState(['A', 'B', 'C', 'D']);
    for (let index = 0; index < scenario.trigger; index += 1) {
      state.players[index].actionCount = 1;
    }
    state.currentPlayerIndex = scenario.trigger;
    addPoints(state.players[scenario.trigger], 15);

    state = finalizeTurn(state);
    assert.equal(state.finalRound.triggered, true);
    assert.equal(state.gameOver, scenario.remaining === 0);

    for (let step = 0; step < scenario.remaining; step += 1) {
      state = acknowledgeTurn(state);
      state = finalizeTurn(state);
    }
    assert.equal(state.gameOver, true);
    assert.deepEqual(state.players.map((player) => player.actionCount), [1, 1, 1, 1]);
  });
}

test('最后行动玩家可以反超，15 分触发者不一定获胜', () => {
  const state = makeState(['A', 'B']);
  addPoints(state.players[0], 15);
  addPoints(state.players[1], 16);
  const winners = determineWinners(state);
  assert.deepEqual(winners.map((player) => player.name), ['B']);
});

test('同分时购买发展卡更少者获胜，贵族不计入卡牌数量', () => {
  const state = makeState(['A', 'B']);
  addPoints(state.players[0], 12, 4);
  state.players[0].nobles.push(makeNoble('n1', {}, 3));
  addPoints(state.players[1], 15, 5);

  const winners = determineWinners(state);
  assert.deepEqual(winners.map((player) => player.name), ['A']);
});

test('声望和发展卡数量都相同时并列获胜', () => {
  const state = makeState(['A', 'B']);
  addPoints(state.players[0], 15, 4);
  addPoints(state.players[1], 15, 4);

  assert.deepEqual(determineWinners(state).map((player) => player.name), ['A', 'B']);
});
