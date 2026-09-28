import { Router } from 'express';
import User from '../models/User.js';
import { createToken, hashPassword, verifyPassword } from '../utils/auth.js';
import requireAuth from '../middleware/requireAuth.js';
import { timingSafeEqual } from 'node:crypto';

const router = Router();
const publicUser = user => ({ id: String(user._id), name: user.name, email: user.email });
const safeEquals = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

router.post('/admin-login', (req, res) => {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUsername || !expectedPassword) {
    return res.status(503).json({ message: 'Admin credentials are missing from server/.env.' });
  }

  const username = String(req.body?.username || '');
  const password = String(req.body?.password || '');
  if (!safeEquals(username, expectedUsername) || !safeEquals(password, expectedPassword)) {
    return res.status(401).json({ message: 'Username or password is incorrect.' });
  }

  const admin = { _id: 'admin', name: 'Bookstore Admin', email: 'admin@papertrail.local' };
  return res.json({ token: createToken(admin, 'admin'), user: { name: admin.name, username: expectedUsername, role: 'admin' } });
});

router.get('/admin-me', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required.' });
  return res.json({ user: { name: req.user.name, username: process.env.ADMIN_USERNAME, role: 'admin' } });
});

router.post('/signup', async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (name.length < 2) return res.status(400).json({ message: 'Enter your name (at least 2 characters).' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists. Sign in instead.' });
    const user = await User.create({ name, email, passwordHash: await hashPassword(password) });
    return res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists. Sign in instead.' });
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    return res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(401).json({ message: 'Account not found. Please sign in again.' });
    res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});

export default router;
