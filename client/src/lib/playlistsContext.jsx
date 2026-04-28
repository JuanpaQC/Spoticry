/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  addSongToPlaylist,
  createPlaylist as createPlaylistRequest,
  deletePlaylist as deletePlaylistRequest,
  fetchPlaylists,
  removeSongFromPlaylist,
} from './api.js'

const PLAYLISTS_REFRESH_MS = 5_000

const PlaylistsContext = createContext(null)

export function PlaylistsProvider({ children }) {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshPlaylists = useCallback(async () => {
    try {
      const nextPlaylists = await fetchPlaylists()
      setPlaylists(nextPlaylists)
      setError('')
      return nextPlaylists
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar playlists')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    const refresh = async () => {
      if (!active) return
      await refreshPlaylists()
    }

    refresh()
    const intervalId = window.setInterval(refresh, PLAYLISTS_REFRESH_MS)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [refreshPlaylists])

  const createPlaylist = useCallback(
    async ({ title } = {}) => {
      const cleanTitle = (title || '').trim() || 'Untitled Playlist'
      const created = await createPlaylistRequest({ title: cleanTitle })
      const nextPlaylists = await refreshPlaylists()
      return (
        created ??
        nextPlaylists.find((playlist) => playlist.title === cleanTitle) ??
        null
      )
    },
    [refreshPlaylists],
  )

  const deletePlaylist = useCallback(
    async (id) => {
      await deletePlaylistRequest(id)
      setPlaylists((prev) => prev.filter((playlist) => playlist.id !== id))
      await refreshPlaylists()
    },
    [refreshPlaylists],
  )

  const addTrack = useCallback(
    async (playlistId, trackId) => {
      const updated = await addSongToPlaylist(playlistId, trackId)
      if (updated) {
        setPlaylists((prev) =>
          prev.map((playlist) => (playlist.id === updated.id ? updated : playlist)),
        )
      }
      await refreshPlaylists()
    },
    [refreshPlaylists],
  )

  const removeTrack = useCallback(
    async (playlistId, trackId) => {
      const updated = await removeSongFromPlaylist(playlistId, trackId)
      if (updated) {
        setPlaylists((prev) =>
          prev.map((playlist) => (playlist.id === updated.id ? updated : playlist)),
        )
      }
      await refreshPlaylists()
    },
    [refreshPlaylists],
  )

  const getPlaylist = useCallback(
    (id) => playlists.find((playlist) => playlist.id === id) ?? null,
    [playlists],
  )

  const value = useMemo(
    () => ({
      playlists,
      loading,
      error,
      refreshPlaylists,
      createPlaylist,
      deletePlaylist,
      addTrack,
      removeTrack,
      getPlaylist,
    }),
    [
      playlists,
      loading,
      error,
      refreshPlaylists,
      createPlaylist,
      deletePlaylist,
      addTrack,
      removeTrack,
      getPlaylist,
    ],
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
