import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ruta } from './ruta';

describe('Ruta', () => {
  let component: Ruta;
  let fixture: ComponentFixture<Ruta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ruta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ruta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
