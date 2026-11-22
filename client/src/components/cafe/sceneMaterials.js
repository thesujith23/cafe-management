import { createTextureFactory } from './sceneTextures';

// The room asks for a material once per mesh, often with the same colour and finish.
// This library hands back one shared instance per distinct combination instead of
// compiling hundreds of identical shaders and uploading the same maps repeatedly.

const serializeOption = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'string') return value;
  if (value.isTexture) return `texture:${value.uuid}`;
  if (value.isColor) return `color:${value.getHexString()}`;
  if (typeof value === 'function') return 'fn';
  return JSON.stringify(value);
};

const optionKey = (options) => Object.keys(options)
  .sort()
  .map((key) => `${key}=${serializeOption(options[key])}`)
  .join(';');

const toneOf = (color) => (typeof color === 'string' ? color : color?.getHexString?.() || '');

export const createMaterialLibrary = (THREE) => {
  const textures = createTextureFactory(THREE);
  const cache = new Map();

  const remember = (kind, color, options, build) => {
    const key = `${kind}|${toneOf(color)}|${optionKey(options)}`;
    let material = cache.get(key);
    if (!material) {
      material = build();
      material.name = key;
      cache.set(key, material);
    }
    return material;
  };

  const standard = (color, options = {}) => remember('standard', color, options,
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.82, ...options }));

  const physical = (color, options = {}) => remember('physical', color, options,
    () => new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, ...options }));

  const finished = (surface, color, options = {}) => standard(color, {
    map: surface.map,
    roughnessMap: surface.roughnessMap,
    bumpMap: surface.bumpMap,
    bumpScale: surface.bumpScale,
    ...options,
  });

  return {
    textures,
    standard,
    physical,
    wood: (color, options = {}) => finished(textures.wood, color, options),
    plaster: (color, options = {}) => finished(textures.plaster, color, { roughness: 0.95, ...options }),
    fabric: (color, options = {}) => finished(textures.fabric, color, { roughness: 0.94, ...options }),
    steel: (color, options = {}) => finished(textures.steel, color, { metalness: 0.8, roughness: 0.34, ...options }),
    tile: (color, options = {}) => finished(textures.tile, color, { roughness: 0.86, ...options }),
    marble: (color, options = {}) => finished(textures.marble, color, { roughness: 0.17, ...options }),
    // Upholstery with sheen: velvet is the fabric in the reference room, and the sheen
    // term is what makes a chair back glow at its edges instead of reading as felt.
    velvet: (color, options = {}) => physical(color, {
      map: textures.fabric.map,
      roughnessMap: textures.fabric.roughnessMap,
      roughness: 0.82,
      sheen: 0.7,
      sheenColor: new THREE.Color(color).offsetHSL(0, 0, 0.16),
      sheenRoughness: 0.55,
      ...options,
    }),
    brass: (color, options = {}) => standard(color, { metalness: 0.92, roughness: 0.3, ...options }),
    rug: (key, options = {}) => remember('rug', key, options, () => new THREE.MeshStandardMaterial({
      map: textures[key].map,
      roughnessMap: textures[key].roughnessMap,
      roughness: 0.96,
      ...options,
    })),
    // Glazed crockery: the clearcoat is what makes a mug read as fired clay rather
    // than a painted cylinder.
    ceramic: (color, options = {}) => physical(color, {
      map: textures.ceramic.map,
      roughnessMap: textures.ceramic.roughnessMap,
      clearcoat: 0.72,
      clearcoatRoughness: 0.22,
      roughness: 0.36,
      ...options,
    }),
    dispose: () => {
      cache.forEach((material) => material.dispose());
      cache.clear();
      textures.dispose();
    },
  };
};

// A rounded box, built by extruding a rounded rectangle. The bevel is small — 1.5 cm on
// a chair — but it is the difference between "block" and "furniture": every edge now
// carries a highlight instead of a hard 90° corner.
export const roundedBoxGeometry = (THREE, width, height, depth, radius = 0.06, bevel = 0.016) => {
  const innerBevel = Math.min(bevel, Math.min(width, height, depth) / 3);
  const halfWidth = Math.max(0.01, width / 2 - innerBevel);
  const halfHeight = Math.max(0.01, height / 2 - innerBevel);
  const corner = Math.min(radius, halfWidth - 0.002, halfHeight - 0.002);

  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + corner, -halfHeight);
  shape.lineTo(halfWidth - corner, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + corner);
  shape.lineTo(halfWidth, halfHeight - corner);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - corner, halfHeight);
  shape.lineTo(-halfWidth + corner, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - corner);
  shape.lineTo(-halfWidth, -halfHeight + corner);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + corner, -halfHeight);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.002, depth - innerBevel * 2),
    bevelEnabled: true,
    bevelThickness: innerBevel,
    bevelSize: innerBevel,
    bevelSegments: 2,
    curveSegments: 3,
    steps: 1,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
};
