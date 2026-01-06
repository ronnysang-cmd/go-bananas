let cloudStorage = {}

export default function handler(req, res) {
  const { method } = req
  
  if (method === 'POST') {
    const { userId, data } = req.body
    cloudStorage[userId] = {
      ...data,
      lastBackup: new Date().toISOString()
    }
    res.json({ success: true })
  } else if (method === 'GET') {
    const { userId } = req.query
    const userData = cloudStorage[userId]
    res.json({ success: !!userData, data: userData || null })
  }
}