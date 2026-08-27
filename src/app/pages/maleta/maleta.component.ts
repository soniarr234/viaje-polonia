import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ItemMaleta {
  nombre: string;
  cantidad: number;
  categoria: string;
  preparado: boolean;
}

@Component({
  selector: 'app-maleta',
  imports: [CommonModule, FormsModule],
  templateUrl: './maleta.html',
  styleUrl: './maleta.css',
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

  ngOnInit() {
    const datos = localStorage.getItem('maletaPolonia');

    if (datos) {
      this.objetos = JSON.parse(datos);
    }
  }

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardarObjeto() {
    if (!this.nuevoObjeto.nombre.trim()) {
      return;
    }

    this.objetos.push({
      ...this.nuevoObjeto,
    });

    this.guardarLocalStorage();

    this.nuevoObjeto = {
      nombre: '',
      cantidad: 1,
      categoria: 'ropa',
      preparado: false,
    };

    this.cerrarModal();
  }

  eliminarObjeto(objeto: ItemMaleta) {
    this.objetos = this.objetos.filter((item) => item !== objeto);

    this.guardarLocalStorage();
  }

  editarObjeto(objeto: ItemMaleta) {
    this.nuevoObjeto = { ...objeto };

    this.eliminarObjeto(objeto);

    this.mostrarModal = true;
  }

  toggleObjeto(objeto: ItemMaleta) {
    objeto.preparado = !objeto.preparado;

    this.guardarLocalStorage();
  }

  obtenerObjetosPorCategoria(categoria: string) {
    return this.objetos
      .filter((objeto) => objeto.categoria === categoria)
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

    const completados = this.objetos.filter(
      (objeto) => objeto.preparado
    ).length;

    return Math.round((completados / this.objetos.length) * 100);
  }

  guardarLocalStorage() {
    localStorage.setItem('maletaPolonia', JSON.stringify(this.objetos));
  }
}
