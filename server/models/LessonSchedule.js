const mongoose = require('mongoose');

const LessonScheduleSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedDate: {
        type: Date,
        default: null
    },
    missed: {
        type: Boolean,
        default: false
    },
    makeupDate: {
        type: Date,
        default: null
    },
    makeupCompleted: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('LessonSchedule', LessonScheduleSchema);
