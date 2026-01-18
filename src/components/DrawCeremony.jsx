import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const DrawCeremony = ({ teams, mode, onComplete }) => {
    const [displayFixture, setDisplayFixture] = useState(null);
    const [shuffling, setShuffling] = useState(true);

    // Helper to generate fixtures
    const generateFixtures = () => {
        let fixtures = [];
        if (mode === 'LEAGUE') {
            // Double Round Robin or Single? Let's do Single for simplicity first
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
            // Cup - Simple pairing
            const shuffled = [...teams].sort(() => 0.5 - Math.random());
            // Handle byes if needed (implied: power of 2 or just random pairs)
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
                    // Bye
                    fixtures.push({
                        id: `cup_bye_${i}`,
                        home: shuffled[i],
                        away: 'BYE',
                        round: 1,
                        played: true,
                        winner: shuffled[i] // Auto advance
                    })
                }
            }
        }
        return fixtures.sort(() => 0.5 - Math.random());
    };

    useEffect(() => {
        const fixtures = generateFixtures();

        // Animation sequence
        let count = 0;
        const interval = setInterval(() => {
            // Show random potential matchups
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
        <div className="flex flex-col items-center justify-center p-10 text-center">
            <motion.h2
                className="text-6xl font-header mb-10 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                DRAWING...
            </motion.h2>

            <div className="glass-panel p-10 w-full max-w-xl">
                <h1 className="text-5xl text-accent font-bold font-header">
                    {displayFixture}
                </h1>
            </div>
        </div>
    );
};

export default DrawCeremony;
