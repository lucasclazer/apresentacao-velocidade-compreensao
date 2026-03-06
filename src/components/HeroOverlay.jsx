import { useEffect, useState } from "react";
import { P } from "../palette";

const TYPED_LINES = [
  "dev senior + ia  >  amplificação;",
  "vibe coder       >  caixa preta;",
  "processo + ia    >  escala real;",
  "sem processo     >  caos invisível;",
  "ia além do code  >  automação total;",
  "move fast        >  dívida cognitiva;",
];

export default function HeroOverlay({ visible, onNext }) {
  const [typedText, setTypedText] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 100); }, []);

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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        padding: "0 7%",
        pointerEvents: visible ? "auto" : "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(-40px) scale(0.97)",
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
            color: P.subtitle,
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
          Tudo acelera.
          <br />
          <em style={{ fontStyle: "normal", color: P.heroEmphasis }}>
            A compreensão não acompanha.
          </em>
        </h1>

        <p
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
            fontSize: "clamp(12px, 1.2vw, 14px)",
            fontWeight: 300,
            color: P.textSecondary,
            lineHeight: 1.8,
            marginBottom: "32px",
            opacity: 0,
            animation: mounted ? "heroUp 0.7s 0.8s forwards" : "none",
          }}
        >
          Quando a automação avança sem estrutura,
          <br />
          o sistema vira caixa preta — e a equipe
          <br />
          perde o controle do que está construindo.
        </p>

        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "12px",
            color: P.typedText,
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
              background: P.typedCursor,
              animation: "blink 1s step-end infinite",
            }}
          />
        </div>

        <button className="hero-btn" onClick={onNext}>
          Ver o Mapa
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v10M2 7l5 5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
