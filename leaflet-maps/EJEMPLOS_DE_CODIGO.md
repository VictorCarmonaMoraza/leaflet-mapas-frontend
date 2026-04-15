/**
 * EJEMPLOS DE USO - Mapas Interactivos con Angular + Leaflet + Tailwind CSS
 * 
 * Este archivo contiene ejemplos prácticos para usar el proyecto
 */

// ============================================================================
// EJEMPLO 1: Componente básico con el mapa
// ============================================================================

import { Component, ViewChild } from '@angular/core';
import { MapViewerComponent } from './components/map-viewer';

@Component({
  selector: 'app-simple-map',
  template: `
    <div class="w-full h-screen">
      <app-map-viewer #mapComponent></app-map-viewer>
    </div>
  `
})
export class SimpleMapComponent {
  @ViewChild('mapComponent') mapComponent?: MapViewerComponent;

  agregarMarcador() {
    this.mapComponent?.addMarker(40.4168, -3.7038, 'Mi ubicación');
  }
}

// ============================================================================
// EJEMPLO 2: Usar el servicio de mapas directamente
// ============================================================================

import { MapService } from './services/map.service';

@Component({
  selector: 'app-service-map',
  template: `
    <div class="flex flex-col h-screen">
      <div class="flex gap-2 p-4 bg-blue-500">
        <button (click)="agregarPuntos()" class="px-4 py-2 bg-white rounded">
          Agregar Puntos
        </button>
        <button (click)="centrarMapa()" class="px-4 py-2 bg-white rounded">
          Centrar
        </button>
      </div>
      <div id="my-map" class="flex-1"></div>
    </div>
  `
})
export class ServiceMapComponent {
  constructor(private mapService: MapService) {}

  ngOnInit() {
    this.mapService.initializeMap('my-map');
  }

  agregarPuntos() {
    const ciudades = [
      { lat: 40.4168, lng: -3.7038, label: 'Madrid' },
      { lat: 41.3851, lng: 2.1734, label: 'Barcelona' },
      { lat: 39.4699, lng: -0.3763, label: 'Valencia' }
    ];

    ciudades.forEach((ciudad, i) => {
      this.mapService.addMarker(`ciudad${i}`, ciudad.lat, ciudad.lng, ciudad.label);
    });

    this.mapService.fitBounds();
  }

  centrarMapa() {
    this.mapService.setCenter(40.0, -3.0);
  }
}

// ============================================================================
// EJEMPLO 3: Agregar eventos de click
// ============================================================================

@Component({
  selector: 'app-click-map'
})
export class ClickMapComponent {
  constructor(private mapService: MapService) {}

  ngOnInit() {
    this.mapService.initializeMap('map-click');

    // Capturar clicks en el mapa
    this.mapService.onMapClick((lat, lng) => {
      const id = `marker_${Date.now()}`;
      this.mapService.addMarker(id, lat, lng, 
        `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
      
      console.log('Marcador agregado:', id);
    });
  }
}

// ============================================================================
// EJEMPLO 4: Usar con formularios y datos dinámicos
// ============================================================================

@Component({
  selector: 'app-dynamic-map',
  template: `
    <div class="flex gap-4">
      <input [(ngModel)]="latitude" placeholder="Latitud" />
      <input [(ngModel)]="longitude" placeholder="Longitud" />
      <input [(ngModel)]="markerLabel" placeholder="Etiqueta" />
      <button (click)="agregarMarcador()" class="px-4 py-2 bg-blue-500 text-white rounded">
        Agregar
      </button>
      <button (click)="limpiar()" class="px-4 py-2 bg-red-500 text-white rounded">
        Limpiar
      </button>
    </div>
    <div id="dynamic-map" class="w-full h-96 mt-4"></div>
  `,
  standalone: true
})
export class DynamicMapComponent {
  latitude = 40.4168;
  longitude = -3.7038;
  markerLabel = 'Mi Punto';

  constructor(private mapService: MapService) {}

  ngOnInit() {
    this.mapService.initializeMap('dynamic-map', this.latitude, this.longitude);
  }

  agregarMarcador() {
    const id = `marker_${Date.now()}`;
    this.mapService.addMarker(id, this.latitude, this.longitude, this.markerLabel);
  }

  limpiar() {
    this.mapService.clearMarkers();
  }
}

// ============================================================================
// EJEMPLO 5: Mapa con múltiples capas de círculos
// ============================================================================

@Component({
  selector: 'app-circles-map'
})
export class CirclesMapComponent {
  constructor(private mapService: MapService) {}

  ngOnInit() {
    this.mapService.initializeMap('circles-map');

    // Agregar círculos en diferentes ubicaciones
    const ubicaciones = [
      { id: 'c1', lat: 40.4168, lng: -3.7038, radio: 5000, nombre: 'Madrid' },
      { id: 'c2', lat: 41.3851, lng: 2.1734, radio: 3000, nombre: 'Barcelona' },
      { id: 'c3', lat: 39.4699, lng: -0.3763, radio: 2000, nombre: 'Valencia' }
    ];

    ubicaciones.forEach(u => {
      this.mapService.addCircle(u.id, u.lat, u.lng, u.radio, 'blue');
      this.mapService.addMarker(u.id, u.lat, u.lng, u.nombre);
    });
  }
}

// ============================================================================
// EJEMPLO 6: Usar configuraciones predefinidas
// ============================================================================

import { UBICACIONES_PREDEFINIDAS, MARKER_STYLES } from './config/map.config';

@Component({
  selector: 'app-config-map'
})
export class ConfigMapComponent {
  constructor(private mapService: MapService) {}

  ngOnInit() {
    const madrid = UBICACIONES_PREDEFINIDAS.MADRID;
    this.mapService.initializeMap('config-map', madrid.lat, madrid.lng, madrid.zoom);
    
    // Agregar un marcador rojo
    const redIcon = this.mapService.createCustomIcon(MARKER_STYLES.RED);
    this.mapService.addMarker('m1', madrid.lat, madrid.lng, madrid.nombre, redIcon);
  }

  navegarA(ubicacionKey: keyof typeof UBICACIONES_PREDEFINIDAS) {
    const ubicacion = UBICACIONES_PREDEFINIDAS[ubicacionKey];
    this.mapService.setCenter(ubicacion.lat, ubicacion.lng);
    this.mapService.setZoom(ubicacion.zoom);
  }
}

// ============================================================================
// EJEMPLO 7: Componente interactivo completo
// ============================================================================

@Component({
  selector: 'app-interactive-map',
  template: `
    <div class="flex h-screen">
      <div class="w-80 bg-white shadow p-4 overflow-y-auto">
        <h2 class="text-2xl font-bold mb-4">Mapas Interactivos</h2>
        
        <div class="space-y-4">
          <div>
            <label>Zoom</label>
            <input type="range" min="2" max="19" 
                   (change)="cambiarZoom($event)" 
                   class="w-full" />
          </div>

          <div>
            <label>Latitud</label>
            <input [(ngModel)]="lat" type="number" step="0.0001" class="w-full border p-2" />
          </div>

          <div>
            <label>Longitud</label>
            <input [(ngModel)]="lng" type="number" step="0.0001" class="w-full border p-2" />
          </div>

          <button (click)="centrar()" class="w-full px-4 py-2 bg-blue-500 text-white rounded">
            Centrar Aquí
          </button>

          <button (click)="limpiarMarcadores()" class="w-full px-4 py-2 bg-red-500 text-white rounded">
            Limpiar
          </button>

          <div class="text-sm text-gray-600 mt-4">
            <p>Total de marcadores: {{totalMarcadores}}</p>
            <p>Zoom actual: {{zoomActual}}</p>
          </div>
        </div>
      </div>

      <div class="flex-1">
        <div id="interactive-map" class="w-full h-full"></div>
      </div>
    </div>
  `,
  standalone: true
})
export class InteractiveMapComponent {
  lat = 40.4168;
  lng = -3.7038;
  totalMarcadores = 0;
  zoomActual = 13;

  constructor(private mapService: MapService) {}

  ngOnInit() {
    this.mapService.initializeMap('interactive-map', this.lat, this.lng);
    this.actualizarInfo();

    // Capturar clicks para agregar marcadores
    this.mapService.onMapClick((lat, lng) => {
      this.mapService.addMarker(
        `m_${Date.now()}`,
        lat,
        lng,
        `Punto: ${lat.toFixed(2)}, ${lng.toFixed(2)}`
      );
      this.actualizarInfo();
    });
  }

  centrar() {
    this.mapService.setCenter(this.lat, this.lng);
  }

  cambiarZoom(event: any) {
    const zoom = parseInt(event.target.value);
    this.mapService.setZoom(zoom);
    this.zoomActual = zoom;
  }

  limpiarMarcadores() {
    this.mapService.clearMarkers();
    this.actualizarInfo();
  }

  actualizarInfo() {
    this.totalMarcadores = this.mapService.getMarkers().size;
    this.zoomActual = this.mapService.getZoom();
  }
}

// ============================================================================
// EJEMPLO 8: Integración con datos de un API
// ============================================================================

interface Ubicacion {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-api-map'
})
export class ApiMapComponent {
  ubicaciones: Ubicacion[] = [];

  constructor(private mapService: MapService) {}

  ngOnInit() {
    this.mapService.initializeMap('api-map');

    // Simular carga de datos de un API
    this.cargarDatos();
  }

  cargarDatos() {
    // En un caso real, esto vendría de un HttpClient.get()
    const datos: Ubicacion[] = [
      { id: '1', nombre: 'Punto A', lat: 40.4168, lng: -3.7038 },
      { id: '2', nombre: 'Punto B', lat: 41.3851, lng: 2.1734 },
      { id: '3', nombre: 'Punto C', lat: 39.4699, lng: -0.3763 }
    ];

    datos.forEach(ubicacion => {
      this.mapService.addMarker(
        ubicacion.id,
        ubicacion.lat,
        ubicacion.lng,
        ubicacion.nombre
      );
    });

    this.ubicaciones = datos;
    this.mapService.fitBounds();
  }
}

// ============================================================================
// EJEMPLO 9: Usar en un módulo (si no usas standalone)
// ============================================================================

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// @NgModule({
//   declarations: [MyMapComponent],
//   imports: [CommonModule, FormsModule, MapViewerComponent],
//   providers: [MapService]
// })
// export class MapsModule { }

// ============================================================================
// EJEMPLO 10: Router con múltiples mapas
// ============================================================================

// En app.routes.ts:
// const routes: Routes = [
//   { path: 'map/basic', component: SimpleMapComponent },
//   { path: 'map/service', component: ServiceMapComponent },
//   { path: 'map/interactive', component: InteractiveMapComponent },
//   { path: 'map/api', component: ApiMapComponent }
// ];

// ============================================================================
// FIN DE EJEMPLOS
// ============================================================================
