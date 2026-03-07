import { useState, useEffect, useRef } from "react";
import { ENTITIES } from "../data/entities";
import { P } from "../palette";


function getTagConnections() {
  const groups = {};
  ENTITIES.forEach((e) => {
    if (!groups[e.tag]) groups[e.tag] = [];
    groups[e.tag].push(e);
  });
  const lines = [];
  Object.entries(groups).forEach(([tag, items]) => {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        lines.push({ a: items[i], b: items[j], tag });
      }
    }
  });
  return lines;
}

function TypedText({ text, speed = 18 }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      <span
        style={{
          display: "inline-block",
          width: "1px",
          height: "11px",
          background: "rgba(255,255,255,0.35)",
          marginLeft: "2px",
          verticalAlign: "middle",
          animation: displayed.length < text.length ? "none" : "blink 1s step-end infinite",
        }}
      />
    </span>
  );
}

export default function MapaRisco() {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [dragOffsets, setDragOffsets] = useState({});
  const [hoveredQuad, setHoveredQuad] = useState(null);
  const dragRef = useRef(null);
  const svgRef = useRef(null);
  const springRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 300);
  }, []);

  const W = 1600, H = 1050;
  const PAD = 80;

  const toX = (v) => PAD + ((v + 1) / 2) * (W - PAD * 2);
  const toY = (v) => PAD + ((-v + 1) / 2) * (H - PAD * 2);

  const midX = toX(0);
  const midY = toY(0);

  // Screen → SVG coords
  const screenToSvg = useRef((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (W / rect.width),
      y: (clientY - rect.top) * (H / rect.height),
    };
  });

  // Quadrant detection from SVG mouse position
  const detectQuad = (svgX, svgY) => {
    if (svgX < PAD || svgX > W - PAD || svgY < PAD || svgY > H - PAD) return null;
    if (svgX < midX && svgY < midY) return "tl";
    if (svgX >= midX && svgY < midY) return "tr";
    if (svgX < midX && svgY >= midY) return "bl";
    return "br";
  };

  const handleSvgMouseMove = (e) => {
    const pos = screenToSvg.current(e.clientX, e.clientY);
    setHoveredQuad(detectQuad(pos.x, pos.y));
  };

  const handleSvgMouseLeave = () => {
    setHoveredQuad(null);
  };

  // Max drag distance in SVG units
  const MAX_DRAG = 120;
  // How much neighbors are pulled (0-1)
  const NEIGHBOR_PULL = 0.4;
  // Influence radius in SVG units
  const INFLUENCE_RADIUS = 350;

  const handleDragStart = (e, entityId) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = screenToSvg.current(e.clientX, e.clientY);
    dragRef.current = {
      id: entityId,
      startMouse: pos,
      startOffsets: { ...dragOffsets },
    };
    if (springRef.current) {
      cancelAnimationFrame(springRef.current);
      springRef.current = null;
    }
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!dragRef.current) return;
      const pos = screenToSvg.current(e.clientX, e.clientY);
      const { id, startMouse, startOffsets } = dragRef.current;

      // Raw delta for dragged node
      let rawDx = pos.x - startMouse.x;
      let rawDy = pos.y - startMouse.y;

      // Clamp to max drag distance
      const dist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);
      if (dist > MAX_DRAG) {
        rawDx = (rawDx / dist) * MAX_DRAG;
        rawDy = (rawDy / dist) * MAX_DRAG;
      }

      // Build new offsets: dragged node + neighbors pulled
      const draggedEntity = ENTITIES.find((en) => en.id === id);
      const draggedCx = toX(draggedEntity.x);
      const draggedCy = toY(draggedEntity.y);

      const newOffsets = {};
      // Main node
      const prevMain = startOffsets[id] || { dx: 0, dy: 0 };
      newOffsets[id] = { dx: prevMain.dx + rawDx, dy: prevMain.dy + rawDy };

      // Pull neighbors
      ENTITIES.forEach((en) => {
        if (en.id === id) return;
        const enCx = toX(en.x);
        const enCy = toY(en.y);
        const dx = enCx - draggedCx;
        const dy = enCy - draggedCy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < INFLUENCE_RADIUS && d > 0) {
          const factor = NEIGHBOR_PULL * (1 - d / INFLUENCE_RADIUS);
          const prev = startOffsets[en.id] || { dx: 0, dy: 0 };
          newOffsets[en.id] = {
            dx: prev.dx + rawDx * factor,
            dy: prev.dy + rawDy * factor,
          };
        }
      });

      setDragOffsets((prev) => ({ ...prev, ...newOffsets }));
    };

    const handleUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;

      // Slow spring-back for ALL displaced nodes
      const spring = () => {
        setDragOffsets((prev) => {
          const keys = Object.keys(prev);
          if (keys.length === 0) return prev;

          let allDone = true;
          const next = {};
          for (const k of keys) {
            const cur = prev[k];
            const nx = cur.dx * 0.94;
            const ny = cur.dy * 0.94;
            if (Math.abs(nx) > 0.3 || Math.abs(ny) > 0.3) {
              next[k] = { dx: nx, dy: ny };
              allDone = false;
            }
          }

          if (allDone) {
            springRef.current = null;
            return {};
          }
          springRef.current = requestAnimationFrame(spring);
          return next;
        });
      };
      springRef.current = requestAnimationFrame(spring);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, []);

  const active = selected || hovered;
  const tagConnections = getTagConnections();
  const gridSteps = [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75];

  return (
    <div
      style={{
        position: "relative",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        padding: "12px 20px",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulseRing {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.04; }
          50% { opacity: 0.1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .map-node {
          cursor: pointer;
        }
        .map-node * {
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .panel-slide { animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* Full-size map container */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          maxWidth: `${W}px`,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "scale(1)" : "scale(0.96)",
          transition: "all 1s 0.1s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block", overflow: "visible" }}
          onMouseMove={handleSvgMouseMove}
          onMouseLeave={handleSvgMouseLeave}
        >
          <defs>
            <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="gridGradV" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={P.accent} stopOpacity="0.12" />
              <stop offset="50%" stopColor={P.purple} stopOpacity="0.06" />
              <stop offset="100%" stopColor="#ff4466" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="gridGradH" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={P.highlight} stopOpacity="0.06" />
              <stop offset="50%" stopColor={P.purple} stopOpacity="0.04" />
              <stop offset="100%" stopColor={P.accent} stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="borderGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={P.accent} stopOpacity="0.2" />
              <stop offset="50%" stopColor={P.purple} stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ff4466" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Map border */}
          <rect
            x={PAD} y={PAD}
            width={W - PAD * 2} height={H - PAD * 2}
            fill="none" rx="12"
            stroke="url(#borderGrad)" strokeWidth="1.5"
          />

          {/* Grid */}
          {gridSteps.map((v) => {
            const isMajor = v === 0;
            return (
              <g key={`grid-${v}`}>
                <line
                  x1={toX(v)} y1={PAD} x2={toX(v)} y2={H - PAD}
                  stroke="url(#gridGradV)"
                  strokeWidth={isMajor ? 1.2 : 0.5}
                  strokeDasharray={isMajor ? "none" : "3,10"}
                  style={isMajor ? {} : { animation: "shimmer 6s ease-in-out infinite" }}
                />
                <line
                  x1={PAD} y1={toY(v)} x2={W - PAD} y2={toY(v)}
                  stroke="url(#gridGradH)"
                  strokeWidth={isMajor ? 1.2 : 0.5}
                  strokeDasharray={isMajor ? "none" : "3,10"}
                  style={isMajor ? {} : { animation: "shimmer 6s ease-in-out infinite" }}
                />
              </g>
            );
          })}

          {/* Quadrant shading — hover detected via SVG onMouseMove */}
          <rect
            x={PAD} y={PAD}
            width={midX - PAD} height={midY - PAD}
            fill={P.purple} rx="4"
            opacity={hoveredQuad === "tl" ? 0.06 : 0.015}
            style={{ transition: "opacity 0.5s ease", pointerEvents: "none" }}
          />
          <rect
            x={midX} y={PAD}
            width={W - PAD - midX} height={midY - PAD}
            fill={P.accent} rx="4"
            opacity={hoveredQuad === "tr" ? 0.07 : 0.02}
            style={{ transition: "opacity 0.5s ease", pointerEvents: "none" }}
          />
          <rect
            x={PAD} y={midY}
            width={midX - PAD} height={H - PAD - midY}
            fill="rgba(255,255,255,0.5)" rx="4"
            opacity={hoveredQuad === "bl" ? 0.04 : 0.008}
            style={{ transition: "opacity 0.5s ease", pointerEvents: "none" }}
          />
          <rect
            x={midX} y={midY}
            width={W - PAD - midX} height={H - PAD - midY}
            fill="#ff4466" rx="4"
            opacity={hoveredQuad === "br" ? 0.06 : 0.015}
            style={{ transition: "opacity 0.5s ease", pointerEvents: "none" }}
          />

          {/* Axis labels — more contrast */}
          <text x={W / 2} y={PAD - 24} textAnchor="middle" fontSize="15" fill={P.accent} opacity={0.7} fontFamily="monospace" letterSpacing="5">
            ALTA COMPREENSÃO
          </text>
          <text x={W / 2} y={H - PAD + 38} textAnchor="middle" fontSize="15" fill="#ff4466" opacity={0.8} fontFamily="monospace" letterSpacing="5">
            CAIXA PRETA
          </text>
          <text x={PAD - 32} y={H / 2} textAnchor="middle" fontSize="14" fill={P.highlight} opacity={0.75} fontFamily="monospace" letterSpacing="3" transform={`rotate(-90,${PAD - 32},${H / 2})`}>
            LENTO / MANUAL
          </text>
          <text x={W - PAD + 32} y={H / 2} textAnchor="middle" fontSize="14" fill={P.accent} opacity={0.75} fontFamily="monospace" letterSpacing="3" transform={`rotate(90,${W - PAD + 32},${H / 2})`}>
            AUTOMATIZADO / RÁPIDO
          </text>

          {/* Quadrant labels — brighter base, even brighter on hover */}
          <text x={toX(-0.5)} y={toY(0.6)} textAnchor="middle" fontSize="14" fill={P.highlight}
            opacity={hoveredQuad === "tl" ? 0.75 : 0.40} fontFamily="monospace" letterSpacing="2"
            style={{ transition: "opacity 0.5s ease", pointerEvents: "none" }}>
            Seguro, mas lento
          </text>
          <text x={toX(0.5)} y={toY(0.6)} textAnchor="middle" fontSize="14" fill={P.accent}
            opacity={hoveredQuad === "tr" ? 0.75 : 0.40} fontFamily="monospace" letterSpacing="2"
            style={{ transition: "opacity 0.5s ease", pointerEvents: "none" }}>
            Zona ideal
          </text>
          <text x={toX(0.5)} y={toY(-0.65)} textAnchor="middle" fontSize="14" fill="#ff4466"
            opacity={hoveredQuad === "br" ? 0.75 : 0.40} fontFamily="monospace" letterSpacing="2"
            style={{ transition: "opacity 0.5s ease", pointerEvents: "none" }}>
            Zona caixa preta
          </text>
          <text x={toX(-0.5)} y={toY(-0.65)} textAnchor="middle" fontSize="14" fill="rgba(255,255,255,0.6)"
            opacity={hoveredQuad === "bl" ? 0.65 : 0.30} fontFamily="monospace" letterSpacing="2"
            style={{ transition: "opacity 0.5s ease", pointerEvents: "none" }}>
            Lento e perdido
          </text>

          {/* Connection lines */}
          {tagConnections.map(({ a, b, tag }, i) => {
            const isActiveTag = active && active.tag === tag;
            const da = dragOffsets[a.id] || { dx: 0, dy: 0 };
            const db = dragOffsets[b.id] || { dx: 0, dy: 0 };
            return (
              <line
                key={`conn-${i}`}
                x1={toX(a.x) + da.dx} y1={toY(a.y) + da.dy}
                x2={toX(b.x) + db.dx} y2={toY(b.y) + db.dy}
                stroke={P.tags[tag]}
                strokeWidth={isActiveTag ? 1 : 0.4}
                opacity={isActiveTag ? 0.25 : 0.04}
                strokeDasharray="4,6"
                style={{ transition: "all 0.6s ease" }}
              />
            );
          })}

          {/* Nodes — bigger */}
          {ENTITIES.map((e) => {
            const cx = toX(e.x);
            const cy = toY(e.y);
            const isActive = active?.id === e.id;
            const isSameTag = active && active.tag === e.tag;
            const dimmed = active && !isActive && !isSameTag;
            const color = P.tags[e.tag];

            const ringR = 22 + (e.risk / 100) * 18;
            const drag = dragOffsets[e.id] || { dx: 0, dy: 0 };
            const isDragging = dragRef.current?.id === e.id;

            return (
              <g
                key={e.id}
                className="map-node"
                transform={`translate(${cx + drag.dx},${cy + drag.dy})`}
                onClick={() => { if (!isDragging) setSelected(selected?.id === e.id ? null : e); }}
                onMouseDown={(ev) => handleDragStart(ev, e.id)}
                onMouseEnter={() => { if (!dragRef.current) setHovered(e); }}
                onMouseLeave={() => { if (!dragRef.current) setHovered(null); }}
                style={{
                  opacity: dimmed ? 0.2 : 1,
                  transition: isDragging ? "opacity 0.3s ease" : "opacity 0.6s ease",
                  cursor: isDragging ? "grabbing" : "grab",
                }}
              >
                {isActive && (
                  <>
                    <circle fill="none" stroke={color} strokeWidth="0.8" opacity="0">
                      <animate attributeName="r" from="12" to="55" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.25" to="0" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle fill="none" stroke={color} strokeWidth="0.4" opacity="0">
                      <animate attributeName="r" from="12" to="55" dur="2s" begin="0.7s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.12" to="0" dur="2s" begin="0.7s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}

                {/* Outer ring */}
                <circle
                  r={isActive ? ringR + 5 : ringR}
                  fill="none"
                  stroke={color}
                  strokeWidth={isActive ? 1.2 : 0.6}
                  opacity={isActive ? 0.4 : 0.12}
                  style={{ animation: "pulseRing 6s ease-in-out infinite" }}
                />

                {/* Main dot */}
                <circle
                  r={isActive ? 12 : 9}
                  fill={color}
                  opacity={isActive ? 1 : 0.85}
                  filter={isActive ? "url(#nodeGlow)" : "none"}
                />

                {/* Inner highlight */}
                <circle
                  r={isActive ? 5 : 4}
                  fill="#fff"
                  opacity={isActive ? 0.4 : 0.15}
                />

                {/* Label */}
                <text
                  y={isActive ? 32 : 28}
                  textAnchor="middle"
                  fontSize={isActive ? "15" : "13"}
                  fill={isActive ? color : "rgba(255,255,255,0.72)"}
                  fontFamily="'Helvetica Neue', Helvetica, sans-serif"
                  fontWeight={isActive ? "500" : "300"}
                  style={{ userSelect: "none", pointerEvents: "none" }}
                >
                  {e.name}
                </text>
              </g>
            );
          })}

          {/* Center crosshair */}
          <circle cx={toX(0)} cy={toY(0)} r={2} fill={P.purple} opacity={0.2} />
        </svg>

        {/* Overlay info panel — bottom-left */}
        {active && (
          <div
            key={active.id}
            className="panel-slide"
            style={{
              position: "absolute",
              bottom: "28px",
              left: "28px",
              maxWidth: "580px",
              background: "rgba(8,4,24,0.9)",
              backdropFilter: "blur(28px)",
              border: `1px solid ${P.tags[active.tag]}30`,
              borderRadius: "18px",
              padding: "28px 32px",
              pointerEvents: "none",
              zIndex: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: P.tags[active.tag],
                boxShadow: `0 0 12px ${P.tags[active.tag]}66`,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: "22px",
                fontWeight: 500,
                color: P.tags[active.tag],
                fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
              }}>
                {active.name}
              </span>
              <span style={{
                fontSize: "10px",
                background: `${P.tags[active.tag]}18`,
                border: `1px solid ${P.tags[active.tag]}35`,
                color: P.tags[active.tag],
                padding: "3px 10px",
                borderRadius: "20px",
                fontFamily: "monospace",
                letterSpacing: "1px",
              }}>
                {active.tag}
              </span>
              <span style={{
                marginLeft: "auto",
                fontSize: "18px",
                fontWeight: 600,
                color: P.tags[active.tag],
                fontFamily: "monospace",
                opacity: 0.85,
              }}>
                {active.risk}%
              </span>
            </div>

            <p style={{
              fontSize: "15px",
              color: "rgba(255,255,255,0.65)",
              margin: "0 0 14px",
              lineHeight: 1.7,
              fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
              fontWeight: 300,
            }}>
              <TypedText text={active.desc} speed={12} />
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {active.examples.map((ex, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "12px",
                    background: `${P.purple}10`,
                    border: `1px solid ${P.purple}1a`,
                    color: "rgba(255,255,255,0.55)",
                    padding: "4px 12px",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                  }}
                >
                  {ex}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Legend — top-right corner inside map */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            display: "none",
            gap: "18px",
            opacity: mounted ? 0.85 : 0,
            transition: "opacity 1s 0.5s ease",
          }}
        >
          {Object.entries(P.tags).map(([tag, color]) => (
            <div key={tag} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, opacity: 0.9 }} />
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", fontFamily: "monospace", letterSpacing: "1px" }}>{tag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
