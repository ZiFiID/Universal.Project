import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { keyword = "", page = 1, perPage = 30 } = req.query;
    const startIndex = (page - 1) * perPage;

    // 1. Search emote catalog (max 100 per fetch, nanti kita slice)
    const searchUrl = `https://catalog.roblox.com/v1/search/items?Category=3&Subcategory=9&SortType=Relevance&Keyword=${encodeURIComponent(
      keyword
    )}&Limit=100`;
    
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData || !searchData.data) {
      return res.status(404).json({ error: "No data found" });
    }

    // Slice per page, maksimal perPage (30)
    const items = searchData.data.slice(startIndex, startIndex + perPage);

    const results = await Promise.all(
      items.map(async (item) => {
        let info = {};
        try {
          const infoRes = await fetch(
            `https://api.roblox.com/marketplace/productinfo?assetId=${item.id}`
          );
          info = await infoRes.json();
        } catch {}

        // Dapatkan animationId via assetdelivery
        let animationId = `rbxassetid://${item.id}`;
        try {
          const assetRes = await fetch(
            `https://assetdelivery.roblox.com/v1/asset/?id=${item.id}`
          );
          const assetText = await assetRes.text();
          const match = assetText.match(/<url>.*?id=(\d+).*?<\/url>/);
          if (match) animationId = `rbxassetid://${match[1]}`;
        } catch {}

        return {
          name: info.Name || item.name || "Unknown",
          creator: info.Creator && info.Creator.Name ? info.Creator.Name : "Roblox",
          price: info.PriceInRobux || (info.IsForSale === false ? "Offsale" : 0),
          animationId,
          thumbnail: `rbxthumb://type=Asset&id=${item.id}&w=420&h=420`,
          assetId: item.id,
        };
      })
    );

    res.status(200).json({
      page: parseInt(page),
      perPage: parseInt(perPage),
      total: searchData.totalResults,
      results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
