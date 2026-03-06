import { useRef, useEffect } from "react";

const CORNER_N = 120;
const SHAPES = ["</>", "AI", "{ }", "=>"];
const SPREAD = 80; // px scatter radius
const MORPH_RADIUS = 200; // px from corner center to trigger morph

function sampleShape(text, count) {
  const c = document.createElement("canvas");
  const w = 200, h = 100;
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 48px 'Courier New', monospace";
  ctx.fillText(text, w / 2, h / 2);
  const data = ctx.getImageData(0, 0, w, h).data;
  const pts = [];
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (data[(y * w + x) * 4] > 128) {
        pts.push({ x: x - w / 2, y: y - h / 2 });
      }
    }
  }
  // Shuffle
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }
  const result = [];
  for (let i = 0; i < count; i++) {
    const p = pts[i % pts.length];
    result.push({
      sx: p.x + (Math.random() - 0.5) * 3,
      sy: p.y + (Math.random() - 0.5) * 3,
    });
  }
  return result;
}

export default function CornerParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const mouse = { x: -9999, y: -9999 };
    const onMouse = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("mousemove", onMouse);

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", onResize);

    // Corner centers in screen space
    const margin = 100;
    const getCorners = () => [
      { x: margin, y: margin },
      { x: w - margin, y: margin },
      { x: margin, y: h - margin },
      { x: w - margin, y: h - margin },
    ];

    // Pre-sample shapes
    const shapes = SHAPES.map((s) => sampleShape(s, CORNER_N));

    // Particle state per corner
    const clusters = shapes.map(() => {
      const particles = [];
      for (let i = 0; i < CORNER_N; i++) {
        particles.push({
          x: (Math.random() - 0.5) * SPREAD,
          y: (Math.random() - 0.5) * SPREAD * 0.6,
          vx: 0, vy: 0,
          size: Math.random() * 2 + 0.8,
          alpha: Math.random() * 0.3 + 0.1,
          phase: Math.random() * Math.PI * 2,
          speed: 0.2 + Math.random() * 0.4,
        });
      }
      return { particles, morph: 0 };
    });

    let animId;
    let time = 0;

    function animate() {
      animId = requestAnimationFrame(animate);
      time += 0.016;
      ctx.clearRect(0, 0, w, h);

      const corners = getCorners();

      corners.forEach((corner, ci) => {
        const cluster = clusters[ci];
        const shape = shapes[ci];

        // Mouse distance to corner
        const dx = mouse.x - corner.x;
        const dy = mouse.y - corner.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Morph factor
        const targetMorph = dist < MORPH_RADIUS ? 1 - dist / MORPH_RADIUS : 0;
        cluster.morph += (targetMorph - cluster.morph) * 0.04;

        cluster.particles.forEach((p, i) => {
          const s = shape[i];
          // Target: scattered or shape
          const scattered_x = (Math.sin(time * 0.15 * p.speed + p.phase) * SPREAD * 0.4);
          const scattered_y = (Math.cos(time * 0.12 * p.speed + p.phase * 1.3) * SPREAD * 0.3);

          const tx = scattered_x * (1 - cluster.morph) + s.sx * cluster.morph;
          const ty = scattered_y * (1 - cluster.morph) + s.sy * cluster.morph;

          // Spring toward target
          p.vx += (tx - p.x) * 0.06;
          p.vy += (ty - p.y) * 0.06;
          p.vx *= 0.85;
          p.vy *= 0.85;
          p.x += p.vx;
          p.y += p.vy;

          // Draw
          const screenX = corner.x + p.x;
          const screenY = corner.y + p.y;
          const alpha = p.alpha * (0.3 + cluster.morph * 0.7);

          ctx.beginPath();
          ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
          // Color: purple when scattered, cyan when morphed
          const r = Math.round(120 - cluster.morph * 80);
          const g = Math.round(80 + cluster.morph * 120);
          const b = Math.round(200 - cluster.morph * 60);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.fill();
        });
      });
    }

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        pointerEvents: "none",
      }}
    />
  );
}
