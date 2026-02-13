const express = require('express');
const router = express.Router();
const QuizQuestion = require('../models/QuizQuestion');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gizli_anahtar_degistir_bunu';

// Auth middleware
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

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
};

// ===========================
// ADMIN: Soru Yönetimi (CRUD)
// ===========================

// GET /api/quiz/questions — Tüm soruları getir (admin/staff)
router.get('/questions', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        const { subject, difficulty, topic, active } = req.query;
        const filter = {};
        if (subject) filter.subject = subject;
        if (difficulty) filter.difficulty = parseInt(difficulty);
        if (topic) filter.topic = { $regex: topic, $options: 'i' };
        if (active !== undefined) filter.active = active === 'true';

        const questions = await QuizQuestion.find(filter)
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 });
        res.json(questions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/quiz/questions — Yeni soru ekle
router.post('/questions', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        const { subject, topic, difficulty, type, questionText, options, correctAnswer, explanation } = req.body;

        if (!subject || !topic || !questionText || !options || correctAnswer === undefined) {
            return res.status(400).json({ message: 'Eksik alan' });
        }
        if (options.length < 2) {
            return res.status(400).json({ message: 'En az 2 seçenek gerekli' });
        }
        if (correctAnswer < 0 || correctAnswer >= options.length) {
            return res.status(400).json({ message: 'Geçersiz doğru cevap indeksi' });
        }

        const question = new QuizQuestion({
            subject, topic, difficulty: difficulty || 1,
            type: type || 'multiple_choice',
            questionText, options, correctAnswer,
            explanation: explanation || '',
            createdBy: req.user.id
        });
        await question.save();
        const populated = await QuizQuestion.findById(question._id).populate('createdBy', 'fullName');
        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/quiz/questions/:id — Soru düzenle
router.put('/questions/:id', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        const updated = await QuizQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('createdBy', 'fullName');
        if (!updated) return res.status(404).json({ message: 'Soru bulunamadı' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/quiz/questions/:id — Soru sil
router.delete('/questions/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        await QuizQuestion.findByIdAndDelete(req.params.id);
        res.json({ message: 'Silindi' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ===========================
// STUDENT: Günlük Quiz
// ===========================

// GET /api/quiz/daily — Günlük quiz sorularını getir (10 rastgele soru)
router.get('/daily', verifyToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Check if already completed today
        const existing = await QuizAttempt.findOne({ student: req.user.id, date: today });
        if (existing) {
            // Return completed attempt with populated questions
            const populated = await QuizAttempt.findById(existing._id)
                .populate('questions.question', 'questionText options correctAnswer explanation subject topic difficulty');
            return res.json({ completed: true, attempt: populated });
        }

        // Get 10 random active questions
        const questions = await QuizQuestion.aggregate([
            { $match: { active: true } },
            { $sample: { size: 10 } },
            {
                $project: {
                    questionText: 1, options: 1, subject: 1,
                    topic: 1, difficulty: 1, type: 1
                    // NOTE: correctAnswer is NOT sent to client
                }
            }
        ]);

        if (questions.length === 0) {
            return res.json({ completed: false, questions: [], noQuestions: true });
        }

        res.json({ completed: false, questions, date: today });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/quiz/daily/submit — Quiz sonuçlarını gönder
router.post('/daily/submit', verifyToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { answers } = req.body; // [{questionId, selectedAnswer, timeSpent}]

        // Already completed?
        const existing = await QuizAttempt.findOne({ student: req.user.id, date: today });
        if (existing) {
            return res.status(400).json({ message: 'Bugün zaten quiz çözdünüz' });
        }

        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ message: 'Cevaplar gerekli' });
        }

        // Fetch correct answers and grade
        const questionIds = answers.map(a => a.questionId);
        const dbQuestions = await QuizQuestion.find({ _id: { $in: questionIds } });
        const questionMap = {};
        dbQuestions.forEach(q => { questionMap[q._id.toString()] = q; });

        let score = 0;
        const gradedQuestions = answers.map(a => {
            const dbQ = questionMap[a.questionId];
            const isCorrect = dbQ && a.selectedAnswer === dbQ.correctAnswer;
            if (isCorrect) score++;
            return {
                question: a.questionId,
                selectedAnswer: a.selectedAnswer,
                correct: isCorrect,
                timeSpent: a.timeSpent || 0
            };
        });

        // Calculate streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        const yesterdayAttempt = await QuizAttempt.findOne({ student: req.user.id, date: yesterdayStr });
        const streak = yesterdayAttempt ? (yesterdayAttempt.streak || 0) + 1 : 1;

        // XP calculation: base 5 per correct + streak bonus
        const baseXP = score * 5;
        const streakBonus = Math.min(streak, 7) * 2; // Max 14 bonus from streak
        const xpEarned = baseXP + streakBonus;

        const attempt = new QuizAttempt({
            student: req.user.id,
            date: today,
            questions: gradedQuestions,
            score,
            totalQuestions: answers.length,
            xpEarned,
            streak
        });
        await attempt.save();

        // Return result with question details
        const populated = await QuizAttempt.findById(attempt._id)
            .populate('questions.question', 'questionText options correctAnswer explanation subject topic difficulty');

        res.json({
            attempt: populated,
            stats: { score, total: answers.length, xpEarned, streak, pct: Math.round((score / answers.length) * 100) }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/quiz/history — Kendi quiz geçmişi
router.get('/history', verifyToken, async (req, res) => {
    try {
        const attempts = await QuizAttempt.find({ student: req.user.id })
            .sort({ date: -1 })
            .limit(30)
            .populate('questions.question', 'questionText subject topic');
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/quiz/leaderboard — Haftalık/aylık sıralama
router.get('/leaderboard', verifyToken, async (req, res) => {
    try {
        const { period } = req.query; // 'week' or 'month'
        const now = new Date();
        let startDate;

        if (period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        } else {
            // Default: this week (Monday)
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            startDate = new Date(now.setDate(diff)).toISOString().split('T')[0];
        }

        const leaderboard = await QuizAttempt.aggregate([
            { $match: { date: { $gte: startDate } } },
            {
                $group: {
                    _id: '$student',
                    totalScore: { $sum: '$score' },
                    totalQuestions: { $sum: '$totalQuestions' },
                    totalXP: { $sum: '$xpEarned' },
                    quizCount: { $sum: 1 },
                    maxStreak: { $max: '$streak' }
                }
            },
            { $sort: { totalXP: -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    fullName: '$user.fullName',
                    totalScore: 1, totalQuestions: 1,
                    totalXP: 1, quizCount: 1, maxStreak: 1,
                    pct: {
                        $cond: [
                            { $gt: ['$totalQuestions', 0] },
                            { $round: [{ $multiply: [{ $divide: ['$totalScore', '$totalQuestions'] }, 100] }, 0] },
                            0
                        ]
                    }
                }
            }
        ]);

        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/quiz/stats — Kendi genel istatistikleri
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const attempts = await QuizAttempt.find({ student: req.user.id });
        const totalQuizzes = attempts.length;
        const totalCorrect = attempts.reduce((sum, a) => sum + a.score, 0);
        const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);
        const totalXP = attempts.reduce((sum, a) => sum + a.xpEarned, 0);
        const currentStreak = attempts.length > 0 ? attempts.sort((a, b) => b.date.localeCompare(a.date))[0].streak : 0;
        const maxStreak = attempts.length > 0 ? Math.max(...attempts.map(a => a.streak)) : 0;
        const pct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

        res.json({ totalQuizzes, totalCorrect, totalQuestions, totalXP, currentStreak, maxStreak, pct });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
