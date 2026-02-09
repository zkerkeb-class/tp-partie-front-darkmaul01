import { useEffect, useState } from "react";
import "./App.css";

import Title from "./components/title";
import PokedexCard from "./components/pokeCard";
import AddPokemon from "./pages/AddPokemon";
import PokeDetails from "./pages/PokeDetails";
import { fetchPokemons } from "./config/api";

function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [currentPage, setCurrentPage] = useState(1);
  const [allPokemons, setAllPokemons] = useState([]);
  const [pokemons, setPokemons] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sortBy, setSortBy] = useState('id-asc');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toasts, setToasts] = useState([]);

  const POKEMONS_PER_PAGE = 20;
  
  const refreshPokemons = () => {
    setSearchTerm("");
    setSearchResults([]);
    setIsSearching(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const pushToast = (message, tone = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const sortPokemons = (pokemonList) => {
    const sorted = [...pokemonList];
    
    switch (sortBy) {
      case 'id-asc':
        return sorted.sort((a, b) => (a.id || 0) - (b.id || 0));
      case 'name-asc':
        return sorted.sort((a, b) => {
          const nameA = (a.name?.english || a.name || '').toLowerCase();
          const nameB = (b.name?.english || b.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case 'name-desc':
        return sorted.sort((a, b) => {
          const nameA = (a.name?.english || a.name || '').toLowerCase();
          const nameB = (b.name?.english || b.name || '').toLowerCase();
          return nameB.localeCompare(nameA);
        });
      case 'hp-desc':
        return sorted.sort((a, b) => (b.base?.HP || 0) - (a.base?.HP || 0));
      case 'attack-desc':
        return sorted.sort((a, b) => (b.base?.Attack || 0) - (a.base?.Attack || 0));
      case 'defense-desc':
        return sorted.sort((a, b) => (b.base?.Defense || 0) - (a.base?.Defense || 0));
      default:
        return sorted;
    }
  };

  // Écouter les changements de route
  useEffect(() => {
    const handler = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // Gérer le bouton retour en haut
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const duration = 400;
    const start = window.scrollY;
    const startTime = performance.now();
    
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    
    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      
      window.scrollTo(0, start * (1 - eased));
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };
    
    requestAnimationFrame(animateScroll);
  };

  // Charger les pokémons une seule fois au démarrage
  useEffect(() => {
    if (route === '#/' || route === '') {
      setLoadingList(true);
      
      fetchPokemons(1)
        .then((data) => {
          const all = data.pokemons || [];
          setAllPokemons(all);
          const pages = Math.ceil(all.length / POKEMONS_PER_PAGE);
          setTotalPages(pages);
          setLoadingList(false);
        })
        .catch((err) => {
          setError("Impossible de charger la liste.");
          pushToast("Impossible de charger la liste.", "error");
          setLoadingList(false);
        });
    }
  }, [route, refreshTrigger]);

  // Mettre à jour les pokémons affichés quand la page change ou le tri change
  useEffect(() => {
    const sorted = sortPokemons(allPokemons);
    const start = (currentPage - 1) * POKEMONS_PER_PAGE;
    const end = start + POKEMONS_PER_PAGE;
    setPokemons(sorted.slice(start, end));
  }, [currentPage, allPokemons, sortBy]);

  const increment = () =>
    setCurrentPage((prev) => (prev >= totalPages ? totalPages : prev + 1));

  const decrement = () =>
    setCurrentPage((prev) => (prev <= 1 ? 1 : prev - 1));

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    setCurrentPage(1);

    if (term.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
    } else {
      setIsSearching(true);
      const filtered = allPokemons.filter((pokemon) => {
        const str = JSON.stringify(pokemon).toLowerCase();
        return str.includes(term);
      });
      setSearchResults(sortPokemons(filtered));
    }
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const getResultsCount = () => {
    if (isSearching) {
      return searchResults.length;
    }
    const start = (currentPage - 1) * POKEMONS_PER_PAGE + 1;
    const end = Math.min(currentPage * POKEMONS_PER_PAGE, allPokemons.length);
    const total = allPokemons.length;
    return { start, end, total };
  };

  // Routes
  const renderRoute = () => {
    if (route.startsWith('#/pokemon/')) {
      const name = decodeURIComponent(route.replace('#/pokemon/', ''));
      return <PokeDetails name={name} onRefresh={refreshPokemons} onNotify={pushToast} />;
    }
    if (route === '#/add') {
      return <AddPokemon onRefresh={refreshPokemons} onNotify={pushToast} />;
    }
    // Route par défaut: explorateur avec compteur
    return (
      <div className="app">
        {/* En-tête */}
        <header className="app-header">
          <Title level={1} label="Carte Pokémon" />
          <Title level={2} label="Explorateur" />
          <div className="search-bar">
            <input
              type="text"
              placeholder="Rechercher un Pokémon (nom, type, numéro)..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
              aria-label="Rechercher un Pokemon"
            />
          </div>
          <div className="sort-bar">
            <label htmlFor="sort-select" className="sort-label">Trier par :</label>
            <select 
              id="sort-select"
              value={sortBy} 
              onChange={handleSortChange}
              className="sort-select"
            >
              <option value="id-asc">Numéro (ID)</option>
              <option value="name-asc">Nom (A-Z)</option>
              <option value="name-desc">Nom (Z-A)</option>
              <option value="hp-desc">HP (Plus élevé)</option>
              <option value="attack-desc">Attaque (Plus élevé)</option>
              <option value="defense-desc">Défense (Plus élevé)</option>
            </select>
          </div>
        </header>

        {/* Compteur de résultats */}
        {!loadingList && (
          <div className="results-counter" aria-live="polite">
            {isSearching ? (
              <span>{searchResults.length} résultat(s) trouvé(s) pour "{searchTerm}"</span>
            ) : (
              <span>
                Affichage de {getResultsCount().start}-{getResultsCount().end} sur {getResultsCount().total} Pokémon
              </span>
            )}
          </div>
        )}

        {/* Contenu principal */}
        <main className="app-content">
          {loadingList ? (
            <p>Chargement...</p>
          ) : isSearching && searchResults.length > 0 ? (
            <div className="pokemon-grid">
              {searchResults.map((pokemon) => (
                <PokedexCard key={pokemon.id} pokemon={pokemon} />
              ))}
            </div>
          ) : isSearching && searchResults.length === 0 ? (
            <div className="empty-state">
              <h3>Aucun resultat</h3>
              <p>Veuillez essayer un autre nom, type ou numero.</p>
            </div>
          ) : pokemons.length > 0 ? (
            <div className="pokemon-grid">
              {pokemons.map((pokemon) => (
                <PokedexCard key={pokemon.id} pokemon={pokemon} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>Aucun Pokemon pour le moment</h3>
              <p>Veuillez ajouter un Pokemon pour commencer.</p>
            </div>
          )}
        </main>

        {/* Pied de page avec contrôles */}
        <footer className="app-footer">
          {!isSearching && (
            <div className="pagination" role="navigation" aria-label="Pagination">
              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    type="button"
                    className={
                      page === currentPage
                        ? "page-button is-active"
                        : "page-button"
                    }
                    onClick={() => setCurrentPage(page)}
                    disabled={loadingList}
                    aria-current={page === currentPage ? "page" : undefined}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
          )}

          <button 
            onClick={() => window.location.hash = "#/add"}
            style={{ marginTop: "16px" }}
          >
            Ajouter
          </button>

          {error && <div className="error">{error}</div>}
        </footer>

        {/* Bouton retour en haut */}
        {showScrollTop && (
          <button 
            className="scroll-to-top"
            onClick={scrollToTop}
            aria-label="Retour en haut"
          >
            ↑
          </button>
        )}

        {toasts.length > 0 && (
          <div className="toast-stack" aria-live="polite">
            {toasts.map((toast) => (
              <div key={toast.id} className={`toast toast--${toast.tone}`}>
                <span>{toast.message}</span>
                <button
                  type="button"
                  className="toast-close"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return renderRoute();
}

export default App;
