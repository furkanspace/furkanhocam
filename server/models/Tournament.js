const mongoose = require('mongoose');

const TournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    mode: {
        type: String,
        required: true,
        enum: ['LEAGUE', 'KNOCKOUT', 'GROUP'] // Add more modes as needed
    },
    teams: [{
        id: String,
        name: String,
        logo: String,
        // Add other team properties as needed
    }],
    fixtures: [
        // Flexible structure to accommodate different fixture formats
    ],
    results: {
        // Flexible map for match results
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    status: {
        type: String,
        enum: ['SETUP', 'DRAW', 'DASHBOARD', 'COMPLETED'],
        default: 'SETUP'
    },
    winner: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Tournament', TournamentSchema);
