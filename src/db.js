const mongoose = require('mongoose');

async function connectDB(uri) {
  if (!uri) {
    throw new Error('Thieu MONGODB_URI trong .env');
  }

  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000
  });

  console.log('Da ket noi MongoDB Atlas');
}

module.exports = { connectDB };