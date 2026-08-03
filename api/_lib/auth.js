/**
 * THE BARBER SHOP — Shared auth helper
 * Validates Bearer tokens for admin-protected routes.
 * Accepts either the static ADMIN_TOKEN or a token issued by /api/auth/login.
 */

import { verifyToken } from '../auth/index.js';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-change-me';

export function requireAdmin(req, res) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: token requerido' });
    return null;
  }

  const token = authHeader.slice(7).trim();

  // Static admin token
  if (token === ADMIN_TOKEN) {
    return { role: 'admin', via: 'static' };
  }

  // Session token from /api/auth/login
  const payload = verifyToken(token);
  if (payload) {
    return { role: 'admin', via: 'session', user: payload.user };
  }

  res.status(401).json({ error: 'Unauthorized: token inválido o expirado' });
  return null;
}
