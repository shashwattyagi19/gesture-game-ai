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
// AI Calibration DOM Elements
const calibrateBtn = document.getElementById('calibrate-btn');
const calibrateModal = document.getElementById('calibrate-modal');
const closeCalibrateBtn = document.getElementById('close-calibrate');
const closeCalibrateBtn2 = document.getElementById('close-calibrate-btn');
const resetCalibrationBtn = document.getElementById('reset-calibration');
const calibrateSlotButtons = document.querySelectorAll('.btn-calibrate');

let activeCalibrationGesture = null;
let calibratedTemplates = {
    'Rock': JSON.parse(localStorage.getItem('calibration_Rock')) || null,
    'Paper': JSON.parse(localStorage.getItem('calibration_Paper')) || null,
    'Scissors': JSON.parse(localStorage.getItem('calibration_Scissors')) || null
};

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

// Multiplayer DOM Elements
const mpBtn = document.getElementById('multiplayer-btn');
const mpModal = document.getElementById('mp-modal');
const closeMpModalBtn = document.getElementById('close-mp-modal');
const mpLinkInput = document.getElementById('mp-link-input');
const mpCopyBtn = document.getElementById('mp-copy-btn');
const mpStatus = document.getElementById('mp-status');
const mpLeaveBtn = document.getElementById('mp-leave-btn');
const nicknameBtn = document.getElementById('nickname-btn');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');
const toggleMicBtn = document.getElementById('toggle-mic');
const toggleCamBtn = document.getElementById('toggle-cam');
const mediaControls = document.getElementById('media-controls');

let myNickname = localStorage.getItem('gesture_nickname') || 'Player';
let opponentNickname = 'Opponent';
let myAvatarId = getStoredAvatarId();
let opponentAvatarId = avatarIdFromUsername('Opponent');
let pendingAvatarId = myAvatarId;

const avatarBtn = document.getElementById('avatar-btn');
const avatarModal = document.getElementById('avatar-modal');
const closeAvatarModalBtn = document.getElementById('close-avatar-modal');
const saveAvatarBtn = document.getElementById('save-avatar-btn');
const avatarPreview = document.getElementById('avatar-preview');
const playerAvatarSlot = document.getElementById('player-avatar-slot');
const opponentAvatarSlot = document.getElementById('opponent-avatar-slot');

function applyPlayerAvatar(id = myAvatarId) {
    if (playerAvatarSlot) {
        playerAvatarSlot.innerHTML = renderAvatarMarkup(id, 'avatar-lg');
    }
}

function applyOpponentAvatar(id = opponentAvatarId) {
    if (opponentAvatarSlot) {
        opponentAvatarSlot.innerHTML = renderAvatarMarkup(id, 'avatar-lg');
    }
}

function updateAvatarPreview(id) {
    const avatar = getAvatarById(id);
    if (avatarPreview) {
        avatarPreview.innerHTML = `
            ${renderAvatarMarkup(id, 'avatar-xl')}
            <span class="avatar-preview-name">${avatar.name}</span>`;
    }
}

function handleAvatarGridSelect(id) {
    pendingAvatarId = id;
    updateAvatarPreview(id);
    renderAvatarGrid(pendingAvatarId, handleAvatarGridSelect);
}

function openAvatarModal() {
    pendingAvatarId = myAvatarId;
    renderAvatarGrid(pendingAvatarId, handleAvatarGridSelect);
    updateAvatarPreview(pendingAvatarId);
    avatarModal.classList.remove('hidden');
}

function saveAvatarSelection() {
    myAvatarId = pendingAvatarId;
    setStoredAvatarId(myAvatarId);
    applyPlayerAvatar();
    avatarModal.classList.add('hidden');
    localStorage.setItem('gesture_onboarded', '1');
    syncAvatarToProfile();
    if (gameMode === 'mp') {
        sendPlayerProfile();
    }
}

async function syncAvatarToProfile() {
    if (!db || !userSession) return;
    try {
        const { error } = await db.from('profiles').update({ 
            avatar_id: myAvatarId,
            avatar_url: myAvatarId 
        }).eq('id', userSession.user.id);
        
        if (error) {
            // Fallback for production databases where avatar_id column doesn't exist
            await db.from('profiles').update({ avatar_url: myAvatarId }).eq('id', userSession.user.id);
        }
    } catch (_) {
        // localStorage is source of truth
    }
}

function sendPlayerProfile() {
    sendSync({
        event: 'exchange_profile',
        nickname: myNickname,
        avatarId: myAvatarId
    });
}

function loadAvatarFromProfile(profile) {
    const dbAvatarId = profile?.avatar_id || profile?.avatar_url;
    if (dbAvatarId && getAvatarById(dbAvatarId)) {
        myAvatarId = dbAvatarId;
        setStoredAvatarId(myAvatarId);
    }
    applyPlayerAvatar();
}

function initProductionMode() {
    const isProduction =
        location.hostname.includes('vercel.app') ||
        location.hostname.includes('gesture-game');
    const adminBtn = document.getElementById('admin-panel-btn');
    if (isProduction && adminBtn) {
        adminBtn.classList.add('hidden');
    } else if (adminBtn && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
        adminBtn.classList.remove('hidden');
    }
}

if (avatarBtn) avatarBtn.addEventListener('click', openAvatarModal);
if (closeAvatarModalBtn) closeAvatarModalBtn.addEventListener('click', () => avatarModal.classList.add('hidden'));
if (saveAvatarBtn) saveAvatarBtn.addEventListener('click', saveAvatarSelection);

applyPlayerAvatar();
applyOpponentAvatar(avatarIdFromUsername('CPU'));
initProductionMode();

if (!hasChosenAvatar()) {
    setTimeout(openAvatarModal, 800);
}

let isGamePlaying = false;
let currentGesture = 'Unknown';
let playerScore = 0;
let mpTimeoutId = null;
let webrtcIntervalId = null;
let peerInstance = null;
let cpuScore = 0;
let roundNumber = 1;
let winStreak = 0;
let playerHistory = [];
let shieldActive = false;
let gameMode = 'ai'; // 'ai' or 'mp'
let mpChannel = null;
let roomId = null;
let isHost = false;
let myMoveLocked = null;
let opponentMoveLocked = null;
let mpConn = null;
let localAudioTrack = null;
let localVideoTrack = null;
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

    // Draw the webcam camera frame onto canvas first so recorded canvas clips have full video
    if (results.image) {
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    }

    const inBladeMode = typeof activeGameMode !== 'undefined' && activeGameMode === 'slasher';
    const inRunnerMode = typeof activeGameMode !== 'undefined' && activeGameMode === 'runner';
    const landmarksList = results.multiHandLandmarks;

    // ---- Gesture Runner fast path ----
    if (inRunnerMode) {
        const hand = landmarksList?.[0] || null;
        const gesture = hand ? recognizeGesture(hand) : 'Unknown';
        currentGesture = gesture;
        if (window.GestureRunner) {
            window.GestureRunner.onFrame(
                hand,
                gesture,
                canvasCtx,
                canvasElement.width,
                canvasElement.height,
                performance.now()
            );
        }
        canvasCtx.restore();
        return;
    }

    // ---- Blade Chaser fast path: skip RPS landmarks, drone, and gesture ML ----
    if (inBladeMode) {
        if (landmarksList && landmarksList.length > 0) {
            const hand = landmarksList[0];
            const indexTip = hand[8];
            const indexDip = hand[7];
            // Tiny tip guide only — full skeleton is invisible noise in blade mode
            const tipX = indexTip.x * canvasElement.width;
            const tipY = indexTip.y * canvasElement.height;
            canvasCtx.beginPath();
            canvasCtx.arc(tipX, tipY, 5, 0, Math.PI * 2);
            canvasCtx.fillStyle = 'rgba(236, 72, 153, 0.85)';
            canvasCtx.fill();
            tickBladeEngine(indexTip, indexDip);
        } else {
            tickBladeEngine(null, null);
        }
        canvasCtx.restore();
        return;
    }

    let detectedGestures = [];

    // Draw landmarks (RPS / calibration modes only)
    if (landmarksList && landmarksList.length > 0) {
        landmarksList.forEach((landmarks, index) => {
            const handedness = results.multiHandedness[index].label;
            const color = handedness === 'Left' ? '#818cf8' : '#22c55e';

            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: color, lineWidth: 4 });
            drawLandmarks(canvasCtx, landmarks, { color: '#ffffff', lineWidth: 1.5, radius: 3 });

            // Capture custom gesture landmarks if actively calibrating
            if (activeCalibrationGesture && index === 0) {
                const norm = getNormalizedLandmarks(landmarks);
                calibratedTemplates[activeCalibrationGesture] = norm;
                localStorage.setItem(`calibration_${activeCalibrationGesture}`, JSON.stringify(norm));
                
                const currentCalib = activeCalibrationGesture;
                activeCalibrationGesture = null; // Exit calibration mode
                
                // Voice confirmation
                speak(`Successfully calibrated custom ${currentCalib} shape`);
                
                // Update UI status indicators
                setTimeout(() => {
                    updateCalibrationUI();
                }, 100);
            }

            // Recognize gesture
            const gesture = recognizeGesture(landmarks);
            detectedGestures.push({ gesture, handedness });
        });

        // Update global state for the game (use the first hand or prioritized hand)
        currentGesture = detectedGestures[0].gesture;
        updateIndicators(detectedGestures);
        updateDronePosition(landmarksList[0]);
        if (window.TrainingLab?.isActive?.()) {
            window.TrainingLab.onFrame(currentGesture);
        }
    } else {
        currentGesture = 'Unknown';
        updateIndicators([]);
        updateDronePosition(null);
        if (window.TrainingLab?.isActive?.()) {
            window.TrainingLab.onFrame('Unknown');
        }
    }
    canvasCtx.restore();
}

function updateDronePosition(landmarks) {
    const drone = document.getElementById('spline-companion-container');
    if (!drone) return;
    
    if (landmarks) {
        // Landmark 9 is the middle finger MCP (geometric center of the palm)
        const point = landmarks[9];
        
        // Mirror X since the video feed is scaleX(-1) mirrored
        const x = (1 - point.x) * 100;
        const y = point.y * 100;
        
        drone.style.left = `${x}%`;
        drone.style.top = `${y}%`;
        drone.style.bottom = 'auto';
        drone.style.right = 'auto';
        drone.style.transform = 'translate(-50%, -50%)'; // center the drone on the palm
        drone.classList.add('tracking-active');
        
        // Update HUD status text
        const statusText = document.getElementById('drone-status-text');
        if (statusText) {
            statusText.innerText = 'LOCKED ON';
        }
    } else {
        drone.classList.remove('tracking-active');
        drone.style.left = '';
        drone.style.top = '';
        drone.style.bottom = '16px';
        drone.style.right = '16px';
        drone.style.transform = '';
        
        // Restore default HUD status text
        const statusText = document.getElementById('drone-status-text');
        if (statusText) {
            statusText.innerText = 'DRONE: ACTIVE';
        }
    }
}


// Normalize landmarks relative to wrist (0) and scaled by wrist-to-middle-mcp (0 to 9) distance
function getNormalizedLandmarks(landmarks) {
    const wrist = landmarks[0];
    const mcp = landmarks[9]; // middle finger MCP joint
    
    const scale = Math.sqrt(
        Math.pow(wrist.x - mcp.x, 2) +
        Math.pow(wrist.y - mcp.y, 2) +
        Math.pow(wrist.z - mcp.z, 2)
    ) || 1; // avoid divide by zero
    
    return landmarks.map(p => ({
        x: (p.x - wrist.x) / scale,
        y: (p.y - wrist.y) / scale,
        z: (p.z - wrist.z) / scale
    }));
}

// Compare two normalized landmark arrays
function compareLandmarks(norm1, norm2) {
    let totalDiff = 0;
    // Compare indices 1 to 20 (wrist is index 0 which is always 0,0,0)
    for (let i = 1; i < 21; i++) {
        totalDiff += Math.sqrt(
            Math.pow(norm1[i].x - norm2[i].x, 2) +
            Math.pow(norm1[i].y - norm2[i].y, 2) +
            Math.pow(norm1[i].z - norm2[i].z, 2)
        );
    }
    return totalDiff;
}

function recognizeGesture(landmarks) {
    // Try calibrated templates first
    const norm = getNormalizedLandmarks(landmarks);
    let bestGesture = null;
    let minDistance = 99999;
    const threshold = 3.2; // Cumulative Euclidean threshold for gesture matching

    for (const [gesture, template] of Object.entries(calibratedTemplates)) {
        if (template) {
            const distance = compareLandmarks(norm, template);
            if (distance < minDistance) {
                minDistance = distance;
                bestGesture = gesture;
            }
        }
    }

    if (bestGesture && minDistance < threshold) {
        return bestGesture;
    }

    // --- FALLBACK HEURISTICS ---
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

// Ultra-fast zero-latency Lite Model options for 60 FPS tracking
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0, // 0 = Lite (Zero-lag 60+ FPS model)
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
});

hands.onResults(onResults);

/** Tune MediaPipe for blade accuracy vs RPS latency */
function applyHandsOptionsForMode(mode) {
    if (mode === 'slasher') {
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0,
            minDetectionConfidence: 0.55,
            minTrackingConfidence: 0.65,
        });
    } else if (mode === 'runner') {
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.55,
        });
    } else {
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 0,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });
    }
}

const cameraStatusEl = document.getElementById('camera-status');
const cameraStatusText = document.getElementById('camera-status-text');
const cameraOverlay = document.getElementById('camera-overlay');
const enableCameraBtn = document.getElementById('enable-camera-btn');
const cameraErrorMsg = document.getElementById('camera-error-msg');
let cameraStream = null;
let cameraFrameId = null;
let cameraStarting = false;
const CAMERA_TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
let cameraBroadcast = null;

try {
    cameraBroadcast = new BroadcastChannel('gesture-arena-camera');
    cameraBroadcast.onmessage = (event) => {
        const msg = event.data;
        if (!msg || msg.tabId === CAMERA_TAB_ID) return;

        if (msg.type === 'requestRelease' && cameraStream && !isGamePlaying && gameMode !== 'mp') {
            releaseCameraResources();
            cameraOverlay?.classList.remove('hidden');
            setCameraStatus('loading', 'Camera shared with another tab');
            if (enableCameraBtn) {
                enableCameraBtn.querySelector('.btn-text').textContent = 'Enable Camera';
            }
            cameraBroadcast.postMessage({ type: 'released', tabId: CAMERA_TAB_ID });
        }
    };
} catch (_) {
    cameraBroadcast = null;
}

function stopAllPageVideoTracks() {
    document.querySelectorAll('video').forEach((el) => {
        const stream = el.srcObject;
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            el.srcObject = null;
        }
    });
}

function releaseCameraResources() {
    if (cameraFrameId) {
        cancelAnimationFrame(cameraFrameId);
        cameraFrameId = null;
    }
    handsInferBusy = false;

    stopAllPageVideoTracks();
    cameraStream = null;
    if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack = null;
    }

    cameraBroadcast?.postMessage({ type: 'released', tabId: CAMERA_TAB_ID });
}

function waitMs(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function askOtherTabsToReleaseCamera() {
    cameraBroadcast?.postMessage({ type: 'requestRelease', tabId: CAMERA_TAB_ID });
}

async function waitForVideoSignal(videoEl, timeoutMs = 6000) {
    if (videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && videoEl.videoWidth > 0) {
        return;
    }
    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Video signal timeout')), timeoutMs);
        const done = () => {
            clearTimeout(timer);
            resolve();
        };
        videoEl.onloadeddata = done;
        videoEl.onplaying = done;
    });
    if (videoEl.videoWidth === 0) {
        throw new Error('No video signal');
    }
}

async function buildCameraConstraintAttempts() {
    const base = [
        { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
        { video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } }, audio: false },
        { video: { facingMode: 'user' }, audio: false },
        { video: true, audio: false },
    ];

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((d) => d.kind === 'videoinput' && d.deviceId);
        for (const cam of cameras) {
            base.unshift({
                video: {
                    deviceId: { exact: cam.deviceId },
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
                audio: false,
            });
        }
    } catch (_) {
        // enumerateDevices may fail before first permission grant
    }

    return base;
}

async function acquireCameraStreamWithFallback() {
    const attempts = await buildCameraConstraintAttempts();
    let lastError = null;

    for (const constraints of attempts) {
        try {
            return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            lastError = err;
            if (err.name !== 'NotReadableError' && err.name !== 'AbortError') {
                throw err;
            }
        }
    }

    throw lastError || new Error('Camera unavailable');
}

function setCameraStatus(state, message) {
    if (!cameraStatusEl || !cameraStatusText) return;
    cameraStatusEl.className = 'camera-status';
    if (state === 'active') cameraStatusEl.classList.add('camera-status--active');
    else if (state === 'error') cameraStatusEl.classList.add('camera-status--error');
    else cameraStatusEl.classList.add('camera-status--loading');
    cameraStatusText.textContent = message;
}

async function startUserCamera() {
    if (cameraStarting) return;
    if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('error', 'Camera not supported');
        cameraOverlay?.classList.remove('hidden');
        if (cameraErrorMsg) {
            cameraErrorMsg.textContent = 'Your browser does not support camera access. Try Chrome or Edge.';
            cameraErrorMsg.classList.remove('hidden');
        }
        return;
    }

    cameraStarting = true;
    setCameraStatus('loading', 'Starting camera…');
    if (cameraErrorMsg) cameraErrorMsg.classList.add('hidden');
    if (enableCameraBtn) enableCameraBtn.disabled = true;

    releaseCameraResources();
    askOtherTabsToReleaseCamera();
    await waitMs(600);

    try {
        let lastError = null;
        const maxAttempts = 5;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                if (attempt > 0) {
                    releaseCameraResources();
                    askOtherTabsToReleaseCamera();
                    await waitMs(500 * attempt);
                }
                cameraStream = await acquireCameraStreamWithFallback();
                lastError = null;
                break;
            } catch (err) {
                lastError = err;
                if (err.name !== 'NotReadableError' && err.name !== 'AbortError') {
                    throw err;
                }
            }
        }

        if (!cameraStream) {
            throw lastError || new Error('Camera unavailable');
        }

        videoElement.srcObject = cameraStream;
        videoElement.muted = true;
        await videoElement.play();
        await waitForVideoSignal(videoElement);

        localVideoTrack = cameraStream.getVideoTracks()[0];
        const deviceLabel = localVideoTrack.label || 'Webcam';
        cameraOverlay?.classList.add('hidden');
        mediaControls?.classList.remove('hidden');
        setCameraStatus('active', `Camera: ${deviceLabel.slice(0, 28)}`);
        cameraBroadcast?.postMessage({ type: 'acquired', tabId: CAMERA_TAB_ID });
        runHandTrackingLoop();
    } catch (err) {
        console.error('Camera error:', err);
        releaseCameraResources();
        cameraOverlay?.classList.remove('hidden');
        if (enableCameraBtn) {
            enableCameraBtn.disabled = false;
            enableCameraBtn.querySelector('.btn-text').textContent = 'Try Again';
        }

        let userMsg = 'Could not access your camera.';
        if (err.name === 'NotAllowedError') {
            userMsg = 'Camera permission denied. Click the lock icon in the address bar, allow Camera, then try again.';
        } else if (err.name === 'NotFoundError') {
            userMsg = 'No camera found on this device.';
        } else if (err.name === 'NotReadableError' || err.name === 'AbortError') {
            userMsg =
                'Camera is in use elsewhere. Close link-digest Gesture Arena, other copies of this game, Zoom/Teams, then wait 2 seconds and click Try Again.';
        } else if (err.message === 'Video signal timeout' || err.message === 'No video signal') {
            userMsg =
                'Camera opened but no video signal. Unplug/replug your webcam or restart Chrome, then Try Again.';
        }

        setCameraStatus('error', 'Camera unavailable');
        if (cameraErrorMsg) {
            cameraErrorMsg.textContent = userMsg;
            cameraErrorMsg.classList.remove('hidden');
        }
    } finally {
        cameraStarting = false;
        if (enableCameraBtn && cameraStream) {
            enableCameraBtn.disabled = false;
            enableCameraBtn.querySelector('.btn-text').textContent = 'Enable Camera';
        }
    }
}

let handsInferBusy = false;

function runHandTrackingLoop() {
    if (cameraFrameId) cancelAnimationFrame(cameraFrameId);
    handsInferBusy = false;

    // Always paint the live video feed — even if MediaPipe is slow or fails to load
    const loop = () => {
        if (
            videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
            videoElement.videoWidth > 0
        ) {
            canvasCtx.drawImage(
                videoElement,
                0,
                0,
                canvasElement.width,
                canvasElement.height
            );
        }

        if (
            !handsInferBusy &&
            videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        ) {
            handsInferBusy = true;
            hands
                .send({ image: videoElement })
                .catch(() => {})
                .finally(() => {
                    handsInferBusy = false;
                });
        }
        cameraFrameId = requestAnimationFrame(loop);
    };

    loop();
}

if (enableCameraBtn) {
    enableCameraBtn.addEventListener('click', startUserCamera);
}

(async function initCameraAccess() {
    cameraOverlay?.classList.remove('hidden');
    setCameraStatus('loading', 'Camera ready');
    if (enableCameraBtn) {
        enableCameraBtn.querySelector('.btn-text').textContent = 'Enable Camera';
    }

    try {
        if (navigator.permissions) {
            const status = await navigator.permissions.query({ name: 'camera' });
            if (status.state === 'denied') {
                setCameraStatus('error', 'Camera blocked');
                if (cameraErrorMsg) {
                    cameraErrorMsg.textContent =
                        'Camera access is blocked. Enable it in Chrome site settings (lock icon → Camera → Allow), then refresh.';
                    cameraErrorMsg.classList.remove('hidden');
                }
                return;
            }
            // Require a click to start — avoids "camera busy" when another tab already holds the device
        }
    } catch (_) {
        // permissions.query unsupported
    }
})();

window.addEventListener('beforeunload', () => {
    releaseCameraResources();
});

window.getArenaGesture = () => currentGesture;
window.isArenaCameraActive = () => !!(cameraStream && localVideoTrack?.readyState === 'live');
window.setGameMode = setGameMode;

toggleCamBtn.addEventListener('click', () => {
    if (!localVideoTrack || !cameraStream) {
        startUserCamera();
        return;
    }
    localVideoTrack.enabled = !localVideoTrack.enabled;
    toggleCamBtn.innerText = localVideoTrack.enabled ? '📷' : '🚫';
    toggleCamBtn.classList.toggle('disabled', !localVideoTrack.enabled);
});

// Audio Synthesis
async function speak(text) {
    const elevenLabsKey = localStorage.getItem('elevenlabs_api_key') || config.apiKey;
    const elevenLabsVoiceId = localStorage.getItem('elevenlabs_voice_id') || config.voiceId;

    // If API Key exists, use ElevenLabs
    if (elevenLabsKey) {
        try {
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': elevenLabsKey
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

// Nickname Logic
nicknameBtn.addEventListener('click', () => {
    const newName = prompt("Enter your new nickname:", myNickname);
    if (newName && newName.trim().length > 0) {
        myNickname = newName.trim();
        localStorage.setItem('gesture_nickname', myNickname);
        document.querySelector('.player-card .card-label').innerText = myNickname.toUpperCase();
        if (gameMode === 'mp') {
            sendPlayerProfile();
        }
    }
});
document.querySelector('.player-card .card-label').innerText = myNickname.toUpperCase();

// Chat Logic
function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text || !mpConn) return;
    
    appendChatMessage('self', text);
    sendSync({ event: 'chat_msg', text: text });
    chatInput.value = '';
}
chatSend.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendChatMessage();
    }
});

function appendChatMessage(sender, text) {
    document.getElementById('mp-chat').classList.remove('hidden');
    const div = document.createElement('div');
    div.className = `chat-msg ${sender}`;
    div.innerText = (sender === 'self' ? 'You: ' : opponentNickname + ': ') + text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Draggable Chat Logic
const chatBox = document.getElementById('mp-chat');
const chatHeader = document.querySelector('.chat-header');
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

chatHeader.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = chatBox.getBoundingClientRect();
    const parentRect = chatBox.offsetParent.getBoundingClientRect();
    
    // Lock exact relative position before removing right/bottom constraints
    chatBox.style.left = (rect.left - parentRect.left) + 'px';
    chatBox.style.top = (rect.top - parentRect.top) + 'px';
    
    chatBox.style.bottom = 'auto';
    chatBox.style.right = 'auto';
    chatBox.style.margin = '0';
    
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const parentRect = chatBox.offsetParent.getBoundingClientRect();
    
    // Absolute position within viewport
    let newLeft = e.clientX - dragOffsetX;
    let newTop = e.clientY - dragOffsetY;
    
    // Boundary check against viewport
    newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - chatBox.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, window.innerHeight - chatBox.offsetHeight));

    // Convert back to offsetParent relative coordinates
    chatBox.style.left = (newLeft - parentRect.left) + 'px';
    chatBox.style.top = (newTop - parentRect.top) + 'px';
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

// Media Controls Logic
toggleMicBtn.addEventListener('click', () => {
    if (localAudioTrack) {
        localAudioTrack.enabled = !localAudioTrack.enabled;
        toggleMicBtn.innerText = localAudioTrack.enabled ? '🎤' : '🔇';
        toggleMicBtn.classList.toggle('disabled', !localAudioTrack.enabled);
    }
});

// Camera toggle wired above (near beforeunload) so it can restart a dead stream

// Admin Overlay Logic
const adminBtn = document.getElementById('admin-panel-btn');
const adminModal = document.getElementById('admin-modal');
const closeAdminBtn = document.getElementById('close-admin-modal');

adminBtn.addEventListener('click', () => {
    adminModal.classList.remove('hidden');
});
closeAdminBtn.addEventListener('click', () => {
    adminModal.classList.add('hidden');
});

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
    if (e.target === calibrateModal) hideModal(calibrateModal);
    const trainingModal = document.getElementById('training-lab-modal');
    if (trainingModal && e.target === trainingModal) trainingModal.classList.add('hidden');
};

// AI Calibration Dashboard Logic
function updateCalibrationUI() {
    for (const gesture of ['Rock', 'Paper', 'Scissors']) {
        const isCalibrated = calibratedTemplates[gesture] !== null;
        const statusEl = document.getElementById(`status-${gesture}`);
        const btnEl = document.querySelector(`.btn-calibrate[data-gesture="${gesture}"]`);
        
        if (statusEl && btnEl) {
            if (isCalibrated) {
                statusEl.innerText = 'Calibrated (Custom)';
                statusEl.className = 'slot-status active-calibrated';
                btnEl.innerText = 'Recalibrate';
                btnEl.classList.add('calibrated');
            } else {
                statusEl.innerText = 'Default Heuristic';
                statusEl.className = 'slot-status';
                btnEl.innerText = 'Calibrate';
                btnEl.classList.remove('calibrated');
            }
        }
    }
}

calibrateBtn.addEventListener('click', () => {
    showModal(calibrateModal);
    updateCalibrationUI();
});

const trainingLabBtn = document.getElementById('training-lab-btn');
if (trainingLabBtn) {
    trainingLabBtn.addEventListener('click', () => {
        if (typeof openTrainingLab === 'function') openTrainingLab();
    });
}

closeCalibrateBtn.addEventListener('click', () => hideModal(calibrateModal));
closeCalibrateBtn2.addEventListener('click', () => hideModal(calibrateModal));

resetCalibrationBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all custom gestures to default heuristics?')) {
        for (const gesture of ['Rock', 'Paper', 'Scissors']) {
            calibratedTemplates[gesture] = null;
            localStorage.removeItem(`calibration_${gesture}`);
        }
        updateCalibrationUI();
        speak("All gestures reset to default heuristics");
    }
});

calibrateSlotButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const gesture = btn.getAttribute('data-gesture');
        activeCalibrationGesture = gesture;
        btn.innerText = 'Capture (Show hand...)';
        btn.classList.remove('calibrated');
        speak(`Show your custom ${gesture} gesture to the camera`);
    });
});

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
            db = supabase.createClient(url, key);

            db.auth.onAuthStateChange((_event, session) => {
                handleAuthStateChange(session);
            });

            try {
                const { data: { session } } = await db.auth.getSession();
                handleAuthStateChange(session);
            } catch (sessionErr) {
                console.warn('📡 Supabase session check failed (auth may still work):', sessionErr);
            }

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

    // Multiplayer Auto-Join
    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get('room');
    if (room && db) {
        joinMultiplayerRoom(room, false);
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
        loadAvatarFromProfile(userProfile);
        if (userProfile?.username) {
            myNickname = userProfile.username;
            localStorage.setItem('gesture_nickname', myNickname);
            document.querySelector('.player-card .card-label').innerText = myNickname.toUpperCase();
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
        showAuthAlert(authError, 'Database is not connected. Check your internet connection and reload the page.');
        return;
    }
    clearAuthAlerts();
    const btnLabel = googleSigninBtn.querySelector('span');
    const originalLabel = btnLabel ? btnLabel.textContent : '';
    googleSigninBtn.disabled = true;
    if (btnLabel) btnLabel.textContent = 'Redirecting to Google…';
    try {
        const redirectTo = window.location.origin + window.location.pathname;
        const { error } = await db.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo,
                queryParams: { access_type: 'offline', prompt: 'consent' }
            }
        });
        if (error) throw error;
    } catch (err) {
        console.error('Google Auth Error:', err);
        const msg = (err.message || '').toLowerCase();
        let userMsg = err.message || 'Google sign-in failed. Try again.';
        if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
            userMsg = 'Cannot reach Supabase. Check your internet, then reload. If this persists, the Supabase project may be paused — open the Supabase dashboard and restore it.';
        } else if (msg.includes('provider') || msg.includes('enabled')) {
            userMsg = 'Google sign-in is not enabled in Supabase. In the dashboard: Authentication → Providers → Google → enable and add your Google OAuth credentials.';
        }
        showAuthAlert(authError, userMsg);
        googleSigninBtn.disabled = false;
        if (btnLabel) btnLabel.textContent = originalLabel;
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

                const rowAvatarId = avatarIdForProfile(profile);
                row.innerHTML = `
                    <td><span class="rank-badge rank-${rank <= 3 ? rank : 'generic'}">${rank}</span></td>
                    <td>
                        <div class="player-cell">
                            ${renderAvatarMarkup(rowAvatarId, 'avatar-sm')}
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
    if (gameMode === 'mp') {
        sendSync({ event: 'start_sync' });
        triggerCountdownAndPlay();
    } else {
        triggerCountdownAndPlay();
    }
}

async function triggerCountdownAndPlay() {
    if (mpTimeoutId) {
        clearTimeout(mpTimeoutId);
        mpTimeoutId = null;
    }

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
        // Re-trigger Animate.css jackInTheBox animation
        countdownNum.className = 'countdown-number'; // Reset
        countdownNum.offsetHeight; // Force reflow
        countdownNum.className = 'countdown-number animate__animated animate__jackInTheBox';
        await new Promise(r => setTimeout(r, 950));
    }
    countdownNum.innerText = 'GO!';
    countdownNum.style.fontSize = '5rem';
    // Re-trigger Animate.css bounceInDown animation for GO!
    countdownNum.className = 'countdown-number'; // Reset
    countdownNum.offsetHeight; // Force reflow
    countdownNum.className = 'countdown-number animate__animated animate__bounceInDown';
    await new Promise(r => setTimeout(r, 650));
    countdownEl.classList.add('hidden');
    countdownNum.style.fontSize = '';
    countdownNum.className = 'countdown-number'; // Reset to base class

    // Deactivate VS badge
    vsBadge.classList.remove('active');

    // Capture result with 150ms delay for maximum MediaPipe precision
    await new Promise(r => setTimeout(r, 150));
    const playerMove = currentGesture;

    if (gameMode === 'mp') {
        myMoveLocked = playerMove;
        playerMoveIcon.innerText = GESTURE_ICONS[playerMove];
        playerMoveIcon.classList.add('reveal');
        
        cpuMoveIcon.innerText = '🔒';
        cpuMoveIcon.classList.add('reveal');
        
        sendSync({ event: 'lock_move', move: playerMove });
        checkMpResult();
        
        // Timeout to prevent hanging if opponent disconnects
        mpTimeoutId = setTimeout(() => {
            if (isGamePlaying) {
                console.log("Match timed out waiting for opponent.");
                cpuMoveIcon.innerText = '❌';
                resultText.innerText = 'OPPONENT DISCONNECTED';
                resultBadge.classList.remove('hidden');
                
                myMoveLocked = null;
                opponentMoveLocked = null;
                isGamePlaying = false;
                startBtn.disabled = false;
                startBtn.querySelector('.btn-text').innerText = 'START MATCH';
            }
            mpTimeoutId = null;
        }, 8000);
    } else {
        const moves = ['Rock', 'Paper', 'Scissors'];
        let cpuMove = moves[Math.floor(Math.random() * 3)];

        // Adaptive AI logic
        if (playerHistory.length >= 3 && playerMove !== 'Unknown') {
            const lastThree = playerHistory.slice(-3);
            if (lastThree[0] === lastThree[1] && lastThree[1] === lastThree[2]) {
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
}

function checkMpResult() {
    if (myMoveLocked && opponentMoveLocked) {
        if (mpTimeoutId) {
            clearTimeout(mpTimeoutId);
            mpTimeoutId = null;
        }
        setTimeout(() => {
            cpuMoveIcon.innerText = GESTURE_ICONS[opponentMoveLocked];
            determineWinner(myMoveLocked, opponentMoveLocked);
            
            myMoveLocked = null;
            opponentMoveLocked = null;
            
            roundNumber++;
            roundNumEl.innerText = roundNumber;

            isGamePlaying = false;
            startBtn.disabled = false;
            startBtn.querySelector('.btn-text').innerText = 'PLAY AGAIN';
        }, 500);
    }
}

function applyTempAnimation(element, animationClass) {
    if (!element) return;
    const classes = animationClass.split(' ');
    element.classList.add(...classes);
    const handler = () => {
        element.classList.remove(...classes);
        element.removeEventListener('animationend', handler);
    };
    element.addEventListener('animationend', handler);
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
        const fireEmoji = streakContainer.querySelector('.streak-fire');
        if (fireEmoji) fireEmoji.className = 'streak-fire';
        shieldActive = false;
        speak("Gesture not detected.");
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
        const fireEmoji = streakContainer.querySelector('.streak-fire');
        if (fireEmoji) fireEmoji.className = 'streak-fire';
        
        applyTempAnimation(resultBadge, 'animate__animated animate__shakeX');
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

        applyTempAnimation(playerCard, 'animate__animated animate__heartBeat');
        applyTempAnimation(cpuCard, 'animate__animated animate__headShake');
        applyTempAnimation(resultBadge, 'animate__animated animate__bounceIn');

        if (window.confetti) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Haptic win

        // Update streak
        winStreak++;
        if (winStreak >= 2) {
            streakContainer.classList.remove('hidden');
            streakCount.innerText = winStreak;
            // Infinite bounce for fire emoji when active
            const fireEmoji = streakContainer.querySelector('.streak-fire');
            if (fireEmoji) {
                fireEmoji.className = 'streak-fire animate__animated animate__bounce animate__infinite';
            }
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
            applyTempAnimation(resultBadge, 'animate__animated animate__bounceIn');
            speak("Your shield absorbed the impact!");
            result = 'loss'; // Logged as loss, but streak remains
        } else {
            resultText.innerText = gameMode === 'mp' ? '🔴 OPPONENT WINS!' : '💻 CPU WINS!';
            resultText.style.color = 'var(--danger)';
            resultBadge.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), transparent)';
            resultBadge.style.border = '1px solid rgba(239, 68, 68, 0.2)';
            cpuScore++;
            cpuScoreEl.innerText = cpuScore;
            cpuCard.classList.add('win-flash');
            playerCard.classList.add('lose-flash');
            winStreak = 0;
            streakContainer.classList.add('hidden');
            const fireEmoji = streakContainer.querySelector('.streak-fire');
            if (fireEmoji) fireEmoji.className = 'streak-fire';
            
            applyTempAnimation(playerCard, 'animate__animated animate__headShake');
            applyTempAnimation(cpuCard, 'animate__animated animate__heartBeat');
            applyTempAnimation(resultBadge, 'animate__animated animate__bounceIn');
            
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

// Multiplayer Initialization
mpBtn.addEventListener('click', () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    history.pushState(null, '', `?room=${newRoomId}`);
    joinMultiplayerRoom(newRoomId, true);
});

closeMpModalBtn.addEventListener('click', () => mpModal.classList.add('hidden'));

mpCopyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(mpLinkInput.value);
    mpCopyBtn.innerText = "Copied!";
    setTimeout(() => mpCopyBtn.innerText = "Copy Link", 2000);
});

mpLeaveBtn.addEventListener('click', leaveMultiplayerRoom);

function joinMultiplayerRoom(room, host) {
    if (!db) {
        alert("Supabase Database connection is required for multiplayer.");
        return;
    }
    isHost = host;
    roomId = room;
    gameMode = 'mp';
    
    mpModal.classList.remove('hidden');
    mpLeaveBtn.classList.remove('hidden');
    mpLinkInput.value = window.location.origin + window.location.pathname + "?room=" + room;
    
    // Set UI
    document.querySelector('.cpu-card .card-label').innerText = 'OPPONENT';
    startBtn.querySelector('.btn-text').innerText = isHost ? 'START MATCH' : 'WAITING FOR HOST';
    startBtn.disabled = true; // Wait for opponent to connect
    
    // Connect Channel
    mpChannel = db.channel(`room-${room}`, {
        config: { broadcast: { self: false } }
    });
    
    // WebRTC Camera Sync
    if (window.Peer) {
        setupWebRTC(room, host);
    }
    
    mpChannel.on('broadcast', { event: 'player_joined' }, () => {
        if (isHost) {
            mpStatus.className = 'mp-status connected';
            mpStatus.innerHTML = '✅ <span>Opponent Joined!</span>';
            setTimeout(() => mpModal.classList.add('hidden'), 1500);
            startBtn.disabled = false;
            sendPlayerProfile();
        }
    });

    mpChannel.on('broadcast', { event: 'start_sync' }, () => {
        triggerCountdownAndPlay();
    });

    mpChannel.on('broadcast', { event: 'lock_move' }, (payload) => {
        if (payload.payload.player !== (isHost ? 'host' : 'guest')) {
            opponentMoveLocked = payload.payload.move;
            checkMpResult();
        }
    });

    mpChannel.on('broadcast', { event: 'exchange_profile' }, (payload) => {
        handlePeerData(payload.payload || payload);
    });

    mpChannel.on('broadcast', { event: 'exchange_nick' }, (payload) => {
        handlePeerData(payload.payload || payload);
    });
    
    mpChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            if (!isHost) {
                mpStatus.className = 'mp-status connected';
                mpStatus.innerHTML = '✅ <span>Connected to Room!</span>';
                setTimeout(() => mpModal.classList.add('hidden'), 1500);
                mpChannel.send({ type: 'broadcast', event: 'player_joined', payload: {} });
                sendPlayerProfile();
                
                // Enable start match button for guest as well
                startBtn.disabled = false;
                startBtn.querySelector('.btn-text').innerText = 'START MATCH';
            }
        }
    });
}

// WebRTC PeerJS setup for Video and Audio Sync
async function setupWebRTC(roomId, isHost) {
    // 1. Ask for Microphone access
    let audioTrack = null;
    try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioTrack = audioStream.getAudioTracks()[0];
    } catch (err) {
        console.warn("Microphone access denied or unavailable. Continuing with video only.");
    }

    if (webrtcIntervalId) clearInterval(webrtcIntervalId);
    webrtcIntervalId = setInterval(() => {
        if (videoElement.srcObject) {
            clearInterval(webrtcIntervalId);
            webrtcIntervalId = null;
            
            // 2. Combine MediaPipe's Video stream with our Audio track
            localVideoTrack = videoElement.srcObject.getVideoTracks()[0];
            const tracks = [localVideoTrack];
            if (audioTrack) {
                localAudioTrack = audioTrack;
                tracks.push(localAudioTrack);
            }
            const combinedStream = new MediaStream(tracks);
            
            // Show Media Controls
            mediaControls.classList.remove('hidden');
            
            const peerId = isHost ? `gesture-arena-${roomId}-host` : `gesture-arena-${roomId}-guest`;
            
            if (peerInstance) {
                try { peerInstance.destroy(); } catch (_) {}
            }
            const peer = new Peer(peerId);
            peerInstance = peer;

            peer.on('open', (id) => {
                if (!isHost) {
                    const hostId = `gesture-arena-${roomId}-host`;
                    const call = peer.call(hostId, combinedStream);
                    call.on('stream', showOpponentVideo);
                    
                    // Setup Data Connection
                    mpConn = peer.connect(hostId);
                    mpConn.on('open', () => {
                        sendPlayerProfile();
                        startBtn.disabled = false;
                        startBtn.querySelector('.btn-text').innerText = 'START MATCH';
                    });
                    mpConn.on('data', handlePeerData);
                }
            });

            peer.on('call', (call) => {
                call.answer(combinedStream);
                call.on('stream', showOpponentVideo);
            });
            
            peer.on('connection', (conn) => {
                mpConn = conn;
                mpConn.on('data', handlePeerData);
                setTimeout(() => sendPlayerProfile(), 500);
            });
        }
    }, 500);
}

function leaveMultiplayerRoom() {
    // 1. Unsubscribe from Supabase channel
    if (mpChannel) {
        mpChannel.unsubscribe();
        mpChannel = null;
    }
    
    // 2. Close WebRTC and Peer connection
    if (webrtcIntervalId) {
        clearInterval(webrtcIntervalId);
        webrtcIntervalId = null;
    }
    if (peerInstance) {
        try { peerInstance.destroy(); } catch(_) {}
        peerInstance = null;
    }
    if (mpConn) {
        try { mpConn.close(); } catch(_) {}
        mpConn = null;
    }
    if (localAudioTrack) {
        try { localAudioTrack.stop(); } catch(_) {}
        localAudioTrack = null;
    }
    
    // 3. Reset game state variables
    gameMode = 'ai';
    roomId = null;
    isHost = false;
    opponentNickname = 'CPU';
    opponentAvatarId = avatarIdFromUsername('CPU');
    myMoveLocked = null;
    opponentMoveLocked = null;
    isGamePlaying = false;
    
    if (mpTimeoutId) {
        clearTimeout(mpTimeoutId);
        mpTimeoutId = null;
    }
    
    // 4. Reset UI Elements
    document.querySelector('.cpu-card .card-label').innerText = 'CPU';
    applyOpponentAvatar(opponentAvatarId);
    
    // Hide opponent video
    const oppVideo = document.getElementById('opponent_video');
    if (oppVideo) {
        oppVideo.srcObject = null;
        oppVideo.classList.add('hidden');
    }
    
    // Reset indicators
    cpuMoveIcon.innerText = '❓';
    cpuMoveIcon.classList.remove('reveal');
    playerMoveIcon.innerText = '❓';
    playerMoveIcon.classList.remove('reveal');
    resultBadge.classList.add('hidden');
    
    // Hide media controls & chat
    mediaControls.classList.add('hidden');
    document.getElementById('mp-chat').classList.add('hidden');
    chatMessages.innerHTML = '';
    
    // Reset start button
    startBtn.querySelector('.btn-text').innerText = 'PLAY AI';
    startBtn.disabled = false;
    
    // Clear URL query parameters without page reload
    history.pushState(null, '', window.location.pathname);
    
    // Hide multiplayer modal & leave button
    mpModal.classList.add('hidden');
    mpLeaveBtn.classList.add('hidden');
}

function sendSync(data) {
    if (mpConn && mpConn.open) {
        mpConn.send(data);
    } else if (mpChannel) {
        mpChannel.send({ type: 'broadcast', event: data.event, payload: data });
    }
}

function handlePeerData(data) {
    if (data.event === 'start_sync') {
        triggerCountdownAndPlay();
    } else if (data.event === 'lock_move') {
        opponentMoveLocked = data.move;
        checkMpResult();
    } else if (data.event === 'exchange_profile' || data.event === 'exchange_nick') {
        opponentNickname = data.nickname || 'Opponent';
        opponentAvatarId = data.avatarId || avatarIdFromUsername(opponentNickname);
        document.querySelector('.cpu-card .card-label').innerText = opponentNickname.toUpperCase();
        applyOpponentAvatar(opponentAvatarId);
        document.getElementById('mp-chat').classList.remove('hidden');
    } else if (data.event === 'chat_msg') {
        appendChatMessage('opponent', data.text);
    }
}

function showOpponentVideo(stream) {
    const oppVideo = document.getElementById('opponent_video');
    if (oppVideo.srcObject !== stream) {
        oppVideo.srcObject = stream;
        oppVideo.classList.remove('hidden');
    }
}

// ===== Mobile Sensors (Accelerometer & Gyroscope) Integration =====
const sensorBtn = document.getElementById('sensor-btn');
let sensorsActive = false;

let lastX = null, lastY = null, lastZ = null;
let lastUpdateTime = 0;
const shakeThreshold = 750; // Speed threshold (made slightly more sensitive)
let lastShakeTime = 0;
let debugEl = null;

function createSensorDebugUI() {
    if (document.getElementById('sensor-debug')) return;
    
    debugEl = document.createElement('div');
    debugEl.id = 'sensor-debug';
    debugEl.className = 'sensor-debug';
    debugEl.innerHTML = `
        <div style="font-weight: bold; color: #22c55e; margin-bottom: 2px;">📳 Sensor Debug Info</div>
        <div>Speed: <span id="debug-speed">0</span> / <span id="debug-threshold">${shakeThreshold}</span></div>
        <div>Tilt X: <span id="debug-tilt-x">0</span>°</div>
        <div>Tilt Y: <span id="debug-tilt-y">0</span>°</div>
        <div id="debug-warning" style="color: #ef4444; margin-top: 4px; font-size: 0.65rem;" class="hidden">⚠️ No data received</div>
    `;
    
    const style = document.createElement('style');
    style.id = 'sensor-debug-style';
    style.textContent = `
        .sensor-debug {
            position: fixed;
            bottom: 85px;
            right: 20px;
            background: rgba(13, 15, 22, 0.85);
            border: 1px solid rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(12px);
            padding: 10px 14px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-family: monospace;
            color: #94a3b8;
            z-index: 10000;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            gap: 4px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            transition: opacity 0.3s ease;
        }
        .sensor-debug span {
            color: #818cf8;
            font-weight: bold;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(debugEl);
}

function removeSensorDebugUI() {
    const el = document.getElementById('sensor-debug');
    if (el) el.remove();
    const style = document.getElementById('sensor-debug-style');
    if (style) style.remove();
    debugEl = null;
}

function getAcceleration(event) {
    let acc = event.accelerationIncludingGravity;
    if (acc && acc.x !== null && acc.x !== undefined) {
        return acc;
    }
    acc = event.acceleration;
    if (acc && acc.x !== null && acc.x !== undefined) {
        return acc;
    }
    return null;
}

function handleDeviceMotion(event) {
    const acc = getAcceleration(event);
    const warningEl = document.getElementById('debug-warning');
    
    if (!acc) {
        if (warningEl) {
            warningEl.innerText = "⚠️ Accelerometer blocked/unavailable";
            warningEl.classList.remove('hidden');
        }
        return;
    }
    
    if (warningEl) {
        warningEl.classList.add('hidden');
    }
    
    const currentTime = Date.now();
    const diffTime = currentTime - lastUpdateTime;
    
    if (diffTime > 100) {
        const x = acc.x;
        const y = acc.y;
        const z = acc.z;
        
        if (lastX !== null) {
            // Absolute delta difference sum across all three axes (safeguards against single-axis shakes)
            const change = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);
            
            // Calculate movement speed normalized by delta time (frequency-independent)
            const speed = (change / diffTime) * 10000;
            
            // Update live debug speed UI
            const speedEl = document.getElementById('debug-speed');
            if (speedEl) {
                speedEl.innerText = Math.round(speed);
                if (speed > shakeThreshold) {
                    speedEl.style.color = '#22c55e';
                    setTimeout(() => { if (speedEl) speedEl.style.color = ''; }, 500);
                }
            }
            
            if (speed > shakeThreshold) {
                const timeSinceLastShake = currentTime - lastShakeTime;
                if (timeSinceLastShake > 2000) { // Throttle shake triggers to every 2 seconds
                    lastShakeTime = currentTime;
                    triggerShakeAction();
                }
            }
        }
        
        lastX = x;
        lastY = y;
        lastZ = z;
        lastUpdateTime = currentTime;
    }
}

function triggerShakeAction() {
    if (isGamePlaying) return;
    
    // Haptic feedback confirmation
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
    
    speak("Match started by shake!");
    playGame();
}

function handleDeviceOrientation(event) {
    const beta = event.beta;   // front-to-back tilt [-180, 180]
    const gamma = event.gamma; // left-to-right tilt [-90, 90]
    
    // Update live debug tilt UI
    const tiltXEl = document.getElementById('debug-tilt-x');
    const tiltYEl = document.getElementById('debug-tilt-y');
    if (tiltXEl) tiltXEl.innerText = beta !== null ? Math.round(beta) : 'N/A';
    if (tiltYEl) tiltYEl.innerText = gamma !== null ? Math.round(gamma) : 'N/A';
    
    if (beta !== null && gamma !== null) {
        // Clamp values to limit max tilt deflection (e.g. max 25 degrees)
        const limit = 25;
        const clampedBeta = Math.max(-limit, Math.min(limit, beta));
        const clampedGamma = Math.max(-limit, Math.min(limit, gamma));
        
        // Smooth rotation mapping
        const rotateX = (clampedBeta / limit) * 12; // rotate up to 12 degrees
        const rotateY = -(clampedGamma / limit) * 12;
        
        const board = document.querySelector('.game-board');
        if (board) {
            board.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }
    }
}

function startSensorListeners() {
    window.addEventListener('devicemotion', handleDeviceMotion);
    window.addEventListener('deviceorientation', handleDeviceOrientation);
    sensorsActive = true;
    localStorage.setItem('mobile_sensors', 'true');
    if (sensorBtn) {
        sensorBtn.classList.add('sensor-active');
        sensorBtn.title = "Disable Mobile Motion Controls";
    }
    createSensorDebugUI();
}

function stopSensorListeners() {
    window.removeEventListener('devicemotion', handleDeviceMotion);
    window.removeEventListener('deviceorientation', handleDeviceOrientation);
    sensorsActive = false;
    localStorage.setItem('mobile_sensors', 'false');
    
    if (sensorBtn) {
        sensorBtn.classList.remove('sensor-active');
        sensorBtn.title = "Enable Mobile Motion Controls";
    }
    
    // Reset CSS transform on layout
    const board = document.querySelector('.game-board');
    if (board) {
        board.style.transform = '';
    }
    removeSensorDebugUI();
}

function toggleSensors() {
    if (sensorsActive) {
        stopSensorListeners();
        speak("Motion controls disabled");
        return;
    }

    const hasMotionEvent = typeof DeviceMotionEvent !== 'undefined' && 
                           typeof DeviceMotionEvent.requestPermission === 'function';
    const hasOrientationEvent = typeof DeviceOrientationEvent !== 'undefined' && 
                                 typeof DeviceOrientationEvent.requestPermission === 'function';

    if (hasMotionEvent || hasOrientationEvent) {
        // Request iOS motion permissions synchronously inside the user click microtask
        Promise.all([
            hasMotionEvent ? DeviceMotionEvent.requestPermission() : Promise.resolve('granted'),
            hasOrientationEvent ? DeviceOrientationEvent.requestPermission() : Promise.resolve('granted')
        ]).then(([motionRes, orientRes]) => {
            if (motionRes === 'granted' && orientRes === 'granted') {
                startSensorListeners();
                speak("Motion controls active. Shake device to play!");
                if (navigator.vibrate) navigator.vibrate(150);
            } else {
                alert("⚠️ Sensor Access Denied. To use motion controls, please grant permission when prompted.");
            }
        }).catch(err => {
            console.error("iOS Permission request error:", err);
            alert("⚠️ Sensor Access Error: Please ensure you are viewing this page on an HTTPS connection and allow sensor access when prompted.");
        });
    } else {
        // Android / Desktop or older browsers — start immediately
        startSensorListeners();
        speak("Motion controls active. Shake device to play!");
        if (navigator.vibrate) navigator.vibrate(150);
    }
}

if (sensorBtn) {
    sensorBtn.addEventListener('click', toggleSensors);
}

// Auto-init on load if previously enabled (and browser permissions allow)
(function initMotionSensors() {
    const previouslyActive = localStorage.getItem('mobile_sensors') === 'true';
    if (previouslyActive) {
        const hasPermissionApi = typeof DeviceMotionEvent !== 'undefined' && 
                                 typeof DeviceMotionEvent.requestPermission === 'function';
        if (!hasPermissionApi) {
            startSensorListeners();
        }
    }
})();

/* =========================================
   Side Navigation Menu Controller
   ========================================= */
(function initSideMenuDrawer() {
    const toggleBtn = document.getElementById('side-menu-toggle');
    const closeBtn = document.getElementById('close-side-menu');
    const drawer = document.getElementById('side-menu');
    const overlay = document.getElementById('side-menu-overlay');

    if (!toggleBtn || !drawer || !overlay) return;

    function openSideMenu() {
        overlay.classList.remove('hidden');
        drawer.classList.remove('hidden');
        // Force reflow for smooth transform transition
        void drawer.offsetWidth;
        overlay.classList.add('active');
        drawer.classList.add('open');
    }

    function closeSideMenu() {
        overlay.classList.remove('active');
        drawer.classList.remove('open');
        setTimeout(() => {
            overlay.classList.add('hidden');
            drawer.classList.add('hidden');
        }, 350);
    }

    toggleBtn.addEventListener('click', openSideMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeSideMenu);
    overlay.addEventListener('click', closeSideMenu);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer.classList.contains('open')) {
            closeSideMenu();
        }
    });

    // Delegate menu item navigation clicks
    const navItems = {
        'side-nav-ai': () => {
            const startBtn = document.getElementById('start-btn');
            if (startBtn) startBtn.click();
        },
        'side-nav-1v1': () => {
            const mpBtn = document.getElementById('multiplayer-btn');
            if (mpBtn) mpBtn.click();
        },
        'side-nav-avatar': () => {
            const avatarBtn = document.getElementById('avatar-btn');
            if (avatarBtn) avatarBtn.click();
        },
        'side-nav-trophy': () => {
            const trophyBtn = document.getElementById('trophy-btn');
            if (trophyBtn) trophyBtn.click();
        },
        'side-nav-leaderboard': () => {
            const leaderboardBtn = document.getElementById('leaderboard-btn');
            if (leaderboardBtn) leaderboardBtn.click();
        },
        'side-nav-calibrate': () => {
            const calibrateBtn = document.getElementById('calibrate-btn');
            if (calibrateBtn) calibrateBtn.click();
        },
        'side-nav-sensors': () => {
            const sensorBtn = document.getElementById('sensor-btn');
            if (sensorBtn) sensorBtn.click();
        },
        'side-nav-auth': () => {
            const authBtn = document.getElementById('auth-btn');
            if (authBtn) authBtn.click();
        }
    };

    Object.keys(navItems).forEach(id => {
        const item = document.getElementById(id);
        if (item) {
            item.addEventListener('click', () => {
                closeSideMenu();
                navItems[id]();
            });
        }
    });

    // Social Space Side Menu Slot Listener
    const socialSlot = document.getElementById('side-menu-social-slot');
    if (socialSlot) {
        socialSlot.addEventListener('click', () => {
            closeSideMenu();
            openSocialSpaceModal();
        });
    }
})();

/* =========================================
   Video Recording & Arena Social Space Controller
   ========================================= */
let mediaRecorder = null;
let recordedChunks = [];
let recTimerInterval = null;
let recSeconds = 0;
let lastRecordedBlob = null;
let selectedTag = '🔥 Clutch';

// Pre-populated default community clips for a lively social experience
const DEFAULT_COMMUNITY_POSTS = [
    {
        id: 'post_tut_1',
        author: 'Arena Coach',
        avatar: '🎓',
        title: 'How to Play: Hand Poses & Gesture Basics ✊✋✌️',
        tag: '🎓 Tutorial',
        likes: 380,
        liked: true,
        time: 'Official Guide',
        stats: 'Beginner Guide • Step-by-Step',
        isTutorial: true,
        comments: [
            { author: 'NewbieFighter', text: 'Super clear guide! Thanks!' }
        ],
        videoUrl: null
    },
    {
        id: 'post_tut_2',
        author: 'Arena Coach',
        avatar: '⚔️',
        title: 'Gesture Blade Slasher: Laser Finger Slicing Guide 🍉💣',
        tag: '🎓 Tutorial',
        likes: 412,
        liked: true,
        time: 'Official Guide',
        stats: 'Arcade Mode • Fruit Slasher',
        isTutorial: true,
        comments: [
            { author: 'BladeMaster', text: 'The laser trail particle effect is awesome!' }
        ],
        videoUrl: null
    },
    {
        id: 'post_tut_3',
        author: 'Arena Coach',
        avatar: '🤖',
        title: '3D Companion Drone & Palm Landmark Tracking 🛰️',
        tag: '🎓 Tutorial',
        likes: 245,
        liked: false,
        time: 'Official Guide',
        stats: 'MediaPipe AI • 3D Drone',
        isTutorial: true,
        comments: [
            { author: 'TechGamer', text: 'Love how the drone follows my hand!' }
        ],
        videoUrl: null
    },
    {
        id: 'post_1',
        author: 'GestureMaster',
        avatar: '🤖',
        title: '10 Win Streak Clutch! ✊ beat ✂️ at 0.1s!',
        tag: '🔥 Clutch',
        likes: 142,
        liked: false,
        time: '12m ago',
        stats: 'Score: 2450 • Streak: 10',
        comments: [
            { author: 'CyberNinja', text: 'Unbelievable reaction speed 🔥' },
            { author: 'PixelKing', text: 'That drone dodge was insane' }
        ],
        videoUrl: null
    },
    {
        id: 'post_2',
        author: 'CyberNinja',
        avatar: '🥷',
        title: 'Ranked Diamond Promotion Battle Highlight 🌐',
        tag: '🏆 Win Streak',
        likes: 98,
        liked: false,
        time: '45m ago',
        stats: 'Score: 1890 • League: Diamond',
        comments: [
            { author: 'GestureMaster', text: 'GG WP! 👏' }
        ],
        videoUrl: null
    }
];

function getStoredSocialPosts() {
    try {
        const stored = localStorage.getItem('arena_social_posts');
        if (stored) {
            const parsed = JSON.parse(stored);
            // Ensure default official tutorial posts are always merged into storage
            const existingIds = new Set(parsed.map(p => p.id));
            let updated = false;
            DEFAULT_COMMUNITY_POSTS.forEach(defPost => {
                if (!existingIds.has(defPost.id)) {
                    parsed.unshift(defPost);
                    updated = true;
                }
            });
            if (updated) {
                try { localStorage.setItem('arena_social_posts', JSON.stringify(parsed)); } catch (e) {}
            }
            return parsed;
        }
    } catch (e) {
        console.error("Error reading social posts:", e);
    }
    // Default fallback initial seed
    localStorage.setItem('arena_social_posts', JSON.stringify(DEFAULT_COMMUNITY_POSTS));
    return DEFAULT_COMMUNITY_POSTS;
}

function saveSocialPosts(posts) {
    try {
        localStorage.setItem('arena_social_posts', JSON.stringify(posts));
    } catch (e) {
        console.error("Error saving social posts:", e);
    }
}

/* --- Recording Logic --- */
function startGameplayRecording() {
    const canvas = document.getElementById('output_canvas');
    if (!canvas) return;

    recordedChunks = [];
    let stream;
    try {
        stream = canvas.captureStream(30);
    } catch (e) {
        console.error("Canvas captureStream error:", e);
        alert("⚠️ Video recording is not supported in your browser.");
        return;
    }

    const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
    ];

    let chosenMime = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';

    try {
        mediaRecorder = chosenMime ? new MediaRecorder(stream, { mimeType: chosenMime }) : new MediaRecorder(stream);
    } catch (e) {
        console.error("MediaRecorder creation error:", e);
        mediaRecorder = new MediaRecorder(stream);
    }

    mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    };

    mediaRecorder.onstop = () => {
        clearInterval(recTimerInterval);
        const recIndicator = document.getElementById('rec-indicator');
        if (recIndicator) recIndicator.classList.add('hidden');

        const mime = chosenMime || 'video/webm';
        lastRecordedBlob = new Blob(recordedChunks, { type: mime });

        if (lastRecordedBlob.size > 0) {
            openPostClipModal(lastRecordedBlob);
        } else {
            console.warn("Recorded blob was empty, retrying fallback recording...");
            alert("⚠️ Recording completed! Preparing clip preview...");
            openPostClipModal(lastRecordedBlob);
        }
    };

    // Request data chunk every 200ms
    mediaRecorder.start(200);

    // Show HUD Recording indicator & start timer
    recSeconds = 0;
    const recIndicator = document.getElementById('rec-indicator');
    const recTimer = document.getElementById('rec-timer');
    if (recIndicator) recIndicator.classList.remove('hidden');
    if (recTimer) recTimer.innerText = '00:00';

    recTimerInterval = setInterval(() => {
        recSeconds++;
        const mins = String(Math.floor(recSeconds / 60)).padStart(2, '0');
        const secs = String(recSeconds % 60).padStart(2, '0');
        if (recTimer) recTimer.innerText = `${mins}:${secs}`;
    }, 1000);

    speak("Recording started!");
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
}

function stopGameplayRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        speak("Recording saved!");
    }
}

function toggleGameplayRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        stopGameplayRecording();
    } else {
        startGameplayRecording();
    }
}

/* --- Clip Preview & Post Modal --- */
function openPostClipModal(blob) {
    const modal = document.getElementById('post-clip-modal');
    const videoElem = document.getElementById('clip-preview-video');
    const titleInput = document.getElementById('clip-title-input');
    if (!modal || !videoElem) return;

    if (blob && blob.size > 0) {
        const videoUrl = URL.createObjectURL(blob);
        videoElem.src = videoUrl;
        videoElem.load();
        videoElem.play().catch(e => console.log("Video auto-play handled:", e));
    }

    // Suggest default title based on current game score/streak
    const currentStreak = parseInt(document.getElementById('streak-count')?.innerText || '0', 10);
    const activeScore = typeof slasherScore !== 'undefined' && slasherScore > 0 ? slasherScore : playerScore;
    
    if (activeGameMode === 'slasher') {
        titleInput.value = `⚔️ ${activeScore} Pts Gesture Blade Highlight! 🍉`;
    } else if (currentStreak > 1) {
        titleInput.value = `${currentStreak} Win Streak Clutch Highlight! 🔥`;
    } else {
        titleInput.value = `Clutch Gesture Arena Battle Clip! 🎮`;
    }

    modal.classList.remove('hidden');
}

function closePostClipModal() {
    const modal = document.getElementById('post-clip-modal');
    const videoElem = document.getElementById('clip-preview-video');
    if (modal) modal.classList.add('hidden');
    if (videoElem) videoElem.src = '';
}

/* --- Arena Social Space Modal --- */
function openSocialSpaceModal(activeTab = 'trending') {
    const modal = document.getElementById('social-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    renderSocialFeed(activeTab);
}

function closeSocialSpaceModal() {
    const modal = document.getElementById('social-modal');
    if (modal) modal.classList.add('hidden');
}

function renderSocialFeed(activeTab = 'trending') {
    const container = document.getElementById('social-feed-container');
    if (!container) return;

    let posts = window.activePostsList || getStoredSocialPosts();

    // Filter by Tab
    if (activeTab === 'tutorials') {
        posts = posts.filter(p => p.tag === '🎓 Tutorial' || p.isTutorial === true);
    } else if (activeTab === 'clutch') {
        posts = posts.filter(p => p.tag === '🔥 Clutch' || p.likes > 80);
    } else if (activeTab === 'recent') {
        posts = [...posts].reverse();
    } else if (activeTab === 'my-clips') {
        const currentAuthor = (typeof myNickname !== 'undefined' && myNickname) ? myNickname : 'YOU';
        posts = posts.filter(p => p.isMyClip === true || p.author === currentAuthor || p.author === 'YOU' || p.author === 'Player');
    }

    if (posts.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-secondary);">
                <span style="font-size: 3rem; display:block; margin-bottom:1rem;">📹</span>
                <h3>No clips in this category yet!</h3>
                <p style="font-size: 0.85rem; margin-top: 0.5rem;">Be the first to record a clip and share it to the Arena Social Space!</p>
            </div>`;
        return;
    }

    container.innerHTML = posts.map(post => {
        let activeVideoUrl = post.videoUrl;
        if (!activeVideoUrl && window.arenaClipBlobs && window.arenaClipBlobs.has(post.id)) {
            const blob = window.arenaClipBlobs.get(post.id);
            activeVideoUrl = URL.createObjectURL(blob);
        }

        return `
        <div class="social-card" data-id="${post.id}">
            <div class="social-card-header">
                <div class="social-author-avatar">${post.avatar || '🎮'}</div>
                <div class="social-author-info">
                    <span class="social-author-name">${escapeHtml(post.author)}</span>
                    <span class="social-post-time">${post.time}</span>
                </div>
                <span class="social-tag-badge">${post.tag || '🔥 Highlight'}</span>
            </div>

            <div class="social-card-media" data-id="${post.id}">
                ${activeVideoUrl ? 
                    `<video src="${activeVideoUrl}" controls playsinline loop></video>` :
                    `<div class="social-video-placeholder">
                        <canvas class="animated-clip-canvas" data-id="${post.id}" width="320" height="180"></canvas>
                        <div class="play-overlay-btn" title="Play Clip">▶</div>
                    </div>`
                }
            </div>

            <div class="social-card-body">
                <p class="social-card-caption">${escapeHtml(post.title)}</p>
                <div class="social-match-stats">
                    <span>⚡ ${post.stats || 'Gesture Arena Battle'}</span>
                </div>
            </div>

            <div class="social-card-footer">
                <button class="social-action-btn like-btn ${post.liked ? 'liked' : ''}" data-id="${post.id}">
                    <span class="heart-icon">${post.liked ? '❤️' : '🤍'}</span>
                    <span class="like-count">${post.likes}</span>
                </button>
                <button class="social-action-btn comment-toggle-btn" data-id="${post.id}">
                    💬 ${post.comments ? post.comments.length : 0} Comments
                </button>
                <button class="social-action-btn share-btn" data-id="${post.id}">
                    🚀 Share
                </button>
            </div>

            <div class="social-comments-drawer hidden" id="comments-${post.id}">
                <div class="comments-list">
                    ${(post.comments || []).map(c => `
                        <div class="comment-item">
                            <span class="comment-author">${escapeHtml(c.author)}:</span> ${escapeHtml(c.text)}
                        </div>
                    `).join('')}
                </div>
                <div class="comment-input-row">
                    <input type="text" placeholder="Add a comment..." class="comment-input" data-id="${post.id}">
                    <button class="submit-comment-btn" data-id="${post.id}">Post</button>
                </div>
            </div>
        </div>`;
    }).join('');

    // Attach card event listeners
    attachSocialFeedEvents();
    // Render animated canvas placeholders for demo community posts
    initCanvasPlaceholders();
}

/* Open Fullscreen Reel Lightbox Viewer */
function openReelViewerModal(post) {
    const modal = document.getElementById('reel-viewer-modal');
    const videoElem = document.getElementById('reel-viewer-video');
    const canvasElem = document.getElementById('reel-viewer-canvas');
    const nameElem = document.getElementById('reel-author-name');
    const avatarElem = document.getElementById('reel-author-avatar');
    const badgeElem = document.getElementById('reel-tag-badge');
    const captionElem = document.getElementById('reel-caption-text');

    if (!modal) return;

    if (nameElem) nameElem.innerText = post.author || 'Gesture Fighter';
    if (avatarElem) avatarElem.innerText = post.avatar || '🎮';
    if (badgeElem) badgeElem.innerText = post.tag || '🔥 Highlight';
    if (captionElem) captionElem.innerText = post.title || 'Gesture Arena Gameplay Clip';

    let activeVideoUrl = post.videoUrl;
    if (!activeVideoUrl && window.arenaClipBlobs && window.arenaClipBlobs.has(post.id)) {
        const blob = window.arenaClipBlobs.get(post.id);
        activeVideoUrl = URL.createObjectURL(blob);
    }

    if (activeVideoUrl) {
        if (canvasElem) canvasElem.classList.add('hidden');
        if (videoElem) {
            videoElem.classList.remove('hidden');
            videoElem.src = activeVideoUrl;
            videoElem.play().catch(() => {});
        }
    } else {
        // Fallback tutorial/demo animated canvas stream
        if (videoElem) {
            videoElem.classList.add('hidden');
            videoElem.src = '';
        }
        if (canvasElem) {
            canvasElem.classList.remove('hidden');
            renderReelCanvasAnimation(canvasElem, post);
        }
    }

    modal.classList.remove('hidden');

    // Voice Narration for Tutorials
    if (post.isTutorial && typeof speak === 'function') {
        speak(`Tutorial: ${post.title}`);
    }
}

function closeReelViewerModal() {
    const modal = document.getElementById('reel-viewer-modal');
    const videoElem = document.getElementById('reel-viewer-video');
    if (modal) modal.classList.add('hidden');
    if (videoElem) {
        videoElem.pause();
        videoElem.src = '';
    }
}

function renderReelCanvasAnimation(canvas, post) {
    const ctx = canvas.getContext('2d');
    let frame = 0;
    function anim() {
        frame++;
        ctx.fillStyle = '#06070a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Cyber Grid Lines
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }

        // Draw Animated Tutorial Poses
        ctx.font = '54px sans-serif';
        ctx.textAlign = 'center';
        const bounce = Math.sin(frame * 0.1) * 12;

        if (post.id === 'post_tut_1') {
            // Tutorial 1: Rock Paper Scissors Poses
            ctx.fillText('✊', canvas.width/2 - 120, canvas.height/2 + bounce);
            ctx.fillText('✋', canvas.width/2, canvas.height/2 - bounce);
            ctx.fillText('✌️', canvas.width/2 + 120, canvas.height/2 + bounce);
            ctx.font = '15px Outfit, sans-serif';
            ctx.fillStyle = '#818cf8';
            ctx.fillText('✊ Rock (Fist)  •  ✋ Paper (Open Palm)  •  ✌️ Scissors (V-Sign)', canvas.width/2, canvas.height/2 + 75);
        } else if (post.id === 'post_tut_2') {
            // Tutorial 2: Gesture Blade Slasher
            const fingerX = canvas.width/2 + Math.cos(frame * 0.08) * 110;
            const fingerY = canvas.height/2 + Math.sin(frame * 0.08) * 50;

            // Draw glowing laser saber trail
            ctx.beginPath();
            ctx.arc(fingerX, fingerY, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#f43f5e';
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 20;
            ctx.fill();

            // Draw sliced fruit emoji
            ctx.fillText('🍉', canvas.width/2, canvas.height/2);
            ctx.font = '15px Outfit, sans-serif';
            ctx.fillStyle = '#f43f5e';
            ctx.fillText('Swipe Index Finger to Slice Floating Fruits & Gems! ⚡', canvas.width/2, canvas.height/2 + 75);
        } else if (post.id === 'post_tut_3') {
            // Tutorial 3: 3D Drone Tracking
            ctx.fillText('🛰️', canvas.width/2 + Math.cos(frame * 0.05) * 80, canvas.height/2 + Math.sin(frame * 0.05) * 40);
            ctx.font = '15px Outfit, sans-serif';
            ctx.fillStyle = '#22c55e';
            ctx.fillText('Hold up your hand to lock the 3D Drone to your palm!', canvas.width/2, canvas.height/2 + 75);
        } else {
            ctx.fillText('🎮', canvas.width/2, canvas.height/2 + bounce);
            ctx.font = '15px Outfit, sans-serif';
            ctx.fillStyle = '#a78bfa';
            ctx.fillText(post.title || 'Gesture Arena Clip', canvas.width/2, canvas.height/2 + 75);
        }

        if (!document.getElementById('reel-viewer-modal').classList.contains('hidden') && canvas.classList.contains('hidden') === false) {
            requestAnimationFrame(anim);
        }
    }
    anim();
}

function attachSocialFeedEvents() {
    // Card Click Handler to open Lightbox Viewer
    document.querySelectorAll('.social-card-media, .play-overlay-btn').forEach(media => {
        media.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = media.getAttribute('data-id') || media.closest('.social-card')?.getAttribute('data-id');
            const posts = window.activePostsList || getStoredSocialPosts();
            const post = posts.find(p => p.id === id);
            if (post) {
                openReelViewerModal(post);
            }
        });
    });

    // Close Reel Viewer Button
    const closeReelBtn = document.getElementById('close-reel-viewer');
    if (closeReelBtn) {
        closeReelBtn.addEventListener('click', closeReelViewerModal);
    }
    // Like button handler
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            let posts = getStoredSocialPosts();
            const post = posts.find(p => p.id === id);
            if (post) {
                post.liked = !post.liked;
                post.likes += post.liked ? 1 : -1;
                saveSocialPosts(posts);
                renderSocialFeed(document.querySelector('.social-tab.active')?.getAttribute('data-tab') || 'trending');
            }
        });
    });

    // Comment toggle handler
    document.querySelectorAll('.comment-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const drawer = document.getElementById(`comments-${id}`);
            if (drawer) drawer.classList.toggle('hidden');
        });
    });

    // Submit comment handler
    document.querySelectorAll('.submit-comment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const input = document.querySelector(`.comment-input[data-id="${id}"]`);
            if (!input || !input.value.trim()) return;

            let posts = getStoredSocialPosts();
            const post = posts.find(p => p.id === id);
            if (post) {
                if (!post.comments) post.comments = [];
                post.comments.push({
                    author: userNickname || 'YOU',
                    text: input.value.trim()
                });
                saveSocialPosts(posts);
                renderSocialFeed(document.querySelector('.social-tab.active')?.getAttribute('data-tab') || 'trending');
            }
        });
    });

    // Share button handler
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (navigator.share) {
                navigator.share({
                    title: 'Gesture Arena Social Clip',
                    text: 'Check out this epic gameplay clip on Gesture Arena!',
                    url: window.location.href
                }).catch(() => {});
            } else {
                navigator.clipboard.writeText(window.location.href);
                speak("Link copied to clipboard!");
            }
        });
    });
}

/* Canvas Animation Placeholder Generator for initial community posts */
function initCanvasPlaceholders() {
    document.querySelectorAll('.animated-clip-canvas').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        let frame = 0;
        function drawClip() {
            frame++;
            ctx.fillStyle = '#090b10';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw glowing arena grid line
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
            ctx.lineWidth = 1;
            for(let x=0; x<canvas.width; x+=30) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
            }

            // Draw animated hand emoji battle animation
            ctx.font = '36px sans-serif';
            ctx.textAlign = 'center';
            const offset = Math.sin(frame * 0.08) * 15;

            ctx.fillText('✊', canvas.width/2 - 40 + offset, canvas.height/2 + 10);
            ctx.font = '20px Outfit, sans-serif';
            ctx.fillStyle = '#ef4444';
            ctx.fillText('VS', canvas.width/2, canvas.height/2 + 5);
            ctx.font = '36px sans-serif';
            ctx.fillText('✌️', canvas.width/2 + 40 - offset, canvas.height/2 + 10);

            // Watermark text
            ctx.font = '10px monospace';
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillText('CLUTCH REEL • GESTURE ARENA', canvas.width/2, canvas.height - 10);

            if (document.body.contains(canvas)) {
                requestAnimationFrame(drawClip);
            }
        }
        drawClip();
    });
}

// Helper escape html
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* Initialize Recording & Social Feed Listeners */
(function initVideoAndSocialEvents() {
    const recBtn = document.getElementById('rec-clip-btn');
    const stopRecBtn = document.getElementById('stop-rec-btn');
    const socialBtn = document.getElementById('social-feed-btn');
    const closeSocialBtn = document.getElementById('close-social-modal');
    const closePostBtn = document.getElementById('close-post-modal');
    const socialRecCta = document.getElementById('social-rec-cta');
    const downloadClipBtn = document.getElementById('download-clip-btn');
    const postClipForm = document.getElementById('post-clip-form');

    if (recBtn) recBtn.addEventListener('click', toggleGameplayRecording);
    if (stopRecBtn) stopRecBtn.addEventListener('click', stopGameplayRecording);
    if (socialBtn) socialBtn.addEventListener('click', () => openSocialSpaceModal('trending'));
    if (closeSocialBtn) closeSocialBtn.addEventListener('click', closeSocialSpaceModal);
    if (closePostBtn) closePostBtn.addEventListener('click', closePostClipModal);

    if (socialRecCta) {
        socialRecCta.addEventListener('click', () => {
            closeSocialSpaceModal();
            startGameplayRecording();
        });
    }

    // Tag Chips Selection
    document.querySelectorAll('.tag-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedTag = chip.getAttribute('data-tag');
        });
    });

    // Download Clip Button
    if (downloadClipBtn) {
        downloadClipBtn.addEventListener('click', () => {
            if (!lastRecordedBlob) return;
            const url = URL.createObjectURL(lastRecordedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `GestureArena-Clip-${Date.now()}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            speak("Clip downloaded!");
        });
    }

    // Global In-Memory Blob Store for Video Clips
    window.arenaClipBlobs = window.arenaClipBlobs || new Map();

    // Post to Social Feed Form
    if (postClipForm) {
        postClipForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('clip-title-input');
            const caption = titleInput ? titleInput.value.trim() : 'Clutch Gesture Arena Clip!';
            
            if (!lastRecordedBlob) {
                alert("⚠️ No recording data found. Please record a clip first!");
                return;
            }

            const postId = 'post_' + Date.now();
            const videoUrl = URL.createObjectURL(lastRecordedBlob);

            // Store blob in memory map
            window.arenaClipBlobs.set(postId, lastRecordedBlob);

            const activeStreak = typeof winStreak !== 'undefined' ? winStreak : 0;
            const activeScore = typeof playerScore !== 'undefined' ? playerScore : 0;
            const activeAuthor = (typeof myNickname !== 'undefined' && myNickname) ? myNickname : 'YOU';

            const newPost = {
                id: postId,
                isMyClip: true,
                author: activeAuthor,
                avatar: (typeof myAvatarId !== 'undefined' && myAvatarId && typeof getAvatarById === 'function') ? getAvatarById(myAvatarId).emoji : '🎮',
                title: caption,
                tag: selectedTag || '🔥 Clutch',
                likes: 1,
                liked: true,
                time: 'Just now',
                stats: `Score: ${activeScore} • Streak: ${activeStreak}`,
                comments: [],
                videoUrl: videoUrl
            };

            let posts = getStoredSocialPosts();
            posts.unshift(newPost);
            
            // Save metadata securely without throwing QuotaExceeded error
            try {
                // Strip temporary blob URLs before storing to localStorage to stay well under storage quota
                const storablePosts = posts.map(p => {
                    if (p.videoUrl && p.videoUrl.startsWith('blob:')) {
                        return { ...p, videoUrl: null }; // Will be rendered via window.arenaClipBlobs
                    }
                    return p;
                });
                localStorage.setItem('arena_social_posts', JSON.stringify(storablePosts));
            } catch (err) {
                console.warn("localStorage quota exceeded, storing post in session memory:", err);
            }

            // Keep full post with videoUrl in active memory
            window.activePostsList = posts;

            closePostClipModal();
            openSocialSpaceModal('my-clips');

            if (typeof speak === 'function') {
                speak("Your gameplay clip has been posted to the Arena Social Space!");
            }
            if (typeof confetti === 'function') {
                confetti({ particleCount: 85, spread: 75, origin: { y: 0.6 } });
            }
        });
    }

    // Social Tab Switching
    document.querySelectorAll('.social-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.social-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const category = tab.getAttribute('data-tab');
            renderSocialFeed(category);
        });
    });
})();

/* =========================================
   Gesture Blade Chaser Engine
   Physics + collision run in blade-worker.js (parallel)
   Main thread: MediaPipe tip + draw only
   ========================================= */
let activeGameMode = 'rps'; // 'rps' or 'slasher'
let slasherScore = 0;
let slasherCombo = 0;
let slasherComboTimer = null;
let frameCounter = 0;

let bladeTrailPoints = [];
let slasherTargets = [];
let slasherSparks = [];
let bladeRenderTip = null;
let bladeWorkerBusy = false;
let bladeSpawnInitial = false;
let lastBladeVoiceAt = 0;
let pendingBladeTip = null;
let pendingBladeNow = 0;

const SLASHER_TYPES = [
    { type: 'watermelon', emoji: '🍉', radius: 32, pts: 50, color: '#22c55e' },
    { type: 'orange',     emoji: '🍊', radius: 26, pts: 30, color: '#f97316' },
    { type: 'gem',        emoji: '💎', radius: 24, pts: 100, color: '#06b6d4' },
    { type: 'bomb',       emoji: '💣', radius: 28, pts: -100, color: '#ef4444', isBomb: true }
];

let bladeWorker = null;
try {
    bladeWorker = new Worker('blade-worker.js');
    bladeWorker.onmessage = (e) => {
        const msg = e.data;
        if (!msg) return;
        if (msg.type === 'tickResult') {
            bladeWorkerBusy = false;
            bladeTrailPoints = msg.trail || [];
            bladeRenderTip = msg.tip;
            slasherTargets = msg.targets || [];
            if (msg.slicedEvents?.length) {
                handleBladeSliceEvents(msg.slicedEvents);
            }
            // If a newer tip arrived while the worker was busy, flush it once
            if (
                activeGameMode === 'slasher' &&
                pendingBladeNow > (msg.now || 0)
            ) {
                flushBladeWorkerTick();
            }
        }
    };
    bladeWorker.onerror = () => {
        bladeWorker = null;
        console.warn('Blade worker unavailable — using main-thread fallback');
    };
} catch (_) {
    bladeWorker = null;
}

function setGameMode(mode) {
    activeGameMode = mode;
    const rpsBtn = document.getElementById('start-btn');
    const bladeBtn = document.getElementById('blade-mode-btn');
    const runnerBtn = document.getElementById('runner-mode-btn');
    const slasherHud = document.getElementById('slasher-hud');
    const runnerHud = document.getElementById('runner-hud');
    const drone = document.getElementById('spline-companion-container');
    const gestureHud = document.getElementById('gesture-indicator');

    applyHandsOptionsForMode(mode);

    if (slasherHud) slasherHud.classList.add('hidden');
    if (runnerHud) runnerHud.classList.add('hidden');
    if (bladeBtn) bladeBtn.classList.remove('active-mode');
    if (runnerBtn) runnerBtn.classList.remove('active-mode');
    if (rpsBtn) rpsBtn.style.opacity = '1';
    if (drone) drone.style.visibility = '';
    indicator?.classList.remove('hidden');

    if (window.GestureRunner && mode !== 'runner') {
        window.GestureRunner.stop();
    }
    if (window.TrainingLab?.isActive?.()) {
        window.TrainingLab.stop();
    }

    if (mode === 'slasher') {
        if (slasherHud) slasherHud.classList.remove('hidden');
        if (bladeBtn) bladeBtn.classList.add('active-mode');
        if (rpsBtn) rpsBtn.style.opacity = '0.6';

        if (drone) drone.style.visibility = 'hidden';
        if (gestureHud) gestureHud.classList.add('hidden');
        indicator?.classList.add('hidden');

        slasherScore = 0;
        slasherCombo = 0;
        slasherTargets = [];
        bladeTrailPoints = [];
        slasherSparks = [];
        bladeRenderTip = null;
        bladeSpawnInitial = true;
        bladeWorkerBusy = false;
        updateSlasherHUD();

        if (bladeWorker) {
            bladeWorker.postMessage({ type: 'reset' });
        }

        speak("Gesture Blade active! Swipe your index finger to slash targets!");
        if (typeof confetti === 'function') confetti({ particleCount: 50, spread: 60 });
    } else if (mode === 'runner') {
        if (runnerHud) runnerHud.classList.remove('hidden');
        if (runnerBtn) runnerBtn.classList.add('active-mode');
        if (rpsBtn) rpsBtn.style.opacity = '0.6';
        if (drone) drone.style.visibility = 'hidden';
        if (gestureHud) gestureHud.classList.add('hidden');
        indicator?.classList.add('hidden');
        slasherTargets = [];
        bladeTrailPoints = [];

        if (window.GestureRunner) window.GestureRunner.start();
    } else {
        slasherTargets = [];
        bladeTrailPoints = [];
        speak("Rock Paper Scissors mode active.");
    }
}

function updateSlasherHUD() {
    const scoreVal = document.getElementById('slasher-score-val');
    const comboBox = document.getElementById('slasher-combo-box');
    const comboVal = document.getElementById('slasher-combo-val');

    if (scoreVal) scoreVal.innerText = slasherScore;
    if (comboBox && comboVal) {
        if (slasherCombo > 1) {
            comboBox.classList.remove('hidden');
            comboVal.innerText = `x${slasherCombo}`;
        } else {
            comboBox.classList.add('hidden');
        }
    }
}

function handleBladeSliceEvents(events) {
    for (const ev of events) {
        if (ev.isBomb) {
            slasherScore = Math.max(0, slasherScore - 100);
            slasherCombo = 0;
            updateSlasherHUD();
            spawnSparkExplosion(ev.x, ev.y, '#ef4444', 14);
            if (Date.now() - lastBladeVoiceAt > 1200) {
                lastBladeVoiceAt = Date.now();
                speak("Bomb detonated!");
            }
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        } else {
            slasherCombo++;
            clearTimeout(slasherComboTimer);
            slasherComboTimer = setTimeout(() => {
                slasherCombo = 0;
                updateSlasherHUD();
            }, 2000);
            slasherScore += ev.pts * Math.max(1, slasherCombo);
            updateSlasherHUD();
            spawnSparkExplosion(ev.x, ev.y, ev.color, 12);
        }
    }
}

function flushBladeWorkerTick() {
    const canvas = document.getElementById('output_canvas');
    if (!bladeWorker || !canvas || bladeWorkerBusy) return;
    bladeWorkerBusy = true;
    const spawnInitial = bladeSpawnInitial;
    bladeSpawnInitial = false;
    const now = pendingBladeNow || Date.now();
    bladeWorker.postMessage({
        type: 'tick',
        now,
        canvasW: canvas.width,
        canvasH: canvas.height,
        tip: pendingBladeTip,
        templates: SLASHER_TYPES,
        spawnInitial,
    });
}

/** Push tip to worker (or fallback) then paint latest state */
function tickBladeEngine(indexTipLandmark, indexDipLandmark) {
    const canvas = document.getElementById('output_canvas');
    if (!canvas || !canvasCtx) return;

    const now = Date.now();
    let tipPayload = null;
    if (indexTipLandmark) {
        // Blend tip with DIP for a more stable blade point
        const dipW = indexDipLandmark ? 0.22 : 0;
        const lx = indexTipLandmark.x * (1 - dipW) + (indexDipLandmark?.x || 0) * dipW;
        const ly = indexTipLandmark.y * (1 - dipW) + (indexDipLandmark?.y || 0) * dipW;
        tipPayload = {
            x: lx * canvas.width,
            y: ly * canvas.height,
        };
    }

    pendingBladeTip = tipPayload;
    pendingBladeNow = now;

    if (bladeWorker) {
        if (!bladeWorkerBusy) flushBladeWorkerTick();
    } else {
        updateSlasherEngineFallback(tipPayload, now, canvas);
    }

    drawBladeFrame(now);
}

function drawBladeFrame(now) {
    // FPS badge (throttled DOM writes)
    if (window.lastFrameTime) {
        const delta = now - window.lastFrameTime;
        if (delta > 0 && frameCounter % 20 === 0) {
            const fpsEl = document.getElementById('fps-badge');
            if (fpsEl) {
                const fpsVal = Math.min(60, Math.round(1000 / delta));
                fpsEl.innerText = `⚡ ${fpsVal} FPS • ${Math.round(delta)}ms`;
            }
        }
    }
    window.lastFrameTime = now;
    frameCounter++;

    // Laser trail
    if (bladeTrailPoints.length > 1) {
        canvasCtx.save();
        canvasCtx.lineCap = 'round';
        canvasCtx.lineJoin = 'round';
        canvasCtx.beginPath();
        canvasCtx.moveTo(bladeTrailPoints[0].x, bladeTrailPoints[0].y);
        for (let i = 1; i < bladeTrailPoints.length; i++) {
            canvasCtx.lineTo(bladeTrailPoints[i].x, bladeTrailPoints[i].y);
        }
        canvasCtx.lineWidth = 16;
        canvasCtx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        canvasCtx.stroke();
        canvasCtx.lineWidth = 7;
        canvasCtx.strokeStyle = '#ec4899';
        canvasCtx.stroke();
        canvasCtx.lineWidth = 3;
        canvasCtx.strokeStyle = '#ffffff';
        canvasCtx.stroke();
        canvasCtx.restore();
    }

    if (bladeRenderTip) {
        canvasCtx.save();
        canvasCtx.beginPath();
        canvasCtx.arc(bladeRenderTip.x, bladeRenderTip.y, 14, 0, Math.PI * 2);
        canvasCtx.fillStyle = 'rgba(244, 63, 94, 0.5)';
        canvasCtx.fill();
        canvasCtx.beginPath();
        canvasCtx.arc(bladeRenderTip.x, bladeRenderTip.y, 8, 0, Math.PI * 2);
        canvasCtx.fillStyle = '#f43f5e';
        canvasCtx.fill();
        canvasCtx.beginPath();
        canvasCtx.arc(bladeRenderTip.x, bladeRenderTip.y, 4, 0, Math.PI * 2);
        canvasCtx.fillStyle = '#ffffff';
        canvasCtx.fill();
        canvasCtx.restore();
    }

    // Targets (no shadowBlur — expensive & invisible on many GPUs)
    for (const target of slasherTargets) {
        if (!target.sliced) {
            canvasCtx.save();
            canvasCtx.translate(target.x, target.y);
            canvasCtx.rotate(target.angle || 0);
            canvasCtx.font = `${target.radius * 1.5}px sans-serif`;
            canvasCtx.textAlign = 'center';
            canvasCtx.textBaseline = 'middle';
            canvasCtx.fillText(target.emoji, 0, 0);
            canvasCtx.beginPath();
            canvasCtx.arc(0, 0, target.radius + 2, 0, Math.PI * 2);
            canvasCtx.strokeStyle = target.color;
            canvasCtx.lineWidth = 2;
            canvasCtx.stroke();
            canvasCtx.restore();
        } else if (target.halves) {
            for (const h of target.halves) {
                if (h.alpha <= 0) continue;
                canvasCtx.save();
                canvasCtx.translate(h.x, h.y);
                canvasCtx.rotate(h.angle);
                canvasCtx.font = `${target.radius * 1.2}px sans-serif`;
                canvasCtx.textAlign = 'center';
                canvasCtx.textBaseline = 'middle';
                canvasCtx.globalAlpha = Math.max(0, h.alpha);
                canvasCtx.fillText(target.emoji, 0, 0);
                canvasCtx.restore();
            }
        }
    }

    for (let i = slasherSparks.length - 1; i >= 0; i--) {
        const s = slasherSparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.05;
        if (s.life <= 0) {
            slasherSparks.splice(i, 1);
            continue;
        }
        canvasCtx.save();
        canvasCtx.globalAlpha = s.life;
        canvasCtx.fillStyle = s.color;
        canvasCtx.fillRect(s.x, s.y, s.size, s.size);
        canvasCtx.restore();
    }
}

/* Main-thread fallback if Worker is blocked */
function updateSlasherEngineFallback(tipPayload, now, canvas) {
    if (bladeSpawnInitial && slasherTargets.length === 0) {
        for (let n = 0; n < 3; n++) spawnSlasherTargetLocal(canvas);
        bladeSpawnInitial = false;
    }
    if (!window._bladeLastSpawn) window._bladeLastSpawn = 0;
    if (now - window._bladeLastSpawn > 850) {
        spawnSlasherTargetLocal(canvas);
        window._bladeLastSpawn = now;
    }

    if (tipPayload) {
        bladeTrailPoints.push({ ...tipPayload, t: now });
        bladeRenderTip = tipPayload;
    }
    bladeTrailPoints = bladeTrailPoints.filter((p) => now - p.t < 320);

    const events = [];
    for (let i = slasherTargets.length - 1; i >= 0; i--) {
        const target = slasherTargets[i];
        if (!target.sliced) {
            target.x += target.vx;
            target.y += target.vy;
            target.vy += target.gravity;
            target.angle += target.vRot;
            if (bladeTrailPoints.length && isTargetSlicedByTrail(target, bladeTrailPoints)) {
                target.sliced = true;
                events.push({
                    id: target.id,
                    isBomb: target.isBomb,
                    x: target.x,
                    y: target.y,
                    pts: target.pts,
                    color: target.color,
                });
                createHalfPieces(target);
            }
        } else if (target.halves) {
            target.halves.forEach((h) => {
                h.x += h.vx;
                h.y += h.vy;
                h.vy += target.gravity;
                h.angle += h.vRot;
                h.alpha -= 0.025;
            });
        }
        if (target.y > canvas.height + 60) slasherTargets.splice(i, 1);
    }
    if (events.length) handleBladeSliceEvents(events);
}

function spawnSlasherTargetLocal(canvas) {
    const template = SLASHER_TYPES[Math.floor(Math.random() * SLASHER_TYPES.length)];
    slasherTargets.push({
        id: 'target_' + Date.now() + '_' + Math.random(),
        x: Math.random() * (canvas.width - 140) + 70,
        y: canvas.height + 10,
        vx: (Math.random() - 0.5) * 5.5,
        vy: -(Math.random() * 4 + 14.5),
        gravity: 0.26,
        radius: template.radius,
        emoji: template.emoji,
        pts: template.pts,
        color: template.color,
        isBomb: template.isBomb || false,
        sliced: false,
        angle: 0,
        vRot: (Math.random() - 0.5) * 0.08,
        halves: null,
    });
}

function isTargetSlicedByTrail(target, points) {
    if (!points || points.length === 0) return false;
    const hitRadius = target.radius + 26;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (Math.hypot(target.x - p.x, target.y - p.y) <= hitRadius) return true;
        if (i > 0) {
            const prevP = points[i - 1];
            if (distToSegment(target.x, target.y, prevP.x, prevP.y, p.x, p.y) <= hitRadius) {
                return true;
            }
        }
    }
    return false;
}

function distToSegment(px, py, x1, y1, x2, y2) {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function createHalfPieces(target) {
    target.halves = [
        { x: target.x - 10, y: target.y, vx: target.vx - 3, vy: target.vy - 2, angle: target.angle, vRot: -0.1, alpha: 1 },
        { x: target.x + 10, y: target.y, vx: target.vx + 3, vy: target.vy - 2, angle: target.angle, vRot: 0.1, alpha: 1 }
    ];
}

function spawnSparkExplosion(x, y, color, count = 12) {
    const n = Math.min(count, 16);
    for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        slasherSparks.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 3 + 2,
            color,
            life: 1.0,
        });
    }
}

/* Event listeners for Slasher Mode toggle */
(function initSlasherModeEvents() {
    const bladeBtn = document.getElementById('blade-mode-btn');
    const sideBladeBtn = document.getElementById('side-nav-blade');

    if (bladeBtn) {
        bladeBtn.addEventListener('click', () => {
            if (activeGameMode === 'slasher') {
                setGameMode('rps');
            } else {
                setGameMode('slasher');
            }
        });
    }

    if (sideBladeBtn) {
        sideBladeBtn.addEventListener('click', () => {
            if (typeof closeSideMenu === 'function') closeSideMenu();
            setGameMode('slasher');
        });
    }

    const sideTrainerBtn = document.getElementById('side-nav-trainer');
    if (sideTrainerBtn) {
        sideTrainerBtn.addEventListener('click', () => {
            if (typeof closeSideMenu === 'function') closeSideMenu();
            if (typeof openTrainingLab === 'function') openTrainingLab();
        });
    }

    const runnerBtn = document.getElementById('runner-mode-btn');
    const sideRunnerBtn = document.getElementById('side-nav-runner');

    if (runnerBtn) {
        runnerBtn.addEventListener('click', () => {
            if (activeGameMode === 'runner') {
                setGameMode('rps');
            } else {
                if (typeof startUserCamera === 'function' && !window.isArenaCameraActive?.()) {
                    startUserCamera();
                }
                setGameMode('runner');
            }
        });
    }

    if (sideRunnerBtn) {
        sideRunnerBtn.addEventListener('click', () => {
            if (typeof closeSideMenu === 'function') closeSideMenu();
            if (typeof startUserCamera === 'function' && !window.isArenaCameraActive?.()) {
                startUserCamera();
            }
            setGameMode('runner');
        });
    }
})();



