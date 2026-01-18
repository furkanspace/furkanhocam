import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Trophy, List } from 'lucide-react';

const Setup = ({ onStart }) => {
    const [names, setNames] = useState([]);
    const [currentName, setCurrentName] = useState('');
    const [mode, setMode] = useState('LEAGUE');

    const addName = () => {
        if (currentName.trim() && !names.includes(currentName.trim())) {
            setNames([...names, currentName.trim()]);
            setCurrentName('');
        }
    };

    const removeName = (name) => {
        setNames(names.filter(n => n !== name));
    };

    const handleStart = () => {
        if (names.length < 2) return alert('At least 2 teams required!');
        onStart(names, mode);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="setup-container glass-panel"
        >
            <div className="setup-header">
                <h1 className="neon-text">TOURNAMENT SETUP</h1>
                <p className="subtitle">Prepare for glory.</p>
            </div>

            {/* Input Section */}
            <div className="input-group">
                <input
                    type="text"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addName()}
                    placeholder="Enter Team Name"
                    className="team-input"
                />
                <button onClick={addName} className="btn-icon bg-accent">
                    <Plus size={24} />
                </button>
            </div>

            {/* Team List */}
            <div className="team-list">
                {names.map(name => (
                    <motion.div
                        key={name}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        layout
                        className="team-item"
                    >
                        <span className="team-name">{name}</span>
                        <button onClick={() => removeName(name)} className="btn-delete">
                            <X size={18} />
                        </button>
                    </motion.div>
                ))}
                {names.length === 0 && <p className="empty-msg">No teams added yet.</p>}
            </div>

            {/* Mode Selection */}
            <div className="mode-selection">
                <button
                    onClick={() => setMode('LEAGUE')}
                    className={`mode-btn ${mode === 'LEAGUE' ? 'active' : ''}`}
                >
                    <List size={20} /> League
                </button>
                <button
                    onClick={() => setMode('CUP')}
                    className={`mode-btn ${mode === 'CUP' ? 'active' : ''}`}
                >
                    <Trophy size={20} /> Cup
                </button>
            </div>

            <button
                onClick={handleStart}
                disabled={names.length < 2}
                className="btn-start"
            >
                START TOURNAMENT
            </button>
        </motion.div>
    );
};

export default Setup;
