import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Trophy, List, Edit2, Check, Trash2 } from 'lucide-react';

const Setup = ({ onStart, activeTournaments = [], onResumeTournament, onDeleteTournament }) => {
    const [names, setNames] = useState([]);
    const [currentName, setCurrentName] = useState('');
    const [mode, setMode] = useState('LEAGUE');
    const [editingIndex, setEditingIndex] = useState(null);
    const [editValue, setEditValue] = useState('');

    const addName = () => {
        if (currentName.trim() && !names.includes(currentName.trim())) {
            setNames([...names, currentName.trim()]);
            setCurrentName('');
        }
    };

    const removeName = (name) => {
        setNames(names.filter(n => n !== name));
    };

    const startEdit = (index, name) => {
        setEditingIndex(index);
        setEditValue(name);
    };

    const saveEdit = (index) => {
        if (editValue.trim() && !names.includes(editValue.trim())) {
            const newNames = [...names];
            newNames[index] = editValue.trim();
            setNames(newNames);
        }
        setEditingIndex(null);
        setEditValue('');
    };

    const handleStart = () => {
        if (names.length < 2) return alert('En az 2 takım gerekli!');
        onStart(names, mode);
    };

    const handleDeleteTournament = (e, tournamentId) => {
        e.stopPropagation();
        if (confirm('Bu turnuvayı silmek istediğinize emin misiniz?')) {
            onDeleteTournament(tournamentId);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="setup-page"
        >
            {/* Active Tournaments Section */}
            {activeTournaments.length > 0 && (
                <div className="active-tournaments glass-panel">
                    <h2>Aktif Turnuvalar</h2>
                    <div className="tournament-list">
                        {activeTournaments.map((t, i) => (
                            <div key={t.id || i} className="tournament-item" onClick={() => onResumeTournament(t)}>
                                <div className="tournament-info">
                                    <span className="tournament-name">{t.name || `Turnuva ${i + 1}`}</span>
                                    <span className="tournament-meta">{t.teams.length} takım • {t.mode === 'LEAGUE' ? 'Lig' : 'Kupa'}</span>
                                </div>
                                <div className="tournament-actions">
                                    <span className="resume-btn">Devam Et →</span>
                                    <button
                                        className="btn-delete-tournament"
                                        onClick={(e) => handleDeleteTournament(e, t.id)}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* New Tournament Form */}
            <div className="setup-container glass-panel">
                <div className="setup-header">
                    <h1 className="neon-text">YENİ TURNUVA</h1>
                    <p className="subtitle">Şampiyonluğa hazır mısın?</p>
                </div>

                {/* Input Section */}
                <div className="input-group">
                    <input
                        type="text"
                        value={currentName}
                        onChange={(e) => setCurrentName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addName()}
                        placeholder="Takım Adı Girin"
                        className="team-input"
                    />
                    <button onClick={addName} className="btn-icon bg-accent">
                        <Plus size={24} />
                    </button>
                </div>

                {/* Team List */}
                <div className="team-list">
                    {names.map((name, index) => (
                        <motion.div
                            key={name}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            layout
                            className="team-item"
                        >
                            {editingIndex === index ? (
                                <>
                                    <input
                                        type="text"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && saveEdit(index)}
                                        className="edit-input"
                                        autoFocus
                                    />
                                    <button onClick={() => saveEdit(index)} className="btn-edit-save">
                                        <Check size={16} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="team-name">{name}</span>
                                    <div className="team-actions">
                                        <button onClick={() => startEdit(index, name)} className="btn-edit">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => removeName(name)} className="btn-delete">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    ))}
                    {names.length === 0 && <p className="empty-msg">Henüz takım eklenmedi.</p>}
                </div>

                {/* Mode Selection */}
                <div className="mode-selection">
                    <button
                        onClick={() => setMode('LEAGUE')}
                        className={`mode-btn ${mode === 'LEAGUE' ? 'active' : ''}`}
                    >
                        <List size={20} /> Lig
                    </button>
                    <button
                        onClick={() => setMode('CUP')}
                        className={`mode-btn ${mode === 'CUP' ? 'active' : ''}`}
                    >
                        <Trophy size={20} /> Kupa
                    </button>
                </div>

                <button
                    onClick={handleStart}
                    disabled={names.length < 2}
                    className="btn-start"
                >
                    TURNUVAYI BAŞLAT
                </button>
            </div>
        </motion.div>
    );
};

export default Setup;
