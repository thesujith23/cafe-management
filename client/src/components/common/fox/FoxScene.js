import { buildFox } from './foxModel.js';
import { createFoxAnimator } from './foxAnimator.js';

/**
 * Mounts the fox on a canvas. Returns null when WebGL or the vendored three.js is missing,
 * so the widget can fall back to the flat illustration without the chat breaking.
 *
 * three.js is the copy already loaded from /vendor/three.min.js (see AGENTS.md) — do not
 * import 'three' here, it is not an npm dependency.
 */

const reducedMotion = () => (
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

export function createFoxStage(canvas, {
  amplitudeRef,
  framing = 'full',
  trackPointer = true,
  idleGestures = true,
} = {}) {
  if (!canvas || typeof window === 'undefined') return null;
  const THREE = window.THREE;
  if (!THREE) return null;

  // This three.js build still defaults to legacy colour management, which treats hex
  // colours as linear and washes the orange coat out to beige. Opt into managed colour
  // before any material is created.
  if (THREE.ColorManagement) {
    if ('enabled' in THREE.ColorManagement) THREE.ColorManagement.enabled = true;
    else if ('legacyMode' in THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
  } catch {
    return null;
  }

  renderer.setClearAlpha(0);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if ('outputEncoding' in renderer && THREE.sRGBEncoding) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }
  // Filmic tone mapping keeps the orange coat saturated instead of clipping it to yellow
  // under the warm key light.
  if (THREE.ACESFilmicToneMapping !== undefined && 'toneMapping' in renderer) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
  }

  // Four crops of the same character: the whole barista standing free on the page, the full
  // barista, a head-and-shoulders bust for the chat panel, and a tight portrait.
  // `widen` is only for the head crops, where a narrow canvas would cut the shoulders off.
  const FRAMINGS = {
    stand: { position: [0, 1.0, 4.05], target: [0, 0.98, 0], fov: 32, widen: false },
    full: { position: [0, 1.42, 4.0], target: [0, 1.02, 0], fov: 30, widen: true },
    // Pulled back a little so the ear tips and a raised waving paw stay inside the crop.
    bust: { position: [0, 1.3, 2.75], target: [0, 1.18, 0], fov: 30, widen: true },
    portrait: { position: [0, 1.5, 2.35], target: [0, 1.43, 0], fov: 32, widen: true },
  };
  const view = FRAMINGS[framing] || FRAMINGS.full;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(view.fov, 1, 0.1, 20);
  camera.position.set(...view.position);
  camera.lookAt(...view.target);

  scene.add(new THREE.HemisphereLight(0xfff0d6, 0x5a3f2a, 0.55));
  const key = new THREE.DirectionalLight(0xfff4e2, 1.05);
  key.position.set(2.4, 3.4, 3.2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffd7ac, 0.28);
  fill.position.set(-3, 1.4, 2.2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffa768, 0.42);
  rim.position.set(0.6, 2.2, -3.2);
  scene.add(rim);

  const fox = buildFox(THREE);
  scene.add(fox.root);

  const animator = createFoxAnimator(fox.parts, { idleGestures });

  let frame = 0;
  let last = 0;
  let running = false;
  let staticRender = false;

  const resize = () => {
    const width = Math.max(1, canvas.clientWidth || canvas.parentElement?.clientWidth || 240);
    const height = Math.max(1, canvas.clientHeight || canvas.parentElement?.clientHeight || 210);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Narrow stages crop the shoulders; widen the field of view slightly instead. The
    // standing crop deliberately keeps its lens, so a tall button does not shrink him.
    camera.fov = view.widen && width / height < 0.85 ? view.fov + 4 : view.fov;
    camera.updateProjectionMatrix();
  };

  const tick = (now) => {
    if (!running) return;
    frame = window.requestAnimationFrame(tick);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    animator.setAmplitude(amplitudeRef?.current ?? 0);
    animator.update(dt);
    renderer.render(scene, camera);
  };

  const start = () => {
    if (running) return;
    resize();
    if (reducedMotion()) {
      // One still, well-lit frame: the fox is present but nothing moves.
      animator.update(0.016);
      renderer.render(scene, camera);
      staticRender = true;
      return;
    }
    staticRender = false;
    running = true;
    last = 0;
    frame = window.requestAnimationFrame(tick);
  };

  const stop = () => {
    running = false;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  };

  let observer = null;
  if (typeof window.ResizeObserver === 'function') {
    observer = new window.ResizeObserver(() => {
      if (!running && !staticRender) return;
      resize();
      if (staticRender) renderer.render(scene, camera);
    });
    observer.observe(canvas.parentElement || canvas);
  } else {
    window.addEventListener('resize', resize);
  }

  const onVisibility = () => {
    if (document.hidden) stop();
    else if (!reducedMotion()) start();
  };
  document.addEventListener('visibilitychange', onVisibility);

  // The fox looks at the pointer wherever it is on the page, for every framing.
  const onPointerMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    animator.setPointer(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      ((event.clientY - rect.top) / rect.height) * 2 - 1,
    );
  };
  if (trackPointer) window.addEventListener('pointermove', onPointerMove, { passive: true });

  const dispose = () => {
    stop();
    document.removeEventListener('visibilitychange', onVisibility);
    if (trackPointer) window.removeEventListener('pointermove', onPointerMove);
    if (observer) observer.disconnect();
    else window.removeEventListener('resize', resize);
    scene.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        if (!material) return;
        if (material.map) material.map.dispose();
        material.dispose();
      });
    });
    renderer.dispose();
  };

  return {
    start,
    stop,
    dispose,
    resize,
    setState: (state) => animator.setState(state),
    setPointer: (x, y) => animator.setPointer(x, y),
    gesture: (name, duration) => animator.gesture(name, duration),
    setIdleGestures: (next) => animator.setIdleGestures(next),
    poke: () => animator.poke(),
  };
}
