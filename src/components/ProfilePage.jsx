import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    User, Award, Star, TrendingUp,
    BookOpen, CheckCircle2, Target, Clock, ArrowLeft,
    Zap, Brain, Flame, Trophy
} from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5001';
const getToken = () => localStorage.getItem('token');
const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

// All badge definitions with display info
const BADGE_DEFS = [
    // Ders rozetleri
    { id: 'first_lesson', name: 'İlk Ders', desc: 'İlk dersini tamamla', icon: '🎓', category: 'lesson', target: 1 },
    { id: 'streak_3', name: '3 Ders Serisi', desc: '3 ders tamamla', icon: '🔥', category: 'lesson', target: 3 },
    { id: 'streak_7', name: '7 Ders Serisi', desc: '7 ders tamamla', icon: '⚡', category: 'lesson', target: 7 },
    { id: 'ten_done', name: '10 Ders', desc: '10 ders tamamla', icon: '📚', category: 'lesson', target: 10 },
    { id: 'twenty_done', name: '20 Ders', desc: '20 ders tamamla', icon: '🏆', category: 'lesson', target: 20 },
    { id: 'fifty_done', name: '50 Ders', desc: '50 ders tamamla', icon: '💎', category: 'lesson', target: 50 },
    { id: 'hundred_done', name: 'Ders Gurusu', desc: '100 ders tamamla', icon: '👨‍🏫', category: 'lesson', target: 100 },
    { id: 'perfect_week', name: 'Mükemmel Hafta', desc: 'Hiç kaçırmadan 5+ ders', icon: '🌟', category: 'lesson' },
    { id: 'makeup_hero', name: 'Telafi Kahramanı', desc: 'Bir telafi tamamla', icon: '🔄', category: 'lesson' },
    { id: 'high_pct', name: '%90 Devam', desc: '%90 üzeri devam oranı', icon: '🎯', category: 'lesson' },
    // Quiz rozetleri
    { id: 'first_quiz', name: 'İlk Quiz', desc: 'İlk quizini çöz', icon: '🧩', category: 'quiz', target: 1 },
    { id: 'quiz_fan', name: 'Quiz Meraklısı', desc: '5 quiz çöz', icon: '📝', category: 'quiz', target: 5 },
    { id: 'quiz_master', name: 'Quiz Ustası', desc: '25 quiz çöz', icon: '🧠', category: 'quiz', target: 25 },
    { id: 'perfect_score', name: 'Mükemmel Puan', desc: '10/10 skor al', icon: '💯', category: 'quiz' },
    { id: 'streak_start', name: 'Seri Başlangıcı', desc: '3 gün quiz serisi', icon: '🔥', category: 'quiz', target: 3 },
    { id: 'weekly_streak', name: 'Haftalık Seri', desc: '7 gün quiz serisi', icon: '⚡', category: 'quiz', target: 7 },
    { id: 'monthly_streak', name: 'Aylık Seri', desc: '30 gün quiz serisi', icon: '🌊', category: 'quiz', target: 30 },
    { id: 'xp_hunter', name: 'XP Avcısı', desc: '100 toplam XP kazan', icon: '💰', category: 'quiz', target: 100 },
    { id: 'xp_master', name: 'XP Ustası', desc: '500 toplam XP kazan', icon: '💎', category: 'quiz', target: 500 },
    { id: 'xp_legend', name: 'XP Efsanesi', desc: '1000 toplam XP kazan', icon: '👑', category: 'quiz', target: 1000 },
];

const LEVELS = [
    { min: 0, name: 'Çaylak', icon: '🌱', color: '#78716c' },
    { min: 50, name: 'Öğrenci', icon: '📖', color: '#3b82f6' },
    { min: 150, name: 'Azimli', icon: '💪', color: '#8b5cf6' },
    { min: 300, name: 'Uzman', icon: '⭐', color: '#f59e0b' },
    { min: 500, name: 'Usta', icon: '👑', color: '#ef4444' },
    { min: 1000, name: 'Efsane', icon: '🏆', color: '#00ff88' },
];

const ProfilePage = ({ onBack }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [badgeStates, setBadgeStates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'lesson', 'quiz'
    const [celebrateBadge, setCelebrateBadge] = useState(null);

    useEffect(() => { fetchBadgeData(); }, []);

    const fetchBadgeData = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/badges/my`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setBadgeStates(data.badges);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const totalXP = stats?.totalXP || 0;
    const currentLevel = [...LEVELS].reverse().find(l => totalXP >= l.min) || LEVELS[0];
    const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
    const progressToNext = nextLevel ? Math.min(100, ((totalXP - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100) : 100;

    const earnedBadges = BADGE_DEFS.filter(b => badgeStates.find(bs => bs.id === b.id)?.earned);
    const lockedBadges = BADGE_DEFS.filter(b => !badgeStates.find(bs => bs.id === b.id)?.earned);

    const filteredEarned = activeTab === 'all' ? earnedBadges : earnedBadges.filter(b => b.category === activeTab);
    const filteredLocked = activeTab === 'all' ? lockedBadges : lockedBadges.filter(b => b.category === activeTab);

    const getProgress = (badge) => {
        if (!stats || !badge.target) return null;
        const map = {
            'first_lesson': stats.lessonsDone, 'streak_3': stats.lessonsDone, 'streak_7': stats.lessonsDone,
            'ten_done': stats.lessonsDone, 'twenty_done': stats.lessonsDone, 'fifty_done': stats.lessonsDone,
            'hundred_done': stats.lessonsDone,
            'first_quiz': stats.quizCount, 'quiz_fan': stats.quizCount, 'quiz_master': stats.quizCount,
            'streak_start': stats.quizMaxStreak, 'weekly_streak': stats.quizMaxStreak, 'monthly_streak': stats.quizMaxStreak,
            'xp_hunter': stats.totalXP, 'xp_master': stats.totalXP, 'xp_legend': stats.totalXP,
        };
        const current = map[badge.id];
        if (current === undefined) return null;
        return { current: Math.min(current, badge.target), target: badge.target, pct: Math.min(100, (current / badge.target) * 100) };
    };

    const pct = stats ? (stats.lessonsTotal > 0 ? Math.round(((stats.lessonsDone + stats.lessonsMakeup) / stats.lessonsTotal) * 100) : 0) : 0;

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-loading">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Star size={32} />
                    </motion.div>
                    <p>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-header-bar">
                <motion.button className="sp-btn-back" onClick={onBack} whileHover={{ scale: 1.05 }}>
                    <ArrowLeft size={20} /> Geri
                </motion.button>
            </div>

            {/* Profile Card */}
            <motion.div className="profile-card glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="profile-avatar">
                    <span className="profile-avatar-icon">{currentLevel.icon}</span>
                </div>
                <h1 className="profile-name">{user?.fullName || 'Öğrenci'}</h1>
                <p className="profile-role">{user?.role === 'admin' ? 'Yönetici' : user?.role === 'staff' ? 'Öğretmen' : user?.role === 'parent' ? 'Veli' : 'Öğrenci'}</p>
                <div className="profile-level-info">
                    <span className="profile-level-name" style={{ color: currentLevel.color }}>
                        {currentLevel.icon} {currentLevel.name}
                    </span>
                    <span className="profile-xp">{totalXP} XP</span>
                </div>
                {nextLevel && (
                    <div className="profile-xp-bar">
                        <div className="profile-xp-fill" style={{ width: `${progressToNext}%`, background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})` }} />
                        <span className="profile-xp-label">Sonraki: {nextLevel.icon} {nextLevel.name} ({nextLevel.min} XP)</span>
                    </div>
                )}
            </motion.div>

            {/* Stats Grid */}
            <div className="profile-stats-grid">
                <motion.div className="profile-stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="psc-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}><BookOpen size={20} /></div>
                    <div className="psc-data">
                        <span className="psc-num">{stats?.lessonsDone || 0}</span>
                        <span className="psc-label">Ders Yapılan</span>
                    </div>
                </motion.div>
                <motion.div className="profile-stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="psc-icon" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}><Brain size={20} /></div>
                    <div className="psc-data">
                        <span className="psc-num">{stats?.quizCount || 0}</span>
                        <span className="psc-label">Quiz Çözülen</span>
                    </div>
                </motion.div>
                <motion.div className="profile-stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="psc-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}><Zap size={20} /></div>
                    <div className="psc-data">
                        <span className="psc-num">{totalXP}</span>
                        <span className="psc-label">Toplam XP</span>
                    </div>
                </motion.div>
                <motion.div className="profile-stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <div className="psc-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}><Flame size={20} /></div>
                    <div className="psc-data">
                        <span className="psc-num">{stats?.quizCurrentStreak || 0}</span>
                        <span className="psc-label">Quiz Serisi</span>
                    </div>
                </motion.div>
                <motion.div className="profile-stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div className="psc-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}><TrendingUp size={20} /></div>
                    <div className="psc-data">
                        <span className="psc-num">{stats?.quizPct || 0}%</span>
                        <span className="psc-label">Quiz Doğruluk</span>
                    </div>
                </motion.div>
                <motion.div className="profile-stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                    <div className="psc-icon" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4' }}><Target size={20} /></div>
                    <div className="psc-data">
                        <span className="psc-num">{pct}%</span>
                        <span className="psc-label">Ders Devam</span>
                    </div>
                </motion.div>
            </div>

            {/* XP Breakdown */}
            {stats && (
                <motion.div className="profile-xp-breakdown glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
                    <h3>📊 XP Detayları</h3>
                    <div className="pxb-grid">
                        <div className="pxb-item">
                            <span className="pxb-label">📚 Dersler</span>
                            <span className="pxb-val">+{stats.lessonXP || 0}</span>
                        </div>
                        <div className="pxb-item">
                            <span className="pxb-label">🧠 Quizler</span>
                            <span className="pxb-val">+{stats.quizXP || 0}</span>
                        </div>
                        <div className="pxb-item">
                            <span className="pxb-label">⚔️ Turnuvalar</span>
                            <span className="pxb-val">+{stats.tournamentXP || 0}</span>
                        </div>
                        <div className="pxb-item">
                            <span className="pxb-label">🌳 Beceri Ağacı</span>
                            <span className="pxb-val">+{stats.skillTreeXP || 0}</span>
                        </div>
                        <div className="pxb-item">
                            <span className="pxb-label">💎 Bonuslar</span>
                            <span className="pxb-val">+{stats.bonusXP || (activeTab === 'bonus' ? stats.bonusXP : (totalXP - (stats.lessonXP + stats.quizXP + (stats.tournamentXP || 0) + (stats.skillTreeXP || 0))))}</span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Badges Section */}
            <motion.div className="profile-section glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="badge-section-header">
                    <h2><Award size={22} /> Rozetler <span className="profile-badge-count">{earnedBadges.length}/{BADGE_DEFS.length}</span></h2>
                    <div className="badge-tabs">
                        <button className={`badge-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>Tümü</button>
                        <button className={`badge-tab ${activeTab === 'lesson' ? 'active' : ''}`} onClick={() => setActiveTab('lesson')}>📚 Ders</button>
                        <button className={`badge-tab ${activeTab === 'quiz' ? 'active' : ''}`} onClick={() => setActiveTab('quiz')}>🧠 Quiz</button>
                    </div>
                </div>

                {/* Earned Badges */}
                {filteredEarned.length > 0 && (
                    <div className="badge-group">
                        <h3 className="badge-group-title">✅ Kazanılan ({filteredEarned.length})</h3>
                        <div className="profile-badges">
                            {filteredEarned.map((b, i) => (
                                <motion.div
                                    key={b.id}
                                    className="profile-badge earned"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ scale: 1.05, y: -4 }}
                                >
                                    <span className="pb-icon">{b.icon}</span>
                                    <span className="pb-name">{b.name}</span>
                                    <span className="pb-desc">{b.desc}</span>
                                    <div className="pb-earned-check">✓</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Locked Badges */}
                {filteredLocked.length > 0 && (
                    <div className="badge-group">
                        <h3 className="badge-group-title">🔒 Kilitli ({filteredLocked.length})</h3>
                        <div className="profile-badges">
                            {filteredLocked.map((b, i) => {
                                const prog = getProgress(b);
                                return (
                                    <motion.div
                                        key={b.id}
                                        className="profile-badge locked"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <span className="pb-icon">🔒</span>
                                        <span className="pb-name">{b.name}</span>
                                        <span className="pb-desc">{b.desc}</span>
                                        {prog && (
                                            <div className="pb-progress">
                                                <div className="pb-progress-bar">
                                                    <div className="pb-progress-fill" style={{ width: `${prog.pct}%` }} />
                                                </div>
                                                <span className="pb-progress-text">{prog.current}/{prog.target}</span>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Celebrate animation */}
            <AnimatePresence>
                {celebrateBadge && (
                    <motion.div
                        className="badge-celebrate-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setCelebrateBadge(null)}
                    >
                        <motion.div
                            className="badge-celebrate-card"
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                        >
                            <span className="bcc-icon">{celebrateBadge.icon}</span>
                            <h2>Rozet Kazandın!</h2>
                            <p>{celebrateBadge.name}</p>
                            <p className="bcc-desc">{celebrateBadge.desc}</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfilePage;
