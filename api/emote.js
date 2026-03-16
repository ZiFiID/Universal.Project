export default async function handler(req, res) {
  const q = req.query.q || "";
  const cursor = req.query.cursor || null;
  const limit = 12;

  try {
    const url = `https://catalog.roblox.com/v1/search/items?category=12&keyword=${encodeURIComponent(q)}&limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (!data || !data.data) return res.status(200).json({ results: [], nextCursor: null });

    const results = [];

    for (const item of data.data) {
      const assetId = item.id;
      let animationId = assetId;
      let name = "Unknown";
      let creator = "Roblox";
      let price = 0;

      // 1️⃣ Ambil data detail asset (Marketplace API)
      try {
        const infoResp = await fetch(`https://api.roblox.com/marketplace/productinfo?assetId=${assetId}`);
        const info = await infoResp.json();

        if (info) {
          name = info.Name || "Unknown";
          creator = info.Creator && info.Creator.Name ? info.Creator.Name : (info.CreatorName || "Roblox");
          if (info.IsForSale === false) {
            price = 1; // Offsale
          } else {
            price = info.PriceInRobux ?? 0;
          }
        }
      } catch {}

      // 2️⃣ Ambil animationId asli
      try {
        const assetResp = await fetch(`https://assetdelivery.roblox.com/v1/asset/?id=${assetId}`);
        const assetText = await assetResp.text();
        const match = assetText.match(/rbxassetid:\/\/(\d+)/)
                  || assetText.match(/AnimationId.*?(\d+)/)
                  || assetText.match(/id=(\d+)/);
        if (match) animationId = match[1];
      } catch {}

      results.push({
        name,
        animationId,
        price,
        creator,
        thumbnail: `rbxthumb://type=Asset&id=${assetId}&w=420&h=420`
      });
    }

    res.status(200).json({
      results,
      nextCursor: data.nextPageCursor || null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch emotes" });
  }
}
