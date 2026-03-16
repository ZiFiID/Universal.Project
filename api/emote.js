// emote.js - Fetch Roblox emotes by keyword and page (30 per page)
import fetch from "node-fetch"; // Node/Vercel, browser fetch works natively

/**
 * Fetch emote data from Roblox catalog
 * @param {string} keyword - search keyword
 * @param {number} page - page number, 1 = first page
 * @param {number} limit - items per page (default 30)
 * @returns {Promise<{results:Array, page:number, hasNext:boolean}>}
 */
export async function fetchEmotes(keyword, page = 1, limit = 30) {
  if (!keyword) throw new Error("Keyword 'q' is required");

  const catalogUrl = `https://catalog.roblox.com/v1/search/items?Category=12&Keyword=${encodeURIComponent(
    keyword
  )}&Limit=${limit}`;

  let cursor = null;
  let currentPage = 1;
  let results = [];

  // Iterate until the requested page
  while (currentPage <= page) {
    const url = cursor ? `${catalogUrl}&Cursor=${cursor}` : catalogUrl;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Roblox/WinInet",
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();
    if (!data || !data.data) break;

    results = data.data;
    cursor = data.nextPageCursor || null;
    currentPage++;
    if (!cursor) break;
  }

  // Map results to standard emote format with real names and creators
  const pageResults = results.map(item => {
    const price =
      item.priceInRobux === undefined
        ? 0
        : item.priceInRobux === 1
        ? 1 // offsale
        : item.priceInRobux;

    return {
      name: item.name || "Unknown",
      animationId: item.assetId,
      price: price,
      creator: item.creator?.name || "Unknown",
      thumbnail: `rbxthumb://type=Asset&id=${item.assetId}&w=420&h=420`
    };
  });

  return {
    results: pageResults,
    page,
    hasNext: !!cursor
  };
}
