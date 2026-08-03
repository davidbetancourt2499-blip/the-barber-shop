/**
 * THE BARBER SHOP — Services API
 * GET /api/services - List all services
 */

const services = [
  {
    id: 'haircut',
    name: 'Corte de Cabello General',
    description: 'Corte clásico o moderno con tijera y máquina, incluye lavado y peinado',
    price: 6,
    duration: 30,
    category: 'hair'
  },
  {
    id: 'beard',
    name: 'Perfilado / Afeitado de Barba',
    description: 'Perfilado con navaja, toalla caliente, aceite y bálsamo',
    price: 2,
    duration: 15,
    category: 'beard'
  },
  {
    id: 'eyebrows',
    name: 'Perfilado / Depilado de Cejas',
    description: 'Depilado con hilo o pinza, diseño personalizado',
    price: 2,
    duration: 10,
    category: 'face'
  },
  {
    id: 'color',
    name: 'Pintado / Tinte',
    description: 'Coloración profesional, cobertura de canas o cambio de look',
    price: 20,
    duration: 45,
    category: 'hair'
  }
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      services
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}