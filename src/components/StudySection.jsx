import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Atom, Calculator, Languages, BookOpen } from 'lucide-react';

const subjects = [
    {
        id: 'physics',
        name: 'FİZİK',
        icon: Atom,
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
        description: 'Evrenin yasalarını keşfet'
    },
    {
        id: 'math',
        name: 'MATEMATİK',
        icon: Calculator,
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
        description: 'Sayıların gücünü öğren'
    },
    {
        id: 'english',
        name: 'İNGİLİZCE',
        icon: Languages,
        color: '#ec4899',
        gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
        description: 'Dünyayla iletişim kur'
    }
];

const StudySection = ({ onBack, onSelectSubject }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="study-section-page"
        >
            {/* Header */}
            <div className="study-header">
                <button onClick={onBack} className="btn-back-study">
                    <ArrowLeft size={20} /> Ana Menü
                </button>
                <div className="study-title">
                    <BookOpen size={40} className="study-title-icon" />
                    <h1>DERS ZAMANI DERS</h1>
                    <p>Hangi dersi çalışmak istiyorsun?</p>
                </div>
            </div>

            {/* Subject Cards */}
            <div className="subjects-grid">
                {subjects.map((subject, index) => {
                    const IconComponent = subject.icon;
                    return (
                        <motion.div
                            key={subject.id}
                            className="subject-card"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.15 }}
                            whileHover={{ scale: 1.05, y: -10 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelectSubject && onSelectSubject(subject)}
                            style={{ '--subject-color': subject.color, '--subject-gradient': subject.gradient }}
                        >
                            <motion.div
                                className="subject-icon-wrapper"
                                animate={{
                                    boxShadow: [`0 0 20px ${subject.color}40`, `0 0 40px ${subject.color}60`, `0 0 20px ${subject.color}40`]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <IconComponent size={50} />
                            </motion.div>
                            <h2>{subject.name}</h2>
                            <p>{subject.description}</p>
                            <motion.div
                                className="subject-glow"
                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </motion.div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="study-footer">
                <p>🎯 Hedefine odaklan, başarı seninle!</p>
            </div>
        </motion.div>
    );
};

export default StudySection;
