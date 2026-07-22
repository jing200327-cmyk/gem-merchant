import { ACTION_TYPES, ALL_GEM_TYPES, PHASES, PLAYER_TYPES, VERSION } from '../constants.js';
import { getLegalActions } from '../engine/rules.js';
import { createGemToken, createNobleElement } from './components.js';
import { gemDraftAction, paymentPreview } from './interaction-model.js';
import { renderMarket } from './market-view.js';
import { renderOverlay } from './overlay-view.js';
import { renderOpponents, renderPlayerPanel } from './player-view.js';
import { gemIconMarkup, PLAYER_COLORS } from './view-helpers.js';

const ACTION_LABELS = {
  TAKE_DIFFERENT_GEMS: '拿取了不同颜色的宝石',
  TAKE_SAME_GEMS: '拿取了两枚同色宝石',
  BUY_MARKET_CARD: '购买了一张市场卡',
  BUY_RESERVED_CARD: '购买了一张预留卡',
  RESERVE_MARKET_CARD: '预定了一张市场卡',
  RESERVE_DECK_CARD: '从牌堆预定了一张卡',
  RETURN_GEMS: '归还了超额宝石',
  CHOOSE_NOBLE: '选择了一位贵族',
  ACKNOWLEDGE_TURN: '开始回合',
};

let lastOverlayPhase = null;

function selectedCard(state, ui) {
  if (!ui.selectedCard) return null;
  const { source, level, index } = ui.selectedCard;
  return source === 'reserved'
    ? state.players[state.currentPlayerIndex].reserved[index] ?? null
    : state.market[level]?.[index] ?? null;
}

function renderNobles(state, ui, legalActions) {
  const container = document.getElementById('nobles');
  const legalIds = new Set(legalActions.filter((action) => action.type === ACTION_TYPES.CHOOSE_NOBLE).map((action) => action.nobleId));
  container.replaceChildren(...state.availableNobles.map((noble) => createNobleElement(noble, {
    legal: legalIds.has(noble.id), selected: ui.selectedNobleId === noble.id,
  })));
  if (!state.availableNobles.length) container.textContent = '所有贵族均已到访';
}

function canAddGem(legalActions, draft, gem, intent) {
  const next = { ...draft };
  if (intent === 'take-same') next[gem] = Math.min(2, (next[gem] ?? 0) + 1);
  else next[gem] = 1;
  return legalActions.some((action) => {
    if (action.type === ACTION_TYPES.TAKE_SAME_GEMS) return intent === 'take-same' && action.gem === gem;
    if (action.type !== ACTION_TYPES.TAKE_DIFFERENT_GEMS || intent !== 'take-different') return false;
    return Object.entries(next).every(([color, count]) => count === 1 && action.gems.includes(color));
  });
}

function renderTokens(state, ui, legalActions, humanControlled) {
  const bank = document.getElementById('token-pool');
  const selectable = (gem) => humanControlled && state.phase === PHASES.AWAITING_ACTION && gem !== 'gold'
    && Boolean(ui.intent?.startsWith('take')) && state.tokenPool[gem] > 0
    && (ui.gemDraft[gem] > 0 || canAddGem(legalActions, ui.gemDraft, gem, ui.intent));
  bank.replaceChildren(...ALL_GEM_TYPES.map((gem) => createGemToken(gem, state.tokenPool[gem], {
    selectable: selectable(gem), selectedCount: ui.gemDraft[gem] ?? 0,
  })));
}

function renderCardDraft(state, ui) {
  const card = selectedCard(state, ui);
  if (!card) return '';
  const preview = paymentPreview(state.players[state.currentPlayerIndex], card);
  const line = (label, values) => `<span><small>${label}</small>${Object.entries(values).filter(([, value]) => value > 0).map(([gem, value]) => `${gemIconMarkup(gem, 'draft-gem-icon')}${value}`).join(' ') || '—'}</span>`;
  const actions = ui.selectedCard.actions;
  const buttons = [];
  if (actions.some((action) => action.type === ACTION_TYPES.BUY_MARKET_CARD || action.type === ACTION_TYPES.BUY_RESERVED_CARD)) buttons.push('<button class="button button-primary" type="button" data-draft-action="buy">购买</button>');
  if (actions.some((action) => action.type === ACTION_TYPES.RESERVE_MARKET_CARD)) buttons.push('<button class="button button-primary" type="button" data-draft-action="reserve">预定</button>');
  const selected = ui.pendingAction;
  return `<div class="draft-card-preview"><strong>已选择 ${card.level} 级卡 · ★ ${card.points}</strong><div class="payment-preview">${line('原始成本', preview.originalCost)}${line('折扣后', preview.discountedCost)}${line('支付', preview.payment)}${line('剩余', preview.remaining)}</div><p>${preview.affordable ? '支付方案已计算；黄金将自动补足缺口。' : '当前宝石不足，仍可预定此卡。'}</p><div class="draft-options">${buttons.join('')}</div><div class="dialog-actions"><button class="button button-quiet" type="button" data-command="cancel-intent">取消</button><button class="button button-primary" type="button" data-command="confirm-selection" ${selected ? '' : 'disabled'}>确认${selected?.type?.startsWith('RESERVE') ? '预定' : '购买'}</button></div></div>`;
}

function renderActions(state, ui, legalActions) {
  const player = state.players[state.currentPlayerIndex];
  const humanControlled = player.controller?.type !== PLAYER_TYPES.AI;
  const actionTypes = new Set(legalActions.map((action) => action.type));
  document.querySelectorAll('[data-intent]').forEach((button) => {
    const intent = button.dataset.intent;
    const supported = intent === 'take-different' ? actionTypes.has(ACTION_TYPES.TAKE_DIFFERENT_GEMS)
      : intent === 'take-same' ? actionTypes.has(ACTION_TYPES.TAKE_SAME_GEMS)
        : intent === 'buy' ? actionTypes.has(ACTION_TYPES.BUY_MARKET_CARD) || actionTypes.has(ACTION_TYPES.BUY_RESERVED_CARD)
          : actionTypes.has(ACTION_TYPES.RESERVE_MARKET_CARD) || actionTypes.has(ACTION_TYPES.RESERVE_DECK_CARD);
    button.disabled = !humanControlled || state.phase !== PHASES.AWAITING_ACTION || !supported || Boolean(ui.selectedCard);
    button.classList.toggle('is-active', ui.intent === intent);
    button.setAttribute('aria-pressed', String(ui.intent === intent));
  });
  const controls = document.getElementById('selection-controls');
  const summary = document.getElementById('selection-summary');
  const confirm = document.getElementById('confirm-selection');
  if (ui.selectedCard) {
    controls.hidden = false; summary.innerHTML = renderCardDraft(state, ui); confirm.hidden = true; return;
  }
  if (ui.selectedNobleId) {
    controls.hidden = false; summary.innerHTML = '<div class="draft-card-preview"><strong>已选择贵族</strong><p>确认后获得该贵族，本回合最多一位。</p><div class="dialog-actions"><button class="button button-quiet" type="button" data-command="cancel-intent">取消</button><button class="button button-primary" type="button" data-command="confirm-noble">确认选择</button></div></div>'; confirm.hidden = true; return;
  }
  if (ui.pendingAction?.type === ACTION_TYPES.RESERVE_DECK_CARD) {
    controls.hidden = false; summary.innerHTML = `<div class="draft-card-preview"><strong>预定未知的 ${ui.pendingAction.level} 级发展卡</strong><p>将从牌堆顶抽取一张卡；若黄金仍有库存，规则引擎会自动给予一枚黄金。</p><div class="dialog-actions"><button class="button button-quiet" type="button" data-command="cancel-intent">取消</button><button class="button button-primary" type="button" data-command="confirm-selection">确认预定</button></div></div>`; confirm.hidden = true; return;
  }
  const gemAction = gemDraftAction(legalActions, ui.gemDraft);
  controls.hidden = !ui.intent || !humanControlled;
  confirm.hidden = !ui.intent?.startsWith('take');
  confirm.disabled = !gemAction;
  summary.textContent = ui.intent === 'take-different'
    ? `已选择 ${Object.values(ui.gemDraft).reduce((sum, count) => sum + count, 0)} / 3 种宝石`
    : ui.intent === 'take-same' ? `已选择同色 ${Object.values(ui.gemDraft)[0] ?? 0} / 2 枚` : '点击一张带有绿色或金色边框的卡牌。';
}

function renderLog(state) {
  const log = document.getElementById('action-log');
  const entries = state.actionLog.slice(-10).reverse();
  log.replaceChildren(...entries.map((entry) => {
    const player = state.players.find((candidate) => candidate.id === entry.playerId);
    const item = document.createElement('li');
    item.textContent = `第 ${entry.turnNumber} 回合 · ${player?.name ?? '玩家'} · ${ACTION_LABELS[entry.action.type] ?? entry.action.type}`;
    return item;
  }));
  if (!entries.length) log.textContent = '尚无行动记录';
  document.getElementById('snapshot-count').textContent = `${state.snapshots.length} 个快照`;
}

export function render(state, ui) {
  if (!state) return;
  const player = state.players[state.currentPlayerIndex];
  const isAi = player.controller?.type === PLAYER_TYPES.AI;
  const legalActions = getLegalActions(state, player.id);
  document.getElementById('version-badge').textContent = `种子 ${state.seed} · 第 ${state.turnNumber} 回合 · ${state.phase}`;
  const opponents = document.getElementById('opponents'); opponents.replaceChildren(renderOpponents(state));
  renderNobles(state, ui, legalActions);
  document.getElementById('market').replaceChildren(renderMarket(state, ui, legalActions));
  renderTokens(state, ui, legalActions, !isAi);
  const panel = document.getElementById('player-panel'); panel.style.setProperty('--player-color', PLAYER_COLORS[state.currentPlayerIndex]); panel.replaceChildren(renderPlayerPanel(state, ui, legalActions));
  document.getElementById('market-hint').textContent = isAi ? 'AI 正在从合法行动中决策' : state.phase === PHASES.RETURNING_GEMS ? '宝石超过上限，请在玩家区域选择归还' : ui.selectedCard ? '确认购买或预定前可随时取消' : '绿色边框可购买，金色边框可预定';
  renderActions(state, ui, legalActions); renderLog(state);
  const overlay = document.getElementById('phase-overlay'); const html = renderOverlay(state, ui); const focus = html && state.phase !== lastOverlayPhase;
  overlay.innerHTML = html; overlay.hidden = !html; lastOverlayPhase = html ? state.phase : null;
  if (focus) overlay.querySelector('button:not(:disabled)')?.focus();
}
