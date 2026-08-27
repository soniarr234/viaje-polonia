import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, RouterOutlet } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { Navbar } from './app/components/navbar/navbar.component';
import { routes } from './app/app.routes';

@Component({
  selector: 'app-root',
  imports: [Navbar, RouterOutlet],
  template: `
    <router-outlet></router-outlet>
    <app-navbar></app-navbar>
  `,
})
export class App {}

bootstrapApplication(App, {
  providers: [
    provideRouter(routes),
    provideHttpClient(), // ← añadir esto
  ],
});
