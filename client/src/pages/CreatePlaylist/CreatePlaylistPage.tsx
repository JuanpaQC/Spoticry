import { useState } from "react";
import { usePlaylists } from "../../lib/playlistsContext.jsx";
import {
  AuraAppSidebar,
  AuraDesktopTopBar,
  AuraMobileBottomNav,
  Icon,
} from "../Aura/auraUi.tsx";

// Helper para cambiar de pantalla por hash (lo usamos al cancelar y al
// crear). Si el ambiente no tiene window (SSR test), no hace nada.
function navigate(hash) {
  if (typeof window === "undefined") return;
  window.location.hash = hash;
}

function CreatePlaylistPage() {
  // Estado compartido del form. Lo declaramos en el padre (no en cada
  // input) para que mobile y desktop compartan los mismos valores: si
  // el usuario gira el dispositivo, no pierde lo que escribió.
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const { createPlaylist } = usePlaylists();

  const handleCreate = async () => {
    const cleanTitle = name.trim();
    if (!cleanTitle || isSaving) return;

    setIsSaving(true);
    setError("");
    try {
      const playlist = await createPlaylist({ title: cleanTitle });

      if (playlist?.id) {
        navigate(`#playlist-detail/${playlist.id}`);
      } else {
        navigate("#library");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear la playlist",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Cancelar / cerrar el form: volvemos a la biblioteca.
  const handleCancel = () => navigate("#library");

  // Truthy si se puede crear (al menos hay nombre). Lo usamos para
  // deshabilitar el botón visualmente.
  const canCreate = name.trim().length > 0 && !isSaving;

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
            {isSaving ? "Saving" : "Save"}
          </button>
        </header>

        <main className="mx-auto max-w-md px-6 pb-36 pt-28">
          <section className="space-y-10">
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
            </section>

            {error ? (
              <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            <button
              className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#c7b0ff] text-sm font-semibold uppercase tracking-[0.24em] text-[#33156d] shadow-[0_0_40px_rgba(139,92,246,0.3)] transition-all duration-300 hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              disabled={!canCreate}
              onClick={handleCreate}
              type="button"
            >
              {isSaving ? "Creating..." : "Create Playlist"}
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
                  Crea tu propio vibe para todos los momentos que necesites
                </p>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <div className="flex flex-col gap-8">
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
                      {isSaving ? "Creating..." : "Create Masterpiece"}
                    </button>
                  </div>
                  {error ? (
                    <p className="text-right text-sm text-rose-300">{error}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </main>
  );
}

export default CreatePlaylistPage;
