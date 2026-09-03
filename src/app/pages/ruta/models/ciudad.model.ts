import { Actividad } from '../interfaces/actividad.model';

export interface PuntoInteres {
  nombre: string;
  direccion: string;
  imagen: string;
  descripcion: string;
  maps?: string;
}

export interface Ciudad {
  nombre: string;
  pais: string;
  descripcion: string;

  lugares: PuntoInteres[];

  restaurantes: PuntoInteres[];

  cafeterias: PuntoInteres[];

  curiosidades: string[];
}