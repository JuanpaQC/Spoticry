import { useEffect, useState } from 'react'
import {
  DesktopPlayerBar,
  MobileMiniPlayer,
} from './components/player/AppPlayer.tsx'
import { PlayerProvider } from './lib/playerContext.jsx'
import { PlaylistsProvider } from './lib/playlistsContext.jsx'
import CreatePlaylistPage from './pages/CreatePlaylist/CreatePlaylistPage.tsx'
import LibraryPage from './pages/Library/LibraryPage.tsx'
import MenuPage from './pages/Menu/MenuPage.tsx'
import PlaylistDetailPage from './pages/PlaylistDetail/PlaylistDetailPage.tsx'
import SearchPage from './pages/Search/SearchPage.tsx'

// Mapa de pantallas: la clave es lo que va a la izquierda en el hash
// (`#menu`, `#library`, `#playlist-detail/<id>`...) y el valor es el
// componente a renderizar.
const screens = {
  menu: MenuPage,
  search: SearchPage,
  library: LibraryPage,
  'create-playlist': CreatePlaylistPage,
  'playlist-detail': PlaylistDetailPage,
}

// Convierte la URL en un objeto { screen, id }.
// Ej: "#playlist-detail/pl_abc"  →  { screen: 'playlist-detail', id: 'pl_abc' }
//     "#menu"                    →  { screen: 'menu', id: null }
//     ""                         →  { screen: 'menu', id: null }
// Si la pantalla no existe en el mapa, caemos a 'menu' para no romper.
function parseHash() {
  if (typeof window === 'undefined') {
    return { screen: 'menu', id: null }
  }

  const raw = window.location.hash.replace('#', '')
  const [screen, id = null] = raw.split('/')

  if (!screens[screen]) {
    return { screen: 'menu', id: null }
  }

  return { screen, id }
}

function App() {
  // Guardamos el objeto entero { screen, id } para que el componente
  // de la pantalla pueda recibir el id como prop sin necesidad de
  // re-parsear la URL.
  const [route, setRoute] = useState(parseHash)

  useEffect(() => {
    // Cada vez que cambia el hash (por click en un link interno o
    // navegación del usuario), volvemos a parsear y disparamos render.
    const syncRoute = () => {
      setRoute(parseHash())
    }

    // Si entramos sin hash, redirigimos al menú para tener un default
    // estable.
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#menu')
    }

    window.addEventListener('hashchange', syncRoute)
    syncRoute()

    return () => {
      window.removeEventListener('hashchange', syncRoute)
    }
  }, [])

  const Screen = screens[route.screen]

  // El PlayerProvider envuelve TODO el árbol: así cualquier página puede
  // llamar a usePlayer() para leer estado o disparar play/pause.
  // PlaylistsProvider va por dentro porque algunas pantallas también
  // necesitan acceso al CRUD de playlists (Library, CreatePlaylist,
  // PlaylistDetail). Los componentes del reproductor se montan aquí
  // (no dentro de cada página) para que la canción siga sonando al
  // cambiar de pantalla.
  return (
    <PlayerProvider>
      <PlaylistsProvider>
        <Screen playlistId={route.id} />
        <MobileMiniPlayer className="fixed bottom-28 left-4 right-4 z-50 lg:hidden" />
        <DesktopPlayerBar className="fixed inset-x-0 bottom-0 z-50 hidden h-24 items-center justify-between border-t border-white/10 bg-zinc-950/80 px-8 backdrop-blur-xl shadow-[0_-10px_40px_rgba(139,92,246,0.1)] lg:flex" />
      </PlaylistsProvider>
    </PlayerProvider>
  )
}

export default App
