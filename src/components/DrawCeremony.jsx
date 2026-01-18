import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const DrawCeremony = ({ teams, mode, onComplete }) => {
    const [displayFixture, setDisplayFixture] = useState(null);
    const [shuffling, setShuffling] = useState(true);

    // Helper to generate fixtures
    const generateFixtures = () => {
        let fixtures = [];
        if (mode === 'LEAGUE') {
            for (let i = 0; i < teams.length; i++) {
                for (let j = i + 1; j < teams.length; j++) {
                    fixtures.push({
                        id: `match_${i}_${j}`,
                        home: teams[i],
                        away: teams[j],
                        played: false
                    });
                }
            }
        } else {
            const shuffled = [...teams].sort(() => 0.5 - Math.random());
            for (let i = 0; i < shuffled.length; i += 2) {
                if (i + 1 < shuffled.length) {
                    fixtures.push({
                        id: `cup_r1_${i}`,
                        home: shuffled[i],
                        away: shuffled[i + 1],
                        round: 1,
                        played: false
                    });
                } else {
                    fixtures.push({
                        id: `cup_bye_${i}`,
                        home: shuffled[i],
                        away: 'BYE',
                        round: 1,
                        played: true,
                        winner: shuffled[i]
                    })
                }
            }
        }
        return fixtures.sort(() => 0.5 - Math.random());
    };

    useEffect(() => {
        const fixtures = generateFixtures();
        let count = 0;
        const interval = setInterval(() => {
            const r1 = teams[Math.floor(Math.random() * teams.length)];
            const r2 = teams[Math.floor(Math.random() * teams.length)];
            setDisplayFixture(`${r1} VS ${r2}`);
            count++;

            if (count > 20) {
                clearInterval(interval);
                setShuffling(false);
                setDisplayFixture("DRAW COMPLETE");
                setTimeout(() => {
                    onComplete(fixtures);
                }, 1000);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [teams, mode]);

    return (
        <div className="draw-container">
            <motion.h2
                className="draw-title"
                animate={{ scale: [1, 1.05, 1], textShadow: ["0 0 10px #fff", "0 0 20px #00ff88", "0 0 10px #fff"] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                DRAWING...
            </motion.h2>

            <div className="glass-panel draw-box">
                <h1 className="draw-result neon-text">
                    {displayFixture}
                </h1>
            </div>
        </div>
    );
};

export default DrawCeremony;
