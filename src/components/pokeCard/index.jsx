import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./index.css";

const PokedexCard = ({ pokemon }) => {
  const [pokeState, setPokeState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: '50%', left: '50%' });

  const cardRef = useRef(null);
  const hoverTimerRef = useRef(null);

  useEffect(() => {
    if (!pokemon) return;
    setPokeState(pokemon);
    setLoading(false);
  }, [pokemon]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  if (loading) return <p>Chargement carte...</p>;
  if (!pokeState) return <p>Erreur de chargement</p>;

  const type = (Array.isArray(pokeState.type) ? pokeState.type[0] : pokeState.type || "normal").toLowerCase();
  const pokeName = pokeState.name?.english || pokeState.name || "Unknown";
  const img = pokeState.image;
  const hp = pokeState.base?.HP || 0;

  const handleImageError = () => {
    setImgError(true);
  };

  const handleOpenDetails = () => {
    const targetName = pokeState?.name?.english || pokeState?.name || "";
    if (!targetName) return;
    window.location.hash = `#/pokemon/${encodeURIComponent(targetName)}`;
  };

  // Tilt dynamique
  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateY = ((x - centerX) / centerX) * 12;
    const rotateX = -((y - centerY) / centerY) * 6;

    card.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateY(-2px)`;
  };

  const handleMouseEnter = () => {
    hoverTimerRef.current = setTimeout(() => {
      const card = cardRef.current;
      if (!card) return;
      
      const rect = card.getBoundingClientRect();
      const modalWidth = 400;
      const modalHeight = 450;
      const margin = 20;
      
      // Centrer horizontalement sur la carte
      let left = rect.left + (rect.width / 2) - (modalWidth / 2);
      
      // Ajuster si depasse a droite
      if (left + modalWidth > window.innerWidth - margin) {
        left = window.innerWidth - modalWidth - margin;
      }
      
      // Ajuster si depasse a gauche
      if (left < margin) {
        left = margin;
      }
      
      // Calculer la position verticale (centré par rapport à la carte)
      let top = rect.top + (rect.height / 2) - (modalHeight / 2);
      
      // Ajuster si ça dépasse en haut
      if (top < margin) {
        top = margin;
      }
      
      // Ajuster si ça dépasse en bas
      if (top + modalHeight > window.innerHeight - margin) {
        top = window.innerHeight - modalHeight - margin;
      }
      
      setModalPosition({ top: `${top}px`, left: `${left}px` });
      setShowPreview(true);
    }, 800);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = "";
    
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    setShowPreview(false);
  };

  return (
    <div className={`pk-scene ${showPreview ? 'preview-active' : ''}`}>
      <div
        ref={cardRef}
        className={`pk-card type-${type}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* HEADER */}
        <div className="pk-header">
          <span className="pk-stage">BASIC</span>
          <span className="pk-name">{pokeName}</span>
          <span className="pk-hp">
            <span className="pk-hp-label">HP</span>
            <span className="pk-hp-value">{hp}</span>
          </span>
        </div>

        {/* IMAGE */}
        <div className="pk-art" style={{ cursor: "pointer" }} onClick={handleOpenDetails}>
          <div className="pk-art-frame">
            {img && !imgError ? (
              <img
                className="pk-img"
                src={img}
                alt={pokeName}
                onError={handleImageError}
              />
            ) : (
              <div style={{ width: '120px', height: '120px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                <span style={{ color: '#999' }}>Image non disponible</span>
              </div>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="pk-body">
          <div className="pk-stat-badge">
            <div className="pk-stat-header">
              <span className="pk-stat-name">Attack</span>
              <span className="pk-stat-value">{pokeState.base?.Attack || 0}</span>
            </div>
            <div className="pk-stat-bar">
              <div 
                className="pk-stat-fill attack" 
                style={{ width: `${Math.min((pokeState.base?.Attack || 0) / 200, 1) * 100}%` }}
              />
            </div>
          </div>
          <div className="pk-stat-badge">
            <div className="pk-stat-header">
              <span className="pk-stat-name">Defense</span>
              <span className="pk-stat-value">{pokeState.base?.Defense || 0}</span>
            </div>
            <div className="pk-stat-bar">
              <div 
                className="pk-stat-fill defense" 
                style={{ width: `${Math.min((pokeState.base?.Defense || 0) / 1.5, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="pk-footer">
          <div className="pk-meta">
            <span>Type: {type}</span>
            <span>ID: {pokeState.id}</span>
            <span>Speed: {pokeState.base?.Speed || '—'}</span>
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreview && createPortal(
        <div 
          className="pk-preview-modal" 
          style={{ 
            top: modalPosition.top, 
            left: modalPosition.left,
            transform: 'none'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pk-preview-header">
            <h3>{pokeName}</h3>
            <div className="pk-preview-types">
              {(Array.isArray(pokeState.type) ? pokeState.type : [pokeState.type || 'normal']).map((t, i) => (
                <span key={i} className={`pk-type-badge type-${t.toLowerCase()}`}>{t}</span>
              ))}
            </div>
          </div>
          
          <div className="pk-preview-content">
            <div className="pk-preview-stat">
              <span className="pk-preview-stat-label">❤️ HP</span>
              <div className="pk-preview-stat-bar">
                <div className="pk-preview-stat-fill" style={{ width: `${Math.min((pokeState.base?.HP || 0) / 2.55, 100)}%` }} />
              </div>
              <span className="pk-preview-stat-value">{pokeState.base?.HP || 0}</span>
            </div>
            
            <div className="pk-preview-stat">
              <span className="pk-preview-stat-label">⚔️ Attack</span>
              <div className="pk-preview-stat-bar">
                <div className="pk-preview-stat-fill attack" style={{ width: `${Math.min((pokeState.base?.Attack || 0) / 2, 100)}%` }} />
              </div>
              <span className="pk-preview-stat-value">{pokeState.base?.Attack || 0}</span>
            </div>
            
            <div className="pk-preview-stat">
              <span className="pk-preview-stat-label">🛡️ Defense</span>
              <div className="pk-preview-stat-bar">
                <div className="pk-preview-stat-fill defense" style={{ width: `${Math.min((pokeState.base?.Defense || 0) / 2.5, 100)}%` }} />
              </div>
              <span className="pk-preview-stat-value">{pokeState.base?.Defense || 0}</span>
            </div>
            
            <div className="pk-preview-stat">
              <span className="pk-preview-stat-label">✨ Sp. Attack</span>
              <div className="pk-preview-stat-bar">
                <div className="pk-preview-stat-fill special" style={{ width: `${Math.min((pokeState.base?.SpecialAttack || 0) / 2, 100)}%` }} />
              </div>
              <span className="pk-preview-stat-value">{pokeState.base?.SpecialAttack || 0}</span>
            </div>
            
            <div className="pk-preview-stat">
              <span className="pk-preview-stat-label">💎 Sp. Defense</span>
              <div className="pk-preview-stat-bar">
                <div className="pk-preview-stat-fill special" style={{ width: `${Math.min((pokeState.base?.SpecialDefense || 0) / 2.5, 100)}%` }} />
              </div>
              <span className="pk-preview-stat-value">{pokeState.base?.SpecialDefense || 0}</span>
            </div>
            
            <div className="pk-preview-stat">
              <span className="pk-preview-stat-label">💨 Speed</span>
              <div className="pk-preview-stat-bar">
                <div className="pk-preview-stat-fill speed" style={{ width: `${Math.min((pokeState.base?.Speed || 0) / 2, 100)}%` }} />
              </div>
              <span className="pk-preview-stat-value">{pokeState.base?.Speed || 0}</span>
            </div>
          </div>
          
          <div className="pk-preview-footer">
            <span>Cliquez sur la carte pour plus de détails</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PokedexCard;
