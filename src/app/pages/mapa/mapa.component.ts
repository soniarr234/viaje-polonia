import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.html',
  styleUrl: './mapa.css',
})
export class Mapa {
  mapaUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.mapaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.google.com/maps/d/u/0/embed?mid=133_DZMUQInXpMVs6ErvqQsp6S4PPC_s&ehbc=2E312F'
    );
  }
}
