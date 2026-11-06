import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importación de los tres nuevos subcomponentes independientes
import { TransportesComponent } from './components/transportes/transportes.component';
import { HotelesComponent } from './components/hoteles/hoteles.component';
import { CiudadesRutaComponent } from './components/ciudades-ruta/ciudades.component'; // <-- ¡CAMBIADO A ciudades.component!

/* ==========================================================================
   COMPONENTE MAESTRO: RUTA
   ========================================================================== */
@Component({
  selector: 'app-ruta',
  standalone: true,
  imports: [
    CommonModule,
    TransportesComponent,
    HotelesComponent,
    CiudadesRutaComponent
  ],
  templateUrl: './ruta.html',
  styleUrl: './ruta.css'
})
export class Ruta implements OnInit {

  // Definición del tipo de vistas y lectura del estado persistido en el almacenamiento local
  vista: 'transportes' | 'hoteles' | 'ciudades' = 'transportes';

  ngOnInit(): void {
    const vistaGuardada = localStorage.getItem('ruta-vista');
    if (vistaGuardada === 'transportes' || vistaGuardada === 'hoteles' || vistaGuardada === 'ciudades') {
      this.vista = vistaGuardada;
    }
  }

  /**
   * Cambia la pestaña activa superior y guarda la selección en el localStorage
   * @param nuevaVista Sección destino seleccionada por el usuario
   */
  cambiarVista(nuevaVista: 'transportes' | 'hoteles' | 'ciudades'): void {
    this.vista = nuevaVista;
    localStorage.setItem('ruta-vista', nuevaVista);
  }
}
