/**
 * THE BARBER SHOP — Admin API
 * GET /api/admin?stats=1          - Dashboard statistics
 * GET /api/admin?date=&status=..  - List bookings (with filters)
 */

import { getAllBookings } from '../_lib/storage.js';
import { requireAdmin } from '../_lib/auth.js';
import { isPersistent } from '../_lib/storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAdmin(req, res);
  if (!auth) return;

  try {
    if (req.method === 'GET') {
      if (req.query.stats) return await getStats(req, res);
      return await listBookings(req, res);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getStats(req, res) {
  const all = await getAllBookings();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thisMonth = now.toISOString().slice(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);

  const todayBookings = all.filter(b => b.date === today);
  const thisMonthBookings = all.filter(b => (b.createdAt || '').startsWith(thisMonth));
  const lastMonthBookings = all.filter(b => (b.createdAt || '').startsWith(lastMonth));

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
      today: todayBookings.reduce((sum, b) => sum + Number(b.total || 0), 0),
      thisMonth: thisMonthBookings.reduce((sum, b) => sum + Number(b.total || 0), 0),
      lastMonth: lastMonthBookings.reduce((sum, b) => sum + Number(b.total || 0), 0)
    },
    avgTicket: all.length > 0
      ? Math.round(all.reduce((sum, b) => sum + Number(b.total || 0), 0) / all.length * 100) / 100
      : 0
  };

  return res.status(200).json({ success: true, persistent: isPersistent(), stats });
}

async function listBookings(req, res) {
  const all = await getAllBookings();
  const { date, status, barber } = req.query;

  let filtered = all;
  if (date) filtered = filtered.filter(b => b.date === date);
  if (status) filtered = filtered.filter(b => b.status === status);
  if (barber) filtered = filtered.filter(b => b.barber === barber);

  return res.status(200).json({
    success: true,
    persistent: isPersistent(),
    bookings: filtered,
    total: filtered.length
  });
}
