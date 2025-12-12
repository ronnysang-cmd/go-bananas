import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function Home() {
  const [activeTab, setActiveTab] = useState('photos')
  const [photos, setPhotos] = useState([])
  const [notes, setNotes] = useState([])
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [spotifyConnected, setSpotifyConnected] = useState(false)
  const [spotifyQuery, setSpotifyQuery] = useState('')
  const [spotifyResults, setSpotifyResults] = useState([])
  const [photoLikes, setPhotoLikes] = useState({})
  const [photoFavorites, setPhotoFavorites] = useState({})
  const [photoComments, setPhotoComments] = useState({})

  useEffect(() => {
    checkDeviceAuth()
  }, [])

  const checkDeviceAuth = async () => {
    let deviceId = localStorage.getItem('device_id')
    if (!deviceId) {
      deviceId = Date.now() + '-' + Math.random().toString(36)
      localStorage.setItem('device_id', deviceId)
    }

    try {
      const response = await fetch('/api/auth/check', {
        headers: { 'x-device-id': deviceId }
      })
      const data = await response.json()
      
      if (!data.authorized) {
        document.body.innerHTML = `
          <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;color:#fff;font-family:Arial;text-align:center">
            <div>
              <h1>🔒 Access Restricted</h1>
              <p>This app requires authorization.</p>
              <p>Device ID: ${deviceId}</p>
              <button onclick="requestAccess('${deviceId}')" style="padding:10px 20px;background:#00d4ff;color:white;border:none;border-radius:5px;cursor:pointer">Request Access</button>
            </div>
          </div>
        `
        window.requestAccess = async (id) => {
          await fetch('/api/auth/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: id, deviceInfo: navigator.userAgent })
          })
          alert('Access requested. Please wait for approval.')
        }
        return
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }

    // Load data if authorized
    const savedPhotos = JSON.parse(localStorage.getItem('photos') || '[]')
    const savedNotes = JSON.parse(localStorage.getItem('notes') || '[]')
    const savedLikes = JSON.parse(localStorage.getItem('photoLikes') || '{}')
    const savedFavorites = JSON.parse(localStorage.getItem('photoFavorites') || '{}')
    const savedComments = JSON.parse(localStorage.getItem('photoComments') || '{}')
    
    setPhotos(savedPhotos)
    setNotes(savedNotes)
    setPhotoLikes(savedLikes)
    setPhotoFavorites(savedFavorites)
    setPhotoComments(savedComments)
    
    const spotifyToken = localStorage.getItem('spotify_token')
    const expiresAt = localStorage.getItem('spotify_expires_at')
    if (spotifyToken && expiresAt && Date.now() < parseInt(expiresAt)) {
      setSpotifyConnected(true)
    }
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newPhoto = {
          id: Date.now(),
          src: event.target.result,
          name: file.name
        }
        const updatedPhotos = [...photos, newPhoto]
        setPhotos(updatedPhotos)
        localStorage.setItem('photos', JSON.stringify(updatedPhotos))
      }
      reader.readAsDataURL(file)
    }
  }

  const saveNote = () => {
    if (noteContent.trim()) {
      const newNote = {
        id: Date.now(),
        title: noteTitle || 'Untitled',
        content: noteContent,
        date: new Date().toLocaleDateString()
      }
      const updatedNotes = [...notes, newNote]
      setNotes(updatedNotes)
      localStorage.setItem('notes', JSON.stringify(updatedNotes))
      setNoteTitle('')
      setNoteContent('')
    }
  }

  const likePhoto = (photoId) => {
    const currentLikes = photoLikes[photoId] || 0
    const newLikes = { ...photoLikes, [photoId]: currentLikes + 1 }
    setPhotoLikes(newLikes)
    localStorage.setItem('photoLikes', JSON.stringify(newLikes))
  }

  const favoritePhoto = (photoId) => {
    const isFavorited = photoFavorites[photoId] || false
    const newFavorites = { ...photoFavorites, [photoId]: !isFavorited }
    setPhotoFavorites(newFavorites)
    localStorage.setItem('photoFavorites', JSON.stringify(newFavorites))
  }

  const deletePhoto = (photoId) => {
    if (confirm('Delete this photo?')) {
      const updatedPhotos = photos.filter(p => p.id !== photoId)
      setPhotos(updatedPhotos)
      localStorage.setItem('photos', JSON.stringify(updatedPhotos))
      
      // Clean up related data
      const newLikes = { ...photoLikes }
      const newFavorites = { ...photoFavorites }
      const newComments = { ...photoComments }
      delete newLikes[photoId]
      delete newFavorites[photoId]
      delete newComments[photoId]
      
      setPhotoLikes(newLikes)
      setPhotoFavorites(newFavorites)
      setPhotoComments(newComments)
      localStorage.setItem('photoLikes', JSON.stringify(newLikes))
      localStorage.setItem('photoFavorites', JSON.stringify(newFavorites))
      localStorage.setItem('photoComments', JSON.stringify(newComments))
    }
  }

  const addComment = (photoId, comment, input) => {
    if (comment.trim()) {
      const currentComments = photoComments[photoId] || []
      const newComment = {
        id: Date.now(),
        text: comment,
        timestamp: new Date().toLocaleTimeString()
      }
      const updatedComments = { ...photoComments, [photoId]: [...currentComments, newComment] }
      setPhotoComments(updatedComments)
      localStorage.setItem('photoComments', JSON.stringify(updatedComments))
      input.value = ''
    }
  }

  const addEmoji = (e, emoji) => {
    const input = e.target.closest('.photo-comments').querySelector('.comment-input')
    input.value += emoji
    input.focus()
  }

  const addEmojiToNotes = (emoji) => {
    setNoteContent(prev => prev + emoji)
  }

  const connectSpotify = () => {
    window.open('/api/spotify/login', 'spotify-auth', 'width=500,height=600')
    
    const handleMessage = (event) => {
      if (event.data.type === 'spotify_auth_success') {
        setSpotifyConnected(true)
        localStorage.setItem('spotify_token', event.data.token)
        if (event.data.refresh_token) {
          localStorage.setItem('spotify_refresh_token', event.data.refresh_token)
        }
        if (event.data.expires_in) {
          localStorage.setItem('spotify_expires_at', Date.now() + (event.data.expires_in * 1000))
        }
        window.removeEventListener('message', handleMessage)
      }
    }
    
    window.addEventListener('message', handleMessage)
  }

  const searchSpotify = async () => {
    if (!spotifyQuery.trim()) return
    
    const token = localStorage.getItem('spotify_token')
    const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(spotifyQuery)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const tracks = await response.json()
    setSpotifyResults(tracks)
  }

  const useDefaultAccount = async () => {
    try {
      const response = await fetch('/api/spotify/default')
      const data = await response.json()
      
      if (data.token) {
        setSpotifyConnected(true)
        localStorage.setItem('spotify_token', data.token)
        localStorage.setItem('spotify_refresh_token', data.refresh_token)
        localStorage.setItem('spotify_expires_at', Date.now() + (data.expires_in * 1000))
        localStorage.setItem('spotify_account_type', 'default')
      }
    } catch (error) {
      alert('Default account not available')
    }
  }

  const playSpotifyTrack = (track) => {
    const token = localStorage.getItem('spotify_token')
    
    // Try full song playback (requires Premium)
    fetch(`https://api.spotify.com/v1/me/player/play`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: [track.uri]
      })
    }).then(response => {
      if (!response.ok) {
        // Fallback to 30-second preview
        if (track.preview) {
          const audio = new Audio(track.preview)
          audio.play()
        } else {
          alert('Spotify Premium required for full songs. No preview available.')
        }
      }
    })
  }

  return (
    <>
      <Head>
        <title>🍌 Go Bananas</title>
        <link rel="stylesheet" href="/style.css" />
      </Head>
      
      <div className="container">
        <header>
          <h1>🍌 Go Bananas</h1>
        </header>

        <div className="tabs">
          {['photos', 'notes', 'calendar', 'music'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              data-tab={tab}
            >
              {tab === 'photos' && '📸'} 
              {tab === 'notes' && '📝'} 
              {tab === 'calendar' && '📅'} 
              {tab === 'music' && '🎵'} 
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className={`tab-content ${activeTab === 'photos' ? 'active' : ''}`} id="photos-tab">
          <div className="upload-section">
            <div className="upload-area">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
                id="photoInput"
              />
              <label htmlFor="photoInput" className="upload-content">
                <span className="upload-icon">📷</span>
                <p>Click to upload or drag & drop your photo</p>
              </label>
            </div>
          </div>
          <div className="gallery">
            <h2>Your Photos</h2>
            <div className="photos-grid">
              {photos.length === 0 ? (
                <div className="no-photos">No photos uploaded yet. Upload your first photo!</div>
              ) : (
                photos.map(photo => (
                  <div key={photo.id} className="photo-item">
                    <img src={photo.src} alt={photo.name} />
                    <div className="photo-actions">
                      <button className="action-btn like-btn" onClick={() => likePhoto(photo.id)}>
                        ❤️ <span>{photoLikes[photo.id] || 0}</span>
                      </button>
                      <button 
                        className="action-btn favorite-btn" 
                        onClick={() => favoritePhoto(photo.id)}
                        style={{ color: photoFavorites[photo.id] ? '#00d4ff' : '#ccc' }}
                      >
                        ⭐
                      </button>
                      <button className="action-btn delete-btn" onClick={() => deletePhoto(photo.id)}>
                        🗑️
                      </button>
                    </div>
                    <div className="photo-comments">
                      <div className="comments-list">
                        {(photoComments[photo.id] || []).map(comment => (
                          <div key={comment.id} className="comment">
                            <span className="comment-text">{comment.text}</span>
                            <span className="comment-time">{comment.timestamp}</span>
                          </div>
                        ))}
                      </div>
                      <div className="comment-input-container">
                        <input 
                          type="text" 
                          className="comment-input" 
                          placeholder="Add a comment..."
                          onKeyPress={(e) => e.key === 'Enter' && addComment(photo.id, e.target.value, e.target)}
                        />
                        <div className="comment-emoji-picker">
                          <button type="button" className="emoji-btn" onClick={(e) => addEmoji(e, '😀')}>😀</button>
                          <button type="button" className="emoji-btn" onClick={(e) => addEmoji(e, '😍')}>😍</button>
                          <button type="button" className="emoji-btn" onClick={(e) => addEmoji(e, '👍')}>👍</button>
                          <button type="button" className="emoji-btn" onClick={(e) => addEmoji(e, '❤️')}>❤️</button>
                          <button type="button" className="emoji-btn" onClick={(e) => addEmoji(e, '🎉')}>🎉</button>
                          <button type="button" className="emoji-btn" onClick={(e) => addEmoji(e, '🔥')}>🔥</button>
                        </div>
                      </div>
                      <button className="add-comment" onClick={(e) => addComment(photo.id, e.target.previousElementSibling.querySelector('.comment-input').value, e.target.previousElementSibling.querySelector('.comment-input'))}>Comment</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'notes' ? 'active' : ''}`} id="notes-tab">
          <div className="notes-section">
            <h2>📝 My Notes</h2>
            <div className="notes-editor">
              <input 
                type="text" 
                placeholder="Note title..." 
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                id="noteTitle"
              />
              <div className="textarea-container">
                <textarea 
                  placeholder="Write your notes here..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  id="notesArea"
                />
                <div className="emoji-picker">
                  <button type="button" className="emoji-btn" onClick={() => addEmojiToNotes('😀')}>😀</button>
                  <button type="button" className="emoji-btn" onClick={() => addEmojiToNotes('😍')}>😍</button>
                  <button type="button" className="emoji-btn" onClick={() => addEmojiToNotes('🤔')}>🤔</button>
                  <button type="button" className="emoji-btn" onClick={() => addEmojiToNotes('👍')}>👍</button>
                  <button type="button" className="emoji-btn" onClick={() => addEmojiToNotes('❤️')}>❤️</button>
                  <button type="button" className="emoji-btn" onClick={() => addEmojiToNotes('🎉')}>🎉</button>
                  <button type="button" className="emoji-btn" onClick={() => addEmojiToNotes('🔥')}>🔥</button>
                  <button type="button" className="emoji-btn" onClick={() => addEmojiToNotes('💡')}>💡</button>
                </div>
              </div>
              <button onClick={saveNote} id="saveNotes">Save Note</button>
            </div>
            <div className="saved-notes">
              <h3>Saved Notes</h3>
              <div id="notesList">
                {notes.length === 0 ? (
                  <p style={{ color: '#888' }}>No notes saved yet</p>
                ) : (
                  notes.map(note => (
                    <div key={note.id} className="note-item">
                      <div className="note-header">
                        <h4>{note.title}</h4>
                        <span style={{ color: '#888', fontSize: '0.8rem' }}>{note.date}</span>
                      </div>
                      <p>{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'calendar' ? 'active' : ''}`} id="calendar-tab">
          <div className="calendar-section">
            <h2>📅 My Calendar</h2>
            <div className="calendar-controls">
              <input type="date" id="eventDate" />
              <input type="text" placeholder="Event title" id="eventTitle" />
              <button id="addEvent">Add Event</button>
            </div>
            <div id="eventsList"></div>
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'music' ? 'active' : ''}`} id="music-tab">
          <div className="music-section">
            <h2>🎵 My Music</h2>
            
            <div className="music-upload">
              <div className="upload-area music-upload-area">
                <div className="upload-content">
                  <span className="upload-icon">🎵</span>
                  <p>Upload your music files (MP3, WAV, etc.)</p>
                </div>
              </div>
            </div>

            <div className="spotify-section">
              <h3>🎵 Spotify Integration</h3>
              <div className="spotify-auth">
                <button onClick={connectSpotify}>Login to Spotify</button>
                <div className="spotify-status">
                  {spotifyConnected ? '✓ Connected to Spotify' : ''}
                </div>
              </div>
              {spotifyConnected && (
                <div className="search-controls">
                  <input 
                    type="text" 
                    placeholder="Search Spotify for songs, artists..."
                    value={spotifyQuery}
                    onChange={(e) => setSpotifyQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchSpotify()}
                  />
                  <button onClick={searchSpotify}>Search</button>
                </div>
              )}
              <div className="search-results">
                {spotifyResults.map(track => (
                  <div key={track.id} className="search-result-item" onClick={() => playSpotifyTrack(track)}>
                    <img src={track.image} alt="Album art" className="album-art" />
                    <div className="track-details">
                      <h4>{track.title}</h4>
                      <p>{track.artist}</p>
                      <small>{track.album}</small>
                    </div>
                    <button className="play-preview">🎵</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}