import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, BookOpen, Trophy, GraduationCap,
    User, Clock, TrendingUp, Target, CheckCircle2,
    Calendar, Star, Flame, Zap
} from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5001';
const getToken = () => localStorage.getItem('token');
const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

const HomePage = ({ onNavigate }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ total: 0, done: 0, missed: 0, makeup: 0 });
    const [recentLessons, setRecentLessons] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/lessons`, { headers: headers() });
            const lessons = await res.json();
            if (Array.isArray(lessons)) {
                const total = lessons.length;
                const done = lessons.filter(l => l.completed).length;
                const missed = lessons.filter(l => l.missed && !l.makeupCompleted).length;
                const makeup = lessons.filter(l => l.makeupCompleted).length;
                setStats({ total, done, missed, makeup });
                setRecentLessons(lessons.slice(-5).reverse());
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const pct = stats.total > 0 ? Math.round(((stats.done + stats.makeup) / stats.total) * 100) : 0;
    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Günaydın';
        if (h < 18) return 'İyi günler';
        return 'İyi akşamlar';
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }) : '-';

    return (
        <div className="home-page">
            {/* Welcome Hero */}
            <div className="home-hero">
                <motion.div
                    className="home-welcome"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1>{greeting()}, <span className="home-name">{user?.fullName || 'Öğrenci'}</span> 👋</h1>
                    <p>Bugün öğrenmeye hazır mısın? Hedeflerine bir adım daha yaklaş!</p>
                </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="home-stats">
                <motion.div className="home-stat-card home-stat-total" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="home-stat-icon"><BookOpen size={24} /></div>
                    <div className="home-stat-info">
                        <span className="home-stat-num">{stats.total}</span>
                        <span className="home-stat-label">Toplam Ders</span>
                    </div>
                </motion.div>
                <motion.div className="home-stat-card home-stat-done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="home-stat-icon"><CheckCircle2 size={24} /></div>
                    <div className="home-stat-info">
                        <span className="home-stat-num">{stats.done}</span>
                        <span className="home-stat-label">Tamamlanan</span>
                    </div>
                </motion.div>
                <motion.div className="home-stat-card home-stat-missed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div className="home-stat-icon"><Target size={24} /></div>
                    <div className="home-stat-info">
                        <span className="home-stat-num">{stats.missed}</span>
                        <span className="home-stat-label">Kaçırılan</span>
                    </div>
                </motion.div>
                <motion.div className="home-stat-card home-stat-pct" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <div className="home-stat-icon"><TrendingUp size={24} /></div>
                    <div className="home-stat-info">
                        <span className="home-stat-num">{pct}%</span>
                        <span className="home-stat-label">Devam Oranı</span>
                    </div>
                </motion.div>
            </div>

            {/* Quick Actions + Recent Lessons */}
            <div className="home-grid">
                {/* Quick Actions */}
                <motion.div className="home-section glass-panel" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <h2><Flame size={20} /> Hızlı Erişim</h2>
                    <div className="home-actions">
                        <button className="home-action-btn home-action-quiz" onClick={() => onNavigate('DAILY_QUIZ')}>
                            <Zap size={28} />
                            <span>Quiz</span>
                            <small>Günlük Quiz</small>
                        </button>
                        <button className="home-action-btn home-action-arena" onClick={() => onNavigate('ARENA')}>
                            <Trophy size={28} />
                            <span>Arena</span>
                            <small>Turnuvalar</small>
                        </button>
                        <button className="home-action-btn home-action-study" onClick={() => onNavigate('STUDY')}>
                            <BookOpen size={28} />
                            <span>Kütüphane</span>
                            <small>Dersler</small>
                        </button>
                        <button className="home-action-btn home-action-edu" onClick={() => onNavigate('STUDENT_PANEL')}>
                            <GraduationCap size={28} />
                            <span>Eğitim</span>
                            <small>Takip & Sorular</small>
                        </button>
                        <button className="home-action-btn home-action-profile" onClick={() => onNavigate('PROFILE')}>
                            <User size={28} />
                            <span>Profil</span>
                            <small>Başarılar</small>
                        </button>
                    </div>
                </motion.div>

                {/* Recent Lessons */}
                <motion.div className="home-section glass-panel" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <h2><Clock size={20} /> Son Dersler</h2>
                    {loading ? <p className="home-loading">Yükleniyor...</p> :
                        recentLessons.length === 0 ? <p className="home-empty">Henüz ders yok.</p> : (
                            <div className="home-recent-list">
                                {recentLessons.map(l => (
                                    <div key={l._id} className={`home-recent-item ${l.completed ? 'home-ri-done' : l.missed ? 'home-ri-missed' : 'home-ri-pending'}`}>
                                        <div className="home-ri-left">
                                            <span className="home-ri-subject">{l.subject}</span>
                                            {l.topic && <span className="home-ri-topic">{l.topic}</span>}
                                        </div>
                                        <div className="home-ri-right">
                                            <span className="home-ri-date">{formatDate(l.scheduledDate)}</span>
                                            <span className={`home-ri-badge ${l.completed ? 'done' : l.missed ? 'missed' : 'pending'}`}>
                                                {l.completed ? '✅' : l.missed ? '❌' : '⏳'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    <button className="home-see-all" onClick={() => onNavigate('STUDENT_PANEL')}>
                        Tümünü Gör →
                    </button>
                </motion.div>
            </div>

            {/* Daily Quiz Banner */}
            <motion.div className="home-quiz-banner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                onClick={() => onNavigate('DAILY_QUIZ')} style={{ cursor: 'pointer' }}>
                <Zap size={24} />
                <div>
                    <strong>Günlük Quiz</strong>
                    <p>Bugünkü 10 soruyu çöz, XP kazan, seriyi koru! ⚡</p>
                </div>
                <span className="home-quiz-go">Başla →</span>
            </motion.div>
        </div>
    );
};

export default HomePage;
