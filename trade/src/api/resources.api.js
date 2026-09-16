const API_URL = "/api/v1/trade";
const FLOWER_USD_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=flower-2&vs_currencies=usd";

export async function getList() {
  const response = await fetch(`${API_URL}/structure.json`);

  if (!response.ok) {
    throw new Error("Could not load trade list");
  }

  return response.json();
}

export async function getData(id) {
  const response = await fetch(`${API_URL}/csv/${id}.csv`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Could not load trade data");
  }

  return response.text();
}

export async function getFlowerUsdPrice() {
  const response = await fetch(FLOWER_USD_URL);

  if (!response.ok) {
    throw new Error("Could not load the FLOWER USD price");
  }

  const data = await response.json();
  const price = data?.["flower-2"]?.usd;

  if (typeof price !== "number") {
    throw new Error("FLOWER USD price is unavailable");
  }

  return price;
}
