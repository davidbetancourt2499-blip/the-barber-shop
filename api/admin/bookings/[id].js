/**
 * THE BARBER SHOP — Update single booking
 * PATCH /api/admin/bookings/[id]
 */

import { bookings } from '../../bookings/index.js';
import { requireAdmin } from '../../_lib/auth.js';
import { BookingStatus } from '../../../src/types/api.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const auth = requireAdmin(req, res);
  if (!auth) return;

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { status } = req.body || {};

  const validStatuses = Object.values(BookingStatus);
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Estado inválido. Válidos: ${validStatuses.join(', ')}` });
  }

  const booking = bookings.get(id);
  if (!booking) {
    return res.status(404).json({ error: 'Reserva no encontrada' });
  }

  booking.status = status;
  booking.updatedAt = new Date().toISOString();
  bookings.set(id, booking);

  return res.status(200).json({
    success: true,
    booking: {
      folio: booking.folio,
      status: booking.status,
      updatedAt: booking.updatedAt
    }
  });
}
