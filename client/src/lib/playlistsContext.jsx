import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

// Contexto de playlists del usuario.
// Se persiste en localStorage para que sobreviva al refresh sin
// necesidad de backend. Cuando conectemos Rust + Supabase, el
// PlaylistsProvider va a hacer fetch al servidor y la API expuesta
// (createPlaylist, deletePlaylist, addTrack...) seguirá igual.

const STORAGE_KEY = 'spoticry.playlists.v1'

// Forma de cada playlist:
//   id          → identificador único.
//   title       → nombre que escribió el usuario.
//   description → descripción opcional.
//   isPublic    → bool (lo dejamos persistido aunque todavía no lo usamos).
//   trackIds    → array de ids que apuntan a tracks.js.
//   createdAt   → epoch ms, sirve para ordenar por más reciente.

function loadFromStorage() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch (error) {
    console.warn('[playlists] No se pudo leer localStorage:', error)
    return []
  }
}

function saveToStorage(playlists) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists))
  } catch (error) {
    console.warn('[playlists] No se pudo guardar en localStorage:', error)
  }
}

// Genera un id pseudo-único. No usamos UUID porque no necesitamos
// garantía global; con la marca de tiempo + un random alcanza para
// distinguir creaciones del mismo usuario.
function makeId() {
  return `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

const PlaylistsContext = createContext(null)

export function PlaylistsProvider({ children }) {
  const [playlists, setPlaylists] = useState(loadFromStorage)

  // Cada cambio del array se persiste. Si más adelante agregamos
  // sync con backend, este efecto pasa a hacer un PATCH/POST.
  useEffect(() => {
    saveToStorage(playlists)
  }, [playlists])

  // Crea una playlist nueva y la devuelve para que el caller pueda
  // navegar al detalle inmediatamente con el id recién generado.
  const createPlaylist = useCallback(
    ({ title, description = '', isPublic = true } = {}) => {
      const cleanTitle = (title || '').trim() || 'Untitled Playlist'
      const newPlaylist = {
        id: makeId(),
        title: cleanTitle,
        description: description.trim(),
        isPublic,
        trackIds: [],
        createdAt: Date.now(),
      }
      setPlaylists((prev) => [newPlaylist, ...prev])
      return newPlaylist
    },
    [],
  )

  const deletePlaylist = useCallback((id) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id))
  }, [])

  // Agrega una canción evitando duplicados (si ya está, no la mete dos veces).
  const addTrack = useCallback((playlistId, trackId) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== playlistId) return p
        if (p.trackIds.includes(trackId)) return p
        return { ...p, trackIds: [...p.trackIds, trackId] }
      }),
    )
  }, [])

  const removeTrack = useCallback((playlistId, trackId) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== playlistId) return p
        return { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) }
      }),
    )
  }, [])

  // Helper de lookup, evita repetir .find() en cada componente.
  const getPlaylist = useCallback(
    (id) => playlists.find((p) => p.id === id) ?? null,
    [playlists],
  )

  // Memo del value para no obligar a re-render a todos los consumers
  // cuando el provider re-renderiza por otra razón.
  const value = useMemo(
    () => ({
      playlists,
      createPlaylist,
      deletePlaylist,
      addTrack,
      removeTrack,
      getPlaylist,
    }),
    [playlists, createPlaylist, deletePlaylist, addTrack, removeTrack, getPlaylist],
  )

  return (
    <PlaylistsContext.Provider value={value}>
      {children}
    </PlaylistsContext.Provider>
  )
}

export function usePlaylists() {
  const ctx = useContext(PlaylistsContext)
  if (!ctx) {
    throw new Error('usePlaylists debe usarse dentro de <PlaylistsProvider>')
  }
  return ctx
}
