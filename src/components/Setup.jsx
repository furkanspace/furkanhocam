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
            className="glass-panel p-8 w-full max-w-2xl text-center"
        >
            <h1 className="text-4xl mb-2 text-accent">Tournament Setup</h1>
            <p className="text-secondary mb-8">Prepare for glory.</p>

            {/* Input Section */}
            <div className="flex gap-4 mb-8">
                <input
                    type="text"
                    value={currentName}
                    onChange={(e) => setCurrentName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addName()}
                    placeholder="Enter Team Name"
                    className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors"
                    style={{ fontSize: '1.2rem' }}
                />
                <button
                    onClick={addName}
                    className="bg-accent text-black px-6 py-3 rounded-lg font-bold hover:bg-white transition-colors"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Team List */}
            <div className="grid grid-cols-2 gap-3 mb-8 max-h-60 overflow-y-auto pr-2">
                {names.map(name => (
                    <motion.div
                        key={name}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        layout
                        className="flex justify-between items-center bg-white/5 px-4 py-2 rounded border border-white/5"
                    >
                        <span className="font-semibold">{name}</span>
                        <button onClick={() => removeName(name)} className="text-secondary hover:text-danger">
                            <X size={18} />
                        </button>
                    </motion.div>
                ))}
                {names.length === 0 && <p className="col-span-2 text-secondary italic">No teams added yet.</p>}
            </div>

            {/* Mode Selection */}
            <div className="flex justify-center gap-4 mb-8">
                <button
                    onClick={() => setMode('LEAGUE')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${mode === 'LEAGUE' ? 'border-accent text-accent bg-accent/10' : 'border-transparent bg-white/5 text-secondary'}`}
                >
                    <List size={20} /> League
                </button>
                <button
                    onClick={() => setMode('CUP')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${mode === 'CUP' ? 'border-accent text-accent bg-accent/10' : 'border-transparent bg-white/5 text-secondary'}`}
                >
                    <Trophy size={20} /> Cup
                </button>
            </div>

            <button
                onClick={handleStart}
                disabled={names.length < 2}
                className="w-full bg-gradient-to-r from-accent to-accent-secondary py-4 rounded-xl text-black font-bold text-xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100"
            >
                Start Tournament
            </button>
        </motion.div>
    );
};

export default Setup;
