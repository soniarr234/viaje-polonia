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
}

@Component({
  selector: 'app-maleta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maleta.html',
  styleUrls: ['./maleta.css'],
})
export class Maleta implements OnInit {
  objetos: ItemMaleta[] = [];
  mostrarModal = false;

  // Propiedades para controlar el Pop-up de confirmación de borrado
  mostrarConfirmarBorrado = false;
  objetoParaBorrar: ItemMaleta | null = null;

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
  };

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.cargarObjetos();
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
    this.mostrarModal = true;
    this.cdr.detectChanges(); 
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.cdr.detectChanges(); 
  }

  async guardarObjeto() {
    if (!this.nuevoObjeto.nombre.trim()) {
      return;
    }
  
    if (this.nuevoObjeto.id) {
      // MODO EDICIÓN: Actualiza el elemento existente usando su id
      const { error } = await supabase
        .from('maleta')
        .update({
          nombre: this.nuevoObjeto.nombre,
          cantidad: this.nuevoObjeto.cantidad,
          categoria: this.nuevoObjeto.categoria,
        })
        .eq('id', this.nuevoObjeto.id);
  
      if (error) {
        console.error('Error actualizando objeto:', error);
        return;
      }
    } else {
      // MODO CREACIÓN: Inserta un registro completamente nuevo
      const { error } = await supabase
        .from('maleta')
        .insert({
          nombre: this.nuevoObjeto.nombre,
          cantidad: this.nuevoObjeto.cantidad,
          categoria: this.nuevoObjeto.categoria,
          preparado: false,
        });
  
      if (error) {
        console.error('Error guardando objeto:', error);
        return;
      }
    }
  
    // Refresca la lista de la maleta
    await this.cargarObjetos();
  
    // Limpia el formulario para que vuelva a su estado original vacío
    this.nuevoObjeto = {
      nombre: '',
      cantidad: 1,
      categoria: 'ropa',
      preparado: false,
    };
  
    this.cerrarModal();
  }

  // Intercepta el clic de la papelera para abrir tu pop-up personalizado
  pedirConfirmacionBorrado(objeto: ItemMaleta) {
    this.objetoParaBorrar = objeto;
    this.mostrarConfirmarBorrado = true;
    this.cdr.detectChanges();
  }

  // Se ejecuta al confirmar definitivamente el borrado dentro del pop-up
  async confirmarEliminarObjeto() {
    if (!this.objetoParaBorrar || !this.objetoParaBorrar.id) {
      this.cerrarConfirmarBorrado();
      return;
    }

    const idBorrar = this.objetoParaBorrar.id;
    this.cerrarConfirmarBorrado(); // Cierra visualmente el pop-up de inmediato

    const { error } = await supabase
      .from('maleta')
      .delete()
      .eq('id', idBorrar);

    if (error) {
      console.error('Error eliminando objeto:', error);
      return;
    }

    await this.cargarObjetos();
  }

  cerrarConfirmarBorrado() {
    this.mostrarConfirmarBorrado = false;
    this.objetoParaBorrar = null;
    this.cdr.detectChanges();
  }

  // Método interno directo que usa Supabase (mantenido para la edición limpia)
  async eliminarObjetoDirecto(objeto: ItemMaleta) {
    if (!objeto.id) {
      return;
    }

    const { error } = await supabase
      .from('maleta')
      .delete()
      .eq('id', objeto.id);

    if (error) {
      console.error('Error eliminando objeto:', error);
      return;
    }

    await this.cargarObjetos();
  }

  async editarObjeto(objeto: ItemMaleta) {
    this.nuevoObjeto = {
      ...objeto,
    };

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
    return this.objetos
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
    if (this.objetos.length === 0) {
      return 0;
    }

    const completados = this.objetos.filter((objeto) => objeto.preparado).length;
    return Math.round((completados / this.objetos.length) * 100);
  }
}
