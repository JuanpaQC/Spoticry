import { useEffect, useState } from 'react'
import { tracks } from '../../data/tracks.js'
import { usePlayer } from '../../lib/playerContext.jsx'
import {
  AuraAppSidebar,
  AuraDesktopTopBar,
  AuraMobileBottomNav,
  Icon,
  ScreenLink,
  profileImage,
} from '../Aura/auraUi.tsx'

const heroTracks = tracks.filter((track) =>
  track.cover?.startsWith('/music/covers/'),
)
const HERO_COVER_INTERVAL_MS = 5000
const HERO_COVER_FADE_MS = 700

// Card de track. Click → play, y la queue del player pasa a ser todo
// `tracks` así next/previous se mueven dentro del manifiesto.
function TrackCard({ track, onPlay, isActive }) {
  return (
    <button
      className="group cursor-pointer text-left"
      onClick={onPlay}
      type="button"
    >
      <div className="relative mb-4 aspect-square overflow-hidden rounded-[1.35rem] shadow-2xl">
        <img
          alt={track.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          src={track.cover}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-violet-500/20 opacity-0 transition-opacity group-hover:opacity-100">
          <Icon className="text-5xl text-white" filled name="play_circle" />
        </div>
      </div>
      <h3
        className={`truncate text-base font-semibold ${
          isActive ? 'text-violet-300' : 'text-white'
        }`}
      >
        {track.title}
      </h3>
      <p className="text-sm text-zinc-500">{track.artist}</p>
    </button>
  )
}

// Fila compacta de track (mobile). Mismo handler de play.
function TrackRow({ track, onPlay, isActive }) {
  return (
    <button
      className={`flex w-full items-center gap-4 rounded-[1.2rem] p-3 text-left transition-colors ${
        isActive ? 'bg-violet-500/10' : 'hover:bg-white/5'
      }`}
      onClick={onPlay}
      type="button"
    >
      <div className="h-14 w-14 flex-none overflow-hidden rounded-xl">
        <img
          alt={track.title}
          className="h-full w-full object-cover"
          src={track.cover}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-base font-medium ${
            isActive ? 'text-violet-300' : 'text-white'
          }`}
        >
          {track.title}
        </p>
        <p className="truncate text-sm text-zinc-500">{track.artist}</p>
      </div>
    </button>
  )
}

function MenuPage() {
  const { play, currentTrack } = usePlayer()
  const [featuredTrackIndex, setFeaturedTrackIndex] = useState(0)
  const [heroCoversReady, setHeroCoversReady] = useState(
    heroTracks.length === 0,
  )

  const featuredTrack =
    heroTracks.length > 0
      ? heroTracks[featuredTrackIndex % heroTracks.length]
      : null
  const recentTracks = currentTrack
    ? [currentTrack, ...tracks.filter((track) => track.id !== currentTrack.id)]
    : tracks

  useEffect(() => {
    if (heroTracks.length === 0) return undefined

    let cancelled = false

    const coverLoads = heroTracks.map(
      (track) =>
        new Promise((resolve) => {
          const image = new window.Image()
          image.onload = resolve
          image.onerror = resolve
          image.src = track.cover
        }),
    )

    Promise.all(coverLoads).then(() => {
      if (!cancelled) setHeroCoversReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!heroCoversReady || heroTracks.length <= 1) return undefined

    const intervalId = window.setInterval(() => {
      setFeaturedTrackIndex((index) => (index + 1) % heroTracks.length)
    }, HERO_COVER_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [heroCoversReady])

  // Reproduce un track puntual y reemplaza la queue con todos los tracks
  // del manifiesto. Así desde el menú el "siguiente" recorre todo.
  const handlePlay = (track) => {
    play(track, tracks)
  }

  // Hero "Listen Now": reproduce el track cuyo cover está destacado.
  const handleHeroPlay = () => {
    if (featuredTrack) play(featuredTrack, tracks)
  }

  return (
    <main className="min-h-screen bg-[#051424] text-[#d4e4fa]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-12rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-4rem] h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      {/* Mobile: header + hero + grid de tracks + bottom nav unificada. */}
      <div className="relative lg:hidden">
        <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-zinc-950/40 backdrop-blur-2xl">
          <div className="mx-auto flex h-20 max-w-md items-center justify-between px-6">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                Welcome back
              </span>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Spoticry
              </h1>
            </div>

            <div className="h-8 w-8 overflow-hidden rounded-full border border-white/10 bg-[#1c2b3c]">
              <img
                alt="User profile"
                className="h-full w-full object-cover"
                src={profileImage}
              />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-md space-y-10 px-6 pb-36 pt-24">
          {/* Hero compacto: shortcut directo al search y al play. */}
          <section className="rounded-[1.6rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">
              Listen now
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-zinc-100">
              Reproducí tu colección
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Tocá una canción de abajo para empezar, o usá el tab de search
              para encontrar algo puntual.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-violet-500 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-[0_10px_30px_rgba(139,92,246,0.3)] disabled:opacity-40"
                disabled={tracks.length === 0}
                onClick={handleHeroPlay}
                type="button"
              >
                <Icon filled name="play_arrow" />
                Listen Now
              </button>
              <ScreenLink
                aria-label="Go to search"
                className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white"
                screen="search"
              >
                <Icon name="search" />
                Search
              </ScreenLink>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-white">
              Escuchados recientes
            </h2>
            <div className="space-y-2">
              {recentTracks.map((track) => (
                <TrackRow
                  isActive={currentTrack?.id === track.id}
                  key={track.id}
                  onPlay={() => handlePlay(track)}
                  track={track}
                />
              ))}
            </div>
          </section>
        </div>

        <AuraMobileBottomNav active="home" />
      </div>

      {/* Desktop: dashboard con sidebar unificada. */}
      <div className="relative hidden h-screen flex-col overflow-hidden lg:flex">
        <AuraDesktopTopBar />

        <div className="flex min-h-0 flex-1 pt-20">
          <AuraAppSidebar activeKey="home" />

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-10 pb-32 pt-2">
            {/* Hero. "Listen Now" reproduce el cover destacado actual. */}
            <section className="relative mb-12 min-h-[440px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#071827]">
              {heroTracks.length > 0 ? (
                heroTracks.map((track, index) => (
                  <img
                    aria-hidden="true"
                    alt=""
                    className={`absolute inset-0 h-full w-full object-cover blur-2xl transition-opacity ease-in-out ${
                      index === featuredTrackIndex ? 'opacity-25' : 'opacity-0'
                    }`}
                    decoding="async"
                    key={`${track.id}-hero-glow`}
                    loading="eager"
                    src={track.cover}
                    style={{ transitionDuration: `${HERO_COVER_FADE_MS}ms` }}
                  />
                ))
              ) : null}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_40%,rgba(34,211,238,0.22),transparent_34%),linear-gradient(115deg,rgba(5,20,36,0.98)_0%,rgba(5,20,36,0.88)_52%,rgba(5,20,36,0.46)_100%)]" />

              <div className="relative grid min-h-[440px] grid-cols-1 items-center gap-8 p-8 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:gap-10 xl:p-12">
                <div className="flex min-w-0 flex-col items-start gap-4">
                  <span className="rounded-full border border-violet-500/30 bg-violet-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300 backdrop-blur-md">
                    Tu colección
                  </span>
                  <h1 className="max-w-3xl text-5xl font-bold leading-[0.95] tracking-[-0.04em] text-white xl:text-6xl">
                    Reproducí lo que te encanta
                  </h1>
                  <p className="max-w-xl text-base leading-7 text-zinc-300">
                    El cover destacado cambia suavemente. Dale play y empieza
                    a sonar esa canción.
                  </p>

                  <div className="mt-4 flex gap-4">
                    <button
                      className="flex items-center gap-2 rounded-full bg-violet-500 px-8 py-3 font-semibold text-white transition-all hover:bg-violet-400 disabled:opacity-40"
                      disabled={!featuredTrack}
                      onClick={handleHeroPlay}
                      type="button"
                    >
                      <Icon filled name="play_arrow" />
                      Listen Now
                    </button>
                    <ScreenLink
                      aria-label="Go to search"
                      className="rounded-full border border-white/10 bg-white/5 px-8 py-3 font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10"
                      screen="search"
                    >
                      Search Tracks
                    </ScreenLink>
                  </div>
                </div>

                {featuredTrack ? (
                  <div className="relative justify-self-center xl:justify-self-end">
                    <div className="absolute -inset-5 rounded-[2rem] bg-cyan-400/10 blur-2xl" />
                    <div className="relative aspect-square w-[min(68vw,320px)] overflow-hidden rounded-[1.6rem] border border-white/15 bg-black/25 p-3 shadow-[0_28px_80px_rgba(0,0,0,0.45)] xl:w-[min(32vw,360px)]">
                      <div className="relative h-full w-full rounded-[1.15rem]">
                        {heroTracks.map((track, index) => (
                          <img
                            aria-hidden={index !== featuredTrackIndex}
                            alt={
                              index === featuredTrackIndex
                                ? `${track.album} cover`
                                : ''
                            }
                            className={`absolute inset-0 h-full w-full rounded-[1.15rem] object-contain transition-opacity ease-in-out ${
                              index === featuredTrackIndex
                                ? 'opacity-100'
                                : 'opacity-0'
                            }`}
                            decoding="async"
                            key={`${track.id}-hero-cover`}
                            loading="eager"
                            src={track.cover}
                            style={{
                              transitionDuration: `${HERO_COVER_FADE_MS}ms`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section>
              <div className="mb-8">
                <h2 className="mb-2 text-3xl font-semibold text-white">
                  Escuchados recientes
                </h2>
                <p className="text-sm text-zinc-500">
                  Volvé rápido a las canciones que tenés a mano.
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-3 xl:grid-cols-5">
                {recentTracks.map((track) => (
                  <TrackCard
                    isActive={currentTrack?.id === track.id}
                    key={track.id}
                    onPlay={() => handlePlay(track)}
                    track={track}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

export default MenuPage
