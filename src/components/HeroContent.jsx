import { useState, useEffect, useRef } from "react";

const TYPED_LINES = [
  "dev senior + ia  >  amplificacao",
  "vibe coder       >  caixa preta",
  "tdd + ia         >  compreensao real",
  "move fast        >  divida cognitiva",
  "code review      >  conhecimento vivo",
  "sem processo     >  caos invisivel",
];

function useTypedText(lines, { typeSpeed = 50, deleteSpeed = 25, pauseMs = 2200, startDelay = 1600 }) {
  const [text, setText] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(timer);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    let lineIdx = 0;
    let charIdx = 0;
    let deleting = false;
    let timeout;

    function tick() {
      const line = lines[lineIdx];
      if (!deleting) {
        charIdx++;
        setText(line.slice(0, charIdx));
        if (charIdx === line.length) {
          deleting = true;
          timeout = setTimeout(tick, pauseMs);
          return;
        }
        timeout = setTimeout(tick, typeSpeed);
      } else {
        charIdx--;
        setText(line.slice(0, charIdx));
        if (charIdx === 0) {
          deleting = false;
          lineIdx = (lineIdx + 1) % lines.length;
          timeout = setTimeout(tick, 350);
          return;
        }
        timeout = setTimeout(tick, deleteSpeed);
      }
    }

    tick();
    return () => clearTimeout(timeout);
  }, [started, lines, typeSpeed, deleteSpeed, pauseMs]);

  return text;
}

export default function HeroContent({ onExplore }) {
  const [mounted, setMounted] = useState(false);
  const typedText = useTypedText(TYPED_LINES, {});

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        padding: "0 7%",
        pointerEvents: "none",
      }}
    >
      <style>{`
        @keyframes heroUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .hero-btn {
          display: inline-block;
          pointer-events: all;
          font-family: 'Helvetica Neue', Helvetica, sans-serif;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.5px;
          color: #fff;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(124,58,237,0.3);
          padding: 14px 32px;
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 0;
          animation: heroUp 0.7s 1.2s forwards;
        }
        .hero-btn:hover {
          background: rgba(0,229,160,0.1);
          border-color: rgba(0,229,160,0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,229,160,0.1);
        }
      `}</style>

      <div style={{ maxWidth: "480px" }}>
        {/* Eyebrow */}
        <div
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
            fontSize: "11px",
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "rgba(167,139,250,0.55)",
            marginBottom: "22px",
            opacity: 0,
            animation: mounted ? "heroUp 0.7s 0.4s forwards" : "none",
          }}
        >
          Evoluum | Desenvolvimento com IA
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
            fontSize: "clamp(26px, 3.2vw, 46px)",
            fontWeight: 300,
            color: "#fff",
            lineHeight: 1.25,
            letterSpacing: "-0.5px",
            marginBottom: "18px",
            opacity: 0,
            animation: mounted ? "heroUp 0.7s 0.6s forwards" : "none",
          }}
        >
          O codigo cresce
          <br />
          mais rapido que a
          <br />
          <span style={{ color: "#00e5a0", fontWeight: 400 }}>
            capacidade de absorver
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
            fontSize: "clamp(12px, 1.3vw, 15px)",
            fontWeight: 300,
            color: "rgba(255,255,255,0.3)",
            lineHeight: 1.75,
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

        {/* Typed text */}
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "12px",
            color: "rgba(0,229,160,0.5)",
            letterSpacing: "1.5px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "36px",
            minHeight: "20px",
            opacity: 0,
            animation: mounted ? "heroUp 0.7s 1s forwards" : "none",
          }}
        >
          <span>{typedText}</span>
          <span
            style={{
              display: "inline-block",
              width: "1.5px",
              height: "14px",
              background: "rgba(0,229,160,0.7)",
              animation: "blink 1s step-end infinite",
            }}
          />
        </div>

        {/* CTA */}
        <button className="hero-btn" onClick={onExplore}>
          Explorar o Mapa
        </button>
      </div>

      {/* Corner info */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "24px",
          fontFamily: "'Courier New', monospace",
          fontSize: "9px",
          letterSpacing: "2px",
          color: "rgba(255,255,255,0.06)",
          lineHeight: 1.8,
          zIndex: 10,
        }}
      >
        VELOCIDADE VS COMPREENSAO · 2025
      </div>
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          right: "24px",
          fontFamily: "'Courier New', monospace",
          fontSize: "9px",
          letterSpacing: "2px",
          color: "rgba(255,255,255,0.06)",
          textAlign: "right",
          zIndex: 10,
        }}
      >
        PARTICULAS · 4.000
      </div>
    </div>
  );
}
