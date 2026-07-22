const result = document.getElementById('result');
const frame = document.getElementById('game-frame');
const wait = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));
frame.addEventListener('load', async () => {
  try {
    const doc = frame.contentDocument;
    await wait(); doc.getElementById('setup-form').requestSubmit(); await wait();
    const playerTop = doc.getElementById('player-panel').getBoundingClientRect().top;
    const actionTop = doc.querySelector('.action-panel').getBoundingClientRect().top;
    const log = doc.getElementById('action-log');
    const logScrollable = ['auto', 'scroll'].includes(getComputedStyle(log).overflowY);
    if (playerTop >= doc.documentElement.clientHeight || actionTop >= doc.documentElement.clientHeight || !logScrollable) throw new Error(`Fold failed: player ${Math.round(playerTop)}, action ${Math.round(actionTop)}, viewport ${doc.documentElement.clientHeight}, log ${getComputedStyle(log).overflowY}`);
    result.textContent = 'PASS: turn assets and actions are in the first fold'; document.title = 'PASS';
  } catch (error) { result.textContent = `FAIL: ${error.message}`; document.title = 'FAIL'; }
}, { once: true });
