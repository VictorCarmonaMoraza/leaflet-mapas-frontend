
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import * as L from 'leaflet';

const legacyMarkerIcon = L.icon({
  iconRetinaUrl: '/media/marker-icon-2x.png',
  iconUrl: '/media/marker-icon.png',
  shadowUrl: '/media/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = legacyMarkerIcon;

@Component({
  selector: 'app-map-viewer-legacy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-viewer.component.html',
  styleUrl: './map-viewer.component.scss'
})
export class MapViewerLegacyComponent {}
