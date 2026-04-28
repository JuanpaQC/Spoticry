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

// Paleta de gradientes para que cada playlist se vea distinta en la
// grilla. Como todas las playlists del usuario son suyas, no tenemos
// "curator" real, así que el color depende del índice.
const ACCENT_PALETTE = [
  'from-violet-500/40 via-fuchsia-500/20 to-transparent',
  'from-cyan-400/35 via-sky-400/10 to-transparent',
  'from-orange-500/35 via-rose-500/10 to-transparent',
  'from-emerald-400/30 via-cyan-400/10 to-transparent',
  'from-pink-500/30 via-violet-500/10 to-transparent',
  'from-zinc-400/30 via-white/5 to-transparent',
]

// Pasa un timestamp a un texto humano corto para metadata compacta.
// Así la columna "Updated" no muestra fechas crudas.
function formatUpdated(timestamp) {
  if (!timestamp) return 'ahora'
  const diffMs = Date.now() - timestamp
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `hace ${diffHours} h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'ayer'
  if (diffDays < 7) return `hace ${diffDays} d`
  return `hace ${Math.floor(diffDays / 7)} sem`
}

// Toma una playlist plana del context y le agrega los campos derivados
// que la UI necesita (cover de la primera canción, accent, etiqueta de
// cantidad de tracks, etc.). De esta forma los componentes visuales no
// repiten la misma lógica.
function decoratePlaylist(playlist, index, findTrackById) {
  const firstTrack =
    playlist.trackIds.length > 0 ? findTrackById(playlist.trackIds[0]) : null
  const tracksCount = playlist.trackIds.length
  return {
    id: playlist.id,
    title: playlist.title,
    description: playlist.description || 'Tu playlist personal',
    image: firstTrack?.cover ?? null,
    accent: ACCENT_PALETTE[index % ACCENT_PALETTE.length],
    updated: formatUpdated(playlist.createdAt),
    tracks: tracksCount,
    tracksLabel: `${tracksCount} ${tracksCount === 1 ? 'track' : 'tracks'}`,
    visibility: playlist.isPublic ? 'Pública' : 'Privada',
  }
}

// Link a la pantalla de detalle. El id viaja en el hash:
// `#playlist-detail/<id>`. Es lo que usa parseHash() en App.jsx.
function PlaylistLink({ playlist, className = '', children, 'aria-label': ariaLabel }) {
  return (
    <a
      aria-label={ariaLabel}
      className={className}
      href={`#playlist-detail/${playlist.id}`}
    >
      {children}
    </a>
  )
}

// Cover con fallback: si la playlist está vacía y no tiene `image`,
// renderizamos un gradiente sólido para no dejar el cuadrado en negro.
function PlaylistCover({ playlist, className = '' }) {
  if (playlist.image) {
    return (
      <img
        alt={playlist.title}
        className={className}
        src={playlist.image}
      />
    )
  }
  return (
    <div
      className={`${className} flex items-center justify-center bg-gradient-to-br from-violet-500/40 via-fuchsia-500/20 to-zinc-900`}
    >
      <Icon className="text-3xl text-white/60" name="library_music" />
    </div>
  )
}

function MobilePlaylistCard({ playlist }) {
  return (
    <PlaylistLink
      aria-label={`Open ${playlist.title}`}
      className="group block rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-all duration-300 hover:border-violet-500/30 hover:bg-white/[0.07]"
      playlist={playlist}
    >
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 flex-none overflow-hidden rounded-2xl">
          <PlaylistCover
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            playlist={playlist}
          />
          <div
            className={`absolute inset-0 bg-gradient-to-br ${playlist.accent}`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-violet-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">
              {playlist.visibility}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {playlist.updated}
            </span>
          </div>
          <h3 className="truncate text-xl font-semibold tracking-[-0.03em] text-zinc-100">
            {playlist.title}
          </h3>
          <p className="mt-1 truncate text-sm text-zinc-400">
            {playlist.description}
          </p>
          <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            <span>{playlist.tracksLabel}</span>
          </div>
        </div>

        <Icon className="text-zinc-500 transition-colors group-hover:text-violet-300" name="chevron_right" />
      </div>
    </PlaylistLink>
  )
}

function DesktopPlaylistCard({ playlist }) {
  return (
    <PlaylistLink
      aria-label={`Open ${playlist.title}`}
      className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] transition-all duration-300 hover:border-violet-500/30 hover:bg-white/[0.07]"
      playlist={playlist}
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-950/60">
        <PlaylistCover
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          playlist={playlist}
        />
        <div className={`absolute inset-0 bg-gradient-to-br ${playlist.accent}`} />
        <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-zinc-950/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-200 backdrop-blur-md">
          {playlist.visibility}
        </span>
      </div>

      <div className="flex min-h-[9rem] flex-col p-4">
        <h3 className="truncate text-lg font-semibold tracking-[-0.03em] text-white">
          {playlist.title}
        </h3>
        <p className="mt-1 max-h-10 overflow-hidden text-sm leading-5 text-zinc-500">
          {playlist.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          <span>{playlist.tracksLabel}</span>
          <span>{playlist.updated}</span>
        </div>
      </div>
    </PlaylistLink>
  )
}

function MobileEmptyLibraryState() {
  return (
    <section className="rounded-[1.8rem] border border-dashed border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
      <span className="rounded-full bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">
        Empieza acá
      </span>
      <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-zinc-100">
        Todavía no creaste ninguna playlist
      </h2>
      <p className="mt-3 text-sm leading-6 text-zinc-400">
        Tocá el botón de abajo para crear tu primera playlist. Las playlists
        se guardan en el servidor y se sincronizan con Supabase.
      </p>

      <ScreenLink
        aria-label="Go to create playlist"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-violet-500 px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-[0_10px_30px_rgba(139,92,246,0.25)]"
        screen="create-playlist"
      >
        Create Playlist
      </ScreenLink>
    </section>
  )
}

function DesktopEmptyLibraryState() {
  return (
    <section className="glass-surface rounded-[2rem] border border-dashed border-white/10 p-10">
      <span className="rounded-full bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-violet-300">
        Empieza acá
      </span>
      <h2 className="mt-6 text-5xl font-semibold tracking-[-0.05em] text-zinc-100">
        Todavía no creaste ninguna playlist
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400">
        Cada playlist nueva aparece acá en el listado y la podés abrir para
        agregarle canciones del catálogo conectado al servidor.
      </p>

      <div className="mt-8 flex items-center gap-4">
        <ScreenLink
          aria-label="Go to create playlist"
          className="rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-[0_12px_40px_rgba(139,92,246,0.25)] transition-transform hover:scale-[1.01]"
          screen="create-playlist"
        >
          Create Playlist
        </ScreenLink>
        <span className="text-sm text-zinc-500">
          También podés usar el botón "+" en la barra lateral.
        </span>
      </div>
    </section>
  )
}

function LibraryPage() {
  const { playlists, loading, error } = usePlaylists()
  const { findTrackById } = useSongs()

  // Decoramos una sola vez por render, no por cada componente hijo.
  // useMemo evita recalcular si la lista no cambió.
  const decorated = useMemo(
    () => playlists.map((p, i) => decoratePlaylist(p, i, findTrackById)),
    [playlists, findTrackById],
  )

  const hasPlaylists = decorated.length > 0
  const featuredPlaylist = decorated[0] ?? null
  const publicCount = decorated.filter((p) => p.visibility === 'Pública').length

  return (
    <main className="min-h-screen bg-[#051424] text-[#d4e4fa]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/15 blur-[120px]" />
        <div className="absolute bottom-[-10rem] right-[-6rem] h-80 w-80 rounded-full bg-cyan-400/10 blur-[140px]" />
      </div>

      {/* Mobile keeps the library as stacked cards so the list stays fast to scan. */}
      <div className="relative lg:hidden">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-zinc-950/60 backdrop-blur-2xl">
          <div className="mx-auto flex h-20 max-w-md items-center justify-between px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                Your space
              </p>
              <h1 className="text-3xl font-black tracking-[-0.05em] text-zinc-100">
                Library
              </h1>
            </div>

            <ScreenLink
              aria-label="Create playlist"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500 text-white shadow-[0_10px_30px_rgba(139,92,246,0.3)]"
              screen="create-playlist"
            >
              <Icon name="add" />
            </ScreenLink>
          </div>
        </header>

        <main className="mx-auto max-w-md px-6 pb-36 pt-32">
          <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              <span>{decorated.length} playlists</span>
              {loading ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-zinc-600" />
                  <span>sync</span>
                </>
              ) : null}
              <span className="h-1 w-1 rounded-full bg-zinc-600" />
              <span>{publicCount} públicas</span>
              {featuredPlaylist ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-zinc-600" />
                  <span className="truncate text-violet-300">
                    Featured: {featuredPlaylist.title}
                  </span>
                </>
              ) : null}
            </div>
          </section>

          {hasPlaylists ? (
            <section className="space-y-4" aria-label="Playlists">
              {decorated.map((playlist) => (
                <MobilePlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </section>
          ) : (
            <MobileEmptyLibraryState />
          )}
        </main>

        <AuraMobileBottomNav active="library" />
      </div>

      {/* Desktop keeps the same left rail as the menu so library stays inside */}
      {/* the shared app shell until the user opens a playlist in full detail. */}
      <div className="relative hidden h-screen flex-col overflow-hidden lg:flex">
        <AuraDesktopTopBar />

        <div className="flex min-h-0 flex-1 pt-20">
          <AuraAppSidebar activeKey="library" />

          <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-20">
            <div className="mx-auto max-w-[1240px] px-10 py-12">
              <section className="mb-8 flex items-end justify-between gap-8">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
                    Library
                  </p>
                  <h1 className="mt-2 text-5xl font-bold tracking-[-0.05em] text-zinc-100">
                    Tus playlists
                  </h1>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                      {decorated.length} playlists
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                      {publicCount} públicas
                    </span>
                    {featuredPlaylist ? (
                      <span className="max-w-md truncate rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-violet-300">
                        Featured: {featuredPlaylist.title}
                      </span>
                    ) : null}
                    {error ? (
                      <span className="max-w-md truncate rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-rose-300">
                        {error}
                      </span>
                    ) : null}
                  </div>
                </div>

                <ScreenLink
                  aria-label="Create playlist"
                  className="rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-[0_12px_40px_rgba(139,92,246,0.25)] transition-transform hover:scale-[1.01]"
                  screen="create-playlist"
                >
                  + New Playlist
                </ScreenLink>
              </section>

              {hasPlaylists ? (
                <section
                  aria-label="Playlists"
                  className="grid gap-5 lg:grid-cols-3 xl:grid-cols-4"
                >
                  {decorated.map((playlist) => (
                    <DesktopPlaylistCard key={playlist.id} playlist={playlist} />
                  ))}
                </section>
              ) : (
                <DesktopEmptyLibraryState />
              )}
            </div>
          </main>
        </div>
      </div>
    </main>
  )
}

export default LibraryPage
