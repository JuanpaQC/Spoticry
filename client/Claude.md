# SpotiCry — Cliente React

## Contexto del proyecto
Tarea programada de Lenguajes de Programación, TEC San Carlos.
Cliente web de streaming de música. Se conecta al servidor Rust para metadata y playlists.

## Stack
- **Framework:** React 18 + TypeScript (strict mode)
- **Build:** Vite
- **Estilos:** Tailwind CSS
- **Estado global:** Zustand
- **HTTP:** fetch nativo — sin axios
- **Audio:** Web Audio API nativa del browser
- **Routing:** React Router v6

## Fuentes de datos
- **Metadata de canciones / playlists:** servidor Rust en `http://localhost:8080`
- **Audio (.mp3) e imágenes:** Supabase Storage — URLs públicas que vienen en el campo `song_url` e `image_url` de cada canción. El browser las descarga directo, sin pasar por Rust.

## Estructura
```
src/
  main.tsx
  App.tsx
  api/
    client.ts        ← TODAS las llamadas al servidor Rust (fetch)
    types.ts         ← tipos: Song, Playlist, SearchParams, etc.
  components/
    Player/          ← reproductor con buffer local, controles, progress bar
    SongList/        ← lista de canciones
    SongCard/        ← tarjeta individual con imagen y botón play
    SearchBar/       ← barra con los 3 criterios de búsqueda
    PlaylistPanel/   ← sidebar con playlists
    PlaylistDetail/  ← vista detalle de una playlist
  store/
    playerStore.ts   ← canción activa, estado play/pause, buffer (Zustand)
    playlistStore.ts ← playlists en memoria (Zustand)
  pages/
    Home.tsx
    PlaylistPage.tsx
```

## Contrato de API
Ver `../api-spec.md`. El servidor corre en `http://localhost:8080`.
TODAS las llamadas HTTP van a través de `src/api/client.ts` — nunca fetch directo en componentes.

## Reglas de programación

### General
- TypeScript strict — prohibido `any`
- Comentarios en español, código en inglés
- Un componente por carpeta con `index.tsx`
- Props siempre con interfaces explícitas
- Responderme en español

### Funcional (para la tarea)
- Transformaciones de listas con `.map()`, `.filter()`, `.reduce()` — sin loops imperativos
- Sin mutación directa de estado — spread operator o métodos inmutables
- Componentes funcionales siempre (sin clases)

```tsx
// ✅ Así sí
const filtered = songs.filter(s => s.genre === selected)

// ❌ Así no
const filtered = []
for (const s of songs) {
  if (s.genre === selected) filtered.push(s)
}
```

## Reproductor de audio — flujo completo (requisito clave)

El audio viene de Supabase Storage via la `song_url` de la canción.
Se descarga completo al buffer para poder hacer seek (adelantar/retroceder).

```
1. Usuario clickea play en una canción
2. POST /songs/play/:id  → avisar al servidor
3. fetch(song_url)       → descargar los bytes del .mp3 desde Supabase
4. audioCtx.decodeAudioData(bytes) → decodificar a AudioBuffer
5. Guardar AudioBuffer en playerStore
6. Reproducir con AudioBufferSourceNode
7. Al detener/terminar: POST /songs/stop/:id
```

Solo la canción activa tiene buffer en memoria. Al cambiar de canción, el buffer anterior se descarta.
El seek se hace con `AudioBufferSourceNode.start(0, offsetSeconds)`.

## Diseño visual
- Tema oscuro estilo Spotify
- Fondo: `#121212`, superficies: `#1e1e1e`, acento: `#1db954`
- Fuente: Inter (Google Fonts)
- Layout: sidebar izquierda (playlists) + área central + player fijo abajo

## Comandos
```bash
npm run dev     # dev server en localhost:5173
npm run build   # build de producción
npm run lint    # ESLint
```

## Variables de entorno (.env)
```
VITE_API_URL=http://localhost:8080
```
Usar `import.meta.env.VITE_API_URL` — nunca hardcodear URLs.

## Archivos que NUNCA tocar sin preguntar
- `vite.config.ts`
- `tailwind.config.ts`
- `package-lock.json`