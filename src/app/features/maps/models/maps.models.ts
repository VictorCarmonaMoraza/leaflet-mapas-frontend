export interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export interface ModalCity {
  lat: number;
  lng: number;
  name: string;
}

export interface SavedCity {
  id?: number;
  lat: number;
  lng: number;
  name: string;
  comment: string;
  username?: string | null;
  created_at?: string;
}

export type MapLayer = 'osm' | 'hot' | 'topo';
