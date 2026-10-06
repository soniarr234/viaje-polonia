import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
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

  /*
   * referencia se mantiene para no tener que cambiar
   * tu HTML actual.
   *
   * Pero la relación real en Supabase utiliza lugarId
   * o gastronomiaId.
   */
  referencia: string;

  lugar?: Lugar;
  gastronomia?: Gastronomia;
}


interface DiaRuta {
  id: number | null;

  titulo: string;

  ciudadId: number | null;

  /*
   * Se mantiene ciudad como string para que tu HTML
   * actual siga funcionando.
   */
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


  /* ===================================================
     5. CIUDADES
  =================================================== */

  ciudades: Ciudad[] = [];

  ciudadSeleccionada: Ciudad | null = null;

  mostrarFormularioCiudad = false;

  editandoCiudad = false;

  indiceCiudadEditando = -1;

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
     8. INTERFAZ
  =================================================== */

  itemAbierto: string | null = null;


  constructor(
    private cdr: ChangeDetectorRef
  ) {}


  /* ===================================================
     9. INICIALIZACION
  =================================================== */

  async ngOnInit() {

    /*
     * Las ciudades tienen que cargarse antes que la ruta
     * porque ruta_elementos referencia lugares y
     * gastronomía pertenecientes a las ciudades.
     */
    await Promise.all([
      this.cargarTransportes(),
      this.cargarHoteles(),
      this.cargarCiudades()
    ]);

    await this.cargarRutaDias();

    this.cdr.detectChanges();
  }


  /* ===================================================
     10. CARGAR TRANSPORTES
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
     11. TRANSPORTES CRUD
  =================================================== */

  async agregarTransporte() {

    if (
      !this.nuevoTransporte.origen.trim() ||
      !this.nuevoTransporte.destino.trim()
    ) {
      return;
    }


    const payload = {

      tipo:
        this.nuevoTransporte.tipo,

      origen:
        this.nuevoTransporte.origen,

      destino:
        this.nuevoTransporte.destino,

      fecha:
        this.nuevoTransporte.fecha,

      horaSalida:
        this.nuevoTransporte.horaSalida,

      horaLlegada:
        this.nuevoTransporte.horaLlegada,

      empresa:
        this.nuevoTransporte.empresa,

      asiento:
        this.nuevoTransporte.asiento,

      notas:
        this.nuevoTransporte.notas
    };


    if (this.editando) {

      const { error } = await supabase
        .from('transporte')
        .update(payload)
        .eq(
          'id',
          this.indiceEditando
        );

      if (error) {

        console.error(
          'Error actualizando transporte:',
          error
        );

        return;
      }

    } else {

      const { error } = await supabase
        .from('transporte')
        .insert(payload);

      if (error) {

        console.error(
          'Error creando transporte:',
          error
        );

        return;
      }
    }


    await this.cargarTransportes();

    this.reiniciarFormulario();

    this.mostrarFormularioTransporte = false;
  }


  editarTransporte(
    transporte: Transporte
  ) {

    this.editando = true;

    this.indiceEditando =
      transporte.id || -1;

    this.nuevoTransporte = {
      ...transporte
    };

    this.mostrarFormularioTransporte = true;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }


  async eliminarTransporte(
    transporte: Transporte
  ) {

    if (!transporte.id) {
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
     12. HOTELES
  =================================================== */

  async cargarHoteles() {

    const { data, error } = await supabase
      .from('hoteles')
      .select('*')
      .order('checkin');

    if (error) {

      console.error(
        'Error cargando hoteles:',
        error
      );

      return;
    }

    this.hoteles =
      (data || []).map((h: any) => ({

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

    return [...this.hoteles]
      .sort((a, b) => {

        const fechaA =
          a.checkIn
            ? new Date(a.checkIn).getTime()
            : 0;

        const fechaB =
          b.checkIn
            ? new Date(b.checkIn).getTime()
            : 0;

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


    const esPrecioValido =

      this.nuevoHotel.precio !== undefined &&

      this.nuevoHotel.precio !== null &&

      !isNaN(
        Number(
          this.nuevoHotel.precio
        )
      );


    const payload = {

      nombre:
        this.nuevoHotel.nombre,

      ciudad:
        this.nuevoHotel.ciudad,

      checkin:
        this.nuevoHotel.checkIn || null,

      checkout:
        this.nuevoHotel.checkOut || null,

      precio:
        esPrecioValido
          ? Number(
              this.nuevoHotel.precio
            )
          : null,

      pagado:
        !!this.nuevoHotel.pagado,

      direccion:
        this.nuevoHotel.direccion || null,

      notas:
        this.nuevoHotel.notas || null
    };


    if (this.editandoHotel) {

      const { error } = await supabase
        .from('hoteles')
        .update(payload)
        .eq(
          'id',
          this.indiceHotelEditando
        );

      if (error) {

        console.error(
          'Error actualizando hotel:',
          error
        );

        return;
      }

    } else {

      const { error } = await supabase
        .from('hoteles')
        .insert(payload);

      if (error) {

        console.error(
          'Error creando hotel:',
          error
        );

        return;
      }
    }


    await this.cargarHoteles();

    this.reiniciarHotel();

    this.mostrarFormularioHotel = false;
  }


  editarHotel(
    hotel: Hotel
  ) {

    this.editandoHotel = true;

    this.indiceHotelEditando =
      hotel.id || -1;

    this.nuevoHotel = {
      ...hotel
    };

    this.mostrarFormularioHotel = true;
  }


  async eliminarHotel(
    hotel: Hotel
  ) {

    if (!hotel.id) {
      return;
    }

    const { error } = await supabase
      .from('hoteles')
      .delete()
      .eq(
        'id',
        hotel.id
      );

    if (error) {

      console.error(
        'Error eliminando hotel:',
        error
      );

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

      notas: ''
    };
  }


  /* ===================================================
     13. CARGAR CIUDADES
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
      .order(
        'nombre',
        { ascending: true }
      );


    if (error) {

      console.error(
        'Error cargando ciudades:',
        error
      );

      return;
    }


    this.ciudades =
      (data || []).map(
        (c: any): Ciudad => ({

          id: c.id,

          nombre:
            c.nombre,

          pais:
            c.pais || '',

          descripcion:
            c.descripcion || '',


          lugares:
            (c.lugares || [])
              .map(
                (l: any): Lugar => ({

                  id: l.id,

                  ciudadId:
                    l.ciudad_id,

                  nombre:
                    l.nombre,

                  descripcion:
                    l.descripcion || '',

                  direccion:
                    l.direccion || '',

                  imagen:
                    l.imagen || '',

                  maps:
                    l.maps || ''
                })
              ),


          gastronomia:
            (c.gastronomia || [])
              .map(
                (g: any): Gastronomia => ({

                  id: g.id,

                  ciudadId:
                    g.ciudad_id,

                  nombre:
                    g.nombre,

                  tipo:
                    g.tipo,

                  descripcion:
                    g.descripcion || '',

                  direccion:
                    g.direccion || '',

                  imagen:
                    g.imagen || '',

                  maps:
                    g.maps || ''
                })
              ),


          curiosidades:
            (c.curiosidades || [])
              .map(
                (cur: any) => ({

                  id: cur.id,

                  ciudadId:
                    cur.ciudad_id,

                  titulo:
                    cur.titulo,

                  descripcion:
                    cur.descripcion || ''
                })
              )
        })
      );

      this.cdr.detectChanges();
  }


  /* ===================================================
     14. CIUDADES CRUD
  =================================================== */

  async agregarCiudad() {

    if (
      !this.nuevaCiudad.nombre.trim()
    ) {
      return;
    }


    const payload = {

      nombre:
        this.nuevaCiudad.nombre.trim(),

      pais:
        this.nuevaCiudad.pais?.trim()
        || null,

      descripcion:
        this.nuevaCiudad.descripcion?.trim()
        || null
    };


    if (this.editandoCiudad) {

      const ciudadEditada =
        this.ciudades[
          this.indiceCiudadEditando
        ];

      if (!ciudadEditada?.id) {

        console.error(
          'No se encontró el id de la ciudad'
        );

        return;
      }


      const { error } = await supabase
        .from('ciudades')
        .update(payload)
        .eq(
          'id',
          ciudadEditada.id
        );


      if (error) {

        console.error(
          'Error actualizando ciudad:',
          error
        );

        return;
      }

    } else {

      const { error } = await supabase
        .from('ciudades')
        .insert(payload);


      if (error) {

        console.error(
          'Error creando ciudad:',
          error
        );

        return;
      }
    }


    this.reiniciarCiudad();

    await this.cargarCiudades();

    /*
     * Importante:
     * una ruta ya cargada conserva el nombre visual
     * de la ciudad, así que actualizamos también ruta.
     */
    await this.cargarRutaDias();
  }


  editarCiudad(
    ciudad: Ciudad
  ) {

    this.indiceCiudadEditando =
      this.ciudades.indexOf(ciudad);

    this.editandoCiudad = true;

    this.nuevaCiudad = {

      ...ciudad,

      lugares:
        [...ciudad.lugares],

      gastronomia:
        [...ciudad.gastronomia],

      curiosidades:
        [...ciudad.curiosidades]
    };

    this.mostrarFormularioCiudad = true;
  }


  async eliminarCiudad(
    ciudad: Ciudad
  ) {

    if (!ciudad.id) {
      return;
    }


    const { error } = await supabase
      .from('ciudades')
      .delete()
      .eq(
        'id',
        ciudad.id
      );


    if (error) {

      console.error(
        'Error eliminando ciudad:',
        error
      );

      return;
    }


    if (
      this.ciudadSeleccionada?.id
      === ciudad.id
    ) {
      this.cerrarCiudad();
    }


    await this.cargarCiudades();

    await this.cargarRutaDias();
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


  abrirCiudad(
    ciudad: Ciudad
  ) {

    this.ciudadSeleccionada = ciudad;
  }


  cerrarCiudad() {

    this.ciudadSeleccionada = null;
  
    this.itemAbierto = null;
  
    this.reiniciarLugar();
  
    this.reiniciarGastronomia();
  
    this.reiniciarCuriosidad();
  }


  /* ===================================================
     15. LUGARES CRUD
  =================================================== */

  async agregarLugar() {

    if (
      !this.ciudadSeleccionada?.id ||
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


      if (!lugar?.id) {
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
      )
      || null;


    /*
     * Actualizamos Ruta para que las referencias
     * siempre apunten a los datos actuales.
     */
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


    this.editandoLugar = true;


    this.nuevoLugar = {
      ...lugar
    };


    this.mostrarFormularioLugar = true;
  }


  async eliminarLugar(
    lugar: Lugar
  ) {

    if (
      !this.ciudadSeleccionada?.id ||
      !lugar.id
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
      )
      || null;


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
     16. GASTRONOMIA CRUD
  =================================================== */

  async agregarGastronomia() {

    if (
      !this.ciudadSeleccionada?.id ||
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


      if (!item?.id) {
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
      )
      || null;


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


    this.editandoGastronomia = true;


    this.nuevaGastronomia = {
      ...item
    };


    this.mostrarFormularioGastronomia = true;

    this.dropdownGastronomiaAbierto = false;
  }


  async eliminarGastronomia(
    item: Gastronomia
  ) {

    if (
      !this.ciudadSeleccionada?.id ||
      !item.id
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
      )
      || null;


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
   CURIOSIDADES CRUD
=================================================== */

async agregarCuriosidad() {

  if (
    !this.ciudadSeleccionada?.id ||
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
      this.nuevaCuriosidad.descripcion?.trim()
      || null
  };


  /* ===============================
     EDITAR
  =============================== */

  if (this.editandoCuriosidad) {

    const curiosidad =
      this.ciudadSeleccionada
        .curiosidades[
          this.indiceCuriosidadEditando
        ];

    if (!curiosidad?.id) {
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

  }

  /* ===============================
     CREAR
  =============================== */

  else {

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


  /* ===============================
     RECARGAR DATOS
  =============================== */

  this.reiniciarCuriosidad();

  await this.cargarCiudades();

  this.ciudadSeleccionada =
    this.ciudades.find(
      ciudad =>
        ciudad.id === ciudadId
    )
    || null;

    this.cdr.detectChanges();
}


/* ===================================================
   EDITAR CURIOSIDAD
=================================================== */

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
    this.indiceCuriosidadEditando === -1
  ) {
    return;
  }


  this.editandoCuriosidad = true;


  this.nuevaCuriosidad = {
    ...curiosidad
  };


  this.mostrarFormularioCuriosidad = true;
}


/* ===================================================
   ELIMINAR CURIOSIDAD
=================================================== */

async eliminarCuriosidad(
  curiosidad: Curiosidad
) {

  if (
    !this.ciudadSeleccionada?.id ||
    !curiosidad.id
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
    )
    || null;

    this.cdr.detectChanges();
}


/* ===================================================
   REINICIAR CURIOSIDAD
=================================================== */

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
     17. CARGAR RUTA DESDE SUPABASE
  =================================================== */

  async cargarRutaDias() {

    /*
     * Cargamos primero los días.
     */
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


    /*
     * Después cargamos todos los elementos.
     *
     * No necesitamos una consulta compleja con joins:
     * los lugares/gastronomía ya están cargados dentro
     * de this.ciudades.
     */
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

                    /*
                     * LUGAR
                     */
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


                    /*
                     * GASTRONOMIA
                     */
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

              /*
               * Mantenemos el nombre porque tu HTML
               * actual usa dia.ciudad.
               */
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
     18. CREAR DIA DE RUTA
  =================================================== */

  async agregarDiaRuta() {

    if (
      !this.nuevoDia.titulo.trim() ||
      !this.nuevoDia.ciudad.trim()
    ) {
      return;
    }


    /*
     * El selector HTML sigue guardando el nombre,
     * pero Supabase necesita ciudad_id.
     */
    const ciudad =
      this.ciudades.find(
        ciudad =>
          ciudad.nombre
          === this.nuevoDia.ciudad
      );


    if (!ciudad?.id) {

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

    this.mostrarFormularioDia = false;


    await this.cargarRutaDias();

    this.cdr.detectChanges();
  }


  /* ===================================================
     19. AÑADIR LUGAR AL DIA
  =================================================== */

  async agregarLugarADia(
    dia: DiaRuta
  ) {

    if (
      !dia.id ||
      !dia.ciudadId ||
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


    /*
     * El <select> actual devuelve el nombre.
     * Localizamos el registro real para obtener su id.
     */
    const lugar =
      ciudad.lugares.find(
        lugar =>
          lugar.nombre
          === dia.lugarSeleccionado
      );


    if (!lugar?.id) {

      console.error(
        'No se encontró el lugar seleccionado'
      );

      return;
    }


    /*
     * Evitamos añadir dos veces el mismo lugar
     * al mismo día.
     */
    const existe =
      dia.elementos.some(
        elemento =>
          elemento.tipo === 'lugar' &&
          elemento.lugarId === lugar.id
      );


    if (existe) {

      dia.lugarSeleccionado = '';

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
  }


  /* ===================================================
     20. AÑADIR GASTRONOMIA AL DIA
  =================================================== */

  async agregarGastronomiaADia(
    dia: DiaRuta
  ) {

    if (
      !dia.id ||
      !dia.ciudadId ||
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


    if (!gastronomia?.id) {

      console.error(
        'No se encontró el sitio seleccionado'
      );

      return;
    }


    const existe =
      dia.elementos.some(
        elemento =>
          elemento.tipo
            === 'gastronomia' &&
          elemento.gastronomiaId
            === gastronomia.id
      );


    if (existe) {

      dia.gastronomiaSeleccionada = '';

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
  }


  /* ===================================================
     21. ELIMINAR ELEMENTO DE RUTA
  =================================================== */

  async eliminarElementoDia(
    dia: DiaRuta,
    elemento: RutaElemento
  ) {

    if (!elemento.id) {
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
  }


  /* ===================================================
     22. ELIMINAR DIA COMPLETO
     Aunque todavía no tengas el botón, queda preparado.
  =================================================== */

  async eliminarDiaRuta(
    dia: DiaRuta
  ) {

    if (!dia.id) {
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
  }


  /* ===================================================
     23. HELPERS CIUDAD / RUTA
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

    if (id === null) {
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
     24. POPUP ELEMENTO RUTA
  =================================================== */

  abrirElementoRuta(
    elemento: RutaElemento
  ) {

    /*
     * Ya no buscamos realmente por nombre.
     *
     * RutaElemento contiene la referencia original
     * al lugar o gastronomía de Ciudad.
     */

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
            ciudad.id
            === lugar.ciudadId
        );


      this.ciudadElementoRuta =
        ciudad?.nombre || '';

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
  }


  buscarLugarPorId(
    lugarId?: number
  ): Lugar | undefined {

    if (!lugarId) {
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

    if (!gastronomiaId) {
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
  }


  /* ===================================================
     25. INTERFAZ GENERAL
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
