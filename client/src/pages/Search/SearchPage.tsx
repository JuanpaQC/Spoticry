import { useMemo, useState } from 'react'
import { tracks } from '../../data/tracks.js'
import { usePlayer } from '../../lib/playerContext.jsx'
import {
  AuraAppSidebar,
  AuraDesktopTopBar,
  AuraMobileBottomNav,
  Icon,
} from '../Aura/auraUi.tsx'

// Pantalla dedicada de búsqueda.
// Antes el filtro vivía dentro del Menu y los resultados aparecían al
// final de la página, mezclados con secciones decorativas. Esta vista
// es solo input + resultados, sin distracciones.

// Filtra por título o artista, case-insensitive.
function filterTracks(all, query) {
  const q = query.trim().toLowerCase()
  if (q === '') return []
  return all.filter(
    (t) =>
      t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q),
  )
}

// Estado vacío: si no escribió nada, mostramos un hint.
function EmptyHint({ query }) {
  if (query.trim() === '') {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
        <Icon className="text-4xl text-zinc-700" name="search" />
        <p className="mt-3 text-sm text-zinc-500">
          Escribí el nombre de una canción o artista para empezar.
        </p>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
      <p className="text-sm text-zinc-500">
        No hay coincidencias para "{query}".
      </p>
    </div>
  )
}

// Fila de resultado. Click → reproduce. Misma estética que las filas
// de la playlist detail para mantener consistencia visual.
function ResultRow({ track, onPlay, isActive }) {
  return (
    <button
      className={`flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors ${
        isActive ? 'bg-violet-500/10' : 'hover:bg-white/5'
      }`}
      onClick={onPlay}
      type="button"
    >
      <div className="h-14 w-14 flex-none overflow-hidden rounded-xl">
        <img
          alt={track.title}
          className="h-full w-full object-cover"
          src={track.cover}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-base font-medium ${
            isActive ? 'text-violet-300' : 'text-white'
          }`}
        >
          {track.title}
        </p>
        <p className="truncate text-sm text-zinc-500">{track.artist}</p>
      </div>
      <span className="text-xs text-zinc-500">{track.duration}</span>
    </button>
  )
}

function SearchPage() {
  const { play, currentTrack } = usePlayer()
  const [query, setQuery] = useState('')

  // Memo del filtro (no es crítico con 3 canciones, pero es prolijo).
  const results = useMemo(() => filterTracks(tracks, query), [query])

  // Reproduce y pasa los resultados como queue para que next/previous
  // se mueva dentro de los resultados de la búsqueda actual.
  const handlePlay = (track) => {
    play(track, results)
  }

  // Bloque de input + resultados, idéntico para mobile y desktop.
  // Lo extraemos a una constante para no repetir el JSX dos veces.
  const searchBlock = (
    <>
      <label className="relative block">
        <Icon
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          name="search"
        />
        <input
          autoFocus
          className="w-full rounded-full border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-base text-white outline-none transition-all placeholder:text-zinc-500 focus:border-violet-500 focus:bg-white/[0.07]"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar canciones o artistas..."
          type="search"
          value={query}
        />
      </label>

      {results.length === 0 ? (
        <EmptyHint query={query} />
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            {results.length} resultado{results.length === 1 ? '' : 's'}
          </p>
          {results.map((track) => (
            <ResultRow
              isActive={currentTrack?.id === track.id}
              key={track.id}
              onPlay={() => handlePlay(track)}
              track={track}
            />
          ))}
        </div>
      )}
    </>
  )

  return (
    <main className="min-h-screen bg-[#051424] text-[#d4e4fa]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/15 blur-[120px]" />
      </div>

      {/* Mobile: header simple + bloque centrado + bottom nav. */}
      <div className="relative lg:hidden">
        <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center border-b border-white/10 bg-zinc-950/60 px-6 backdrop-blur-2xl">
          <h1 className="text-3xl font-black tracking-[-0.05em] text-zinc-100">
            Search
          </h1>
        </header>

        <main className="mx-auto max-w-md space-y-6 px-6 pb-36 pt-24">
          {searchBlock}
        </main>

        <AuraMobileBottomNav active="search" />
      </div>

      {/* Desktop: shell con sidebar + contenido centrado. */}
      <div className="relative hidden h-screen flex-col overflow-hidden lg:flex">
        <AuraDesktopTopBar />

        <div className="flex min-h-0 flex-1 pt-20">
          <AuraAppSidebar activeKey="search" />

          <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-20">
            <div className="mx-auto max-w-3xl space-y-8 px-10 py-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
                  Find your next track
                </p>
                <h1 className="mt-3 text-6xl font-bold tracking-[-0.06em] text-zinc-100">
                  Search
                </h1>
              </div>

              {searchBlock}
            </div>
          </main>
        </div>
      </div>
    </main>
  )
}

export default SearchPage
