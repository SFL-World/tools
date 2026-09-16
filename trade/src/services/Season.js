const seasons = ["Winter", "Spring", "Summer", "Autumn"];
const refTimestamp = 1789344000;
const secondsPerWeek = 7 * 24 * 60 * 60;

export const SEASON_COLORS = {
  Autumn: "#f08c00",
  Spring: "#51cf66",
  Summer: "#ffd43b",
  Winter: "#ffffff",
};

export function getSeason(dateString) {
  const targetTimestamp = Math.floor(new Date(dateString).getTime() / 1000);
  const secondsDiff = targetTimestamp - refTimestamp;
  const weeksDiff = Math.floor(secondsDiff / secondsPerWeek);
  const seasonIndex = ((weeksDiff % 4) + 4) % 4;

  return seasons[seasonIndex];
}
