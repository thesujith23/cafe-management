// Procedural surface detail for the 3D café.
// Every map is drawn on a canvas at boot, so the room still ships no binary textures
// and the palette stays in the material's own colour (each map averages close to white).

const SIZE = 256;

const createCanvas = (width = SIZE, height = SIZE) => {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return element;
};

const seededRandom = (seed) => {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
};

const toTexture = (THREE, element, { srgb = false } = {}) => {
  const texture = new THREE.CanvasTexture(element);
  // r149 colours through `encoding`, newer builds through `colorSpace`. Set whichever
  // the vendored build understands so these maps survive a Three upgrade unchanged.
  if (srgb) {
    if (THREE.sRGBEncoding !== undefined) texture.encoding = THREE.sRGBEncoding;
    if (THREE.SRGBColorSpace !== undefined) texture.colorSpace = THREE.SRGBColorSpace;
  }
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
};

// Open-grain timber: soft lengthwise grain, a few knots, and a roughness map that
// follows the grain so highlights break up across a table top instead of sliding over it.
const woodSurfaces = () => {
  const albedo = createCanvas();
  const roughness = createCanvas();
  const paint = albedo.getContext('2d');
  const finish = roughness.getContext('2d');
  const random = seededRandom(9137);
  paint.fillStyle = '#f4ecdf';
  paint.fillRect(0, 0, SIZE, SIZE);
  finish.fillStyle = '#c4c4c4';
  finish.fillRect(0, 0, SIZE, SIZE);

  for (let line = 0; line < 74; line += 1) {
    const y = random() * SIZE;
    const thickness = 0.7 + random() * 2.3;
    const tone = 0.74 + random() * 0.2;
    const vertical = random() > 0.5;
    paint.strokeStyle = `rgba(${Math.round(236 * tone)}, ${Math.round(214 * tone)}, ${Math.round(186 * tone)}, ${0.16 + random() * 0.3})`;
    paint.lineWidth = thickness;
    paint.beginPath();
    if (vertical) {
      paint.moveTo(y, -6);
      paint.bezierCurveTo(y + (random() - 0.5) * 14, SIZE * 0.32, y + (random() - 0.5) * 14, SIZE * 0.68, y + (random() - 0.5) * 8, SIZE + 6);
    } else {
      paint.moveTo(-6, y);
      paint.bezierCurveTo(SIZE * 0.32, y + (random() - 0.5) * 15, SIZE * 0.68, y + (random() - 0.5) * 15, SIZE + 6, y + (random() - 0.5) * 9);
    }
    paint.stroke();

    finish.strokeStyle = `rgba(${tone > 0.86 ? 206 : 178}, ${tone > 0.86 ? 206 : 178}, ${tone > 0.86 ? 206 : 178}, 0.55)`;
    finish.lineWidth = thickness;
    finish.beginPath();
    if (vertical) {
      finish.moveTo(y, -6);
      finish.bezierCurveTo(y + (random() - 0.5) * 10, SIZE * 0.34, y + (random() - 0.5) * 10, SIZE * 0.7, y, SIZE + 6);
    } else {
      finish.moveTo(-6, y);
      finish.bezierCurveTo(SIZE * 0.34, y + (random() - 0.5) * 11, SIZE * 0.7, y + (random() - 0.5) * 11, SIZE + 6, y);
    }
    finish.stroke();
  }

  for (let knot = 0; knot < 3; knot += 1) {
    const x = random() * SIZE;
    const y = random() * SIZE;
    const radius = 6 + random() * 8;
    const gradient = paint.createRadialGradient(x, y, 1, x, y, radius);
    gradient.addColorStop(0, 'rgba(116, 88, 60, .42)');
    gradient.addColorStop(1, 'rgba(116, 88, 60, 0)');
    paint.fillStyle = gradient;
    paint.beginPath();
    paint.arc(x, y, radius, 0, Math.PI * 2);
    paint.fill();
  }

  return { albedo, roughness };
};

// Hand-troweled plaster: barely-there blotches, flat sheen, the patchiness a wall has
// when light rakes across it.
const plasterSurfaces = () => {
  const albedo = createCanvas();
  const roughness = createCanvas();
  const paint = albedo.getContext('2d');
  const finish = roughness.getContext('2d');
  const random = seededRandom(5521);
  paint.fillStyle = '#f6f1e6';
  paint.fillRect(0, 0, SIZE, SIZE);
  finish.fillStyle = '#d8d8d8';
  finish.fillRect(0, 0, SIZE, SIZE);

  for (let blot = 0; blot < 340; blot += 1) {
    const x = random() * SIZE;
    const y = random() * SIZE;
    const radius = 4 + random() * 34;
    const light = random() > 0.5;
    const gradient = paint.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, light ? 'rgba(255, 252, 243, .10)' : 'rgba(176, 165, 146, .10)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    paint.fillStyle = gradient;
    paint.beginPath();
    paint.arc(x, y, radius, 0, Math.PI * 2);
    paint.fill();

    const spot = finish.createRadialGradient(x, y, 0, x, y, radius);
    spot.addColorStop(0, light ? 'rgba(232, 232, 232, .18)' : 'rgba(196, 196, 196, .18)');
    spot.addColorStop(1, 'rgba(216, 216, 216, 0)');
    finish.fillStyle = spot;
    finish.beginPath();
    finish.arc(x, y, radius, 0, Math.PI * 2);
    finish.fill();
  }

  return { albedo, roughness };
};

// Plain-weave cloth for shirts and apron ties: a fine grid raised just enough to catch
// grazing light, which is what stops fabric reading as painted plastic.
const fabricSurfaces = () => {
  const albedo = createCanvas();
  const roughness = createCanvas();
  const paint = albedo.getContext('2d');
  const finish = roughness.getContext('2d');
  const random = seededRandom(3391);
  paint.fillStyle = '#f5f1e8';
  paint.fillRect(0, 0, SIZE, SIZE);
  finish.fillStyle = '#e2e2e2';
  finish.fillRect(0, 0, SIZE, SIZE);

  for (let line = 0; line < SIZE; line += 4) {
    paint.fillStyle = 'rgba(255, 255, 255, .34)';
    paint.fillRect(0, line, SIZE, 1);
    paint.fillStyle = 'rgba(150, 142, 128, .22)';
    paint.fillRect(0, line + 2, SIZE, 1);
    paint.fillStyle = 'rgba(255, 255, 255, .26)';
    paint.fillRect(line, 0, 1, SIZE);
    paint.fillStyle = 'rgba(150, 142, 128, .18)';
    paint.fillRect(line + 2, 0, 1, SIZE);
  }
  for (let fleck = 0; fleck < 900; fleck += 1) {
    paint.fillStyle = random() > 0.5 ? 'rgba(255, 255, 255, .18)' : 'rgba(126, 118, 104, .12)';
    paint.fillRect(random() * SIZE, random() * SIZE, 1, 1);
    finish.fillStyle = random() > 0.5 ? 'rgba(255, 255, 255, .18)' : 'rgba(178, 178, 178, .18)';
    finish.fillRect(random() * SIZE, random() * SIZE, 1, 1);
  }

  return { albedo, roughness };
};

// Glazed ceramic: near-white clay with pinholed glaze. The gloss comes from the
// material's clearcoat, the map only breaks the highlight into something real.
const ceramicSurfaces = () => {
  const albedo = createCanvas();
  const roughness = createCanvas();
  const paint = albedo.getContext('2d');
  const finish = roughness.getContext('2d');
  const random = seededRandom(7717);
  paint.fillStyle = '#fcfaf5';
  paint.fillRect(0, 0, SIZE, SIZE);
  finish.fillStyle = '#5a5a5a';
  finish.fillRect(0, 0, SIZE, SIZE);

  for (let speck = 0; speck < 520; speck += 1) {
    const size = 0.6 + random() * 1.6;
    paint.fillStyle = `rgba(206, 198, 182, ${0.06 + random() * 0.1})`;
    paint.beginPath();
    paint.arc(random() * SIZE, random() * SIZE, size, 0, Math.PI * 2);
    paint.fill();
    finish.fillStyle = `rgba(${random() > 0.5 ? 120 : 54}, ${random() > 0.5 ? 120 : 54}, ${random() > 0.5 ? 120 : 54}, .16)`;
    finish.beginPath();
    finish.arc(random() * SIZE, random() * SIZE, size * 1.6, 0, Math.PI * 2);
    finish.fill();
  }

  return { albedo, roughness };
};

// Brushed stainless: horizontal grain plus streaks in the roughness, so the range and
// prep bench break the room into long highlights instead of flat grey slabs.
const steelSurfaces = () => {
  const albedo = createCanvas();
  const roughness = createCanvas();
  const paint = albedo.getContext('2d');
  const finish = roughness.getContext('2d');
  const random = seededRandom(6421);
  paint.fillStyle = '#f2f2ef';
  paint.fillRect(0, 0, SIZE, SIZE);
  finish.fillStyle = '#6e6e6e';
  finish.fillRect(0, 0, SIZE, SIZE);

  for (let line = 0; line < 260; line += 1) {
    const y = random() * SIZE;
    const thickness = 0.5 + random() * 1.4;
    const light = random() > 0.5;
    paint.fillStyle = light ? 'rgba(255, 255, 255, .5)' : 'rgba(150, 152, 148, .3)';
    paint.fillRect(0, y, SIZE, thickness);
    finish.fillStyle = light ? 'rgba(96, 96, 96, .4)' : 'rgba(140, 140, 140, .34)';
    finish.fillRect(0, y, SIZE, thickness);
  }

  return { albedo, roughness };
};

// Unglazed quarry tile for the working kitchen floor.
const tileSurfaces = () => {
  const albedo = createCanvas();
  const roughness = createCanvas();
  const paint = albedo.getContext('2d');
  const finish = roughness.getContext('2d');
  const random = seededRandom(2213);
  paint.fillStyle = '#f4efe3';
  paint.fillRect(0, 0, SIZE, SIZE);
  finish.fillStyle = '#d2d2d2';
  finish.fillRect(0, 0, SIZE, SIZE);

  const cell = SIZE / 4;
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const shade = 0.94 + random() * 0.06;
      paint.fillStyle = `rgba(255, 252, 242, ${shade})`;
      paint.fillRect(column * cell + 2, row * cell + 2, cell - 4, cell - 4);
      for (let fleck = 0; fleck < 26; fleck += 1) {
        paint.fillStyle = `rgba(178, 168, 150, ${0.05 + random() * 0.08})`;
        paint.fillRect(column * cell + random() * cell, row * cell + random() * cell, 1.5, 1.5);
      }
    }
  }
  paint.strokeStyle = 'rgba(150, 138, 118, .4)';
  paint.lineWidth = 3;
  for (let line = 0; line <= 4; line += 1) {
    paint.beginPath();
    paint.moveTo(line * cell, 0);
    paint.lineTo(line * cell, SIZE);
    paint.moveTo(0, line * cell);
    paint.lineTo(SIZE, line * cell);
    paint.stroke();
  }
  finish.fillStyle = 'rgba(196, 196, 196, .5)';
  finish.fillRect(0, 0, SIZE, SIZE);

  return { albedo, roughness };
};

// Honed marble: a warm off-white slab crossed by a few soft grey veins. Used for every
// table top, so the veins are drawn coarse enough to read from across the room.
const marbleSurfaces = () => {
  const albedo = createCanvas();
  const roughness = createCanvas();
  const paint = albedo.getContext('2d');
  const finish = roughness.getContext('2d');
  const random = seededRandom(4481);
  paint.fillStyle = '#f8f5ef';
  paint.fillRect(0, 0, SIZE, SIZE);
  finish.fillStyle = '#4e4e4e';
  finish.fillRect(0, 0, SIZE, SIZE);

  for (let cloud = 0; cloud < 90; cloud += 1) {
    const x = random() * SIZE;
    const y = random() * SIZE;
    const radius = 8 + random() * 40;
    const gradient = paint.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(226, 222, 212, .22)');
    gradient.addColorStop(1, 'rgba(226, 222, 212, 0)');
    paint.fillStyle = gradient;
    paint.beginPath();
    paint.arc(x, y, radius, 0, Math.PI * 2);
    paint.fill();
  }

  for (let vein = 0; vein < 16; vein += 1) {
    const start = random() * SIZE;
    const drift = (random() - 0.5) * 96;
    paint.strokeStyle = `rgba(146, 148, 142, ${0.1 + random() * 0.24})`;
    paint.lineWidth = 0.6 + random() * 1.7;
    paint.beginPath();
    paint.moveTo(-8, start);
    paint.bezierCurveTo(SIZE * 0.32, start + drift * 0.5, SIZE * 0.66, start + drift * 1.4, SIZE + 8, start + drift);
    paint.stroke();
    paint.strokeStyle = `rgba(196, 194, 186, ${0.14 + random() * 0.18})`;
    paint.lineWidth = 0.5 + random();
    paint.beginPath();
    paint.moveTo(-8, start + 5);
    paint.bezierCurveTo(SIZE * 0.3, start + drift * 0.5 + 9, SIZE * 0.7, start + drift * 1.4 + 4, SIZE + 8, start + drift + 7);
    paint.stroke();
  }

  return { albedo, roughness };
};

// A worn Persian-style rug: border, inner guard, diamond medallion and scattered
// motifs. Two colourways let the room alternate rugs like the reference interior.
const rugSurfaces = (palette) => {
  const albedo = createCanvas(256, 256);
  const roughness = createCanvas(256, 256);
  const paint = albedo.getContext('2d');
  const finish = roughness.getContext('2d');
  const random = seededRandom(8813);
  const diamond = (x, y, size, color) => {
    paint.fillStyle = color;
    paint.beginPath();
    paint.moveTo(x, y - size);
    paint.lineTo(x + size, y);
    paint.lineTo(x, y + size);
    paint.lineTo(x - size, y);
    paint.closePath();
    paint.fill();
  };

  paint.fillStyle = palette.field;
  paint.fillRect(0, 0, 256, 256);
  paint.fillStyle = palette.border;
  paint.fillRect(0, 0, 256, 16);
  paint.fillRect(0, 240, 256, 16);
  paint.fillRect(0, 0, 16, 256);
  paint.fillRect(240, 0, 16, 256);
  paint.strokeStyle = palette.accent;
  paint.lineWidth = 3;
  paint.strokeRect(22, 22, 212, 212);
  paint.fillStyle = palette.field2;
  paint.fillRect(26, 26, 204, 204);

  diamond(128, 128, 62, palette.border);
  diamond(128, 128, 50, palette.field);
  diamond(128, 128, 34, palette.accent);
  diamond(128, 128, 18, palette.border);
  diamond(128, 128, 8, palette.field2);
  for (const [cx, cy] of [[52, 52], [204, 52], [52, 204], [204, 204]]) diamond(cx, cy, 17, palette.accent);
  for (let index = 0; index < 8; index += 1) {
    const t = 62 + index * 19;
    diamond(t, 40, 5, palette.accent);
    diamond(t, 216, 5, palette.accent);
    diamond(40, t, 5, palette.accent);
    diamond(216, t, 5, palette.accent);
  }
  paint.strokeStyle = palette.accent;
  paint.lineWidth = 2;
  paint.strokeRect(40, 40, 176, 176);

  // Pile and wear: fine noise stops the pattern reading as a printed poster.
  for (let fleck = 0; fleck < 5200; fleck += 1) {
    paint.fillStyle = random() > 0.5 ? 'rgba(255, 255, 255, .05)' : 'rgba(0, 0, 0, .07)';
    paint.fillRect(random() * 256, random() * 256, 1, 1);
  }
  finish.fillStyle = '#e4e4e4';
  finish.fillRect(0, 0, 256, 256);

  return { albedo, roughness };
};

// Soft round occlusion for contact shadows: white means "leave the floor alone", and
// the dark centre multiplies the floor down where an object meets it.
const softShadowCanvas = () => {
  const element = createCanvas(192, 192);
  const context = element.getContext('2d');
  // Black gradient carried in the alpha channel: a normal alpha blend can only ever
  // darken the floor here, so the decal cannot brighten a plank if something changes.
  const gradient = context.createRadialGradient(96, 96, 3, 96, 96, 94);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.62)');
  gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.4)');
  gradient.addColorStop(0.74, 'rgba(0, 0, 0, 0.14)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 192, 192);
  return element;
};

// Soft white dot shared by the dust motes and the steam cloud.
const softDotCanvas = () => {
  const element = createCanvas(64, 64);
  const context = element.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.38, 'rgba(255, 255, 255, 0.52)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return element;
};

// The pool of light the entry door throws across the floor.
const lightShaftCanvas = () => {
  const element = createCanvas(256, 128);
  const context = element.getContext('2d');
  const along = context.createLinearGradient(0, 0, 256, 0);
  along.addColorStop(0, 'rgba(255, 239, 205, 0.9)');
  along.addColorStop(0.5, 'rgba(255, 231, 191, 0.4)');
  along.addColorStop(1, 'rgba(255, 226, 182, 0)');
  context.fillStyle = along;
  context.fillRect(0, 0, 256, 128);

  context.globalCompositeOperation = 'destination-in';
  const across = context.createLinearGradient(0, 0, 0, 128);
  across.addColorStop(0, 'rgba(0, 0, 0, 0)');
  across.addColorStop(0.42, 'rgba(0, 0, 0, 1)');
  across.addColorStop(0.62, 'rgba(0, 0, 0, 1)');
  across.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = across;
  context.fillRect(0, 0, 256, 128);
  context.globalCompositeOperation = 'source-over';
  return element;
};

export const createTextureFactory = (THREE) => {
  const surfaces = new Map();
  const shared = new Map();

  const surface = (name, build, bumpScale = 0.02) => {
    if (!surfaces.has(name)) {
      const canvases = build();
      const map = toTexture(THREE, canvases.albedo, { srgb: true });
      map.name = `${name}-albedo`;
      const roughnessMap = toTexture(THREE, canvases.roughness);
      roughnessMap.name = `${name}-roughness`;
      // Reuse the albedo canvas as the height field: its grain is already in the right
      // places, and one extra texture object is cheaper than a third canvas.
      const bumpMap = toTexture(THREE, canvases.albedo);
      bumpMap.name = `${name}-bump`;
      surfaces.set(name, {
        map,
        roughnessMap,
        bumpMap,
        bumpScale,
      });
    }
    return surfaces.get(name);
  };

  const once = (name, build) => {
    if (!shared.has(name)) {
      const texture = toTexture(THREE, build());
      texture.name = name;
      shared.set(name, texture);
    }
    return shared.get(name);
  };

  return {
    wood: surface('wood', woodSurfaces, 0.022),
    plaster: surface('plaster', plasterSurfaces, 0.014),
    fabric: surface('fabric', fabricSurfaces, 0.012),
    ceramic: surface('ceramic', ceramicSurfaces, 0.006),
    steel: surface('steel', steelSurfaces, 0.008),
    tile: surface('tile', tileSurfaces, 0.016),
    marble: surface('marble', marbleSurfaces, 0.004),
    rugNavy: surface('rug-navy', () => rugSurfaces({
      field: '#4c5464', field2: '#5c6474', border: '#bdb2a1', accent: '#8d6151',
    }), 0.01),
    rugRust: surface('rug-rust', () => rugSurfaces({
      field: '#8c6350', field2: '#96705c', border: '#c0b3a0', accent: '#4d5666',
    }), 0.01),
    softShadow: once('soft-shadow', softShadowCanvas),
    softDot: once('soft-dot', softDotCanvas),
    lightShaft: once('light-shaft', lightShaftCanvas),
    dispose: () => {
      surfaces.forEach((set) => {
        set.map.dispose();
        set.roughnessMap.dispose();
        set.bumpMap.dispose();
      });
      surfaces.clear();
      shared.forEach((texture) => texture.dispose());
      shared.clear();
    },
  };
};
