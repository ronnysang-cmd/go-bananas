const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple authentication middleware
const authenticatedUsers = new Set();
const ADMIN_PASSWORD = 'GO-BANANAS'; // Change this password

function requireAuth(req, res, next) {
    const sessionId = req.headers['x-session-id'] || req.query.session;
    if (authenticatedUsers.has(sessionId)) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Create directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const musicDir = path.join(__dirname, 'music');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// Data files
const notesFile = path.join(dataDir, 'notes.json');
const eventsFile = path.join(dataDir, 'events.json');
const commentsFile = path.join(dataDir, 'comments.json');
const likesFile = path.join(dataDir, 'likes.json');
const favoritesFile = path.join(dataDir, 'favorites.json');
const musicFile = path.join(dataDir, 'music.json');

// Initialize data files
[notesFile, eventsFile, commentsFile, likesFile, favoritesFile, musicFile].forEach(file => {
    if (!fs.existsSync(file)) fs.writeFileSync(file, '{}');
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files allowed!'), false);
        }
    }
});

// Music upload configuration
const musicStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'music/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const musicUpload = multer({ 
    storage: musicStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files allowed!'), false);
        }
    }
});

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/music', express.static('music'));

// Authentication routes
app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>🍌 Go Bananas - Login</title>
            <style>
                body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
                .login-box { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
                input { padding: 10px; margin: 10px; border: 1px solid #ddd; border-radius: 5px; width: 200px; }
                button { padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; }
                button:hover { background: #5a6fd8; }
            </style>
        </head>
        <body>
            <div class="login-box">
                <h2>🍌 Go Bananas</h2>
                <p>Enter password to access the app</p>
                <form method="POST" action="/login">
                    <input type="password" name="password" placeholder="Password" required>
                    <br>
                    <button type="submit">Login</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        const sessionId = Date.now() + Math.random().toString(36);
        authenticatedUsers.add(sessionId);
        res.redirect(`/?session=${sessionId}`);
    } else {
        res.redirect('/login?error=1');
    }
});

// Redirect route
app.get('/access', (req, res) => {
    res.sendFile(path.join(__dirname, 'redirect.html'));
});

// Routes
app.get('/', (req, res) => {
    const sessionId = req.query.session;
    if (!sessionId || !authenticatedUsers.has(sessionId)) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', requireAuth, upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ 
        message: 'Photo uploaded successfully!', 
        filename: req.file.filename 
    });
});

app.get('/photos', requireAuth, (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read photos' });
        }
        const photos = files.filter(file => 
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
        );
        res.json(photos);
    });
});

// Notes API
app.get('/notes', requireAuth, (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(notesFile, 'utf8'));
        // Check if it's old format (single note) or new format (multiple notes)
        if (data.content && data.updated) {
            // Old format - convert to new format
            const newFormat = {
                '1': { id: '1', title: 'Old Note', content: data.content, created: data.updated }
            };
            fs.writeFileSync(notesFile, JSON.stringify(newFormat));
            res.json([newFormat['1']]);
        } else {
            // New format
            res.json(Object.values(data || {}));
        }
    } catch (error) {
        res.json([]);
    }
});

app.post('/notes', requireAuth, (req, res) => {
    const { title, content } = req.body;
    const notes = JSON.parse(fs.readFileSync(notesFile, 'utf8') || '{}');
    const id = Date.now().toString();
    notes[id] = { id, title, content, created: new Date().toISOString() };
    fs.writeFileSync(notesFile, JSON.stringify(notes));
    res.json(notes[id]);
});

app.put('/notes/:id', (req, res) => {
    const { title, content } = req.body;
    const notes = JSON.parse(fs.readFileSync(notesFile, 'utf8') || '{}');
    if (notes[req.params.id]) {
        notes[req.params.id] = { ...notes[req.params.id], title, content };
        fs.writeFileSync(notesFile, JSON.stringify(notes));
        res.json(notes[req.params.id]);
    } else {
        res.status(404).json({ error: 'Note not found' });
    }
});

app.delete('/notes/:id', (req, res) => {
    const notes = JSON.parse(fs.readFileSync(notesFile, 'utf8') || '{}');
    delete notes[req.params.id];
    fs.writeFileSync(notesFile, JSON.stringify(notes));
    res.json({ success: true });
});

// Calendar API
app.get('/events', (req, res) => {
    try {
        const events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
        res.json(events);
    } catch (error) {
        res.json({});
    }
});

app.post('/events', (req, res) => {
    const { date, title } = req.body;
    const events = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
    if (!events[date]) events[date] = [];
    events[date].push({ title, id: Date.now() });
    fs.writeFileSync(eventsFile, JSON.stringify(events));
    res.json(events);
});

// Comments API
app.get('/comments/:photo', (req, res) => {
    try {
        const comments = JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
        res.json(comments[req.params.photo] || []);
    } catch (error) {
        res.json([]);
    }
});

app.post('/comments/:photo', (req, res) => {
    const { comment } = req.body;
    const comments = JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
    if (!comments[req.params.photo]) comments[req.params.photo] = [];
    comments[req.params.photo].push({ comment, date: new Date().toISOString() });
    fs.writeFileSync(commentsFile, JSON.stringify(comments));
    res.json(comments[req.params.photo]);
});

// Likes API
app.post('/like/:photo', (req, res) => {
    try {
        const likes = JSON.parse(fs.readFileSync(likesFile, 'utf8'));
        likes[req.params.photo] = (likes[req.params.photo] || 0) + 1;
        fs.writeFileSync(likesFile, JSON.stringify(likes));
        res.json({ likes: likes[req.params.photo] });
    } catch (error) {
        res.json({ likes: 1 });
    }
});

app.get('/likes/:photo', (req, res) => {
    try {
        const likes = JSON.parse(fs.readFileSync(likesFile, 'utf8'));
        res.json({ likes: likes[req.params.photo] || 0 });
    } catch (error) {
        res.json({ likes: 0 });
    }
});

// Handle Chrome DevTools requests
app.get('/.well-known/*', (req, res) => {
    res.status(404).end();
});

// Favorites API
app.post('/favorite/:photo', (req, res) => {
    try {
        const favorites = JSON.parse(fs.readFileSync(favoritesFile, 'utf8'));
        favorites[req.params.photo] = !favorites[req.params.photo];
        fs.writeFileSync(favoritesFile, JSON.stringify(favorites));
        res.json({ favorite: favorites[req.params.photo] });
    } catch (error) {
        res.json({ favorite: true });
    }
});

app.get('/favorite/:photo', (req, res) => {
    try {
        const favorites = JSON.parse(fs.readFileSync(favoritesFile, 'utf8'));
        res.json({ favorite: favorites[req.params.photo] || false });
    } catch (error) {
        res.json({ favorite: false });
    }
});

// Delete photo
app.delete('/photo/:photo', (req, res) => {
    try {
        const photoPath = path.join(uploadsDir, req.params.photo);
        if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete photo' });
    }
});

// Spotify API configuration
const SPOTIFY_CLIENT_ID = '1234567890abcdef';
const SPOTIFY_REDIRECT_URI = 'http://localhost:3000/callback';

// Spotify auth
app.get('/spotify-login', (req, res) => {
    if (SPOTIFY_CLIENT_ID === '1234567890abcdef') {
        res.send(`
            <h2>Spotify Setup Required</h2>
            <p>To use Spotify integration:</p>
            <ol>
                <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank">Spotify Developer Dashboard</a></li>
                <li>Create a new app</li>
                <li>Copy your Client ID</li>
                <li>Replace 'SPOTIFY_CLIENT_ID' in server.js</li>
                <li>Add redirect URI: http://localhost:3000/callback</li>
            </ol>
            <button onclick="window.close()">Close</button>
        `);
        return;
    }
    
    const scopes = 'streaming user-read-email user-read-private';
    const authUrl = `https://accounts.spotify.com/authorize?` +
        `client_id=${SPOTIFY_CLIENT_ID}&` +
        `response_type=token&` +
        `redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&` +
        `scope=${encodeURIComponent(scopes)}`;
    res.redirect(authUrl);
});

app.get('/callback', (req, res) => {
    res.send(`
        <script>
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const token = params.get('access_token');
            if (token) {
                window.opener.postMessage({type: 'spotify_auth_success', token: token}, '*');
            }
            window.close();
        </script>
    `);
});

// Music API
app.post('/upload-music', requireAuth, musicUpload.array('music'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const music = JSON.parse(fs.readFileSync(musicFile, 'utf8') || '{}');
    const uploadedFiles = [];
    
    req.files.forEach(file => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        music[id] = {
            id,
            filename: file.filename,
            originalName: file.originalname,
            title: file.originalname.replace(/\.[^/.]+$/, ''),
            uploaded: new Date().toISOString()
        };
        uploadedFiles.push(music[id]);
    });
    
    fs.writeFileSync(musicFile, JSON.stringify(music));
    res.json({ message: 'Music uploaded successfully!', files: uploadedFiles });
});

app.get('/music-list', (req, res) => {
    try {
        const music = JSON.parse(fs.readFileSync(musicFile, 'utf8'));
        res.json(Object.values(music || {}));
    } catch (error) {
        res.json([]);
    }
});

app.delete('/music/:id', (req, res) => {
    try {
        const music = JSON.parse(fs.readFileSync(musicFile, 'utf8') || '{}');
        if (music[req.params.id]) {
            const musicPath = path.join(musicDir, music[req.params.id].filename);
            if (fs.existsSync(musicPath)) {
                fs.unlinkSync(musicPath);
            }
            delete music[req.params.id];
            fs.writeFileSync(musicFile, JSON.stringify(music));
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete music' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Photo sharing app running on http://localhost:${PORT}`);
    console.log(`Access from other devices: http://YOUR_IP_ADDRESS:${PORT}`);
});pp.post('/favorite/:photo', (req, res) => {
    try {
        const favorites = JSON.parse(fs.readFileSync(favoritesFile, 'utf8'));
        favorites[req.params.photo] = !favorites[req.params.photo];
        fs.writeFileSync(favoritesFile, JSON.stringify(favorites));
        res.json({ favorite: favorites[req.params.photo] });
    } catch (error) {
        res.json({ favorite: true });
    }
});

app.get('/favorite/:photo', (req, res) => {
    try {
        const favorites = JSON.parse(fs.readFileSync(favoritesFile, 'utf8'));
        res.json({ favorite: favorites[req.params.photo] || false });
    } catch (error) {
        res.json({ favorite: false });
    }
});

// Delete photo
app.delete('/photo/:photo', (req, res) => {
    try {
        const photoPath = path.join(uploadsDir, req.params.photo);
        if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete photo' });
    }
});

// Spotify API configuration - Replace with your actual Client ID
const SPOTIFY_CLIENT_ID = '1234567890abcdef'; // Get from https://developer.spotify.com
const SPOTIFY_REDIRECT_URI = 'http://localhost:3000/callback';

// Spotify auth
app.get('/spotify-login', (req, res) => {
    if (SPOTIFY_CLIENT_ID === '1234567890abcdef') {
        res.send(`
            <h2>Spotify Setup Required</h2>
            <p>To use Spotify integration:</p>
            <ol>
                <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank">Spotify Developer Dashboard</a></li>
                <li>Create a new app</li>
                <li>Copy your Client ID</li>
                <li>Replace 'SPOTIFY_CLIENT_ID' in server.js</li>
                <li>Add redirect URI: http://localhost:5500/callback</li>
            </ol>
            <button onclick="window.close()">Close</button>
        `);
        return;
    }
    
    const scopes = 'streaming user-read-email user-read-private';
    const authUrl = `https://accounts.spotify.com/authorize?` +
        `client_id=${SPOTIFY_CLIENT_ID}&` +
        `response_type=token&` +
        `redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&` +
        `scope=${encodeURIComponent(scopes)}`;
    res.redirect(authUrl);
});

app.get('/callback', (req, res) => {
    res.send(`
        <script>
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const token = params.get('access_token');
            if (token) {
                window.opener.postMessage({type: 'spotify_auth_success', token: token}, '*');
            }
            window.close();
        </script>
    `);
});

app.get('/spotify-search/:query', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const fetch = require('node-fetch');
        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(req.params.query)}&type=track&limit=20`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        const results = data.tracks.items.map(track => ({
            id: track.id,
            title: track.name,
            artist: track.artists[0].name,
            album: track.album.name,
            preview: track.preview_url,
            uri: track.uri,
            image: track.album.images[0]?.url
        }));
        
        res.json(results);
    } catch (error) {
        console.error('Spotify search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Music API
app.post('/upload-music', requireAuth, musicUpload.array('music'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const music = JSON.parse(fs.readFileSync(musicFile, 'utf8') || '{}');
    const uploadedFiles = [];
    
    req.files.forEach(file => {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        music[id] = {
            id,
            filename: file.filename,
            originalName: file.originalname,
            title: file.originalname.replace(/\.[^/.]+$/, ''),
            uploaded: new Date().toISOString()
        };
        uploadedFiles.push(music[id]);
    });
    
    fs.writeFileSync(musicFile, JSON.stringify(music));
    res.json({ message: 'Music uploaded successfully!', files: uploadedFiles });
});

app.get('/music-list', (req, res) => {
    try {
        const music = JSON.parse(fs.readFileSync(musicFile, 'utf8'));
        res.json(Object.values(music || {}));
    } catch (error) {
        res.json([]);
    }
});

app.delete('/music/:id', (req, res) => {
    try {
        const music = JSON.parse(fs.readFileSync(musicFile, 'utf8') || '{}');
        if (music[req.params.id]) {
            const musicPath = path.join(musicDir, music[req.params.id].filename);
            if (fs.existsSync(musicPath)) {
                fs.unlinkSync(musicPath);
            }
            delete music[req.params.id];
            fs.writeFileSync(musicFile, JSON.stringify(music));
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete music' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Photo sharing app running on http://localhost:${PORT}`);
    console.log(`Access from other devices: http://YOUR_IP_ADDRESS:${PORT}`);
});