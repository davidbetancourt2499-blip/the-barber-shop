/**
 * THE BARBER SHOP — Admin API
 * GET /api/admin/stats       - Dashboard statistics
 * GET /api/admin/bookings    - List all bookings (with filters)  [see ./bookings/index.js]
 * PATCH /api/admin/bookings/[id] - Update booking status         [see ./bookings/[id].js]
 */

import { bookings } from '../bookings/index.js';
import { requireAdmin } from '../_lib/auth.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAdmin(req, res);
  if (!auth) return;

  try {
    if (req.method === 'GET') {
      if (req.query.stats) return getStats(req, res);
      return listBookings(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function getStats(req, res) {
  const all = Array.from(bookings.values());
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thisMonth = now.toISOString().slice(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

  const todayBookings = all.filter(b => b.date === today);
  const thisMonthBookings = all.filter(b => b.createdAt.startsWith(thisMonth));
  const lastMonthBookings = all.filter(b => b.createdAt.startsWith(lastMonth));

  const stats = {
    total: all.length,
    today: todayBookings.length,
    thisMonth: thisMonthBookings.length,
    lastMonth: lastMonthBookings.length,
    growth: lastMonthBookings.length > 0
      ? Math.round(((thisMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length) * 100)
      : 0,
    byStatus: {
      pending: all.filter(b => b.status === 'pending').length,
      confirmed: all.filter(b => b.status === 'confirmed').length,
      cancelled: all.filter(b => b.status === 'cancelled').length,
      completed: all.filter(b => b.status === 'completed').length
    },
    byBarber: {
      'Douglas': all.filter(b => b.barber === 'Douglas Tapia' || b.barber === 'Douglas').length,
      'Cristopher': all.filter(b => b.barber === 'Cristopher Tapia' || b.barber === 'Cristopher').length,
      'Sin preferencia': all.filter(b => b.barber === 'Sin preferencia / Cualquiera disponible').length
    },
    revenue: {
      today: todayBookings.reduce((sum, b) => sum + b.total, 0),
      thisMonth: thisMonthBookings.reduce((sum, b) => sum + b.total, 0),
      lastMonth: lastMonthBookings.reduce((sum, b) => sum + b.total, 0)
    },
    avgTicket: all.length > 0
      ? Math.round(all.reduce((sum, b) => sum + b.total, 0) / all.length * 100) / 100
      : 0
  };

  return res.status(200).json({ success: true, stats });
}

function listBookings(req, res) {
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
