import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 800;

function Particles() {
  const mesh = useRef();

  const { positions, velocities, origins, sizes, speeds, phases } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    const origins = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const speeds = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      let x, y;

      // 70% in corners/edges, 30% scattered
      if (Math.random() < 0.7) {
        // Pick a corner or edge
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
          case 0: // top
            x = (Math.random() - 0.5) * 44;
            y = 10 + Math.random() * 6;
            break;
          case 1: // bottom
            x = (Math.random() - 0.5) * 44;
            y = -10 - Math.random() * 6;
            break;
          case 2: // left
            x = -18 - Math.random() * 6;
            y = (Math.random() - 0.5) * 28;
            break;
          case 3: // right
            x = 18 + Math.random() * 6;
            y = (Math.random() - 0.5) * 28;
            break;
        }
      } else {
        x = (Math.random() - 0.5) * 44;
        y = (Math.random() - 0.5) * 28;
      }

      const z = (Math.random() - 0.5) * 8;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      origins[i3] = x;
      origins[i3 + 1] = y;
      origins[i3 + 2] = z;
      velocities[i3] = 0;
      velocities[i3 + 1] = 0;
      velocities[i3 + 2] = 0;
      sizes[i] = Math.random() * 2.5 + 0.4;
      speeds[i] = 0.1 + Math.random() * 0.3;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, velocities, origins, sizes, speeds, phases };
  }, []);

  const colorArray = useMemo(() => {
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const t = Math.random();
      if (t < 0.4) {
        // Deep purple
        colors[i3] = 0.25 + Math.random() * 0.12;
        colors[i3 + 1] = 0.08 + Math.random() * 0.08;
        colors[i3 + 2] = 0.55 + Math.random() * 0.2;
      } else if (t < 0.7) {
        // Medium purple / violet
        colors[i3] = 0.4 + Math.random() * 0.1;
        colors[i3 + 1] = 0.15 + Math.random() * 0.1;
        colors[i3 + 2] = 0.7 + Math.random() * 0.15;
      } else if (t < 0.85) {
        // Cyan / turquoise
        colors[i3] = 0.0 + Math.random() * 0.08;
        colors[i3 + 1] = 0.7 + Math.random() * 0.15;
        colors[i3 + 2] = 0.55 + Math.random() * 0.2;
      } else {
        // Lavender
        colors[i3] = 0.5 + Math.random() * 0.1;
        colors[i3 + 1] = 0.35 + Math.random() * 0.1;
        colors[i3 + 2] = 0.85 + Math.random() * 0.1;
      }
    }
    return colors;
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;
    const posAttr = mesh.current.geometry.attributes.position;
    const pos = posAttr.array;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const px = pos[i3];
      const py = pos[i3 + 1];

      // Very gentle drift — almost static
      const sp = speeds[i];
      const ph = phases[i];
      const driftX = Math.sin(time * 0.03 * sp + ph) * 0.0004;
      const driftY = Math.cos(time * 0.025 * sp + ph * 1.3) * 0.0004;
      velocities[i3] += driftX;
      velocities[i3 + 1] += driftY;

      // Gentle spring back
      velocities[i3] += (origins[i3] - px) * 0.0008;
      velocities[i3 + 1] += (origins[i3 + 1] - py) * 0.0008;

      // Heavy damping
      velocities[i3] *= 0.96;
      velocities[i3 + 1] *= 0.96;

      pos[i3] += velocities[i3];
      pos[i3 + 1] += velocities[i3 + 1];
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={COUNT} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={COUNT} array={colorArray} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={COUNT} array={sizes} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
        uniforms={{
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        }}
        vertexShader={`
          attribute float size;
          varying vec3 vColor;
          uniform float uPixelRatio;

          void main() {
            vColor = color;
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPos;
            gl_PointSize = size * uPixelRatio * (80.0 / -mvPos.z);
          }
        `}
        fragmentShader={`
          varying vec3 vColor;

          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = smoothstep(0.5, 0.05, d) * 0.35;
            gl_FragColor = vec4(vColor, alpha);
          }
        `}
      />
    </points>
  );
}

export default function ParticleBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background: "radial-gradient(ellipse at 50% 50%, #0d0520 0%, #050210 50%, #000000 100%)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        dpr={[1, 2]}
        style={{ background: "transparent" }}
      >
        <Particles />
      </Canvas>
    </div>
  );
}
