export function findMostSimilar(search, items) {
  const query = search.trim().toLowerCase();

  if (!query) return null;

  let best = null;
  let bestScore = 0;

  for (const item of items) {
    const label = item.label.toLowerCase();
    let score = 0;

    if (label === query) {
      score = 100;
    } else if (label.startsWith(query)) {
      score = 80;
    } else if (label.includes(query)) {
      score = 60;
    } else {
      let queryIndex = 0;

      for (const char of label) {
        if (char === query[queryIndex]) {
          queryIndex++;
        }
      }

      score = queryIndex === query.length ? 50 : 0;
    }

    if (score > bestScore && score > 0) {
      bestScore = score;
      best = item;
    }
  }

  return best;
}
