# Mapas Interactivos con Angular, Leaflet y Tailwind CSS

Proyecto Angular 20 con Leaflet para crear mapas interactivos con estilos modernos usando Tailwind CSS.

## 🚀 Características

- ✅ **Angular 20** - Framework moderno con componentes standalone
- 🗺️ **Leaflet** - Librería de mapas interactivos
- 🎨 **Tailwind CSS** - Framework CSS utilidad-first
- 🧭 **Controles de Navegación** - Zoom, pan, ubicaciones rápidas
- 📍 **Marcadores Dinámicos** - Agrega marcadores al hacer click
- 🌍 **Múltiples Ubicaciones** - Acceso rápido a Madrid, Barcelona, Valencia

## 📋 Requisitos

- Node.js 18+ 
- npm 9+
- Angular CLI 20+

## 🛠️ Instalación

El proyecto ya está configurado. Solo necesitas instalar dependencias (ya están instaladas):

```bash
npm install
```

## 🎯 Uso

### Iniciar servidor de desarrollo

```bash
npm start
```

O usando Angular CLI:

```bash
ng serve
```

El servidor estará disponible en `http://localhost:4200/`

### Construir para producción

```bash
ng build
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── map-viewer.ts          # Componente principal del mapa
│   │   ├── map-viewer.html        # Template HTML
│   │   └── map-viewer.scss        # Estilos del componente
│   ├── app.ts                      # Componente raíz
│   ├── app.html                    # Template raíz con sidebar
│   ├── app.scss                    # Estilos globales
│   └── app.routes.ts               # Configuración de rutas
├── styles.scss                     # Estilos globales (Tailwind)
├── main.ts                         # Punto de entrada
└── index.html                      # HTML principal

tailwind.config.js                  # Configuración de Tailwind CSS
postcss.config.js                   # Configuración de PostCSS
```

## 🗺️ Funcionalidades Implementadas

### Componente MapViewer
- Inicialización de mapa con OpenStreetMap
- Marcador inicial en Madrid
- Círculo de ejemplo
- Métodos públicos:
  - `addMarker(lat, lng, label)` - Agregar marcador
  - `changeZoom(zoomLevel)` - Cambiar nivel de zoom
  - `centerMap(lat, lng)` - Centrar el mapa

### Controles Disponibles
- **Botones Zoom +/-** - Controlar el zoom del mapa
- **Botones de Ubicaciones** - Navegar a ciudades predefinidas
- **Click en Mapa** - Agregar marcadores en la posición clickeada

## 🎨 Tailwind CSS

El proyecto incluye Tailwind CSS preconfigurado. Algunas clases útiles:

- `bg-{color}-{shade}` - Colores de fondo
- `text-{color}-{shade}` - Colores de texto
- `px-{size}` - Padding horizontal
- `py-{size}` - Padding vertical
- `rounded` - Bordes redondeados
- `shadow` - Sombras
- `transition` - Transiciones CSS

## 🌐 API de Leaflet

Principales métodos utilisados:

```typescript
// Crear mapa
L.map('map').setView([lat, lng], zoomLevel)

// Agregar proveedor de tiles
L.tileLayer('url', options).addTo(map)

// Crear marcador
L.marker([lat, lng]).bindPopup('texto').addTo(map)

// Crear círculo
L.circle([lat, lng], { radius, color }).addTo(map)

// Personalizar el mapa
map.setZoom(13)
map.setView([lat, lng])
```

## 📚 Recursos Útiles

- [Documentación Angular](https://angular.dev)
- [Leaflet Documentation](https://leafletjs.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [OpenStreetMap](https://www.openstreetmap.org/)

## 🐛 Troubleshooting

### Los estilos de Leaflet no se ven correctamente
Asegúrate de que Leaflet esté correctamente importado. El CSS debe importarse del paquete de node_modules.

### El mapa no aparece
Verifica que:
1. El elemento con id `map` exista en el HTML
2. El contenedor tenga height definida
3. No haya errores de console (F12)

### Problemas con Tailwind CSS
Limpia el caché:
```bash
npm run build
```

## 📝 Notas de Desarrollo

- El componente MapViewer es standalone, ideal para Angular 20
- Los controles están en la barra lateral con Tailwind CSS
- El mapa usa OpenStreetMap como proveedor por defecto (gratuito)
- Para producción, considera usar un mapa diferente o configurar caché

## 📦 Dependencias Principales

- `@angular/core@20` - Framework
- `leaflet@1.9+` - Mapas
- `tailwindcss@4+` - Estilos
- `postcss@8+` - Procesador CSS

## 🚀 Próximas Mejoras Sugeridas

- [ ] Agregar capa de controles personalizados
- [ ] Implementar búsqueda de ubicaciones (Geocoding)
- [ ] Agregar cluster de marcadores
- [ ] Exportar mapa como imagen
- [ ] Persistencia en localStorage
- [ ] Modo oscuro/claro
- [ ] Soporte de geolocalización
- [ ] Rutas entre puntos (Routing)

---

**Hecho con ❤️ usando Angular, Leaflet y Tailwind CSS**
