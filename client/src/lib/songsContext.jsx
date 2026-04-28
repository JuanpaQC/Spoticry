/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { tracks as fallbackTracks } from '../data/tracks.js'
import {
  createSong,
  deleteSong,
  fetchSongs,
} from './api.js'

const SONGS_REFRESH_MS = 4_000

const SongsContext = createContext(null)

export function SongsProvider({ children }) {
  const [tracks, setTracks] = useState(fallbackTracks)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshSongs = useCallback(async () => {
    try {
      const nextTracks = await fetchSongs()
      setTracks(nextTracks)
      setError('')
      return nextTracks
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar canciones')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    const refresh = async () => {
      if (!active) return
      await refreshSongs()
    }

    refresh()
    const intervalId = window.setInterval(refresh, SONGS_REFRESH_MS)

    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [refreshSongs])

  const addTrack = useCallback(
    async (values) => {
      const created = await createSong(values)
      const nextTracks = await refreshSongs()
      return created ?? nextTracks.find((track) => track.title === values.title)
    },
    [refreshSongs],
  )

  const removeTrack = useCallback(
    async (id) => {
      await deleteSong(id)
      setTracks((prev) => prev.filter((track) => track.id !== id))
      await refreshSongs()
    },
    [refreshSongs],
  )

  const findTrackById = useCallback(
    (id) => tracks.find((track) => track.id === id) ?? null,
    [tracks],
  )

  const value = useMemo(
    () => ({
      tracks,
      loading,
      error,
      refreshSongs,
      addTrack,
      removeTrack,
      findTrackById,
    }),
    [tracks, loading, error, refreshSongs, addTrack, removeTrack, findTrackById],
  )

  return <SongsContext.Provider value={value}>{children}</SongsContext.Provider>
}

export function useSongs() {
  const ctx = useContext(SongsContext)
  if (!ctx) {
    throw new Error('useSongs debe usarse dentro de <SongsProvider>')
  }
  return ctx
}
