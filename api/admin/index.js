/**
 * THE BARBER SHOP — Admin API
 * GET /api/admin/stats - Dashboard statistics
 * GET /api/admin/bookings - List all bookings (with filters)
 * PATCH /api/admin/bookings/[id] - Update booking status
 */

import { bookings } from '../bookings/index.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Verify admin token
  const authHeader = req.headers.authorization;
  const adminToken = process.env.ADMIN_TOKEN || 'admin-secret-change-me';

  if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const { stats } = req.query;
      if (stats) return getStats(req, res);
      return listBookings(req, res);
    }

    if (req.method === 'PATCH') {
      return updateBooking(req, res);
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
      'Douglas': all.filter(b => b.barber === 'Douglas').length,
      'Cristopher': all.filter(b => b.barber === 'Cristopher').length,
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

function updateBooking(req, res) {
  const { id } = req.query;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const booking = bookings.get(id);
  if (!booking) {
    return res.status(404).json({ error: 'Reserva no encontrada' });
  }

  booking.status = status;
  booking.updatedAt = new Date().toISOString();
  bookings.set(id, booking);

  return res.status(200).json({ success: true, booking });
}