import { Actividad } from '../interfaces/actividad.model';

export interface Ciudad {
  nombre: string;

  pais: string;

  historia: string;

  imprescindibles: Actividad[];

  restaurantes: Actividad[];

  cafeterias: Actividad[];

  consejos: string[];
}
