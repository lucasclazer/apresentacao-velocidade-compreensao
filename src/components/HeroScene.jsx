import { useEffect, useRef } from "react";
import * as THREE from "three";

const N = 4000;
const MORPH_TEXTS = ["CAIXA PRETA", "VELOCIDADE", "COMPREENSÃO", "IA"];
const MORPH_INTERVAL = 4500;
const MORPH_HOLD = 2000;

const COLOR_HERO_A = new THREE.Vector3(0.22, 0.35, 1.0);
const COLOR_HERO_B = new THREE.Vector3(0.45, 0.58, 1.0);
const COLOR_MAP_A = new THREE.Vector3(0.0, 0.6, 0.45);
const COLOR_MAP_B = new THREE.Vector3(0.0, 0.9, 0.63);

const VERT = `
  attribute float aSize;
  attribute float aAlpha;
  varying float vAlpha;
  varying float vDist;
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uScale;
  void main() {
    vAlpha = aAlpha;
    vec3 p = position;
    p.x += uMouse.x * 18.0 * 0.06;
    p.y += uMouse.y * 12.0 * 0.06;
    float w = sin(p.x * 0.04 + uTime * 0.5) * 0.8 + cos(p.y * 0.05 + uTime * 0.4) * 0.5;
    p += normalize(p) * w;
    vDist = length(p.xy - uMouse.xy * 20.0);
    vec4 mv = modelViewMatrix * vec4(p * uScale, 1.0);
    gl_Position = projectionMatrix * mv;
    float boost = 1.0 + smoothstep(30.0, 0.0, vDist) * 1.8;
    gl_PointSize = aSize * boost * (180.0 / -mv.z);
  }
`;

const FRAG = `
  varying float vAlpha;
  varying float vDist;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float a = vAlpha * (1.0 - smoothstep(0.1, 0.5, d));
    float b = smoothstep(40.0, 0.0, vDist) * 0.3;
    vec3 col = mix(uColorA, uColorB, b);
    gl_FragColor = vec4(col, a);
  }
`;

function sampleTextPositions(text, count) {
  const canvas = document.createElement("canvas");
  const w = 512, h = 512;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = text.length > 10 ? 52 : 72;
  ctx.font = `bold ${fontSize}px 'Helvetica Neue', Arial, sans-serif`;
  ctx.fillText(text, w / 2, h / 2);

  const imageData = ctx.getImageData(0, 0, w, h).data;
  const points = [];
  const scale = 0.16;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const idx = (y * w + x) * 4;
      if (imageData[idx] > 128) {
        points.push([(x - w / 2) * scale, -(y - h / 2) * scale]);
      }
    }
  }

  const result = new Float32Array(count * 3);
  if (points.length === 0) return result;

  for (let i = points.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [points[i], points[j]] = [points[j], points[i]];
  }

  for (let i = 0; i < count; i++) {
    const p = points[i % points.length];
    const i3 = i * 3;
    result[i3] = p[0] + (Math.random() - 0.5) * 1.2;
    result[i3 + 1] = p[1] + (Math.random() - 0.5) * 1.2;
    result[i3 + 2] = (Math.random() - 0.5) * 6;
  }
  return result;
}

export default function HeroScene({ phaseRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    cam.position.z = 120;

    const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    const onMouse = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouse);

    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    const orig = new Float32Array(N * 3);
    const sz = new Float32Array(N);
    const al = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / N);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const R = 48 + Math.random() * 24;
      const x = Math.sin(phi) * Math.cos(theta) * R;
      const y = Math.sin(phi) * Math.sin(theta) * R;
      const z = Math.cos(phi) * R;
      pos[i * 3] = orig[i * 3] = x;
      pos[i * 3 + 1] = orig[i * 3 + 1] = y;
      pos[i * 3 + 2] = orig[i * 3 + 2] = z;
      vel[i * 3] = (Math.random() - 0.5) * 0.015;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.015;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
      sz[i] = Math.random() * 3.5 + 0.8;
      al[i] = Math.random() * 0.55 + 0.2;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(al, 1));

    const pmat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector3() },
        uScale: { value: 1 },
        uColorA: { value: COLOR_HERO_A.clone() },
        uColorB: { value: COLOR_HERO_B.clone() },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const pts = new THREE.Points(geo, pmat);
    scene.add(pts);

    const sphereOrig = new Float32Array(orig);
    const textFormations = MORPH_TEXTS.map((t) => sampleTextPositions(t, N));

    let morphTarget = orig;
    let morphIdx = -1;
    let morphPhase = "sphere";
    let morphClock = 0;
    let sphereScale = 1;
    let colorMix = 0;

    let animT = 0;
    const camTarget = new THREE.Vector3();
    const mSmooth = new THREE.Vector3();
    const currentColorA = COLOR_HERO_A.clone();
    const currentColorB = COLOR_HERO_B.clone();

    let animId;
    function animate() {
      animId = requestAnimationFrame(animate);

      const phase = phaseRef.current;

      // Throttle to ~30fps when on map (sphere barely visible)
      if (phase === "map" && animT % 2 < 1) {
        animT += 0.008;
        return;
      }

      animT += 0.008;
      const dt = 16;

      mouse.sx += (mouse.x - mouse.sx) * 0.06;
      mouse.sy += (mouse.y - mouse.sy) * 0.06;
      mSmooth.set(mouse.sx * 55, mouse.sy * 35, 0);

      pmat.uniforms.uTime.value = animT;
      pmat.uniforms.uMouse.value.copy(mSmooth.clone().multiplyScalar(1 / 40));

      const notHero = phase === "title" || phase === "map";

      if (!notHero) {
        morphClock += dt;
        if (morphPhase === "sphere" && morphClock > MORPH_INTERVAL) {
          morphIdx = (morphIdx + 1) % textFormations.length;
          morphTarget = textFormations[morphIdx];
          morphPhase = "toText";
          morphClock = 0;
        } else if (morphPhase === "toText" && morphClock > 2200) {
          morphPhase = "holdText";
          morphClock = 0;
        } else if (morphPhase === "holdText" && morphClock > MORPH_HOLD) {
          morphTarget = sphereOrig;
          morphPhase = "toSphere";
          morphClock = 0;
        } else if (morphPhase === "toSphere" && morphClock > 2200) {
          morphPhase = "sphere";
          morphClock = 0;
        }
      } else {
        morphTarget = sphereOrig;
        morphPhase = "sphere";
        morphClock = 0;
      }

      const lerpSpeed = (morphPhase === "toText") ? 0.025
        : (morphPhase === "holdText") ? 0.04
        : (morphPhase === "toSphere") ? 0.015
        : 0.004;
      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        pos[i3] += vel[i3];
        pos[i3 + 1] += vel[i3 + 1];
        pos[i3 + 2] += vel[i3 + 2];
        pos[i3] += (morphTarget[i3] - pos[i3]) * lerpSpeed;
        pos[i3 + 1] += (morphTarget[i3 + 1] - pos[i3 + 1]) * lerpSpeed;
        pos[i3 + 2] += (morphTarget[i3 + 2] - pos[i3 + 2]) * lerpSpeed;
        vel[i3] *= 0.98;
        vel[i3 + 1] *= 0.98;
        vel[i3 + 2] *= 0.98;
      }
      geo.attributes.position.needsUpdate = true;

      const targetScale = phase === "map" ? 0.3 : phase === "title" ? 0.5 : 1;
      sphereScale += (targetScale - sphereScale) * 0.04;
      pmat.uniforms.uScale.value = sphereScale;

      const targetMix = phase === "map" ? 1 : phase === "title" ? 0.5 : 0;
      colorMix += (targetMix - colorMix) * 0.03;
      currentColorA.lerpVectors(COLOR_HERO_A, COLOR_MAP_A, colorMix);
      currentColorB.lerpVectors(COLOR_HERO_B, COLOR_MAP_B, colorMix);
      pmat.uniforms.uColorA.value.copy(currentColorA);
      pmat.uniforms.uColorB.value.copy(currentColorB);

      const targetPosY = phase === "title" ? -25 : 0;
      pts.position.y += (targetPosY - pts.position.y) * 0.04;

      const isText = morphPhase === "toText" || morphPhase === "holdText";
      const rotMul = isText ? 0.05 : 1.0;
      const targetRotY = animT * 0.06 * rotMul + mouse.sx * 0.3 * rotMul;
      const targetRotX = mouse.sy * 0.2 * rotMul;
      pts.rotation.y += (targetRotY - pts.rotation.y) * 0.03;
      pts.rotation.x += (targetRotX - pts.rotation.x) * 0.03;
      camTarget.set(mouse.sx * 4, mouse.sy * 3, 120);
      cam.position.lerp(camTarget, 0.025);
      cam.lookAt(0, 0, 0);

      renderer.render(scene, cam);
    }
    animate();

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      cam.aspect = window.innerWidth / window.innerHeight;
      cam.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
    };
  }, [phaseRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 0 }}
    />
  );
}
