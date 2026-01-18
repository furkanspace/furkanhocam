import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Minus } from 'lucide-react';

const MatchView = ({ match, onFinish, onBack }) => {
    const [homeScore, setHomeScore] = useState(0);
    const [awayScore, setAwayScore] = useState(0);
    const [homeYellow, setHomeYellow] = useState(0);
    const [homeRed, setHomeRed] = useState(0);
    const [awayYellow, setAwayYellow] = useState(0);
    const [awayRed, setAwayRed] = useState(0);

    const changeScore = (team, delta) => {
        if (team === 'home') {
            setHomeScore(Math.max(0, homeScore + delta));
        } else {
            setAwayScore(Math.max(0, awayScore + delta));
        }
    };

    const changeCard = (team, cardType, delta) => {
        if (team === 'home') {
            if (cardType === 'yellow') {
                setHomeYellow(Math.max(0, homeYellow + delta));
            } else {
                setHomeRed(Math.max(0, homeRed + delta));
            }
        } else {
            if (cardType === 'yellow') {
                setAwayYellow(Math.max(0, awayYellow + delta));
            } else {
                setAwayRed(Math.max(0, awayRed + delta));
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="match-container"
        >
            {/* Top Bar */}
            <div className="match-header">
                <button onClick={onBack} className="btn-back">
                    <ArrowLeft className="icon" /> Geri
                </button>
            </div>

            {/* Scoreboard Area */}
            <div className="scoreboard">

                {/* Home Team */}
                <div className="team-column">
                    <span className="team-label home-label">EV SAHİBİ</span>
                    <h2 className="team-title">{match.home}</h2>
                    <div className="score-display">
                        {homeScore}
                    </div>

                    {/* Score Controls */}
                    <div className="score-controls">
                        <button onClick={() => changeScore('home', -1)} className="btn-control minus">
                            <Minus size={20} />
                        </button>
                        <span className="control-label">GOL</span>
                        <button onClick={() => changeScore('home', 1)} className="btn-control plus">
                            <Plus size={20} />
                        </button>
                    </div>

                    {/* Card Controls */}
                    <div className="card-row">
                        <div className="card-control-group">
                            <button onClick={() => changeCard('home', 'yellow', -1)} className="btn-card-sm minus-card">-</button>
                            <div className="card-display yellow-card">{homeYellow}</div>
                            <button onClick={() => changeCard('home', 'yellow', 1)} className="btn-card-sm plus-card">+</button>
                        </div>
                        <div className="card-control-group">
                            <button onClick={() => changeCard('home', 'red', -1)} className="btn-card-sm minus-card">-</button>
                            <div className="card-display red-card">{homeRed}</div>
                            <button onClick={() => changeCard('home', 'red', 1)} className="btn-card-sm plus-card">+</button>
                        </div>
                    </div>
                </div>

                <div className="vs-divider">VS</div>

                {/* Away Team */}
                <div className="team-column">
                    <span className="team-label away-label">DEPLASMAN</span>
                    <h2 className="team-title">{match.away}</h2>
                    <div className="score-display">
                        {awayScore}
                    </div>

                    {/* Score Controls */}
                    <div className="score-controls">
                        <button onClick={() => changeScore('away', -1)} className="btn-control minus">
                            <Minus size={20} />
                        </button>
                        <span className="control-label">GOL</span>
                        <button onClick={() => changeScore('away', 1)} className="btn-control plus">
                            <Plus size={20} />
                        </button>
                    </div>

                    {/* Card Controls */}
                    <div className="card-row">
                        <div className="card-control-group">
                            <button onClick={() => changeCard('away', 'yellow', -1)} className="btn-card-sm minus-card">-</button>
                            <div className="card-display yellow-card">{awayYellow}</div>
                            <button onClick={() => changeCard('away', 'yellow', 1)} className="btn-card-sm plus-card">+</button>
                        </div>
                        <div className="card-control-group">
                            <button onClick={() => changeCard('away', 'red', -1)} className="btn-card-sm minus-card">-</button>
                            <div className="card-display red-card">{awayRed}</div>
                            <button onClick={() => changeCard('away', 'red', 1)} className="btn-card-sm plus-card">+</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="match-footer">
                <button
                    onClick={() => onFinish(match.id, {
                        homeScore,
                        awayScore,
                        cards: {
                            home: { yellow: homeYellow, red: homeRed },
                            away: { yellow: awayYellow, red: awayRed }
                        }
                    })}
                    className="btn-finish"
                >
                    MAÇI BİTİR
                </button>
            </div>
        </motion.div>
    );
};

export default MatchView;
