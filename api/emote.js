// api/emotes.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Load data (bisa dari file, atau database nanti)
const allEmotes = require('../data/emotes.json'); // sesuaikan path kalau pakai Vercel

const ITEMS_PER_PAGE = 30;

// GET /api/emotes?page=1&search=wave
app.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const search = (req.query.search || '').toLowerCase().trim();

  let filtered = allEmotes;

  if (search) {
    filtered = allEmotes.filter(emote =>
      emote.name.toLowerCase().includes(search) ||
      (emote.creator && emote.creator.toLowerCase().includes(search))
    );
  }

  const total = filtered.length;
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;

  const result = filtered.slice(start, end).map(emote => {
    // Pastikan animationId selalu ada
    const animId = emote.animationId || `rbxassetid://${emote.id}`;

    return {
      id: emote.id,
      name: emote.name,
      creator: emote.creator || "Unknown",
      price: emote.price || 0,
      animationId: animId,
      thumbnail: `rbxthumb://type=Asset&id=${emote.id}&w=420&h=420`
    };
  });

  res.json({
    page,
    perPage: ITEMS_PER_PAGE,
    totalItems: total,
    totalPages: Math.ceil(total / ITEMS_PER_PAGE),
    data: result
  });
});

// GET /api/emotes/:id — detail satu emote
app.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const emote = allEmotes.find(e => e.id === id);

  if (!emote) {
    return res.status(404).json({ error: "Emote not found" });
  }

  const animId = emote.animationId || `rbxassetid://${emote.id}`;

  res.json({
    id: emote.id,
    name: emote.name,
    creator: emote.creator || "Unknown",
    price: emote.price || 0,
    animationId: animId,
    thumbnail: `rbxthumb://type=Asset&id=${emote.id}&w=420&h=420`
  });
});

module.exports = app;
