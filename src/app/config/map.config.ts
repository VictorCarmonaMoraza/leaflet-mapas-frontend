/**
 * CONFIGURACIONES Y CONSTANTES DEL PROYECTO
 */

// Ubicaciones predefinidas
export const UBICACIONES_PREDEFINIDAS = {
  MADRID: { lat: 40.4168, lng: -3.7038, zoom: 13, nombre: 'Madrid' },
  BARCELONA: { lat: 41.3851, lng: 2.1734, zoom: 13, nombre: 'Barcelona' },
  VALENCIA: { lat: 39.4699, lng: -0.3763, zoom: 13, nombre: 'Valencia' },
  SEVILLA: { lat: 37.3891, lng: -5.9845, zoom: 13, nombre: 'Sevilla' },
  BILBAO: { lat: 43.2627, lng: -2.9253, zoom: 13, nombre: 'Bilbao' },
  ESPAÑA: { lat: 40.0, lng: -3.0, zoom: 6, nombre: 'España' }
};

// Configuración de proveedores de tiles
export const TILE_PROVIDERS = {
  OPENSTREETMAP: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    name: 'OpenStreetMap'
  },
  OPENTOPOMAP: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap',
    name: 'OpenTopoMap'
  },
  CARTODB_POSITRON: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB',
    name: 'CartoDB Positron'
  },
  CARTODB_VOYAGER: {
    url: 'https://{s}.basemaps.cartocdn.com/rastered/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© CartoDB',
    name: 'CartoDB Voyager'
  }
};

// Colores personalizados
export const CUSTOM_COLORS = {
  PRIMARY: '#3B82F6',
  SECONDARY: '#10B981',
  DANGER: '#EF4444',
  WARNING: '#F59E0B',
  INFO: '#06B6D4',
  DARK: '#1F2937',
  LIGHT: '#F3F4F6'
};

// Estilos de marcadores
export const MARKER_STYLES = {
  RED: 'red',
  BLUE: 'blue',
  GREEN: 'green',
  ORANGE: 'orange',
  YELLOW: 'yellow',
  VIOLET: 'violet',
  GREY: 'grey'
};

// Configuración de círculos
export const CIRCLE_CONFIG = {
  SMALL: { radius: 500, color: '#3B82F6' },
  MEDIUM: { radius: 2000, color: '#10B981' },
  LARGE: { radius: 5000, color: '#EF4444' }
};

// Configuración de zoom
export const ZOOM_CONFIG = {
  MIN: 2,
  MAX: 19,
  DEFAULT: 13,
  CITY: 13,
  REGION: 9,
  COUNTRY: 6,
  WORLD: 2
};

// Configuración de mapas
export const MAP_CONFIG = {
  ASPECT_RATIO: '16:9',
  DEFAULT_ZOOM: 13,
  DEFAULT_CENTER: [40.4168, -3.7038], // Madrid
  ANIMATION_DURATION: 500,
  MIN_ZOOM: 2,
  MAX_ZOOM: 19
};
