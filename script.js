const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('start-btn');
const countdownEl = document.getElementById('countdown');
const countdownNum = countdownEl.querySelector('.countdown-number');
const resultBadge = document.getElementById('result-badge');
const resultText = resultBadge.querySelector('.result-text');
const playerMoveIcon = document.getElementById('player-move');
const cpuMoveIcon = document.getElementById('computer-move');
const playerScoreEl = document.getElementById('player-score-display');
const cpuScoreEl = document.getElementById('cpu-score-display');
const playerBar = document.getElementById('player-bar');
const cpuBar = document.getElementById('cpu-bar');
const indicator = document.getElementById('gesture-indicator');
const roundNumEl = document.getElementById('round-num');
const vsBadge = document.getElementById('vs-badge');
const playerCard = document.getElementById('player-card');
const cpuCard = document.getElementById('cpu-card');
const streakContainer = document.getElementById('streak-container');
const streakCount = document.getElementById('streak-count');

// Supabase DOM Elements
const trophyBtn = document.getElementById('trophy-btn');
const trophyModal = document.getElementById('trophy-modal');
const closeTrophyModalBtn = document.getElementById('close-trophy-modal');
const trophyUnauth = document.getElementById('trophy-unauth');
const trophyAuth = document.getElementById('trophy-auth');
const rankIcon = document.getElementById('rank-icon');
const rankName = document.getElementById('rank-name');
const rankProgress = document.getElementById('rank-progress');
const achievementsGrid = document.getElementById('achievements-grid');

const leaderboardBtn = document.getElementById('leaderboard-btn');
const leaderboardModal = document.getElementById('leaderboard-modal');
const closeLeaderboardModalBtn = document.getElementById('close-leaderboard-modal');
const leaderboardTable = document.getElementById('leaderboard-table');
const leaderboardBody = document.getElementById('leaderboard-body');
const leaderboardLoading = document.getElementById('leaderboard-loading');
const leaderboardNoDb = document.getElementById('leaderboard-no-db');

const authBtn = document.getElementById('auth-btn');
const authBtnIcon = document.getElementById('auth-btn-icon');
const authModal = document.getElementById('auth-modal');
const closeAuthModalBtn = document.getElementById('close-auth-modal');
const authTitle = document.getElementById('auth-title');
const authDesc = document.getElementById('auth-desc');
const authForm = document.getElementById('auth-form');
const authUsernameGroup = document.querySelector('.id-username-group');
const authUsername = document.getElementById('auth-username');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authError = document.getElementById('auth-error');
const authSuccess = document.getElementById('auth-success');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSubmitText = document.getElementById('auth-submit-text');
const authToggleBtn = document.getElementById('auth-toggle-btn');
const googleSigninBtn = document.getElementById('google-signin-btn');

let isGamePlaying = false;
let currentGesture = 'Unknown';
let playerScore = 0;
let cpuScore = 0;
let roundNumber = 1;
let winStreak = 0;
let playerHistory = [];
let shieldActive = false;
const MAX_ROUNDS_FOR_BAR = 10;

// Supabase State
let db = null;
let userSession = null;
let userProfile = null;
let isSignUpMode = false;

// ElevenLabs Config
const config = {
    apiKey: localStorage.getItem('elevenlabs_api_key') || '',
    voiceId: localStorage.getItem('elevenlabs_voice_id') || '21m00Tcm4TlvDq8ikWAM'
};

// Configurations run seamlessly using values stored in localStorage or defaults.

const GESTURE_ICONS = {
    'Rock': '✊',
    'Paper': '✋',
    'Scissors': '✌️',
    'Unknown': '❓'
};

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    let detectedGestures = [];

    // Draw landmarks
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        results.multiHandLandmarks.forEach((landmarks, index) => {
            const handedness = results.multiHandedness[index].label;
            const color = handedness === 'Left' ? '#818cf8' : '#22c55e';

            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: color, lineWidth: 4 });
            drawLandmarks(canvasCtx, landmarks, { color: '#ffffff', lineWidth: 1.5, radius: 3 });

            // Recognize gesture
            const gesture = recognizeGesture(landmarks);
            detectedGestures.push({ gesture, handedness });
        });

        // Update global state for the game (use the first hand or prioritized hand)
        currentGesture = detectedGestures[0].gesture;
        updateIndicators(detectedGestures);
    } else {
        currentGesture = 'Unknown';
        updateIndicators([]);
    }
    canvasCtx.restore();
}

function recognizeGesture(landmarks) {
    // Helper to calculate 3D distance
    const dist = (p1, p2) => Math.sqrt(
        Math.pow(p1.x - p2.x, 2) +
        Math.pow(p1.y - p2.y, 2) +
        Math.pow(p1.z - p2.z, 2)
    );

    const wrist = landmarks[0];

    // Finger tips and their corresponding PIP joints
    const fingerData = [
        { name: 'index', tip: 8, pip: 6 },
        { name: 'middle', tip: 12, pip: 10 },
        { name: 'ring', tip: 16, pip: 14 },
        { name: 'pinky', tip: 20, pip: 18 }
    ];

    const extended = fingerData.map(f => {
        const tipDist = dist(wrist, landmarks[f.tip]);
        const pipDist = dist(wrist, landmarks[f.pip]);
        return tipDist > pipDist;
    });

    // Thumb check: distance from pinky base (17) is a good proxy for extension
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[17];
    const thumbExtended = dist(thumbTip, thumbBase) > dist(landmarks[2], thumbBase) * 1.2;

    const [indexOut, middleOut, ringOut, pinkyOut] = extended;
    const numExtended = extended.filter(e => e).length + (thumbExtended ? 1 : 0);

    // Rock: All fingers closed
    if (numExtended <= 1) return 'Rock';

    // Scissors: Specifically Index and Middle fingers
    if (indexOut && middleOut && !ringOut && !pinkyOut) return 'Scissors';

    // Paper: All or most fingers open
    if (numExtended >= 4) return 'Paper';

    // Fallback/Intermediate states
    return 'Unknown';
}

function updateIndicators(handsData) {
    if (handsData.length > 0) {
        indicator.classList.remove('hidden');
        indicator.innerHTML = handsData.map(h =>
            `<span class="hand-tag ${h.handedness === 'Left' ? 'left' : 'right'}">
                ${h.handedness}: ${GESTURE_ICONS[h.gesture]} ${h.gesture}
            </span>`
        ).join(' ');
    } else {
        indicator.classList.add('hidden');
    }
}

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.8,
    minTrackingConfidence: 0.8,
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

camera.start();

// Audio Synthesis
async function speak(text) {
    // If API Key exists, use ElevenLabs
    if (config.apiKey) {
        try {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': config.apiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: { stability: 0.5, similarity_boost: 0.5 }
                })
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                audio.play();
                return; // Success, exit
            }
        } catch (err) {
            console.error('ElevenLabs Error:', err);
        }
    }

    // Fallback: Use Browser's Free Web Speech API
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Interrupt previous speech
        const utterance = new SpeechSynthesisUtterance(text);

        // Find a nice voice if possible
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Female')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.pitch = 1.1;
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// Modal Toggle Utilities
function showModal(modal) { modal.classList.remove('hidden'); }
function hideModal(modal) { modal.classList.add('hidden'); }

// Auth Modal Toggles
authBtn.onclick = () => {
    if (userSession) {
        // Simple and clean Logout confirmation
        if (confirm(`Logged in as "${userProfile?.username || 'User'}". Do you want to sign out?`)) {
            handleSignOut();
        }
    } else {
        resetAuthForm();
        showModal(authModal);
    }
};
closeAuthModalBtn.onclick = () => hideModal(authModal);

authToggleBtn.onclick = (e) => {
    e.preventDefault();
    isSignUpMode = !isSignUpMode;
    authTitle.innerText = isSignUpMode ? '👤 Account Sign Up' : '👤 Account Login';
    authDesc.innerText = isSignUpMode 
        ? 'Create an account to start saving stats and claim your place on the leaderboard.' 
        : 'Log in to sync your match stats and compete on the global leaderboard.';
    authSubmitText.innerText = isSignUpMode ? 'Sign Up' : 'Log In';
    authToggleBtn.innerText = isSignUpMode ? 'Log In' : 'Sign Up';
    document.getElementById('auth-toggle-msg').innerHTML = isSignUpMode 
        ? 'Already have an account? <a href="#" id="auth-toggle-btn">Log In</a>'
        : 'Don\'t have an account? <a href="#" id="auth-toggle-btn">Sign Up</a>';
    
    // Rebind the toggle button since innerHTML replaces it
    document.getElementById('auth-toggle-btn').onclick = authToggleBtn.onclick;
    
    if (isSignUpMode) {
        authUsernameGroup.classList.remove('hidden');
        authUsername.required = true;
    } else {
        authUsernameGroup.classList.add('hidden');
        authUsername.required = false;
    }
    clearAuthAlerts();
};

function resetAuthForm() {
    authForm.reset();
    isSignUpMode = false;
    authTitle.innerText = '👤 Account Login';
    authDesc.innerText = 'Log in to sync your match stats and compete on the global leaderboard.';
    authSubmitText.innerText = 'Log In';
    authUsernameGroup.classList.add('hidden');
    authUsername.required = false;
    document.getElementById('auth-toggle-msg').innerHTML = 'Don\'t have an account? <a href="#" id="auth-toggle-btn">Sign Up</a>';
    document.getElementById('auth-toggle-btn').onclick = authToggleBtn.onclick;
    clearAuthAlerts();
}

function clearAuthAlerts() {
    authError.classList.add('hidden');
    authSuccess.classList.add('hidden');
}

// Leaderboard Modal Toggles
leaderboardBtn.onclick = () => {
    showModal(leaderboardModal);
    loadLeaderboard();
};
closeLeaderboardModalBtn.onclick = () => hideModal(leaderboardModal);

// Close modals when clicking outside
window.onclick = (e) => {
    if (e.target === authModal) hideModal(authModal);
    if (e.target === leaderboardModal) hideModal(leaderboardModal);
};

/* ===== Supabase Logic ===== */

async function initSupabase() {
    let url = localStorage.getItem('supabase_url') || 'https://gndfkzjmvdweffyxstcx.supabase.co';
    let key = localStorage.getItem('supabase_key');
    
    // Purge the old publishable key if it got stuck in local storage
    if (!key || !key.startsWith('eyJ')) {
        key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZGZremptdmR3ZWZmeXhzdGN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MTQ5OTUsImV4cCI6MjA5NTI5MDk5NX0.XL3zI1x0k9TC4lR652TUO5QDhxTJcp0yV6u2N-OBM1Q';
        localStorage.setItem('supabase_key', key);
    }

    if (url && key) {
        try {
            // Initialize Supabase Client
            db = supabase.createClient(url, key);
            
            // Check current active session
            const { data: { session } } = await db.auth.getSession();
            handleAuthStateChange(session);

            // Listen to auth events
            db.auth.onAuthStateChange((_event, session) => {
                handleAuthStateChange(session);
            });
            console.log('📡 Supabase Initialized Successfully');
        } catch (err) {
            console.error('📡 Supabase Init Error:', err);
            db = null;
        }
    } else {
        db = null;
        userSession = null;
        userProfile = null;
        updateAuthButtonUI();
        console.log('📡 Supabase is not configured yet');
    }
}

async function handleAuthStateChange(session) {
    userSession = session;
    if (session) {
        // Check if user is banned via metadata or ban duration expiration
        const isBanned = (session.user.banned_until && new Date(session.user.banned_until) > new Date()) || 
                         session.user.user_metadata?.banned === true;
                         
        if (isBanned) {
            alert("🚫 Your account has been restricted by the Administrator.");
            // Prevent login loop by signing out
            if (db) {
                await db.auth.signOut();
            }
            userSession = null;
            userProfile = null;
            updateAuthButtonUI();
            return;
        }

        await fetchUserProfile(session.user.id);
    } else {
        userProfile = null;
    }
    updateAuthButtonUI();
}

async function fetchUserProfile(userId) {
    if (!db) return;
    try {
        const { data, error } = await db
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            // Profile not found in table, let's try to create one (upsert it)
            console.log('Profile not found, creating one...');
            const defaultUsername = userSession.user.user_metadata?.full_name || 
                                    userSession.user.user_metadata?.name || 
                                    userSession.user.email.split('@')[0];
            const { data: insertedData, error: insertError } = await db
                .from('profiles')
                .upsert({
                    id: userId,
                    username: defaultUsername,
                    total_wins: 0,
                    total_losses: 0,
                    max_streak: 0
                }, { onConflict: 'id' })
                .select()
                .single();

            if (insertError) throw insertError;
            userProfile = insertedData;
        } else {
            userProfile = data;
        }
    } catch (err) {
        console.error('Error fetching/creating profile:', err);
        // Fallback profile if table is empty/created slowly/permission denied
        const defaultUsername = userSession.user.user_metadata?.full_name || 
                                userSession.user.user_metadata?.name || 
                                userSession.user.email.split('@')[0];
        userProfile = { username: defaultUsername, total_wins: 0, total_losses: 0, max_streak: 0 };
    }
}

function updateAuthButtonUI() {
    if (userSession && userProfile) {
        authBtn.className = 'icon-btn logged-in';
        authBtn.innerHTML = `<span id="auth-btn-icon"></span> ${userProfile.username}`;
    } else {
        authBtn.className = 'icon-btn';
        authBtn.innerHTML = '<span id="auth-btn-icon">👤</span>';
    }
}

// Handle Login / Sign Up Submit
authForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!db) {
        showAuthAlert(authError, 'Please configure Supabase URL and Anon Key in settings first.');
        return;
    }

    clearAuthAlerts();
    authSubmitBtn.disabled = true;
    const oldBtnText = authSubmitText.innerText;
    authSubmitText.innerText = isSignUpMode ? 'Registering...' : 'Signing In...';

    const email = authEmail.value.trim();
    const password = authPassword.value;
    const username = authUsername.value.trim();

    try {
        if (isSignUpMode) {
            // Sign Up
            const { data, error } = await db.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username || email.split('@')[0]
                    }
                }
            });

            if (error) throw error;

            showAuthAlert(authSuccess, 'Registration successful! You can now log in.');
            // Switch to login mode
            setTimeout(() => {
                authToggleBtn.click();
                authEmail.value = email;
            }, 1500);
        } else {
            // Log In
            const { data, error } = await db.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            showAuthAlert(authSuccess, 'Welcome back! Logged in successfully.');
            setTimeout(() => {
                hideModal(authModal);
            }, 1000);
        }
    } catch (err) {
        console.error('Auth Error:', err);
        showAuthAlert(authError, err.message || 'An error occurred during authentication.');
    } finally {
        authSubmitBtn.disabled = false;
        authSubmitText.innerText = oldBtnText;
    }
};

// Google Sign-In Click Event
googleSigninBtn.onclick = async () => {
    if (!db) {
        showAuthAlert(authError, 'Please configure Supabase URL and Anon Key in settings first.');
        return;
    }
    clearAuthAlerts();
    try {
        const { data, error } = await db.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
    } catch (err) {
        console.error('Google Auth Error:', err);
        showAuthAlert(authError, err.message || 'An error occurred during Google sign in.');
    }
};

async function handleSignOut() {
    if (!db) return;
    try {
        const { error } = await db.auth.signOut();
        if (error) throw error;
        userSession = null;
        userProfile = null;
        updateAuthButtonUI();
        alert('Signed out successfully.');
    } catch (err) {
        console.error('Sign Out Error:', err);
    }
}

function showAuthAlert(element, message) {
    element.innerText = message;
    element.classList.remove('hidden');
}

// Fetch and Render Global Leaderboard rankings
async function loadLeaderboard() {
    if (!db) {
        leaderboardLoading.classList.add('hidden');
        leaderboardNoDb.classList.remove('hidden');
        leaderboardTable.classList.add('hidden');
        return;
    }

    leaderboardLoading.classList.remove('hidden');
    leaderboardNoDb.classList.add('hidden');
    leaderboardTable.classList.add('hidden');
    leaderboardBody.innerHTML = '';

    try {
        const { data, error } = await db
            .from('profiles')
            .select('*')
            .order('max_streak', { ascending: false })
            .limit(10);

        if (error) throw error;

        if (data && data.length > 0) {
            data.forEach((profile, index) => {
                const rank = index + 1;
                const isCurrent = userSession && profile.id === userSession.user.id;
                
                const winLossRatio = profile.total_losses > 0 
                    ? (profile.total_wins / profile.total_losses).toFixed(1)
                    : profile.total_wins.toFixed(1);

                const row = document.createElement('tr');
                if (isCurrent) row.className = 'current-user';

                row.innerHTML = `
                    <td><span class="rank-badge rank-${rank <= 3 ? rank : 'generic'}">${rank}</span></td>
                    <td>
                        <div class="player-cell">
                            <span class="player-avatar">${profile.username.substring(0, 2).toUpperCase()}</span>
                            <span>${profile.username} ${isCurrent ? '(You)' : ''}</span>
                        </div>
                    </td>
                    <td><strong class="accent">${profile.max_streak}</strong></td>
                    <td>${profile.total_wins}w / ${profile.total_losses}l <span class="optional-tag">Ratio: ${winLossRatio}</span></td>
                `;
                leaderboardBody.appendChild(row);
            });

            leaderboardLoading.classList.add('hidden');
            leaderboardTable.classList.remove('hidden');
        } else {
            leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No records found. Be the first to claim a streak!</td></tr>';
            leaderboardLoading.classList.add('hidden');
            leaderboardTable.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Leaderboard Fetch Error:', err);
        leaderboardBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger);">Failed to load leaderboard: ${err.message}</td></tr>`;
        leaderboardLoading.classList.add('hidden');
        leaderboardTable.classList.remove('hidden');
    }
}

async function logMatchToDatabase(playerMove, cpuMove, result) {
    if (!db || !userSession) return;

    try {
        const userId = userSession.user.id;

        // 1. Insert Match Record
        const { error: matchError } = await db
            .from('matches')
            .insert({
                player_id: userId,
                player_move: playerMove,
                cpu_move: cpuMove,
                result: result,
                round_number: roundNumber
            });

        if (matchError) throw matchError;

        // 2. Fetch latest profile stats
        if (!userProfile) return;
        
        let newWins = parseInt(userProfile.total_wins) || 0;
        let newLosses = parseInt(userProfile.total_losses) || 0;
        let newMaxStreak = parseInt(userProfile.max_streak) || 0;

        if (result === 'win') {
            newWins++;
            if (winStreak > newMaxStreak) {
                newMaxStreak = winStreak;
            }
        } else if (result === 'loss') {
            newLosses++;
        }

        // 3. Update Profile stats (using update to respect RLS)
        const { error: profileError } = await db
            .from('profiles')
            .update({
                total_wins: newWins,
                total_losses: newLosses,
                max_streak: newMaxStreak
            })
            .eq('id', userId);

        if (profileError) {
            console.error('Failed to update profile:', profileError);
            // Optionally, fallback to upsert if update fails (e.g., if profile doesn't exist)
            const { error: upsertError } = await db
                .from('profiles')
                .upsert({
                    id: userId,
                    username: userProfile.username || 'Player',
                    total_wins: newWins,
                    total_losses: newLosses,
                    max_streak: newMaxStreak
                });
            if (upsertError) throw upsertError;
        }

        // Update local profile state
        userProfile.total_wins = newWins;
        userProfile.total_losses = newLosses;
        userProfile.max_streak = newMaxStreak;

    } catch (err) {
        console.error('Error logging match to database:', err);
    }
}

// Call on startup
initSupabase();

// Update Score Bars
function updateScoreBars() {
    const maxScore = Math.max(playerScore, cpuScore, MAX_ROUNDS_FOR_BAR);
    playerBar.style.width = `${(playerScore / maxScore) * 100}%`;
    cpuBar.style.width = `${(cpuScore / maxScore) * 100}%`;
}

// Game Logic
async function playGame() {
    if (isGamePlaying) return;
    isGamePlaying = true;
    startBtn.disabled = true;
    resultBadge.classList.add('hidden');
    streakContainer.classList.add('hidden');
    cpuMoveIcon.innerText = '❓';
    cpuMoveIcon.classList.remove('reveal');
    playerMoveIcon.classList.remove('reveal');

    // Activate VS badge
    vsBadge.classList.add('active');

    // Countdown
    countdownEl.classList.remove('hidden');
    for (let i = 3; i > 0; i--) {
        countdownNum.innerText = i;
        // Re-trigger animation
        countdownNum.style.animation = 'none';
        countdownNum.offsetHeight; // Force reflow
        countdownNum.style.animation = '';
        await new Promise(r => setTimeout(r, 900));
    }
    countdownNum.innerText = 'GO!';
    countdownNum.style.fontSize = '5rem';
    await new Promise(r => setTimeout(r, 500));
    countdownEl.classList.add('hidden');
    countdownNum.style.fontSize = '';

    // Deactivate VS badge
    vsBadge.classList.remove('active');

    // Capture result
    const playerMove = currentGesture;
    const moves = ['Rock', 'Paper', 'Scissors'];
    let cpuMove = moves[Math.floor(Math.random() * 3)];

    // Adaptive AI logic
    if (playerHistory.length >= 3 && playerMove !== 'Unknown') {
        const lastThree = playerHistory.slice(-3);
        if (lastThree[0] === lastThree[1] && lastThree[1] === lastThree[2]) {
            // Player is spamming the same move, counter it!
            const spamMove = lastThree[0];
            if (spamMove === 'Rock') cpuMove = 'Paper';
            else if (spamMove === 'Paper') cpuMove = 'Scissors';
            else if (spamMove === 'Scissors') cpuMove = 'Rock';
        }
    }

    playerMoveIcon.innerText = GESTURE_ICONS[playerMove];
    playerMoveIcon.classList.add('reveal');

    // Slight delay before revealing CPU move
    await new Promise(r => setTimeout(r, 300));
    cpuMoveIcon.innerText = GESTURE_ICONS[cpuMove];
    cpuMoveIcon.classList.add('reveal');

    await new Promise(r => setTimeout(r, 200));

    determineWinner(playerMove, cpuMove);

    // Update round
    roundNumber++;
    roundNumEl.innerText = roundNumber;

    isGamePlaying = false;
    startBtn.disabled = false;
    startBtn.querySelector('.btn-text').innerText = 'PLAY AGAIN';
}

function determineWinner(player, cpu) {
    resultBadge.classList.remove('hidden');

    // Reset card animations
    playerCard.classList.remove('win-flash', 'lose-flash');
    cpuCard.classList.remove('win-flash', 'lose-flash');

    if (player === 'Unknown') {
        resultText.innerText = '🤷 Gesture Not Detected';
        resultText.style.color = 'var(--text-muted)';
        winStreak = 0;
        streakContainer.classList.add('hidden');
        shieldActive = false;
        return;
    }

    playerHistory.push(player);

    let result = '';

    if (player === cpu) {
        resultText.innerText = "🤝 IT'S A DRAW!";
        resultText.style.color = 'var(--gold)';
        resultBadge.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), transparent)';
        resultBadge.style.border = '1px solid rgba(245, 158, 11, 0.2)';
        winStreak = 0;
        streakContainer.classList.add('hidden');
        speak("It is a draw!");
        result = 'draw';
    } else if (
        (player === 'Rock' && cpu === 'Scissors') ||
        (player === 'Paper' && cpu === 'Rock') ||
        (player === 'Scissors' && cpu === 'Paper')
    ) {
        resultText.innerText = '🎉 YOU WIN!';
        resultText.style.color = 'var(--success)';
        resultBadge.style.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), transparent)';
        resultBadge.style.border = '1px solid rgba(34, 197, 94, 0.2)';
        playerScore++;
        playerScoreEl.innerText = playerScore;
        playerCard.classList.add('win-flash');
        cpuCard.classList.add('lose-flash');

        if (window.confetti) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Haptic win

        // Update streak
        winStreak++;
        if (winStreak >= 2) {
            streakContainer.classList.remove('hidden');
            streakCount.innerText = winStreak;
        }

        if (winStreak === 3) {
            shieldActive = true;
            resultText.innerText = '🎉 YOU WIN! (SHIELD UNLOCKED)';
            speak("Unstoppable! You have earned a shield!");
        } else {
            const winLines = ["You win! Congratulations!", "Great move!", "You got me this time!"];
            speak(winLines[Math.floor(Math.random() * winLines.length)]);
        }
        result = 'win';
    } else {
        if (shieldActive) {
            resultText.innerText = '🛡️ SHIELD SAVED YOUR STREAK!';
            resultText.style.color = 'var(--cyan)';
            resultBadge.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), transparent)';
            resultBadge.style.border = '1px solid rgba(6, 182, 212, 0.2)';
            shieldActive = false; // consume shield
            speak("Your shield absorbed the impact!");
            result = 'loss'; // Logged as loss, but streak remains
        } else {
            resultText.innerText = '💻 CPU WINS!';
            resultText.style.color = 'var(--danger)';
            resultBadge.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), transparent)';
            resultBadge.style.border = '1px solid rgba(239, 68, 68, 0.2)';
            cpuScore++;
            cpuScoreEl.innerText = cpuScore;
            cpuCard.classList.add('win-flash');
            playerCard.classList.add('lose-flash');
            winStreak = 0;
            streakContainer.classList.add('hidden');
            
            if (navigator.vibrate) navigator.vibrate(300); // Haptic loss
            const lossLines = ["The computer wins this round.", "Is that all you've got?", "Better luck next time!", "I am learning your patterns."];
            speak(lossLines[Math.floor(Math.random() * lossLines.length)]);
            result = 'loss';
        }
    }

    updateScoreBars();

    // Log to Supabase
    logMatchToDatabase(player, cpu, result);
}

startBtn.addEventListener('click', playGame);

// Trophy Room Event Listeners
trophyBtn.addEventListener('click', openTrophyRoom);
closeTrophyModalBtn.addEventListener('click', () => trophyModal.classList.add('hidden'));

function openTrophyRoom() {
    trophyModal.classList.remove('hidden');
    if (!userProfile) {
        trophyUnauth.classList.remove('hidden');
        trophyAuth.classList.add('hidden');
        return;
    }
    
    trophyUnauth.classList.add('hidden');
    trophyAuth.classList.remove('hidden');
    
    // Calculate Rank
    const wins = userProfile.total_wins || 0;
    let rank = 'Bronze';
    let icon = '🥉';
    let nextTier = 10;
    
    if (wins >= 50) {
        rank = 'Platinum';
        icon = '💎';
        nextTier = 'MAX';
    } else if (wins >= 25) {
        rank = 'Gold';
        icon = '🥇';
        nextTier = 50;
    } else if (wins >= 10) {
        rank = 'Silver';
        icon = '🥈';
        nextTier = 25;
    }
    
    rankIcon.innerText = icon;
    rankName.innerText = rank;
    rankName.style.color = rank === 'Gold' ? 'var(--gold)' : (rank === 'Silver' ? '#cbd5e1' : (rank === 'Platinum' ? 'var(--cyan)' : '#b45309'));
    rankProgress.innerText = nextTier === 'MAX' ? `Wins: ${wins} (Max Rank)` : `Wins: ${wins} / ${nextTier} to next rank`;
    
    // Calculate Achievements
    const streak = userProfile.max_streak || 0;
    const totalPlayed = wins + (userProfile.total_losses || 0);
    
    const achievements = [
        { name: "First Blood", desc: "Win your first match", icon: "🩸", unlocked: wins >= 1 },
        { name: "Streak Master", desc: "Reach a 3-win streak", icon: "🔥", unlocked: streak >= 3 },
        { name: "Unstoppable", desc: "Reach a 5-win streak", icon: "🚀", unlocked: streak >= 5 },
        { name: "Dedicated", desc: "Play 10 matches", icon: "📅", unlocked: totalPlayed >= 10 },
        { name: "Centurion", desc: "Win 100 matches", icon: "👑", unlocked: wins >= 100 }
    ];
    
    achievementsGrid.innerHTML = '';
    achievements.forEach(ach => {
        const card = document.createElement('div');
        card.className = `achievement-card ${ach.unlocked ? 'unlocked' : ''}`;
        card.innerHTML = `
            <div class="achievement-icon">${ach.icon}</div>
            <div class="achievement-name">${ach.name}</div>
            <div class="achievement-desc">${ach.desc}</div>
        `;
        achievementsGrid.appendChild(card);
    });
}
