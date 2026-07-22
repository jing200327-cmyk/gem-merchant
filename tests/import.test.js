import test from 'node:test';
import assert from 'node:assert/strict';
import { exportGameState, importGameState } from '../js/engine/game-state.js';
import { makeState } from './helpers.js';

test('正式导出的状态可以无损导入', () => {
  const state = makeState();
  assert.deepEqual(importGameState(exportGameState(state)), state);
});

test('导入拒绝可篡改样式或破坏状态机的字段', () => {
  const state = makeState();
  state.market[1].push({
    id: 'bad', level: 1, points: 0, bonus: 'white onmouseover=alert(1)',
    cost: { white: 0, blue: 0, green: 0, red: 0, black: 0 },
  });
  assert.throws(() => importGameState(JSON.stringify(state)), /存档内容无效/);
});

test('导入拒绝超过 1MB 的存档', () => {
  assert.throws(() => importGameState(`{"padding":"${'x'.repeat(1_000_000)}"}`), /存档文件过大/);
});
