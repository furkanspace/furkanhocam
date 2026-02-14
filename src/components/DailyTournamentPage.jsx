import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft, Clock, Trophy, Zap, Users, Timer, CheckCircle,
    XCircle, ChevronRight, Star, Award, Swords, Crown, AlertCircle
} from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5001';
const getToken = () => localStorage.getItem('token');
const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` });

const DailyTournamentPage = ({ onBack }) => {
    const { user } = useAuth();
    const [tournament, setTournament] = useState(null);
    const [questions, setQuestions] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [history, setHistory] = useState([]);
    const [view, setView] = useState('lobby'); // lobby | quiz | result | history
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(null);
    const [error, setError] = useState(null);

    // Quiz state
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [selectedOpt, setSelectedOpt] = useState(null);
    const [showCorrect, setShowCorrect] = useState(false);
    const [quizTimer, setQuizTimer] = useState(0);
    const [result, setResult] = useState(null);
    const timerRef = useRef(null);
    const qTimerRef = useRef(null);
    const qStartRef = useRef(Date.now());

    useEffect(() => {
        fetchActive();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (qTimerRef.current) clearInterval(qTimerRef.current);
        };
    }, []);

    const fetchActive = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/tournaments/daily/active`, { headers: headers() });
            if (res.ok) {
                const data = await res.json();
                setTournament(data.tournament);
                setQuestions(data.questions);
                setLeaderboard(data.leaderboard || []);

                if (data.tournament) {
                    if (data.tournament.myParticipation) {
                        setResult({
                            score: data.tournament.myParticipation.score,
                            total: data.tournament.questionCount,
                            xpEarned: data.tournament.myParticipation.xpEarned,
                        });
                        setView('result');
                        fetchLeaderboard(data.tournament._id);
                    } else if (data.tournament.status === 'scheduled') {
                        startCountdown(data.tournament);
                    } else if (data.tournament.status === 'active' && data.questions) {
                        setView('lobby');
                    } else if (data.tournament.status === 'ended') {
                        setView('result');
                        fetchLeaderboard(data.tournament._id);
                    }
                }
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

    const startCountdown = (t) => {
        if (timerRef.current) clearInterval(timerRef.current);
        const update = () => {
            const now = new Date();
            const start = new Date(t.date + 'T' + t.startTime + ':00');
            const diff = start - now;
            if (diff <= 0) {
                clearInterval(timerRef.current);
                fetchActive(); // Refresh — turnuva başlamış olabilir
                return;
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setCountdown({ h, m, s, total: diff });
        };
        update();
        timerRef.current = setInterval(update, 1000);
    };

    const startQuiz = () => {
        setView('quiz');
        setCurrentQ(0);
        setAnswers([]);
        setSelectedOpt(null);
        setShowCorrect(false);
        qStartRef.current = Date.now();
        setQuizTimer(0);
        qTimerRef.current = setInterval(() => {
            setQuizTimer(prev => prev + 1);
        }, 1000);
    };

    const handleSelect = (optIdx) => {
        if (showCorrect) return;
        setSelectedOpt(optIdx);
    };

    const handleNext = () => {
        if (selectedOpt === null && !showCorrect) return;

        const timeSpent = Math.round((Date.now() - qStartRef.current) / 1000);
        const newAnswers = [...answers, {
            questionIdx: currentQ,
            selected: selectedOpt !== null ? selectedOpt : -1,
            timeSpent
        }];
        setAnswers(newAnswers);

        if (currentQ + 1 >= questions.length) {
            // Son soru — gönder
            if (qTimerRef.current) clearInterval(qTimerRef.current);
            submitQuiz(newAnswers);
        } else {
            setCurrentQ(currentQ + 1);
            setSelectedOpt(null);
            setShowCorrect(false);
            qStartRef.current = Date.now();
        }
    };

    const submitQuiz = async (finalAnswers) => {
        try {
            const res = await fetch(`${API_BASE}/api/tournaments/daily/${tournament._id}/submit`, {
                method: 'POST', headers: headers(),
                body: JSON.stringify({ answers: finalAnswers })
            });
            if (res.ok) {
                const data = await res.json();
                setResult(data);
                setView('result');
                fetchLeaderboard(tournament._id);
            } else {
                const err = await res.json();
                setError(err.message);
            }
        } catch (e) { setError(e.message); }
    };

    const autoCreate = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/tournaments/daily/auto-create`, {
                method: 'POST', headers: headers()
            });
            if (res.ok) {
                fetchActive();
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (e) { alert(e.message); }
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        return `${m}:${String(s % 60).padStart(2, '0')}`;
    };

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
                                onClick={() => handleSelect(i)}
                                whileTap={{ scale: 0.97 }}
                            >
                                <span className="dt-opt-letter">{String.fromCharCode(65 + i)}</span>
                                <span>{opt}</span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                <motion.button className="dt-next-btn" onClick={handleNext}
                    disabled={selectedOpt === null}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
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
                    <motion.button className="sp-btn-back" onClick={onBack} whileHover={{ scale: 1.05 }}>
                        <ArrowLeft size={20} /> Geri
                    </motion.button>
                    <h1>🏆 Turnuva Sonucu</h1>
                </div>

                {result && (
                    <motion.div className="dt-result-card"
                        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    >
                        <div className="dt-result-score">
                            <span className="dt-result-big">{result.score || 0}</span>
                            <span className="dt-result-total">/ {result.total || tournament?.questionCount || 0}</span>
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

                {/* Podium */}
                {leaderboard.length > 0 && (
                    <div className="dt-podium-section">
                        <h3><Trophy size={18} /> Sıralama</h3>
                        <div className="dt-podium">
                            {leaderboard.slice(0, 3).map((p, i) => (
                                <motion.div key={i} className={`dt-podium-item rank-${i + 1} ${p.isMe ? 'me' : ''}`}
                                    initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.15 }}
                                >
                                    <span className="dt-podium-medal">{['🥇', '🥈', '🥉'][i]}</span>
                                    <span className="dt-podium-name">{p.fullName}</span>
                                    <span className="dt-podium-score">{p.score}/{tournament?.questionCount || '?'}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Full list */}
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

                <motion.button className="dt-history-btn" onClick={fetchHistory} whileHover={{ scale: 1.03 }}>
                    📜 Geçmiş Turnuvalar
                </motion.button>
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
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div className="dt-hc-top">
                                    <span className="dt-hc-title">{t.title}</span>
                                    <span className="dt-hc-date">{t.date}</span>
                                </div>
                                <div className="dt-hc-bottom">
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

    // ===== LOBBY VIEW (Default) =====
    return (
        <div className="dt-page">
            <div className="dt-header">
                <motion.button className="sp-btn-back" onClick={onBack} whileHover={{ scale: 1.05 }}>
                    <ArrowLeft size={20} /> Geri
                </motion.button>
                <div className="dt-header-title">
                    <Swords size={32} />
                    <h1>GÜNLÜK TURNUVA</h1>
                    <p>Her akşam 20:00'de kapılar açılıyor!</p>
                </div>
            </div>

            {loading && <div className="dt-loading"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Star size={28} /></motion.div></div>}

            {error && <div className="dt-error"><AlertCircle size={18} /> {error}</div>}

            {/* Admin: Turnuva Oluştur */}
            {user?.role === 'admin' && !tournament && (
                <motion.button className="dt-admin-btn" onClick={autoCreate} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    ⚡ Bugünün Turnuvasını Oluştur
                </motion.button>
            )}

            {!loading && !tournament && (
                <div className="dt-empty-state">
                    <Swords size={48} />
                    <h2>Bugün Turnuva Yok</h2>
                    <p>Bir sonraki turnuva için bekleyin veya geçmiş turnuvaları inceleyin.</p>
                    <motion.button className="dt-history-btn" onClick={fetchHistory} whileHover={{ scale: 1.03 }}>
                        📜 Geçmiş Turnuvalar
                    </motion.button>
                </div>
            )}

            {tournament && tournament.status === 'scheduled' && countdown && (
                <motion.div className="dt-countdown-card"
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                >
                    <h2>⏰ Turnuva Başlıyor</h2>
                    <p className="dt-tournament-title">{tournament.title}</p>
                    <div className="dt-countdown">
                        <div className="dt-cd-unit"><span className="dt-cd-num">{String(countdown.h).padStart(2, '0')}</span><span className="dt-cd-label">Saat</span></div>
                        <span className="dt-cd-sep">:</span>
                        <div className="dt-cd-unit"><span className="dt-cd-num">{String(countdown.m).padStart(2, '0')}</span><span className="dt-cd-label">Dakika</span></div>
                        <span className="dt-cd-sep">:</span>
                        <div className="dt-cd-unit"><span className="dt-cd-num">{String(countdown.s).padStart(2, '0')}</span><span className="dt-cd-label">Saniye</span></div>
                    </div>
                    <div className="dt-info-row">
                        <span><Clock size={14} /> {tournament.startTime} - {tournament.endTime}</span>
                        <span><Trophy size={14} /> {tournament.questionCount} soru</span>
                    </div>
                </motion.div>
            )}

            {tournament && tournament.status === 'active' && !tournament.myParticipation && (
                <motion.div className="dt-active-card"
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                >
                    <div className="dt-active-pulse" />
                    <h2>🔴 CANLI — Turnuva Aktif!</h2>
                    <p className="dt-tournament-title">{tournament.title}</p>
                    <div className="dt-info-row">
                        <span><Users size={14} /> {tournament.participantCount} katılımcı</span>
                        <span><Trophy size={14} /> {tournament.questionCount} soru</span>
                    </div>
                    <div className="dt-rewards">
                        <span>🥇 +50 XP</span>
                        <span>🥈 +30 XP</span>
                        <span>🥉 +20 XP</span>
                    </div>
                    <motion.button className="dt-start-btn" onClick={startQuiz}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    >
                        ⚔️ Turnuvaya Katıl
                    </motion.button>
                </motion.div>
            )}

            {tournament && tournament.status === 'active' && tournament.myParticipation && (
                <div className="dt-already">
                    <CheckCircle size={24} />
                    <p>Bu turnuvaya zaten katıldınız!</p>
                    <motion.button className="dt-result-btn" onClick={() => { setView('result'); fetchLeaderboard(tournament._id); }}
                        whileHover={{ scale: 1.03 }}
                    >
                        📊 Sonuçları Gör
                    </motion.button>
                </div>
            )}

            {tournament && tournament.status === 'ended' && (
                <div className="dt-ended">
                    <p>Bu turnuva sona erdi.</p>
                    <motion.button className="dt-result-btn" onClick={() => { setView('result'); fetchLeaderboard(tournament._id); }}
                        whileHover={{ scale: 1.03 }}
                    >
                        📊 Sonuçları Gör
                    </motion.button>
                </div>
            )}

            <motion.button className="dt-history-btn" onClick={fetchHistory} whileHover={{ scale: 1.03 }}>
                📜 Geçmiş Turnuvalar
            </motion.button>
        </div>
    );
};

export default DailyTournamentPage;
