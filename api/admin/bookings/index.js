/**
 * THE BARBER SHOP — Admin bookings list
 * GET /api/admin/bookings
 */

import { bookings } from '../../bookings/index.js';
import { requireAdmin } from '../../_lib/auth.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAdmin(req, res);
  if (!auth) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, status, barber, limit = '50', offset = '0' } = req.query;

  let filtered = Array.from(bookings.values());

  if (date) filtered = filtered.filter(b => b.date === date);
  if (status) filtered = filtered.filter(b => b.status === status);
  if (barber) filtered = filtered.filter(b => b.barber === barber);

  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const start = parseInt(offset);
  const end = start + parseInt(limit);
  const paginated = filtered.slice(start, end);

  return res.status(200).json({
    success: true,
    bookings: paginated,
    total: filtered.length,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
}
