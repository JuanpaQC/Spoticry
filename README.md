# SpotiCry

Tarea Programada — Lenguajes de Programación  
TEC San Carlos · Prof. Oscar Víquez Acuña  
Entrega: miércoles 28 de abril de 2026, 10:00 pm

## Estructura del repo

```
spoticry/
  api-spec.md        ← contrato de API (leer antes de tocar código)
  server/
    CLAUDE.md        ← contexto para Claude Code (servidor)
    src/
    Cargo.toml
  client/
    CLAUDE.md        ← contexto para Claude Code (cliente)
    src/
    package.json
```

## Cómo correr

### Servidor (Rust)
```bash
cd server
cargo run
# corre en http://localhost:8080
```

### Cliente (React)
```bash
cd client
npm install
npm run dev
# corre en http://localhost:5173
```

## Cómo usar Claude Code en este proyecto

```bash
# Para trabajar en el servidor:
cd server
claude

# Para trabajar en el cliente:
cd client
claude
```

Claude lee el `CLAUDE.md` de cada carpeta automáticamente.
Ya sabe el stack, las convenciones y el contrato de API.
Podés pedirle cosas directamente sin explicar contexto.

### Ejemplos de prompts útiles

**Servidor:**
- "Implementá el endpoint GET /songs/search con los 3 criterios definidos en el api-spec"
- "Creá la función de streaming en stream.rs para servir un MP3 en chunks"
- "Implementá las transformaciones funcionales de playlists en functional.rs usando map/filter/fold"
- "/review" → revisa el último archivo que editaste

**Cliente:**
- "Creá el componente Player con buffer de audio usando Web Audio API"
- "Implementá el api/client.ts con todas las llamadas definidas en el api-spec"  
- "Creá el SearchBar con los 3 criterios de búsqueda como tabs o dropdowns"
- "/review" → revisa el último archivo que editaste