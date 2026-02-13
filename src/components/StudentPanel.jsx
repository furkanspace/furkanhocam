import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft, Plus, Check, X, Calendar, BookOpen, User,
    Clock, RefreshCw, Trash2, AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';

const API_URL = import.meta.env.PROD ? '/api/lessons' : 'http://localhost:5001/api/lessons';

const getToken = () => localStorage.getItem('token');
const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

const SUBJECTS = ['Matematik', 'Fizik', 'İngilizce', 'Türkçe', 'Kimya', 'Biyoloji'];

const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const formatDay = (date) => {
    return new Date(date).toLocaleDateString('tr-TR', { weekday: 'short' });
};

const StudentPanel = ({ onBack }) => {
    const { user, isAdmin } = useAuth();
    const [lessons, setLessons] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [makeupModal, setMakeupModal] = useState(null);
    const [makeupDate, setMakeupDate] = useState('');

    // New lesson form
    const [newLesson, setNewLesson] = useState({
        subject: SUBJECTS[0],
        scheduledDate: '',
        notes: ''
    });

    // Fetch students (admin only)
    useEffect(() => {
        if (isAdmin) {
            fetch(`${API_URL}/students`, { headers: headers() })
                .then(res => res.json())
                .then(data => setStudents(data))
                .catch(err => console.error(err));
        }
    }, [isAdmin]);

    // Fetch lessons
    useEffect(() => {
        fetchLessons();
    }, [selectedStudent]);

    const fetchLessons = async () => {
        setLoading(true);
        try {
            let url = API_URL;
            if (isAdmin && selectedStudent) {
                url += `?studentId=${selectedStudent}`;
            }
            const res = await fetch(url, { headers: headers() });
            const data = await res.json();
            setLessons(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLesson = async (e) => {
        e.preventDefault();
        if (!selectedStudent) return alert('Lütfen bir öğrenci seçin!');

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({
                    student: selectedStudent,
                    subject: newLesson.subject,
                    scheduledDate: newLesson.scheduledDate,
                    notes: newLesson.notes
                })
            });
            const data = await res.json();
            setLessons([...lessons, data]);
            setShowAddForm(false);
            setNewLesson({ subject: SUBJECTS[0], scheduledDate: '', notes: '' });
        } catch (err) {
            console.error(err);
        }
    };

    const handleComplete = async (id) => {
        try {
            const res = await fetch(`${API_URL}/${id}/complete`, {
                method: 'PUT',
                headers: headers()
            });
            const updated = await res.json();
            setLessons(lessons.map(l => l._id === id ? updated : l));
        } catch (err) {
            console.error(err);
        }
    };

    const handleMiss = async (id) => {
        setMakeupModal(id);
        setMakeupDate('');
    };

    const handleMissConfirm = async () => {
        if (!makeupModal) return;
        try {
            const res = await fetch(`${API_URL}/${makeupModal}/miss`, {
                method: 'PUT',
                headers: headers(),
                body: JSON.stringify({ makeupDate: makeupDate || null })
            });
            const updated = await res.json();
            setLessons(lessons.map(l => l._id === makeupModal ? updated : l));
            setMakeupModal(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleMakeupComplete = async (id) => {
        try {
            const res = await fetch(`${API_URL}/${id}/makeup-complete`, {
                method: 'PUT',
                headers: headers()
            });
            const updated = await res.json();
            setLessons(lessons.map(l => l._id === id ? updated : l));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu dersi silmek istediğinize emin misiniz?')) return;
        try {
            await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: headers()
            });
            setLessons(lessons.filter(l => l._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusBadge = (lesson) => {
        if (lesson.completed) {
            return <span className="sp-badge sp-badge-completed"><CheckCircle2 size={14} /> Yapıldı</span>;
        }
        if (lesson.missed && lesson.makeupCompleted) {
            return <span className="sp-badge sp-badge-makeup-done"><RefreshCw size={14} /> Telafi Yapıldı</span>;
        }
        if (lesson.missed && lesson.makeupDate) {
            return <span className="sp-badge sp-badge-makeup"><Clock size={14} /> Telafi: {formatDate(lesson.makeupDate)}</span>;
        }
        if (lesson.missed) {
            return <span className="sp-badge sp-badge-missed"><XCircle size={14} /> Kaçırıldı</span>;
        }
        return <span className="sp-badge sp-badge-pending"><Clock size={14} /> Bekliyor</span>;
    };

    // Group lessons by week
    const groupedLessons = lessons.reduce((acc, lesson) => {
        const date = new Date(lesson.scheduledDate);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
        const key = weekStart.toISOString().split('T')[0];
        if (!acc[key]) acc[key] = [];
        acc[key].push(lesson);
        return acc;
    }, {});

    return (
        <div className="sp-page">
            {/* Header */}
            <div className="sp-header">
                <motion.button
                    className="sp-btn-back"
                    onClick={onBack}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft size={20} /> Geri
                </motion.button>

                <div className="sp-title">
                    <BookOpen size={36} className="sp-title-icon" />
                    <h1>Ders Takip Paneli</h1>
                    <p>{isAdmin ? 'Öğrenci derslerini yönetin' : 'Ders programınızı takip edin'}</p>
                </div>
            </div>

            {/* Admin Controls */}
            {isAdmin && (
                <div className="sp-admin-controls">
                    <div className="sp-student-select-wrapper">
                        <User size={18} />
                        <select
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            className="sp-student-select"
                        >
                            <option value="">Tüm Öğrenciler</option>
                            {students.map(s => (
                                <option key={s._id} value={s._id}>{s.fullName}</option>
                            ))}
                        </select>
                    </div>

                    <motion.button
                        className="sp-btn-add"
                        onClick={() => setShowAddForm(!showAddForm)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Plus size={18} /> Ders Ekle
                    </motion.button>
                </div>
            )}

            {/* Add Lesson Form */}
            <AnimatePresence>
                {showAddForm && isAdmin && (
                    <motion.form
                        className="sp-add-form glass-panel"
                        onSubmit={handleAddLesson}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <h3><Calendar size={18} /> Yeni Ders Ekle</h3>

                        {!selectedStudent && (
                            <div className="sp-form-warning">
                                <AlertCircle size={16} /> Önce bir öğrenci seçin
                            </div>
                        )}

                        <div className="sp-form-row">
                            <div className="sp-form-group">
                                <label>Ders</label>
                                <select
                                    value={newLesson.subject}
                                    onChange={(e) => setNewLesson({ ...newLesson, subject: e.target.value })}
                                >
                                    {SUBJECTS.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sp-form-group">
                                <label>Tarih</label>
                                <input
                                    type="date"
                                    value={newLesson.scheduledDate}
                                    onChange={(e) => setNewLesson({ ...newLesson, scheduledDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="sp-form-group">
                            <label>Not (opsiyonel)</label>
                            <input
                                type="text"
                                value={newLesson.notes}
                                onChange={(e) => setNewLesson({ ...newLesson, notes: e.target.value })}
                                placeholder="Ders hakkında not..."
                            />
                        </div>

                        <div className="sp-form-actions">
                            <button type="submit" className="sp-btn-submit" disabled={!selectedStudent}>
                                <Check size={18} /> Ekle
                            </button>
                            <button type="button" className="sp-btn-cancel" onClick={() => setShowAddForm(false)}>
                                <X size={18} /> İptal
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Lessons List */}
            <div className="sp-lessons-container">
                {loading ? (
                    <div className="sp-loading">Yükleniyor...</div>
                ) : lessons.length === 0 ? (
                    <div className="sp-empty">
                        <Calendar size={48} />
                        <p>{isAdmin ? 'Henüz ders atanmamış. Yukarıdan ders ekleyin.' : 'Henüz ders programınız yok.'}</p>
                    </div>
                ) : (
                    Object.entries(groupedLessons).sort(([a], [b]) => new Date(a) - new Date(b)).map(([weekKey, weekLessons]) => (
                        <motion.div
                            key={weekKey}
                            className="sp-week-group"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h3 className="sp-week-label">
                                <Calendar size={16} />
                                {formatDate(weekKey)} haftası
                            </h3>

                            <div className="sp-lesson-cards">
                                {weekLessons.map(lesson => (
                                    <motion.div
                                        key={lesson._id}
                                        className={`sp-lesson-card ${lesson.completed ? 'sp-card-completed' : ''} ${lesson.missed ? 'sp-card-missed' : ''} ${lesson.makeupCompleted ? 'sp-card-makeup-done' : ''}`}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <div className="sp-card-top">
                                            <div className="sp-card-info">
                                                <span className="sp-card-subject">{lesson.subject}</span>
                                                <span className="sp-card-date">
                                                    {formatDay(lesson.scheduledDate)} - {formatDate(lesson.scheduledDate)}
                                                </span>
                                                {isAdmin && lesson.student && (
                                                    <span className="sp-card-student">
                                                        <User size={12} /> {lesson.student.fullName}
                                                    </span>
                                                )}
                                            </div>
                                            {getStatusBadge(lesson)}
                                        </div>

                                        {lesson.notes && (
                                            <div className="sp-card-notes">{lesson.notes}</div>
                                        )}

                                        {/* Admin Actions */}
                                        {isAdmin && (
                                            <div className="sp-card-actions">
                                                {!lesson.completed && !lesson.missed && (
                                                    <>
                                                        <button className="sp-action-btn sp-action-complete" onClick={() => handleComplete(lesson._id)}>
                                                            <Check size={14} /> Yapıldı
                                                        </button>
                                                        <button className="sp-action-btn sp-action-miss" onClick={() => handleMiss(lesson._id)}>
                                                            <X size={14} /> Yapılmadı
                                                        </button>
                                                    </>
                                                )}
                                                {lesson.missed && lesson.makeupDate && !lesson.makeupCompleted && (
                                                    <button className="sp-action-btn sp-action-makeup" onClick={() => handleMakeupComplete(lesson._id)}>
                                                        <RefreshCw size={14} /> Telafi Yapıldı
                                                    </button>
                                                )}
                                                <button className="sp-action-btn sp-action-delete" onClick={() => handleDelete(lesson._id)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Makeup Modal */}
            <AnimatePresence>
                {makeupModal && (
                    <motion.div
                        className="sp-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMakeupModal(null)}
                    >
                        <motion.div
                            className="sp-modal glass-panel"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <h3><RefreshCw size={20} /> Telafi Tarihi</h3>
                            <p>Telafi dersi için bir tarih seçin (opsiyonel):</p>
                            <input
                                type="date"
                                value={makeupDate}
                                onChange={(e) => setMakeupDate(e.target.value)}
                                className="sp-modal-date"
                            />
                            <div className="sp-modal-actions">
                                <button className="sp-btn-submit" onClick={handleMissConfirm}>
                                    <Check size={18} /> Kaydet
                                </button>
                                <button className="sp-btn-cancel" onClick={() => setMakeupModal(null)}>
                                    <X size={18} /> İptal
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentPanel;
