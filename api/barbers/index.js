/**
 * THE BARBER SHOP — Barbers API
 * GET /api/barbers - List all barbers
 */

const barbers = [
  {
    id: 'douglas',
    name: 'Douglas',
    slug: 'douglas',
    title: 'Barbero Senior',
    bio: 'Especialista en fades modernos, barbas clásicas y diseño de cejas. 10+ años de experiencia.',
    image: '/img/douglas.jpg',
    specialties: ['Fades', 'Barbas clásicas', 'Diseño de cejas', 'Cortes tijera'],
    phone: '525551112233',
    whatsapp: 'https://wa.me/525551112233',
    schedule: {
      monday: { start: '09:00', end: '20:00' },
      tuesday: { start: '09:00', end: '20:00' },
      wednesday: { start: '09:00', end: '20:00' },
      thursday: { start: '09:00', end: '20:00' },
      friday: { start: '09:00', end: '20:00' },
      saturday: { start: '09:00', end: '18:00' },
      sunday: null
    }
  },
  {
    id: 'cristopher',
    name: 'Cristopher',
    slug: 'cristopher',
    title: 'Barbero Experto',
    bio: 'Maestro en cortes de tijera, tintes y tratamientos capilares. Estilo clásico con toque moderno.',
    image: '/img/cristopher.jpg',
    specialties: ['Cortes tijera', 'Tintes/Color', 'Tratamientos', 'Barbas'],
    phone: '525554445566',
    whatsapp: 'https://wa.me/525554445566',
    schedule: {
      monday: { start: '10:00', end: '19:00' },
      tuesday: { start: '10:00', end: '19:00' },
      wednesday: { start: '10:00', end: '19:00' },
      thursday: { start: '10:00', end: '19:00' },
      friday: { start: '10:00', end: '19:00' },
      saturday: { start: '09:00', end: '17:00' },
      sunday: null
    }
  }
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      barbers
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}