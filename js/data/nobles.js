export const NOBLES = [
  { id: 'n-wb', cost: { white: 4, blue: 4 } },
  { id: 'n-bg', cost: { blue: 4, green: 4 } },
  { id: 'n-gr', cost: { green: 4, red: 4 } },
  { id: 'n-rk', cost: { red: 4, black: 4 } },
  { id: 'n-kw', cost: { black: 4, white: 4 } },
  { id: 'n-wbg', cost: { white: 3, blue: 3, green: 3 } },
  { id: 'n-bgr', cost: { blue: 3, green: 3, red: 3 } },
  { id: 'n-grk', cost: { green: 3, red: 3, black: 3 } },
  { id: 'n-rkw', cost: { red: 3, black: 3, white: 3 } },
  { id: 'n-kwb', cost: { black: 3, white: 3, blue: 3 } },
].map((noble) => ({
  ...noble,
  points: 3,
  cost: { white: 0, blue: 0, green: 0, red: 0, black: 0, ...noble.cost },
}));
