
const result = document.getElementById('result');
const frame = document.getElementById('game-frame');
const wait = (duration = 50) => new Promise((resolve) => setTimeout(resolve, duration));

frame.addEventListener('load', async () => {
  try {
    const doc = frame.contentDocument;
    await wait();
    if (doc.querySelectorAll('[data-player-name]').length !== 3) throw new Error('设置表单未初始化');
    doc.getElementById('setup-form').requestSubmit();
    await wait();
    if (doc.getElementById('game').hidden) throw new Error('游戏主界面未显示');
    doc.querySelector('[data-intent="take-different"]').click();
    await wait();
    for (const gem of ['white', 'blue', 'green']) {
      doc.querySelector(`[data-gem="${gem}"]`).click();
      await wait();
    }
    doc.getElementById('confirm-selection').click();
    await wait();
    if (doc.getElementById('phase-overlay').hidden) throw new Error('回合遮罩未显示');
    if (!doc.getElementById('action-log').textContent.includes('拿取了不同颜色的宝石')) throw new Error('动作日志未记录');
    result.textContent = 'PASS: setup → take gems → turn transition → action log';
    document.title = 'PASS';
  } catch (error) {
    result.textContent = `FAIL: ${error.message}`;
    document.title = 'FAIL';
  }
}, { once: true });

