import { useEffect, useRef, useState, useCallback } from "react";
import HeroScene from "./components/HeroScene";
import HeroOverlay from "./components/HeroOverlay";
import TitleOverlay from "./components/TitleOverlay";
import MapaRisco from "./components/MapaRisco";
import CornerParticles from "./components/CornerParticles";
import { P } from "./palette";

export default function App() {
  const phaseRef = useRef("hero");
  const [phase, setPhase] = useState("hero");
  const [heroVisible, setHeroVisible] = useState(true);
  const [titleVisible, setTitleVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);

  // Hero → Title
  const goToTitle = useCallback(() => {
    phaseRef.current = "title";
    setHeroVisible(false);
    setTimeout(() => { setPhase("title"); setTitleVisible(true); }, 700);
  }, []);

  // Title → Map
  const goToMap = useCallback(() => {
    phaseRef.current = "map";
    setTitleVisible(false);
    setTimeout(() => { setPhase("map"); setMapVisible(true); }, 600);
  }, []);

  // Map → Title
  const backToTitle = useCallback(() => {
    phaseRef.current = "title";
    setMapVisible(false);
    setTimeout(() => { setPhase("title"); setTitleVisible(true); }, 600);
  }, []);

  // Title → Hero
  const backToHero = useCallback(() => {
    phaseRef.current = "hero";
    setTitleVisible(false);
    setTimeout(() => { setPhase("hero"); setHeroVisible(true); }, 700);
  }, []);

  // Scroll navigation
  useEffect(() => {
    let cooldown = false;
    const COOLDOWN_MS = 1200;
    const THRESHOLD = 40;

    const handleWheel = (e) => {
      if (cooldown) return;
      if (Math.abs(e.deltaY) < THRESHOLD) return;

      const p = phaseRef.current;
      if (e.deltaY > 0) {
        if (p === "hero") { cooldown = true; goToTitle(); }
        else if (p === "title") { cooldown = true; goToMap(); }
      } else {
        if (p === "map") { cooldown = true; backToTitle(); }
        else if (p === "title") { cooldown = true; backToHero(); }
      }
      if (cooldown) setTimeout(() => { cooldown = false; }, COOLDOWN_MS);
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [goToTitle, goToMap, backToTitle, backToHero]);

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: P.bg }}>
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
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 400; color: #fff; letter-spacing: 0.3px;
          background: rgba(255,255,255,0.06); border: 1px solid ${P.btnBorder};
          padding: 13px 28px; border-radius: 100px; cursor: pointer;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 0; animation: heroUp 0.7s 1.2s forwards;
          font-family: 'Helvetica Neue', Helvetica, sans-serif;
        }
        .hero-btn:hover {
          background: ${P.btnBgHover};
          border-color: ${P.btnBorderHover};
          transform: translateY(-2px);
          box-shadow: 0 8px 30px ${P.btnShadow};
        }
        .title-btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 400; color: ${P.textSecondary}; letter-spacing: 1px;
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
          font-size: 11px; letter-spacing: 2px; color: ${P.textMuted};
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          padding: 8px 18px; border-radius: 100px; cursor: pointer;
          display: flex; align-items: center; gap: 6px;
          transition: all 0.3s ease; font-family: monospace;
        }
        .nav-btn:hover { color: ${P.accent}; border-color: rgba(0,229,160,0.3); }
      `}</style>

      {(phase === "title" || phase === "map") && <CornerParticles />}

      <HeroScene phaseRef={phaseRef} />

      <HeroOverlay visible={heroVisible} onNext={goToTitle} />

      {phase === "title" && (
        <TitleOverlay
          visible={titleVisible}
          onNext={goToMap}
          onBack={backToHero}
        />
      )}

      {phase === "map" && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 25,
              background: mapVisible ? P.mapBg : "rgba(0,0,0,0)",
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

      <div
        style={{
          position: "fixed",
          bottom: "18px",
          left: "22px",
          fontFamily: "'Courier New', monospace",
          fontSize: "9px",
          letterSpacing: "2px",
          color: P.textGhost,
          zIndex: 15,
          pointerEvents: "none",
        }}
      >
        VELOCIDADE VS COMPREENSÃO · 2025
      </div>
      <div
        style={{
          position: "fixed",
          bottom: "18px",
          right: "22px",
          fontFamily: "'Courier New', monospace",
          fontSize: "9px",
          letterSpacing: "2px",
          color: P.textGhost,
          textAlign: "right",
          zIndex: 15,
          pointerEvents: "none",
        }}
      >
        PARTÍCULAS · 4.000
      </div>
    </div>
  );
}
