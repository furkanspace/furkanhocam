const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema({
    unitId: { type: Number, required: true },
    name: { type: String, required: true },
    icon: { type: String, default: '📚' },
    description: { type: String, default: '' }
}, { _id: false });

const SkillTreeSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    category: { type: String, default: '' },
    color: { type: String, default: '#3b82f6' },
    icon: { type: String, default: '📚' },
    units: [UnitSchema],
    createdAt: { type: Date, default: Date.now }
});

SkillTreeSchema.index({ subject: 1, grade: 1 }, { unique: true });

module.exports = mongoose.model('SkillTree', SkillTreeSchema);
