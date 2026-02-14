const express = require('express');
const router = express.Router();
const DailyTournament = require('../models/DailyTournament');
const QuizQuestion = require('../models/QuizQuestion');
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

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
};

// Helper: Turnuva durumunu güncelle
function computeStatus(tournament) {
    const now = new Date();
    const dateStr = tournament.date;
    const startParts = tournament.startTime.split(':');
    const endParts = tournament.endTime.split(':');

    const startDt = new Date(dateStr + 'T' + tournament.startTime + ':00');
    const endDt = new Date(dateStr + 'T' + tournament.endTime + ':00');

    // Handle timezone offset (Turkey = UTC+3)
    const offset = now.getTimezoneOffset(); // in minutes

    if (now < startDt) return 'scheduled';
    if (now >= startDt && now <= endDt) return 'active';
    return 'ended';
}

// GET /api/tournaments/daily/active — Aktif veya yaklaşan turnuva
router.get('/daily/active', verifyToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Bugünün turnuvası
        let tournament = await DailyTournament.findOne({ date: today })
            .populate('questions', 'subject topic difficulty questionText options correctAnswer explanation')
            .lean();

        if (!tournament) {
            return res.json({ tournament: null, message: 'Bugün turnuva yok' });
        }

        // Durumu güncelle
        const realStatus = computeStatus(tournament);
        if (realStatus !== tournament.status) {
            await DailyTournament.findByIdAndUpdate(tournament._id, { status: realStatus });
            tournament.status = realStatus;
        }

        // Öğrenci zaten katıldı mı?
        const myParticipation = tournament.participants.find(
            p => p.student.toString() === req.user._id.toString()
        );

        // Sorular — sadece aktif turnuvada ve henüz katılmadıysa gönder
        let questions = null;
        if (tournament.status === 'active' && !myParticipation) {
            questions = tournament.questions.map(q => ({
                _id: q._id,
                subject: q.subject,
                topic: q.topic,
                difficulty: q.difficulty,
                questionText: q.questionText,
                options: q.options
                // correctAnswer gönderilmiyor!
            }));
        }

        // Katılımcı sayısı
        const participantCount = tournament.participants.length;

        // Sıralama (basit)
        const leaderboard = tournament.participants
            .map(p => ({
                student: p.student,
                score: p.score,
                totalTime: p.totalTime,
                xpEarned: p.xpEarned,
                submittedAt: p.submittedAt
            }))
            .sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);

        res.json({
            tournament: {
                _id: tournament._id,
                title: tournament.title,
                date: tournament.date,
                startTime: tournament.startTime,
                endTime: tournament.endTime,
                questionCount: tournament.questionCount,
                subject: tournament.subject,
                status: tournament.status,
                participantCount,
                myParticipation: myParticipation || null
            },
            questions,
            leaderboard
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/tournaments/daily/:id/submit — Cevapları gönder
router.post('/daily/:id/submit', verifyToken, async (req, res) => {
    try {
        const tournament = await DailyTournament.findById(req.params.id)
            .populate('questions', 'correctAnswer');

        if (!tournament) return res.status(404).json({ message: 'Turnuva bulunamadı' });

        // Aktif mi kontrol
        const realStatus = computeStatus(tournament);
        if (realStatus !== 'active') {
            return res.status(400).json({ message: 'Turnuva aktif değil' });
        }

        // Zaten katıldı mı?
        const already = tournament.participants.find(
            p => p.student.toString() === req.user._id.toString()
        );
        if (already) return res.status(400).json({ message: 'Zaten katıldınız' });

        const { answers } = req.body; // [{questionIdx, selected, timeSpent}]
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ message: 'Geçersiz cevap formatı' });
        }

        // Puanla
        let score = 0;
        let totalTime = 0;
        const gradedAnswers = answers.map(a => {
            const question = tournament.questions[a.questionIdx];
            const isCorrect = question && a.selected === question.correctAnswer;
            if (isCorrect) score++;
            totalTime += a.timeSpent || 0;
            return {
                questionIdx: a.questionIdx,
                selected: a.selected,
                correct: isCorrect,
                timeSpent: a.timeSpent || 0
            };
        });

        // XP hesapla: 5 XP per correct + bonus for speed
        let xpEarned = score * 5;

        // Katılımcıya ekle
        tournament.participants.push({
            student: req.user._id,
            answers: gradedAnswers,
            score,
            totalTime,
            xpEarned,
            submittedAt: new Date()
        });
        await tournament.save();

        // Sıralamadaki yerim
        const sorted = tournament.participants
            .sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);
        const myRank = sorted.findIndex(
            p => p.student.toString() === req.user._id.toString()
        ) + 1;

        // İlk 3 bonus XP
        let bonusXP = 0;
        if (myRank === 1) bonusXP = 50;
        else if (myRank === 2) bonusXP = 30;
        else if (myRank === 3) bonusXP = 20;

        if (bonusXP > 0) {
            xpEarned += bonusXP;
            // Güncelle
            const me = tournament.participants.find(
                p => p.student.toString() === req.user._id.toString()
            );
            me.xpEarned = xpEarned;
            await tournament.save();
        }

        res.json({
            message: 'Tebrikler!',
            score,
            total: tournament.questions.length,
            xpEarned,
            bonusXP,
            rank: myRank,
            totalParticipants: tournament.participants.length,
            pct: Math.round((score / tournament.questions.length) * 100)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/tournaments/daily/:id/leaderboard — Turnuva sıralaması
router.get('/daily/:id/leaderboard', verifyToken, async (req, res) => {
    try {
        const tournament = await DailyTournament.findById(req.params.id)
            .populate('participants.student', 'fullName');

        if (!tournament) return res.status(404).json({ message: 'Turnuva bulunamadı' });

        const leaderboard = tournament.participants
            .map(p => ({
                fullName: p.student?.fullName || 'Bilinmeyen',
                studentId: p.student?._id,
                score: p.score,
                totalTime: p.totalTime,
                xpEarned: p.xpEarned,
                pct: Math.round((p.score / tournament.questionCount) * 100),
                isMe: p.student?._id.toString() === req.user._id.toString()
            }))
            .sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);

        leaderboard.forEach((p, i) => { p.rank = i + 1; });

        res.json({
            title: tournament.title,
            date: tournament.date,
            status: tournament.status,
            questionCount: tournament.questionCount,
            leaderboard
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/tournaments/daily/history — Son turnuvalar
router.get('/daily/history', verifyToken, async (req, res) => {
    try {
        const tournaments = await DailyTournament.find()
            .sort({ date: -1 })
            .limit(30)
            .select('title date startTime endTime questionCount subject status participants')
            .lean();

        const history = tournaments.map(t => {
            const myP = t.participants.find(p => p.student.toString() === req.user._id.toString());
            const sorted = [...t.participants].sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);
            const myRank = myP ? sorted.findIndex(p => p.student.toString() === req.user._id.toString()) + 1 : null;

            return {
                _id: t._id,
                title: t.title,
                date: t.date,
                startTime: t.startTime,
                endTime: t.endTime,
                questionCount: t.questionCount,
                status: t.status,
                participantCount: t.participants.length,
                myScore: myP ? myP.score : null,
                myRank,
                myXP: myP ? myP.xpEarned : null,
                participated: !!myP
            };
        });

        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/tournaments/daily — Admin: Yeni turnuva oluştur
router.post('/daily', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { title, date, startTime, endTime, questionCount, subject, difficulty } = req.body;
        const count = questionCount || 10;

        // Soru filtresi
        const filter = { active: true };
        if (subject) filter.subject = subject;
        if (difficulty) filter.difficulty = difficulty;

        // Rastgele soru seç
        const questions = await QuizQuestion.aggregate([
            { $match: filter },
            { $sample: { size: count } }
        ]);

        if (questions.length < count) {
            return res.status(400).json({
                message: `Yeterli soru yok. ${questions.length} soru bulundu, ${count} gerekli.`
            });
        }

        const tournament = new DailyTournament({
            title: title || 'Akşam Turnuvası',
            date: date || new Date().toISOString().split('T')[0],
            startTime: startTime || '20:00',
            endTime: endTime || '21:00',
            questionCount: count,
            subject: subject || null,
            difficulty: difficulty || null,
            questions: questions.map(q => q._id),
            status: 'scheduled',
            createdBy: req.user._id
        });

        await tournament.save();
        res.status(201).json(tournament);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/tournaments/daily/auto-create — Admin: Bugün için otomatik turnuva
router.post('/daily/auto-create', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Bugün zaten var mı?
        const existing = await DailyTournament.findOne({ date: today });
        if (existing) {
            return res.status(400).json({ message: 'Bugün zaten bir turnuva var', tournament: existing });
        }

        // 10 karma soru seç
        const questions = await QuizQuestion.aggregate([
            { $match: { active: true } },
            { $sample: { size: 10 } }
        ]);

        if (questions.length < 10) {
            return res.status(400).json({ message: `Yeterli soru yok (${questions.length}/10)` });
        }

        const tournament = new DailyTournament({
            title: 'Akşam Turnuvası',
            date: today,
            startTime: '20:00',
            endTime: '21:00',
            questionCount: 10,
            questions: questions.map(q => q._id),
            status: 'scheduled',
            createdBy: req.user._id
        });

        await tournament.save();
        res.status(201).json({ message: 'Turnuva oluşturuldu!', tournament });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
