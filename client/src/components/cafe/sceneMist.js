// Mist around the café.
//
// The room opens on a slow camera glide out of a haze; this module is the haze itself.
// A dozen camera-facing puffs share one soft procedural canvas texture, sit low over the
// garden, terrace and lane, drift on a slow loop and thin out as the opening settles.
// Everything is procedural (no image assets, no dependencies) and none of it casts
// shadows or joins the click targets.

const seeded = (seed) => {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

// A soft cloud: one broad core plus a ring of smaller blobs, so a puff never reads as
// a plain circle with a hard rim once several of them overlap.
const mistTexture = (THREE) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const random = seeded(83);
  const puff = (x, y, radius, alpha) => {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    gradient.addColorStop(0.42, `rgba(255, 255, 255, ${alpha * 0.58})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
  };
  puff(128, 138, 120, 0.44);
  for (let index = 0; index < 9; index += 1) {
    const angle = (index / 9) * Math.PI * 2 + random();
    const distance = 30 + random() * 46;
    puff(
      128 + Math.cos(angle) * distance,
      140 + Math.sin(angle) * distance * 0.58,
      40 + random() * 32,
      0.14 + random() * 0.12,
    );
  }
  const texture = new THREE.CanvasTexture(canvas);
  if (THREE.SRGBColorSpace !== undefined) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

// x, y, z, width, opacity, drift, phase. Low and wide: the puffs read as ground haze
// rather than balloons. None sit over the cutaway interior except two very thin ones.
const PUFFS = [
  [-13.6, 0.62, 2.4, 10.5, 0.30, 1.2, 0.0],
  [-14.2, 0.58, 6.9, 9.0, 0.28, 0.9, 1.7],
  [-17.7, 0.52, -2.7, 9.0, 0.26, 1.1, 3.2],
  [-20.9, 0.48, 3.2, 14.0, 0.24, 1.6, 4.4],
  [-20.3, 0.52, -8.4, 12.0, 0.22, 1.3, 2.6],
  [3.0, 0.44, 10.2, 13.0, 0.24, 1.5, 0.8],
  [10.4, 0.40, 6.4, 11.0, 0.22, 1.0, 5.1],
  [16.3, 0.46, 9.4, 12.0, 0.20, 1.2, 3.9],
  [-6.5, 0.36, 15.0, 13.0, 0.18, 1.7, 1.2],
  [0.5, 0.50, 13.4, 10.0, 0.16, 1.1, 4.7],
  [-9.2, 0.48, -7.4, 9.0, 0.14, 0.8, 2.2],
  [13.9, 0.52, -3.0, 10.0, 0.16, 1.0, 5.6],
  // Two thin puffs inside the cutaway, so the room itself opens in mist too.
  [-1.0, 0.36, 8.6, 6.4, 0.10, 0.7, 3.4],
  [4.5, 0.34, -1.2, 6.4, 0.09, 0.6, 5.9],
];

export const setupMist = (THREE, scene) => {
  const group = new THREE.Group();
  group.name = 'cafe-mist';
  const texture = mistTexture(THREE);
  const dayColor = new THREE.Color('#fbfcf7');
  const nightColor = new THREE.Color('#c6d2cd');

  const puffs = PUFFS.map(([x, y, z, width, opacity, drift, phase]) => {
    const material = new THREE.SpriteMaterial({
      map: texture,
      color: dayColor.clone(),
      transparent: true,
      opacity,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.name = 'cafe-mist-puff';
    sprite.position.set(x, y, z);
    // Wide and shallow, like a bank of ground fog rather than a billboard cloud.
    sprite.scale.set(width, width * 0.36, 1);
    sprite.renderOrder = 6;
    group.add(sprite);
    return { sprite, material, baseX: x, baseZ: z, baseOpacity: opacity, drift, phase };
  });
  scene.add(group);

  // density is the opening curve (thick at 0 s, light afterwards); nightness dims and
  // cools the haze so it does not glow over the evening room.
  const update = (time, density, nightness = 0) => {
    const color = dayColor.clone().lerp(nightColor, nightness);
    group.visible = density > 0.01;
    if (!group.visible) return;
    puffs.forEach(({ sprite, material, baseX, baseZ, baseOpacity, drift, phase }) => {
      sprite.position.x = baseX + Math.sin(time * 0.075 + phase) * drift;
      sprite.position.z = baseZ + Math.cos(time * 0.058 + phase * 1.7) * drift * 0.8;
      material.opacity = baseOpacity * density;
      material.color.copy(color);
    });
  };

  return { group, update };
};
