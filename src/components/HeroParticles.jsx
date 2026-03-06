import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const N = 4000;

// Simplified curl noise on CPU (inspired by hyper-mix curl4.glsl)
function noise3d(x, y, z) {
  const n = Math.sin(x * 1.1 + y * 2.3 + z * 0.7) * 43758.5453;
  return n - Math.floor(n);
}

function curlNoise(x, y, z, t) {
  const eps = 0.01;
  // Approximate curl via finite differences of a noise potential field
  const n1 = noise3d(x, y + eps, z + t) - noise3d(x, y - eps, z + t);
  const n2 = noise3d(x, y, z + eps + t) - noise3d(x, y, z - eps + t);
  const n3 = noise3d(x + eps, y, z + t) - noise3d(x - eps, y, z + t);
  const n4 = noise3d(x, y + eps, z + t * 1.1) - noise3d(x, y - eps, z + t * 1.1);
  const n5 = noise3d(x + eps, y, z + t * 0.9) - noise3d(x - eps, y, z + t * 0.9);
  const n6 = noise3d(x, y, z + eps + t * 1.2) - noise3d(x, y, z - eps + t * 1.2);

  return [
    (n2 - n4) / (2 * eps),
    (n5 - n6) / (2 * eps),
    (n3 - n1) / (2 * eps),
  ];
}

function FibSphere({ scrollProgress = 0 }) {
  const pointsRef = useRef();
  const { viewport } = useThree();
  const mouse = useRef({ x: 0, y: 0, sx: 0, sy: 0 });

  const { positions, origins, velocities, sizes, alphas } = useMemo(() => {
    const positions = new Float32Array(N * 3);
    const origins = new Float32Array(N * 3);
    const velocities = new Float32Array(N * 3);
    const sizes = new Float32Array(N);
    const alphas = new Float32Array(N);

    // Fibonacci sphere
    for (let i = 0; i < N; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / N);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const R = 38 + Math.random() * 18;
      const x = Math.sin(phi) * Math.cos(theta) * R;
      const y = Math.sin(phi) * Math.sin(theta) * R;
      const z = Math.cos(phi) * R;

      positions[i * 3] = origins[i * 3] = x;
      positions[i * 3 + 1] = origins[i * 3 + 1] = y;
      positions[i * 3 + 2] = origins[i * 3 + 2] = z;
      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
      sizes[i] = Math.random() * 2.0 + 0.5;
      alphas[i] = Math.random() * 0.5 + 0.2;
    }
    return { positions, origins, velocities, sizes, alphas };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.elapsedTime * 0.008;
    const geo = pointsRef.current.geometry;
    const posArr = geo.attributes.position.array;

    // Smooth mouse
    mouse.current.sx += (mouse.current.x - mouse.current.sx) * 0.04;
    mouse.current.sy += (mouse.current.y - mouse.current.sy) * 0.04;

    const curlScale = 0.006;
    const curlStrength = 0.35;
    const springBack = 0.004;
    const damping = 0.97;

    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      const px = posArr[i3];
      const py = posArr[i3 + 1];
      const pz = posArr[i3 + 2];

      // Curl noise force
      const [cx, cy, cz] = curlNoise(
        px * curlScale,
        py * curlScale,
        pz * curlScale,
        t
      );
      velocities[i3] += cx * curlStrength;
      velocities[i3 + 1] += cy * curlStrength;
      velocities[i3 + 2] += cz * curlStrength;

      // Spring back to sphere origin
      velocities[i3] += (origins[i3] - px) * springBack;
      velocities[i3 + 1] += (origins[i3 + 1] - py) * springBack;
      velocities[i3 + 2] += (origins[i3 + 2] - pz) * springBack;

      // Damping
      velocities[i3] *= damping;
      velocities[i3 + 1] *= damping;
      velocities[i3 + 2] *= damping;

      // Apply
      posArr[i3] += velocities[i3];
      posArr[i3 + 1] += velocities[i3 + 1];
      posArr[i3 + 2] += velocities[i3 + 2];
    }

    geo.attributes.position.needsUpdate = true;

    // Rotate sphere slowly + mouse influence
    pointsRef.current.rotation.y = t * 7.5 + mouse.current.sx * 0.3;
    pointsRef.current.rotation.x = mouse.current.sy * 0.2;
  });

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector3() },
        },
        vertexShader: `
          attribute float aSize;
          attribute float aAlpha;
          varying float vAlpha;
          varying float vDist;
          uniform float uTime;
          uniform vec3 uMouse;

          void main() {
            vAlpha = aAlpha;
            vec3 p = position;

            // Mouse pull
            float pull = 0.05;
            p.x += uMouse.x * 18.0 * pull;
            p.y += uMouse.y * 12.0 * pull;

            // Breathing
            float wave = sin(p.x * 0.04 + uTime * 0.5) * 0.8
                       + cos(p.y * 0.05 + uTime * 0.4) * 0.5;
            p += normalize(p) * wave;

            vDist = length(p.xy - uMouse.xy * 20.0);

            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;

            float boost = 1.0 + smoothstep(30.0, 0.0, vDist) * 1.5;
            gl_PointSize = aSize * boost * (180.0 / -mv.z);
          }
        `,
        fragmentShader: `
          varying float vAlpha;
          varying float vDist;

          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            if (d > 0.5) discard;
            float a = vAlpha * (1.0 - smoothstep(0.05, 0.5, d));

            float brightBoost = smoothstep(40.0, 0.0, vDist) * 0.4;

            // Evoluum colors: purple to cyan
            vec3 purple = vec3(0.45, 0.15, 0.85);
            vec3 cyan = vec3(0.0, 0.9, 0.63);
            vec3 col = mix(purple, cyan, brightBoost);

            gl_FragColor = vec4(col, a);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  // Update uniforms each frame
  useFrame((state) => {
    if (!material.uniforms) return;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uMouse.value.set(
      mouse.current.sx * 55,
      mouse.current.sy * 35,
      0
    ).multiplyScalar(1 / 40);
  });

  return (
    <points ref={pointsRef} material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={N} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={N} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aAlpha" count={N} array={alphas} itemSize={1} />
      </bufferGeometry>
    </points>
  );
}

function CameraController() {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const target = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const handler = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  useFrame(() => {
    mouse.current.sx += (mouse.current.x - mouse.current.sx) * 0.025;
    mouse.current.sy += (mouse.current.y - mouse.current.sy) * 0.025;
    target.set(mouse.current.sx * 4, mouse.current.sy * 3, 120);
    camera.position.lerp(target, 0.02);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function HeroParticles() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background: "radial-gradient(ellipse at 60% 50%, #0d0520 0%, #050210 40%, #000000 100%)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 120], fov: 55 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <FibSphere />
        <CameraController />
      </Canvas>
    </div>
  );
}
