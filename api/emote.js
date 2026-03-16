export default async function handler(req, res) {
  const q = req.query.q || "";
  const limit = 30;

  try {

    const catalog = await fetch(
      `https://catalog.roblox.com/v1/search/items?category=12&keyword=${encodeURIComponent(q)}&limit=${limit}`
    );

    const catalogData = await catalog.json();

    const ids = catalogData.data.map(v => v.id).join(",");

    const thumbReq = await fetch(
      `https://thumbnails.roblox.com/v1/assets?assetIds=${ids}&size=420x420&format=Png`
    );

    const thumbData = await thumbReq.json();

    const thumbMap = {};
    for (const t of thumbData.data) {
      thumbMap[t.targetId] = t.imageUrl;
    }

    const results = [];

    for (const item of catalogData.data) {

      const assetId = item.id;
      let animationId = assetId;

      try {

        const asset = await fetch(
          `https://assetdelivery.roblox.com/v1/asset/?id=${assetId}`
        );

        const text = await asset.text();

        const match =
          text.match(/rbxassetid:\/\/(\d+)/) ||
          text.match(/id=(\d+)/);

        if (match) animationId = match[1];

      } catch {}

      results.push({
        name: item.name,
        assetId: assetId,
        animationId: animationId,
        price: item.price ?? 0,
        thumbnail: thumbMap[assetId] || null
      });
    }

    res.status(200).json(results);

  } catch (err) {
    res.status(500).json({ error: "failed" });
  }
}
