import { useState } from 'react'

export default function Admin() {
  const [adminKey, setAdminKey] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [message, setMessage] = useState('')

  const approveDevice = async (approve) => {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, approve, adminKey })
      })
      
      if (response.ok) {
        setMessage(approve ? 'Device approved!' : 'Device revoked!')
      } else {
        setMessage('Invalid admin key')
      }
    } catch (error) {
      setMessage('Error: ' + error.message)
    }
  }

  return (
    <div style={{ padding: '50px', fontFamily: 'Arial', background: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>🍌 Go Bananas Admin</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="password"
          placeholder="Admin Key"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          style={{ padding: '10px', marginRight: '10px', width: '200px' }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Device ID"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          style={{ padding: '10px', marginRight: '10px', width: '300px' }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => approveDevice(true)}
          style={{ padding: '10px 20px', background: '#00d4ff', color: 'white', border: 'none', borderRadius: '5px', marginRight: '10px', cursor: 'pointer' }}
        >
          Approve Device
        </button>
        <button 
          onClick={() => approveDevice(false)}
          style={{ padding: '10px 20px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Revoke Device
        </button>
      </div>
      
      {message && <p style={{ color: '#00d4ff' }}>{message}</p>}
    </div>
  )
}