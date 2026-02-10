const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const handleResponse = async (res) => {
    if (!res.ok) {
        const error = await res.json().catch(() => ({message: res.statusText}));
        const message = error.message || error.error || res.statusText;
        throw new Error(message || `HTTP ${res.status}`);
    }
    return res.json();
};

export const fetchPokemons = async (page = 1) => {
    const res = await fetch(`${API_BASE}/pokemons?page=${page}`);
    return handleResponse(res);
};

export const searchPokemon = async (name) => {
    const res = await fetch(`${API_BASE}/pokemons/search/${name}`);
    return handleResponse(res);
};

export const createPokemon = async (data) => {
    const res = await fetch(`${API_BASE}/pokemons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
};

export const updatePokemon = async (id, data) => {
    const url = `${API_BASE}/pokemon/${id}`;
    const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return handleResponse(res);
};

export const deletePokemon = async (id) => {
    const res = await fetch(`${API_BASE}/pokemon/${id}`, {
        method: 'DELETE'
    });
    return handleResponse(res);
};

export const uploadPokemonImage = async (id, dataUrl) => {
    const res = await fetch(`${API_BASE}/upload/pokemon/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl })
    });
    return handleResponse(res);
};
