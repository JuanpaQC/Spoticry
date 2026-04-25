import { useState } from 'react'
import { usePlaylists } from '../../lib/playlistsContext.jsx'
import {
  AuraAppSidebar,
  AuraDesktopTopBar,
  AuraMobileBottomNav,
  Icon,
} from '../Aura/auraUi.tsx'

const collageImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAQ6UJmrZoD06bXxc5ETjCcrkEkjdGhSwrlpv0MtXAveJHzLUBSwKvSE-bgh4f0Ut4Pb-i45AadtJM6W43JMmaLJBHvb3Iz5gUGsHh9xKvxFtlV08oXdM4_jv4--gTaEuk34O8BgtVtGJTdFArruTZtJS-oN0V8EwxyKYBAJpqfHVz4ihAnsCNP5MlpWGsfKkL0_41yBFQuqlOIxiFmAoJVwDd1vZ4i0hTqcFdOmutRFzjTT7vTn8qAGuvZLF30d5iGsfeb21klSy0L',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA78xCh-zg3vgjvsWFDFKKpt7y8ohBBWbbQB1ZDHGooNb6zTQUL12d6jz6ceYTKyMnjYaqK9pIrvB6KEzw4-G_TbLiyb7ygPb8yUjECUY07muZ9iW3pNroCe4ITVrKoCh47T3qi4HtOQMZvyr7QQVC62FhXKrxg69ELXwKSmZIBWeNlzMGdJ6eCeQu6sL-Nd9W-NpC-JzWbFHHokYDILReniPck56DDpm4vHtXqRhAvCGmOuQ6QNZjfZk2bKRNm1V_y-HA7zVod6xeP',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBWIBb5yrvDRutle5JsoElOJ2VPl8pjdLRn20Aa1FfJBYcDF3yycYUvuRYgbihRhriuB7AqpHgom0DRK-HD4hpHJf_72QgHq5isdlmmimZYbAiyP_Ti8JN192Lv9d6Trn2b-M_vPmapAllcmy1xmsj5mzM0LXa7JvgTM_95yHRHO5hfPcehqCWge1Dhex9ZfcNzBlVFcpyGqCA36taKVKJHq1TeddqC-NNbgbxYjDZCWq0-pSkhjMtzNl7Cs62_LlEUZyP6W3z4ys6H',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC1xQR4qRC8x7UzMym63TyRhA3YZ0_chZtvmth7AOZwCkJsfm236jphnWMI55DObxkQGxbQMFh_JmBWxtXhuSSOTDFWEXPw6giHGTxFlTEnnCJRyTRxq6kM_5re0rU8ptfCQaWql9lXnM0YLAJRoktNADOgqG8LS4_XgjREf7QGtnZ3LXgZ-soS3OS9V2rhVfFRW7eAtGb0reuHsB8cQeh5bb8JeZjSlH5cofQ1MozijkytXKkXJ5unhBH9V4IBBQ7-ckaF3e9ack5N',
]

const mobileQuadrants = [
  { icon: 'music_note', className: 'border-b border-r border-white/5 bg-zinc-800' },
  { icon: 'album', className: 'border-b border-white/5 bg-zinc-900' },
  {
    icon: 'mic_external_on',
    className: 'border-r border-white/5 bg-zinc-900',
  },
  { icon: 'graphic_eq', className: 'bg-zinc-800' },
]

// Helper para cambiar de pantalla por hash (lo usamos al cancelar y al
// crear). Si el ambiente no tiene window (SSR test), no hace nada.
function navigate(hash) {
  if (typeof window === 'undefined') return
  window.location.hash = hash
}

function CreatePlaylistPage() {
  // Estado compartido del form. Lo declaramos en el padre (no en cada
  // input) para que mobile y desktop compartan los mismos valores: si
  // el usuario gira el dispositivo, no pierde lo que escribió.
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  const { createPlaylist } = usePlaylists()

  // Toggle del switch público/privado.
  const togglePublic = () => setIsPublic((value) => !value)

  // Handler de "Crear playlist": valida que haya nombre, llama al store
  // y navega al detalle de la playlist recién creada usando el id que
  // devuelve createPlaylist.
  const handleCreate = () => {
    const cleanTitle = name.trim()
    if (!cleanTitle) {
      // Si el nombre está vacío, no hacemos nada. El context igual le
      // pondría 'Untitled Playlist', pero preferimos forzar al usuario
      // a darle un nombre intencionalmente.
      return
    }

    const playlist = createPlaylist({
      title: cleanTitle,
      description,
      isPublic,
    })

    navigate(`#playlist-detail/${playlist.id}`)
  }

  // Cancelar / cerrar el form: volvemos a la biblioteca.
  const handleCancel = () => navigate('#library')

  // Truthy si se puede crear (al menos hay nombre). Lo usamos para
  // deshabilitar el botón visualmente.
  const canCreate = name.trim().length > 0

  return (
    <main className="min-h-screen bg-[#051424] text-[#d4e4fa]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute right-[-12rem] top-40 h-96 w-96 rounded-full bg-violet-500/10 blur-[140px]" />
        <div className="absolute bottom-10 left-[-10rem] h-80 w-80 rounded-full bg-cyan-400/8 blur-[120px]" />
      </div>

      {/* Mobile keeps the lightweight creation flow from Stitch so the CTA */}
      {/* stays visible above the bottom tab bar. */}
      <div className="relative lg:hidden">
        <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between border-b border-white/10 bg-zinc-950/60 px-6 backdrop-blur-2xl">
          <div className="flex items-center gap-4">
            <button
              aria-label="Close"
              className="text-zinc-400 transition-all hover:text-zinc-100 active:scale-95"
              onClick={handleCancel}
              type="button"
            >
              <Icon name="close" />
            </button>
            <span className="text-2xl font-black uppercase tracking-[-0.06em] text-zinc-100">
              AURA
            </span>
          </div>

          <button
            className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-400 transition-colors hover:text-violet-300 disabled:opacity-40"
            disabled={!canCreate}
            onClick={handleCreate}
            type="button"
          >
            Save
          </button>
        </header>

        <main className="mx-auto max-w-md px-6 pb-36 pt-28">
          <section className="space-y-10">
            <div className="group relative cursor-pointer">
              <div className="glass-surface relative aspect-square overflow-hidden rounded-[1.6rem] border border-white/10 transition-all duration-500 hover:border-violet-500/30">
                <div className="grid h-full w-full grid-cols-2 grid-rows-2 opacity-50">
                  {mobileQuadrants.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-center ${item.className}`}
                    >
                      <Icon className="text-3xl text-zinc-700" name={item.icon} />
                    </div>
                  ))}
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-zinc-950/60 backdrop-blur-md">
                    <Icon className="text-4xl text-white" name="add_a_photo" />
                  </div>
                  <span className="rounded-full bg-zinc-950/60 px-4 py-1 text-sm font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                    Edit Artwork
                  </span>
                </div>
              </div>
            </div>

            <section className="space-y-8">
              <div className="space-y-2">
                <label
                  className="ml-1 block text-xs font-semibold uppercase tracking-[0.26em] text-zinc-500"
                  htmlFor="mobile-playlist-name"
                >
                  Playlist Name
                </label>
                <input
                  className="w-full border-0 border-b border-white/10 bg-transparent px-1 py-4 text-4xl font-semibold tracking-[-0.04em] text-zinc-100 outline-none transition-all placeholder:text-zinc-700 focus:border-violet-500"
                  id="mobile-playlist-name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Name your vibe..."
                  type="text"
                  value={name}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="ml-1 block text-xs font-semibold uppercase tracking-[0.26em] text-zinc-500"
                  htmlFor="mobile-playlist-description"
                >
                  Description
                </label>
                <textarea
                  className="w-full resize-none border-0 border-b border-white/10 bg-transparent px-1 py-4 text-lg text-zinc-300 outline-none transition-all placeholder:text-zinc-700 focus:border-violet-500"
                  id="mobile-playlist-description"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Add an optional description..."
                  rows={3}
                  value={description}
                />
              </div>
            </section>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Icon
                  className="text-zinc-400"
                  name={isPublic ? 'lock_open' : 'lock'}
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-100">
                    {isPublic ? 'Public Playlist' : 'Private Playlist'}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {isPublic ? 'Visible to everyone' : 'Only visible to you'}
                  </p>
                </div>
              </div>

              {/* Toggle: cambiamos color de fondo y posición del knob según
                  isPublic. La transición es CSS (transition-all). */}
              <button
                aria-label={isPublic ? 'Set private' : 'Set public'}
                className={`relative h-8 w-14 rounded-full transition-colors ${
                  isPublic ? 'bg-violet-500' : 'bg-zinc-800'
                }`}
                onClick={togglePublic}
                type="button"
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${
                    isPublic ? 'left-7' : 'left-1 bg-zinc-400'
                  }`}
                />
              </button>
            </div>

            <button
              className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#c7b0ff] text-sm font-semibold uppercase tracking-[0.24em] text-[#33156d] shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all duration-300 hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              disabled={!canCreate}
              onClick={handleCreate}
              type="button"
            >
              Create Playlist
              <Icon name="arrow_forward" />
            </button>
          </section>
        </main>

        <AuraMobileBottomNav active="create" />
      </div>

      {/* Desktop keeps the shared left rail from the main menu so this */}
      {/* creation flow still feels like part of the same top-level shell. */}
      <div className="relative hidden h-screen flex-col overflow-hidden lg:flex">
        <AuraDesktopTopBar />

        <div className="flex min-h-0 flex-1 pt-20">
          <AuraAppSidebar activeKey="create" />

          <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pb-20">
            <div className="mx-auto max-w-[1200px] px-10 py-12">
            <div className="mb-12">
              <h1 className="text-7xl font-bold tracking-[-0.05em] text-[#dfe9ff]">
                Create Playlist
              </h1>
              <p className="mt-4 text-xl text-zinc-400">
                Craft your next sonic atmosphere. Minimalist, focused,
                immersive.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <div className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md">
                  <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-30 grayscale transition-all duration-700 group-hover:opacity-50 group-hover:grayscale-0">
                    {collageImages.map((image) => (
                      <img
                        key={image}
                        alt="Collection inspiration"
                        className="h-full w-full object-cover"
                        src={image}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-zinc-950/60 transition-colors duration-500 group-hover:bg-zinc-950/40" />

                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-violet-500/20 text-violet-400 backdrop-blur-md transition-transform duration-500 group-hover:scale-110">
                      <Icon className="text-4xl" name="add_a_photo" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white">
                        Upload Cover Art
                      </p>
                      <p className="mt-2 text-sm text-zinc-400">
                        JPG or PNG. Recommended 1:1 ratio.
                      </p>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center bg-violet-500/10 opacity-0 transition-opacity duration-300 backdrop-blur-[2px] group-hover:opacity-100">
                    <span className="rounded-full border border-white/40 bg-zinc-950/40 px-6 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white backdrop-blur-md">
                      Select File
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-8 lg:col-span-7">
                <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.2)]">
                  <div className="space-y-10">
                    <div className="group">
                      <label
                        className="mb-3 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 transition-colors group-focus-within:text-violet-400"
                        htmlFor="desktop-playlist-name"
                      >
                        Playlist Name
                      </label>
                      <input
                        className="w-full border-b-2 border-white/10 bg-transparent py-4 text-3xl font-semibold tracking-[-0.03em] text-zinc-100 outline-none transition-all placeholder:text-zinc-700 focus:border-violet-500"
                        id="desktop-playlist-name"
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Enter a descriptive title..."
                        type="text"
                        value={name}
                      />
                    </div>

                    <div className="group">
                      <label
                        className="mb-3 block text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 transition-colors group-focus-within:text-violet-400"
                        htmlFor="desktop-playlist-description"
                      >
                        Description
                      </label>
                      <textarea
                        className="w-full resize-none rounded-xl border border-white/10 bg-transparent p-4 text-base text-zinc-300 outline-none transition-all placeholder:text-zinc-700 focus:border-violet-500 focus:bg-white/[0.02]"
                        id="desktop-playlist-description"
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Tell the story of this collection..."
                        rows={4}
                        value={description}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-300">
                          Public Playlist
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                          Visible to everyone
                        </p>
                      </div>
                      <button
                        aria-label={isPublic ? 'Set private' : 'Set public'}
                        className={`relative h-6 w-12 rounded-full p-1 transition-colors ${
                          isPublic ? 'bg-violet-500' : 'bg-zinc-700'
                        }`}
                        onClick={togglePublic}
                        type="button"
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full transition-all ${
                            isPublic ? 'left-7 bg-white' : 'left-1 bg-zinc-400'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-6 pt-4">
                  <button
                    className="px-8 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500 transition-colors hover:text-zinc-100"
                    onClick={handleCancel}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-xl bg-violet-500 px-12 py-4 text-xs font-bold uppercase tracking-[0.24em] text-white shadow-[0_10px_40px_rgba(139,92,246,0.2)] transition-all duration-300 hover:scale-[1.02] hover:bg-violet-400 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                    disabled={!canCreate}
                    onClick={handleCreate}
                    type="button"
                  >
                    Create Masterpiece
                  </button>
                </div>
              </div>
            </div>
            </div>
          </main>
        </div>
      </div>
    </main>
  )
}

export default CreatePlaylistPage
