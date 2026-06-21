import * as THREE from "../vendor/three.module.js";
import { objectInfo, competencyFramework } from "./content.js";

const canvas = document.getElementById("scene");
const loading = document.getElementById("loading");
const fallback = document.getElementById("webglFallback");
const locationLabel = document.getElementById("locationLabel");
const roomNav = document.getElementById("roomNav");
const infoPanel = document.getElementById("infoPanel");
const infoTitle = document.getElementById("infoTitle");
const infoDescription = document.getElementById("infoDescription");
const infoBody = document.getElementById("infoBody");
const closeInfo = document.getElementById("closeInfo");
const resetView = document.getElementById("resetView");
const imageDialog = document.getElementById("imageDialog");
const largeImage = document.getElementById("largeImage");
const closeImage = document.getElementById("closeImage");
const documentDialog = document.getElementById("documentDialog");
const documentTitle = document.getElementById("documentTitle");
const documentNote = document.getElementById("documentNote");
const documentFrame = document.getElementById("documentFrame");
const closeDocument = document.getElementById("closeDocument");

const bundledOutput = location.protocol === "file:" || location.pathname.endsWith("/outputs/kindergarten-three.html");
const assetUrl = path => path?.startsWith("assets/") ? (bundledOutput ? path : `../outputs/${path}`) : path;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
} catch (error) {
  fallback.hidden = false;
  loading.classList.add("hidden");
  throw error;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8d8ed);
scene.fog = new THREE.Fog(0xa8d8ed, 75, 145);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.12, 190);
camera.rotation.order = "YXZ";

const hemi = new THREE.HemisphereLight(0xeaf7ff, 0x6a8057, 2.15);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d2, 3.2);
sun.position.set(-35, 48, 42);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xb7dcff, 1.1);
fill.position.set(45, 20, -55);
scene.add(fill);

function createTexture(size, draw, repeatX, repeatY) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = textureCanvas.height = size;
  const context = textureCanvas.getContext("2d");
  draw(context, size);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

const grassTexture = createTexture(256, (ctx, size) => {
  ctx.fillStyle = "#5d9d48";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1600; i++) {
    const tone = 85 + Math.floor(Math.random() * 70);
    ctx.fillStyle = `rgba(${45 + tone / 5},${tone + 65},${40 + tone / 7},.32)`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 2 + Math.random() * 3);
  }
}, 28, 34);

const woodTexture = createTexture(256, (ctx, size) => {
  const gradient = ctx.createLinearGradient(0, 0, size, 0);
  gradient.addColorStop(0, "#d3a469");
  gradient.addColorStop(.5, "#e0ba82");
  gradient.addColorStop(1, "#bf8c55");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(82,50,25,.3)";
  ctx.lineWidth = 2;
  for (let x = 0; x < size; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, size); ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.lineWidth = 1;
  for (let y = 8; y < size; y += 13) {
    ctx.beginPath();
    for (let x = 0; x <= size; x += 8) ctx.lineTo(x, y + Math.sin(x * .11 + y) * 1.8);
    ctx.stroke();
  }
}, 5, 2);

const floorTexture = createTexture(256, (ctx, size) => {
  ctx.fillStyle = "#c89459";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 42) {
    for (let x = 0; x < size; x += 84) {
      ctx.fillStyle = (x / 84 + y / 42) % 2 ? "#d8aa70" : "#bd824b";
      ctx.fillRect(x, y, 82, 40);
      ctx.strokeStyle = "rgba(70,40,20,.25)";
      ctx.strokeRect(x, y, 82, 40);
    }
  }
}, 16, 18);

const pathTexture = createTexture(192, (ctx, size) => {
  ctx.fillStyle = "#d5c39b";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = i % 3 ? "rgba(112,99,72,.3)" : "rgba(255,244,204,.6)";
    const radius = 1 + Math.random() * 2;
    ctx.beginPath(); ctx.arc(Math.random() * size, Math.random() * size, radius, 0, Math.PI * 2); ctx.fill();
  }
}, 2, 13);

const materials = {
  grass: new THREE.MeshStandardMaterial({ map: grassTexture, roughness: .98, color: 0xffffff }),
  floor: new THREE.MeshStandardMaterial({ map: floorTexture, roughness: .78, color: 0xffffff }),
  path: new THREE.MeshStandardMaterial({ map: pathTexture, roughness: .94, color: 0xffffff }),
  track: new THREE.MeshStandardMaterial({ color: 0x59635f, roughness: .95 }),
  wood: new THREE.MeshStandardMaterial({ map: woodTexture, roughness: .72, color: 0xffffff }),
  woodDark: new THREE.MeshStandardMaterial({ color: 0x8f5a31, roughness: .78 }),
  woodLight: new THREE.MeshStandardMaterial({ color: 0xd9ad70, roughness: .76 }),
  wall: new THREE.MeshStandardMaterial({ color: 0xf2eee4, roughness: .86 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x253536, roughness: .55, metalness: .1 }),
  roof: new THREE.MeshStandardMaterial({ color: 0x354241, roughness: .72, transparent: true, opacity: .96 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x9ed4df, roughness: .12, transmission: .38, transparent: true, opacity: .55, metalness: 0, depthWrite: false }),
  blue: new THREE.MeshStandardMaterial({ color: 0x4d9dca, roughness: .58 }),
  coral: new THREE.MeshStandardMaterial({ color: 0xd66c59, roughness: .62 }),
  yellow: new THREE.MeshStandardMaterial({ color: 0xe4bc4f, roughness: .6 }),
  sage: new THREE.MeshStandardMaterial({ color: 0x81a276, roughness: .68 }),
  violet: new THREE.MeshStandardMaterial({ color: 0x8370ad, roughness: .62 }),
  cream: new THREE.MeshStandardMaterial({ color: 0xf4ead2, roughness: .75 }),
  metal: new THREE.MeshStandardMaterial({ color: 0xaebbbc, roughness: .3, metalness: .68 }),
  water: new THREE.MeshPhysicalMaterial({ color: 0x4ca9c5, roughness: .12, transmission: .28, transparent: true, opacity: .82, depthWrite: false }),
  lightGlow: new THREE.MeshStandardMaterial({ color: 0xe8fbff, emissive: 0xbdefff, emissiveIntensity: .85, roughness: .18 }),
  acrylicRed: new THREE.MeshPhysicalMaterial({ color: 0xff4055, transmission: .22, transparent: true, opacity: .62, roughness: .12, depthWrite: false, side: THREE.DoubleSide }),
  acrylicYellow: new THREE.MeshPhysicalMaterial({ color: 0xffd52e, transmission: .22, transparent: true, opacity: .62, roughness: .12, depthWrite: false, side: THREE.DoubleSide }),
  acrylicBlue: new THREE.MeshPhysicalMaterial({ color: 0x278cff, transmission: .22, transparent: true, opacity: .62, roughness: .12, depthWrite: false, side: THREE.DoubleSide }),
  acrylicGreen: new THREE.MeshPhysicalMaterial({ color: 0x42c77b, transmission: .22, transparent: true, opacity: .62, roughness: .12, depthWrite: false, side: THREE.DoubleSide }),
  sand: new THREE.MeshStandardMaterial({ color: 0xdabb75, roughness: 1 }),
  redRoof: new THREE.MeshStandardMaterial({ color: 0xa85442, roughness: .78 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x3f8240, roughness: .85 })
};

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitCylinder = new THREE.CylinderGeometry(.5, .5, 1, 18);
const unitSphere = new THREE.SphereGeometry(.5, 16, 12);
const unitPlane = new THREE.PlaneGeometry(1, 1);
const interactiveMeshes = [];
const sceneLabels = [];

function meshBox(parent, size, position, material, infoKey, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(unitBox, material);
  mesh.scale.set(size[0], size[1], size[2]);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  if (infoKey) {
    mesh.userData.infoKey = infoKey;
    interactiveMeshes.push(mesh);
  }
  parent.add(mesh);
  return mesh;
}

function meshCylinder(parent, radius, height, position, material, infoKey, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(unitCylinder, material);
  mesh.scale.set(radius * 2, height, radius * 2);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  if (infoKey) { mesh.userData.infoKey = infoKey; interactiveMeshes.push(mesh); }
  parent.add(mesh);
  return mesh;
}

function meshSphere(parent, diameter, position, material, infoKey) {
  const mesh = new THREE.Mesh(unitSphere, material);
  mesh.scale.setScalar(diameter);
  mesh.position.set(...position);
  if (infoKey) { mesh.userData.infoKey = infoKey; interactiveMeshes.push(mesh); }
  parent.add(mesh);
  return mesh;
}

function meshBeam(parent, start, end, width, material, infoKey) {
  const from = new THREE.Vector3(...start);
  const to = new THREE.Vector3(...end);
  const direction = to.clone().sub(from);
  const mesh = new THREE.Mesh(unitBox, material);
  mesh.scale.set(width, direction.length(), width);
  mesh.position.copy(from).add(to).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  if (infoKey) { mesh.userData.infoKey = infoKey; interactiveMeshes.push(mesh); }
  parent.add(mesh);
  return mesh;
}

function fenceLineX(parent, start, end, z) {
  meshBox(parent, [end - start, .16, .18], [(start + end) / 2, .72, z], materials.dark, "garten");
  meshBox(parent, [end - start, .16, .18], [(start + end) / 2, 1.62, z], materials.dark, "garten");
  for (let x = start; x <= end + .01; x += 1.25) meshBox(parent, [.16, 2.05, .16], [Math.min(x, end), 1.02, z], materials.woodDark, "garten");
  for (let x = start; x <= end + .01; x += 5) meshBox(parent, [.3, 2.35, .3], [Math.min(x, end), 1.17, z], materials.dark, "garten");
}

function fenceLineZ(parent, x, start, end) {
  meshBox(parent, [.18, .16, end - start], [x, .72, (start + end) / 2], materials.dark, "garten");
  meshBox(parent, [.18, .16, end - start], [x, 1.62, (start + end) / 2], materials.dark, "garten");
  for (let z = start; z <= end + .01; z += 1.25) meshBox(parent, [.16, 2.05, .16], [x, 1.02, Math.min(z, end)], materials.woodDark, "garten");
  for (let z = start; z <= end + .01; z += 5) meshBox(parent, [.3, 2.35, .3], [x, 1.17, Math.min(z, end)], materials.dark, "garten");
}

function addGardenFence(parent) {
  fenceLineX(parent, -55, -3.1, 74);
  fenceLineX(parent, 3.1, 55, 74);
  fenceLineX(parent, -55, 55, -66);
  fenceLineZ(parent, -55, -66, 74);
  fenceLineZ(parent, 55, -66, 74);

  for (const x of [-3.1, 3.1]) meshBox(parent, [.48, 2.8, .48], [x, 1.4, 74], materials.dark, "gartentor");
  for (const side of [-1, 1]) {
    const center = side * 1.5;
    meshBox(parent, [2.75, .18, .22], [center, .68, 73.94], materials.dark, "gartentor");
    meshBox(parent, [2.75, .18, .22], [center, 1.62, 73.94], materials.dark, "gartentor");
    for (let x = .25; x <= 2.75; x += .55) meshBox(parent, [.15, 1.9, .18], [side * x, 1.02, 73.94], materials.woodDark, "gartentor");
  }
  meshBox(parent, [.72, .92, .38], [3.1, 2.5, 74.38], materials.dark, "gartentor");
  meshSphere(parent, .2, [3.1, 2.6, 74.6], materials.sage, "gartentor");
  meshBox(parent, [.25, .12, .08], [3.1, 2.35, 74.6], materials.metal, "gartentor");
}

function addTrackRibbon(parent, points, width, infoKey, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(point[0], .035, point[1])), closed, "centripetal");
  const samples = closed ? 220 : 70;
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x).multiplyScalar(width / 2);
    const left = point.clone().add(side);
    const right = point.clone().sub(side);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    uvs.push(0, t * 20, 1, t * 20);
    if (i < samples) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const road = new THREE.Mesh(geometry, materials.track);
  road.userData.infoKey = infoKey;
  parent.add(road);
  interactiveMeshes.push(road);

  if (closed) {
    for (let i = 0; i < 72; i += 2) {
      const t = i / 72;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);
      meshBox(parent, [.13, .035, 1.15], [point.x, .075, point.z], materials.cream, infoKey, [0, angle, 0]);
    }
  }
  return curve;
}

function addBobbyCarTrack(parent) {
  addTrackRibbon(parent, [
    [-44, 32], [-26, 31], [-13, 34], [0, 31], [13, 34], [28, 31], [44, 33],
    [46, 17], [44, 3], [47, -12], [44, -28], [47, -44], [44, -61],
    [25, -62], [8, -60], [-8, -63], [-25, -60], [-44, -62],
    [-46, -44], [-43, -28], [-47, -12], [-44, 4], [-47, 18]
  ], 4.2, "bobbyrennstrecke", true);
  addTrackRibbon(parent, [[-44, 32], [-48, 44], [-47, 56], [-43, 61]], 3.8, "bobbyrennstrecke");
  meshBox(parent, [15, .055, 8], [-43, .045, 65], materials.track, "bobbyrennstrecke");
  for (const x of [-48.4, -44.8, -41.2, -37.6]) meshBox(parent, [.1, .04, 7.2], [x, .085, 65], materials.cream, "bobbyrennstrecke");
  meshBox(parent, [14.3, .04, .12], [-43, .085, 61.3], materials.cream, "bobbyrennstrecke");
  addBobbyCar(parent, -46.6, 65, materials.coral, Math.PI / 2);
  addBobbyCar(parent, -43, 65, materials.blue, Math.PI / 2);
  for (const z of [30.2, 31.1, 32, 32.9, 33.8]) meshBox(parent, [3.8, .035, .28], [0, .09, z], materials.cream, "bobbyrennstrecke");
}

function addBalanceLogs(parent) {
  const logs = [
    [[17, .32, 57], [21, .34, 57.4]], [[21.8, .32, 58.4], [25.5, .34, 59.4]],
    [[18.2, .32, 61], [22, .34, 62]], [[24, .32, 62.5], [27.2, .34, 61.8]],
    [[19, .32, 64.5], [23, .34, 64.2]]
  ];
  logs.forEach(([start, end]) => {
    const from = new THREE.Vector3(...start);
    const to = new THREE.Vector3(...end);
    const direction = to.clone().sub(from);
    const log = new THREE.Mesh(unitCylinder, materials.woodDark);
    log.scale.set(.65, direction.length(), .65);
    log.position.copy(from).add(to).multiplyScalar(.5);
    log.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    log.userData.infoKey = "balancierstaemme";
    parent.add(log);
    interactiveMeshes.push(log);
  });
}

function addTunnelHill(parent, x, z, scale = 1) {
  const shape = new THREE.Shape();
  shape.moveTo(-4 * scale, 0);
  for (let i = 0; i <= 24; i++) {
    const angle = Math.PI - i * Math.PI / 24;
    shape.lineTo(Math.cos(angle) * 4 * scale, Math.sin(angle) * 2.65 * scale);
  }
  shape.lineTo(4 * scale, 0);
  shape.closePath();
  const tunnel = new THREE.Path();
  tunnel.moveTo(1.8 * scale, .04);
  for (let i = 0; i <= 18; i++) {
    const angle = i * Math.PI / 18;
    tunnel.lineTo(Math.cos(angle) * 1.8 * scale, .04 + Math.sin(angle) * 1.65 * scale);
  }
  tunnel.closePath();
  shape.holes.push(tunnel);
  const depth = 5.6 * scale;
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .24, bevelThickness: .2, bevelSegments: 3, curveSegments: 16 });
  const hill = new THREE.Mesh(geometry, materials.grass);
  hill.position.set(x, 0, z - depth / 2);
  hill.userData.infoKey = "tunnelhuegel";
  parent.add(hill);
  interactiveMeshes.push(hill);
  meshBox(parent, [3.45 * scale, .08, depth + .35], [x, .04, z], materials.dark, "tunnelhuegel");
}

function addClimbingWall(parent) {
  meshBox(parent, [5.3, 2.6, .3], [32, 1.38, 64], materials.woodLight, "kletterwand", [-.1, 0, 0]);
  meshBeam(parent, [29.6, .12, 65.2], [29.6, 2.65, 64.1], .24, materials.woodDark, "kletterwand");
  meshBeam(parent, [34.4, .12, 65.2], [34.4, 2.65, 64.1], .24, materials.woodDark, "kletterwand");
  const holds = [
    [-1.8, .55, materials.coral], [-.6, .45, materials.blue], [.8, .62, materials.yellow], [1.8, .42, materials.sage],
    [-1.25, 1.2, materials.yellow], [.05, 1.15, materials.coral], [1.35, 1.3, materials.blue],
    [-1.8, 1.95, materials.blue], [-.55, 1.88, materials.sage], [.75, 2.05, materials.coral], [1.8, 1.82, materials.yellow]
  ];
  holds.forEach(([dx, y, material]) => meshSphere(parent, .28, [32 + dx, y, 64.22], material, "kletterwand"));
  meshBox(parent, [6.4, .1, 2.2], [32, .06, 62.9], materials.cream, "kletterwand");
}

function addRainbowParachute(parent) {
  const colors = [0xe44d4d, 0xf28c28, 0xf2cc3d, 0x58a84b, 0x3b82c4, 0x6550b8, 0xb44ca0, 0xe44d4d, 0xf28c28, 0xf2cc3d, 0x58a84b, 0x3b82c4];
  colors.forEach((color, index) => {
    const geometry = new THREE.CircleGeometry(5, 14, index * Math.PI / 6, Math.PI / 6 + .015);
    const material = new THREE.MeshStandardMaterial({ color, roughness: .78, side: THREE.DoubleSide });
    const segment = new THREE.Mesh(geometry, material);
    segment.rotation.x = -Math.PI / 2;
    segment.position.set(-25, .09, 65);
    segment.userData.infoKey = "schwungtuch";
    parent.add(segment);
    interactiveMeshes.push(segment);
  });
  meshCylinder(parent, .48, .06, [-25, .13, 65], materials.cream, "schwungtuch");
}

function windowWallX(parent, start, end, z, openings, infoKey, thickness = .3, height = 5.4) {
  const sorted = [...openings].sort((a, b) => a.center - b.center);
  let cursor = start;
  const addFull = (from, to) => {
    if (to - from > .05) meshBox(parent, [to - from, height, thickness], [(from + to) / 2, height / 2, z], materials.wall, infoKey);
  };
  sorted.forEach(opening => {
    const from = opening.center - opening.width / 2;
    const to = opening.center + opening.width / 2;
    addFull(cursor, from);
    if (opening.type === "door") {
      const doorHeight = 2.55;
      meshBox(parent, [opening.width, height - doorHeight, thickness], [opening.center, doorHeight + (height - doorHeight) / 2, z], materials.wall, infoKey);
      meshBox(parent, [.14, doorHeight, thickness + .08], [from, doorHeight / 2, z], materials.woodDark, infoKey);
      meshBox(parent, [.14, doorHeight, thickness + .08], [to, doorHeight / 2, z], materials.woodDark, infoKey);
      meshBox(parent, [opening.width + .14, .14, thickness + .08], [opening.center, doorHeight, z], materials.woodDark, infoKey);
    } else {
      const bottom = 1.35;
      const windowHeight = 1.85;
      const top = bottom + windowHeight;
      meshBox(parent, [opening.width, bottom, thickness], [opening.center, bottom / 2, z], materials.wall, infoKey);
      meshBox(parent, [opening.width, height - top, thickness], [opening.center, top + (height - top) / 2, z], materials.wall, infoKey);
      meshBox(parent, [opening.width - .18, windowHeight - .18, .07], [opening.center, bottom + windowHeight / 2, z + Math.sign(z || 1) * .17], materials.glass, infoKey);
      for (const y of [bottom, top]) meshBox(parent, [opening.width, .12, thickness + .08], [opening.center, y, z], materials.dark, infoKey);
      for (const x of [from, to]) meshBox(parent, [.12, windowHeight, thickness + .08], [x, bottom + windowHeight / 2, z], materials.dark, infoKey);
    }
    cursor = to;
  });
  addFull(cursor, end);
}

function windowWallZ(parent, x, start, end, openings, infoKey, thickness = .3, height = 5.4) {
  const sorted = [...openings].sort((a, b) => a.center - b.center);
  let cursor = start;
  const addFull = (from, to) => {
    if (to - from > .05) meshBox(parent, [thickness, height, to - from], [x, height / 2, (from + to) / 2], materials.wall, infoKey);
  };
  sorted.forEach(opening => {
    const from = opening.center - opening.width / 2;
    const to = opening.center + opening.width / 2;
    addFull(cursor, from);
    if (opening.type === "door") {
      const doorHeight = 2.55;
      meshBox(parent, [thickness, height - doorHeight, opening.width], [x, doorHeight + (height - doorHeight) / 2, opening.center], materials.wall, infoKey);
      meshBox(parent, [thickness + .08, doorHeight, .14], [x, doorHeight / 2, from], materials.woodDark, infoKey);
      meshBox(parent, [thickness + .08, doorHeight, .14], [x, doorHeight / 2, to], materials.woodDark, infoKey);
      meshBox(parent, [thickness + .08, .14, opening.width + .14], [x, doorHeight, opening.center], materials.woodDark, infoKey);
    } else {
      const bottom = 1.35;
      const windowHeight = 1.85;
      const top = bottom + windowHeight;
      meshBox(parent, [thickness, bottom, opening.width], [x, bottom / 2, opening.center], materials.wall, infoKey);
      meshBox(parent, [thickness, height - top, opening.width], [x, top + (height - top) / 2, opening.center], materials.wall, infoKey);
      meshBox(parent, [.07, windowHeight - .18, opening.width - .18], [x + Math.sign(x || 1) * .17, bottom + windowHeight / 2, opening.center], materials.glass, infoKey);
      for (const y of [bottom, top]) meshBox(parent, [thickness + .08, .12, opening.width], [x, y, opening.center], materials.dark, infoKey);
      for (const z of [from, to]) meshBox(parent, [thickness + .08, windowHeight, .12], [x, bottom + windowHeight / 2, z], materials.dark, infoKey);
    }
    cursor = to;
  });
  addFull(cursor, end);
}

function exteriorWindowWallX(parent, start, end, z, openings, infoKey) {
  const height = 10;
  const thickness = .5;
  const sorted = [...openings].sort((a, b) => a.center - b.center);
  let cursor = start;
  const addPier = (from, to) => {
    if (to - from > .05) meshBox(parent, [to - from, height, thickness], [(from + to) / 2, height / 2, z], materials.wood, infoKey);
  };
  sorted.forEach(opening => {
    const from = opening.center - opening.width / 2;
    const to = opening.center + opening.width / 2;
    const openingKey = opening.infoKey || infoKey;
    addPier(cursor, from);
    const bottom = opening.type === "door" ? 0 : 1.55;
    const openingHeight = opening.type === "door" ? 3.65 : 6.8;
    const top = bottom + openingHeight;
    if (bottom) meshBox(parent, [opening.width, bottom, thickness], [opening.center, bottom / 2, z], materials.wood, openingKey);
    meshBox(parent, [opening.width, height - top, thickness], [opening.center, top + (height - top) / 2, z], materials.wood, openingKey);
    meshBox(parent, [opening.width - .26, openingHeight - .2, .08], [opening.center, bottom + openingHeight / 2, z + Math.sign(z || 1) * .3], materials.glass, openingKey);
    for (const y of [bottom, top]) meshBox(parent, [opening.width, .18, thickness + .1], [opening.center, y, z], materials.dark, openingKey);
    for (const x of [from, to]) meshBox(parent, [.18, openingHeight, thickness + .1], [x, bottom + openingHeight / 2, z], materials.dark, openingKey);
    cursor = to;
  });
  addPier(cursor, end);
}

function exteriorWindowWallZ(parent, x, start, end, openings, infoKey) {
  const height = 10;
  const thickness = .5;
  const sorted = [...openings].sort((a, b) => a.center - b.center);
  let cursor = start;
  const addPier = (from, to) => {
    if (to - from > .05) meshBox(parent, [thickness, height, to - from], [x, height / 2, (from + to) / 2], materials.wood, infoKey);
  };
  sorted.forEach(opening => {
    const from = opening.center - opening.width / 2;
    const to = opening.center + opening.width / 2;
    addPier(cursor, from);
    const bottom = 1.55;
    const openingHeight = 6.8;
    const top = bottom + openingHeight;
    meshBox(parent, [thickness, bottom, opening.width], [x, bottom / 2, opening.center], materials.wood, infoKey);
    meshBox(parent, [thickness, height - top, opening.width], [x, top + (height - top) / 2, opening.center], materials.wood, infoKey);
    meshBox(parent, [.08, openingHeight - .2, opening.width - .26], [x + Math.sign(x || 1) * .3, bottom + openingHeight / 2, opening.center], materials.glass, infoKey);
    for (const y of [bottom, top]) meshBox(parent, [thickness + .1, .18, opening.width], [x, y, opening.center], materials.dark, infoKey);
    for (const z of [from, to]) meshBox(parent, [thickness + .1, openingHeight, .18], [x, bottom + openingHeight / 2, z], materials.dark, infoKey);
    cursor = to;
  });
  addPier(cursor, end);
}

function makeLabel(text, position, scale = 4.2) {
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 512; labelCanvas.height = 128;
  const ctx = labelCanvas.getContext("2d");
  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.roundRect(4, 4, 504, 120, 18); ctx.fill();
  ctx.strokeStyle = "rgba(24,51,50,.25)"; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = "#183332"; ctx.font = "700 34px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 66, 470);
  const texture = new THREE.CanvasTexture(labelCanvas); texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true, depthWrite: false }));
  sprite.position.set(...position); sprite.scale.set(scale, scale / 4, 1);
  scene.add(sprite);
  sceneLabels.push(sprite);
  return sprite;
}

const roofMesh = meshBox(scene, [78.5, .32, 81.5], [0, 10.18, -15.5], materials.roof, null);

function buildShell() {
  meshBox(scene, [110, .3, 140], [0, -.18, 4], materials.grass, "garten");
  meshBox(scene, [4.5, .12, 49], [0, .02, 49.5], materials.path, "garten");
  meshBox(scene, [78, .28, 81], [0, .02, -15.5], materials.floor, "gruppenraum");

  exteriorWindowWallX(scene, -39, 39, 25, [
    { center: -30, width: 8.1 }, { center: -19, width: 8.1 },
    { center: 0, width: 5.4, type: "door", infoKey: "eingang" },
    { center: 19, width: 8.1 }, { center: 30, width: 8.1 }
  ], "gruppenraum");
  exteriorWindowWallX(scene, -39, 39, -56, [
    { center: -30, width: 8.4 }, { center: -15, width: 10 },
    { center: 0, width: 10 }, { center: 15, width: 10 }, { center: 30, width: 8.4 }
  ], "gruppenraum");
  for (const x of [-39, 39]) exteriorWindowWallZ(scene, x, -56, 25, [
    { center: -45, width: 9.5 }, { center: -32, width: 9.5 },
    { center: -19, width: 9.5 }, { center: -6, width: 9.5 },
    { center: 7, width: 9.5 }, { center: 20, width: 7.5 }
  ], "gruppenraum");

  // Inner room boundaries with broad passages.
  meshBox(scene, [.35, 5.4, 11], [-12.2, 2.7, -11.8], materials.wall, null);
  meshBox(scene, [.35, 5.4, 11], [12.2, 2.7, 10], materials.wall, null);
  meshBox(scene, [.35, 5.4, 11], [12.2, 2.7, -11.8], materials.wall, null);
  meshBox(scene, [13, 5.4, .35], [-10, 2.7, -18.2], materials.wall, null);
  meshBox(scene, [13, 5.4, .35], [10, 2.7, -18.2], materials.wall, null);
  meshBox(scene, [15, 5.4, .35], [-24, 2.7, -27], materials.wall, null);
  meshBox(scene, [15, 5.4, .35], [24, 2.7, -27], materials.wall, null);
  meshBox(scene, [15, 5.4, .35], [-24, 2.7, -43], materials.wall, null);
  meshBox(scene, [15, 5.4, .35], [24, 2.7, -43], materials.wall, null);

  makeLabel("Eingang", [0, 5.1, 22.8], 3.5);
  makeLabel("Gruppenraum", [0, 5.9, 8], 4.1);
  makeLabel("Atelier", [-21, 5.2, -12], 3.2);
  makeLabel("Bewegungsraum", [21, 5.2, -12], 4.2);
  makeLabel("Forscherraum", [-22, 5.0, -34], 3.8);
  makeLabel("Musikbereich", [22, 5.0, -34], 3.7);
  makeLabel("Ruheraum", [0, 4.8, -41], 3.4);
}

function addChair(parent, x, z, material = materials.sage, key = null, rotation = 0) {
  const chair = new THREE.Group();
  chair.position.set(x, 0, z);
  chair.rotation.y = rotation;
  parent.add(chair);
  meshBox(chair, [1.8, .55, 1.8], [0, .48, 0], material, key);
  meshBox(chair, [1.8, 1.25, .35], [0, 1.2, -.72], material, key);
  for (const dx of [-.68, .68]) for (const dz of [-.68, .68]) meshBox(chair, [.18, .45, .18], [dx, .2, dz], materials.woodDark, key);
}

function addBobbyCar(parent, x, z, material, rotation = 0) {
  const car = new THREE.Group();
  car.position.set(x, 0, z);
  car.rotation.y = rotation;
  parent.add(car);
  meshBox(car, [2, .65, 1.15], [0, .55, 0], material, "bobbycar");
  meshBox(car, [.72, .35, .62], [-.2, 1.0, 0], materials.dark, "bobbycar");
  meshBox(car, [.18, .85, .18], [.78, 1.0, 0], materials.dark, "bobbycar");
  for (const dx of [-.72, .72]) for (const dz of [-.52, .52]) meshCylinder(car, .24, .18, [dx, .27, dz], materials.dark, "bobbycar", [Math.PI / 2, 0, 0]);
}

function addLaptop(parent, x, z, rotation, infoKey) {
  const group = new THREE.Group();
  group.position.set(x, 1.28, z);
  group.rotation.y = rotation;
  parent.add(group);
  meshBox(group, [1.25, .08, .8], [0, 0, 0], materials.dark, infoKey);
  meshBox(group, [1.25, .78, .08], [0, .42, -.35], materials.dark, infoKey, [-.16, 0, 0]);
  meshBox(group, [1.05, .58, .03], [0, .43, -.405], materials.blue, infoKey, [-.16, 0, 0]);
}

function addGuitar(parent, x, z) {
  const guitar = new THREE.Group();
  guitar.position.set(x, 0, z);
  parent.add(guitar);
  const lowerBody = meshSphere(guitar, 1, [0, 1.55, 0], materials.woodDark, "gitarre");
  lowerBody.scale.set(2.35, 2.75, .52);
  const upperBody = meshSphere(guitar, 1, [0, 2.75, 0], materials.woodDark, "gitarre");
  upperBody.scale.set(1.85, 2.05, .48);
  meshCylinder(guitar, .36, .12, [0, 2.35, .29], materials.dark, "gitarre", [Math.PI / 2, 0, 0]);
  meshBox(guitar, [1.0, .18, .16], [0, 1.15, .34], materials.dark, "gitarre");
  meshBox(guitar, [.48, 2.75, .32], [0, 4.15, 0], materials.woodDark, "gitarre");
  meshBox(guitar, [.34, 2.75, .08], [0, 4.15, .2], materials.dark, "gitarre");
  for (let i = 0; i < 9; i++) meshBox(guitar, [.42, .025, .04], [0, 3.05 + i * .27, .25], materials.metal, "gitarre");
  meshBox(guitar, [.74, 1.0, .38], [0, 5.95, 0], materials.woodDark, "gitarre", [0, 0, -.08]);
  for (const side of [-1, 1]) for (const y of [5.65, 5.95, 6.25]) {
    meshCylinder(guitar, .1, .38, [side * .48, y, 0], materials.metal, "gitarre", [0, 0, Math.PI / 2]);
  }
  for (let i = 0; i < 6; i++) {
    const stringX = -.13 + i * .052;
    meshBox(guitar, [.018, 4.72, .018], [stringX, 3.55, .37], materials.metal, "gitarre");
  }
}

function buildOffices() {
  const offices = new THREE.Group();
  scene.add(offices);

  // Großer Teamraum, etwa doppelt so groß wie das dahinterliegende Büro.
  meshBox(offices, [21.8, .12, 13], [-23.1, .16, 12.5], materials.floor, "teamraum");
  windowWallZ(offices, -12.2, 6, 19, [
    { center: 9.2, width: 2.5, type: "window" },
    { center: 14.3, width: 2.5, type: "door" },
    { center: 17.5, width: 2.1, type: "window" }
  ], "teamraum");
  windowWallZ(offices, -34, 6, 19, [
    { center: 9.5, width: 2.5, type: "window" },
    { center: 15.3, width: 2.5, type: "window" }
  ], "teamraum");
  windowWallX(offices, -34, -12.2, 19, [
    { center: -29.5, width: 2.6, type: "window" },
    { center: -23.5, width: 2.6, type: "window" },
    { center: -17.3, width: 2.6, type: "window" }
  ], "teamraum");
  windowWallX(offices, -34, -12.2, 6, [
    { center: -29, width: 2.35, type: "window" },
    { center: -23, width: 2.5, type: "door" },
    { center: -17.2, width: 2.35, type: "window" }
  ], "teamraum");

  // Kleineres Büro hinter dem Teamraum.
  meshBox(offices, [14, .13, 8], [-23, .17, 2], materials.floor, "buero");
  windowWallZ(offices, -30, -2, 6, [{ center: 2, width: 2.4, type: "window" }], "buero");
  windowWallZ(offices, -16, -2, 6, [{ center: 2, width: 2.4, type: "window" }], "buero");
  windowWallX(offices, -30, -16, -2, [
    { center: -26.2, width: 2.4, type: "window" },
    { center: -19.8, width: 2.4, type: "window" }
  ], "buero");

  // Geöffnete Türflügel verdeutlichen beide Durchgänge, ohne Laufwege zu blockieren.
  meshBox(offices, [.1, 2.35, 2.25], [-13.05, 1.18, 15.1], materials.woodLight, "teamraum", [0, -.78, 0]);
  meshBox(offices, [2.25, 2.35, .1], [-22.05, 1.18, 5.15], materials.woodLight, "buero", [0, .72, 0]);

  // Zentraler Teamtisch mit sechs kooperativen Laptop-Arbeitsplätzen.
  meshBox(offices, [8.6, .36, 3.6], [-23.1, 1.05, 12.4], materials.woodLight, "teamraum");
  for (const x of [-26.1, -23.1, -20.1]) {
    addLaptop(offices, x, 11.65, 0, "teamraum");
    addLaptop(offices, x, 13.15, Math.PI, "teamraum");
    addChair(offices, x, 10.35, materials.sage, "teamraum");
    addChair(offices, x, 14.45, materials.blue, "teamraum", Math.PI);
  }

  // Verschließbare Spinte und eine kompakte Garderobe.
  for (let i = 0; i < 4; i++) {
    const z = 8 + i * 1.55;
    meshBox(offices, [1.35, 3.4, 1.35], [-32.8, 1.72, z], materials.woodLight, "teamraum");
    meshBox(offices, [.08, 3.05, 1.08], [-32.08, 1.72, z], materials.cream, "teamraum");
    meshSphere(offices, .12, [-32.0, 1.72, z + .32], materials.metal, "teamraum");
  }
  meshBox(offices, [5.2, .3, .35], [-19.2, 2.45, 18.35], materials.woodDark, "teamraum");
  for (let i = 0; i < 6; i++) meshCylinder(offices, .08, .55, [-21.35 + i * .85, 2.12, 18.18], materials.metal, "teamraum", [Math.PI / 2, 0, 0]);

  // Kleiner Einzelarbeitsplatz mit PC und zwei Sesseln.
  meshBox(offices, [4.2, .34, 2], [-23, .92, 1.8], materials.woodLight, "buero");
  meshBox(offices, [1.65, 1.05, .18], [-23, 1.75, 1.35], materials.dark, "buero");
  meshBox(offices, [1.42, .78, .04], [-23, 1.77, 1.24], materials.blue, "buero");
  meshBox(offices, [1.45, .08, .55], [-23, 1.18, 2.05], materials.dark, "buero");
  meshBox(offices, [.72, 1.35, 1.05], [-20.45, .7, 1.55], materials.dark, "buero");
  addChair(offices, -24.25, 3.55, materials.sage, "buero", Math.PI);
  addChair(offices, -21.75, 3.55, materials.sage, "buero", Math.PI);

  makeLabel("Team- und Arbeitsraum", [-23.1, 5.85, 12.4], 4.8);
  makeLabel("Kleines Büro", [-23, 5.4, 2], 3.4);
}

function addWallPicture(parent, src, position, width, height, rotationY, infoKey) {
  meshBox(parent, [width + .32, height + .32, .16], [position[0], position[1], position[2] - Math.cos(rotationY) * .12], materials.dark, infoKey);
  const loader = new THREE.TextureLoader();
  loader.load(assetUrl(src), texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const picture = new THREE.Mesh(unitPlane, new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false }));
    picture.position.set(...position);
    picture.rotation.y = rotationY;
    picture.scale.set(width, height, 1);
    picture.userData.infoKey = infoKey;
    parent.add(picture);
    interactiveMeshes.push(picture);
    invalidate();
  });
}

function addResearchTray(parent, x, z, fillMaterial, infoKey) {
  meshBox(parent, [2.75, .24, 1.85], [x, 1.3, z], materials.cream, infoKey);
  meshBox(parent, [2.42, .08, 1.52], [x, 1.45, z], fillMaterial, infoKey);
  for (const dx of [-1.28, 1.28]) meshBox(parent, [.14, .32, 1.82], [x + dx, 1.45, z], materials.woodLight, infoKey);
  for (const dz of [-.83, .83]) meshBox(parent, [2.7, .32, .14], [x, 1.45, z + dz], materials.woodLight, infoKey);
}

function addMicroscope(parent, x, z, rotation = 0) {
  const microscope = new THREE.Group();
  microscope.position.set(x, 1.22, z);
  microscope.rotation.y = rotation;
  parent.add(microscope);
  meshBox(microscope, [1.2, .14, .85], [0, .07, 0], materials.dark, "mikroskop");
  meshBox(microscope, [.88, .1, .7], [0, .48, 0], materials.metal, "mikroskop");
  meshBeam(microscope, [-.4, .12, 0], [.12, 1.02, 0], .18, materials.dark, "mikroskop");
  meshCylinder(microscope, .14, .82, [.2, 1.02, 0], materials.dark, "mikroskop", [0, 0, -.45]);
  meshCylinder(microscope, .1, .38, [.4, 1.32, 0], materials.metal, "mikroskop", [0, 0, Math.PI / 2 - .45]);
  meshCylinder(microscope, .09, .28, [.02, .57, 0], materials.dark, "mikroskop");
}

function addResearchShelf(parent) {
  const x = -30;
  const z = -41.25;
  for (const dx of [-2.6, 2.6]) meshBox(parent, [.22, 3.5, 1.15], [x + dx, 1.75, z], materials.woodLight, "materialregal");
  for (const y of [.15, 1.12, 2.1, 3.42]) meshBox(parent, [5.4, .18, 1.18], [x, y, z], materials.woodLight, "materialregal");
  for (const dx of [-.9, .9]) meshBox(parent, [.14, 3.25, 1.12], [x + dx, 1.72, z], materials.woodLight, "materialregal");

  // Lupen und Lupenbecher.
  for (const dx of [-2.05, -1.45]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.22, .055, 8, 18), materials.dark);
    ring.position.set(x + dx, 2.65, z + .64);
    ring.userData.infoKey = "materialregal";
    parent.add(ring); interactiveMeshes.push(ring);
    meshBox(parent, [.08, .55, .08], [x + dx, 2.27, z + .64], materials.dark, "materialregal", [0, 0, -.25]);
  }
  for (const dx of [-.5, .1, .7]) meshCylinder(parent, .23, .55, [x + dx, 2.48, z + .45], materials.glass, "materialregal");

  // Pinzetten, Pipetten und Tabletts.
  for (const dx of [1.25, 1.55]) meshBeam(parent, [x + dx, 2.18, z + .48], [x + dx + .22, 2.85, z + .55], .04, materials.metal, "materialregal");
  for (const dx of [1.9, 2.15, 2.4]) meshCylinder(parent, .045, .72, [x + dx, 2.5, z + .48], materials.blue, "materialregal", [0, 0, -.2]);
  for (const [dx, material] of [[-2, materials.blue], [-.2, materials.yellow], [1.7, materials.sage]]) meshBox(parent, [1.25, .1, .72], [x + dx, 1.62, z + .48], material, "materialregal");

  // Erde, Samen und kleine Schaufeln.
  meshCylinder(parent, .34, .52, [x - 1.8, .55, z + .4], materials.woodDark, "materialregal");
  meshCylinder(parent, .3, .48, [x - .8, .52, z + .4], materials.sand, "materialregal");
  meshCylinder(parent, .28, .44, [x + .15, .5, z + .4], materials.leaf, "materialregal");
  for (const dx of [1.15, 1.75, 2.3]) {
    meshBox(parent, [.09, .72, .09], [x + dx, .58, z + .48], materials.woodDark, "materialregal", [0, 0, -.2]);
    meshBox(parent, [.28, .3, .08], [x + dx - .08, .23, z + .48], materials.metal, "materialregal", [0, 0, -.2]);
  }
}

function addResearchCoats(parent) {
  meshCylinder(parent, .12, 3.25, [-34.2, 1.65, -29.5], materials.woodDark, "forscherkittel");
  meshBox(parent, [4.2, .16, .16], [-34.2, 3.15, -29.5], materials.woodDark, "forscherkittel");
  for (let i = 0; i < 4; i++) {
    const x = -35.65 + i * .95;
    meshBox(parent, [.85, 1.65, .18], [x, 2.05, -29.45], materials.cream, "forscherkittel");
    meshBox(parent, [.38, 1.2, .16], [x - .55, 2.05, -29.45], materials.cream, "forscherkittel", [0, 0, -.3]);
    meshBox(parent, [.38, 1.2, .16], [x + .55, 2.05, -29.45], materials.cream, "forscherkittel", [0, 0, .3]);
  }
  for (const dx of [-1.8, 1.8]) meshBeam(parent, [-34.2, .08, -29.5], [-34.2 + dx, .08, -29.5], .13, materials.woodDark, "forscherkittel");
}

function addLightTable(parent) {
  const x = -14.2;
  const z = -36.3;
  meshBox(parent, [5.2, .85, 3.25], [x, .55, z], materials.woodLight, "lichttisch");
  meshBox(parent, [4.75, .16, 2.8], [x, 1.08, z], materials.lightGlow, "lichttisch");
  for (const dx of [-2.2, 2.2]) for (const dz of [-1.25, 1.25]) meshBox(parent, [.24, .62, .24], [x + dx, .28, z + dz], materials.woodDark, "lichttisch");

  meshBox(parent, [1.45, .07, 1.05], [x - 1.0, 1.22, z - .25], materials.acrylicRed, "lichttisch", [0, .18, 0]);
  meshBox(parent, [1.45, .07, 1.05], [x - .3, 1.24, z - .05], materials.acrylicBlue, "lichttisch", [0, -.12, 0]);
  const circle = meshCylinder(parent, .62, .07, [x + 1.25, 1.23, z + .48], materials.acrylicYellow, "lichttisch");
  const triangle = new THREE.Mesh(new THREE.CylinderGeometry(.75, .75, .07, 3), materials.acrylicGreen);
  triangle.position.set(x + 1.15, 1.23, z - .62);
  triangle.rotation.y = .35;
  triangle.userData.infoKey = "lichttisch";
  parent.add(triangle); interactiveMeshes.push(triangle);
  const hexagon = new THREE.Mesh(new THREE.CylinderGeometry(.58, .58, .07, 6), materials.acrylicBlue);
  hexagon.position.set(x, 1.25, z + .72);
  hexagon.userData.infoKey = "lichttisch";
  parent.add(hexagon); interactiveMeshes.push(hexagon);
  circle.rotation.y = 0;
}

function buildResearchRoom() {
  const research = new THREE.Group();
  scene.add(research);

  // Großer Forschertisch mit Wasser- und Sandwanne.
  meshBox(research, [7.2, .36, 3.25], [-23.5, .96, -35], materials.woodLight, "forscherraum");
  for (const dx of [-3.1, 3.1]) for (const dz of [-1.25, 1.25]) meshBox(research, [.28, 1.0, .28], [-23.5 + dx, .5, -35 + dz], materials.woodDark, "forscherraum");
  addResearchTray(research, -25.35, -35, materials.water, "wasserwanne");
  addResearchTray(research, -21.65, -35, materials.sand, "sandwanne");

  // Zweiter Forschertisch an den großen Fenstern mit zwei Mikroskopen.
  meshBox(research, [5.4, .34, 2.45], [-35.1, .92, -35.5], materials.woodLight, "forscherraum");
  for (const dx of [-2.25, 2.25]) for (const dz of [-.95, .95]) meshBox(research, [.25, .95, .25], [-35.1 + dx, .48, -35.5 + dz], materials.woodDark, "forscherraum");
  addMicroscope(research, -36.25, -35.5, 0);
  addMicroscope(research, -33.85, -35.5, 0);

  addResearchShelf(research);
  addResearchCoats(research);
  addLightTable(research);

  addWallPicture(research, "assets/mint/forscherkreis.png", [-23.7, 2.95, -42.78], 6.0, 4.8, 0, "forscherraum");
  addWallPicture(research, "assets/mint/kinder-forschen.jpg", [-23.7, 2.9, -27.22], 7.0, 3.94, Math.PI, "forscherraum");
}

function buildInterior() {
  const entrance = new THREE.Group(); scene.add(entrance);
  meshBox(entrance, [4, .25, 2.4], [5.8, .82, 16], materials.woodLight, "eingang");
  addChair(entrance, 3.5, 18.4, materials.sage, "eingang", Math.PI);
  addChair(entrance, 8.1, 18.4, materials.sage, "eingang", Math.PI);
  for (let i = 0; i < 6; i++) meshBox(entrance, [1, .08, 1.4], [4.05 + i * .68, .98 + i * .01, 16], [materials.cream, materials.blue, materials.coral, materials.sage, materials.yellow, materials.violet][i], "eingang", [0, i * .03 - .08, 0]);

  buildOffices();

  const building = new THREE.Group(); scene.add(building);
  meshBox(building, [7.5, .08, 5.2], [-5.2, .2, 6.5], materials.blue, "bauteppich");
  for (let i = 0; i < 18; i++) meshBox(building, [.62, .62, .62], [-7.5 + (i % 6) * .72, .5 + Math.floor(i / 6) * .5, 5.2 + (i % 3) * .7], i % 2 ? materials.woodDark : materials.woodLight, "bauteppich");

  meshBox(building, [5.2, .55, 4.3], [-6.5, .4, -2], materials.sage, "leseecke");
  for (const [x, z, mat] of [[-7.8, -2, materials.coral], [-5.3, -3, materials.cream], [-5.5, -1, materials.blue]]) meshBox(building, [1.2, .45, 1.2], [x, .75, z], mat, "leseecke");
  meshBox(building, [5, 2.6, .55], [-4, 1.4, -4.2], materials.woodLight, "leseecke");
  for (let row = 0; row < 5; row++) for (let col = 0; col < 10; col++) meshBox(building, [.28, .34, .13], [-5.8 + col * .4, .55 + row * .39, -3.88], [materials.coral, materials.blue, materials.yellow, materials.sage][(row + col) % 4], "leseecke");

  meshBox(building, [3.8, 2.4, 1.2], [7.2, 1.2, 6.6], materials.cream, "rollenspiel");
  meshBox(building, [1.4, 1.35, 1.2], [5.4, .7, 4.6], materials.woodLight, "rollenspiel");
  for (let i = 0; i < 3; i++) { meshSphere(building, .5, [6 + i * .75, 1.6, 5.15], materials.cream, "rollenspiel"); meshBox(building, [.55, .9, .35], [6 + i * .75, 1.0, 5.15], [materials.coral, materials.yellow, materials.blue][i], "rollenspiel"); }

  const atelier = new THREE.Group(); scene.add(atelier);
  meshBox(atelier, [5.2, .35, 2.2], [-21, 1.0, -13.5], materials.woodLight, "atelier");
  meshBox(atelier, [5.4, 1.2, 3.2], [-21, .7, -17], materials.woodDark, "atelier");
  meshBox(atelier, [8.2, 3.3, .18], [-21, 2.35, -23.6], materials.cream, "malwand");
  for (let i = 0; i < 18; i++) meshSphere(atelier, .16 + (i % 3) * .06, [-24 + (i % 6) * 1.1, 1.5 + Math.floor(i / 6) * .65, -23.45], [materials.coral, materials.blue, materials.yellow, materials.sage][i % 4], "malwand");
  meshBox(atelier, [1.0, 3.2, 5.4], [-25.5, 1.6, -18], materials.woodDark, "materialschrank");
  for (let i = 0; i < 8; i++) meshBox(atelier, [.15, .65, 1.05], [-24.92, .9 + Math.floor(i / 4) * .95, -20 + (i % 4) * 1.3], [materials.coral, materials.blue, materials.yellow, materials.sage][i % 4], "materialschrank");
  meshBox(atelier, [.25, 2.6, 2], [-17.5, 1.3, -12.5], materials.woodDark, "staffelei");
  meshBox(atelier, [.12, 2.3, 2], [-17.3, 1.9, -12.5], materials.cream, "staffelei");

  const movement = new THREE.Group(); scene.add(movement);
  meshBox(movement, [12, .1, 8], [21, .22, -14], materials.blue, "bewegung");
  for (const z of [-20, -16]) meshBox(movement, [.24, 4.2, .24], [29.2, 2.3, z], materials.woodDark, "bewegungsausstattung");
  for (let i = 0; i < 10; i++) meshBox(movement, [.26, .12, 4], [29.1, .6 + i * .38, -18], materials.woodLight, "bewegungsausstattung");
  meshBox(movement, [3.2, 1.5, 2.3], [16.5, .78, -18.5], materials.wood, "bewegungsausstattung");
  meshBox(movement, [5.2, .75, 3.1], [22, .45, -19.5], materials.blue, "bewegungsausstattung");
  for (const z of [-7.4, -9]) meshBox(movement, [5.6, .32, .75], [20.5, .55, z], materials.woodLight, "bewegungsausstattung");
  for (const [x, z, mat] of [[24.6, -14, materials.coral], [22.1, -13.2, materials.yellow], [26.7, -16.2, materials.sage]]) meshBox(movement, [2, 1.1, 2], [x, .65, z], mat, "bewegungsausstattung");
  for (let i = 0; i < 25; i++) meshSphere(movement, .46, [14 + (i % 5) * .46, .5 + Math.floor(i / 5) * .38, -8], i % 2 ? materials.yellow : materials.blue, "bewegungsausstattung");

  buildResearchRoom();

  const music = new THREE.Group(); scene.add(music);
  meshBox(music, [9, .1, 6], [22, .2, -35], materials.violet, "musik");
  meshBox(music, [1.9, 3.8, 8.2], [27.6, 1.9, -35.5], materials.woodLight, "orffregal");
  for (const y of [.35, 1.35, 2.35, 3.35]) meshBox(music, [1.8, .12, 8], [26.9, y, -35.5], materials.woodDark, "orffregal");
  for (let i = 0; i < 15; i++) meshCylinder(music, .3 + (i % 3) * .08, .55, [26.7, .75 + Math.floor(i / 5) * 1.0, -38.3 + (i % 5) * 1.35], [materials.coral, materials.yellow, materials.blue][i % 3], "orffregal", [0, 0, Math.PI / 2]);
  addGuitar(music, 17.2, -42.6);
  for (let i = 0; i < 8; i++) meshBox(music, [1.1, .08, 1.35], [18.6 + (i % 4) * 1.35, .28, -34.2 + Math.floor(i / 4) * 1.7], i % 2 ? materials.cream : materials.yellow, "klanggeschichte");

  const rest = new THREE.Group(); scene.add(rest);
  meshBox(rest, [10, .1, 6], [0, .2, -40], materials.sage, "ruheraum");
  for (const [x, z] of [[-3.2, -40.5], [2.6, -39.5], [0, -44]]) meshBox(rest, [3.8, .48, 2], [x, .45, z], materials.cream, "ruheraum");
  meshBox(rest, [6, 2.4, .6], [0, 1.2, -46.4], materials.woodDark, "ruheraum");
}

function buildGarden() {
  const garden = new THREE.Group(); scene.add(garden);
  addGardenFence(garden);
  addBobbyCarTrack(garden);
  addBalanceLogs(garden);
  addTunnelHill(garden, -10.5, 64.5, .9);
  addTunnelHill(garden, 10.5, 65, .85);
  addClimbingWall(garden);
  addRainbowParachute(garden);
  meshBox(garden, [5, 3.2, 4.2], [-18, 1.65, 37], materials.woodDark, "spielhaus");
  meshBox(garden, [6.2, .28, 3.8], [-18, 3.8, 36], materials.redRoof, "spielhaus", [-Math.PI * .32, 0, 0]);
  meshBox(garden, [6.2, .28, 3.8], [-18, 3.8, 38], materials.redRoof, "spielhaus", [Math.PI * .32, 0, 0]);
  meshBox(garden, [1.2, 2.1, .18], [-18, 1.1, 39.2], materials.dark, "spielhaus");

  // Erhöhte Rutschenplattform mit Leiter, Geländer, Seitenwangen und freiem Auslauf.
  meshBox(garden, [3.4, .35, 3], [15, 2.65, 37.5], materials.woodLight, "rutsche");
  for (const x of [13.7, 16.3]) for (const z of [36.4, 38.6]) meshBox(garden, [.34, 2.65, .34], [x, 1.32, z], materials.woodDark, "rutsche");
  for (const x of [13.7, 16.3]) {
    meshBox(garden, [.22, 1.55, .22], [x, 3.52, 37.1], materials.woodDark, "rutsche");
    meshBox(garden, [.22, 1.55, .22], [x, 3.52, 38.2], materials.woodDark, "rutsche");
    meshBox(garden, [.2, .22, 1.35], [x, 4.2, 37.65], materials.woodDark, "rutsche");
  }
  meshBox(garden, [2.1, .18, 6.2], [15, 1.35, 41.55], materials.blue, "rutsche", [.43, 0, 0]);
  for (const x of [13.95, 16.05]) meshBox(garden, [.18, .42, 6.2], [x, 1.57, 41.55], materials.yellow, "rutsche", [.43, 0, 0]);
  meshBox(garden, [3.2, .12, 2.2], [15, .1, 44.55], materials.cream, "rutsche");
  meshBeam(garden, [13.95, .18, 34.75], [13.95, 2.7, 36.2], .22, materials.woodDark, "rutsche");
  meshBeam(garden, [16.05, .18, 34.75], [16.05, 2.7, 36.2], .22, materials.woodDark, "rutsche");
  for (let i = 0; i < 6; i++) {
    const t = (i + 1) / 7;
    meshBox(garden, [2.25, .16, .22], [15, .18 + 2.52 * t, 34.75 + 1.45 * t], materials.woodLight, "rutsche");
  }

  // Doppelschaukel und Balancierbereich.
  for (const x of [-35.5, -26.5]) {
    meshBeam(garden, [x, .08, 45.8], [x, 5.05, 48.5], .46, materials.woodDark, "garten");
    meshBeam(garden, [x, .08, 51.2], [x, 5.05, 48.5], .46, materials.woodDark, "garten");
    meshBox(garden, [.55, .22, 6], [x, .12, 48.5], materials.woodLight, "garten");
  }
  meshBox(garden, [10.2, .48, .52], [-31, 5.05, 48.5], materials.woodDark, "garten");
  for (const x of [-33, -29]) {
    for (const dx of [-.65, .65]) meshBox(garden, [.08, 3, .08], [x + dx, 3.35, 48.2], materials.metal, "garten");
    meshBox(garden, [1.8, .18, .7], [x, 1.82, 48.2], materials.woodLight, "garten");
  }

  // Wasser-Matsch-Anlage in der rechten Gartenecke.
  meshBox(garden, [13, .16, 7.4], [31.5, .1, 50], materials.sand, "sandkasten");
  for (const z of [46, 54]) meshBox(garden, [14.4, .62, .58], [31.5, .32, z], materials.woodLight, "sandkasten");
  for (const x of [24.3, 38.7]) meshBox(garden, [.58, .62, 8.6], [x, .32, 50], materials.woodLight, "sandkasten");

  meshBox(garden, [5.3, .42, 4.7], [23.5, 4.1, 45], materials.woodLight, "wasserhaus");
  for (const x of [21.2, 25.8]) for (const z of [43, 47]) {
    meshBox(garden, [.42, 4.3, .42], [x, 2.15, z], materials.woodDark, "wasserhaus");
    meshBox(garden, [.34, 3, .34], [x, 5.65, z], materials.woodDark, "wasserhaus");
  }
  meshBox(garden, [4.25, 1.9, .22], [23.5, 5.25, 43.05], materials.woodLight, "wasserhaus");
  meshBox(garden, [1.45, .95, .12], [23.5, 5.35, 42.9], materials.glass, "wasserhaus");
  for (const x of [21.25, 25.75]) meshBox(garden, [.22, 1.25, 3.6], [x, 4.85, 45], materials.woodLight, "wasserhaus");
  meshBox(garden, [1.35, .22, .22], [21.9, 5.1, 47], materials.woodDark, "wasserhaus");
  meshBox(garden, [1.35, .22, .22], [25.1, 5.1, 47], materials.woodDark, "wasserhaus");
  meshBox(garden, [6.1, .25, 3.8], [23.5, 7.2, 44], materials.redRoof, "wasserhaus", [-.62, 0, 0]);
  meshBox(garden, [6.1, .25, 3.8], [23.5, 7.2, 46], materials.redRoof, "wasserhaus", [.62, 0, 0]);
  meshBeam(garden, [22.25, .18, 50.1], [22.25, 4.15, 47.15], .24, materials.woodDark, "wasserhaus");
  meshBeam(garden, [24.75, .18, 50.1], [24.75, 4.15, 47.15], .24, materials.woodDark, "wasserhaus");
  for (let i = 0; i < 7; i++) {
    const t = (i + 1) / 8;
    meshBox(garden, [2.7, .16, .24], [23.5, .18 + 3.97 * t, 50.1 - 2.95 * t], materials.woodLight, "wasserhaus");
  }
  for (const x of [27, 32, 37]) meshBox(garden, [.45, 5.8, .45], [x, 2.9, 44], materials.woodDark, "wasserspiel");
  for (const [x, y, length, angle] of [[30.2,4.45,7.2,.14],[31.5,3.35,5.4,-.2],[31.7,2.05,6.8,.16]]) meshCylinder(garden, .28, length, [x,y,43.65], materials.metal, "wasserspiel", [0,0,Math.PI/2+angle]);
  for (const [x, y] of [[29.3,3.25],[34.2,2.15]]) {
    const wheel = meshCylinder(garden, .82, .22, [x,y,43.25], materials.woodDark, "wasserspiel", [Math.PI/2,0,0]);
    wheel.scale.z = .36;
  }
  meshCylinder(garden, .48, 3.1, [37,3.2,44.5], materials.metal, "wasserspiel");
  meshBox(garden, [.22, 1.7, .22], [36.15, 4.55, 44.5], materials.metal, "wasserspiel", [0, 0, -.55]);
  meshCylinder(garden, .32, 1.25, [35.65, 5.25, 44.5], materials.metal, "wasserspiel", [0, 0, Math.PI / 2]);
  meshBox(garden, [7.2, .4, 1.8], [32.5,1.25,46.5], materials.water, "wasserspiel");

  addBobbyCar(garden, -6.5, 33, materials.coral);
  addBobbyCar(garden, 4.8, 39.5, materials.yellow);
  addBobbyCar(garden, 7.5, 31.5, materials.blue);
  addBobbyCar(garden, -11.5, 45.5, materials.sage);
  addBobbyCar(garden, 10.5, 48, materials.violet);

  // Instanced trees keep the draw-call count low.
  const treePositions = [];
  for (let i = 0; i < 26; i++) {
    const angle = i * .72;
    const radius = 43 + (i % 4) * 4;
    const x = Math.cos(angle) * radius;
    const z = 6 + Math.sin(angle) * radius;
    const building = x > -41 && x < 41 && z > -58 && z < 27;
    const occupied = (x > 18 && z > 38) || (x < -24 && z > 31);
    if (!building && !occupied && z < 64) treePositions.push([x, z]);
  }
  const trunks = new THREE.InstancedMesh(unitCylinder, materials.woodDark, treePositions.length);
  const crowns = new THREE.InstancedMesh(unitSphere, materials.leaf, treePositions.length);
  const matrix = new THREE.Matrix4();
  treePositions.forEach(([x,z], index) => {
    matrix.compose(new THREE.Vector3(x,1.1,z), new THREE.Quaternion(), new THREE.Vector3(.55,2.2,.55)); trunks.setMatrixAt(index,matrix);
    matrix.compose(new THREE.Vector3(x,3.2,z), new THREE.Quaternion(), new THREE.Vector3(3.1,3.1,3.1)); crowns.setMatrixAt(index,matrix);
  });
  trunks.userData.infoKey = crowns.userData.infoKey = "baum";
  trunks.instanceMatrix.needsUpdate = crowns.instanceMatrix.needsUpdate = true;
  interactiveMeshes.push(trunks, crowns);
  garden.add(trunks, crowns);
}

function addLogos() {
  const loader = new THREE.TextureLoader();
  const entries = [
    ["assets/logos/bafep-mureck.png", -9, 7.1, 7.1],
    ["assets/logos/pkg-praxiskindergarten.png", 9, 7.8, 6.45]
  ];
  entries.forEach(([src, x, width, height]) => {
    meshBox(scene, [width + .35, height + .35, .28], [x, 5.1, 25.42], materials.glass, "eingang");
    loader.load(assetUrl(src), texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const logoMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false });
      const logo = new THREE.Mesh(unitPlane, logoMaterial);
      logo.scale.set(width, height, 1); logo.position.set(x, 5.1, 25.59); logo.userData.infoKey = "eingang";
      scene.add(logo); interactiveMeshes.push(logo); invalidate();
    });
  });
}

function optimizeRepeatedMeshes() {
  scene.updateMatrixWorld(true);
  const batches = new Map();
  scene.traverse(object => {
    if (!object.isMesh || object.isInstancedMesh || object === roofMesh) return;
    if (![unitBox, unitCylinder, unitSphere].includes(object.geometry)) return;
    const key = `${object.geometry.uuid}|${object.material.uuid}`;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(object);
  });

  batches.forEach(meshes => {
    if (meshes.length < 2) return;
    const source = meshes[0];
    const instances = new THREE.InstancedMesh(source.geometry, source.material, meshes.length);
    instances.userData.instanceInfoKeys = meshes.map(mesh => mesh.userData.infoKey || "");
    meshes.forEach((mesh, index) => {
      instances.setMatrixAt(index, mesh.matrixWorld);
      mesh.parent.remove(mesh);
    });
    instances.instanceMatrix.needsUpdate = true;
    instances.computeBoundingSphere();
    scene.add(instances);
  });

  interactiveMeshes.length = 0;
  scene.traverse(object => {
    if (object.isMesh && (object.userData.infoKey || object.userData.instanceInfoKeys?.some(Boolean))) interactiveMeshes.push(object);
  });
}

buildShell();
buildInterior();
buildGarden();
addLogos();
optimizeRepeatedMeshes();

const roomTargets = [
  ["Eingang", "eingang", [0, 4.4, 34], 0],
  ["Teamraum", "teamraum", [-23.1, 3.4, 17], 0, -.28],
  ["Büro", "buero", [-23, 3.2, 4.8], 0, -.33],
  ["Gruppenraum", "gruppenraum", [0, 4.4, 13], 0],
  ["Atelier", "atelier", [-21, 4.4, -8], 0],
  ["Bewegungsraum", "bewegung", [21, 4.4, -8], 0],
  ["Forschen", "forscherraum", [-22, 4.4, -27], 0],
  ["Musik", "musik", [22, 4.4, -27], 0],
  ["Ruhe", "ruheraum", [0, 4.4, -32], 0],
  ["Garten", "garten", [0, 4.4, 58], 0]
];

let yaw = 0;
let pitch = -.08;
let currentInfoKey = "";
let activeRoom = "";
const keys = new Set();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let dragging = false;
let pointerStart = { x: 0, y: 0 };
let pointerLast = { x: 0, y: 0 };
let framePending = false;
let lastFrame = performance.now();
let roofOpen = false;
let renderedFrames = 0;

function setCamera(position, nextYaw = 0, nextPitch = -.08) {
  camera.position.set(...position);
  yaw = nextYaw; pitch = nextPitch;
  camera.rotation.set(pitch, yaw, 0);
  updateLocation();
  invalidate();
}

function resetCamera() { setCamera([0, 4.4, 66], 0, -.08); }

function updateLocation() {
  const { x, z } = camera.position;
  let label = "Garten";
  if (x > -39 && x < 39 && z < 25 && z > -56) {
    if (x < -12 && z > 6) label = "Teamraum";
    else if (x < -15 && x > -31 && z > -2 && z <= 6) label = "Büro";
    else if (z > 12) label = "Eingang";
    else if (z > -18 && Math.abs(x) < 12) label = "Gruppenraum";
    else if (z > -27 && x < -12) label = "Atelier";
    else if (z > -27 && x > 12) label = "Bewegungsraum";
    else if (z <= -27 && x < -10) label = "Forscherraum";
    else if (z <= -27 && x > 10) label = "Musikbereich";
    else label = "Ruheraum";
  }
  if (label !== activeRoom) {
    activeRoom = label;
    locationLabel.textContent = label;
    document.querySelectorAll(".room-button").forEach(button => button.classList.toggle("active", button.textContent === label || (label === "Musikbereich" && button.textContent === "Musik") || (label === "Forscherraum" && button.textContent === "Forschen")));
  }
}

function updateRoof() {
  const inside = camera.position.x > -38.5 && camera.position.x < 38.5 && camera.position.z > -55.5 && camera.position.z < 24.5;
  if (inside === roofOpen) return;
  roofOpen = inside;
  materials.roof.opacity = inside ? .06 : .96;
  materials.roof.depthWrite = !inside;
  materials.roof.needsUpdate = true;
}

function updateLabels() {
  sceneLabels.forEach(label => {
    const distance = camera.position.distanceTo(label.position);
    label.visible = distance > 10 && distance < 90;
    if (label.visible) label.material.opacity = THREE.MathUtils.clamp((distance - 10) / 8, 0, 1);
  });
}

function updateMovement(delta) {
  if (!keys.size) return false;
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const movement = new THREE.Vector3();
  if (keys.has("w") || keys.has("arrowup")) movement.add(forward);
  if (keys.has("s") || keys.has("arrowdown")) movement.sub(forward);
  if (keys.has("d") || keys.has("arrowright")) movement.add(right);
  if (keys.has("a") || keys.has("arrowleft")) movement.sub(right);
  if (!movement.lengthSq()) return false;
  movement.normalize().multiplyScalar(12.5 * delta);
  camera.position.add(movement);
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -53, 53);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -68, 78);
  camera.position.y = 4.4;
  updateLocation();
  return true;
}

function invalidate() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(renderFrame);
}

function renderFrame(now) {
  framePending = false;
  const delta = Math.min((now - lastFrame) / 1000, .12);
  lastFrame = now;
  const moving = updateMovement(delta);
  updateRoof();
  updateLabels();
  camera.rotation.set(pitch, yaw, 0);
  renderer.render(scene, camera);
  renderedFrames++;
  if (moving || keys.size) invalidate();
}

function list(items) { return `<ul>${(items || []).map(item => `<li>${item}</li>`).join("")}</ul>`; }
function section(title, items) { return items?.length ? `<section class="info-section"><h3>${title}</h3>${list(items)}</section>` : ""; }

function documentsMarkup(info) {
  if (!info.documents?.length) return "";
  return `<section class="info-section"><h3>Dokumente und Planungen</h3><div class="document-list">${info.documents.map(doc => `<a class="document-link" href="${assetUrl(doc.href)}" data-title="${doc.title}" data-note="${doc.note}" data-type="${doc.type}"><span class="document-type">${doc.type}</span><span><strong>${doc.title}</strong><small>${doc.note}</small></span></a>`).join("")}</div></section>`;
}

function competenciesMarkup(info) {
  const foundation = `<section class="info-section competency-foundation"><h3>Kompetenzverständnis</h3><p>${competencyFramework.definition}</p>${list(competencyFramework.foundations)}</section>`;
  const categories = competencyFramework.categories.map(category => {
    const goals = info.competencies?.[category.key] || [];
    if (!goals.length) return "";
    return `<section class="info-section competency-section"><h3>${category.title}</h3><p>${category.description}</p>${list(goals)}</section>`;
  }).join("");
  return foundation + categories + section("Dokumentation", info.documentation) + section("Weiterführende Quellen", info.sources);
}

function renderOverview() {
  const info = objectInfo[currentInfoKey];
  if (!info) return;
  const references = info.images?.length ? `<div class="reference-grid">${info.images.map((src, index) => `<button class="reference-button" type="button" data-image="${assetUrl(src)}" aria-label="Referenzbild ${index + 1} vergrößern"><img src="${assetUrl(src)}" alt="Referenzbild ${index + 1} für ${info.title}"></button>`).join("")}</div>` : "";
  const tiles = [["target","Zielgruppe",info.age],["duration","Aktivitätsdauer",info.duration],["prep","Vorbereitung",info.prep],["social","Sozialform",info.group],["material","Material",info.material],["competencies","Kompetenzen / Lernziele","5 Kompetenzbereiche"]];
  infoBody.innerHTML = `${references}<div class="badges">${info.areas.map(area => `<span class="badge">${area}</span>`).join("")}</div><div class="tile-grid">${tiles.map(([key,label,value]) => `<button class="info-tile" type="button" data-layer="${key}"><strong>${label}</strong><span>${value}</span></button>`).join("")}</div>`;
  infoBody.scrollTop = 0;
}

function renderCollection(layer) {
  const info = objectInfo[currentInfoKey];
  if (!info) return;
  const collections = {
    target: ["Zielgruppe", info.age, section("Pädagogische Differenzierung", info.variations)],
    duration: ["Aktivitätsdauer", info.duration, section("Zeitliche Variationen", info.variations) + section("Jahreszeit", info.season ? [info.season] : [])],
    prep: ["Vorbereitung", info.prep, section("Praxis-Tipps", info.tips) + section("Sicherheitsaspekte", info.safety)],
    social: ["Sozialform", info.group, section("Gruppenarrangements", info.variations) + section("Begleitung", info.tips)],
    material: ["Material", info.material, section("Mindestausstattung laut Fachaufsicht, Stand 2019", info.minimum) + documentsMarkup(info)],
    competencies: ["Kompetenzen / Lernziele", info.areas.join(" · "), competenciesMarkup(info) + section("Objektbezogene theoretische Grundlage", info.theory)]
  };
  const collection = collections[layer];
  if (!collection) return;
  infoBody.innerHTML = `<div class="collection-head"><button class="icon-button back-button" type="button" aria-label="Zur Übersicht">←</button><h2>Materialsammlung: ${collection[0]}</h2></div><p class="collection-summary">${collection[1]}</p>${collection[2]}`;
  infoBody.scrollTop = 0;
}

function showInfo(key) {
  const info = objectInfo[key];
  if (!info) return;
  currentInfoKey = key;
  infoTitle.textContent = info.title;
  infoDescription.textContent = info.description;
  infoPanel.hidden = false;
  renderOverview();
}

function hideInfo() { infoPanel.hidden = true; currentInfoKey = ""; }

function openDocument(link) {
  const href = link.getAttribute("href");
  const type = link.dataset.type;
  documentTitle.textContent = link.dataset.title;
  documentNote.textContent = link.dataset.note;
  if (type === "DOCX") documentFrame.removeAttribute("srcdoc");
  if (type === "PDF" || type === "DOCX") {
    documentFrame.removeAttribute("srcdoc");
    documentFrame.src = type === "DOCX" ? href.replace(/\.docx$/i, ".html") : href;
  } else {
    documentFrame.src = "about:blank";
    documentFrame.srcdoc = `<style>body{display:grid;place-items:center;height:100vh;margin:0;font-family:Arial;background:#eef2ed;color:#183332}a{padding:12px 16px;border-radius:6px;background:#2f7272;color:white;text-decoration:none;font-weight:bold}</style><a href="${href}" target="_blank">Präsentation öffnen</a>`;
  }
  documentDialog.showModal();
}

roomTargets.forEach(([label, key, position, targetYaw, targetPitch]) => {
  const button = document.createElement("button");
  button.className = "room-button";
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", () => { setCamera(position, targetYaw, targetPitch); showInfo(key); });
  roomNav.appendChild(button);
});

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  if (["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(key)) {
    keys.add(key); event.preventDefault(); invalidate();
  }
  if (event.key === "Escape") {
    if (imageDialog.open) imageDialog.close();
    else if (documentDialog.open) documentDialog.close();
    else hideInfo();
  }
});
window.addEventListener("keyup", event => keys.delete(event.key.toLowerCase()));

canvas.addEventListener("pointerdown", event => {
  dragging = true;
  pointerStart = pointerLast = { x: event.clientX, y: event.clientY };
  canvas.classList.add("dragging");
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", event => {
  if (!dragging) return;
  const dx = event.clientX - pointerLast.x;
  const dy = event.clientY - pointerLast.y;
  pointerLast = { x: event.clientX, y: event.clientY };
  yaw -= dx * .0032;
  pitch = THREE.MathUtils.clamp(pitch - dy * .0025, -.78, .48);
  invalidate();
});
canvas.addEventListener("pointerup", event => {
  dragging = false;
  canvas.classList.remove("dragging");
  const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
  if (distance > 5) return;
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(interactiveMeshes, false)[0];
  const key = hit?.object.userData.instanceInfoKeys?.[hit.instanceId] || hit?.object.userData.infoKey;
  if (key) showInfo(key);
});
canvas.addEventListener("pointercancel", () => { dragging = false; canvas.classList.remove("dragging"); });
canvas.addEventListener("wheel", event => {
  event.preventDefault();
  camera.fov = THREE.MathUtils.clamp(camera.fov + Math.sign(event.deltaY) * 3, 36, 74);
  camera.updateProjectionMatrix(); invalidate();
}, { passive: false });

infoBody.addEventListener("click", event => {
  const image = event.target.closest(".reference-button");
  if (image) { largeImage.src = image.dataset.image; largeImage.alt = image.querySelector("img")?.alt || "Referenzbild"; imageDialog.showModal(); return; }
  const tile = event.target.closest(".info-tile");
  if (tile) { renderCollection(tile.dataset.layer); return; }
  if (event.target.closest(".back-button")) { renderOverview(); return; }
  const documentLink = event.target.closest(".document-link");
  if (documentLink) { event.preventDefault(); openDocument(documentLink); }
});

closeInfo.addEventListener("click", hideInfo);
resetView.addEventListener("click", resetCamera);
closeImage.addEventListener("click", () => imageDialog.close());
closeDocument.addEventListener("click", () => documentDialog.close());
imageDialog.addEventListener("click", event => { if (event.target === imageDialog) imageDialog.close(); });
documentDialog.addEventListener("click", event => { if (event.target === documentDialog) documentDialog.close(); });

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  invalidate();
});

const viewParams = new URLSearchParams(window.location.search);
const requestedRoom = viewParams.get("room");
const requestedTarget = roomTargets.find(([, key]) => key === requestedRoom);
const customX = Number(viewParams.get("x"));
const customZ = Number(viewParams.get("z"));
if (Number.isFinite(customX) && Number.isFinite(customZ) && viewParams.has("x") && viewParams.has("z")) {
  setCamera(
    [customX, Number(viewParams.get("y")) || 4.4, customZ],
    Number(viewParams.get("yaw")) || 0,
    Number(viewParams.get("pitch")) || -.08
  );
} else if (requestedTarget) setCamera(requestedTarget[2], requestedTarget[3], requestedTarget[4]);
else resetCamera();
const requestedInfo = viewParams.get("info");
if (requestedInfo && objectInfo[requestedInfo]) {
  showInfo(requestedInfo);
  const requestedLayer = viewParams.get("layer");
  if (requestedLayer) renderCollection(requestedLayer);
}
loading.classList.add("hidden");
invalidate();

window.__kindergarten = {
  camera,
  renderer,
  scene,
  interactiveMeshes,
  invalidate,
  showInfo,
  get renderedFrames() { return renderedFrames; }
};
