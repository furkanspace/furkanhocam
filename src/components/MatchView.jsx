import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock } from 'lucide-react';

const MatchView = ({ match, onFinish, onBack }) => {
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [cards, setCards] = useState({ home: [], away: [] }); // Array of 'Y' or 'R'
    const [lastAction, setLastAction] = useState(null); // For animation popup

    const addGoal = (team) => {
        if (team === 'home') setHomeScore(h => h + 1);
        else setAwayScore(a => a + 1);
        triggerAction('GOAL!');
    };

    const addCard = (team, type) => {
        setCards(prev => ({
            ...prev,
            [team]: [...prev[team], type]
        }));
        triggerAction(`${type === 'Y' ? 'YELLOW' : 'RED'} CARD!`);
    };

    const triggerAction = (text) => {
        setLastAction(text);
        setTimeout(() => setLastAction(null), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-screen flex flex-col relative"
        >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 p-4 z-10">
                <button onClick={onBack} className="flex items-center text-secondary hover:text-white">
                    <ArrowLeft className="mr-2" /> Back
                </button>
            </div>

            {/* Action Popup */}
            <AnimatePresence>
                {lastAction && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: -50 }}
                        animate={{ opacity: 1, scale: 1.5, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
                    >
                        <h1 className="text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-accent to-white drop-shadow-[0_0_20px_rgba(0,255,136,0.8)]">
                            {lastAction}
                        </h1>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scoreboard Area */}
            <div className="flex-1 flex items-center justify-center gap-20">

                {/* Home Team */}
                <div className="flex flex-col items-center">
                    <h2 className="text-5xl font-header mb-4">{match.home}</h2>
                    <div className="text-9xl font-mono font-bold text-white bg-black/40 p-10 rounded-3xl border-2 border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                        {homeScore}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={() => addGoal('home')}
                            className="bg-accent hover:bg-white text-black font-bold py-3 px-8 rounded-full text-xl shadow-lg hover:shadow-[0_0_20px_var(--accent)] transition-all"
                        >
                            GOAL
                        </button>
                        <div className="flex gap-2">
                            <button onClick={() => addCard('home', 'Y')} className="bg-warning w-12 h-12 rounded hover:scale-110 transition"></button>
                            <button onClick={() => addCard('home', 'R')} className="bg-danger w-12 h-12 rounded hover:scale-110 transition"></button>
                        </div>
                    </div>
                    <div className="flex gap-1 mt-2 min-h-[20px]">
                        {cards.home.map((c, i) => (
                            <div key={i} className={`w-3 h-4 rounded-sm ${c === 'Y' ? 'bg-warning' : 'bg-danger'}`} />
                        ))}
                    </div>
                </div>

                <div className="font-mono text-4xl text-secondary opacity-50">VS</div>

                {/* Away Team */}
                <div className="flex flex-col items-center">
                    <h2 className="text-5xl font-header mb-4">{match.away}</h2>
                    <div className="text-9xl font-mono font-bold text-white bg-black/40 p-10 rounded-3xl border-2 border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                        {awayScore}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={() => addGoal('away')}
                            className="bg-accent hover:bg-white text-black font-bold py-3 px-8 rounded-full text-xl shadow-lg hover:shadow-[0_0_20px_var(--accent)] transition-all"
                        >
                            GOAL
                        </button>
                        <div className="flex gap-2">
                            <button onClick={() => addCard('away', 'Y')} className="bg-warning w-12 h-12 rounded hover:scale-110 transition"></button>
                            <button onClick={() => addCard('away', 'R')} className="bg-danger w-12 h-12 rounded hover:scale-110 transition"></button>
                        </div>
                    </div>
                    <div className="flex gap-1 mt-2 min-h-[20px]">
                        {cards.away.map((c, i) => (
                            <div key={i} className={`w-3 h-4 rounded-sm ${c === 'Y' ? 'bg-warning' : 'bg-danger'}`} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 flex justify-center border-t border-white/10 bg-black/50 backdrop-blur-md">
                <button
                    onClick={() => onFinish(match.id, { homeScore, awayScore, cards })}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 py-4 px-12 rounded-xl text-xl font-bold tracking-widest transition"
                >
                    FINISH MATCH
                </button>
            </div>
        </motion.div>
    );
};

export default MatchView;
