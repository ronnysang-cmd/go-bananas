export default function handler(req, res) {
  const scopes = 'streaming user-read-email user-read-private'
  const authURL = `https://accounts.spotify.com/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.SPOTIFY_CLIENT_ID}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `redirect_uri=${encodeURIComponent(process.env.SPOTIFY_REDIRECT_URI)}`
  
  res.redirect(authURL)
}