export function FormatMainData(data) {
  return data
    .trim()
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => {
      const [time, value] = line.split(",");
      return {
        time: Math.floor(new Date(time).getTime() / 1000),
        value: Number(value),
      };
    })
    .sort((a, b) => a.time - b.time);
}

export function toCandles(data) {
  const daily = {};

  for (const { time, value } of data) {
    const day = Math.floor((time * 1000) / 86400000);

    if (!daily[day]) {
      daily[day] = {
        time,
        open: value,
        high: value,
        low: value,
        close: value,
      };
    } else {
      daily[day].high = Math.max(daily[day].high, value);
      daily[day].low = Math.min(daily[day].low, value);
      daily[day].close = value;
    }
  }

  return Object.values(daily);
}

export function formatResourceOptions(data) {
  return Object.entries(data).map(([group, items]) => ({
    group,
    items: Object.entries(items).map(([label, { id }]) => ({
      value: String(id),
      label,
    })),
  }));
}
