import { Injectable } from '@angular/core';
import * as L from 'leaflet';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  icon?: L.Icon;
}

export interface MapCircle {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private map!: L.Map;
  private markers: Map<string, L.Marker> = new Map();
  private circles: Map<string, L.Circle> = new Map();

  initializeMap(containerId: string, lat: number = 40.4168, lng: number = -3.7038, zoom: number = 13): L.Map {
    this.map = L.map(containerId).setView([lat, lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
      crossOrigin: 'anonymous'
    }).addTo(this.map);

    return this.map;
  }

  getMap(): L.Map {
    return this.map;
  }

  addMarker(id: string, lat: number, lng: number, label: string, icon?: L.Icon): L.Marker {
    const marker = L.marker([lat, lng], { icon })
      .bindPopup(label)
      .addTo(this.map);

    this.markers.set(id, marker);
    return marker;
  }

  removeMarker(id: string): void {
    const marker = this.markers.get(id);
    if (marker) {
      this.map.removeLayer(marker);
      this.markers.delete(id);
    }
  }

  getMarkers(): Map<string, L.Marker> {
    return this.markers;
  }

  clearMarkers(): void {
    this.markers.forEach((marker) => {
      this.map.removeLayer(marker);
    });
    this.markers.clear();
  }

  addCircle(id: string, lat: number, lng: number, radius: number, color: string = 'red'): L.Circle {
    const circle = L.circle([lat, lng], {
      color: color,
      fillColor: color,
      fillOpacity: 0.3,
      radius: radius
    }).addTo(this.map);

    this.circles.set(id, circle);
    return circle;
  }

  removeCircle(id: string): void {
    const circle = this.circles.get(id);
    if (circle) {
      this.map.removeLayer(circle);
      this.circles.delete(id);
    }
  }

  getCircles(): Map<string, L.Circle> {
    return this.circles;
  }

  clearCircles(): void {
    this.circles.forEach((circle) => {
      this.map.removeLayer(circle);
    });
    this.circles.clear();
  }

  setZoom(zoomLevel: number): void {
    this.map.setZoom(zoomLevel);
  }

  getZoom(): number {
    return this.map.getZoom();
  }

  setCenter(lat: number, lng: number): void {
    this.map.setView([lat, lng]);
  }

  getCenter(): L.LatLng {
    return this.map.getCenter();
  }

  fitBounds(): void {
    if (this.markers.size === 0) return;

    const group = new L.FeatureGroup(Array.from(this.markers.values()));
    this.map.fitBounds(group.getBounds());
  }

  onMapClick(callback: (lat: number, lng: number) => void): void {
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      callback(e.latlng.lat, e.latlng.lng);
    });
  }

  offMapClick(): void {
    this.map.off('click');
  }

  clearMap(): void {
    this.clearMarkers();
    this.clearCircles();
  }

  createCustomIcon(color: string, size: number = 25): L.Icon {
    return L.icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [size, 41],
      iconAnchor: [size / 2, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }
}
