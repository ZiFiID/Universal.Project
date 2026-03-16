// emotes.js - Full API Nameless Emote Poser (thumbnail rbxthumb)
export default async function handler(req, res) {
  const q = req.query.q || "";       // keyword search
  const limit = 50;                  // jumlah emote per search

  try {
    // 1️⃣ Search catalog Roblox (EmoteAnimation)
    const catalogResp = await fetch(
      `https://catalog.roblox.com/v1/search/items?category=12&keyword=${encodeURIComponent(q)}&limit=${limit}`
    );
    const catalogData = await catalogResp.json();

    if (!catalogData || !catalogData.data) {
      return res.status(200).json([]);
    }

    // 2️⃣ Ambil thumbnail langsung dari rbxthumb format
    const results = [];

    for (const item of catalogData.data) {
      const assetId = item.id;
      let animationId = assetId;

      // 3️⃣ Ambil animationId asli dari asset delivery
      try {
        const assetResp = await fetch(`https://assetdelivery.roblox.com/v1/asset/?id=${assetId}`);
        const assetText = await assetResp.text();
        const match = assetText.match(/rbxassetid:\/\/(\d+)/)
                  || assetText.match(/AnimationId.*?(\d+)/)
                  || assetText.match(/id=(\d+)/);

        if (match) animationId = match[1];
      } catch (err) {
        // fallback tetap pakai assetId
      }

      // 4️⃣ Push hasil ke array
      results.push({
        name: item.name || "Unknown",
        animationId: animationId,
        price: item.price ?? 0,
        creator: item.creator?.name || item.creatorName || "Roblox",
        // thumbnail langsung pakai rbxthumb untuk Roblox GUI
        thumbnail: `rbxthumb://type=Asset&id=${assetId}&w=420&h=420`
      });
    }

    // 5️⃣ Return JSON
    res.status(200).json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch emotes" });
  }
}q
