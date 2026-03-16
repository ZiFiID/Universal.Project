// emotes.js - API full tanpa limit untuk Nameless Emote Poser
export default async function handler(req, res) {
  const q = req.query.q || "";       // keyword search

  try {
    let results = [];
    let cursor = null;

    do {
      // 1️⃣ Search catalog Roblox dengan paging
      const url = `https://catalog.roblox.com/v1/search/items?category=12&keyword=${encodeURIComponent(q)}&limit=100${cursor ? `&cursor=${cursor}` : ""}`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (!data || !data.data) break;

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

        results.push({
          name: item.name || "Unknown",
          animationId: animationId,
          price: item.price ?? 0,
          creator: item.creator?.name || item.creatorName || "Roblox",
          thumbnail: `rbxthumb://type=Asset&id=${assetId}&w=420&h=420`
        });
      }

      cursor = data.nextPageCursor;  // lanjut ke halaman berikutnya
    } while (cursor);

    res.status(200).json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch emotes" });
  }
}
