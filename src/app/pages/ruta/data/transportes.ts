import { Transporte } from '../models/transporte.model';

export const TRANSPORTES: Transporte[] = [
  {
    tipo: 'vuelo',
    origen: 'Madrid',
    destino: 'Cracovia',
    fecha: '12 Sep 2026',
    horaSalida: '08:15',
    horaLlegada: '12:05',
    asiento: 'ABC123',
  },

  {
    tipo: 'tren',
    origen: 'Cracovia',
    destino: 'Varsovia',
    fecha: '15 Sep 2026',
    horaSalida: '09:40',
    horaLlegada: '12:20',
    asiento: 'PKP-4587',
  },
];
