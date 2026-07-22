import { ALL_GEM_TYPES, GEM_INFO, PHASES, PLAYER_TYPES } from '../constants.js';
import { rankPlayers, determineWinners } from '../engine/scoring.js';
import { escapeHtml, gemClass, gemIconMarkup, renderNobleCost } from './view-helpers.js';

function isAiTurn(state) { return state.players[state.currentPlayerIndex].controller?.type === PLAYER_TYPES.AI; }

function renderTurnTransition(state) {
  const player = state.players[state.currentPlayerIndex]; const ai = isAiTurn(state);
  return `<section class="dialog-card hotseat-dialog" role="dialog" aria-modal="true" aria-labelledby="transition-title"><div class="privacy-mark" aria-hidden="true">◆</div><p class="eyebrow">PRIVATE TURN</p><h2 id="transition-title">${ai ? `${escapeHtml(player.name)} 即将行动` : `请将设备交给 ${escapeHtml(player.name)}`}</h2><p>${ai ? 'AI 将通过与真人相同的规则入口确认回合。' : '私有预留卡与资产已遮挡。'}</p><div class="dialog-actions"><button class="button button-primary" type="button" data-command="continue-turn" ${ai ? 'disabled' : ''}>${ai ? 'AI 正在确认…' : '开始我的回合'}</button></div></section>`;
}

function renderGemReturn(state, ui) {
  const player = state.players[state.currentPlayerIndex]; const ai = isAiTurn(state); const selected = Object.values(ui.returnGems).reduce((sum, count) => sum + count, 0); const required = state.pending.returnCount;
  const items = ALL_GEM_TYPES.map((gem) => `<div class="return-item ${gemClass(gem)}"><strong>${gemIconMarkup(gem, 'return-gem-icon')} ${GEM_INFO[gem].name}</strong><small>持有 ${player.gems[gem]}</small><div class="return-controls"><button type="button" data-return-gem="${gem}" data-return-delta="-1" aria-label="减少归还${GEM_INFO[gem].name}" ${ai ? 'disabled' : ''}>−</button><span>${ui.returnGems[gem] ?? 0}</span><button type="button" data-return-gem="${gem}" data-return-delta="1" aria-label="增加归还${GEM_INFO[gem].name}" ${ai ? 'disabled' : ''}>+</button></div></div>`).join('');
  return `<section class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="return-title"><p class="eyebrow">TOKEN LIMIT</p><h2 id="return-title">${ai ? 'AI 正在归还宝石' : `归还 ${required} 枚宝石`}</h2><p>也可直接点击下方玩家宝石槽位选择归还。</p><div class="return-grid">${items}</div><div class="dialog-actions"><button class="button button-primary" type="button" data-command="confirm-return" ${!ai && selected === required ? '' : 'disabled'}>${ai ? 'AI 正在选择…' : `确认归还 ${selected} / ${required}`}</button></div></section>`;
}

function renderNobleChoice(state, ui) {
  const ai = isAiTurn(state); const choices = state.availableNobles.filter((noble) => state.pending.nobleIds.includes(noble.id)).map((noble) => `<button class="noble-card noble-choice ${ui.selectedNobleId === noble.id ? 'is-selected' : ''}" type="button" data-noble-id="${noble.id}" aria-selected="${ui.selectedNobleId === noble.id}" ${ai ? 'disabled' : ''}><strong>★ ${noble.points} 贵族</strong><span class="noble-cost">${renderNobleCost(noble)}</span></button>`).join('');
  return `<section class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="noble-title"><p class="eyebrow">NOBLE VISIT</p><h2 id="noble-title">${ai ? 'AI 正在选择贵族' : '选择一位到访贵族'}</h2><p>本回合最多获得一位；选择后确认。</p><div class="noble-choices">${choices}</div><div class="dialog-actions"><button class="button button-quiet" type="button" data-command="cancel-intent" ${ai ? 'disabled' : ''}>取消</button><button class="button button-primary" type="button" data-command="confirm-noble" ${ui.selectedNobleId && !ai ? '' : 'disabled'}>确认贵族</button></div></section>`;
}

function renderGameOver(state) {
  const winners = new Set(determineWinners(state).map((player) => player.id)); const ranking = rankPlayers(state).map((player, index) => `<li class="${winners.has(player.id) ? 'is-winner' : ''}"><span>${index + 1}. ${escapeHtml(player.name)}${winners.has(player.id) ? ' · 获胜' : ''}</span><span>★ ${player.prestige} · ${player.purchasedCardCount} 张</span></li>`).join('');
  return `<section class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="end-title"><p class="eyebrow">FINAL LEDGER</p><h2 id="end-title">商路结算</h2><p>最高声望获胜；同分时购买发展卡较少者获胜。</p><ol class="ranking">${ranking}</ol><div class="dialog-actions"><button class="button button-primary" type="button" data-command="new-game">再开一局</button></div></section>`;
}

export function renderOverlay(state, ui) {
  if (state.phase === PHASES.TURN_TRANSITION) return renderTurnTransition(state);
  if (state.phase === PHASES.RETURNING_GEMS) return renderGemReturn(state, ui);
  if (state.phase === PHASES.CHOOSING_NOBLE) return renderNobleChoice(state, ui);
  if (state.phase === PHASES.GAME_OVER) return renderGameOver(state);
  return '';
}
