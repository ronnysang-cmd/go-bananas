export default function handler(req, res) {
  res.json({
    token: process.env.DEFAULT_SPOTIFY_TOKEN,
    refresh_token: process.env.DEFAULT_SPOTIFY_REFRESH,
    expires_in: 3600
  })
}