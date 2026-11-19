import { useEffect, useRef } from 'react';

const TABLE_SPOTS = [
  { x: -7, z: 0.8 }, { x: 0, z: 0.8 }, { x: 7, z: 0.8 },
  { x: -7, z: 5.1 }, { x: 0, z: 5.1 }, { x: 7, z: 5.1 },
];
const FALLBACK_TABLES = TABLE_SPOTS.map((_, index) => ({ tableId: `TBL-00${index + 1}`, displayName: `Table ${index + 1}`, status: 'available' }));
const PALETTE = {
  ink: '#302820', wood: '#684a34', lightWood: '#a17b54', darkWood: '#3d3026',
  sage: '#41614d', cream: '#f3ebdd', tile: '#a68a6b', steel: '#858984',
  skin: '#c89170', ember: '#ff7a5c', leaf: '#4c6b52', blue: '#617176',
};

function makeMaterial(THREE, color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, ...extra });
}

function box(THREE, parent, name, size, position, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    options.material || makeMaterial(THREE, color, options.materialOptions),
  );
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = options.castShadow !== false;
  mesh.receiveShadow = options.receiveShadow !== false;
  parent.add(mesh);
  return mesh;
}

function cylinder(THREE, parent, name, radiusTop, radiusBottom, height, position, color, segments = 12, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    options.material || makeMaterial(THREE, color, options.materialOptions),
  );
  mesh.name = name;
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = options.castShadow !== false;
  mesh.receiveShadow = options.receiveShadow !== false;
  parent.add(mesh);
  return mesh;
}

function addLabel(THREE, parent, text, width, height, position, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = options.background || '#223932';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = options.border || '#d5b77e';
  context.fillRect(9, 9, 494, 10);
  context.fillRect(9, 237, 494, 10);
  context.fillStyle = options.color || '#f2dfb6';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '700 43px Georgia, serif';
  context.fillText(text, 256, 128, 470);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture }));
  mesh.position.set(...position);
  parent.add(mesh);
  return { canvas, context, texture, mesh };
}

function addMenuBoard(THREE, parent, position) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 440;
  const context = canvas.getContext('2d');
  context.fillStyle = '#343e32';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#b49a69';
  context.lineWidth = 9;
  context.strokeRect(10, 10, 620, 420);
  context.textAlign = 'left';
  context.fillStyle = '#e6dec9';
  context.font = '500 36px Georgia, serif';
  context.fillText('From the counter', 34, 67);
  context.fillStyle = '#aeb692';
  context.font = '500 17px sans-serif';
  context.fillText('MADE FRESH THROUGH THE DAY', 36, 98);
  const items = [['Espresso & filter', 'from 3.5'], ['Toast & sandwiches', 'from 6.0'], ['Soup, salad & lunch', 'from 9.0'], ['Cake from the oven', 'from 4.5']];
  items.forEach(([item, price], index) => {
    const y = 160 + index * 61;
    context.strokeStyle = 'rgba(225, 217, 194, .16)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(36, y + 16);
    context.lineTo(604, y + 16);
    context.stroke();
    context.fillStyle = '#ece5d5';
    context.font = '25px Georgia, serif';
    context.fillText(item, 36, y);
    context.textAlign = 'right';
    context.fillStyle = '#d1b981';
    context.font = '18px sans-serif';
    context.fillText(price, 600, y);
    context.textAlign = 'left';
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.72), new THREE.MeshBasicMaterial({ map: texture }));
  board.name = 'physical-menu-board';
  board.position.set(...position);
  parent.add(board);
  return board;
}

function drawOrderDisplay(display, orders, time = 0) {
  const { canvas, context, texture } = display;
  const ready = orders.ready || [];
  const cooking = orders.preparing || [];
  const queued = orders.queued || [];
  context.fillStyle = '#25231f';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#e4d9c2';
  context.textAlign = 'left';
  context.font = '600 23px sans-serif';
  context.fillText('Order status', 28, 40);
  context.textAlign = 'right';
  if (queued.length) {
    const alertOn = Math.floor(time * 3) % 2 === 0;
    context.fillStyle = alertOn ? '#8e583b' : '#674734';
    context.fillRect(332, 17, 164, 32);
    context.beginPath();
    context.fillStyle = alertOn ? '#f2c179' : '#d7a964';
    context.arc(349, 33, alertOn ? 5 : 4, 0, Math.PI * 2);
    context.fill();
    context.textAlign = 'left';
    context.fillStyle = '#fff1d6';
    context.font = '700 13px monospace';
    context.fillText(`NEW ORDER · ${queued.length}`, 362, 38);
  } else {
    context.fillStyle = '#a89d88';
    context.font = '500 15px monospace';
    context.fillText(`${queued.length + cooking.length + ready.length} active`, 484, 40);
  }
  const rows = [
    { name: 'NEW / APPROVED', orders: queued, color: '#b1a58f' },
    { name: 'PREPARING', orders: cooking, color: '#d0a66c' },
    { name: 'READY FOR PICKUP', orders: ready, color: '#c4d0a8' },
  ];
  rows.forEach((row, index) => {
    const y = 68 + index * 59;
    const newOrderFlash = index === 0 && row.orders.length && Math.floor(time * 3) % 2 === 0;
    context.fillStyle = newOrderFlash ? '#574534' : index === 2 && row.orders.length ? '#424c39' : '#332e28';
    context.fillRect(20, y, 472, 48);
    context.textAlign = 'left';
    context.fillStyle = newOrderFlash ? '#f0bd78' : row.color;
    context.font = '600 16px monospace';
    context.fillText(row.name, 34, y + 29);
    context.fillStyle = '#e4d9c2';
    context.textAlign = 'right';
    context.font = '500 16px monospace';
    const first = row.orders[0];
    const tableId = first?.tableId || first?.table?.tableId || '';
    const orderLabel = first ? (first.orderNumber || first.displayOrderId || `#${String(first._id || '').slice(-4)}`) : '—';
    context.fillText(first ? `${orderLabel}  ${tableId}` : '—', 476, y + 29);
    if (row.orders.length > 1) {
      context.fillStyle = '#b1a58f';
      context.font = '12px monospace';
      context.fillText(`+${row.orders.length - 1} more`, 476, y + 43);
    }
  });
  texture.needsUpdate = true;
}

function orderTableId(order) {
  return order?.tableId || order?.table?.tableId || (typeof order?.table === 'string' ? order.table : '');
}

function pathLength(path) {
  return path.slice(1).reduce((total, point, index) => {
    const previous = path[index];
    return total + Math.hypot(point.x - previous.x, point.z - previous.z);
  }, 0);
}

function pointAlongPath(path, distance) {
  let remaining = distance;
  for (let index = 1; index < path.length; index += 1) {
    const start = path[index - 1];
    const end = path[index];
    const segmentLength = Math.hypot(end.x - start.x, end.z - start.z);
    if (remaining <= segmentLength) {
      const progress = segmentLength ? remaining / segmentLength : 1;
      return { x: start.x + (end.x - start.x) * progress, z: start.z + (end.z - start.z) * progress };
    }
    remaining -= segmentLength;
  }
  return path[path.length - 1];
}

function addHuman(THREE, scene, options = {}) {
  const {
    x = 0, z = 0, shirt = PALETTE.blue, skin = PALETTE.skin, hair = PALETTE.darkWood,
    role = 'guest', sitting = false, rotation = 0, size = 1, glasses = false, moustache = false,
  } = options;
  const person = new THREE.Group();
  person.position.set(x, 0, z);
  person.rotation.y = rotation;
  person.userData.role = role;
  scene.add(person);

  const skinMat = makeMaterial(THREE, skin, { roughness: 0.72 });
  const hairMat = makeMaterial(THREE, hair, { roughness: 0.94 });
  const shirtMat = makeMaterial(THREE, shirt, { roughness: 0.9 });
  const pantsMat = makeMaterial(THREE, role === 'cook' ? '#3b4543' : '#39444b');
  const shoeMat = makeMaterial(THREE, '#47362d');
  const eyeMat = makeMaterial(THREE, '#2c302c', { roughness: 0.55 });

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.31, sitting ? 0.25 : 0.46, 4, 10), shirtMat);
  torso.scale.z = 0.7;
  torso.position.y = sitting ? 0.98 : 1.11;
  torso.castShadow = true;
  person.add(torso);
  box(THREE, person, 'shirt-panel', [0.035, 0.52, 0.02], [-0.15, sitting ? 1.1 : 1.2, 0.204], new THREE.Color(shirt).multiplyScalar(1.17));

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 16, 12), skinMat);
  head.scale.set(0.88, 1.06, 0.85);
  head.position.set(0, sitting ? 1.62 : 1.8, 0.015);
  head.castShadow = true;
  person.add(head);
  person.userData.head = head;
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.295, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.48), hairMat);
  hairCap.position.set(0, sitting ? 1.73 : 1.91, -0.015);
  hairCap.castShadow = true;
  person.add(hairCap);
  const fringe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), hairMat);
  fringe.name = 'fringe';
  fringe.scale.set(1, 0.22, 0.52);
  fringe.position.set(0, sitting ? 1.81 : 1.99, 0.15);
  person.add(fringe);
  for (const eyeX of [-0.105, 0.105]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), eyeMat);
    eye.position.set(eyeX, sitting ? 1.63 : 1.81, 0.24);
    person.add(eye);
  }
  if (glasses) {
    const frames = makeMaterial(THREE, '#51463a', { metalness: 0.2, roughness: 0.42 });
    for (const eyeX of [-0.105, 0.105]) {
      const frame = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.012, 5, 12), frames);
      frame.position.set(eyeX, sitting ? 1.63 : 1.81, 0.251);
      person.add(frame);
    }
    box(THREE, person, 'glasses-bridge', [0.07, 0.018, 0.018], [0, sitting ? 1.63 : 1.81, 0.251], '#51463a', { castShadow: false });
  }
  if (moustache) box(THREE, person, 'moustache', [0.21, 0.055, 0.035], [0, sitting ? 1.51 : 1.69, 0.26], hair, { castShadow: false });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), skinMat);
  nose.scale.set(0.76, 1.05, 0.8);
  nose.position.set(0, sitting ? 1.54 : 1.72, 0.27);
  person.add(nose);
  for (const earX of [-0.27, 0.27]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), skinMat);
    ear.scale.set(0.58, 1, 0.7);
    ear.position.set(earX, sitting ? 1.62 : 1.8, 0.005);
    person.add(ear);
  }

  const armPivots = [];
  const elbowPivots = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.38, sitting ? 1.25 : 1.36, 0);
    person.add(arm);
    const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.25, 3, 8), shirtMat);
    upperArm.name = 'upper-arm';
    upperArm.position.set(side * 0.015, -0.22, 0);
    upperArm.castShadow = true;
    arm.add(upperArm);
    const lower = new THREE.Group();
    lower.position.set(side * 0.015, -0.4, 0.01);
    arm.add(lower);
    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.22, 3, 8), makeMaterial(THREE, role === 'cook' ? '#f1e5cd' : shirt, { roughness: 0.88 }));
    forearm.name = 'forearm';
    forearm.position.set(0, -0.16, 0.01);
    forearm.castShadow = true;
    lower.add(forearm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), skinMat);
    hand.position.set(0, -0.37, 0.05);
    lower.add(hand);
    armPivots.push(arm);
    elbowPivots.push(lower);
  }

  if (sitting) {
    box(THREE, person, 'lap', [0.48, 0.22, 0.42], [0, 0.57, 0.19], pantsMat.color);
    for (const side of [-1, 1]) {
      const shin = box(THREE, person, 'seated-shin', [0.17, 0.16, 0.52], [side * 0.17, 0.27, 0.48], '#39444b');
      shin.rotation.x = -0.1;
      box(THREE, person, 'seated-shoe', [0.2, 0.13, 0.29], [side * 0.17, 0.12, 0.68], shoeMat.color);
    }
  } else {
    const legPivots = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(side * 0.18, 0.74, 0);
      person.add(leg);
      box(THREE, leg, 'trouser-leg', [0.24, 0.7, 0.26], [0, -0.32, 0], pantsMat.color);
      box(THREE, leg, 'shoe', [0.27, 0.15, 0.4], [0, -0.69, 0.08], shoeMat.color);
      legPivots.push(leg);
    }
    person.userData.legPivots = legPivots;
  }

  if (role === 'cook' || role === 'counter') {
    const apron = box(THREE, person, 'apron', [0.47, 0.55, 0.07], [0, 0.98, 0.25], PALETTE.sage);
    apron.material = makeMaterial(THREE, role === 'counter' ? '#715b3f' : shirt === '#bd714f' ? '#9f553d' : '#607965');
    box(THREE, person, 'apron-pocket', [0.22, 0.15, 0.03], [0, 0.89, 0.3], '#c6a36e');
    if (role === 'counter') {
      box(THREE, person, 'barista-name-pin', [0.2, 0.09, 0.035], [0.17, 1.22, 0.3], '#d4c29d', { castShadow: false });
    }
  }
  if (role === 'cook') {
    cylinder(THREE, person, 'chef-hat-crown', 0.25, 0.23, 0.33, [0, 2.13, 0], '#f6eedc', 8);
    cylinder(THREE, person, 'chef-hat-band', 0.29, 0.29, 0.1, [0, 1.94, 0], '#e6dbc4', 8);
    for (const arm of armPivots) {
      const utensil = box(THREE, arm, 'cooking-utensil', [0.07, 0.52, 0.07], [0.04, -0.62, 0.2], '#9b7952');
      utensil.rotation.z = -0.24;
      cylinder(THREE, arm, 'spoon-head', 0.12, 0.1, 0.1, [0.09, -0.34, 0.2], '#a9aaa0', 8);
    }
    person.userData.armPivots = armPivots;
  } else {
    person.userData.armPivots = armPivots;
  }
  person.userData.elbowPivots = elbowPivots;
  person.scale.setScalar(size);
  return person;
}

function setupDiningGuests(THREE, scene, tableMeshes) {
  const guestGroups = [
    [
      { dx: -1.3, dz: 0, rotation: Math.PI / 2, shirt: '#7b5548', skin: '#d2a17f', hair: '#4a342b', style: 'couple' },
      { dx: 1.3, dz: 0, rotation: -Math.PI / 2, shirt: '#56636a', skin: '#aa7359', hair: '#302c29', style: 'couple' },
    ],
    [
      { dx: -1.3, dz: 0, rotation: Math.PI / 2, shirt: '#77805c', skin: '#bc8868', hair: '#38302b', style: 'family' },
      { dx: 1.3, dz: 0, rotation: -Math.PI / 2, shirt: '#92645a', skin: '#e0b18b', hair: '#49372e', style: 'family' },
      { dx: 0, dz: -1.3, rotation: 0, shirt: '#52757a', skin: '#d3a07a', hair: '#3d3029', size: 0.77, style: 'child' },
      { dx: 0, dz: 1.3, rotation: Math.PI, shirt: '#d09b52', skin: '#bd8667', hair: '#47342d', size: 0.73, style: 'child' },
    ],
    [
      { dx: -1.3, dz: 0, rotation: Math.PI / 2, shirt: '#5e6871', skin: '#bb8c70', hair: '#b4ad9d', glasses: true, style: 'elder' },
      { dx: 1.3, dz: 0, rotation: -Math.PI / 2, shirt: '#77604f', skin: '#d0a081', hair: '#c3b8a4', glasses: true, moustache: true, style: 'elder' },
    ],
    [
      { dx: -1.3, dz: 0, rotation: Math.PI / 2, shirt: '#74805e', skin: '#c39171', hair: '#41352e', style: 'regular' },
      { dx: 1.3, dz: 0, rotation: -Math.PI / 2, shirt: '#986c52', skin: '#ac795d', hair: '#302d29', style: 'regular' },
    ],
    [
      { dx: -1.3, dz: 0, rotation: Math.PI / 2, shirt: '#657782', skin: '#9d6e55', hair: '#2f2927', style: 'regular' },
      { dx: 1.3, dz: 0, rotation: -Math.PI / 2, shirt: '#b08a60', skin: '#d3a17e', hair: '#392e29', style: 'regular' },
    ],
    [
      { dx: -1.3, dz: 0, rotation: Math.PI / 2, shirt: '#8d604b', skin: '#d3a17e', hair: '#392e29', style: 'regular' },
      { dx: 1.3, dz: 0, rotation: -Math.PI / 2, shirt: '#596c61', skin: '#b87e61', hair: '#332c29', style: 'regular' },
    ],
  ];
  tableMeshes.forEach((record, tableIndex) => {
    const guests = guestGroups[tableIndex] || guestGroups[3];
    record.ambientGuests = guests.map((guest, guestIndex) => {
      const person = addHuman(THREE, scene, {
        ...guest,
        x: record.spot.x + guest.dx,
        z: record.spot.z + guest.dz,
        sitting: true,
      });
      person.userData.tableId = record.table.tableId;
      person.userData.diningStyle = guest.style;
      person.userData.eatPhase = tableIndex * 0.73 + guestIndex * 1.91;
      const plateX = guest.dx === 0 ? 0 : Math.sign(guest.dx) * 0.54;
      const plateZ = guest.dz === 0 ? 0 : Math.sign(guest.dz) * 0.52;
      const meal = new THREE.Group();
      meal.name = 'guest-table-setting';
      meal.position.set(plateX, 1.055, plateZ);
      cylinder(THREE, meal, 'guest-ceramic-plate', 0.3, 0.3, 0.04, [0, 0, 0], '#ece5d6', 14, { castShadow: false });
      cylinder(THREE, meal, 'guest-meal', 0.205, 0.22, 0.065, [0, 0.045, 0], ['#ad6943', '#9b8150', '#78815c', '#b5804c'][guestIndex % 4], 9, { castShadow: false });
      cylinder(THREE, meal, 'guest-garnish', 0.065, 0.065, 0.025, [0.08, 0.092, -0.04], '#7f8a61', 7, { castShadow: false });
      cylinder(THREE, meal, 'guest-coffee-cup', 0.09, 0.11, 0.17, [plateX + (guest.dx < 0 ? -0.31 : 0.31), 0.095, plateZ + 0.08], '#e7dfd1', 10, { castShadow: false });
      cylinder(THREE, meal, 'guest-coffee', 0.076, 0.076, 0.014, [plateX + (guest.dx < 0 ? -0.31 : 0.31), 0.184, plateZ + 0.08], '#50392b', 10, { castShadow: false });
      const fork = box(THREE, meal, 'guest-fork', [0.025, 0.16, 0.018], [plateX - 0.29, 0.035, plateZ - 0.05], '#9b9a8c', { castShadow: false });
      fork.rotation.z = 0.18;
      const spoon = box(THREE, meal, 'guest-spoon', [0.025, 0.15, 0.018], [plateX + 0.29, 0.035, plateZ - 0.05], '#9b9a8c', { castShadow: false });
      spoon.rotation.z = -0.18;
      meal.visible = false;
      record.group.add(meal);
      return person;
    });
    record.ambientDishes = record.group.children.filter((child) => child.name === 'guest-table-setting');
    record.ambientDishes.forEach((dish) => {
      dish.visible = false;
    });
  });
}

function createTable(THREE, scene, table, spot, index) {
  const group = new THREE.Group();
  group.position.set(spot.x, 0, spot.z);
  group.userData.tableId = table.tableId;
  scene.add(group);

  const wood = makeMaterial(THREE, index % 2 ? '#76553a' : '#8b6948');
  const top = cylinder(THREE, group, 'table-top', 1.02, 1.02, 0.2, [0, 0.93, 0], wood, 10);
  top.userData.tableId = table.tableId;
  top.userData.originalColor = wood.color.clone();
  cylinder(THREE, group, 'table-under-rim', 0.78, 0.84, 0.13, [0, 0.78, 0], '#513a29', 10);
  cylinder(THREE, group, 'table-pedestal', 0.2, 0.32, 0.72, [0, 0.39, 0], '#493728', 8);
  cylinder(THREE, group, 'table-foot', 0.66, 0.66, 0.12, [0, 0.08, 0], '#624733', 8);

  for (const [dx, dz, rot] of [[-1.3, 0, Math.PI / 2], [1.3, 0, -Math.PI / 2], [0, -1.3, 0], [0, 1.3, Math.PI]]) {
    const chair = new THREE.Group();
    chair.position.set(dx, 0, dz);
    chair.rotation.y = rot;
    group.add(chair);
    box(THREE, chair, 'chair-seat', [0.76, 0.18, 0.72], [0, 0.55, 0], '#644833');
    box(THREE, chair, 'chair-back', [0.76, 0.82, 0.16], [0, 0.98, -0.29], '#74553a');
    box(THREE, chair, 'chair-back-inset', [0.49, 0.39, 0.035], [0, 1.02, -0.2], '#886747', { castShadow: false });
    for (const lx of [-0.3, 0.3]) for (const lz of [-0.29, 0.29]) {
      box(THREE, chair, 'chair-leg', [0.1, 0.53, 0.1], [lx, 0.27, lz], '#4c3627');
    }
  }

  if (table.status === 'occupied') {
    cylinder(THREE, group, 'plate', 0.31, 0.31, 0.035, [-0.35, 1.06, 0.1], '#e7dfcf', 16, { castShadow: false });
    cylinder(THREE, group, 'plate-food', 0.19, 0.21, 0.065, [-0.35, 1.1, 0.1], '#ae6843', 9, { castShadow: false });
    box(THREE, group, 'side-dish', [0.23, 0.08, 0.18], [-0.08, 1.1, 0.2], '#7b805e', { castShadow: false });
    cylinder(THREE, group, 'cup', 0.13, 0.16, 0.23, [0.47, 1.12, -0.22], '#ddd3bf', 10);
    cylinder(THREE, group, 'coffee', 0.105, 0.105, 0.025, [0.47, 1.24, -0.22], '#49352a', 10, { castShadow: false });
  }
  const showcaseDish = new THREE.Group();
  showcaseDish.name = 'table-showcase-dish';
  showcaseDish.position.set(-0.36, 1.04, 0.16);
  cylinder(THREE, showcaseDish, 'showcase-plate', 0.34, 0.34, 0.045, [0, 0, 0], '#e9e1d1', 16, { castShadow: false });
  cylinder(THREE, showcaseDish, 'showcase-food', 0.22, 0.24, 0.075, [0, 0.055, 0], '#ad6943', 10, { castShadow: false });
  cylinder(THREE, showcaseDish, 'showcase-garnish', 0.075, 0.075, 0.035, [0.08, 0.11, 0.015], '#78815e', 8, { castShadow: false });
  group.add(showcaseDish);
  showcaseDish.visible = false;
  box(THREE, group, 'qr-stand-base', [0.4, 0.055, 0.27], [0, 1.07, -0.65], '#624733');
  const qr = box(THREE, group, 'table-qr-stand', [0.31, 0.42, 0.065], [0, 1.28, -0.64], '#eee7d8');
  qr.material = new THREE.MeshStandardMaterial({ color: '#eee7d8', roughness: 0.8 });
  box(THREE, group, 'qr-mark', [0.17, 0.2, 0.012], [0, 1.3, -0.6], '#3c382f', { castShadow: false });
  const reservedMarker = new THREE.Group();
  reservedMarker.name = 'reserved-table-sign';
  box(THREE, reservedMarker, 'reserved-table-marker', [0.8, 0.28, 0.055], [0, 1.34, 0.62], '#51473a');
  addLabel(THREE, reservedMarker, 'RESERVED', 0.68, 0.17, [0, 1.36, 0.654], { background: '#51473a', color: '#e6ddc8', border: '#ab8f61' });
  group.add(reservedMarker);
  reservedMarker.visible = table.status === 'reserved';

  let guest = null;
  if (table.status === 'occupied') {
    guest = addHuman(THREE, scene, { x: spot.x, z: spot.z + 1.43, shirt: index % 2 ? '#66747a' : '#77765f', sitting: true, rotation: Math.PI });
    guest.userData.tableId = table.tableId;
  }
  return { group, top, table, spot, guest, reservedMarker, showcaseDish };
}

function setupRoom(THREE, scene) {
  const oakCanvas = document.createElement('canvas');
  oakCanvas.width = 512;
  oakCanvas.height = 512;
  const oakContext = oakCanvas.getContext('2d');
  oakContext.fillStyle = '#816348';
  oakContext.fillRect(0, 0, 512, 512);
  let plankSeed = 27;
  const plankRandom = () => {
    plankSeed = (plankSeed * 16807) % 2147483647;
    return (plankSeed - 1) / 2147483646;
  };
  for (let row = 0; row < 12; row += 1) {
    const plankHeight = 512 / 12;
    oakContext.fillStyle = ['#8d6d4e', '#795b40', '#947252', '#846247'][row % 4];
    oakContext.fillRect(0, row * plankHeight, 512, plankHeight - 2);
    for (let grain = 0; grain < 13; grain += 1) {
      const y = row * plankHeight + plankRandom() * (plankHeight - 3);
      oakContext.strokeStyle = plankRandom() > 0.5 ? 'rgba(58, 38, 26, .13)' : 'rgba(218, 184, 135, .12)';
      oakContext.lineWidth = 1 + plankRandom() * 2;
      oakContext.beginPath();
      oakContext.moveTo(plankRandom() * 30, y);
      oakContext.bezierCurveTo(150, y - 3, 330, y + 3, 512, y + (plankRandom() - 0.5) * 5);
      oakContext.stroke();
    }
  }
  const oakTexture = new THREE.CanvasTexture(oakCanvas);
  oakTexture.colorSpace = THREE.SRGBColorSpace;
  oakTexture.wrapS = THREE.RepeatWrapping;
  oakTexture.wrapT = THREE.RepeatWrapping;
  oakTexture.repeat.set(2, 1);
  const floor = box(THREE, scene, 'warm-oak-floor', [22, 0.36, 21], [0, -0.18, 1.75], '#ffffff', {
    material: makeMaterial(THREE, '#ded4c0', { map: oakTexture, roughness: 0.84 }),
  });
  floor.receiveShadow = true;
  const tileLines = makeMaterial(THREE, '#604a37', { roughness: 0.96, transparent: true, opacity: 0.32 });
  for (let x = -10; x <= 10; x += 2) box(THREE, scene, 'floor-board-joint', [0.025, 0.012, 20.8], [x, 0.01, 1.75], tileLines, { castShadow: false, receiveShadow: false, material: tileLines });
  for (let z = -8; z <= 12; z += 2) box(THREE, scene, 'floor-board-joint', [21.8, 0.012, 0.025], [0, 0.01, z], tileLines, { castShadow: false, receiveShadow: false, material: tileLines });

  const wall = makeMaterial(THREE, '#c6baa2');
  // A framed open-kitchen pass keeps the cooking line visible while the staff door stays private.
  box(THREE, scene, 'back-wall-left-return', [1.1, 7.2, 0.4], [-10.25, 3.6, -8.75], wall);
  box(THREE, scene, 'open-kitchen-header', [6.5, 1.4, 0.4], [-7.0, 6.5, -8.75], wall);
  box(THREE, scene, 'open-kitchen-sill', [6.5, 1.5, 0.4], [-7.0, 0.75, -8.75], wall);
  box(THREE, scene, 'back-wall-left-pier', [0.9, 7.2, 0.4], [-3.65, 3.6, -8.75], wall);
  box(THREE, scene, 'back-wall-right', [11.4, 7.2, 0.4], [5.1, 3.6, -8.75], wall);
  box(THREE, scene, 'staff-passage-lintel', [2.6, 3.6, 0.4], [-1.9, 5.4, -8.75], wall);
  box(THREE, scene, 'back-wall-wainscot-left', [1.02, 1.25, 0.08], [-10.25, 0.95, -8.51], '#514237');
  box(THREE, scene, 'back-wall-wainscot-right', [11.25, 1.25, 0.08], [5.1, 0.95, -8.51], '#514237');
  box(THREE, scene, 'staff-access-screen', [0.18, 3.8, 2.0], [-3.05, 1.9, -9.75], '#89785f');
  box(THREE, scene, 'staff-door-frame', [2.5, 4.7, 0.22], [-1.9, 2.35, -8.48], '#624a32');
  box(THREE, scene, 'staff-door', [2.23, 4.42, 0.12], [-1.9, 2.21, -8.32], '#604b34', { materialOptions: { roughness: 0.75 } });
  box(THREE, scene, 'staff-door-inset', [1.74, 3.55, 0.045], [-1.9, 2.16, -8.24], '#766044', { castShadow: false });
  cylinder(THREE, scene, 'staff-door-handle', 0.07, 0.07, 0.12, [-1.12, 1.45, -8.15], '#c1a16a', 10, { materialOptions: { metalness: 0.65, roughness: 0.25 } });
  addLabel(THREE, scene, 'STAFF ONLY', 1.65, 0.38, [-1.9, 4.75, -8.22], { background: '#514237', color: '#eee4d2', border: '#aa8961' });
  box(THREE, scene, 'left-cutaway-wall', [0.4, 7.2, 5.5], [-10.85, 3.6, -5.4], '#89785f');
  box(THREE, scene, 'left-wall-front', [0.4, 7.2, 8.7], [-10.85, 3.6, 7.3], '#89785f');

  box(THREE, scene, 'kitchen-pass-timber-left', [0.15, 4.55, 0.18], [-9.72, 3.78, -8.43], '#654b35');
  box(THREE, scene, 'kitchen-pass-timber-right', [0.15, 4.55, 0.18], [-4.28, 3.78, -8.43], '#654b35');
  box(THREE, scene, 'kitchen-pass-timber-top', [5.6, 0.16, 0.18], [-7.0, 5.98, -8.43], '#654b35');
  box(THREE, scene, 'kitchen-pass-service-ledge', [5.8, 0.2, 0.72], [-7.0, 1.62, -8.53], '#a7835c');
  box(THREE, scene, 'kitchen-pass-ledge-edge', [5.86, 0.08, 0.09], [-7.0, 1.73, -8.17], '#c7aa7a');
  box(THREE, scene, 'kitchen-pass-mullion', [0.09, 4.22, 0.12], [-7.0, 3.8, -8.41], '#d7c29c');
  addLabel(THREE, scene, 'OPEN KITCHEN', 2.55, 0.38, [-7.0, 6.47, -8.49], { background: '#514237', color: '#eee4d2', border: '#aa8961' });
  for (const [name, x, openSide] of [['cafe-entry-exit', -10.55, -1]]) {
    for (const z of [-2.75, -0.45]) box(THREE, scene, `${name}-jamb`, [0.3, 3.3, 0.18], [x, 1.65, z], '#654733');
    box(THREE, scene, `${name}-lintel`, [0.3, 0.2, 2.45], [x, 3.3, -1.6], '#654733');
    const openDoor = new THREE.Group();
    openDoor.name = `${name}-open-leaf`;
    openDoor.position.set(x, 0, -2.66);
    openDoor.rotation.y = openSide * Math.PI / 2;
    scene.add(openDoor);
    box(THREE, openDoor, `${name}-glass`, [0.12, 3.0, 1.95], [0, 1.5, 0.97], '#a1b1a6', { materialOptions: { roughness: 0.23, transparent: true, opacity: 0.72 } });
    box(THREE, openDoor, `${name}-handle`, [0.08, 0.5, 0.08], [openSide * -0.08, 1.25, 1.45], '#aa8757', { materialOptions: { metalness: 0.65, roughness: 0.25 } });
  }
  const brand = addLabel(THREE, scene, 'LITTLE WINDOW', 4.3, 1.35, [3.8, 5.55, -8.42], { background: '#312a22', color: '#d7bb86', border: '#b09161' });
  brand.mesh.position.z = -8.42;
  addLabel(THREE, scene, 'COFFEE  •  LUNCH  •  BAKES', 4.1, 0.54, [3.8, 4.55, -8.38], { background: '#65513b', color: '#e9ddc8', border: '#a9875f' });
  addMenuBoard(THREE, scene, [0.82, 3.3, -8.42]);

  for (const x of [-8.3, -1.2, 5.2, 9.1]) {
    const cord = cylinder(THREE, scene, 'lamp-cord', 0.025, 0.025, 1.35, [x, 5.9, -1.6], '#514238', 6);
    const shade = cylinder(THREE, scene, 'pendant-shade', 0.58, 0.34, 0.36, [x, 5.17, -1.6], '#b28e5d', 10);
    cylinder(THREE, scene, 'lamp-glow', 0.31, 0.31, 0.06, [x, 4.96, -1.6], '#f3dfb7', 10, { materialOptions: { emissive: '#d1a866', emissiveIntensity: 0.8 } });
    const point = new THREE.PointLight('#eed2a2', 12, 8, 2);
    point.position.set(x, 4.7, -1.6);
    scene.add(point);
    cord.castShadow = false;
    shade.castShadow = true;
  }

  // A clear central service aisle separates guests from tables and kitchen traffic.
  box(THREE, scene, 'service-aisle-runner', [19.6, 0.015, 1.18], [0, 0.025, -1.7], '#a68b6c', { materialOptions: { roughness: 1 }, castShadow: false });
}

function setupCourtyard(THREE, scene) {
  const grassCanvas = document.createElement('canvas');
  grassCanvas.width = 256;
  grassCanvas.height = 256;
  const grassContext = grassCanvas.getContext('2d');
  grassContext.fillStyle = '#72805a';
  grassContext.fillRect(0, 0, 256, 256);
  let randomSeed = 12;
  const random = () => {
    randomSeed = (randomSeed * 16807) % 2147483647;
    return (randomSeed - 1) / 2147483646;
  };
  for (let index = 0; index < 950; index += 1) {
    grassContext.fillStyle = random() > 0.5 ? 'rgba(184, 177, 127, .25)' : 'rgba(38, 59, 39, .22)';
    grassContext.fillRect(random() * 256, random() * 256, 1 + random() * 2, 2 + random() * 4);
  }
  const grassTexture = new THREE.CanvasTexture(grassCanvas);
  grassTexture.colorSpace = THREE.SRGBColorSpace;
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(30, 30);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), makeMaterial(THREE, '#ffffff', { map: grassTexture, roughness: 1 }));
  ground.name = 'courtyard-grass';
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.42, 1.5);
  ground.receiveShadow = true;
  scene.add(ground);

  box(THREE, scene, 'entry-path', [9.5, 0.16, 2.2], [-15.6, -0.28, -1.65], '#b4a888', { materialOptions: { roughness: 0.95 } });
  for (let index = 0; index < 5; index += 1) {
    const stone = box(THREE, scene, 'entry-paving-joint', [0.055, 0.012, 2.15], [-12.0 - index * 1.65, -0.19, -1.65], '#8d8065', { castShadow: false, receiveShadow: false });
    stone.rotation.y = 0.03;
  }

  const barkCanvas = document.createElement('canvas');
  barkCanvas.width = 128;
  barkCanvas.height = 256;
  const barkContext = barkCanvas.getContext('2d');
  barkContext.fillStyle = '#70563c';
  barkContext.fillRect(0, 0, 128, 256);
  for (let index = 0; index < 70; index += 1) {
    const barkX = random() * 128;
    barkContext.strokeStyle = random() > 0.5 ? 'rgba(39, 31, 24, .30)' : 'rgba(192, 158, 111, .24)';
    barkContext.lineWidth = 1 + random() * 4;
    barkContext.beginPath();
    barkContext.moveTo(barkX, 0);
    barkContext.bezierCurveTo(barkX - 8 + random() * 14, 72, barkX - 5 + random() * 10, 180, barkX + random() * 4, 256);
    barkContext.stroke();
  }
  const barkTexture = new THREE.CanvasTexture(barkCanvas);
  barkTexture.colorSpace = THREE.SRGBColorSpace;
  barkTexture.wrapS = THREE.RepeatWrapping;
  barkTexture.wrapT = THREE.RepeatWrapping;
  barkTexture.repeat.set(1, 1.5);
  const barkMaterial = makeMaterial(THREE, '#ffffff', { map: barkTexture, bumpMap: barkTexture, bumpScale: 0.08, roughness: 0.98 });
  const foliageColors = ['#4f6544', '#637650', '#75845a', '#89916a', '#526947'];
  const addTree = (x, z, scale = 1) => {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);
    scene.add(tree);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.46, 3.05, 12, 4), barkMaterial);
    trunk.name = 'garden-tree-trunk';
    trunk.position.y = 1.51;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);
    for (const [side, height, reach] of [[-1, 1.55, 1.15], [1, 1.8, 1.3], [-1, 2.05, 0.85], [1, 2.25, 0.78]]) {
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.16, reach * 1.8, 8), barkMaterial);
      branch.name = 'garden-tree-branch';
      branch.position.set(side * reach * 0.35, height + 0.38, 0.02);
      branch.rotation.z = -side * 0.72;
      branch.castShadow = true;
      tree.add(branch);
    }
    for (let index = 0; index < 22; index += 1) {
      const angle = random() * Math.PI * 2;
      const radial = 0.35 + random() * 1.12;
      const radius = 0.56 + random() * 0.36;
      const leaf = new THREE.Mesh(
        new THREE.IcosahedronGeometry(radius, 1),
        makeMaterial(THREE, foliageColors[index % foliageColors.length], { roughness: 0.94 }),
      );
      leaf.name = 'garden-leaf-cluster';
      leaf.scale.set(1 + random() * 0.4, 0.72 + random() * 0.32, 0.88 + random() * 0.32);
      leaf.position.set(Math.cos(angle) * radial, 3.05 + random() * 1.45, Math.sin(angle) * radial);
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      tree.add(leaf);
    }
  };
  addTree(-14.5, 9.5, 1.1);
  addTree(13.6, 12.5, 1.0);
  addTree(16.2, -5.7, 0.76);
  const treeSpots = [{ x: -14.5, z: 9.5 }, { x: 13.6, z: 12.5 }, { x: 16.2, z: -5.7 }];

  // A shallow ornamental pond fills the open east garden, with a stone rim,
  // lily pads, reeds and slow water rings to give the courtyard a focal point.
  const pondX = 14.6;
  const pondZ = 1.1;
  const pondRim = new THREE.Mesh(
    new THREE.CircleGeometry(1, 56),
    makeMaterial(THREE, '#b7a98b', { roughness: 0.92 }),
  );
  pondRim.name = 'garden-pond-stone-rim';
  pondRim.rotation.x = -Math.PI / 2;
  pondRim.scale.set(3.55, 2.5, 1);
  pondRim.position.set(pondX, -0.205, pondZ);
  pondRim.receiveShadow = true;
  scene.add(pondRim);
  const pondWater = new THREE.Mesh(
    new THREE.CircleGeometry(1, 56),
    makeMaterial(THREE, '#639088', { roughness: 0.16, metalness: 0.08, transparent: true, opacity: 0.82, emissive: '#315f58', emissiveIntensity: 0.035 }),
  );
  pondWater.name = 'garden-pond-water';
  pondWater.rotation.x = -Math.PI / 2;
  pondWater.scale.set(3.28, 2.26, 1);
  pondWater.position.set(pondX, -0.155, pondZ);
  scene.add(pondWater);
  const pondRimDetails = new THREE.Mesh(
    new THREE.RingGeometry(0.965, 1.01, 56),
    makeMaterial(THREE, '#d4c7a7', { roughness: 0.75 }),
  );
  pondRimDetails.rotation.x = -Math.PI / 2;
  pondRimDetails.scale.set(3.38, 2.33, 1);
  pondRimDetails.position.set(pondX, -0.115, pondZ);
  scene.add(pondRimDetails);
  for (let index = 0; index < 20; index += 1) {
    const angle = (index / 20) * Math.PI * 2;
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.19 + (index % 3) * 0.035, 0),
      makeMaterial(THREE, ['#9c927b', '#b2a58b', '#837d6a'][index % 3], { roughness: 0.96 }),
    );
    stone.name = 'pond-edge-stone';
    stone.position.set(pondX + Math.cos(angle) * 3.38, -0.08 + (index % 2) * 0.035, pondZ + Math.sin(angle) * 2.33);
    stone.scale.set(1.1, 0.65, 0.85);
    stone.rotation.y = angle;
    stone.castShadow = true;
    stone.receiveShadow = true;
    scene.add(stone);
  }

  const pondLilies = [
    [13.25, 0.28, 0.32], [15.35, 1.42, 0.28], [14.1, 2.08, 0.22],
  ];
  pondLilies.forEach(([x, z, size], index) => {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(size, 10, 0.45, Math.PI * 1.7), makeMaterial(THREE, index === 1 ? '#879568' : '#73875c', { roughness: 0.9, side: THREE.DoubleSide }));
    pad.name = 'pond-lily-pad';
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(x, -0.1 + index * 0.003, z);
    pad.castShadow = true;
    scene.add(pad);
    if (index === 1) {
      const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), makeMaterial(THREE, '#e8d6b4', { roughness: 0.7 }));
      blossom.name = 'pond-lily-blossom';
      blossom.scale.set(1, 0.55, 1);
      blossom.position.set(x, -0.015, z);
      scene.add(blossom);
    }
  });
  for (const [x, z] of [[12.1, 1.9], [12.45, 2.0], [17.05, 1.15], [16.85, 1.6]]) {
    const stem = cylinder(THREE, scene, 'pond-reed-stem', 0.035, 0.025, 0.72, [x, 0.12, z], '#75845b', 7);
    stem.rotation.z = (x < pondX ? -1 : 1) * 0.1;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 7, 5), makeMaterial(THREE, '#8c7956', { roughness: 0.95 }));
    tip.position.set(x, 0.51, z);
    scene.add(tip);
  }
  const pondRipples = [];
  for (let index = 0; index < 3; index += 1) {
    const ripple = new THREE.Mesh(
      new THREE.RingGeometry(0.88, 0.93, 40),
      new THREE.MeshBasicMaterial({ color: '#d0ded0', transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }),
    );
    ripple.name = 'pond-water-ripple';
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set(pondX + (index - 1) * 0.43, -0.105, pondZ - 0.1 + index * 0.14);
    scene.add(ripple);
    pondRipples.push({ mesh: ripple, phase: index / 3 });
  }
  const pondFish = [];
  for (let index = 0; index < 3; index += 1) {
    const fish = new THREE.Group();
    fish.name = 'garden-pond-fish';
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 12), makeMaterial(THREE, ['#d4a465', '#9eae86', '#cb795a'][index], { roughness: 0.4, metalness: 0.02, transparent: true, opacity: 0.94 }));
    body.scale.set(1.38, 0.58, 0.72);
    body.name = 'pond-fish-body';
    body.castShadow = true;
    fish.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.32, 5), makeMaterial(THREE, ['#bb8751', '#818d6d', '#b7674e'][index], { roughness: 0.48, transparent: true, opacity: 0.92 }));
    tail.rotation.z = -Math.PI / 2;
    tail.position.x = -0.43;
    fish.add(tail);
    const dorsalFin = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.24, 4), makeMaterial(THREE, '#b78a58', { roughness: 0.58, transparent: true, opacity: 0.86 }));
    dorsalFin.position.set(-0.02, 0.14, 0);
    dorsalFin.rotation.z = Math.PI;
    fish.add(dorsalFin);
    const sideFin = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.19, 4), makeMaterial(THREE, '#b78a58', { roughness: 0.58, transparent: true, opacity: 0.84 }));
    sideFin.position.set(0.08, -0.02, 0.17);
    sideFin.rotation.x = Math.PI / 2;
    sideFin.rotation.z = -0.6;
    fish.add(sideFin);
    const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), makeMaterial(THREE, index === 1 ? '#e3d9b5' : '#f0d1a0', { roughness: 0.58, transparent: true, opacity: 0.88 }));
    highlight.scale.set(1.05, 0.3, 0.58);
    highlight.position.set(-0.08, 0.115, 0.005);
    fish.add(highlight);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), makeMaterial(THREE, '#292c26', { roughness: 0.32 }));
    eye.position.set(0.31, 0.035, 0.1);
    fish.add(eye);
    fish.position.set(pondX, -0.25, pondZ);
    scene.add(fish);
    pondFish.push({ mesh: fish, phase: index * (Math.PI * 2 / 3), radius: 0.9 + index * 0.42 });
  }

  // Low clipped hedges and flowering borders soften the bare edges of the courtyard.
  for (const [x, z, width] of [[-17.5, 1.2, 4.4], [16.4, 4.8, 4.6], [-12.4, 12.8, 5.2]]) {
    box(THREE, scene, 'garden-hedge', [width, 0.82, 1.05], [x, -0.01, z], '#66734e', { materialOptions: { roughness: 0.98 } });
    for (let index = 0; index < 5; index += 1) {
      const flower = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 8, 6),
        makeMaterial(THREE, index % 2 ? '#d8c8a6' : '#c98467', { roughness: 0.88 }),
      );
      flower.position.set(x - width * 0.38 + index * width * 0.19, 0.47 + (index % 2) * 0.08, z - 0.1);
      flower.castShadow = true;
      scene.add(flower);
    }
  }

  for (const [x, z, width] of [[-8.2, 14.0, 5.2], [1.4, 15.0, 6.8], [12.3, 6.3, 3.0], [-13.3, -5.4, 2.8]]) {
    box(THREE, scene, 'courtyard-planter', [width, 0.44, 1.3], [x, -0.16, z], '#77634a');
    for (let offset = -width / 2 + 0.45; offset < width / 2; offset += 0.6) {
      cylinder(THREE, scene, 'courtyard-herb-pot', 0.2, 0.24, 0.33, [x + offset, 0.2, z], '#927655', 9);
      const herb = new THREE.Mesh(new THREE.SphereGeometry(0.33, 9, 8), makeMaterial(THREE, offset % 1.2 ? '#6d7b55' : '#879064', { roughness: 0.95 }));
      herb.position.set(x + offset, 0.55, z);
      herb.castShadow = true;
      scene.add(herb);
    }
  }

  const birds = [];
  for (let index = 0; index < 4; index += 1) {
    const bird = new THREE.Group();
    const featherMaterial = makeMaterial(THREE, ['#6d7060', '#827b69', '#5f6b60', '#8a806a'][index], { roughness: 0.93 });
    const beakMaterial = makeMaterial(THREE, '#b77d4e', { roughness: 0.65 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 9), featherMaterial);
    body.name = 'garden-bird-body';
    body.scale.set(1.2, 0.8, 0.82);
    body.castShadow = true;
    bird.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 11, 8), featherMaterial);
    head.position.set(0.13, 0.055, 0.08);
    bird.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 5), beakMaterial);
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(0.25, 0.04, 0.08);
    bird.add(beak);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.19, 5), featherMaterial);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-0.19, 0.015, 0);
    bird.add(tail);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 5), makeMaterial(THREE, '#302d27', { roughness: 0.45 }));
    eye.position.set(0.17, 0.07, 0.154);
    bird.add(eye);
    const wings = [];
    for (const side of [-1, 1]) {
      const wingPivot = new THREE.Group();
      wingPivot.position.set(-0.015, 0.055, side * 0.04);
      const wing = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 7), featherMaterial);
      wing.name = 'garden-bird-wing';
      wing.scale.set(0.72, 0.12, 1.15);
      wing.position.set(-0.01, 0, side * 0.16);
      wing.rotation.z = -0.28;
      wing.castShadow = true;
      wingPivot.add(wing);
      bird.add(wingPivot);
      wings.push(wingPivot);
    }
    const treeSpot = treeSpots[index % treeSpots.length];
    bird.position.set(treeSpot.x + (index % 2 ? 1.3 : -1.3), 5.3 + (index % 2) * 0.5, treeSpot.z + (index % 2 ? 1.1 : -1.1));
    bird.userData.home = bird.position.clone();
    bird.userData.phase = index * 1.4;
    bird.userData.treeSpot = treeSpot;
    bird.userData.wings = wings;
    scene.add(bird);
    birds.push(bird);
  }
  return { birds, pondRipples, pondFish };
}

function setupKitchen(THREE, scene) {
  const kitchen = new THREE.Group();
  kitchen.name = 'staff-only-kitchen';
  kitchen.position.z = -7.5;
  scene.add(kitchen);
  box(THREE, kitchen, 'kitchen-zone', [7.6, 0.08, 6.4], [-6.55, 0.04, -5.3], '#827b6d');
  box(THREE, kitchen, 'kitchen-left-wall', [0.3, 5.8, 7.2], [-10.55, 2.9, -5.25], '#b2a68e');
  box(THREE, kitchen, 'kitchen-back-wall', [8.0, 5.8, 0.3], [-6.55, 2.9, -8.85], '#b2a68e');
  box(THREE, kitchen, 'stainless-range', [5.5, 1.15, 1.25], [-7.15, 0.61, -4.35], '#858984', { materialOptions: { metalness: 0.52, roughness: 0.42 } });
  box(THREE, kitchen, 'range-top', [5.75, 0.12, 1.48], [-7.15, 1.23, -4.35], '#b2b3ad', { materialOptions: { metalness: 0.65, roughness: 0.32 } });
  for (const x of [-9.2, -7.7, -6.2, -4.7]) {
    cylinder(THREE, kitchen, 'burner-ring', 0.42, 0.42, 0.07, [x, 1.34, -4.35], '#343b38', 12, { materialOptions: { metalness: 0.65 } });
    cylinder(THREE, kitchen, 'burner-glow', 0.19, 0.19, 0.08, [x, 1.4, -4.35], '#c47a45', 10, { materialOptions: { emissive: '#a94f2e', emissiveIntensity: 0.65 } });
    const pot = cylinder(THREE, kitchen, 'saucepan', 0.48, 0.38, 0.58, [x, 1.7, -4.35], '#707571', 12, { materialOptions: { metalness: 0.55, roughness: 0.32 } });
    cylinder(THREE, kitchen, 'sauce', 0.35, 0.35, 0.04, [x, 2.0, -4.35], x === -7.7 ? '#945d40' : '#8c7457', 12);
    const lid = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.04, 5, 14), makeMaterial(THREE, '#b9b9b1', { metalness: 0.7 }));
    lid.rotation.x = Math.PI / 2;
    lid.position.set(x, 2.02, -4.35);
    kitchen.add(lid);
    pot.userData.steam = true;
  }
  box(THREE, kitchen, 'prep-table', [2.9, 0.18, 1.35], [-3.45, 1.12, -4.45], '#b2b4ad', { materialOptions: { metalness: 0.44 } });
  for (const x of [-4.5, -3.2, -2.0]) box(THREE, kitchen, 'prep-table-leg', [0.14, 1.06, 0.14], [x, 0.54, -4.45], '#6c716e');
  box(THREE, kitchen, 'cutting-board', [1.15, 0.1, 0.8], [-3.45, 1.26, -4.45], '#a9855c');
  for (const x of [-3.8, -3.5, -3.2]) cylinder(THREE, kitchen, 'chopped-vegetables', 0.13, 0.13, 0.08, [x, 1.36, -4.42], '#777b58', 7);
  box(THREE, kitchen, 'backsplash', [7.4, 1.2, 0.16], [-6.45, 2.2, -7.85], '#665a49');
  box(THREE, kitchen, 'kitchen-shelf', [6.6, 0.16, 0.62], [-6.45, 3.0, -7.5], '#73543a');
  for (let x = -9.3; x <= -3.6; x += 0.8) cylinder(THREE, kitchen, 'shelf-jar', 0.16, 0.17, 0.44, [x, 3.3, -7.48], x < -6 ? '#d7cbb2' : '#7d8068', 8);

  const cooks = [
    addHuman(THREE, kitchen, { x: -8.3, z: -6.25, role: 'cook', shirt: '#e6dfd1', skin: '#be896c', hair: '#40352c' }),
    addHuman(THREE, kitchen, { x: -5.4, z: -6.25, role: 'cook', shirt: '#e6dfd1', skin: '#d0a080', hair: '#352e29' }),
    addHuman(THREE, kitchen, { x: -4.3, z: -5.8, role: 'cook', shirt: '#9b7456', skin: '#9d7158', hair: '#2b2b29' }),
  ];
  return cooks;
}

function setupPickup(THREE, scene, orders) {
  box(THREE, scene, 'pickup-zone', [4.8, 0.08, 4], [6.65, 0.05, -5.3], '#8a7960');
  box(THREE, scene, 'service-counter-base', [4.15, 1.25, 1.45], [6.7, 0.65, -4.45], '#62452f');
  box(THREE, scene, 'counter-front-inlay', [3.85, 0.66, 0.08], [6.7, 0.68, -3.71], '#8c6845');
  box(THREE, scene, 'service-counter-top', [4.42, 0.18, 1.7], [6.7, 1.34, -4.45], '#ac8963');
  box(THREE, scene, 'counter-edge', [4.48, 0.12, 0.1], [6.7, 1.34, -3.62], '#c7aa7a');
  box(THREE, scene, 'screen-mount', [4.3, 2.6, 0.25], [6.7, 3.35, -7.65], '#38332d');
  const display = addLabel(THREE, scene, '', 3.9, 1.9, [6.7, 3.45, -7.48], { background: '#25231f', color: '#e4d9c2' });
  addLabel(THREE, scene, 'ORDER STATUS', 2.05, 0.36, [6.7, 2.03, -7.38], { background: '#514237', color: '#eee4d2', border: '#aa8961' });
  box(THREE, scene, 'pickup-shelf', [4.15, 0.16, 0.7], [6.7, 2.0, -6.8], '#8e6b47');
  cylinder(THREE, scene, 'ready-beacon-stem', 0.07, 0.09, 0.45, [9.12, 4.73, -7.45], '#665642', 8);
  const readyBeacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 10, 8),
    makeMaterial(THREE, '#d6d9bd', { emissive: '#8d9e69', emissiveIntensity: 0.12 }),
  );
  readyBeacon.name = 'ready-beacon';
  readyBeacon.position.set(9.12, 5.08, -7.45);
  scene.add(readyBeacon);
  readyBeacon.visible = false;
  const tray = new THREE.Group();
  tray.position.set(6.6, 1.68, -4.2);
  scene.add(tray);
  cylinder(THREE, tray, 'handoff-tray', 0.55, 0.55, 0.07, [0, 0, 0], '#e2d8c5', 14);
  cylinder(THREE, tray, 'handoff-food', 0.31, 0.31, 0.14, [0, 0.11, 0], '#a9653f', 9);
  const readyFood = [];
  for (let i = 0; i < 5; i += 1) {
    const plate = new THREE.Group();
    plate.position.set(5.05 + i * 0.82, 0, -3.93);
    scene.add(plate);
    cylinder(THREE, plate, 'ready-order-plate', 0.36, 0.36, 0.07, [0, 1.48, 0], '#e9e1d1', 16);
    cylinder(THREE, plate, 'ready-order-meal', 0.24, 0.24, 0.15, [0, 1.59, 0], ['#ad6943', '#9b8150', '#787a59', '#b5804c', '#986345'][i], 9);
    cylinder(THREE, plate, 'ready-garnish', 0.09, 0.09, 0.07, [0.1, 1.69, 0], '#78815e', 8);
    plate.visible = false;
    readyFood.push(plate);
  }
  drawOrderDisplay(display, orders);
  return { display, tray, readyFood, readyBeacon };
}

const CafeScene = ({ tables = [], orders = {}, onSelectTable, onSelectStation, onSelectSceneFeature, onSceneFocusStage, sceneFocus = null, onGuestCompleted, kitchenFocusOrder = null, onKitchenCameraStage }) => {
  const hostRef = useRef(null);
  const dataRef = useRef({ tables, orders, onSelectTable, onSelectStation, onSelectSceneFeature, onSceneFocusStage, sceneFocus, onGuestCompleted, kitchenFocusOrder, onKitchenCameraStage });
  useEffect(() => {
    dataRef.current = { tables, orders, onSelectTable, onSelectStation, onSelectSceneFeature, onSceneFocusStage, sceneFocus, onGuestCompleted, kitchenFocusOrder, onKitchenCameraStage };
  }, [tables, orders, onSelectTable, onSelectStation, onSelectSceneFeature, onSceneFocusStage, sceneFocus, onGuestCompleted, kitchenFocusOrder, onKitchenCameraStage]);

  useEffect(() => {
    const THREE = window.THREE;
    const host = hostRef.current;
    if (!THREE || !host) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#d6ded1');
    scene.fog = new THREE.Fog('#d6ded1', 54, 110);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.94;
    renderer.domElement.className = 'cafe-three-canvas';
    renderer.domElement.setAttribute('aria-label', 'Interactive three dimensional café. Click a table to watch a guest or order food. Click the kitchen, counter, pond, or trees to watch them in motion. Press 1 to 6 for a table, or O for order status.');
    renderer.domElement.tabIndex = 0;
    host.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(-20, 20, 20, -20, 0.1, 140);
    const cameraAngle = { theta: 0.31, phi: 0.88, radius: 54 };
    const horizontal = cameraAngle.radius * Math.sin(cameraAngle.phi);
    camera.position.set(horizontal * Math.sin(cameraAngle.theta), cameraAngle.radius * Math.cos(cameraAngle.phi), horizontal * Math.cos(cameraAngle.theta));
    const homeCameraPosition = camera.position.clone();
    const homeCameraTarget = new THREE.Vector3(0, 1.2, 1.2);
    const cameraTarget = homeCameraTarget.clone();
    camera.lookAt(cameraTarget);
    let cameraTransition = null;
    let cameraMode = 'default';

    const hemi = new THREE.HemisphereLight('#f5f2e6', '#514735', 0.82);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight('#ffe8c7', 1.85);
    sun.position.set(-16, 25, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 4;
    sun.shadow.normalBias = 0.035;
    sun.shadow.camera.left = -19;
    sun.shadow.camera.right = 19;
    sun.shadow.camera.top = 21;
    sun.shadow.camera.bottom = -20;
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    const fill = new THREE.DirectionalLight('#e4e9df', 0.34);
    fill.position.set(13, 14, 5);
    scene.add(fill);

    const courtyard = setupCourtyard(THREE, scene);
    setupRoom(THREE, scene);
    const cooks = setupKitchen(THREE, scene);
    const combinedTables = [...FALLBACK_TABLES];
    const liveTables = new Map((dataRef.current.tables || []).map((table) => [table.tableId, table]));
    const currentOrders = dataRef.current.orders || {};
    const physicalTables = combinedTables.map((fallback) => {
      const table = { ...fallback, ...(liveTables.get(fallback.tableId) || {}) };
      return table;
    });
    const tableMeshes = physicalTables.map((table, index) => createTable(THREE, scene, table, TABLE_SPOTS[index], index));
    setupDiningGuests(THREE, scene, tableMeshes);
    const pickup = setupPickup(THREE, scene, currentOrders);
    const cashier = addHuman(THREE, scene, {
      x: 9.02, z: -5.62, role: 'counter', shirt: '#65704f', skin: '#bd8667', hair: '#362f27',
    });
    cashier.rotation.y = 0;
    const server = addHuman(THREE, scene, { x: -1.7, z: -2.45, shirt: '#68725a', skin: '#c18a6b', hair: '#3d3028' });
    server.rotation.y = Math.PI / 2;
    pickup.tray.removeFromParent();
    server.userData.armPivots[1].add(pickup.tray);
    pickup.tray.position.set(0, -0.36, 0.2);

    const panSteam = [];
    for (const x of [-9.2, -7.7, -6.2, -4.7]) {
      for (let p = 0; p < 4; p += 1) {
        const steam = new THREE.Mesh(new THREE.SphereGeometry(0.075 + p * 0.01, 6, 5), new THREE.MeshBasicMaterial({ color: '#fff1d4', transparent: true, opacity: 0.3 }));
        steam.position.set(x + (p % 2) * 0.12, 2.05 + p * 0.18, -11.85);
        scene.add(steam);
        panSteam.push({ mesh: steam, phase: p * 0.7 + x });
      }
    }

    // Guests share the clear aisle and are time-staggered so their paths never cross tables.
    const walkers = [
      addHuman(THREE, scene, { x: -11, z: -1.65, shirt: '#5c6c70', skin: '#bd8163', hair: '#372e2c', rotation: Math.PI / 2 }),
      addHuman(THREE, scene, { x: -11, z: -1.65, shirt: '#85664d', skin: '#d2a080', hair: '#302a28', rotation: Math.PI / 2 }),
      addHuman(THREE, scene, { x: -11, z: -1.65, shirt: '#73765e', skin: '#9f6c52', hair: '#2e2d2b', rotation: Math.PI / 2 }),
    ];
    walkers.forEach((person, index) => { person.userData.walkerIndex = index; });

    const readyFood = pickup.readyFood;
    const guestJourneys = new Map();

    const hitPlane = new THREE.Mesh(new THREE.PlaneGeometry(38, 36), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide }));
    hitPlane.rotation.x = -Math.PI / 2;
    hitPlane.position.set(0, 0.025, 1.75);
    scene.add(hitPlane);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const clock = new THREE.Clock();
    let animationFrame = 0;
    let lastBoardSignature = '';
    let previousReady = (dataRef.current.orders.ready || []).length;
    let transferStartedAt = previousReady ? -5 : -10;
    const completedJourneyIds = new Set();
    let pointerDown = null;

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      const aspect = width / height;
      const viewHeight = Math.max(27.5, 35 / Math.max(aspect, 0.48));
      camera.left = -viewHeight * aspect / 2;
      camera.right = viewHeight * aspect / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const onPointerDown = (event) => { pointerDown = { x: event.clientX, y: event.clientY }; };
    const onKeyDown = (event) => {
      if (/^[1-6]$/.test(event.key)) dataRef.current.onSelectTable?.(FALLBACK_TABLES[Number(event.key) - 1].tableId);
      else if (event.key.toLowerCase() === 'o') dataRef.current.onSelectStation?.('pickup');
    };
    const onPointerUp = (event) => {
      if (pointerDown && Math.abs(event.clientX - pointerDown.x) + Math.abs(event.clientY - pointerDown.y) < 6) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const point = raycaster.intersectObject(hitPlane, false)[0]?.point;
        if (point) {
          const table = tableMeshes.find(({ spot }) => Math.hypot(point.x - spot.x, point.z - spot.z) < 1.24);
          if (table) dataRef.current.onSelectTable?.(table.table.tableId);
          else if (((point.x - 14.6) / 4.05) ** 2 + ((point.z - 1.1) / 2.95) ** 2 < 1) {
            dataRef.current.onSelectSceneFeature?.('pond', null, point);
          } else {
            const treeSpots = [{ x: -14.5, z: 9.5 }, { x: 13.6, z: 12.5 }, { x: 16.2, z: -5.7 }];
            const tree = treeSpots.find((spot) => Math.hypot(point.x - spot.x, point.z - spot.z) < 3.05);
            if (tree) dataRef.current.onSelectSceneFeature?.('trees', null, tree);
            else if (point.x > -11.8 && point.x < -1.2 && point.z < -8.9) dataRef.current.onSelectSceneFeature?.('kitchen', null, point);
            else if (point.x > 4.2 && point.x < 11.2 && point.z < -3.0 && point.z > -7.7) {
              if (point.z < -6.05 && point.x < 8.8) dataRef.current.onSelectStation?.('pickup');
              else dataRef.current.onSelectSceneFeature?.('counter', null, point);
            }
          }
        }
      }
      pointerDown = null;
    };
    const beginGuestJourney = (order, readyOrders, time) => {
      const tableId = orderTableId(order);
      const record = tableMeshes.find((table) => table.table.tableId === tableId);
      if (!record) return false;
      const tableIndex = tableMeshes.indexOf(record);
      const row = Math.floor(tableIndex / 3);
      const rowCount = Math.ceil(tableMeshes.length / 3);
      const corridorZ = row < rowCount - 1
        ? (TABLE_SPOTS[row * 3].z + TABLE_SPOTS[(row + 1) * 3].z) / 2
        : TABLE_SPOTS[row * 3].z + 3.0;
      const seat = { x: record.spot.x, z: record.spot.z + 1.43 };
      const walkStart = { x: record.spot.x, z: record.spot.z + 2.25 };
      const plateIndex = readyOrders.indexOf(order);
      const pickupX = 5.05 + plateIndex * 0.82;
      const toCounter = [
        walkStart,
        { x: walkStart.x, z: corridorZ },
        { x: -9.55, z: corridorZ },
        { x: -9.55, z: -2.75 },
        { x: pickupX, z: -2.75 },
      ];
      let seatedGuest = record.guest;
      if (!seatedGuest) {
        seatedGuest = addHuman(THREE, scene, {
          x: seat.x, z: seat.z, shirt: tableIndex % 2 ? '#66747a' : '#77765f', sitting: true, rotation: Math.PI,
        });
        seatedGuest.userData.tableId = tableId;
        record.guest = seatedGuest;
      }
      const customer = addHuman(THREE, scene, {
        x: walkStart.x, z: walkStart.z, shirt: tableIndex % 2 ? '#66747a' : '#77765f',
        skin: tableIndex % 3 === 0 ? '#bd8163' : '#d6a27e',
        hair: tableIndex % 2 ? '#302a28' : '#352a28',
        rotation: Math.PI / 2,
      });
      seatedGuest.visible = false;
      const id = String(order._id || order.orderNumber || order.displayOrderId);
      const plate = readyFood[plateIndex];
      if (plate) plate.visible = true;
      guestJourneys.set(id, {
        id, order, tableId, tableIndex, record, seat, walkStart, pickupX, seatedGuest, customer, plate,
        plateIndex, toCounter, toTable: [...toCounter].reverse(),
        toExit: [walkStart, toCounter[1], toCounter[2], { x: -9.55, z: -1.6 }, { x: -10.55, z: -1.6 }],
        phase: 'toCounter', phaseStartedAt: time, foodTaken: false,
      });
      return true;
    };
    const moveCustomer = (journey, path, elapsed) => {
      const distance = Math.min(pathLength(path), elapsed * 1.55);
      const point = pointAlongPath(path, distance);
      const next = pointAlongPath(path, Math.min(pathLength(path), distance + 0.08));
      journey.customer.position.set(point.x, Math.abs(Math.sin(elapsed * 9)) * 0.035, point.z);
      journey.customer.rotation.y = Math.atan2(next.x - point.x, next.z - point.z);
      const stride = Math.sin(elapsed * 9) * 0.35;
      journey.customer.userData.legPivots?.forEach((leg, index) => { leg.rotation.x = stride * (index ? -1 : 1); });
      journey.customer.userData.armPivots?.forEach((arm, index) => { arm.rotation.x = stride * (index ? 1 : -1) * 0.4; });
      return distance >= pathLength(path);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('keydown', onKeyDown);

    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const currentOrders = dataRef.current.orders || {};
      const focusOrder = dataRef.current.kitchenFocusOrder;
      const activeSceneFocus = dataRef.current.sceneFocus;
      const sceneFocusKey = activeSceneFocus ? `${activeSceneFocus.place}:${activeSceneFocus.id}` : '';
      const requestedCameraMode = focusOrder
        ? focusOrder.preparationStatus === 'ready' ? 'counter' : 'kitchen'
        : activeSceneFocus ? `showcase:${sceneFocusKey}` : 'default';
      if (requestedCameraMode !== cameraMode) {
        cameraMode = requestedCameraMode;
        const destinations = {
          kitchen: { position: new THREE.Vector3(-7.0, 6.7, -2.2), target: new THREE.Vector3(-6.8, 2.6, -12.15), zoom: 2.05, duration: 5 },
          counter: { position: new THREE.Vector3(6.7, 6.8, 2.5), target: new THREE.Vector3(6.7, 2.0, -5.2), zoom: 2.0, duration: 2.4 },
          default: { position: homeCameraPosition, target: homeCameraTarget, zoom: 1, duration: 1.7 },
        };
        let destination = destinations[requestedCameraMode] || destinations.default;
        if (activeSceneFocus && !focusOrder) {
          const focusPlace = activeSceneFocus.place;
          const tableRecord = focusPlace === 'table' ? tableMeshes.find((record) => record.table.tableId === activeSceneFocus.tableId) : null;
          if (focusPlace === 'kitchen') destination = { ...destinations.kitchen, duration: 1.7 };
          else if (focusPlace === 'counter') destination = { ...destinations.counter, duration: 1.55 };
          else if (tableRecord) {
            const target = new THREE.Vector3(tableRecord.spot.x, 1.35, tableRecord.spot.z + 0.35);
            destination = { position: new THREE.Vector3(target.x + 5.6, target.y + 5.2, target.z + 8.1), target, zoom: 2.05, duration: 1.45 };
          } else if (focusPlace === 'pond') {
            destination = { position: new THREE.Vector3(21.4, 6.2, 8.6), target: new THREE.Vector3(14.6, 0.0, 1.1), zoom: 2.05, duration: 1.55 };
          } else if (focusPlace === 'trees') {
            const tree = activeSceneFocus.x !== undefined
              ? { x: activeSceneFocus.x, z: activeSceneFocus.z }
              : { x: -14.5, z: 9.5 };
            const target = new THREE.Vector3(tree.x, 2.5, tree.z);
            destination = { position: new THREE.Vector3(tree.x + 5.5, 8.1, tree.z + 9), target, zoom: 1.95, duration: 1.6 };
          }
        }
        cameraTransition = {
          start: time,
          duration: destination.duration,
          fromPosition: camera.position.clone(),
          fromTarget: cameraTarget.clone(),
          fromZoom: camera.zoom,
          toPosition: destination.position.clone(),
          toTarget: destination.target.clone(),
          toZoom: destination.zoom,
          mode: requestedCameraMode,
          isOrderFocus: Boolean(focusOrder),
          sceneFocusId: activeSceneFocus?.id,
          orderId: String(focusOrder?._id || focusOrder?.orderNumber || focusOrder?.displayOrderId || ''),
        };
        if (focusOrder && requestedCameraMode !== 'default') {
          dataRef.current.onKitchenCameraStage?.(`travelling-to-${requestedCameraMode}`, cameraTransition.orderId);
        } else if (activeSceneFocus) {
          dataRef.current.onSceneFocusStage?.('travelling', activeSceneFocus.id);
        }
      }
      if (cameraTransition) {
        const progress = Math.min(1, (time - cameraTransition.start) / cameraTransition.duration);
        const eased = progress * progress * (3 - 2 * progress);
        camera.position.lerpVectors(cameraTransition.fromPosition, cameraTransition.toPosition, eased);
        cameraTarget.lerpVectors(cameraTransition.fromTarget, cameraTransition.toTarget, eased);
        camera.zoom = cameraTransition.fromZoom + (cameraTransition.toZoom - cameraTransition.fromZoom) * eased;
        camera.lookAt(cameraTarget);
        camera.updateProjectionMatrix();
        if (progress >= 1) {
          if (cameraTransition.isOrderFocus && cameraTransition.mode !== 'default') dataRef.current.onKitchenCameraStage?.(cameraTransition.mode, cameraTransition.orderId);
          else if (cameraTransition.sceneFocusId) dataRef.current.onSceneFocusStage?.('focused', cameraTransition.sceneFocusId);
          cameraTransition = null;
        }
      }
      const dineInOrders = [...(currentOrders.queued || []), ...(currentOrders.preparing || []), ...(currentOrders.ready || [])];
      tableMeshes.forEach((record) => {
        const tableId = record.table.tableId;
        const tableShowcase = activeSceneFocus?.place === 'table' && activeSceneFocus.tableId === tableId;
        const liveTable = (dataRef.current.tables || []).find((table) => table.tableId === tableId);
        const isOccupied = liveTable ? liveTable.status === 'occupied' : record.table.status === 'occupied';
        const seatGuests = isOccupied || tableShowcase;
        record.reservedMarker.visible = liveTable ? liveTable.status === 'reserved' : record.table.status === 'reserved';
        // When a fresh table order arrives and nobody is yet walking to/from this table,
        // start the guest pickup journey right away (not only when the order reaches Ready).
        if (!seatGuests && !tableShowcase) {
          const unresolvedHere = dineInOrders.find((order) => {
            const id = String(order._id || order.orderNumber || order.displayOrderId);
            const alreadyFinished = [...guestJourneys.values()].some((item) => item.id === id && item.phase === 'complete');
            return orderTableId(order) === tableId && !completedJourneyIds.has(id) && !alreadyFinished;
          });
          if (unresolvedHere && ![...guestJourneys.values()].some((item) => item.tableId === tableId && item.phase !== 'complete')) {
            const journeyAlreadyQueued = [...guestJourneys.values()].some((item) => item.tableId === tableId && item.phase === 'toCounter');
            if (!journeyAlreadyQueued) beginGuestJourney(unresolvedHere, currentOrders.ready || [], time);
          }
        }
        const unresolvedOrders = dineInOrders.filter((order) => {
          const id = String(order._id || order.orderNumber || order.displayOrderId);
          const journeyFinished = [...guestJourneys.values()].some((item) => item.id === id && item.phase === 'complete');
          return orderTableId(order) === tableId && !completedJourneyIds.has(id) && !journeyFinished;
        });
        const journey = [...guestJourneys.values()].find((item) => item.tableId === tableId && item.phase !== 'complete');
        record.ambientGuests.forEach((guest, guestIndex) => {
          guest.visible = !journey && seatGuests;
          const diningStyle = guest.userData.diningStyle;
          const tempo = diningStyle === 'elder' ? 0.92 : diningStyle === 'child' ? 1.75 : tableShowcase ? 2.35 : 1.4;
          const phase = time * tempo + guest.userData.eatPhase;
          const bite = (Math.sin(phase) + 1) / 2;
          const eatingArm = guest.userData.armPivots?.[1];
          const restingArm = guest.userData.armPivots?.[0];
          if (eatingArm) {
            eatingArm.rotation.x = -0.12 - bite * (tableShowcase ? 0.98 : 0.68);
            eatingArm.rotation.z = -0.08 - bite * 0.14;
          }
          const eatingElbow = guest.userData.elbowPivots?.[1];
          if (eatingElbow) eatingElbow.rotation.x = bite > 0.58 ? 0.38 : 0;
          if (restingArm) {
            restingArm.rotation.x = 0.12 + Math.sin(phase * 0.42 + guestIndex) * 0.07;
            restingArm.rotation.z = Math.sin(phase * 0.36) * 0.035;
          }
          if (diningStyle === 'child' && guest.userData.armPivots?.[0]) {
            guest.userData.armPivots[0].rotation.x = 0.18 + Math.sin(phase * 1.8) * 0.2;
          }
          if (guest.userData.head) {
            const conversation = guest.userData.diningStyle === 'couple' || guest.userData.diningStyle === 'family' || guest.userData.diningStyle === 'elder';
            guest.userData.head.rotation.y = conversation ? Math.sin(phase * 0.44) * (tableShowcase ? 0.18 : 0.1) : 0;
            guest.userData.head.rotation.x = -0.035 + Math.max(0, Math.sin(phase)) * 0.07;
          }
          guest.position.y = Math.sin(phase * 0.5) * (diningStyle === 'child' ? 0.025 : 0.014);
        });
        record.ambientDishes.forEach((dish) => { dish.visible = !journey && seatGuests; });
        // The showcase dish mirrors the seated guests' plate setting so the table looks
        // consistent with the people sitting at it during a table showcase.
        record.showcaseDish.visible = tableShowcase && !journey;
        if (record.guest) {
          if (journey) record.guest.visible = journey.phase === 'eat';
          else if (unresolvedOrders.length) record.guest.visible = true;
          else if ([...guestJourneys.values()].some((item) => item.tableId === tableId && item.phase === 'complete')) record.guest.visible = false;
        }
      });
      const readyCount = (currentOrders.ready || []).length;
      const queuedCount = (currentOrders.queued || []).length;
      const alertFrame = queuedCount ? Math.floor(time * 3) : 0;
      const signature = `${readyCount}|${(currentOrders.preparing || []).length}|${queuedCount}|${(currentOrders.ready || []).map((order) => order.orderNumber || order.displayOrderId || order._id).join(',')}|${alertFrame}`;
      if (signature !== lastBoardSignature) {
        drawOrderDisplay(pickup.display, currentOrders, time);
        lastBoardSignature = signature;
      }
      if (readyCount > previousReady) transferStartedAt = time;
      previousReady = readyCount;
      const transferring = readyCount > 0 && time - transferStartedAt < 2.8;
      const transfer = Math.max(0, Math.min(1, (time - transferStartedAt) / 2.8));
      const readyOrders = currentOrders.ready || [];
      const activeJourney = [...guestJourneys.values()].some((journey) => journey.phase !== 'complete');
      const completedStillOnBoard = readyOrders.some((order) =>
        completedJourneyIds.has(String(order._id || order.orderNumber || order.displayOrderId)));
      if (!transferring && !activeJourney && !completedStillOnBoard) {
        const nextOrder = readyOrders.find((order) => {
          const id = String(order._id || order.orderNumber || order.displayOrderId);
          return !completedJourneyIds.has(id) && !guestJourneys.has(id);
        });
        if (nextOrder && readyOrders.indexOf(nextOrder) < readyFood.length) beginGuestJourney(nextOrder, readyOrders, time);
      }
      guestJourneys.forEach((journey) => {
        if (journey.foodTaken || journey.phase === 'complete') return;
        const currentIndex = readyOrders.findIndex((order) => String(order._id || order.orderNumber || order.displayOrderId) === journey.id);
        if (currentIndex >= 0 && currentIndex < readyFood.length && currentIndex !== journey.plateIndex) {
          if (journey.plate) journey.plate.visible = false;
          journey.plateIndex = currentIndex;
          journey.plate = readyFood[currentIndex];
        }
      });
      server.visible = transferring;
      // Move from the kitchen handoff through the service lane to the counter's clear end.
      server.position.x = -1.7 + transfer * 5.85;
      server.position.z = -2.45 - transfer * 0.68;
      server.rotation.y = Math.PI / 2 + transfer * Math.PI / 2;
      const walkingArm = Math.sin(time * 8) * 0.12;
      if (server.userData.armPivots?.[0]) server.userData.armPivots[0].rotation.x = walkingArm;
      if (server.userData.armPivots?.[1]) server.userData.armPivots[1].rotation.x = -0.14 + walkingArm;
      server.userData.legPivots?.forEach((leg, index) => { leg.rotation.x = Math.sin(time * 8 + index * Math.PI) * (transferring ? 0.42 : 0); });
      pickup.readyBeacon.visible = readyCount > 0;
      pickup.readyBeacon.material.emissiveIntensity = readyCount > 0 ? 0.55 + (Math.sin(time * 5) + 1) * 0.42 : 0.12;
      pickup.readyBeacon.scale.setScalar(readyCount > 0 ? 1 + (Math.sin(time * 5) + 1) * 0.08 : 1);
      const carriedPlateIndices = new Set([...guestJourneys.values()]
        .filter((journey) => journey.foodTaken && journey.phase !== 'complete')
        .map((journey) => journey.plateIndex));
      const completedPlateIndices = new Set(readyOrders.reduce((indices, order, index) => {
        const id = String(order._id || order.orderNumber || order.displayOrderId);
        if (completedJourneyIds.has(id)) indices.push(index);
        return indices;
      }, []));
      readyFood.forEach((plate, index) => {
        if (!carriedPlateIndices.has(index)) {
          plate.position.set(5.05 + index * 0.82, 0, -3.93);
          plate.visible = index < Math.min(readyCount, readyFood.length) && !transferring && !completedPlateIndices.has(index);
        }
      });

      guestJourneys.forEach((journey) => {
        const elapsed = time - journey.phaseStartedAt;
        if (journey.phase === 'toCounter') {
          if (moveCustomer(journey, journey.toCounter, elapsed)) {
            journey.phase = 'collect';
            journey.phaseStartedAt = time;
          }
        } else if (journey.phase === 'collect') {
          journey.customer.rotation.y = Math.PI;
          journey.customer.userData.armPivots?.[1]?.rotation.set(0, 0, -0.18 - Math.min(elapsed / 0.55, 1) * 0.48);
          if (elapsed > 0.5) journey.foodTaken = true;
          if (elapsed > 1.25) {
            journey.phase = 'toTable';
            journey.phaseStartedAt = time;
          }
        } else if (journey.phase === 'toTable') {
          const arrived = moveCustomer(journey, journey.toTable, elapsed);
          if (journey.plate && journey.foodTaken) {
            const forwardX = Math.sin(journey.customer.rotation.y) * 0.42;
            const forwardZ = Math.cos(journey.customer.rotation.y) * 0.42;
            journey.plate.position.set(journey.customer.position.x + forwardX, 0, journey.customer.position.z + forwardZ);
            journey.plate.visible = true;
          }
          if (arrived) {
            journey.customer.visible = false;
            journey.seatedGuest.visible = true;
            if (journey.plate) journey.plate.position.set(journey.record.spot.x, -0.45, journey.record.spot.z);
            journey.phase = 'eat';
            journey.phaseStartedAt = time;
          }
        } else if (journey.phase === 'eat') {
          const eating = Math.max(0, Math.sin(time * 2.2));
          if (journey.seatedGuest.userData.armPivots?.[1]) {
            journey.seatedGuest.userData.armPivots[1].rotation.x = -0.12 - eating * 0.42;
            journey.seatedGuest.userData.armPivots[1].rotation.z = -0.08;
          }
          if (elapsed > 7.5) {
            journey.seatedGuest.visible = false;
            journey.customer.visible = true;
            journey.customer.position.set(journey.walkStart.x, 0, journey.walkStart.z);
            journey.phase = 'toExit';
            journey.phaseStartedAt = time;
            if (journey.plate) journey.plate.visible = false;
          }
        } else if (journey.phase === 'toExit' && moveCustomer(journey, journey.toExit, elapsed)) {
          journey.phase = 'finishing';
          journey.customer.visible = false;
          journey.seatedGuest.visible = false;
          // Only mark an order served for real fulfillments (ready orders that had a plate).
          // Preview/journey demos for queued or preparing orders, and table showcases with no
          // ready plate, complete silently so a freshly placed order can run its animation
          // without hitting a status transition the API rejects from 'new'.
          const orderReadyForFulfillment = !!(journey.order && journey.order.preparationStatus === 'ready');
          if (orderReadyForFulfillment) {
            Promise.resolve(dataRef.current.onGuestCompleted?.(journey.order)).then(() => {
              completedJourneyIds.add(journey.id);
              journey.phase = 'complete';
            }).catch(() => {
              guestJourneys.delete(journey.id);
            });
          } else {
            completedJourneyIds.add(journey.id);
            journey.phase = 'complete';
          }
        }
      });

      const activeOrder = (currentOrders.preparing || [])[0];
      const activeItems = (activeOrder?.items || []).map((item) => item.name || item.menuItem?.name || '').join(' ').toLowerCase();
      const beverageOrder = /coffee|tea|latte|espresso|juice|shake|smoothie/.test(activeItems);
      const grillOrder = /toast|sandwich|wrap|panini|burger|fries/.test(activeItems);
      cooks.forEach((cook, index) => {
        const armPivots = cook.userData.armPivots || [];
        const active = Boolean(activeOrder || (activeSceneFocus && activeSceneFocus.place === 'kitchen'));
        armPivots.forEach((arm, armIndex) => {
          const phase = time * (beverageOrder ? 2.7 : grillOrder ? 5.6 : 4.2) + armIndex * Math.PI + index * 0.45;
          if (active && beverageOrder) {
            arm.rotation.x = armIndex === 1 ? -0.65 + Math.sin(phase) * 0.14 : Math.sin(phase) * 0.13;
            arm.rotation.z = armIndex === 1 ? -0.2 + Math.sin(phase * 0.5) * 0.08 : 0;
          } else if (active && grillOrder) {
            arm.rotation.x = Math.sin(phase) * (index === 2 ? 0.18 : 0.08);
            arm.rotation.z = Math.sin(phase) * (armIndex ? -0.42 : 0.42);
          } else if (!active && index === 0) {
            arm.rotation.x = armIndex === 1 ? -0.58 + Math.sin(phase) * 0.13 : Math.sin(phase) * 0.11;
            arm.rotation.z = armIndex === 1 ? -0.16 + Math.sin(phase * 0.5) * 0.07 : 0;
          } else if (!active && index === 1) {
            arm.rotation.x = -0.12 + Math.sin(phase * 1.35) * 0.19;
            arm.rotation.z = Math.sin(phase * 1.35) * (armIndex ? -0.2 : 0.2);
          } else if (!active && index === 2) {
            arm.rotation.x = armIndex === 1 ? -0.24 + Math.sin(phase * 0.8) * 0.11 : Math.sin(phase * 0.8) * 0.09;
            arm.rotation.z = armIndex === 1 ? -0.18 : 0;
          } else {
            arm.rotation.x = active ? Math.sin(phase) * (index === 2 ? 0.18 : 0.38) : Math.sin(time * 1.1 + index) * 0.08;
            arm.rotation.z = active && index === 2 ? Math.sin(phase) * (armIndex ? -0.34 : 0.34) : 0;
          }
        });
        cook.position.y = Math.abs(Math.sin(time * (active ? 5 : 1.5) + index)) * (active ? 0.035 : 0.012);
      });

      const counterShowcase = activeSceneFocus?.place === 'counter';
      cashier.position.y = Math.abs(Math.sin(time * (counterShowcase ? 2.1 : 1.25))) * (counterShowcase ? 0.04 : 0.015);
      if (cashier.userData.armPivots?.[1]) {
        const workingPhase = time * (counterShowcase ? 2.2 : 0.7);
        cashier.userData.armPivots[1].rotation.z = Math.sin(workingPhase) * (counterShowcase ? 0.24 : 0.045);
        cashier.userData.armPivots[0].rotation.x = -0.08 + Math.max(0, Math.sin(workingPhase + 0.8)) * (counterShowcase ? 0.35 : 0.08);
      }
      courtyard.birds.forEach((bird) => {
        const birdsPlaying = activeSceneFocus?.place === 'trees';
        const phase = time * (birdsPlaying ? 0.62 : 0.28) + bird.userData.phase;
        const flightCenter = birdsPlaying ? bird.userData.treeSpot : bird.userData.home;
        bird.position.x = flightCenter.x + Math.sin(phase) * (birdsPlaying ? 1.75 : 1.15);
        bird.position.y = (birdsPlaying ? 5.1 : bird.userData.home.y) + Math.sin(phase * 1.7) * (birdsPlaying ? 0.5 : 0.32);
        bird.position.z = flightCenter.z + Math.cos(phase) * (birdsPlaying ? 1.35 : 0.75);
        bird.rotation.y = Math.sin(phase) * 0.14;
        bird.userData.wings.forEach((wing, index) => { wing.rotation.x = (index ? 1 : -1) * (0.16 + Math.sin(time * (birdsPlaying ? 8 : 5) + bird.userData.phase) * 0.55); });
      });
      courtyard.pondRipples.forEach(({ mesh, phase }) => {
        const cycle = (time * 0.42 + phase) % 1;
        const rippleScale = 0.72 + cycle * 1.25;
        mesh.scale.set(1.7 * rippleScale, 1, 0.82 * rippleScale);
        mesh.material.opacity = (1 - cycle) * 0.2;
      });
      courtyard.pondFish.forEach(({ mesh, phase, radius }) => {
        const fishSpeed = activeSceneFocus?.place === 'pond' ? 1.25 : 0.48;
        const fishPhase = time * fishSpeed + phase;
        mesh.position.set(14.6 + Math.cos(fishPhase) * radius, -0.22 + Math.sin(fishPhase * 2) * 0.025, 1.1 + Math.sin(fishPhase) * radius * 0.58);
        mesh.rotation.y = -fishPhase;
        if (mesh.children[1]) mesh.children[1].rotation.y = Math.sin(time * 7 + phase) * 0.4;
      });

      walkers.forEach((person, index) => {
        const cycle = 30;
        const phase = (time / cycle + index / walkers.length) % 1;
        const arriving = phase < 0.32;
        const waiting = phase >= 0.32 && phase < 0.44;
        const leaving = phase >= 0.44 && phase < 0.76;
        person.visible = arriving || waiting || leaving;
        if (person.visible) {
          const progress = arriving ? phase / 0.32 : waiting ? 1 : 1 - (phase - 0.44) / 0.32;
          person.position.x = -10.4 + progress * 15.2;
          person.position.z = arriving ? -1.75 : leaving ? -2.55 : -2.15;
          person.rotation.y = leaving ? -Math.PI / 2 : Math.PI / 2;
          person.position.y = Math.abs(Math.sin(time * 8 + index * 2)) * 0.035;
          const stride = waiting ? 0 : Math.sin(time * 8 + index * 2) * 0.38;
          (person.userData.legPivots || []).forEach((leg, legIndex) => { leg.rotation.x = stride * (legIndex ? -1 : 1); });
          (person.userData.armPivots || []).forEach((arm, armIndex) => { arm.rotation.x = stride * (armIndex ? 1 : -1) * 0.55; });
          if (phase > 0.72) person.visible = false;
        }
      });
      panSteam.forEach(({ mesh, phase }) => {
        const cycle = (time * 0.7 + phase) % 2.1;
        mesh.position.y = 2.08 + cycle * 0.72;
        mesh.position.x += Math.sin(time + phase) * 0.0008;
        mesh.material.opacity = Math.max(0, 0.28 * (1 - cycle / 2.1));
      });
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('keydown', onKeyDown);
      scene.traverse((object) => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="cafe-3d-world" role="application" aria-label="Explore and use the three dimensional Little Window Café" />;
};

export default CafeScene;
