/**
 * THE BARBER SHOP — Admin bookings list
 * GET /api/admin/bookings?date=&status=&barber=&limit=&offset=
 */

import { listBookings as queryBookings, countBookings, isPersistent } from '../../_lib/storage.js';
import { requireAdmin } from '../../_lib/auth.js';

export default async function handler(req, res) {
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

  const [paginated, total] = await Promise.all([
    queryBookings({
      date,
      status,
      barber,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }),
    countBookings({ date, status, barber })
  ]);

  return res.status(200).json({
    success: true,
    persistent: isPersistent(),
    bookings: paginated,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
}
