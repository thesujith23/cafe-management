/**
 * Motion for Finnegan.
 *
 * One `update(dt, …)` call per frame mutates the rig built by `foxModel.js`. Nothing here
 * touches React: the widget only tells it which state to be in, how loud the speech is, and
 * which gesture to play.
 *
 * Two layers sit on top of each other every frame:
 *   1. the state layer — idle, listening, thinking, speaking, happy;
 *   2. the gesture layer — short, cancellable beats (a wave, a nod, a hop, a tail wag).
 * Gestures are plain timers in a Map, each with its own envelope, so they can overlap the
 * state layer without a state machine and without ever leaving the rig stuck in a pose.
 *
 * States: idle → listening → thinking → speaking, plus a short `happy` reaction when the
 * guest pokes him. All of them layered over an idle base so he never looks frozen.
 */

const BLINK_MS = 130;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (from, to, amount) => from + (to - from) * amount;

const GESTURE_DURATIONS = {
  wave: 1.8,
  nod: 0.7,
  tilt: 1.3,
  hop: 0.62,
  tailwag: 1.5,
  giggle: 1.1,
  talk: 2.2,
  perk: 0.9,
};

// Repeats only while he is standing around waiting: each one is a small "still here" beat.
const IDLE_ROUTINE = ['tailwag', 'hop', 'tilt', 'wave', 'perk', 'giggle'];

export function createFoxAnimator(parts, { idleGestures: idleGesturesOption = true } = {}) {
  let idleGestures = idleGesturesOption;

  let time = 0;
  let state = 'idle';
  let amplitude = 0;
  let jaw = 0;
  let lookX = 0;
  let lookY = 0;
  let targetX = 0;
  let targetY = 0;

  let blinkCountdown = 1.6 + Math.random() * 2.4;
  let blinkRemaining = 0;
  let twitchCountdown = 3.5 + Math.random() * 3;
  let twitchRemaining = 0;
  let twitchSide = 1;
  let nod = 0;
  let happyUntil = 0;

  let helloCountdown = 1.1;
  let idleCountdown = 9 + Math.random() * 6;

  const channels = new Map();

  const start = (name, duration = GESTURE_DURATIONS[name] || 1) => {
    channels.set(name, { t: 0, dur: Math.max(0.2, Number(duration) || 1) });
  };

  // Fast attack, slower release: a wave should arrive and then settle, not pop.
  const envelope = (name) => {
    const channel = channels.get(name);
    if (!channel) return 0;
    const p = clamp(channel.t / channel.dur, 0, 1);
    return Math.min(1, p / 0.16) * Math.min(1, (1 - p) / 0.2);
  };

  const phaseOf = (name) => {
    const channel = channels.get(name);
    return channel ? clamp(channel.t / channel.dur, 0, 1) : 0;
  };

  const gesture = (name, duration) => {
    if (!name || !GESTURE_DURATIONS[name]) return;
    start(name, duration);
    // The ears join in on the friendly ones, so a wave reads as the whole fox, not one arm.
    if (name === 'wave' || name === 'giggle') start('perk', 1.1);
  };

  const setIdleGestures = (next) => {
    idleGestures = Boolean(next);
  };

  const setState = (next) => {
    if (!next || next === state) return;
    state = next;
    if (next === 'speaking') nod = 0.6;
    if (next === 'thinking') start('tilt', 1.1);
  };

  const setAmplitude = (value) => {
    amplitude = clamp(Number(value) || 0, 0, 1);
  };

  // pointer: -1..1 in both axes, already normalised by the stage.
  const setPointer = (x, y) => {
    targetX = clamp(Number(x) || 0, -1, 1);
    targetY = clamp(Number(y) || 0, -1, 1);
  };

  const poke = () => {
    state = 'happy';
    happyUntil = time + 1.1;
    gesture('giggle');
    gesture('tailwag', 1.8);
  };

  const update = (dt) => {
    const step = clamp(dt, 0, 0.05);
    time += step;

    // ---- gesture timers ----
    channels.forEach((channel, name) => {
      channel.t += step;
      if (channel.t >= channel.dur) channels.delete(name);
    });

    const wave = envelope('wave');
    const nodEnv = envelope('nod');
    const tilt = envelope('tilt');
    const hop = envelope('hop');
    const wag = envelope('tailwag');
    const giggle = envelope('giggle');
    const perk = envelope('perk');
    const talk = envelope('talk');

    // ---- eyes ----
    blinkCountdown -= step;
    if (blinkCountdown <= 0 && blinkRemaining <= 0) {
      blinkRemaining = BLINK_MS / 1000;
      blinkCountdown = 2.2 + Math.random() * 3.4;
    }
    let blinkLid = 1;
    if (blinkRemaining > 0) {
      blinkRemaining -= step;
      const progress = 1 - Math.max(0, blinkRemaining) / (BLINK_MS / 1000);
      blinkLid = 1 - Math.sin(clamp(progress, 0, 1) * Math.PI) * 0.92;
    }
    // A giggle closes the eyes into happy little crescents instead of a full blink.
    const lid = Math.min(blinkLid, 1 - giggle * 0.62);
    parts.eyeL.scale.y = lid;
    parts.eyeR.scale.y = lid;

    // ---- ears ----
    twitchCountdown -= step;
    if (twitchCountdown <= 0 && twitchRemaining <= 0) {
      twitchRemaining = 0.28;
      twitchSide = Math.random() > 0.5 ? 1 : -1;
      twitchCountdown = 3 + Math.random() * 4.5;
    }
    let twitch = 0;
    if (twitchRemaining > 0) {
      twitchRemaining -= step;
      twitch = Math.sin((1 - twitchRemaining / 0.28) * Math.PI) * 0.26;
    }

    // ---- gaze ----
    lookX = lerp(lookX, targetX, 1 - Math.pow(0.0016, step));
    lookY = lerp(lookY, targetY, 1 - Math.pow(0.0016, step));

    const idleBreath = Math.sin(time * 1.7) * 0.012;
    const happy = state === 'happy';

    // ---- body ----
    const bodyBob = happy
      ? Math.abs(Math.sin(time * 5.2)) * 0.05
      : Math.sin(time * 1.7 + 0.4) * 0.006;
    parts.body.scale.set(1 + idleBreath * 0.35, 1 + idleBreath, 1 + idleBreath * 0.35);
    parts.body.position.y = bodyBob + Math.sin(phaseOf('hop') * Math.PI) * 0.11 * hop;
    parts.body.rotation.z = Math.sin(time * 0.9) * 0.012 + giggle * Math.sin(time * 9) * 0.02;
    parts.body.rotation.y = lookX * 0.05;

    // ---- head ----
    const thinking = state === 'thinking';
    const listening = state === 'listening';
    let headX = lookY * 0.16;
    let headY = lookX * 0.34;
    let headZ = Math.sin(time * 0.7) * 0.02;

    if (thinking) {
      headX -= 0.1;
      headZ += 0.14;
      headY *= 0.5;
    }
    if (listening) {
      headX += 0.045;
      headZ *= 0.4;
    }
    if (state === 'speaking') {
      nod = Math.max(0, nod - step * 1.6);
      headX += Math.sin(time * 7.4) * 0.014 * (0.4 + amplitude) - nod * 0.07;
      headZ += Math.sin(time * 3.6) * 0.012;
    }
    if (happy) {
      headZ += Math.sin(time * 6) * 0.05;
    }

    // ---- gesture: head ----
    if (tilt > 0) {
      headZ += tilt * 0.3;
      headX -= tilt * 0.05;
    }
    if (nodEnv > 0) {
      // Two small nods per gesture, both fading with the envelope.
      headX += Math.sin(phaseOf('nod') * Math.PI * 4) * 0.09 * nodEnv;
    }
    if (wave > 0) headZ += wave * 0.06;
    if (talk > 0) headX += Math.sin(time * 3.1) * 0.02 * talk;

    parts.head.rotation.x = headX;
    parts.head.rotation.y = headY;
    parts.head.rotation.z = headZ;
    parts.head.position.y = 1.34 + Math.sin(time * 1.7 + 0.9) * 0.008;

    // ---- ears ----
    const earPerk = perk + (listening || thinking ? 0.1 : 0) + wave * 0.08;
    parts.earL.rotation.z = -0.2 - earPerk - (twitchSide === -1 ? twitch : 0) + tilt * 0.14;
    parts.earR.rotation.z = 0.2 + earPerk + (twitchSide === 1 ? twitch : 0) - tilt * 0.06;
    parts.earL.rotation.x = -0.08 - (thinking ? 0.16 : 0) - giggle * 0.1;
    parts.earR.rotation.x = -0.08 - (thinking ? 0.16 : 0) - giggle * 0.1;

    // ---- jaw / speech ----
    // The mouth flaps with real audio when a voice plays, and with the `talk` gesture when
    // the fox is muted, so he still looks like he is answering.
    const talkJaw = talk * (0.1 + 0.15 * Math.abs(Math.sin(time * 10.5)));
    const voiceJaw = state === 'speaking' ? clamp(amplitude * 0.62, 0, 0.4) : 0;
    const jawTarget = Math.max(talkJaw, voiceJaw);
    jaw = lerp(jaw, jawTarget, jawTarget > jaw ? 0.42 : 0.22);
    parts.jaw.rotation.x = jaw;
    parts.jaw.position.y = -0.1 - jaw * 0.02;

    // ---- brows ----
    const browLift = (listening ? 0.012 : 0) + tilt * 0.018 - giggle * 0.006;
    parts.browL.position.y = 0.158 + browLift + Math.sin(time * 1.3) * 0.002;
    parts.browR.position.y = 0.158 + browLift + Math.sin(time * 1.3 + 0.6) * 0.002;

    // ---- tail ----
    const tailAmp = (happy ? 0.22 : 0.13) + wag * 0.14;
    const tailSpeed = (happy ? 7 : 1.15) + wag * 6;
    parts.tail.rotation.z = 0.08 + Math.sin(time * tailSpeed) * tailAmp;
    parts.tail.rotation.x = 0.5 + Math.sin(time * 0.8) * 0.05;
    parts.tailSegs.forEach((seg, index) => {
      if (index === 0) return;
      seg.rotation.y = Math.sin(time * tailSpeed - index * 0.55) * (tailAmp * 0.85);
      seg.rotation.x = Math.sin(time * 0.9 - index * 0.4) * 0.05;
    });

    // ---- arms ----
    const speakGesture = state === 'speaking' ? Math.sin(time * 4.2) * 0.05 * (0.4 + amplitude) : 0;
    // The right paw holds the mug, so the wave (and every flourish) lives on the left arm.
    const waveSwing = Math.sin(time * 12) * 0.25 * wave;
    parts.armL.rotation.z = -0.72 - Math.sin(time * 1.2) * 0.05 - speakGesture - wave * 1.5 - waveSwing;
    parts.armL.rotation.x = Math.sin(time * 0.85) * 0.05 - wave * 0.12;
    parts.foreL.rotation.x = -0.5
      + Math.sin(time * 1.4 + 0.5) * 0.06
      + speakGesture * 0.8
      - wave * 0.55
      - waveSwing * 0.4;
    parts.armR.rotation.z = 0.5 + Math.sin(time * 1.05) * 0.035 + speakGesture * 0.5;
    parts.armR.rotation.x = Math.sin(time * 0.95 + 0.7) * 0.04;
    parts.foreR.rotation.x = -1.3 + Math.sin(time * 1.15) * 0.05;

    // ---- steam ----
    parts.steamBits.forEach((bit, index) => {
      const phase = ((time * 0.42 + index / parts.steamBits.length) % 1);
      const rise = phase * 0.16;
      bit.position.set(Math.sin(phase * 5 + index) * 0.025, 0.02 + rise, Math.cos(phase * 4 + index) * 0.02);
      const scale = 0.028 + phase * 0.03;
      bit.scale.set(scale, scale * 1.2, scale);
      bit.material.opacity = Math.sin(phase * Math.PI) * 0.55;
    });

    // ---- idle beats ----
    // A hello wave a second after he appears, then a small gesture every 8–16 s so a fox
    // standing quietly on the page still feels alive.
    if (idleGestures && (state === 'idle' || state === 'listening')) {
      if (helloCountdown > 0) {
        helloCountdown -= step;
        if (helloCountdown <= 0) gesture('wave');
      }
      idleCountdown -= step;
      if (idleCountdown <= 0) {
        gesture(IDLE_ROUTINE[Math.floor(Math.random() * IDLE_ROUTINE.length)]);
        idleCountdown = 8 + Math.random() * 8;
      }
    }

    if (happy && happyUntil && time > happyUntil) {
      state = 'idle';
      happyUntil = 0;
    }
  };

  return { update, setState, setAmplitude, setPointer, poke, gesture, setIdleGestures, getState: () => state };
}
