import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import MapaRisco from "./components/MapaRisco";
import CornerParticles from "./components/CornerParticles";

const N = 4000;

const MORPH_TEXTS = ["CAIXA PRETA", "VELOCIDADE", "COMPREENSAO", "IA"];
const MORPH_INTERVAL = 4500;
const MORPH_HOLD = 2000;

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
  // Scale: 512px canvas → ~80 world units (fits nicely in sphere diameter)
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

const TYPED_LINES = [
  "dev senior + ia  >  amplificação;",
  "vibe coder       >  caixa preta;",
  "processo + ia    >  escala real;",
  "sem processo     >  caos invisível;",
  "ia além do code  >  automação total;",
  "move fast        >  dívida cognitiva;",
];

const COLOR_HERO_A = new THREE.Vector3(0.22, 0.35, 1.0);
const COLOR_HERO_B = new THREE.Vector3(0.45, 0.58, 1.0);
const COLOR_MAP_A = new THREE.Vector3(0.0, 0.6, 0.45);
const COLOR_MAP_B = new THREE.Vector3(0.0, 0.9, 0.63);

export default function App() {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    phase: "hero", // "hero" | "title" | "map"
    sphereScale: 1,
    colorMix: 0,
  });
  // phase: hero → title → map
  const [phase, setPhase] = useState("hero");
  const [heroVisible, setHeroVisible] = useState(true);
  const [titleVisible, setTitleVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [mounted, setMounted] = useState(false);

  // Typed text effect
  useEffect(() => {
    let lineIdx = 0, charIdx = 0, deleting = false, timeout;
    function tick() {
      const line = TYPED_LINES[lineIdx];
      if (!deleting) {
        charIdx++;
        setTypedText(line.slice(0, charIdx));
        if (charIdx === line.length) { deleting = true; timeout = setTimeout(tick, 2200); return; }
        timeout = setTimeout(tick, 52);
      } else {
        charIdx--;
        setTypedText(line.slice(0, charIdx));
        if (charIdx === 0) { deleting = false; lineIdx = (lineIdx + 1) % TYPED_LINES.length; timeout = setTimeout(tick, 350); return; }
        timeout = setTimeout(tick, 26);
      }
    }
    timeout = setTimeout(tick, 1600);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

  // Three.js setup
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
      vertexShader: `
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
      `,
      fragmentShader: `
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
      `,
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

    let animT = 0;
    const camTarget = new THREE.Vector3();
    const mSmooth = new THREE.Vector3();
    const currentColorA = COLOR_HERO_A.clone();
    const currentColorB = COLOR_HERO_B.clone();

    let animId;
    function animate() {
      animId = requestAnimationFrame(animate);
      animT += 0.008;
      const dt = 16;

      mouse.sx += (mouse.x - mouse.sx) * 0.06;
      mouse.sy += (mouse.y - mouse.sy) * 0.06;
      mSmooth.set(mouse.sx * 55, mouse.sy * 35, 0);

      pmat.uniforms.uTime.value = animT;
      pmat.uniforms.uMouse.value.copy(mSmooth.clone().multiplyScalar(1 / 40));

      const st = stateRef.current;
      const notHero = st.phase === "title" || st.phase === "map";

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

      // Scale: hero=1, title=0.5, map=0.3
      const targetScale = st.phase === "map" ? 0.3 : st.phase === "title" ? 0.5 : 1;
      st.sphereScale += (targetScale - st.sphereScale) * 0.04;
      pmat.uniforms.uScale.value = st.sphereScale;

      // Color: hero=0, title=0.5, map=1
      const targetMix = st.phase === "map" ? 1 : st.phase === "title" ? 0.5 : 0;
      st.colorMix += (targetMix - st.colorMix) * 0.03;
      currentColorA.lerpVectors(COLOR_HERO_A, COLOR_MAP_A, st.colorMix);
      currentColorB.lerpVectors(COLOR_HERO_B, COLOR_MAP_B, st.colorMix);
      pmat.uniforms.uColorA.value.copy(currentColorA);
      pmat.uniforms.uColorB.value.copy(currentColorB);

      // Move sphere down on title phase, center on hero, small on map
      const targetPosY = st.phase === "title" ? -25 : st.phase === "map" ? 0 : 0;
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
  }, []);

  // Hero → Title
  const goToTitle = useCallback(() => {
    stateRef.current.phase = "title";
    setHeroVisible(false);
    setTimeout(() => {
      setPhase("title");
      setTitleVisible(true);
    }, 700);
  }, []);

  // Title → Map
  const goToMap = useCallback(() => {
    stateRef.current.phase = "map";
    setTitleVisible(false);
    setTimeout(() => {
      setPhase("map");
      setMapVisible(true);
    }, 600);
  }, []);

  // Map → Title
  const backToTitle = useCallback(() => {
    stateRef.current.phase = "title";
    setMapVisible(false);
    setTimeout(() => {
      setPhase("title");
      setTitleVisible(true);
    }, 600);
  }, []);

  // Title → Hero
  const backToHero = useCallback(() => {
    stateRef.current.phase = "hero";
    setTitleVisible(false);
    setTimeout(() => {
      setPhase("hero");
      setHeroVisible(true);
    }, 700);
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#000" }}>
      <style>{`
        @keyframes heroUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeScale {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.92); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .hero-btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 400; color: #fff; letter-spacing: 0.3px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(0,229,160,0.25);
          padding: 13px 28px; border-radius: 100px; cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 0; animation: heroUp 0.7s 1.2s forwards;
          font-family: 'Helvetica Neue', Helvetica, sans-serif;
        }
        .hero-btn:hover {
          background: rgba(0,229,160,0.12);
          border-color: rgba(0,229,160,0.5);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,229,160,0.1);
        }
        .title-btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 400; color: rgba(255,255,255,0.6); letter-spacing: 1px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(0,229,160,0.2);
          padding: 13px 32px; border-radius: 100px; cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'Helvetica Neue', Helvetica, sans-serif;
        }
        .title-btn:hover {
          background: rgba(0,229,160,0.1);
          border-color: rgba(0,229,160,0.4);
          color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,229,160,0.08);
        }
        .nav-btn {
          position: fixed; top: 22px; left: 24px; z-index: 40;
          font-size: 11px; letter-spacing: 2px; color: rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          padding: 8px 18px; border-radius: 100px; cursor: pointer;
          display: flex; align-items: center; gap: 6px;
          transition: all 0.3s ease; font-family: monospace;
        }
        .nav-btn:hover { color: #00e5a0; border-color: rgba(0,229,160,0.3); }
      `}</style>

      {/* Corner particles — visible on title and map */}
      {(phase === "title" || phase === "map") && <CornerParticles />}

      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: "fixed", inset: 0, zIndex: 0 }}
      />

      {/* ===== PHASE 1: HERO ===== */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          padding: "0 7%",
          pointerEvents: heroVisible ? "auto" : "none",
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? "translateY(0) scale(1)" : "translateY(-40px) scale(0.97)",
          transition: "opacity 0.9s cubic-bezier(.4,0,.2,1), transform 1.1s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <div style={{ maxWidth: "480px" }}>
          <div
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
              fontSize: "32px",
              letterSpacing: "6px",
              textTransform: "uppercase",
              color: "rgba(100,140,255,0.5)",
              marginBottom: "24px",
              fontWeight: 300,
              opacity: 0,
              animation: mounted ? "heroUp 0.7s 0.4s forwards" : "none",
            }}
          >
            Mapa de risco cognitivo · IA
          </div>

          <h1
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
              fontSize: "clamp(24px, 3vw, 44px)",
              fontWeight: 300,
              color: "#fff",
              lineHeight: 1.28,
              letterSpacing: "-0.3px",
              marginBottom: "16px",
              opacity: 0,
              animation: mounted ? "heroUp 0.7s 0.6s forwards" : "none",
            }}
          >
            O codigo cresce
            <br />
            mais rapido que a
            <br />
            <em style={{ fontStyle: "normal", color: "rgba(130,165,255,0.9)" }}>
              capacidade de absorver
            </em>
          </h1>

          <p
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
              fontSize: "clamp(12px, 1.2vw, 14px)",
              fontWeight: 300,
              color: "rgba(255,255,255,0.32)",
              lineHeight: 1.8,
              marginBottom: "32px",
              opacity: 0,
              animation: mounted ? "heroUp 0.7s 0.8s forwards" : "none",
            }}
          >
            Quando a automacao avanca sem estrutura,
            <br />
            o sistema vira caixa preta — e a equipe
            <br />
            perde o controle do que esta construindo.
          </p>

          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "12px",
              color: "rgba(130,170,255,0.7)",
              letterSpacing: "1.5px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              minHeight: "20px",
              marginBottom: "34px",
              opacity: 0,
              animation: mounted ? "heroUp 0.7s 1s forwards" : "none",
            }}
          >
            <span>{typedText}</span>
            <span
              style={{
                display: "inline-block",
                width: "1.5px",
                height: "13px",
                background: "rgba(130,170,255,0.8)",
                animation: "blink 1s step-end infinite",
              }}
            />
          </div>

          <button className="hero-btn" onClick={goToTitle}>
            Ver o Mapa
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7l5 5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ===== PHASE 2: TITLE ===== */}
      {phase === "title" && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 25,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingTop: "12vh",
              pointerEvents: titleVisible ? "auto" : "none",
              opacity: titleVisible ? 1 : 0,
              transition: "opacity 0.8s cubic-bezier(.4,0,.2,1)",
            }}
          >
            <div
              style={{
                textAlign: "center",
                transform: titleVisible ? "translateY(0)" : "translateY(30px)",
                transition: "transform 1s cubic-bezier(.16,1,.3,1)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "6px",
                  color: "rgba(167,139,250,0.75)",
                  textTransform: "uppercase",
                  marginBottom: "20px",
                  fontFamily: "monospace",
                }}
              >
                MAPA DE RISCO COGNITIVO
              </div>
              <h1
                style={{
                  fontSize: "clamp(32px, 5vw, 64px)",
                  fontWeight: 100,
                  color: "rgba(255,255,255,0.95)",
                  margin: "0 0 16px",
                  letterSpacing: "4px",
                  fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
                }}
              >
                Velocidade{" "}
                <span style={{ color: "#00e5a0", fontWeight: 300 }}>vs</span>{" "}
                Compreensão
              </h1>
              <p
                style={{
                  fontSize: "15px",
                  color: "rgba(255,255,255,0.65)",
                  marginBottom: "48px",
                  fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
                  fontWeight: 300,
                  letterSpacing: "0.5px",
                }}
              >
                O negocio e o codigo crescem mais rapido que a capacidade de absorver
              </p>
              <button className="title-btn" onClick={goToMap}>
                Explorar o Mapa
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v10M2 7l5 5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <button
            className="nav-btn"
            onClick={backToHero}
            style={{
              opacity: titleVisible ? 1 : 0,
              pointerEvents: titleVisible ? "auto" : "none",
              transition: "opacity 0.4s 0.5s ease, color 0.3s, border-color 0.3s",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            VOLTAR
          </button>
        </>
      )}

      {/* ===== PHASE 3: MAP ===== */}
      {phase === "map" && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 25,
              background: mapVisible ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0)",
              transition: "background 0.8s ease",
              pointerEvents: mapVisible ? "auto" : "none",
            }}
          >
            <div
              style={{
                opacity: mapVisible ? 1 : 0,
                transform: mapVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.96)",
                transition: "opacity 0.6s 0.3s ease, transform 0.7s 0.3s cubic-bezier(.2,0,0,1)",
                height: "100%",
              }}
            >
              <MapaRisco />
            </div>
          </div>

          <button
            className="nav-btn"
            onClick={backToTitle}
            style={{
              opacity: mapVisible ? 1 : 0,
              pointerEvents: mapVisible ? "auto" : "none",
              transition: "opacity 0.4s 0.5s ease, color 0.3s, border-color 0.3s",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            VOLTAR
          </button>
        </>
      )}

      {/* Corner info */}
      <div
        style={{
          position: "fixed",
          bottom: "18px",
          left: "22px",
          fontFamily: "'Courier New', monospace",
          fontSize: "9px",
          letterSpacing: "2px",
          color: "rgba(255,255,255,0.06)",
          zIndex: 15,
          pointerEvents: "none",
        }}
      >
        VELOCIDADE VS COMPREENSAO · 2025
      </div>
      <div
        style={{
          position: "fixed",
          bottom: "18px",
          right: "22px",
          fontFamily: "'Courier New', monospace",
          fontSize: "9px",
          letterSpacing: "2px",
          color: "rgba(255,255,255,0.06)",
          textAlign: "right",
          zIndex: 15,
          pointerEvents: "none",
        }}
      >
        PARTICULAS · 4.000
      </div>
    </div>
  );
}
