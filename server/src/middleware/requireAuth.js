import { readToken } from '../utils/auth.js';

export default function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  try {
    const user = readToken(token);
    if (!user) return res.status(401).json({ message: 'Please sign in to continue.' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Your session is invalid. Please sign in again.' });
  }
}
