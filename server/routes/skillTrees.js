const express = require('express');
const router = express.Router();
const SkillTree = require('../models/SkillTree');
const SkillProgress = require('../models/SkillProgress');
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

const STEP_TYPES = [
    { id: 1, type: 'vocabulary', name: 'Kelime Tanıma', icon: '📖', xp: 10 },
    { id: 2, type: 'listening', name: 'Dinleme/Okuma', icon: '🎧', xp: 10 },
    { id: 3, type: 'practice', name: 'Alıştırma', icon: '✏️', xp: 15 },
    { id: 4, type: 'quiz', name: 'Quiz', icon: '🧠', xp: 20 },
    { id: 5, type: 'review', name: 'Tekrar', icon: '🔄', xp: 10 },
    { id: 6, type: 'challenge', name: 'Bonus Challenge', icon: '💪', xp: 25 },
    { id: 7, type: 'exam', name: 'Ünite Sınavı', icon: '🏆', xp: 30 },
];

// GET /api/skill-trees/step-types
router.get('/step-types', (req, res) => {
    res.json(STEP_TYPES);
});

// GET /api/skill-trees/subjects — Tüm dersler + sınıflar + ilerleme
router.get('/subjects', verifyToken, async (req, res) => {
    try {
        const trees = await SkillTree.find().sort({ subject: 1, grade: 1 }).lean();
        const progresses = await SkillProgress.find({ student: req.user._id }).lean();

        const subjects = {};
        trees.forEach(tree => {
            if (!subjects[tree.subject]) {
                subjects[tree.subject] = { subject: tree.subject, grades: [] };
            }
            const prog = progresses.find(p => p.treeId.toString() === tree._id.toString());
            const totalSteps = tree.units.length * 7;
            const completedSteps = prog ? prog.completedSteps.length : 0;

            subjects[tree.subject].grades.push({
                grade: tree.grade,
                category: tree.category,
                color: tree.color,
                icon: tree.icon,
                unitCount: tree.units.length,
                totalSteps,
                completedSteps,
                progressPct: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
                totalXP: prog ? prog.totalXP : 0,
                treeId: tree._id
            });
        });
        res.json(Object.values(subjects));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/skill-trees/:subject/:grade — Belirli sınıfın ağacı + ilerleme
router.get('/:subject/:grade', verifyToken, async (req, res) => {
    try {
        const tree = await SkillTree.findOne({
            subject: decodeURIComponent(req.params.subject),
            grade: decodeURIComponent(req.params.grade)
        }).lean();
        if (!tree) return res.status(404).json({ error: 'Ağaç bulunamadı' });

        let progress = await SkillProgress.findOne({
            student: req.user._id,
            treeId: tree._id
        }).lean();
        if (!progress) progress = { completedSteps: [], totalXP: 0 };

        res.json({ tree, progress, stepTypes: STEP_TYPES });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/skill-trees/complete-step — Adım tamamla
router.post('/complete-step', verifyToken, async (req, res) => {
    try {
        const { treeId, unitId, stepId } = req.body;
        const tree = await SkillTree.findById(treeId);
        if (!tree) return res.status(404).json({ error: 'Ağaç bulunamadı' });

        const unit = tree.units.find(u => u.unitId === unitId);
        if (!unit) return res.status(400).json({ error: 'Geçersiz ünite' });

        const stepType = STEP_TYPES.find(s => s.id === stepId);
        if (!stepType) return res.status(400).json({ error: 'Geçersiz adım' });

        let progress = await SkillProgress.findOne({ student: req.user._id, treeId });
        if (!progress) {
            progress = new SkillProgress({ student: req.user._id, treeId, completedSteps: [], totalXP: 0 });
        }

        // Zaten tamamlanmış mı?
        const alreadyDone = progress.completedSteps.find(s => s.unitId === unitId && s.stepId === stepId);
        if (alreadyDone) return res.json({ message: 'Zaten tamamlanmış', progress, xpEarned: 0 });

        // Ön koşul kontrolü
        if (!(unitId === 1 && stepId === 1)) {
            if (stepId > 1) {
                const prevDone = progress.completedSteps.find(s => s.unitId === unitId && s.stepId === stepId - 1);
                if (!prevDone) return res.status(400).json({ error: 'Önceki adımı tamamlayın' });
            } else {
                const prevExamDone = progress.completedSteps.find(s => s.unitId === unitId - 1 && s.stepId === 7);
                if (!prevExamDone) return res.status(400).json({ error: 'Önceki ünitenin sınavını geçin' });
            }
        }

        const xpEarned = stepType.xp;
        progress.completedSteps.push({ unitId, stepId, score: 100, xpEarned, completedAt: new Date() });
        progress.totalXP += xpEarned;
        progress.lastActivityAt = new Date();
        await progress.save();

        res.json({ message: 'Adım tamamlandı!', progress, xpEarned });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/skill-trees/seed — İngilizce ağaçlarını oluştur (Admin)
router.post('/seed', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Yetki yok' });

    const ENGLISH_SEED = [
        {
            grade: '4. Sınıf', category: 'İlkokul', color: '#10b981', icon: '📗',
            units: ['Classroom Rules', 'Nationality', 'Cartoon Characters', 'Free Time', 'My Day',
                'Fun With Science', 'Jobs', 'My Clothes', 'My Friends', 'Food and Drinks']
        },
        {
            grade: '5. Sınıf', category: 'Ortaokul', color: '#3b82f6', icon: '📘',
            units: ['Hello', 'My Town', 'Games and Hobbies', 'My Daily Routine', 'Health',
                'Movies', 'Party Time', 'Fitness', 'The Animal Shelter', 'Festivals']
        },
        {
            grade: '6. Sınıf', category: 'Ortaokul', color: '#3b82f6', icon: '📘',
            units: ['Life', 'Yummy Breakfast', 'Downtown', 'Weather and Emotions', 'At the Fair',
                'Occupations', 'Holidays', 'Bookworms', 'Saving the Planet', 'Democracy']
        },
        {
            grade: '8. Sınıf', category: 'Ortaokul', color: '#3b82f6', icon: '📘',
            units: ['Friendship', 'Teen', 'The Kitchen', 'On the Phone', 'The Internet',
                'Adventures', 'Tourism', 'Chores', 'Science', 'Natural Forces']
        },
        {
            grade: '9. Sınıf', category: 'Lise', color: '#8b5cf6', icon: '📙',
            units: ['Studying Abroad', 'My Environment', 'Movies', 'Human in Nature', 'Inspirational People',
                'Bridging Cultures', 'World Heritage', 'Emergency and Health', 'Invitations', 'TV and Social Media']
        },
        {
            grade: '10. Sınıf', category: 'Lise', color: '#8b5cf6', icon: '📙',
            units: ['School Life', 'Plans', 'Legendary Figures', 'Traditions', 'Travel',
                'Helpful Tips', 'Food and Festivals', 'Digital Era', 'Heroes and Heroines', 'Shopping']
        },
        {
            grade: '11. Sınıf', category: 'Lise', color: '#8b5cf6', icon: '📙',
            units: ['Future Jobs', 'Hobbies and Skills', 'Hard Times', 'What a Life', 'Back to the Past',
                'Open Your Heart', 'Facts About Turkey', 'Sports', 'My Friends', 'Values and Norms']
        },
        {
            grade: '12. Sınıf', category: 'Lise', color: '#8b5cf6', icon: '📙',
            units: ['Music', 'Friendship', 'Human Rights', 'Coming Soon', 'Psychology',
                'Favors', 'News Stories', 'Alternative Energy', 'Technology', 'Manners']
        }
    ];

    try {
        let created = 0;
        for (const seed of ENGLISH_SEED) {
            const units = seed.units.map((name, i) => ({ unitId: i + 1, name, icon: '📚' }));
            await SkillTree.findOneAndUpdate(
                { subject: 'İngilizce', grade: seed.grade },
                { subject: 'İngilizce', grade: seed.grade, category: seed.category, color: seed.color, icon: seed.icon, units },
                { upsert: true, new: true }
            );
            created++;
        }
        res.json({ message: `${created} ağaç oluşturuldu/güncellendi` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/skill-trees — Admin: Ağaç oluştur/güncelle
router.post('/', verifyToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Yetki yok' });
    try {
        const { subject, grade, category, color, icon, units } = req.body;
        const tree = await SkillTree.findOneAndUpdate(
            { subject, grade },
            { subject, grade, category, color, icon, units },
            { upsert: true, new: true }
        );
        res.json(tree);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
