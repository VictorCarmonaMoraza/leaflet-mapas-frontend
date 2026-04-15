import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemePickerComponent } from '../../../../components/theme-picker/theme-picker.component';
import { LanguagePickerComponent } from '../../../../components/language-picker/language-picker.component';
import { LanguageService } from '../../../../services/language.service';

@Component({
  selector: 'app-argis-3d-page',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ThemePickerComponent, LanguagePickerComponent],
  templateUrl: './argis-3d-page.component.html',
  styleUrl: './argis-3d-page.component.scss'
})
export class Argis3dPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('argis3dMap') argis3dMap!: ElementRef<HTMLDivElement>;
  readonly language = inject(LanguageService);
  readonly title = signal('Argis 3D');
  readonly status = signal('Inicializando vista 3D...');

  private map: any;

  async ngAfterViewInit(): Promise<void> {
    try {
      const module = await import('maplibre-gl');
      const maplibre = (module as any).default ?? module;

      this.map = new maplibre.Map({
        container: this.argis3dMap.nativeElement,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [-3.7038, 40.4168],
        zoom: 5.6,
        pitch: 60,
        bearing: -20,
        antialias: true
      });

      this.map.addControl(new maplibre.NavigationControl({ visualizePitch: true }), 'top-right');
      this.map.addControl(new maplibre.ScaleControl({ unit: 'metric' }), 'bottom-right');

      this.map.on('load', () => {
        try {
          if (!this.map.getSource('terrainSource')) {
            this.map.addSource('terrainSource', {
              type: 'raster-dem',
              url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
              tileSize: 256,
              maxzoom: 14
            });
          }
          this.map.setTerrain({ source: 'terrainSource', exaggeration: 1.35 });
        } catch {
          // Terrain might not be available in some style/runtime combinations.
        }

        this.status.set('Vista 3D activa. Arrastra para orbitar y usa Shift + arrastrar para inclinar.');
      });
    } catch {
      this.status.set('No se pudo iniciar el mapa 3D. Verifica la conexion y vuelve a intentar.');
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
