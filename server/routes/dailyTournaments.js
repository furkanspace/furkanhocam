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

// Helper: Turnuva durumunu hesapla
function computeStatus(t) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Henüz başlamamış (başlangıç tarihi gelmemiş)
    if (today < t.startDate) return 'scheduled';

    // Bitiş tarihi geçmiş
    if (today > t.endDate) return 'ended';

    // Bugün tarih aralığında — saate bak
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = t.startTime.split(':').map(Number);
    const [eh, em] = t.endTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    if (nowMinutes < startMin) return 'scheduled';
    if (nowMinutes > endMin) {
        // Bugün son günse ended, değilse yarın devam
        if (today >= t.endDate) return 'ended';
        return 'scheduled'; // yarın tekrar açılacak
    }
    return 'active';
}

// GET /api/tournaments/daily/active — Aktif ve yaklaşan tüm turnuvalar
router.get('/daily/active', verifyToken, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Henüz bitmemiş turnuvaları getir
        const tournaments = await DailyTournament.find({
            endDate: { $gte: today }
        })
            .populate('questions', 'subject topic difficulty questionText options correctAnswer explanation')
            .sort({ startDate: 1, startTime: 1 })
            .lean();

        const results = tournaments.map(t => {
            const realStatus = computeStatus(t);

            // Öğrenci katıldı mı?
            const myParticipation = t.participants.find(
                p => p.student.toString() === req.user._id.toString()
            );

            // Sorular — sadece aktif ve katılmadıysa
            let questions = null;
            if (realStatus === 'active' && !myParticipation) {
                questions = t.questions.map(q => ({
                    _id: q._id,
                    subject: q.subject,
                    topic: q.topic,
                    difficulty: q.difficulty,
                    questionText: q.questionText,
                    options: q.options
                }));
            }

            // Mini sıralama
            const leaderboard = t.participants
                .map(p => ({
                    student: p.student,
                    score: p.score,
                    totalTime: p.totalTime,
                    xpEarned: p.xpEarned
                }))
                .sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);

            return {
                tournament: {
                    _id: t._id,
                    title: t.title,
                    type: t.type,
                    startDate: t.startDate,
                    endDate: t.endDate,
                    startTime: t.startTime,
                    endTime: t.endTime,
                    questionCount: t.questionCount,
                    subject: t.subject,
                    status: realStatus,
                    participantCount: t.participants.length,
                    myParticipation: myParticipation || null
                },
                questions,
                leaderboard
            };
        });

        res.json(results);
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

        const realStatus = computeStatus(tournament);
        if (realStatus !== 'active') {
            return res.status(400).json({ message: 'Turnuva aktif değil' });
        }

        const already = tournament.participants.find(
            p => p.student.toString() === req.user._id.toString()
        );
        if (already) return res.status(400).json({ message: 'Zaten katıldınız' });

        const { answers } = req.body;
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ message: 'Geçersiz cevap formatı' });
        }

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

        let xpEarned = score * 5;

        tournament.participants.push({
            student: req.user._id,
            answers: gradedAnswers,
            score,
            totalTime,
            xpEarned,
            submittedAt: new Date()
        });
        await tournament.save();

        // Sıralama
        const sorted = tournament.participants
            .sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);
        const myRank = sorted.findIndex(
            p => p.student.toString() === req.user._id.toString()
        ) + 1;

        let bonusXP = 0;
        if (myRank === 1) bonusXP = 50;
        else if (myRank === 2) bonusXP = 30;
        else if (myRank === 3) bonusXP = 20;

        if (bonusXP > 0) {
            xpEarned += bonusXP;
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

// GET /api/tournaments/daily/:id/leaderboard
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
            startDate: tournament.startDate,
            endDate: tournament.endDate,
            status: computeStatus(tournament),
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
            .sort({ startDate: -1, startTime: -1 })
            .limit(30)
            .select('title type startDate endDate startTime endTime questionCount subject status participants')
            .lean();

        const history = tournaments.map(t => {
            const myP = t.participants.find(p => p.student.toString() === req.user._id.toString());
            const sorted = [...t.participants].sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);
            const myRank = myP ? sorted.findIndex(p => p.student.toString() === req.user._id.toString()) + 1 : null;

            return {
                _id: t._id,
                title: t.title,
                type: t.type,
                startDate: t.startDate,
                endDate: t.endDate,
                startTime: t.startTime,
                endTime: t.endTime,
                questionCount: t.questionCount,
                status: computeStatus(t),
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

// POST /api/tournaments/daily — Admin: Turnuva oluştur (tam form)
router.post('/daily', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { title, type, startDate, endDate, startTime, endTime, questionCount, subject, difficulty } = req.body;

        if (!title || !startDate || !startTime || !endTime) {
            return res.status(400).json({ message: 'Başlık, tarih ve saat zorunludur' });
        }

        const count = questionCount || 10;

        // Soru filtresi
        const filter = { active: true };
        if (subject) filter.subject = subject;
        if (difficulty) filter.difficulty = Number(difficulty);

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
            title,
            type: type || 'daily',
            startDate,
            endDate: endDate || startDate,
            startTime,
            endTime,
            questionCount: count,
            subject: subject || null,
            difficulty: difficulty ? Number(difficulty) : null,
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

// DELETE /api/tournaments/daily/:id — Admin: Turnuva sil
router.delete('/daily/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const t = await DailyTournament.findById(req.params.id);
        if (!t) return res.status(404).json({ message: 'Turnuva bulunamadı' });
        if (t.participants.length > 0) {
            return res.status(400).json({ message: 'Katılımcısı olan turnuva silinemez' });
        }
        await DailyTournament.findByIdAndDelete(req.params.id);
        res.json({ message: 'Silindi' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
