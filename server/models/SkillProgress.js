const mongoose = require('mongoose');

const CompletedStepSchema = new mongoose.Schema({
    unitId: { type: Number, required: true },
    stepId: { type: Number, required: true },
    score: { type: Number, default: 100 },
    xpEarned: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now }
}, { _id: false });

const SkillProgressSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    treeId: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillTree', required: true },
    completedSteps: [CompletedStepSchema],
    totalXP: { type: Number, default: 0 },
    lastActivityAt: { type: Date, default: Date.now }
});

SkillProgressSchema.index({ student: 1, treeId: 1 }, { unique: true });

module.exports = mongoose.model('SkillProgress', SkillProgressSchema);
