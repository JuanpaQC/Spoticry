import { useEffect, useState } from 'react'
import { formatTime, usePlayer } from '../../lib/playerContext.jsx'

const PLAYER_HIDE_DELAY_MS = 90_000

// Iconito de Material Symbols. `filled` alterna la variante sólida.
function PlayerIcon({ name, filled = false, className = '' }) {
  const style = filled
    ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
    : undefined

  return (
    <span className={`material-symbols-outlined ${className}`} style={style}>
      {name}
    </span>
  )
}

// Convierte un evento de click en una barra horizontal a un ratio 0..1.
// currentTarget es la barra completa; clientX es el x del mouse.
// Sirve tanto para la barra de progreso (seek) como para la de volumen.
function computeRatio(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  return Math.max(0, Math.min(1, ratio))
}

function useDelayedPlayerVisibility(currentTrack, isPlaying, isLoading) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!currentTrack) {
      setIsVisible(false)
      return undefined
    }

    if (isPlaying || isLoading) {
      setIsVisible(true)
      return undefined
    }

    setIsVisible(true)
    const timeoutId = window.setTimeout(() => {
      setIsVisible(false)
    }, PLAYER_HIDE_DELAY_MS)

    return () => window.clearTimeout(timeoutId)
  }, [currentTrack, isPlaying, isLoading])

  return currentTrack && isVisible
}

// Mini-player para mobile (tarjeta flotante arriba de los tabs).
// Se oculta si todavía no hay canción cargada (currentTrack === null),
// así no aparece vacío en la pantalla Home antes de tocar play.
function MobileMiniPlayer({ className = '' }) {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    toggle,
    next,
    previous,
  } = usePlayer()
  const showPlayer = useDelayedPlayerVisibility(
    currentTrack,
    isPlaying,
    isLoading,
  )

  if (!showPlayer) return null

  const progress = duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'

  return (
    <div className={className}>
      <div className="flex h-20 items-center gap-4 rounded-[1.35rem] border border-white/10 bg-zinc-900/80 px-4 backdrop-blur-md shadow-[0_-4px_24px_rgba(139,92,246,0.1)]">
        <div className="h-12 w-12 flex-none overflow-hidden rounded-xl">
          <img
            alt={currentTrack.title}
            className="h-full w-full object-cover"
            src={currentTrack.cover}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-white">
            {currentTrack.title}
          </p>
          <div className="mt-2 h-1 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#d0bcff] shadow-[0_0_8px_rgba(208,188,255,0.6)]"
              style={{ width: progress }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            aria-label="Previous"
            className="text-white"
            onClick={previous}
            type="button"
          >
            <PlayerIcon className="text-3xl" name="skip_previous" />
          </button>
          <button
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="ambient-glow flex h-10 w-10 items-center justify-center rounded-full bg-[#d0bcff] text-[#3c0091] disabled:opacity-60"
            disabled={isLoading}
            onClick={toggle}
            type="button"
          >
            <PlayerIcon filled name={isPlaying ? 'pause' : 'play_arrow'} />
          </button>
          <button
            aria-label="Next"
            className="text-white"
            onClick={next}
            type="button"
          >
            <PlayerIcon className="text-3xl" name="skip_next" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Barra fija inferior en desktop (estilo Spotify). También se oculta
// si no hay canción, para no bloquear contenido cuando está vacía.
function DesktopPlayerBar({ className = '' }) {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    repeatMode,
    shuffle,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    cycleRepeat,
    toggleShuffle,
  } = usePlayer()
  const showPlayer = useDelayedPlayerVisibility(
    currentTrack,
    isPlaying,
    isLoading,
  )

  if (!showPlayer) return null

  const progress = duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
  // El volumen viene en 0..1; lo convertimos a porcentaje para el width
  // del fill de la barra.
  const volumePercent = `${Math.round(volume * 100)}%`

  // Click en la barra de progreso: calcula segundos y llama a seek().
  const handleSeekClick = (event) => {
    if (duration <= 0) return
    seek(computeRatio(event) * duration)
  }

  // Click en la barra de volumen: el ratio (0..1) ES el volumen.
  const handleVolumeClick = (event) => {
    setVolume(computeRatio(event))
  }

  // Estados visuales:
  // - shuffle on  → violeta y un puntito debajo (estilo Spotify).
  // - repeat ≠ off → violeta. Si es 'one', cambiamos el ícono.
  const shuffleOn = shuffle
  const repeatOn = repeatMode !== 'off'
  const repeatIcon = repeatMode === 'one' ? 'repeat_one' : 'repeat'

  // Ícono de volumen según nivel: muteado, bajo, medio, alto. Es solo
  // detalle visual para que el usuario sepa de un vistazo qué nivel
  // está activo.
  const volumeIcon =
    volume === 0
      ? 'volume_off'
      : volume < 0.34
        ? 'volume_down'
        : volume < 0.67
          ? 'volume_up'
          : 'volume_up'

  return (
    <footer className={className}>
      <div className="flex w-1/3 items-center gap-4">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl">
          <img
            alt={currentTrack.title}
            className="h-full w-full object-cover"
            src={currentTrack.cover}
          />
        </div>
        <div>
          <h4 className="leading-tight text-white">{currentTrack.title}</h4>
          <p className="text-sm text-zinc-400">{currentTrack.artist}</p>
        </div>
        <button
          aria-label="Favorite current song"
          className="ml-4 text-zinc-500 transition-colors hover:text-violet-400"
          type="button"
        >
          <PlayerIcon name="favorite" />
        </button>
      </div>

      <div className="flex w-1/3 flex-col items-center gap-2">
        <div className="flex items-center gap-8">
          <button
            aria-label={shuffleOn ? 'Disable shuffle' : 'Enable shuffle'}
            className={`relative transition-colors ${
              shuffleOn
                ? 'text-violet-400'
                : 'text-zinc-400 hover:text-white'
            }`}
            onClick={toggleShuffle}
            type="button"
          >
            <PlayerIcon name="shuffle" />
            {shuffleOn ? (
              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-violet-400" />
            ) : null}
          </button>
          <button
            aria-label="Previous"
            className="text-zinc-400 transition-colors hover:text-white"
            onClick={previous}
            type="button"
          >
            <PlayerIcon name="skip_previous" />
          </button>
          <button
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="scale-125 text-violet-500 transition-transform hover:text-violet-400 active:scale-90 disabled:opacity-60"
            disabled={isLoading}
            onClick={toggle}
            type="button"
          >
            <PlayerIcon
              className="text-4xl"
              filled
              name={isPlaying ? 'pause_circle' : 'play_circle'}
            />
          </button>
          <button
            aria-label="Next"
            className="text-zinc-400 transition-colors hover:text-white"
            onClick={next}
            type="button"
          >
            <PlayerIcon name="skip_next" />
          </button>
          <button
            aria-label={`Repeat: ${repeatMode}`}
            className={`relative transition-colors ${
              repeatOn ? 'text-violet-400' : 'text-zinc-400 hover:text-white'
            }`}
            onClick={cycleRepeat}
            type="button"
          >
            <PlayerIcon name={repeatIcon} />
            {repeatOn ? (
              <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-violet-400" />
            ) : null}
          </button>
        </div>

        <div className="flex w-full items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            {formatTime(currentTime)}
          </span>
          <div
            className="group relative h-1 flex-1 cursor-pointer rounded-full bg-white/10"
            onClick={handleSeekClick}
          >
            <div
              className="absolute h-full rounded-full bg-violet-500"
              style={{ width: progress }}
            />
            <div
              className="absolute -top-1 h-3 w-3 rounded-full bg-white opacity-0 shadow-[0_0_10px_white] transition-opacity group-hover:opacity-100"
              style={{ left: progress }}
            />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className="flex w-1/3 items-center justify-end gap-6">
        <button
          aria-label="Lyrics"
          className="text-zinc-400 transition-colors hover:text-white"
          type="button"
        >
          <PlayerIcon name="lyrics" />
        </button>
        <button
          aria-label="Queue"
          className="text-zinc-400 transition-colors hover:text-white"
          type="button"
        >
          <PlayerIcon name="queue_music" />
        </button>
        <div className="flex w-32 items-center gap-3">
          {/* Click en el ícono de volumen → mute / unmute. Si el volumen
              está en 0, lo restauramos a 0.7 (un default razonable). */}
          <button
            aria-label={volume === 0 ? 'Unmute' : 'Mute'}
            className="text-zinc-400 transition-colors hover:text-white"
            onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
            type="button"
          >
            <PlayerIcon className="text-sm" name={volumeIcon} />
          </button>
          {/* La barra de volumen funciona igual que la de seek: click en
              cualquier punto y el ratio se usa como nuevo volumen. */}
          <div
            className="group relative h-1 flex-1 cursor-pointer rounded-full bg-white/10"
            onClick={handleVolumeClick}
          >
            <div
              className="absolute h-full rounded-full bg-zinc-400 group-hover:bg-violet-400"
              style={{ width: volumePercent }}
            />
            <div
              className="absolute -top-1 h-3 w-3 rounded-full bg-white opacity-0 shadow-[0_0_10px_white] transition-opacity group-hover:opacity-100"
              style={{ left: volumePercent }}
            />
          </div>
        </div>
        <button
          aria-label="Fullscreen"
          className="text-zinc-400 transition-colors hover:text-white"
          type="button"
        >
          <PlayerIcon name="fullscreen" />
        </button>
      </div>
    </footer>
  )
}

export { DesktopPlayerBar, MobileMiniPlayer }
