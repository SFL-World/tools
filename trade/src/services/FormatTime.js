export function getLogicalRangeFromTime(data, fromUnix, toUnix) {
  const lastIndex = data.length - 1;
  if (lastIndex < 0) return null;

  const getTime = (bar) => bar.time;
  const dataFirst = getTime(data[0]);
  const dataLast = getTime(data[lastIndex]);
  const clampedFrom = Math.max(fromUnix, dataFirst);
  const clampedTo = Math.min(toUnix, dataLast);

  if (clampedFrom > clampedTo) return null;

  const fromIdx = lowerBound(data, clampedFrom, getTime);
  const toIdx = upperBound(data, clampedTo, getTime) - 1;

  if (fromIdx > toIdx) return null;
  return { from: fromIdx, to: toIdx };
}

function lowerBound(data, target, getTime) {
  let lo = 0,
    hi = data.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (getTime(data[mid]) < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function upperBound(data, target, getTime) {
  let lo = 0,
    hi = data.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (getTime(data[mid]) <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function getVisibleLogicalRange(period, data) {
  if (!data.length) return null;

  const lastIndex = data.length - 1;
  const nowUnix = data[lastIndex].time;

  const durations = {
    "24H": 24 * 60 * 60,
    "7D": 7 * 24 * 60 * 60,
    "1M": 30 * 24 * 60 * 60,
  };

  if (period === "Max" || !(period in durations)) {
    return { from: 0, to: lastIndex };
  }

  return getLogicalRangeFromTime(data, nowUnix - durations[period], nowUnix);
}
