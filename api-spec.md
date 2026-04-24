# SpotiCry — API Contract

Ambos módulos deben respetar este contrato.
Cualquier cambio debe ser acordado entre los dos antes de implementar.

---

## Arquitectura de datos

```
Supabase
├── Storage
│   ├── images/     ← portadas de álbumes (.jpg/.png)
│   └── songs/      ← archivos de audio (.mp3)
└── Database
    └── tabla: songs
        ├── id          (uuid, primary key)
        ├── name        (text)
        ├── artist      (text)
        ├── genre       (text)
        ├── song_url    (text) ← URL pública del .mp3 en Storage
        └── image_url   (text) ← URL pública de la imagen en Storage
```

## Flujo de reproducción

```
Cliente React
    │
    ├─1─► GET /songs/search?... → Rust consulta Supabase DB
    │                           ← devuelve lista con song_url incluida
    │
    └─2─► <audio src="{song_url}"> → browser descarga directo desde Supabase Storage
                                     Rust NO toca bytes de audio
```

El servidor Rust actúa como intermediario para búsquedas, playlists y lógica de negocio.
El audio lo sirve Supabase Storage directamente al browser.

---

## Base URL del servidor Rust

```
http://localhost:8080
```

Formato de respuestas: siempre JSON.
Errores: `{ "error": "descripción" }` con el HTTP status correspondiente.

---

## Modelo Song

```json
{
  "id": "uuid",
  "name": "Bohemian Rhapsody",
  "artist": "Queen",
  "genre": "Rock",
  "song_url": "https://xxx.supabase.co/storage/v1/object/public/songs/bohemian.mp3",
  "image_url": "https://xxx.supabase.co/storage/v1/object/public/images/queen.jpg"
}
```

---

## Endpoints — Canciones

### GET /songs
Retorna todas las canciones (cargadas desde Supabase DB al iniciar el servidor).

**Response 200:** array de Song

---

### GET /songs/search
Busca canciones. Los 3 criterios usan lógica distinta en Rust.

**Query params:**
- `name` → substring en nombre (case-insensitive) — búsqueda textual parcial
- `artist` → coincidencia exacta — búsqueda por igualdad estricta
- `genre` → filtro por categoría — búsqueda por enum/tag

**Ejemplos:**
```
GET /songs/search?name=bohemian
GET /songs/search?artist=Queen
GET /songs/search?genre=Rock
```

**Response 200:** array de Song filtrado

---

### POST /songs/play/:id
Registra que una canción está siendo reproducida (bloquea su eliminación).

**Response 200:** `{ "ok": true }`

---

### POST /songs/stop/:id
Registra que la reproducción terminó.

**Response 200:** `{ "ok": true }`

---

### DELETE /songs/:id
Elimina una canción. Falla si está siendo reproducida.

**Response 200:** `{ "ok": true }`
**Response 409:** `{ "error": "Song is currently playing" }`

---

## Endpoints — Playlists

> Lógica funcional obligatoria en Rust: map/filter/fold, sin mutabilidad.
> Se guardan en memoria del servidor.

### GET /playlists
**Response 200:**
```json
[{ "id": "uuid", "name": "Mis favoritas", "song_ids": ["uuid1"] }]
```

### POST /playlists
**Body:** `{ "name": "string" }`
**Response 201:** `{ "id": "uuid", "name": "string", "song_ids": [] }`

### GET /playlists/:id
Retorna la playlist con las canciones completas (join en memoria).
**Response 200:** `{ "id", "name", "songs": [ ...Song... ] }`

### POST /playlists/:id/songs
**Body:** `{ "song_id": "uuid" }`
**Response 200:** playlist actualizada

### DELETE /playlists/:id/songs/:song_id
**Response 200:** playlist actualizada

### GET /playlists/:id/search
Filtra canciones dentro de una playlist. Mismos query params que /songs/search.
**Response 200:** array de Song

### POST /playlists/:id/transform
Transformación funcional — retorna nueva lista, no modifica la original.

**Body:**
```json
{ "operation": "sort_by_name" | "sort_by_artist" | "sort_by_genre" | "reverse" | "limit", "value": 10 }
```
**Response 200:** array de Song transformadas

### DELETE /playlists/:id
**Response 200:** `{ "ok": true }`

---

## Decisiones de diseño documentadas

- ✅ Audio directo desde Supabase Storage al browser — Rust no maneja bytes de audio
- ✅ Canciones: cargadas de Supabase DB al iniciar, luego en memoria (Vec<Song>)
- ✅ Playlists: en memoria del servidor (se pierden al reiniciar — OK para la tarea)
- ✅ HTTP/JSON en vez de TCP puro — justificado: React en browser no puede abrir raw TCP
- ✅ Puerto 8080, CORS habilitado para localhost:5173