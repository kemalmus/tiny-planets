// Three's package ships JS without bundled .d.ts. The scene is exercised in the browser.
// @ts-nocheck
import * as THREE from "three/webgpu";
import {
  Fn,
  abs,
  attribute,
  cameraPosition,
  cross,
  dot,
  float,
  floor,
  fract,
  length,
  mix,
  normalWorld,
  normalize,
  positionLocal,
  positionWorld,
  sin,
  smoothstep,
  step,
  time,
  uniform,
  vec3,
  varying,
} from "three/tsl";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PRESET_MAP, type PlanetParams, type Preset, type SpeciesId } from "./presets";

export type PlanetHandle = {
  setParams: (params: PlanetParams) => void;
  dispose: () => void;
};

const SPECIES: SpeciesId[] = ["pine", "palm", "bush", "cactus", "rock"];

export async function mountPlanet(canvas: HTMLCanvasElement): Promise<PlanetHandle> {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x07080c, 1);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.08;
  await renderer.init();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07080c);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 200);
  camera.position.set(0.15, 0.85, 2.55);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.45;
  controls.maxDistance = 7;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xc9d6ee, 0x2a2218, 0.55));
  const sun = new THREE.DirectionalLight(0xfff1d2, 2.6);
  sun.position.set(4.2, 2.4, 3.1);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x8aa0c0, 0.18));

  const uSeed = uniform(7);
  const uAmp = uniform(0.18);
  const uFreq = uniform(1.55);
  const uWarp = uniform(0.55);
  const uSea = uniform(0.08);
  const uSeaRatio = uniform(0.46);
  const uSand = uniform(new THREE.Color("#e6c98a"));
  const uGrass = uniform(new THREE.Color("#6e9a45"));
  const uRock = uniform(new THREE.Color("#8d7968"));
  const uSnow = uniform(new THREE.Color("#f4f7fb"));
  const uDeep = uniform(new THREE.Color("#0d3a48"));
  const uShallow = uniform(new THREE.Color("#3aa3a6"));
  const uAtmo = uniform(new THREE.Color("#9fd0ff"));
  const uEmber = uniform(0);
  const uEmberColor = uniform(new THREE.Color("#ff6a2a"));
  const uSunDir = uniform(new THREE.Vector3(0.72, 0.42, 0.55).normalize());

  const hash13 = Fn(([p]) => {
    const p3 = fract(vec3(p).mul(vec3(0.1031, 0.103, 0.0973)));
    const p3b = fract(p3.add(dot(p3, p3.yzx.add(33.33))));
    return fract(p3b.x.add(p3b.y).mul(p3b.z));
  });

  const vnoise = Fn(([p]) => {
    const i = floor(p);
    const f = fract(p);
    const u = f.mul(f).mul(float(3).sub(f.mul(2)));
    const n = (offset) => hash13(i.add(offset));
    const x00 = mix(n(vec3(0, 0, 0)), n(vec3(1, 0, 0)), u.x);
    const x10 = mix(n(vec3(0, 1, 0)), n(vec3(1, 1, 0)), u.x);
    const x01 = mix(n(vec3(0, 0, 1)), n(vec3(1, 0, 1)), u.x);
    const x11 = mix(n(vec3(0, 1, 1)), n(vec3(1, 1, 1)), u.x);
    return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);
  });

  const fbm = Fn(([p]) => {
    return vnoise(p)
      .mul(0.5)
      .add(vnoise(p.mul(2.03)).mul(0.25))
      .add(vnoise(p.mul(4.07)).mul(0.125))
      .add(vnoise(p.mul(8.17)).mul(0.0625));
  });

  const terrainHeight = Fn(([p]) => {
    const shift = vec3(uSeed, uSeed.mul(0.17), uSeed.mul(0.73));
    const q = normalize(p).mul(uFreq).add(shift);
    const warp = vec3(
      vnoise(q.add(vec3(2.2, 8.1, 1.4))),
      vnoise(q.add(vec3(5.2, 1.3, 2.8))),
      vnoise(q.add(vec3(1.7, 9.2, 4.1))),
    )
      .sub(0.5)
      .mul(uWarp);
    const continent = vnoise(q.mul(0.42));
    const detail = fbm(q.add(warp));
    return continent.mul(0.58).add(detail.mul(0.42)).mul(uAmp);
  });

  const world = new THREE.Group();
  scene.add(world);

  const terrainMat = new THREE.MeshStandardNodeMaterial();
  terrainMat.roughness = 0.92;
  terrainMat.metalness = 0;
  terrainMat.flatShading = true;
  terrainMat.positionNode = Fn(() => {
    const dir = normalize(positionLocal);
    return dir.mul(float(1).add(terrainHeight(dir)));
  })();
  terrainMat.colorNode = Fn(() => {
    const h = length(positionWorld).sub(1);
    const hn = h.div(uAmp.max(0.0008));
    const shore = smoothstep(uSeaRatio.sub(0.008), uSeaRatio.add(0.05), hn);
    const grassT = smoothstep(uSeaRatio.add(0.03), uSeaRatio.add(0.18), hn);
    const rockT = smoothstep(0.62, 0.88, hn);
    const snowT = smoothstep(0.74, 0.94, hn);
    const slope = float(1).sub(dot(normalize(normalWorld), normalize(positionWorld)).clamp(0, 1));
    const cliff = smoothstep(0.32, 0.66, slope);
    const inland = mix(uSand, uGrass, grassT);
    const withRock = mix(inland, uRock, rockT.add(cliff.mul(shore)).clamp(0, 1));
    const withSnow = mix(withRock, uSnow, snowT.mul(float(1).sub(cliff)));
    const land = mix(uSand, withSnow, shore);
    const under = float(1).sub(smoothstep(uSeaRatio.sub(0.035), uSeaRatio.add(0.008), hn));
    const radial = normalize(positionWorld);
    const cau = sin(radial.x.mul(48).add(time.mul(1.25)))
      .mul(sin(radial.z.mul(42).sub(time.mul(0.85))))
      .mul(0.5)
      .add(0.5);
    const wet = mix(land, uDeep, under.mul(0.62));
    return mix(wet, vec3(0.82, 0.93, 1), under.mul(cau).mul(0.4).mul(float(1).sub(uEmber)));
  })();
  terrainMat.emissiveNode = Fn(() => {
    const hn = length(positionWorld).sub(1).div(uAmp.max(0.0008));
    return uEmberColor.mul(smoothstep(0.78, 0.98, hn).mul(uEmber));
  })();

  const terrain = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 32), terrainMat);
  world.add(terrain);

  const waterMat = new THREE.MeshStandardNodeMaterial();
  waterMat.roughness = 0.08;
  waterMat.metalness = 0;
  waterMat.transparent = true;
  waterMat.depthWrite = false;
  waterMat.positionNode = Fn(() => {
    const p = normalize(positionLocal);
    const ripple = sin(dot(p, vec3(22, 9, 17)).add(time.mul(0.85)))
      .mul(0.0024)
      .add(sin(dot(p, vec3(-14, 19, 6)).add(time.mul(1.35))).mul(0.0015));
    return p.mul(float(1).add(uSea).add(ripple));
  })();
  waterMat.colorNode = Fn(() => {
    const viewDir = normalize(cameraPosition.sub(positionWorld));
    const ndv = dot(normalWorld, viewDir).clamp(0, 1);
    const fres = float(1).sub(ndv).pow(2.4);
    return mix(uDeep, uShallow, ndv.mul(0.9)).add(vec3(0.75, 0.86, 0.95).mul(fres.mul(0.55)));
  })();
  waterMat.opacityNode = Fn(() => {
    const viewDir = normalize(cameraPosition.sub(positionWorld));
    const ndv = dot(normalWorld, viewDir).clamp(0, 1);
    const fres = float(1).sub(ndv).pow(2.2);
    return mix(float(0.5), float(0.9), fres);
  })();
  waterMat.roughnessNode = Fn(() => {
    const viewDir = normalize(cameraPosition.sub(positionWorld));
    const fres = float(1).sub(dot(normalWorld, viewDir).clamp(0, 1)).pow(2);
    return mix(float(0.24), float(0.04), fres);
  })();
  const water = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 24), waterMat);
  water.renderOrder = 2;
  world.add(water);

  const atmoMat = new THREE.MeshBasicNodeMaterial();
  atmoMat.side = THREE.BackSide;
  atmoMat.transparent = true;
  atmoMat.depthWrite = false;
  atmoMat.colorNode = Fn(() => {
    const sunAmt = dot(normalize(normalWorld), normalize(uSunDir)).clamp(0, 1).pow(1.35);
    return mix(uAtmo, vec3(1, 0.86, 0.7), sunAmt.mul(0.85));
  })();
  atmoMat.opacityNode = Fn(() => {
    const viewDir = normalize(cameraPosition.sub(positionWorld));
    const rim = float(1).sub(dot(normalize(normalWorld), viewDir).abs());
    const rimA = smoothstep(0.02, 0.72, rim);
    const sunAmt = dot(normalize(normalWorld), normalize(uSunDir)).clamp(0, 1);
    return rimA.mul(mix(float(0.22), float(0.78), sunAmt));
  })();
  const atmo = new THREE.Mesh(new THREE.IcosahedronGeometry(1.16, 16), atmoMat);
  atmo.renderOrder = 3;
  world.add(atmo);

  const disposables = [terrain.geometry, water.geometry, atmo.geometry];

  function bakeGeometry(source) {
    const geo = source.index ? source.toNonIndexed() : source;
    const position = geo.getAttribute("position").array;
    const normal = geo.getAttribute("normal").array;
    const pos = new Float32Array(position);
    const nrm = new Float32Array(normal);
    if (geo !== source) geo.dispose();
    source.dispose();
    const merged = new THREE.BufferGeometry();
    merged.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    merged.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
    return merged;
  }

  function joinParts(parts) {
    let length = 0;
    for (const part of parts) length += part.getAttribute("position").count;
    const pos = new Float32Array(length * 3);
    const nrm = new Float32Array(length * 3);
    let offset = 0;
    for (const part of parts) {
      const p = part.getAttribute("position").array;
      const n = part.getAttribute("normal").array;
      pos.set(p, offset);
      nrm.set(n, offset);
      offset += p.length;
      part.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
    return geo;
  }

  function makePine() {
    const trunk = new THREE.CylinderGeometry(0.012, 0.016, 0.055, 5);
    trunk.translate(0, 0.028, 0);
    const a = new THREE.ConeGeometry(0.055, 0.09, 6);
    a.translate(0, 0.09, 0);
    const b = new THREE.ConeGeometry(0.038, 0.07, 6);
    b.translate(0, 0.135, 0);
    return joinParts([bakeGeometry(trunk), bakeGeometry(a), bakeGeometry(b)]);
  }

  function makePalm() {
    const trunk = new THREE.CylinderGeometry(0.01, 0.014, 0.1, 5);
    trunk.translate(0, 0.05, 0);
    const parts = [bakeGeometry(trunk)];
    for (let i = 0; i < 6; i++) {
      const frond = new THREE.ConeGeometry(0.012, 0.085, 4);
      frond.translate(0, 0.042, 0);
      frond.rotateZ(1.15);
      frond.rotateY((i / 6) * Math.PI * 2);
      frond.translate(0, 0.1, 0);
      parts.push(bakeGeometry(frond));
    }
    return joinParts(parts);
  }

  function makeBush() {
    const ball = new THREE.IcosahedronGeometry(0.038, 1);
    ball.scale(1, 0.72, 1);
    ball.translate(0, 0.028, 0);
    return bakeGeometry(ball);
  }

  function makeCactus() {
    const trunk = new THREE.CylinderGeometry(0.016, 0.018, 0.11, 6);
    trunk.translate(0, 0.055, 0);
    const arm = new THREE.CylinderGeometry(0.011, 0.012, 0.05, 5);
    arm.translate(0, 0.025, 0);
    arm.rotateZ(Math.PI / 2.4);
    arm.translate(0.02, 0.07, 0);
    return joinParts([bakeGeometry(trunk), bakeGeometry(arm)]);
  }

  function makeRock() {
    const rock = new THREE.DodecahedronGeometry(0.04, 0);
    rock.scale(1.1, 0.72, 0.9);
    rock.translate(0, 0.02, 0);
    return bakeGeometry(rock);
  }

  const makers = {
    pine: makePine,
    palm: makePalm,
    bush: makeBush,
    cactus: makeCactus,
    rock: makeRock,
  };

  const speciesNodes = {};

  function fibonacci(count, offset) {
    const dirs = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - ((i + 0.5) / count) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * (i + offset);
      dirs[i * 3] = Math.cos(theta) * radius;
      dirs[i * 3 + 1] = y;
      dirs[i * 3 + 2] = Math.sin(theta) * radius;
      scales[i] = 0.72 + ((i * 53 + offset) % 100) / 100 * 0.7;
    }
    return { dirs, scales };
  }

  function addSpecies(id, count, offset, foliageSplit) {
    const geo = makers[id]();
    const { dirs, scales } = fibonacci(count, offset);
    geo.setAttribute("iDir", new THREE.InstancedBufferAttribute(dirs, 3));
    geo.setAttribute("iScale", new THREE.InstancedBufferAttribute(scales, 1));
    const uOn = uniform(0);
    const uLift = uniform(0.04);
    const uSpan = uniform(0.4);
    const uLeaf = uniform(new THREE.Color("#3e7a40"));
    const uTrunk = uniform(new THREE.Color("#6b4a2e"));
    const material = new THREE.MeshStandardNodeMaterial();
    material.roughness = 0.84;
    material.flatShading = true;
    const localY = varying(positionLocal.y);
    material.positionNode = Fn(() => {
      const dir = normalize(attribute("iDir", "vec3"));
      const scale = attribute("iScale", "float");
      const h = terrainHeight(dir);
      const hn = h.div(uAmp.max(0.0008));
      const lo = uSeaRatio.add(uLift);
      const hi = lo.add(uSpan);
      const visible = step(lo, hn).mul(step(hn, hi)).mul(uOn);
      const sway = sin(time.mul(1.5).add(dir.x.mul(14).add(dir.z.mul(9))))
        .mul(positionLocal.y)
        .mul(0.28)
        .mul(visible);
      const local = vec3(positionLocal.x.add(sway), positionLocal.y, positionLocal.z).mul(scale).mul(visible);
      const helper = mix(vec3(0, 1, 0), vec3(1, 0, 0), step(0.94, abs(dir.y)));
      const tangent = normalize(cross(helper, dir));
      const bitangent = normalize(cross(dir, tangent));
      const oriented = tangent.mul(local.x).add(dir.mul(local.y)).add(bitangent.mul(local.z));
      const planted = oriented.add(dir.mul(float(1).add(h)));
      return mix(vec3(0, 0, 0), planted, visible);
    })();
    material.colorNode = foliageSplit
      ? mix(uTrunk, uLeaf, smoothstep(0.05, 0.075, localY))
      : mix(uTrunk, uLeaf, fract(attribute("iDir", "vec3").x.mul(9).add(0.37)));
    const mesh = new THREE.InstancedMesh(geo, material, count);
    mesh.frustumCulled = false;
    world.add(mesh);
    disposables.push(geo);
    speciesNodes[id] = { uOn, uLift, uSpan, uLeaf, uTrunk };
  }

  addSpecies("pine", 150, 3, true);
  addSpecies("palm", 100, 80, true);
  addSpecies("bush", 120, 160, false);
  addSpecies("cactus", 80, 240, true);
  addSpecies("rock", 90, 320, false);

  const starPositions = new Float32Array(900 * 3);
  for (let i = 0; i < 900; i++) {
    const radius = 28 + Math.random() * 40;
    const theta = Math.random() * Math.PI * 2;
    const y = Math.random() * 2 - 1;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    starPositions[i * 3] = Math.cos(theta) * ring * radius;
    starPositions[i * 3 + 1] = y * radius;
    starPositions[i * 3 + 2] = Math.sin(theta) * ring * radius;
  }
  const starsGeo = new THREE.BufferGeometry();
  starsGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starsGeo,
    new THREE.PointsMaterial({ color: 0xe8e2d4, size: 0.09, sizeAttenuation: true }),
  );
  scene.add(stars);
  disposables.push(starsGeo);

  const state = {
    spin: true,
  };

  function paintColor(node, hex: string) {
    node.value.set(hex);
  }

  function applyPreset(preset: Preset) {
    paintColor(uSand, preset.sand);
    paintColor(uGrass, preset.grass);
    paintColor(uRock, preset.rock);
    paintColor(uSnow, preset.snow);
    paintColor(uDeep, preset.deep);
    paintColor(uShallow, preset.shallow);
    paintColor(uAtmo, preset.atmo);
    paintColor(uEmberColor, preset.emberColor);
    uEmber.value = preset.ember;
    uWarp.value = preset.warp;
    for (const id of SPECIES) {
      const spec = preset.species[id];
      const nodes = speciesNodes[id];
      nodes.uOn.value = spec?.on ? 1 : 0;
      nodes.uLift.value = spec?.lift ?? 0;
      nodes.uSpan.value = spec?.span ?? 0;
      if (spec) {
        paintColor(nodes.uLeaf, spec.leaf);
        paintColor(nodes.uTrunk, spec.trunk);
      }
    }
  }

  function setParams(params: PlanetParams) {
    state.spin = params.spin;
    uSeed.value = params.seed;
    uAmp.value = params.amp;
    uFreq.value = params.freq;
    uSeaRatio.value = params.sea;
    uSea.value = params.sea * params.amp;
    applyPreset(PRESET_MAP[params.preset]);
  }

  const timer = new THREE.Timer();
  let running = true;
  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  renderer.setAnimationLoop((now) => {
    if (!running) return;
    timer.update(now);
    const delta = Math.min(timer.getDelta(), 0.05);
    if (state.spin) world.rotation.y += delta * 0.12;
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    setParams,
    dispose() {
      running = false;
      renderer.setAnimationLoop(null);
      observer.disconnect();
      controls.dispose();
      for (const geo of disposables) geo.dispose();
      terrainMat.dispose();
      waterMat.dispose();
      atmoMat.dispose();
      stars.material.dispose();
      renderer.dispose();
    },
  };
}
