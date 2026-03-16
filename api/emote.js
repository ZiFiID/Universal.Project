export default async function handler(req, res) {
  const q = req.query.q || "";           // keyword search
  const cursor = req.query.cursor || null; // optional untuk page berikutnya
  const limit = 12;                       // 1 page = 12 emote, sama kayak marketplace

  try {
    // 1️⃣ Fetch catalog Roblox
    const url = `https://catalog.roblox.com/v1/search/items?category=12&keyword=${encodeURIComponent(q)}&limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (!data || !data.data) return res.status(200).json({ results: [], nextCursor: null });

    const results = [];

    for (const item of data.data) {
      const assetId = item.id;
      let animationId = assetId;

      // 2️⃣ Ambil animationId asli dari asset delivery
      try {
        const assetResp = await fetch(`https://assetdelivery.roblox.com/v1/asset/?id=${assetId}`);
        const assetText = await assetResp.text();
        const match = assetText.match(/rbxassetid:\/\/(\d+)/)
                  || assetText.match(/AnimationId.*?(\d+)/)
                  || assetText.match(/id=(\d+)/);
        if (match) animationId = match[1];
      } catch {}

      // 3️⃣ Push hasil ke array
      results.push({
        name: item.name || "Unknown",
        animationId: animationId,
        price: item.price ?? 0,
        creator: item.creator?.name || item.creatorName || "Roblox",
        thumbnail: `rbxthumb://type=Asset&id=${assetId}&w=420&h=420`
      });
    }

    // 4️⃣ Return hasil + cursor untuk page berikutnya
    res.status(200).json({
      results,
      nextCursor: data.nextPageCursor || null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch emotes" });
  }
}
