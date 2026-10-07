import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const strawberryLabelUrl = new URL(
  "./assets/bigbubble-strawberry-label-red-drummer-caprasimo-v2.avif",
  document.baseURI,
).href;
const strawberryModelUrl = new URL(
  "./assets/bigbubble-strawberry-photoreal.gltf",
  document.baseURI,
).href;

type BigBubbleCanSceneProps = {
  storyRef: RefObject<HTMLElement | null>;
};

export const FRUIT_ENTRY_SCROLL_VIEWPORTS = 0.92;

type BubbleActor = {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>;
  material: THREE.ShaderMaterial;
  active: boolean;
  age: number;
  origin: THREE.Vector3;
  size: number;
  rise: number;
  driftX: number;
  driftZ: number;
  lifetime: number;
  phase: number;
  wobble: number;
};

type CanBurstBubble = {
  start: THREE.Vector3;
  direction: THREE.Vector3;
  size: number;
  delay: number;
  phase: number;
};

type StrawberryTraveler = {
  group: THREE.Group;
  start: number;
  end: number;
  laneX: number;
  startY: number;
  endY: number;
  depth: number;
  scale: number;
  phase: number;
  rotationTurns: THREE.Vector3;
};

type CanSequencePose = {
  progress: number;
  x: number;
  y: number;
  scale: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const mix = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;

const smooth = (start: number, end: number, value: number) => {
  const amount = clamp((value - start) / (end - start));
  return amount * amount * (3 - 2 * amount);
};

// Hold the can at the size established as it leaves the release section. The
// card choreography changes position and rotation, but not perceived depth.
const CAN_SEQUENCE_SCALE = 1.16;
const CAN_REFORM_SCROLL_FRACTION = 0.38;

const CAN_SEQUENCE_POSES: CanSequencePose[] = [
  {
    progress: 0,
    x: -0.1,
    y: -1.62,
    scale: CAN_SEQUENCE_SCALE,
    rotationX: 0.1,
    rotationY: -0.24,
    rotationZ: -0.13,
  },
  {
    progress: 0.13,
    x: -1.62,
    y: -0.68,
    scale: CAN_SEQUENCE_SCALE,
    rotationX: 0.02,
    rotationY: 0.24,
    rotationZ: -0.045,
  },
  {
    progress: 0.27,
    x: 1.58,
    y: -0.66,
    scale: CAN_SEQUENCE_SCALE,
    rotationX: 0,
    rotationY: 2.34,
    rotationZ: 0.085,
  },
  {
    progress: 0.39,
    x: 1.58,
    y: -0.62,
    scale: CAN_SEQUENCE_SCALE,
    rotationX: 0,
    rotationY: 2.92,
    rotationZ: 0.025,
  },
  {
    progress: 0.5,
    x: -1.56,
    y: -0.65,
    scale: CAN_SEQUENCE_SCALE,
    rotationX: 0.015,
    rotationY: 3.54,
    rotationZ: -0.11,
  },
  {
    progress: 0.62,
    x: -1.54,
    y: -0.61,
    scale: CAN_SEQUENCE_SCALE,
    rotationX: 0,
    rotationY: 5.98,
    rotationZ: -0.025,
  },
  {
    progress: 0.74,
    x: 1.55,
    y: -0.64,
    scale: CAN_SEQUENCE_SCALE,
    rotationX: -0.01,
    rotationY: 7.42,
    rotationZ: 0.16,
  },
  {
    progress: 0.84,
    x: 1.55,
    y: -0.6,
    scale: CAN_SEQUENCE_SCALE,
    rotationX: 0,
    rotationY: 8,
    rotationZ: 0.08,
  },
  {
    progress: 0.9,
    x: 0.48,
    y: -0.56,
    scale: CAN_SEQUENCE_SCALE,
    rotationX: 0.02,
    rotationY: 8.62,
    rotationZ: -0.15,
  },
  {
    progress: 0.95,
    x: 0,
    y: -0.48,
    scale: CAN_SEQUENCE_SCALE,
    rotationX: 0.025,
    rotationY: 9.3,
    rotationZ: -0.08,
  },
  {
    progress: 1,
    x: 0,
    y: -0.52,
    scale: CAN_SEQUENCE_SCALE,
    rotationX: 0,
    rotationY: Math.PI * 4,
    rotationZ: 0,
  },
];

// The reformed can continues straight down into the final composition with a
// restrained three-quarter pose so the package keeps its cylindrical depth.
const REFERENCE_MOTION_POSES: CanSequencePose[] = [
  {
    progress: 0,
    x: 0,
    y: -0.52,
    scale: 0.9,
    rotationX: 0.035,
    rotationY: -0.08,
    rotationZ: -0.008,
  },
  {
    progress: 0.18,
    x: 0,
    y: -0.78,
    scale: 0.96,
    rotationX: 0.04,
    rotationY: -0.11,
    rotationZ: -0.006,
  },
  {
    progress: 0.34,
    x: 0,
    y: -1.1,
    scale: 1.02,
    rotationX: 0.045,
    rotationY: -0.14,
    rotationZ: -0.004,
  },
  {
    progress: 0.5,
    x: 0,
    y: -1.46,
    scale: 1.08,
    rotationX: 0.05,
    rotationY: -0.16,
    rotationZ: 0,
  },
  {
    progress: 0.68,
    x: 0,
    y: -1.9,
    scale: 1.18,
    rotationX: 0.055,
    rotationY: -0.15,
    rotationZ: 0.004,
  },
  {
    progress: 0.84,
    x: 0,
    y: -2.52,
    scale: 1.365,
    rotationX: 0.055,
    rotationY: -0.13,
    rotationZ: 0.006,
  },
  {
    progress: 1,
    x: 0,
    y: -2.56,
    scale: 1.404,
    rotationX: 0.05,
    rotationY: -0.12,
    rotationZ: 0.004,
  },
];

const sampleCanPose = (
  poses: CanSequencePose[],
  progress: number,
): CanSequencePose => {
  const clampedProgress = clamp(progress);
  const nextIndex = poses.findIndex(
    (pose) => pose.progress >= clampedProgress,
  );
  if (nextIndex <= 0) return poses[0]!;
  if (nextIndex === -1) return poses.at(-1)!;

  const previous = poses[nextIndex - 1]!;
  const next = poses[nextIndex]!;
  const rawAmount =
    (clampedProgress - previous.progress) /
    Math.max(next.progress - previous.progress, 0.0001);
  const amount = rawAmount * rawAmount * (3 - 2 * rawAmount);

  return {
    progress: clampedProgress,
    x: mix(previous.x, next.x, amount),
    y: mix(previous.y, next.y, amount),
    scale: mix(previous.scale, next.scale, amount),
    rotationX: mix(previous.rotationX, next.rotationX, amount),
    rotationY: mix(previous.rotationY, next.rotationY, amount),
    rotationZ: mix(previous.rotationZ, next.rotationZ, amount),
  };
};

const sampleCanSequencePose = (progress: number) =>
  sampleCanPose(CAN_SEQUENCE_POSES, progress);

const sampleReferenceMotionPose = (progress: number) =>
  sampleCanPose(REFERENCE_MOTION_POSES, progress);

const bubbleNoise = (index: number, salt: number) => {
  const value = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

function preparePhotorealStrawberry(source: THREE.Group) {
  source.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(source);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const normalizationScale = 2 / Math.max(size.x, size.y, size.z, 0.001);

  source.scale.multiplyScalar(normalizationScale);
  source.position.addScaledVector(center, -normalizationScale);

  const strawberry = new THREE.Group();
  strawberry.name = "photorealStrawberryPrototype";
  strawberry.rotation.order = "YXZ";
  strawberry.add(source);
  strawberry.updateMatrixWorld(true);

  strawberry.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.frustumCulled = false;
    child.renderOrder = 12;
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((material) => {
      material.transparent = false;
      material.depthWrite = true;
      material.needsUpdate = true;
      if (material instanceof THREE.MeshStandardMaterial) {
        material.envMapIntensity = 0.72;
        material.roughness = Math.max(material.roughness, 0.36);
        if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
      }
    });
  });

  strawberry.visible = false;
  return strawberry;
}

function clonePhotorealStrawberry(prototype: THREE.Group, index: number) {
  const strawberry = prototype.clone(true);
  strawberry.name = `scrollStrawberry${index + 1}`;
  strawberry.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.material = Array.isArray(child.material)
      ? child.material.map((material) => material.clone())
      : child.material.clone();
  });
  strawberry.visible = false;
  return strawberry;
}

function disposeThreeGroup(group: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    geometries.add(child.geometry);
    const childMaterials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    childMaterials.forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) textures.add(value);
      });
    });
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}

const bubbleVertexShader = `
  varying vec3 vNormalView;
  varying vec3 vViewDirection;
  varying vec3 vBubbleTint;

  void main() {
    vec4 localPosition = vec4(position, 1.0);
    vec3 localNormal = normal;

    #ifdef USE_INSTANCING
      localPosition = instanceMatrix * localPosition;
      localNormal = mat3(instanceMatrix) * normal;
    #endif

    #ifdef USE_INSTANCING_COLOR
      vBubbleTint = instanceColor;
    #else
      vBubbleTint = vec3(1.0);
    #endif

    vec4 viewPosition = modelViewMatrix * localPosition;
    vNormalView = normalize(normalMatrix * localNormal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const bubbleFragmentShader = `
  uniform float uOpacity;
  uniform float uFilmPhase;
  uniform float uTime;

  varying vec3 vNormalView;
  varying vec3 vViewDirection;
  varying vec3 vBubbleTint;

  void main() {
    vec3 normalView = normalize(vNormalView);
    vec3 viewDirection = normalize(vViewDirection);
    float facing = abs(dot(normalView, viewDirection));
    float fresnel = pow(1.0 - facing, 2.25);
    float rim = smoothstep(0.04, 0.94, fresnel);

    float filmWave =
      fresnel * 2.8 +
      uFilmPhase +
      sin(normalView.y * 10.0 + normalView.x * 7.0 + uTime * 0.32) * 0.055;
    vec3 spectrum = 0.5 + 0.5 * cos(
      6.2831853 * (filmWave + vec3(0.0, 0.33, 0.67))
    );

    vec3 keyDirection = normalize(vec3(-0.48, 0.78, 0.4));
    vec3 fillDirection = normalize(vec3(0.68, 0.34, 0.64));
    float keyGlint = pow(max(dot(normalView, keyDirection), 0.0), 150.0);
    float fillGlint = pow(max(dot(normalView, fillDirection), 0.0), 84.0);

    vec3 coolGlass = vec3(0.72, 0.93, 1.0);
    vec3 filmColor = mix(coolGlass, spectrum, 0.76);
    vec3 color = filmColor * (0.32 + rim * 1.18);
    color = mix(color, color * vBubbleTint, 0.38);
    color += vec3(1.0) * (keyGlint * 2.25 + fillGlint * 0.82);

    float centerFilm = 0.018 + (1.0 - facing) * 0.025;
    float alpha = uOpacity * (
      centerFilm +
      rim * 0.58 +
      keyGlint * 0.94 +
      fillGlint * 0.36
    );

    if (alpha < 0.008) discard;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.92));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function createBubbleMaterial(filmPhase: number) {
  return new THREE.ShaderMaterial({
    blending: THREE.NormalBlending,
    depthWrite: false,
    fragmentShader: bubbleFragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
    uniforms: {
      uFilmPhase: { value: filmPhase },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: bubbleVertexShader,
  });
}

const CAN_WRAP_RADIUS = 0.8;
const CAN_LABEL_ASPECT = 1604 / 980;
const CAN_ORIGINAL_BOTTOM = -1.975;
const CAN_ORIGINAL_TOP = 2.045;
const CAN_HEIGHT_SCALE =
  ((Math.PI * 2 * CAN_WRAP_RADIUS) / CAN_LABEL_ASPECT) /
  (CAN_ORIGINAL_TOP - CAN_ORIGINAL_BOTTOM);
const canY = (value: number) => value * CAN_HEIGHT_SCALE;

function createCan(labelTexture: THREE.Texture) {
  const can = new THREE.Group();
  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: labelTexture,
    clearcoat: 0.86,
    clearcoatRoughness: 0.075,
    metalness: 0.08,
    roughness: 0.22,
  });
  const aluminum = new THREE.MeshPhysicalMaterial({
    color: 0xf2f3ef,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    emissive: 0x3a3b39,
    emissiveIntensity: 0.18,
    metalness: 0.72,
    roughness: 0.24,
  });
  const aluminumDark = new THREE.MeshPhysicalMaterial({
    color: 0xdfe2df,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
    emissive: 0x30312f,
    emissiveIntensity: 0.15,
    metalness: 0.76,
    roughness: 0.25,
  });
  const openingMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x252a2b,
    metalness: 0.94,
    roughness: 0.19,
  });
  const bottomRecessMaterial = new THREE.MeshBasicMaterial({
    color: 0xd6d9d5,
    side: THREE.DoubleSide,
  });

  // One continuous decorated aluminum surface. The same production artwork
  // runs from directly beneath the top seam, across the shoulder and wall,
  // around the lower taper, and down to the base chime. Only the actual lid,
  // rolled seams, pull tab, and underside remain exposed aluminum.
  const wrappedBodyProfile = [
    new THREE.Vector2(0.655, canY(-1.975)),
    new THREE.Vector2(0.675, canY(-1.95)),
    new THREE.Vector2(0.72, canY(-1.91)),
    new THREE.Vector2(0.765, canY(-1.855)),
    new THREE.Vector2(0.79, canY(-1.81)),
    new THREE.Vector2(0.8, canY(-1.765)),
    new THREE.Vector2(0.8, canY(-1.72)),
    new THREE.Vector2(0.8, canY(1.76)),
    new THREE.Vector2(0.8, canY(1.805)),
    new THREE.Vector2(0.792, canY(1.845)),
    new THREE.Vector2(0.775, canY(1.89)),
    new THREE.Vector2(0.735, canY(1.955)),
    new THREE.Vector2(0.695, canY(2.005)),
    new THREE.Vector2(0.68, canY(2.045)),
  ];
  const wrappedBodyGeometry = new THREE.LatheGeometry(
    wrappedBodyProfile,
    192,
  );
  const bodyPositions = wrappedBodyGeometry.getAttribute("position");
  const bodyUvs = wrappedBodyGeometry.getAttribute("uv");
  const bodyBottom = wrappedBodyProfile.at(0)!.y;
  const bodyTop = wrappedBodyProfile.at(-1)!.y;
  const bodyHeight = bodyTop - bodyBottom;

  // LatheGeometry's stock V coordinate is based on profile-point index. That
  // heavily compresses a label when several points are used to model each
  // shoulder. Remap V from the vertex's real height so every millimetre of
  // artwork keeps the same scale from the top seam to the bottom chime.
  for (let index = 0; index < bodyPositions.count; index += 1) {
    bodyUvs.setY(
      index,
      THREE.MathUtils.clamp(
        (bodyPositions.getY(index) - bodyBottom) / bodyHeight,
        0,
        1,
      ),
    );
  }
  bodyUvs.needsUpdate = true;

  const wrappedBody = new THREE.Mesh(wrappedBodyGeometry, bodyMaterial);
  can.add(wrappedBody);

  const topSeam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.715, 0.715, 0.042, 160),
    aluminum,
  );
  topSeam.position.y = canY(2.066);
  can.add(topSeam);

  const topDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.672, 0.672, 0.023, 160),
    aluminumDark,
  );
  topDisc.position.y = canY(2.096);
  can.add(topDisc);

  const topEdge = new THREE.Mesh(
    new THREE.TorusGeometry(0.708, 0.032, 22, 192),
    aluminum,
  );
  topEdge.rotation.x = Math.PI / 2;
  topEdge.position.y = canY(2.094);
  can.add(topEdge);

  const innerLidRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.51, 0.012, 16, 128),
    aluminum,
  );
  innerLidRing.rotation.x = Math.PI / 2;
  innerLidRing.position.y = canY(2.112);
  can.add(innerLidRing);

  const drinkOpening = new THREE.Mesh(
    new THREE.CircleGeometry(0.145, 48),
    openingMaterial,
  );
  drinkOpening.name = "drinkOpening";
  drinkOpening.rotation.x = -Math.PI / 2;
  drinkOpening.scale.set(0.66, 1.08, 1);
  drinkOpening.position.set(0, canY(2.121), 0.22);
  can.add(drinkOpening);

  const openingSeal = new THREE.Mesh(
    new THREE.CircleGeometry(0.145, 48),
    aluminumDark.clone(),
  );
  openingSeal.name = "openingSeal";
  openingSeal.rotation.x = -Math.PI / 2;
  openingSeal.scale.set(0.66, 1.08, 1);
  openingSeal.position.set(0, canY(2.124), 0.22);
  can.add(openingSeal);

  const tabShape = new THREE.Shape();
  tabShape.absellipse(0, 0, 0.145, 0.265, 0, Math.PI * 2, false, 0);
  const tabHole = new THREE.Path();
  tabHole.absellipse(0, 0.035, 0.068, 0.126, 0, Math.PI * 2, true, 0);
  tabShape.holes.push(tabHole);
  const tabMaterial = aluminum.clone();
  tabMaterial.color.set(0xf8f9f5);
  tabMaterial.emissiveIntensity = 0.24;
  tabMaterial.side = THREE.DoubleSide;
  const tab = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tabShape, {
      bevelEnabled: false,
      curveSegments: 48,
      depth: 0.018,
    }),
    tabMaterial,
  );
  const tabPivot = new THREE.Group();
  tabPivot.name = "pullTabPivot";
  tabPivot.position.set(0, canY(2.126), -0.205);
  can.add(tabPivot);
  tab.rotation.x = Math.PI / 2;
  tab.position.set(0, 0, 0.195);
  tabPivot.add(tab);

  const tabPin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.047, 0.047, 0.025, 40),
    aluminum,
  );
  tabPin.position.set(0, canY(2.128), -0.205);
  can.add(tabPin);

  const baseFoot = new THREE.Mesh(
    new THREE.TorusGeometry(0.642, 0.03, 18, 160),
    aluminum,
  );
  baseFoot.rotation.x = Math.PI / 2;
  baseFoot.position.y = canY(-1.974);
  can.add(baseFoot);

  const bottomRecess = new THREE.Mesh(
    new THREE.CylinderGeometry(0.61, 0.61, 0.018, 128),
    bottomRecessMaterial,
  );
  bottomRecess.position.y = canY(-1.986);
  can.add(bottomRecess);

  const condensationGeometry = new THREE.SphereGeometry(1, 18, 14);
  const condensationMaterial = new THREE.MeshPhysicalMaterial({
    clearcoat: 1,
    clearcoatRoughness: 0.01,
    color: 0xffffff,
    depthWrite: false,
    metalness: 0,
    opacity: 0.31,
    roughness: 0.04,
    transparent: true,
    transmission: 0.42,
  });
  condensationMaterial.userData.baseOpacity = 0.31;
  condensationMaterial.userData.baseDepthWrite = false;
  for (let index = 0; index < 54; index += 1) {
    const angle = bubbleNoise(index, 31.1) * Math.PI * 2;
    const y = mix(canY(-1.69), canY(1.95), bubbleNoise(index, 32.7));
    const shoulderTaper =
      y > canY(1.74)
        ? mix(1, 0.865, (y - canY(1.74)) / canY(0.21))
        : 1;
    const radius = 0.812 * shoulderTaper;
    const droplet = new THREE.Mesh(
      condensationGeometry,
      condensationMaterial,
    );
    droplet.position.set(
      Math.sin(angle) * radius,
      y,
      Math.cos(angle) * radius,
    );
    const dropletWidth = mix(0.014, 0.037, bubbleNoise(index, 34.3));
    droplet.scale.set(
      dropletWidth,
      dropletWidth * mix(1.2, 1.95, bubbleNoise(index, 35.9)),
      dropletWidth * 0.62,
    );
    droplet.rotation.y = angle;
    droplet.renderOrder = 4;
    can.add(droplet);
  }

  return can;
}

function createProductionBubbleLabel(fruitImage: HTMLImageElement | null) {
  // The canvas aspect follows the physical circumference-to-profile ratio of
  // the complete shoulder-to-chime wrap, so the artwork is never vertically
  // stretched to reach the top or bottom of the can.
  const width = 2080;
  const height = 1710;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return canvas;

  const navy = "#0e2b77";
  const turquoise = "#66bcc1";
  const coral = "#ee416f";
  const berry = "#cb1f58";
  const red = "#f24454";
  const cream = "#fff8e9";

  context.fillStyle = turquoise;
  context.fillRect(0, 0, width, height);

  const shade = context.createLinearGradient(0, 0, width, 0);
  shade.addColorStop(0, "rgba(14,43,119,0.18)");
  shade.addColorStop(0.17, "rgba(255,255,255,0.08)");
  shade.addColorStop(0.5, "rgba(255,255,255,0.2)");
  shade.addColorStop(0.83, "rgba(255,255,255,0.08)");
  shade.addColorStop(1, "rgba(14,43,119,0.18)");
  context.fillStyle = shade;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(14,43,119,0.07)";
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 22) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  const drawWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ) => {
    const words = text.split(" ");
    let line = "";
    let cursorY = y;
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (context.measureText(next).width > maxWidth && line) {
        context.fillText(line, x, cursorY);
        line = word;
        cursorY += lineHeight;
      } else {
        line = next;
      }
    }
    if (line) context.fillText(line, x, cursorY);
    return cursorY + lineHeight;
  };

  const drawDrop = (x: number, y: number, size: number, color: string, angle = 0) => {
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.beginPath();
    context.moveTo(0, -size);
    context.bezierCurveTo(size * 0.92, -size * 0.1, size * 0.78, size, 0, size);
    context.bezierCurveTo(-size * 0.78, size, -size * 0.92, -size * 0.1, 0, -size);
    context.closePath();
    const gradient = context.createRadialGradient(
      -size * 0.28,
      -size * 0.35,
      size * 0.05,
      0,
      0,
      size,
    );
    gradient.addColorStop(0, "rgba(255,255,255,.9)");
    gradient.addColorStop(0.18, color);
    gradient.addColorStop(1, berry);
    context.fillStyle = gradient;
    context.fill();
    context.restore();
  };

  const drawLiquidRibbon = (
    x: number,
    direction: 1 | -1,
    color: string,
    widthScale: number,
    edgeColorA = berry,
    edgeColorB = red,
  ) => {
    context.save();
    context.beginPath();
    context.moveTo(x, -40);
    context.bezierCurveTo(
      x + direction * 95 * widthScale,
      170,
      x - direction * 70 * widthScale,
      330,
      x + direction * 55 * widthScale,
      505,
    );
    context.bezierCurveTo(
      x + direction * 135 * widthScale,
      690,
      x - direction * 95 * widthScale,
      875,
      x + direction * 42 * widthScale,
      1085,
    );
    context.bezierCurveTo(
      x + direction * 95 * widthScale,
      1240,
      x + direction * 35 * widthScale,
      1370,
      x,
      1480,
    );
    context.lineTo(x - direction * 122 * widthScale, 1480);
    context.bezierCurveTo(
      x - direction * 72 * widthScale,
      1260,
      x - direction * 160 * widthScale,
      1100,
      x - direction * 75 * widthScale,
      920,
    );
    context.bezierCurveTo(
      x + direction * 28 * widthScale,
      720,
      x - direction * 135 * widthScale,
      525,
      x - direction * 72 * widthScale,
      320,
    );
    context.bezierCurveTo(
      x - direction * 18 * widthScale,
      170,
      x - direction * 90 * widthScale,
      30,
      x - direction * 122 * widthScale,
      -40,
    );
    context.closePath();
    const liquid = context.createLinearGradient(x - 140, 0, x + 140, 0);
    liquid.addColorStop(0, edgeColorA);
    liquid.addColorStop(0.5, color);
    liquid.addColorStop(1, edgeColorB);
    context.fillStyle = liquid;
    context.fill();
    context.strokeStyle = "rgba(255,255,255,.32)";
    context.lineWidth = 5;
    context.stroke();
    context.restore();
  };

  // Continuous strawberry-liquid language wraps the package and gives the
  // side panels the same visual weight as the front.
  // Broad cream rivers sit below the berry liquid. This keeps the wrap's
  // graphic language visible from every angle instead of reducing it to a
  // few decorative droplets on the front panel.
  drawLiquidRibbon(42, 1, cream, 1.58, cream, cream);
  drawLiquidRibbon(width - 38, -1, cream, 1.62, cream, cream);
  drawLiquidRibbon(width * 0.252, -1, cream, 0.74, cream, cream);
  drawLiquidRibbon(width * 0.748, 1, cream, 0.74, cream, cream);
  drawLiquidRibbon(52, 1, coral, 1.06);
  drawLiquidRibbon(width - 46, -1, coral, 1.08);
  drawLiquidRibbon(width * 0.252, -1, red, 0.48);
  drawLiquidRibbon(width * 0.748, 1, red, 0.48);
  for (let index = 0; index < 38; index += 1) {
    const dropX = mix(20, width - 20, bubbleNoise(index, 44.1));
    const dropY = mix(28, height - 28, bubbleNoise(index, 45.7));
    const isCenter = dropX > width * 0.31 && dropX < width * 0.69;
    if (isCenter && dropY > height * 0.26 && dropY < height * 0.75) continue;
    drawDrop(
      dropX,
      dropY,
      mix(7, 24, bubbleNoise(index, 46.9)),
      bubbleNoise(index, 47.6) > 0.46 ? coral : red,
      bubbleNoise(index, 48.2) * Math.PI * 2,
    );
  }

  const frontLeft = width * 0.285;
  const frontRight = width * 0.715;
  context.beginPath();
  context.roundRect(frontLeft, height * 0.025, frontRight - frontLeft, height * 0.95, 62);
  const frontWash = context.createLinearGradient(frontLeft, 0, frontRight, 0);
  frontWash.addColorStop(0, "rgba(95,190,195,.9)");
  frontWash.addColorStop(0.5, "rgba(190,231,228,.94)");
  frontWash.addColorStop(1, "rgba(95,190,195,.9)");
  context.fillStyle = frontWash;
  context.fill();
  context.save();
  context.globalAlpha = 0.82;
  drawLiquidRibbon(frontLeft + 26, 1, coral, 0.52);
  drawLiquidRibbon(frontRight - 26, -1, red, 0.52);
  context.restore();

  // A visible fruit-splash system belongs to the consumer-facing panel. The
  // earlier wrap hid most of it on the side panels, which made the hero read
  // like a sparse mock label instead of a finished beverage package.
  context.save();
  context.translate(width * 0.5, height * 0.495);
  context.fillStyle = "rgba(203,31,88,.94)";
  context.beginPath();
  context.moveTo(-305, 70);
  context.bezierCurveTo(-365, -40, -300, -135, -225, -142);
  context.bezierCurveTo(-270, -212, -190, -254, -128, -198);
  context.bezierCurveTo(-78, -286, 42, -279, 72, -184);
  context.bezierCurveTo(158, -240, 252, -176, 214, -96);
  context.bezierCurveTo(320, -68, 326, 51, 247, 96);
  context.bezierCurveTo(281, 181, 172, 230, 105, 176);
  context.bezierCurveTo(34, 252, -90, 226, -115, 145);
  context.bezierCurveTo(-194, 211, -305, 168, -305, 70);
  context.closePath();
  context.fill();
  context.strokeStyle = "rgba(255,248,233,.72)";
  context.lineWidth = 8;
  context.stroke();
  context.restore();

  for (let index = 0; index < 18; index += 1) {
    const angle = (index / 18) * Math.PI * 2;
    const orbitX = width * mix(0.13, 0.205, bubbleNoise(index, 122.1));
    const orbitY = height * mix(0.15, 0.245, bubbleNoise(index, 123.7));
    drawDrop(
      width * 0.5 + Math.cos(angle) * orbitX,
      height * 0.49 + Math.sin(angle) * orbitY,
      mix(9, 25, bubbleNoise(index, 124.9)),
      index % 3 === 0 ? red : coral,
      angle + Math.PI / 2,
    );
  }

  const centerX = width * 0.5;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = navy;
  context.font = `400 ${Math.round(height * 0.116)}px "Rubik Dirt", sans-serif`;
  context.fillText("Bubble", centerX, height * 0.115);
  context.font = `800 ${Math.round(height * 0.017)}px "Inter", sans-serif`;
  context.letterSpacing = `${Math.round(height * 0.0055)}px`;
  context.fillText("NATURALLY ESSENCED", centerX, height * 0.19);
  context.letterSpacing = "0px";
  context.strokeStyle = coral;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(frontLeft + 62, height * 0.222);
  context.lineTo(centerX - 38, height * 0.222);
  context.moveTo(centerX + 38, height * 0.222);
  context.lineTo(frontRight - 62, height * 0.222);
  context.stroke();
  drawDrop(centerX, height * 0.222, 20, coral);

  if (fruitImage?.naturalWidth && fruitImage.naturalHeight) {
    const cutoutCanvas = document.createElement("canvas");
    cutoutCanvas.width = fruitImage.naturalWidth;
    cutoutCanvas.height = fruitImage.naturalHeight;
    const cutoutContext = cutoutCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (cutoutContext) {
      cutoutContext.drawImage(fruitImage, 0, 0);
      const cutout = cutoutContext.getImageData(
        0,
        0,
        cutoutCanvas.width,
        cutoutCanvas.height,
      );
      for (let pixel = 0; pixel < cutout.data.length; pixel += 4) {
        const red = cutout.data[pixel]!;
        const green = cutout.data[pixel + 1]!;
        const blue = cutout.data[pixel + 2]!;
        const channelSpread =
          Math.max(red, green, blue) - Math.min(red, green, blue);
        const brightness = (red + green + blue) / 3;
        if (channelSpread < 16 && brightness > 216) cutout.data[pixel + 3] = 0;
      }
      cutoutContext.putImageData(cutout, 0, 0);
    }

    const maxFruitWidth = width * 0.405;
    const maxFruitHeight = height * 0.515;
    const fruitScale = Math.min(
      maxFruitWidth / fruitImage.naturalWidth,
      maxFruitHeight / fruitImage.naturalHeight,
    );
    const fruitWidth = fruitImage.naturalWidth * fruitScale;
    const fruitHeight = fruitImage.naturalHeight * fruitScale;
    context.drawImage(
      cutoutContext ? cutoutCanvas : fruitImage,
      centerX - fruitWidth / 2,
      height * 0.235,
      fruitWidth,
      fruitHeight,
    );
  }

  for (let index = 0; index < 13; index += 1) {
    const angle = (index / 13) * Math.PI * 2;
    const radiusX = width * mix(0.145, 0.2, bubbleNoise(index, 70.1));
    const radiusY = height * mix(0.17, 0.25, bubbleNoise(index, 71.3));
    drawDrop(
      centerX + Math.cos(angle) * radiusX,
      height * 0.48 + Math.sin(angle) * radiusY,
      mix(8, 18, bubbleNoise(index, 72.8)),
      coral,
      angle + Math.PI / 2,
    );
  }

  context.fillStyle = navy;
  context.font = `400 ${Math.round(height * 0.054)}px "Rubik Dirt", sans-serif`;
  context.fillText("STRAWBERRY", centerX, height * 0.74);
  context.fillText("SPARK", centerX, height * 0.797);
  context.fillStyle = navy;
  context.font = `800 ${Math.round(height * 0.0165)}px "Inter", sans-serif`;
  context.fillText("SPARKLING WATER · STRAWBERRY ESSENCE", centerX, height * 0.845);

  const drawFrontIcon = (x: number, y: number, kind: "leaf" | "drop" | "bubbles") => {
    context.save();
    context.translate(x, y);
    context.strokeStyle = navy;
    context.fillStyle = "transparent";
    context.lineWidth = 5;
    context.beginPath();
    context.arc(0, 0, 31, 0, Math.PI * 2);
    context.stroke();
    if (kind === "leaf") {
      context.beginPath();
      context.ellipse(0, -1, 12, 20, Math.PI / 4, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.moveTo(-10, 12);
      context.lineTo(10, -12);
      context.stroke();
    } else if (kind === "drop") {
      context.beginPath();
      context.moveTo(0, -20);
      context.bezierCurveTo(17, 2, 14, 19, 0, 21);
      context.bezierCurveTo(-14, 19, -17, 2, 0, -20);
      context.stroke();
    } else {
      [[-9, 5, 8], [8, 7, 10], [4, -11, 6]].forEach(([cx, cy, radius]) => {
        context.beginPath();
        context.arc(cx!, cy!, radius!, 0, Math.PI * 2);
        context.stroke();
      });
    }
    context.restore();
  };
  drawFrontIcon(centerX - 140, height * 0.9, "leaf");
  drawFrontIcon(centerX, height * 0.9, "drop");
  drawFrontIcon(centerX + 140, height * 0.9, "bubbles");
  context.font = `800 ${Math.round(height * 0.0125)}px "Inter", sans-serif`;
  context.fillText("REAL FRUIT", centerX - 140, height * 0.944);
  context.fillText("NO ADDED SUGAR", centerX, height * 0.944);
  context.fillText("BIG BUBBLES", centerX + 140, height * 0.944);
  context.font = `800 ${Math.round(height * 0.015)}px "Inter", sans-serif`;
  context.fillText("12 FL OZ (355 mL)", centerX, height * 0.974);

  // Nutrition panel — dense, legible and structurally true to production
  // packaging rather than decorative placeholder lines.
  const panelX = width * 0.032;
  const panelY = height * 0.055;
  const panelWidth = width * 0.205;
  const panelHeight = height * 0.57;
  context.beginPath();
  context.roundRect(panelX, panelY, panelWidth, panelHeight, 18);
  context.fillStyle = "rgba(255,248,233,.97)";
  context.fill();
  context.strokeStyle = navy;
  context.lineWidth = 4;
  context.stroke();
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillStyle = navy;
  context.font = `900 ${Math.round(height * 0.037)}px "Inter", sans-serif`;
  context.fillText("Nutrition Facts", panelX + 18, panelY + 54);
  context.font = `600 ${Math.round(height * 0.014)}px "Inter", sans-serif`;
  context.fillText("1 serving per container", panelX + 18, panelY + 82);
  context.font = `800 ${Math.round(height * 0.015)}px "Inter", sans-serif`;
  context.fillText("Serving size", panelX + 18, panelY + 112);
  context.textAlign = "right";
  context.fillText("1 can (355 mL)", panelX + panelWidth - 18, panelY + 112);
  const nutritionRows = [
    ["Calories", "0", true],
    ["Total Fat", "0g", false],
    ["Sodium", "0mg", false],
    ["Total Carbohydrate", "0g", false],
    ["Total Sugars", "0g", false],
    ["Includes Added Sugars", "0g", false],
    ["Protein", "0g", false],
  ] as const;
  let rowY = panelY + 164;
  nutritionRows.forEach(([label, value, major]) => {
    context.strokeStyle = navy;
    context.lineWidth = major ? 9 : 2;
    context.beginPath();
    context.moveTo(panelX + 18, rowY - 31);
    context.lineTo(panelX + panelWidth - 18, rowY - 31);
    context.stroke();
    context.font = `${major ? 900 : 700} ${major ? 35 : 20}px "Inter", sans-serif`;
    context.textAlign = "left";
    context.fillText(label, panelX + 18, rowY);
    context.textAlign = "right";
    context.fillText(value, panelX + panelWidth - 18, rowY);
    rowY += major ? 67 : 49;
  });
  context.strokeStyle = navy;
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(panelX + 18, rowY - 26);
  context.lineTo(panelX + panelWidth - 18, rowY - 26);
  context.stroke();
  context.textAlign = "left";
  context.font = `600 16px "Inter", sans-serif`;
  context.fillText("Not a significant source of calories from fat.", panelX + 18, rowY + 1);

  context.fillStyle = navy;
  context.font = `800 17px "Inter", sans-serif`;
  let ingredientY = drawWrappedText(
    "INGREDIENTS: Carbonated water, natural strawberry essence, citric acid.",
    panelX,
    panelY + panelHeight + 43,
    panelWidth,
    25,
  );
  context.font = `600 16px "Inter", sans-serif`;
  ingredientY = drawWrappedText(
    "Produced for Bubble Beverage Co. · Made in USA",
    panelX,
    ingredientY + 10,
    panelWidth,
    23,
  );

  const barcodeX = panelX + 18;
  const barcodeY = ingredientY + 22;
  const barcodeWidth = panelWidth - 36;
  context.fillStyle = cream;
  context.fillRect(barcodeX - 8, barcodeY - 8, barcodeWidth + 16, 162);
  let barCursor = barcodeX;
  for (let index = 0; index < 78; index += 1) {
    const barWidth = 2 + Math.floor(bubbleNoise(index, 91.7) * 6);
    if (index % 2 === 0) {
      context.fillStyle = navy;
      context.fillRect(barCursor, barcodeY, barWidth, 122);
    }
    barCursor += barWidth;
    if (barCursor > barcodeX + barcodeWidth) break;
  }
  context.fillStyle = navy;
  context.textAlign = "center";
  context.font = `700 19px "Inter", sans-serif`;
  context.letterSpacing = "3px";
  context.fillText("8 60421 00355 2", panelX + panelWidth / 2, barcodeY + 148);
  context.letterSpacing = "0px";
  context.save();
  context.translate(width * 0.018, height * 0.5);
  context.rotate(-Math.PI / 2);
  context.font = `800 27px "Inter", sans-serif`;
  context.letterSpacing = "7px";
  context.fillText("RIPE FRUIT · BIG BUBBLES · ZERO QUIET", 0, 0);
  context.restore();

  // Side story and benefits with true pictograms and a functional-looking
  // scan block make the wrap complete from every camera angle.
  const storyX = width * 0.767;
  const storyWidth = width * 0.2;
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.fillStyle = navy;
  context.font = `400 ${Math.round(height * 0.035)}px "Rubik Dirt", sans-serif`;
  context.fillText("BERRY SPARKLE", storyX + storyWidth / 2, height * 0.095);
  context.fillText("IN EVERY SIP", storyX + storyWidth / 2, height * 0.137);
  context.fillStyle = cream;
  context.fillRect(storyX, height * 0.165, storyWidth, 6);
  context.textAlign = "left";
  context.fillStyle = navy;
  context.font = `650 20px "Inter", sans-serif`;
  let storyY = drawWrappedText(
    "Bubble is built for real fruit people. Bright strawberry essence meets crisp sparkling water for a refreshing finish made to share.",
    storyX,
    height * 0.205,
    storyWidth,
    30,
  );
  const benefits = [
    ["bolt", "NATURAL ENERGY", "A vivid lift from real fruit aroma"],
    ["drop", "HYDRATION", "Crisp sparkling water, served cold"],
    ["leaf", "CLEAN INGREDIENTS", "Nothing artificial, no added sugar"],
    ["berry", "FRUIT FORWARD", "Ripe strawberry in every sip"],
  ] as const;
  const drawBenefitIcon = (kind: string, x: number, y: number) => {
    context.save();
    context.translate(x, y);
    context.strokeStyle = navy;
    context.lineWidth = 5;
    context.beginPath();
    context.arc(0, 0, 33, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    if (kind === "bolt") {
      context.moveTo(5, -22);
      context.lineTo(-11, 2);
      context.lineTo(0, 2);
      context.lineTo(-5, 23);
      context.lineTo(15, -6);
      context.lineTo(3, -6);
      context.closePath();
    } else if (kind === "drop") {
      context.moveTo(0, -22);
      context.bezierCurveTo(18, 1, 15, 22, 0, 22);
      context.bezierCurveTo(-15, 22, -18, 1, 0, -22);
    } else if (kind === "leaf") {
      context.ellipse(0, 0, 13, 22, Math.PI / 4, 0, Math.PI * 2);
      context.moveTo(-11, 15);
      context.lineTo(12, -14);
    } else {
      context.moveTo(0, -22);
      context.bezierCurveTo(20, -12, 18, 17, 0, 23);
      context.bezierCurveTo(-18, 17, -20, -12, 0, -22);
      [-8, 0, 8].forEach((seedX) => {
        context.moveTo(seedX, -4);
        context.arc(seedX, 5, 2, 0, Math.PI * 2);
      });
    }
    context.stroke();
    context.restore();
  };
  storyY += 22;
  benefits.forEach(([kind, title, copy]) => {
    drawBenefitIcon(kind, storyX + 35, storyY + 16);
    context.fillStyle = navy;
    context.textAlign = "left";
    context.font = `850 21px "Inter", sans-serif`;
    context.fillText(title, storyX + 84, storyY + 4);
    context.font = `600 17px "Inter", sans-serif`;
    drawWrappedText(copy, storyX + 84, storyY + 29, storyWidth - 84, 22);
    storyY += 104;
  });

  const qrSize = 146;
  const qrX = storyX + 12;
  const qrY = height * 0.795;
  context.fillStyle = cream;
  context.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
  context.strokeStyle = navy;
  context.lineWidth = 4;
  context.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
  const cell = qrSize / 21;
  for (let row = 0; row < 21; row += 1) {
    for (let column = 0; column < 21; column += 1) {
      const finder =
        (column < 7 && row < 7) ||
        (column > 13 && row < 7) ||
        (column < 7 && row > 13);
      const finderRing = finder &&
        (column % 14 === 0 || column % 14 === 6 || row % 14 === 0 || row % 14 === 6);
      const finderCore = finder && column % 14 > 1 && column % 14 < 5 && row % 14 > 1 && row % 14 < 5;
      const data = bubbleNoise(row * 21 + column, 99.4) > 0.53;
      if (finderRing || finderCore || (!finder && data)) {
        context.fillStyle = navy;
        context.fillRect(qrX + column * cell, qrY + row * cell, cell + 0.5, cell + 0.5);
      }
    }
  }
  context.fillStyle = navy;
  context.textAlign = "left";
  context.font = `400 30px "Rubik Dirt", sans-serif`;
  context.fillText("SCAN TO MEET", qrX + qrSize + 28, qrY + 58);
  context.fillText("THE BERRY", qrX + qrSize + 28, qrY + 98);
  context.font = `650 17px "Inter", sans-serif`;
  drawWrappedText(
    "bubblewater.com/strawberry",
    qrX + qrSize + 28,
    qrY + 131,
    storyWidth - qrSize - 18,
    22,
  );

  // Fine condensation printed into the wrap complements the dimensional
  // droplets on the Three.js model without obscuring the required copy.
  for (let index = 0; index < 80; index += 1) {
    const x = bubbleNoise(index, 112.3) * width;
    const y = bubbleNoise(index, 113.7) * height;
    const radius = mix(2, 10, bubbleNoise(index, 115.1));
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = "rgba(255,255,255,.17)";
    context.fill();
    context.strokeStyle = "rgba(255,255,255,.28)";
    context.lineWidth = 1.5;
    context.stroke();
  }

  return canvas;
}

function createBubleStrawberryLabel(fruitImage: HTMLImageElement | null) {
  const width = 2400;
  const height = 1600;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return canvas;

  const navy = "#0e2b77";
  const turquoise = "#42c2c7";
  const turquoiseDark = "#168b98";
  const coral = "#ff466f";
  const berry = "#cb174f";
  const white = "#fffdf8";
  const black = "#101010";

  context.fillStyle = white;
  context.fillRect(0, 0, width, height);

  const drawWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ) => {
    const words = text.split(" ");
    let line = "";
    let cursorY = y;
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (line && context.measureText(next).width > maxWidth) {
        context.fillText(line, x, cursorY);
        line = word;
        cursorY += lineHeight;
      } else {
        line = next;
      }
    }
    if (line) context.fillText(line, x, cursorY);
    return cursorY + lineHeight;
  };

  const drawDrop = (
    x: number,
    y: number,
    size: number,
    rotation = 0,
    color = coral,
  ) => {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.beginPath();
    context.moveTo(0, -size);
    context.bezierCurveTo(size * 0.88, -size * 0.12, size * 0.78, size, 0, size);
    context.bezierCurveTo(-size * 0.78, size, -size * 0.88, -size * 0.12, 0, -size);
    context.closePath();
    const liquid = context.createRadialGradient(
      -size * 0.28,
      -size * 0.35,
      size * 0.04,
      0,
      0,
      size,
    );
    liquid.addColorStop(0, "rgba(255,255,255,.94)");
    liquid.addColorStop(0.2, color);
    liquid.addColorStop(1, berry);
    context.fillStyle = liquid;
    context.fill();
    context.strokeStyle = "rgba(109,0,51,.26)";
    context.lineWidth = 2;
    context.stroke();
    context.restore();
  };

  const drawLiquidEdge = (
    startX: number,
    direction: 1 | -1,
    breadth: number,
  ) => {
    context.save();
    context.beginPath();
    context.moveTo(startX, -20);
    context.bezierCurveTo(
      startX + direction * breadth * 0.88,
      165,
      startX - direction * breadth * 0.2,
      320,
      startX + direction * breadth * 0.62,
      515,
    );
    context.bezierCurveTo(
      startX + direction * breadth * 1.06,
      695,
      startX - direction * breadth * 0.18,
      865,
      startX + direction * breadth * 0.58,
      1055,
    );
    context.bezierCurveTo(
      startX + direction * breadth * 0.98,
      1240,
      startX + direction * breadth * 0.1,
      1405,
      startX + direction * breadth * 0.48,
      height + 20,
    );
    context.lineTo(startX - direction * breadth * 0.62, height + 20);
    context.bezierCurveTo(
      startX - direction * breadth * 0.17,
      1395,
      startX - direction * breadth * 0.92,
      1215,
      startX - direction * breadth * 0.28,
      1040,
    );
    context.bezierCurveTo(
      startX + direction * breadth * 0.22,
      860,
      startX - direction * breadth * 0.84,
      680,
      startX - direction * breadth * 0.24,
      505,
    );
    context.bezierCurveTo(
      startX + direction * breadth * 0.16,
      315,
      startX - direction * breadth * 0.7,
      145,
      startX - direction * breadth * 0.54,
      -20,
    );
    context.closePath();
    const fill = context.createLinearGradient(
      startX - breadth,
      0,
      startX + breadth,
      0,
    );
    fill.addColorStop(0, berry);
    fill.addColorStop(0.5, coral);
    fill.addColorStop(1, "#ff7690");
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = "rgba(255,255,255,.5)";
    context.lineWidth = 5;
    context.stroke();
    context.restore();
  };

  // The reference uses liquid ribbons as structural edges, not decorative
  // stickers. Keep them behind every label column so they wrap continuously.
  drawLiquidEdge(70, 1, 142);
  drawLiquidEdge(width - 70, -1, 142);
  drawLiquidEdge(665, -1, 86);
  drawLiquidEdge(1735, 1, 86);

  for (let index = 0; index < 58; index += 1) {
    const x = mix(52, width - 52, bubbleNoise(index, 210.4));
    const y = mix(32, height - 32, bubbleNoise(index, 211.7));
    const inFruitWindow = x > 740 && x < 1650 && y > 420 && y < 1120;
    if (inFruitWindow) continue;
    drawDrop(
      x,
      y,
      mix(7, 22, bubbleNoise(index, 212.3)),
      bubbleNoise(index, 213.1) * Math.PI * 2,
      bubbleNoise(index, 214.8) > 0.5 ? coral : turquoise,
    );
  }

  // LEFT COLUMN — production facts, ingredients, certification marks, barcode.
  const leftX = 126;
  const leftWidth = 520;
  context.save();
  context.translate(62, height / 2);
  context.rotate(-Math.PI / 2);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = white;
  context.font = '800 42px "Inter", sans-serif';
  context.letterSpacing = "9px";
  context.fillText("REAL FRUIT · EVERY DAY", 0, 0);
  context.restore();
  context.letterSpacing = "0px";

  const factsX = leftX + 22;
  const factsY = 74;
  const factsWidth = leftWidth - 44;
  const factsHeight = 790;
  context.fillStyle = "rgba(255,255,255,.95)";
  context.beginPath();
  context.roundRect(factsX, factsY, factsWidth, factsHeight, 20);
  context.fill();
  context.strokeStyle = black;
  context.lineWidth = 4;
  context.stroke();
  context.fillStyle = black;
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = '900 49px "Inter", sans-serif';
  context.fillText("Nutrition Facts", factsX + 20, factsY + 58);
  context.font = '700 20px "Inter", sans-serif';
  context.fillText("8 servings per container", factsX + 20, factsY + 92);
  context.fillText("Serving size", factsX + 20, factsY + 126);
  context.textAlign = "right";
  context.fillText("1 Can", factsX + factsWidth - 20, factsY + 126);
  context.fillRect(factsX + 18, factsY + 144, factsWidth - 36, 14);
  context.textAlign = "left";
  context.font = '600 17px "Inter", sans-serif';
  context.fillText("Amount per serving", factsX + 20, factsY + 188);
  context.font = '900 31px "Inter", sans-serif';
  context.fillText("Calories", factsX + 20, factsY + 233);
  context.textAlign = "right";
  context.font = '900 43px "Inter", sans-serif';
  context.fillText("0", factsX + factsWidth - 20, factsY + 233);
  context.fillRect(factsX + 18, factsY + 247, factsWidth - 36, 8);
  context.font = '700 16px "Inter", sans-serif';
  context.fillText("% Daily Value*", factsX + factsWidth - 20, factsY + 282);

  const rows = [
    ["Total Fat 0g", "0%"],
    ["Sodium 0mg", "0%"],
    ["Total Carbohydrate 0g", "0%"],
    ["Dietary Fiber 0g", "0%"],
    ["Total Sugars 0g", ""],
    ["Includes 0g Added Sugars", "0%"],
    ["Protein 0g", ""],
  ] as const;
  let rowY = factsY + 324;
  rows.forEach(([label, value], index) => {
    context.strokeStyle = black;
    context.lineWidth = index === rows.length - 1 ? 8 : 2;
    context.beginPath();
    context.moveTo(factsX + 20, rowY - 27);
    context.lineTo(factsX + factsWidth - 20, rowY - 27);
    context.stroke();
    context.fillStyle = black;
    context.textAlign = "left";
    context.font = `${index === 0 || index === 1 || index === 2 ? 800 : 600} 20px "Inter", sans-serif`;
    context.fillText(label, factsX + 20 + (index === 3 || index === 5 ? 18 : 0), rowY);
    context.textAlign = "right";
    context.fillText(value, factsX + factsWidth - 20, rowY);
    rowY += 49;
  });
  context.textAlign = "left";
  context.font = '700 19px "Inter", sans-serif';
  context.fillText("Vitamin C 18mg", factsX + 20, rowY + 12);
  context.textAlign = "right";
  context.fillText("20%", factsX + factsWidth - 20, rowY + 12);
  context.textAlign = "left";
  context.fillText("Potassium 35mg", factsX + 20, rowY + 59);
  context.textAlign = "right";
  context.fillText("1%", factsX + factsWidth - 20, rowY + 59);
  context.font = '600 14px "Inter", sans-serif';
  context.textAlign = "left";
  drawWrappedText(
    "*The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet.",
    factsX + 20,
    rowY + 103,
    factsWidth - 40,
    19,
  );

  context.fillStyle = navy;
  context.font = '800 18px "Inter", sans-serif';
  let copyY = drawWrappedText(
    "INGREDIENTS: Carbonated water, natural strawberry essence, citric acid.",
    leftX + 22,
    916,
    leftWidth - 44,
    25,
  );
  context.font = '650 16px "Inter", sans-serif';
  copyY = drawWrappedText(
    "Produced by Buble Beverage Co. · Portland, Oregon · Made in USA",
    leftX + 22,
    copyY + 12,
    leftWidth - 44,
    23,
  );

  const drawCertificationIcon = (
    x: number,
    y: number,
    type: "fruit" | "sugar" | "recycle",
    label: string,
  ) => {
    context.save();
    context.translate(x, y);
    context.strokeStyle = navy;
    context.fillStyle = "transparent";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(0, 0, 32, 0, Math.PI * 2);
    context.stroke();
    if (type === "fruit") {
      context.beginPath();
      context.moveTo(0, 19);
      context.bezierCurveTo(-25, 3, -18, -22, 3, -16);
      context.bezierCurveTo(23, -21, 28, 5, 0, 19);
      context.stroke();
      context.beginPath();
      context.moveTo(-2, -16);
      context.quadraticCurveTo(10, -30, 22, -20);
      context.stroke();
    } else if (type === "sugar") {
      context.beginPath();
      context.moveTo(0, -23);
      context.bezierCurveTo(21, 0, 18, 23, 0, 23);
      context.bezierCurveTo(-18, 23, -21, 0, 0, -23);
      context.stroke();
      context.beginPath();
      context.moveTo(-25, 25);
      context.lineTo(25, -25);
      context.stroke();
    } else {
      context.font = '900 43px "Inter", sans-serif';
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = navy;
      context.fillText("↻", 0, 1);
    }
    context.restore();
    context.fillStyle = navy;
    context.textAlign = "center";
    context.textBaseline = "alphabetic";
    context.font = '800 14px "Inter", sans-serif';
    context.fillText(label, x, y + 56);
  };

  const iconY = 1128;
  drawCertificationIcon(leftX + 108, iconY, "fruit", "REAL FRUIT");
  drawCertificationIcon(leftX + 260, iconY, "sugar", "NO ADDED SUGAR");
  drawCertificationIcon(leftX + 412, iconY, "recycle", "PLEASE RECYCLE");

  const barcodeX = leftX + 42;
  const barcodeY = 1238;
  const barcodeWidth = leftWidth - 84;
  context.fillStyle = white;
  context.fillRect(barcodeX - 16, barcodeY - 10, barcodeWidth + 32, 226);
  let cursor = barcodeX;
  for (let index = 0; index < 92 && cursor < barcodeX + barcodeWidth; index += 1) {
    const barWidth = 2 + Math.floor(bubbleNoise(index, 221.9) * 7);
    if (index % 2 === 0) {
      context.fillStyle = navy;
      context.fillRect(cursor, barcodeY, barWidth, 164);
    }
    cursor += barWidth;
  }
  context.fillStyle = navy;
  context.textAlign = "center";
  context.font = '700 25px "Inter", sans-serif';
  context.letterSpacing = "6px";
  context.fillText("8 60421 00355 2", leftX + leftWidth / 2, barcodeY + 202);
  context.letterSpacing = "0px";

  // CENTER COLUMN — the supplied label's hierarchy, expressed with Buble's
  // existing strawberry art, palette, type, flavor name, and product claims.
  const centerLeft = 676;
  const centerRight = 1724;
  const centerX = (centerLeft + centerRight) / 2;
  context.textAlign = "center";
  context.textBaseline = "middle";

  // The front now uses a new, clean label system. The reference contributes
  // only the information order: wordmark, descriptor, fruit, flavor, claims.
  context.fillStyle = black;
  context.font = '400 216px "Anton", "Arial Narrow", sans-serif';
  context.letterSpacing = "8px";
  context.fillText("BUBLE", centerX, 178);
  context.letterSpacing = "0px";
  context.fillStyle = coral;
  context.beginPath();
  context.arc(centerX - 38, 68, 13, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = black;
  context.font = '800 34px "Inter", sans-serif';
  context.letterSpacing = "13px";
  context.fillText("NATURAL FRUIT SELTZER", centerX, 318);
  context.letterSpacing = "0px";

  context.strokeStyle = coral;
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(centerLeft + 78, 369);
  context.lineTo(centerX - 54, 369);
  context.moveTo(centerX + 54, 369);
  context.lineTo(centerRight - 78, 369);
  context.stroke();
  drawDrop(centerX, 369, 19, 0, coral);

  const fruitHalo = context.createRadialGradient(
    centerX - 90,
    676,
    34,
    centerX,
    718,
    430,
  );
  fruitHalo.addColorStop(0, "rgba(255,223,230,.86)");
  fruitHalo.addColorStop(0.68, "rgba(255,239,242,.62)");
  fruitHalo.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = fruitHalo;
  context.beginPath();
  context.ellipse(centerX, 718, 430, 342, -0.05, 0, Math.PI * 2);
  context.fill();

  if (fruitImage?.naturalWidth && fruitImage.naturalHeight) {
    const cutoutCanvas = document.createElement("canvas");
    cutoutCanvas.width = fruitImage.naturalWidth;
    cutoutCanvas.height = fruitImage.naturalHeight;
    const cutoutContext = cutoutCanvas.getContext("2d", { willReadFrequently: true });
    if (cutoutContext) {
      cutoutContext.drawImage(fruitImage, 0, 0);
      const cutout = cutoutContext.getImageData(
        0,
        0,
        cutoutCanvas.width,
        cutoutCanvas.height,
      );
      for (let pixel = 0; pixel < cutout.data.length; pixel += 4) {
        const r = cutout.data[pixel]!;
        const g = cutout.data[pixel + 1]!;
        const b = cutout.data[pixel + 2]!;
        const spread = Math.max(r, g, b) - Math.min(r, g, b);
        const brightness = (r + g + b) / 3;
        if (spread < 18 && brightness > 213) cutout.data[pixel + 3] = 0;
      }
      cutoutContext.putImageData(cutout, 0, 0);
    }
    const maxWidth = 850;
    const maxHeight = 610;
    const scale = Math.min(
      maxWidth / fruitImage.naturalWidth,
      maxHeight / fruitImage.naturalHeight,
    );
    const fruitWidth = fruitImage.naturalWidth * scale;
    const fruitHeight = fruitImage.naturalHeight * scale;
    context.drawImage(
      cutoutContext ? cutoutCanvas : fruitImage,
      centerX - fruitWidth / 2,
      422,
      fruitWidth,
      fruitHeight,
    );
  }

  for (let index = 0; index < 20; index += 1) {
    const angle = (index / 20) * Math.PI * 2;
    drawDrop(
      centerX + Math.cos(angle) * mix(330, 475, bubbleNoise(index, 225.1)),
      712 + Math.sin(angle) * mix(245, 330, bubbleNoise(index, 226.4)),
      mix(8, 22, bubbleNoise(index, 227.7)),
      angle + Math.PI / 2,
      index % 5 === 0 ? turquoiseDark : coral,
    );
  }

  context.fillStyle = berry;
  context.font = '400 104px "Anton", "Arial Narrow", sans-serif';
  context.letterSpacing = "5px";
  context.fillText("STRAWBERRY", centerX, 1096);
  context.fillText("SPARK", centerX, 1200);
  context.letterSpacing = "0px";
  context.fillStyle = black;
  context.font = '800 27px "Inter", sans-serif';
  context.letterSpacing = "5px";
  context.fillText("SPARKLING STRAWBERRY WATER", centerX, 1270);
  context.letterSpacing = "0px";

  const drawCenterMark = (
    x: number,
    type: "leaf" | "drop" | "bubbles",
    label: string,
  ) => {
    context.strokeStyle = navy;
    context.lineWidth = 4;
    context.beginPath();
    context.arc(x, 1362, 34, 0, Math.PI * 2);
    context.stroke();
    context.save();
    context.translate(x, 1362);
    if (type === "leaf") {
      context.beginPath();
      context.ellipse(0, -1, 12, 20, Math.PI / 4, 0, Math.PI * 2);
      context.moveTo(-11, 13);
      context.lineTo(11, -13);
      context.stroke();
    } else if (type === "drop") {
      context.beginPath();
      context.moveTo(0, -21);
      context.bezierCurveTo(18, 2, 15, 22, 0, 22);
      context.bezierCurveTo(-15, 22, -18, 2, 0, -21);
      context.stroke();
    } else {
      [[-9, 6, 8], [9, 7, 10], [4, -11, 6]].forEach(([cx, cy, radius]) => {
        context.beginPath();
        context.arc(cx!, cy!, radius!, 0, Math.PI * 2);
        context.stroke();
      });
    }
    context.restore();
    context.fillStyle = navy;
    context.font = '800 18px "Inter", sans-serif';
    context.fillText(label, x, 1427);
  };
  drawCenterMark(centerX - 218, "leaf", "REAL FRUIT");
  drawCenterMark(centerX, "drop", "NO ADDED SUGAR");
  drawCenterMark(centerX + 218, "bubbles", "BIG BUBBLES");
  context.font = '800 29px "Inter", sans-serif';
  context.fillText("355 mL  ·  12 FL OZ", centerX, 1512);

  // RIGHT COLUMN — story, four benefits, and complete scan block.
  const rightX = 1780;
  const rightWidth = 500;
  context.fillStyle = turquoiseDark;
  context.textAlign = "center";
  context.font = '400 41px "Rubik Dirt", sans-serif';
  context.fillText("STRAWBERRY SPARKLE", rightX + rightWidth / 2, 122);
  context.fillText("IN EVERY SIP", rightX + rightWidth / 2, 176);
  context.fillStyle = coral;
  context.fillRect(rightX + 34, 221, rightWidth - 68, 7);
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillStyle = navy;
  context.font = '700 21px "Inter", sans-serif';
  let storyY = drawWrappedText(
    "Buble is made for real fruit lovers. Bright strawberry essence meets sparkling water for a naturally refreshing drink that is crisp, clean, and made for everyday moments.",
    rightX + 34,
    281,
    rightWidth - 68,
    31,
  );

  const benefits = [
    ["bolt", "NATURAL ENERGY", "A bright lift from real fruit"],
    ["drop", "HYDRATION", "Sparkling water that refreshes"],
    ["leaf", "CLEAN INGREDIENTS", "Nothing artificial, no added sugar"],
    ["berry", "FRUIT FORWARD", "Ripe strawberry in every sip"],
  ] as const;

  const drawBenefit = (x: number, y: number, kind: string) => {
    context.save();
    context.translate(x, y);
    context.strokeStyle = turquoiseDark;
    context.lineWidth = 5;
    context.beginPath();
    context.arc(0, 0, 38, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    if (kind === "bolt") {
      context.moveTo(5, -25);
      context.lineTo(-13, 2);
      context.lineTo(-1, 2);
      context.lineTo(-7, 25);
      context.lineTo(17, -7);
      context.lineTo(4, -7);
      context.closePath();
    } else if (kind === "drop") {
      context.moveTo(0, -25);
      context.bezierCurveTo(20, 1, 17, 25, 0, 25);
      context.bezierCurveTo(-17, 25, -20, 1, 0, -25);
    } else if (kind === "leaf") {
      context.ellipse(0, 0, 14, 24, Math.PI / 4, 0, Math.PI * 2);
      context.moveTo(-13, 16);
      context.lineTo(13, -16);
    } else {
      context.moveTo(0, -24);
      context.bezierCurveTo(22, -14, 20, 18, 0, 25);
      context.bezierCurveTo(-20, 18, -22, -14, 0, -24);
      [-9, 0, 9].forEach((seedX) => {
        context.moveTo(seedX, -5);
        context.arc(seedX, 6, 2.5, 0, Math.PI * 2);
      });
    }
    context.stroke();
    context.restore();
  };

  storyY += 24;
  benefits.forEach(([kind, title, body]) => {
    drawBenefit(rightX + 73, storyY + 30, kind);
    context.fillStyle = turquoiseDark;
    context.font = '900 24px "Inter", sans-serif';
    context.fillText(title, rightX + 137, storyY + 14);
    context.fillStyle = navy;
    context.font = '650 19px "Inter", sans-serif';
    drawWrappedText(body, rightX + 137, storyY + 45, rightWidth - 170, 25);
    storyY += 132;
  });

  const qrSize = 168;
  const qrX = rightX + 45;
  const qrY = 1262;
  context.fillStyle = white;
  context.fillRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28);
  context.strokeStyle = turquoiseDark;
  context.lineWidth = 5;
  context.beginPath();
  context.roundRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28, 20);
  context.stroke();
  const cell = qrSize / 21;
  for (let row = 0; row < 21; row += 1) {
    for (let column = 0; column < 21; column += 1) {
      const finder =
        (column < 7 && row < 7) ||
        (column > 13 && row < 7) ||
        (column < 7 && row > 13);
      const ring =
        finder &&
        (column % 14 === 0 ||
          column % 14 === 6 ||
          row % 14 === 0 ||
          row % 14 === 6);
      const core =
        finder &&
        column % 14 > 1 &&
        column % 14 < 5 &&
        row % 14 > 1 &&
        row % 14 < 5;
      if (ring || core || (!finder && bubbleNoise(row * 21 + column, 230.6) > 0.53)) {
        context.fillStyle = navy;
        context.fillRect(qrX + column * cell, qrY + row * cell, cell + 0.5, cell + 0.5);
      }
    }
  }
  context.fillStyle = turquoiseDark;
  context.textAlign = "left";
  context.font = '400 39px "Rubik Dirt", sans-serif';
  context.fillText("SCAN ME", qrX + qrSize + 42, qrY + 64);
  context.fillStyle = navy;
  context.font = '700 18px "Inter", sans-serif';
  drawWrappedText(
    "Discover more about Buble Strawberry Spark",
    qrX + qrSize + 42,
    qrY + 104,
    rightWidth - qrSize - 74,
    25,
  );

  // Fine condensation is printed across the complete wrap so no panel reads
  // like an unfinished white placeholder when the can turns.
  for (let index = 0; index < 120; index += 1) {
    const x = bubbleNoise(index, 234.9) * width;
    const y = bubbleNoise(index, 235.8) * height;
    const radius = mix(2, 10, bubbleNoise(index, 236.7));
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = "rgba(255,255,255,.18)";
    context.fill();
    context.strokeStyle = "rgba(14,43,119,.12)";
    context.lineWidth = 1.4;
    context.stroke();
  }

  return canvas;
}

function setGroupOpacity(group: THREE.Group, opacity: number) {
  group.visible = opacity > 0.005;
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((material) => {
      const baseOpacity =
        (material.userData.baseOpacity as number | undefined) ?? 1;
      const baseDepthWrite =
        (material.userData.baseDepthWrite as boolean | undefined) ?? true;
      material.transparent = opacity < 0.999 || baseOpacity < 0.999;
      material.opacity = opacity * baseOpacity;
      material.depthWrite = baseDepthWrite && opacity > 0.35;
    });
  });
}

export function BigBubbleCanScene({ storyRef }: BigBubbleCanSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGlFallback, setHasWebGlFallback] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      setHasWebGlFallback(true);
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.14;
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const productStage = new THREE.Group();
    scene.add(productStage);

    const hemisphereLight = new THREE.HemisphereLight(
      0xfff4d0,
      0x263747,
      1.9,
    );
    scene.add(hemisphereLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d4, 3.8);
    keyLight.position.set(-4, 5, 7);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xe2f7ff, 2.2);
    rimLight.position.set(5, 1, 3);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xffd9e7, 0.9);
    fillLight.position.set(-4, -3, 4);
    scene.add(fillLight);

    let primaryCan: THREE.Group | null = null;
    let sceneDisposed = false;

    const labelTexture = new THREE.TextureLoader().load(
      strawberryLabelUrl,
      (texture) => {
        if (sceneDisposed) return;
        const source = texture.image;
        if (!(source instanceof HTMLImageElement)) return;
        mount.dataset.labelMapping = "native-short-can-no-distortion";
        mount.dataset.labelComposition = "source-asset-only";
        mount.dataset.labelTextureSize = `${source.naturalWidth}x${source.naturalHeight}`;
      },
    );
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    labelTexture.wrapS = THREE.RepeatWrapping;
    labelTexture.repeat.set(1, 1);
    labelTexture.offset.x = 0.5;
    labelTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    primaryCan = createCan(labelTexture);
    productStage.add(primaryCan);
    const referenceCompanionCans = [createCan(labelTexture), createCan(labelTexture)];
    referenceCompanionCans.forEach((can) => {
      can.visible = false;
      productStage.add(can);
    });
    const primaryTabPivot = primaryCan.getObjectByName(
      "pullTabPivot",
    ) as THREE.Group | undefined;
    const primaryOpeningSeal = primaryCan.getObjectByName(
      "openingSeal",
    ) as THREE.Mesh | undefined;

    const strawberryTravelers: StrawberryTraveler[] = [];
    mount.dataset.strawberryModel = "loading-photoreal-gltf";

    new GLTFLoader().load(
      strawberryModelUrl,
      (gltf) => {
        const strawberryPrototype = preparePhotorealStrawberry(gltf.scene);
        if (sceneDisposed) {
          disposeThreeGroup(strawberryPrototype);
          return;
        }

        productStage.add(strawberryPrototype);
        const travelerStarts = [0.015, 0.1, 0.22, 0.34, 0.48, 0.61, 0.74];
        const travelerLanes = [-2.65, 2.7, -3.25, 3.2, -2.3, 2.35, 3.5];
        travelerStarts.forEach((startAnchor, index) => {
          const start = clamp(
            startAnchor + mix(-0.032, 0.032, bubbleNoise(index, 41.2)),
            0,
            0.82,
          );
          const end = clamp(
            start + mix(0.29, 0.48, bubbleNoise(index, 42.6)),
            start + 0.24,
            1,
          );
          const group = clonePhotorealStrawberry(strawberryPrototype, index);
          productStage.add(group);
          strawberryTravelers.push({
            group,
            start,
            end,
            laneX: travelerLanes[index]!,
            startY: mix(-4.55, -4.05, bubbleNoise(index, 44.9)),
            endY: mix(4.05, 4.55, bubbleNoise(index, 48.1)),
            depth: mix(-0.62, -0.28, bubbleNoise(index, 50.6)),
            scale: mix(0.21, 0.34, bubbleNoise(index, 51.9)),
            phase: bubbleNoise(index, 58.6) * Math.PI * 2,
            rotationTurns: new THREE.Vector3(
              mix(0.68, 1.5, bubbleNoise(index, 59.4)),
              mix(1.12, 2.5, bubbleNoise(index, 60.7)),
              mix(0.52, 1.36, bubbleNoise(index, 61.3)),
            ),
          });
        });

        mount.dataset.strawberryModel = "photoreal-pbr-gltf";
        mount.dataset.strawberryModelInstances = String(
          strawberryTravelers.length,
        );
      },
      undefined,
      () => {
        if (!sceneDisposed) mount.dataset.strawberryModel = "load-error";
      },
    );

    const bubbleGeometry = new THREE.SphereGeometry(1, 32, 24);
    const bubbleActors: BubbleActor[] = Array.from({ length: 32 }, (_, index) => {
      const material = createBubbleMaterial(index * 0.137);
      const mesh = new THREE.Mesh(bubbleGeometry, material);
      mesh.renderOrder = 6;
      mesh.scale.setScalar(0.001);
      mesh.visible = false;
      productStage.add(mesh);
      return {
        mesh,
        material,
        active: false,
        age: 0,
        origin: new THREE.Vector3(),
        size: 0,
        rise: 0,
        driftX: 0,
        driftZ: 0,
        lifetime: 1,
        phase: 0,
        wobble: 0,
      };
    });
    const canBurstCount = 320;
    const canBurstMaterial = createBubbleMaterial(0.41);
    const canBurstMesh = new THREE.InstancedMesh(
      bubbleGeometry,
      canBurstMaterial,
      canBurstCount,
    );
    const canBurstDummy = new THREE.Object3D();
    const canBurstColor = new THREE.Color();
    const canBurstOrigin = new THREE.Vector3();
    const canBurstBubbles: CanBurstBubble[] = Array.from(
      { length: canBurstCount },
      (_, index) => {
        const y = mix(
          canY(-1.96),
          canY(2.045),
          bubbleNoise(index, 14.4),
        );
        const angle = bubbleNoise(index, 15.8) * Math.PI * 2;
        const taper =
          1 -
          Math.max(0, Math.abs(y) / CAN_HEIGHT_SCALE - 1.72) * 0.66;
        const radius =
          mix(0.05, 0.81, Math.sqrt(bubbleNoise(index, 16.9))) * taper;
        const radialForce = mix(0.85, 2.7, bubbleNoise(index, 18.2));
        const palettePick = bubbleNoise(index, 25.4);

        if (palettePick < 0.34) canBurstColor.set(0xffd54f);
        else if (palettePick < 0.68) canBurstColor.set(0xff5f82);
        else canBurstColor.set(0x59d7df);
        canBurstMesh.setColorAt(index, canBurstColor);

        return {
          start: new THREE.Vector3(
            Math.cos(angle) * radius,
            y,
            Math.sin(angle) * radius * 0.72,
          ),
          direction: new THREE.Vector3(
            Math.cos(angle) * radialForce,
            mix(-0.24, 2.72, bubbleNoise(index, 19.6)),
            Math.sin(angle) * radialForce * 0.58,
          ),
          size: mix(0.075, 0.165, bubbleNoise(index, 20.8)),
          delay: mix(0, 0.14, bubbleNoise(index, 22.1)),
          phase: bubbleNoise(index, 23.7) * Math.PI * 2,
        };
      },
    );
    canBurstMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    canBurstMesh.instanceColor!.needsUpdate = true;
    canBurstMesh.frustumCulled = false;
    canBurstMesh.renderOrder = 7;
    canBurstMesh.visible = false;
    productStage.add(canBurstMesh);
    const bubbleOpening = new THREE.Vector3(0, canY(2.14), 0.2);
    const liveBubbleOpening = new THREE.Vector3();
    let bubbleSpawnSerial = 0;
    let bubbleEmitterWasActive = false;
    let nextBubbleSpawnAt = 0;
    let previousFrameTime = performance.now() * 0.001;

    const spawnBubble = (now: number, scaleBoost = 1) => {
      const actor =
        bubbleActors.find((candidate) => !candidate.active) ??
        bubbleActors.reduce((oldest, candidate) =>
          candidate.age / candidate.lifetime > oldest.age / oldest.lifetime
            ? candidate
            : oldest,
        );
      const serial = bubbleSpawnSerial;
      bubbleSpawnSerial += 1;

      actor.active = true;
      actor.age = 0;
      actor.origin.set(
        mix(-0.025, 0.025, bubbleNoise(serial, 0.7)),
        0,
        mix(-0.018, 0.018, bubbleNoise(serial, 1.3)),
      );
      actor.size = mix(0.075, 0.2, bubbleNoise(serial, 2.1)) * scaleBoost;
      actor.rise = mix(1.1, 1.9, bubbleNoise(serial, 3.2));
      actor.driftX = mix(-0.58, 0.58, bubbleNoise(serial, 4.4));
      actor.driftZ = mix(-0.12, 0.12, bubbleNoise(serial, 5.8));
      actor.lifetime = mix(0.82, 1.46, bubbleNoise(serial, 6.9));
      actor.phase = bubbleNoise(serial, 8.1) * Math.PI * 2;
      actor.wobble = mix(0.025, 0.1, bubbleNoise(serial, 9.7));
      actor.mesh.position.copy(actor.origin);
      actor.mesh.scale.setScalar(0.001);
      actor.mesh.visible = true;
      actor.material.uniforms.uFilmPhase!.value = bubbleNoise(serial, 10.9);
      actor.material.uniforms.uOpacity!.value = 0;
      actor.material.uniforms.uTime!.value = now;
    };

    let viewportAspect = 1;
    let viewportWidth = 1;
    let viewportHeight = 1;
    const resize = () => {
      const width = mount.clientWidth || window.innerWidth;
      const height = mount.clientHeight || window.innerHeight;
      viewportWidth = width;
      viewportHeight = height;
      viewportAspect = width / Math.max(height, 1);
      camera.aspect = viewportAspect;
      camera.position.z = viewportAspect < 0.82 ? 11.75 : 10.7;
      camera.position.y = viewportAspect < 0.82 ? 0.08 : 0.28;
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let frameId = 0;

    const render = () => {
      if (!primaryCan) return;
      const now = performance.now() * 0.001;
      const deltaTime = Math.min(Math.max(now - previousFrameTime, 0), 0.05);
      previousFrameTime = now;
      const story = storyRef.current;
      const bounds = story?.getBoundingClientRect();
      const scrollDistance = bounds
        ? Math.max(bounds.height - window.innerHeight, 1)
        : 1;
      const progress = reducedMotion.matches
        ? 0
        : clamp(bounds ? -bounds.top / scrollDistance : 0);

      const hero = story?.querySelector<HTMLElement>(".bb3-hero");
      const fruitIsAbsorbed = hero?.dataset.fruitAbsorbed === "true";
      const heroStage = hero?.querySelector<HTMLElement>(".bb3-hero-stage");
      const fruitEntryDistance =
        (heroStage?.offsetHeight ?? window.innerHeight) *
        FRUIT_ENTRY_SCROLL_VIEWPORTS;
      const heroStageHeight = heroStage?.offsetHeight ?? window.innerHeight;
      const canTravelStartDistance = hero
        ? Math.max(
            hero.offsetHeight - (heroStage?.offsetHeight ?? window.innerHeight),
            fruitEntryDistance,
          )
        : 0;
      const storyScroll = Math.max(bounds ? -bounds.top : 0, 0);
      const release = story?.querySelector<HTMLElement>(".bb3-release");
      const canBurstStage = story?.querySelector<HTMLElement>(
        ".bb3-can-burst-stage",
      );
      const canBurstStart = canBurstStage
        ? canBurstStage.offsetTop
        : Number.POSITIVE_INFINITY;
      const chargeSequence = story?.querySelector<HTMLElement>(
        ".bb3-charge-sequence",
      );
      const referenceMotion = story?.querySelector<HTMLElement>(
        ".bb3-reference-motion",
      );
      const availability = story?.querySelector<HTMLElement>(
        ".bb3-availability",
      );
      const finale = story?.querySelector<HTMLElement>(".bb3-finale");
      const chargeTravelDistance = chargeSequence
        ? Math.max(chargeSequence.offsetHeight - window.innerHeight, 1)
        : 1;
      const chargeSequenceStart = chargeSequence && bounds
        ? chargeSequence.getBoundingClientRect().top - bounds.top
        : Number.POSITIVE_INFINITY;
      const chargeTravelEnd = chargeSequence
        ? chargeSequenceStart + chargeTravelDistance * 0.96
        : Number.POSITIVE_INFINITY;
      const referenceMotionDistance = referenceMotion
        ? Math.max(referenceMotion.offsetHeight - window.innerHeight, 1)
        : 1;
      const referenceMotionStart = referenceMotion
        ? referenceMotion.offsetTop
        : Number.POSITIVE_INFINITY;
      const referenceMotionEnd = referenceMotion
        ? referenceMotionStart + referenceMotionDistance
        : Number.POSITIVE_INFINITY;
      const canReformStart = referenceMotionStart;
      const canReformEnd = referenceMotion
        ? referenceMotionStart +
          referenceMotionDistance * CAN_REFORM_SCROLL_FRACTION
        : Number.POSITIVE_INFINITY;
      const canReformProgress = reducedMotion.matches
        ? 1
        : smooth(canReformStart, canReformEnd, storyScroll);
      const canReformActive = Boolean(
        referenceMotion &&
          storyScroll >= canReformStart &&
          storyScroll <= canReformEnd,
      );
      const releaseArrivalDistance = release
        ? Math.max(
            canTravelStartDistance,
            release.offsetTop - window.innerHeight * 0.5,
          )
        : canTravelStartDistance;
      const canSettleDistance = Math.max(releaseArrivalDistance, 1);
      const bubbleDistance = Math.max(
        canSettleDistance - fruitEntryDistance,
        1,
      );
      const topRevealProgress = reducedMotion.matches
        ? 0
        : smooth(
            fruitEntryDistance,
            fruitEntryDistance + heroStageHeight * 0.1,
            storyScroll,
          );
      const tabLiftStartDistance =
        fruitEntryDistance + heroStageHeight * 0.045;
      const tabLiftEndDistance = Math.max(
        tabLiftStartDistance + heroStageHeight * 0.12,
        canTravelStartDistance - heroStageHeight * 0.02,
      );
      const tabLiftProgress = reducedMotion.matches
        ? 0
        : smooth(tabLiftStartDistance, tabLiftEndDistance, storyScroll);
      const bubbleStartDistance = mix(
        tabLiftStartDistance,
        tabLiftEndDistance,
        0.7,
      );
      const bubbleProgress = fruitIsAbsorbed
        ? clamp((storyScroll - fruitEntryDistance) / bubbleDistance)
        : 0;
      const bubbleEmitterIsActive =
        !reducedMotion.matches &&
        fruitIsAbsorbed &&
        storyScroll >= bubbleStartDistance &&
        storyScroll < canBurstStart;
      const intro = fruitIsAbsorbed
        ? smooth(canTravelStartDistance, canSettleDistance, storyScroll)
        : 0;
      const canPhase = !fruitIsAbsorbed
        ? "fruit-entry"
        : tabLiftProgress < 0.96
          ? "opening"
        : storyScroll < canTravelStartDistance
          ? "bubbling"
          : chargeSequence &&
            storyScroll >= chargeSequenceStart &&
                storyScroll < chargeTravelEnd
              ? "charge-traveling-bubbling"
            : canReformActive
              ? "reforming"
            : referenceMotion &&
                  storyScroll >= referenceMotionStart &&
                  storyScroll <= referenceMotionEnd + 1
              ? "reference-motion"
            : bubbleEmitterIsActive
              ? "traveling-bubbling"
            : "settled";
      if (mount.dataset.canPhase !== canPhase) {
        mount.dataset.canPhase = canPhase;
      }
      mount.dataset.bubbleProgress = bubbleProgress.toFixed(3);
      mount.dataset.bubbleEmitterActive = String(bubbleEmitterIsActive);
      mount.dataset.pullTabBubbleMode = "can-anchored-continuous";
      mount.dataset.canTopRevealProgress = topRevealProgress.toFixed(3);
      mount.dataset.canOpenProgress = tabLiftProgress.toFixed(3);
      const chargeTravel = chargeSequence
        ? smooth(
            chargeSequenceStart,
            chargeTravelEnd,
            storyScroll,
          )
        : 0;
      const sequenceTravel = chargeSequence
        ? clamp(
            (storyScroll - chargeSequenceStart) /
              Math.max(chargeTravelEnd - chargeSequenceStart, 1),
          )
        : 0;
      const sequenceHold = smooth(0, 0.04, sequenceTravel);
      const sequencePose = sampleCanSequencePose(sequenceTravel);
      const referenceActive = Boolean(
        referenceMotion &&
          storyScroll >= referenceMotionStart &&
          storyScroll <= referenceMotionEnd + 1,
      );
      const referenceTimelineProgress = referenceActive
        ? reducedMotion.matches
          ? 1
          : clamp(
              (storyScroll - referenceMotionStart) /
                Math.max(referenceMotionDistance, 1),
            )
        : 0;
      const referenceTravel = referenceActive
        ? reducedMotion.matches
          ? 1
          : smooth(CAN_REFORM_SCROLL_FRACTION, 1, referenceTimelineProgress)
        : 0;
      const referencePose = sampleReferenceMotionPose(referenceTravel);
      const referenceStrength = referenceActive
        ? reducedMotion.matches
          ? 1
          : smooth(0, 0.12, referenceTravel)
        : 0;
      const referenceDepthStrength = referenceActive
        ? reducedMotion.matches
          ? 1
          : smooth(0, 0.16, referenceTimelineProgress)
        : 0;
      const canLabelPanel =
        sequenceTravel < 0.2
          ? "front"
          : sequenceTravel < 0.44
            ? "nutrition"
            : sequenceTravel < 0.6
              ? "benefits"
              : sequenceTravel < 0.86
                ? "nutrition"
                : sequenceTravel < 0.98
                  ? "benefits"
                  : "front";
      if (mount.dataset.canLabelPanel !== canLabelPanel) {
        mount.dataset.canLabelPanel = canLabelPanel;
      }
      const canBurstEnd = canBurstStage
        ? canBurstStart +
          Math.max(canBurstStage.offsetHeight - window.innerHeight, 1)
        : Number.POSITIVE_INFINITY;
      const canBurstProgress = reducedMotion.matches
        ? 0
        : smooth(canBurstStart, canBurstEnd, storyScroll);
      const lineupStart = availability
        ? availability.offsetTop - window.innerHeight * 0.48
        : Number.POSITIVE_INFINITY;
      const lineupEnd = availability
        ? availability.offsetTop + availability.offsetHeight * 0.16
        : Number.POSITIVE_INFINITY;
      const finaleStart = finale
        ? finale.offsetTop - window.innerHeight * 0.5
        : Number.POSITIVE_INFINITY;
      const finaleEnd = finale
        ? finale.offsetTop + finale.offsetHeight * 0.28
        : Number.POSITIVE_INFINITY;
      const lineup = availability
        ? smooth(lineupStart, lineupEnd, storyScroll)
        : 0;
      const outro = finale ? smooth(finaleStart, finaleEnd, storyScroll) : 0;
      const mobile = viewportAspect < 0.82;
      const compositionScale = mobile
        ? 1
        : Math.min(viewportWidth / 1440, viewportHeight / 900);
      const compositionFactor = mobile
        ? 1
        : compositionScale / Math.max(viewportHeight / 900, 0.001);
      const lineupScale = mobile ? 0.47 : 0.3;
      const sequenceScale = sequencePose.scale * (mobile ? 0.78 : 1);
      const sequenceX =
        sequencePose.x * (mobile ? 0.48 : compositionFactor);
      const sequenceY =
        sequencePose.y * (mobile ? 1 : compositionFactor) +
        (mobile && sequenceTravel < 0.12 ? 0.26 : 0);
      const referenceScale = referencePose.scale * (mobile ? 0.78 : 1);
      const referenceX = referencePose.x * (mobile ? 0.42 : 1);
      const referenceY = referencePose.y + (mobile ? 0.2 : 0);
      const referenceLineup = referenceActive
        ? smooth(0.64, 0.86, referenceTravel)
        : 0;

      referenceCompanionCans.forEach((can, index) => {
        const side = index === 0 ? -1 : 1;
        can.visible = referenceActive && referenceTravel > 0.6;
        can.position.set(
          side * (mobile ? 0.68 : 1.03),
          mix(-4.5, mobile ? -2.16 : -2.34, referenceLineup),
          -0.52,
        );
        can.scale.setScalar((mobile ? 0.702 : 0.936) * referenceLineup);
        can.rotation.set(0, 0, 0);
      });

      let visibleStrawberryTravelers = 0;
      const travelerMotionEnabled =
        !reducedMotion.matches && Boolean(chargeSequence);
      strawberryTravelers.forEach((traveler, index) => {
        const rawProgress =
          (sequenceTravel - traveler.start) /
          Math.max(traveler.end - traveler.start, 0.001);
        const mobileActorEnabled = !mobile || index < 4;
        const isActive =
          !referenceActive &&
          travelerMotionEnabled &&
          mobileActorEnabled &&
          rawProgress > 0 &&
          rawProgress < 1;
        traveler.group.visible = isActive;
        if (!isActive) return;

        const localProgress = clamp(rawProgress);
        const mobileLaneX =
          Math.sign(traveler.laneX) *
          Math.max(Math.abs(traveler.laneX) * 0.56, 1.5);

        traveler.group.position.set(
          mobile ? mobileLaneX : traveler.laneX * compositionFactor,
          mix(traveler.startY, traveler.endY, localProgress) *
            (mobile ? 1 : compositionFactor),
          traveler.depth,
        );
        traveler.group.rotation.set(
          traveler.phase * 0.17 +
            localProgress * Math.PI * 2 * traveler.rotationTurns.x,
          traveler.phase * 0.31 +
            localProgress * Math.PI * 2 * traveler.rotationTurns.y,
          traveler.phase * 0.11 +
            localProgress * Math.PI * 2 * traveler.rotationTurns.z,
        );
        traveler.group.scale.setScalar(
          traveler.scale * (mobile ? 0.76 : compositionFactor),
        );
        visibleStrawberryTravelers += 1;
      });
      mount.dataset.strawberryTravelProgress = sequenceTravel.toFixed(3);
      mount.dataset.strawberryTravelers = String(
        visibleStrawberryTravelers,
      );
      mount.dataset.strawberryTravelMode = "straight-vertical-rotation";
      mount.dataset.compositionScale = compositionScale.toFixed(4);
      mount.dataset.compositionFactor = compositionFactor.toFixed(4);

      productStage.scale.setScalar(1);

      let scale =
        mix(mobile ? 0.581 : 0.82, mobile ? 0.77 : 0.84, intro) * 1.38;
      scale = mix(scale, sequenceScale, sequenceHold);
      scale = mix(scale, lineupScale, lineup);
      scale = mix(scale, mobile ? 0.59 : 0.62, outro);
      scale = mix(scale, referenceScale, referenceStrength);

      let x = 0;
      x = mix(x, sequenceX, sequenceHold);
      x = mix(x, 0, lineup);
      x = mix(x, mobile ? 0 : 1.78, outro);
      x = mix(x, referenceX, referenceStrength);

      let y = mix(mobile ? -0.52 : -0.08, mobile ? -0.66 : -0.46, intro);
      y = mix(y, mobile ? -0.78 : -0.86, chargeTravel);
      y = mix(y, sequenceY, sequenceHold);
      y = mix(y, -0.62, lineup);
      y = mix(y, 0.03, outro);
      y = mix(y, referenceY, referenceStrength);

      primaryCan.scale.setScalar(scale);
      mount.dataset.canRenderScale = scale.toFixed(4);
      primaryCan.position.set(x, y, 0);
      const openingTiltRelease =
        1 -
        smooth(
          canTravelStartDistance,
          canTravelStartDistance + heroStageHeight * 0.22,
          storyScroll,
        );
      primaryCan.rotation.x = 0.24 * topRevealProgress * openingTiltRelease;
      primaryCan.rotation.x = mix(
        primaryCan.rotation.x,
        sequencePose.rotationX,
        sequenceHold,
      );
      primaryCan.rotation.z = mix(-0.14, 0, intro);
      primaryCan.rotation.z = mix(
        primaryCan.rotation.z,
        0,
        chargeTravel,
      );
      primaryCan.rotation.z = mix(
        primaryCan.rotation.z,
        sequencePose.rotationZ,
        sequenceHold,
      );
      primaryCan.rotation.z = mix(primaryCan.rotation.z, 0.16, outro);
      primaryCan.rotation.z = mix(
        primaryCan.rotation.z,
        referencePose.rotationZ,
        referenceStrength,
      );
      const tabSnap = Math.sin(tabLiftProgress * Math.PI);
      primaryCan.position.y += tabSnap * 0.035 * openingTiltRelease;
      primaryCan.rotation.z += tabSnap * 0.018 * openingTiltRelease;
      primaryCan.rotation.y =
        mix(-0.12, 0.12, intro) + Math.sin(progress * 8) * 0.045 * intro;
      primaryCan.rotation.y = mix(primaryCan.rotation.y, 0, chargeTravel);
      primaryCan.rotation.y = mix(
        primaryCan.rotation.y,
        sequencePose.rotationY,
        sequenceHold,
      );
      primaryCan.rotation.y = mix(primaryCan.rotation.y, 0, lineup);
      primaryCan.rotation.y = mix(primaryCan.rotation.y, 0.24, outro);
      if (referenceActive) {
        primaryCan.rotation.y = Math.atan2(
          Math.sin(primaryCan.rotation.y),
          Math.cos(primaryCan.rotation.y),
        );
      }
      primaryCan.rotation.x = mix(
        primaryCan.rotation.x,
        referencePose.rotationX,
        referenceDepthStrength,
      );
      primaryCan.rotation.y = mix(
        primaryCan.rotation.y,
        referencePose.rotationY,
        referenceDepthStrength,
      );

      // Preserve the glossy package finish while restoring enough light falloff
      // for the cylindrical silhouette to read in the final composition.
      hemisphereLight.intensity = mix(1.9, 1.24, referenceDepthStrength);
      keyLight.intensity = mix(3.8, 4.35, referenceDepthStrength);
      rimLight.intensity = mix(2.2, 2.55, referenceDepthStrength);
      fillLight.intensity = mix(0.9, 0.38, referenceDepthStrength);

      if (primaryTabPivot) {
        primaryTabPivot.position.y = canY(2.126 + tabSnap * 0.012);
        primaryTabPivot.rotation.x =
          -tabLiftProgress * 0.82 - tabSnap * 0.08;
      }
      if (primaryOpeningSeal) {
        primaryOpeningSeal.position.y = canY(
          2.124 - tabLiftProgress * 0.06,
        );
        primaryOpeningSeal.position.z = 0.22 + tabLiftProgress * 0.045;
        primaryOpeningSeal.rotation.x =
          -Math.PI / 2 + tabLiftProgress * 0.78;
        const sealScale = 1 - tabLiftProgress * 0.08;
        primaryOpeningSeal.scale.set(
          0.66 * sealScale,
          1.08 * sealScale,
          1,
        );
      }

      const canFade = smooth(0.24, 0.62, canBurstProgress);
      const canReformOpacity = smooth(0.55, 0.9, canReformProgress);
      const canOpacity = canReformActive
        ? canReformOpacity
        : referenceActive
          ? 1
          : Math.max(mix(1 - canFade, 1, lineup), canReformOpacity);
      setGroupOpacity(primaryCan, canOpacity);
      mount.dataset.canBurstProgress = canBurstProgress.toFixed(3);
      mount.dataset.canReformProgress = canReformProgress.toFixed(3);
      mount.dataset.canBubbleDirection = canReformActive ? "in" : "out";
      mount.dataset.canRotationY = primaryCan.rotation.y.toFixed(3);
      mount.dataset.canRotationZ = primaryCan.rotation.z.toFixed(3);
      mount.dataset.canPositionX = primaryCan.position.x.toFixed(3);
      mount.dataset.canPositionY = primaryCan.position.y.toFixed(3);
      mount.dataset.referenceMotionProgress = referenceTravel.toFixed(3);
      mount.dataset.canMotionProfile = referenceActive
        ? "more-nutrition-sticky-final-composition"
        : "alternating-depth-orbit";

      primaryCan.updateMatrixWorld(true);
      liveBubbleOpening.copy(bubbleOpening);
      primaryCan.localToWorld(liveBubbleOpening);
      productStage.worldToLocal(liveBubbleOpening);
      const canBubbleTimelineProgress = canReformActive
        ? 1 - canReformProgress
        : canBurstProgress;
      const canBubbleVisibility = canReformActive ? 1 : 1 - lineup;
      canBurstMesh.visible =
        canReformActive || (canBurstProgress > 0.01 && lineup < 0.96);
      canBurstMaterial.uniforms.uOpacity!.value =
        smooth(0.01, 0.18, canBubbleTimelineProgress) *
        canBubbleVisibility *
        0.98;
      canBurstMaterial.uniforms.uTime!.value = now;

      canBurstBubbles.forEach((bubble, index) => {
        const burstBubbleProgress = clamp(
          (canBubbleTimelineProgress - bubble.delay) /
            Math.max(1 - bubble.delay, 0.001),
        );
        const form = smooth(0, 0.28, burstBubbleProgress);
        const launch = smooth(0.34, 0.82, burstBubbleProgress);
        const pop = smooth(0.78, 1, burstBubbleProgress);
        const visibility = form * (1 - pop) * canBubbleVisibility;

        canBurstOrigin.copy(bubble.start);
        primaryCan.localToWorld(canBurstOrigin);
        productStage.worldToLocal(canBurstOrigin);
        const travel = Math.pow(launch, 1.18);
        const flutter =
          Math.sin(burstBubbleProgress * 14 + bubble.phase) * 0.11 * launch;

        canBurstDummy.position.set(
          canBurstOrigin.x + bubble.direction.x * travel + flutter,
          canBurstOrigin.y + bubble.direction.y * travel,
          canBurstOrigin.z + bubble.direction.z * travel,
        );
        canBurstDummy.scale.setScalar(
          Math.max(
            0.0001,
            bubble.size * visibility * (0.56 + form * 0.72 + pop * 0.5),
          ),
        );
        canBurstDummy.rotation.set(
          bubble.phase * 0.08,
          bubble.phase * 0.12,
          bubble.phase * 0.05,
        );
        canBurstDummy.updateMatrix();
        canBurstMesh.setMatrixAt(index, canBurstDummy.matrix);
      });
      canBurstMesh.instanceMatrix.needsUpdate = true;

      if (bubbleEmitterIsActive) {
        if (!bubbleEmitterWasActive) {
          for (let burstIndex = 0; burstIndex < 3; burstIndex += 1) {
            spawnBubble(now, 1.35);
          }
          nextBubbleSpawnAt = now + 0.28;
        }
        let emittedThisFrame = 0;
        while (now >= nextBubbleSpawnAt && emittedThisFrame < 2) {
          spawnBubble(now);
          emittedThisFrame += 1;
          nextBubbleSpawnAt += mix(
            0.32,
            0.46,
            bubbleNoise(bubbleSpawnSerial, 13.6),
          );
        }
      } else if (bubbleEmitterWasActive) {
        nextBubbleSpawnAt = now;
      }
      bubbleEmitterWasActive = bubbleEmitterIsActive;

      let activePullTabBubbles = 0;
      bubbleActors.forEach((actor) => {
        if (!actor.active) return;
        actor.age += deltaTime;
        const localProgress = clamp(actor.age / actor.lifetime);
        const appear = smooth(0, 0.09, localProgress);
        const pop = smooth(0.8, 1, localProgress);
        const opacity = appear * (1 - pop);
        const wobble =
          Math.sin(actor.age * 8.4 + actor.phase) *
          actor.wobble *
          (0.25 + localProgress * 0.75);
        const swell = 0.16 + appear * 0.84 + pop * 0.58;

        actor.mesh.visible = opacity > 0.004;
        if (actor.mesh.visible) activePullTabBubbles += 1;
        actor.material.uniforms.uOpacity!.value = opacity;
        actor.material.uniforms.uTime!.value = now;
        actor.mesh.position.set(
          liveBubbleOpening.x +
            actor.origin.x +
            actor.driftX * actor.age +
            wobble,
          liveBubbleOpening.y + actor.rise * actor.age,
          liveBubbleOpening.z +
            actor.origin.z +
            actor.driftZ * actor.age +
            Math.cos(actor.age * 6.2 + actor.phase) * actor.wobble * 0.35,
        );
        actor.mesh.scale.setScalar(actor.size * swell);

        if (localProgress >= 1) {
          actor.active = false;
          actor.mesh.visible = false;
          actor.material.uniforms.uOpacity!.value = 0;
        }
      });
      mount.dataset.pullTabBubbles = String(activePullTabBubbles);

      productStage.rotation.x = 0;
      mount.dataset.cameraProfile = referenceActive
        ? "perspective-reference"
        : "perspective-story";
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };

    frameId = window.requestAnimationFrame(render);

    return () => {
      sceneDisposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      disposeThreeGroup(productStage);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [storyRef]);

  return (
    <div className="bb3-can-render" ref={mountRef}>
      {hasWebGlFallback ? (
        <div
          aria-hidden="true"
          className="bb3-can-fallback bb3-can-fallback-blank"
          style={{ backgroundImage: `url(${strawberryLabelUrl})` }}
        />
      ) : null}
    </div>
  );
}

export default BigBubbleCanScene;
