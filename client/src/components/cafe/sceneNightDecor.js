// Night decoration for the 3D café.
//
// The evening look follows how a modern café is actually lit after dark: the ambient
// drops away, the counter stays the brightest surface, and the personality comes from
// decorative light — a neon sign on the back wall, a backlit menu, LED strips under the
// shelves, a candle on every table and string lights over the courtyard.
// Everything here is invisible by day and faded in with the nightness mix.

const createCanvas = (width, height) => {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return element;
};

export const neonTexture = (THREE, lines, color, core = '#fff0e4') => {
  const canvas = createCanvas(512, 256);
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, 512, 256);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 62px Georgia, serif';
  const rows = Array.isArray(lines) ? lines : [lines];
  // The wide blurred pass is the tube's halo, the tight pass is the hot core.
  rows.forEach((line, index) => {
    const y = 128 + (index - (rows.length - 1) / 2) * 78;
    context.shadowColor = color;
    context.shadowBlur = 34;
    context.fillStyle = color;
    context.fillText(line, 256, y);
    context.shadowBlur = 12;
    context.fillStyle = core;
    context.fillText(line, 256, y);
  });
  const texture = new THREE.CanvasTexture(canvas);
  if (THREE.sRGBEncoding !== undefined) texture.encoding = THREE.sRGBEncoding;
  return texture;
};

export const setupNightDecor = (THREE, scene, textures, { tables = [] } = {}) => {
  const group = new THREE.Group();
  group.name = 'night-decor';
  group.visible = false;
  scene.add(group);
  if (!textures?.softDot) return { group, setMix: () => {} };

  const fades = [];

  const fade = (material, strength) => {
    fades.push({ material, strength });
    material.userData.nightStrength = strength;
    return material;
  };

  const glowSprite = (x, y, z, scale, color, strength) => {
    const material = fade(new THREE.SpriteMaterial({
      map: textures.softDot,
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }), strength);
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(scale, scale, 1);
    group.add(sprite);
    return sprite;
  };

  const lightStrip = (size, position, color, strength) => {
    const material = fade(new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    }), strength);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
    strip.position.set(position[0], position[1], position[2]);
    strip.name = 'night-led-strip';
    group.add(strip);
    return strip;
  };

  // The neon sign itself lives in the room (it is lit by day too), so the evening set
  // only adds the light around it.
  glowSprite(8.35, 5.35, -8.3, 4.6, '#ff6b45', 0.3);

  // Backlit menu board: the strip under it turns the painted board into a lit menu,
  // the same trick a modern café uses instead of washing the whole wall.
  lightStrip([2.5, 0.05, 0.06], [0.82, 2.62, -8.32], '#ffd9a8', 1);
  glowSprite(0.82, 2.55, -8.2, 2.6, '#ffb87a', 0.14);

  // --- Counter: LED under the pickup shelf and a warm line along the bar front -----
  lightStrip([4.0, 0.05, 0.07], [6.7, 1.9, -6.5], '#ffe0b4', 1);
  lightStrip([3.9, 0.05, 0.04], [6.7, 1.18, -3.62], '#ffcf9a', 0.85);
  glowSprite(6.7, 1.6, -3.7, 3.4, '#ffb877', 0.16);

  // --- Shopfront: light spilling out over the entry path --------------------------
  glowSprite(-11.2, 1.9, -1.6, 5.2, '#ffb87a', 0.18);
  glowSprite(-10.9, 2.6, -1.6, 2.6, '#ffcf9a', 0.22);

  // --- String lights over the terrace ---------------------------------------------
  // Three swags from the shopfront to the two poles on the paving, so the bulbs hang
  // over the outdoor tables instead of ending inside the room.
  const strands = [
    [{ x: -11.05, y: 3.95, z: 2.2 }, { x: -15.5, y: 3.86, z: 2.6 }],
    [{ x: -15.5, y: 3.86, z: 2.6 }, { x: -15.5, y: 3.86, z: 7.8 }],
    [{ x: -11.05, y: 3.95, z: 5.0 }, { x: -15.5, y: 3.86, z: 7.8 }],
  ];
  strands.forEach(([start, end]) => {
    for (let index = 1; index < 8; index += 1) {
      const t = index / 8;
      const sag = Math.sin(t * Math.PI) * 0.6;
      glowSprite(
        start.x + (end.x - start.x) * t,
        start.y - sag,
        start.z + (end.z - start.z) * t,
        0.36,
        '#ffcf92',
        0.72,
      );
    }
  });

  // --- A candle on every table ----------------------------------------------------
  const candleMaterial = new THREE.MeshStandardMaterial({ color: '#f1e4cb', roughness: 0.72 });
  tables.forEach((spot) => {
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.13, 8), candleMaterial);
    candle.name = 'night-table-candle';
    candle.position.set(spot.x + 0.46, 1.1, spot.z - 0.34);
    group.add(candle);
    glowSprite(spot.x + 0.46, 1.19, spot.z - 0.34, 0.34, '#ffbe7a', 0.55);
  });

  const setMix = (mix) => {
    group.visible = mix > 0.02;
    if (!group.visible) return;
    fades.forEach(({ material, strength }) => {
      material.opacity = strength * mix;
    });
  };

  return { group, setMix };
};
