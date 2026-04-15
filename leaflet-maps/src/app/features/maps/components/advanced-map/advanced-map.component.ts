/**
 * EJEMPLOS DE USO AVANZADO DEL SERVICIO DE MAPAS
 * 
 * Este archivo contiene ejemplos de cómo usar el MapService
 * para crear aplicaciones más complejas con Leaflet
 */

import { Component, OnInit } from '@angular/core';
import { MapService } from '../../../../services/map.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-advanced-map',
  standalone: true,
  templateUrl: './advanced-map.component.html',
  styleUrl: './advanced-map.component.scss'
})
export class AdvancedMapComponent implements OnInit {
  constructor(private mapService: MapService) {}

  ngOnInit(): void {
    // Inicializar el mapa
    this.mapService.initializeMap('advanced-map');

    //  Ejemplo 1: Agregar múltiples marcadores
    this.agregarMarcadoresEjemplo();

    // Ejemplo 2: Agregar círculos
    this.agregarCirculosEjemplo();

    // Ejemplo 3: Responder a clicks en el mapa
    this.configurarClicksEnMapa();
  }

  /**
   * Agregar múltiples marcadores en el mapa
   */
  agregarMarcadoresEjemplo(): void {
    // Ciudades principales de España
    const ciudades = [
      { id: 'madrid', lat: 40.4168, lng: -3.7038, label: 'Madrid - Capital' },
      { id: 'barcelona', lat: 41.3851, lng: 2.1734, label: 'Barcelona - Cataluña' },
      { id: 'valencia', lat: 39.4699, lng: -0.3763, label: 'Valencia - Levante' },
      { id: 'sevilla', lat: 37.3891, lng: -5.9845, label: 'Sevilla - Andalucía' },
      { id: 'bilbao', lat: 43.2627, lng: -2.9253, label: 'Bilbao - País Vasco' }
    ];

    // Crear iconos personalizados
    const redIcon = this.mapService.createCustomIcon('red');

    ciudades.forEach(ciudad => {
      this.mapService.addMarker(
        ciudad.id,
        ciudad.lat,
        ciudad.lng,
        ciudad.label,
        redIcon
      );
    });
  }

  /**
   * Agregar círculos de ejemplo
   */
  agregarCirculosEjemplo(): void {
    // Círculos de referencia (radios en metros)
    this.mapService.addCircle('circulo1', 40.4168, -3.7038, 5000, 'blue');
    this.mapService.addCircle('circulo2', 41.3851, 2.1734, 3000, 'green');
  }

  /**
   * Configurar respuestas a clicks en el mapa
   */
  configurarClicksEnMapa(): void {
    this.mapService.onMapClick((lat: number, lng: number) => {
      console.log(`Posición clickeada: ${lat}, ${lng}`);
      
      // Agregar un marcador temporal
      const markerId = `temp_${Date.now()}`;
      this.mapService.addMarker(
        markerId,
        lat,
        lng,
        `Ubicación: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      );
      
      // Auto-eliminar después de 5 segundos
      // setTimeout(() => this.mapService.removeMarker(markerId), 5000);
    });
  }

  /**
   * Hacer zoom a todos los marcadores
   */
  fitAllMarkers(): void {
    this.mapService.fitBounds();
  }

  /**
   * Limpiar todos los marcadores
   */
  clearAllMarkers(): void {
    this.mapService.clearMarkers();
  }

  /**
   * Ejemplo: Agregar ruta (usando Leaflet Routing Machine - opcional)
   */
  agregarRutaEjemplo(): void {
    // Ejemplo de cómo agregar una polyline
    const rutaMadridBarcelona: Array<[number, number]> = [
      [40.4168, -3.7038], // Madrid
      [41.0082, -3.6352], // Centro
      [41.3851, 2.1734]   // Barcelona
    ];

    const polyline = L.polyline(rutaMadridBarcelona as L.LatLngExpression[], {
      color: 'blue',
      weight: 3,
      opacity: 0.7,
      dashArray: '5, 5'
    }).addTo(this.mapService.getMap());
  }

  /**
   * Ejemplo: Agregar GeoJSON (si tienes datos geográficos)
   */
  agregarGeoJSONEjemplo(): void {
    // Ejemplo de cómo agregar GeoJSON
    const geojsonFeature: any = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name: "Cebada"
          },
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-3.7038, 40.4168],
              [-3.7238, 40.4168],
              [-3.7238, 40.3968],
              [-3.7038, 40.3968],
              [-3.7038, 40.4168]
            ]]
          }
        }
      ]
    };

    L.geoJSON(geojsonFeature, {
      style: {
        color: 'purple',
        weight: 2,
        opacity: 0.65,
        fillOpacity: 0.2
      }
    }).addTo(this.mapService.getMap());
  }

  /**
   * Obtener información del mapa actual
   */
  getMapInfo(): void {
    const center = this.mapService.getCenter();
    const zoom = this.mapService.getZoom();
    const markers = this.mapService.getMarkers().size;

    console.log(`
      Información del Mapa:
      - Centro: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}
      - Zoom: ${zoom}
      - Marcadores: ${markers}
    `);
  }
}

/**
 * NOTAS DE DESARROLLO:
 * 
 * 1. Para usar Leaflet Routing Machine, instala:
 *    npm install leaflet-routing-machine
 * 
 * 2. Para geocoding, considera usar:
 *    - Nominatim (OpenStreetMap gratuito)
 *    - Google Maps API
 *    - MapBox API
 * 
 * 3. Para clustering de marcadores:
 *    npm install leaflet.markercluster
 * 
 * 4. Para calor maps:
 *    npm install leaflet-heatmap
 * 
 * 5. Recursos útiles:
 *    - Leaflet Awesome Markers: https://fontawesome.com
 *    - Leaflet Draw: Para dibujar en el mapa
 *    - Leaflet Heat: Para mapas de calor
 */
