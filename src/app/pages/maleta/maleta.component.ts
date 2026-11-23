import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../core/supabase';

interface ItemMaleta {
  id?: number;
  nombre: string;
  cantidad: number;
  categoria: string;
  preparado: boolean;
  persona?: 'sonia' | 'irene';
}

@Component({
  selector: 'app-maleta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maleta.html',
  styleUrls: ['./maleta.css'],
})
export class Maleta implements OnInit {
  maletaActiva: 'sonia' | 'irene' = 'sonia';
  objetos: ItemMaleta[] = [];
  mostrarModal = false;

  // Propiedades para controlar el Pop-up de confirmación de borrado
  mostrarConfirmarBorrado = false;
  objetoParaBorrar: ItemMaleta | null = null;

  // Propiedades añadidas para controlar el Toast de notificación
  mostrarToast = false;
  mensajeToast = '';

  categorias = [
    { nombre: 'imprescindibles', titulo: 'Imprescindibles' },
    { nombre: 'ropa', titulo: 'Ropa' },
    { nombre: 'aseo personal', titulo: 'Aseo personal' },
    { nombre: 'botiquin', titulo: 'Botiquín' },
    { nombre: 'otros', titulo: 'Otros' },
  ];

  nuevoObjeto: ItemMaleta = {
    nombre: '',
    cantidad: 1,
    categoria: 'ropa',
    preparado: false,
    persona: 'sonia',
  };

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.cargarObjetos();
  }

  get objetosActivos(): ItemMaleta[] {
    return this.objetos.filter(
      (objeto) => (objeto.persona || 'sonia') === this.maletaActiva
    );
  }

  cambiarMaleta(persona: 'sonia' | 'irene') {
    this.maletaActiva = persona;
    this.cdr.detectChanges();
  }

  async cargarObjetos() {
    const { data, error } = await supabase
      .from('maleta')
      .select('*');

    if (error) {
      console.error(error);
      return;
    }

    this.objetos = [...(data || [])];
    this.cdr.detectChanges();
  }

  abrirModal() {
    this.nuevoObjeto.persona = this.maletaActiva;
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.limpiarFormulario();
    this.cdr.detectChanges();
  }

  limpiarFormulario() {
    this.nuevoObjeto = {
      nombre: '',
      cantidad: 1,
      categoria: 'ropa',
      preparado: false,
      persona: this.maletaActiva,
    };
  }

  async guardarObjeto() {
    if (!this.nuevoObjeto.nombre.trim()) {
      return;
    }

    const nombreGuardado = this.nuevoObjeto.nombre;
    const esEdicion = !!this.nuevoObjeto.id;
    const personaDestino = this.nuevoObjeto.persona || this.maletaActiva;

    if (esEdicion) {
      const { error } = await supabase
        .from('maleta')
        .update({
          nombre: this.nuevoObjeto.nombre,
          cantidad: this.nuevoObjeto.cantidad,
          categoria: this.nuevoObjeto.categoria,
          persona: personaDestino,
        })
        .eq('id', this.nuevoObjeto.id);

      if (error) {
        console.error('Error actualizando objeto:', error);
        return;
      }
      this.mensajeToast = `¡"${nombreGuardado}" se ha actualizado con éxito!`;
    } else {
      const { error } = await supabase
        .from('maleta')
        .insert({
          nombre: this.nuevoObjeto.nombre,
          cantidad: this.nuevoObjeto.cantidad,
          categoria: this.nuevoObjeto.categoria,
          preparado: false,
          persona: personaDestino,
        });

      if (error) {
        console.error('Error guardando objeto:', error);
        return;
      }
      const nombreDuena = personaDestino === 'sonia' ? 'Sonia' : 'Irene';
      this.mensajeToast = `¡"${nombreGuardado}" se ha metido en la maleta de ${nombreDuena}!`;
    }

    await this.cargarObjetos();
    this.cerrarModal();

    this.mostrarToast = true;

    setTimeout(() => {
      this.mostrarToast = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  cambiarCantidad(delta: number) {
    const nueva = (this.nuevoObjeto.cantidad || 1) + delta;
    if (nueva >= 1) {
      this.nuevoObjeto.cantidad = nueva;
    }
  }

  pedirConfirmacionBorrado(objeto: ItemMaleta, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    this.objetoParaBorrar = objeto;
    this.mostrarConfirmarBorrado = true;
    this.cdr.detectChanges();
  }

  async confirmarEliminarObjeto() {
    if (!this.objetoParaBorrar || !this.objetoParaBorrar.id) {
      this.cerrarConfirmarBorrado();
      return;
    }

    const idBorrar = this.objetoParaBorrar.id;
    this.cerrarConfirmarBorrado();

    const { error } = await supabase
      .from('maleta')
      .delete()
      .eq('id', idBorrar);

    if (error) {
      console.error('Error de borrado en Supabase:', error);
      return;
    }

    await this.cargarObjetos();
  }

  cerrarConfirmarBorrado() {
    this.mostrarConfirmarBorrado = false;
    this.objetoParaBorrar = null;
    this.cdr.detectChanges();
  }

  editarObjeto(objeto: ItemMaleta, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    this.nuevoObjeto = { ...objeto };
    this.mostrarModal = true;
    this.cdr.detectChanges();
  }

  async toggleObjeto(objeto: ItemMaleta) {
    if (!objeto.id) {
      return;
    }

    objeto.preparado = !objeto.preparado;
    this.cdr.detectChanges();

    const { error } = await supabase
      .from('maleta')
      .update({
        preparado: objeto.preparado,
      })
      .eq('id', objeto.id);

    if (error) {
      console.error('Error actualizando objeto:', error);
      objeto.preparado = !objeto.preparado;
      this.cdr.detectChanges();
      return;
    }

    await this.cargarObjetos();
  }

  obtenerObjetosPorCategoria(categoria: string) {
    return this.objetosActivos
      .filter(
        (objeto) =>
          objeto.categoria.trim().toLowerCase() === categoria.trim().toLowerCase()
      )
      .sort((a, b) => {
        if (a.preparado !== b.preparado) {
          return Number(a.preparado) - Number(b.preparado);
        }
        return a.nombre.localeCompare(b.nombre);
      });
  }

  get porcentajeCompletado(): number {
    const lista = this.objetosActivos;
    if (lista.length === 0) {
      return 0;
    }

    const completados = lista.filter((objeto) => objeto.preparado).length;
    return Math.round((completados / lista.length) * 100);
  }

  porcentajePorPersona(persona: 'sonia' | 'irene'): number {
    const lista = this.objetos.filter(
      (objeto) => (objeto.persona || 'sonia') === persona
    );
    if (lista.length === 0) return 0;
    const completados = lista.filter((objeto) => objeto.preparado).length;
    return Math.round((completados / lista.length) * 100);
  }

  get totalPreparadosActivos(): number {
    return this.objetosActivos.filter((o) => o.preparado).length;
  }

}
