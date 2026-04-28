// Manifiesto central de canciones de prueba.
//
// Cada entrada describe una canción local que vive en public/music/.
// Los componentes (player, listas, cards) consumen este array en vez
// de tener canciones hardcodeadas por dentro.
//
// Cuando migremos al servidor Rust + Supabase, la forma de cada objeto
// se mantiene igual: solo cambiarán los valores de `src` y `cover`
// por URLs públicas de Supabase Storage en lugar de rutas locales.
//
// Convención de campos:
//   id       → identificador único (string). Lo usa React como `key`
//              y más adelante lo usará el servidor para /songs/play/:id.
//   title    → nombre de la canción que se muestra en UI.
//   artist   → artista o banda.
//   album    → álbum al que pertenece (puede ser "" si no aplica).
//   duration → duración formateada "m:ss" para mostrar en las listas.
//              (Más adelante la sacaremos del audio decodificado.)
//   src      → ruta al archivo .mp3 dentro de public/.
//              Vite sirve public/ en la raíz, así que
//              "public/music/audio/foo.mp3" se accede como
//              "/music/audio/foo.mp3".
//   cover    → ruta a la portada del álbum, misma lógica que src.

export const tracks = [
  {
    id: 'Ariana',
    title: 'Nasty',
    artist: 'Ariana Grande',
    album: 'Positions',
    duration: '3:21',
    src: '/music/audio/Ariana Grande - nasty (official audio) - ArianaGrandeVevo.mp3',
    cover: '/music/covers/positions.jpeg',
  },
  {
    id: 'Kendrick',
    title: 'All the Stars',
    artist: 'Kendrick Lamar & SZA',
    album: 'Black Panther: The Album',
    duration: '3:55',
    src: '/music/audio/Kendrick Lamar, SZA - All The Stars - KendrickLamarVEVO.mp3',
    cover: '/music/covers/BlackPanther.jpeg',
  },
  {
    id: 'Sabrina',
    title: 'Prfct',
    artist: 'Sabrina Carpenter',
    album: 'Prfct',
    duration: '3:45',
    src: '/music/audio/prfct - Sabrina Carpenter.mp3',
    cover: '/music/covers/prfct.jpg',
  },
  {
    id: 'Neighborhood',
    title: 'Softcore',
    artist: 'The Neighbourhood',
    album: 'The Neighbourhood',
    duration: '3:30',
    src: '/music/audio/The Neighbourhood - Softcore.mp3',
    cover: '/music/covers/TheNeighbourhood.jpg',
  }
]

// Helper para buscar una canción por id sin tener que repetir
// la misma lógica en varios componentes.
export function findTrackById(id) {
  return tracks.find((track) => track.id === id)
}
