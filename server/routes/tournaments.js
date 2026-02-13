const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');

// GET all tournaments
router.get('/', async (req, res) => {
    try {
        const tournaments = await Tournament.find().sort({ updatedAt: -1 });
        res.json(tournaments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET one tournament
router.get('/:id', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
        res.json(tournament);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE a tournament
router.post('/', async (req, res) => {
    const tournament = new Tournament({
        name: req.body.name,
        mode: req.body.mode,
        teams: req.body.teams,
        fixtures: req.body.fixtures,
        results: req.body.results,
        status: req.body.status
    });

    try {
        const newTournament = await tournament.save();
        res.status(201).json(newTournament);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE a tournament
router.put('/:id', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

        if (req.body.name) tournament.name = req.body.name;
        if (req.body.mode) tournament.mode = req.body.mode;
        if (req.body.teams) tournament.teams = req.body.teams;
        if (req.body.fixtures) tournament.fixtures = req.body.fixtures;
        if (req.body.results) tournament.results = req.body.results;
        if (req.body.status) tournament.status = req.body.status;
        if (req.body.winner) tournament.winner = req.body.winner;

        tournament.updatedAt = Date.now();

        const updatedTournament = await tournament.save();
        res.json(updatedTournament);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a tournament
router.delete('/:id', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

        await tournament.deleteOne();
        res.json({ message: 'Tournament deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
