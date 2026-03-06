import { P } from "../palette";

export default function TitleOverlay({ visible, onNext, onBack }) {
  return (
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
          pointerEvents: visible ? "auto" : "none",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.8s cubic-bezier(.4,0,.2,1)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition: "transform 1s cubic-bezier(.16,1,.3,1)",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "6px",
              color: P.subtitle,
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
              color: P.textPrimary,
              margin: "0 0 16px",
              letterSpacing: "4px",
              fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
            }}
          >
            Velocidade{" "}
            <span style={{ color: P.accent, fontWeight: 300 }}>vs</span>{" "}
            Compreensão
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: P.textSecondary,
              marginBottom: "48px",
              fontFamily: "'Helvetica Neue', Helvetica, sans-serif",
              fontWeight: 300,
              letterSpacing: "0.5px",
            }}
          >
            Tudo acelera. A compreensão não acompanha.
          </p>
          <button className="title-btn" onClick={onNext}>
            Explorar o Mapa
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7l5 5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <button
        className="nav-btn"
        onClick={onBack}
        style={{
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
          transition: "opacity 0.4s 0.5s ease, color 0.3s, border-color 0.3s",
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 8V2M2 5l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        VOLTAR
      </button>
    </>
  );
}
