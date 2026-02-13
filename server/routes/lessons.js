const express = require('express');
const router = express.Router();
const LessonSchedule = require('../models/LessonSchedule');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gizli_anahtar_degistir_bunu';

// Middleware to verify token
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

// Middleware to check role
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
};

// GET ALL LESSONS (admin sees all, student/parent sees own)
router.get('/', verifyToken, async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'admin' || req.user.role === 'staff') {
            // Admin/staff can filter by student
            if (req.query.studentId) {
                query.student = req.query.studentId;
            }
        } else {
            // Students/parents only see their own lessons
            query.student = req.user._id;
        }

        // Date range filter
        if (req.query.startDate && req.query.endDate) {
            query.scheduledDate = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        const lessons = await LessonSchedule.find(query)
            .populate('student', 'fullName username role')
            .populate('createdBy', 'fullName')
            .sort({ scheduledDate: 1 });

        res.json(lessons);
    } catch (error) {
        console.error('Error fetching lessons:', error);
        res.status(500).json({ message: 'Error fetching lessons', error: error.message });
    }
});

// GET ALL STUDENTS (for admin dropdown)
router.get('/students', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('fullName username _id');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
});

// CREATE LESSON (admin only)
router.post('/', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        const { student, subject, scheduledDate, notes, topic } = req.body;

        const lesson = new LessonSchedule({
            student,
            subject,
            scheduledDate,
            notes,
            topic,
            createdBy: req.user._id
        });

        const saved = await lesson.save();
        const populated = await LessonSchedule.findById(saved._id)
            .populate('student', 'fullName username role')
            .populate('createdBy', 'fullName');

        res.json(populated);
    } catch (error) {
        console.error('Error creating lesson:', error);
        res.status(500).json({ message: 'Error creating lesson', error: error.message });
    }
});

// UPDATE LESSON (topic, notes, etc.) (admin only)
router.put('/:id/update', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        const { topic, notes, subject, scheduledDate } = req.body;
        const updateData = {};
        if (topic !== undefined) updateData.topic = topic;
        if (notes !== undefined) updateData.notes = notes;
        if (subject !== undefined) updateData.subject = subject;
        if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate;

        const lesson = await LessonSchedule.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('student', 'fullName username role')
            .populate('createdBy', 'fullName');

        if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
        res.json(lesson);
    } catch (error) {
        res.status(500).json({ message: 'Error updating lesson', error: error.message });
    }
});

// MARK LESSON AS COMPLETED (admin only)
router.put('/:id/complete', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        const lesson = await LessonSchedule.findByIdAndUpdate(
            req.params.id,
            {
                completed: true,
                completedDate: new Date(),
                missed: false
            },
            { new: true }
        ).populate('student', 'fullName username role')
            .populate('createdBy', 'fullName');

        if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
        res.json(lesson);
    } catch (error) {
        res.status(500).json({ message: 'Error completing lesson', error: error.message });
    }
});

// MARK LESSON AS MISSED + SET MAKEUP DATE (admin only)
router.put('/:id/miss', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        const { makeupDate } = req.body;
        const lesson = await LessonSchedule.findByIdAndUpdate(
            req.params.id,
            {
                missed: true,
                completed: false,
                makeupDate: makeupDate || null
            },
            { new: true }
        ).populate('student', 'fullName username role')
            .populate('createdBy', 'fullName');

        if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
        res.json(lesson);
    } catch (error) {
        res.status(500).json({ message: 'Error updating lesson', error: error.message });
    }
});

// MARK MAKEUP AS COMPLETED (admin only)
router.put('/:id/makeup-complete', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        const lesson = await LessonSchedule.findByIdAndUpdate(
            req.params.id,
            { makeupCompleted: true },
            { new: true }
        ).populate('student', 'fullName username role')
            .populate('createdBy', 'fullName');

        if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
        res.json(lesson);
    } catch (error) {
        res.status(500).json({ message: 'Error completing makeup', error: error.message });
    }
});

// DELETE LESSON (admin only)
router.delete('/:id', verifyToken, checkRole(['admin', 'staff']), async (req, res) => {
    try {
        await LessonSchedule.findByIdAndDelete(req.params.id);
        res.json({ message: 'Lesson deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting lesson', error: error.message });
    }
});

module.exports = router;
