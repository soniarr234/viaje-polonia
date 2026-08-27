import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TRANSPORTES } from './data/transportes';
import { HOTELES } from './data/hoteles';
import { CIUDADES } from './data/ciudades';

import { Transporte } from './models/transporte.model';
import { Hotel } from './models/hotel.model';
import { Ciudad } from './models/ciudad.model';

@Component({
  selector: 'app-ruta',
  imports: [CommonModule, FormsModule],
  templateUrl: './ruta.html',
  styleUrl: './ruta.css',
})
export class Ruta implements OnInit {
  vista: 'transportes' | 'hoteles' | 'ciudades' = 'transportes';

  transportes: Transporte[] = [...TRANSPORTES];

  hoteles: Hotel[] = [...HOTELES];

  ciudades: Ciudad[] = [...CIUDADES];

  mostrarFormularioTransporte = false;

  editando = false;

  indiceEditando = -1;

  nuevoTransporte: Transporte = {
    tipo: 'vuelo',
    origen: '',
    destino: '',
    fecha: '',
    horaSalida: '',
    horaLlegada: '',
    empresa: '',
    asiento: '',
    notas: '',
  };

  mostrarFormularioHotel = false;

  editandoHotel = false;

  indiceHotelEditando = -1;

  nuevoHotel: Hotel = {
    nombre: '',
    ciudad: '',
    checkIn: '',
    checkOut: '',
    precio: undefined,
    pagado: false,
    direccion: '',
    notas: '',
  };

  constructor() {}

  ngOnInit() {
    const transportesGuardados = localStorage.getItem('transportes');

    if (transportesGuardados) {
      this.transportes = JSON.parse(transportesGuardados);
    }

    const hotelesGuardados = localStorage.getItem('hoteles');

    if (hotelesGuardados) {
      this.hoteles = JSON.parse(hotelesGuardados);
    }
  }

  cambiarVista(vista: 'transportes' | 'hoteles' | 'ciudades') {
    this.vista = vista;
  }

  agregarTransporte() {
    if (
      !this.nuevoTransporte.origen.trim() ||
      !this.nuevoTransporte.destino.trim()
    ) {
      return;
    }

    if (this.editando && this.indiceEditando >= 0) {
      this.transportes[this.indiceEditando] = {
        ...this.nuevoTransporte,
      };

      this.editando = false;
      this.indiceEditando = -1;
    } else {
      this.transportes.push({
        ...this.nuevoTransporte,
      });
    }

    localStorage.setItem('transportes', JSON.stringify(this.transportes));

    this.reiniciarFormulario();

    this.mostrarFormularioTransporte = false;
  }

  editarTransporte(index: number) {
    this.editando = true;

    this.indiceEditando = index;

    this.nuevoTransporte = {
      ...this.transportes[index],
    };

    this.mostrarFormularioTransporte = true;

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  eliminarTransporte(index: number) {
    this.transportes.splice(index, 1);

    localStorage.setItem('transportes', JSON.stringify(this.transportes));
  }

  reiniciarFormulario() {
    this.editando = false;

    this.indiceEditando = -1;

    this.nuevoTransporte = {
      tipo: 'vuelo',
      origen: '',
      destino: '',
      fecha: '',
      horaSalida: '',
      horaLlegada: '',
      empresa: '',
      asiento: '',
      notas: '',
    };
  }

  get vuelos(): Transporte[] {
    return this.transportes
      .filter((t) => t.tipo === 'vuelo')
      .sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );
  }

  get trenes(): Transporte[] {
    return this.transportes
      .filter((t) => t.tipo === 'tren')
      .sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );
  }

  get buses(): Transporte[] {
    return this.transportes
      .filter((t) => t.tipo === 'bus')
      .sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );
  }

  get hotelesOrdenados(): Hotel[] {
    return [...this.hoteles].sort(
      (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()
    );
  }

  agregarHotel() {
    if (!this.nuevoHotel.nombre.trim() || !this.nuevoHotel.ciudad.trim()) {
      return;
    }

    if (this.editandoHotel && this.indiceHotelEditando >= 0) {
      this.hoteles[this.indiceHotelEditando] = {
        ...this.nuevoHotel,
      };

      this.editandoHotel = false;
      this.indiceHotelEditando = -1;
    } else {
      this.hoteles.push({
        ...this.nuevoHotel,
      });
    }

    localStorage.setItem('hoteles', JSON.stringify(this.hoteles));

    this.reiniciarHotel();

    this.mostrarFormularioHotel = false;
  }

  editarHotel(index: number) {
    this.editandoHotel = true;

    this.indiceHotelEditando = index;

    this.nuevoHotel = {
      ...this.hoteles[index],
    };

    this.mostrarFormularioHotel = true;
  }

  eliminarHotel(index: number) {
    this.hoteles.splice(index, 1);

    localStorage.setItem('hoteles', JSON.stringify(this.hoteles));
  }

  reiniciarHotel() {
    this.editandoHotel = false;

    this.indiceHotelEditando = -1;

    this.nuevoHotel = {
      nombre: '',
      ciudad: '',
      checkIn: '',
      checkOut: '',
      precio: undefined,
      pagado: false,
      direccion: '',
      notas: '',
    };
  }
}
