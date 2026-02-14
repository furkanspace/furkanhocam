import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, TreePine, Zap, Star, Lock, Check, ChevronRight } from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5001';
const getToken = () => localStorage.getItem('token');
const headers = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` });

const STEP_TYPES = [
    { id: 1, type: 'vocabulary', name: 'Kelime Tanıma', icon: '📖', xp: 10, color: '#3b82f6' },
    { id: 2, type: 'listening', name: 'Dinleme/Okuma', icon: '🎧', xp: 10, color: '#8b5cf6' },
    { id: 3, type: 'practice', name: 'Alıştırma', icon: '✏️', xp: 15, color: '#f59e0b' },
    { id: 4, type: 'quiz', name: 'Quiz', icon: '🧠', xp: 20, color: '#ec4899' },
    { id: 5, type: 'review', name: 'Tekrar', icon: '🔄', xp: 10, color: '#06b6d4' },
    { id: 6, type: 'challenge', name: 'Bonus Challenge', icon: '💪', xp: 25, color: '#ef4444' },
    { id: 7, type: 'exam', name: 'Ünite Sınavı', icon: '🏆', xp: 30, color: '#f59e0b' },
];

const SUBJECTS_META = [
    { id: 'İngilizce', name: 'İNGİLİZCE', icon: '🇬🇧', color: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
    { id: 'Fizik', name: 'FİZİK', icon: '⚛️', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
    { id: 'Matematik', name: 'MATEMATİK', icon: '🔢', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
];

const SkillTreePage = ({ onBack }) => {
    const { user } = useAuth();
    const [view, setView] = useState('subjects');
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [tree, setTree] = useState(null);
    const [progress, setProgress] = useState(null);
    const [selectedStep, setSelectedStep] = useState(null);
    const [celebration, setCelebration] = useState(null);
    const [loading, setLoading] = useState(true);
    const pathRef = useRef(null);

    useEffect(() => { fetchSubjects(); }, []);

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/skill-trees/subjects`, { headers: headers() });
            if (res.ok) setSubjects(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const selectSubject = (subjectId) => {
        const subj = subjects.find(s => s.subject === subjectId);
        const meta = SUBJECTS_META.find(m => m.id === subjectId);
        setSelectedSubject({ ...(subj || { subject: subjectId, grades: [] }), meta });
        setView('grades');
    };

    const selectGrade = async (gradeInfo) => {
        setLoading(true);
        try {
            const subj = selectedSubject?.subject || gradeInfo.subject;
            const res = await fetch(
                `${API_BASE}/api/skill-trees/${encodeURIComponent(subj)}/${encodeURIComponent(gradeInfo.grade)}`,
                { headers: headers() }
            );
            if (res.ok) {
                const data = await res.json();
                setTree(data.tree);
                setProgress(data.progress);
                setSelectedGrade(gradeInfo);
                setView('tree');
                setTimeout(() => {
                    const el = document.querySelector('.step-node.available');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 400);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const getStepStatus = (unitId, stepId) => {
        if (!progress) return unitId === 1 && stepId === 1 ? 'available' : 'locked';
        const done = progress.completedSteps || [];
        if (done.find(s => s.unitId === unitId && s.stepId === stepId)) return 'completed';
        if (unitId === 1 && stepId === 1) return 'available';
        if (stepId > 1) {
            return done.find(s => s.unitId === unitId && s.stepId === stepId - 1) ? 'available' : 'locked';
        }
        return done.find(s => s.unitId === unitId - 1 && s.stepId === 7) ? 'available' : 'locked';
    };

    const completeStep = async () => {
        if (!selectedStep || !tree) return;
        try {
            const res = await fetch(`${API_BASE}/api/skill-trees/complete-step`, {
                method: 'POST', headers: headers(),
                body: JSON.stringify({ treeId: tree._id, unitId: selectedStep.unitId, stepId: selectedStep.stepId })
            });
            if (res.ok) {
                const data = await res.json();
                setProgress(data.progress);
                setCelebration({ xp: data.xpEarned, step: selectedStep });
                setSelectedStep(null);
                setTimeout(() => setCelebration(null), 2500);
            }
        } catch (e) { console.error(e); }
    };

    const seedTrees = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/skill-trees/seed`, { method: 'POST', headers: headers() });
            if (res.ok) {
                await fetchSubjects();
                alert('Ağaçlar oluşturuldu!');
            }
        } catch (e) { console.error(e); }
    };

    const handleBack = () => {
        if (view === 'tree') { setView('grades'); setTree(null); setProgress(null); }
        else if (view === 'grades') { setView('subjects'); setSelectedSubject(null); }
        else onBack();
    };

    const getNodeOffset = (idx) => Math.sin(idx * 0.55) * 85;

    const getCompletedStepsInUnit = (unitId) => {
        if (!progress) return 0;
        return progress.completedSteps.filter(s => s.unitId === unitId).length;
    };

    const totalProgress = () => {
        if (!tree || !progress) return 0;
        const total = tree.units.length * 7;
        return total > 0 ? Math.round((progress.completedSteps.length / total) * 100) : 0;
    };

    // ===== RENDER: SUBJECTS =====
    if (view === 'subjects') {
        return (
            <div className="skill-tree-page">
                <div className="st-header">
                    <motion.button className="sp-btn-back" onClick={onBack} whileHover={{ scale: 1.05 }}>
                        <ArrowLeft size={20} /> Geri
                    </motion.button>
                    <div className="st-header-title">
                        <TreePine size={32} />
                        <h1>BECERİ AĞACI</h1>
                        <p>Bilgi ağacında yukarı tırman!</p>
                    </div>
                </div>

                {user?.role === 'admin' && (
                    <motion.button className="st-seed-btn" onClick={seedTrees} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        🌱 İngilizce Ağaçlarını Oluştur
                    </motion.button>
                )}

                <div className="st-subjects-grid">
                    {SUBJECTS_META.map((subj, i) => {
                        const data = subjects.find(s => s.subject === subj.id);
                        const gradeCount = data ? data.grades.length : 0;
                        return (
                            <motion.div key={subj.id} className="st-subject-card"
                                style={{ '--sc': subj.color, '--sg': subj.gradient }}
                                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.12 }}
                                whileHover={{ scale: 1.04, y: -8 }} whileTap={{ scale: 0.97 }}
                                onClick={() => selectSubject(subj.id)}
                            >
                                <div className="st-subject-icon">{subj.icon}</div>
                                <h2>{subj.name}</h2>
                                <span className="st-subject-count">{gradeCount} sınıf</span>
                                {gradeCount === 0 && <span className="st-coming-soon">Yakında</span>}
                                <ChevronRight className="st-subject-arrow" size={20} />
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ===== RENDER: GRADES =====
    if (view === 'grades') {
        const meta = selectedSubject?.meta || SUBJECTS_META[0];
        const grades = selectedSubject?.grades || [];
        const grouped = {};
        grades.forEach(g => {
            if (!grouped[g.category]) grouped[g.category] = [];
            grouped[g.category].push(g);
        });

        return (
            <div className="skill-tree-page">
                <div className="st-header" style={{ '--hc': meta.color }}>
                    <motion.button className="sp-btn-back" onClick={handleBack} whileHover={{ scale: 1.05 }}>
                        <ArrowLeft size={20} /> Dersler
                    </motion.button>
                    <div className="st-header-title">
                        <span className="st-header-icon">{meta.icon}</span>
                        <h1>{meta.name}</h1>
                        <p>Sınıfını seç ve ilerlemeye başla!</p>
                    </div>
                </div>

                {grades.length === 0 ? (
                    <div className="st-empty">
                        <p>Bu ders için henüz beceri ağacı oluşturulmamış.</p>
                        {user?.role === 'admin' && <p>Admin panelinden "Seed" butonuna tıklayın.</p>}
                    </div>
                ) : (
                    Object.entries(grouped).map(([category, gradeList]) => (
                        <div key={category} className="st-grade-group">
                            <h3 className="st-grade-group-title">{category}</h3>
                            <div className="st-grades-grid">
                                {gradeList.map((g, i) => (
                                    <motion.div key={g.grade} className="st-grade-card"
                                        style={{ '--gc': meta.color }}
                                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        whileHover={{ scale: 1.03, y: -5 }} whileTap={{ scale: 0.97 }}
                                        onClick={() => selectGrade(g)}
                                    >
                                        <div className="st-grade-icon">{g.icon}</div>
                                        <div className="st-grade-info">
                                            <h4>{g.grade}</h4>
                                            <span>{g.unitCount} ünite</span>
                                        </div>
                                        <div className="st-grade-progress">
                                            <svg className="st-progress-ring" viewBox="0 0 40 40">
                                                <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                                                <circle cx="20" cy="20" r="16" fill="none" stroke={meta.color} strokeWidth="3"
                                                    strokeDasharray={`${g.progressPct} ${100 - g.progressPct}`}
                                                    strokeDashoffset="25" strokeLinecap="round" />
                                            </svg>
                                            <span className="st-progress-pct">{g.progressPct}%</span>
                                        </div>
                                        {g.totalXP > 0 && <span className="st-grade-xp"><Zap size={12} /> {g.totalXP} XP</span>}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    }

    // ===== RENDER: TREE PATH (Duolingo Style) =====
    const meta = selectedSubject?.meta || SUBJECTS_META[0];
    let globalIdx = 0;

    return (
        <div className="skill-tree-page">
            <div className="st-tree-header" style={{ '--hc': meta.color }}>
                <motion.button className="sp-btn-back" onClick={handleBack} whileHover={{ scale: 1.05 }}>
                    <ArrowLeft size={20} /> {selectedSubject?.subject}
                </motion.button>
                <div className="st-tree-header-info">
                    <h2>{selectedGrade?.grade}</h2>
                    <div className="st-tree-progress-bar">
                        <div className="st-tree-progress-fill" style={{ width: `${totalProgress()}%`, background: meta.color }} />
                    </div>
                    <span className="st-tree-progress-text">{totalProgress()}% tamamlandı • {progress?.totalXP || 0} XP</span>
                </div>
            </div>

            <div className="st-path-container" ref={pathRef}>
                {tree && tree.units.map((unit, ui) => {
                    const unitDone = getCompletedStepsInUnit(unit.unitId);
                    const isUnitComplete = unitDone === 7;
                    return (
                        <React.Fragment key={unit.unitId}>
                            {/* Unit Header Banner */}
                            <motion.div className={`st-unit-banner ${isUnitComplete ? 'complete' : ''}`}
                                style={{ '--uc': meta.color }}
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: ui * 0.1 }}
                            >
                                <span className="st-unit-num">Ünite {unit.unitId}</span>
                                <span className="st-unit-name">{unit.name}</span>
                                <span className="st-unit-progress">{unitDone}/7</span>
                                {isUnitComplete && <span className="st-unit-star">⭐</span>}
                            </motion.div>

                            {/* Steps */}
                            {STEP_TYPES.map((stepType) => {
                                const status = getStepStatus(unit.unitId, stepType.id);
                                const offset = getNodeOffset(globalIdx);
                                const currentGlobalIdx = globalIdx;
                                globalIdx++;

                                return (
                                    <div key={`${unit.unitId}-${stepType.id}`}
                                        className="st-step-row"
                                        style={{ transform: `translateX(${offset}px)` }}
                                    >
                                        {/* Connector line */}
                                        {stepType.id > 1 && (
                                            <div className={`st-connector ${status === 'completed' || status === 'available' ? 'active' : ''}`} />
                                        )}
                                        <motion.div
                                            className={`step-node ${status}`}
                                            initial={{ opacity: 0, scale: 0.7 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: currentGlobalIdx * 0.03, type: 'spring', stiffness: 300 }}
                                            whileHover={status !== 'locked' ? { scale: 1.2 } : {}}
                                            whileTap={status !== 'locked' ? { scale: 0.9 } : {}}
                                            onClick={() => setSelectedStep({ unitId: unit.unitId, stepId: stepType.id, unitName: unit.name, status, stepType })}
                                        >
                                            <span className="step-icon">
                                                {status === 'locked' ? '🔒' : stepType.icon}
                                            </span>
                                            {status === 'completed' && <div className="step-check-mark"><Check size={14} /></div>}
                                            {status === 'available' && <div className="step-pulse-ring" />}
                                        </motion.div>
                                        {status !== 'locked' && (
                                            <span className="st-step-label">{stepType.name}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Step Detail Modal */}
            <AnimatePresence>
                {selectedStep && (
                    <motion.div className="st-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setSelectedStep(null)}
                    >
                        <motion.div className="st-modal" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="st-modal-header" style={{ background: selectedStep.status === 'completed' ? '#00ff88' : selectedStep.status === 'available' ? meta.color : '#374151' }}>
                                <span className="st-modal-icon">{selectedStep.status === 'locked' ? '🔒' : selectedStep.stepType.icon}</span>
                            </div>
                            <div className="st-modal-body">
                                <h3>{selectedStep.stepType.name}</h3>
                                <p className="st-modal-unit">Ünite {selectedStep.unitId}: {selectedStep.unitName}</p>

                                {selectedStep.status === 'completed' && (
                                    <div className="st-modal-status completed">
                                        <Check size={18} /> Tamamlandı!
                                    </div>
                                )}
                                {selectedStep.status === 'locked' && (
                                    <div className="st-modal-status locked">
                                        <Lock size={18} /> Önceki adımı tamamlayın
                                    </div>
                                )}
                                {selectedStep.status === 'available' && (
                                    <>
                                        <div className="st-modal-xp">
                                            <Zap size={16} /> +{selectedStep.stepType.xp} XP kazanacaksın
                                        </div>
                                        <motion.button className="st-modal-btn" onClick={completeStep}
                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            style={{ background: meta.color }}
                                        >
                                            ✅ Tamamla
                                        </motion.button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Celebration */}
            <AnimatePresence>
                {celebration && (
                    <motion.div className="st-celebration"
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: -50 }}
                    >
                        <span className="st-celebration-icon">🎉</span>
                        <span className="st-celebration-xp">+{celebration.xp} XP</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading && (
                <div className="st-loading">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Star size={28} />
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default SkillTreePage;
