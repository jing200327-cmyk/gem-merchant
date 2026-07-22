export function normalizeSeed(seed) {
  const numeric = Number(seed);
  return Number.isFinite(numeric) ? (numeric >>> 0) || 1 : 1;
}

export function createRandom(seed = Date.now()) {
  let current = normalizeSeed(seed);
  return () => {
    current ^= current << 13;
    current ^= current >>> 17;
    current ^= current << 5;
    return (current >>> 0) / 4294967296;
  };
}

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
