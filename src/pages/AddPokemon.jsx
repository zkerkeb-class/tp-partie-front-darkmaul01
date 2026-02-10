import { useState } from "react";
import { createPokemon, uploadPokemonImage } from "../config/api";
import "./AddPokemon.css";

export default function AddPokemon({ onRefresh, onNotify }) {
    const typeOptions = [
        'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 'Fighting', 'Poison',
        'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark',
        'Steel', 'Fairy'
    ];

    const [form, setForm] = useState({ 
        nameEnglish: '', 
        nameJapanese: '', 
        nameChinese: '', 
        nameFrench: '', 
        hp: '', 
        attack: '', 
        defense: '', 
        spAtk: '',
        spDef: '',
        speed: '',
        types: '',
        image: '',
        id: ''
    });
    const [error, setError] = useState([]);
    const [imageDataUrl, setImageDataUrl] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [imageMode, setImageMode] = useState('url');
    const [selectedTypes, setSelectedTypes] = useState([]);

    const onChange = (k, v) => setForm(f => ({...f, [k]: v}));

    const toInt = (v) => (v === '' || v === null || v === undefined ? 0 : parseInt(v, 10));

    const formatBackendError = (message) => {
        if (!message) {
            return ['❌ Une erreur est survenue.'];
        }

        const friendly = [];

        if (message.includes('validation failed') && message.includes('image')) {
            friendly.push('L\'image est obligatoire. Veuillez en ajouter une.');
        }

        if (message.includes('E11000 duplicate key') && message.includes('id_1')) {
            friendly.push('Cet ID est deja utilise. Veuillez choisir un autre numero.');
        }

        if (friendly.length > 0) {
            return friendly;
        }

        return ['❌ Erreur lors de la creation: ' + message];
    };

    const validateForm = () => {
        const errors = [];
        
        // Validation des informations de base
        if (!form.id || form.id.trim() === '') {
            errors.push('📋 Informations de base: L\'ID est requis');
        }
        if (!form.nameEnglish || form.nameEnglish.trim() === '') {
            errors.push('📋 Informations de base: Le nom anglais est requis');
        }
        if (imageMode === 'url' && (!form.image || form.image.trim() === '')) {
            errors.push('📋 Informations de base: L\'URL de l\'image est requise');
        }
        if (imageMode === 'file' && !imageDataUrl) {
            errors.push('📋 Informations de base: Veuillez selectionner un fichier image');
        }
        if (imageMode === 'file' && (!form.id || form.id.trim() === '')) {
            errors.push('📋 Informations de base: L\'ID est requis pour televerser une image');
        }
        if (selectedTypes.length === 0) {
            errors.push('🏷️ Types: Veuillez selectionner au moins un type');
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

    const onFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) {
            setImageDataUrl('');
            setImagePreview('');
            return;
        }

        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError(['❌ Format d\'image non supporte. Veuillez utiliser PNG, JPG ou WEBP.']);
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : '';
            setImageDataUrl(result);
            setImagePreview(result);
        };
        reader.onerror = () => {
            setError(['❌ Impossible de lire le fichier image. Veuillez reessayer.']);
        };
        reader.readAsDataURL(file);
    };

    const onImageModeChange = (mode) => {
        setImageMode(mode);
        setError([]);
        if (mode === 'url') {
            setImageDataUrl('');
            setImagePreview('');
        } else {
            setForm(f => ({ ...f, image: '' }));
        }
    };

    const toggleType = (type) => {
        setSelectedTypes((prev) => {
            if (prev.includes(type)) {
                return prev.filter((t) => t !== type);
            }
            return [...prev, type];
        });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setError(validationErrors);
            return;
        }

        try {
            setError([]);
            let finalImageUrl = form.image || '';
            if (imageMode === 'file' && imageDataUrl) {
                setIsUploading(true);
                const uploadResult = await uploadPokemonImage(parseInt(form.id, 10), imageDataUrl);
                finalImageUrl = uploadResult.url || '';
            }
            await createPokemon({
                name: {
                    english: form.nameEnglish,
                    japanese: form.nameJapanese,
                    chinese: form.nameChinese,
                    french: form.nameFrench
                },
                base: {
                    HP: form.hp ? parseInt(form.hp) : 0,
                    Attack: form.attack ? parseInt(form.attack) : 0,
                    Defense: form.defense ? parseInt(form.defense) : 0,
                    SpecialAttack: form.spAtk ? parseInt(form.spAtk) : 0,
                    SpecialDefense: form.spDef ? parseInt(form.spDef) : 0,
                    Speed: form.speed ? parseInt(form.speed) : 0
                },
                type: selectedTypes,
                image: finalImageUrl,
                id: parseInt(form.id)
            });
            onNotify?.('Pokemon cree avec succes.', 'success');
            onRefresh?.();
            window.location.hash = '#/';
        } catch (err) {
            setError(formatBackendError(err.message));
            onNotify?.('La creation a echoue. Veuillez verifier le formulaire.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="add-container">
            <div className="add-card">
                <div className="add-header">
                    <button onClick={() => window.location.hash = '#/'} className="back-button">
                        ← Retour
                    </button>
                    <h2 className="add-title">✨ Ajouter un Pokemon</h2>
                </div>
                
                <div className="add-content">
                    {error.length > 0 && (
                        <div className="error-message" role="alert" aria-live="polite">
                            <ul className="error-list">
                                {error.map((msg, i) => (
                                    <li key={i}>{msg}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    <form onSubmit={onSubmit} className="add-form" aria-busy={isUploading}>
                        <div className="form-section">
                            <h3 className="section-title">📋 Informations de base</h3>
                            <div className="grid-2">
                                <div>
                                    <label className="field-label required-label">ID</label>
                                    <input 
                                        type="number" 
                                        value={form.id} 
                                        onChange={e => onChange('id', e.target.value)} 
                                        className="field-input" 
                                        required 
                                    />
                                </div>
                                <div className="image-choice">
                                    <label className="field-label required-label">Image</label>
                                    <div className="choice-group">
                                        <label className="choice-item">
                                            <input
                                                type="radio"
                                                name="imageMode"
                                                checked={imageMode === 'url'}
                                                onChange={() => onImageModeChange('url')}
                                            />
                                            URL
                                        </label>
                                        <label className="choice-item">
                                            <input
                                                type="radio"
                                                name="imageMode"
                                                checked={imageMode === 'file'}
                                                onChange={() => onImageModeChange('file')}
                                            />
                                            Fichier
                                        </label>
                                    </div>
                                </div>
                                {imageMode === 'url' ? (
                                    <div>
                                        <label className="field-label required-label">Image URL</label>
                                        <input 
                                            value={form.image} 
                                            onChange={e => onChange('image', e.target.value)} 
                                            className="field-input"  
                                            placeholder="https://localhost:3000/assets/pokemon/"
                                            required
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="field-label required-label">Image (fichier)</label>
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={onFileChange}
                                            className="field-input file-input"
                                            required
                                        />
                                        <div className="upload-hint">PNG, JPG ou WEBP</div>
                                    </div>
                                )}
                                <div className="image-preview">
                                    {imagePreview || form.image ? (
                                        <img
                                            src={imagePreview || form.image}
                                            alt="Apercu"
                                            className="preview-img"
                                        />
                                    ) : (
                                        <span className="preview-placeholder">Apercu de l'image</span>
                                    )}
                                    <span className="preview-badge">
                                        {imageMode === 'url' ? 'Source: URL' : 'Source: Fichier'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3 className="section-title">🌍 Noms Internationaux</h3>
                            <div className="grid-2">
                                <div>
                                    <label className="field-label required-label">English</label>
                                    <input 
                                        value={form.nameEnglish} 
                                        onChange={e => onChange('nameEnglish', e.target.value)} 
                                        className="field-input" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="field-label">Francais</label>
                                    <input 
                                        value={form.nameFrench} 
                                        onChange={e => onChange('nameFrench', e.target.value)} 
                                        className="field-input" 
                                    />
                                </div>
                                <div>
                                    <label className="field-label">日本語 (Japanese)</label>
                                    <input 
                                        value={form.nameJapanese} 
                                        onChange={e => onChange('nameJapanese', e.target.value)} 
                                        className="field-input" 
                                    />
                                </div>
                                <div>
                                    <label className="field-label">中文 (Chinese)</label>
                                    <input 
                                        value={form.nameChinese} 
                                        onChange={e => onChange('nameChinese', e.target.value)} 
                                        className="field-input" 
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <fieldset className="fieldset-stats">
                            <legend>⚡ Statistiques de Base</legend>
                            <div className="grid-3">
                                <div>
                                    <label className="field-label">❤️ HP</label>
                                    <input 
                                        type="number" 
                                        value={form.hp} 
                                        onChange={e => onChange('hp', e.target.value)} 
                                        className="field-input" 
                                    />
                                </div>
                                <div>
                                    <label className="field-label">⚔️ Attack</label>
                                    <input 
                                        type="number" 
                                        value={form.attack} 
                                        onChange={e => onChange('attack', e.target.value)} 
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
                                        className="field-input" 
                                    />
                                </div>
                                <div>
                                    <label className="field-label">✨ Sp. Attack</label>
                                    <input 
                                        type="number" 
                                        value={form.spAtk} 
                                        onChange={e => onChange('spAtk', e.target.value)} 
                                        className="field-input" 
                                    />
                                </div>
                                <div>
                                    <label className="field-label">💎 Sp. Defense</label>
                                    <input 
                                        type="number" 
                                        value={form.spDef} 
                                        onChange={e => onChange('spDef', e.target.value)} 
                                        className="field-input" 
                                    />
                                </div>
                                <div>
                                    <label className="field-label">💨 Speed</label>
                                    <input 
                                        type="number" 
                                        value={form.speed} 
                                        onChange={e => onChange('speed', e.target.value)} 
                                        className="field-input" 
                                    />
                                </div>
                            </div>
                        </fieldset>
                        
                        <div className="form-section">
                            <h3 className="section-title">🏷️ Types</h3>
                            <label className="field-label required-label">Types</label>
                            <div className="type-chips">
                                {typeOptions.map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        className={
                                            selectedTypes.includes(type)
                                                ? "type-chip is-selected"
                                                : "type-chip"
                                        }
                                        aria-pressed={selectedTypes.includes(type)}
                                        onClick={() => toggleType(type)}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <div className="type-hint">Veuillez cliquer pour ajouter ou retirer un type.</div>
                            <div className="type-count">
                                {selectedTypes.length === 0
                                    ? 'Aucun type selectionne.'
                                    : `${selectedTypes.length} type(s) selectionne(s).`}
                            </div>
                        </div>
                        
                        <button type="submit" className="submit-button" disabled={isUploading}>
                            {isUploading ? 'Televersement en cours...' : '✅ Ajouter le Pokemon'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
