import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
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

  categorias = [
    {
      nombre: 'imprescindibles',
      titulo: 'Imprescindibles',
    },
    {
      nombre: 'ropa',
      titulo: 'Ropa',
    },
    {
      nombre: 'aseo personal',
      titulo: 'Aseo personal',
    },
    {
      nombre: 'botiquin',
      titulo: 'Botiquín',
    },
    {
      nombre: 'otros',
      titulo: 'Otros',
    },
  ];

  nuevoObjeto: ItemMaleta = {
    nombre: '',
    cantidad: 1,
    categoria: 'ropa',
    preparado: false,
  };

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

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
  
    setTimeout(() => {
      this.cdr.detectChanges();
    });
  }

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  async guardarObjeto() {
    if (!this.nuevoObjeto.nombre.trim()) {
      return;
    }

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

    await this.cargarObjetos();

    this.nuevoObjeto = {
      nombre: '',
      cantidad: 1,
      categoria: 'ropa',
      preparado: false,
    };

    this.cerrarModal();
  }

  async eliminarObjeto(objeto: ItemMaleta) {
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

  editarObjeto(objeto: ItemMaleta) {
    this.nuevoObjeto = {
      ...objeto,
    };

    this.eliminarObjeto(objeto);

    this.mostrarModal = true;
  }

  async toggleObjeto(objeto: ItemMaleta) {
    if (!objeto.id) {
      return;
    }

    const { error } = await supabase
      .from('maleta')
      .update({
        preparado: !objeto.preparado,
      })
      .eq('id', objeto.id);

    if (error) {
      console.error('Error actualizando objeto:', error);
      return;
    }

    await this.cargarObjetos();
  }

  obtenerObjetosPorCategoria(categoria: string) {
    return this.objetos
      .filter(
        (objeto) =>
          objeto.categoria
            .trim()
            .toLowerCase() ===
          categoria
            .trim()
            .toLowerCase()
      )
      .sort((a, b) => {
        if (a.preparado !== b.preparado) {
          return (
            Number(a.preparado) -
            Number(b.preparado)
          );
        }
  
        return a.nombre.localeCompare(b.nombre);
      });
  }

  get porcentajeCompletado(): number {
    if (this.objetos.length === 0) {
      return 0;
    }

    const completados =
      this.objetos.filter(
        (objeto) => objeto.preparado
      ).length;

    return Math.round(
      (completados /
        this.objetos.length) *
        100
    );
  }
}