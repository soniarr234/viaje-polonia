import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Maleta } from './maleta';

describe('Maleta', () => {
  let component: Maleta;
  let fixture: ComponentFixture<Maleta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Maleta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Maleta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
