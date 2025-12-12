const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Force HTTPS in production
app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
        res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
        next();
    }
});

// Force HTTPS in production
app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
        res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
        next();
    }
});

// Simple authentication middleware
const authenticatedUsers = new Set();
const ADMIN_PASSWORD = 'GO-BANANAS';

function requireAuth(req, res, next) {
    const sessionId = req.headers['x-session-id'] || req.query.session;
    if (authenticatedUsers.has(sessionId)) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Create directories
const uploadsDir = path.join(__dirname, 'uploads');
const musicDir = path.join(__dirname, 'music');
const dataDir = path.join(__dirname, 'data');
[uploadsDir, musicDir, dataDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});

// Data files
const files = ['notes', 'events', 'comments', 'likes', 'favorites', 'music'];
files.forEach(file => {
    const filePath = path.join(dataDir, `${file}.json`);
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}');
});

// Multer config
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/'))
});

const musicUpload = multer({
    dest: 'music/',
    fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('audio/'))
});

// Static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/music', express.static('music'));

// Auth routes
app.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html><html><head><title>🍌 Go Bananas</title><style>body{font-family:Arial;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%)}.login-box{background:white;padding:2rem;border-radius:10px;box-shadow:0 4px 6px rgba(0,0,0,0.1);text-align:center}input{padding:10px;margin:10px;border:1px solid #ddd;border-radius:5px;width:200px}button{padding:10px 20px;background:#667eea;color:white;border:none;border-radius:5px;cursor:pointer}</style></head><body><div class="login-box"><h2>🍌 Go Bananas</h2><p>Enter password to access</p><form method="POST" action="/login"><input type="password" name="password" placeholder="Password" required><br><button type="submit">Login</button></form></div></body></html>`);
});

app.post('/login', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) {
        const sessionId = Date.now() + Math.random().toString(36);
        authenticatedUsers.add(sessionId);
        res.redirect(`/?session=${sessionId}`);
    } else {
        res.redirect('/login');
    }
});

app.get('/access', (req, res) => {
    res.sendFile(path.join(__dirname, 'redirect.html'));
});

app.get('/', (req, res) => {
    const sessionId = req.query.session;
    if (!sessionId || !authenticatedUsers.has(sessionId)) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes
app.post('/upload', requireAuth, upload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    res.json({ message: 'Success', filename: req.file.filename });
});

app.get('/photos', requireAuth, (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) return res.json([]);
        res.json(files.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)));
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🍌 Go Bananas running on http://localhost:${PORT}`);
});