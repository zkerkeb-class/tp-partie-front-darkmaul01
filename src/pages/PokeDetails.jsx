import { useEffect, useState } from "react";
import { searchPokemon, updatePokemon, deletePokemon } from "../config/api";
import "./PokeDetails.css";

export default function PokeDetails({ name, onRefresh, onNotify }) {
    const [poke, setPoke] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const validateForm = () => {
        const errors = [];
        
        // Validation des informations de base
        if (!form.nameEnglish || form.nameEnglish.trim() === '') {
            errors.push('📋 Informations de base: Le nom anglais est requis');
        }
        
        // Validation des stats (doivent être des nombres valides)
        if (isNaN(toInt(form.hp)) || toInt(form.hp) < 0) {
            errors.push('⚡ Statistiques: HP doit être un nombre valide');
        }
        if (isNaN(toInt(form.attack)) || toInt(form.attack) < 0) {
            errors.push('⚡ Statistiques: Attack doit être un nombre valide');
        }
        if (toInt(form.attack) > 200) {
            errors.push('⚡ Statistiques: Attack ne peut pas dépasser 200');
        }
        if (isNaN(toInt(form.defense)) || toInt(form.defense) < 0) {
            errors.push('⚡ Statistiques: Defense doit être un nombre valide');
        }
        if (isNaN(toInt(form.spAtk)) || toInt(form.spAtk) < 0) {
            errors.push('⚡ Statistiques: Sp. Attack doit être un nombre valide');
        }
        if (isNaN(toInt(form.spDef)) || toInt(form.spDef) < 0) {
            errors.push('⚡ Statistiques: Sp. Defense doit être un nombre valide');
        }
        if (isNaN(toInt(form.speed)) || toInt(form.speed) < 0) {
            errors.push('⚡ Statistiques: Speed doit être un nombre valide');
        }
        
        return errors;
    };

    const buildForm = (data) => ({
        id: data.id || '',
        image: data.image || '',
        nameEnglish: data.name?.english || '',
        nameJapanese: data.name?.japanese || '',
        nameChinese: data.name?.chinese || '',
        nameFrench: data.name?.french || '',
        hp: data.base?.HP ?? '',
        attack: data.base?.Attack ?? '',
        defense: data.base?.Defense ?? '',
        spAtk: data.base?.SpecialAttack ?? '',
        spDef: data.base?.SpecialDefense ?? '',
        speed: data.base?.Speed ?? '',
        types: (data.type || []).join(', ')
    });

    useEffect(() => {
        setLoading(true);
        setLoadError('');
        setError([]);
        
        // Chercher par nom anglais
        searchPokemon(name)
            .then((data) => {
                setPoke(data);
                setForm(buildForm(data));
                setIsEditing(false);
                setLoading(false);
            })
            .catch((err) => {
                setLoadError(err.message);
                setLoading(false);
            });
    }, [name]);

    if (loading) return <p>Chargement...</p>;
    if (loadError) return <p>Erreur: {loadError}</p>;
    if (!poke) return <p>Pokémon introuvable</p>;

    const onChange = (k, v) => setForm(f => ({...f, [k]: v}));

    const toInt = (v) => (v === '' || v === null || v === undefined ? 0 : parseInt(v, 10));

    const onSave = async () => {
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setError(validationErrors);
            return;
        }
        
        try {
            setError([]);
            // Essayer avec l'indice d'abord
            const idToUse = poke.id;
            await updatePokemon(idToUse, {
                id: toInt(form.id) || poke.id,
                image: form.image,
                name: {
                    english: form.nameEnglish,
                    japanese: form.nameJapanese,
                    chinese: form.nameChinese,
                    french: form.nameFrench
                },
                base: {
                    HP: toInt(form.hp),
                    Attack: toInt(form.attack),
                    Defense: toInt(form.defense),
                    SpecialAttack: toInt(form.spAtk),
                    SpecialDefense: toInt(form.spDef),
                    Speed: toInt(form.speed)
                },
                type: form.types.split(',').map(t => t.trim()).filter(Boolean)
            });
            onNotify?.('Modifications enregistrees avec succes.', 'success');
            onRefresh?.();
            window.location.hash = '#/';
        } catch (err) {
            setError(['❌ Erreur lors de la mise a jour: ' + err.message]);
            onNotify?.('La mise a jour a echoue.', 'error');
        }
    };

    const onCancel = () => {
        if (poke) {
            setForm(buildForm(poke));
        }
        setIsEditing(false);
    };

    const onDelete = async () => {
        try {
            const idToUse = poke.id;
            await deletePokemon(idToUse);
            setShowModal(false);
            onNotify?.('Pokemon supprime avec succes.', 'success');
            onRefresh?.();
            window.location.hash = '#/';
        } catch (err) {
            setError(['❌ Erreur lors de la suppression: ' + err.message]);
            onNotify?.('La suppression a echoue.', 'error');
        }
    };

    const type = (Array.isArray(poke.type) ? poke.type[0] : poke.type || "normal").toLowerCase();

    return (
        <div className="details-container">
            <div className="details-card">
                {/* Header */}
                <div className={`details-header type-${type}`}>
                    <button onClick={() => window.location.hash = '#/'} className="back-button">
                        ← Retour
                    </button>
                    <div className="header-content">
                        <div>
                            <h1 className="pokemon-title">{form.nameEnglish}</h1>
                            <div className="type-badges">
                                {form.types.split(',').map(t => t.trim()).filter(Boolean).map((t, i) => (
                                    <span key={i} className="type-badge">{t}</span>
                                ))}
                            </div>
                        </div>
                        {poke.image && (
                            <img src={poke.image} alt={form.nameEnglish} className="pokemon-image" />
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="details-content">
                    {error.length > 0 && (
                        <div className="error-message" role="alert" aria-live="polite">
                            <ul className="error-list">
                                {error.map((msg, i) => (
                                    <li key={i}>{msg}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    <div className="section">
                        <h3 className="section-title">📋 Informations de base</h3>
                        <div className="grid-2">
                            <div>
                                <label className="field-label">ID</label>
                                <input 
                                    type="number" 
                                    value={form.id} 
                                    onChange={e => onChange('id', e.target.value)} 
                                    disabled={!isEditing} 
                                    className="field-input" 
                                />
                            </div>                            <div>
                                <label className="field-label">Image URL</label>
                                <input 
                                    value={form.image} 
                                    onChange={e => onChange('image', e.target.value)} 
                                    disabled={!isEditing} 
                                    className="field-input" 
                                    placeholder="https://localhost:3000/assets/pokemon/"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="section">
                        <h3 className="section-title">🌍 Noms Internationaux</h3>
                        <div className="grid-2">
                            <div>
                                <label className="field-label">English</label>
                                <input 
                                    value={form.nameEnglish} 
                                    onChange={e => onChange('nameEnglish', e.target.value)} 
                                    disabled={!isEditing} 
                                    className="field-input" 
                                />
                            </div>
                            <div>
                                <label className="field-label">Français</label>
                                <input 
                                    value={form.nameFrench} 
                                    onChange={e => onChange('nameFrench', e.target.value)} 
                                    disabled={!isEditing} 
                                    className="field-input" 
                                />
                            </div>
                            <div>
                                <label className="field-label">日本語 (Japanese)</label>
                                <input 
                                    value={form.nameJapanese} 
                                    onChange={e => onChange('nameJapanese', e.target.value)} 
                                    disabled={!isEditing} 
                                    className="field-input" 
                                />
                            </div>
                            <div>
                                <label className="field-label">中文 (Chinese)</label>
                                <input 
                                    value={form.nameChinese} 
                                    onChange={e => onChange('nameChinese', e.target.value)} 
                                    disabled={!isEditing} 
                                    className="field-input" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="section">
                        <h3 className="section-title">⚡ Statistiques de Base</h3>
                        <div className="grid-3">
                            <div>
                                <label className="field-label">❤️ HP</label>
                                <input 
                                    type="number" 
                                    value={form.hp} 
                                    onChange={e => onChange('hp', e.target.value)} 
                                    disabled={!isEditing} 
                                    className="field-input" 
                                />
                            </div>
                            <div>
                                <label className="field-label">⚔️ Attack</label>
                                <input 
                                    type="number" 
                                    value={form.attack} 
                                    onChange={e => onChange('attack', e.target.value)} 
                                    disabled={!isEditing} 
                                    className="field-input"
                                    max="200"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="field-label">🛡️ Defense</label>
                                <input 
                                    type="number" 
                                    value={form.defense} 
                                    onChange={e => onChange('defense', e.target.value)} 
                                    disabled={!isEditing} 
                                    className="field-input" 
                                />
                            </div>
                            <div>
                                <label className="field-label">✨ Sp. Attack</label>
                                <input 
                                    type="number" 
                                    value={form.spAtk} 
                                    onChange={e => onChange('spAtk', e.target.value)} 
                                    disabled={!isEditing} 
                                    className="field-input" 
                                />
                            </div>
                            <div>
                                <label className="field-label">💎 Sp. Defense</label>
                                <input 
                                    type="number" 
                                    value={form.spDef} 
                                    onChange={e => onChange('spDef', e.target.value)} 
                                    disabled={!isEditing} 
                                    className="field-input" 
                                />
                            </div>
                            <div>
                                <label className="field-label">💨 Speed</label>
                                <input 
                                    type="number" 
                                    value={form.speed} 
                                    onChange={e => onChange('speed', e.target.value)} 
                                    disabled={!isEditing} 
                                    className="field-input" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="section">
                        <h3 className="section-title">🏷️ Types</h3>
                        <label className="field-label">Types (séparés par des virgules)</label>
                        <input 
                            value={form.types} 
                            onChange={e => onChange('types', e.target.value)} 
                            disabled={!isEditing} 
                            className="field-input" 
                        />
                    </div>

                    {/* Actions */}
                    <div className="actions">
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                                ✏️ Modifier
                            </button>
                        ) : (
                            <>
                                <button onClick={onSave} className="btn btn-success">
                                    ✅ Enregistrer
                                </button>
                                <button onClick={onCancel} className="btn btn-secondary">
                                    ❌ Annuler
                                </button>
                            </>
                        )}
                        <button onClick={() => setShowModal(true)} className="btn btn-danger">
                            🗑️ Supprimer
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="modal-title">⚠️ Confirmer la suppression</h3>
                        <p className="modal-text">
                            Êtes-vous sûr de vouloir supprimer <strong>{form.nameEnglish}</strong> ?
                        </p>
                        <div className="modal-actions">
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                                Annuler
                            </button>
                            <button onClick={onDelete} className="btn btn-danger">
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

