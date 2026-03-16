// api/emotes.js
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // atau global fetch kalau Vercel Node >=18

const app = express();
app.use(cors());
app.use(express.json());

const ROBLOX_CATALOG_URL = 'https://catalog.roblox.com/v1/search/items';
const ITEMS_PER_PAGE = 30;

app.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const search = (req.query.search || '').trim();
    const fraction = parseFloat(req.query.fraction || '1');
    const part = parseInt(req.query.part) || 1;

    if (page < 1) return res.status(400).json({ error: 'Invalid page' });

    // Hitung cursor atau offset simulation (Roblox pakai cursor, bukan page)
    // Untuk sederhana, kita pakai limit & cursor dari response sebelumnya, tapi untuk sekarang simulate page dengan multiple request kalau perlu
    // Catatan: cursor real butuh chaining request — untuk awal pakai limit tinggi kalau bisa

    const params = new URLSearchParams({
      assetTypes: 'EmoteAnimation',          // atau value numeric kalau string gagal: '64'
      keyword: search,
      limit: ITEMS_PER_PAGE.toString(),
      // cursor: '' untuk page 1, ambil dari response.nextPageCursor untuk next
      // sortType: '3', // relevance
      // includeNotForSale: 'true'  // kalau mau offsale (kadang work)
    });

    // Untuk pagination sederhana: Roblox pakai cursor, jadi untuk page >1 butuh fetch sequential
    // Untuk sekarang: asumsikan page 1 dulu, nanti extend kalau work
    if (page > 1) {
      // Logic cursor chaining bisa ditambah kalau test sukses
      return res.json({ error: 'Pagination via cursor not implemented yet - test page 1 first' });
    }

    const url = `\( {ROBLOX_CATALOG_URL}? \){params}`;
    console.log('Fetching from Roblox:', url);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        // User-Agent biar mirip browser (kadang Roblox block default fetch)
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Roblox API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Parse data.data → array items
    const emotes = (data.data || []).map(item => ({
      id: item.id,
      name: item.name,
      creator: item.creatorName || item.creatorTargetId ? `User/${item.creatorTargetId}` : 'Unknown',
      price: item.price || (item.isForSale ? item.price : 0),
      animationId: `rbxassetid://${item.id}`, // fallback; resolve real via assetdelivery kalau perlu
      thumbnail: `rbxthumb://type=Asset&id=${item.id}&w=420&h=420`
    }));

    // Apply fraction & part slicing (sama seperti sebelumnya)
    const itemsPerPart = Math.floor(ITEMS_PER_PAGE * fraction);
    const start = (part - 1) * itemsPerPart;
    const sliced = emotes.slice(start, start + itemsPerPart);

    res.json({
      page,
      part,
      fraction,
      itemsPerPart,
      totalItemsThisPage: emotes.length,
      hasMore: !!data.nextPageCursor,  // untuk info pagination lanjutan
      data: sliced
    });

  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Failed to fetch from Roblox', details: err.message });
  }
});

module.exports = app;
