const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [{
        questionIdx: { type: Number, required: true },
        selected: { type: Number, default: -1 },
        correct: { type: Boolean, default: false },
        timeSpent: { type: Number, default: 0 }
    }],
    score: { type: Number, default: 0 },
    totalTime: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now }
}, { _id: false });

const DailyTournamentSchema = new mongoose.Schema({
    title: { type: String, required: true, default: 'Turnuva' },
    type: { type: String, enum: ['daily', 'weekly', 'custom'], default: 'daily' },
    startDate: { type: String, required: true },   // YYYY-MM-DD
    endDate: { type: String, required: true },      // YYYY-MM-DD (aynı gün = günlük)
    startTime: { type: String, required: true },    // HH:mm
    endTime: { type: String, required: true },      // HH:mm
    questionCount: { type: Number, default: 10, min: 5, max: 30 },
    subject: { type: String, default: null },
    difficulty: { type: Number, default: null },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion' }],
    participants: [ParticipantSchema],
    status: { type: String, enum: ['scheduled', 'active', 'ended'], default: 'scheduled' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

DailyTournamentSchema.index({ startDate: 1, endDate: 1, status: 1 });

module.exports = mongoose.model('DailyTournament', DailyTournamentSchema);
