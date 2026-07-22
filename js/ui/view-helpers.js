import { GEM_INFO, GEM_TYPES } from '../constants.js';

export const PLAYER_COLORS = ['#d16f68', '#6fa9d2', '#72ad8c', '#d5ad59'];

const GEM_ASSET_NAMES = Object.freeze({
  white: 'diamond',
  blue: 'sapphire',
  green: 'emerald',
  red: 'ruby',
  black: 'onyx',
  gold: 'gold',
});

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function gemClass(gem) {
  return `gem-${gem}`;
}

export function gemAssetPath(gem) {
  return `./src/boardgame_gems_nogold_assets/assets/gems/${GEM_ASSET_NAMES[gem]}.svg`;
}

export function gemIconElement(gem, className = '') {
  const image = document.createElement('img');
  image.className = `gem-icon ${className}`.trim();
  image.src = gemAssetPath(gem);
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  return image;
}

export function gemIconMarkup(gem, className = '') {
  return `<img class="gem-icon ${escapeHtml(className)}" src="${gemAssetPath(gem)}" alt="" aria-hidden="true">`;
}

export function renderNobleCost(noble) {
  return GEM_TYPES
    .filter((gem) => noble.cost[gem] > 0)
    .map((gem) => `<span class="noble-requirement ${gemClass(gem)}"><strong>${noble.cost[gem]}</strong>${gemIconMarkup(gem, 'noble-requirement-icon')}</span>`)
    .join('');
}
