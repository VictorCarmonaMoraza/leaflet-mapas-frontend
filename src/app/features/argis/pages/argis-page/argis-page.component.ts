import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemePickerComponent } from '../../../../components/theme-picker/theme-picker.component';
import { LanguagePickerComponent } from '../../../../components/language-picker/language-picker.component';
import { LanguageService } from '../../../../services/language.service';
import { apiUrl } from '../../../../config/api.config';
import { SearchResult } from '../../../maps/models/maps.models';

type SelectedPlaceInfo = {
  name: string;
  displayName: string;
  description: string;
  imageUrl: string;
  lat: number;
  lng: number;
};

@Component({
  selector: 'app-argis-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, ThemePickerComponent, LanguagePickerComponent],
  templateUrl: './argis-page.component.html',
  styleUrl: './argis-page.component.scss'
})
export class ArgisPageComponent implements AfterViewInit {
  @ViewChild('argisMap') argisMap!: ElementRef<HTMLDivElement>;
  @ViewChild('townSearchBox') townSearchBox?: ElementRef<HTMLDivElement>;
  readonly language = inject(LanguageService);

  readonly title = signal('Argis');
  readonly isLoading = signal(false);
  readonly isSearching = signal(false);
  readonly status = signal(this.language.t('argis.initialStatus'));
  readonly error = signal('');
  readonly searchError = signal('');
  readonly townQuery = signal('');
  readonly indexedTowns = signal<string[]>([]);
  readonly townResults = signal<SearchResult[]>([]);
  readonly selectedTown = signal('');
  readonly selectedPlaceInfo = signal<SelectedPlaceInfo | null>(null);
  readonly isPlaceInfoLoading = signal(false);
  readonly communitiesVisible = signal(false);
  readonly worldVisible = signal(false);
  readonly spanishTowns = signal<string[]>([
    'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Malaga', 'Murcia', 'Palma', 'Las Palmas de Gran Canaria',
    'Bilbao', 'Alicante', 'Cordoba', 'Valladolid', 'Vigo', 'Gijon', 'L Hospitalet de Llobregat', 'A Coruna', 'Vitoria-Gasteiz',
    'Granada', 'Elche', 'Oviedo', 'Badalona', 'Cartagena', 'Terrassa', 'Jerez de la Frontera', 'Sabadell', 'Mataro', 'Santander',
    'Pamplona', 'Almeria', 'Donostia-San Sebastian', 'Burgos', 'Albacete', 'Castellon de la Plana', 'Getafe', 'Cadiz', 'Badajoz',
    'Salamanca', 'Huelva', 'Logrono', 'Lleida', 'Tarragona', 'Leon', 'Marbella', 'Jaen', 'Ourense', 'Lugo', 'Toledo', 'Cuenca',
    'Aranda de Duero', 'Luarca', 'Calatayud', 'Ubeda', 'Cangas de Onis', 'Mahon'
  ]);

  private map: any;
  private uploadedLayer: any;
  private townContoursLayer: any;
  private autonomousCommunitiesLayer: any;
  private selectedCommunityLayer: any;
  private provinceBoundariesLayer: any;
  private provinceLabelsLayer: any;
  private autonomousCommunitiesGeoJson: any | null = null;
  private autonomousCommunitiesRequest: Promise<any> | null = null;
  private worldCountriesLayer: any;
  private worldCountriesGeoJson: any | null = null;
  private worldCountriesRequest: Promise<any> | null = null;
  private spainProvincesGeoJson: any | null = null;
  private searchMarker: any;
  private searchBoundaryLayer: any;
  private townBoundaryCache = new Map<string, any | null>();
  private townCenters = new Map<string, { lat: number; lng: number }>();
  private lastLayerGeometry: 'line' | 'polygon' | 'point' | 'unknown' = 'unknown';
  private loadingStartedAt = 0;
  private searchTimeout: any;
  private placeInfoRequestId = 0;
  private readonly WORLD_LIMITS = {
    south: -85,
    north: 85,
    west: -180,
    east: 180
  };
  private readonly PROVINCE_PALETTE: Array<{ fill: string; border: string }> = [
    { fill: '#fbbf24', border: '#a16207' },
    { fill: '#fb923c', border: '#c2410c' },
    { fill: '#f87171', border: '#b91c1c' },
    { fill: '#f472b6', border: '#be185d' },
    { fill: '#c084fc', border: '#7e22ce' },
    { fill: '#818cf8', border: '#4338ca' },
    { fill: '#60a5fa', border: '#1d4ed8' },
    { fill: '#22d3ee', border: '#0e7490' },
    { fill: '#34d399', border: '#047857' },
    { fill: '#a3e635', border: '#3f6212' }
  ];
  private readonly CCAA_TO_PROVINCES_CODE: Record<string, string> = {
    '01': '01',
    '02': '02',
    '03': '18',
    '04': '03',
    '05': '04',
    '06': '05',
    '07': '07',
    '08': '06',
    '09': '08',
    '10': '19',
    '11': '10',
    '12': '11',
    '13': '13',
    '14': '15',
    '15': '16',
    '16': '17',
    '17': '12',
    '18': '09',
    '19': '14'
  };

  ngAfterViewInit(): void {
    this.initMap();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target || !this.townSearchBox?.nativeElement) return;

    if (!this.townSearchBox.nativeElement.contains(target)) {
      this.townResults.set([]);
    }
  }

  private initMap(): void {
    import('leaflet').then(async (L) => {
      const worldBounds = L.latLngBounds(
        L.latLng(this.WORLD_LIMITS.south, this.WORLD_LIMITS.west),
        L.latLng(this.WORLD_LIMITS.north, this.WORLD_LIMITS.east)
      );
      this.map = L.map(this.argisMap.nativeElement, {
        minZoom: 2,
        maxBounds: worldBounds,
        maxBoundsViscosity: 1,
        worldCopyJump: false
      }).setView([40.0, -3.0], 6);

      // Base muy ligera para que destaquen las tuberias y no haya exceso de detalle.
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        minZoom: 2,
        maxZoom: 19,
        noWrap: true,
        bounds: worldBounds,
        opacity: 0.45,
        attribution: '© OpenStreetMap contributors © CARTO'
      }).addTo(this.map);

      requestAnimationFrame(() => this.map?.invalidateSize());

      await this.loadDefaultWorldLayer();
    });
  }

  private async loadDefaultWorldLayer(): Promise<void> {
    if (!this.map || this.worldVisible()) return;

    try {
      await this.drawWorldCountries();
      this.worldVisible.set(true);
      this.error.set('');
      this.status.set(this.language.t('argis.defaultWorldLoaded'));
    } catch {
      this.status.set(this.language.t('argis.defaultWorldFailed'));
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;

    this.beginLoading();
    this.status.set(this.language.t('argis.processingFiles', { count: files.length }));

    try {
      const source = await this.buildShapefileSource(files);
      const result = await this.parseShapefile(source);

      const geojson = this.normalizeGeoJson(result);
      if (!geojson || !geojson.features?.length) {
        throw new Error('No se encontraron geometrías en el archivo.');
      }

      await this.renderGeoJson(geojson);
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : this.language.t('argis.readShapefileError');
      this.error.set(message);
      this.status.set(this.language.t('argis.fileLoadError'));
    } finally {
      await this.endLoading();
      input.value = '';
    }
  }

  async loadExampleLayer(): Promise<void> {
    if (!this.map) {
      this.status.set(this.language.t('argis.mapInitializing'));
      return;
    }

    this.beginLoading();
    this.status.set(this.language.t('argis.loadingExample'));

    try {
      const response = await fetch(apiUrl('/api/examples/argis-water-pipes-spain.geojson'));
      const geojson = response.ok ? await response.json() : this.getBuiltInExampleGeoJson();
      const normalized = this.normalizeGeoJson(geojson);
      if (!normalized || !normalized.features?.length) {
        throw new Error('El fichero de ejemplo no contiene geometrias.');
      }

      await this.renderGeoJson(normalized);
      this.status.set(this.language.t('argis.exampleLoaded'));
      this.error.set('');

      // Enfocar automaticamente una localidad para que las tuberias se vean claramente.
      const firstTown = this.indexedTowns()[0];
      if (firstTown) {
        await this.goToTown(firstTown);
      }
    } catch {
      this.error.set(this.language.t('argis.exampleLoadErrorDetail'));
      this.status.set(this.language.t('argis.exampleLoadError'));
    } finally {
      await this.endLoading();
    }
  }

  protected async parseShapefile(source: ArrayBuffer | { shp: ArrayBuffer; dbf?: ArrayBuffer; shx?: ArrayBuffer; prj?: ArrayBuffer; cpg?: ArrayBuffer }): Promise<any> {
    const shpModule = await import('shpjs');
    const shp = shpModule.default;
    return shp(source as any);
  }

  async toggleAutonomousCommunities(): Promise<void> {
    if (!this.map) return;

    if (this.communitiesVisible()) {
      if (this.autonomousCommunitiesLayer) {
        this.map.removeLayer(this.autonomousCommunitiesLayer);
      }
      if (this.selectedCommunityLayer) {
        this.map.removeLayer(this.selectedCommunityLayer);
      }
      if (this.provinceBoundariesLayer) {
        this.map.removeLayer(this.provinceBoundariesLayer);
      }
      if (this.provinceLabelsLayer) {
        this.map.removeLayer(this.provinceLabelsLayer);
      }
      this.autonomousCommunitiesLayer = null;
      this.selectedCommunityLayer = null;
      this.provinceBoundariesLayer = null;
      this.provinceLabelsLayer = null;
      this.communitiesVisible.set(false);
      this.status.set(this.language.t('argis.ccaaHidden'));
      return;
    }

    // Desactivar la capa mundial si estaba visible.
    if (this.worldVisible()) {
      if (this.worldCountriesLayer) {
        this.map.removeLayer(this.worldCountriesLayer);
      }
      this.worldCountriesLayer = null;
      this.worldVisible.set(false);
    }

    this.beginLoading();
    this.status.set(this.language.t('argis.loadingCcaa'));

    try {
      await this.drawAutonomousCommunities();
      this.communitiesVisible.set(true);
      this.status.set(`${this.language.t('argis.ccaaLoaded')} ${this.language.t('argis.ccaaTip')}`);
    } catch {
      this.error.set(this.language.t('argis.ccaaLoadErrorDetail'));
      this.status.set(this.language.t('argis.ccaaLoadError'));
    } finally {
      await this.endLoading();
    }
  }

  async toggleWorldCountries(): Promise<void> {
    if (!this.map) return;

    if (this.worldVisible()) {
      if (this.worldCountriesLayer) {
        this.map.removeLayer(this.worldCountriesLayer);
      }
      this.worldCountriesLayer = null;
      this.worldVisible.set(false);
      this.status.set(this.language.t('argis.worldHidden'));
      return;
    }

    // Desactivar la capa CCAA si estaba visible.
    if (this.communitiesVisible()) {
      if (this.autonomousCommunitiesLayer) {
        this.map.removeLayer(this.autonomousCommunitiesLayer);
      }
      if (this.selectedCommunityLayer) {
        this.map.removeLayer(this.selectedCommunityLayer);
      }
      if (this.provinceBoundariesLayer) {
        this.map.removeLayer(this.provinceBoundariesLayer);
      }
      if (this.provinceLabelsLayer) {
        this.map.removeLayer(this.provinceLabelsLayer);
      }
      this.autonomousCommunitiesLayer = null;
      this.selectedCommunityLayer = null;
      this.provinceBoundariesLayer = null;
      this.provinceLabelsLayer = null;
      this.communitiesVisible.set(false);
    }

    this.beginLoading();
    this.status.set(this.language.t('argis.loadingWorld'));

    try {
      await this.drawWorldCountries();
      this.worldVisible.set(true);
      this.status.set(this.language.t('argis.worldLoaded'));
    } catch {
      this.error.set(this.language.t('argis.worldLoadErrorDetail'));
      this.status.set(this.language.t('argis.worldLoadError'));
    } finally {
      await this.endLoading();
    }
  }

  protected async renderGeoJson(geojson: any): Promise<void> {
    const L = await import('leaflet');
    if (this.uploadedLayer && this.map) {
      this.map.removeLayer(this.uploadedLayer);
    }
    if (this.townContoursLayer && this.map) {
      this.map.removeLayer(this.townContoursLayer);
    }

    const features = geojson.features ?? [];
    const lineFeatures = features.filter((feature: any) => {
      const type = feature?.geometry?.type;
      return type === 'LineString' || type === 'MultiLineString';
    });
    const polygonFeatures = features.filter((feature: any) => {
      const type = feature?.geometry?.type;
      return type === 'Polygon' || type === 'MultiPolygon';
    });
    const pointFeatures = features.filter((feature: any) => {
      const type = feature?.geometry?.type;
      return type === 'Point' || type === 'MultiPoint';
    });

    const hasLines = lineFeatures.length > 0;
    const hasPolygons = polygonFeatures.length > 0;
    const hasPoints = pointFeatures.length > 0;

    if (!hasLines && !hasPolygons && !hasPoints) {
      throw new Error(this.language.t('argis.layerUnsupported'));
    }

    this.lastLayerGeometry = hasLines ? 'line' : hasPolygons ? 'polygon' : 'point';
    const displayGeoJson = {
      ...geojson,
      features: hasLines ? lineFeatures : hasPolygons ? polygonFeatures : pointFeatures
    };

    this.uploadedLayer = L.geoJSON(displayGeoJson as any, {
      style: () => {
        if (hasLines) {
          return {
            color: '#06b6d4',
            weight: 6,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
            fillColor: '#22d3ee',
            fillOpacity: 0.35
          };
        }

        return {
          color: '#ea580c',
          weight: 2,
          opacity: 0.95,
          fillColor: '#fdba74',
          fillOpacity: 0.2
        };
      },
      pointToLayer: (_feature: any, latlng: any) => {
        return L.circleMarker(latlng, {
          radius: 6,
          color: '#0ea5e9',
          weight: 2,
          fillColor: '#38bdf8',
          fillOpacity: 0.9
        });
      },
      onEachFeature: (feature: any, layer: any) => {
        const town = this.extractTownName(feature) ?? 'Sin pueblo';
        const label = feature?.properties?.name ?? feature?.properties?.NAME ?? feature?.properties?.tramo ?? 'Elemento';
        layer.bindPopup(`<strong>${town}</strong><br/>${label}`);

        if (this.lastLayerGeometry === 'point') {
          layer.bindTooltip(town, {
            permanent: true,
            direction: 'top',
            offset: [0, -8],
            className: 'place-name-label'
          });
        }
      }
    }).addTo(this.map);

    const bounds = this.uploadedLayer.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds.pad(0.1));
    }

    this.indexTownsFromLayer();
    if (this.lastLayerGeometry === 'line') {
      await this.drawTownContours();
    }

    if (this.lastLayerGeometry === 'polygon') {
      this.status.set(this.language.t('argis.polygonLayerLoaded'));
      this.error.set('');
    }

    if (this.lastLayerGeometry === 'point') {
      this.status.set(this.language.t('argis.pointLayerLoaded'));
      this.error.set('');
    }

    if (this.lastLayerGeometry === 'line') {
      this.status.set(this.language.t('argis.lineLayerLoaded'));
      this.error.set('');
    }
  }

  onTownQueryChange(value: string): void {
    this.townQuery.set(value);
    clearTimeout(this.searchTimeout);
    this.searchError.set('');

    if (value.trim().length < 3) {
      this.townResults.set([]);
      return;
    }

    this.searchTimeout = setTimeout(() => {
      void this.searchTownSuggestions();
    }, 400);
  }

  clearTownQuery(): void {
    this.townQuery.set('');
    this.townResults.set([]);
    this.searchError.set('');
  }

  async selectTownSuggestion(result: SearchResult): Promise<void> {
    const placeName = result.display_name.split(',')[0].trim();
    this.townQuery.set(placeName);
    this.townResults.set([]);
    this.searchError.set('');

    this.beginLoading();
    this.status.set(this.language.t('argis.loadingLayer'));
    try {
      await this.focusSearchResult(result);
    } finally {
      await this.endLoading();
    }
  }

  async searchTown(): Promise<void> {
    const query = this.townQuery().trim();
    if (!query) return;

    this.beginLoading();
    this.status.set(this.language.t('argis.loadingLayer'));

    try {
      const firstSuggestion = this.townResults()[0];
      if (firstSuggestion) {
        await this.focusSearchResult(firstSuggestion);
        this.townResults.set([]);
        return;
      }

      await this.goToTownByGeocoding(query);
      this.townResults.set([]);
    } finally {
      await this.endLoading();
    }
  }

  async goToTown(town: string): Promise<void> {
    this.selectedTown.set(town);
    this.townQuery.set(town);
    const center = this.townCenters.get(town);
    if (!this.map) return;

    if (center) {
      this.map.flyTo([center.lat, center.lng], 8, { duration: 1.2 });
      await this.placeSearchMarker(center.lat, center.lng, town);
      this.townResults.set([]);
      void this.loadPlaceInfo(town, town, center.lat, center.lng);
      return;
    }

    // Si no existe en la capa cargada, intentar ubicar por geocodificacion.
    await this.goToTownByGeocoding(town);
  }

  private beginLoading(): void {
    this.error.set('');
    this.loadingStartedAt = Date.now();
    this.isLoading.set(true);
  }

  private async endLoading(minDurationMs = 1000): Promise<void> {
    const elapsed = Date.now() - this.loadingStartedAt;
    const remaining = minDurationMs - elapsed;
    if (remaining > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, remaining));
    }
    this.isLoading.set(false);
  }

  private indexTownsFromLayer(): void {
    this.townCenters.clear();
    if (!this.uploadedLayer) return;

    this.uploadedLayer.eachLayer((layer: any) => {
      const feature = layer?.feature;
      const townRaw = this.extractTownName(feature);
      if (!townRaw) return;

      const town = String(townRaw).trim();
      if (!town) return;

      const center = this.getLayerCenter(layer);
      if (!center) return;

      if (!this.townCenters.has(town)) {
        this.townCenters.set(town, center);
      }
    });

    const towns = Array.from(this.townCenters.keys()).sort((a, b) => a.localeCompare(b, this.language.currentLanguage()));
    this.indexedTowns.set(towns);
    this.refreshTownResults();

    // Si el pueblo seleccionado desaparece al cambiar de capa, limpiarlo.
    if (this.selectedTown() && !this.townCenters.has(this.selectedTown())) {
      this.selectedTown.set('');
    }
  }

  private refreshTownResults(): void {
    if (this.townQuery().trim().length < 3) {
      this.townResults.set([]);
    }
  }

  private getAutocompleteTowns(): string[] {
    const merged = [...this.spanishTowns(), ...this.indexedTowns()];
    const unique = Array.from(new Set(merged.map((town) => town.trim()).filter(Boolean)));
    return unique.sort((a, b) => a.localeCompare(b, this.language.currentLanguage()));
  }

  private findTownByName(query: string): string | null {
    const lower = query.toLowerCase();
    const found = this.getAutocompleteTowns().find((town) => town.toLowerCase() === lower);
    return found ?? null;
  }

  private async searchTownSuggestions(): Promise<void> {
    this.isSearching.set(true);
    this.townResults.set([]);

    try {
      const url = apiUrl(`/api/geocode/search?q=${encodeURIComponent(this.townQuery())}&format=json&limit=5&lang=${this.language.currentLanguage()}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('search-suggestions');
      }

      const results = await response.json() as SearchResult[];
      this.townResults.set(results);
      if (results.length === 0) {
        this.searchError.set(this.language.t('maps.searchNoResults'));
      }
    } catch {
      this.searchError.set(this.language.t('maps.searchError'));
    } finally {
      this.isSearching.set(false);
    }
  }

  private async focusSearchResult(result: SearchResult): Promise<void> {
    if (!this.map) return;

    const lat = Number(result.lat);
    const lng = Number(result.lon);
    const name = result.display_name.split(',')[0].trim();

    if (this.searchBoundaryLayer) {
      this.map.removeLayer(this.searchBoundaryLayer);
      this.searchBoundaryLayer = null;
    }

    const fallback = this.getClampedLatLng(lat, lng);
    this.map.flyTo([fallback.lat, fallback.lng], 8, { duration: 1.2 });
    await this.placeSearchMarker(lat, lng, name);
    this.selectedTown.set(name);
    this.status.set(this.language.t('argis.showingPlace', { place: result.display_name }));
    this.error.set('');
    void this.loadPlaceInfo(name, result.display_name, lat, lng);
  }

  private async loadPlaceInfo(name: string, displayName: string, lat: number, lng: number): Promise<void> {
    const requestId = ++this.placeInfoRequestId;
    const fallbackImage = this.buildFallbackPlaceImage(name);

    this.selectedPlaceInfo.set({
      name,
      displayName,
      description: this.language.t('argis.placeInfoDescriptionFallback'),
      imageUrl: fallbackImage,
      lat,
      lng,
    });
    this.isPlaceInfoLoading.set(true);

    const candidates = Array.from(new Set([
      name.trim(),
      displayName.split(',')[0]?.trim() ?? '',
    ].filter(Boolean)));

    try {
      for (const language of ['es', 'en']) {
        for (const candidate of candidates) {
          const response = await fetch(`https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(candidate)}`);
          if (!response.ok) {
            continue;
          }

          const summary = await response.json() as {
            title?: string;
            extract?: string;
            description?: string;
            thumbnail?: { source?: string };
          };

          if (requestId !== this.placeInfoRequestId) {
            return;
          }

          this.selectedPlaceInfo.set({
            name: summary.title?.trim() || name,
            displayName,
            description: summary.extract?.trim() || summary.description?.trim() || this.language.t('argis.placeInfoDescriptionFallback'),
            imageUrl: summary.thumbnail?.source || fallbackImage,
            lat,
            lng,
          });
          this.isPlaceInfoLoading.set(false);
          return;
        }
      }
    } catch {
      // Fallback silencioso a la ficha basica si no hay resumen remoto.
    }

    if (requestId === this.placeInfoRequestId) {
      this.isPlaceInfoLoading.set(false);
    }
  }

  private buildFallbackPlaceImage(name: string): string {
    const safeName = name.trim() || 'GeoVista';
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="50%" stop-color="#2563eb" />
            <stop offset="100%" stop-color="#22c55e" />
          </linearGradient>
        </defs>
        <rect width="1200" height="720" fill="url(#g)" rx="36" />
        <circle cx="930" cy="164" r="94" fill="rgba(255,255,255,0.16)" />
        <circle cx="250" cy="600" r="140" fill="rgba(255,255,255,0.1)" />
        <text x="80" y="260" fill="#f8fafc" font-size="54" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${safeName}</text>
        <text x="80" y="332" fill="#dbeafe" font-size="28" font-family="Segoe UI, Arial, sans-serif">GeoVista Argis</text>
      </svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  private async goToTownByGeocoding(query: string): Promise<void> {
    if (!this.map) return;
    this.error.set('');
    try {
      const url = apiUrl(`/api/geocode/search?q=${encodeURIComponent(query)}&format=json&polygon_geojson=1&limit=1&lang=${this.language.currentLanguage()}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Geocodificacion no disponible');
      }

      const data = await response.json() as Array<{
        lat: string; lon: string; display_name: string;
        boundingbox: string[];
        geojson?: { type: string; coordinates: any };
      }>;
      const hit = data[0];
      if (!hit) {
        this.status.set(this.language.t('argis.placeNotFound'));
        return;
      }

      const L = await import('leaflet');

      // Eliminar limite anterior
      if (this.searchBoundaryLayer) {
        this.map.removeLayer(this.searchBoundaryLayer);
        this.searchBoundaryLayer = null;
      }

      // Dibujar limite poligonal si existe
      const geoType = hit.geojson?.type;
      if (hit.geojson && (geoType === 'Polygon' || geoType === 'MultiPolygon')) {
        const boundaryFeature = {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: hit.geojson, properties: { name: query } }]
        };
        this.searchBoundaryLayer = L.geoJSON(boundaryFeature as any, {
          style: {
            color: '#f97316',
            weight: 3,
            dashArray: '8 5',
            fillColor: '#fdba74',
            fillOpacity: 0.18,
            opacity: 1
          }
        }).addTo(this.map);

        const bounds = this.searchBoundaryLayer.getBounds();
        if (bounds.isValid()) {
          const moved = await this.safeFlyToBounds(bounds, 9);
          if (!moved) {
            const fallback = this.getClampedLatLng(Number(hit.lat), Number(hit.lon));
            this.map.flyTo([fallback.lat, fallback.lng], 7, { duration: 1.2 });
          }
        }
      } else {
        // Fallback con bounding box
        const bbox = hit.boundingbox;
        if (bbox?.length === 4) {
          const bounds = L.latLngBounds([Number(bbox[0]), Number(bbox[2])], [Number(bbox[1]), Number(bbox[3])]);
          const moved = await this.safeFlyToBounds(bounds, 9);
          if (!moved) {
            const fallback = this.getClampedLatLng(Number(hit.lat), Number(hit.lon));
            this.map.flyTo([fallback.lat, fallback.lng], 7, { duration: 1.2 });
          }
        } else {
          const fallback = this.getClampedLatLng(Number(hit.lat), Number(hit.lon));
          this.map.flyTo([fallback.lat, fallback.lng], 7, { duration: 1.2 });
        }
      }

      await this.placeSearchMarker(Number(hit.lat), Number(hit.lon), query);
      this.selectedTown.set(query);
      this.status.set(this.language.t('argis.showingPlace', { place: hit.display_name }));
    } catch {
      this.error.set(this.language.t('argis.searchPlaceError'));
    }
  }

  private async placeSearchMarker(lat: number, lng: number, name: string): Promise<void> {
    if (!this.map) return;
    const L = await import('leaflet');

    if (this.searchMarker) {
      this.map.removeLayer(this.searchMarker);
    }

    const icon = L.divIcon({
      className: '',
      html: `<div class="search-result-pin"><span class="search-result-label">${name}</span><div class="search-result-dot"></div></div>`,
      iconAnchor: [0, 8]
    });

    const clamped = this.getClampedLatLng(lat, lng);
    this.searchMarker = L.marker([clamped.lat, clamped.lng], { icon }).addTo(this.map);
  }

  private getClampedLatLng(lat: number, lng: number): { lat: number; lng: number } {
    const safeLat = Number.isFinite(lat) ? Math.max(this.WORLD_LIMITS.south, Math.min(this.WORLD_LIMITS.north, lat)) : 0;
    let safeLng = Number.isFinite(lng) ? lng : 0;
    while (safeLng < this.WORLD_LIMITS.west) safeLng += 360;
    while (safeLng > this.WORLD_LIMITS.east) safeLng -= 360;
    return { lat: safeLat, lng: safeLng };
  }

  private async safeFlyToBounds(rawBounds: any, maxZoom = 9): Promise<boolean> {
    if (!this.map || !rawBounds?.isValid?.()) return false;
    const L = await import('leaflet');

    const sw = rawBounds.getSouthWest?.();
    const ne = rawBounds.getNorthEast?.();
    if (!sw || !ne) return false;

    const swSafe = this.getClampedLatLng(sw.lat, sw.lng);
    const neSafe = this.getClampedLatLng(ne.lat, ne.lng);
    const south = Math.min(swSafe.lat, neSafe.lat);
    const north = Math.max(swSafe.lat, neSafe.lat);
    const west = Math.min(swSafe.lng, neSafe.lng);
    const east = Math.max(swSafe.lng, neSafe.lng);

    const latSpan = Math.abs(north - south);
    const lngSpan = Math.abs(east - west);
    if (latSpan > 170 || lngSpan > 350) return false;

    const bounds = L.latLngBounds([south, west], [north, east]);
    if (!bounds.isValid()) return false;

    this.map.flyToBounds(bounds, { duration: 1.2, maxZoom, padding: [40, 40] });
    return true;
  }

  private async focusCommunity(feature: any): Promise<void> {
    if (!this.map) return;
    const community = this.getCommunityName(feature);
    const communityCode = this.getCommunityCode(feature);

    this.beginLoading();
    this.status.set(this.language.t('argis.loadingCommunity', { community }));

    try {
      await this.highlightCommunity(feature);

      // Limpiar capas previas antes de cargar nuevas provincias para evitar residuos visuales.
      if (this.provinceBoundariesLayer) {
        this.map.removeLayer(this.provinceBoundariesLayer);
        this.provinceBoundariesLayer = null;
      }
      if (this.provinceLabelsLayer) {
        this.map.removeLayer(this.provinceLabelsLayer);
        this.provinceLabelsLayer = null;
      }

      const provinceFeatures = await this.loadCommunityProvinces(community, communityCode);
      if (provinceFeatures.length) {
        await this.drawProvinceBoundaries(provinceFeatures);
        this.status.set(this.language.t('argis.communityReady', { community }));
      } else {
        this.status.set(this.language.t('argis.communityNoProvinces', { community }));
      }
    } catch {
      this.error.set(this.language.t('argis.communityLoadError'));
    } finally {
      await this.endLoading();
    }
  }

  private getCommunityName(feature: any): string {
    const properties = feature?.properties ?? {};
    return (
      properties.nom ??
      properties.noml_ccaa ??
      properties.NAME_1 ??
      properties.name ??
      properties.NAME ??
      'Comunidad'
    );
  }

  private getCommunityCode(feature: any): string {
    const code = feature?.properties?.cod_ccaa;
    return code ? String(code).padStart(2, '0') : '';
  }

  private normalizeKey(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async highlightCommunity(feature: any): Promise<void> {
    if (!this.map) return;
    const L = await import('leaflet');

    if (this.selectedCommunityLayer) {
      this.map.removeLayer(this.selectedCommunityLayer);
    }

    this.selectedCommunityLayer = L.geoJSON(
      { type: 'FeatureCollection', features: [feature] } as any,
      {
        style: {
          color: '#f97316',
          weight: 3.2,
          fillColor: '#fb923c',
          fillOpacity: 0.06,
          opacity: 1
        }
      }
    ).addTo(this.map);

    const bounds = this.selectedCommunityLayer.getBounds?.();
    if (bounds?.isValid?.()) {
      await this.safeFlyToBounds(bounds.pad(0.08), 8);
    }
  }

  private async loadCommunityProvinces(communityName: string, communityCode: string): Promise<any[]> {
    const provincesGeoJson = await this.loadSpainProvincesGeoJson();
    const allFeatures = Array.isArray(provincesGeoJson?.features) ? provincesGeoJson.features : [];
    const provinceDatasetCode = this.CCAA_TO_PROVINCES_CODE[communityCode] ?? communityCode;

    if (provinceDatasetCode) {
      const byCode = allFeatures
        .filter((feature: any) => String(feature?.properties?.cod_ccaa ?? '').padStart(2, '0') === provinceDatasetCode)
        .map((feature: any) => ({
          ...feature,
          properties: {
            ...(feature?.properties ?? {}),
            province: feature?.properties?.name ?? feature?.properties?.province ?? feature?.properties?.nombre ?? 'Provincia',
            community: communityName
          }
        }));

      if (byCode.length > 0) {
        return byCode;
      }
    }

    const key = this.normalizeKey(communityName);
    const provinceNames = this.COMMUNITY_PROVINCES_FALLBACK[key] ?? [];
    if (!provinceNames.length) {
      return [];
    }

    const provinceSet = new Set(provinceNames.map((name) => this.normalizeKey(name)));

    const features = allFeatures
      .filter((feature: any) => {
        const rawName =
          feature?.properties?.name ??
          feature?.properties?.province ??
          feature?.properties?.nombre;
        if (!rawName) return false;
        return provinceSet.has(this.normalizeKey(String(rawName)));
      })
      .map((feature: any) => ({
        ...feature,
        properties: {
          ...(feature?.properties ?? {}),
          province: feature?.properties?.name ?? feature?.properties?.province ?? feature?.properties?.nombre ?? 'Provincia',
          community: communityName
        }
      }));

    return features;
  }

  private async loadSpainProvincesGeoJson(): Promise<any> {
    if (this.spainProvincesGeoJson) {
      return this.spainProvincesGeoJson;
    }

    const response = await fetch('/examples/spain-provinces.geojson', { cache: 'force-cache' });
    if (!response.ok) {
      throw new Error('No se pudo cargar el dataset de provincias de Espana.');
    }

    const data = await response.json();
    this.spainProvincesGeoJson = data;
    return data;
  }

  private async drawProvinceBoundaries(features: any[]): Promise<void> {
    if (!this.map) return;
    const L = await import('leaflet');

    if (this.provinceBoundariesLayer) {
      this.map.removeLayer(this.provinceBoundariesLayer);
    }
    if (this.provinceLabelsLayer) {
      this.map.removeLayer(this.provinceLabelsLayer);
    }

    this.provinceBoundariesLayer = L.geoJSON(
      { type: 'FeatureCollection', features } as any,
      {
        interactive: true,
        style: (feature: any) => {
          const seed =
            feature?.properties?.cod_prov ??
            feature?.properties?.province ??
            feature?.properties?.name ??
            '0';
          const idx = this.hashSeed(String(seed)) % this.PROVINCE_PALETTE.length;
          const colors = this.PROVINCE_PALETTE[idx];
          return {
            color: colors.border,
            weight: 1.9,
            fillColor: colors.fill,
            fillOpacity: 0.3,
            opacity: 0.95,
            dashArray: '4 3'
          };
        },
        onEachFeature: (feature: any, layer: any) => {
          const provinceRaw =
            feature?.properties?.province ??
            feature?.properties?.name ??
            feature?.properties?.display_name ??
            'Provincia';
          const province = String(provinceRaw).split(',')[0].trim() || 'Provincia';
          layer.bindTooltip(province, {
            direction: 'center',
            permanent: true,
            opacity: 0.95,
            className: 'province-name-label'
          });
        }
      }
    ).addTo(this.map);

    const markers: any[] = [];
    this.provinceBoundariesLayer.eachLayer((layer: any) => {
      const center = this.getLayerCenter(layer);
      if (!center) return;

      const provinceRaw =
        layer?.feature?.properties?.province ??
        layer?.feature?.properties?.name ??
        layer?.feature?.properties?.display_name ??
        'Provincia';
      const province = String(provinceRaw).split(',')[0].trim() || 'Provincia';
      const icon = L.divIcon({
        className: 'province-name-marker-wrap',
        html: `<span class="province-name-marker">${province}</span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
      markers.push(L.marker([center.lat, center.lng], { icon, interactive: false }));
    });

    this.provinceLabelsLayer = L.layerGroup(markers).addTo(this.map);

    this.selectedCommunityLayer?.bringToBack?.();
    this.provinceBoundariesLayer.bringToFront();
    this.provinceLabelsLayer?.bringToFront?.();
  }

  private hashSeed(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  private getLayerCenter(layer: any): { lat: number; lng: number } | null {
    if (layer?.getBounds) {
      const bounds = layer.getBounds();
      if (bounds?.isValid?.()) {
        const center = bounds.getCenter();
        return { lat: center.lat, lng: center.lng };
      }
    }

    if (layer?.getLatLng) {
      const center = layer.getLatLng();
      return { lat: center.lat, lng: center.lng };
    }

    return null;
  }

  private async drawAutonomousCommunities(): Promise<void> {
    if (!this.map) return;
    const L = await import('leaflet');

    if (this.autonomousCommunitiesLayer) {
      this.map.removeLayer(this.autonomousCommunitiesLayer);
    }

    const communitiesGeoJson = await this.loadAutonomousCommunitiesGeoJson();
    const features = communitiesGeoJson?.features ?? [];
    if (!features.length) {
      throw new Error('Sin geometrias de comunidades');
    }

    this.autonomousCommunitiesLayer = L.geoJSON(communitiesGeoJson as any, {
      style: {
        color: '#0f172a',
        weight: 2.2,
        fillColor: '#2563eb',
        fillOpacity: 0.28,
        opacity: 0.95
      },
      onEachFeature: (feature: any, layer: any) => {
        const name = this.getCommunityName(feature);
        layer.bindTooltip(name, { direction: 'top' });
        layer.on('click', () => {
          this.focusCommunity(feature);
        });
      }
    }).addTo(this.map);

    this.autonomousCommunitiesLayer.bringToBack();
    const bounds = this.autonomousCommunitiesLayer.getBounds?.();
    if (bounds?.isValid?.()) {
      this.map.fitBounds(bounds.pad(0.04));
    }
  }

  private readonly CONTINENT_COLORS: Record<string, { fill: string; border: string }> = {
    'Africa':        { fill: '#d97706', border: '#92400e' },
    'Asia':          { fill: '#dc2626', border: '#991b1b' },
    'Europe':        { fill: '#2563eb', border: '#1e3a8a' },
    'North America': { fill: '#059669', border: '#064e3b' },
    'South America': { fill: '#ea580c', border: '#9a3412' },
    'Oceania':       { fill: '#9333ea', border: '#581c87' },
    'Antarctica':    { fill: '#64748b', border: '#334155' },
    'default':       { fill: '#475569', border: '#1e293b' }
  };

  private readonly ISO3_CONTINENT: Record<string, string> = {
    // Africa
    DZA:'Africa',AGO:'Africa',BEN:'Africa',BWA:'Africa',BFA:'Africa',BDI:'Africa',CMR:'Africa',
    CPV:'Africa',CAF:'Africa',TCD:'Africa',COM:'Africa',COD:'Africa',COG:'Africa',CIV:'Africa',
    DJI:'Africa',EGY:'Africa',GNQ:'Africa',ERI:'Africa',ETH:'Africa',GAB:'Africa',GMB:'Africa',
    GHA:'Africa',GIN:'Africa',GNB:'Africa',KEN:'Africa',LSO:'Africa',LBR:'Africa',LBY:'Africa',
    MDG:'Africa',MWI:'Africa',MLI:'Africa',MRT:'Africa',MUS:'Africa',MAR:'Africa',MOZ:'Africa',
    NAM:'Africa',NER:'Africa',NGA:'Africa',RWA:'Africa',STP:'Africa',SEN:'Africa',SLE:'Africa',
    SOM:'Africa',ZAF:'Africa',SSD:'Africa',SDN:'Africa',SWZ:'Africa',TZA:'Africa',TGO:'Africa',
    TUN:'Africa',UGA:'Africa',ZMB:'Africa',ZWE:'Africa',ESH:'Africa',REU:'Africa',MYT:'Africa',
    // Asia
    AFG:'Asia',ARM:'Asia',AZE:'Asia',BHR:'Asia',BGD:'Asia',BTN:'Asia',BRN:'Asia',KHM:'Asia',
    CHN:'Asia',CYP:'Asia',GEO:'Asia',IND:'Asia',IDN:'Asia',IRN:'Asia',IRQ:'Asia',ISR:'Asia',
    JPN:'Asia',JOR:'Asia',KAZ:'Asia',KWT:'Asia',KGZ:'Asia',LAO:'Asia',LBN:'Asia',MYS:'Asia',
    MDV:'Asia',MNG:'Asia',MMR:'Asia',NPL:'Asia',PRK:'Asia',OMN:'Asia',PAK:'Asia',PSE:'Asia',
    PHL:'Asia',QAT:'Asia',SAU:'Asia',SGP:'Asia',LKA:'Asia',SYR:'Asia',TWN:'Asia',TJK:'Asia',
    THA:'Asia',TLS:'Asia',TUR:'Asia',TKM:'Asia',ARE:'Asia',UZB:'Asia',VNM:'Asia',YEM:'Asia',
    KOR:'Asia',MAC:'Asia',HKG:'Asia',
    // Europe
    ALB:'Europe',AND:'Europe',AUT:'Europe',BLR:'Europe',BEL:'Europe',BIH:'Europe',BGR:'Europe',
    HRV:'Europe',CZE:'Europe',DNK:'Europe',EST:'Europe',FIN:'Europe',FRA:'Europe',DEU:'Europe',
    GRC:'Europe',HUN:'Europe',ISL:'Europe',IRL:'Europe',ITA:'Europe',XKX:'Europe',LVA:'Europe',
    LIE:'Europe',LTU:'Europe',LUX:'Europe',MKD:'Europe',MLT:'Europe',MDA:'Europe',MCO:'Europe',
    MNE:'Europe',NLD:'Europe',NOR:'Europe',POL:'Europe',PRT:'Europe',ROU:'Europe',RUS:'Europe',
    SMR:'Europe',SRB:'Europe',SVK:'Europe',SVN:'Europe',ESP:'Europe',SWE:'Europe',CHE:'Europe',
    UKR:'Europe',GBR:'Europe',VAT:'Europe',
    // North America
    ATG:'North America',BHS:'North America',BRB:'North America',BLZ:'North America',
    CAN:'North America',CRI:'North America',CUB:'North America',DMA:'North America',
    DOM:'North America',SLV:'North America',GRD:'North America',GTM:'North America',
    HTI:'North America',HND:'North America',JAM:'North America',MEX:'North America',
    NIC:'North America',PAN:'North America',KNA:'North America',LCA:'North America',
    VCT:'North America',TTO:'North America',USA:'North America',
    // South America
    ARG:'South America',BOL:'South America',BRA:'South America',CHL:'South America',
    COL:'South America',ECU:'South America',GUY:'South America',PRY:'South America',
    PER:'South America',SUR:'South America',URY:'South America',VEN:'South America',
    // Oceania
    AUS:'Oceania',FJI:'Oceania',KIR:'Oceania',MHL:'Oceania',FSM:'Oceania',NRU:'Oceania',
    NZL:'Oceania',PLW:'Oceania',PNG:'Oceania',WSM:'Oceania',SLB:'Oceania',TON:'Oceania',
    TUV:'Oceania',VUT:'Oceania',
    // Antarctica
    ATA:'Antarctica'
  };

  private readonly COMMUNITY_PROVINCES_FALLBACK: Record<string, string[]> = {
    'andalucia': ['Almeria', 'Cadiz', 'Cordoba', 'Granada', 'Huelva', 'Jaen', 'Malaga', 'Sevilla'],
    'aragon': ['Huesca', 'Teruel', 'Zaragoza'],
    'principado de asturias': ['Asturias'],
    'asturias': ['Asturias'],
    'islas baleares': ['Illes Balears'],
    'illes balears': ['Illes Balears'],
    'canarias': ['Las Palmas', 'Santa Cruz de Tenerife'],
    'cantabria': ['Cantabria'],
    'castilla y leon': ['Avila', 'Burgos', 'Leon', 'Palencia', 'Salamanca', 'Segovia', 'Soria', 'Valladolid', 'Zamora'],
    'castilla-la mancha': ['Albacete', 'Ciudad Real', 'Cuenca', 'Guadalajara', 'Toledo'],
    'castilla la mancha': ['Albacete', 'Ciudad Real', 'Cuenca', 'Guadalajara', 'Toledo'],
    'cataluna': ['Barcelona', 'Girona', 'Lleida', 'Tarragona'],
    'catalunya': ['Barcelona', 'Girona', 'Lleida', 'Tarragona'],
    'comunitat valenciana': ['Alicante', 'Castellon', 'Valencia'],
    'comunidad valenciana': ['Alicante', 'Castellon', 'Valencia'],
    'extremadura': ['Badajoz', 'Caceres'],
    'galicia': ['A Coruna', 'Lugo', 'Ourense', 'Pontevedra'],
    'comunidad de madrid': ['Madrid'],
    'madrid': ['Madrid'],
    'region de murcia': ['Murcia'],
    'murcia': ['Murcia'],
    'comunidad foral de navarra': ['Navarra'],
    'navarra': ['Navarra'],
    'pais vasco': ['Alava', 'Bizkaia', 'Gipuzkoa'],
    'euskadi': ['Alava', 'Bizkaia', 'Gipuzkoa'],
    'la rioja': ['La Rioja'],
    'ceuta': ['Ceuta'],
    'melilla': ['Melilla']
  };

  private async drawWorldCountries(): Promise<void> {
    if (!this.map) return;
    const L = await import('leaflet');

    if (this.worldCountriesLayer) {
      this.map.removeLayer(this.worldCountriesLayer);
    }

    const worldGeoJson = await this.loadWorldCountriesGeoJson();
    const features = worldGeoJson?.features ?? [];
    if (!features.length) {
      throw new Error('Sin geometrias mundiales');
    }

    this.worldCountriesLayer = L.geoJSON(worldGeoJson as any, {
      interactive: false,
      style: (feature: any) => {
        const iso3 = feature?.properties?.['ISO3166-1-Alpha-3'] ?? '';
        const continent = this.ISO3_CONTINENT[iso3] ?? 'default';
        const colors = this.CONTINENT_COLORS[continent] ?? this.CONTINENT_COLORS['default'];
        return {
          color: colors.border,
          weight: 0.9,
          fillColor: colors.fill,
          fillOpacity: 0.24,
          opacity: 0.88
        };
      }
    }).addTo(this.map);

    this.worldCountriesLayer.bringToBack();
    this.map.setView([22, 0], 3, { animate: false });
  }

  private async loadAutonomousCommunitiesGeoJson(): Promise<any> {
    if (this.autonomousCommunitiesGeoJson) {
      return this.autonomousCommunitiesGeoJson;
    }

    if (this.autonomousCommunitiesRequest) {
      return this.autonomousCommunitiesRequest;
    }

    this.autonomousCommunitiesRequest = (async () => {
      const response = await fetch(apiUrl('/api/examples/spain-ccaa.geojson'), { cache: 'force-cache' });
      if (!response.ok) {
        throw new Error('No se encontro el recurso de comunidades autonomas.');
      }

      const data = await response.json();
      if (data?.type !== 'FeatureCollection' || !Array.isArray(data?.features)) {
        throw new Error('El recurso de comunidades autonomas no es valido.');
      }

      this.autonomousCommunitiesGeoJson = data;
      return data;
    })();

    try {
      return await this.autonomousCommunitiesRequest;
    } finally {
      this.autonomousCommunitiesRequest = null;
    }
  }

  private async loadWorldCountriesGeoJson(): Promise<any> {
    if (this.worldCountriesGeoJson) {
      return this.worldCountriesGeoJson;
    }

    if (this.worldCountriesRequest) {
      return this.worldCountriesRequest;
    }

    this.worldCountriesRequest = (async () => {
      const response = await fetch(apiUrl('/api/examples/world-countries.simplified.geojson'), { cache: 'force-cache' });
      if (!response.ok) {
        throw new Error('No se encontro el recurso GeoJSON mundial.');
      }

      const data = await response.json();
      if (data?.type !== 'FeatureCollection' || !Array.isArray(data?.features)) {
        throw new Error('El GeoJSON mundial no es valido.');
      }

      this.worldCountriesGeoJson = data;
      return data;
    })();

    try {
      return await this.worldCountriesRequest;
    } finally {
      this.worldCountriesRequest = null;
    }
  }

  private extractTownName(feature: any): string | null {
    const properties = feature?.properties;
    if (!properties) return null;

    const townRaw =
      properties.town ??
      properties.pueblo ??
      properties.municipio ??
      properties.name ??
      properties.NAME ??
      properties.NAMEASCII ??
      properties.NAMEPAR ??
      properties.nameascii ??
      properties.name_es ??
      properties.admin ??
      properties.city ??
      properties.adm1name ??
      properties.adm0name;

    if (!townRaw) return null;

    const name = String(townRaw).trim();
    return name || null;
  }

  private async buildShapefileSource(
    files: File[]
  ): Promise<ArrayBuffer | { shp: ArrayBuffer; dbf?: ArrayBuffer; shx?: ArrayBuffer; prj?: ArrayBuffer; cpg?: ArrayBuffer }> {
    const lowerNameMap = new Map(files.map((file) => [file.name.toLowerCase(), file]));
    const zipFile = files.find((file) => file.name.toLowerCase().endsWith('.zip'));

    if (zipFile) {
      return zipFile.arrayBuffer();
    }

    const shpFile = Array.from(lowerNameMap.values()).find((file) => file.name.toLowerCase().endsWith('.shp'));
    const dbfFile = Array.from(lowerNameMap.values()).find((file) => file.name.toLowerCase().endsWith('.dbf'));
    const shxFile = Array.from(lowerNameMap.values()).find((file) => file.name.toLowerCase().endsWith('.shx'));
    const prjFile = Array.from(lowerNameMap.values()).find((file) => file.name.toLowerCase().endsWith('.prj'));
    const cpgFile = Array.from(lowerNameMap.values()).find((file) => file.name.toLowerCase().endsWith('.cpg'));

    if (!shpFile || !dbfFile || !shxFile) {
      throw new Error('Faltan archivos obligatorios del shapefile.');
    }

    const source: { shp: ArrayBuffer; dbf?: ArrayBuffer; shx?: ArrayBuffer; prj?: ArrayBuffer; cpg?: ArrayBuffer } = {
      shp: await shpFile.arrayBuffer(),
      dbf: await dbfFile.arrayBuffer()
    };

    // shpjs no requiere siempre .shx/.prj/.cpg, pero se intenta incluir todo lo disponible.
    if (shxFile) source.shx = await shxFile.arrayBuffer();
    if (prjFile) source.prj = await prjFile.arrayBuffer();
    if (cpgFile) source.cpg = await cpgFile.arrayBuffer();

    return source;
  }

  private async drawTownContours(): Promise<void> {
    if (!this.map || !this.townCenters.size) return;
    const L = await import('leaflet');

    const boundaryLayers: any[] = [];
    const townEntries = Array.from(this.townCenters.entries());

    for (const [town, center] of townEntries) {
      const boundaryGeoJson = await this.getTownBoundaryGeoJson(town);

      if (boundaryGeoJson) {
        const boundaryLayer = L.geoJSON(boundaryGeoJson as any, {
          style: {
            color: '#f97316',
            weight: 2,
            dashArray: '6 4',
            fillColor: '#fb923c',
            fillOpacity: 0.09
          }
        });

        boundaryLayer.bindTooltip(`Limite municipal: ${town}`, { direction: 'top' });
        boundaryLayers.push(boundaryLayer);
        continue;
      }

      // Fallback visual si no hay limite municipal en la respuesta.
      const contour = L.circle([center.lat, center.lng], {
        radius: 3000,
        color: '#f97316',
        weight: 2,
        dashArray: '8 6',
        fillColor: '#fb923c',
        fillOpacity: 0.05
      }).bindTooltip(`Contorno aproximado: ${town}`, { direction: 'top' });

      boundaryLayers.push(contour);
    }

    this.townContoursLayer = L.layerGroup(boundaryLayers).addTo(this.map);
  }

  private async getTownBoundaryGeoJson(town: string): Promise<any | null> {
    if (this.townBoundaryCache.has(town)) {
      return this.townBoundaryCache.get(town) ?? null;
    }

    try {
      const url = apiUrl(`/api/geocode/search?q=${encodeURIComponent(town + ', Spain')}&format=geojson&polygon_geojson=1&countrycodes=es&limit=1&lang=${this.language.currentLanguage()}`);
      const response = await fetch(url);

      if (!response.ok) {
        this.townBoundaryCache.set(town, null);
        return null;
      }

      const data = await response.json();
      const firstFeature = data?.features?.[0];
      const geometryType = firstFeature?.geometry?.type;
      const hasPolygon = geometryType === 'Polygon' || geometryType === 'MultiPolygon';

      if (hasPolygon) {
        const boundary = {
          type: 'FeatureCollection',
          features: [firstFeature]
        };
        this.townBoundaryCache.set(town, boundary);
        return boundary;
      }

      this.townBoundaryCache.set(town, null);
      return null;
    } catch {
      this.townBoundaryCache.set(town, null);
      return null;
    }
  }

  private normalizeGeoJson(data: any): any {
    if (!data) return null;
    if (data.type === 'FeatureCollection') return data;
    if (Array.isArray(data)) {
      const allFeatures = data.flatMap((item) => item?.features ?? []);
      return { type: 'FeatureCollection', features: allFeatures };
    }
    return null;
  }

  private getBuiltInExampleGeoJson(): any {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { town: 'Aranda de Duero', name: 'Red Principal Norte' },
          geometry: {
            type: 'LineString',
            coordinates: [[-3.6908, 41.673], [-3.684, 41.6692], [-3.6772, 41.6658]]
          }
        },
        {
          type: 'Feature',
          properties: { town: 'Calatayud', name: 'Tramo Industrial' },
          geometry: {
            type: 'LineString',
            coordinates: [[-1.6489, 41.355], [-1.6417, 41.3521], [-1.6331, 41.3493]]
          }
        },
        {
          type: 'Feature',
          properties: { town: 'Ubeda', name: 'Conduccion Este' },
          geometry: {
            type: 'LineString',
            coordinates: [[-3.3718, 38.0098], [-3.3649, 38.0072], [-3.3572, 38.0044]]
          }
        }
      ]
    };
  }
}
