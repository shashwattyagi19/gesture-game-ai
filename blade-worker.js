/**
 * Gesture Blade parallel engine
 * Runs physics + slash collision off the main thread.
 */
const TRAIL_MS = 320;
const MAX_TRAIL = 48;
const SPAWN_MS = 850;

/** @type {{ x:number, y:number, t:number }[]} */
let trail = [];
/** @type {any[]} */
let targets = [];
let lastSpawnTime = 0;
let smoothedTip = null;

function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function densifySegment(a, b, maxStep) {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  if (dist <= maxStep) return [b];
  const steps = Math.min(8, Math.ceil(dist / maxStep));
  const out = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    out.push({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      t: a.t + (b.t - a.t) * t,
    });
  }
  return out;
}

function smoothAndPushTip(raw, now) {
  if (!raw) {
    smoothedTip = null;
    return null;
  }

  const alpha = 0.42;
  if (!smoothedTip) {
    smoothedTip = { x: raw.x, y: raw.y, vx: 0, vy: 0, t: now };
  } else {
    const x = smoothedTip.x + alpha * (raw.x - smoothedTip.x);
    const y = smoothedTip.y + alpha * (raw.y - smoothedTip.y);
    const dt = Math.max(1, now - smoothedTip.t);
    smoothedTip = {
      x,
      y,
      vx: (x - smoothedTip.x) / dt,
      vy: (y - smoothedTip.y) / dt,
      t: now,
    };
  }

  const tip = { x: smoothedTip.x, y: smoothedTip.y, t: now };
  const prev = trail.length ? trail[trail.length - 1] : null;
  if (prev) {
    trail.push(...densifySegment(prev, tip, 10));
  } else {
    trail.push(tip);
  }

  // Predictive tip ~1 frame ahead for fast swipes
  const speed = Math.hypot(smoothedTip.vx, smoothedTip.vy);
  if (speed > 0.05) {
    trail.push({
      x: tip.x + smoothedTip.vx * 14,
      y: tip.y + smoothedTip.vy * 14,
      t: now + 1,
    });
  }

  while (trail.length > MAX_TRAIL) trail.shift();
  return tip;
}

function isTargetSliced(target, points) {
  if (!points.length) return false;
  const speedBoost = smoothedTip
    ? Math.min(36, Math.hypot(smoothedTip.vx, smoothedTip.vy) * 220)
    : 0;
  const hitRadius = target.radius + 22 + speedBoost;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (Math.hypot(target.x - p.x, target.y - p.y) <= hitRadius) return true;
    if (i > 0) {
      const prev = points[i - 1];
      if (distToSegment(target.x, target.y, prev.x, prev.y, p.x, p.y) <= hitRadius) {
        return true;
      }
    }
  }
  return false;
}

function spawnTarget(canvasW, canvasH, templates) {
  const template = templates[Math.floor(Math.random() * templates.length)];
  targets.push({
    id: "target_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
    x: Math.random() * (canvasW - 140) + 70,
    y: canvasH + 10,
    vx: (Math.random() - 0.5) * 5.5,
    vy: -(Math.random() * 4 + 14.5),
    gravity: 0.26,
    radius: template.radius,
    emoji: template.emoji,
    pts: template.pts,
    color: template.color,
    isBomb: !!template.isBomb,
    sliced: false,
    angle: 0,
    vRot: (Math.random() - 0.5) * 0.08,
    halves: null,
  });
}

self.onmessage = (e) => {
  const msg = e.data;
  if (!msg || !msg.type) return;

  if (msg.type === "reset") {
    trail = [];
    targets = [];
    lastSpawnTime = 0;
    smoothedTip = null;
    self.postMessage({ type: "ready" });
    return;
  }

  if (msg.type === "tick") {
    const {
      now,
      canvasW,
      canvasH,
      tip,
      templates,
      spawnInitial,
    } = msg;

    if (spawnInitial && targets.length === 0) {
      spawnTarget(canvasW, canvasH, templates);
      spawnTarget(canvasW, canvasH, templates);
      spawnTarget(canvasW, canvasH, templates);
      lastSpawnTime = now;
    }

    if (now - lastSpawnTime > SPAWN_MS) {
      spawnTarget(canvasW, canvasH, templates);
      lastSpawnTime = now;
    }

    const currentTip = smoothAndPushTip(tip, now);
    trail = trail.filter((p) => now - p.t < TRAIL_MS);

    /** @type {any[]} */
    const slicedEvents = [];

    for (let i = targets.length - 1; i >= 0; i--) {
      const target = targets[i];

      if (!target.sliced) {
        target.x += target.vx;
        target.y += target.vy;
        target.vy += target.gravity;
        target.angle += target.vRot;

        if (isTargetSliced(target, trail)) {
          target.sliced = true;
          slicedEvents.push({
            id: target.id,
            isBomb: target.isBomb,
            x: target.x,
            y: target.y,
            pts: target.pts,
            color: target.color,
            emoji: target.emoji,
            radius: target.radius,
            vx: target.vx,
            vy: target.vy,
            angle: target.angle,
          });
          target.halves = [
            {
              x: target.x - 10,
              y: target.y,
              vx: target.vx - 3,
              vy: target.vy - 2,
              angle: target.angle,
              vRot: -0.1,
              alpha: 1,
            },
            {
              x: target.x + 10,
              y: target.y,
              vx: target.vx + 3,
              vy: target.vy - 2,
              angle: target.angle,
              vRot: 0.1,
              alpha: 1,
            },
          ];
        }
      } else if (target.halves) {
        for (const h of target.halves) {
          h.x += h.vx;
          h.y += h.vy;
          h.vy += target.gravity;
          h.angle += h.vRot;
          h.alpha -= 0.025;
        }
      }

      if (target.y > canvasH + 60) {
        targets.splice(i, 1);
      }
    }

    self.postMessage({
      type: "tickResult",
      now,
      trail: trail.slice(),
      tip: currentTip,
      targets: targets.map((t) => ({
        id: t.id,
        x: t.x,
        y: t.y,
        radius: t.radius,
        emoji: t.emoji,
        color: t.color,
        isBomb: t.isBomb,
        sliced: t.sliced,
        angle: t.angle,
        halves: t.halves
          ? t.halves.map((h) => ({ ...h }))
          : null,
      })),
      slicedEvents,
      tipVelocity: smoothedTip
        ? Math.hypot(smoothedTip.vx, smoothedTip.vy)
        : 0,
    });
  }
};
