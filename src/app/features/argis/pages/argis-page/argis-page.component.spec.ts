import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { ArgisPageComponent } from './argis-page.component';

describe('ArgisPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArgisPageComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('deberia crear el componente', () => {
    const fixture = TestBed.createComponent(ArgisPageComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('deberia tener el titulo Argis', () => {
    const fixture = TestBed.createComponent(ArgisPageComponent);
    const component = fixture.componentInstance;
    expect(component.title()).toBe('Argis');
  });

  it('deberia iniciar sin error', () => {
    const fixture = TestBed.createComponent(ArgisPageComponent);
    const component = fixture.componentInstance;
    expect(component.error()).toBe('');
  });

  it('no deberia cambiar estado si no hay fichero', async () => {
    const fixture = TestBed.createComponent(ArgisPageComponent);
    const component = fixture.componentInstance;
    const input = { files: [] } as unknown as HTMLInputElement;

    await component.onFileSelected({ target: input } as unknown as Event);

    expect(component.isLoading()).toBe(false);
    expect(component.error()).toBe('');
  });

  it('deberia procesar un fichero valido y actualizar estado', async () => {
    const fixture = TestBed.createComponent(ArgisPageComponent);
    const component = fixture.componentInstance;
    const fakeFile = {
      name: 'municipios.zip',
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(16))
    };
    const input = {
      files: [fakeFile],
      value: 'x'
    } as unknown as HTMLInputElement;

    const featureCollection = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: null }]
    };

    vi.spyOn(component as any, 'parseShapefile').mockResolvedValue(featureCollection);
    vi.spyOn(component as any, 'renderGeoJson').mockResolvedValue();

    await component.onFileSelected({ target: input } as unknown as Event);

    expect((component as any).parseShapefile).toHaveBeenCalled();
    expect((component as any).renderGeoJson).toHaveBeenCalledWith(featureCollection);
    expect(component.error()).toBe('');
    expect(component.status()).toContain('Capa cargada correctamente');
    expect(component.isLoading()).toBe(false);
    expect(input.value).toBe('');
  });

  it('deberia marcar error cuando falle la carga', async () => {
    const fixture = TestBed.createComponent(ArgisPageComponent);
    const component = fixture.componentInstance;
    const fakeFile = {
      name: 'fallo.zip',
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    };
    const input = {
      files: [fakeFile],
      value: 'x'
    } as unknown as HTMLInputElement;

    vi.spyOn(component as any, 'parseShapefile').mockRejectedValue(new Error('fallo'));

    await component.onFileSelected({ target: input } as unknown as Event);

    expect(component.error()).toContain('No se pudo leer el shapefile');
    expect(component.status()).toBe('Error en la carga del fichero.');
    expect(component.isLoading()).toBe(false);
    expect(input.value).toBe('');
  });
});
