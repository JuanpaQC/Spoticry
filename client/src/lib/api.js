const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(
  /\/$/,
  '',
)

function apiPath(path) {
  return `${API_URL}${path}`
}

function encodeSegment(value) {
  return encodeURIComponent(String(value))
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(apiPath(path), {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '')

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload?.error || payload?.message || `HTTP ${response.status}`
    throw new Error(message || `HTTP ${response.status}`)
  }

  return payload
}

export function toTrack(song) {
  return {
    id: String(song.id ?? ''),
    title: song.name ?? song.title ?? '',
    artist: song.artist ?? '',
    genre: song.genre ?? '',
    album: song.album ?? '',
    duration: song.duration ?? '--:--',
    src: song.song_url ?? song.src ?? '',
    cover: song.image_url ?? song.cover ?? '',
    raw: song,
  }
}

export function toPlaylist(playlist) {
  const rawIds = playlist.song_ids ?? playlist.trackIds ?? []

  return {
    id: String(playlist.id ?? ''),
    title: playlist.name ?? playlist.title ?? 'Untitled Playlist',
    description: playlist.description ?? '',
    isPublic: playlist.isPublic ?? true,
    trackIds: Array.isArray(rawIds) ? rawIds.map(String) : [],
    createdAt: playlist.created_at ? Date.parse(playlist.created_at) : 0,
    raw: playlist,
  }
}

export async function fetchSongs() {
  const songs = await request('/songs')
  return Array.isArray(songs) ? songs.map(toTrack).filter((track) => track.id) : []
}

export async function createSong(values) {
  const formData = new FormData()
  formData.append('name', values.title)
  formData.append('artist', values.artist)
  formData.append('genre', values.genre)
  formData.append('album', values.album)
  formData.append('song', values.songFile)
  formData.append('image', values.imageFile)

  // No establecer Content-Type manualmente: el browser lo setea con el boundary correcto
  const response = await fetch(apiPath('/admin/songs'), {
    method: 'POST',
    body: formData,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '')

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload?.error || payload?.message || `HTTP ${response.status}`
    throw new Error(message || `HTTP ${response.status}`)
  }

  if (Array.isArray(payload)) return payload[0] ? toTrack(payload[0]) : null
  if (payload && typeof payload === 'object') return toTrack(payload)
  return null
}

export async function deleteSong(id) {
  return request(`/admin/songs/${encodeSegment(id)}`, { method: 'DELETE' })
}

export async function startStreaming(id) {
  return request(`/stream/start/${encodeSegment(id)}`, { method: 'POST' })
}

export async function stopStreaming(id) {
  return request(`/stream/stop/${encodeSegment(id)}`, { method: 'POST' })
}

export async function fetchPlaylists() {
  const playlists = await request('/playlist')
  return Array.isArray(playlists)
    ? playlists.map(toPlaylist).filter((playlist) => playlist.id)
    : []
}

export async function createPlaylist(values) {
  const playlist = await request('/playlist', {
    method: 'POST',
    body: JSON.stringify({
      name: values.title,
      song_ids: [],
    }),
  })

  if (Array.isArray(playlist)) return playlist[0] ? toPlaylist(playlist[0]) : null
  if (playlist && typeof playlist === 'object') return toPlaylist(playlist)
  return null
}

export async function addSongToPlaylist(playlistId, songId) {
  const playlist = await request(
    `/playlists/${encodeSegment(playlistId)}/songs/${encodeSegment(songId)}`,
    { method: 'POST' },
  )

  if (Array.isArray(playlist)) return playlist[0] ? toPlaylist(playlist[0]) : null
  if (playlist && typeof playlist === 'object') return toPlaylist(playlist)
  return null
}

export async function removeSongFromPlaylist(playlistId, songId) {
  const playlist = await request(
    `/playlists/${encodeSegment(playlistId)}/songs/${encodeSegment(songId)}`,
    { method: 'DELETE' },
  )

  if (Array.isArray(playlist)) return playlist[0] ? toPlaylist(playlist[0]) : null
  if (playlist && typeof playlist === 'object') return toPlaylist(playlist)
  return null
}

export async function deletePlaylist(id) {
  return request(`/playlists/${encodeSegment(id)}`, { method: 'DELETE' })
}

export async function fetchPlaylistSongs(id, order = '') {
  const query = order ? `?orden=${encodeURIComponent(order)}` : ''
  const songs = await request(`/playlists/${encodeSegment(id)}/songs${query}`)
  return Array.isArray(songs) ? songs.map(toTrack).filter((track) => track.id) : []
}
