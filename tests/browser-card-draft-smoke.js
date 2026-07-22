const result = document.getElementById('result');
const frame = document.getElementById('game-frame');
const wait = (duration = 60) => new Promise((resolve) => setTimeout(resolve, duration));

frame.addEventListener('load', async () => {
  try {
    const doc = frame.contentDocument;
    await wait(); doc.getElementById('setup-form').requestSubmit(); await wait();
    const card = doc.querySelector('.development-card.is-legal');
    if (!card) throw new Error('未找到可操作市场卡');
    card.click(); await wait();
    const before = JSON.parse(frame.contentWindow.gemMerchant.exportState());
    if (before.actionLog.length !== 0) throw new Error('点击卡牌不应立即提交动作');
    const draft = doc.querySelector('.draft-card-preview');
    if (!draft || !draft.textContent.includes('已选择')) throw new Error('未显示卡牌草稿与支付预览');
    const confirm = draft.querySelector('[data-command="confirm-selection"]');
    if (!confirm || confirm.disabled) throw new Error('草稿确认按钮不可用');
    confirm.click(); await wait();
    const after = JSON.parse(frame.contentWindow.gemMerchant.exportState());
    if (!after.actionLog.some((entry) => entry.action.type.startsWith('RESERVE_') || entry.action.type.startsWith('BUY_'))) throw new Error('确认后未提交卡牌动作');
    result.textContent = 'PASS: card draft → preview → confirm action'; document.title = 'PASS';
  } catch (error) { result.textContent = `FAIL: ${error.message}`; document.title = 'FAIL'; }
}, { once: true });
