export interface Hotel {
  id?: number;

  nombre: string;
  ciudad: string;

  checkIn: string;
  checkOut: string;

  precio?: number;
  pagado: boolean;

  direccion?: string;
  notas?: string;
}