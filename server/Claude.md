# SpotiCry — Servidor Rust

## Contexto del proyecto
Tarea programada de Lenguajes de Programación, TEC San Carlos.
Servidor de streaming de música. Se conecta a Supabase para datos y archivos.

## Stack
- **Lenguaje:** Rust (edition 2021)
- **HTTP framework:** Axum 0.7
- **Runtime async:** Tokio
- **Serialización:** serde + serde_json
- **HTTP client (para Supabase):** reqwest
- **IDs:** uuid crate
- **Variables de entorno:** dotenvy
- **Concurrencia:** Arc<tokio::sync::RwLock<T>>

## Supabase
Las canciones viven en Supabase — el servidor las carga al iniciar y las guarda en memoria.

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

**Al arrancar el servidor:**
1. Hacer GET a `{SUPABASE_URL}/rest/v1/songs?select=*` con header `apikey: {SUPABASE_ANON_KEY}`
2. Deserializar la respuesta en `Vec<Song>`
3. Guardar en `AppState.songs`

A partir de ahí, toda búsqueda y filtrado se hace en memoria — sin volver a llamar a Supabase.

El audio NO lo maneja Rust. La `song_url` de cada canción apunta directo a Supabase Storage
y el cliente React la usa directamente en el tag `<audio>`.

## Estructura del proyecto
```
src/
  main.rs          ← setup Axum, rutas, estado compartido
  models.rs        ← structs Song, Playlist (con serde Deserialize/Serialize)
  store.rs         ← AppState con Arc<RwLock<...>>
  supabase.rs      ← función load_songs() que llama a la REST API de Supabase
  handlers/
    songs.rs       ← GET /songs, GET /songs/search, DELETE, play/stop
    playlists.rs   ← todos los endpoints de playlists
  functional.rs    ← transformaciones puras: filter, sort, limit (map/filter/fold)
  cli.rs           ← loop de texto para agregar/eliminar canciones desde consola
```

## Contrato de API
Ver `../api-spec.md`. Respetar todos los endpoints definidos ahí.

## Reglas de programación

### General
- Comentarios en español, nombres de variables/funciones en inglés
- Sin `unwrap()` en producción — usar `?` o manejo explícito
- Sin `any` implícito — tipos explícitos siempre
- Responderme en español

### Concurrencia
- Estado compartido SIEMPRE con `Arc<tokio::sync::RwLock<T>>`
- Nunca bloquear en handlers async
- `playing_now: Arc<RwLock<HashSet<Uuid>>>` para saber qué canciones están sonando

### Programación funcional en playlists (OBLIGATORIO para la tarea)
Todo lo que esté en `functional.rs` y los handlers de playlists debe respetar:
- ❌ Prohibido: `let mut`, `.push()`, loops `for` con side effects
- ✅ Obligatorio: `.map()`, `.filter()`, `.fold()`, `.collect()`, closures `|x| ...`
- Las transformaciones retornan nuevas colecciones, nunca modifican la original

```rust
// ✅ Así sí
let by_genre: Vec<Song> = songs.iter()
    .filter(|s| s.genre.eq_ignore_ascii_case(&genre))
    .cloned()
    .collect();

// ❌ Así no — prohibido en functional.rs y handlers de playlists
let mut result = Vec::new();
for s in &songs {
    if s.genre == genre { result.push(s.clone()); }
}
```

### Búsqueda (3 criterios con lógica distinta)
- `name`: `.contains()` case-insensitive → búsqueda parcial textual
- `artist`: `.eq_ignore_ascii_case()` → igualdad exacta
- `genre`: normalizar a lowercase y comparar → filtro por categoría

## AppState
```rust
pub struct AppState {
    pub songs: Arc<RwLock<Vec<Song>>>,
    pub playlists: Arc<RwLock<Vec<Playlist>>>,
    pub playing_now: Arc<RwLock<HashSet<Uuid>>>,
}
```

## Modelo Song (debe matchear la tabla de Supabase)
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Song {
    pub id: Uuid,
    pub name: String,
    pub artist: String,
    pub genre: String,
    pub song_url: String,
    pub image_url: String,
}
```

## Comandos
```bash
cargo run       # inicia el servidor en localhost:8080
cargo build     # compila
cargo clippy    # linter
cargo test      # tests
```

## Variables de entorno (.env)
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
PORT=8080
```

## Archivos que NUNCA tocar sin preguntar
- `.env`
- `Cargo.lock`