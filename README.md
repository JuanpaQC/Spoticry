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
