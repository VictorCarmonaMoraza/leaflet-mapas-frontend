import { AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

const defaultMarkerIcon = L.icon({
  iconRetinaUrl: '/media/marker-icon-2x.png',
  iconUrl: '/media/marker-icon.png',
  shadowUrl: '/media/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

const noteMarkerIcon = L.divIcon({
  className: 'leaflet-note-marker-wrap',
  html: `<div class="leaflet-note-marker" aria-hidden="true">
    <svg viewBox="0 0 48 48" class="leaflet-note-marker__svg" focusable="false">
      <defs>
        <linearGradient id="note-pin-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2563eb" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
      </defs>
      <path d="M24 3C15.44 3 8.5 9.94 8.5 18.5c0 11.79 13.4 24.48 14.38 25.4a1.67 1.67 0 0 0 2.24 0c.98-.92 14.38-13.61 14.38-25.4C39.5 9.94 32.56 3 24 3Z" fill="url(#note-pin-gradient)"/>
      <circle cx="24" cy="18" r="9" fill="#ffffff"/>
      <path d="M20 14.75h8a1.25 1.25 0 0 1 1.25 1.25v7.2a1.05 1.05 0 0 1-1.05 1.05H19.8a1.05 1.05 0 0 1-1.05-1.05V16A1.25 1.25 0 0 1 20 14.75Z" fill="#1d4ed8"/>
      <path d="M21.25 18h5.5M21.25 20.7h5.5M21.25 23.4h3.6" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>
    </svg>
  </div>`,
  iconSize: [40, 52],
  iconAnchor: [20, 52],
  popupAnchor: [0, -42],
});

L.Marker.prototype.options.icon = defaultMarkerIcon;

type PendingMarker = {
  lat: number;
  lng: number;
  name: string;
  comment?: string;
  noteId?: number;
};

export type NoteMovedEvent = {
  noteId: number;
  lat: number;
  lng: number;
};

@Component({
  selector: 'app-map-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-viewer.component.html',
  styleUrl: './map-viewer.component.scss'
})
export class MapViewerComponent implements AfterViewInit {

    public zoomIn(): void {
      if (this.map) {
        this.map.setZoom(this.map.getZoom() + 1);
      }
    }

    public zoomOut(): void {
      if (this.map) {
        this.map.setZoom(this.map.getZoom() - 1);
      }
    }

    public goToLocation(lat: number, lng: number): void {
      if (this.map) {
        this.map.setView([lat, lng], 13);
      }
    }
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Output() noteMoved = new EventEmitter<NoteMovedEvent>();
  private map: any;
  private currentBaseLayer: any;
  private pendingMarkers: PendingMarker[] = [];

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  private initializeMap(): void {
    import('leaflet').then((L) => {
      this.map = L.map('map', { zoomControl: false }).setView([40.0, -3.0], 6);
      this.setBaseLayer('osm');

      const ciudades = [
        { lat: 40.4168, lng: -3.7038, nombre: 'Madrid' },
        { lat: 41.3851, lng: 2.1734,  nombre: 'Barcelona' },
        { lat: 39.4699, lng: -0.3763, nombre: 'Valencia' },
      ];

      ciudades.forEach(c => {
        L.marker([c.lat, c.lng])
          .bindPopup(`<strong>${c.nombre}</strong>`)
          .addTo(this.map);
      });

      this.flushPendingMarkers();
    });
  }

  setBaseLayer(layer: 'osm' | 'hot' | 'topo'): void {
    import('leaflet').then((L) => {
      if (!this.map) return;

      const config = {
        osm: {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '© OpenStreetMap contributors'
        },
        hot: {
          url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          attribution: '© OpenStreetMap contributors, HOT'
        },
        topo: {
          url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
          attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap'
        }
      }[layer];

      if (this.currentBaseLayer) {
        this.map.removeLayer(this.currentBaseLayer);
      }

      this.currentBaseLayer = L.tileLayer(config.url, {
        maxZoom: 19,
        attribution: config.attribution
      }).addTo(this.map);
    });
  }

  addMarker(lat: number, lng: number, label: string): void {
    import('leaflet').then((L) => {
      if (this.map) {
        L.marker([lat, lng])
          .bindPopup(label)
          .addTo(this.map);
      }
    });
  }

  changeZoom(zoomLevel: number): void {
    if (this.map) {
      this.map.setZoom(zoomLevel);
    }
  }

  centerMap(lat: number, lng: number): void {
    if (this.map) {
      this.map.setView([lat, lng]);
    }
  }

  goToCity(lat: number, lng: number, name: string): void {
    import('leaflet').then((L) => {
      if (this.map) {
        this.map.setView([lat, lng], 13);
        L.marker([lat, lng])
          .bindPopup(`<strong>${name}</strong>`)
          .addTo(this.map)
          .openPopup();
      }
    });
  }

  flyToCity(lat: number, lng: number): void {
    if (this.map) {
      this.map.flyTo([lat, lng], 13, { duration: 1.5 });
    }
  }

  addMarkerWithComment(lat: number, lng: number, name: string, comment?: string, noteId?: number): void {
    if (!this.map) {
      this.pendingMarkers.push({ lat, lng, name, comment, noteId });
      return;
    }

    import('leaflet').then((L) => {
      if (this.map) {
        const popupHtml = comment
          ? `<div style="min-width:140px"><strong>${name}</strong><hr style="margin:4px 0;border:none;border-top:1px solid #ddd"/><p style="margin:0;font-size:12px;color:#555;white-space:pre-wrap">${comment}</p></div>`
          : `<strong>${name}</strong>`;
        const marker = L.marker([lat, lng], {
          draggable: typeof noteId === 'number',
          icon: noteMarkerIcon,
        })
          .bindPopup(popupHtml)
          .addTo(this.map);

        if (typeof noteId === 'number') {
          marker.on('dragend', () => {
            const position = marker.getLatLng();
            this.noteMoved.emit({
              noteId,
              lat: position.lat,
              lng: position.lng
            });
          });
        }

        marker.openPopup();
      }
    });
  }

  private flushPendingMarkers(): void {
    if (!this.pendingMarkers.length) return;

    const pending = [...this.pendingMarkers];
    this.pendingMarkers = [];
    pending.forEach((marker) => {
      this.addMarkerWithComment(marker.lat, marker.lng, marker.name, marker.comment, marker.noteId);
    });
  }

  public loadGeoJson(geojson: any): void {
    import('leaflet').then((L) => {
      if (!this.map) return;
      if ((this as any)._geoJsonLayer) {
        this.map.removeLayer((this as any)._geoJsonLayer);
      }
      const geoJsonLayer = L.geoJSON(geojson).addTo(this.map);
      (this as any)._geoJsonLayer = geoJsonLayer;
      this.map.fitBounds(geoJsonLayer.getBounds());
    });
  }
}
