export interface Lugar {
  id?: number;
  ciudadId?: number;

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
  id?: number;
  ciudadId?: number;

  nombre: string;
  tipo: TipoGastronomia;
  descripcion: string;
  direccion: string;
  imagen?: string;
  maps?: string;
}

export interface Curiosidad {
  id?: number;
  ciudadId?: number;

  titulo: string;
  descripcion: string;
}

export interface Ciudad {
  id?: number;

  nombre: string;
  pais: string;
  descripcion: string;

  lugares: Lugar[];
  gastronomia: Gastronomia[];
  curiosidades: Curiosidad[];
}