const authorizedDevices = new Set(['your-device-id'])

export default function handler(req, res) {
  const { method } = req
  const deviceId = req.headers['x-device-id'] || req.body?.deviceId
  
  if (method === 'POST') {
    res.json({ 
      status: 'pending',
      message: 'Access request sent. Contact admin for approval.',
      deviceId 
    })
  } else if (method === 'GET') {
    const isAuthorized = authorizedDevices.has(deviceId)
    res.json({ authorized: isAuthorized })
  } else if (method === 'PUT') {
    const { approve, adminKey } = req.body
    if (adminKey === 'GO-BANANAS-ADMIN') {
      if (approve) {
        authorizedDevices.add(deviceId)
      } else {
        authorizedDevices.delete(deviceId)
      }
      res.json({ success: true })
    } else {
      res.status(403).json({ error: 'Unauthorized' })
    }
  }
}