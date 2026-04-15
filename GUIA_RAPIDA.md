# 🗺️ Guía de Inicio Rápido - Mapas Interactivos Angular + Leaflet + Tailwind

## ✅ Proyecto Completado

Tu proyecto **Angular 20** con **Leaflet** y **Tailwind CSS** está listo.

### 📊 Estado de Compilación
- ✅ **Compilación exitosa** 
- 📦 **Tamaño del bundle**: 1.68 MB (incluye Leaflet en lazy load)
- 🚀 **Estructura**: Browser + Server bundles (SSR compatible)

---

## 🚀 Cómo Ejecutar

### Opción 1: Servidor de Desarrollo (Recomendado)
```bash
cd leaflet-maps
npm start
```

O:
```bash
ng serve
```

El servidor estará en: **http://localhost:4200**

### Opción 2: Build Producción
```bash
npm run build
```

### Opción 3: Comando Corto
```bash
npm run build:prod
```

---

## 📁 Archivos Creados

### Componentes
- **`src/app/components/map-viewer.ts`** - Componente principal del mapa
- **`src/app/components/map-viewer.html`** - Template HTML
- **`src/app/components/map-viewer.scss`** - Estilos del mapa
- **`src/app/components/advanced-map.ts`** - Ejemplos avanzados (referencia)

### Servicios
- **`src/app/services/map.service.ts`** - Servicio centralizado del mapa

### Configuración
- **`src/app/config/map.config.ts`** - Constantes y configuraciones
- **`tailwind.config.js`** - Configuración de Tailwind CSS v3
- **`postcss.config.js`** - Configuración de PostCSS

### Estilos Globales
- **`src/styles.scss`** - Directivas de Tailwind + estilos globales

---

## 🎯 Características Implementadas

✅ **Mapa Interactivo** con OpenStreetMap
✅ **Controles de Zoom** (+/-)
✅ **Navegación a Ciudades** (Madrid, Barcelona, Valencia)
✅ **Sidebar Personalizado** con Tailwind CSS
✅ **Responsive Design** (adapta a móvil)
✅ **Marcadores Dinámicos**
✅ **Servicios Reutilizables**
✅ **TypeScript Tipado**

---

## 🎨 Uso de Tailwind CSS

El proyecto usa **Tailwind CSS v3** con clases utilidad, por ejemplo:

```html
<!-- Colores -->
<div class="bg-blue-500 text-white">Azul</div>

<!-- Espaciado -->
<div class="px-4 py-2 m-4">Con padding y margen</div>

<!-- Responsive -->
<div class="hidden md:block">Visible en pantallas grandes</div>

<!-- Bordes y sombras -->
<div class="rounded-lg shadow-lg">Con estilo</div>
```

---

## 🗺️ Uso del Servicio de Mapas

```typescript
import { MapService } from './services/map.service';

export class MyComponent {
  constructor(private mapService: MapService) {}

  ngOnInit() {
    this.mapService.initializeMap('mapa-id');
    this.mapService.addMarker('m1', 40.4168, -3.7038, 'Madrid');
    this.mapService.setZoom(15);
    this.mapService.fitBounds();
  }
}
```

---

## 📚 Métodos Disponibles del Servicio

### Inicialización
- `initializeMap(containerId, lat, lng, zoom)` - Crear mapa

### Marcadores
- `addMarker(id, lat, lng, label, icon?)` - Agregar marcador
- `removeMarker(id)` - Eliminar marcador
- `getMarkers()` - Obtener todos
- `clearMarkers()` - Limpiar todos

### Círculos
- `addCircle(id, lat, lng, radius, color)` - Agregar círculo
- `removeCircle(id)` - Eliminar círculo
- `getCircles()` - Obtener todos
- `clearCircles()` - Limpiar todos

### Control del Mapa
- `setZoom(level)` - Cambiar zoom
- `getZoom()` - Obtener zoom actual
- `setCenter(lat, lng)` - Centrar mapa
- `getCenter()` - Obtener centro
- `fitBounds()` - Ajustar a marcadores

### Eventos
- `onMapClick(callback)` - Responder a clicks
- `offMapClick()` - Desactivar clicks

---

## 🔧 Estructura de Carpetas

```
leaflet-maps/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── map-viewer.ts
│   │   │   ├── map-viewer.html
│   │   │   ├── map-viewer.scss
│   │   │   ├── advanced-map.ts (referencia)
│   │   │   ├── advanced-map.html
│   │   │   └── advanced-map.scss
│   │   ├── services/
│   │   │   └── map.service.ts
│   │   ├── config/
│   │   │   └── map.config.ts
│   │   ├── app.ts
│   │   ├── app.html
│   │   ├── app.scss
│   │   └── app.routes.ts
│   ├── styles.scss
│   ├── main.ts
│   └── index.html
├── tailwind.config.js
├── postcss.config.js
├── angular.json
└── package.json
```

---

## 💡 Próximos Pasos (Ideas de Mejora)

1. **Agregar Búsqueda de Ubicaciones** (Geocoding)
   ```bash
   npm install leaflet-nominatim
   ```

2. **Cluster de Marcadores**
   ```bash
   npm install leaflet.markercluster
   ```

3. **Rutas entre Puntos**
   ```bash
   npm install leaflet-routing-machine
   ```

4. **Mapas de Calor**
   ```bash
   npm install leaflet-heatmap
   ```

5. **Dibujar en el Mapa**
   ```bash
   npm install leaflet-draw @types/leaflet-draw
   ```

6. **Otros Proveedores de Mapas**
   - CartoDB (dark/light)
   - Stamen (terrain/transport)
   - USGS Imagery

---

## 🐛 Troubleshooting

### El mapa no se ve
- Verifica que el contenedor tiene `id="map"`
- Asegúrate que tiene `height: 100vh` en CSS
- Abre la consola (F12) para ver errores

### Leaflet no carga
- Espera a que se cargue el módulo (import dinámico)
- Revisa la red en DevTools

### Tailwind CSS no aplica estilos
- Limpia el cache: `npm run build`
- Reinicia el servidor: `npm start`
- Verifica que las clases estén en Content paths

### Error al compilar
- Limpia node_modules: `rm -r node_modules && npm install`
- Verifica Node.js v18+: `node --version`

---

## 📞 Recursos Útiles

- **Angular Docs**: https://angular.dev
- **Leaflet Docs**: https://leafletjs.com
- **Tailwind Docs**: https://tailwindcss.com
- **OpenStreetMap**: https://www.openstreetmap.org
- **Leaflet Plugins**: https://leafletjs.com/plugins

---

## 📝 Dependencias Instaladas

```json
{
  "Angular": "^20",
  "Leaflet": "^1.9",
  "Tailwind CSS": "^3",
  "PostCSS": "^8",
  "TypeScript": "^5"
}
```

---

## ✨ Características Especiales

- 🚀 **Standalone Components** (Angular 20 moderne)
- 📦 **Lazy Loading** de Leaflet (mejor performance)
- 🎨 **Tailwind v3** completamente configurado
- 📱 **Responsive Design** out-of-the-box
- 🔧 **TypeScript Strict** habilitado
- 📊 **SSR Compatible** (modo static)

---

**¡Listo para comenzar! Ejecuta `npm start` y abre tu navegador en http://localhost:4200**

🎉 **¡Feliz desarrollo!**
