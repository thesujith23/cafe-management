// Image-based lighting and floor occlusion for the 3D café.
// The room has no HDRI asset and no example addons available (Three r149 is vendored as
// a classic script), so the environment is a tiny painted room rendered through
// PMREMGenerator — core, synchronous, and enough for metal, glass and glaze to have
// something to reflect.

const ENVIRONMENT_PALETTES = {
  day: {
    backdropTop: '#c9c1b0',
    backdropMid: '#9c8e77',
    backdropBottom: '#4d4234',
    window: '#d8c9ae',
    lamps: '#c9a273',
    floor: '#8a6040',
  },
  night: {
    backdropTop: '#1b242c',
    backdropMid: '#121a20',
    backdropBottom: '#080a0c',
    window: '#26333f',
    lamps: '#8a5a2c',
    floor: '#1c150f',
  },
};

export const buildEnvironmentMap = (THREE, renderer, mode = 'day') => {
  const palette = ENVIRONMENT_PALETTES[mode] || ENVIRONMENT_PALETTES.day;
  const room = new THREE.Scene();

  const backdropCanvas = document.createElement('canvas');
  backdropCanvas.width = 64;
  backdropCanvas.height = 64;
  const backdropContext = backdropCanvas.getContext('2d');
  const gradient = backdropContext.createLinearGradient(0, 0, 0, 64);
  // Deliberately dim: this is ambient bounce, not a second sun. Bright panels here
  // flatten the whole room once the sun and the pendants are added on top.
  gradient.addColorStop(0, palette.backdropTop);
  gradient.addColorStop(0.52, palette.backdropMid);
  gradient.addColorStop(1, palette.backdropBottom);
  backdropContext.fillStyle = gradient;
  backdropContext.fillRect(0, 0, 64, 64);
  const backdropTexture = new THREE.CanvasTexture(backdropCanvas);
  if (THREE.sRGBEncoding !== undefined) backdropTexture.encoding = THREE.sRGBEncoding;

  const backdrop = new THREE.Mesh(
    new THREE.SphereGeometry(24, 20, 14),
    new THREE.MeshBasicMaterial({ map: backdropTexture, side: THREE.BackSide }),
  );
  room.add(backdrop);

  // A bright window face on the entry side: this is the long highlight that runs down
  // the table tops and the stainless range.
  const windowPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 7),
    new THREE.MeshBasicMaterial({ color: palette.window }),
  );
  windowPanel.position.set(-15, 6.5, 1.5);
  windowPanel.lookAt(0, 4, 0);
  room.add(windowPanel);

  // Warm ceiling strip standing in for the pendant row.
  const lampStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 2.2),
    new THREE.MeshBasicMaterial({ color: palette.lamps }),
  );
  lampStrip.position.set(0, 9, 0);
  lampStrip.rotation.x = Math.PI / 2;
  room.add(lampStrip);

  // A darker floor bounce keeps the underside of objects from turning grey.
  const floorBounce = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 26),
    new THREE.MeshBasicMaterial({ color: palette.floor }),
  );
  floorBounce.rotation.x = -Math.PI / 2;
  floorBounce.position.y = -6;
  room.add(floorBounce);

  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(room, 0.04);
  generator.dispose();

  room.traverse((object) => {
    object.geometry?.dispose?.();
    object.material?.map?.dispose?.();
    object.material?.dispose?.();
  });

  return {
    texture: target.texture,
    dispose: () => target.dispose(),
  };
};

// A baked contact shadow: one multiply-blended gradient plane where an object meets the
// floor. No shadow map cost, and it is what stops tables and chairs floating.
export const addContactShadow = (THREE, parent, textures, {
  radius = 1.4, y = 0.028, strength = 1, scaleX = 1, scaleZ = 1,
} = {}) => {
  if (!parent || !textures?.softShadow) return null;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2 * scaleX, radius * 2 * scaleZ),
    new THREE.MeshBasicMaterial({
      map: textures.softShadow,
      transparent: true,
      opacity: strength,
      depthWrite: false,
      color: '#3a2f26',
      toneMapped: false,
    }),
  );
  mesh.name = 'contact-shadow';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  mesh.renderOrder = 2;
  parent.add(mesh);
  return mesh;
};

// The warm pool the morning sun leaves on the floor as it comes through the entry door.
export const addLightShaft = (THREE, scene, textures) => {
  if (!textures?.lightShaft) return null;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(6.6, 3.6),
    new THREE.MeshBasicMaterial({
      map: textures.lightShaft,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),
  );
  mesh.name = 'entry-light-shaft';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(-6.6, 0.042, -1.55);
  mesh.renderOrder = 3;
  scene.add(mesh);
  return mesh;
};
