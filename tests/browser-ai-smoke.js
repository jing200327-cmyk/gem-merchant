const result = document.getElementById('result');
const frame = document.getElementById('game-frame');
const wait = (duration = 50) => new Promise((resolve) => setTimeout(resolve, duration));

frame.addEventListener('load', async () => {
  try {
    const doc = frame.contentDocument;
    await wait();
    const count = doc.getElementById('player-count');
    count.value = '2';
    count.dispatchEvent(new Event('change', { bubbles: true }));
    const rows = doc.querySelectorAll('[data-player-row]');
    if (rows.length !== 2) throw new Error('双人席位配置未渲染');
    const aiType = rows[1].querySelector('[data-player-type]');
    aiType.value = 'AI';
    aiType.dispatchEvent(new Event('change', { bubbles: true }));
    rows[1].querySelector('[data-ai-level]').value = 'GREEDY';
    doc.getElementById('setup-form').requestSubmit();
    await wait();

    doc.querySelector('[data-intent="take-different"]').click();
    for (const gem of ['white', 'blue', 'green']) doc.querySelector(`[data-gem="${gem}"]`).click();
    doc.getElementById('confirm-selection').click();
    await wait(900);

    const saved = JSON.parse(frame.contentWindow.gemMerchant.exportState());
    const actionTypes = saved.actionLog.map((entry) => entry.action.type);
    if (!actionTypes.includes('ACKNOWLEDGE_TURN')) throw new Error('AI 未确认回合');
    const aiMain = saved.actionLog.find((entry) => entry.playerId === 'player-2' && entry.action.type !== 'ACKNOWLEDGE_TURN');
    if (!aiMain) throw new Error('AI 未执行主要行动');
    result.textContent = `PASS: human → AI acknowledge → ${aiMain.action.type}`;
    document.title = 'PASS';
  } catch (error) {
    result.textContent = `FAIL: ${error.message}`;
    document.title = 'FAIL';
  }
}, { once: true });
