import { Component, OnInit, ChangeDetectorRef, HostListener, ElementRef, NgZone } from '@angular/core'; // 👈 Añadido NgZone
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../../../core/supabase';
import { Transporte } from '../../models/transporte.model';

@Component({
  selector: 'app-transportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transportes.component.html',
  styleUrl: '../../ruta.css'
})
export class TransportesComponent implements OnInit {

  transportes: Transporte[] = [];

  get vuelos(): Transporte[] {
    return this.transportes.filter(t => t.tipo === 'vuelo');
  }

  get trenes(): Transporte[] {
    return this.transportes.filter(t => t.tipo === 'tren');
  }

  get buses(): Transporte[] {
    return this.transportes.filter(t => t.tipo === 'bus');
  }

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

  // 👈 Inyectamos ngZone en el constructor
  constructor(
    private cdr: ChangeDetectorRef, 
    private elementRef: ElementRef,
    private ngZone: NgZone 
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarTransportes();
  }

  @HostListener('document:click', ['$event'])
  alHacerClicFuera(event: Event) {
    if (!this.mostrarFormularioTransporte) return;

    const targetElement = event.target as HTMLElement;
    const clicDentroDelComponente = this.elementRef.nativeElement.contains(targetElement);
    const clicDentroDelFormulario = targetElement.closest('.form-grid');
    const clicEnBotonAbrirOEditar = targetElement.closest('.btn-add') || targetElement.closest('.btn-editar');

    // 👈 Añadimos una verificación para que no se cierre el formulario MIENTRAS está guardando
    if (this.guardandoTransporte) return;

    if (clicDentroDelComponente && !clicDentroDelFormulario && !clicEnBotonAbrirOEditar) {
      this.cancelarFormularioTransporte();
      this.cdr.detectChanges();
    }
  }

  async cargarTransportes() {
    const { data, error } = await supabase
      .from('transporte')
      .select('*')
      .order('fecha');

    if (error) {
      console.error('Error cargando transportes:', error);
      return;
    }

    this.transportes = (data || []).map((t: any) => ({
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

    this.cdr.detectChanges();
  }

  abrirFormularioTransporte() {
    this.reiniciarFormulario();
    this.mostrarFormularioTransporte = true;
  }

  cancelarFormularioTransporte() {
    this.reiniciarFormulario();
    this.mostrarFormularioTransporte = false;
  }

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

    this.mensajeToast = '¡Transporte eliminado correctamente!';
    this.lanzarToast();
    await this.cargarTransportes();
  }

  async agregarTransporte() {
    if (!this.nuevoTransporte.origen.trim() || !this.nuevoTransporte.destino.trim()) {
      return;
    }

    if (this.guardandoTransporte) return;
    this.guardandoTransporte = true;
    this.cdr.detectChanges(); // Fuerza el estado "Guardando..." de inmediato

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

      let errorBase = null;

      if (this.editando) {
        if (this.indiceEditando < 0) return;
        const { error } = await supabase
          .from('transporte')
          .update(payload)
          .eq('id', this.indiceEditando);
        errorBase = error;
        this.mensajeToast = '¡Transporte actualizado con éxito!';
      } else {
        const { error } = await supabase
          .from('transporte')
          .insert(payload);
        errorBase = error;
        this.mensajeToast = '¡Transporte guardado con éxito!';
      }

      if (errorBase) {
        console.error('Error en Supabase:', errorBase);
        return;
      }

      // 👈 Forzamos a Angular a procesar la recarga y cierre dentro de su zona de ejecución activa
      await this.ngZone.run(async () => {
        await this.cargarTransportes();
        this.mostrarFormularioTransporte = false;
        this.reiniciarFormulario();
        this.lanzarToast();
      });

    } catch (e) {
      console.error(e);
    } finally {
      this.guardandoTransporte = false;
      this.cdr.detectChanges();
    }
  }

  lanzarToast() {
    this.mostrarToast = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.mostrarToast = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  editarTransporte(transporte: Transporte) {
    if (transporte.id == null) return;

    this.editando = true;
    this.indiceEditando = transporte.id;
    this.nuevoTransporte = { ...transporte };
    this.mostrarFormularioTransporte = true;
    this.cdr.detectChanges();

    window.scrollTo({ top: 0, behavior: 'smooth' });
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
}