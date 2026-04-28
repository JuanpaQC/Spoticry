import { useEffect, useMemo, useRef, useState } from 'react'
import { usePlayer } from '../../lib/playerContext.jsx'
import { useSongs } from '../../lib/songsContext.jsx'
import {
  AuraAppSidebar,
  AuraDesktopTopBar,
  AuraMobileBottomNav,
  Icon,
} from '../Aura/auraUi.tsx'

// ─── FileDropZone ───────────────────────────────────────────────────────────

interface FileDropZoneProps {
  accept: string
  file: File | null
  onFile: (f: File) => void
  inputRef: React.RefObject<HTMLInputElement>
  children: React.ReactNode
}

function FileDropZone({ accept, file, onFile, inputRef, children }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  return (
    <div
      className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-colors ${
        isDragging
          ? 'border-violet-400 bg-violet-500/10'
          : file
            ? 'border-violet-500/40 bg-violet-500/5'
            : 'border-white/10 bg-zinc-950/40 hover:border-violet-500/40'
      }`}
      onClick={() => inputRef.current?.click()}
      onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
        type="file"
      />
      {children}
    </div>
  )
}

// ─── SongForm ────────────────────────────────────────────────────────────────

const emptyForm = {
  title: '',
  artist: '',
  genre: '',
  album: '',
  songFile: null as File | null,
  imageFile: null as File | null,
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function SongForm({ onSubmit, busy }: { onSubmit: (form: typeof emptyForm) => Promise<void>; busy: boolean }) {
  const [form, setForm] = useState(emptyForm)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const songInputRef = useRef<HTMLInputElement>(null!)
  const imageInputRef = useRef<HTMLInputElement>(null!)

  const update = (field: keyof typeof emptyForm, value: string | File | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Genera y limpia el object URL de la preview de portada
  useEffect(() => {
    if (!form.imageFile) { setImagePreview(null); return }
    const url = URL.createObjectURL(form.imageFile)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [form.imageFile])

  const canSubmit =
    form.title.trim() &&
    form.artist.trim() &&
    form.genre.trim() &&
    form.album.trim() &&
    form.songFile !== null &&
    form.imageFile !== null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || busy) return
    await onSubmit(form)
    setForm(emptyForm)
    if (songInputRef.current) songInputRef.current.value = ''
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  return (
    <form
      className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl lg:grid-cols-2"
      onSubmit={handleSubmit}
    >
      {/* Campos de texto */}
      {(
        [
          { field: 'title', label: 'Canción' },
          { field: 'artist', label: 'Artista' },
          { field: 'genre', label: 'Género' },
          { field: 'album', label: 'Álbum' },
        ] as const
      ).map(({ field, label }) => (
        <label className="space-y-2" key={field}>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            {label}
          </span>
          <input
            className="w-full rounded-xl border border-white/10 bg-zinc-950/40 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
            onChange={(e) => update(field, e.target.value)}
            type="text"
            value={form[field] as string}
          />
        </label>
      ))}

      {/* Drop zone — Portada */}
      <div className="space-y-2 lg:col-span-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Portada
        </span>
        <FileDropZone
          accept="image/*"
          file={form.imageFile}
          inputRef={imageInputRef}
          onFile={(f) => update('imageFile', f)}
        >
          {form.imageFile && imagePreview ? (
            <div className="flex items-center gap-3 p-3" onClick={(e) => e.stopPropagation()}>
              <img
                alt="preview"
                className="h-16 w-16 flex-none rounded-lg object-cover"
                src={imagePreview}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{form.imageFile.name}</p>
                <p className="text-xs text-zinc-500">{formatBytes(form.imageFile.size)}</p>
              </div>
              <button
                aria-label="Quitar imagen"
                className="flex-none text-zinc-500 hover:text-rose-400"
                onClick={(e) => { e.stopPropagation(); update('imageFile', null) }}
                type="button"
              >
                <Icon name="close" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Icon className="text-3xl text-zinc-600" name="image" />
              <p className="text-xs text-zinc-500">
                Arrastrá la imagen o hacé click
              </p>
              <p className="text-[10px] text-zinc-700">JPG, PNG, WEBP</p>
            </div>
          )}
        </FileDropZone>
      </div>

      {/* Drop zone — MP3 */}
      <div className="space-y-2 lg:col-span-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Archivo de audio
        </span>
        <FileDropZone
          accept=".mp3,audio/*"
          file={form.songFile}
          inputRef={songInputRef}
          onFile={(f) => update('songFile', f)}
        >
          {form.songFile ? (
            <div className="flex items-center gap-3 p-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-violet-500/20">
                <Icon className="text-violet-300" name="audio_file" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{form.songFile.name}</p>
                <p className="text-xs text-zinc-500">{formatBytes(form.songFile.size)}</p>
              </div>
              <button
                aria-label="Quitar audio"
                className="flex-none text-zinc-500 hover:text-rose-400"
                onClick={(e) => { e.stopPropagation(); update('songFile', null) }}
                type="button"
              >
                <Icon name="close" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Icon className="text-3xl text-zinc-600" name="audio_file" />
              <p className="text-xs text-zinc-500">
                Arrastrá el MP3 o hacé click
              </p>
              <p className="text-[10px] text-zinc-700">MP3, OGG, WAV</p>
            </div>
          )}
        </FileDropZone>
      </div>

      <button
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 text-xs font-bold uppercase tracking-[0.22em] text-white transition-all hover:bg-violet-400 disabled:opacity-40 lg:col-span-2"
        disabled={!canSubmit || busy}
        type="submit"
      >
        {busy ? (
          <>
            <Icon name="sync" />
            Subiendo...
          </>
        ) : (
          <>
            <Icon name="add" />
            Agregar canción
          </>
        )}
      </button>
    </form>
  )
}

// ─── SongRow ─────────────────────────────────────────────────────────────────

function SongRow({ track, onDelete, onCancel, isPending, busy }) {
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

      {isPending ? (
        <div className="flex items-center gap-2">
          <button
            aria-label="Cancelar eliminación"
            className="rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 transition-colors hover:text-zinc-100"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
          <button
            aria-label={`Confirmar eliminar ${track.title}`}
            className="flex items-center gap-1 rounded-lg bg-rose-500/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-400 transition-colors hover:bg-rose-500/30 disabled:opacity-40"
            disabled={busy}
            onClick={() => onDelete(track)}
            type="button"
          >
            <Icon name="delete" />
            Eliminar
          </button>
        </div>
      ) : (
        <button
          aria-label={`Eliminar ${track.title}`}
          className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
          disabled={busy}
          onClick={() => onDelete(track)}
          type="button"
        >
          <Icon name="delete" />
        </button>
      )}
    </div>
  )
}

// ─── SongsAdminPage ──────────────────────────────────────────────────────────

function SongsAdminPage() {
  const { tracks, addTrack, removeTrack, loading, error } = useSongs()
  const { currentTrack } = usePlayer()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState(null)

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

  const requestDelete = (track) => {
    if (currentTrack?.id === track.id) {
      setMessage('No se puede eliminar una canción que está en reproducción.')
      return
    }
    setPendingDeleteId(track.id)
    setMessage('')
  }

  const handleDelete = async (track) => {
    if (currentTrack?.id === track.id) {
      setMessage('No se puede eliminar una canción que está en reproducción.')
      setPendingDeleteId(null)
      return
    }
    setBusy(true)
    setMessage('')
    setPendingDeleteId(null)
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
            isPending={pendingDeleteId === track.id}
            key={track.id}
            onCancel={() => setPendingDeleteId(null)}
            onDelete={pendingDeleteId === track.id ? handleDelete : requestDelete}
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
