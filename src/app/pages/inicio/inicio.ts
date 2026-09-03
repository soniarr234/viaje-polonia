import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { supabase } from '../../core/supabase';

interface Gasto {
  id?: number;
  concepto: string;
  importe: number;
  moneda: 'EUR' | 'PLN';
  categoria: string;
  dia: string;
}

interface Transporte {
  tipo: string;
  origen: string;
  destino: string;
  fecha: string;
  horaSalida: string;
  horaLlegada: string;
  empresa?: string;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css'],
})
export class Inicio implements OnInit, OnDestroy {

  days = 0;
  hours = 0;
  minutes = 0;

  proximoVuelo: Transporte | null = null;
  listaGastos: Gasto[] = [];
  
  cambioPLN = 4.3;
  presupuestoFijo = 1200; // Puedes ajustarlo o leerlo dinámicamente

  private timer: any;

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    // Inicializamos el presupuesto base en el Storage por si otras vistas lo leen
    localStorage.setItem('presupuesto', this.presupuestoFijo.toString());
    
    // Ejecutamos las cargas iniciales en paralelo desde Supabase
    await Promise.all([
      this.cargarProximoVuelo(),
      this.cargarGastosDesdeSupabase()
    ]);
    
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  /* =========================
     CUENTA ATRÁS GENERAL
  ========================= */
  private startCountdown() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    const actualizar = () => {
      if (!this.proximoVuelo) {
        this.days = 0;
        this.hours = 0;
        this.minutes = 0;
        this.cdr.detectChanges();
        return;
      }
  
      // CORRECCIÓN CLAVE: Usamos un espacio en blanco en lugar de 'T' para forzar la hora local del PC
      const fechaVuelo = new Date(`${this.proximoVuelo.fecha} ${this.proximoVuelo.horaSalida}`);
      const ahora = new Date();
      const diferencia = fechaVuelo.getTime() - ahora.getTime();
  
      if (diferencia <= 0) {
        this.days = 0;
        this.hours = 0;
        this.minutes = 0;
        this.cdr.detectChanges();
        
        this.cargarProximoVuelo();
        return;
      }
  
      const msPorMinuto = 1000 * 60;
      const msPorHora = msPorMinuto * 60;
      const msPorDia = msPorHora * 24;

      // Desglose limpio sin arrastrar residuos horarios de UTC
      this.days = Math.floor(diferencia / msPorDia);
      this.hours = Math.floor((diferencia % msPorDia) / msPorHora);
      this.minutes = Math.floor((diferencia % msPorHora) / msPorMinuto);
      
      this.cdr.detectChanges();
    };
  
    actualizar();
    this.timer = setInterval(actualizar, 60000);
  }

  /* =========================
     CARGA DE VUELOS
  ========================= */
  async cargarProximoVuelo() {
    const { data, error } = await supabase
      .from('transporte')
      .select('*')
      .eq('tipo', 'vuelo');
  
    if (error) {
      console.error("Error al obtener vuelos de Supabase:", error);
      return;
    }
  
    const ahora = new Date();
  
    const vuelosMapeados: Transporte[] = (data || []).map((v: any) => ({
      tipo: v.tipo,
      origen: v.origen,
      destino: v.destino,
      fecha: v.fecha,
      horaSalida: v.horasalida || v.horaSalida || '00:00',
      horaLlegada: v.horallegada || v.horaLlegada || '00:00',
      empresa: v.empresa
    }));
  
    const vuelosFuturos = vuelosMapeados
    .filter((v) => {
      const fechaVuelo = new Date(`${v.fecha} ${v.horaSalida}`);
      return !isNaN(fechaVuelo.getTime()) && fechaVuelo > ahora;
    }).sort((a, b) => {
      const fechaA = new Date(`${a.fecha} ${a.horaSalida}`);
      const fechaB = new Date(`${b.fecha} ${b.horaSalida}`);
      return fechaA.getTime() - fechaB.getTime();
    });
  
    this.proximoVuelo = vuelosFuturos[0] || null;
    this.cdr.detectChanges();
  }

  /* =========================
     GESTIÓN DE PRESUPUESTO ONLINE
  ========================= */
  async cargarGastosDesdeSupabase() {
    const { data, error } = await supabase
      .from('gastos')
      .select('*');

    if (error) {
      console.error("Error al obtener gastos de Supabase:", error);
      return;
    }

    this.listaGastos = data || [];
    this.cdr.detectChanges();
  }

  get presupuesto(): number {
    return this.presupuestoFijo;
  }

  get totalGastado(): number {
    return this.listaGastos.reduce((total, gasto) => {
      if (gasto.moneda === 'PLN') {
        return total + (gasto.importe / this.cambioPLN);
      }
      return total + gasto.importe;
    }, 0);
  }

  get dineroRestante(): number {
    return Math.max(this.presupuesto - this.totalGastado, 0);
  }

  get porcentajeGastado(): number {
    if (!this.presupuesto) {
      return 0;
    }
    return Math.min(
      Math.round((this.totalGastado / this.presupuesto) * 100),
      100
    );
  }

  get colorProgreso(): string {
    // Cambia de color según el porcentaje que lleves gastado
    if (this.porcentajeGastado < 50) {
      return 'linear-gradient(90deg, #38bdf8, #60a5fa)'; // Azul (Tranquilo)
    }
    if (this.porcentajeGastado < 80) {
      return 'linear-gradient(90deg, #f59e0b, #fbbf24)'; // Naranja (Advertencia)
    }
    return 'linear-gradient(90deg, #ef4444, #f87171)'; // Rojo (Peligro / Crítico)
  }

}
