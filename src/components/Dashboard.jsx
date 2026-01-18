import React, { useState } from 'react';
import { Calendar, TrendingUp, Home, Edit2, Check, X, Lock } from 'lucide-react';

const ADMIN_PASSWORD = 'halilhoca...com';

const Dashboard = ({ teams, fixtures, results, mode, onStartMatch, onGoHome, onUpdateResult }) => {
    const [activeTab, setActiveTab] = useState('FIXTURES');
    const [editingMatch, setEditingMatch] = useState(null);
    const [editScores, setEditScores] = useState({ home: 0, away: 0 });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingEditMatch, setPendingEditMatch] = useState(null);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    const displayFixtures = fixtures.filter(f => f.away !== 'BYE');

    const handleEditClick = (match) => {
        if (isAuthenticated) {
            startEditing(match);
        } else {
            setPendingEditMatch(match);
            setShowPasswordModal(true);
            setPasswordInput('');
            setPasswordError(false);
        }
    };

    const handlePasswordSubmit = () => {
        if (passwordInput === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            setShowPasswordModal(false);
            if (pendingEditMatch) {
                startEditing(pendingEditMatch);
            }
        } else {
            setPasswordError(true);
        }
    };

    const startEditing = (match) => {
        const currentResult = results[match.id] || { homeScore: 0, awayScore: 0 };
        setEditingMatch(match.id);
        setEditScores({ home: currentResult.homeScore, away: currentResult.awayScore });
    };

    const saveEdit = (matchId) => {
        onUpdateResult(matchId, {
            homeScore: editScores.home,
            awayScore: editScores.away,
            cards: results[matchId]?.cards || { home: { yellow: 0, red: 0 }, away: { yellow: 0, red: 0 } }
        });
        setEditingMatch(null);
    };

    const cancelEdit = () => {
        setEditingMatch(null);
    };

    return (
        <div className="dashboard-container">
            {/* Password Modal */}
            {showPasswordModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-panel">
                        <div className="modal-header">
                            <Lock size={24} className="modal-icon" />
                            <h3>Şifre Gerekli</h3>
                        </div>
                        <p>Skoru düzenlemek için yönetici şifresini girin:</p>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                            placeholder="Şifre"
                            className={`password-input ${passwordError ? 'error' : ''}`}
                            autoFocus
                        />
                        {passwordError && <span className="error-text">Yanlış şifre!</span>}
                        <div className="modal-buttons">
                            <button onClick={() => setShowPasswordModal(false)} className="btn-cancel">İptal</button>
                            <button onClick={handlePasswordSubmit} className="btn-confirm">Onayla</button>
                        </div>
                    </div>
                </div>
            )}

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
                            const isEditing = editingMatch === match.id;

                            return (
                                <div key={match.id} className="fixture-card">
                                    <div className="team-home">{match.home}</div>

                                    <div className="match-status">
                                        {isEditing ? (
                                            <div className="edit-score-inline">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={editScores.home}
                                                    onChange={(e) => setEditScores({ ...editScores, home: parseInt(e.target.value) || 0 })}
                                                    className="score-input"
                                                />
                                                <span>-</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={editScores.away}
                                                    onChange={(e) => setEditScores({ ...editScores, away: parseInt(e.target.value) || 0 })}
                                                    className="score-input"
                                                />
                                                <button onClick={() => saveEdit(match.id)} className="btn-save-score"><Check size={16} /></button>
                                                <button onClick={cancelEdit} className="btn-cancel-score"><X size={16} /></button>
                                            </div>
                                        ) : isPlayed ? (
                                            <div className="score-with-edit">
                                                <span className="score-final">
                                                    {results[match.id].homeScore} - {results[match.id].awayScore}
                                                </span>
                                                <button onClick={() => handleEditClick(match)} className="btn-edit-score">
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>
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
