import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  HostListener 
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { Transporte } from './models/transporte.model';
import { Hotel } from './models/hotel.model';

import {
  Ciudad,
  Lugar,
  Gastronomia,
  Curiosidad
} from './models/ciudad.model';

import { supabase } from '../../core/supabase';


/* =====================================================
   INTERFACES RUTA
===================================================== */

interface RutaElemento {
  id: number;

  tipo: 'lugar' | 'gastronomia';

  lugarId?: number;
  gastronomiaId?: number;

  referencia: string;

  lugar?: Lugar;
  gastronomia?: Gastronomia;
}


interface DiaRuta {
  id: number | null;

  titulo: string;

  ciudadId: number | null;

  ciudad: string;

  fecha?: string;

  elementos: RutaElemento[];

  lugarSeleccionado?: string;
  gastronomiaSeleccionada?: string;
}


/* =====================================================
   COMPONENTE
===================================================== */

@Component({
  selector: 'app-ruta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './ruta.html',
  styleUrl: './ruta.css'
})
export class Ruta implements OnInit {


  /* ===================================================
     1. VISTAS
  =================================================== */

  vista: 'transportes' | 'hoteles' | 'ciudades' =
    (localStorage.getItem('ruta-vista') as
      'transportes' | 'hoteles' | 'ciudades')
    || 'transportes';

  subVistaCiudades: 'ciudades' | 'ruta' =
    'ciudades';


  /* ===================================================
     2. RUTA
  =================================================== */

  rutaDias: DiaRuta[] = [];

  mostrarFormularioDia = false;

  dropdownCiudadRutaAbierto = false;

  nuevoDia: DiaRuta = {
    id: null,
    titulo: '',
    ciudadId: null,
    ciudad: '',
    fecha: '',
    elementos: [],
    lugarSeleccionado: '',
    gastronomiaSeleccionada: ''
  };

  elementoRutaAbierto:
    Lugar | Gastronomia | null = null;

  tipoElementoRuta:
    'lugar' | 'gastronomia' | null = null;

  ciudadElementoRuta = '';


  /* ===================================================
     3. TRANSPORTES
  =================================================== */

  transportes: Transporte[] = [];
  vuelos: Transporte[] = [];
  trenes: Transporte[] = [];
  buses: Transporte[] = [];

  mostrarFormularioTransporte = false;

  editando = false;
  indiceEditando = -1;

  guardandoTransporte = false;

  mostrarConfirmarBorradoTransporte = false;
  transporteParaBorrar: Transporte | null = null;

  mostrarToast = false;
  mensajeToast = '';

  nuevoTransporte: Transporte = {
    tipo: 'vuelo',
    origen: '',
    destino: '',
    fecha: '',
    horaSalida: '',
    horaLlegada: '',
    empresa: '',
    asiento: '',
    notas: ''
  };


  /* ===================================================
     4. HOTELES
  =================================================== */

  hoteles: Hotel[] = [];
  mostrarFormularioHotel = false;
  editandoHotel = false;
  indiceHotelEditando = -1;
  guardandoHotel = false;

  nuevoHotel: Hotel = {
    nombre: '',
    ciudad: '',
    checkIn: '',
    checkOut: '',
    precio: undefined,
    pagado: false,
    direccion: '',
    notas: ''
  };

  mostrarConfirmarBorradoHotel = false;
  hotelParaBorrar: Hotel | null = null;


  /* ===================================================
     5. CIUDADES
  =================================================== */

  ciudades: Ciudad[] = [];

  ciudadSeleccionada: Ciudad | null = null;

  mostrarFormularioCiudad = false;

  editandoCiudad = false;

  indiceCiudadEditando = -1;

  guardandoCiudad = false;

  ciudadParaBorrar: Ciudad | null = null;
  mostrarConfirmarBorradoCiudad = false;

  nuevaCiudad: Ciudad = {
    nombre: '',
    pais: '',
    descripcion: '',
    lugares: [],
    gastronomia: [],
    curiosidades: []
  };


  /* ===================================================
     6. LUGARES
  =================================================== */

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


  /* ===================================================
     7. GASTRONOMIA
  =================================================== */

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


  /* ===================================================
     8. CURIOSIDADES
  =================================================== */

  mostrarFormularioCuriosidad = false;

  editandoCuriosidad = false;

  indiceCuriosidadEditando = -1;

  nuevaCuriosidad: Curiosidad = {
    titulo: '',
    descripcion: ''
  };


  /* ===================================================
     9. INTERFAZ
  =================================================== */

  itemAbierto: string | null = null;


  constructor(
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  @HostListener('document:click', ['$event'])
  cerrarSiClickFuera(event: Event) {
    if (this.vista !== 'transportes') {
      return;
    }
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.cerrarDropdowns();
    }
  }

  // 👇 AÑADIDO: Esta es la función que te faltaba y provocaba el error de compilación
  cerrarDropdowns() {
    document.querySelectorAll('details.dropdown').forEach((dropdown) => {
      (dropdown as HTMLDetailsElement).removeAttribute('open');
    });
  }

  // 👇 Esta función limpia el enlace y evita el bloqueo de Angular
  obtenerEnlaceMaps(direccion: string): SafeUrl {
    if (!direccion) return '';
    const urlConstruida = 'https://google.com/maps/' + encodeURIComponent(direccion);
    return this.sanitizer.bypassSecurityTrustUrl(urlConstruida);
  }



  /* ===================================================
     10. INICIALIZACION
  =================================================== */

  async ngOnInit() {

    await Promise.all([
      this.cargarTransportes(),
      this.cargarHoteles(),
      this.cargarCiudades()
    ]);

    await this.cargarRutaDias();

    this.cdr.detectChanges();
  }


  /* ===================================================
     11. TRANSPORTES - CARGA
  =================================================== */

  async cargarTransportes() {

    const { data, error } = await supabase
      .from('transporte')
      .select('*')
      .order('fecha');

    if (error) {
      console.error(
        'Error cargando transportes:',
        error
      );
      return;
    }

    this.transportes =
      (data || []).map((t: any) => ({
        id: t.id,
        tipo: t.tipo,
        origen: t.origen,
        destino: t.destino,
        fecha: t.fecha,
        horaSalida: t.horaSalida,
        horaLlegada: t.horaLlegada,
        empresa: t.empresa,
        asiento: t.asiento,
        notas: t.notas
      }));

    this.vuelos =
      this.transportes.filter(
        t => t.tipo === 'vuelo'
      );

    this.trenes =
      this.transportes.filter(
        t => t.tipo === 'tren'
      );

    this.buses =
      this.transportes.filter(
        t => t.tipo === 'bus'
      );

    this.cdr.detectChanges();
  }


  /* ===================================================
     12. TRANSPORTES CRUD
  =================================================== */

  abrirFormularioTransporte() {

    this.reiniciarFormulario();

    this.mostrarFormularioTransporte = true;
  }


  cancelarFormularioTransporte() {

    this.reiniciarFormulario();

    this.mostrarFormularioTransporte = false;
  }

    // 👇 AÑADE ESTOS TRES MÉTODOS AQUÍ:

    pedirConfirmacionBorradoTransporte(transporte: Transporte, event: Event) {
      event.preventDefault();
      event.stopPropagation();
      
      this.transporteParaBorrar = transporte;
      this.mostrarConfirmarBorradoTransporte = true;
      this.cdr.detectChanges();
    }
  
    cerrarConfirmarBorradoTransporte() {
      this.mostrarConfirmarBorradoTransporte = false;
      this.transporteParaBorrar = null;
      this.cdr.detectChanges();
    }
  
    async confirmarEliminarTransporte() {
      if (!this.transporteParaBorrar || !this.transporteParaBorrar.id) {
        this.cerrarConfirmarBorradoTransporte();
        return;
      }
  
      const idBorrar = this.transporteParaBorrar.id;
      this.cerrarConfirmarBorradoTransporte();
  
      const { error } = await supabase
        .from('transporte')
        .delete()
        .eq('id', idBorrar);
  
      if (error) {
        console.error('Error eliminando transporte:', error);
        return;
      }
  
      await this.cargarTransportes();
      this.cdr.detectChanges();
    }
  


  async agregarTransporte() {

    if (
      !this.nuevoTransporte.origen.trim() ||
      !this.nuevoTransporte.destino.trim()
    ) {
      return;
    }

    if (this.guardandoTransporte) {
      return;
    }

    this.guardandoTransporte = true;

    try {

      const payload = {
        tipo: this.nuevoTransporte.tipo,
        origen: this.nuevoTransporte.origen.trim(),
        destino: this.nuevoTransporte.destino.trim(),
        fecha: this.nuevoTransporte.fecha || null,
        horaSalida: this.nuevoTransporte.horaSalida || null,
        horaLlegada: this.nuevoTransporte.horaLlegada || null,
        empresa: this.nuevoTransporte.empresa?.trim() || null,
        asiento: this.nuevoTransporte.asiento?.trim() || null,
        notas: this.nuevoTransporte.notas?.trim() || null
      };


      if (this.editando) {
        if (this.indiceEditando < 0) return;

        const { error } = await supabase
          .from('transporte')
          .update(payload)
          .eq('id', this.indiceEditando);

        if (error) {
          console.error('Error actualizando transporte:', error);
          return;
        }
        this.mensajeToast = '¡Transporte actualizado con éxito!';
      } else {
        const { error } = await supabase
          .from('transporte')
          .insert(payload);

        if (error) {
          console.error('Error insertando transporte:', error);
          return;
        }
        this.mensajeToast = '¡Transporte guardado con éxito!';
      }


      await this.cargarTransportes();
      this.mostrarFormularioTransporte = false;
      this.reiniciarFormulario();

      this.mostrarToast = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.mostrarToast = false;
        this.cdr.detectChanges();
      }, 4000);

    } catch (e) {
      console.error(e);
    } finally {
      this.guardandoTransporte = false;
      this.cdr.detectChanges();
    }
  }


  editarTransporte(
    transporte: Transporte
  ) {

    if (transporte.id == null) {
      return;
    }

    this.editando = true;

    this.indiceEditando =
      transporte.id;

    this.nuevoTransporte = {
      ...transporte
    };

    this.mostrarFormularioTransporte = true;

    this.cdr.detectChanges();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }


  async eliminarTransporte(
    transporte: Transporte
  ) {

    if (transporte.id == null) {
      return;
    }

    const { error } = await supabase
      .from('transporte')
      .delete()
      .eq(
        'id',
        transporte.id
      );

    if (error) {
      console.error(
        'Error eliminando transporte:',
        error
      );
      return;
    }

    await this.cargarTransportes();
  }


  reiniciarFormulario() {

    /*
     * IMPORTANTE:
     * también reseteamos el estado de edición.
     */

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
      notas: ''
    };
  }


    /* ===================================================
     13. HOTELES
  =================================================== */

  abrirFormularioHotel() {
    this.reiniciarHotel();
    this.mostrarFormularioHotel = true;
  }

  cancelarFormularioHotel(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.reiniciarHotel();
    this.mostrarFormularioHotel = false;
  }

  async cargarHoteles() {
    const { data, error } = await supabase
      .from('hoteles')
      .select('*')
      .order('checkin');

    if (error) {
      console.error('Error cargando hoteles:', error);
      return;
    }

    this.hoteles = (data || []).map((h: any) => ({
      id: h.id,
      nombre: h.nombre,
      ciudad: h.ciudad,
      checkIn: h.checkin,
      checkOut: h.checkout,
      precio: h.precio,
      pagado: h.pagado,
      direccion: h.direccion,
      notas: h.notas
    }));

    this.cdr.detectChanges();
  }

  get hotelesOrdenados(): Hotel[] {
    return [...this.hoteles].sort((a, b) => {
      const fechaA = a.checkIn ? new Date(a.checkIn).getTime() : 0;
      const fechaB = b.checkIn ? new Date(b.checkIn).getTime() : 0;
      return fechaA - fechaB;
    });
  }

  async agregarHotel(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.guardandoHotel) return;
    this.guardandoHotel = true;

    if (!this.nuevoHotel.nombre?.trim() || !this.nuevoHotel.ciudad?.trim()) {
      return;
    }

    if (this.guardandoHotel) return;
    this.guardandoHotel = true;

    const esPrecioValido =
      this.nuevoHotel.precio !== undefined &&
      this.nuevoHotel.precio !== null &&
      !isNaN(Number(this.nuevoHotel.precio));

    const payload = {
      nombre: this.nuevoHotel.nombre.trim(),
      ciudad: this.nuevoHotel.ciudad.trim(),
      checkin: this.nuevoHotel.checkIn || null,
      checkout: this.nuevoHotel.checkOut || null,
      precio: esPrecioValido ? Number(this.nuevoHotel.precio) : null,
      pagado: !!this.nuevoHotel.pagado,
      direccion: this.nuevoHotel.direccion?.trim() || null,
      notas: this.nuevoHotel.notas?.trim() || null
    };

    try {
      if (this.editandoHotel) {
        if (this.indiceHotelEditando < 0) return;

        const { error } = await supabase
          .from('hoteles')
          .update(payload)
          .eq('id', this.indiceHotelEditando);

        if (error) {
          console.error('Error actualizando hotel:', error);
          return;
        }
        this.mensajeToast = `¡Hotel "${payload.nombre}" actualizado con éxito!`;
      } else {
        const { error } = await supabase
          .from('hoteles')
          .insert(payload);

        if (error) {
          console.error('Error creando hotel:', error);
          return;
        }
        this.mensajeToast = `¡Hotel "${payload.nombre}" guardado con éxito!`;
      }

      await this.cargarHoteles();
      this.reiniciarHotel();
      this.mostrarFormularioHotel = false;

      // Lanzamos la animación del Toast de éxito en pantalla
      this.mostrarToast = true;
      this.cdr.detectChanges();

      // Se desvanece de manera automática tras 4 segundos exactos
      setTimeout(() => {
        this.mostrarToast = false;
        this.cdr.detectChanges();
      }, 4000);

    } catch (e) {
      console.error(e);
    } finally {
      this.guardandoHotel = false;
      this.cdr.detectChanges();
    }
  }

  editarHotel(hotel: Hotel, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (hotel.id == null) return;

    this.editandoHotel = true;
    this.indiceHotelEditando = hotel.id;
    this.nuevoHotel = { ...hotel };
    this.mostrarFormularioHotel = true;
    this.cdr.detectChanges();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  pedirConfirmacionBorradoHotel(hotel: Hotel, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.hotelParaBorrar = hotel;
    this.mostrarConfirmarBorradoHotel = true;
    this.cdr.detectChanges();
  }

  cerrarConfirmarBorradoHotel() {
    this.mostrarConfirmarBorradoHotel = false;
    this.hotelParaBorrar = null;
    this.cdr.detectChanges();
  }

  async confirmarEliminarHotel() {
    if (!this.hotelParaBorrar || !this.hotelParaBorrar.id) {
      this.cerrarConfirmarBorradoHotel();
      return;
    }

    const idBorrar = this.hotelParaBorrar.id;
    this.cerrarConfirmarBorradoHotel();

    const { error } = await supabase
      .from('hoteles')
      .delete()
      .eq('id', idBorrar);

    if (error) {
      console.error('Error eliminando hotel:', error);
      return;
    }

    await this.cargarHoteles();
    this.cdr.detectChanges();
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
      notas: ''
    };
  }


    /* ===================================================
     14. CARGAR CIUDADES
  =================================================== */

  async cargarCiudades() {
    const { data, error } = await supabase
      .from('ciudades')
      .select(`
        id,
        nombre,
        pais,
        descripcion,

        lugares (
          id,
          ciudad_id,
          nombre,
          descripcion,
          direccion,
          imagen,
          maps
        ),

        gastronomia (
          id,
          ciudad_id,
          nombre,
          tipo,
          descripcion,
          direccion,
          imagen,
          maps
        ),

        curiosidades (
          id,
          ciudad_id,
          titulo,
          descripcion
        )
      `)
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error cargando ciudades:', error);
      return;
    }

    this.ciudades = (data || []).map((c: any): Ciudad => ({
      id: c.id,
      nombre: c.nombre,
      pais: c.pais || '',
      descripcion: c.descripcion || '',
      lugares: (c.lugares || []).map((l: any): Lugar => ({
        id: l.id,
        ciudadId: l.ciudad_id,
        nombre: l.nombre,
        descripcion: l.descripcion || '',
        direccion: l.direccion || '',
        imagen: l.imagen || '',
        maps: l.maps || ''
      })),
      gastronomia: (c.gastronomia || []).map((g: any): Gastronomia => ({
        id: g.id,
        ciudadId: g.ciudad_id,
        nombre: g.nombre,
        tipo: g.tipo,
        descripcion: g.descripcion || '',
        direccion: g.direccion || '',
        imagen: g.imagen || '',
        maps: g.maps || ''
      })),
      curiosidades: (c.curiosidades || []).map((cur: any): Curiosidad => ({
        id: cur.id,
        ciudadId: cur.ciudad_id,
        titulo: cur.titulo,
        descripcion: cur.descripcion || ''
      }))
    }));

    this.cdr.detectChanges();
  }


  /* ===================================================
     15. CIUDADES CRUD
  =================================================== */

  abrirFormularioCiudad() {
    this.reiniciarCiudad();
    this.mostrarFormularioCiudad = true;
  }

  cancelarFormularioCiudad(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.reiniciarCiudad();
    this.mostrarFormularioCiudad = false;
  }

  async agregarCiudad(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.nuevaCiudad.nombre?.trim()) {
      return;
    }

    if (this.guardandoCiudad) return;
    this.guardandoCiudad = true;

    const payload = {
      nombre: this.nuevaCiudad.nombre.trim(),
      pais: this.nuevaCiudad.pais?.trim() || null,
      descripcion: this.nuevaCiudad.descripcion?.trim() || null
    };

    try {
      if (this.editandoCiudad) {
        const ciudadEditada = this.ciudades[this.indiceCiudadEditando];

        if (ciudadEditada?.id == null) {
          console.error('No se encontró el id de la ciudad');
          return;
        }

        const { error } = await supabase
          .from('ciudades')
          .update(payload)
          .eq('id', ciudadEditada.id);

        if (error) {
          console.error('Error actualizando ciudad:', error);
          return;
        }
        this.mensajeToast = `¡Ciudad "${payload.nombre}" actualizada con éxito!`;
      } else {
        const { error } = await supabase
          .from('ciudades')
          .insert(payload);

        if (error) {
          console.error('Error creando ciudad:', error);
          return;
        }
        this.mensajeToast = `¡Ciudad "${payload.nombre}" añadida a tu viaje!`;
      }

      this.reiniciarCiudad();
      await this.cargarCiudades();
      await this.cargarRutaDias();

      // Lanzamos la animación del Toast de éxito en pantalla
      this.mostrarToast = true;
      this.cdr.detectChanges();

      // Se desvanece de manera automática tras 4 segundos exactos
      setTimeout(() => {
        this.mostrarToast = false;
        this.cdr.detectChanges();
      }, 4000);

    } catch (e) {
      console.error(e);
    } finally {
      this.guardandoCiudad = false;
      this.cdr.detectChanges();
    }
  }

  editarCiudad(ciudad: Ciudad, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.indiceCiudadEditando = this.ciudades.indexOf(ciudad);
    this.editandoCiudad = true;

    this.nuevaCiudad = {
      ...ciudad,
      lugares: [...ciudad.lugares],
      gastronomia: [...ciudad.gastronomia],
      curiosidades: [...ciudad.curiosidades]
    };

    this.mostrarFormularioCiudad = true;
    this.cdr.detectChanges();
  }

  pedirConfirmacionBorradoCiudad(ciudad: Ciudad, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.ciudadParaBorrar = ciudad;
    this.mostrarConfirmarBorradoCiudad = true;
    this.cdr.detectChanges();
  }

  cerrarConfirmarBorradoCiudad() {
    this.mostrarConfirmarBorradoCiudad = false;
    this.ciudadParaBorrar = null;
    this.cdr.detectChanges();
  }

  async confirmarEliminarCiudad() {
    if (!this.ciudadParaBorrar || !this.ciudadParaBorrar.id) {
      this.cerrarConfirmarBorradoCiudad();
      return;
    }

    const idBorrar = this.ciudadParaBorrar.id;
    this.cerrarConfirmarBorradoCiudad();

    const { error } = await supabase
      .from('ciudades')
      .delete()
      .eq('id', idBorrar);

    if (error) {
      console.error('Error eliminando ciudad:', error);
      return;
    }

    if (this.ciudadSeleccionada?.id === idBorrar) {
      this.cerrarCiudad();
    }

    await this.cargarCiudades();
    await this.cargarRutaDias();
    this.cdr.detectChanges();
  }

  reiniciarCiudad() {
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
    this.mostrarFormularioCiudad = false;
  }

  abrirCiudad(ciudad: Ciudad) {
    this.ciudadSeleccionada = ciudad;
    this.itemAbierto = null;
    this.reiniciarLugar();
    this.reiniciarGastronomia();
    this.reiniciarCuriosidad();
    this.cdr.detectChanges();
  }

  cerrarCiudad() {
    this.ciudadSeleccionada = null;
    this.itemAbierto = null;
    this.reiniciarLugar();
    this.reiniciarGastronomia();
    this.reiniciarCuriosidad();
    this.cdr.detectChanges();
  }

  /* ===================================================
     16. LUGARES CRUD
  =================================================== */

  async agregarLugar() {

    if (
      this.ciudadSeleccionada?.id == null ||
      !this.nuevoLugar.nombre.trim()
    ) {
      return;
    }

    const ciudadId =
      this.ciudadSeleccionada.id;

    const payload = {

      ciudad_id:
        ciudadId,

      nombre:
        this.nuevoLugar.nombre.trim(),

      descripcion:
        this.nuevoLugar.descripcion?.trim()
        || null,

      direccion:
        this.nuevoLugar.direccion?.trim()
        || null,

      imagen:
        this.nuevoLugar.imagen?.trim()
        || null,

      maps:
        this.nuevoLugar.maps?.trim()
        || null
    };


    if (this.editandoLugar) {

      const lugar =
        this.ciudadSeleccionada
          .lugares[
            this.indiceLugarEditando
          ];

      if (lugar?.id == null) {
        return;
      }

      const { error } = await supabase
        .from('lugares')
        .update(payload)
        .eq(
          'id',
          lugar.id
        );

      if (error) {
        console.error(
          'Error actualizando lugar:',
          error
        );
        return;
      }

    } else {

      const { error } = await supabase
        .from('lugares')
        .insert(payload);

      if (error) {
        console.error(
          'Error creando lugar:',
          error
        );
        return;
      }
    }


    this.reiniciarLugar();

    await this.cargarCiudades();

    this.ciudadSeleccionada =
      this.ciudades.find(
        ciudad =>
          ciudad.id === ciudadId
      ) || null;

    await this.cargarRutaDias();

    this.cdr.detectChanges();
  }


  editarLugar(
    lugar: Lugar
  ) {

    if (!this.ciudadSeleccionada) {
      return;
    }

    this.indiceLugarEditando =
      this.ciudadSeleccionada
        .lugares
        .indexOf(lugar);

    if (this.indiceLugarEditando < 0) {
      return;
    }

    this.editandoLugar = true;

    this.nuevoLugar = {
      ...lugar
    };

    this.mostrarFormularioLugar = true;

    this.cdr.detectChanges();
  }


  async eliminarLugar(
    lugar: Lugar
  ) {

    if (
      this.ciudadSeleccionada?.id == null ||
      lugar.id == null
    ) {
      return;
    }

    const ciudadId =
      this.ciudadSeleccionada.id;

    const { error } = await supabase
      .from('lugares')
      .delete()
      .eq(
        'id',
        lugar.id
      );

    if (error) {
      console.error(
        'Error eliminando lugar:',
        error
      );
      return;
    }

    await this.cargarCiudades();

    this.ciudadSeleccionada =
      this.ciudades.find(
        ciudad =>
          ciudad.id === ciudadId
      ) || null;

    await this.cargarRutaDias();

    this.cdr.detectChanges();
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


  /* ===================================================
     17. GASTRONOMIA CRUD
  =================================================== */

  async agregarGastronomia() {

    if (
      this.ciudadSeleccionada?.id == null ||
      !this.nuevaGastronomia.nombre.trim()
    ) {
      return;
    }

    const ciudadId =
      this.ciudadSeleccionada.id;

    const payload = {

      ciudad_id:
        ciudadId,

      nombre:
        this.nuevaGastronomia.nombre.trim(),

      tipo:
        this.nuevaGastronomia.tipo,

      descripcion:
        this.nuevaGastronomia.descripcion
          ?.trim()
        || null,

      direccion:
        this.nuevaGastronomia.direccion
          ?.trim()
        || null,

      imagen:
        this.nuevaGastronomia.imagen
          ?.trim()
        || null,

      maps:
        this.nuevaGastronomia.maps
          ?.trim()
        || null
    };


    if (this.editandoGastronomia) {

      const item =
        this.ciudadSeleccionada
          .gastronomia[
            this.indiceGastronomiaEditando
          ];

      if (item?.id == null) {
        return;
      }

      const { error } = await supabase
        .from('gastronomia')
        .update(payload)
        .eq(
          'id',
          item.id
        );

      if (error) {
        console.error(
          'Error actualizando gastronomía:',
          error
        );
        return;
      }

    } else {

      const { error } = await supabase
        .from('gastronomia')
        .insert(payload);

      if (error) {
        console.error(
          'Error creando gastronomía:',
          error
        );
        return;
      }
    }

    this.reiniciarGastronomia();

    await this.cargarCiudades();

    this.ciudadSeleccionada =
      this.ciudades.find(
        ciudad =>
          ciudad.id === ciudadId
      ) || null;

    await this.cargarRutaDias();

    this.cdr.detectChanges();
  }


  editarGastronomia(
    item: Gastronomia
  ) {

    if (!this.ciudadSeleccionada) {
      return;
    }

    this.indiceGastronomiaEditando =
      this.ciudadSeleccionada
        .gastronomia
        .indexOf(item);

    if (
      this.indiceGastronomiaEditando < 0
    ) {
      return;
    }

    this.editandoGastronomia = true;

    this.nuevaGastronomia = {
      ...item
    };

    this.mostrarFormularioGastronomia = true;

    this.dropdownGastronomiaAbierto = false;

    this.cdr.detectChanges();
  }


  async eliminarGastronomia(
    item: Gastronomia
  ) {

    if (
      this.ciudadSeleccionada?.id == null ||
      item.id == null
    ) {
      return;
    }

    const ciudadId =
      this.ciudadSeleccionada.id;

    const { error } = await supabase
      .from('gastronomia')
      .delete()
      .eq(
        'id',
        item.id
      );

    if (error) {
      console.error(
        'Error eliminando gastronomía:',
        error
      );
      return;
    }

    await this.cargarCiudades();

    this.ciudadSeleccionada =
      this.ciudades.find(
        ciudad =>
          ciudad.id === ciudadId
      ) || null;

    await this.cargarRutaDias();

    this.cdr.detectChanges();
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
    tipo:
      | 'restaurante'
      | 'cafeteria'
      | 'cerveceria'
      | 'postres'
  ): Gastronomia[] {

    if (!this.ciudadSeleccionada) {
      return [];
    }

    return this.ciudadSeleccionada
      .gastronomia
      .filter(
        item =>
          item.tipo === tipo
      );
  }


  /* ===================================================
     18. CURIOSIDADES CRUD
  =================================================== */

  async agregarCuriosidad() {

    if (
      this.ciudadSeleccionada?.id == null ||
      !this.nuevaCuriosidad.titulo.trim()
    ) {
      return;
    }

    const ciudadId =
      this.ciudadSeleccionada.id;

    const payload = {

      ciudad_id:
        ciudadId,

      titulo:
        this.nuevaCuriosidad.titulo.trim(),

      descripcion:
        this.nuevaCuriosidad.descripcion
          ?.trim()
        || null
    };


    if (this.editandoCuriosidad) {

      const curiosidad =
        this.ciudadSeleccionada
          .curiosidades[
            this.indiceCuriosidadEditando
          ];

      if (curiosidad?.id == null) {
        return;
      }

      const { error } = await supabase
        .from('curiosidades')
        .update(payload)
        .eq(
          'id',
          curiosidad.id
        );

      if (error) {
        console.error(
          'Error actualizando curiosidad:',
          error
        );
        return;
      }

    } else {

      const { error } = await supabase
        .from('curiosidades')
        .insert(payload);

      if (error) {
        console.error(
          'Error creando curiosidad:',
          error
        );
        return;
      }
    }


    this.reiniciarCuriosidad();

    await this.cargarCiudades();

    this.ciudadSeleccionada =
      this.ciudades.find(
        ciudad =>
          ciudad.id === ciudadId
      ) || null;

    this.cdr.detectChanges();
  }


  editarCuriosidad(
    curiosidad: Curiosidad
  ) {

    if (!this.ciudadSeleccionada) {
      return;
    }

    this.indiceCuriosidadEditando =
      this.ciudadSeleccionada
        .curiosidades
        .indexOf(curiosidad);

    if (
      this.indiceCuriosidadEditando < 0
    ) {
      return;
    }

    this.editandoCuriosidad = true;

    this.nuevaCuriosidad = {
      ...curiosidad
    };

    this.mostrarFormularioCuriosidad = true;

    this.cdr.detectChanges();
  }


  async eliminarCuriosidad(
    curiosidad: Curiosidad
  ) {

    if (
      this.ciudadSeleccionada?.id == null ||
      curiosidad.id == null
    ) {
      return;
    }

    const ciudadId =
      this.ciudadSeleccionada.id;

    const { error } = await supabase
      .from('curiosidades')
      .delete()
      .eq(
        'id',
        curiosidad.id
      );

    if (error) {
      console.error(
        'Error eliminando curiosidad:',
        error
      );
      return;
    }

    await this.cargarCiudades();

    this.ciudadSeleccionada =
      this.ciudades.find(
        ciudad =>
          ciudad.id === ciudadId
      ) || null;

    this.cdr.detectChanges();
  }


  reiniciarCuriosidad() {

    this.nuevaCuriosidad = {
      titulo: '',
      descripcion: ''
    };

    this.editandoCuriosidad = false;

    this.indiceCuriosidadEditando = -1;

    this.mostrarFormularioCuriosidad = false;
  }


  /* ===================================================
     19. RUTA - FORMULARIO DIA
  =================================================== */

  abrirFormularioDia() {

    this.reiniciarDia();

    this.mostrarFormularioDia = true;
  }


  cancelarFormularioDia() {

    this.reiniciarDia();

    this.mostrarFormularioDia = false;
  }


  reiniciarDia() {

    this.nuevoDia = {
      id: null,
      titulo: '',
      ciudadId: null,
      ciudad: '',
      fecha: '',
      elementos: [],
      lugarSeleccionado: '',
      gastronomiaSeleccionada: ''
    };

    this.dropdownCiudadRutaAbierto = false;
  }


  /* ===================================================
     20. CARGAR RUTA
  =================================================== */

  async cargarRutaDias() {

    const {
      data: diasData,
      error: diasError
    } = await supabase
      .from('ruta_dias')
      .select('*')
      .order(
        'fecha',
        { ascending: true }
      );

    if (diasError) {
      console.error(
        'Error cargando días de ruta:',
        diasError
      );
      return;
    }


    const {
      data: elementosData,
      error: elementosError
    } = await supabase
      .from('ruta_elementos')
      .select('*')
      .order(
        'created_at',
        { ascending: true }
      );

    if (elementosError) {
      console.error(
        'Error cargando elementos de ruta:',
        elementosError
      );
      return;
    }


    this.rutaDias =
      (diasData || [])
        .map(
          (diaDb: any): DiaRuta => {

            const ciudad =
              this.ciudades.find(
                ciudad =>
                  ciudad.id
                  === diaDb.ciudad_id
              );


            const elementosDia =
              (elementosData || [])
                .filter(
                  (elementoDb: any) =>
                    elementoDb.ruta_dia_id
                    === diaDb.id
                )
                .map(
                  (elementoDb: any):
                    RutaElemento => {

                    if (
                      elementoDb.tipo
                      === 'lugar'
                    ) {

                      const lugar =
                        ciudad?.lugares.find(
                          lugar =>
                            lugar.id
                            === elementoDb.lugar_id
                        );

                      return {

                        id:
                          elementoDb.id,

                        tipo:
                          'lugar',

                        lugarId:
                          elementoDb.lugar_id,

                        referencia:
                          lugar?.nombre
                          || 'Lugar no disponible',

                        lugar:
                          lugar
                      };
                    }


                    const gastronomia =
                      ciudad?.gastronomia.find(
                        item =>
                          item.id
                          === elementoDb.gastronomia_id
                      );


                    return {

                      id:
                        elementoDb.id,

                      tipo:
                        'gastronomia',

                      gastronomiaId:
                        elementoDb.gastronomia_id,

                      referencia:
                        gastronomia?.nombre
                        || 'Sitio no disponible',

                      gastronomia:
                        gastronomia
                    };
                  }
                );


            return {

              id:
                diaDb.id,

              titulo:
                diaDb.titulo,

              ciudadId:
                diaDb.ciudad_id,

              ciudad:
                ciudad?.nombre || '',

              fecha:
                diaDb.fecha || '',

              elementos:
                elementosDia,

              lugarSeleccionado: '',

              gastronomiaSeleccionada: ''
            };
          }
        );

    this.cdr.detectChanges();
  }


  /* ===================================================
     21. CREAR DIA
  =================================================== */

  async agregarDiaRuta() {

    if (
      !this.nuevoDia.titulo.trim() ||
      !this.nuevoDia.ciudad.trim()
    ) {
      return;
    }

    /*
     * Preferimos ciudadId porque ya lo tenemos
     * seleccionado en el HTML.
     *
     * Dejamos el nombre como respaldo.
     */
    const ciudad =
      this.ciudades.find(
        ciudad =>
          ciudad.id === this.nuevoDia.ciudadId
      )
      ||
      this.ciudades.find(
        ciudad =>
          ciudad.nombre === this.nuevoDia.ciudad
      );


    if (ciudad?.id == null) {
      console.error(
        'No se encontró la ciudad seleccionada'
      );
      return;
    }


    const { error } = await supabase
      .from('ruta_dias')
      .insert({

        titulo:
          this.nuevoDia.titulo.trim(),

        fecha:
          this.nuevoDia.fecha || null,

        ciudad_id:
          ciudad.id
      });


    if (error) {
      console.error(
        'Error creando día de ruta:',
        error
      );
      return;
    }


    this.reiniciarDia();

    this.mostrarFormularioDia = false;

    await this.cargarRutaDias();

    this.cdr.detectChanges();
  }


  /* ===================================================
     22. AÑADIR LUGAR AL DIA
  =================================================== */

  async agregarLugarADia(
    dia: DiaRuta
  ) {

    if (
      dia.id == null ||
      dia.ciudadId == null ||
      !dia.lugarSeleccionado
    ) {
      return;
    }

    const ciudad =
      this.ciudades.find(
        ciudad =>
          ciudad.id === dia.ciudadId
      );

    if (!ciudad) {
      return;
    }

    const lugar =
      ciudad.lugares.find(
        lugar =>
          lugar.nombre
          === dia.lugarSeleccionado
      );

    if (lugar?.id == null) {
      console.error(
        'No se encontró el lugar seleccionado'
      );
      return;
    }


    const existe =
      dia.elementos.some(
        elemento =>
          elemento.tipo === 'lugar' &&
          elemento.lugarId === lugar.id
      );

    if (existe) {
      dia.lugarSeleccionado = '';
      this.cdr.detectChanges();
      return;
    }


    const { error } = await supabase
      .from('ruta_elementos')
      .insert({

        ruta_dia_id:
          dia.id,

        tipo:
          'lugar',

        lugar_id:
          lugar.id,

        gastronomia_id:
          null
      });


    if (error) {
      console.error(
        'Error añadiendo lugar al día:',
        error
      );
      return;
    }


    dia.lugarSeleccionado = '';

    await this.cargarRutaDias();

    this.cdr.detectChanges();
  }


  /* ===================================================
     23. AÑADIR GASTRONOMIA AL DIA
  =================================================== */

  async agregarGastronomiaADia(
    dia: DiaRuta
  ) {

    if (
      dia.id == null ||
      dia.ciudadId == null ||
      !dia.gastronomiaSeleccionada
    ) {
      return;
    }

    const ciudad =
      this.ciudades.find(
        ciudad =>
          ciudad.id === dia.ciudadId
      );

    if (!ciudad) {
      return;
    }

    const gastronomia =
      ciudad.gastronomia.find(
        item =>
          item.nombre
          === dia.gastronomiaSeleccionada
      );

    if (gastronomia?.id == null) {
      console.error(
        'No se encontró el sitio seleccionado'
      );
      return;
    }


    const existe =
      dia.elementos.some(
        elemento =>
          elemento.tipo === 'gastronomia' &&
          elemento.gastronomiaId
            === gastronomia.id
      );

    if (existe) {
      dia.gastronomiaSeleccionada = '';
      this.cdr.detectChanges();
      return;
    }


    const { error } = await supabase
      .from('ruta_elementos')
      .insert({

        ruta_dia_id:
          dia.id,

        tipo:
          'gastronomia',

        lugar_id:
          null,

        gastronomia_id:
          gastronomia.id
      });


    if (error) {
      console.error(
        'Error añadiendo gastronomía al día:',
        error
      );
      return;
    }


    dia.gastronomiaSeleccionada = '';

    await this.cargarRutaDias();

    this.cdr.detectChanges();
  }


  /* ===================================================
     24. ELIMINAR ELEMENTO DIA
  =================================================== */

  async eliminarElementoDia(
    dia: DiaRuta,
    elemento: RutaElemento
  ) {

    if (elemento.id == null) {
      return;
    }

    const { error } = await supabase
      .from('ruta_elementos')
      .delete()
      .eq(
        'id',
        elemento.id
      );

    if (error) {
      console.error(
        'Error eliminando elemento de ruta:',
        error
      );
      return;
    }

    dia.elementos =
      dia.elementos.filter(
        item =>
          item.id !== elemento.id
      );

    this.cdr.detectChanges();
  }


  /* ===================================================
     25. ELIMINAR DIA
  =================================================== */

  async eliminarDiaRuta(
    dia: DiaRuta
  ) {

    if (dia.id == null) {
      return;
    }

    const { error } = await supabase
      .from('ruta_dias')
      .delete()
      .eq(
        'id',
        dia.id
      );

    if (error) {
      console.error(
        'Error eliminando día:',
        error
      );
      return;
    }

    await this.cargarRutaDias();

    this.cdr.detectChanges();
  }


  /* ===================================================
     26. HELPERS CIUDAD / RUTA
  =================================================== */

  obtenerCiudad(
    nombre: string
  ): Ciudad | undefined {

    return this.ciudades.find(
      ciudad =>
        ciudad.nombre === nombre
    );
  }


  obtenerCiudadPorId(
    id: number | null
  ): Ciudad | undefined {

    if (id == null) {
      return undefined;
    }

    return this.ciudades.find(
      ciudad =>
        ciudad.id === id
    );
  }


  obtenerCiudadDia(
    nombreCiudad: string
  ): Ciudad | undefined {

    return this.obtenerCiudad(
      nombreCiudad
    );
  }


  obtenerLugar(
    ciudad: Ciudad,
    referencia: string
  ): Lugar | undefined {

    return ciudad.lugares.find(
      lugar =>
        lugar.nombre === referencia
    );
  }


  obtenerGastronomia(
    ciudad: Ciudad,
    referencia: string
  ): Gastronomia | undefined {

    return ciudad.gastronomia.find(
      item =>
        item.nombre === referencia
    );
  }


  /* ===================================================
     27. POPUP ELEMENTO RUTA
  =================================================== */

  abrirElementoRuta(
    elemento: RutaElemento
  ) {

    if (
      elemento.tipo === 'lugar'
    ) {

      const lugar =
        elemento.lugar
        ||
        this.buscarLugarPorId(
          elemento.lugarId
        );

      if (!lugar) {
        return;
      }

      this.elementoRutaAbierto =
        lugar;

      this.tipoElementoRuta =
        'lugar';


      const ciudad =
        this.ciudades.find(
          ciudad =>
            ciudad.id === lugar.ciudadId
        );


      this.ciudadElementoRuta =
        ciudad?.nombre || '';

      this.cdr.detectChanges();

      return;
    }


    const gastronomia =
      elemento.gastronomia
      ||
      this.buscarGastronomiaPorId(
        elemento.gastronomiaId
      );

    if (!gastronomia) {
      return;
    }

    this.elementoRutaAbierto =
      gastronomia;

    this.tipoElementoRuta =
      'gastronomia';


    const ciudad =
      this.ciudades.find(
        ciudad =>
          ciudad.id
          === gastronomia.ciudadId
      );


    this.ciudadElementoRuta =
      ciudad?.nombre || '';

    this.cdr.detectChanges();
  }


  buscarLugarPorId(
    lugarId?: number
  ): Lugar | undefined {

    if (lugarId == null) {
      return undefined;
    }

    for (
      const ciudad
      of this.ciudades
    ) {

      const lugar =
        ciudad.lugares.find(
          lugar =>
            lugar.id === lugarId
        );

      if (lugar) {
        return lugar;
      }
    }

    return undefined;
  }


  buscarGastronomiaPorId(
    gastronomiaId?: number
  ): Gastronomia | undefined {

    if (gastronomiaId == null) {
      return undefined;
    }

    for (
      const ciudad
      of this.ciudades
    ) {

      const item =
        ciudad.gastronomia.find(
          gastronomia =>
            gastronomia.id
            === gastronomiaId
        );

      if (item) {
        return item;
      }
    }

    return undefined;
  }


  cerrarElementoRuta() {

    this.elementoRutaAbierto = null;

    this.tipoElementoRuta = null;

    this.ciudadElementoRuta = '';

    this.cdr.detectChanges();
  }


  /* ===================================================
     28. INTERFAZ GENERAL
  =================================================== */

  cambiarVista(
    vista:
      | 'transportes'
      | 'hoteles'
      | 'ciudades'
  ) {

    this.vista = vista;

    localStorage.setItem(
      'ruta-vista',
      vista
    );
  }


  toggleItem(
    id: string
  ) {

    this.itemAbierto =
      this.itemAbierto === id
        ? null
        : id;
  }
}

