const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const startBtn = document.getElementById('start-btn');
const countdownEl = document.getElementById('countdown');
const resultBadge = document.getElementById('result-badge');
const playerMoveIcon = document.getElementById('player-move');
const cpuMoveIcon = document.getElementById('computer-move');
const playerScoreEl = document.getElementById('player-score');
const cpuScoreEl = document.getElementById('cpu-score');
const indicator = document.getElementById('gesture-indicator');

let isGamePlaying = false;
let currentGesture = 'Unknown';
let playerScore = 0;
let cpuScore = 0;

const GESTURE_ICONS = {
    'Rock': '✊',
    'Paper': '✋',
    'Scissors': '✌️',
    'Unknown': '❓'
};

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw landmarks
    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#4f46e5', lineWidth: 5});
            drawLandmarks(canvasCtx, landmarks, {color: '#ffffff', lineWidth: 2, radius: 4});
            
            // Recognize gesture
            currentGesture = recognizeGesture(landmarks);
            updateIndicator(currentGesture);
        }
    } else {
        currentGesture = 'Unknown';
        updateIndicator('Unknown');
    }
    canvasCtx.restore();
}

function recognizeGesture(landmarks) {
    // index, middle, ring, pinky
    const tips = [8, 12, 16, 20];
    const bases = [6, 10, 14, 18];
    
    let extendedFingers = 0;
    for (let i = 0; i < 4; i++) {
        if (landmarks[tips[i]].y < landmarks[bases[i]].y) {
            extendedFingers++;
        }
    }
    
    // Thumb check (simplified)
    const thumbTip = landmarks[4];
    const thumbBase = landmarks[2];
    if (Math.abs(thumbTip.x - thumbBase.x) > 0.05) {
        extendedFingers++;
    }

    if (extendedFingers <= 1) return 'Rock';
    if (extendedFingers === 2) return 'Scissors';
    if (extendedFingers >= 4) return 'Paper';
    return 'Unknown';
}

function updateIndicator(gesture) {
    if (gesture !== 'Unknown') {
        indicator.classList.remove('hidden');
        indicator.innerText = GESTURE_ICONS[gesture] + ' ' + gesture;
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
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 640,
    height: 480
});

camera.start();

// Game Logic
async function playGame() {
    if (isGamePlaying) return;
    isGamePlaying = true;
    startBtn.disabled = true;
    resultBadge.classList.add('hidden');
    cpuMoveIcon.innerText = '❓';
    
    // Countdown
    countdownEl.classList.remove('hidden');
    for (let i = 3; i > 0; i--) {
        countdownEl.innerText = i;
        await new Promise(r => setTimeout(r, 800));
    }
    countdownEl.innerText = 'GO!';
    await new Promise(r => setTimeout(r, 400));
    countdownEl.classList.add('hidden');
    
    // Capture result
    const playerMove = currentGesture;
    const moves = ['Rock', 'Paper', 'Scissors'];
    const cpuMove = moves[Math.floor(Math.random() * 3)];
    
    playerMoveIcon.innerText = GESTURE_ICONS[playerMove];
    cpuMoveIcon.innerText = GESTURE_ICONS[cpuMove];
    
    determineWinner(playerMove, cpuMove);
    
    isGamePlaying = false;
    startBtn.disabled = false;
    startBtn.innerText = 'Play Again';
}

function determineWinner(player, cpu) {
    resultBadge.classList.remove('hidden');
    
    if (player === 'Unknown') {
        resultBadge.innerText = 'Gesture Not Detected!';
        resultBadge.style.color = 'var(--text-muted)';
        return;
    }
    
    if (player === cpu) {
        resultBadge.innerText = "IT'S A DRAW!";
        resultBadge.style.color = 'var(--gold)';
    } else if (
        (player === 'Rock' && cpu === 'Scissors') ||
        (player === 'Paper' && cpu === 'Rock') ||
        (player === 'Scissors' && cpu === 'Paper')
    ) {
        resultBadge.innerText = 'YOU WIN!';
        resultBadge.style.color = 'var(--success)';
        playerScore++;
        playerScoreEl.innerText = playerScore;
    } else {
        resultBadge.innerText = 'CPU WINS!';
        resultBadge.style.color = 'var(--danger)';
        cpuScore++;
        cpuScoreEl.innerText = cpuScore;
    }
}

startBtn.addEventListener('click', playGame);
