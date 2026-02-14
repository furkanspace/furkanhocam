import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft, Trophy, TrendingUp, TrendingDown,
    ChevronUp, ChevronDown, Minus, Crown, Users, Zap
} from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5001';
const getToken = () => localStorage.getItem('token');
const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

const LEAGUE_STYLES = {
    bronze: { gradient: 'linear-gradient(135deg, #cd7f32, #8b5e3c)', glow: 'rgba(205,127,50,0.3)' },
    silver: { gradient: 'linear-gradient(135deg, #c0c0c0, #808080)', glow: 'rgba(192,192,192,0.3)' },
    gold: { gradient: 'linear-gradient(135deg, #ffd700, #b8860b)', glow: 'rgba(255,215,0,0.3)' },
    platinum: { gradient: 'linear-gradient(135deg, #00b4d8, #0077b6)', glow: 'rgba(0,180,216,0.3)' },
    diamond: { gradient: 'linear-gradient(135deg, #b388ff, #7c4dff)', glow: 'rgba(179,136,255,0.3)' },
};

const LeaguePage = ({ onBack }) => {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedLeague, setSelectedLeague] = useState(null);

    useEffect(() => { fetchStandings(); }, []);

    const fetchStandings = async (leagueId) => {
        try {
            setLoading(true);
            const url = leagueId
                ? `${API_BASE}/api/leagues/standings?league=${leagueId}`
                : `${API_BASE}/api/leagues/standings`;
            const res = await fetch(url, { headers: headers() });
            if (res.ok) {
                const d = await res.json();
                setData(d);
                if (!selectedLeague) setSelectedLeague(d.myLeague?.id || 'bronze');
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleLeagueSwitch = (leagueId) => {
        setSelectedLeague(leagueId);
        fetchStandings(leagueId);
    };

    const isAdmin = user?.role === 'admin';

    const handlePromote = async () => {
        if (!confirm('Haftalık lig güncellemesini çalıştır? (Terfi/düşme uygulanacak)')) return;
        try {
            const res = await fetch(`${API_BASE}/api/leagues/promote`, {
                method: 'POST', headers: headers()
            });
            const result = await res.json();
            alert(`${result.results?.promoted?.length || 0} terfi, ${result.results?.relegated?.length || 0} düşme uygulandı`);
            fetchStandings(selectedLeague);
        } catch (e) { console.error(e); alert('Hata oluştu'); }
    };

    if (loading && !data) {
        return (
            <div className="league-page">
                <div className="league-loading">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Trophy size={32} />
                    </motion.div>
                    <p>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    const league = data?.league;
    const myLeague = data?.myLeague;
    const standings = data?.standings || [];
    const allLeagues = data?.allLeagues || [];
    const style = LEAGUE_STYLES[league?.id] || LEAGUE_STYLES.bronze;
    const isMyLeague = league?.id === myLeague?.id;

    return (
        <div className="league-page">
            <div className="league-header-bar">
                <motion.button className="sp-btn-back" onClick={onBack} whileHover={{ scale: 1.05 }}>
                    <ArrowLeft size={20} /> Geri
                </motion.button>
                {isAdmin && (
                    <motion.button className="league-promote-btn" onClick={handlePromote} whileHover={{ scale: 1.05 }}>
                        <TrendingUp size={16} /> Haftalık Güncelle
                    </motion.button>
                )}
            </div>

            {/* League Banner */}
            <motion.div
                className="league-banner"
                style={{ background: style.gradient, boxShadow: `0 8px 32px ${style.glow}` }}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            >
                <span className="league-banner-emoji">{league?.emoji}</span>
                <div className="league-banner-info">
                    <h1>{league?.name} Ligi</h1>
                    <p><Users size={14} /> {standings.length} oyuncu • Haftalık XP sıralaması</p>
                </div>
                {data?.myRank > 0 && isMyLeague && (
                    <div className="league-banner-rank">
                        <span className="lbr-num">#{data.myRank}</span>
                        <span className="lbr-label">Sıran</span>
                    </div>
                )}
            </motion.div>

            {/* League Tabs */}
            <div className="league-tabs">
                {allLeagues.map(l => (
                    <button
                        key={l.id}
                        className={`league-tab ${selectedLeague === l.id ? 'active' : ''} ${l.id === myLeague?.id ? 'my-league' : ''}`}
                        onClick={() => handleLeagueSwitch(l.id)}
                        style={selectedLeague === l.id ? { borderColor: l.color, color: l.color } : {}}
                    >
                        {l.emoji}
                        <span className="lt-name">{l.name}</span>
                    </button>
                ))}
            </div>

            {/* Standings Table */}
            <motion.div className="league-standings glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                {standings.length === 0 ? (
                    <div className="league-empty">
                        <Trophy size={40} />
                        <p>Bu ligde henüz oyuncu yok</p>
                    </div>
                ) : (
                    <div className="league-table">
                        <div className="league-table-header">
                            <span className="lth-rank">#</span>
                            <span className="lth-name">Oyuncu</span>
                            <span className="lth-xp">Haftalık XP</span>
                            <span className="lth-quiz">Quiz</span>
                            <span className="lth-acc">Doğruluk</span>
                            <span className="lth-zone">Durum</span>
                        </div>
                        {standings.map((s, i) => (
                            <motion.div
                                key={s._id}
                                className={`league-row ${s.isMe ? 'league-row-me' : ''} league-row-${s.zone}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <span className="lr-rank">
                                    {s.rank <= 3 ? ['🥇', '🥈', '🥉'][s.rank - 1] : s.rank}
                                </span>
                                <span className="lr-name">
                                    {s.fullName}
                                    {s.isMe && <span className="lr-me-badge">Sen</span>}
                                </span>
                                <span className="lr-xp">
                                    <Zap size={14} /> {s.weeklyXP}
                                </span>
                                <span className="lr-quiz">{s.quizCount}</span>
                                <span className="lr-acc">{s.accuracy}%</span>
                                <span className="lr-zone">
                                    {s.zone === 'promotion' && <span className="zone-badge zone-up"><ChevronUp size={14} /> Terfi</span>}
                                    {s.zone === 'relegation' && <span className="zone-badge zone-down"><ChevronDown size={14} /> Düşme</span>}
                                    {s.zone === 'safe' && <span className="zone-badge zone-safe"><Minus size={14} /> Güvende</span>}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Legend */}
            <div className="league-legend">
                <span className="legend-item"><span className="legend-dot legend-dot-up" /> Terfi bölgesi (üst %25)</span>
                <span className="legend-item"><span className="legend-dot legend-dot-safe" /> Güvenli bölge</span>
                <span className="legend-item"><span className="legend-dot legend-dot-down" /> Düşme bölgesi (alt %25)</span>
            </div>
        </div>
    );
};

export default LeaguePage;
