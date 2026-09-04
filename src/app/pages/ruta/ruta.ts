import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CIUDADES } from './data/ciudades';

import { Transporte } from './models/transporte.model';
import { Hotel } from './models/hotel.model';
import {
  Ciudad,
  Lugar,
  Gastronomia,
  Curiosidad
} from './models/ciudad.model';

import { supabase } from '../../core/supabase';

@Component({
  selector: 'app-ruta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ruta.html',
  styleUrl: './ruta.css',
})
export class Ruta implements OnInit {
  // ==========================================
  // 1. PROPIEDADES DE ESTADO Y VISTAS
  // ==========================================
  vista: 'transportes' | 'hoteles' | 'ciudades' =
    (localStorage.getItem('ruta-vista') as
      'transportes' | 'hoteles' | 'ciudades') || 'transportes';

  subVistaCiudades: 'ciudades' | 'ruta' = 'ciudades';

  itemAbierto: string | null = null;

  // ==========================================
  // 2. PROPIEDADES - TRANSPORTE
  // ==========================================
  transportes: Transporte[] = [];
  vuelos: Transporte[] = [];
  trenes: Transporte[] = [];
  buses: Transporte[] = [];
  mostrarFormularioTransporte = false;
  editando = false;
  indiceEditando = -1;
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

  // ==========================================
  // 3. PROPIEDADES - HOTEL
  // ==========================================
  hoteles: Hotel[] = [];
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

  // ==========================================
  // 4. PROPIEDADES - CIUDAD
  // ==========================================
  ciudades: Ciudad[] = [...CIUDADES];
  ciudadSeleccionada: Ciudad | null = null;
  mostrarFormularioCiudad = false;
  editandoCiudad = false;
  indiceCiudadEditando = -1;

  mostrarFormularioLugar = false;
  editandoLugar = false;
  indiceLugarEditando = -1;

  nuevoLugar: Lugar = {
    nombre: '',
    descripcion: '',
    direccion: '',
    imagen: '',
    maps: ''
  };


  mostrarFormularioGastronomia = false;
  editandoGastronomia = false;
  indiceGastronomiaEditando = -1;

  dropdownGastronomiaAbierto = false;

  nuevaGastronomia: Gastronomia = {
    nombre: '',
    tipo: 'restaurante',
    descripcion: '',
    direccion: '',
    imagen: '',
    maps: ''
  };

  nuevaCiudad: Ciudad = {
    nombre: '',
    pais: '',
    descripcion: '',
    lugares: [],
    gastronomia: [],
    curiosidades: []
  };

  constructor(private cdr: ChangeDetectorRef) {}

  // ==========================================
  // 5. CICLO DE VIDA (LIFECYCLE HOOKS)
  // ==========================================
  async ngOnInit() {
    await this.cargarTransportes();
    await this.cargarHoteles();
  
    setTimeout(() => {
      this.cdr.detectChanges();
    });
  }

  // ==========================================
  // 6. MÉTODOS DE CARGA DE DATOS (SUPABASE)
  // ==========================================
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

    this.cdr.detectChanges();
  }

  // ==========================================
  // 7. MÉTODOS Y ACCIONES - TRANSPORTE
  // ==========================================
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
    this.nuevoTransporte = { ...transporte };
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

  // ==========================================
  // 8. MÉTODOS Y ACCIONES - HOTEL
  // ==========================================
  get hotelesOrdenados(): Hotel[] {
    return [...this.hoteles].sort((a, b) => {
      const fechaA = a.checkIn ? new Date(a.checkIn).getTime() : 0;
      const fechaB = b.checkIn ? new Date(b.checkIn).getTime() : 0;
      return fechaA - fechaB;
    });
  }

  async agregarHotel() {
    if (
      !this.nuevoHotel.nombre?.trim() ||
      !this.nuevoHotel.ciudad?.trim()
    ) {
      return;
    }
  
    const esPrecioValido = this.nuevoHotel.precio !== undefined && 
                           this.nuevoHotel.precio !== null && 
                           !isNaN(Number(this.nuevoHotel.precio));
  
    const hotelPayload = {
      nombre: this.nuevoHotel.nombre,
      ciudad: this.nuevoHotel.ciudad,
      checkin: this.nuevoHotel.checkIn || null,
      checkout: this.nuevoHotel.checkOut || null,
      precio: esPrecioValido ? Number(this.nuevoHotel.precio) : null,
      pagado: !!this.nuevoHotel.pagado,
      direccion: this.nuevoHotel.direccion || null,
      notas: this.nuevoHotel.notas || null,
    };
  
    if (this.editandoHotel) {
      const { error } = await supabase
        .from('hoteles')
        .update(hotelPayload)
        .eq('id', this.indiceHotelEditando);
  
      if (error) {
        console.error("Error al actualizar hotel:", error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('hoteles')
        .insert(hotelPayload);
  
      if (error) {
        console.error("Error al insertar hotel:", error);
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
    this.nuevoHotel = { ...hotel };
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
    this.cdr.detectChanges();
  }

  // ==========================================
  // 9. MÉTODOS Y ACCIONES - CIUDAD
  // ==========================================
  agregarCiudad() {
    if (!this.nuevaCiudad.nombre.trim()) {
      return;
    }
  
    if (this.editandoCiudad) {
      this.ciudades[this.indiceCiudadEditando] = {
        ...this.nuevaCiudad
      };} else {this.ciudades.push({...this.nuevaCiudad});}
  
      this.nuevaCiudad = {
        nombre: '',
        pais: '',
        descripcion: '',
        lugares: [],
        gastronomia: [],
        curiosidades: []
      };
      
      this.editandoCiudad = false;
      this.indiceCiudadEditando = -1;
      this.mostrarFormularioCiudad = false;}

    editarCiudad(ciudad: Ciudad) {
      this.indiceCiudadEditando = this.ciudades.indexOf(ciudad);
      this.editandoCiudad = true;
      this.nuevaCiudad = {
        ...ciudad
      };
      this.mostrarFormularioCiudad = true;
    }
  
  eliminarCiudad(ciudad: Ciudad) {
    const indice = this.ciudades.indexOf(ciudad);
    if (indice !== -1) {
      this.ciudades.splice(indice, 1);
    }
  }

  abrirCiudad(ciudad: Ciudad) {
    this.ciudadSeleccionada = ciudad;
  }

  cerrarCiudad() {
    this.ciudadSeleccionada = null;
    this.itemAbierto = null;
  }

  // ==========================================
  // 10. MÉTODOS Y ACCIONES - GASTRONOMÍA
  // ==========================================
  agregarLugar() {
    if (
      !this.ciudadSeleccionada ||
      !this.nuevoLugar.nombre.trim()
    ) {
      return;
    }

    if (this.editandoLugar) {

      this.ciudadSeleccionada.lugares[
        this.indiceLugarEditando
      ] = {
        ...this.nuevoLugar
      };

    } else {

      this.ciudadSeleccionada.lugares.push({
        ...this.nuevoLugar
      });

    }

    this.reiniciarLugar();
  }

  editarLugar(lugar: Lugar) {

    if (!this.ciudadSeleccionada) {
      return;
    }

    this.indiceLugarEditando =
      this.ciudadSeleccionada.lugares.indexOf(lugar);

    this.editandoLugar = true;

    this.nuevoLugar = {
      ...lugar
    };

    this.mostrarFormularioLugar = true;
  }

  eliminarLugar(lugar: Lugar) {

    if (!this.ciudadSeleccionada) {
      return;
    }

    const indice =
      this.ciudadSeleccionada.lugares.indexOf(lugar);

    if (indice !== -1) {
      this.ciudadSeleccionada.lugares.splice(
        indice,
        1
      );
    }
  }

  reiniciarLugar() {

    this.nuevoLugar = {
      nombre: '',
      descripcion: '',
      direccion: '',
      imagen: '',
      maps: ''
    };

    this.editandoLugar = false;

    this.indiceLugarEditando = -1;

    this.mostrarFormularioLugar = false;
  }
  agregarGastronomia() {
    if (
      !this.ciudadSeleccionada ||
      !this.nuevaGastronomia.nombre.trim()
    ) {
      return;
    }

    if (this.editandoGastronomia) {
      this.ciudadSeleccionada.gastronomia[
        this.indiceGastronomiaEditando
      ] = {
        ...this.nuevaGastronomia
      };

    } else {
      this.ciudadSeleccionada.gastronomia.push({
        ...this.nuevaGastronomia
      });
    }

    this.reiniciarGastronomia();
  }

  editarGastronomia(item: Gastronomia) {
    if (!this.ciudadSeleccionada) {
      return;
    }
    this.indiceGastronomiaEditando =
      this.ciudadSeleccionada.gastronomia.indexOf(item);
    this.editandoGastronomia = true;
    this.nuevaGastronomia = {
      ...item
    };
    this.mostrarFormularioGastronomia = true;

    this.dropdownGastronomiaAbierto = false;
  }

  eliminarGastronomia(item: Gastronomia) {
    if (!this.ciudadSeleccionada) {
      return;
    }
    const indice = this.ciudadSeleccionada.gastronomia.indexOf(item);
    if (indice !== -1) {
      this.ciudadSeleccionada.gastronomia.splice(indice, 1);
    }
  }

  reiniciarGastronomia() {
    this.nuevaGastronomia = {
      nombre: '',
      tipo: 'restaurante',
      descripcion: '',
      direccion: '',
      imagen: '',
      maps: ''
    };
  
    this.editandoGastronomia = false;
    this.indiceGastronomiaEditando = -1;
    this.mostrarFormularioGastronomia = false;

    this.dropdownGastronomiaAbierto = false;
  }

  obtenerGastronomiaPorTipo(
    tipo: 'restaurante' | 'cafeteria' | 'cerveceria' | 'postres'
  ): Gastronomia[] {
  
    if (!this.ciudadSeleccionada) {
      return [];
    }
  
    return this.ciudadSeleccionada.gastronomia.filter(
      item => item.tipo === tipo
    );
  }

  // ==========================================
  // 11. MÉTODOS DE CONTROL GLOBAL / INTERFAZ
  // ==========================================
  
  cambiarVista(vista: 'transportes' | 'hoteles' | 'ciudades') {
    this.vista = vista;localStorage.setItem('ruta-vista', vista);
  }

  toggleItem(id: string) {
    this.itemAbierto = this.itemAbierto === id ? null : id;
  }
}
