export const VERSION = '0.3.0';

export const GEM_TYPES = ['white', 'blue', 'green', 'red', 'black'];
export const ALL_GEM_TYPES = [...GEM_TYPES, 'gold'];

export const GEM_INFO = {
  white: { symbol: '◇', emoji: '💎', name: '钻石' },
  blue: { symbol: '◆', emoji: '🔷', name: '蓝宝石' },
  green: { symbol: '●', emoji: '🟢', name: '祖母绿' },
  red: { symbol: '●', emoji: '🔴', name: '红宝石' },
  black: { symbol: '●', emoji: '⚫', name: '缟玛瑙' },
  gold: { symbol: '★', emoji: '🟡', name: '黄金' },
};

export const GEM_POOL_BASE = { 2: 4, 3: 5, 4: 7 };
export const GOLD_POOL = 5;
export const MAX_HELD_GEMS = 10;
export const MAX_RESERVED = 3;
export const WIN_SCORE = 15;

export const PLAYER_TYPES = Object.freeze({ HUMAN: 'HUMAN', AI: 'AI' });
export const AI_LEVELS = Object.freeze({
  RANDOM: 'RANDOM',
  GREEDY: 'GREEDY',
  PLANNER: 'PLANNER',
});

export const PHASES = Object.freeze({
  AWAITING_ACTION: 'AWAITING_ACTION',
  RETURNING_GEMS: 'RETURNING_GEMS',
  CHOOSING_NOBLE: 'CHOOSING_NOBLE',
  CONFIRMING_PURCHASE: 'CONFIRMING_PURCHASE',
  TURN_TRANSITION: 'TURN_TRANSITION',
  ANIMATING: 'ANIMATING',
  GAME_OVER: 'GAME_OVER',
});

export const ACTION_TYPES = Object.freeze({
  TAKE_DIFFERENT_GEMS: 'TAKE_DIFFERENT_GEMS',
  TAKE_SAME_GEMS: 'TAKE_SAME_GEMS',
  BUY_MARKET_CARD: 'BUY_MARKET_CARD',
  BUY_RESERVED_CARD: 'BUY_RESERVED_CARD',
  RESERVE_MARKET_CARD: 'RESERVE_MARKET_CARD',
  RESERVE_DECK_CARD: 'RESERVE_DECK_CARD',
  RETURN_GEMS: 'RETURN_GEMS',
  CHOOSE_NOBLE: 'CHOOSE_NOBLE',
  ACKNOWLEDGE_TURN: 'ACKNOWLEDGE_TURN',
});
