/**
 * THE BARBER SHOP — Bookings API
 * POST /api/bookings - Create new booking
 * GET  /api/bookings - List bookings (admin)
 * GET  /api/bookings/[id] - Get single booking
 * PATCH /api/bookings/[id] - Update booking status (admin)
 */

import { validateBooking, generateFolio, buildWhatsAppMessage, calculateTotal, BookingStatus, getBarberPhone } from '../../src/types/api.js';
import { requireAdmin } from '../_lib/auth.js';

// In-memory storage (in production, use Vercel KV, Supabase, or similar)
export const bookings = new Map();
const bookingIndex = new Map(); // date -> Set of booking IDs

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'POST':
        return await createBooking(req, res);
      case 'GET':
        return await listBookings(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Bookings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function createBooking(req, res) {
  const data = req.body;

  // Validate
  const validation = validateBooking(data);
  if (!validation.valid) {
    return res.status(400).json({ error: 'Validation failed', details: validation.errors });
  }

  // Generate folio (respect client-provided folio if present)
  const folio = (data.folio && /^TBS-\d{5}$/.test(data.folio)) ? data.folio : generateFolio();

  const isAny = (b) => b && String(b).includes('Sin preferencia');
  const time = isAny(data.barber) ? (data.time || null) : data.time;
  const preference = isAny(data.barber) ? (data.preference || null) : null;

  // Build booking object
  const booking = {
    id: folio,
    folio,
    name: data.name.trim(),
    phone: data.phone.trim(),
    email: data.email.trim().toLowerCase(),
    date: data.date,
    time,
    preference,
    barber: data.barber,
    services: data.services,
    total: calculateTotal(data.services),
    status: BookingStatus.PENDING,
    whatsappMessage: buildWhatsAppMessage({ ...data, folio }),
    whatsappPhone: getBarberPhone(data.barber),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Store
  bookings.set(folio, booking);

  // Index by date
  if (!bookingIndex.has(data.date)) {
    bookingIndex.set(data.date, new Set());
  }
  bookingIndex.get(data.date).add(folio);

  // Return success (without internal fields)
  return res.status(201).json({
    success: true,
    booking: {
      folio: booking.folio,
      name: booking.name,
      date: booking.date,
      time: booking.time,
      preference: booking.preference,
      barber: booking.barber,
      services: booking.services,
      total: booking.total,
      whatsappUrl: `https://wa.me/${booking.whatsappPhone}?text=${encodeURIComponent(booking.whatsappMessage)}`,
      status: booking.status
    }
  });
}

async function listBookings(req, res) {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  const { date, status, barber, limit = '50', offset = '0' } = req.query;

  let filtered = Array.from(bookings.values());

  // Apply filters
  if (date) {
    filtered = filtered.filter(b => b.date === date);
  }
  if (status) {
    filtered = filtered.filter(b => b.status === status);
  }
  if (barber) {
    filtered = filtered.filter(b => b.barber === barber);
  }

  // Sort by createdAt desc
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Pagination
  const start = parseInt(offset);
  const end = start + parseInt(limit);
  const paginated = filtered.slice(start, end);

  return res.status(200).json({
    success: true,
    bookings: paginated.map(b => ({
      folio: b.folio,
      name: b.name,
      phone: b.phone,
      email: b.email,
      date: b.date,
      time: b.time,
      preference: b.preference,
      barber: b.barber,
      services: b.services,
      total: b.total,
      status: b.status,
      createdAt: b.createdAt
    })),
    total: filtered.length,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
}