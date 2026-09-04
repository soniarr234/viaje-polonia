import { Actividad } from '../interfaces/actividad.model';

export interface Lugar {
  nombre: string;
  descripcion: string;
  direccion: string;
  imagen?: string;
  maps?: string;
}

export type TipoGastronomia =
  | 'restaurante'
  | 'cafeteria'
  | 'cerveceria'
  | 'postres';

export interface Gastronomia {
  nombre: string;
  tipo: TipoGastronomia;
  descripcion: string;
  direccion: string;
  imagen?: string;
  maps?: string;
}

export interface Curiosidad {
  titulo: string;
  descripcion: string;
}

export interface Ciudad {
  nombre: string;
  pais: string;
  descripcion: string;

  lugares: Lugar[];

  gastronomia: Gastronomia[];

  curiosidades: Curiosidad[];
}