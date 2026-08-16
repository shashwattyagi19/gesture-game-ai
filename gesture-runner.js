/**
 * Gesture Runner — Flappy-style orb game inside Gesture Arena.
 * Uses shared camera + MediaPipe Hands landmarks from script.js
 */
(function initGestureRunner() {
    const STORAGE_HS = 'gesture_arena_runner_hs';

    let running = false;
    let gameOver = false;
    let score = 0;
    let highScore = Number(localStorage.getItem(STORAGE_HS) || 0);
    let lastTs = 0;
    let spawnTimer = 0;
    let obstacles = [];
    let handY = 0.5;
    let handDetected = false;
    let lastGestureAction = 0;
    let runnerGestureLabel = '–';

    const PIPE_W = 70;
    const GAP = 180;
    const SPEED = 4.2;

    const player = {
        x: 120,
        y: 240,
        radius: 22,
        targetY: 240,
        duck: false,
        invincible: 0,
        boost: 0,
    };

    const hud = document.getElementById('runner-hud');
    const overlay = document.getElementById('runner-overlay');
    const scoreEl = document.getElementById('runner-score-val');
    const hsEl = document.getElementById('runner-hs-val');
    const gestureEl = document.getElementById('runner-gesture-val');
    const overlayTitle = document.getElementById('runner-overlay-title');
    const overlayBody = document.getElementById('runner-overlay-body');

    function dist(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
    }

    function isThumbUp(landmarks) {
        const wrist = landmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const thumbUp = thumbTip.y < wrist.y - 0.04;
        const fingersCurled =
            indexTip.y > landmarks[6].y &&
            middleTip.y > landmarks[10].y;
        return thumbUp && fingersCurled;
    }

    function mapGesture(gesture, landmarks) {
        if (landmarks && isThumbUp(landmarks)) return 'Thumb_Up';
        if (gesture === 'Paper') return 'Open_Palm';
        if (gesture === 'Rock') return 'Closed_Fist';
        if (gesture === 'Scissors') return 'Victory';
        return gesture;
    }

    function resetGame(canvasH) {
        obstacles = [];
        score = 0;
        spawnTimer = 0;
        player.y = canvasH / 2;
        player.targetY = player.y;
        player.duck = false;
        player.invincible = 0;
        player.boost = 0;
        gameOver = false;
        if (scoreEl) scoreEl.textContent = '0';
    }

    function showOverlay(title, body, show) {
        if (!overlay) return;
        if (overlayTitle) overlayTitle.textContent = title;
        if (overlayBody) overlayBody.innerHTML = body;
        overlay.classList.toggle('hidden', !show);
    }

    function spawnObstacle(canvasW, canvasH) {
        const minTop = 60;
        const maxTop = canvasH - GAP - 60;
        const topHeight = minTop + Math.random() * (maxTop - minTop);
        obstacles.push({
            x: canvasW + 20,
            top: topHeight,
            bottom: topHeight + GAP,
            scored: false,
        });
    }

    function endGame() {
        gameOver = true;
        running = false;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem(STORAGE_HS, String(highScore));
            if (hsEl) hsEl.textContent = String(highScore);
        }
        showOverlay(
            'Game Over!',
            `Score: <b>${score}</b><br>High Score: <b>${highScore}</b><br><br>Show <b>Thumbs Up</b> 👍 to play again`,
            true
        );
        if (typeof speak === 'function') speak(`Game over. Score ${score}.`);
    }

    function applyGestureAction(label) {
        const now = performance.now();
        if (now - lastGestureAction < 400) return;

        if (label === 'Thumb_Up' && (!running || gameOver)) {
            const canvas = document.getElementById('output_canvas');
            resetGame(canvas?.height || 480);
            running = true;
            gameOver = false;
            showOverlay('', '', false);
            lastGestureAction = now;
            if (typeof speak === 'function') speak('Runner started!');
            return;
        }

        if (!running || gameOver) return;

        if (label === 'Open_Palm') {
            player.boost = 280;
            lastGestureAction = now;
        }
        if (label === 'Closed_Fist') {
            player.duck = true;
            setTimeout(() => {
                player.duck = false;
            }, 600);
            lastGestureAction = now;
        }
        if (label === 'Victory') {
            player.invincible = 1800;
            lastGestureAction = now;
        }
    }

    function update(dt, canvasW, canvasH) {
        if (!running || gameOver) return;

        if (handDetected) {
            player.targetY = handY * canvasH;
        }

        player.y += (player.targetY - player.y) * 0.18;

        if (player.boost > 0) {
            player.y -= 3.5;
            player.boost -= dt;
        }
        player.radius = player.duck ? 14 : 22;
        if (player.invincible > 0) player.invincible -= dt;

        player.y = Math.max(
            player.radius + 10,
            Math.min(canvasH - player.radius - 10, player.y)
        );

        spawnTimer -= dt;
        if (spawnTimer <= 0) {
            spawnObstacle(canvasW, canvasH);
            spawnTimer = 1400 + Math.random() * 600;
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const o = obstacles[i];
            o.x -= SPEED * (dt / 16);

            if (!o.scored && o.x + PIPE_W < player.x) {
                o.scored = true;
                score += 1;
                if (scoreEl) scoreEl.textContent = String(score);
            }

            if (player.invincible <= 0) {
                const px = player.x;
                const py = player.y;
                const r = player.radius;
                if (
                    px + r > o.x &&
                    px - r < o.x + PIPE_W &&
                    (py - r < o.top || py + r > o.bottom)
                ) {
                    endGame();
                    return;
                }
            }

            if (o.x + PIPE_W < -20) obstacles.splice(i, 1);
        }
    }

    function draw(ctx, canvasW, canvasH) {
        // Grid
        ctx.strokeStyle = 'rgba(100,80,255,0.08)';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvasW; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasH);
            ctx.stroke();
        }

        obstacles.forEach((o) => {
            const grad = ctx.createLinearGradient(o.x, 0, o.x + PIPE_W, 0);
            grad.addColorStop(0, '#6c5ce7');
            grad.addColorStop(1, '#a29bfe');
            ctx.fillStyle = grad;
            ctx.fillRect(o.x, 0, PIPE_W, o.top);
            ctx.fillRect(o.x - 6, o.top - 18, PIPE_W + 12, 18);
            ctx.fillRect(o.x, o.bottom, PIPE_W, canvasH - o.bottom);
            ctx.fillRect(o.x - 6, o.bottom, PIPE_W + 12, 18);
        });

        const glow =
            player.invincible > 0
                ? 'rgba(255,220,50,0.7)'
                : 'rgba(120,100,255,0.6)';
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        const pGrad = ctx.createRadialGradient(
            player.x - 6,
            player.y - 6,
            2,
            player.x,
            player.y,
            player.radius
        );
        pGrad.addColorStop(0, '#ffffff');
        pGrad.addColorStop(0.4, '#a29bfe');
        pGrad.addColorStop(1, '#6c5ce7');
        ctx.fillStyle = pGrad;
        ctx.fill();

        ctx.fillStyle = '#0a0a12';
        ctx.beginPath();
        ctx.arc(player.x + 6, player.y - 4, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    function onFrame(landmarks, gesture, ctx, canvasW, canvasH, ts) {
        if (typeof activeGameMode === 'undefined' || activeGameMode !== 'runner') return;

        const dt = Math.min(ts - lastTs || 16, 40);
        lastTs = ts;

        handDetected = false;
        if (landmarks) {
            handY = (landmarks[0].y + landmarks[5].y + landmarks[9].y + landmarks[13].y) / 4;
            handDetected = true;
            const label = mapGesture(gesture, landmarks);
            runnerGestureLabel = label.replace(/_/g, ' ');
            if (gestureEl) gestureEl.textContent = runnerGestureLabel;
            applyGestureAction(label);
        } else if (gestureEl) {
            gestureEl.textContent = '–';
        }

        update(dt, canvasW, canvasH);
        draw(ctx, canvasW, canvasH);
    }

    function startMode() {
        const canvas = document.getElementById('output_canvas');
        const h = canvas?.height || 480;
        resetGame(h);
        running = false;
        gameOver = false;
        lastTs = performance.now();
        if (hsEl) hsEl.textContent = String(highScore);
        if (hud) hud.classList.remove('hidden');
        showOverlay(
            'Gesture Runner',
            'Move hand <b>up/down</b> to fly the orb.<br><b>Paper</b> = boost · <b>Rock</b> = duck · <b>Peace</b> = shield<br><br>Show <b>Thumbs Up</b> 👍 to start',
            true
        );
        if (typeof speak === 'function') {
            speak('Gesture Runner. Thumbs up to start. Move your hand to fly.');
        }
    }

    function stopMode() {
        running = false;
        gameOver = false;
        obstacles = [];
        if (hud) hud.classList.add('hidden');
        showOverlay('', '', false);
    }

    window.GestureRunner = {
        onFrame,
        start: startMode,
        stop: stopMode,
        isActive: () => typeof activeGameMode !== 'undefined' && activeGameMode === 'runner',
    };
})();
