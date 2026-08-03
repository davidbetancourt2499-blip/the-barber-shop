/**
 * THE BARBER SHOP — Auth API
 * POST /api/auth/login - Admin login
 * POST /api/auth/verify - Verify token
 */

// Simple JWT-like token (in production, use proper JWT with jose or similar)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USER || 'admin',
  password: process.env.ADMIN_PASS || 'barber2024!' // CHANGE IN PRODUCTION!
};

const TOKEN_SECRET = process.env.TOKEN_SECRET || 'tbs-secret-change-me-in-production';
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Simple token store (in production, use Redis or database)
const tokens = new Map();

function generateToken() {
  const payload = {
    user: ADMIN_CREDENTIALS.username,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY
  };
  return btoa(JSON.stringify(payload)) + '.' + btoa(JSON.stringify({ alg: 'HS256' }));
}

export function verifyToken(token) {
  try {
    if (!token) return null;
    const [payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { action } = req.query || {};

    // Accept action from query (?action=login), from path (/login, /verify)
    // or from the request body (admin.js sends { action } in body when provided).
    const pathAction = req.url?.split('?')[0].split('/').pop();
    const effectiveAction = action || (req.body && req.body.action) || (pathAction !== 'auth' ? pathAction : null);

    if (effectiveAction === 'login') return handleLogin(req, res);
    if (effectiveAction === 'verify') return handleVerify(req, res);

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function handleLogin(req, res) {
  const { username, password } = req.body;

  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    const token = generateToken();
    tokens.set(token, { username, createdAt: Date.now() });

    return res.status(200).json({
      success: true,
      token,
      user: { username: ADMIN_CREDENTIALS.username },
      expiresIn: TOKEN_EXPIRY
    });
  }

  return res.status(401).json({ error: 'Credenciales inválidas' });
}

function handleVerify(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  return res.status(200).json({ success: true, user: payload });
}