import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  OnInit,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { supabase } from '../../core/supabase';

interface Gasto {
  id?: number;
  concepto: string;
  importe: number;
  moneda: 'EUR' | 'PLN';
  categoria: 'comida' | 'ocio' | 'transporte' | 'otros';
  dia: string;
}

@Component({
  selector: 'app-gastos',
  imports: [CommonModule, FormsModule],
  templateUrl: './gastos.html',
  styleUrl: './gastos.css',
})
export class Gastos implements OnInit {
  cambioPLN = 4.3;
  presupuesto = 1200;
  gastos: Gasto[] = [];
  editando = false;
  indiceEditando = -1;
  dias = ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5', 'Día 6', 'Día 7'];

  nuevoGasto: Gasto = {
    concepto: '',
    importe: 0,
    moneda: 'EUR',
    categoria: 'comida',
    dia: 'Día 1',
  };

  cantidadOrigen = 100;
  monedaOrigen: 'EUR' | 'PLN' = 'EUR';
  rotando = false;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  // 1. LIMPIAMOS EL nGOnInit: Solo llama a la API
  async ngOnInit() {

    localStorage.setItem(
      'presupuesto',
      this.presupuesto.toString()
    );
  
    this.obtenerCambio();
  
    await this.cargarGastos();
  }
  
  async cargarGastos() {

    const { data, error } = await supabase
      .from('gastos')
      .select('*');
  
    if (error) {
      console.error(error);
      return;
    }
  
    this.gastos = [...(data || [])];
  
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  cerrarSiClickFuera(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.cerrarDropdowns();
    }
  }

  cerrarDropdowns() {
    document.querySelectorAll('details.dropdown').forEach((dropdown) => {
      (dropdown as HTMLDetailsElement).removeAttribute('open');
    });
  }

  toggleDropdown(event: Event) {
    const actual = event.currentTarget as HTMLDetailsElement;
    document.querySelectorAll('details.dropdown').forEach((dropdown) => {
      if (dropdown !== actual) {
        (dropdown as HTMLDetailsElement).removeAttribute('open');
      }
    });
  }

  // 2. LA API SE ENCARGA DE CONTROLAR EL FLUJO
  obtenerCambio() {
    this.http.get<any>('https://open.er-api.com/v6/latest/EUR').subscribe({
      next: (data) => {
        this.cambioPLN = data.rates.PLN;

        // Cargamos los datos solo cuando ya sobreescribimos el 4.3 con el valor real
        this.cargarGastos();
      },
      error: (error) => {
        console.error('Error de API, usando respaldo fijo de 4.3', error);

        // Si no hay internet, cargamos los gastos usando el 4.3 por defecto
        this.cargarGastos();
      },
    });
  }


  get cantidadDestino(): number {
    if (!this.cambioPLN) {
      return 0;
    }
  
    return Number(
      (
        this.monedaOrigen === 'EUR'
          ? this.cantidadOrigen * this.cambioPLN
          : this.cantidadOrigen / this.cambioPLN
      ).toFixed(2)
    );
  }
  

  cambiarMoneda() {
    if (!this.cambioPLN) {
      return;
    }
    this.rotando = false;
    this.rotando = true;
    this.cantidadOrigen = this.cantidadDestino;
    this.monedaOrigen = this.monedaOrigen === 'EUR' ? 'PLN' : 'EUR';
  }

  async agregarGasto() {

    if (
      !this.nuevoGasto.concepto.trim() ||
      this.nuevoGasto.importe <= 0
    ) {
      return;
    }
  
    if (this.editando) {
  
      const { error } = await supabase
        .from('gastos')
        .update({
          concepto: this.nuevoGasto.concepto,
          importe: Number(this.nuevoGasto.importe.toFixed(2)),
          moneda: this.nuevoGasto.moneda,
          categoria: this.nuevoGasto.categoria,
          dia: this.nuevoGasto.dia,
        })
        .eq('id', this.indiceEditando);
  
      if (error) {
        console.error(error);
        return;
      }
  
    } else {
  
      const { error } = await supabase
        .from('gastos')
        .insert({
          concepto: this.nuevoGasto.concepto,
          importe: Number(this.nuevoGasto.importe.toFixed(2)),
          moneda: this.nuevoGasto.moneda,
          categoria: this.nuevoGasto.categoria,
          dia: this.nuevoGasto.dia,
        });
  
      if (error) {
        console.error(error);
        return;
      }
    }
  
    await this.cargarGastos();
  
    localStorage.setItem(
      'presupuesto',
      this.presupuesto.toString()
    );
  
    this.editando = false;
    this.indiceEditando = -1;
  
    this.nuevoGasto = {
      concepto: '',
      importe: 0,
      moneda: 'EUR',
      categoria: 'comida',
      dia: 'Día 1',
    };
  
    this.cerrarDropdowns();
  }

  editarGasto(gasto: Gasto) {

    this.editando = true;
  
    this.indiceEditando =
      gasto.id || -1;
  
    this.nuevoGasto = {
      ...gasto,
    };
  
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  cancelarEdicion() {
    this.editando = false;
    this.indiceEditando = -1;
    this.nuevoGasto = {
      concepto: '',
      importe: 0,
      moneda: 'EUR',
      categoria: 'comida',
      dia: 'Día 1',
    };
  }

  async eliminarGasto(gasto: Gasto) {

    if (!gasto.id) {
      return;
    }
  
    const { error } = await supabase
      .from('gastos')
      .delete()
      .eq('id', gasto.id);
  
    if (error) {
      console.error(error);
      return;
    }
  
    await this.cargarGastos();
  }

  get totalGastado(): number {
    return this.gastos.reduce(
      (total, gasto) => total + this.convertirAEuros(gasto),
      0
    );
  }

  convertirAEuros(gasto: Gasto): number {
    if (gasto.moneda === 'EUR') {
      return gasto.importe;
    }
    if (!this.cambioPLN || this.cambioPLN <= 0) {
      return gasto.importe / 4.3; // Fallback de seguridad directo aquí
    }
    return gasto.importe / this.cambioPLN;
  }

  get disponible(): number {
    return this.presupuesto - this.totalGastado;
  }

  get porcentajeGastado(): number {
    return Math.min(
      Math.round((this.totalGastado / this.presupuesto) * 100),
      100
    );
  }

  get colorDisponible(): string {
    const porcentajeDisponible = (this.disponible / this.presupuesto) * 100;
    if (porcentajeDisponible > 50) return '#7dd3fc';
    if (porcentajeDisponible > 30) return '#f59e0b';
    return '#ef4444';
  }

  get colorProgreso(): string {
    if (this.porcentajeGastado < 50)
      return 'linear-gradient(90deg, #38bdf8, #60a5fa)';
    if (this.porcentajeGastado < 70)
      return 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    return 'linear-gradient(90deg, #ef4444, #f87171)';
  }

  get totalComida(): number {
    return this.totalCategoria('comida');
  }
  get totalOcio(): number {
    return this.totalCategoria('ocio');
  }
  get totalTransporte(): number {
    return this.totalCategoria('transporte');
  }
  get totalOtros(): number {
    return this.totalCategoria('otros');
  }

  private totalCategoria(categoria: Gasto['categoria']): number {
    return this.gastos
      .filter((g) => g.categoria === categoria)
      .reduce((total, gasto) => total + this.convertirAEuros(gasto), 0);
  }

  get porcentajeComida(): number {
    return this.obtenerPorcentaje(this.totalComida);
  }
  get porcentajeOcio(): number {
    return this.obtenerPorcentaje(this.totalOcio);
  }
  get porcentajeTransporte(): number {
    return this.obtenerPorcentaje(this.totalTransporte);
  }
  get porcentajeOtros(): number {
    return this.obtenerPorcentaje(this.totalOtros);
  }

  private obtenerPorcentaje(valor: number): number {
    if (this.totalGastado === 0) return 0;
    return (valor / this.totalGastado) * 100;
  }

  gastosPorDia(dia: string): Gasto[] {
    return this.gastos.filter((gasto) => gasto.dia === dia);
  }

  totalDia(dia: string): number {
    return this.gastos
      .filter((gasto) => gasto.dia === dia)
      .reduce((total, gasto) => total + this.convertirAEuros(gasto), 0);
  }
}
