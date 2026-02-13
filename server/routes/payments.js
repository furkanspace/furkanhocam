const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');
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

// GET PAYMENTS (admin: all or filtered, parent: own child's)
router.get('/', verifyToken, async (req, res) => {
    try {
        // Students cannot see payments
        if (req.user.role === 'student') {
            return res.status(403).json({ message: 'Forbidden' });
        }

        let query = {};
        if (req.user.role === 'parent') {
            query.student = req.user._id;
        } else if (req.query.studentId) {
            query.student = req.query.studentId;
        }

        const payments = await Payment.find(query)
            .populate('student', 'fullName username')
            .populate('createdBy', 'fullName')
            .sort({ dueDate: -1 });

        res.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Error fetching payments', error: error.message });
    }
});

// GET STUDENTS FOR DROPDOWN
router.get('/students', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('fullName username _id');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching students', error: error.message });
    }
});

// CREATE PAYMENT (admin only)
router.post('/', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { student, amount, month, description, dueDate } = req.body;

        const payment = new Payment({
            student,
            amount,
            month,
            description,
            dueDate,
            createdBy: req.user._id
        });

        const saved = await payment.save();
        const populated = await Payment.findById(saved._id)
            .populate('student', 'fullName username')
            .populate('createdBy', 'fullName');

        res.json(populated);
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ message: 'Error creating payment', error: error.message });
    }
});

// MARK AS PAID (admin only)
router.put('/:id/pay', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            { status: 'paid', paidDate: new Date() },
            { new: true }
        ).populate('student', 'fullName username')
            .populate('createdBy', 'fullName');

        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Error updating payment', error: error.message });
    }
});

// MARK AS OVERDUE (admin only)
router.put('/:id/overdue', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            { status: 'overdue' },
            { new: true }
        ).populate('student', 'fullName username')
            .populate('createdBy', 'fullName');

        if (!payment) return res.status(404).json({ message: 'Payment not found' });
        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Error updating payment', error: error.message });
    }
});

// DELETE PAYMENT (admin only)
router.delete('/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        await Payment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Payment deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting payment', error: error.message });
    }
});

module.exports = router;
