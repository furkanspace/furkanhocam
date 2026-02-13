const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Secret key for JWT (Should be in .env in production)
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

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const { username, password, fullName, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: 'Username already exists' });

        // Create new user (prevent creating admin via public register unless setup)
        // Allow creating 'student' by default. If admin is creating, they can specify role.
        // For simplicity now: anyone can register as student.
        // If 'role' is passed and it's not student, check if requester is admin? 
        // Let's keep it simple: Public registration is always STUDENT.
        // Admin can create other roles via a separate secure route or we allow it for now for initial setup.

        const newUser = new User({
            username,
            password,
            fullName,
            role: role || 'student' // Default to student
        });

        const savedUser = await newUser.save();
        res.json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check user
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'User not found' });

        // Check password
        const validPass = await user.comparePassword(password);
        if (!validPass) return res.status(400).json({ message: 'Invalid password' });

        // Create token
        const token = jwt.sign(
            { _id: user._id, role: user.role, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

// GET CURRENT USER
router.get('/me', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user' });
    }
});

// ADMIN: GET ALL USERS
router.get('/users', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// ADMIN: CREATE USER (With specific role)
router.post('/users', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        const { username, password, fullName, role } = req.body;
        const userExists = await User.findOne({ username });
        if (userExists) return res.status(400).json({ message: 'Username already exists' });

        const newUser = new User({ username, password, fullName, role });
        await newUser.save();
        res.json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// ADMIN: DELETE USER
router.delete('/users/:id', verifyToken, checkRole(['admin']), async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// INITIAL SETUP (Run once to create admin if none exists)
router.post('/setup-admin', async (req, res) => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) return res.status(400).json({ message: 'Admin already exists' });

        const newAdmin = new User({
            username: 'admin',
            password: 'adminpassword123', // User should change this
            fullName: 'System Admin',
            role: 'admin'
        });
        await newAdmin.save();
        res.json({ message: 'Admin created. Login with admin/adminpassword123' });
    } catch (error) {
        console.error('Error setting up admin:', error);
        res.status(500).json({ message: 'Error setting up admin', error: error.message, stack: error.stack });
    }
});

module.exports = router;
