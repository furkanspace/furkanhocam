import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft, Plus, Check, X, Calendar, BookOpen, User,
    Clock, RefreshCw, Trash2, AlertCircle, CheckCircle2, XCircle,
    DollarSign, MessageCircle, Image, Send, Edit3, CreditCard
} from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:5001';
const LESSONS_URL = `${API_BASE}/api/lessons`;
const PAYMENTS_URL = `${API_BASE}/api/payments`;
const QUESTIONS_URL = `${API_BASE}/api/questions`;

const getToken = () => localStorage.getItem('token');
const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});
const authHeaders = () => ({ 'Authorization': `Bearer ${getToken()}` });

const SUBJECTS = ['Matematik', 'Fizik', 'İngilizce', 'Türkçe', 'Kimya', 'Biyoloji'];

const formatDate = (d) => d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
const formatDay = (d) => new Date(d).toLocaleDateString('tr-TR', { weekday: 'short' });

// ─── LESSONS TAB ────────────────────────────────────────
const LessonsTab = ({ isAdmin, user }) => {
    const [lessons, setLessons] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [makeupModal, setMakeupModal] = useState(null);
    const [makeupDate, setMakeupDate] = useState('');
    const [editingTopic, setEditingTopic] = useState(null);
    const [topicValue, setTopicValue] = useState('');
    const [newLesson, setNewLesson] = useState({ subject: SUBJECTS[0], scheduledDate: '', notes: '', topic: '' });

    useEffect(() => {
        if (isAdmin) {
            fetch(`${LESSONS_URL}/students`, { headers: headers() })
                .then(r => r.json()).then(setStudents).catch(console.error);
        }
    }, [isAdmin]);

    useEffect(() => { fetchLessons(); }, [selectedStudent]);

    const fetchLessons = async () => {
        setLoading(true);
        try {
            let url = LESSONS_URL;
            if (isAdmin && selectedStudent) url += `?studentId=${selectedStudent}`;
            const res = await fetch(url, { headers: headers() });
            setLessons(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const addLesson = async (e) => {
        e.preventDefault();
        if (!selectedStudent) return alert('Öğrenci seçin!');
        try {
            const res = await fetch(LESSONS_URL, {
                method: 'POST', headers: headers(),
                body: JSON.stringify({ student: selectedStudent, ...newLesson })
            });
            setLessons([...lessons, await res.json()]);
            setShowAdd(false);
            setNewLesson({ subject: SUBJECTS[0], scheduledDate: '', notes: '', topic: '' });
        } catch (e) { console.error(e); }
    };


    const markComplete = async (id) => {
        await fetch(`${LESSONS_URL}/${id}/complete`, { method: 'PUT', headers: headers() });
        fetchLessons();
    };

    const markMiss = async () => {
        if (!makeupModal) return;
        await fetch(`${LESSONS_URL}/${makeupModal}/miss`, {
            method: 'PUT', headers: headers(),
            body: JSON.stringify({ makeupDate: makeupDate || null })
        });
        setMakeupModal(null);
        fetchLessons();
    };

    const markMakeupComplete = async (id) => {
        await fetch(`${LESSONS_URL}/${id}/makeup-complete`, { method: 'PUT', headers: headers() });
        fetchLessons();
    };

    const deleteLesson = async (id) => {
        if (!confirm('Bu dersi silmek istediğinize emin misiniz?')) return;
        await fetch(`${LESSONS_URL}/${id}`, { method: 'DELETE', headers: headers() });
        setLessons(lessons.filter(l => l._id !== id));
    };

    const saveTopic = async (id) => {
        await fetch(`${LESSONS_URL}/${id}/update`, {
            method: 'PUT', headers: headers(),
            body: JSON.stringify({ topic: topicValue })
        });
        setEditingTopic(null);
        fetchLessons();
    };

    // Stats
    const total = lessons.length;
    const done = lessons.filter(l => l.completed).length;
    const missed = lessons.filter(l => l.missed && !l.makeupCompleted).length;
    const makeup = lessons.filter(l => l.makeupCompleted).length;
    const pct = total > 0 ? Math.round(((done + makeup) / total) * 100) : 0;

    const getStatus = (l) => {
        if (l.completed) return { cls: 'completed', text: '✅ Yapıldı', color: '#00ff88' };
        if (l.missed && l.makeupCompleted) return { cls: 'makeup-done', text: '🔄 Telafi Yapıldı', color: '#60a5fa' };
        if (l.missed && l.makeupDate) return { cls: 'makeup', text: `📅 Telafi: ${formatDate(l.makeupDate)}`, color: '#ffcc00' };
        if (l.missed) return { cls: 'missed', text: '❌ Kaçırıldı', color: '#ff6b6b' };
        return { cls: 'pending', text: '⏳ Bekliyor', color: 'rgba(255,255,255,0.5)' };
    };

    return (
        <div className="sp-tab-content">
            {/* Stats Bar */}
            <div className="sp-stats-bar">
                <div className="sp-stat"><span className="sp-stat-num">{total}</span><span className="sp-stat-label">Toplam</span></div>
                <div className="sp-stat sp-stat-green"><span className="sp-stat-num">{done}</span><span className="sp-stat-label">Yapılan</span></div>
                <div className="sp-stat sp-stat-red"><span className="sp-stat-num">{missed}</span><span className="sp-stat-label">Kaçırılan</span></div>
                <div className="sp-stat sp-stat-blue"><span className="sp-stat-num">{makeup}</span><span className="sp-stat-label">Telafi</span></div>
                <div className="sp-stat sp-stat-pct"><span className="sp-stat-num">{pct}%</span><span className="sp-stat-label">Devam</span></div>
            </div>

            {/* Admin Controls */}
            {isAdmin && (
                <div className="sp-admin-controls">
                    <div className="sp-student-select-wrapper">
                        <User size={18} />
                        <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="sp-student-select">
                            <option value="">Tüm Öğrenciler</option>
                            {students.map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}
                        </select>
                    </div>
                    <motion.button className="sp-btn-add" onClick={() => setShowAdd(!showAdd)} whileHover={{ scale: 1.05 }}>
                        <Plus size={18} /> Ders Ekle
                    </motion.button>
                </div>
            )}

            {/* Add Form */}
            <AnimatePresence>
                {showAdd && isAdmin && (
                    <motion.form className="sp-add-form glass-panel" onSubmit={addLesson}
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <h3><Calendar size={18} /> Yeni Ders</h3>
                        {!selectedStudent && <div className="sp-form-warning"><AlertCircle size={16} /> Önce öğrenci seçin</div>}
                        <div className="sp-form-row">
                            <div className="sp-form-group">
                                <label>Ders</label>
                                <select value={newLesson.subject} onChange={e => setNewLesson({ ...newLesson, subject: e.target.value })}>
                                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="sp-form-group">
                                <label>Tarih</label>
                                <input type="date" value={newLesson.scheduledDate} onChange={e => setNewLesson({ ...newLesson, scheduledDate: e.target.value })} required />
                            </div>
                        </div>
                        <div className="sp-form-row">
                            <div className="sp-form-group">
                                <label>Konu</label>
                                <input type="text" value={newLesson.topic} onChange={e => setNewLesson({ ...newLesson, topic: e.target.value })} placeholder="İşlenecek konu..." />
                            </div>
                            <div className="sp-form-group">
                                <label>Not</label>
                                <input type="text" value={newLesson.notes} onChange={e => setNewLesson({ ...newLesson, notes: e.target.value })} placeholder="Ek not..." />
                            </div>
                        </div>
                        <div className="sp-form-actions">
                            <button type="submit" className="sp-btn-submit" disabled={!selectedStudent}><Check size={18} /> Ekle</button>
                            <button type="button" className="sp-btn-cancel" onClick={() => setShowAdd(false)}><X size={18} /> İptal</button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Table */}
            {loading ? <div className="sp-loading">Yükleniyor...</div> :
                lessons.length === 0 ? <div className="sp-empty"><Calendar size={48} /><p>Henüz ders yok.</p></div> : (
                    <div className="sp-table-wrapper">
                        <table className="sp-table">
                            <thead>
                                <tr>
                                    {isAdmin && <th>Öğrenci</th>}
                                    <th>Ders</th>
                                    <th>Konu</th>
                                    <th>Tarih</th>
                                    <th>Durum</th>
                                    {isAdmin && <th>İşlem</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {lessons.map(l => {
                                    const st = getStatus(l);
                                    return (
                                        <tr key={l._id} className={`sp-row sp-row-${st.cls}`}>
                                            {isAdmin && <td className="sp-cell-student">{l.student?.fullName || '-'}</td>}
                                            <td className="sp-cell-subject">{l.subject}</td>
                                            <td className="sp-cell-topic">
                                                {editingTopic === l._id ? (
                                                    <div className="sp-topic-edit">
                                                        <input value={topicValue} onChange={e => setTopicValue(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && saveTopic(l._id)} />
                                                        <button onClick={() => saveTopic(l._id)}><Check size={14} /></button>
                                                        <button onClick={() => setEditingTopic(null)}><X size={14} /></button>
                                                    </div>
                                                ) : (
                                                    <span className="sp-topic-text" onClick={() => { if (isAdmin) { setEditingTopic(l._id); setTopicValue(l.topic || ''); } }}>
                                                        {l.topic || (isAdmin ? <span className="sp-topic-placeholder">+ Konu gir</span> : '-')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="sp-cell-date">{formatDay(l.scheduledDate)} {formatDate(l.scheduledDate)}</td>
                                            <td><span className={`sp-badge sp-badge-${st.cls}`} style={{ color: st.color }}>{st.text}</span></td>
                                            {isAdmin && (
                                                <td className="sp-cell-actions">
                                                    {!l.completed && !l.missed && <>
                                                        <button className="sp-act sp-act-ok" onClick={() => markComplete(l._id)} title="Yapıldı"><Check size={14} /></button>
                                                        <button className="sp-act sp-act-no" onClick={() => { setMakeupModal(l._id); setMakeupDate(''); }} title="Yapılmadı"><X size={14} /></button>
                                                    </>}
                                                    {l.missed && l.makeupDate && !l.makeupCompleted &&
                                                        <button className="sp-act sp-act-makeup" onClick={() => markMakeupComplete(l._id)} title="Telafi Yapıldı"><RefreshCw size={14} /></button>
                                                    }
                                                    <button className="sp-act sp-act-del" onClick={() => deleteLesson(l._id)} title="Sil"><Trash2 size={14} /></button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

            {/* Makeup Modal */}
            <AnimatePresence>
                {makeupModal && (
                    <motion.div className="sp-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMakeupModal(null)}>
                        <motion.div className="sp-modal glass-panel" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                            <h3><RefreshCw size={20} /> Telafi Tarihi</h3>
                            <p>Telafi için tarih seçin (opsiyonel):</p>
                            <input type="date" value={makeupDate} onChange={e => setMakeupDate(e.target.value)} className="sp-modal-date" />
                            <div className="sp-modal-actions">
                                <button className="sp-btn-submit" onClick={markMiss}><Check size={18} /> Kaydet</button>
                                <button className="sp-btn-cancel" onClick={() => setMakeupModal(null)}><X size={18} /> İptal</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── PAYMENTS TAB ──────────────────────────────────────
const PaymentsTab = ({ isAdmin, user }) => {
    const [payments, setPayments] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newPayment, setNewPayment] = useState({ amount: '', month: '', description: 'Aylık ders ücreti', dueDate: '' });

    useEffect(() => {
        if (isAdmin) {
            fetch(`${PAYMENTS_URL}/students`, { headers: headers() })
                .then(r => r.json()).then(setStudents).catch(console.error);
        }
    }, [isAdmin]);

    useEffect(() => { fetchPayments(); }, [selectedStudent]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            let url = PAYMENTS_URL;
            if (isAdmin && selectedStudent) url += `?studentId=${selectedStudent}`;
            const res = await fetch(url, { headers: headers() });
            setPayments(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const addPayment = async (e) => {
        e.preventDefault();
        if (!selectedStudent) return alert('Öğrenci seçin!');
        try {
            const res = await fetch(PAYMENTS_URL, {
                method: 'POST', headers: headers(),
                body: JSON.stringify({ student: selectedStudent, ...newPayment, amount: Number(newPayment.amount) })
            });
            setPayments([await res.json(), ...payments]);
            setShowAdd(false);
            setNewPayment({ amount: '', month: '', description: 'Aylık ders ücreti', dueDate: '' });
        } catch (e) { console.error(e); }
    };

    const markPaid = async (id) => {
        await fetch(`${PAYMENTS_URL}/${id}/pay`, { method: 'PUT', headers: headers() });
        fetchPayments();
    };

    const markOverdue = async (id) => {
        await fetch(`${PAYMENTS_URL}/${id}/overdue`, { method: 'PUT', headers: headers() });
        fetchPayments();
    };

    const deletePayment = async (id) => {
        if (!confirm('Ödeme kaydını silmek istediğinize emin misiniz?')) return;
        await fetch(`${PAYMENTS_URL}/${id}`, { method: 'DELETE', headers: headers() });
        setPayments(payments.filter(p => p._id !== id));
    };

    const getStatusBadge = (status) => {
        if (status === 'paid') return <span className="sp-badge sp-badge-completed">💰 Ödendi</span>;
        if (status === 'overdue') return <span className="sp-badge sp-badge-missed">⚠️ Gecikmiş</span>;
        return <span className="sp-badge sp-badge-pending">⏳ Bekliyor</span>;
    };

    // Stats
    const totalAmount = payments.reduce((s, p) => s + p.amount, 0);
    const paidAmount = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const pendingAmount = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

    return (
        <div className="sp-tab-content">
            <div className="sp-stats-bar">
                <div className="sp-stat"><span className="sp-stat-num">₺{totalAmount}</span><span className="sp-stat-label">Toplam</span></div>
                <div className="sp-stat sp-stat-green"><span className="sp-stat-num">₺{paidAmount}</span><span className="sp-stat-label">Ödenen</span></div>
                <div className="sp-stat sp-stat-red"><span className="sp-stat-num">₺{pendingAmount}</span><span className="sp-stat-label">Bekleyen</span></div>
            </div>

            {isAdmin && (
                <div className="sp-admin-controls">
                    <div className="sp-student-select-wrapper">
                        <User size={18} />
                        <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="sp-student-select">
                            <option value="">Tüm Öğrenciler</option>
                            {students.map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}
                        </select>
                    </div>
                    <motion.button className="sp-btn-add" onClick={() => setShowAdd(!showAdd)} whileHover={{ scale: 1.05 }}>
                        <Plus size={18} /> Ödeme Ekle
                    </motion.button>
                </div>
            )}

            <AnimatePresence>
                {showAdd && isAdmin && (
                    <motion.form className="sp-add-form glass-panel" onSubmit={addPayment}
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <h3><CreditCard size={18} /> Yeni Ödeme</h3>
                        {!selectedStudent && <div className="sp-form-warning"><AlertCircle size={16} /> Önce öğrenci seçin</div>}
                        <div className="sp-form-row">
                            <div className="sp-form-group"><label>Tutar (₺)</label>
                                <input type="number" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} required placeholder="1500" />
                            </div>
                            <div className="sp-form-group"><label>Ay</label>
                                <input type="month" value={newPayment.month} onChange={e => setNewPayment({ ...newPayment, month: e.target.value })} required />
                            </div>
                        </div>
                        <div className="sp-form-row">
                            <div className="sp-form-group"><label>Açıklama</label>
                                <input type="text" value={newPayment.description} onChange={e => setNewPayment({ ...newPayment, description: e.target.value })} />
                            </div>
                            <div className="sp-form-group"><label>Son Ödeme Tarihi</label>
                                <input type="date" value={newPayment.dueDate} onChange={e => setNewPayment({ ...newPayment, dueDate: e.target.value })} required />
                            </div>
                        </div>
                        <div className="sp-form-actions">
                            <button type="submit" className="sp-btn-submit" disabled={!selectedStudent}><Check size={18} /> Ekle</button>
                            <button type="button" className="sp-btn-cancel" onClick={() => setShowAdd(false)}><X size={18} /> İptal</button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {loading ? <div className="sp-loading">Yükleniyor...</div> :
                payments.length === 0 ? <div className="sp-empty"><CreditCard size={48} /><p>Ödeme kaydı yok.</p></div> : (
                    <div className="sp-table-wrapper">
                        <table className="sp-table">
                            <thead>
                                <tr>
                                    {isAdmin && <th>Öğrenci</th>}
                                    <th>Ay</th>
                                    <th>Açıklama</th>
                                    <th>Tutar</th>
                                    <th>Son Tarih</th>
                                    <th>Durum</th>
                                    {isAdmin && <th>İşlem</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(p => (
                                    <tr key={p._id} className={`sp-row sp-row-${p.status === 'paid' ? 'completed' : p.status === 'overdue' ? 'missed' : 'pending'}`}>
                                        {isAdmin && <td className="sp-cell-student">{p.student?.fullName || '-'}</td>}
                                        <td>{p.month}</td>
                                        <td>{p.description}</td>
                                        <td className="sp-cell-amount">₺{p.amount}</td>
                                        <td className="sp-cell-date">{formatDate(p.dueDate)}</td>
                                        <td>{getStatusBadge(p.status)}</td>
                                        {isAdmin && (
                                            <td className="sp-cell-actions">
                                                {p.status !== 'paid' && <button className="sp-act sp-act-ok" onClick={() => markPaid(p._id)} title="Ödendi"><Check size={14} /></button>}
                                                {p.status === 'pending' && <button className="sp-act sp-act-no" onClick={() => markOverdue(p._id)} title="Gecikmiş"><AlertCircle size={14} /></button>}
                                                <button className="sp-act sp-act-del" onClick={() => deletePayment(p._id)} title="Sil"><Trash2 size={14} /></button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
        </div>
    );
};

// ─── QUESTIONS TAB ─────────────────────────────────────
const QuestionsTab = ({ isAdmin, user }) => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [newQ, setNewQ] = useState({ subject: SUBJECTS[0], text: '' });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [answerModal, setAnswerModal] = useState(null);
    const [answerText, setAnswerText] = useState('');

    useEffect(() => { fetchQuestions(); }, []);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const res = await fetch(QUESTIONS_URL, { headers: headers() });
            setQuestions(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const addQuestion = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('subject', newQ.subject);
            formData.append('text', newQ.text);
            if (imageFile) formData.append('image', imageFile);

            const res = await fetch(QUESTIONS_URL, {
                method: 'POST',
                headers: authHeaders(),
                body: formData
            });
            const data = await res.json();
            setQuestions([data, ...questions]);
            setShowAdd(false);
            setNewQ({ subject: SUBJECTS[0], text: '' });
            setImageFile(null);
            setImagePreview(null);
        } catch (e) { console.error(e); }
    };

    const submitAnswer = async () => {
        if (!answerModal || !answerText.trim()) return;
        await fetch(`${QUESTIONS_URL}/${answerModal}/answer`, {
            method: 'PUT', headers: headers(),
            body: JSON.stringify({ answer: answerText })
        });
        setAnswerModal(null);
        setAnswerText('');
        fetchQuestions();
    };

    const deleteQuestion = async (id) => {
        if (!confirm('Soruyu silmek istediğinize emin misiniz?')) return;
        await fetch(`${QUESTIONS_URL}/${id}`, { method: 'DELETE', headers: headers() });
        setQuestions(questions.filter(q => q._id !== id));
    };

    const isStudent = user?.role === 'student';

    return (
        <div className="sp-tab-content">
            {isStudent && (
                <div className="sp-admin-controls">
                    <motion.button className="sp-btn-add" onClick={() => setShowAdd(!showAdd)} whileHover={{ scale: 1.05 }}>
                        <Plus size={18} /> Soru Sor
                    </motion.button>
                </div>
            )}

            <AnimatePresence>
                {showAdd && isStudent && (
                    <motion.form className="sp-add-form glass-panel" onSubmit={addQuestion}
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <h3><MessageCircle size={18} /> Yeni Soru</h3>
                        <div className="sp-form-group">
                            <label>Ders</label>
                            <select value={newQ.subject} onChange={e => setNewQ({ ...newQ, subject: e.target.value })}>
                                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="sp-form-group">
                            <label>Sorunuz</label>
                            <textarea value={newQ.text} onChange={e => setNewQ({ ...newQ, text: e.target.value })} placeholder="Sorunuzu yazın..." rows={3} required className="sp-textarea" />
                        </div>
                        <div className="sp-form-group">
                            <label>Görsel Ekle (opsiyonel)</label>
                            <div className="sp-image-upload">
                                <label className="sp-image-upload-btn">
                                    <Image size={18} /> Görsel Seç
                                    <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                                </label>
                                {imagePreview && <img src={imagePreview} alt="preview" className="sp-image-preview" />}
                            </div>
                        </div>
                        <div className="sp-form-actions">
                            <button type="submit" className="sp-btn-submit"><Send size={18} /> Gönder</button>
                            <button type="button" className="sp-btn-cancel" onClick={() => { setShowAdd(false); setImageFile(null); setImagePreview(null); }}><X size={18} /> İptal</button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {loading ? <div className="sp-loading">Yükleniyor...</div> :
                questions.length === 0 ? <div className="sp-empty"><MessageCircle size={48} /><p>Henüz soru yok.</p></div> : (
                    <div className="sp-questions-list">
                        {questions.map(q => (
                            <motion.div key={q._id} className={`sp-question-card ${q.answer ? 'sp-q-answered' : 'sp-q-unanswered'}`}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="sp-q-header">
                                    <span className="sp-q-subject">{q.subject}</span>
                                    <span className="sp-q-date">{formatDate(q.createdAt)}</span>
                                    {q.student && <span className="sp-q-student"><User size={12} /> {q.student.fullName}</span>}
                                </div>
                                <p className="sp-q-text">{q.text}</p>
                                {q.image && <img src={`${API_BASE}${q.image}`} alt="soru-görseli" className="sp-q-image" />}
                                {q.answer ? (
                                    <div className="sp-q-answer">
                                        <strong><CheckCircle2 size={14} /> Yanıt{q.answeredBy ? ` (${q.answeredBy.fullName})` : ''}:</strong>
                                        <p>{q.answer}</p>
                                    </div>
                                ) : (
                                    <div className="sp-q-no-answer">
                                        <Clock size={14} /> Henüz yanıtlanmadı
                                    </div>
                                )}
                                <div className="sp-q-actions">
                                    {(isAdmin) && !q.answer && (
                                        <button className="sp-act sp-act-ok" onClick={() => { setAnswerModal(q._id); setAnswerText(''); }}>
                                            <Edit3 size={14} /> Yanıtla
                                        </button>
                                    )}
                                    {isAdmin && <button className="sp-act sp-act-del" onClick={() => deleteQuestion(q._id)}><Trash2 size={14} /></button>}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

            {/* Answer Modal */}
            <AnimatePresence>
                {answerModal && (
                    <motion.div className="sp-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAnswerModal(null)}>
                        <motion.div className="sp-modal glass-panel" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                            <h3><Edit3 size={20} /> Yanıtla</h3>
                            <textarea value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="Yanıtınızı yazın..." rows={4} className="sp-textarea" />
                            <div className="sp-modal-actions">
                                <button className="sp-btn-submit" onClick={submitAnswer}><Send size={18} /> Gönder</button>
                                <button className="sp-btn-cancel" onClick={() => setAnswerModal(null)}><X size={18} /> İptal</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── MAIN STUDENT PANEL ────────────────────────────────
const StudentPanel = ({ onBack }) => {
    const { user, isAdmin } = useAuth();
    const isStudent = user?.role === 'student';
    const isParent = user?.role === 'parent';

    // Tabs config based on role
    const tabs = [
        { id: 'lessons', label: '📚 Dersler', icon: <BookOpen size={18} /> }
    ];

    // Questions: visible to everyone except parent-only (parents see below)
    if (isStudent || isAdmin || user?.role === 'staff' || isParent) {
        tabs.push({ id: 'questions', label: '❓ Sorular', icon: <MessageCircle size={18} /> });
    }

    // Payments: only admin and parent
    if (isParent || isAdmin) {
        tabs.push({ id: 'payments', label: '💰 Ödemeler', icon: <CreditCard size={18} /> });
    }

    const [activeTab, setActiveTab] = useState('lessons');

    return (
        <div className="sp-page">
            <div className="sp-header">
                <motion.button className="sp-btn-back" onClick={onBack} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <ArrowLeft size={20} /> Geri
                </motion.button>
                <div className="sp-title">
                    <BookOpen size={36} className="sp-title-icon" />
                    <h1>Eğitim Paneli</h1>
                    <p>{isAdmin ? 'Öğrenci yönetim sistemi' : isStudent ? 'Ders programınız ve sorularınız' : 'Eğitim durumu ve ödemeler'}</p>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="sp-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`sp-tab ${activeTab === tab.id ? 'sp-tab-active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'lessons' && <motion.div key="lessons" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><LessonsTab isAdmin={isAdmin || user?.role === 'staff'} user={user} /></motion.div>}
                {activeTab === 'payments' && <motion.div key="payments" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><PaymentsTab isAdmin={isAdmin} user={user} /></motion.div>}
                {activeTab === 'questions' && <motion.div key="questions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}><QuestionsTab isAdmin={isAdmin || user?.role === 'staff'} user={user} /></motion.div>}
            </AnimatePresence>
        </div>
    );
};

export default StudentPanel;
