const express = require('express');
const router = express.Router();
const User = require('../models/User');
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

const checkRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
};

// League definitions
const LEAGUES = [
    { id: 'bronze', name: 'Bronz', emoji: '🥉', color: '#cd7f32', order: 0 },
    { id: 'silver', name: 'Gümüş', emoji: '🥈', color: '#c0c0c0', order: 1 },
    { id: 'gold', name: 'Altın', emoji: '🥇', color: '#ffd700', order: 2 },
    { id: 'platinum', name: 'Platin', emoji: '💎', color: '#00b4d8', order: 3 },
    { id: 'diamond', name: 'Elmas', emoji: '👑', color: '#b388ff', order: 4 },
];

// Helper: get current week range (Monday-Sunday)
function getWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.getFullYear(), now.getMonth(), diff);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0],
        mondayDate: monday,
        sundayDate: sunday
    };
}

// GET /api/leagues/standings — Current week league standings for user's league
router.get('/standings', verifyToken, async (req, res) => {
    try {
        const me = await User.findById(req.user._id);
        if (!me) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

        const myLeague = me.league || 'bronze';
        const viewLeague = req.query.league || myLeague;

        // Get all students in requested league
        const leagueStudents = await User.find({ role: 'student', league: viewLeague })
            .select('_id fullName league');

        if (leagueStudents.length === 0) {
            return res.json({
                league: LEAGUES.find(l => l.id === viewLeague),
                myLeague: LEAGUES.find(l => l.id === myLeague),
                standings: [],
                myRank: 0,
                totalInLeague: 0,
                promotionZone: 0,
                relegationZone: 0,
                weekRange: getWeekRange()
            });
        }

        const studentIds = leagueStudents.map(s => s._id);
        const { start, end } = getWeekRange();

        // Get weekly quiz XP for league students
        const weeklyXP = await QuizAttempt.aggregate([
            {
                $match: {
                    student: { $in: studentIds },
                    date: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$student',
                    weeklyXP: { $sum: '$xpEarned' },
                    quizCount: { $sum: 1 },
                    totalCorrect: { $sum: '$score' },
                    totalQuestions: { $sum: '$totalQuestions' }
                }
            }
        ]);

        const xpMap = {};
        weeklyXP.forEach(item => { xpMap[item._id.toString()] = item; });

        // Build standings
        const standings = leagueStudents.map(s => {
            const xpData = xpMap[s._id.toString()] || { weeklyXP: 0, quizCount: 0, totalCorrect: 0, totalQuestions: 0 };
            return {
                _id: s._id,
                fullName: s.fullName,
                weeklyXP: xpData.weeklyXP,
                quizCount: xpData.quizCount,
                accuracy: xpData.totalQuestions > 0 ? Math.round((xpData.totalCorrect / xpData.totalQuestions) * 100) : 0,
                isMe: s._id.toString() === req.user._id.toString()
            };
        });

        // Sort by weeklyXP descending, then by accuracy
        standings.sort((a, b) => b.weeklyXP - a.weeklyXP || b.accuracy - a.accuracy);

        // Add rank
        standings.forEach((s, i) => { s.rank = i + 1; });

        const total = standings.length;
        const promotionCount = Math.max(1, Math.floor(total * 0.25));
        const relegationCount = Math.max(1, Math.floor(total * 0.25));
        const myRank = standings.find(s => s.isMe)?.rank || 0;

        // Mark zones
        standings.forEach(s => {
            if (viewLeague !== 'diamond' && s.rank <= promotionCount) {
                s.zone = 'promotion';
            } else if (viewLeague !== 'bronze' && s.rank > total - relegationCount) {
                s.zone = 'relegation';
            } else {
                s.zone = 'safe';
            }
        });

        res.json({
            league: LEAGUES.find(l => l.id === viewLeague),
            myLeague: LEAGUES.find(l => l.id === myLeague),
            standings,
            myRank,
            totalInLeague: total,
            promotionZone: promotionCount,
            relegationZone: relegationCount,
            weekRange: getWeekRange(),
            allLeagues: LEAGUES
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/leagues/my — User's league info
router.get('/my', verifyToken, async (req, res) => {
    try {
        const me = await User.findById(req.user._id).select('fullName league leagueUpdatedAt');
        if (!me) return res.status(404).json({ message: 'Kullanıcı bulunamadı' });

        const leagueInfo = LEAGUES.find(l => l.id === (me.league || 'bronze'));
        const leagueIdx = LEAGUES.findIndex(l => l.id === (me.league || 'bronze'));
        const nextLeague = leagueIdx < LEAGUES.length - 1 ? LEAGUES[leagueIdx + 1] : null;

        res.json({
            league: leagueInfo,
            nextLeague,
            leagueUpdatedAt: me.leagueUpdatedAt,
            allLeagues: LEAGUES
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/leagues/promote — Admin: run weekly promotion/relegation
router.post('/promote', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { start, end } = getWeekRange();
        const results = { promoted: [], relegated: [], unchanged: [] };

        for (const league of LEAGUES) {
            const students = await User.find({ role: 'student', league: league.id });
            if (students.length < 2) continue;

            const studentIds = students.map(s => s._id);

            // Get weekly XP
            const weeklyXP = await QuizAttempt.aggregate([
                { $match: { student: { $in: studentIds }, date: { $gte: start, $lte: end } } },
                { $group: { _id: '$student', weeklyXP: { $sum: '$xpEarned' } } }
            ]);

            const xpMap = {};
            weeklyXP.forEach(item => { xpMap[item._id.toString()] = item.weeklyXP; });

            const ranked = students.map(s => ({
                _id: s._id,
                fullName: s.fullName,
                weeklyXP: xpMap[s._id.toString()] || 0
            })).sort((a, b) => b.weeklyXP - a.weeklyXP);

            const total = ranked.length;
            const promoCount = Math.max(1, Math.floor(total * 0.25));
            const releCount = Math.max(1, Math.floor(total * 0.25));

            const leagueIdx = LEAGUES.findIndex(l => l.id === league.id);

            // Promote top players (not diamond)
            if (leagueIdx < LEAGUES.length - 1) {
                const toPromote = ranked.slice(0, promoCount).filter(s => s.weeklyXP > 0);
                for (const s of toPromote) {
                    await User.findByIdAndUpdate(s._id, {
                        league: LEAGUES[leagueIdx + 1].id,
                        leagueUpdatedAt: new Date()
                    });
                    results.promoted.push({ name: s.fullName, from: league.name, to: LEAGUES[leagueIdx + 1].name });
                }
            }

            // Relegate bottom players (not bronze)
            if (leagueIdx > 0) {
                const toRelegate = ranked.slice(total - releCount);
                for (const s of toRelegate) {
                    await User.findByIdAndUpdate(s._id, {
                        league: LEAGUES[leagueIdx - 1].id,
                        leagueUpdatedAt: new Date()
                    });
                    results.relegated.push({ name: s.fullName, from: league.name, to: LEAGUES[leagueIdx - 1].name });
                }
            }
        }

        res.json({ message: 'Lig güncellemesi tamamlandı', results });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
