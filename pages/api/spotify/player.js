export default function handler(req, res) {
  res.send(`
    <script src="https://sdk.scdn.co/spotify-player.js"></script>
    <script>
      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new Spotify.Player({
          name: 'Go Bananas Player',
          getOAuthToken: cb => { 
            cb(localStorage.getItem('spotify_token'))
          },
          volume: 0.5
        })
        
        player.addListener('ready', ({ device_id }) => {
          window.parent.postMessage({ type: 'player_ready', device_id }, '*')
        })
        
        player.connect()
      }
    </script>
  `)
}