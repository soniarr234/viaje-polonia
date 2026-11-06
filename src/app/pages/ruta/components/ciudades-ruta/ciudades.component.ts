import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { supabase } from '../../../../core/supabase';
import { Ciudad, Lugar, Gastronomia, Curiosidad } from '../../models/ciudad.model';

interface RutaElemento {
  id: number;
  tipo: 'lugar' | 'gastronomia';
  lugarId?: number;
  gastronomiaId?: number;
  referencia: string;
  lugar?: Lugar;
  gastronomia?: Gastronomia;
  posicion?: number;
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

@Component({
  selector: 'app-ciudades-ruta',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './ciudades-ruta.component.html',
  styleUrl: '../../ruta.css'
})
export class CiudadesRutaComponent implements OnInit {

    subVistaCiudades: 'ciudades' | 'ruta' = 'ciudades';
    subVistaGuia: 'lugares' | 'gastronomia' | 'curiosidades' = 'lugares';
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

    // INTERFAZ Y MODALES EXPANSIVOS
    itemAbierto: string | null = null;
    textoLargoExpandido = false;
    elementoRutaAbierto: any = null;
    mostrarModalDetalleRuta = false;

    // LUGARES
    mostrarFormularioLugar = false;
    editandoLugar = false;
    indiceLugarEditando = -1;
    nuevoLugar: Lugar = { nombre: '', descripcion: '', direccion: '', imagen: '', maps: '' };

    // GASTRONOMIA
    mostrarFormularioGastronomia = false;
    editandoGastronomia = false;
    indiceGastronomiaEditando = -1;
    dropdownGastronomiaAbierto = false;
    pestanaGastroActive: 'que-comer' | 'donde-comer' = 'que-comer';
    subSubTipoActive:'restaurante' | 'cerveceria' | 'cafeteria' | 'plato' | 'bebida' | 'postre' = 'plato';

    nuevaGastronomia: Gastronomia = {
        nombre: '',
        tipo: 'plato',
        descripcion: '',
        direccion: '',
        imagen: '',
        maps: ''
    };

    // CURIOSIDADES
    mostrarFormularioCuriosidad = false;
    editandoCuriosidad = false;
    indiceCuriosidadEditando = -1;
    nuevaCuriosidad: Curiosidad = { titulo: '', descripcion: '' };

    // RUTAS DIARIAS
    rutaDias: DiaRuta[] = [];
    mostrarFormularioDia = false;
    dropdownCiudadRutaAbierto = false;
    editandoDiaRuta = false;
    idDiaRutaEditando: number | null = null;
    mostrarConfirmarBorradoDiaRuta = false;
    diaRutaParaBorrar: DiaRuta | null = null;

    nuevoDia: DiaRuta = {
        id: null, titulo: '', ciudadId: null, ciudad: '', fecha: '', elementos: [],
        lugarSeleccionado: '', gastronomiaSeleccionada: ''
    };

    // QUITAR ACTIVIDADES
    mostrarConfirmarQuitarActividadDia = false;
    actividadParaQuitar: RutaElemento | null = null;
    diaDeActividadParaQuitar: DiaRuta | null = null;

    mostrarToast = false;
    mensajeToast = '';

    constructor(
        private cdr: ChangeDetectorRef,
        private zone: NgZone
    ) {}

    async ngOnInit(): Promise<void> {
        await this.cargarCiudades();
        await this.cargarRutaDias();
    }

    async cargarCiudades() {
        const { data, error } = await supabase
        .from('ciudades')
        .select(`
            id, nombre, pais, descripcion,
            lugares (id, ciudad_id, nombre, descripcion, direccion, imagen, maps, posicion),
            gastronomia (id, ciudad_id, nombre, tipo, descripcion, direccion, imagen, maps, posicion),
            curiosidades (id, ciudad_id, titulo, descripcion)
        `)
        .order('nombre', { ascending: true })
        .order('posicion', { foreignTable: 'lugares', ascending: true })
        .order('posicion', { foreignTable: 'gastronomia', ascending: true });

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
                id: l.id, ciudadId: l.ciudad_id, nombre: l.nombre, descripcion: l.descripcion || '',
                direccion: l.direccion || '', imagen: l.imagen || '', maps: l.maps || '', posicion: l.posicion || 0
            })).sort((a: Lugar, b: Lugar) => (a.posicion || 0) - (b.posicion || 0)),
            gastronomia: (c.gastronomia || []).map((g: any): Gastronomia => ({
                id: g.id, ciudadId: g.ciudad_id, nombre: g.nombre, tipo: g.tipo, descripcion: g.descripcion || '',
                direccion: g.direccion || '', imagen: g.imagen || '', maps: g.maps || '', posicion: g.posicion || 0
            })).sort((a: Gastronomia, b: Gastronomia) => (a.posicion || 0) - (b.posicion || 0)),
            curiosidades: (c.curiosidades || []).map((cur: any): Curiosidad => ({
                id: cur.id, ciudadId: cur.ciudad_id, titulo: cur.titulo, descripcion: cur.descripcion || ''
            }))
        }));

        this.cdr.detectChanges();
    }

    async cargarRutaDias() {
        const { data: diasData, error: diasError } = await supabase.from('ruta_dias').select('*').order('fecha', { ascending: true });
        if (diasError) return;
        const { data: elementosData, error: elementosError } = await supabase.from('ruta_elementos').select('*').order('posicion', { ascending: true });
        if (elementosError) return;

        this.rutaDias = (diasData || []).map((diaDb: any): DiaRuta => {
            const ciudad = this.ciudades.find(c => c.id === diaDb.ciudad_id);
            const elementosDia = (elementosData || [])
                .filter((el: any) => el.ruta_dia_id === diaDb.id)
                .map((el: any): RutaElemento => {
                    if (el.tipo === 'lugar') {
                        const lug = ciudad?.lugares.find(l => l.id === el.lugar_id);
                        return { id: el.id, tipo: 'lugar', lugarId: el.lugar_id, referencia: lug?.nombre || 'Lugar no disponible', lugar: lug, posicion: el.posicion };
                    } else {
                        const gastro = ciudad?.gastronomia.find(g => g.id === el.gastronomia_id);
                        return { id: el.id, tipo: 'gastronomia', gastronomiaId: el.gastronomia_id, referencia: gastro?.nombre || 'Sitio no disponible', gastronomia: gastro, posicion: el.posicion };
                    }
                });
            return { id: diaDb.id, titulo: diaDb.titulo, ciudadId: diaDb.ciudad_id, ciudad: ciudad?.nombre || '', fecha: diaDb.fecha || '', elementos: elementosDia, lugarSeleccionado: '', gastronomiaSeleccionada: '' };
        });
        this.cdr.detectChanges();
    }

    formatearTexto(texto: string | null): string {
        if (!texto) return '';
        let res = texto.replace(/\n/g, '<br>');
        const posDosPuntos = res.indexOf(':');
        const posSalto = res.indexOf('<br>');
        let corte = -1;
        let longSep = 1;

        if (posDosPuntos !== -1 && (posSalto === -1 || posDosPuntos < posSalto)) {
            corte = posDosPuntos;
        } else if (posSalto !== -1) {
            corte = posSalto;
            longSep = 4;
        }

        if (corte !== -1) {
            const tit = res.substring(0, corte).trim();
            const resto = res.substring(corte + longSep).trim();
            res = `<span class="subtitulo-lugar">${tit}</span><br>${resto}`;
        }

        return res.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    }

    cambiarPestanaGastro(pestana: 'que-comer' | 'donde-comer') {
        this.pestanaGastroActive = pestana;
        this.nuevaGastronomia.tipo = pestana === 'que-comer' ? 'postres' : this.subSubTipoActive;
        this.cdr.detectChanges();
    }

    cambiarSubSubTipoGastro(subTipo: 'restaurante' | 'cerveceria' | 'cafeteria' | 'postres') {
        this.subSubTipoActive = subTipo;
        if (this.pestanaGastroActive === 'donde-comer') {
            this.nuevaGastronomia.tipo = subTipo;
        }
        this.cdr.detectChanges();
    }

    abrirCiudad(ciudad: Ciudad) {
        this.ciudadSeleccionada = ciudad;
    
        this.subVistaGuia = 'lugares';
    
        this.itemAbierto = null;
        this.textoLargoExpandido = false;
        this.reiniciarLugar();
        this.reiniciarGastronomia();
        this.reiniciarCuriosidad();
    
        this.cdr.detectChanges();
    }

    cerrarCiudad() {
        this.ciudadSeleccionada = null;
        this.itemAbierto = null;
        this.textoLargoExpandido = false;
        this.reiniciarLugar();
        this.reiniciarGastronomia();
        this.reiniciarCuriosidad();
        this.cdr.detectChanges();
    }

    // ==================== CRUD CIUDADES ====================
    abrirFormularioCiudad() { this.reiniciarCiudad(); this.mostrarFormularioCiudad = true; }
    cancelarFormularioCiudad() { this.reiniciarCiudad(); }
    
    async agregarCiudad() {
        if (!this.nuevaCiudad.nombre?.trim()) return;
        if (this.guardandoCiudad) return;
        this.guardandoCiudad = true;

        const payload = { nombre: this.nuevaCiudad.nombre.trim(), pais: this.nuevaCiudad.pais?.trim() || null, descripcion: this.nuevaCiudad.descripcion?.trim() || null };

        try {
            if (this.editandoCiudad) {
                const idEdit = this.ciudades[this.indiceCiudadEditando]?.id;
                if (!idEdit) return;
                await supabase.from('ciudades').update(payload).eq('id', idEdit);
                this.mensajeToast = '¡Ciudad actualizada!';
            } else {
                await supabase.from('ciudades').insert(payload);
                this.mensajeToast = '¡Ciudad añadida!';
            }

            this.reiniciarCiudad();
            await this.cargarCiudades();
            await this.cargarRutaDias();
            this.mostrarToast = true;
            setTimeout(() => this.mostrarToast = false, 4000);
        } catch (e) { console.error(e); } finally { this.guardandoCiudad = false; this.cdr.detectChanges(); }
    }

    editarCiudad(ciudad: Ciudad, event?: Event) {
        if (event) { event.preventDefault(); event.stopPropagation(); }
        this.indiceCiudadEditando = this.ciudades.indexOf(ciudad);
        this.editandoCiudad = true;
        this.nuevaCiudad = { ...ciudad, lugares: [...ciudad.lugares], gastronomia: [...ciudad.gastronomia], curiosidades: [...ciudad.curiosidades] };
        this.mostrarFormularioCiudad = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    pedirConfirmacionBorradoCiudad(ciudad: Ciudad, event: Event) {
        event.preventDefault(); event.stopPropagation();
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
        if (!this.ciudadParaBorrar || !this.ciudadParaBorrar.id) { this.cerrarConfirmarBorradoCiudad(); return; }
        const idBorrar = this.ciudadParaBorrar.id;
        this.cerrarConfirmarBorradoCiudad();
    
        const { error } = await supabase.from('ciudades').delete().eq('id', idBorrar);
        if (error) { console.error(error); return; }
    
        if (this.ciudadSeleccionada?.id === idBorrar) this.cerrarCiudad();
        await this.cargarCiudades();
        await this.cargarRutaDias();
        this.cdr.detectChanges();
    }
    
    reiniciarCiudad() {
        this.nuevaCiudad = { nombre: '', pais: '', descripcion: '', lugares: [], gastronomia: [], curiosidades: [] };
        this.editandoCiudad = false;
        this.indiceCiudadEditando = -1;
        this.mostrarFormularioCiudad = false;
    }

    // ==================== CRUD LUGARES ====================
    async agregarLugar() {
        if (this.ciudadSeleccionada?.id == null || !this.nuevoLugar.nombre.trim()) return;
        const ciudadId = this.ciudadSeleccionada.id;
    
        const payload = {
            ciudad_id: ciudadId,
            nombre: this.nuevoLugar.nombre.trim(),
            descripcion: this.nuevoLugar.descripcion?.trim() || null,
            direccion: this.nuevoLugar.direccion?.trim() || null,
            imagen: this.nuevoLugar.imagen?.trim() || null,
            maps: this.nuevoLugar.maps?.trim() || null
        };

        if (this.editandoLugar) {
            const lugar = this.ciudadSeleccionada.lugares[this.indiceLugarEditando];
            if (lugar?.id == null) return;
            const { error } = await supabase.from('lugares').update(payload).eq('id', lugar.id);
            if (error) { console.error(error); return; }
        } else {
            const { error } = await supabase.from('lugares').insert(payload);
            if (error) { console.error(error); return; }
        }
        this.reiniciarLugar();
        await this.cargarCiudades();
        this.ciudadSeleccionada = this.ciudades.find(c => c.id === ciudadId) || null;
        await this.cargarRutaDias();
        this.cdr.detectChanges();
    }

    editarLugar(lugar: Lugar) {
        if (!this.ciudadSeleccionada) return;
    
        this.indiceLugarEditando = this.ciudadSeleccionada.lugares.indexOf(lugar);
    
        if (this.indiceLugarEditando < 0) return;
    
        this.editandoLugar = true;
        this.nuevoLugar = { ...lugar };
        this.mostrarFormularioLugar = true;
    
        this.cdr.detectChanges();
    
        setTimeout(() => {
            document
              .getElementById('form-lugar')
              ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
        }, 100);
    }

    async eliminarLugar(lugar: Lugar) {
        if (this.ciudadSeleccionada?.id == null || lugar.id == null) return;
        const ciudadId = this.ciudadSeleccionada.id;
        const { error } = await supabase.from('lugares').delete().eq('id', lugar.id);
        if (error) { console.error(error); return; }
        await this.cargarCiudades();
        this.ciudadSeleccionada = this.ciudades.find(c => c.id === ciudadId) || null;
        await this.cargarRutaDias();
        this.cdr.detectChanges();
    }

    reiniciarLugar() {
        this.nuevoLugar = { nombre: '', descripcion: '', direccion: '', imagen: '', maps: '' };
        this.editandoLugar = false;
        this.indiceLugarEditando = -1;
        this.mostrarFormularioLugar = false;
    }

    // ==================== CRUD GASTRONOMÍA ====================
    async agregarGastronomia() {
        if (this.ciudadSeleccionada?.id == null || !this.nuevaGastronomia.nombre.trim()) return;
        const ciudadId = this.ciudadSeleccionada.id;
        
        let tipoFinal =
            this.pestanaGastroActive === 'que-comer'
                ? this.nuevaGastronomia.tipo
                : this.subSubTipoActive;
        
        const payload: any = {
            ciudad_id: ciudadId,
            nombre: this.nuevaGastronomia.nombre.trim(),
            tipo: tipoFinal,
            descripcion: this.nuevaGastronomia.descripcion?.trim() || null,
            direccion: this.pestanaGastroActive === 'donde-comer' ? (this.nuevaGastronomia.direccion?.trim() || null) : null,
            imagen: this.nuevaGastronomia.imagen?.trim() || null,
            maps: this.pestanaGastroActive === 'donde-comer' ? (this.nuevaGastronomia.maps?.trim() || null) : null
        };

        if (this.editandoGastronomia) {
            const item = this.ciudadSeleccionada.gastronomia[this.indiceGastronomiaEditando];
            if (item?.id == null) return;
            await supabase.from('gastronomia').update(payload).eq('id', item.id);
        } else {
            const maxPos = this.ciudadSeleccionada.gastronomia.reduce((max, item) => (item.posicion || 0) > max ? (item.posicion || 0) : max, 0);
            payload.posicion = maxPos + 1;
            await supabase.from('gastronomia').insert([payload]);
        }
        this.reiniciarGastronomia();
        await this.cargarCiudades();
        this.ciudadSeleccionada = this.ciudades.find(c => c.id === ciudadId) || null;
        await this.cargarRutaDias();
        this.cdr.detectChanges();  
    }

    editarGastronomia(item: Gastronomia) {
        if (!this.ciudadSeleccionada) return;
    
        this.indiceGastronomiaEditando =
          this.ciudadSeleccionada.gastronomia.indexOf(item);
    
        if (this.indiceGastronomiaEditando < 0) return;
    
        this.editandoGastronomia = true;
        this.nuevaGastronomia = { ...item };
    
        if (
          item.tipo === 'postres' ||
          (item.tipo as any) === 'plato_comida' ||
          (item.tipo as any) === 'plato_bebida'
        ) {
          this.pestanaGastroActive = 'que-comer';
        } else {
          this.pestanaGastroActive = 'donde-comer';
          this.subSubTipoActive = item.tipo as any;
        }
    
        this.mostrarFormularioGastronomia = true;
        this.dropdownGastronomiaAbierto = false;
    
        this.cdr.detectChanges();
    
        setTimeout(() => {
            document
              .getElementById('form-gastronomia')
              ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
        }, 100);
    }

    async eliminarGastronomia(item: Gastronomia, event?: Event) {
        if (event) { event.preventDefault(); event.stopPropagation(); }
        if (this.ciudadSeleccionada?.id == null || item.id == null) return;
        const ciudadId = this.ciudadSeleccionada.id;
        await supabase.from('gastronomia').delete().eq('id', item.id);
        await this.cargarCiudades();
        this.ciudadSeleccionada = this.ciudades.find(c => c.id === ciudadId) || null;
        await this.cargarRutaDias();
        this.cdr.detectChanges();
    }

    reiniciarGastronomia() {
        this.nuevaGastronomia = {
            nombre: '',
            tipo: 'plato',
            descripcion: '',
            direccion: '',
            imagen: '',
            maps: ''
        };
        this.pestanaGastroActive = 'que-comer';
        this.subSubTipoActive = 'restaurante';
        this.editandoGastronomia = false;
        this.indiceGastronomiaEditando = -1;
        this.mostrarFormularioGastronomia = false;
        this.dropdownGastronomiaAbierto = false;
    }

    // ==================== CRUD CURIOSIDADES ====================
    async agregarCuriosidad() {
        if (this.ciudadSeleccionada?.id == null || !this.nuevaCuriosidad.titulo.trim()) return;
        const ciudadId = this.ciudadSeleccionada.id;
        const payload = {
            ciudad_id: ciudadId,
            titulo: this.nuevaCuriosidad.titulo.trim(),
            descripcion: this.nuevaCuriosidad.descripcion?.trim() || null
        };
        if (this.editandoCuriosidad) {
            const curiosidad = this.ciudadSeleccionada.curiosidades[this.indiceCuriosidadEditando];
            if (curiosidad?.id == null) return;
            await supabase.from('curiosidades').update(payload).eq('id', curiosidad.id);
        } else {
            await supabase.from('curiosidades').insert(payload);
        }
        this.reiniciarCuriosidad();
        await this.cargarCiudades();
        this.ciudadSeleccionada = this.ciudades.find(c => c.id === ciudadId) || null;
        this.cdr.detectChanges();
    }

    editarCuriosidad(curiosidad: Curiosidad) {
        if (!this.ciudadSeleccionada) return;
    
        this.indiceCuriosidadEditando =
          this.ciudadSeleccionada.curiosidades.indexOf(curiosidad);
    
        if (this.indiceCuriosidadEditando < 0) return;
    
        this.editandoCuriosidad = true;
        this.nuevaCuriosidad = { ...curiosidad };
        this.mostrarFormularioCuriosidad = true;
    
        this.cdr.detectChanges();
    
        setTimeout(() => {
            document
              .getElementById('form-curiosidad')
              ?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
        }, 100);
    }

    async eliminarCuriosidad(curiosidad: Curiosidad) {
        if (this.ciudadSeleccionada?.id == null || curiosidad.id == null) return;
        const ciudadId = this.ciudadSeleccionada.id;
        await supabase.from('curiosidades').delete().eq('id', curiosidad.id);
        await this.cargarCiudades();
        this.ciudadSeleccionada = this.ciudades.find(c => c.id === ciudadId) || null;
        this.cdr.detectChanges();
    }

    reiniciarCuriosidad() {
        this.nuevaCuriosidad = { titulo: '', descripcion: '' };
        this.editandoCuriosidad = false;
        this.indiceCuriosidadEditando = -1;
        this.mostrarFormularioCuriosidad = false;
    }

    // ==================== GESTIÓN DE DÍAS DE RUTA ====================
    async agregarDiaRuta() {
        if (!this.nuevoDia.titulo.trim() || !this.nuevoDia.ciudad.trim()) return;
        const ciudad = this.ciudades.find(c => c.id === this.nuevoDia.ciudadId) || this.ciudades.find(c => c.nombre === this.nuevoDia.ciudad);
        if (ciudad?.id == null) return;
        const payload = { titulo: this.nuevoDia.titulo.trim(), fecha: this.nuevoDia.fecha || null, ciudad_id: ciudad.id };
        if (this.editandoDiaRuta) {
            await supabase.from('ruta_dias').update(payload).eq('id', this.idDiaRutaEditando);
        } else {
            await supabase.from('ruta_dias').insert(payload);
        }
        this.reiniciarDia();
        this.mostrarFormularioDia = false;
        await this.cargarRutaDias();
    }
    
    editarDiaRuta(dia: DiaRuta, event: Event) {
        event.preventDefault(); event.stopPropagation();
        if (dia.id == null) return;
        this.editandoDiaRuta = true;
        this.idDiaRutaEditando = dia.id;
        this.nuevoDia = { ...dia, elementos: [...dia.elementos] };
        this.mostrarFormularioDia = true;
        this.cdr.detectChanges();
    }

    reiniciarDia() {
        this.nuevoDia = { id: null, titulo: '', ciudadId: null, ciudad: '', fecha: '', elementos: [], lugarSeleccionado: '', gastronomiaSeleccionada: '' };
        this.editandoDiaRuta = false; this.idDiaRutaEditando = null; this.dropdownCiudadRutaAbierto = false;
    }

    async agregarLugarADia(dia: DiaRuta) {
        if (dia.id == null || dia.ciudadId == null || !dia.lugarSeleccionado) return;
        const ciudad = this.ciudades.find(c => c.id === dia.ciudadId);
        const lugar = ciudad?.lugares.find(l => l.nombre === dia.lugarSeleccionado);
        if (lugar?.id == null) return;
        if (dia.elementos.some(el => el.tipo === 'lugar' && el.lugarId === lugar.id)) { dia.lugarSeleccionado = ''; return; }
        await supabase.from('ruta_elementos').insert({ ruta_dia_id: dia.id, tipo: 'lugar', lugar_id: lugar.id, gastronomia_id: null, posicion: dia.elementos.length + 1 });
        dia.lugarSeleccionado = '';
        await this.cargarRutaDias();
    }
    
    async agregarGastronomiaADia(dia: DiaRuta) {
        if (dia.id == null || dia.ciudadId == null || !dia.gastronomiaSeleccionada) return;
        const ciudad = this.ciudades.find(c => c.id === dia.ciudadId);
        const gastro = ciudad?.gastronomia.find(item => item.id === Number(dia.gastronomiaSeleccionada) || item.nombre === dia.gastronomiaSeleccionada);
        if (gastro?.id == null) return;
        if (dia.elementos.some(el => el.tipo === 'gastronomia' && el.gastronomiaId === gastro.id)) { dia.gastronomiaSeleccionada = ''; return; }
        await supabase.from('ruta_elementos').insert({ ruta_dia_id: dia.id, tipo: 'gastronomia', lugar_id: null, gastronomia_id: gastro.id, posicion: dia.elementos.length + 1 });
        dia.gastronomiaSeleccionada = '';
        await this.cargarRutaDias();
    }
        
    pedirConfirmacionQuitarActividad(dia: DiaRuta, elemento: RutaElemento, event: Event) {
        event.preventDefault(); event.stopPropagation();
        this.zone.run(() => {
            this.diaDeActividadParaQuitar = dia;
            this.actividadParaQuitar = elemento;
            this.mostrarConfirmarQuitarActividadDia = true;
            this.cdr.detectChanges();
        });
    }

    cerrarConfirmacionQuitarActividad() {
        this.mostrarConfirmarQuitarActividadDia = false;
        this.actividadParaQuitar = null; this.diaDeActividadParaQuitar = null;
        this.cdr.detectChanges();
    }
        
    async confirmarQuitarActividadDeRuta() {
        if (!this.actividadParaQuitar || !this.diaDeActividadParaQuitar || this.actividadParaQuitar.id == null) { this.cerrarConfirmacionQuitarActividad(); return; }
        const idBorrar = this.actividadParaQuitar.id;
        const diaAsociado = this.diaDeActividadParaQuitar;
        this.cerrarConfirmacionQuitarActividad();
        await supabase.from('ruta_elementos').delete().eq('id', idBorrar);
        this.zone.run(async () => {
            diaAsociado.elementos = diaAsociado.elementos.filter(item => item.id !== idBorrar);
            await this.cargarRutaDias();
            this.cdr.detectChanges();
        });
    }
    
    abrirFormularioDia() {
        this.reiniciarDia();
        this.mostrarFormularioDia = true;
        this.cdr.detectChanges();
    }

    async guardarDiaRuta() {
        if (!this.nuevoDia.titulo.trim() || !this.nuevoDia.ciudad.trim()) return;

        // Buscamos la ciudad asociada para obtener su ID correspondiente
        const ciudad = this.ciudades.find(c => c.id === this.nuevoDia.ciudadId) || this.ciudades.find(c => c.nombre === this.nuevoDia.ciudad);
        if (ciudad?.id == null) return;

        const payload = { 
            titulo: this.nuevoDia.titulo.trim(), 
            fecha: this.nuevoDia.fecha || null, 
            ciudad_id: ciudad.id 
        };

        try {
            if (this.editandoDiaRuta && this.idDiaRutaEditando != null) {
                // Actualizar día existente
                await supabase.from('ruta_dias').update(payload).eq('id', this.idDiaRutaEditando);
                this.mensajeToast = '¡Día de ruta actualizado!';
            } else {
                // Insertar nuevo día
                await supabase.from('ruta_dias').insert(payload);
                this.mensajeToast = '¡Día de ruta añadido!';
            }

            this.reiniciarDia();
            this.mostrarFormularioDia = false;
            await this.cargarRutaDias();
            
            this.mostrarToast = true;
            setTimeout(() => this.mostrarToast = false, 4000);
        } catch (error) {
            console.error('Error al guardar el día de ruta:', error);
        } finally {
            this.cdr.detectChanges();
        }
    }
    
    // ==================== REORDENAMIENTOS DRAG & DROP ====================
    async reordenarLugares(event: CdkDragDrop<Lugar[]>) {
        if (!this.ciudadSeleccionada?.lugares) return;
        moveItemInArray(this.ciudadSeleccionada.lugares, event.previousIndex, event.currentIndex);
        this.cdr.detectChanges();
        const updates = this.ciudadSeleccionada.lugares.map((lugar, index) => {
            lugar.posicion = index;
            return supabase.from('lugares').update({ posicion: index }).eq('id', lugar.id);
        });
        await Promise.all(updates);
    }

    async reordenarGastronomia(event: CdkDragDrop<Gastronomia[]>) {
        if (!this.ciudadSeleccionada?.gastronomia) return;
        moveItemInArray(this.ciudadSeleccionada.gastronomia, event.previousIndex, event.currentIndex);
        this.cdr.detectChanges();
        const updates = this.ciudadSeleccionada.gastronomia.map((item, index) => {
            item.posicion = index;
            return supabase.from('gastronomia').update({ posicion: index }).eq('id', item.id);
        });
        await Promise.all(updates);
    }
        
    async reordenarElementosDia(event: CdkDragDrop<RutaElemento[]>, dia: DiaRuta) {
        if (!dia?.elementos) return;
        moveItemInArray(dia.elementos, event.previousIndex, event.currentIndex);
        this.cdr.detectChanges();
        const updates = dia.elementos.map((el, index) => {
            el.posicion = index;
            return supabase.from('ruta_elementos').update({ posicion: index }).eq('id', el.id);
        });
        await Promise.all(updates);
    }
        
    obtenerCiudadPorId(id: number | null): Ciudad | undefined {
        return id == null ? undefined : this.ciudades.find(c => c.id === id);
    }
        
    pedirConfirmacionBorradoDiaRuta(dia: DiaRuta, event: Event) {
        event.preventDefault(); event.stopPropagation();
        this.diaRutaParaBorrar = dia;
        this.mostrarConfirmarBorradoDiaRuta = true;
        this.cdr.detectChanges();
    }
        
    cerrarConfirmarBorradoDiaRuta() {
        this.mostrarConfirmarBorradoDiaRuta = false; this.diaRutaParaBorrar = null;
        this.cdr.detectChanges();
    }
        
    async confirmarEliminarDiaRuta() {
        if (!this.diaRutaParaBorrar?.id) { this.cerrarConfirmarBorradoDiaRuta(); return; }
        const idBorrar = this.diaRutaParaBorrar.id;
        this.cerrarConfirmarBorradoDiaRuta();
        await supabase.from('ruta_dias').delete().eq('id', idBorrar);
        await this.cargarRutaDias();
        this.cdr.detectChanges();
    }

    toggleItem(idUnico: string) {
        if (this.itemAbierto === idUnico) {
            this.itemAbierto = null;
        } else {
            this.itemAbierto = idUnico;
        }
        this.textoLargoExpandido = false;
        this.cdr.detectChanges();
    }

    toggleTextoLargo(event: Event) {
        event.preventDefault(); event.stopPropagation();
        this.textoLargoExpandido = !this.textoLargoExpandido;
        this.cdr.detectChanges();
    }

    abrirModalDetalleRuta(el: RutaElemento) {
        if (el.tipo === 'lugar' && el.lugar) {
            this.elementoRutaAbierto = { 
                nombre: el.lugar.nombre, 
                descripcion: el.lugar.descripcion, 
                maps: el.lugar.maps, 
                direccion: el.lugar.direccion 
            };
        } else if (el.tipo === 'gastronomia' && el.gastronomia) {
            this.elementoRutaAbierto = { 
                nombre: el.gastronomia.nombre, 
                descripcion: el.gastronomia.descripcion, 
                maps: el.gastronomia.maps, 
                direccion: el.gastronomia.direccion 
            };
        }
        
        if (this.elementoRutaAbierto) {
            this.mostrarModalDetalleRuta = true;
            this.textoLargoExpandido = false;
            this.cdr.detectChanges();
        }
    }

    cerrarModalDetalleRuta() {
        this.mostrarModalDetalleRuta = false;
        this.elementoRutaAbierto = null;
        this.textoLargoExpandido = false;
        this.cdr.detectChanges();
    }

    seleccionarCiudadRuta(ciudad: Ciudad) {
        this.nuevoDia.ciudadId = ciudad.id || null;
        this.nuevoDia.ciudad = ciudad.nombre;
        this.dropdownCiudadRutaAbierto = false;
        this.cdr.detectChanges();
    }
}