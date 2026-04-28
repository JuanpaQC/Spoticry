import { useEffect, useMemo, useState } from 'react'
import { fetchPlaylistSongs } from '../../lib/api.js'
import { usePlayer } from '../../lib/playerContext.jsx'
import { usePlaylists } from '../../lib/playlistsContext.jsx'
import { useSongs } from '../../lib/songsContext.jsx'
import {
  AuraAppSidebar,
  AuraDesktopTopBar,
  AuraMobileBottomNav,
  Icon,
} from '../Aura/auraUi.tsx'

// Cambia el hash sin recargar. Lo usamos para "volver al library" o
// redirigir cuando una playlist no existe.
function navigate(hash: string) {
  if (typeof window === 'undefined') return
  window.location.hash = hash
}

const SORT_OPTIONS = [
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'artista', label: 'Artista' },
  { value: 'album', label: 'Álbum' },
  { value: 'reciente', label: 'Reciente' },
]

// Suma "m:ss" de un array de tracks. Si una canción no tiene duración
// válida, se ignora. El total se devuelve formateado tipo "1h 24m".
function sumDurations(tracks) {
  let totalSeconds = 0
  for (const track of tracks) {
    const parts = (track.duration || '').split(':')
    if (parts.length !== 2) continue
    const minutes = Number(parts[0])
    const seconds = Number(parts[1])
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) continue
    totalSeconds += minutes * 60 + seconds
  }
  if (totalSeconds === 0) return '0m'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// Fila para la tabla de desktop. Recibe el track, su índice, si es la
// que está sonando y handlers para reproducir y para quitar de la lista.
function DesktopTrackRow({ item, index, isActive, onPlay, onRemove }) {
  return (
    <div className="grid w-full grid-cols-[48px_2fr_1.5fr_1.5fr_100px_44px] items-center gap-6 px-8 py-4 text-left transition-colors hover:bg-violet-500/5">
      <button
        aria-label={`Play ${item.title}`}
        className="text-left"
        onClick={onPlay}
        type="button"
      >
        <span
          className={`${
            isActive ? 'font-bold text-[#d0bcff]' : 'text-zinc-600'
          }`}
        >
          {index + 1}
        </span>
      </button>

      <button
        aria-label={`Play ${item.title}`}
        className="flex items-center gap-4 text-left"
        onClick={onPlay}
        type="button"
      >
        <div className="h-12 w-12 overflow-hidden rounded-lg bg-zinc-800">
          <img
            alt={item.title}
            className="h-full w-full object-cover"
            src={item.cover}
          />
        </div>
        <div>
          <h4
            className={`text-base font-semibold ${
              isActive ? 'text-[#d0bcff]' : 'text-zinc-100'
            }`}
          >
            {item.title}
          </h4>
        </div>
      </button>

      <span className="text-sm text-zinc-300">{item.artist}</span>
      <span className="text-sm text-zinc-500">{item.album}</span>
      <span className="text-right text-sm text-zinc-500">{item.duration}</span>
      <button
        aria-label={`Remove ${item.title}`}
        className="text-zinc-500 transition-colors hover:text-rose-400"
        onClick={onRemove}
        type="button"
      >
        <Icon name="close" />
      </button>
    </div>
  )
}

// Fila para mobile.
function MobileTrackRow({ item, isActive, onPlay, onRemove }) {
  return (
    <div
      className={`group flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors ${
        isActive
          ? 'border-l-2 border-[#d0bcff] bg-[#d0bcff]/5'
          : 'hover:bg-white/5'
      }`}
    >
      <button
        aria-label={`Play ${item.title}`}
        className="flex flex-1 items-center gap-4 text-left"
        onClick={onPlay}
        type="button"
      >
        <div className="relative h-12 w-12 flex-shrink-0">
          <img
            alt={item.title}
            className={`h-full w-full rounded-lg object-cover transition-all ${
              isActive ? '' : 'grayscale group-hover:grayscale-0'
            }`}
            src={item.cover}
          />
          {isActive ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-zinc-950/40">
              <Icon className="text-sm text-[#d0bcff]" filled name="equalizer" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className={`truncate text-base ${
              isActive ? 'font-semibold text-[#d0bcff]' : 'text-[#d4e4fa]'
            }`}
          >
            {item.title}
          </h3>
          <p className="truncate text-sm text-zinc-500">{item.artist}</p>
        </div>
      </button>

      <span className="text-sm text-zinc-400">{item.duration}</span>
      <button
        aria-label={`Remove ${item.title}`}
        className="text-zinc-500 transition-colors hover:text-rose-400"
        onClick={onRemove}
        type="button"
      >
        <Icon name="close" />
      </button>
    </div>
  )
}

// Fila del picker (canciones que NO están en la playlist todavía).
// Click llama a onAdd y agrega la canción.
function PickerRow({ track, onAdd }) {
  return (
    <button
      className="flex w-full items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/5"
      onClick={onAdd}
      type="button"
    >
      <div className="h-10 w-10 flex-none overflow-hidden rounded-lg">
        <img
          alt={track.title}
          className="h-full w-full object-cover"
          src={track.cover}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-100">
          {track.title}
        </p>
        <p className="truncate text-xs text-zinc-500">{track.artist}</p>
      </div>
      <Icon className="text-violet-300" name="add_circle" />
    </button>
  )
}

function SortControls({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SORT_OPTIONS.map((option) => (
        <button
          className={`rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
            value === option.value
              ? 'border-violet-400/50 bg-violet-500/20 text-violet-200'
              : 'border-white/10 bg-white/[0.03] text-zinc-500 hover:text-zinc-200'
          }`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

// Estado vacío que se muestra cuando llegamos a un id de playlist
// que ya no existe (por ejemplo, fue borrada en otra pestaña). Le
// damos al usuario un botón para volver al library.
function PlaylistNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#051424] px-6 text-center text-[#d4e4fa]">
      <div className="max-w-md">
        <Icon className="text-5xl text-violet-400" name="library_music" />
        <h1 className="mt-6 text-3xl font-bold tracking-[-0.04em] text-zinc-100">
          Playlist no encontrada
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Esta playlist no existe o fue eliminada. Volvé al library para ver
          las que tenés guardadas.
        </p>
        <button
          className="mt-8 rounded-full bg-violet-500 px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-[0_10px_30px_rgba(139,92,246,0.25)]"
          onClick={() => navigate('#library')}
          type="button"
        >
          Volver a Library
        </button>
      </div>
    </main>
  )
}

function PlaylistLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#051424] px-6 text-center text-[#d4e4fa]">
      <div className="max-w-md">
        <Icon className="text-5xl text-violet-400" name="sync" />
        <h1 className="mt-6 text-3xl font-bold tracking-[-0.04em] text-zinc-100">
          Cargando playlist
        </h1>
      </div>
    </main>
  )
}

function PlaylistDetailPage({ playlistId }: { playlistId: string | null }) {
  const { currentTrack, play } = usePlayer()
  const {
    getPlaylist,
    addTrack,
    removeTrack,
    deletePlaylist,
    loading: playlistsLoading,
  } = usePlaylists()
  const { tracks: allTracks, findTrackById } = useSongs()
  // Picker desplegable para agregar canciones del manifiesto.
  const [pickerOpen, setPickerOpen] = useState(false)
  const [sortMode, setSortMode] = useState('ingreso')
  const [remoteSortedTracks, setRemoteSortedTracks] = useState(null)
  const [actionError, setActionError] = useState('')

  // Buscamos la playlist por el id que viene de la URL. Si no existe
  // (id inválido o borrada), mostramos un estado vacío con CTA.
  const playlist = playlistId ? getPlaylist(playlistId) : null

  // Hooks SIEMPRE arriba, antes de cualquier return condicional, para
  // no romper la regla de "mismo orden en cada render".
  const playlistKey = playlist?.trackIds.join('|') ?? ''

  const basePlaylistTracks = useMemo(() => {
    if (!playlist) return []
    return playlist.trackIds
      .map((id) => findTrackById(id))
      .filter((t) => t != null)
  }, [playlist, findTrackById])

  useEffect(() => {
    if (!playlist || sortMode === 'ingreso' || sortMode === 'reciente') {
      setRemoteSortedTracks(null)
      return undefined
    }

    let cancelled = false
    fetchPlaylistSongs(playlist.id, sortMode)
      .then((songs) => {
        if (!cancelled) setRemoteSortedTracks(songs)
      })
      .catch(() => {
        if (!cancelled) setRemoteSortedTracks(null)
      })

    return () => {
      cancelled = true
    }
  }, [playlist?.id, playlistKey, sortMode])

  const playlistTracks = useMemo(() => {
    if (sortMode === 'ingreso') return basePlaylistTracks
    if (sortMode === 'reciente') return [...basePlaylistTracks].reverse()
    if (remoteSortedTracks) return remoteSortedTracks
    return [...basePlaylistTracks].sort((a, b) => {
      if (sortMode === 'artista') return a.artist.localeCompare(b.artist)
      if (sortMode === 'album') return a.album.localeCompare(b.album)
      return 0
    })
  }, [basePlaylistTracks, remoteSortedTracks, sortMode])

  // Lo que le falta a la playlist: todas las canciones del manifiesto
  // que todavía no están en esta playlist. Eso alimenta el picker.
  const availableTracks = useMemo(() => {
    if (!playlist) return []
    return allTracks.filter((t) => !playlist.trackIds.includes(t.id))
  }, [playlist, allTracks])

  if (!playlist) return playlistsLoading ? <PlaylistLoading /> : <PlaylistNotFound />

  // Cover de la playlist: usamos la portada del primer track. Si la
  // playlist está vacía, usamos un gradiente fallback (con un ícono).
  const cover = playlistTracks[0]?.cover ?? null
  const totalDuration = sumDurations(playlistTracks)
  const tracksLabel = `${playlistTracks.length} ${
    playlistTracks.length === 1 ? 'track' : 'tracks'
  }`
  const visibility = playlist.isPublic ? 'Public Playlist' : 'Private Playlist'

  // Reproduce desde la primera canción de la playlist y reemplaza la
  // queue del player para que next/previous se muevan dentro de esta
  // playlist, no del manifiesto entero.
  const handlePlayAll = () => {
    if (playlistTracks.length === 0) return
    play(playlistTracks[0], playlistTracks)
  }

  // Reproduce una canción puntual y también pasa la queue de la playlist
  // para que el siguiente/anterior salten dentro de la misma playlist.
  const handlePlayTrack = (track) => {
    play(track, playlistTracks)
  }

  const handleAddTrack = async (trackId: string) => {
    setActionError('')
    try {
      await addTrack(playlist.id, trackId)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo agregar.')
    }
  }

  const handleRemoveTrack = async (trackId: string) => {
    setActionError('')
    try {
      await removeTrack(playlist.id, trackId)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo quitar.')
    }
  }

  // Borra la playlist y vuelve al library. Antes pide confirmación
  // porque es destructivo.
  const handleDelete = async () => {
    if (typeof window === 'undefined') return
    const ok = window.confirm(
      `¿Seguro que querés borrar "${playlist.title}"? No se puede deshacer.`,
    )
    if (!ok) return
    setActionError('')
    try {
      await deletePlaylist(playlist.id)
      navigate('#library')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo borrar.')
    }
  }

  return (
    <main className="min-h-screen bg-[#051424] text-[#d4e4fa]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/3 top-24 h-[28rem] w-[28rem] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      {/* Mobile: layout poster con cover grande arriba + lista. */}
      <div className="relative lg:hidden">
        <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-white/10 bg-zinc-950/60 px-6 backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <button
              aria-label="Back"
              className="text-zinc-100 transition-all active:scale-95"
              onClick={() => navigate('#library')}
              type="button"
            >
              <Icon name="arrow_back" />
            </button>
            <span className="text-2xl font-black uppercase tracking-[-0.06em] text-zinc-100">
              AURA
            </span>
          </div>

          <button
            aria-label="Delete playlist"
            className="text-zinc-400 transition-colors hover:text-rose-400"
            onClick={handleDelete}
            type="button"
          >
            <Icon name="delete" />
          </button>
        </header>

        <main className="mx-auto max-w-md px-6 pb-40 pt-24">
          <section className="mb-10 flex flex-col items-center">
            <div className="relative mb-8 h-64 w-64">
              <div className="absolute inset-0 rounded-full bg-[#a078ff]/20 blur-[40px]" />
              {cover ? (
                <img
                  alt={playlist.title}
                  className="relative z-10 h-full w-full rounded-xl border border-white/10 object-cover shadow-[0_20px_50px_rgba(139,92,246,0.2)]"
                  src={cover}
                />
              ) : (
                <div className="relative z-10 flex h-full w-full items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/40 via-fuchsia-500/30 to-zinc-900 shadow-[0_20px_50px_rgba(139,92,246,0.2)]">
                  <Icon className="text-6xl text-white/60" name="library_music" />
                </div>
              )}
            </div>

            <div className="text-center">
              <h1 className="text-6xl font-bold tracking-[-0.05em] text-[#dfe9ff]">
                {playlist.title}
              </h1>
              <p className="mt-4 text-sm uppercase tracking-[0.24em] text-zinc-500">
                {visibility} • {tracksLabel} • {totalDuration}
              </p>
              {playlist.description ? (
                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  {playlist.description}
                </p>
              ) : null}
            </div>
          </section>

          <section className="mb-8 flex items-center justify-center gap-4">
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#c7b0ff] py-4 text-sm font-semibold uppercase tracking-[0.24em] text-[#33156d] shadow-[0_0_20px_rgba(208,188,255,0.3)] transition-all active:scale-95 disabled:opacity-40"
              disabled={playlistTracks.length === 0}
              onClick={handlePlayAll}
              type="button"
            >
              <Icon filled name="play_arrow" />
              Play
            </button>
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-[#d4e4fa] transition-all active:scale-95"
              onClick={() => setPickerOpen((prev) => !prev)}
              type="button"
            >
              <Icon name={pickerOpen ? 'close' : 'add'} />
              {pickerOpen ? 'Cerrar' : 'Agregar'}
            </button>
          </section>

          <section className="mb-6">
            <SortControls onChange={setSortMode} value={sortMode} />
            {actionError ? (
              <p className="mt-3 text-sm text-rose-300">{actionError}</p>
            ) : null}
          </section>

          {pickerOpen ? (
            <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                Agregar canción
              </p>
              {availableTracks.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-500">
                  Ya agregaste todas las canciones disponibles.
                </p>
              ) : (
                <div className="space-y-1">
                  {availableTracks.map((track) => (
                    <PickerRow
                      key={track.id}
                      onAdd={() => handleAddTrack(track.id)}
                      track={track}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {playlistTracks.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-sm text-zinc-400">
                Esta playlist está vacía. Tocá "Agregar" para sumar canciones.
              </p>
            </section>
          ) : (
            <section className="space-y-2">
              {playlistTracks.map((track) => (
                <MobileTrackRow
                  key={track.id}
                  isActive={currentTrack?.id === track.id}
                  item={track}
                  onPlay={() => handlePlayTrack(track)}
                  onRemove={() => handleRemoveTrack(track.id)}
                />
              ))}
            </section>
          )}
        </main>

        <AuraMobileBottomNav active="library" />
      </div>

      {/* Desktop: shell con sidebar para mantener consistencia con el */}
      {/* resto de las pantallas. El footer del player vive en App.jsx. */}
      <div className="relative hidden h-screen flex-col overflow-hidden lg:flex">
        <AuraDesktopTopBar />

        <div className="flex min-h-0 flex-1 pt-20">
          <AuraAppSidebar activeKey="library" />

          <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-32">
          <section className="relative flex flex-col gap-10 px-10 py-12 md:flex-row md:items-end">
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute -left-1/4 -top-1/2 h-full w-full rounded-full bg-[#d0bcff]/10 blur-[120px]" />
            </div>

            <div className="h-80 w-80 flex-shrink-0 overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              {cover ? (
                <img
                  alt={playlist.title}
                  className="h-full w-full object-cover"
                  src={cover}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/40 via-fuchsia-500/30 to-zinc-900">
                  <Icon className="text-7xl text-white/60" name="library_music" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d0bcff]">
                  {visibility}
                </span>
                <h1 className="text-7xl font-bold tracking-[-0.05em] text-white">
                  {playlist.title}
                </h1>
                {playlist.description ? (
                  <p className="max-w-2xl text-xl leading-9 text-zinc-400">
                    {playlist.description}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <span>{tracksLabel}</span>
                <span className="h-1 w-1 rounded-full bg-zinc-700" />
                <span>{totalDuration}</span>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <button
                  className="flex h-14 items-center gap-3 rounded-full bg-[#c7b0ff] px-10 text-sm font-semibold uppercase tracking-[0.24em] text-[#33156d] shadow-[0_10px_30px_rgba(208,188,255,0.2)] transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                  disabled={playlistTracks.length === 0}
                  onClick={handlePlayAll}
                  type="button"
                >
                  <Icon filled name="play_arrow" />
                  Play
                </button>
                <button
                  className="flex h-14 items-center gap-3 rounded-full border border-white/20 px-8 text-sm font-semibold uppercase tracking-[0.2em] text-white transition-all hover:bg-white/5"
                  onClick={() => setPickerOpen((prev) => !prev)}
                  type="button"
                >
                  <Icon name={pickerOpen ? 'close' : 'add'} />
                  {pickerOpen ? 'Cerrar picker' : 'Agregar canción'}
                </button>
                <button
                  aria-label="Delete playlist"
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-all hover:border-rose-500/40 hover:text-rose-400"
                  onClick={handleDelete}
                  type="button"
                >
                  <Icon name="delete" />
                </button>
              </div>
            </div>
          </section>

          {pickerOpen ? (
            <section className="px-10 pb-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Agregar canción a "{playlist.title}"
                  </p>
                  <button
                    aria-label="Close picker"
                    className="text-zinc-500 transition-colors hover:text-white"
                    onClick={() => setPickerOpen(false)}
                    type="button"
                  >
                    <Icon name="close" />
                  </button>
                </div>
                {availableTracks.length === 0 ? (
                  <p className="py-4 text-sm text-zinc-500">
                    Ya agregaste todas las canciones disponibles.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableTracks.map((track) => (
                      <PickerRow
                        key={track.id}
                        onAdd={() => handleAddTrack(track.id)}
                        track={track}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : null}

          <section className="px-10 py-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <SortControls onChange={setSortMode} value={sortMode} />
              {actionError ? (
                <p className="text-sm text-rose-300">{actionError}</p>
              ) : null}
            </div>
            {playlistTracks.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-12 text-center backdrop-blur-[20px]">
                <Icon className="text-4xl text-zinc-600" name="queue_music" />
                <p className="mt-4 text-lg text-zinc-300">
                  Esta playlist está vacía
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  Hacé click en "Agregar canción" para sumar tracks.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-[20px]">
                <div className="grid grid-cols-[48px_2fr_1.5fr_1.5fr_100px_44px] gap-6 border-b border-white/5 px-8 py-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  <span>#</span>
                  <span>Title</span>
                  <span>Artist</span>
                  <span>Album</span>
                  <span className="flex justify-end">
                    <Icon className="text-[18px]" name="schedule" />
                  </span>
                  <span />
                </div>

                <div className="divide-y divide-white/[0.02]">
                  {playlistTracks.map((track, index) => (
                    <DesktopTrackRow
                      key={track.id}
                      index={index}
                      isActive={currentTrack?.id === track.id}
                      item={track}
                      onPlay={() => handlePlayTrack(track)}
                      onRemove={() => handleRemoveTrack(track.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        </main>
        </div>
      </div>
    </main>
  )
}

export default PlaylistDetailPage
