import test from 'node:test';
import assert from 'node:assert/strict';
import { importGameState } from '../js/engine/game-state.js';
import { makeState } from './helpers.js';

test('导入拒绝与状态机阶段矛盾的 pending 数据', () => {
  const state = makeState();
  state.phase = 'RETURNING_GEMS';
  state.pending = null;
  assert.throws(() => importGameState(JSON.stringify(state)), /存档内容无效/);
});

test('导入拒绝 gameOver 与阶段不一致的状态', () => {
  const state = makeState();
  state.gameOver = true;
  assert.throws(() => importGameState(JSON.stringify(state)), /存档内容无效/);
});
