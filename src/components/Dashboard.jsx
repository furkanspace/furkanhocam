import React, { useState } from 'react';
import { Calendar, TrendingUp, Home } from 'lucide-react';

const Dashboard = ({ teams, fixtures, results, mode, onStartMatch, onGoHome }) => {
    const [activeTab, setActiveTab] = useState('FIXTURES'); // FIXTURES, STANDINGS

    const getStandings = () => {
        const stats = {};
        teams.forEach(t => {
            stats[t] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
        });

        Object.keys(results).forEach(matchId => {
            const res = results[matchId];
            const match = fixtures.find(f => f.id === matchId);
            if (!match) return;

            stats[match.home].p += 1;
            stats[match.away].p += 1;
            stats[match.home].gf += res.homeScore;
            stats[match.home].ga += res.awayScore;
            stats[match.away].gf += res.awayScore;
            stats[match.away].ga += res.homeScore;

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

    // Filter out BYE matches from display
    const displayFixtures = fixtures.filter(f => f.away !== 'BYE');

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-left">
                    <button onClick={onGoHome} className="btn-home">
                        <Home size={20} />
                        Ana Sayfa
                    </button>
                    <h1>TURNUVA</h1>
                </div>
                <div className="tab-controls">
                    <button
                        onClick={() => setActiveTab('FIXTURES')}
                        className={`tab-btn ${activeTab === 'FIXTURES' ? 'active' : ''}`}
                    >
                        <Calendar size={18} className="icon" />Fikstür
                    </button>
                    {mode === 'LEAGUE' && (
                        <button
                            onClick={() => setActiveTab('STANDINGS')}
                            className={`tab-btn ${activeTab === 'STANDINGS' ? 'active' : ''}`}
                        >
                            <TrendingUp size={18} className="icon" />Puan Durumu
                        </button>
                    )}
                </div>
            </div>

            <div className="glass-panel content-area">
                {activeTab === 'FIXTURES' && (
                    <div className="fixtures-list">
                        {displayFixtures.length === 0 && (
                            <p className="empty-msg">Henüz maç yok.</p>
                        )}
                        {displayFixtures.map(match => {
                            const isPlayed = results[match.id];
                            return (
                                <div key={match.id} className="fixture-card">
                                    <div className="team-home">{match.home}</div>

                                    <div className="match-status">
                                        {isPlayed ? (
                                            <span className="score-final">
                                                {results[match.id].homeScore} - {results[match.id].awayScore}
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => onStartMatch(match)}
                                                className="btn-play"
                                            >
                                                OYNA
                                            </button>
                                        )}
                                        <span className="vs-label">
                                            {isPlayed ? 'BİTTİ' : 'VS'}
                                        </span>
                                    </div>

                                    <div className="team-away">{match.away}</div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'STANDINGS' && (
                    <table className="standings-table">
                        <thead>
                            <tr>
                                <th>Sıra</th>
                                <th>Takım</th>
                                <th>O</th>
                                <th>G</th>
                                <th>B</th>
                                <th>M</th>
                                <th>AV</th>
                                <th className="highlight-text">P</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standings.map((team, index) => (
                                <tr key={team.name}>
                                    <td className="mono-text">{index + 1}</td>
                                    <td className="bold-text">{team.name}</td>
                                    <td>{team.p}</td>
                                    <td>{team.w}</td>
                                    <td>{team.d}</td>
                                    <td>{team.l}</td>
                                    <td className="mono-text">{(team.gf - team.ga) > 0 ? `+${team.gf - team.ga}` : team.gf - team.ga}</td>
                                    <td className="points-cell">{team.pts}</td>
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
