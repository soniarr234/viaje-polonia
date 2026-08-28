import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.css']
})
export class Inicio implements OnInit, OnDestroy {
  // Asegúrate de declarar estas 3 propiedades aquí abajo 👇
  days: number = 101;
  hours: number = 21;
  minutes: number = 59;
  private timer: any;

  ngOnInit() {
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private startCountdown() {
    this.timer = setInterval(() => {
      if (this.minutes > 0) {
        this.minutes--;
      } else {
        this.minutes = 59;
        if (this.hours > 0) {
          this.hours--;
        } else {
          this.hours = 23;
          if (this.days > 0) {
            this.days--;
          }
        }
      }
    }, 60000);
  }
}
