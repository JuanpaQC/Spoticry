import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { tracks } from '../data/tracks.js'

// Contexto global del reproductor.
// Cualquier componente que llame a usePlayer() puede leer el estado
// (canción activa, si está sonando, progreso, volumen, modo de
// repeat, shuffle) y disparar acciones (play, pause, seek, next,
// previous, setVolume, cycleRepeat, toggleShuffle).

const VOLUME_STORAGE_KEY = 'spoticry.volume.v1'

// Lee el último volumen guardado. Si no hay nada o el valor es
// inválido, vuelve al default de 0.7 (lo mismo que el slider mostraba
// originalmente como mock).
function loadInitialVolume() {
  if (typeof window === 'undefined') return 0.7
  try {
    const raw = window.localStorage.getItem(VOLUME_STORAGE_KEY)
    const v = Number.parseFloat(raw)
    if (Number.isFinite(v) && v >= 0 && v <= 1) return v
  } catch {
    // localStorage puede fallar (modo privado en algunos browsers).
  }
  return 0.7
}

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  // ----- Estado expuesto a la UI -----
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(loadInitialVolume)
  // 'off' = no repetir, 'all' = al terminar pasar a la siguiente y
  // ciclar la cola, 'one' = repetir la misma canción.
  const [repeatMode, setRepeatMode] = useState('off')
  const [shuffle, setShuffle] = useState(false)
  // Cola de reproducción: la "lista" desde la que next/previous
  // navegan. Si la app no la setea, se usa el manifiesto entero.
  const [queue, setQueue] = useState(tracks)

  // ----- Refs internas (mutables, no re-renderizan) -----
  const audioCtxRef = useRef(null)
  const gainNodeRef = useRef(null) // controla el volumen master.
  const bufferRef = useRef(null)
  const sourceRef = useRef(null)
  const startedAtRef = useRef(0)
  const offsetRef = useRef(0)
  const rafRef = useRef(0)

  // Crea (perezosamente) el AudioContext y el GainNode master.
  // El graph queda: source → gainNode → destination, así setVolume
  // es solo cambiar gainNode.gain.value sin reconectar nada.
  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctor = window.AudioContext || window.webkitAudioContext
      const ctx = new Ctor()
      const gain = ctx.createGain()
      gain.gain.value = volume
      gain.connect(ctx.destination)
      audioCtxRef.current = ctx
      gainNodeRef.current = gain
    }
    return audioCtxRef.current
  }, [volume])

  const stopSource = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.onended = null
        sourceRef.current.stop()
      } catch {
        // Puede ya estar detenida.
      }
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  // Refs auxiliares para que el tick (que vive dentro de un closure
  // que se reasigna por render) pueda invocar las versiones más
  // recientes de play / next / handleNaturalEnd sin dependencias
  // circulares de useCallback.
  const handleEndRef = useRef(() => {})
  const tickRef = useRef(() => {})

  // El tick lee la posición actual del AudioContext y la traduce a
  // segundos dentro del buffer. Cuando supera la duración, dispara
  // el handler de "fin natural" (que decide qué hacer según repeat
  // y shuffle).
  tickRef.current = () => {
    const ctx = audioCtxRef.current
    const buffer = bufferRef.current
    if (!ctx || !buffer || !sourceRef.current) return
    const elapsed = ctx.currentTime - startedAtRef.current
    const t = offsetRef.current + elapsed
    if (t >= buffer.duration) {
      setCurrentTime(buffer.duration)
      stopSource()
      handleEndRef.current()
      return
    }
    setCurrentTime(t)
    rafRef.current = requestAnimationFrame(() => tickRef.current())
  }

  const startPlaybackFromOffset = useCallback(
    (offset) => {
      const ctx = getCtx()
      const buffer = bufferRef.current
      if (!buffer) return
      stopSource()
      const source = ctx.createBufferSource()
      source.buffer = buffer
      // Conectamos al GainNode para que el volumen master afecte la
      // salida sin tener que tocar la fuente.
      source.connect(gainNodeRef.current)
      source.start(0, offset)
      sourceRef.current = source
      startedAtRef.current = ctx.currentTime
      offsetRef.current = offset
      setIsPlaying(true)
      rafRef.current = requestAnimationFrame(() => tickRef.current())
    },
    [getCtx, stopSource],
  )

  // Reproduce una canción. Si se pasa `queueOverride`, esa lista
  // pasa a ser la cola activa (next/previous van a navegar dentro
  // de esa lista). Si no, la cola se mantiene como estaba.
  const play = useCallback(
    async (track, queueOverride = null) => {
      if (!track) return
      const ctx = getCtx()
      if (ctx.state === 'suspended') {
        try {
          await ctx.resume()
        } catch {
          // No crítico.
        }
      }

      // Si el caller indicó una cola nueva, la sustituimos. La cola
      // garantiza por lo menos la propia canción para que next/prev
      // tengan algo donde caer si la lista venía vacía.
      if (Array.isArray(queueOverride) && queueOverride.length > 0) {
        setQueue(queueOverride)
      }

      // Si ya está cargada esta canción, reanudamos desde el offset
      // guardado (típico flujo de pause → play).
      if (currentTrack?.id === track.id && bufferRef.current) {
        startPlaybackFromOffset(offsetRef.current)
        return
      }

      // Canción nueva: descargamos + decodificamos.
      stopSource()
      bufferRef.current = null
      offsetRef.current = 0
      setCurrentTime(0)
      setDuration(0)
      setCurrentTrack(track)
      setIsLoading(true)

      try {
        const response = await fetch(track.src)
        if (!response.ok) {
          throw new Error(`Fallo al descargar ${track.src} (${response.status})`)
        }
        const arrayBuffer = await response.arrayBuffer()
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
        bufferRef.current = audioBuffer
        setDuration(audioBuffer.duration)
        setIsLoading(false)
        startPlaybackFromOffset(0)
      } catch (error) {
        console.error('[player] Error cargando canción:', error)
        setIsLoading(false)
        setIsPlaying(false)
      }
    },
    [currentTrack, getCtx, startPlaybackFromOffset, stopSource],
  )

  const pause = useCallback(() => {
    if (!sourceRef.current || !audioCtxRef.current) return
    const elapsed = audioCtxRef.current.currentTime - startedAtRef.current
    offsetRef.current = offsetRef.current + elapsed
    stopSource()
    setIsPlaying(false)
  }, [stopSource])

  const resume = useCallback(() => {
    if (!bufferRef.current) return
    startPlaybackFromOffset(offsetRef.current)
  }, [startPlaybackFromOffset])

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause()
    } else if (bufferRef.current) {
      resume()
    }
  }, [isPlaying, pause, resume])

  const seek = useCallback(
    (seconds) => {
      const buffer = bufferRef.current
      if (!buffer) return
      const clamped = Math.max(0, Math.min(seconds, buffer.duration))
      offsetRef.current = clamped
      setCurrentTime(clamped)
      if (isPlaying) {
        startPlaybackFromOffset(clamped)
      }
    },
    [isPlaying, startPlaybackFromOffset],
  )

  // ----- Volumen, shuffle y repeat -----

  const setVolume = useCallback((value) => {
    const clamped = Math.max(0, Math.min(1, value))
    setVolumeState(clamped)
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clamped
    }
    try {
      window.localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped))
    } catch {
      // Ignorar fallos de localStorage.
    }
  }, [])

  // Cicla off → all → one → off (orden tipo Spotify).
  const cycleRepeat = useCallback(() => {
    setRepeatMode((mode) =>
      mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off',
    )
  }, [])

  const toggleShuffle = useCallback(() => {
    setShuffle((value) => !value)
  }, [])

  // Calcula el siguiente track de la cola. Cuando shuffle está
  // activo y hay más de una canción, escoge una distinta al azar.
  const pickNextTrack = useCallback(() => {
    const list = queue.length > 0 ? queue : tracks
    if (list.length === 0) return null
    if (shuffle && list.length > 1) {
      let idx
      do {
        idx = Math.floor(Math.random() * list.length)
      } while (currentTrack && list[idx].id === currentTrack.id)
      return list[idx]
    }
    const idx = currentTrack
      ? list.findIndex((t) => t.id === currentTrack.id)
      : -1
    return list[(idx + 1) % list.length]
  }, [queue, shuffle, currentTrack])

  const pickPreviousTrack = useCallback(() => {
    const list = queue.length > 0 ? queue : tracks
    if (list.length === 0) return null
    if (shuffle && list.length > 1) {
      // En shuffle, prev también es random. (Spotify tiene un
      // historial; lo dejamos para una iteración futura.)
      return pickNextTrack()
    }
    const idx = currentTrack
      ? list.findIndex((t) => t.id === currentTrack.id)
      : 0
    const prevIdx = (idx - 1 + list.length) % list.length
    return list[prevIdx]
  }, [queue, shuffle, currentTrack, pickNextTrack])

  const next = useCallback(() => {
    const t = pickNextTrack()
    if (t) play(t)
  }, [pickNextTrack, play])

  const previous = useCallback(() => {
    const t = pickPreviousTrack()
    if (t) play(t)
  }, [pickPreviousTrack, play])

  // Handler de "la canción terminó sola" (no fue stop manual).
  // - 'one'  → la misma canción se vuelve a reproducir desde 0.
  // - 'all'  → siguiente canción de la cola (con o sin shuffle).
  // - 'off'  → simplemente se queda en estado pausado al final.
  handleEndRef.current = () => {
    if (repeatMode === 'one' && currentTrack) {
      offsetRef.current = 0
      setCurrentTime(0)
      startPlaybackFromOffset(0)
      return
    }
    if (repeatMode === 'all') {
      next()
      return
    }
    setIsPlaying(false)
  }

  // Cleanup al desmontar la app entera.
  useEffect(() => {
    return () => {
      stopSource()
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
        audioCtxRef.current = null
        gainNodeRef.current = null
      }
    }
  }, [stopSource])

  const value = useMemo(
    () => ({
      currentTrack,
      isPlaying,
      isLoading,
      currentTime,
      duration,
      volume,
      repeatMode,
      shuffle,
      queue,
      play,
      pause,
      resume,
      toggle,
      seek,
      next,
      previous,
      setVolume,
      cycleRepeat,
      toggleShuffle,
    }),
    [
      currentTrack,
      isPlaying,
      isLoading,
      currentTime,
      duration,
      volume,
      repeatMode,
      shuffle,
      queue,
      play,
      pause,
      resume,
      toggle,
      seek,
      next,
      previous,
      setVolume,
      cycleRepeat,
      toggleShuffle,
    ],
  )

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) {
    throw new Error('usePlayer debe usarse dentro de <PlayerProvider>')
  }
  return ctx
}

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
