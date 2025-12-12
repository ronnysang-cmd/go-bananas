document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const photoInput = document.getElementById('photoInput');
    const uploadForm = document.getElementById('uploadForm');
    const uploadBtn = document.getElementById('uploadBtn');
    const photosGrid = document.getElementById('photosGrid');
    
    // Tab functionality
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + '-tab').classList.add('active');
        });
    });

    // Click to upload
    uploadArea.addEventListener('click', () => {
        photoInput.click();
    });

    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            photoInput.files = files;
            uploadBtn.disabled = false;
        }
    });

    // File input change
    photoInput.addEventListener('change', (e) => {
        uploadBtn.disabled = !e.target.files.length;
    });

    // Form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('photo', photoInput.files[0]);

        try {
            uploadBtn.textContent = 'Uploading...';
            uploadBtn.disabled = true;

            const sessionId = new URLSearchParams(window.location.search).get('session');
            const response = await fetch('/upload', {
                method: 'POST',
                headers: { 'X-Session-Id': sessionId },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                alert('Photo uploaded successfully!');
                photoInput.value = '';
                loadPhotos();
            } else {
                const errorText = await response.text();
                alert('Error: ' + errorText);
            }
        } catch (error) {
            alert('Upload failed: ' + error.message);
        } finally {
            uploadBtn.textContent = 'Upload Photo';
            uploadBtn.disabled = true;
        }
    });

    // Load and display photos
    async function loadPhotos() {
        try {
            const response = await fetch('/photos');
            const photos = await response.json();

            if (photos.length === 0) {
                photosGrid.innerHTML = '<div class="no-photos">No photos uploaded yet. Upload your first photo!</div>';
                return;
            }

            photosGrid.innerHTML = photos.map(photo => `
                <div class="photo-item">
                    <img src="/uploads/${photo}" alt="Uploaded photo" loading="lazy">
                    <div class="photo-actions">
                        <button class="action-btn like-btn" onclick="likePhoto('${photo}')" id="like-${photo}">
                            ❤️ <span id="likes-${photo}">0</span>
                        </button>
                        <button class="action-btn favorite-btn" onclick="favoritePhoto('${photo}')" id="fav-${photo}">
                            ⭐
                        </button>
                        <button class="action-btn delete-btn" onclick="deletePhoto('${photo}')">
                            🗑️
                        </button>
                    </div>
                    <div class="photo-comments">
                        <div class="comments-list" id="comments-${photo}"></div>
                        <div class="comment-input-container">
                            <input type="text" class="comment-input" id="comment-${photo}" placeholder="Add a comment..." 
                                   onkeypress="if(event.key==='Enter') addComment('${photo}', this.value, this)">
                            <div class="comment-emoji-picker">
                                <button type="button" class="emoji-btn" onclick="addEmoji('comment-${photo}', '😀')">😀</button>
                                <button type="button" class="emoji-btn" onclick="addEmoji('comment-${photo}', '😍')">😍</button>
                                <button type="button" class="emoji-btn" onclick="addEmoji('comment-${photo}', '👍')">👍</button>
                                <button type="button" class="emoji-btn" onclick="addEmoji('comment-${photo}', '❤️')">❤️</button>
                                <button type="button" class="emoji-btn" onclick="addEmoji('comment-${photo}', '🎉')">🎉</button>
                                <button type="button" class="emoji-btn" onclick="addEmoji('comment-${photo}', '🔥')">🔥</button>
                            </div>
                        </div>
                        <button class="add-comment" onclick="addComment('${photo}', document.getElementById('comment-${photo}').value, document.getElementById('comment-${photo}'))">Comment</button>
                    </div>
                </div>
            `).join('');
            
            // Load comments, likes, and favorites for each photo
            photos.forEach(photo => {
                loadComments(photo);
                loadLikes(photo);
                loadFavorite(photo);
            });
        } catch (error) {
            console.error('Error loading photos:', error);
            photosGrid.innerHTML = '<div class="no-photos">Error loading photos</div>';
        }
    }

    // Notes functionality
    const notesArea = document.getElementById('notesArea');
    const noteTitle = document.getElementById('noteTitle');
    const saveNotes = document.getElementById('saveNotes');
    const notesList = document.getElementById('notesList');
    let editingNoteId = null;
    
    async function loadNotes() {
        try {
            const response = await fetch('/notes');
            const notes = await response.json();
            console.log('Loaded notes:', notes);
            
            if (!Array.isArray(notes) || notes.length === 0) {
                notesList.innerHTML = '<p style="color: #888;">No notes saved yet</p>';
                return;
            }
            
            notesList.innerHTML = notes.map(note => {
                const safeTitle = (note.title || 'Untitled').replace(/'/g, '&apos;');
                const safeContent = note.content.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
                const preview = note.content.length > 100 ? note.content.substring(0, 100) + '...' : note.content;
                
                return `
                    <div class="note-item">
                        <div class="note-header">
                            <h4>${note.title || 'Untitled'}</h4>
                            <div class="note-actions">
                                <button onclick="editNote('${note.id}', '${safeTitle}', '${safeContent}')">Edit</button>
                                <button onclick="deleteNote('${note.id}')">Delete</button>
                            </div>
                        </div>
                        <p>${preview}</p>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading notes:', error);
            notesList.innerHTML = '<p style="color: #888;">Error loading notes</p>';
        }
    }
    
    saveNotes.addEventListener('click', async () => {
        const title = noteTitle.value.trim() || 'Untitled';
        const content = notesArea.value.trim();
        
        if (!content) {
            alert('Please write some content!');
            return;
        }
        
        try {
            if (editingNoteId) {
                await fetch(`/notes/${editingNoteId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content })
                });
                editingNoteId = null;
                saveNotes.textContent = 'Save Note';
            } else {
                await fetch('/notes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content })
                });
            }
            
            noteTitle.value = '';
            notesArea.value = '';
            loadNotes();
            alert('Note saved!');
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save note');
        }
    });
    
    window.editNote = function(id, title, content) {
        noteTitle.value = title.replace(/&apos;/g, "'");
        notesArea.value = content.replace(/&apos;/g, "'").replace(/&quot;/g, '"');
        editingNoteId = id;
        saveNotes.textContent = 'Update Note';
    };
    
    window.deleteNote = async function(id) {
        if (confirm('Delete this note?')) {
            await fetch(`/notes/${id}`, { method: 'DELETE' });
            loadNotes();
        }
    };
    
    // Calendar functionality
    const eventDate = document.getElementById('eventDate');
    const eventTitle = document.getElementById('eventTitle');
    const addEvent = document.getElementById('addEvent');
    const eventsList = document.getElementById('eventsList');
    
    async function loadEvents() {
        try {
            const response = await fetch('/events');
            const events = await response.json();
            eventsList.innerHTML = Object.entries(events)
                .flatMap(([date, evts]) => evts.map(evt => 
                    `<div class="event-item">${date}: ${evt.title}</div>`
                )).join('');
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }
    
    addEvent.addEventListener('click', async () => {
        if (eventDate.value && eventTitle.value) {
            await fetch('/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: eventDate.value, title: eventTitle.value })
            });
            eventTitle.value = '';
            loadEvents();
        }
    });
    
    // Comments functionality
    window.addComment = async function(photo, comment, input) {
        if (!comment.trim()) return;
        await fetch(`/comments/${photo}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment })
        });
        input.value = '';
        loadComments(photo);
    };
    
    async function loadComments(photo) {
        try {
            const response = await fetch(`/comments/${photo}`);
            const comments = await response.json();
            const commentsDiv = document.getElementById(`comments-${photo}`);
            if (commentsDiv) {
                commentsDiv.innerHTML = comments.map(c => 
                    `<div class="comment">${c.comment}</div>`
                ).join('');
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }
    
    // Photo actions
    window.likePhoto = async function(photo) {
        try {
            const response = await fetch(`/like/${photo}`, { method: 'POST' });
            if (response.ok) {
                loadLikes(photo);
            } else {
                console.error('Failed to like photo');
            }
        } catch (error) {
            console.error('Error liking photo:', error);
        }
    };
    
    window.favoritePhoto = async function(photo) {
        try {
            const response = await fetch(`/favorite/${photo}`, { method: 'POST' });
            if (response.ok) {
                const result = await response.json();
                const btn = document.getElementById(`fav-${photo}`);
                if (btn) {
                    btn.style.color = result.favorite ? '#00d4ff' : '#cccccc';
                    btn.style.textShadow = result.favorite ? '0 0 10px #00d4ff' : 'none';
                }
            } else {
                console.error('Failed to favorite photo');
            }
        } catch (error) {
            console.error('Error favoriting photo:', error);
        }
    };
    
    window.deletePhoto = async function(photo) {
        if (confirm('Delete this photo?')) {
            await fetch(`/photo/${photo}`, { method: 'DELETE' });
            loadPhotos();
        }
    };
    
    async function loadLikes(photo) {
        try {
            const response = await fetch(`/likes/${photo}`);
            const result = await response.json();
            document.getElementById(`likes-${photo}`).textContent = result.likes;
        } catch (error) {
            console.error('Error loading likes:', error);
        }
    }
    
    async function loadFavorite(photo) {
        try {
            const response = await fetch(`/favorite/${photo}`);
            const result = await response.json();
            const btn = document.getElementById(`fav-${photo}`);
            if (btn) {
                btn.style.color = result.favorite ? '#00d4ff' : '#cccccc';
                btn.style.textShadow = result.favorite ? '0 0 10px #00d4ff' : 'none';
            }
        } catch (error) {
            console.error('Error loading favorite:', error);
        }
    }
    
    // Emoji functionality
    window.addEmoji = function(inputId, emoji) {
        const input = document.getElementById(inputId);
        const cursorPos = input.selectionStart;
        const textBefore = input.value.substring(0, cursorPos);
        const textAfter = input.value.substring(cursorPos);
        input.value = textBefore + emoji + textAfter;
        input.focus();
        input.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
    };
    
    // Music functionality
    const musicUploadArea = document.getElementById('musicUploadArea');
    const musicInput = document.getElementById('musicInput');
    const musicUploadForm = document.getElementById('musicUploadForm');
    const uploadMusicBtn = document.getElementById('uploadMusicBtn');
    const audioPlayer = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const progressBar = document.getElementById('progressBar');
    const currentTime = document.getElementById('currentTime');
    const duration = document.getElementById('duration');
    const currentTrack = document.getElementById('currentTrack');
    const musicList = document.getElementById('musicList');
    
    let playlist = [];
    let currentTrackIndex = 0;
    let isShuffled = false;
    
    // Music upload
    if (musicUploadArea && musicInput) {
        musicUploadArea.addEventListener('click', () => musicInput.click());
        
        musicInput.addEventListener('change', (e) => {
            uploadMusicBtn.disabled = !e.target.files.length;
            console.log('Files selected:', e.target.files.length);
        });
    }
    
    if (musicUploadForm) {
        musicUploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!musicInput.files.length) {
                alert('Please select music files first!');
                return;
            }
            
            const formData = new FormData();
            Array.from(musicInput.files).forEach(file => {
                formData.append('music', file);
            });
            
            try {
                uploadMusicBtn.textContent = 'Uploading...';
                uploadMusicBtn.disabled = true;
                
                const response = await fetch('/upload-music', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    alert('Music uploaded successfully!');
                    musicInput.value = '';
                    loadMusic();
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                console.error('Upload error:', error);
                alert('Upload failed: ' + error.message);
            } finally {
                uploadMusicBtn.textContent = 'Upload Music';
                uploadMusicBtn.disabled = true;
            }
        });
    }
    
    // Music player controls
    playPauseBtn?.addEventListener('click', () => {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playPauseBtn.textContent = '⏸️';
        } else {
            audioPlayer.pause();
            playPauseBtn.textContent = '▶️';
        }
    });
    
    prevBtn?.addEventListener('click', () => {
        currentTrackIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : playlist.length - 1;
        playTrack(currentTrackIndex);
    });
    
    nextBtn?.addEventListener('click', () => {
        currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        playTrack(currentTrackIndex);
    });
    
    shuffleBtn?.addEventListener('click', () => {
        isShuffled = !isShuffled;
        shuffleBtn.style.color = isShuffled ? '#00d4ff' : '#ccc';
    });
    
    audioPlayer?.addEventListener('timeupdate', () => {
        if (audioPlayer.duration) {
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressBar.value = progress;
            currentTime.textContent = formatTime(audioPlayer.currentTime);
        }
    });
    
    audioPlayer?.addEventListener('loadedmetadata', () => {
        duration.textContent = formatTime(audioPlayer.duration);
    });
    
    audioPlayer?.addEventListener('ended', () => {
        if (isShuffled) {
            currentTrackIndex = Math.floor(Math.random() * playlist.length);
        } else {
            currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
        }
        playTrack(currentTrackIndex);
    });
    
    progressBar?.addEventListener('input', () => {
        const time = (progressBar.value / 100) * audioPlayer.duration;
        audioPlayer.currentTime = time;
    });
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    function playTrack(index) {
        if (playlist[index]) {
            const track = playlist[index];
            audioPlayer.src = `/music/${track.filename}`;
            currentTrack.textContent = track.title;
            audioPlayer.play();
            playPauseBtn.textContent = '⏸️';
            
            // Highlight current track
            document.querySelectorAll('.music-item').forEach((item, i) => {
                item.classList.toggle('playing', i === index);
            });
        }
    }
    
    async function loadMusic() {
        try {
            const response = await fetch('/music-list');
            playlist = await response.json();
            
            if (playlist.length === 0) {
                musicList.innerHTML = '<p style="color: #888;">No music uploaded yet</p>';
                return;
            }
            
            musicList.innerHTML = playlist.map((track, index) => `
                <div class="music-item" onclick="playTrack(${index})">
                    <div class="track-info">
                        <h4>${track.title}</h4>
                        <p>${track.originalName}</p>
                    </div>
                    <button onclick="deleteMusic('${track.id}', event)">🗑️</button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading music:', error);
        }
    }
    
    window.playTrack = playTrack;
    
    window.deleteMusic = async function(id, event) {
        event.stopPropagation();
        if (confirm('Delete this track?')) {
            await fetch(`/music/${id}`, { method: 'DELETE' });
            loadMusic();
        }
    };
    
    // Spotify integration
    const spotifyLoginBtn = document.getElementById('spotifyLoginBtn');
    const spotifyStatus = document.getElementById('spotifyStatus');
    const spotifySearchInput = document.getElementById('spotifySearchInput');
    const spotifySearchBtn = document.getElementById('spotifySearchBtn');
    const spotifyResults = document.getElementById('spotifyResults');
    
    let spotifyToken = null;
    
    spotifyLoginBtn?.addEventListener('click', () => {
        window.open('/spotify-login', 'spotify-auth', 'width=500,height=600');
        
        window.addEventListener('message', (event) => {
            if (event.data.type === 'spotify_auth_success') {
                spotifyToken = event.data.token;
                spotifyStatus.innerHTML = '<span style="color: #00d4ff;">✓ Connected to Spotify</span>';
                spotifyLoginBtn.style.display = 'none';
                document.getElementById('spotifySearchControls').style.display = 'flex';
            }
        });
    });
    
    spotifySearchBtn?.addEventListener('click', async () => {
        const query = spotifySearchInput.value.trim();
        if (!query || !spotifyToken) return;
        
        try {
            const response = await fetch(`/spotify-search/${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${spotifyToken}` }
            });
            const results = await response.json();
            
            spotifyResults.innerHTML = results.map(track => `
                <div class="search-result-item">
                    <img src="${track.image}" alt="Album art" class="album-art">
                    <div class="track-details">
                        <h4>${track.title}</h4>
                        <p>${track.artist}</p>
                        <small>${track.album}</small>
                    </div>
                    <button onclick="playSpotifyPreview('${track.preview}')">🎵</button>
                </div>
            `).join('');
        } catch (error) {
            spotifyResults.innerHTML = '<p style="color: #ff4444;">Search failed</p>';
        }
    });
    
    window.playSpotifyPreview = function(previewUrl) {
        if (previewUrl) {
            audioPlayer.src = previewUrl;
            audioPlayer.play();
        } else {
            alert('No preview available. Spotify Premium required for full songs.');
        }
    };
    
    // Online music search
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    
    searchBtn?.addEventListener('click', searchMusic);
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchMusic();
    });
    
    async function searchMusic() {
        const query = searchInput.value.trim();
        if (!query) return;
        
        try {
            searchBtn.textContent = 'Searching...';
            searchBtn.disabled = true;
            
            const response = await fetch(`/search-music/${encodeURIComponent(query)}`);
            const results = await response.json();
            
            if (results.length === 0) {
                searchResults.innerHTML = '<p style="color: #888;">No results found</p>';
                return;
            }
            
            searchResults.innerHTML = results.map(track => `
                <div class="search-result-item" onclick="playOnlineTrack('${track.preview}', '${track.title}', '${track.artist}')">
                    <img src="${track.artwork}" alt="Album art" class="album-art">
                    <div class="track-details">
                        <h4>${track.title}</h4>
                        <p>${track.artist}</p>
                        <small>${track.album}</small>
                    </div>
                    <button class="play-preview">▶️</button>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Search error:', error);
            searchResults.innerHTML = '<p style="color: #ff4444;">Search failed. Check internet connection.</p>';
        } finally {
            searchBtn.textContent = 'Search';
            searchBtn.disabled = false;
        }
    }
    
    window.playOnlineTrack = function(previewUrl, title, artist) {
        if (previewUrl) {
            audioPlayer.src = previewUrl;
            currentTrack.textContent = title;
            document.getElementById('currentArtist').textContent = artist;
            audioPlayer.play();
            playPauseBtn.textContent = '⏸️';
        } else {
            alert('Preview not available for this track');
        }
    };
    
    // Load photos on page load
    loadPhotos();
    loadNotes();
    loadEvents();
    loadMusic();
});