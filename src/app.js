const express = require('express');
const os = require('os');
const mongoose = require('mongoose');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

mongoose.set('sanitizeFilter', true);

const app = express();

const notesRouter = require('./routes/notes');
const authRouter = require('./routes/auth');

// Codespaces va Vercel nam sau proxy
app.set('trust proxy', 1);

// HTTP security headers
app.use(helmet());

// Gioi han kich thuoc JSON
app.use(express.json({ limit: '100kb' }));

// Gioi han 20 requests trong 15 phut
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Qua nhieu yeu cau, vui long thu lai sau'
  }
});

// Dang ky va dang nhap
app.use('/auth', authLimiter, authRouter);

// API Hello Cloud tu LAB 1
app.get('/', (req, res) => {
  res.json({
    message: 'Xin chao tu dam may!',
    host: os.hostname(),
    platform: `${os.type()} ${os.release()}`,
    cpus: os.cpus().length,
    memoryGB: Number(
      (os.totalmem() / 1024 ** 3).toFixed(1)
    ),
    uptimeSec: Math.round(os.uptime()),
    time: new Date().toISOString()
  });
});

// API Notes co JWT
app.use('/notes', notesRouter);

// Middleware xu ly loi
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);

  if (res.headersSent) {
    return next(err);
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Du lieu da ton tai'
    });
  }

  const clientError =
    ['ValidationError', 'CastError', 'MulterError']
      .includes(err.name) ||
    err.code === 'LIMIT_FILE_SIZE' ||
    (err.status >= 400 && err.status < 500);

  res.status(clientError ? 400 : 500).json({
    error: clientError
      ? err.message
      : 'Loi may chu, vui long thu lai'
  });
});

module.exports = app;