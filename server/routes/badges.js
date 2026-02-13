const express = require('express');
const router = express.Router();
const QuizAttempt = require('../models/QuizAttempt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gizli_anahtar_degistir_bunu';

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access Denied' });
    try {
        const verified = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// Badge definitions — same IDs used by frontend
const BADGE_DEFS = [
    // Ders rozetleri
    { id: 'first_lesson', category: 'lesson', check: (s) => s.lessonsDone >= 1 },
    { id: 'streak_3', category: 'lesson', check: (s) => s.lessonsDone >= 3 },
    { id: 'streak_7', category: 'lesson', check: (s) => s.lessonsDone >= 7 },
    { id: 'ten_done', category: 'lesson', check: (s) => s.lessonsDone >= 10 },
    { id: 'twenty_done', category: 'lesson', check: (s) => s.lessonsDone >= 20 },
    { id: 'fifty_done', category: 'lesson', check: (s) => s.lessonsDone >= 50 },
    { id: 'hundred_done', category: 'lesson', check: (s) => s.lessonsDone >= 100 },
    { id: 'perfect_week', category: 'lesson', check: (s) => s.lessonsDone >= 5 && s.lessonsMissed === 0 },
    { id: 'makeup_hero', category: 'lesson', check: (s) => s.lessonsMakeup >= 1 },
    { id: 'high_pct', category: 'lesson', check: (s) => s.lessonsTotal >= 5 && ((s.lessonsDone + s.lessonsMakeup) / s.lessonsTotal * 100) >= 90 },
    // Quiz rozetleri
    { id: 'first_quiz', category: 'quiz', check: (s) => s.quizCount >= 1 },
    { id: 'quiz_fan', category: 'quiz', check: (s) => s.quizCount >= 5 },
    { id: 'quiz_master', category: 'quiz', check: (s) => s.quizCount >= 25 },
    { id: 'perfect_score', category: 'quiz', check: (s) => s.quizPerfect >= 1 },
    { id: 'streak_start', category: 'quiz', check: (s) => s.quizMaxStreak >= 3 },
    { id: 'weekly_streak', category: 'quiz', check: (s) => s.quizMaxStreak >= 7 },
    { id: 'monthly_streak', category: 'quiz', check: (s) => s.quizMaxStreak >= 30 },
    { id: 'xp_hunter', category: 'quiz', check: (s) => s.totalXP >= 100 },
    { id: 'xp_master', category: 'quiz', check: (s) => s.totalXP >= 500 },
    { id: 'xp_legend', category: 'quiz', check: (s) => s.totalXP >= 1000 },
];

// GET /api/badges/my — Birleşik istatistikler + rozet durumu
router.get('/my', verifyToken, async (req, res) => {
    try {
        // Ders istatistikleri
        let lessonStats = { lessonsTotal: 0, lessonsDone: 0, lessonsMissed: 0, lessonsMakeup: 0 };
        try {
            const LessonSchedule = require('../models/LessonSchedule');
            const filter = (req.user.role === 'student' || req.user.role === 'parent')
                ? { student: req.user._id } : {};
            const lessons = await LessonSchedule.find(filter);
            lessonStats = {
                lessonsTotal: lessons.length,
                lessonsDone: lessons.filter(l => l.completed).length,
                lessonsMissed: lessons.filter(l => l.missed && !l.makeupCompleted).length,
                lessonsMakeup: lessons.filter(l => l.makeupCompleted).length,
            };
        } catch (e) {
            // LessonSchedule model may not exist yet in some setups
            console.log('Lesson stats unavailable:', e.message);
        }

        // Quiz istatistikleri
        const quizAttempts = await QuizAttempt.find({ student: req.user._id });
        const quizCount = quizAttempts.length;
        const quizTotalCorrect = quizAttempts.reduce((sum, a) => sum + a.score, 0);
        const quizTotalQuestions = quizAttempts.reduce((sum, a) => sum + a.totalQuestions, 0);
        const quizXP = quizAttempts.reduce((sum, a) => sum + (a.xpEarned || 0), 0);
        const quizMaxStreak = quizAttempts.length > 0 ? Math.max(...quizAttempts.map(a => a.streak || 0)) : 0;
        const quizCurrentStreak = quizAttempts.length > 0
            ? quizAttempts.sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]?.streak || 0
            : 0;
        const quizPerfect = quizAttempts.filter(a => a.score === a.totalQuestions && a.totalQuestions > 0).length;
        const quizPct = quizTotalQuestions > 0 ? Math.round((quizTotalCorrect / quizTotalQuestions) * 100) : 0;

        // Birleşik XP
        const lessonXP = (lessonStats.lessonsDone * 10) + (lessonStats.lessonsMakeup * 15);
        const totalXP = lessonXP + quizXP;

        // Tüm istatistikler
        const allStats = {
            ...lessonStats,
            quizCount,
            quizTotalCorrect,
            quizTotalQuestions,
            quizXP,
            quizMaxStreak,
            quizCurrentStreak,
            quizPerfect,
            quizPct,
            lessonXP,
            totalXP,
        };

        // Rozet kontrolü
        const badges = BADGE_DEFS.map(b => ({
            id: b.id,
            category: b.category,
            earned: b.check(allStats),
        }));

        res.json({ stats: allStats, badges });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
