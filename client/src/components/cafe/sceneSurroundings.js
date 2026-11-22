// The world around the café.
//
// The interior is a cutaway, so everything out here has to carry the building's
// context: a small lane running past the shopfront, a stone terrace under a striped
// awning, street furniture, low neighbours across the road and a sky with a horizon.
// It is all procedural — no image assets, no dependencies — and it sits outside the
// raycast hot spots (tables, kitchen, counter, pond, trees), so those clicks are
// untouched.
//
// Positions deliberately line up with what already exists:
//   shopfront wall  x ≈ -11.05      entry door   z ≈ -1.6
//   arched windows  z 4.7 and 9.0   terrace      x -11.2 → -15.9, z 1.4 → 11.6
//   pavement        x -17.4 → -19.0 lane         x -19.0 → -24.5
//   neighbours      front face x ≈ -26.4
//   pond / trees stay on the east side, as the private back garden.

import { roundedBoxGeometry } from './sceneMaterials';

const createCanvas = (width, height) => {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  return element;
};

const seeded = (seed) => {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

const finishTexture = (THREE, canvas, { repeatX = 1, repeatY = 1 } = {}) => {
  const map = new THREE.CanvasTexture(canvas);
  if (THREE.SRGBColorSpace !== undefined) map.colorSpace = THREE.SRGBColorSpace;
  else if (THREE.sRGBEncoding !== undefined) map.encoding = THREE.sRGBEncoding;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  return map;
};

const standard = (THREE, color, extra = {}) => new THREE.MeshStandardMaterial({
  color,
  roughness: 0.86,
  ...extra,
});

// ---- Small geometry helpers ------------------------------------------------

const box = (THREE, parent, name, size, position, material, options = {}) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  if (options.rotation) mesh.rotation.set(options.rotation[0], options.rotation[1], options.rotation[2]);
  mesh.castShadow = options.castShadow === true;
  mesh.receiveShadow = options.receiveShadow === true;
  parent.add(mesh);
  return mesh;
};

const rounded = (THREE, parent, name, size, position, material, options = {}) => {
  const geometry = roundedBoxGeometry(THREE, size[0], size[1], size[2], options.radius ?? 0.05, options.bevel ?? 0.012);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = options.castShadow === true;
  mesh.receiveShadow = options.receiveShadow === true;
  parent.add(mesh);
  return mesh;
};

const cylinder = (THREE, parent, name, radiusTop, radiusBottom, height, position, material, segments = 12) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  // Nothing out here is inside the sun's shadow frustum, so only the awning opts in.
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
};

// A cylinder between two points: wheels, awning rods, bike frames, railings.
const rod = (THREE, parent, name, from, to, radius, material, segments = 8) => {
  const start = new THREE.Vector3(from[0], from[1], from[2]);
  const end = new THREE.Vector3(to[0], to[1], to[2]);
  const length = start.distanceTo(end);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), material);
  mesh.name = name;
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
  mesh.castShadow = false;
  parent.add(mesh);
  return mesh;
};

// ---- Painted textures ------------------------------------------------------

const pavingTexture = (THREE, { base = '#c2b49b', joint = '#9c8d74', tone = 0.09 } = {}) => {
  const canvas = createCanvas(256, 256);
  const context = canvas.getContext('2d');
  const random = seeded(91);
  context.fillStyle = joint;
  context.fillRect(0, 0, 256, 256);
  const cells = 4;
  const size = 256 / cells;
  for (let row = 0; row < cells; row += 1) {
    for (let column = 0; column < cells; column += 1) {
      const shade = 1 - tone / 2 + random() * tone;
      context.fillStyle = base;
      context.globalAlpha = shade;
      context.fillRect(column * size + 2, row * size + 2, size - 4, size - 4);
      context.globalAlpha = 1;
      for (let grain = 0; grain < 10; grain += 1) {
        context.fillStyle = random() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(60,50,38,.06)';
        context.fillRect(column * size + random() * size, row * size + random() * size, 6 + random() * 16, 1 + random() * 2);
      }
    }
  }
  return finishTexture(THREE, canvas);
};

const cobbleTexture = (THREE) => {
  const canvas = createCanvas(256, 256);
  const context = canvas.getContext('2d');
  const random = seeded(37);
  context.fillStyle = '#57544e';
  context.fillRect(0, 0, 256, 256);
  const rows = 9;
  const cellHeight = 256 / rows;
  for (let row = 0; row < rows; row += 1) {
    const offset = row % 2 ? 18 : 0;
    for (let column = -1; column < 8; column += 1) {
      const width = 26 + random() * 10;
      const x = column * 34 + offset;
      const y = row * cellHeight;
      context.fillStyle = ['#7d7a72', '#6f6c65', '#87837a', '#767369'][Math.floor(random() * 4)];
      context.beginPath();
      if (context.roundRect) context.roundRect(x + 2, y + 2, width, cellHeight - 5, 6);
      else context.rect(x + 2, y + 2, width, cellHeight - 5);
      context.fill();
      context.fillStyle = 'rgba(255,255,255,.05)';
      context.fillRect(x + 5, y + 4, width - 8, 2);
    }
  }
  return finishTexture(THREE, canvas, { repeatX: 3, repeatY: 12 });
};

const awningTexture = (THREE) => {
  const canvas = createCanvas(256, 128);
  const context = canvas.getContext('2d');
  context.fillStyle = '#f1e6cf';
  context.fillRect(0, 0, 256, 128);
  context.fillStyle = '#9c5a43';
  for (let x = 0; x < 256; x += 64) context.fillRect(x, 0, 30, 128);
  context.fillStyle = 'rgba(255,255,255,.14)';
  for (let x = 0; x < 256; x += 64) context.fillRect(x + 32, 0, 4, 128);
  return finishTexture(THREE, canvas, { repeatX: 4, repeatY: 1 });
};

const valanceTexture = (THREE) => {
  const canvas = createCanvas(256, 64);
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, 256, 64);
  context.fillStyle = '#f1e6cf';
  context.fillRect(0, 0, 256, 26);
  context.fillStyle = '#9c5a43';
  context.fillRect(0, 0, 30, 26);
  context.fillRect(64, 0, 30, 26);
  context.fillRect(128, 0, 30, 26);
  context.fillRect(192, 0, 30, 26);
  context.fillStyle = '#e9dcc2';
  for (let x = 0; x < 256; x += 32) {
    context.beginPath();
    context.arc(x + 16, 26, 16, 0, Math.PI);
    context.fill();
  }
  return finishTexture(THREE, canvas, { repeatX: 8, repeatY: 1 });
};

const bladeSignTexture = (THREE) => {
  const canvas = createCanvas(256, 512);
  const context = canvas.getContext('2d');
  context.fillStyle = '#2f2a22';
  context.fillRect(0, 0, 256, 512);
  context.strokeStyle = '#c5a468';
  context.lineWidth = 8;
  context.strokeRect(14, 14, 228, 484);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#d9c294';
  context.font = '600 34px Georgia, serif';
  context.fillText('LITTLE', 128, 176);
  context.fillText('WINDOW', 128, 220);
  context.strokeStyle = 'rgba(197,164,104,.55)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(58, 254);
  context.lineTo(198, 254);
  context.stroke();
  context.fillStyle = '#e4cf9f';
  context.font = '600 27px Georgia, serif';
  context.fillText('CAFÉ', 128, 300);
  context.fillStyle = '#a8905f';
  context.font = '500 15px Georgia, serif';
  context.fillText('COFFEE · LUNCH · BAKES', 128, 342);
  return finishTexture(THREE, canvas);
};

const aFrameTexture = (THREE) => {
  const canvas = createCanvas(256, 384);
  const context = canvas.getContext('2d');
  context.fillStyle = '#2d3a31';
  context.fillRect(0, 0, 256, 384);
  context.strokeStyle = '#b09a6d';
  context.lineWidth = 6;
  context.strokeRect(10, 10, 236, 364);
  context.textAlign = 'center';
  context.fillStyle = '#efe6d1';
  context.font = '700 27px Georgia, serif';
  context.fillText('TODAY', 128, 74);
  context.fillStyle = '#d6c9a8';
  context.font = '500 19px Georgia, serif';
  ['Flat white', 'Cold brew', 'Lemon cake'].forEach((line, index) => {
    context.fillText(line, 128, 140 + index * 44);
  });
  context.strokeStyle = 'rgba(239,230,209,.3)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(48, 186);
  context.lineTo(208, 186);
  context.stroke();
  context.fillStyle = '#a9b592';
  context.font = '600 17px Georgia, serif';
  context.fillText('OPEN FROM 8', 128, 300);
  return finishTexture(THREE, canvas);
};

// A whole townhouse painted on one canvas: plaster, cornice, windows, a shopfront
// with its own awning. Painting the facade is what makes four buildings affordable
// where modelling every window would not be.
const facadeTexture = (THREE, variant) => {
  const palettes = [
    { wall: '#8f8a7c', trim: '#e6e0cf', awning: '#7d5f4b', ink: '#39372f' },
    { wall: '#a3806a', trim: '#eadfc9', awning: '#4f6255', ink: '#3c3128' },
    { wall: '#9a9a8c', trim: '#e9e3d4', awning: '#6d4a3f', ink: '#33342d' },
    { wall: '#7f8079', trim: '#ded8c7', awning: '#5b5f74', ink: '#2f312d' },
  ];
  const palette = palettes[variant % palettes.length];
  const width = 512;
  const height = 768;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  const random = seeded(53 + variant * 17);

  context.fillStyle = palette.wall;
  context.fillRect(0, 0, width, height);
  for (let index = 0; index < 620; index += 1) {
    context.fillStyle = random() > 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(40,34,26,.045)';
    context.fillRect(random() * width, random() * height, 2 + random() * 9, 1 + random() * 3);
  }

  // Cornice and storey band.
  context.fillStyle = palette.trim;
  context.fillRect(0, 26, width, 20);
  context.fillRect(0, 30, width, 4);
  context.fillStyle = 'rgba(50,44,34,.16)';
  context.fillRect(0, 46, width, 6);
  context.fillStyle = palette.trim;
  context.fillRect(0, 268, width, 12);

  // Upper windows: three across, two rows.
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      const x = 58 + column * 146;
      const y = 92 + row * 96;
      context.fillStyle = '#2e3436';
      context.fillRect(x, y, 84, 66);
      context.fillStyle = 'rgba(150,178,188,.24)';
      context.fillRect(x + 5, y + 5, 74, 56);
      context.strokeStyle = palette.trim;
      context.lineWidth = 5;
      context.strokeRect(x, y, 84, 66);
      context.beginPath();
      context.moveTo(x + 42, y);
      context.lineTo(x + 42, y + 66);
      context.stroke();
      context.fillStyle = 'rgba(30,30,26,.18)';
      context.fillRect(x - 6, y + 66, 96, 6);
    }
  }

  // Shopfront: awning, glazing, door.
  context.fillStyle = palette.awning;
  context.fillRect(0, 300, width, 56);
  context.fillStyle = 'rgba(255,255,255,.13)';
  for (let x = 0; x < width; x += 46) context.fillRect(x, 300, 18, 56);
  context.fillStyle = 'rgba(20,20,16,.22)';
  context.fillRect(0, 352, width, 8);

  context.fillStyle = '#20282a';
  context.fillRect(38, 372, 270, 178);
  context.fillStyle = 'rgba(163,195,196,.18)';
  context.fillRect(46, 380, 254, 162);
  context.strokeStyle = '#5d5347';
  context.lineWidth = 7;
  context.strokeRect(38, 372, 270, 178);
  context.beginPath();
  context.moveTo(173, 372);
  context.lineTo(173, 550);
  context.stroke();

  context.fillStyle = '#43362a';
  context.fillRect(348, 368, 106, 194);
  context.fillStyle = '#2c231b';
  context.fillRect(360, 380, 82, 100);
  context.fillStyle = '#b7986a';
  context.beginPath();
  context.arc(432, 478, 6, 0, Math.PI * 2);
  context.fill();

  // Street number and a painted name board.
  context.fillStyle = palette.trim;
  context.fillRect(38, 600, 270, 42);
  context.fillStyle = palette.ink;
  context.font = '600 24px Georgia, serif';
  context.textAlign = 'left';
  context.fillText(['THE COPPER KETTLE', 'LANE 9 BOOKS', 'M. AVERY & SON', 'THE GREEN ROOM'][variant % 4], 54, 630);
  context.font = '500 15px sans-serif';
  context.fillStyle = 'rgba(45,42,34,.72)';
  context.fillText(['BAKERY · GROCER', 'SECONDHAND BOOKS', 'REPAIRS', 'FLOWERS'][variant % 4], 54, 672);

  // Ground floor plinth.
  context.fillStyle = 'rgba(40,36,28,.2)';
  context.fillRect(0, 700, width, 8);
  context.fillStyle = 'rgba(30,28,22,.28)';
  context.fillRect(0, 740, width, 28);

  // Emissive pass: the two windows that stay warm after dark.
  const lit = createCanvas(width, height);
  const litContext = lit.getContext('2d');
  litContext.fillStyle = '#000';
  litContext.fillRect(0, 0, width, height);
  litContext.fillStyle = '#ffcf94';
  const litWindows = variant % 2 ? [[58, 92], [350, 188]] : [[204, 188], [58, 188]];
  litWindows.forEach(([x, y]) => {
    litContext.fillRect(x + 5, y + 5, 74, 56);
    litContext.fillRect(x + 5, y + 5, 74, 26);
  });
  litContext.fillStyle = '#ffd8a4';
  litContext.fillRect(46, 380, 120, 150);
  litContext.fillStyle = 'rgba(255,210,150,.5)';
  litContext.fillRect(360, 380, 82, 84);

  return {
    map: finishTexture(THREE, canvas),
    emissiveMap: finishTexture(THREE, lit),
  };
};

const skyTexture = (THREE, mode = 'day') => {
  const width = 1024;
  const height = 512;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  const random = seeded(mode === 'day' ? 211 : 307);
  const horizon = 302;

  if (mode === 'day') {
    const sky = context.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#aec9d4');
    sky.addColorStop(0.52, '#d7e2dc');
    sky.addColorStop(1, '#f0e7d2');
    context.fillStyle = sky;
    context.fillRect(0, 0, width, horizon);
    for (let cloud = 0; cloud < 16; cloud += 1) {
      const x = random() * width;
      const y = 60 + random() * 150;
      const radius = 40 + random() * 92;
      const gradient = context.createRadialGradient(x, y, 4, x, y, radius);
      gradient.addColorStop(0, 'rgba(255,255,255,.34)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = gradient;
      context.beginPath();
      context.ellipse(x, y, radius, radius * 0.4, 0, 0, Math.PI * 2);
      context.fill();
    }
  } else {
    const sky = context.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#060b12');
    sky.addColorStop(0.6, '#101d27');
    sky.addColorStop(1, '#3a3129');
    context.fillStyle = sky;
    context.fillRect(0, 0, width, horizon);
    for (let star = 0; star < 110; star += 1) {
      const x = random() * width;
      const y = 20 + random() * 210;
      const alpha = 0.25 + random() * 0.6;
      context.fillStyle = `rgba(255,246,226,${alpha})`;
      context.beginPath();
      context.arc(x, y, 0.7 + random() * 1.5, 0, Math.PI * 2);
      context.fill();
    }
    const glow = context.createLinearGradient(0, horizon - 90, 0, horizon);
    glow.addColorStop(0, 'rgba(255,176,110,0)');
    glow.addColorStop(1, 'rgba(255,170,104,.22)');
    context.fillStyle = glow;
    context.fillRect(0, horizon - 90, width, 90);
  }

  // The horizon itself: a low treeline with rooftops behind it, so the ground never
  // runs out to a hard edge.
  context.fillStyle = mode === 'day' ? '#8b9075' : '#101613';
  context.beginPath();
  context.moveTo(0, horizon);
  for (let x = 0; x <= width; x += 16) {
    const bump = 8 + Math.sin(x * 0.021) * 6 + random() * 9;
    context.lineTo(x, horizon - bump);
  }
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fill();

  context.fillStyle = mode === 'day' ? 'rgba(112,118,100,.9)' : 'rgba(20,25,26,.95)';
  for (let building = 0; building < 14; building += 1) {
    const x = building * 76 + random() * 20;
    const height2 = 18 + random() * 34;
    context.fillRect(x, horizon - height2 - 6, 46 + random() * 22, height2 + 12);
  }

  context.fillStyle = mode === 'day' ? '#77826b' : '#0d1211';
  context.fillRect(0, horizon + 6, width, height - horizon);

  if (mode === 'night') {
    for (let light = 0; light < 30; light += 1) {
      context.fillStyle = `rgba(255,196,124,${0.25 + random() * 0.5})`;
      context.fillRect(random() * width, horizon - 4 + random() * 26, 2.4, 2.4);
    }
  }

  return finishTexture(THREE, canvas);
};

// ---- Builders --------------------------------------------------------------

const addSky = (THREE, scene) => {
  const build = (mode, radius, renderOrder) => {
    const material = new THREE.MeshBasicMaterial({
      map: skyTexture(THREE, mode),
      side: THREE.BackSide,
      transparent: true,
      opacity: mode === 'day' ? 1 : 0,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 20), material);
    dome.name = `surroundings-sky-${mode}`;
    dome.renderOrder = renderOrder;
    scene.add(dome);
    return dome;
  };
  return {
    skyDay: build('day', 80, -10),
    skyNight: build('night', 79.4, -9),
  };
};

const addGround = (THREE, group, materials) => {
  // Cobbled lane, kerbs and two pavements running past the shopfront.
  // The lane runs past both edges of the frame rather than stopping in mid-grass.
  box(THREE, group, 'lane-cobbles', [5.5, 0.1, 56], [-21.75, -0.37, 0], materials.cobble, { receiveShadow: true });
  box(THREE, group, 'lane-kerb-near', [0.22, 0.24, 56], [-19.0, -0.3, 0], materials.kerb, { receiveShadow: true });
  box(THREE, group, 'lane-kerb-far', [0.22, 0.24, 56], [-24.5, -0.3, 0], materials.kerb, { receiveShadow: true });
  box(THREE, group, 'pavement-near', [1.62, 0.18, 56], [-18.2, -0.33, 0], materials.pavement, { receiveShadow: true });
  box(THREE, group, 'pavement-far', [1.7, 0.18, 56], [-25.35, -0.33, 0], materials.pavement, { receiveShadow: true });

  // The terrace paving, a step above the grass and level with the entry path.
  // Stops short of the courtyard tree at z 9.5, which frames the patio instead of
  // standing in the middle of it.
  box(THREE, group, 'terrace-paving', [4.7, 0.18, 7.0], [-13.55, -0.33, 4.9], materials.terrace, { receiveShadow: true });
  box(THREE, group, 'terrace-edge', [0.16, 0.14, 7.0], [-15.92, -0.29, 4.9], materials.kerb, { receiveShadow: true });
  for (let index = 0; index < 3; index += 1) {
    box(THREE, group, 'terrace-joint', [4.66, 0.012, 0.03], [-13.55, -0.233, 2.4 + index * 2.1], materials.joint, { castShadow: false });
  }
};

// A ring of soft, fog-faded tree crowns on the far edge of the world. From the café's
// fixed camera the grass and the neighbours carry the horizon, and these crowns are
// what stops the top of the frame reading as an empty field.
const addDistantTreeline = (THREE, group) => {
  const random = seeded(419);
  const greens = ['#5d7358', '#657a5a', '#6f8062', '#556b52'].map((color) => standard(THREE, color, { roughness: 1 }));
  for (let index = 0; index < 18; index += 1) {
    const angle = (index / 18) * Math.PI * 2;
    const radius = 39 + random() * 7;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    // The lane and the neighbours already own the west side.
    if (x < -20 && Math.abs(z) < 24) continue;
    const spread = 2.6 + random() * 2.2;
    const lift = 2.2 + random() * 2.4;
    for (let blob = 0; blob < 2; blob += 1) {
      const crown = new THREE.Mesh(
        new THREE.IcosahedronGeometry(spread * (0.72 + random() * 0.32), 1),
        greens[index % greens.length],
      );
      crown.name = 'distant-tree-crown';
      crown.position.set(
        x + (random() - 0.5) * spread * 1.1,
        lift + blob * spread * 0.5,
        z + (random() - 0.5) * spread * 1.1,
      );
      crown.scale.set(1, 0.78, 1);
      group.add(crown);
    }
  }
};

const addTerraceRailing = (THREE, group, materials) => {
  const rail = (start, end) => {
    box(THREE, group, 'terrace-rail-top', [0.06, 0.06, end - start], [-15.92, 0.76, (start + end) / 2], materials.iron);
    box(THREE, group, 'terrace-rail-low', [0.05, 0.05, end - start], [-15.92, 0.28, (start + end) / 2], materials.iron);
    for (let z = start + 0.1; z < end; z += 0.42) {
      rod(THREE, group, 'terrace-rail-bar', [-15.92, 0.28, z], [-15.92, 0.76, z], 0.016, materials.iron, 5);
    }
  };
  rail(1.4, 2.1);
  rail(3.3, 8.4);
  // Posts at the ends and beside the gate.
  for (const z of [1.4, 2.1, 3.3, 8.4]) {
    cylinder(THREE, group, 'terrace-rail-post', 0.06, 0.07, 1.0, [-15.92, 0.46, z], materials.iron, 8);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 6), materials.iron);
    cap.position.set(-15.92, 0.98, z);
    group.add(cap);
  }
  // The gate leaf, standing open towards the pavement.
  const gate = new THREE.Group();
  gate.name = 'terrace-gate';
  gate.position.set(-15.92, 0, 2.1);
  gate.rotation.y = -0.5;
  group.add(gate);
  box(THREE, gate, 'terrace-gate-frame', [0.05, 0.9, 0.06], [0, 0.48, 0.6], materials.iron);
  box(THREE, gate, 'terrace-gate-frame', [0.05, 0.06, 1.2], [0, 0.88, 0.6], materials.iron);
  for (let z = 0.08; z < 1.18; z += 0.24) {
    rod(THREE, gate, 'terrace-gate-bar', [0, 0.06, z], [0, 0.86, z], 0.014, materials.iron, 5);
  }
};

const addPlanter = (THREE, group, materials, x, z, width = 0.92) => {
  rounded(THREE, group, 'terrace-planter', [width, 0.56, width], [x, 0.29, z], materials.planter, { radius: 0.04 });
  box(THREE, group, 'terrace-planter-soil', [width - 0.12, 0.04, width - 0.12], [x, 0.56, z], materials.soil, { castShadow: false });
  for (let index = 0; index < 5; index += 1) {
    const angle = (index / 5) * Math.PI * 2;
    const shrub = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.19 + (index % 2) * 0.05, 1),
      index % 2 ? materials.olive : materials.boxwood,
    );
    shrub.name = 'terrace-planter-shrub';
    shrub.position.set(x + Math.cos(angle) * 0.18, 0.72 + (index % 3) * 0.07, z + Math.sin(angle) * 0.18);
    shrub.castShadow = true;
    group.add(shrub);
  }
};

const addBistroSet = (THREE, group, materials, x, z, index) => {
  const set = new THREE.Group();
  set.name = 'terrace-bistro-set';
  set.position.set(x, 0, z);
  group.add(set);

  // The same marble-and-brass table as indoors, at terrace scale.
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.07, 16), materials.marble);
  top.name = 'terrace-table-top';
  top.position.set(0, 0.7, 0);
  top.castShadow = true;
  set.add(top);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.558, 0.018, 5, 24), materials.brass);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.7;
  set.add(band);
  cylinder(THREE, set, 'terrace-table-pedestal', 0.08, 0.16, 0.5, [0, 0.45, 0], materials.brass, 10);
  cylinder(THREE, set, 'terrace-table-foot', 0.24, 0.28, 0.04, [0, 0.02, 0], materials.brass, 14);

  // A cup and a small plate, so the sets read as in use.
  cylinder(THREE, set, 'terrace-cup', 0.07, 0.085, 0.12, [0.2, 0.79, 0.06], materials.ceramic, 10);
  cylinder(THREE, set, 'terrace-plate', 0.17, 0.17, 0.02, [-0.18, 0.745, -0.06], materials.ceramic, 14);

  for (const side of [-1, 1]) {
    const chair = new THREE.Group();
    chair.name = 'terrace-chair';
    chair.position.set(0, 0, side * 1.02);
    chair.rotation.y = side > 0 ? Math.PI : 0;
    set.add(chair);
    rounded(THREE, chair, 'terrace-chair-seat', [0.5, 0.07, 0.46], [0, 0.46, 0], materials.chair, { radius: 0.03 });
    for (const dx of [-0.2, 0.2]) {
      for (const dz of [-0.18, 0.18]) {
        cylinder(THREE, chair, 'terrace-chair-leg', 0.022, 0.028, 0.45, [dx, 0.23, dz], materials.iron, 6);
      }
    }
    // A bentwood back: two uprights and three curved slats.
    for (const dx of [-0.22, 0.22]) {
      rod(THREE, chair, 'terrace-chair-back', [dx, 0.48, -0.21], [dx, 0.96, -0.28], 0.024, materials.wood, 6);
    }
    for (let slat = 0; slat < 3; slat += 1) {
      const y = 0.66 + slat * 0.12;
      box(THREE, chair, 'terrace-chair-slat', [0.44, 0.045, 0.035], [0, y, -0.225 - slat * 0.022], materials.wood, { rotation: [0.1, 0, 0] });
    }
    // Alternate the chair textile so the terrace picks up the indoor green/rust pairing.
    if (index % 2 === 0) box(THREE, chair, 'terrace-chair-cushion', [0.42, 0.05, 0.38], [0, 0.505, 0], side > 0 ? materials.rust : materials.green, { castShadow: false });
  }
};

const addAwning = (THREE, group, materials) => {
  // Slopes out over the door, both arched windows and the first metre of the terrace.
  // A shopfront awning, not a terrace roof: it projects far enough to shelter the
  // doorway and the window heads while leaving the bistro sets in view.
  const canopy = box(THREE, group, 'shopfront-awning', [1.95, 0.06, 13.4], [-11.69, 4.9, 2.9], materials.awning, {
    rotation: [0, 0, 0.185],
    castShadow: true,
  });
  canopy.receiveShadow = true;
  box(THREE, group, 'shopfront-awning-valance', [0.02, 0.32, 13.4], [-12.66, 4.56, 2.9], materials.valance, { castShadow: false });
  // Tie rods from the wall down to the outer edge.
  for (const z of [-3.6, 0.4, 4.4, 8.4]) {
    rod(THREE, group, 'awning-tie-rod', [-10.92, 5.42, z], [-12.6, 4.76, z], 0.016, materials.iron, 5);
  }
  box(THREE, group, 'awning-fixing-rail', [0.1, 0.14, 13.4], [-10.96, 5.06, 2.9], materials.wood);
};

const addShopfront = (THREE, group, materials) => {
  // A dado, a fascia band and pilasters on the outside of the existing west wall. The
  // wall is already opaque, so nothing here occludes the interior.
  // The dado breaks either side of the door, because the open leaf swings out over it.
  for (const [center, length] of [[-3.42, 0.96], [5.8, 12.2]]) {
    box(THREE, group, 'shopfront-dado', [0.14, 1.0, length], [-11.13, 0.5, center], materials.stone);
    box(THREE, group, 'shopfront-dado-cap', [0.2, 0.08, length], [-11.14, 1.02, center], materials.stone, { castShadow: false });
  }
  box(THREE, group, 'shopfront-fascia', [0.14, 0.52, 15.8], [-11.13, 5.24, 4.0], materials.wood);
  box(THREE, group, 'shopfront-fascia-trim', [0.18, 0.07, 15.8], [-11.14, 5.52, 4.0], materials.brass, { castShadow: false });
  for (const z of [-3.6, 2.2, 6.85, 11.5]) {
    box(THREE, group, 'shopfront-pilaster', [0.2, 4.4, 0.42], [-11.16, 2.3, z], materials.stone);
    box(THREE, group, 'shopfront-pilaster-cap', [0.26, 0.12, 0.5], [-11.16, 4.56, z], materials.stone, { castShadow: false });
  }
  // Window boxes under the two arched windows.
  for (const z of [4.7, 9.0]) {
    rounded(THREE, group, 'window-box', [0.5, 0.32, 2.1], [-11.42, 0.82, z], materials.planter, { radius: 0.03 });
    for (let index = 0; index < 6; index += 1) {
      const flower = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.1 + (index % 2) * 0.035, 1),
        index % 3 === 0 ? materials.rust : index % 3 === 1 ? materials.olive : materials.boxwood,
      );
      flower.position.set(-11.42 + (index % 2 ? 0.1 : -0.08), 1.04 + (index % 3) * 0.04, z - 0.8 + index * 0.32);
      group.add(flower);
    }
  }
};

const addBladeSign = (THREE, group, materials, texture) => {
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 1.84),
    new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, roughness: 0.7 }),
  );
  sign.name = 'blade-sign';
  sign.position.set(-12.02, 5.95, -3.62);
  group.add(sign);
  box(THREE, group, 'blade-sign-bracket', [1.55, 0.06, 0.06], [-11.68, 6.9, -3.62], materials.iron);
  box(THREE, group, 'blade-sign-hanger', [0.04, 0.3, 0.04], [-12.02, 6.72, -3.62], materials.iron);
};

const addLanterns = (THREE, group, materials) => {
  const lanternGlass = new THREE.MeshStandardMaterial({
    color: '#f6e7c6',
    emissive: '#ffcf96',
    emissiveIntensity: 0.08,
    roughness: 0.45,
  });
  // Clear of the open door leaf, which swings out as far as x ≈ -11.5.
  for (const z of [-3.05, -0.18]) {
    box(THREE, group, 'door-lantern-bracket', [0.34, 0.05, 0.05], [-11.22, 3.02, z], materials.iron);
    box(THREE, group, 'door-lantern-frame', [0.22, 0.34, 0.22], [-11.38, 2.85, z], materials.iron, { castShadow: false });
    box(THREE, group, 'door-lantern-glass', [0.16, 0.26, 0.16], [-11.38, 2.85, z], lanternGlass, { castShadow: false });
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.12, 4), materials.iron);
    cap.position.set(-11.38, 3.08, z);
    cap.rotation.y = Math.PI / 4;
    group.add(cap);
  }
  const doorLantern = new THREE.PointLight('#ffcf96', 0, 7, 2);
  doorLantern.name = 'door-lantern-light';
  doorLantern.position.set(-11.7, 2.9, -1.6);
  doorLantern.castShadow = false;
  group.add(doorLantern);
  return { doorLantern, lanternGlass };
};

const addStreetLamp = (THREE, group, materials, x, z) => {
  const lamp = new THREE.Group();
  lamp.name = 'street-lamp';
  lamp.position.set(x, 0, z);
  group.add(lamp);

  cylinder(THREE, lamp, 'street-lamp-base', 0.18, 0.22, 0.16, [0, 0.08, 0], materials.iron, 10);
  cylinder(THREE, lamp, 'street-lamp-post', 0.055, 0.08, 3.9, [0, 2.03, 0], materials.iron, 10);
  cylinder(THREE, lamp, 'street-lamp-collar', 0.09, 0.09, 0.08, [0, 3.96, 0], materials.brass, 10);
  box(THREE, lamp, 'street-lamp-head', [0.34, 0.08, 0.34], [0, 4.0, 0], materials.iron, { castShadow: false });
  box(THREE, lamp, 'street-lamp-pane', [0.28, 0.36, 0.28], [0, 4.2, 0], materials.lampGlass, { castShadow: false });
  for (const dx of [-0.15, 0.15]) {
    for (const dz of [-0.15, 0.15]) {
      box(THREE, lamp, 'street-lamp-post-rib', [0.03, 0.4, 0.03], [dx, 4.2, dz], materials.iron, { castShadow: false });
    }
  }
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.2, 4), materials.iron);
  cap.position.set(0, 4.46, 0);
  cap.rotation.y = Math.PI / 4;
  lamp.add(cap);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), materials.brass);
  finial.position.set(0, 4.59, 0);
  lamp.add(finial);

  const light = new THREE.PointLight('#ffd7a0', 0, 13, 2);
  light.name = 'street-lamp-light';
  light.position.set(0, 4.2, 0);
  light.castShadow = false;
  lamp.add(light);
  return light;
};

const addBench = (THREE, group, materials, x, z) => {
  const bench = new THREE.Group();
  bench.name = 'street-bench';
  bench.position.set(x, 0, z);
  group.add(bench);
  for (const dx of [-0.26, 0.26]) {
    for (const dz of [-0.9, 0.9]) {
      box(THREE, bench, 'bench-leg', [0.06, 0.42, 0.06], [dx, 0.21, dz], materials.iron);
    }
  }
  for (let slat = 0; slat < 3; slat += 1) {
    box(THREE, bench, 'bench-seat-slat', [0.62, 0.05, 2.0], [0, 0.44, 0], materials.wood);
  }
  for (let slat = 0; slat < 3; slat += 1) {
    box(THREE, bench, 'bench-back-slat', [0.05, 0.12, 2.0], [-0.28, 0.62 + slat * 0.16, 0], materials.wood, { rotation: [0, 0, -0.12] });
  }
  for (const dz of [-0.9, 0.9]) {
    box(THREE, bench, 'bench-back-post', [0.05, 0.5, 0.05], [-0.3, 0.74, dz], materials.iron);
  }
  box(THREE, bench, 'bench-arm', [0.55, 0.05, 0.06], [0, 0.66, 1.0], materials.iron);
  box(THREE, bench, 'bench-arm', [0.55, 0.05, 0.06], [0, 0.66, -1.0], materials.iron);
};

const addBin = (THREE, group, materials, x, z) => {
  cylinder(THREE, group, 'street-bin', 0.24, 0.2, 0.72, [x, 0.36, z], materials.iron, 12);
  cylinder(THREE, group, 'street-bin-rim', 0.26, 0.26, 0.06, [x, 0.74, z], materials.brass, 12);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.1, 12), materials.iron);
  lid.position.set(x, 0.81, z);
  group.add(lid);
};

const addBollard = (THREE, group, materials, x, z) => {
  cylinder(THREE, group, 'street-bollard', 0.09, 0.12, 0.82, [x, 0.41, z], materials.iron, 10);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), materials.iron);
  cap.position.set(x, 0.84, z);
  group.add(cap);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 5, 12), materials.brass);
  band.rotation.x = Math.PI / 2;
  band.position.set(x, 0.66, z);
  group.add(band);
};

const addBicycle = (THREE, group, materials, { x, z, rotation = 0, lean = 0.14 }) => {
  const bike = new THREE.Group();
  bike.name = 'parked-bicycle';
  bike.position.set(x, 0, z);
  bike.rotation.y = rotation;
  bike.rotation.z = lean;
  group.add(bike);

  for (const dz of [-0.52, 0.52]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.022, 6, 22), materials.tyre);
    wheel.name = 'bicycle-wheel';
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(0, 0.34, dz);
    bike.add(wheel);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.008, 4, 20), materials.steel);
    rim.rotation.y = Math.PI / 2;
    rim.position.set(0, 0.34, dz);
    bike.add(rim);
  }
  rod(THREE, bike, 'bicycle-frame', [0, 0.68, -0.22], [0, 0.36, 0.5], 0.022, materials.frame, 6);
  rod(THREE, bike, 'bicycle-frame', [0, 0.68, -0.22], [0, 0.62, 0.18], 0.022, materials.frame, 6);
  rod(THREE, bike, 'bicycle-frame', [0, 0.36, 0.5], [0, 0.62, 0.18], 0.022, materials.frame, 6);
  rod(THREE, bike, 'bicycle-frame', [0, 0.62, 0.18], [0, 0.72, 0.42], 0.02, materials.frame, 6);
  rod(THREE, bike, 'bicycle-fork', [0, 0.72, 0.52], [0, 0.34, 0.52], 0.02, materials.frame, 6);
  rod(THREE, bike, 'bicycle-seat-post', [0, 0.68, -0.22], [0, 0.8, -0.28], 0.02, materials.steel, 6);
  box(THREE, bike, 'bicycle-saddle', [0.1, 0.04, 0.24], [0, 0.83, -0.3], materials.tyre, { castShadow: false });
  rod(THREE, bike, 'bicycle-handlebar', [-0.2, 0.86, 0.46], [0.2, 0.86, 0.46], 0.016, materials.steel, 6);
  rod(THREE, bike, 'bicycle-stem', [0, 0.72, 0.5], [0, 0.86, 0.46], 0.016, materials.steel, 6);
  // Basket and crank, the small signs that it gets ridden.
  box(THREE, bike, 'bicycle-basket', [0.26, 0.16, 0.2], [0, 0.74, 0.58], materials.basket, { castShadow: false });
  cylinder(THREE, bike, 'bicycle-crank', 0.05, 0.05, 0.06, [0, 0.34, 0.12], materials.steel, 8).rotation.z = Math.PI / 2;
};

const addNeighbour = (THREE, group, { z, width, height, variant }) => {
  const front = -26.4;
  const depth = 6.5;
  const { map, emissiveMap } = facadeTexture(THREE, variant);
  const facade = new THREE.MeshStandardMaterial({
    map,
    emissive: new THREE.Color('#ffc98a'),
    emissiveMap,
    emissiveIntensity: 0,
    roughness: 0.92,
  });
  const flank = standard(THREE, ['#7d7768', '#8d7462', '#83837a', '#6f7269'][variant % 4], { roughness: 0.95 });
  const roof = standard(THREE, '#4c4740', { roughness: 0.96 });
  const materials = [facade, flank, roof, flank, flank, flank];
  const body = new THREE.Mesh(new THREE.BoxGeometry(depth, height, width), materials);
  body.name = 'neighbour-building';
  body.position.set(front - depth / 2, height / 2 - 0.4, z);
  group.add(body);

  // Parapet, roof caps and chimneys: the skyline the skyline needs.
  box(THREE, group, 'neighbour-parapet', [depth + 0.24, 0.28, width + 0.24], [front - depth / 2, height - 0.28, z], roof);
  for (const dz of [-width * 0.28, width * 0.24]) {
    box(THREE, group, 'neighbour-chimney', [0.5, 0.9, 0.5], [front - depth * 0.55, height + 0.4, z + dz], flank);
    box(THREE, group, 'neighbour-chimney-cap', [0.62, 0.09, 0.62], [front - depth * 0.55, height + 0.9, z + dz], roof);
  }
  box(THREE, group, 'neighbour-threshold', [0.5, 0.08, 1.4], [front + 0.24, -0.3, z], standard(THREE, '#8f867a', { roughness: 0.95 }));
  return facade;
};

const addCrateStack = (THREE, group, materials, x, z) => {
  for (let crate = 0; crate < 3; crate += 1) {
    rounded(THREE, group, 'street-crate', [0.5, 0.3, 0.5], [x, 0.15 + crate * 0.3, z], materials.crate, { radius: 0.02 });
  }
  for (let bottle = 0; bottle < 3; bottle += 1) {
    cylinder(THREE, group, 'crate-bottle', 0.04, 0.05, 0.22, [x - 0.14 + bottle * 0.14, 1.0, z], materials.bottle, 8);
  }
};

const addAFrame = (THREE, group, materials, texture, x, z) => {
  const sign = new THREE.Group();
  sign.name = 'terrace-a-frame';
  sign.position.set(x, 0, z);
  sign.rotation.y = 0.32;
  group.add(sign);
  for (const side of [-1, 1]) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.92),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.88, side: THREE.DoubleSide }),
    );
    panel.name = 'a-frame-panel';
    panel.position.set(0, 0.48, side * 0.13);
    panel.rotation.x = side * -0.16;
    sign.add(panel);
    box(THREE, sign, 'a-frame-leg', [0.05, 0.98, 0.04], [side * 0.28, 0.49, side * 0.14], materials.wood, { rotation: [side * -0.16, 0, 0] });
  }
  box(THREE, sign, 'a-frame-hinge', [0.62, 0.05, 0.06], [0, 0.94, 0], materials.wood);
};

export const setupSurroundings = (THREE, scene) => {
  const group = new THREE.Group();
  group.name = 'cafe-surroundings';
  scene.add(group);

  const materials = {
    cobble: standard(THREE, '#ffffff', { map: cobbleTexture(THREE), roughness: 0.96 }),
    pavement: standard(THREE, '#ffffff', { map: pavingTexture(THREE, { base: '#cfc4ae', joint: '#a99c85' }), roughness: 0.93 }),
    terrace: standard(THREE, '#ffffff', { map: pavingTexture(THREE, { base: '#c6b294', joint: '#9d8a6f', tone: 0.13 }), roughness: 0.9 }),
    kerb: standard(THREE, '#a49c8c', { roughness: 0.92 }),
    joint: standard(THREE, '#8a7c68', { roughness: 0.95 }),
    iron: standard(THREE, '#2f332f', { roughness: 0.62, metalness: 0.35 }),
    brass: standard(THREE, '#c09a5b', { roughness: 0.36, metalness: 0.78 }),
    steel: standard(THREE, '#b2b4ad', { roughness: 0.42, metalness: 0.55 }),
    wood: standard(THREE, '#8a674a', { roughness: 0.82 }),
    frame: standard(THREE, '#5c6b63', { roughness: 0.55, metalness: 0.25 }),
    tyre: standard(THREE, '#2b2a27', { roughness: 0.93 }),
    basket: standard(THREE, '#a98a5f', { roughness: 0.9 }),
    chair: standard(THREE, '#d8c7a8', { roughness: 0.86 }),
    green: standard(THREE, '#35604a', { roughness: 0.9 }),
    rust: standard(THREE, '#a8542f', { roughness: 0.9 }),
    olive: standard(THREE, '#6c7f5c', { roughness: 0.95 }),
    boxwood: standard(THREE, '#546b4d', { roughness: 0.95 }),
    soil: standard(THREE, '#3f3226', { roughness: 1 }),
    planter: standard(THREE, '#6f6353', { roughness: 0.93 }),
    stone: standard(THREE, '#a99a84', { roughness: 0.9 }),
    marble: standard(THREE, '#efeadd', { roughness: 0.34 }),
    ceramic: standard(THREE, '#e7dfd1', { roughness: 0.44 }),
    crate: standard(THREE, '#8c6d4a', { roughness: 0.94 }),
    bottle: standard(THREE, '#4f6b52', { roughness: 0.34 }),
    awning: standard(THREE, '#f3e7d3', { map: awningTexture(THREE), roughness: 0.9 }),
    valance: new THREE.MeshStandardMaterial({
      map: valanceTexture(THREE),
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.9,
    }),
  };
  const lampGlass = new THREE.MeshStandardMaterial({
    color: '#f7e7c4',
    emissive: '#ffcf96',
    emissiveIntensity: 0.05,
    roughness: 0.4,
  });
  materials.lampGlass = lampGlass;

  const sky = addSky(THREE, scene);
  addGround(THREE, group, materials);
  addDistantTreeline(THREE, group);

  // Three levels to stand things on: the terrace and pavements share the top of their
  // paving at y -0.24, the grass sits at -0.42, and the shopfront is fixed to the wall.
  const terraceFrame = new THREE.Group();
  terraceFrame.name = 'terrace-level';
  terraceFrame.position.y = -0.24;
  group.add(terraceFrame);
  const streetFrame = new THREE.Group();
  streetFrame.name = 'pavement-level';
  streetFrame.position.y = -0.24;
  group.add(streetFrame);
  const grassFrame = new THREE.Group();
  grassFrame.name = 'grass-level';
  grassFrame.position.y = -0.42;
  group.add(grassFrame);

  addTerraceRailing(THREE, terraceFrame, materials);
  addPlanter(THREE, terraceFrame, materials, -15.45, 1.82);
  addPlanter(THREE, terraceFrame, materials, -15.45, 8.0);
  [2.9, 4.9, 6.9].forEach((z, index) => addBistroSet(THREE, terraceFrame, materials, -13.2, z, index));
  addAwning(THREE, group, materials);
  addShopfront(THREE, group, materials);
  addBladeSign(THREE, group, materials, bladeSignTexture(THREE));
  addAFrame(THREE, grassFrame, materials, aFrameTexture(THREE), -16.55, 0.5);
  const { doorLantern, lanternGlass } = addLanterns(THREE, group, materials);
  const streetLamps = [
    addStreetLamp(THREE, grassFrame, materials, -17.2, -7.5),
    addStreetLamp(THREE, grassFrame, materials, -17.2, 7.5),
  ].map((light) => ({ light }));
  addBench(THREE, streetFrame, materials, -18.25, -6.1);
  addBin(THREE, streetFrame, materials, -18.45, -4.2);
  addBollard(THREE, streetFrame, materials, -17.55, -2.3);
  addBollard(THREE, streetFrame, materials, -17.55, 1.5);
  addCrateStack(THREE, streetFrame, materials, -26.0, 4.4);
  addBicycle(THREE, grassFrame, materials, { x: -16.55, z: -0.4, rotation: 0.36, lean: 0.16 });
  addBicycle(THREE, grassFrame, materials, { x: -16.35, z: 4.9, rotation: -0.12, lean: -0.14 });

  const windowMaterials = [
    addNeighbour(THREE, group, { z: -9.5, width: 7.0, height: 8.2, variant: 0 }),
    addNeighbour(THREE, group, { z: -2.9, width: 5.4, height: 7.4, variant: 1 }),
    addNeighbour(THREE, group, { z: 3.9, width: 7.0, height: 9.4, variant: 2 }),
    addNeighbour(THREE, group, { z: 10.7, width: 5.8, height: 8.0, variant: 3 }),
  ];

  // Terrace string-light poles. sceneNightDecor hangs the bulbs from the wall to these.
  for (const z of [2.6, 7.8]) {
    cylinder(THREE, terraceFrame, 'terrace-light-pole', 0.045, 0.06, 4.1, [-15.5, 2.05, z], materials.iron, 8);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.014, 5, 10, Math.PI), materials.iron);
    hook.position.set(-15.5, 3.86, z);
    hook.rotation.x = Math.PI / 2;
    terraceFrame.add(hook);
  }

  return {
    group,
    skyDay: sky.skyDay,
    skyNight: sky.skyNight,
    streetLamps,
    doorLantern,
    lanternGlass,
    lampGlass,
    windowMaterials,
    awningMaterial: materials.awning,
  };
};
