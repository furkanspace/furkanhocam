import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    User, Award, Star, TrendingUp,
    BookOpen, CheckCircle2, Target, Clock, ArrowLeft
} from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5001';
const getToken = () => localStorage.getItem('token');
const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

// Default badges definition
const BADGE_DEFS = [
    { id: 'first_lesson', name: 'İlk Ders', desc: 'İlk dersini tamamla', icon: '🎓', check: (s) => s.done >= 1 },
    { id: 'streak_3', name: '3 Seri', desc: '3 ders üst üste tamamla', icon: '🔥', check: (s) => s.done >= 3 },
    { id: 'streak_7', name: '7 Seri', desc: '7 ders üst üste tamamla', icon: '⚡', check: (s) => s.done >= 7 },
    { id: 'ten_done', name: '10 Ders', desc: '10 ders tamamla', icon: '📚', check: (s) => s.done >= 10 },
    { id: 'twenty_done', name: '20 Ders', desc: '20 ders tamamla', icon: '🏆', check: (s) => s.done >= 20 },
    { id: 'fifty_done', name: '50 Ders', desc: '50 ders tamamla', icon: '💎', check: (s) => s.done >= 50 },
    { id: 'perfect_week', name: 'Mükemmel Hafta', desc: 'Bir hafta hiç kaçırmadan tamamla', icon: '🌟', check: (s) => s.done >= 5 && s.missed === 0 },
    { id: 'makeup_hero', name: 'Telafi Kahramanı', desc: 'Bir telafi dersini tamamla', icon: '🔄', check: (s) => s.makeup >= 1 },
    { id: 'high_pct', name: '%90 Devam', desc: '%90 üzeri devam oranına ulaş', icon: '🎯', check: (s) => s.total >= 5 && ((s.done + s.makeup) / s.total * 100) >= 90 },
];

const LEVELS = [
    { min: 0, name: 'Çaylak', icon: '🌱', color: '#78716c' },
    { min: 5, name: 'Öğrenci', icon: '📖', color: '#3b82f6' },
    { min: 15, name: 'Azimli', icon: '💪', color: '#8b5cf6' },
    { min: 30, name: 'Uzman', icon: '⭐', color: '#f59e0b' },
    { min: 50, name: 'Usta', icon: '👑', color: '#ef4444' },
    { min: 100, name: 'Efsane', icon: '🏆', color: '#00ff88' },
];

const ProfilePage = ({ onBack }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ total: 0, done: 0, missed: 0, makeup: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/lessons`, { headers: headers() });
            const lessons = await res.json();
            if (Array.isArray(lessons)) {
                setStats({
                    total: lessons.length,
                    done: lessons.filter(l => l.completed).length,
                    missed: lessons.filter(l => l.missed && !l.makeupCompleted).length,
                    makeup: lessons.filter(l => l.makeupCompleted).length
                });
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const xp = (stats.done * 10) + (stats.makeup * 15);
    const currentLevel = [...LEVELS].reverse().find(l => xp >= l.min * 10) || LEVELS[0];
    const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
    const progressToNext = nextLevel ? Math.min(100, (xp / (nextLevel.min * 10)) * 100) : 100;
    const earnedBadges = BADGE_DEFS.filter(b => b.check(stats));
    const lockedBadges = BADGE_DEFS.filter(b => !b.check(stats));
    const pct = stats.total > 0 ? Math.round(((stats.done + stats.makeup) / stats.total) * 100) : 0;

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
                    <span className="profile-xp">{xp} XP</span>
                </div>
                {nextLevel && (
                    <div className="profile-xp-bar">
                        <div className="profile-xp-fill" style={{ width: `${progressToNext}%`, background: nextLevel.color }} />
                        <span className="profile-xp-label">Sonraki: {nextLevel.icon} {nextLevel.name} ({nextLevel.min * 10} XP)</span>
                    </div>
                )}
            </motion.div>

            {/* Stats */}
            <div className="profile-stats">
                <motion.div className="profile-stat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <BookOpen size={20} /><span className="ps-num">{stats.total}</span><span className="ps-label">Ders</span>
                </motion.div>
                <motion.div className="profile-stat ps-green" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <CheckCircle2 size={20} /><span className="ps-num">{stats.done}</span><span className="ps-label">Yapılan</span>
                </motion.div>
                <motion.div className="profile-stat ps-red" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Target size={20} /><span className="ps-num">{stats.missed}</span><span className="ps-label">Kaçıran</span>
                </motion.div>
                <motion.div className="profile-stat ps-yellow" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <TrendingUp size={20} /><span className="ps-num">{pct}%</span><span className="ps-label">Devam</span>
                </motion.div>
            </div>

            {/* Badges */}
            <motion.div className="profile-section glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <h2><Award size={22} /> Rozetler <span className="profile-badge-count">{earnedBadges.length}/{BADGE_DEFS.length}</span></h2>
                <div className="profile-badges">
                    {earnedBadges.map(b => (
                        <div key={b.id} className="profile-badge earned">
                            <span className="pb-icon">{b.icon}</span>
                            <span className="pb-name">{b.name}</span>
                            <span className="pb-desc">{b.desc}</span>
                        </div>
                    ))}
                    {lockedBadges.map(b => (
                        <div key={b.id} className="profile-badge locked">
                            <span className="pb-icon">🔒</span>
                            <span className="pb-name">{b.name}</span>
                            <span className="pb-desc">{b.desc}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default ProfilePage;
