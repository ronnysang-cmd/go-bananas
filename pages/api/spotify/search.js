export default async function handler(req, res) {
  const { q } = req.query
  const { authorization } = req.headers
  
  const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=10`, {
    headers: { Authorization: authorization }
  })
  
  const data = await response.json()
  
  const tracks = data.tracks.items.map(track => ({
    id: track.id,
    title: track.name,
    artist: track.artists[0].name,
    album: track.album.name,
    image: track.album.images[2]?.url || '',
    preview: track.preview_url,
    uri: track.uri
  }))
  
  res.json(tracks)
}