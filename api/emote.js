// api/emotes.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Load SEMUA emote sekali saja (kalau masih crash, pecah jadi multiple files nanti)
let allEmotes = [];
try {
  allEmotes = require('../data/emotes.json');
  console.log(`Loaded ${allEmotes.length} emotes successfully`);
} catch (err) {
  console.error('Failed to load emotes.json:', err.message);
  allEmotes = []; // fallback kosong biar nggak crash total
}

const DEFAULT_PER_PAGE = 30;

app.get('/', (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    if (page < 1) page = 1;

    const search = (req.query.search || '').toLowerCase().trim();

    // Parse fraction (contoh: 0.5, 1, 0.25)
    let fraction = parseFloat(req.query.fraction || '1');
    if (isNaN(fraction) || fraction <= 0 || fraction > 1) fraction = 1;

    // part mulai dari 1
    let part = parseInt(req.query.part) || 1;
    if (part < 1) part = 1;

    // Filter dulu berdasarkan search
    let filtered = allEmotes;
    if (search) {
      filtered = allEmotes.filter(emote =>
        emote.name?.toLowerCase().includes(search) ||
        emote.creator?.toLowerCase().includes(search)
      );
    }

    const totalItems = filtered.length;
    if (totalItems === 0) {
      return res.json({
        page, part, fraction,
        perPage: 0, totalItems: 0, totalPages: 0,
        data: []
      });
    }

    // Hitung items per fraction/part
    const itemsPerFullPage = DEFAULT_PER_PAGE;
    const itemsPerPart = Math.floor(itemsPerFullPage * fraction);

    // Hitung start & end index global
    const itemsBeforeThisPage = (page - 1) * itemsPerFullPage;
    const startOfThisPage = itemsBeforeThisPage + (part - 1) * itemsPerPart;

    let endOfThisPart = startOfThisPage + itemsPerPart;
    // Jangan lewatin akhir page penuh
    const endOfThisPage = itemsBeforeThisPage + itemsPerFullPage;
    if (endOfThisPart > endOfThisPage) endOfThisPart = endOfThisPage;

    // Slice data
    const result = filtered.slice(startOfThisPage, endOfThisPart).map(emote => {
      const animId = emote.animationId || `rbxassetid://${emote.id}`;
      return {
        id: emote.id,
        name: emote.name || "Unnamed Emote",
        creator: emote.creator || "Unknown",
        price: emote.price || 0,
        animationId: animId,
        thumbnail: `rbxthumb://type=Asset&id=${emote.id}&w=420&h=420`
      };
    });

    // Hitung metadata
    const totalPartsPerPage = Math.ceil(itemsPerFullPage / itemsPerPart);
    const totalPagesApprox = Math.ceil(totalItems / itemsPerFullPage);

    res.json({
      page,
      part,
      fraction,
      itemsPerPart,
      totalPartsThisPage: totalPartsPerPage,
      totalPagesApprox,
      totalItems,
      data: result
    });

  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = app;
