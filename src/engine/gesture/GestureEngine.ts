import { HandLandmark, GestureType, GestureData } from "@/types";

// GestureResult is the same as GestureData
export type GestureResult = GestureData;

interface Sample { x: number; y: number; z: number; t: number; }

interface SwipeTracker {
  samples: Sample[];
  lastFire: number;
  cooldown: number;
}

interface PinchTracker {
  active: boolean;
  start: number;
  holdTime: number;
  lastDist: number;
}

interface DepthTracker {
  history: Sample[];
  lastEvent: string;
  lastEventTime: number;
}

interface HoldTracker {
  history: Sample[];
  holdStart: number;
  holding: boolean;
}

interface MediaPipeGesture {
  name: string;
  score: number;
}

export class GestureEngine {
  // Smoothed positions
  private sw = { x: 0.5, y: 0.5, z: 0 };
  private st = { x: 0.5, y: 0.5, z: 0 };
  private si = { x: 0.5, y: 0.5, z: 0 };

  private swipe: SwipeTracker = { samples: [], lastFire: 0, cooldown: 300 };
  private pinch: PinchTracker = { active: false, start: 0, holdTime: 0, lastDist: 1 };
  private depth: DepthTracker = { history: [], lastEvent: "", lastEventTime: 0 };
  private hold: HoldTracker = { history: [], holdStart: 0, holding: false };

  private mpGestureDebounce: string = "";
  private mpGestureCount: number = 0;

  private readonly SMOOTH = 0.3;
  private readonly SWIPE_COOLDOWN = 300;
  private readonly SWIPE_MIN_SPEED = 0.3;
  private readonly SWIPE_SAMPLES = 6;
  private readonly SWIPE_MAX_AGE = 350;
  private readonly PINCH_ON = 0.07;
  private readonly PINCH_OFF = 0.12;
  private readonly DEPTH_DELTA = 0.06;
  private readonly DEPTH_COOLDOWN = 500;
  private readonly HOLD_STILL = 0.004;
  private readonly HOLD_MIN = 250;

  process(
    lm: HandLandmark[],
    now: number,
    mpGesture: MediaPipeGesture | null
  ): GestureResult {
    if (!lm || lm.length < 21) return this.empty(now);

    // Smooth
    const wrist = lm[0], thumb = lm[4], index = lm[8];
    const middle = lm[12], pinky = lm[20];
    this.sw = this.sm(this.sw, wrist);
    this.st = this.sm(this.st, thumb);
    this.si = this.sm(this.si, index);

    // Pinch distance
    const pd = Math.hypot(this.si.x - this.st.x, this.si.y - this.st.y, this.si.z - this.st.z);

    // Hand openness
    const palmSz = Math.hypot(this.sw.x - middle.x, this.sw.y - middle.y);
    const spread = palmSz > 0.01 ? Math.hypot(index.x - pinky.x, index.y - pinky.y) / palmSz : 0;
    const ext = palmSz > 0.01 ? Math.hypot(middle.x - this.sw.x, middle.y - this.sw.y) / palmSz : 0;
    const openness = Math.min((spread + ext) / 2, 1);

    // Track
    this.swipe.samples.push({ x: this.sw.x, y: this.sw.y, z: this.sw.z, t: now });
    while (this.swipe.samples.length > 0 && now - this.swipe.samples[0].t > this.SWIPE_MAX_AGE) this.swipe.samples.shift();
    this.depth.history.push({ x: this.sw.x, y: this.sw.y, z: this.sw.z, t: now });
    while (this.depth.history.length > 20) this.depth.history.shift();
    this.hold.history.push({ x: this.sw.x, y: this.sw.y, z: this.sw.z, t: now });
    while (this.hold.history.length > 30) this.hold.history.shift();

    // ========== CLASSIFICATION ==========

    let type: GestureType = "none";
    let conf = 0;
    let speed = 0;
    let vel = { x: 0, y: 0 };

    // 1. MediaPipe recognized gesture (highest priority for static poses)
    if (mpGesture && mpGesture.score > 0.65) {
      const mapped = this.mapMediaPipeGesture(mpGesture.name);
      if (mapped) {
        // Debounce: require 3 consecutive frames of same gesture
        if (mapped === this.mpGestureDebounce) {
          this.mpGestureCount++;
        } else {
          this.mpGestureDebounce = mapped;
          this.mpGestureCount = 1;
        }

        if (this.mpGestureCount >= 3) {
          type = mapped;
          conf = mpGesture.score;
        }
      }
    } else {
      this.mpGestureDebounce = "";
      this.mpGestureCount = 0;
    }

    // 2. Swipe (continuous — MediaPipe doesn't detect this)
    if (type === "none" || type === "idle") {
      const sw = this.detectSwipe(now);
      if (sw) {
        type = sw.type;
        conf = sw.conf;
        speed = sw.speed;
        vel = sw.vel;
        this.mpGestureDebounce = "";
        this.mpGestureCount = 0;
      }
    }

    // 3. Pinch (continuous)
    if (type === "none" || type === "idle") {
      const pc = this.detectPinch(pd, now);
      if (pc) {
        type = pc.type;
        conf = pc.conf;
        this.mpGestureDebounce = "";
        this.mpGestureCount = 0;
      }
    }

    // 4. Depth pull/push (continuous)
    if (type === "none" || type === "idle") {
      const dp = this.detectDepth(now);
      if (dp) {
        type = dp.type;
        conf = dp.conf;
        this.mpGestureDebounce = "";
        this.mpGestureCount = 0;
      }
    }

    // 5. Hold (continuous)
    if (type === "none" || type === "idle") {
      const h = this.detectHold(now);
      if (h) {
        type = "palm_still";
        conf = h;
        this.mpGestureDebounce = "";
        this.mpGestureCount = 0;
      }
    }

    // 6. Fallback to MediaPipe if still idle
    if (type === "none" && mpGesture && mpGesture.score > 0.5) {
      const mapped = this.mapMediaPipeGesture(mpGesture.name);
      if (mapped) {
        type = mapped;
        conf = mpGesture.score * 0.8;
      }
    }

    // 7. Final fallback
    if (type === "none") {
      type = openness > 0.6 ? "open_hand" : openness < 0.2 ? "closed_fist" : "idle";
      conf = 0.4;
    }

    return {
      type,
      confidence: conf,
      velocity: vel,
      speed,
      pinchDistance: pd,
      handOpenness: openness,
      palmPosition: { x: this.sw.x, y: this.sw.y, z: this.sw.z },
      depth: wrist.z,
      isHolding: this.hold.holding,
      timestamp: now,
    };
  }

  // ---- MediaPipe gesture mapping ----
  private mapMediaPipeGesture(name: string): GestureType | null {
    const map: Record<string, GestureType> = {
      "Open_Palm": "open_hand",
      "Closed_Fist": "closed_fist",
      "Pointing_Up": "point",
      "Thumb_Up": "thumbs_up",
      "Thumb_Down": "point", // reuse
      "Victory": "victory",
      "ILoveYou": "iloveyou",
    };
    return map[name] || null;
  }

  // ---- Swipe ----
  private detectSwipe(now: number): { type: GestureType; conf: number; speed: number; vel: { x: number; y: number } } | null {
    const s = this.swipe;
    if (s.samples.length < this.SWIPE_SAMPLES) return null;
    if (now - s.lastFire < s.cooldown) return null;

    const r = s.samples.slice(-10);
    const o = r[0], n = r[r.length - 1];
    const dt = (n.t - o.t) / 1000;
    if (dt <= 0) return null;

    const dx = n.x - o.x;
    const dy = n.y - o.y;
    const sx = Math.abs(dx / dt);
    const sy = Math.abs(dy / dt);

    // Determine dominant direction
    const isHorizontal = sx > sy * 1.2;
    const isVertical = sy > sx * 1.2;
    const dominantSpeed = Math.max(sx, sy);

    if (dominantSpeed < this.SWIPE_MIN_SPEED) return null;
    if (!isHorizontal && !isVertical) return null;

    // Linearity check
    const mx = (o.x + n.x) / 2, my = (o.y + n.y) / 2;
    let maxDev = 0;
    for (const p of r) {
      maxDev = Math.max(maxDev, Math.hypot(p.x - mx, p.y - my));
    }
    const lin = 1 - Math.min(maxDev / (dominantSpeed * dt + 0.01), 1);
    if (lin < 0.4) return null;

    let type: GestureType;

    if (isHorizontal) {
      if (sx > 1.5) type = dx > 0 ? "fast_scroll_left" : "fast_scroll_right";
      else if (sx > 0.7) type = dx > 0 ? "swipe_left" : "swipe_right";
      else type = dx > 0 ? "slow_scroll_left" : "slow_scroll_right";
    } else {
      // Vertical: camera is mirrored, y increases downward
      type = dy > 0 ? "swipe_up" : "swipe_down";
    }

    s.lastFire = now;
    s.samples = [];

    return { type, conf: Math.min(dominantSpeed / 1.5, 1) * lin, speed: dominantSpeed, vel: { x: dx / dt, y: dy / dt } };
  }

  // ---- Pinch ----
  private detectPinch(d: number, now: number): { type: GestureType; conf: number } | null {
    const on = d < this.PINCH_ON;
    const off = d > this.PINCH_OFF;

    if (on && !this.pinch.active) {
      this.pinch.active = true;
      this.pinch.start = now;
      this.pinch.holdTime = 0;
      return { type: "pinch_start", conf: 0.9 };
    }

    if (this.pinch.active && on) {
      this.pinch.holdTime = now - this.pinch.start;
      if (this.pinch.holdTime > 200) return { type: "pinch_hold", conf: Math.min(this.pinch.holdTime / 1000, 1) };
      return { type: "pinch_start", conf: 0.8 };
    }

    if (this.pinch.active && off) {
      this.pinch.active = false;
      return { type: "pinch_release", conf: 0.85 };
    }

    return null;
  }

  // ---- Depth ----
  private detectDepth(now: number): { type: GestureType; conf: number } | null {
    if (now - this.depth.lastEventTime < this.DEPTH_COOLDOWN) return null;
    const h = this.depth.history;
    if (h.length < 8) return null;

    const r = h.slice(-10);
    const dz = r[r.length - 1].z - r[0].z;

    if (Math.abs(dz) < this.DEPTH_DELTA) return null;

    if (dz < -this.DEPTH_DELTA) {
      this.depth.lastEvent = "pull";
      this.depth.lastEventTime = now;
      this.depth.history = [];
      return { type: "pull_toward", conf: Math.min(Math.abs(dz) / 0.12, 1) };
    }
    if (dz > this.DEPTH_DELTA) {
      this.depth.lastEvent = "push";
      this.depth.lastEventTime = now;
      this.depth.history = [];
      return { type: "push_away", conf: Math.min(Math.abs(dz) / 0.12, 1) };
    }

    return null;
  }

  // ---- Hold ----
  private detectHold(now: number): number | null {
    const h = this.hold.history;
    if (h.length < 10) return null;

    const r = h.slice(-15);
    const mov = Math.hypot(
      r[r.length - 1].x - r[0].x,
      r[r.length - 1].y - r[0].y,
      r[r.length - 1].z - r[0].z
    );
    const dt = (r[r.length - 1].t - r[0].t) / 1000;
    if (dt <= 0) return null;

    if (mov / dt < this.HOLD_STILL) {
      if (!this.hold.holding) {
        this.hold.holdStart = now;
        this.hold.holding = true;
      }
      if (now - this.hold.holdStart > this.HOLD_MIN) {
        return Math.min((now - this.hold.holdStart) / 1000, 1);
      }
    } else {
      this.hold.holding = false;
    }

    return null;
  }

  // ---- Smooth ----
  private sm(p: { x: number; y: number; z: number }, c: { x: number; y: number; z: number }) {
    const a = this.SMOOTH;
    return { x: p.x + a * (c.x - p.x), y: p.y + a * (c.y - p.y), z: p.z + a * (c.z - p.z) };
  }

  private empty(t: number): GestureResult {
    return {
      type: "none", confidence: 0, velocity: { x: 0, y: 0 }, speed: 0,
      pinchDistance: 1, handOpenness: 0, palmPosition: { x: 0.5, y: 0.5, z: 0 },
      depth: 0, isHolding: false, timestamp: t,
    };
  }

  reset(): void {
    this.swipe = { samples: [], lastFire: 0, cooldown: this.SWIPE_COOLDOWN };
    this.pinch = { active: false, start: 0, holdTime: 0, lastDist: 1 };
    this.depth = { history: [], lastEvent: "", lastEventTime: 0 };
    this.hold = { history: [], holdStart: 0, holding: false };
    this.mpGestureDebounce = "";
    this.mpGestureCount = 0;
  }
}
