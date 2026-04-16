import { Component, ViewChild, AfterViewInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MapViewerComponent } from '../../components/map-viewer/map-viewer.component';
import { MapLayer, ModalCity, SavedCity, SearchResult } from '../../models/maps.models';
import { ThemePickerComponent } from '../../../../components/theme-picker/theme-picker.component';
import { LanguagePickerComponent } from '../../../../components/language-picker/language-picker.component';
import { LanguageService } from '../../../../services/language.service';
import { AuthService } from '../../../../services/auth.service';
import { apiUrl } from '../../../../config/api.config';

@Component({
  selector: 'app-maps-page',
  standalone: true,
  imports: [MapViewerComponent, FormsModule, CommonModule, RouterModule, ThemePickerComponent, LanguagePickerComponent],
  templateUrl: './maps-page.component.html',
  styleUrl: './maps-page.component.scss'
})

export class MapsPageComponent implements AfterViewInit, OnDestroy {
  public language = inject(LanguageService);
  private authService = inject(AuthService);
  private router = inject(Router);

  async logout(): Promise<void> {
    this.authService.logout();
    await this.router.navigateByUrl('/login');
  }

  public title = 'Mapas Interactivos';

  public onSearchInput(value: string): void {
    this.searchQuery.set(value);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    const query = value.trim();
    if (query.length < 2) {
      this.searchResults.set([]);
      this.searchError.set('');
      this.isSearching.set(false);
      return;
    }

    this.searchTimeout = setTimeout(() => {
      void this.searchCities(query);
    }, 350);
  }

  public limpiarBusqueda(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.searchError.set('');
  }

  public seleccionarResultado(result: any): void {
    if (this.mapViewer) {
      this.mapViewer.goToLocation(Number(result.lat), Number(result.lon));
    }
    this.showModal.set(true);
    this.modalCity.set({
      name: result.display_name,
      lat: Number(result.lat),
      lng: Number(result.lon ?? result.lng),
    });
    this.resetModalPosition();
  }

  public onGeoJsonFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const geojson = JSON.parse(e.target.result);
          if (this.mapViewer && typeof this.mapViewer.loadGeoJson === 'function') {
            this.mapViewer.loadGeoJson(geojson);
          }
        } catch (err) {
          this.searchError.set('Archivo GeoJSON inválido.');
        }
      };
      reader.readAsText(file);
    }
  }

  public onZoomIn(): void {
    if (this.mapViewer) this.mapViewer.zoomIn();
  }

  public onZoomOut(): void {
    if (this.mapViewer) this.mapViewer.zoomOut();
  }

  public toggleLayerPanel(): void {
    this.showLayerPanel.set(!this.showLayerPanel());
  }

  public setLayer(layer: MapLayer): void {
    this.selectedLayer.set(layer);
    if (this.mapViewer) {
      this.mapViewer.setBaseLayer(layer);
    }
  }

  public goToMadrid(): void {
    if (this.mapViewer) this.mapViewer.goToLocation(40.4168, -3.7038);
  }

  public goToBarcelona(): void {
    if (this.mapViewer) this.mapViewer.goToLocation(41.3874, 2.1686);
  }

  public goToValencia(): void {
      if (this.mapViewer) this.mapViewer.goToLocation(39.4699, -0.3763);
    }

    public irACiudadGuardada(city: any): void {
      if (this.mapViewer) this.mapViewer.goToLocation(city.lat, city.lng);
    }

    public selectedLayerToUpper(): string {
      return this.selectedLayer().toUpperCase();
    }

    public modalPositionX(): number {
      return this.modalPosition().x;
    }

    public modalPositionY(): number {
      return this.modalPosition().y;
    }
  ngAfterViewInit(): void {
    void this.loadSavedNotes();
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.detachModalDragListeners();
  }
  @ViewChild(MapViewerComponent) mapViewer!: MapViewerComponent;
  readonly auth = inject(AuthService);

  readonly searchQuery = signal('');
  readonly searchResults = signal<SearchResult[]>([]);
  readonly isSearching = signal(false);
  readonly searchError = signal('');

  readonly showModal = signal(false);
  readonly modalCity = signal<ModalCity | null>(null);
  readonly modalComment = signal('');
  readonly modalPosition = signal({ x: 0, y: 0 });

  readonly savedCities = signal<SavedCity[]>([]);
  readonly isSavingNote = signal(false);
  readonly notesError = signal('');

  readonly showLayerPanel = signal(false);
  readonly selectedLayer = signal<MapLayer>('osm');

  readonly canSave = computed(() => this.modalComment().trim().length > 0);

  private searchTimeout: any;
  private draggingModal = false;
  private dragOffset = { x: 0, y: 0 };
  private readonly modalApproxHeight = 360;


  public cerrarModal(): void {
    this.draggingModal = false;
    this.detachModalDragListeners();
    this.showModal.set(false);
    this.modalCity.set(null);
    this.modalComment.set('');
    this.notesError.set('');
  }

  public startModalDrag(event: PointerEvent): void {
    if (!this.showModal()) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    event.preventDefault();
    this.draggingModal = true;
    const current = this.modalPosition();
    this.dragOffset = {
      x: event.clientX - current.x,
      y: event.clientY - current.y,
    };

    window.addEventListener('pointermove', this.handleModalDragMove);
    window.addEventListener('pointerup', this.handleModalDragEnd);
    window.addEventListener('pointercancel', this.handleModalDragEnd);
  }

  public soloMarcar(): void {
    const city = this.modalCity();
    if (city) {
      this.mapViewer.addMarkerWithComment(city.lat, city.lng, city.name);
    }
    this.cerrarModal();
  }

  public async guardarConComentario(): Promise<void> {
    const city = this.modalCity();
    const comment = this.modalComment().trim();
    if (!city || !comment) return;

    this.isSavingNote.set(true);
    this.notesError.set('');

    try {
      const response = await fetch(apiUrl('/api/db/notas'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: this.auth.username() || null,
          name: city.name,
          lat: city.lat,
          lng: city.lng,
          comment
        })
      });

      if (!response.ok) {
        throw new Error('No se pudo guardar la nota.');
      }

      const saved = await response.json() as SavedCity;
      this.mapViewer.addMarkerWithComment(Number(saved.lat), Number(saved.lng), saved.name, saved.comment, saved.id);
      this.savedCities.update((list) => [saved, ...list]);
      this.cerrarModal();
    } catch {
      this.notesError.set('No se pudo guardar la nota en la base de datos.');
    } finally {
      this.isSavingNote.set(false);
    }
  }

  // Setter para ngModelChange de modalComment
  public setModalComment(val: string): void {
    this.modalComment.set(val);
  }

  // ...existing code...

  async onNoteMoved(event: { noteId: number; lat: number; lng: number }): Promise<void> {
    this.savedCities.update((list) =>
      list.map((note) =>
        note.id === event.noteId
          ? { ...note, lat: event.lat, lng: event.lng }
          : note
      )
    );

    try {
      const response = await fetch(apiUrl(`/api/db/notas/${event.noteId}/posicion`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: event.lat,
          lng: event.lng,
          username: this.auth.username() || null
        })
      });

      if (!response.ok) {
        throw new Error('No se pudo mover la nota.');
      }
    } catch {
      this.notesError.set('No se pudo actualizar la posicion de la nota.');
      void this.loadSavedNotes();
    }
  }

  // ...existing code...

  private async loadSavedNotes(): Promise<void> {
    this.notesError.set('');

    try {
      const username = this.auth.username();
      const query = username ? `?username=${encodeURIComponent(username)}` : '';
      const response = await fetch(apiUrl(`/api/db/notas${query}`));
      if (!response.ok) {
        throw new Error('No se pudieron cargar las notas.');
      }

      const notes = await response.json() as SavedCity[];
      this.savedCities.set(notes);
      notes
        .slice()
        .reverse()
        .forEach((note) => this.mapViewer.addMarkerWithComment(Number(note.lat), Number(note.lng), note.name, note.comment, note.id));
    } catch {
      this.notesError.set('No se pudieron cargar las notas guardadas.');
    }
  }

  private async searchCities(query: string): Promise<void> {
    this.isSearching.set(true);
    this.searchError.set('');

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '5',
        countrycodes: 'es',
        lang: this.language.currentLanguage(),
      });

      const response = await fetch(apiUrl(`/api/geocode/search?${params.toString()}`));
      if (!response.ok) {
        throw new Error('search-failed');
      }

      const results = await response.json() as SearchResult[];
      this.searchResults.set(results);

      if (!results.length) {
        this.searchError.set(this.language.t('maps.searchNoResults'));
      }
    } catch {
      this.searchResults.set([]);
      this.searchError.set(this.language.t('maps.searchError'));
    } finally {
      this.isSearching.set(false);
      this.searchTimeout = null;
    }
  }

  private resetModalPosition(): void {
    const modalWidth = Math.min(384, window.innerWidth - 32);
    this.modalPosition.set({
      x: Math.max(16, Math.round((window.innerWidth - modalWidth) / 2)),
      y: Math.max(16, Math.round((window.innerHeight - this.modalApproxHeight) / 2)),
    });
  }

  private readonly handleModalDragMove = (event: PointerEvent): void => {
    if (!this.draggingModal) return;

    event.preventDefault();

    const modalWidth = Math.min(384, window.innerWidth - 32);
    const minX = 8;
    const minY = 8;
    const maxX = Math.max(minX, window.innerWidth - modalWidth - 8);
    const maxY = Math.max(minY, window.innerHeight - this.modalApproxHeight - 8);

    const nextX = event.clientX - this.dragOffset.x;
    const nextY = event.clientY - this.dragOffset.y;

    this.modalPosition.set({
      x: Math.min(maxX, Math.max(minX, nextX)),
      y: Math.min(maxY, Math.max(minY, nextY)),
    });
  };

  private readonly handleModalDragEnd = (): void => {
    this.draggingModal = false;
    this.detachModalDragListeners();
  };

  private detachModalDragListeners(): void {
    window.removeEventListener('pointermove', this.handleModalDragMove);
    window.removeEventListener('pointerup', this.handleModalDragEnd);
    window.removeEventListener('pointercancel', this.handleModalDragEnd);
  }
}
