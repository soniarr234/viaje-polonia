import { Component, OnInit, ChangeDetectorRef, HostListener, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { supabase } from '../../../../core/supabase';
import { Hotel } from '../../models/hotel.model';

@Component({
  selector: 'app-hoteles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hoteles.component.html',
  styleUrl: '../../ruta.css'
})
export class HotelesComponent implements OnInit {

  hoteles: Hotel[] = [];
  mostrarFormularioHotel = false;
  editandoHotel = false;
  indiceHotelEditando = -1;
  guardandoHotel = false;

  nuevoHotel: Hotel = {
    nombre: '',
    ciudad: '',
    checkIn: '',
    checkOut: '',
    precio: undefined,
    pagado: false,
    direccion: '',
    notas: ''
  };

  mostrarConfirmarBorradoHotel = false;
  hotelParaBorrar: Hotel | null = null;

  mostrarToast = false;
  mensajeToast = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef,
    private ngZone: NgZone
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarHoteles();
  }

  @HostListener('document:click', ['$event'])
  alHacerClicFuera(event: Event) {
    if (!this.mostrarFormularioHotel || this.guardandoHotel) return;

    const targetElement = event.target as HTMLElement;
    const clicDentroDelComponente = this.elementRef.nativeElement.contains(targetElement);
    const clicDentroDelFormulario = targetElement.closest('.form-grid');
    const clicEnBotonAbrirOEditar = targetElement.closest('.btn-add') || targetElement.closest('.btn-editar');

    if (clicDentroDelComponente && !clicDentroDelFormulario && !clicEnBotonAbrirOEditar) {
      this.cancelarFormularioHotel();
      this.cdr.detectChanges();
    }
  }

  async cargarHoteles() {
    const { data, error } = await supabase
      .from('hoteles')
      .select('*')
      .order('checkin');

    if (error) {
      return;
    }

    this.hoteles = (data || []).map((h: any) => ({
      id: h.id,
      nombre: h.nombre,
      ciudad: h.ciudad,
      checkIn: h.checkin,
      checkOut: h.checkout,
      precio: h.precio,
      pagado: h.pagado,
      direccion: h.direccion,
      notas: h.notas
    }));

    this.cdr.detectChanges();
  }

  get hotelesOrdenados(): Hotel[] {
    return this.hoteles;
  }

  abrirFormularioHotel() {
    this.reiniciarHotel();
    this.mostrarFormularioHotel = true;
  }

  cancelarFormularioHotel(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.reiniciarHotel();
    this.mostrarFormularioHotel = false;
  }

  async agregarHotel(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Comprobación de datos obligatorios
    if (!this.nuevoHotel.nombre?.trim()) {
      return;
    }

    if (this.guardandoHotel) {
      return;
    }
    
    this.guardandoHotel = true;
    this.cdr.detectChanges(); 

    const esPrecioValido =
      this.nuevoHotel.precio !== undefined &&
      this.nuevoHotel.precio !== null &&
      !isNaN(Number(this.nuevoHotel.precio));

    const payload = {
      nombre: this.nuevoHotel.nombre.trim(),
      ciudad: this.nuevoHotel.ciudad.trim(),
      checkin: this.nuevoHotel.checkIn || null,
      checkout: this.nuevoHotel.checkOut || null,
      precio: esPrecioValido ? Number(this.nuevoHotel.precio) : null,
      pagado: !!this.nuevoHotel.pagado,
      direccion: this.nuevoHotel.direccion?.trim() || null,
      notas: this.nuevoHotel.notas?.trim() || null
    };

    try {
      let errorBase = null;

      if (this.editandoHotel) {
        if (this.indiceHotelEditando < 0) {
          this.guardandoHotel = false;
          return;
        }
        const { error } = await supabase
          .from('hoteles')
          .update(payload)
          .eq('id', this.indiceHotelEditando);
        errorBase = error;

        this.mensajeToast = `¡Hotel "${payload.nombre}" actualizado con éxito!`;
      } else {
        const { error } = await supabase
          .from('hoteles')
          .insert(payload);
        errorBase = error;

        this.mensajeToast = `¡Hotel "${payload.nombre}" guardado con éxito!`;
      }

      if (errorBase) {
        this.guardandoHotel = false;
        this.cdr.detectChanges();
        return;
      }

      await this.ngZone.run(async () => {
        await this.cargarHoteles();
        this.reiniciarHotel();
        this.mostrarFormularioHotel = false;
        this.lanzarToast();
      });

    } catch (e) {
    } finally {
      this.guardandoHotel = false;
      this.cdr.detectChanges();
    }
  }

  lanzarToast() {
    this.mostrarToast = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.ngZone.run(() => {
        this.mostrarToast = false;
        this.cdr.detectChanges();
      });
    }, 4000);
  }

  editarHotel(hotel: Hotel, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (hotel.id == null) return;

    this.editandoHotel = true;
    this.indiceHotelEditando = hotel.id;
    
    this.nuevoHotel = { 
      ...hotel,
      notas: hotel.notas
    };
    
    this.mostrarFormularioHotel = true;
    this.cdr.detectChanges();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  pedirConfirmacionBorradoHotel(hotel: Hotel, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    this.hotelParaBorrar = hotel;
    this.mostrarConfirmarBorradoHotel = true;
    this.cdr.detectChanges();
  }

  cerrarConfirmarBorradoHotel() {
    this.mostrarConfirmarBorradoHotel = false;
    this.hotelParaBorrar = null;
    this.cdr.detectChanges();
  }

  async confirmarEliminarHotel() {
    if (!this.hotelParaBorrar || !this.hotelParaBorrar.id) {
      this.cerrarConfirmarBorradoHotel();
      return;
    }

    const idBorrar = this.hotelParaBorrar.id;
    const nombreBorrado = this.hotelParaBorrar.nombre;
    this.cerrarConfirmarBorradoHotel();

    const { error } = await supabase
      .from('hoteles')
      .delete()
      .eq('id', idBorrar);

    if (error) {
      console.error('Error del servidor al eliminar hotel:', error);
      return;
    }

    this.mensajeToast = `¡Reserva de "${nombreBorrado}" eliminada correctamente!`;
    
    await this.ngZone.run(async () => {
      this.lanzarToast();
      await this.cargarHoteles();
    });
  }

  reiniciarHotel() {
    this.editandoHotel = false;
    this.indiceHotelEditando = -1;
    this.nuevoHotel = {
      nombre: '',
      ciudad: '',
      checkIn: '',
      checkOut: '',
      precio: undefined,
      pagado: false,
      direccion: '',
      notas: ''
    };
  }
}
