import { useState, useEffect } from 'react'
import Head from 'next/head'

export default function Home() {
  const [activeTab, setActiveTab] = useState('photos')
  const [photos, setPhotos] = useState([])
  const [notes, setNotes] = useState([])
  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')

  useEffect(() => {
    // Load data from localStorage
    const savedPhotos = JSON.parse(localStorage.getItem('photos') || '[]')
    const savedNotes = JSON.parse(localStorage.getItem('notes') || '[]')
    setPhotos(savedPhotos)
    setNotes(savedNotes)
  }, [])

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
              <textarea 
                placeholder="Write your notes here..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                id="notesArea"
              />
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
          </div>
        </div>
      </div>
    </>
  )
}