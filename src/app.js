const express = require('express');
const os = require('os');
const notesRouter = require('./routes/notes');

const app = express();

app.use(express.json({ limit: '100kb' }));

// LAB 1 - API Hello Cloud
app.get('/', (req, res) => {
  res.json({
    message: 'Xin chào từ đám mây!',
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

// LAB 3 - API CRUD ghi chú
app.use('/notes', notesRouter);

// Xu ly loi API
app.use((err, req, res, next) => {
  console.error('API Error:', err);

  const clientError =
    ['ValidationError', 'CastError', 'MulterError']
      .includes(err.name) ||
    err.code === 'LIMIT_FILE_SIZE' ||
    (err.status >= 400 && err.status < 500);

  res.status(clientError ? 400 : 500).json({
    error: clientError
      ? err.message
      : 'Lỗi máy chủ, vui lòng thử lại'
  });
});

module.exports = app;