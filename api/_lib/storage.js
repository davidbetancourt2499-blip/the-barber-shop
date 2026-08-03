/**
 * THE BARBER SHOP — Storage adapter
 *
 * Uses Supabase (PostgREST REST API) when SUPABASE_URL + SUPABASE_SERVICE_KEY
 * are configured, otherwise falls back to an in-memory Map (demo mode).
 *
 * Env vars (set in Vercel → Project → Settings → Environment Variables):
 *   SUPABASE_URL            e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY    Project Settings → API → service_role secret
 */

// ---------------------------------------------------------------------------
// Supabase client (no SDK needed — plain PostgREST via fetch)
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TABLE = 'bookings';

const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

async function supabaseFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${method} ${path} -> ${res.status}: ${text.slice(0, 200)}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('json')) return res.json();
  return null;
}

// ---------------------------------------------------------------------------
// In-memory fallback
// ---------------------------------------------------------------------------
const memoryStore = new Map();

// ---------------------------------------------------------------------------
// Row mapping (DB snake/camel normalization)
// ---------------------------------------------------------------------------
function toDb(booking) {
  return {
    id: booking.id || booking.folio,
    folio: booking.folio,
    name: booking.name,
    phone: booking.phone,
    email: booking.email,
    date: booking.date,
    time: booking.time || null,
    preference: booking.preference || null,
    barber: booking.barber,
    services: booking.services,
    total: booking.total,
    status: booking.status || 'pending',
    whatsapp_message: booking.whatsappMessage || null,
    whatsapp_phone: booking.whatsappPhone || null,
    created_at: booking.createdAt || new Date().toISOString(),
    updated_at: booking.updatedAt || new Date().toISOString()
  };
}

function fromDb(row) {
  return {
    id: row.id,
    folio: row.folio,
    name: row.name,
    phone: row.phone,
    email: row.email,
    date: row.date,
    time: row.time,
    preference: row.preference,
    barber: row.barber,
    services: Array.isArray(row.services) ? row.services : [],
    total: Number(row.total || 0),
    status: row.status,
    whatsappMessage: row.whatsapp_message,
    whatsappPhone: row.whatsapp_phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// ---------------------------------------------------------------------------
// API surface
// ---------------------------------------------------------------------------
export async function createBooking(booking) {
  if (hasSupabase) {
    const rows = await supabaseFetch(`/${TABLE}`, {
      method: 'POST',
      body: toDb(booking),
      headers: { Prefer: 'return=representation' }
    });
    return fromDb(rows[0]);
  }
  memoryStore.set(booking.folio, booking);
  return booking;
}

export async function getBooking(folio) {
  if (hasSupabase) {
    const rows = await supabaseFetch(`/${TABLE}?id=eq.${encodeURIComponent(folio)}&select=*&limit=1`);
    return rows.length ? fromDb(rows[0]) : null;
  }
  return memoryStore.get(folio) || null;
}

export async function updateBookingStatus(folio, status) {
  if (hasSupabase) {
    const rows = await supabaseFetch(`/${TABLE}?id=eq.${encodeURIComponent(folio)}`, {
      method: 'PATCH',
      body: { status, updated_at: new Date().toISOString() },
      headers: { Prefer: 'return=representation' }
    });
    return rows.length ? fromDb(rows[0]) : null;
  }
  const booking = memoryStore.get(folio);
  if (!booking) return null;
  booking.status = status;
  booking.updatedAt = new Date().toISOString();
  return booking;
}

export async function listBookings({ date, status, barber, limit = 50, offset = 0 } = {}) {
  if (hasSupabase) {
    const filters = [];
    if (date) filters.push(`date=eq.${encodeURIComponent(date)}`);
    if (status) filters.push(`status=eq.${encodeURIComponent(status)}`);
    if (barber) filters.push(`barber=eq.${encodeURIComponent(barber)}`);

    const qs = new URLSearchParams({
      select: '*',
      order: 'created_at.desc',
      limit: String(limit),
      offset: String(offset)
    });
    const rows = await supabaseFetch(`/${TABLE}?${qs}&${filters.join('&')}`);
    return rows.map(fromDb);
  }

  let filtered = Array.from(memoryStore.values());
  if (date) filtered = filtered.filter(b => b.date === date);
  if (status) filtered = filtered.filter(b => b.status === status);
  if (barber) filtered = filtered.filter(b => b.barber === barber);
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return filtered.slice(offset, offset + limit);
}

export async function countBookings({ date, status, barber } = {}) {
  if (hasSupabase) {
    const filters = [];
    if (date) filters.push(`date=eq.${encodeURIComponent(date)}`);
    if (status) filters.push(`status=eq.${encodeURIComponent(status)}`);
    if (barber) filters.push(`barber=eq.${encodeURIComponent(barber)}`);

    const qs = new URLSearchParams({ select: 'id', limit: '0' });
    const rows = await supabaseFetch(`/${TABLE}?${qs}&${filters.join('&')}`);
    return rows?.length ?? 0;
  }

  let filtered = Array.from(memoryStore.values());
  if (date) filtered = filtered.filter(b => b.date === date);
  if (status) filtered = filtered.filter(b => b.status === status);
  if (barber) filtered = filtered.filter(b => b.barber === barber);
  return filtered.length;
}

export async function getAllBookings() {
  if (hasSupabase) {
    const qs = new URLSearchParams({ select: '*', order: 'created_at.desc', limit: '1000' });
    const rows = await supabaseFetch(`/${TABLE}?${qs}`);
    return rows.map(fromDb);
  }
  return Array.from(memoryStore.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function isPersistent() {
  return hasSupabase;
}
