/**
 * Gesture Arena — Training Lab
 * Practice RPS gestures, run accuracy tests, track blade stats.
 */
(function initTrainingLab() {
    const STORAGE_KEY = 'gesture_arena_training_stats_v1';
    const GESTURES = ['Rock', 'Paper', 'Scissors'];
    const ICONS = { Rock: '✊', Paper: '✋', Scissors: '✌️' };

    let active = false;
    let mode = null; // 'rps-drill' | 'rps-test' | 'blade-drill'
    let drillTarget = null;
    let stableFrames = 0;
    let testQueue = [];
    let testIndex = 0;
    let testResults = [];
    let drillTimer = null;
    let drillEndTime = 0;
    let bladeStartScore = 0;

    const modal = document.getElementById('training-lab-modal');
    const hud = document.getElementById('training-hud');
    if (!modal || !hud) return;

    function loadStats() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultStats();
        } catch {
            return defaultStats();
        }
    }

    function defaultStats() {
        return {
            rpsDrillSessions: 0,
            rpsDrillCorrect: 0,
            rpsDrillTotal: 0,
            rpsTestBest: 0,
            rpsTestRuns: 0,
            bladeDrillSessions: 0,
            bladeBestScore: 0,
            bladeBestCombo: 0,
            lastSession: null,
        };
    }

    function saveStats(stats) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }

    function getGesture() {
        if (typeof window.getArenaGesture === 'function') {
            return window.getArenaGesture();
        }
        return 'Unknown';
    }

    function cameraReady() {
        return typeof window.isArenaCameraActive === 'function' && window.isArenaCameraActive();
    }

    function setHud(html) {
        hud.innerHTML = html;
        hud.classList.toggle('hidden', !active);
    }

    function renderStatsPanel() {
        const s = loadStats();
        const rpsAcc =
            s.rpsDrillTotal > 0
                ? Math.round((s.rpsDrillCorrect / s.rpsDrillTotal) * 100)
                : 0;
        const el = document.getElementById('training-stats-panel');
        if (!el) return;
        el.innerHTML = `
            <div class="training-stat-grid">
                <div class="training-stat"><span class="label">RPS drill accuracy</span><span class="val">${rpsAcc}%</span></div>
                <div class="training-stat"><span class="label">Best test score</span><span class="val">${s.rpsTestBest}/9</span></div>
                <div class="training-stat"><span class="label">Blade best score</span><span class="val">${s.bladeBestScore}</span></div>
                <div class="training-stat"><span class="label">Blade best combo</span><span class="val">x${s.bladeBestCombo || 1}</span></div>
            </div>
            <p class="training-stat-note">${s.lastSession || 'No sessions yet — start a drill below.'}</p>
        `;
    }

    function stopSession(message) {
        active = false;
        mode = null;
        drillTarget = null;
        stableFrames = 0;
        clearInterval(drillTimer);
        drillTimer = null;
        setHud('');
        hud.classList.add('hidden');
        if (message && typeof speak === 'function') speak(message);
        renderStatsPanel();
        document.querySelectorAll('.training-tab-btn').forEach((b) => b.classList.remove('running'));
    }

    function pickNextDrillTarget() {
        drillTarget = GESTURES[Math.floor(Math.random() * GESTURES.length)];
        stableFrames = 0;
        updateDrillHud();
    }

    function updateDrillHud() {
        const g = getGesture();
        setHud(`
            <div class="training-hud-card">
                <p class="training-hud-label">RPS DRILL — hold the target pose</p>
                <p class="training-hud-target">${ICONS[drillTarget]} ${drillTarget}</p>
                <p class="training-hud-detected">Detected: ${ICONS[g] || '❓'} ${g}</p>
                <div class="training-progress"><div class="training-progress-fill" style="width:${Math.min(100, (stableFrames / 12) * 100)}%"></div></div>
                <button type="button" class="training-stop-btn" id="training-stop-inline">Stop drill</button>
            </div>
        `);
        document.getElementById('training-stop-inline')?.addEventListener('click', () =>
            stopSession('Drill ended.')
        );
    }

    function updateTestHud() {
        const g = getGesture();
        const target = testQueue[testIndex];
        setHud(`
            <div class="training-hud-card">
                <p class="training-hud-label">ACCURACY TEST ${testIndex + 1} / ${testQueue.length}</p>
                <p class="training-hud-target">${ICONS[target]} Show ${target}</p>
                <p class="training-hud-detected">Detected: ${ICONS[g] || '❓'} ${g}</p>
                <div class="training-progress"><div class="training-progress-fill" style="width:${Math.min(100, (stableFrames / 12) * 100)}%"></div></div>
                <button type="button" class="training-stop-btn" id="training-stop-inline">Cancel test</button>
            </div>
        `);
        document.getElementById('training-stop-inline')?.addEventListener('click', () =>
            stopSession('Test cancelled.')
        );
    }

    function updateBladeHud(secondsLeft) {
        const scoreEl = document.getElementById('slasher-score-val');
        const comboEl = document.getElementById('slasher-combo-val');
        const score = scoreEl ? parseInt(scoreEl.innerText, 10) || 0 : 0;
        const combo = comboEl ? parseInt(String(comboEl.innerText).replace('x', ''), 10) || 0 : 0;
        setHud(`
            <div class="training-hud-card blade">
                <p class="training-hud-label">BLADE DRILL — ${secondsLeft}s left</p>
                <p class="training-hud-target">Slash fruits with your index finger ⚔️</p>
                <p class="training-hud-detected">Score: ${score - bladeStartScore} · Combo: x${combo}</p>
                <button type="button" class="training-stop-btn" id="training-stop-inline">End early</button>
            </div>
        `);
        document.getElementById('training-stop-inline')?.addEventListener('click', () =>
            stopSession('Blade drill ended.')
        );
    }

    function startRpsDrill() {
        if (!cameraReady()) {
            alert('Enable your camera first, then open Training Lab.');
            if (typeof startUserCamera === 'function') startUserCamera();
            return;
        }
        if (typeof setGameMode === 'function') setGameMode('rps');
        active = true;
        mode = 'rps-drill';
        const stats = loadStats();
        stats.rpsDrillSessions++;
        saveStats(stats);
        pickNextDrillTarget();
        if (typeof speak === 'function') speak('R P S drill started. Hold each target gesture steady.');
    }

    function startRpsTest() {
        if (!cameraReady()) {
            alert('Enable your camera first.');
            if (typeof startUserCamera === 'function') startUserCamera();
            return;
        }
        if (typeof setGameMode === 'function') setGameMode('rps');
        testQueue = [];
        for (const g of GESTURES) {
            testQueue.push(g, g, g);
        }
        for (let i = testQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [testQueue[i], testQueue[j]] = [testQueue[j], testQueue[i]];
        }
        testIndex = 0;
        testResults = [];
        stableFrames = 0;
        active = true;
        mode = 'rps-test';
        updateTestHud();
        if (typeof speak === 'function') speak('Accuracy test. Nine gestures. Hold each pose until the bar fills.');
    }

    function startBladeDrill() {
        if (!cameraReady()) {
            alert('Enable your camera first.');
            if (typeof startUserCamera === 'function') startUserCamera();
            return;
        }
        if (typeof setGameMode === 'function') setGameMode('slasher');
        const scoreEl = document.getElementById('slasher-score-val');
        bladeStartScore = scoreEl ? parseInt(scoreEl.innerText, 10) || 0 : 0;
        active = true;
        mode = 'blade-drill';
        drillEndTime = Date.now() + 30000;
        const stats = loadStats();
        stats.bladeDrillSessions++;
        saveStats(stats);
        updateBladeHud(30);
        drillTimer = setInterval(() => {
            const left = Math.max(0, Math.ceil((drillEndTime - Date.now()) / 1000));
            updateBladeHud(left);
            if (left <= 0) finishBladeDrill();
        }, 500);
        if (typeof speak === 'function') speak('Blade drill. Thirty seconds. Slash every fruit.');
    }

    function finishBladeDrill() {
        const scoreEl = document.getElementById('slasher-score-val');
        const comboEl = document.getElementById('slasher-combo-val');
        const finalScore = (scoreEl ? parseInt(scoreEl.innerText, 10) : 0) - bladeStartScore;
        const combo = comboEl ? parseInt(String(comboEl.innerText).replace('x', ''), 10) || 1 : 1;
        const stats = loadStats();
        stats.bladeBestScore = Math.max(stats.bladeBestScore, finalScore);
        stats.bladeBestCombo = Math.max(stats.bladeBestCombo, combo);
        stats.lastSession = `Blade drill: ${finalScore} pts, best combo x${combo}`;
        saveStats(stats);
        stopSession(`Blade drill complete. Score ${finalScore}.`);
        if (typeof confetti === 'function') confetti({ particleCount: 60, spread: 70 });
    }

    function onFrame(gesture) {
        if (!active) return;

        if (mode === 'rps-drill') {
            if (gesture === drillTarget) {
                stableFrames++;
                if (stableFrames >= 12) {
                    const stats = loadStats();
                    stats.rpsDrillCorrect++;
                    stats.rpsDrillTotal++;
                    stats.lastSession = `RPS drill: ${stats.rpsDrillCorrect}/${stats.rpsDrillTotal} correct`;
                    saveStats(stats);
                    stableFrames = 0;
                    pickNextDrillTarget();
                }
            } else {
                stableFrames = Math.max(0, stableFrames - 1);
            }
            updateDrillHud();
        }

        if (mode === 'rps-test') {
            const target = testQueue[testIndex];
            if (gesture === target) {
                stableFrames++;
                if (stableFrames >= 12) {
                    testResults.push(true);
                    testIndex++;
                    stableFrames = 0;
                    if (testIndex >= testQueue.length) {
                        const score = testResults.filter(Boolean).length;
                        const stats = loadStats();
                        stats.rpsTestRuns++;
                        stats.rpsTestBest = Math.max(stats.rpsTestBest, score);
                        stats.lastSession = `Test score: ${score}/9`;
                        saveStats(stats);
                        stopSession(`Test complete. ${score} out of 9 correct.`);
                        if (typeof confetti === 'function' && score >= 7) {
                            confetti({ particleCount: 80, spread: 80 });
                        }
                        return;
                    }
                    updateTestHud();
                }
            } else if (gesture !== 'Unknown') {
                stableFrames = 0;
            }
            updateTestHud();
        }
    }

    function openLab() {
        modal.classList.remove('hidden');
        renderStatsPanel();
    }

    function closeLab() {
        modal.classList.add('hidden');
        stopSession();
    }

    document.getElementById('training-lab-close')?.addEventListener('click', closeLab);
    document.getElementById('training-lab-close2')?.addEventListener('click', closeLab);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeLab();
    });

    document.getElementById('training-start-drill')?.addEventListener('click', () => {
        closeLab();
        startRpsDrill();
    });
    document.getElementById('training-start-test')?.addEventListener('click', () => {
        closeLab();
        startRpsTest();
    });
    document.getElementById('training-start-blade')?.addEventListener('click', () => {
        closeLab();
        startBladeDrill();
    });
    document.getElementById('training-open-calibrate')?.addEventListener('click', () => {
        closeLab();
        document.getElementById('calibrate-btn')?.click();
    });
    document.getElementById('training-reset-stats')?.addEventListener('click', () => {
        if (confirm('Reset all training stats?')) {
            localStorage.removeItem(STORAGE_KEY);
            renderStatsPanel();
        }
    });

    window.TrainingLab = {
        isActive: () => active,
        onFrame,
        open: openLab,
        stop: stopSession,
    };

    window.openTrainingLab = openLab;
    renderStatsPanel();
})();
