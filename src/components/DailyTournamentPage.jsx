import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft, Clock, Trophy, Zap, Users, Timer, CheckCircle,
    XCircle, ChevronRight, Star, Award, Swords, Crown, AlertCircle,
    Plus, Calendar, X
} from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5001';
const getToken = () => localStorage.getItem('token');
const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` });

const DailyTournamentPage = ({ onBack }) => {
    const { user } = useAuth();
    const [tournamentList, setTournamentList] = useState([]);
    const [activeTournament, setActiveTournament] = useState(null);
    const [questions, setQuestions] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [history, setHistory] = useState([]);
    const [view, setView] = useState('lobby');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Quiz state
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [selectedOpt, setSelectedOpt] = useState(null);
    const [quizTimer, setQuizTimer] = useState(0);
    const [result, setResult] = useState(null);
    const qTimerRef = useRef(null);
    const qStartRef = useRef(Date.now());

    // Countdown state
    const [countdowns, setCountdowns] = useState({});
    const countdownRef = useRef(null);

    useEffect(() => {
        fetchActive();
        return () => {
            if (qTimerRef.current) clearInterval(qTimerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    // Countdown interval for scheduled tournaments
    useEffect(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        const scheduled = tournamentList.filter(t => t.tournament.status === 'scheduled');
        if (scheduled.length === 0) return;

        const update = () => {
            const now = new Date();
            const newCD = {};
            scheduled.forEach(item => {
                const t = item.tournament;
                const start = new Date(t.startDate + 'T' + t.startTime + ':00');
                const diff = start - now;
                if (diff > 0) {
                    newCD[t._id] = {
                        h: Math.floor(diff / 3600000),
                        m: Math.floor((diff % 3600000) / 60000),
                        s: Math.floor((diff % 60000) / 1000)
                    };
                }
            });
            setCountdowns(newCD);
        };
        update();
        countdownRef.current = setInterval(update, 1000);
        return () => clearInterval(countdownRef.current);
    }, [tournamentList]);

    const fetchActive = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/tournaments/daily/active`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setTournamentList(data);
            }
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    const fetchLeaderboard = async (id) => {
        try {
            const res = await fetch(`${API_BASE}/api/tournaments/daily/${id}/leaderboard`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setLeaderboard(data.leaderboard || []);
            }
        } catch (e) { console.error(e); }
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/tournaments/daily/history`, { headers: headers() });
            if (res.ok) setHistory(await res.json());
        } catch (e) { console.error(e); }
        setView('history');
    };

    const joinTournament = (item) => {
        setActiveTournament(item.tournament);
        setQuestions(item.questions);
        setView('quiz');
        setCurrentQ(0);
        setAnswers([]);
        setSelectedOpt(null);
        qStartRef.current = Date.now();
        setQuizTimer(0);
        qTimerRef.current = setInterval(() => setQuizTimer(prev => prev + 1), 1000);
    };

    const viewResult = (item) => {
        setActiveTournament(item.tournament);
        if (item.tournament.myParticipation) {
            setResult({
                score: item.tournament.myParticipation.score,
                total: item.tournament.questionCount,
                xpEarned: item.tournament.myParticipation.xpEarned,
            });
        }
        fetchLeaderboard(item.tournament._id);
        setView('result');
    };

    const handleSelect = (optIdx) => setSelectedOpt(optIdx);

    const handleNext = () => {
        if (selectedOpt === null) return;
        const timeSpent = Math.round((Date.now() - qStartRef.current) / 1000);
        const newAnswers = [...answers, { questionIdx: currentQ, selected: selectedOpt, timeSpent }];
        setAnswers(newAnswers);

        if (currentQ + 1 >= questions.length) {
            if (qTimerRef.current) clearInterval(qTimerRef.current);
            submitQuiz(newAnswers);
        } else {
            setCurrentQ(currentQ + 1);
            setSelectedOpt(null);
            qStartRef.current = Date.now();
        }
    };

    const submitQuiz = async (finalAnswers) => {
        try {
            const res = await fetch(`${API_BASE}/api/tournaments/daily/${activeTournament._id}/submit`, {
                method: 'POST', headers: headers(),
                body: JSON.stringify({ answers: finalAnswers })
            });
            if (res.ok) {
                const data = await res.json();
                setResult(data);
                setView('result');
                fetchLeaderboard(activeTournament._id);
            } else {
                const err = await res.json();
                setError(err.message);
            }
        } catch (e) { setError(e.message); }
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    const typeLabel = (type) => ({ daily: '📅 Günlük', weekly: '📆 Haftalık', custom: '🎯 Özel' }[type] || type);

    // ===== QUIZ VIEW =====
    if (view === 'quiz' && questions && questions[currentQ]) {
        const q = questions[currentQ];
        const progress = ((currentQ + 1) / questions.length) * 100;
        return (
            <div className="dt-page">
                <div className="dt-quiz-header">
                    <div className="dt-quiz-progress-bar">
                        <motion.div className="dt-quiz-progress-fill" animate={{ width: `${progress}%` }} />
                    </div>
                    <div className="dt-quiz-meta">
                        <span>{currentQ + 1}/{questions.length}</span>
                        <span className="dt-quiz-timer"><Timer size={14} /> {formatTime(quizTimer)}</span>
                    </div>
                </div>
                <motion.div className="dt-quiz-card" key={currentQ}
                    initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.3 }}
                >
                    <p className="dt-quiz-question">{q.questionText}</p>
                    <div className="dt-quiz-options">
                        {q.options.map((opt, i) => (
                            <motion.button key={i}
                                className={`dt-quiz-opt ${selectedOpt === i ? 'selected' : ''}`}
                                onClick={() => handleSelect(i)} whileTap={{ scale: 0.97 }}
                            >
                                <span className="dt-opt-letter">{String.fromCharCode(65 + i)}</span>
                                <span>{opt}</span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
                <motion.button className="dt-next-btn" onClick={handleNext}
                    disabled={selectedOpt === null} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                >
                    {currentQ + 1 >= questions.length ? '🏁 Bitir' : 'Sonraki →'}
                </motion.button>
            </div>
        );
    }

    // ===== RESULT VIEW =====
    if (view === 'result') {
        return (
            <div className="dt-page">
                <div className="dt-result-header">
                    <motion.button className="sp-btn-back" onClick={() => { setView('lobby'); fetchActive(); }} whileHover={{ scale: 1.05 }}>
                        <ArrowLeft size={20} /> Geri
                    </motion.button>
                    <h1>🏆 {activeTournament?.title || 'Turnuva Sonucu'}</h1>
                </div>
                {result && (
                    <motion.div className="dt-result-card" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <div className="dt-result-score">
                            <span className="dt-result-big">{result.score || 0}</span>
                            <span className="dt-result-total">/ {result.total || activeTournament?.questionCount || 0}</span>
                        </div>
                        <div className="dt-result-pct">
                            %{result.pct || (result.total ? Math.round(((result.score || 0) / result.total) * 100) : 0)}
                        </div>
                        <div className="dt-result-stats">
                            <div className="dt-stat"><Zap size={16} /> <span>{result.xpEarned || 0} XP</span></div>
                            {result.bonusXP > 0 && <div className="dt-stat bonus"><Crown size={16} /> +{result.bonusXP} bonus</div>}
                            {result.rank && <div className="dt-stat"><Award size={16} /> #{result.rank}</div>}
                        </div>
                    </motion.div>
                )}
                {leaderboard.length > 0 && (
                    <div className="dt-podium-section">
                        <h3><Trophy size={18} /> Sıralama</h3>
                        <div className="dt-podium">
                            {leaderboard.slice(0, 3).map((p, i) => (
                                <motion.div key={i} className={`dt-podium-item rank-${i + 1} ${p.isMe ? 'me' : ''}`}
                                    initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.15 }}
                                >
                                    <span className="dt-podium-medal">{['🥇', '🥈', '🥉'][i]}</span>
                                    <span className="dt-podium-name">{p.fullName}</span>
                                    <span className="dt-podium-score">{p.score}/{activeTournament?.questionCount || '?'}</span>
                                </motion.div>
                            ))}
                        </div>
                        {leaderboard.length > 3 && (
                            <div className="dt-full-list">
                                {leaderboard.slice(3).map((p, i) => (
                                    <div key={i} className={`dt-list-row ${p.isMe ? 'me' : ''}`}>
                                        <span className="dt-list-rank">#{p.rank}</span>
                                        <span className="dt-list-name">{p.fullName}</span>
                                        <span className="dt-list-score">{p.score} doğru</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // ===== HISTORY VIEW =====
    if (view === 'history') {
        return (
            <div className="dt-page">
                <div className="dt-result-header">
                    <motion.button className="sp-btn-back" onClick={() => setView('lobby')} whileHover={{ scale: 1.05 }}>
                        <ArrowLeft size={20} /> Geri
                    </motion.button>
                    <h1>📜 Geçmiş Turnuvalar</h1>
                </div>
                {history.length === 0 ? (
                    <div className="dt-empty"><p>Henüz turnuva geçmişi yok.</p></div>
                ) : (
                    <div className="dt-history-list">
                        {history.map((t, i) => (
                            <motion.div key={t._id} className={`dt-history-card ${t.participated ? 'played' : ''}`}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            >
                                <div className="dt-hc-top">
                                    <span className="dt-hc-title">{t.title}</span>
                                    <span className="dt-hc-date">{t.startDate}{t.endDate !== t.startDate ? ` → ${t.endDate}` : ''}</span>
                                </div>
                                <div className="dt-hc-bottom">
                                    <span>{typeLabel(t.type)}</span>
                                    <span><Users size={13} /> {t.participantCount}</span>
                                    <span><Clock size={13} /> {t.startTime}-{t.endTime}</span>
                                    {t.participated && (
                                        <>
                                            <span className="dt-hc-score">{t.myScore}/{t.questionCount}</span>
                                            <span className="dt-hc-rank">#{t.myRank}</span>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ===== LOBBY VIEW =====
    return (
        <div className="dt-page">
            <div className="dt-header">
                <motion.button className="sp-btn-back" onClick={onBack} whileHover={{ scale: 1.05 }}>
                    <ArrowLeft size={20} /> Geri
                </motion.button>
                <div className="dt-header-title">
                    <Swords size={32} />
                    <h1>TURNUVALAR</h1>
                    <p>Yarışmalara katıl, sıralamada yüksel!</p>
                </div>
            </div>

            {loading && <div className="dt-loading"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Star size={28} /></motion.div></div>}
            {error && <div className="dt-error"><AlertCircle size={18} /> {error}</div>}

            {/* Admin: Turnuva Oluştur */}
            {user?.role === 'admin' && (
                <motion.button className="dt-admin-btn" onClick={() => setShowCreateModal(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Plus size={18} /> Yeni Turnuva Oluştur
                </motion.button>
            )}

            {/* Turnuva Listesi */}
            {!loading && tournamentList.length === 0 && (
                <div className="dt-empty-state">
                    <Swords size={48} />
                    <h2>Aktif Turnuva Yok</h2>
                    <p>Yaklaşan turnuva bulunmuyor.</p>
                </div>
            )}

            <div className="dt-tournament-list">
                {tournamentList.map((item, idx) => {
                    const t = item.tournament;
                    const cd = countdowns[t._id];
                    const dateLabel = t.startDate === t.endDate ? t.startDate : `${t.startDate} → ${t.endDate}`;

                    return (
                        <motion.div key={t._id} className={`dt-card dt-card-${t.status}`}
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                        >
                            {t.status === 'active' && <div className="dt-active-pulse" />}
                            <div className="dt-card-header">
                                <div>
                                    <h3 className="dt-card-title">{t.title}</h3>
                                    <span className="dt-card-type">{typeLabel(t.type)}</span>
                                </div>
                                <span className={`dt-card-status status-${t.status}`}>
                                    {t.status === 'active' ? '🔴 CANLI' : t.status === 'scheduled' ? '⏰ Bekliyor' : '🏁 Bitti'}
                                </span>
                            </div>

                            <div className="dt-card-info">
                                <span><Calendar size={13} /> {dateLabel}</span>
                                <span><Clock size={13} /> {t.startTime} - {t.endTime}</span>
                                <span><Trophy size={13} /> {t.questionCount} soru</span>
                                <span><Users size={13} /> {t.participantCount} kişi</span>
                            </div>

                            {/* Countdown */}
                            {t.status === 'scheduled' && cd && (
                                <div className="dt-card-countdown">
                                    <span>{String(cd.h).padStart(2, '0')}:{String(cd.m).padStart(2, '0')}:{String(cd.s).padStart(2, '0')}</span>
                                    <span className="dt-cd-txt">kaldı</span>
                                </div>
                            )}

                            {/* Actions */}
                            {t.status === 'active' && !t.myParticipation && (
                                <motion.button className="dt-start-btn" onClick={() => joinTournament(item)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
                                    ⚔️ Katıl
                                </motion.button>
                            )}

                            {t.myParticipation && (
                                <motion.button className="dt-result-btn" onClick={() => viewResult(item)} whileHover={{ scale: 1.03 }}>
                                    📊 Sonuçları Gör
                                </motion.button>
                            )}

                            {t.status === 'ended' && !t.myParticipation && (
                                <motion.button className="dt-result-btn" onClick={() => viewResult(item)} whileHover={{ scale: 1.03 }}>
                                    📊 Sonuçları Gör
                                </motion.button>
                            )}

                            {/* Ödül bilgisi */}
                            {t.status === 'active' && !t.myParticipation && (
                                <div className="dt-rewards">
                                    <span>🥇 +50 XP</span>
                                    <span>🥈 +30 XP</span>
                                    <span>🥉 +20 XP</span>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            <motion.button className="dt-history-btn" onClick={fetchHistory} whileHover={{ scale: 1.03 }}>
                📜 Geçmiş Turnuvalar
            </motion.button>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && <CreateTournamentModal onClose={() => setShowCreateModal(false)} onCreated={() => { setShowCreateModal(false); fetchActive(); }} />}
            </AnimatePresence>
        </div>
    );
};

// ===== CREATE TOURNAMENT MODAL =====
const CreateTournamentModal = ({ onClose, onCreated }) => {
    const today = new Date().toISOString().split('T')[0];
    const [form, setForm] = useState({
        title: '',
        type: 'daily',
        startDate: today,
        endDate: today,
        startTime: '20:00',
        endTime: '21:00',
        questionCount: 10,
        subject: '',
        difficulty: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleTypeChange = (type) => {
        const f = { ...form, type };
        if (type === 'daily') {
            f.endDate = f.startDate;
        } else if (type === 'weekly') {
            const end = new Date(f.startDate);
            end.setDate(end.getDate() + 6);
            f.endDate = end.toISOString().split('T')[0];
        }
        setForm(f);
    };

    const handleSubmit = async () => {
        if (!form.title.trim()) return setError('Turnuva adı gerekli');
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/tournaments/daily`, {
                method: 'POST', headers: headers(),
                body: JSON.stringify({
                    ...form,
                    subject: form.subject || null,
                    difficulty: form.difficulty || null
                })
            });
            if (res.ok) {
                onCreated();
            } else {
                const err = await res.json();
                setError(err.message);
            }
        } catch (e) { setError(e.message); }
        finally { setSubmitting(false); }
    };

    return (
        <motion.div className="dt-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
            <motion.div className="dt-modal" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <div className="dt-modal-head">
                    <h2>🏆 Yeni Turnuva</h2>
                    <button className="dt-modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="dt-form">
                    <label>
                        <span>Turnuva Adı</span>
                        <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="Akşam Turnuvası" />
                    </label>

                    <label>
                        <span>Turnuva Tipi</span>
                        <div className="dt-type-btns">
                            {['daily', 'weekly', 'custom'].map(t => (
                                <button key={t} className={`dt-type-btn ${form.type === t ? 'active' : ''}`}
                                    onClick={() => handleTypeChange(t)}
                                >
                                    {{ daily: '📅 Günlük', weekly: '📆 Haftalık', custom: '🎯 Özel' }[t]}
                                </button>
                            ))}
                        </div>
                    </label>

                    <div className="dt-form-row">
                        <label>
                            <span>Başlangıç Tarihi</span>
                            <input type="date" value={form.startDate}
                                onChange={e => {
                                    const sd = e.target.value;
                                    const f = { ...form, startDate: sd };
                                    if (form.type === 'daily') f.endDate = sd;
                                    else if (form.type === 'weekly') {
                                        const end = new Date(sd); end.setDate(end.getDate() + 6);
                                        f.endDate = end.toISOString().split('T')[0];
                                    }
                                    setForm(f);
                                }} />
                        </label>
                        <label>
                            <span>Bitiş Tarihi</span>
                            <input type="date" value={form.endDate}
                                onChange={e => setForm({ ...form, endDate: e.target.value })}
                                disabled={form.type === 'daily'} />
                        </label>
                    </div>

                    <div className="dt-form-row">
                        <label>
                            <span>Başlangıç Saati</span>
                            <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
                        </label>
                        <label>
                            <span>Bitiş Saati</span>
                            <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
                        </label>
                    </div>

                    <label>
                        <span>Soru Sayısı: {form.questionCount}</span>
                        <input type="range" min="5" max="30" value={form.questionCount}
                            onChange={e => setForm({ ...form, questionCount: Number(e.target.value) })} />
                    </label>

                    <div className="dt-form-row">
                        <label>
                            <span>Konu (Opsiyonel)</span>
                            <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                                <option value="">Karma</option>
                                <option value="İngilizce">İngilizce</option>
                                <option value="Fizik">Fizik</option>
                                <option value="Matematik">Matematik</option>
                                <option value="Genel Kültür">Genel Kültür</option>
                            </select>
                        </label>
                        <label>
                            <span>Zorluk (Opsiyonel)</span>
                            <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                                <option value="">Karma</option>
                                <option value="1">Kolay</option>
                                <option value="2">Orta</option>
                                <option value="3">Zor</option>
                            </select>
                        </label>
                    </div>

                    {error && <div className="dt-error"><AlertCircle size={16} /> {error}</div>}

                    <motion.button className="dt-create-submit" onClick={handleSubmit} disabled={submitting}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    >
                        {submitting ? 'Oluşturuluyor...' : '🚀 Turnuvayı Oluştur'}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default DailyTournamentPage;
