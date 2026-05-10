tep;                int a_val = A[curr_i] - '0';        int b_val = B[curr_j] - '0';        int gain = a_val * b_val;                prefix_score[step + 1] = prefix_score[step] + gain;        if (a_val == b_val) {            curr_i = (curr_i + 1) % N;        } else {            curr_j = (curr_j + 1) % N;        }        step++;    }    int start_step = visited_step[curr_i * N + curr_j];    int cycle_len = step - start_step;    ll score_before_cycle = prefix_score[start_step];    ll score_per_cycle = prefix_score[step] - prefix_score[start_step];    // Process Queries    for (int q = 0; q < Q; q++) {        ll K;        scanf("%lld", &K);        if (K <= step) {            printf("%lld%c", prefix_score[K], (q == Q - 1 ? '\n' : ' '));        } else {            ll remaining_K = K - start_step;            ll num_cycles = remaining_K / cycle_len;            int remainder = remaining_K % cycle_len;            ll total_score = score_before_cycle + (num_cycles * score_per_cycle) +                              (prefix_score[start_step + remainder] - prefix_score[start_step]);                        printf("%lld%c", total_score, (q == Q - 1 ? 'const videoElement = document.getElementById('input_video');
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
let cpuScore = 0;clude <string.h>

typedef long long ll;

// State structure to track visited rotations
typedef struct {
    int next_i, next_j;
        int added_score;
        } State;

        void solve() {
            int N, Q;
                if (scanf("%d %d", &N, &Q) != 2) return;

                    char *A = (char *)malloc(N + 1);
                        char *B = (char *)malloc(N + 1);
                            scanf("%s %s", A, B);

                                // To track when a state (i, j) was first visited
                                    // Using a 1D array to represent 2D (i * N + j)
                                        int *visited_step = (int *)malloc((ll)N * N * sizeof(int));
                                            ll *prefix_score = (ll *)malloc(((ll)N * N + 1) * sizeof(ll));
                                                
                                                    for (ll i = 0; i < (ll)N * N; i++) visited_step[i] = -1;

                                                        int curr_i = 0, curr_j = 0;
                                                            int step = 0;
                                                                prefix_score[0] = 0;

                                                                    // Simulation to find the cycle
                                                                        

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
    maxNumHands: 2,
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
