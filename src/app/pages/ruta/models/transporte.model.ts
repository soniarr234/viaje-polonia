export interface Transporte {
  id?: number;

  tipo: 'vuelo' | 'tren' | 'bus';

  origen: string;
  destino: string;

  fecha: string;

  horaSalida: string;
  horaLlegada: string;

  empresa?: string;
  asiento?: string;
  notas?: string;
}