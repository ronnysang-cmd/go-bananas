import { useState } from 'react'

export default function Home() {
  const [activeTab, setActiveTab] = useState('photos')

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🍌 Go Bananas</h1>
      
      <div style={{ marginBottom: '20px' }}>
        {['photos', 'notes', 'calendar', 'music'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              margin: '5px',
              backgroundColor: activeTab === tab ? '#007bff' : '#f8f9fa',
              color: activeTab === tab ? 'white' : 'black',
              border: '1px solid #ccc',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {tab === 'photos' && '📸'} 
            {tab === 'notes' && '📝'} 
            {tab === 'calendar' && '📅'} 
            {tab === 'music' && '🎵'} 
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'photos' && (
          <div>
            <h2>Your Photos</h2>
            <div style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center' }}>
              📷 Click to upload or drag & drop your photo
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div>
            <h2>📝 My Notes</h2>
            <input 
              type="text" 
              placeholder="Note title..." 
              style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
            />
            <textarea 
              placeholder="Write your notes here..." 
              style={{ width: '100%', padding: '10px', height: '100px' }}
            />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div>
            <h2>📅 My Calendar</h2>
            <input type="date" style={{ padding: '10px', marginRight: '10px' }} />
            <input type="text" placeholder="Event title" style={{ padding: '10px' }} />
          </div>
        )}

        {activeTab === 'music' && (
          <div>
            <h2>🎵 My Music</h2>
            <div style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center' }}>
              🎵 Upload your music files (MP3, WAV, etc.)
            </div>
          </div>
        )}
      </div>
    </div>
  )
}