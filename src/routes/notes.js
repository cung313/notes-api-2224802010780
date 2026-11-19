const express = require('express');
const multer = require('multer');
const Note = require('../models/note');
const { bucket } = require('../storage');

const router = express.Router();

// Gioi han file upload 2 MiB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

// GET /notes - Danh sach ghi chu
router.get('/', async (req, res) => {
  const filter = req.query.tag
    ? { tags: String(req.query.tag) }
    : {};

  const notes = await Note.find(filter)
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(notes);
});

// GET /notes/:id - Xem chi tiet
router.get('/:id', async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (!note) {
    return res.status(404).json({
      error: 'Khong tim thay ghi chu'
    });
  }

  res.json(note);
});

// POST /notes - Them ghi chu
router.post('/', async (req, res) => {
  const { title, content, tags } = req.body ?? {};

  const note = await Note.create({
    title,
    content,
    tags
  });

  res.status(201).json(note);
});

// PUT /notes/:id - Sua ghi chu
router.put('/:id', async (req, res) => {
  const { title, content, tags } = req.body ?? {};

  const note = await Note.findByIdAndUpdate(
    req.params.id,
    { title, content, tags },
    { new: true, runValidators: true }
  );

  if (!note) {
    return res.status(404).json({
      error: 'Khong tim thay ghi chu'
    });
  }

  res.json(note);
});

// DELETE /notes/:id - Xoa ghi chu
router.delete('/:id', async (req, res) => {
  const note = await Note.findByIdAndDelete(req.params.id);

  if (!note) {
    return res.status(404).json({
      error: 'Khong tim thay ghi chu'
    });
  }

  res.status(204).end();
});

// POST /notes/:id/attachment - Tai tep dinh kem
router.post(
  '/:id/attachment',
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: 'Thieu tep o truong file'
      });
    }

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        error: 'Khong tim thay ghi chu'
      });
    }

    const safeName = req.file.originalname
      .normalize('NFD')
      .replace(/[^\w.-]/g, '_')
      .slice(0, 120) || 'attachment';

    const path = `${note._id}/${Date.now()}-${safeName}`;

    const { error } = await bucket().upload(
      path,
      req.file.buffer,
      {
        contentType: req.file.mimetype
      }
    );

    if (error) throw error;

    note.attachmentUrl =
      bucket().getPublicUrl(path).data.publicUrl;

    await note.save();

    res.json(note);
  }
);

module.exports = router;