const express = require('express');
const multer = require('multer');

const Note = require('../models/note');
const { bucket } = require('../storage');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Bat buoc dang nhap cho tat ca API Notes
router.use(requireAuth);

// Gioi han file upload 2 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});

// GET /notes - Chi hien thi ghi chu cua minh
router.get('/', async (req, res) => {
  const filter = {
    owner: req.user.sub
  };

  if (req.query.tag) {
    filter.tags = String(req.query.tag);
  }

  const notes = await Note.find(filter)
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(notes);
});

// GET /notes/:id - Chi xem ghi chu cua minh
router.get('/:id', async (req, res) => {
  const note = await Note.findOne({
    _id: req.params.id,
    owner: req.user.sub
  });

  if (!note) {
    return res.status(404).json({
      error: 'Khong tim thay ghi chu'
    });
  }

  res.json(note);
});

// POST /notes - Tao ghi chu gan voi user dang nhap
router.post('/', async (req, res) => {
  const {
    title,
    content,
    tags
  } = req.body ?? {};

  const note = await Note.create({
    title,
    content,
    tags,
    owner: req.user.sub
  });

  res.status(201).json(note);
});

// PUT /notes/:id - Chi sua ghi chu cua minh
router.put('/:id', async (req, res) => {
  const {
    title,
    content,
    tags
  } = req.body ?? {};

  const note = await Note.findOneAndUpdate(
    {
      _id: req.params.id,
      owner: req.user.sub
    },
    {
      title,
      content,
      tags
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!note) {
    return res.status(404).json({
      error: 'Khong tim thay ghi chu'
    });
  }

  res.json(note);
});

// DELETE /notes/:id - Chi xoa ghi chu cua minh
router.delete('/:id', async (req, res) => {
  const note = await Note.findOneAndDelete({
    _id: req.params.id,
    owner: req.user.sub
  });

  if (!note) {
    return res.status(404).json({
      error: 'Khong tim thay ghi chu'
    });
  }

  res.status(204).end();
});

// POST /notes/:id/attachment - Upload file
router.post(
  '/:id/attachment',
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: 'Thieu tep o truong file'
      });
    }

    const note = await Note.findOne({
      _id: req.params.id,
      owner: req.user.sub
    });

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

    if (error) {
      throw error;
    }

    note.attachmentUrl =
      bucket().getPublicUrl(path).data.publicUrl;

    await note.save();

    res.json(note);
  }
);

module.exports = router;