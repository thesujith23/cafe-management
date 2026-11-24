/**
 * Finnegan — the café fox.
 *
 * Built from primitives at runtime rather than loaded from a model file, so the widget adds
 * no download and the apron, mug, jaw and ears can all be posed by the animator. Everything
 * faces +Z (towards the camera) and stands on y = 0.
 *
 * The rig names in `parts` are what `foxAnimator.js` moves. Do not rename them without
 * updating the animator.
 */

const PALETTE = {
  coat: 0xe8792c,
  coatDeep: 0xbd5a1c,
  coatShade: 0xc9631f,
  cream: 0xf3dcba,
  creamDeep: 0xe6cba4,
  paw: 0x7a3d1a,
  apron: 0x7d4f34,
  apronDark: 0x5e3a25,
  nose: 0x241610,
  iris: 0x3a1f0c,
  mug: 0xe8d3ab,
  coffee: 0x5a3519,
  blush: 0xdc8355,
};

const shadowTexture = (THREE) => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(48, 30, 16, 0.42)');
  grad.addColorStop(0.55, 'rgba(48, 30, 16, 0.16)');
  grad.addColorStop(1, 'rgba(48, 30, 16, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  if ('colorSpace' in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

export function buildFox(THREE) {
  const material = (color, extra = {}) => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.02,
    ...extra,
  });

  const mats = {
    coat: material(PALETTE.coat, { roughness: 0.66 }),
    coatDeep: material(PALETTE.coatDeep, { roughness: 0.7 }),
    coatShade: material(PALETTE.coatShade, { roughness: 0.72 }),
    cream: material(PALETTE.cream, { roughness: 0.82 }),
    creamDeep: material(PALETTE.creamDeep, { roughness: 0.84 }),
    paw: material(PALETTE.paw, { roughness: 0.64 }),
    apron: material(PALETTE.apron, { roughness: 0.88 }),
    apronDark: material(PALETTE.apronDark, { roughness: 0.88 }),
    nose: material(PALETTE.nose, { roughness: 0.28 }),
    eyeWhite: material(0xfffaf0, { roughness: 0.18 }),
    iris: material(PALETTE.iris, { roughness: 0.14 }),
    pupil: material(0x160d06, { roughness: 0.12 }),
    glint: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    mug: material(PALETTE.mug, { roughness: 0.4 }),
    coffee: material(PALETTE.coffee, { roughness: 0.32 }),
    blush: material(PALETTE.blush, { roughness: 0.9, transparent: true, opacity: 0.45 }),
    steam: new THREE.MeshStandardMaterial({
      color: 0xfff8ea, roughness: 1, transparent: true, opacity: 0.5, depthWrite: false,
    }),
  };

  // A unit sphere, scaled into an ellipsoid. Smooth normals come from the sphere geometry,
  // which is what keeps the body reading as one soft form rather than a pile of balls.
  const ball = (mat, [rx, ry, rz], [x, y, z], seg = 32) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.72)), mat);
    mesh.scale.set(rx, ry, rz);
    mesh.position.set(x, y, z);
    return mesh;
  };

  const root = new THREE.Group();
  root.name = 'fox';

  const body = new THREE.Group();
  body.name = 'body';
  root.add(body);

  // ---- torso ---------------------------------------------------------------
  // A tapered chest over a narrower waist, blended by three overlapping ellipsoids.
  body.add(ball(mats.coat, [0.315, 0.4, 0.265], [0, 0.9, 0]));
  body.add(ball(mats.coat, [0.275, 0.26, 0.24], [0, 0.62, 0.01]));
  body.add(ball(mats.coatShade, [0.25, 0.24, 0.2], [0, 0.42, -0.01]));

  // Cream chest fur, layered so the bib has a soft ragged edge above the apron.
  body.add(ball(mats.cream, [0.22, 0.19, 0.12], [0, 1.06, 0.14], 30));
  body.add(ball(mats.cream, [0.18, 0.16, 0.1], [0, 0.98, 0.2], 28));

  // ---- legs ---------------------------------------------------------------
  [-1, 1].forEach((side) => {
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.098, 0.17, 8, 18), mats.coatShade);
    thigh.position.set(side * 0.145, 0.33, 0.005);
    thigh.rotation.z = side * -0.05;
    body.add(thigh);

    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.08, 8, 16), mats.paw);
    shin.position.set(side * 0.155, 0.16, 0.01);
    body.add(shin);

    // Foot: a flattened pad with three little toes, so it is not a bare ball.
    const foot = ball(mats.paw, [0.095, 0.055, 0.135], [side * 0.155, 0.05, 0.055], 24);
    body.add(foot);
    [-0.045, 0, 0.045].forEach((offset) => {
      body.add(ball(mats.paw, [0.032, 0.03, 0.042], [side * 0.155 + offset, 0.048, 0.16], 16));
    });
  });

  // ---- tail ---------------------------------------------------------------
  // Six short segments instead of four long ones: the curve stays smooth at every sway angle.
  const tail = new THREE.Group();
  tail.position.set(-0.22, 0.46, -0.12);
  tail.rotation.set(0.5, 1.1, 0.08);
  body.add(tail);
  const tailSegs = [];
  let parent = tail;
  const tailPlan = [
    [0.13, 0.14, 0.17], [0.155, 0.16, 0.18], [0.165, 0.17, 0.18],
    [0.16, 0.165, 0.175], [0.14, 0.145, 0.16], [0.105, 0.11, 0.13],
  ];
  tailPlan.forEach((scale, index) => {
    const pivot = new THREE.Group();
    pivot.position.set(0, 0, index === 0 ? 0 : -0.115);
    parent.add(pivot);
    const isTip = index >= tailPlan.length - 1;
    const seg = ball(isTip ? mats.cream : mats.coat, scale, [0, 0, -0.075], 26);
    pivot.add(seg);
    tailSegs.push(pivot);
    parent = pivot;
  });

  // ---- apron --------------------------------------------------------------
  const apronShape = new THREE.Shape();
  apronShape.moveTo(-0.155, 0);
  apronShape.lineTo(0.155, 0);
  apronShape.lineTo(0.235, -0.28);
  apronShape.lineTo(0.25, -0.52);
  apronShape.quadraticCurveTo(0, -0.62, -0.25, -0.52);
  apronShape.lineTo(-0.235, -0.28);
  apronShape.closePath();
  const apron = new THREE.Mesh(
    new THREE.ExtrudeGeometry(apronShape, {
      depth: 0.028, bevelEnabled: true, bevelSize: 0.014, bevelThickness: 0.014, bevelSegments: 3, curveSegments: 12,
    }),
    mats.apron,
  );
  apron.position.set(0, 1.1, 0.3);
  apron.rotation.x = -0.05;
  body.add(apron);

  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.012), mats.apronDark);
  pocket.position.set(0, 0.76, 0.34);
  body.add(pocket);
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.011, 0.011), mats.apronDark);
  seam.position.set(0, 0.9, 0.336);
  body.add(seam);

  // Neck strap and waist ties.
  [-1, 1].forEach((side) => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(side * 0.15, 1.1, 0.31),
      new THREE.Vector3(side * 0.215, 1.23, 0.14),
      new THREE.Vector3(side * 0.175, 1.19, -0.12),
    );
    const strap = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.019, 8, false), mats.apronDark);
    body.add(strap);
  });

  // ---- arms ---------------------------------------------------------------
  const makeArm = (side, { upperRotZ, foreRotX, foreRotZ }) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.28, 1.02, 0.05);
    arm.rotation.set(0, 0, upperRotZ);
    body.add(arm);

    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.11, 8, 16), mats.coat);
    upper.position.y = -0.11;
    arm.add(upper);

    const fore = new THREE.Group();
    fore.position.y = -0.19;
    fore.rotation.set(foreRotX, 0, foreRotZ ?? 0);
    arm.add(fore);

    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.08, 8, 16), mats.coat);
    lower.position.y = -0.07;
    fore.add(lower);

    // Paw with three soft fingers instead of one dark sphere.
    const hand = ball(mats.paw, [0.07, 0.062, 0.078], [0, -0.15, 0.012], 22);
    fore.add(hand);
    [-0.032, 0, 0.032].forEach((offset) => {
      fore.add(ball(mats.paw, [0.024, 0.022, 0.034], [offset, -0.185, 0.03], 14));
    });

    return { arm, fore, hand };
  };

  // A positive z rotation swings an arm outwards on the right, negative on the left.
  const rightArm = makeArm(1, { upperRotZ: 0.5, foreRotX: -1.3, foreRotZ: 0.1 });
  const leftArm = makeArm(-1, { upperRotZ: -0.72, foreRotX: -0.5, foreRotZ: -0.1 });

  // The cup is set in the body, upright, where the right hand meets it. Parenting it to the
  // forearm made it tumble with the elbow, which no amount of counter-rotation fixed.
  const mug = new THREE.Group();
  mug.position.set(0.39, 0.82, 0.255);
  mug.scale.setScalar(1.28);
  body.add(mug);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.078, 0.15, 28), mats.mug);
  mug.add(cup);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.086, 28), mats.coffee);
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.076;
  mug.add(coffee);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.015, 10, 22, Math.PI * 1.45), mats.mug);
  handle.position.set(0.092, 0.004, 0);
  handle.rotation.set(Math.PI / 2, 0, -0.4);
  mug.add(handle);
  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.135, 0.011, 30), mats.mug);
  saucer.position.y = -0.082;
  mug.add(saucer);

  const steam = new THREE.Group();
  steam.position.set(0, 0.1, 0);
  mug.add(steam);
  const steamBits = [];
  for (let i = 0; i < 3; i += 1) {
    const bit = ball(mats.steam, [0.03, 0.03, 0.03], [0, 0, 0], 12);
    steam.add(bit);
    steamBits.push(bit);
  }

  // ---- head ---------------------------------------------------------------
  const head = new THREE.Group();
  head.position.set(0, 1.34, 0.01);
  root.add(head);

  // Neck, so the head is not balanced on a gap.
  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.05, 8, 18), mats.coat);
  neck.position.y = -0.16;
  head.add(neck);

  // Cranium: wider at the cheeks, rounded on top.
  head.add(ball(mats.coat, [0.335, 0.315, 0.3], [0, 0.01, 0], 44));
  head.add(ball(mats.coatShade, [0.28, 0.24, 0.24], [0, 0.09, -0.06], 32));

  // Cheek fur: two soft lobes plus a small spike each, angled back like the reference art.
  const cheekL = ball(mats.cream, [0.085, 0.072, 0.08], [-0.215, -0.085, 0.09], 26);
  cheekL.rotation.z = 0.22;
  head.add(cheekL);
  const cheekL2 = ball(mats.cream, [0.055, 0.045, 0.055], [-0.265, -0.07, 0.03], 20);
  cheekL2.rotation.z = 0.38;
  head.add(cheekL2);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.215;
  cheekR.rotation.z = -0.22;
  head.add(cheekR);
  const cheekR2 = cheekL2.clone();
  cheekR2.position.x = 0.265;
  cheekR2.rotation.z = -0.38;
  head.add(cheekR2);

  // Muzzle: a long tapering snout, cream, with a dark nose at the tip.
  head.add(ball(mats.cream, [0.135, 0.105, 0.165], [0, -0.095, 0.19], 34));
  head.add(ball(mats.cream, [0.085, 0.07, 0.09], [0, -0.085, 0.29], 28));
  head.add(ball(mats.nose, [0.042, 0.032, 0.036], [0, -0.045, 0.345], 26));

  // Smile, tucked under the nose.
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.008, 6, 22, Math.PI), mats.nose);
  smile.position.set(0, -0.12, 0.325);
  smile.rotation.z = Math.PI;
  head.add(smile);

  // Jaw: a pivot at the back of the muzzle with the lower lip in front of it.
  const jaw = new THREE.Group();
  jaw.position.set(0, -0.1, 0.1);
  head.add(jaw);
  jaw.add(ball(mats.creamDeep, [0.105, 0.05, 0.115], [0, -0.055, 0.145], 24));

  // Eyes: sclera, iris, pupil and a highlight, grouped so a blink can squash the whole thing.
  const makeEye = (side) => {
    const eye = new THREE.Group();
    eye.position.set(side * 0.122, 0.035, 0.245);
    head.add(eye);
    eye.add(ball(mats.eyeWhite, [0.077, 0.086, 0.05], [0, 0, 0], 28));
    eye.add(ball(mats.iris, [0.05, 0.055, 0.03], [0, -0.002, 0.026], 24));
    eye.add(ball(mats.pupil, [0.024, 0.029, 0.016], [0, -0.004, 0.042], 18));
    eye.add(ball(mats.glint, [0.014, 0.016, 0.01], [-0.016, 0.024, 0.048], 12));
    return eye;
  };
  const eyeL = makeEye(-1);
  const eyeR = makeEye(1);

  // Brows and blush, the two things that make him read as friendly rather than blank.
  const browL = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.0085, 6, 16, Math.PI * 0.8), mats.coat);
  browL.position.set(-0.122, 0.158, 0.28);
  browL.rotation.set(-0.35, 0, 0.15);
  head.add(browL);
  const browR = browL.clone();
  browR.position.x = 0.122;
  browR.rotation.z = -0.15;
  head.add(browR);

  head.add(ball(mats.blush, [0.055, 0.032, 0.018], [-0.225, -0.03, 0.215], 20));
  head.add(ball(mats.blush, [0.055, 0.032, 0.018], [0.225, -0.03, 0.215], 20));

  // Ears: tall rounded cones on their own pivots so they can flick.
  const makeEar = (side) => {
    const ear = new THREE.Group();
    ear.position.set(side * 0.175, 0.25, -0.03);
    ear.rotation.set(-0.06, 0, side * -0.18);
    head.add(ear);

    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.145, 0.34, 24), mats.coat);
    outer.scale.z = 0.55;
    outer.position.y = 0.14;
    ear.add(outer);
    // Round the base so the cone does not sit on a hard edge.
    const base = ball(mats.coat, [0.14, 0.07, 0.078], [0, 0.02, 0], 24);
    ear.add(base);

    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.088, 0.24, 20), mats.cream);
    inner.scale.z = 0.4;
    inner.position.set(0, 0.13, 0.035);
    ear.add(inner);

    return ear;
  };
  const earL = makeEar(-1);
  const earR = makeEar(1);

  // Hair tuft.
  [[-0.05, 0.3, 0.035, -0.4], [0.025, 0.315, 0.02, 0.1], [0.085, 0.29, 0.0, 0.45]].forEach(([x, y, z, rz]) => {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.14, 12), mats.coatDeep);
    tuft.position.set(x, y, z);
    tuft.rotation.z = rz;
    head.add(tuft);
  });

  // Soft contact shadow — cheaper than a shadow map and reads better at this size.
  const shadowMap = shadowTexture(THREE);
  if (shadowMap) {
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.9),
      new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, 0.004, 0.02);
    root.add(shadow);
  }

  return {
    root,
    parts: {
      body,
      head,
      jaw,
      eyeL,
      eyeR,
      browL,
      browR,
      earL,
      earR,
      tail,
      tailSegs,
      armL: leftArm.arm,
      armR: rightArm.arm,
      foreL: leftArm.fore,
      foreR: rightArm.fore,
      mug,
      steamBits,
    },
  };
}
