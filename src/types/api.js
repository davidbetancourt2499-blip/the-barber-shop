/**
 * THE BARBER SHOP — API TYPES
 * Shared types for frontend and backend
 */

export const ServiceType = {
  HAIRCUT: 'Corte de Cabello General',
  BEARD: 'Perfilado / Afeitado de Barba',
  EYEBROWS: 'Perfilado / Depilado de Cejas',
  COLOR: 'Pintado / Tinte'
};

export const ServicePrices = {
  [ServiceType.HAIRCUT]: 6,
  [ServiceType.BEARD]: 2,
  [ServiceType.EYEBROWS]: 2,
  [ServiceType.COLOR]: 20
};

export const BarberType = {
  DOUGLAS: 'Douglas',
  CRISTOPHER: 'Cristopher',
  ANY: 'Sin preferencia / Cualquiera disponible'
};

export const BarberPhones = {
  [BarberType.DOUGLAS]: '593983267552',
  [BarberType.CRISTOPHER]: '593991794503',
  [BarberType.ANY]: '525551234567'
};

/**
 * Resolve a barber's WhatsApp phone from any display variant
 * ("Douglas", "Douglas Tapia", "Cristopher Tapia", etc.).
 */
export function getBarberPhone(name) {
  if (!name) return BarberPhones[BarberType.ANY];
  const n = String(name).toLowerCase();
  if (n.includes('sin preferencia') || n.includes('cualquiera')) return BarberPhones[BarberType.ANY];
  if (n.includes('cristopher')) return BarberPhones[BarberType.CRISTOPHER];
  if (n.includes('douglas')) return BarberPhones[BarberType.DOUGLAS];
  return BarberPhones[BarberType.ANY];
}

export const TimePreference = {
  MORNING: 'Mañana',
  AFTERNOON: 'Tarde',
  NIGHT: 'Noche'
};

export const BookingStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

export const TimeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
];

export const MorningSlots = TimeSlots.filter(t => {
  const h = parseInt(t.split(':')[0]);
  return h >= 9 && h < 13;
});

export const AfternoonSlots = TimeSlots.filter(t => {
  const h = parseInt(t.split(':')[0]);
  return h >= 13 && h < 18;
});

export const NightSlots = TimeSlots.filter(t => {
  const h = parseInt(t.split(':')[0]);
  return h >= 18 && h <= 20;
});

/**
 * Generate a unique booking folio (TBS-XXXXX).
 * Uses a monotonic counter so consecutive folios never collide
 * within the same process/session.
 */
let _folioCounter = 0;

export function generateFolio() {
  _folioCounter = (_folioCounter + 1) % 100000;
  return `TBS-${String(_folioCounter).padStart(5, '0')}`;
}

/**
 * Validate booking data
 */
export function validateBooking(data) {
  const errors = [];

  if (!data.name?.trim()) errors.push('Nombre es obligatorio');
  if (!data.phone?.trim()) errors.push('Teléfono es obligatorio');
  if (!data.email?.trim()) errors.push('Email es obligatorio');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email inválido');
  }
  if (!data.date) errors.push('Fecha es obligatoria');
  if (!data.services?.length) errors.push('Selecciona al menos un servicio');
  if (!data.barber) errors.push('Barbero es obligatorio');

  // For specific barbers, time is required
  if (data.barber !== BarberType.ANY && !data.time) {
    errors.push('Selecciona una hora');
  }

  // For "any" barber, preference is optional but recommended
  if (data.barber === BarberType.ANY && !data.preference) {
    // Not an error, just a warning
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculate total price from services
 */
export function calculateTotal(services) {
  return services.reduce((sum, s) => sum + (ServicePrices[s] || 0), 0);
}

/**
 * Build WhatsApp message
 */
export function buildWhatsAppMessage(booking) {
  const isAny = booking.barber === BarberType.ANY || String(booking.barber).toLowerCase().includes('sin preferencia');
  const barberName = isAny ? 'THE BARBER SHOP' : booking.barber;
  const barberPhone = getBarberPhone(booking.barber);

  const timeText = isAny
    ? (booking.preference ? `Por confirmar (preferencia: ${booking.preference})` : 'Por confirmar (según disponibilidad)')
    : booking.time;

  const dateTimeText = isAny
    ? `${booking.date} — Horario: ${timeText}`
    : `${booking.date} a las ${booking.time}`;

  const serviceLines = booking.services.map(s =>
    `• ${s} ($${ServicePrices[s]} USD)`
  ).join('\n');

  const total = calculateTotal(booking.services);

  return `¡Hola ${barberName}! Quiero reservar una cita en THE BARBER SHOP:\n\n` +
    `*Folio:* ${booking.folio}\n` +
    `*Cliente:* ${booking.name}\n` +
    `*Barbero:* ${booking.barber}\n` +
    `*Teléfono:* ${booking.phone}\n` +
    `*Fecha:* ${booking.date}\n` +
    `*Hora:* ${timeText}\n\n` +
    `*Servicios:*\n${serviceLines}\n\n` +
    `*Total:* $${total.toFixed(2)} USD`;
}