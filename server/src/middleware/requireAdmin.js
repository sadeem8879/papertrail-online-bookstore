import { readToken } from '../utils/auth.js';

export default function requireAdmin(req, res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  try {
    const user = readToken(token);
    if (!user) return res.status(401).json({ message: 'Admin sign-in is required.' });
    if (user.role !== 'admin') return res.status(403).json({ message: 'This action is only available to an admin.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Admin session is invalid. Please sign in again.' });
  }
}
