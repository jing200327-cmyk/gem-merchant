
import { ACTION_TYPES, AI_LEVELS, ALL_GEM_TYPES, PHASES, PLAYER_TYPES } from './constants.js';
import { createBrowserAiRunner } from './ai/browser-ai-runner.js';
import { performAction } from './engine/actions.js';
import { createGameState, exportGameState, importGameState } from './engine/game-state.js';
import { createBoard } from './ui/components.js';
import { installEventHandlers } from './ui/event-handlers.js';
import { cardActionOptions, gemDraftAction } from './ui/interaction-model.js';
import { render } from './ui/renderer.js';
import { escapeHtml } from './ui/view-helpers.js';
import { getLegalActions } from './engine/rules.js';

const AI_LEVEL_LABELS = { [AI_LEVELS.RANDOM]: '随机 AI', [AI_LEVELS.GREEDY]: '贪心 AI', [AI_LEVELS.PLANNER]: '规划 AI' };
let state = null;
const ui = { intent: null, gemDraft: {}, returnGems: {}, selectedCard: null, selectedNobleId: null, pendingAction: null };
let toastTimer = null;
let aiRunner = null;

function resetInteraction() {
  ui.intent = null; ui.gemDraft = {}; ui.selectedCard = null; ui.selectedNobleId = null; ui.pendingAction = null;
  ui.returnGems = Object.fromEntries(ALL_GEM_TYPES.map((gem) => [gem, 0]));
}

function showToast(message) {
  const toast = document.getElementById('toast'); toast.textContent = message; toast.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { toast.hidden = true; }, 3500);
}

function update() { render(state, ui); aiRunner?.schedule(); }

function dispatch(action) {
  try {
    state = performAction(state, action); resetInteraction(); update();
  } catch (error) { showToast(error.message); update(); }
}

function currentPlayer() { return state?.players[state.currentPlayerIndex]; }
function isHumanTurn() { return currentPlayer()?.controller?.type !== PLAYER_TYPES.AI; }
function legalActions() { return state ? getLegalActions(state, currentPlayer().id) : []; }

function readPlayerDrafts() {
  return [...document.querySelectorAll('[data-player-row]')].map((row) => ({
    name: row.querySelector('[data-player-name]')?.value,
    type: row.querySelector('[data-player-type]')?.value,
    difficulty: row.querySelector('[data-ai-level]')?.value,
  }));
}

function option(value, label, selected) { return `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`; }

function renderNameFields(count) {
  const container = document.getElementById('player-name-fields'); const drafts = readPlayerDrafts();
  container.innerHTML = Array.from({ length: count }, (_, index) => {
    const draft = drafts[index] ?? {}; const type = draft.type === PLAYER_TYPES.AI ? PLAYER_TYPES.AI : PLAYER_TYPES.HUMAN;
    const difficulty = Object.values(AI_LEVELS).includes(draft.difficulty) ? draft.difficulty : AI_LEVELS.GREEDY;
    return `<div class="player-config-row ${type === PLAYER_TYPES.AI ? 'is-ai' : ''}" data-player-row><label for="player-name-${index}"><span>席位 ${index + 1}</span><input id="player-name-${index}" data-player-name maxlength="12" value="${escapeHtml(draft.name ?? `玩家${index + 1}`)}" autocomplete="off"></label><label><span>控制</span><select data-player-type>${option(PLAYER_TYPES.HUMAN, '真人', type)}${option(PLAYER_TYPES.AI, 'AI', type)}</select></label><label><span>AI 难度</span><select data-ai-level ${type === PLAYER_TYPES.AI ? '' : 'disabled'}>${Object.entries(AI_LEVEL_LABELS).map(([value, label]) => option(value, label, difficulty)).join('')}</select></label></div>`;
  }).join('');
}

function startGame(configs) {
  try {
    const normalized = configs.map((config, index) => ({ name: config.name || `${config.type === PLAYER_TYPES.AI ? 'AI' : '玩家'}${index + 1}`, type: config.type, difficulty: config.difficulty }));
    state = createGameState(normalized.map((config) => config.name), { seed: Date.now(), playerConfigs: normalized });
    resetInteraction(); document.getElementById('setup').hidden = true; document.getElementById('game').hidden = false; update();
  } catch (error) { showToast(error.message); }
}

function selectIntent(intent) {
  if (!state || state.phase !== PHASES.AWAITING_ACTION || !isHumanTurn()) return;
  ui.selectedCard = null; ui.pendingAction = null; ui.selectedNobleId = null;
  ui.intent = ui.intent === intent ? null : intent; ui.gemDraft = {}; update();
}

function selectGem(gem) {
  if (!isHumanTurn() || !ui.intent?.startsWith('take')) return;
  const count = ui.gemDraft[gem] ?? 0;
  if (ui.intent === 'take-same' && count === 1) { ui.gemDraft = { [gem]: 2 }; update(); return; }
  if (count > 0) { delete ui.gemDraft[gem]; update(); return; }
  if (ui.intent === 'take-same') {
    if (!legalActions().some((action) => action.type === ACTION_TYPES.TAKE_SAME_GEMS && action.gem === gem)) { showToast('该颜色当前不能拿取两枚'); return; }
    ui.gemDraft = { [gem]: 1 };
  } else {
    const selected = Object.keys(ui.gemDraft);
    if (selected.length >= 3) { showToast('一次最多选择三种不同颜色'); return; }
    const next = { ...ui.gemDraft, [gem]: 1 };
    const validPrefix = legalActions().some((action) => action.type === ACTION_TYPES.TAKE_DIFFERENT_GEMS && Object.keys(next).every((color) => action.gems.includes(color)));
    if (!validPrefix) { showToast('该宝石不能与当前草稿组合'); return; }
    ui.gemDraft = next;
  }
  update();
}

function selectCard(data) {
  if (!isHumanTurn() || state?.phase !== PHASES.AWAITING_ACTION) return;
  const source = data.cardSource; const level = Number(data.cardLevel); const index = Number(data.cardIndex);
  const options = cardActionOptions(legalActions(), source, level, index);
  if (!options.length) return;
  ui.intent = null; ui.gemDraft = {}; ui.selectedNobleId = null;
  ui.selectedCard = { source, level, index, actions: options };
  ui.pendingAction = options.length === 1 ? options[0] : null;
  update();
}

function chooseDraftAction(kind) {
  if (!ui.selectedCard) return;
  ui.pendingAction = ui.selectedCard.actions.find((action) => (kind === 'buy'
    ? [ACTION_TYPES.BUY_MARKET_CARD, ACTION_TYPES.BUY_RESERVED_CARD].includes(action.type)
    : action.type === ACTION_TYPES.RESERVE_MARKET_CARD)) ?? null;
  update();
}

function reserveDeck(level) {
  if (!isHumanTurn()) return;
  const action = legalActions().find((item) => item.type === ACTION_TYPES.RESERVE_DECK_CARD && item.level === level);
  if (action) { ui.intent = null; ui.selectedCard = null; ui.pendingAction = action; update(); }
}

function adjustReturn(gem, delta) {
  if (state?.phase !== PHASES.RETURNING_GEMS || !isHumanTurn()) return;
  const player = currentPlayer(); const total = Object.values(ui.returnGems).reduce((sum, count) => sum + count, 0); const next = (ui.returnGems[gem] ?? 0) + delta;
  if (next < 0 || next > player.gems[gem] || (delta > 0 && total >= state.pending.returnCount)) return;
  ui.returnGems[gem] = next; update();
}

function chooseNoble(nobleId) {
  if (!isHumanTurn() || state?.phase !== PHASES.CHOOSING_NOBLE) return;
  if (!legalActions().some((action) => action.type === ACTION_TYPES.CHOOSE_NOBLE && action.nobleId === nobleId)) return;
  ui.selectedNobleId = ui.selectedNobleId === nobleId ? null : nobleId; ui.pendingAction = ui.selectedNobleId ? { type: ACTION_TYPES.CHOOSE_NOBLE, nobleId } : null; update();
}

function exportFile() {
  if (!state) return; const blob = new Blob([exportGameState(state)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `gem-merchant-turn-${state.turnNumber}.json`; link.click(); URL.revokeObjectURL(link.href);
}

async function importFile(file) {
  try { if (file.size > 1_000_000) throw new Error('存档文件过大'); state = importGameState(await file.text()); resetInteraction(); document.getElementById('setup').hidden = true; document.getElementById('game').hidden = false; update(); } catch (error) { showToast(`导入失败：${error.message}`); }
}

function newGame() { aiRunner?.cancel(); state = null; resetInteraction(); document.getElementById('phase-overlay').hidden = true; document.getElementById('game').hidden = true; document.getElementById('setup').hidden = false; }

function runCommand(command) {
  if (command === 'cancel-intent' && isHumanTurn()) { resetInteraction(); update(); }
  else if (command === 'confirm-selection' && isHumanTurn()) {
    const action = ui.pendingAction ?? gemDraftAction(legalActions(), ui.gemDraft); if (action) dispatch(action);
  } else if (command === 'confirm-return' && isHumanTurn()) dispatch({ type: ACTION_TYPES.RETURN_GEMS, gems: { ...ui.returnGems } });
  else if (command === 'confirm-noble' && isHumanTurn() && ui.pendingAction) dispatch(ui.pendingAction);
  else if (command === 'continue-turn' && isHumanTurn()) dispatch({ type: ACTION_TYPES.ACKNOWLEDGE_TURN });
  else if (command === 'export') exportFile(); else if (command === 'new-game') newGame();
}

createBoard();
aiRunner = createBrowserAiRunner({ getState: () => state, dispatch, onError: showToast });
renderNameFields(3);
installEventHandlers({ startGame, renderNameFields, selectIntent, selectGem, selectCard, reserveDeck, adjustReturn, chooseNoble, chooseDraftAction, runCommand, importFile });
window.gemMerchant = Object.freeze({ exportState: () => state ? exportGameState(state) : null, getLegalPhase: () => state?.phase ?? null });

