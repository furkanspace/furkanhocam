const mongoose = require('mongoose');

const QuizQuestionSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        enum: ['İngilizce', 'Fizik', 'Matematik', 'Genel Kültür']
    },
    topic: {
        type: String,
        required: true
    },
    difficulty: {
        type: Number,
        required: true,
        min: 1,
        max: 3,
        default: 1 // 1=Kolay, 2=Orta, 3=Zor
    },
    type: {
        type: String,
        enum: ['multiple_choice', 'true_false'],
        default: 'multiple_choice'
    },
    questionText: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctAnswer: {
        type: Number,
        required: true // Index of correct option (0-based)
    },
    explanation: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient daily quiz queries
QuizQuestionSchema.index({ subject: 1, difficulty: 1, active: 1 });

module.exports = mongoose.model('QuizQuestion', QuizQuestionSchema);
