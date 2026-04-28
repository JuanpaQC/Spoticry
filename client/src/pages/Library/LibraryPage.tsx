import { useMemo } from 'react'
import {
  AuraAppSidebar,
  AuraDesktopTopBar,
  AuraMobileBottomNav,
  Icon,
  ScreenLink,
} from '../Aura/auraUi.tsx'
import { usePlaylists } from '../../lib/playlistsContext.jsx'
import { useSongs } from '../../lib/songsContext.jsx'

const COVER_GRADIENTS = [
  ['#7c3aed', '#a855f7'],
  ['#0891b2', '#2563eb'],
  ['#ea580c', '#e11d48'],
  ['#059669', '#0891b2'],
  ['#db2777', '#7c3aed'],
  ['#d97706', '#ea580c'],
]

function decoratePlaylist(playlist, index, findTrackById) {
  const firstTrack =
    playlist.trackIds.length > 0 ? findTrackById(playlist.trackIds[0]) : null
  const count = playlist.trackIds.length
  const [colorA, colorB] = COVER_GRADIENTS[index % COVER_GRADIENTS.length]
  return {
    id: playlist.id,
    title: playlist.title,
    image: firstTrack?.cover ?? null,
    colorA,
    colorB,
    count,
    countLabel: `${count} ${count === 1 ? 'canción' : 'canciones'}`,
  }
}

function PlaylistCover({ playlist, className = '' }) {
  if (playlist.image) {
    return <img alt={playlist.title} className={className} src={playlist.image} />
  }
  return (
    <div
      className={`${className} flex items-center justify-center`}
      style={{
        background: `linear-gradient(135deg, ${playlist.colorA}, ${playlist.colorB})`,
      }}
    >
      <Icon className="text-5xl text-white/30" name="music_note" />
    </div>
  )
}

function PlaylistCard({ playlist }) {
  return (
    <a
      aria-label={`Abrir ${playlist.title}`}
      className="group block"
      href={`#playlist-detail/${playlist.id}`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
        <PlaylistCover
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          playlist={playlist}
        />
        {/* overlay oscuro suave al hover */}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" />
        {/* botón play */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105"
          >
            <Icon className="translate-x-0.5 text-2xl text-zinc-900" filled name="play_arrow" />
          </div>
        </div>
      </div>

      <div className="mt-3 px-0.5">
        <p className="truncate text-sm font-semibold text-zinc-100 group-hover:text-white">
          {playlist.title}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">{playlist.countLabel}</p>
      </div>
    </a>
  )
}

function MobileRow({ playlist }) {
  return (
    <a
      aria-label={`Abrir ${playlist.title}`}
      className="group flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-white/[0.04]"
      href={`#playlist-detail/${playlist.id}`}
    >
      <div className="h-14 w-14 flex-none overflow-hidden rounded-lg">
        <PlaylistCover className="h-full w-full object-cover" playlist={playlist} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-100">{playlist.title}</p>
        <p className="text-xs text-zinc-500">{playlist.countLabel}</p>
      </div>
      <Icon className="flex-none text-zinc-600 group-hover:text-zinc-400" name="chevron_right" />
    </a>
  )
}

function EmptyState({ mobile = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 text-center ${
        mobile ? 'py-16 px-6' : 'py-24 px-10'
      }`}
    >
      <div
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
      >
        <Icon className="text-4xl text-white/70" name="library_music" />
      </div>
      <h2 className={`font-bold text-white tracking-tight ${mobile ? 'text-2xl' : 'text-3xl'}`}>
        Tu biblioteca está vacía
      </h2>
      <p className="mt-3 max-w-xs text-sm leading-6 text-zinc-500">
        Crea tu primera playlist y empieza a agregar canciones.
      </p>
      <ScreenLink
        aria-label="Crear playlist"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-zinc-900 transition-all hover:scale-[1.02] hover:bg-zinc-100"
        screen="create-playlist"
      >
        <Icon name="add" />
        Nueva Playlist
      </ScreenLink>
    </div>
  )
}

function LibraryPage() {
  const { playlists, loading, error } = usePlaylists()
  const { findTrackById } = useSongs()

  const decorated = useMemo(
    () => playlists.map((p, i) => decoratePlaylist(p, i, findTrackById)),
    [playlists, findTrackById],
  )

  const hasPlaylists = decorated.length > 0

  return (
    <main className="min-h-screen bg-[#051424] text-[#d4e4fa]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-8rem] h-96 w-96 rounded-full bg-violet-500/10 blur-[140px]" />
        <div className="absolute bottom-[-6rem] right-[-8rem] h-80 w-80 rounded-full bg-cyan-400/8 blur-[120px]" />
      </div>

      {/* ── MOBILE ── */}
      <div className="relative lg:hidden">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-zinc-950/70 backdrop-blur-2xl">
          <div className="mx-auto flex h-20 max-w-md items-center justify-between px-6">
            <h1 className="text-3xl font-black tracking-[-0.05em] text-white">Biblioteca</h1>
            <ScreenLink
              aria-label="Crear playlist"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500 text-white shadow-[0_8px_24px_rgba(139,92,246,0.4)]"
              screen="create-playlist"
            >
              <Icon name="add" />
            </ScreenLink>
          </div>
        </header>

        <main className="mx-auto max-w-md px-6 pb-36 pt-24">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-500">
              {decorated.length} {decorated.length === 1 ? 'playlist' : 'playlists'}
            </span>
            {loading && <span className="text-xs text-zinc-600">· sync</span>}
          </div>

          {hasPlaylists ? (
            <section aria-label="Playlists" className="space-y-1">
              {decorated.map((p) => (
                <MobileRow key={p.id} playlist={p} />
              ))}
            </section>
          ) : (
            <EmptyState mobile />
          )}
        </main>

        <AuraMobileBottomNav active="library" />
      </div>

      {/* ── DESKTOP ── */}
      <div className="relative hidden h-screen flex-col overflow-hidden lg:flex">
        <AuraDesktopTopBar />

        <div className="flex min-h-0 flex-1 pt-20">
          <AuraAppSidebar activeKey="library" />

          <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-28">
            <div className="mx-auto max-w-[1240px] px-10 py-12">

              {/* Header */}
              <div className="mb-10 flex items-center justify-between gap-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-zinc-500">
                    Tu colección
                  </p>
                  <h1 className="mt-1 text-5xl font-black tracking-[-0.04em] text-white">
                    Biblioteca
                  </h1>
                  <p className="mt-2 text-sm text-zinc-500">
                    {decorated.length} {decorated.length === 1 ? 'playlist' : 'playlists'}
                    {loading ? ' · sincronizando…' : ''}
                  </p>
                  {error && (
                    <p className="mt-1 text-xs text-rose-400">{error}</p>
                  )}
                </div>

                <ScreenLink
                  aria-label="Crear playlist"
                  className="flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-zinc-900 transition-all hover:scale-[1.02] hover:bg-zinc-100"
                  screen="create-playlist"
                >
                  <Icon name="add" />
                  Nueva Playlist
                </ScreenLink>
              </div>

              {hasPlaylists ? (
                <section
                  aria-label="Playlists"
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                >
                  {decorated.map((p) => (
                    <PlaylistCard key={p.id} playlist={p} />
                  ))}
                </section>
              ) : (
                <EmptyState />
              )}
            </div>
          </main>
        </div>
      </div>
    </main>
  )
}

export default LibraryPage
