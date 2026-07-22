import { ACTION_TYPES, MAX_RESERVED } from '../constants.js';
import { cardActionOptions } from './interaction-model.js';
import { createCardElement, createDeckElement } from './components.js';

function selectedCard(ui, source, level, index) {
  return ui.selectedCard?.source === source
    && ui.selectedCard?.level === level
    && ui.selectedCard?.index === index;
}

export function renderMarket(state, ui, legalActions) {
  const fragment = document.createDocumentFragment();
  for (const level of [3, 2, 1]) {
    const row = document.createElement('div');
    row.className = `market-row tier-${level}`;
    const reserveDeck = legalActions.some((action) => action.type === ACTION_TYPES.RESERVE_DECK_CARD && action.level === level);
    row.append(createDeckElement(level, state.decks[level].length, reserveDeck));
    const cards = document.createElement('div');
    cards.className = 'market-cards';
    state.market[level].forEach((card, index) => {
      const actions = cardActionOptions(legalActions, 'market', level, index);
      cards.append(createCardElement(card, {
        source: 'market', level, index,
        legalBuy: actions.some((action) => action.type === ACTION_TYPES.BUY_MARKET_CARD),
        legalReserve: actions.some((action) => action.type === ACTION_TYPES.RESERVE_MARKET_CARD),
        selected: selectedCard(ui, 'market', level, index),
      }));
    });
    if (!cards.childElementCount) cards.textContent = '该级市场已售罄';
    row.append(cards); fragment.append(row);
  }
  return fragment;
}

export function renderReservedCard(card, index, state, ui, legalActions) {
  const actions = cardActionOptions(legalActions, 'reserved', card.level, index);
  return createCardElement(card, {
    source: 'reserved', level: card.level, index,
    legalBuy: actions.some((action) => action.type === ACTION_TYPES.BUY_RESERVED_CARD),
    legalReserve: false,
    selected: selectedCard(ui, 'reserved', card.level, index),
  });
}

export function canReserveMore(state) {
  return state.players[state.currentPlayerIndex].reserved.length < MAX_RESERVED;
}
