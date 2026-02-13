const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'gizli_anahtar_degistir_bunu';

// Setup multer for question images
const uploadDir = path.join(__dirname, '..', 'public', 'questions');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `q_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error('Sadece görsel dosyalar yüklenebilir!'));
    }
});

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

// GET QUESTIONS (role-based)
router.get('/', verifyToken, async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'student') {
            query.student = req.user._id;
        } else if (req.user.role === 'parent') {
            query.student = req.user._id;
        } else if (req.query.studentId) {
            query.student = req.query.studentId;
        }

        if (req.query.subject) {
            query.subject = req.query.subject;
        }

        const questions = await Question.find(query)
            .populate('student', 'fullName username')
            .populate('answeredBy', 'fullName')
            .sort({ createdAt: -1 });

        res.json(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
});

// CREATE QUESTION (student only) with optional image
router.post('/', verifyToken, checkRole(['student']), upload.single('image'), async (req, res) => {
    try {
        const { subject, text, lesson } = req.body;

        const question = new Question({
            student: req.user._id,
            subject,
            text,
            lesson: lesson || null,
            image: req.file ? `/public/questions/${req.file.filename}` : null
        });

        const saved = await question.save();
        const populated = await Question.findById(saved._id)
            .populate('student', 'fullName username');

        res.json(populated);
    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({ message: 'Error creating question', error: error.message });
    }
});

// ANSWER QUESTION (admin/staff only)
router.put('/:id/answer', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        const { answer } = req.body;
        const question = await Question.findByIdAndUpdate(
            req.params.id,
            {
                answer,
                answeredBy: req.user._id,
                answeredAt: new Date()
            },
            { new: true }
        ).populate('student', 'fullName username')
            .populate('answeredBy', 'fullName');

        if (!question) return res.status(404).json({ message: 'Question not found' });
        res.json(question);
    } catch (error) {
        res.status(500).json({ message: 'Error answering question', error: error.message });
    }
});

// DELETE QUESTION (admin only)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (question && question.image) {
            const imagePath = path.join(__dirname, '..', question.image);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }
        await Question.findByIdAndDelete(req.params.id);
        res.json({ message: 'Question deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting question', error: error.message });
    }
});

module.exports = router;
