import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp } from 'lucide-react';

const Dashboard = ({ teams, fixtures, results, mode, onStartMatch }) => {
    const [activeTab, setActiveTab] = useState('FIXTURES'); // FIXTURES, STANDINGS

    // Calculate Standings
    const getStandings = () => {
        const stats = {};
        teams.forEach(t => {
            stats[t] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
        });

        Object.keys(results).forEach(matchId => {
            const res = results[matchId];
            const match = fixtures.find(f => f.id === matchId);
            if (!match) return; // Should not happen

            // Update Played
            stats[match.home].p += 1;
            stats[match.away].p += 1;

            // Update Goals
            stats[match.home].gf += res.homeScore;
            stats[match.home].ga += res.awayScore;
            stats[match.away].gf += res.awayScore;
            stats[match.away].ga += res.homeScore;

            // Update W/D/L & Pts
            if (res.homeScore > res.awayScore) {
                stats[match.home].w += 1;
                stats[match.home].pts += 3;
                stats[match.away].l += 1;
            } else if (res.awayScore > res.homeScore) {
                stats[match.away].w += 1;
                stats[match.away].pts += 3;
                stats[match.home].l += 1;
            } else {
                stats[match.home].d += 1;
                stats[match.home].pts += 1;
                stats[match.away].d += 1;
                stats[match.away].pts += 1;
            }
        });

        return Object.entries(stats)
            .sort((a, b) => b[1].pts - a[1].pts || (b[1].gf - b[1].ga) - (a[1].gf - a[1].ga))
            .map(([name, stat]) => ({ name, ...stat }));
    };

    const standings = getStandings();

    return (
        <div className="w-full max-w-4xl px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl italic font-bold">Tournament Dashboard</h1>
                <div className="flex gap-2 bg-black/40 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('FIXTURES')}
                        className={`px-4 py-2 rounded-md ${activeTab === 'FIXTURES' ? 'bg-accent text-black font-bold' : 'text-secondary hover:text-white'}`}
                    >
                        <Calendar size={18} className="inline mr-2" />Fixtures
                    </button>
                    {mode === 'LEAGUE' && (
                        <button
                            onClick={() => setActiveTab('STANDINGS')}
                            className={`px-4 py-2 rounded-md ${activeTab === 'STANDINGS' ? 'bg-accent text-black font-bold' : 'text-secondary hover:text-white'}`}
                        >
                            <TrendingUp size={18} className="inline mr-2" />Standings
                        </button>
                    )}
                </div>
            </div>

            <div className="glass-panel p-6 min-h-[500px]">
                {activeTab === 'FIXTURES' && (
                    <div className="grid gap-4">
                        {fixtures.map(match => {
                            const isPlayed = results[match.id];
                            return (
                                <div key={match.id} className="flex items-center justify-between bg-white/5 p-4 rounded hover:bg-white/10 transition">
                                    <div className="flex-1 text-right text-xl font-bold">{match.home}</div>

                                    <div className="px-6 flex flex-col items-center">
                                        {isPlayed ? (
                                            <span className="text-2xl font-mono text-accent">
                                                {results[match.id].homeScore} - {results[match.id].awayScore}
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => onStartMatch(match)}
                                                className="bg-white/10 px-4 py-1 rounded text-sm hover:bg-accent hover:text-black transition"
                                            >
                                                PLAY
                                            </button>
                                        )}
                                        <span className="text-xs text-secondary mt-1">
                                            {isPlayed ? 'FT' : 'VS'}
                                        </span>
                                    </div>

                                    <div className="flex-1 text-left text-xl font-bold">{match.away}</div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'STANDINGS' && (
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-secondary border-b border-white/10">
                                <th className="p-3">Pos</th>
                                <th className="p-3">Team</th>
                                <th className="p-3 text-center">P</th>
                                <th className="p-3 text-center">W</th>
                                <th className="p-3 text-center">D</th>
                                <th className="p-3 text-center">L</th>
                                <th className="p-3 text-center">GD</th>
                                <th className="p-3 text-center text-accent">Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standings.map((team, index) => (
                                <tr key={team.name} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="p-3 font-mono text-secondary">{index + 1}</td>
                                    <td className="p-3 font-bold">{team.name}</td>
                                    <td className="p-3 text-center">{team.p}</td>
                                    <td className="p-3 text-center">{team.w}</td>
                                    <td className="p-3 text-center">{team.d}</td>
                                    <td className="p-3 text-center">{team.l}</td>
                                    <td className="p-3 text-center font-mono">{(team.gf - team.ga) > 0 ? `+${team.gf - team.ga}` : team.gf - team.ga}</td>
                                    <td className="p-3 text-center font-bold text-accent text-lg">{team.pts}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
