import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft, Clock, CheckCircle, XCircle, Trophy, Flame,
    ChevronRight, Star, Award, BarChart3, Zap
} from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5001';
const getToken = () => localStorage.getItem('token');
const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

const DailyQuizPage = ({ onBack }) => {
    const { user } = useAuth();
    const [phase, setPhase] = useState('loading'); // loading, ready, quiz, result, already_done, no_questions
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState([]); // {questionId, selectedAnswer, timeSpent}
    const [selected, setSelected] = useState(-1);
    const [timeLeft, setTimeLeft] = useState(30);
    const [result, setResult] = useState(null);
    const [existingAttempt, setExistingAttempt] = useState(null);
    const [stats, setStats] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    useEffect(() => {
        fetchDaily();
        fetchStats();
    }, []);

    const fetchDaily = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/quiz/daily`, { headers: headers() });
            const data = await res.json();
            if (data.completed) {
                setExistingAttempt(data.attempt);
                setPhase('already_done');
            } else if (data.noQuestions) {
                setPhase('no_questions');
            } else {
                setQuestions(data.questions);
                setPhase('ready');
            }
        } catch (e) { console.error(e); setPhase('no_questions'); }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/quiz/stats`, { headers: headers() });
            setStats(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/quiz/leaderboard?period=week`, { headers: headers() });
            setLeaderboard(await res.json());
            setShowLeaderboard(true);
        } catch (e) { console.error(e); }
    };

    const startQuiz = () => {
        setPhase('quiz');
        setCurrentIdx(0);
        setAnswers([]);
        setSelected(-1);
        setTimeLeft(30);
        startTimeRef.current = Date.now();
        startTimer();
    };

    const startTimer = () => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleNext(-1); // Auto-skip on timeout
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSelect = (optIdx) => {
        if (selected !== -1) return; // Already selected
        setSelected(optIdx);
    };

    const handleNext = (forceAnswer) => {
        clearInterval(timerRef.current);
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        const answer = {
            questionId: questions[currentIdx]._id,
            selectedAnswer: forceAnswer !== undefined ? forceAnswer : selected,
            timeSpent: elapsed
        };

        const newAnswers = [...answers, answer];
        setAnswers(newAnswers);

        if (currentIdx + 1 < questions.length) {
            setCurrentIdx(currentIdx + 1);
            setSelected(-1);
            setTimeLeft(30);
            startTimeRef.current = Date.now();
            startTimer();
        } else {
            // Submit
            clearInterval(timerRef.current);
            submitQuiz(newAnswers);
        }
    };

    const submitQuiz = async (finalAnswers) => {
        setPhase('loading');
        try {
            const res = await fetch(`${API_BASE}/api/quiz/daily/submit`, {
                method: 'POST', headers: headers(),
                body: JSON.stringify({ answers: finalAnswers })
            });
            const data = await res.json();
            setResult(data);
            setPhase('result');
            fetchStats(); // Refresh stats
        } catch (e) {
            console.error(e);
            setPhase('ready');
        }
    };

    useEffect(() => {
        return () => clearInterval(timerRef.current);
    }, []);

    const currentQ = questions[currentIdx];
    const timerPct = (timeLeft / 30) * 100;

    return (
        <div className="dq-page">
            <div className="dq-header">
                <motion.button className="sp-btn-back" onClick={onBack} whileHover={{ scale: 1.05 }}>
                    <ArrowLeft size={20} /> Geri
                </motion.button>
                <h1><Zap size={24} /> Günlük Quiz</h1>
                {stats && <span className="dq-streak-badge"><Flame size={16} /> {stats.currentStreak} gün seri</span>}
            </div>

            <AnimatePresence mode="wait">
                {/* LOADING */}
                {phase === 'loading' && (
                    <motion.div key="loading" className="dq-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <p>Yükleniyor...</p>
                    </motion.div>
                )}

                {/* NO QUESTIONS */}
                {phase === 'no_questions' && (
                    <motion.div key="noq" className="dq-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <AlertEmpty />
                        <h2>Henüz soru yok</h2>
                        <p>Admin soru bankasına soru ekledikten sonra günlük quiz aktif olacak.</p>
                    </motion.div>
                )}

                {/* READY */}
                {phase === 'ready' && (
                    <motion.div key="ready" className="dq-ready" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="dq-ready-card glass-panel">
                            <Zap size={48} className="dq-ready-icon" />
                            <h2>Günlük Quiz Hazır!</h2>
                            <p>{questions.length} soru · Her soru 30 saniye · Doğru cevap = 5 XP</p>
                            {stats && (
                                <div className="dq-ready-stats">
                                    <div><Trophy size={16} /> <span>{stats.totalQuizzes} quiz</span></div>
                                    <div><Flame size={16} /> <span>{stats.currentStreak} gün seri</span></div>
                                    <div><Star size={16} /> <span>{stats.totalXP} XP</span></div>
                                    <div><BarChart3 size={16} /> <span>%{stats.pct} başarı</span></div>
                                </div>
                            )}
                            <motion.button className="dq-start-btn" onClick={startQuiz}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                Başla! 🚀
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* QUIZ */}
                {phase === 'quiz' && currentQ && (
                    <motion.div key={`q-${currentIdx}`} className="dq-quiz" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                        {/* Progress */}
                        <div className="dq-progress">
                            <div className="dq-progress-bar">
                                <div className="dq-progress-fill" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
                            </div>
                            <span className="dq-progress-text">{currentIdx + 1} / {questions.length}</span>
                        </div>

                        {/* Timer */}
                        <div className="dq-timer">
                            <div className={`dq-timer-circle ${timeLeft <= 5 ? 'dq-timer-danger' : ''}`}>
                                <svg viewBox="0 0 36 36">
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" stroke={timeLeft <= 5 ? '#ff6b6b' : '#3b82f6'} strokeWidth="2"
                                        strokeDasharray={`${timerPct}, 100`} />
                                </svg>
                                <span>{timeLeft}</span>
                            </div>
                        </div>

                        {/* Question */}
                        <div className="dq-question-card glass-panel">
                            <div className="dq-q-meta">
                                <span className="dq-q-subject">{currentQ.subject}</span>
                                {currentQ.topic && <span className="dq-q-topic">{currentQ.topic}</span>}
                            </div>
                            <h3 className="dq-q-text">{currentQ.questionText}</h3>
                            <div className="dq-options">
                                {currentQ.options.map((opt, i) => (
                                    <motion.button key={i}
                                        className={`dq-option ${selected === i ? 'dq-option-selected' : ''}`}
                                        onClick={() => handleSelect(i)}
                                        whileHover={selected === -1 ? { scale: 1.02 } : {}}
                                        whileTap={selected === -1 ? { scale: 0.98 } : {}}>
                                        <span className="dq-opt-letter">{String.fromCharCode(65 + i)}</span>
                                        <span className="dq-opt-text">{opt}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Next button */}
                        <motion.button className="dq-next-btn" onClick={() => handleNext()}
                            disabled={selected === -1}
                            whileHover={selected !== -1 ? { scale: 1.05 } : {}}>
                            {currentIdx + 1 < questions.length ? 'Sonraki' : 'Bitir'} <ChevronRight size={18} />
                        </motion.button>
                    </motion.div>
                )}

                {/* RESULT */}
                {phase === 'result' && result && (
                    <motion.div key="result" className="dq-result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                        <ResultView result={result} onLeaderboard={fetchLeaderboard} stats={stats} />
                    </motion.div>
                )}

                {/* ALREADY DONE */}
                {phase === 'already_done' && (
                    <motion.div key="done" className="dq-result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="dq-done-card glass-panel">
                            <CheckCircle size={48} className="dq-done-icon" />
                            <h2>Bugünkü Quiz Tamamlandı! ✅</h2>
                            {existingAttempt && (
                                <div className="dq-done-stats">
                                    <div><span className="dq-done-big">{existingAttempt.score}</span> / {existingAttempt.totalQuestions} doğru</div>
                                    <div><Zap size={16} /> {existingAttempt.xpEarned} XP kazanıldı</div>
                                    <div><Flame size={16} /> {existingAttempt.streak} gün seri</div>
                                </div>
                            )}
                            <p>Yarın yeni quiz için tekrar gel! 🚀</p>
                            <motion.button className="dq-lb-btn" onClick={fetchLeaderboard} whileHover={{ scale: 1.05 }}>
                                <Trophy size={16} /> Sıralama Tablosu
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Leaderboard Modal */}
            <AnimatePresence>
                {showLeaderboard && (
                    <motion.div className="qb-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowLeaderboard(false)}>
                        <motion.div className="dq-lb-modal glass-panel" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}>
                            <h2><Trophy size={22} /> Haftalık Sıralama</h2>
                            {leaderboard.length === 0 ? <p>Henüz veri yok</p> : (
                                <div className="dq-lb-list">
                                    {leaderboard.map((entry, i) => (
                                        <div key={entry._id} className={`dq-lb-row ${entry._id === user?.id ? 'dq-lb-me' : ''}`}>
                                            <span className="dq-lb-rank">
                                                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                                            </span>
                                            <span className="dq-lb-name">{entry.fullName}</span>
                                            <span className="dq-lb-xp">{entry.totalXP} XP</span>
                                            <span className="dq-lb-pct">%{entry.pct}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button className="qb-btn-cancel" onClick={() => setShowLeaderboard(false)}>Kapat</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Result sub-component
const ResultView = ({ result, onLeaderboard, stats }) => {
    const { stats: s, attempt } = result;
    const isPerfect = s.score === s.total;
    const isGood = s.pct >= 70;

    return (
        <div className="dq-result-card glass-panel">
            <div className="dq-result-emoji">
                {isPerfect ? '🏆' : isGood ? '🎉' : '💪'}
            </div>
            <h2>{isPerfect ? 'Mükemmel!' : isGood ? 'Harika İş!' : 'İyi Deneme!'}</h2>

            <div className="dq-result-score">
                <span className="dq-result-big">{s.score}</span>
                <span className="dq-result-sep">/</span>
                <span className="dq-result-total">{s.total}</span>
            </div>
            <span className="dq-result-pct">%{s.pct} Başarı</span>

            <div className="dq-result-details">
                <div className="dq-rd"><Zap size={18} /> <strong>{s.xpEarned}</strong> XP kazanıldı</div>
                <div className="dq-rd"><Flame size={18} /> <strong>{s.streak}</strong> gün seri</div>
            </div>

            {/* Question breakdown */}
            <div className="dq-breakdown">
                <h3>Cevap Analizi</h3>
                {attempt.questions.map((q, i) => (
                    <div key={i} className={`dq-bd-row ${q.correct ? 'dq-bd-correct' : 'dq-bd-wrong'}`}>
                        <span className="dq-bd-num">{i + 1}</span>
                        <span className="dq-bd-icon">{q.correct ? <CheckCircle size={16} /> : <XCircle size={16} />}</span>
                        <span className="dq-bd-text">{q.question?.questionText || 'Soru'}</span>
                        {!q.correct && q.question && (
                            <span className="dq-bd-answer">
                                Doğru: {String.fromCharCode(65 + q.question.correctAnswer)}) {q.question.options[q.question.correctAnswer]}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            <motion.button className="dq-lb-btn" onClick={onLeaderboard} whileHover={{ scale: 1.05 }}>
                <Trophy size={16} /> Sıralama Tablosu
            </motion.button>
        </div>
    );
};

// Empty state icon
const AlertEmpty = () => (
    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
);

export default DailyQuizPage;
