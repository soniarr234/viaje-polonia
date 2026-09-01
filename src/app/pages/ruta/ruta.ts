import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';


import { CIUDADES } from './data/ciudades';

import { Transporte } from './models/transporte.model';
import { Hotel } from './models/hotel.model';
import { Ciudad } from './models/ciudad.model';

import { supabase } from '../../core/supabase';

@Component({
  selector: 'app-ruta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ruta.html',
  styleUrl: './ruta.css',
})
export class Ruta implements OnInit {
  vista: 'transportes' | 'hoteles' | 'ciudades' = 'transportes';

  transportes: Transporte[] = [];
  vuelos: Transporte[] = [];
  trenes: Transporte[] = [];
  buses: Transporte[] = [];

  hoteles: Hotel[] = [];
  ciudades: Ciudad[] = [...CIUDADES];

  mostrarFormularioTransporte = false;
  mostrarFormularioHotel = false;

  editando = false;
  editandoHotel = false;

  indiceEditando = -1;
  indiceHotelEditando = -1;

  guardandoTransporte = false;

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

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.cargarTransportes();
    await this.cargarHoteles();
  
    setTimeout(() => {
      this.cdr.detectChanges();
    });
  }

  async cargarTransportes() {
    const { data, error } = await supabase
      .from('transporte')
      .select('*')
      .order('fecha');
  
    if (error) {
      console.error(error);
      return;
    }
  
    this.transportes = (data || []).map((t) => ({
      id: t.id,
      tipo: t.tipo,
      origen: t.origen,
      destino: t.destino,
      fecha: t.fecha,
      horaSalida: t.horaSalida,
      horaLlegada: t.horaLlegada,
      empresa: t.empresa,
      asiento: t.asiento,
      notas: t.notas,
    }));
  
    this.vuelos = this.transportes.filter(
      (t) => t.tipo === 'vuelo'
    );
  
    this.trenes = this.transportes.filter(
      (t) => t.tipo === 'tren'
    );
  
    this.buses = this.transportes.filter(
      (t) => t.tipo === 'bus'
    );

    this.cdr.detectChanges();
  }
  

  async cargarHoteles() {
    const { data, error } = await supabase
      .from('hoteles')
      .select('*')
      .order('checkin');

    if (error) {
      console.error(error);
      return;
    }

    this.hoteles = (data || []).map((h) => ({
      id: h.id,
      nombre: h.nombre,
      ciudad: h.ciudad,
      checkIn: h.checkin,
      checkOut: h.checkout,
      precio: h.precio,
      pagado: h.pagado,
      direccion: h.direccion,
      notas: h.notas,
    }));
  }

  cambiarVista(vista: 'transportes' | 'hoteles' | 'ciudades') {
    this.vista = vista;
  }

  async agregarTransporte() {
    if (
      !this.nuevoTransporte.origen.trim() ||
      !this.nuevoTransporte.destino.trim()
    ) {
      return;
    }

    if (this.editando) {
      const { error } = await supabase
        .from('transporte')
        .update({
          tipo: this.nuevoTransporte.tipo,
          origen: this.nuevoTransporte.origen,
          destino: this.nuevoTransporte.destino,
          fecha: this.nuevoTransporte.fecha,
          horaSalida: this.nuevoTransporte.horaSalida,
          horaLlegada: this.nuevoTransporte.horaLlegada,
          empresa: this.nuevoTransporte.empresa,
          asiento: this.nuevoTransporte.asiento,
          notas: this.nuevoTransporte.notas,
        })
        .eq('id', this.indiceEditando);

      if (error) {
        console.error(error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('transporte')
        .insert({
          tipo: this.nuevoTransporte.tipo,
          origen: this.nuevoTransporte.origen,
          destino: this.nuevoTransporte.destino,
          fecha: this.nuevoTransporte.fecha,
          horaSalida: this.nuevoTransporte.horaSalida,
          horaLlegada: this.nuevoTransporte.horaLlegada,
          empresa: this.nuevoTransporte.empresa,
          asiento: this.nuevoTransporte.asiento,
          notas: this.nuevoTransporte.notas,
        });

      if (error) {
        console.error(error);
        return;
      }
    }

    await this.cargarTransportes();

    this.reiniciarFormulario();

    this.mostrarFormularioTransporte = false;

    this.cdr.detectChanges();
  }

  editarTransporte(transporte: Transporte) {
    this.editando = true;

    this.indiceEditando = transporte.id || -1;

    this.nuevoTransporte = {
      ...transporte,
    };

    this.mostrarFormularioTransporte = true;

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  async eliminarTransporte(transporte: Transporte) {
    if (!transporte.id) {
      return;
    }

    const { error } = await supabase
      .from('transporte')
      .delete()
      .eq('id', transporte.id);

    if (error) {
      console.error(error);
      return;
    }

    await this.cargarTransportes();
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

  get hotelesOrdenados(): Hotel[] {
    return [...this.hoteles].sort(
      (a, b) =>
        new Date(a.checkIn).getTime() -
        new Date(b.checkIn).getTime()
    );
  }

  async agregarHotel() {
    if (
      !this.nuevoHotel.nombre.trim() ||
      !this.nuevoHotel.ciudad.trim()
    ) {
      return;
    }

    if (this.editandoHotel) {
      const { error } = await supabase
        .from('hoteles')
        .update({
          nombre: this.nuevoHotel.nombre,
          ciudad: this.nuevoHotel.ciudad,
          checkin: this.nuevoHotel.checkIn,
          checkout: this.nuevoHotel.checkOut,
          precio: this.nuevoHotel.precio,
          pagado: this.nuevoHotel.pagado,
          direccion: this.nuevoHotel.direccion,
          notas: this.nuevoHotel.notas,
        })
        .eq('id', this.indiceHotelEditando);

      if (error) {
        console.error(error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('hoteles')
        .insert({
          nombre: this.nuevoHotel.nombre,
          ciudad: this.nuevoHotel.ciudad,
          checkin: this.nuevoHotel.checkIn,
          checkout: this.nuevoHotel.checkOut,
          precio: this.nuevoHotel.precio,
          pagado: this.nuevoHotel.pagado,
          direccion: this.nuevoHotel.direccion,
          notas: this.nuevoHotel.notas,
        });

      if (error) {
        console.error(error);
        return;
      }
    }

    await this.cargarHoteles();

    this.reiniciarHotel();

    this.mostrarFormularioHotel = false;
  }

  editarHotel(hotel: Hotel) {
    this.editandoHotel = true;

    this.indiceHotelEditando = hotel.id || -1;

    this.nuevoHotel = {
      ...hotel,
    };

    this.mostrarFormularioHotel = true;
  }

  async eliminarHotel(hotel: Hotel) {
    if (!hotel.id) {
      return;
    }

    const { error } = await supabase
      .from('hoteles')
      .delete()
      .eq('id', hotel.id);

    if (error) {
      console.error(error);
      return;
    }

    await this.cargarHoteles();
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