const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD format for daily uniqueness
        required: true
    },
    questions: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'QuizQuestion'
        },
        selectedAnswer: {
            type: Number,
            default: -1
        },
        correct: {
            type: Boolean,
            default: false
        },
        timeSpent: {
            type: Number, // seconds
            default: 0
        }
    }],
    score: {
        type: Number,
        default: 0
    },
    totalQuestions: {
        type: Number,
        default: 0
    },
    xpEarned: {
        type: Number,
        default: 0
    },
    streak: {
        type: Number,
        default: 0 // Consecutive days
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
});

// Ensure one attempt per student per day
QuizAttemptSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);
