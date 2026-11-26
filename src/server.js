require('dotenv').config();

const requiredSecrets = [
  'MONGODB_URI',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET'
];

const missingSecrets = requiredSecrets.filter(
  (key) => !process.env[key]
);

if (missingSecrets.length > 0) {
  console.error(
    'Thieu bien moi truong:',
    missingSecrets.join(', ')
  );
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET phai co it nhat 32 ky tu');
  process.exit(1);
}

const app = require('./app');
const { connectDB } = require('./db');

const PORT = process.env.PORT || 3000;

connectDB(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log('Da ket noi MongoDB Atlas');
      console.log(`API dang chay tai cong ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(
      'Khong ket noi duoc MongoDB:',
      err.message
    );
    process.exit(1);
  });