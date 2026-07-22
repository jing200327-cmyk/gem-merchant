import test from 'node:test';
import assert from 'node:assert/strict';
import { AI_LEVELS } from '../js/constants.js';
import { replayGame, simulateBatch, simulateGame } from '../js/simulation/simulator.js';
import { determineWinners } from '../js/engine/scoring.js';

const CONFIG = [AI_LEVELS.RANDOM, AI_LEVELS.GREEDY, AI_LEVELS.PLANNER, AI_LEVELS.RANDOM]
  .map((difficulty, index) => ({ name: `AI-${index + 1}`, type: 'AI', difficulty }));

test('四 AI 对局能结束并可由日志完整复盘', () => {
  const result = simulateGame({ playerConfigs: CONFIG, seed: 20260722, maxRounds: 200 });
  assert.equal(result.state.gameOver, true);
  assert.ok(result.state.actionLog.length > 0);
  const replayed = replayGame(result.initialState, result.state.actionLog);
  assert.deepEqual(determineWinners(replayed).map((player) => player.id), determineWinners(result.state).map((player) => player.id));
  assert.deepEqual(replayed.players.map((player) => player.actionCount), result.state.players.map((player) => player.actionCount));
});

test('AI 不会因占满三个预留位而在空宝石池中死锁', () => {
  for (const seed of [20260846, 20265106]) {
    const result = simulateGame({ playerConfigs: CONFIG, seed, maxRounds: 200, snapshotLimit: 0 });
    assert.equal(result.state.gameOver, true);
  }
});

test('相同种子和 AI 配置产生完全相同的动作序列', () => {
  const first = simulateGame({ playerConfigs: CONFIG, seed: 99 });
  const second = simulateGame({ playerConfigs: CONFIG, seed: 99 });
  assert.deepEqual(first.state.actionLog.map((entry) => entry.action), second.state.actionLog.map((entry) => entry.action));
});

test('批量模拟汇总对局长度、卡牌、贵族、预留、黄金、先手和难度胜率', () => {
  const report = simulateBatch({ games: 20, playerConfigs: CONFIG, baseSeed: 700 });
  assert.equal(report.games, 20);
  assert.equal(report.completedGames, 20);
  assert.equal(report.errorGames, 0);
  assert.ok(report.averageRounds > 0);
  assert.ok(report.cardPurchasesByLevel[1] >= 0);
  assert.ok(report.cardPurchasesByColor.white >= 0);
  assert.ok(report.noblesAwarded >= 0);
  assert.ok(report.reserveActionRate >= 0);
  assert.ok(report.goldUsageRate >= 0);
  assert.ok(report.firstPlayerWinRate >= 0);
  assert.deepEqual(report.firstSeatGamesByDifficulty, { RANDOM: 10, GREEDY: 5, PLANNER: 5 });
  assert.ok(report.winRateByDifficulty[AI_LEVELS.RANDOM] >= 0);
  assert.ok(report.tieRate >= 0);
});

