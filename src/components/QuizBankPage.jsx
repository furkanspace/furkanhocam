import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    Plus, Edit3, Trash2, Search, Filter, ArrowLeft, Save, X,
    BookOpen, AlertCircle, CheckCircle
} from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5001';
const getToken = () => localStorage.getItem('token');
const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

const SUBJECTS = ['İngilizce', 'Fizik', 'Matematik', 'Genel Kültür'];
const DIFFICULTY_LABELS = { 1: 'Kolay', 2: 'Orta', 3: 'Zor' };
const DIFFICULTY_COLORS = { 1: '#00ff88', 2: '#ffcc00', 3: '#ff6b6b' };

const QuizBankPage = ({ onBack }) => {
    const { user } = useAuth();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingQ, setEditingQ] = useState(null);
    const [filterSubject, setFilterSubject] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('');
    const [searchTopic, setSearchTopic] = useState('');

    // Form state
    const [form, setForm] = useState({
        subject: 'İngilizce', topic: '', difficulty: 1,
        type: 'multiple_choice', questionText: '',
        options: ['', '', '', ''], correctAnswer: 0, explanation: ''
    });

    useEffect(() => { fetchQuestions(); }, [filterSubject, filterDifficulty]);

    const fetchQuestions = async () => {
        try {
            let url = `${API_BASE}/api/quiz/questions?`;
            if (filterSubject) url += `subject=${encodeURIComponent(filterSubject)}&`;
            if (filterDifficulty) url += `difficulty=${filterDifficulty}&`;
            if (searchTopic) url += `topic=${encodeURIComponent(searchTopic)}&`;
            const res = await fetch(url, { headers: headers() });
            const data = await res.json();
            setQuestions(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openNew = () => {
        setEditingQ(null);
        setForm({
            subject: 'İngilizce', topic: '', difficulty: 1,
            type: 'multiple_choice', questionText: '',
            options: ['', '', '', ''], correctAnswer: 0, explanation: ''
        });
        setShowModal(true);
    };

    const openEdit = (q) => {
        setEditingQ(q);
        setForm({
            subject: q.subject, topic: q.topic, difficulty: q.difficulty,
            type: q.type, questionText: q.questionText,
            options: [...q.options], correctAnswer: q.correctAnswer,
            explanation: q.explanation || ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.questionText.trim() || !form.topic.trim()) return;
        const cleanOptions = form.options.filter(o => o.trim());
        if (cleanOptions.length < 2) return;

        const body = { ...form, options: cleanOptions };
        try {
            if (editingQ) {
                const res = await fetch(`${API_BASE}/api/quiz/questions/${editingQ._id}`, {
                    method: 'PUT', headers: headers(), body: JSON.stringify(body)
                });
                if (!res.ok) { const err = await res.json(); alert(err.message || 'Hata oluştu'); return; }
                const updated = await res.json();
                if (updated && updated._id) {
                    setQuestions(questions.map(q => q._id === editingQ._id ? updated : q));
                }
            } else {
                const res = await fetch(`${API_BASE}/api/quiz/questions`, {
                    method: 'POST', headers: headers(), body: JSON.stringify(body)
                });
                if (!res.ok) { const err = await res.json(); alert(err.message || 'Hata oluştu'); return; }
                const newQ = await res.json();
                if (newQ && newQ._id) {
                    setQuestions([newQ, ...questions]);
                }
            }
            setShowModal(false);
        } catch (e) { console.error(e); alert('Bağlantı hatası'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;
        try {
            await fetch(`${API_BASE}/api/quiz/questions/${id}`, { method: 'DELETE', headers: headers() });
            setQuestions(questions.filter(q => q._id !== id));
        } catch (e) { console.error(e); }
    };

    const updateOption = (idx, val) => {
        const newOpts = [...form.options];
        newOpts[idx] = val;
        setForm({ ...form, options: newOpts });
    };

    const addOption = () => {
        if (form.options.length < 6) setForm({ ...form, options: [...form.options, ''] });
    };

    const removeOption = (idx) => {
        if (form.options.length <= 2) return;
        const newOpts = form.options.filter((_, i) => i !== idx);
        let ca = form.correctAnswer;
        if (idx === ca) ca = 0;
        else if (idx < ca) ca--;
        setForm({ ...form, options: newOpts, correctAnswer: ca });
    };

    return (
        <div className="qb-page">
            <div className="qb-header">
                <motion.button className="sp-btn-back" onClick={onBack} whileHover={{ scale: 1.05 }}>
                    <ArrowLeft size={20} /> Geri
                </motion.button>
                <h1><BookOpen size={24} /> Soru Bankası</h1>
                <span className="qb-count">{questions.length} soru</span>
            </div>

            {/* Filters + Add */}
            <div className="qb-toolbar">
                <div className="qb-filters">
                    <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                        <option value="">Tüm Dersler</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
                        <option value="">Tüm Zorluk</option>
                        <option value="1">Kolay</option>
                        <option value="2">Orta</option>
                        <option value="3">Zor</option>
                    </select>
                    <div className="qb-search">
                        <Search size={16} />
                        <input placeholder="Konu ara..." value={searchTopic}
                            onChange={e => setSearchTopic(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchQuestions()} />
                    </div>
                </div>
                <motion.button className="qb-add-btn" onClick={openNew} whileHover={{ scale: 1.05 }}>
                    <Plus size={18} /> Soru Ekle
                </motion.button>
            </div>

            {/* Questions List */}
            {loading ? <p className="qb-loading">Yükleniyor...</p> : (
                <div className="qb-list">
                    {questions.length === 0 ? (
                        <div className="qb-empty">
                            <AlertCircle size={48} />
                            <p>Henüz soru eklenmemiş</p>
                            <button onClick={openNew}>İlk soruyu ekle</button>
                        </div>
                    ) : questions.map((q, i) => (
                        <motion.div key={q._id} className="qb-card"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}>
                            <div className="qb-card-top">
                                <span className="qb-card-subject">{q.subject}</span>
                                <span className="qb-card-diff" style={{ color: DIFFICULTY_COLORS[q.difficulty] }}>
                                    {DIFFICULTY_LABELS[q.difficulty]}
                                </span>
                                <span className="qb-card-topic">{q.topic}</span>
                            </div>
                            <p className="qb-card-text">{q.questionText}</p>
                            <div className="qb-card-options">
                                {(q.options || []).map((opt, oi) => (
                                    <span key={oi} className={`qb-opt ${oi === q.correctAnswer ? 'qb-opt-correct' : ''}`}>
                                        {String.fromCharCode(65 + oi)}) {opt}
                                    </span>
                                ))}
                            </div>
                            <div className="qb-card-actions">
                                <button onClick={() => openEdit(q)}><Edit3 size={14} /> Düzenle</button>
                                <button onClick={() => handleDelete(q._id)} className="qb-btn-del"><Trash2 size={14} /> Sil</button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div className="qb-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowModal(false)}>
                        <motion.div className="qb-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}>
                            <div className="qb-modal-header">
                                <h2>{editingQ ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}</h2>
                                <button onClick={() => setShowModal(false)}><X size={20} /></button>
                            </div>
                            <div className="qb-modal-body">
                                <div className="qb-form-row">
                                    <label>Ders
                                        <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </label>
                                    <label>Konu
                                        <input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="ör: Present Simple" />
                                    </label>
                                    <label>Zorluk
                                        <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: parseInt(e.target.value) })}>
                                            <option value={1}>Kolay</option>
                                            <option value={2}>Orta</option>
                                            <option value={3}>Zor</option>
                                        </select>
                                    </label>
                                </div>
                                <label className="qb-form-full">Soru Metni
                                    <textarea rows={3} value={form.questionText}
                                        onChange={e => setForm({ ...form, questionText: e.target.value })}
                                        placeholder="Soruyu yazın..." />
                                </label>
                                <div className="qb-options-edit">
                                    <span className="qb-opts-title">Seçenekler</span>
                                    {form.options.map((opt, i) => (
                                        <div key={i} className="qb-opt-row">
                                            <input type="radio" name="correct" checked={form.correctAnswer === i}
                                                onChange={() => setForm({ ...form, correctAnswer: i })} />
                                            <span className="qb-opt-label">{String.fromCharCode(65 + i)})</span>
                                            <input value={opt} onChange={e => updateOption(i, e.target.value)}
                                                placeholder={`Seçenek ${String.fromCharCode(65 + i)}`} />
                                            {form.options.length > 2 && (
                                                <button className="qb-opt-rm" onClick={() => removeOption(i)}><X size={14} /></button>
                                            )}
                                        </div>
                                    ))}
                                    {form.options.length < 6 && (
                                        <button className="qb-opt-add" onClick={addOption}>+ Seçenek Ekle</button>
                                    )}
                                </div>
                                <label className="qb-form-full">Açıklama (opsiyonel)
                                    <textarea rows={2} value={form.explanation}
                                        onChange={e => setForm({ ...form, explanation: e.target.value })}
                                        placeholder="Doğru cevabın açıklaması..." />
                                </label>
                            </div>
                            <div className="qb-modal-footer">
                                <button className="qb-btn-cancel" onClick={() => setShowModal(false)}>İptal</button>
                                <button className="qb-btn-save" onClick={handleSave}><Save size={16} /> Kaydet</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QuizBankPage;
