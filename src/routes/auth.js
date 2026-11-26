const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const router = express.Router();

// Kiem tra du lieu dang nhap/dang ky
function readCredentials(body) {
  const { email, password } = body ?? {};

  if (
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return null;
  }

  if (
    !/^\S+@\S+\.\S+$/.test(email) ||
    password.length < 8
  ) {
    return null;
  }

  return {
    email: email.toLowerCase().trim(),
    password
  };
}

// POST /auth/register - Dang ky
router.post('/register', async (req, res) => {
  const cred = readCredentials(req.body);

  if (!cred) {
    return res.status(400).json({
      error: 'Can email hop le va mat khau tu 8 ky tu'
    });
  }

  if (await User.exists({ email: cred.email })) {
    return res.status(409).json({
      error: 'Email da duoc dang ky'
    });
  }

  const passwordHash = await bcrypt.hash(
    cred.password,
    10
  );

  try {
    const user = await User.create({
      email: cred.email,
      passwordHash
    });

    res.status(201).json({
      id: user._id,
      email: user.email
    });
  } catch (err) {
    // Xu ly truong hop email trung do dang ky dong thoi
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'Email da duoc dang ky'
      });
    }

    throw err;
  }
});

// POST /auth/login - Dang nhap
router.post('/login', async (req, res) => {
  const cred = readCredentials(req.body);

  // Tra 401 khi du lieu dang nhap khong hop le
  // Dong thoi ngan NoSQL injection qua doi tuong
  if (!cred) {
    return res.status(401).json({
      error: 'Sai email hoac mat khau'
    });
  }

  const user = await User.findOne({
    email: cred.email
  });

  const ok = user && await bcrypt.compare(
    cred.password,
    user.passwordHash
  );

  if (!ok) {
    return res.status(401).json({
      error: 'Sai email hoac mat khau'
    });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({
      error: 'May chu chua cau hinh JWT_SECRET'
    });
  }

  const token = jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email
    },
    secret,
    {
      expiresIn: '1h'
    }
  );

  res.json({ token });
});

module.exports = router;