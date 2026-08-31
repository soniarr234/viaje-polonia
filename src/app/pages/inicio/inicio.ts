import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  private timer: any;

  ngOnInit() {
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  /* =========================
     CUENTA ATRÁS
  ========================= */

  private startCountdown() {

    const actualizar = () => {

      this.proximoVuelo =
        this.obtenerProximoVuelo();

      if (!this.proximoVuelo) {
        this.days = 0;
        this.hours = 0;
        this.minutes = 0;
        return;
      }

      const fechaVuelo = new Date(
        `${this.proximoVuelo.fecha}T${this.proximoVuelo.horaSalida}`
      );

      const ahora = new Date();

      const diferencia =
        fechaVuelo.getTime() -
        ahora.getTime();

      if (diferencia <= 0) {
        this.days = 0;
        this.hours = 0;
        this.minutes = 0;
        return;
      }

      this.days = Math.floor(
        diferencia / (1000 * 60 * 60 * 24)
      );

      this.hours = Math.floor(
        (
          diferencia %
          (1000 * 60 * 60 * 24)
        ) /
        (1000 * 60 * 60)
      );

      this.minutes = Math.floor(
        (
          diferencia %
          (1000 * 60 * 60)
        ) /
        (1000 * 60)
      );
    };

    actualizar();

    this.timer = setInterval(
      actualizar,
      60000
    );
  }

  private obtenerProximoVuelo(): Transporte | null {

    const guardados =
      localStorage.getItem('transportes');

    if (!guardados) {
      return null;
    }

    const transportes: Transporte[] =
      JSON.parse(guardados);

    const ahora = new Date();

    const vuelosFuturos = transportes
      .filter((t) => t.tipo === 'vuelo')
      .filter((t) => {

        const fechaVuelo = new Date(
          `${t.fecha}T${t.horaSalida}`
        );

        return fechaVuelo > ahora;
      })
      .sort((a, b) => {

        const fechaA = new Date(
          `${a.fecha}T${a.horaSalida}`
        );

        const fechaB = new Date(
          `${b.fecha}T${b.horaSalida}`
        );

        return (
          fechaA.getTime() -
          fechaB.getTime()
        );
      });

    return vuelosFuturos[0] || null;
  }

  /* =========================
     PRESUPUESTO
  ========================= */

  get presupuesto(): number {

    return Number(
      localStorage.getItem('presupuesto') || 0
    );
  }

  get gastos(): any[] {

    return JSON.parse(
      localStorage.getItem('gastos') || '[]'
    );
  }

  get totalGastado(): number {

    return this.gastos.reduce(
      (total, gasto) => {

        if (gasto.moneda === 'PLN') {
          return total + gasto.importe / 4.3;
        }

        return total + gasto.importe;

      },
      0
    );
  }

  get dineroRestante(): number {

    return Math.max(
      this.presupuesto - this.totalGastado,
      0
    );
  }

  get porcentajeGastado(): number {

    if (!this.presupuesto) {
      return 0;
    }

    return Math.min(
      Math.round(
        (this.totalGastado / this.presupuesto) *
        100
      ),
      100
    );
  }
}