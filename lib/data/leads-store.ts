import { Lead } from '@/lib/types/lead'

// Simulación de base de datos en memoria compartida
export const leadsStore: Lead[] = [
  {
    id: '1',
    nombre: 'Juan Pérez',
    empresa: 'Distribuidora Norte',
    email: 'juan@distribuidoranorte.com',
    telefono: '+54 9 11 1234-5678',
    producto: 'alfajores',
    marca: 'si',
    volumen: '1000-5000',
    envasado: 'flowpack-personalizado',
    mensaje: 'Necesito cotización para línea de alfajores premium',
    inversionEstimada: '$5.300.000',
    stage: 'entrante',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: [],
  },
  {
    id: '2',
    nombre: 'María García',
    empresa: 'Delicias del Sur',
    email: 'maria@deliciasdelsur.com.ar',
    telefono: '+54 9 11 9876-5432',
    producto: 'galletitas',
    marca: 'no',
    volumen: 'menos-1000',
    envasado: 'a-granel',
    mensaje: 'Buscamos proveedor para galletitas integrales',
    inversionEstimada: '$800.000',
    stage: 'primer-llamado',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    notes: ['Cliente interesado, esperando propuesta comercial'],
    lastContact: new Date(Date.now() - 86400000).toISOString(),
  },
]

