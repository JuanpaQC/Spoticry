import { useMemo, useState } from 'react'
import { useSongs } from '../../lib/songsContext.jsx'
import {
  AuraAppSidebar,
  AuraDesktopTopBar,
  AuraMobileBottomNav,
  Icon,
} from '../Aura/auraUi.tsx'

const emptyForm = {
  title: '',
  artist: '',
  genre: '',
  album: '',
  src: '',
  cover: '',
}

function SongForm({ onSubmit, busy }) {
  const [form, setForm] = useState(emptyForm)

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const canSubmit =
    form.title.trim() &&
    form.artist.trim() &&
    form.genre.trim() &&
    form.album.trim() &&
    form.src.trim() &&
    form.cover.trim()

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!canSubmit || busy) return
    await onSubmit(form)
    setForm(emptyForm)
  }

  return (
    <form
      className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl lg:grid-cols-2"
      onSubmit={handleSubmit}
    >
      <label className="space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Canción
        </span>
        <input
          className="w-full rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
          onChange={(event) => update('title', event.target.value)}
          type="text"
          value={form.title}
        />
      </label>

      <label className="space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Artista
        </span>
        <input
          className="w-full rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
          onChange={(event) => update('artist', event.target.value)}
          type="text"
          value={form.artist}
        />
      </label>

      <label className="space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Género
        </span>
        <input
          className="w-full rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
          onChange={(event) => update('genre', event.target.value)}
          type="text"
          value={form.genre}
        />
      </label>

      <label className="space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Álbum
        </span>
        <input
          className="w-full rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
          onChange={(event) => update('album', event.target.value)}
          type="text"
          value={form.album}
        />
      </label>

      <label className="space-y-2 lg:col-span-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          URL MP3
        </span>
        <input
          className="w-full rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
          onChange={(event) => update('src', event.target.value)}
          type="url"
          value={form.src}
        />
      </label>

      <label className="space-y-2 lg:col-span-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          URL portada
        </span>
        <input
          className="w-full rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
          onChange={(event) => update('cover', event.target.value)}
          type="url"
          value={form.cover}
        />
      </label>

      <button
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 text-xs font-bold uppercase tracking-[0.22em] text-white transition-all hover:bg-violet-400 disabled:opacity-40 lg:col-span-2"
        disabled={!canSubmit || busy}
        type="submit"
      >
        <Icon name="add" />
        Agregar canción
      </button>
    </form>
  )
}

function SongRow({ track, onDelete, busy }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-3">
      <div className="h-14 w-14 flex-none overflow-hidden rounded-xl bg-zinc-900">
        {track.cover ? (
          <img
            alt={track.title}
            className="h-full w-full object-cover"
            src={track.cover}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon className="text-zinc-600" name="music_note" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{track.title}</p>
        <p className="truncate text-xs text-zinc-500">
          {track.artist} · {track.album}
        </p>
      </div>

      <button
        aria-label={`Eliminar ${track.title}`}
        className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
        disabled={busy}
        onClick={() => onDelete(track)}
        type="button"
      >
        <Icon name="delete" />
      </button>
    </div>
  )
}

function SongsAdminPage() {
  const { tracks, addTrack, removeTrack, loading, error } = useSongs()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const sortedTracks = useMemo(
    () => [...tracks].sort((a, b) => a.title.localeCompare(b.title)),
    [tracks],
  )

  const handleCreate = async (form) => {
    setBusy(true)
    setMessage('')
    try {
      await addTrack(form)
      setMessage('Canción agregada.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo agregar.')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (track) => {
    const ok = window.confirm(`¿Eliminar "${track.title}" de la base?`)
    if (!ok) return
    setBusy(true)
    setMessage('')
    try {
      await removeTrack(track.id)
      setMessage('Canción eliminada.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo eliminar.')
    } finally {
      setBusy(false)
    }
  }

  const content = (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
          Catálogo
        </p>
        <h1 className="mt-2 text-5xl font-bold tracking-[-0.05em] text-zinc-100">
          Canciones
        </h1>
      </div>

      <SongForm busy={busy} onSubmit={handleCreate} />

      {message || error ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300">
          {message || error}
        </p>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {sortedTracks.length} canciones
          </h2>
          {loading ? (
            <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">
              Sync
            </span>
          ) : null}
        </div>
        {sortedTracks.map((track) => (
          <SongRow
            busy={busy}
            key={track.id}
            onDelete={handleDelete}
            track={track}
          />
        ))}
      </section>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#051424] text-[#d4e4fa]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/15 blur-[120px]" />
        <div className="absolute bottom-[-10rem] right-[-6rem] h-80 w-80 rounded-full bg-cyan-400/10 blur-[140px]" />
      </div>

      <div className="relative lg:hidden">
        <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center border-b border-white/10 bg-zinc-950/60 px-6 backdrop-blur-2xl">
          <h1 className="text-3xl font-black tracking-[-0.05em] text-zinc-100">
            Songs
          </h1>
        </header>
        <main className="mx-auto max-w-md px-6 pb-36 pt-28">{content}</main>
        <AuraMobileBottomNav active="songs" />
      </div>

      <div className="relative hidden h-screen flex-col overflow-hidden lg:flex">
        <AuraDesktopTopBar />
        <div className="flex min-h-0 flex-1 pt-20">
          <AuraAppSidebar activeKey="songs" />
          <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-28">
            <div className="mx-auto max-w-4xl px-10 py-12">{content}</div>
          </main>
        </div>
      </div>
    </main>
  )
}

export default SongsAdminPage
