
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Configuración de iconos de Leaflet para Angular
import * as L from 'leaflet';
// Usar los iconos desde public/media
L.Icon.Default.mergeOptions({
  iconRetinaUrl: './media/marker-icon-2x.png',
  iconUrl: './media/marker-icon.png',
  shadowUrl: './media/marker-shadow.png'
});

@Component({
  selector: 'app-map-viewer-legacy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-viewer.component.html',
  styleUrl: './map-viewer.component.scss'
})
export class MapViewerLegacyComponent {}
