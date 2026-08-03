/**
 * THE BARBER SHOP — Tests
 * Node's built-in test runner. No external deps.
 *
 * Run:  node --test tests/
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ServiceType,
  ServicePrices,
  BarberType,
  BarberPhones,
  getBarberPhone,
  TimePreference,
  BookingStatus,
  TimeSlots,
  MorningSlots,
  AfternoonSlots,
  NightSlots,
  generateFolio,
  validateBooking,
  calculateTotal,
  buildWhatsAppMessage
} from '../src/types/api.js';

// ---------------------------------------------------------------------------
// Services & prices
// ---------------------------------------------------------------------------
test('precios de servicios correctos', () => {
  assert.equal(ServicePrices[ServiceType.HAIRCUT], 6);
  assert.equal(ServicePrices[ServiceType.BEARD], 2);
  assert.equal(ServicePrices[ServiceType.EYEBROWS], 2);
  assert.equal(ServicePrices[ServiceType.COLOR], 20);
});

test('calculateTotal suma precios', () => {
  assert.equal(calculateTotal([ServiceType.HAIRCUT, ServiceType.BEARD]), 8);
  assert.equal(calculateTotal([]), 0);
  assert.equal(calculateTotal([ServiceType.COLOR, ServiceType.HAIRCUT]), 26);
});

// ---------------------------------------------------------------------------
// Barbers
// ---------------------------------------------------------------------------
test('teléfonos de barberos', () => {
  assert.equal(BarberPhones[BarberType.DOUGLAS], '525551112233');
  assert.equal(BarberPhones[BarberType.CRISTOPHER], '525554445566');
  assert.equal(BarberPhones[BarberType.ANY], '525551234567');
});

test('getBarberPhone resuelve variantes de display', () => {
  assert.equal(getBarberPhone('Douglas Tapia'), '525551112233');
  assert.equal(getBarberPhone('Douglas'), '525551112233');
  assert.equal(getBarberPhone('Cristopher Tapia'), '525554445566');
  assert.equal(getBarberPhone('Sin preferencia / Cualquiera disponible'), '525551234567');
  assert.equal(getBarberPhone(null), '525551234567');
});

// ---------------------------------------------------------------------------
// Time slots
// ---------------------------------------------------------------------------
test('slots de tiempo segmentados', () => {
  assert.equal(MorningSlots.length, 8);
  assert.equal(AfternoonSlots.length, 10);
  assert.equal(NightSlots.length, 6);
  assert.equal(MorningSlots.length + AfternoonSlots.length + NightSlots.length, TimeSlots.length);
});

// ---------------------------------------------------------------------------
// Folio
// ---------------------------------------------------------------------------
test('generateFolio produce formato TBS-XXXXX', () => {
  const folio = generateFolio();
  assert.match(folio, /^TBS-\d{5}$/);
});

test('folios son únicos en bucle', () => {
  const set = new Set();
  for (let i = 0; i < 500; i++) set.add(generateFolio());
  assert.equal(set.size, 500);
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
test('validateBooking acepta reserva válida', () => {
  const result = validateBooking({
    name: 'Carlos Mendoza',
    phone: '+52 555 123 4567',
    email: 'carlos@example.com',
    date: '2026-08-10',
    barber: BarberType.DOUGLAS,
    time: '10:00',
    services: [ServiceType.HAIRCUT]
  });
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('validateBooking rechaza datos incompletos', () => {
  const result = validateBooking({});
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('Nombre')));
  assert.ok(result.errors.some(e => e.includes('Teléfono')));
  assert.ok(result.errors.some(e => e.includes('Email')));
  assert.ok(result.errors.some(e => e.includes('Fecha')));
});

test('validateBooking exige hora para barbero específico', () => {
  const result = validateBooking({
    name: 'A', phone: '12345678', email: 'a@a.com', date: '2026-08-10',
    barber: BarberType.DOUGLAS, services: [ServiceType.HAIRCUT]
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('hora')));
});

test('validateBooking no exige hora para "Sin preferencia"', () => {
  const result = validateBooking({
    name: 'A', phone: '12345678', email: 'a@a.com', date: '2026-08-10',
    barber: BarberType.ANY, services: [ServiceType.HAIRCUT]
  });
  assert.equal(result.valid, true);
});

test('validateBooking rechaza email inválido', () => {
  const result = validateBooking({
    name: 'A', phone: '12345678', email: 'no-es-un-email', date: '2026-08-10',
    barber: BarberType.ANY, services: [ServiceType.HAIRCUT]
  });
  assert.equal(result.valid, false);
});

// ---------------------------------------------------------------------------
// WhatsApp message
// ---------------------------------------------------------------------------
test('buildWhatsAppMessage incluye folio y total', () => {
  const msg = buildWhatsAppMessage({
    folio: 'TBS-12345',
    name: 'Carlos',
    barber: BarberType.DOUGLAS,
    phone: '5551234567',
    date: '2026-08-10',
    time: '10:00',
    services: [ServiceType.HAIRCUT]
  });
  assert.ok(msg.includes('TBS-12345'));
  assert.ok(msg.includes('Carlos'));
  assert.ok(msg.includes('Douglas'));
  assert.ok(msg.includes('$6.00'));
});

test('buildWhatsAppMessage maneja "Sin preferencia"', () => {
  const msg = buildWhatsAppMessage({
    folio: 'TBS-00001',
    name: 'Carlos',
    barber: BarberType.ANY,
    phone: '5551234567',
    date: '2026-08-10',
    preference: TimePreference.MORNING,
    services: [ServiceType.HAIRCUT, ServiceType.BEARD]
  });
  assert.ok(msg.includes('THE BARBER SHOP'));
  assert.ok(msg.includes('preferencia: Mañana'));
  assert.ok(msg.includes('$8.00'));
});

// ---------------------------------------------------------------------------
// Statuses
// ---------------------------------------------------------------------------
test('BookingStatus tiene los 4 estados', () => {
  assert.deepEqual(
    Object.values(BookingStatus).sort(),
    ['cancelled', 'completed', 'confirmed', 'pending']
  );
});
