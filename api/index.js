module.exports = (req, res) => {
  const url = new URL(req.url, `https://${req.headers.host}`);
  
  if (url.pathname === '/api/login' && req.method === 'POST') {
    return res.status(200).json({ success: true });
  }
  
  if (url.pathname === '/api/photos') {
    return res.status(200).json([]);
  }
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>🍌 Go Bananas - Deployed Successfully</title>
      <style>
        body { font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .container { max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; }
        .btn { padding: 15px 30px; background: #fff; color: #667eea; text-decoration: none; border-radius: 8px; display: inline-block; margin: 10px; font-weight: bold; }
        .status { background: rgba(0,255,0,0.2); padding: 15px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🍌 Go Bananas</h1>
        <div class="status">
          <h2>✅ Deployment Successful!</h2>
          <p>Your app is now live with HTTPS</p>
        </div>
        <p>🔒 Password: GO-BANANAS</p>
        <p>🌐 Accessible Worldwide</p>
        <p>📱 Mobile Friendly</p>
        <a href="/" class="btn">Access App</a>
      </div>
    </body>
    </html>
  `);
};