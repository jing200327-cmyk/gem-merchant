import { GEM_INFO, GEM_TYPES, MAX_HELD_GEMS, MAX_RESERVED, PLAYER_TYPES } from '../constants.js';
import { playerBonuses, playerGemCount } from '../engine/rules.js';
import { createReservedCardElement } from './components.js';
import { cardActionOptions } from './interaction-model.js';
import { gemClass, gemIconElement, renderNobleCost, PLAYER_COLORS } from './view-helpers.js';

function el(tag, className = '', text = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function developmentSlots(player) {
  const bonuses = playerBonuses(player);
  const slots = el('div', 'player-development-slots');
  for (const gem of GEM_TYPES) {
    const count = bonuses[gem];
    const slot = el('span', `player-development-slot ${gemClass(gem)} ${count ? 'is-owned' : ''}`);
    slot.setAttribute('aria-label', `${GEM_INFO[gem].name}发展卡 ${count} 张`);
    slot.append(gemIconElement(gem, 'sidebar-slot-gem'), el('strong', 'slot-count', String(count)));
    slots.append(slot);
  }
  return slots;
}

function nobleFan(player) {
  const fan = el('div', 'player-noble-fan');
  player.nobles.forEach((noble, index) => {
    const card = el('span', 'sidebar-noble-card');
    card.style.setProperty('--fan-index', String(index));
    card.setAttribute('aria-label', `贵族，${noble.points} 分`);
    const score = el('strong', 'sidebar-noble-score', `★ ${noble.points}`);
    const cost = el('span', 'noble-cost');
    cost.innerHTML = renderNobleCost(noble);
    card.append(score, cost);
    fan.append(card);
  });
  if (!player.nobles.length) fan.append(el('span', 'noble-empty', '尚无贵族'));
  return fan;
}

export function renderOpponents(state) {
  const fragment = document.createDocumentFragment();
  state.players.forEach((player, index) => {
    const panel = el('article', `player-status-card ${index === state.currentPlayerIndex ? 'is-current-player' : ''}`);
    panel.style.setProperty('--player-color', PLAYER_COLORS[index]);
    const title = el('div', 'player-status-title');
    const prestige = player.cards.reduce((sum, card) => sum + card.points, 0) + player.nobles.reduce((sum, noble) => sum + noble.points, 0);
    title.append(el('strong', 'player-status-name', player.name), el('span', 'player-status-score', `★ ${prestige}`));
    const meta = el('div', 'player-status-meta', `预留 ${player.reserved.length}/${MAX_RESERVED} · 宝石 ${playerGemCount(player)}`);
    panel.append(title, developmentSlots(player), nobleFan(player), meta);
    fragment.append(panel);
  });
  return fragment;
}

function currentPlayerLanes(player, returning) {
  const bonuses = playerBonuses(player);
  const lanes = el('div', `current-player-lanes ${returning ? 'is-returning' : ''}`);
  for (const gem of GEM_TYPES) {
    const lane = el('section', `current-player-lane ${gemClass(gem)}`);
    lane.setAttribute('aria-label', `${GEM_INFO[gem].name}资产：发展卡 ${bonuses[gem]} 张，宝石 ${player.gems[gem]} 枚`);
    const header = el('div', 'lane-header');
    header.append(gemIconElement(gem, 'lane-header-gem'));
    const assets = el('div', 'lane-assets');
    const development = el('span', 'lane-development-card');
    development.append(el('strong', 'lane-card-count', String(bonuses[gem])));
    const token = el(returning ? 'button' : 'span', 'lane-gem-asset');
    if (returning) {
      token.type = 'button';
      token.dataset.returnGem = gem;
      token.dataset.returnDelta = '1';
      token.setAttribute('aria-label', `归还一枚${GEM_INFO[gem].name}`);
    }
    token.append(gemIconElement(gem, 'lane-token-gem'), el('strong', 'lane-gem-count', String(player.gems[gem])));
    assets.append(development, token);
    lane.append(header, assets);
    lanes.append(lane);
  }
  const goldLane = el('section', 'current-player-lane gold-wallet gem-gold');
  goldLane.setAttribute('aria-label', `黄金：${player.gems.gold} 枚`);
  const goldHeader = el('div', 'lane-header');
  goldHeader.append(gemIconElement('gold', 'lane-header-gem'));
  const goldToken = el(returning ? 'button' : 'span', 'gold-gem-asset');
  if (returning) {
    goldToken.type = 'button';
    goldToken.dataset.returnGem = 'gold';
    goldToken.dataset.returnDelta = '1';
    goldToken.setAttribute('aria-label', '归还一枚黄金');
  }
  goldToken.append(gemIconElement('gold', 'gold-token-gem'), el('strong', 'lane-gem-count', String(player.gems.gold)));
  goldLane.append(goldHeader, goldToken);
  lanes.append(goldLane);
  return lanes;
}

export function renderPlayerPanel(state, ui, legalActions) {
  const player = state.players[state.currentPlayerIndex];
  const returning = state.phase === 'RETURNING_GEMS' && player.controller?.type !== PLAYER_TYPES.AI;
  const fragment = document.createDocumentFragment();
  const heading = el('div', 'turn-assets-heading');
  heading.append(el('p', 'section-kicker', returning ? 'RETURN TOKENS' : 'TURN ASSETS'), el('h2', '', returning ? '选择归还的宝石' : '当前回合资产'));
  const meta = el('div', 'player-meta');
  meta.append(el('span', playerGemCount(player) > MAX_HELD_GEMS ? 'is-over-limit' : '', `宝石 ${playerGemCount(player)} / ${MAX_HELD_GEMS}`), el('span', '', `预留 ${player.reserved.length} / ${MAX_RESERVED}`));
  const reservedGroup = el('div', 'asset-group');
  const reservedTitle = el('div', 'asset-title'); reservedTitle.append(el('span', '', '私有预留卡'), el('span', '', `${player.reserved.length} / ${MAX_RESERVED}`));
  const reserved = el('div', 'reserved-cards');
  player.reserved.forEach((card, index) => {
    const options = cardActionOptions(legalActions, 'reserved', card.level, index);
    reserved.append(createReservedCardElement(card, {
      index,
      legalBuy: options.some((action) => action.type === 'BUY_RESERVED_CARD'),
      selected: ui.selectedCard?.source === 'reserved' && ui.selectedCard?.index === index,
    }));
  });
  if (!reserved.childElementCount) reserved.append(el('p', 'empty-copy', '暂无预留卡牌'));
  reservedGroup.append(reservedTitle, reserved);
  fragment.append(heading, meta, currentPlayerLanes(player, returning), reservedGroup);
  return fragment;
}
