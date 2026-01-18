import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Setup from './components/Setup';
import DrawCeremony from './components/DrawCeremony';
import Dashboard from './components/Dashboard';
import MatchView from './components/MatchView';

function App() {
    const [status, setStatus] = useState('SETUP'); // SETUP, DRAW, DASHBOARD, MATCH
    const [teams, setTeams] = useState([]);
    const [mode, setMode] = useState('LEAGUE');
    const [fixtures, setFixtures] = useState([]);
    const [activeMatch, setActiveMatch] = useState(null);
    const [results, setResults] = useState({});
    const [activeTournaments, setActiveTournaments] = useState([]);
    const [currentTournamentId, setCurrentTournamentId] = useState(null);

    // Load saved tournaments from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('activeTournaments');
        if (saved) {
            setActiveTournaments(JSON.parse(saved));
        }
    }, []);

    // Save current tournament state
    const saveTournament = (teamsData, modeData, fixturesData, resultsData) => {
        const id = currentTournamentId || Date.now().toString();
        const tournament = {
            id,
            name: `Turnuva ${new Date().toLocaleDateString('tr-TR')}`,
            teams: teamsData,
            mode: modeData,
            fixtures: fixturesData,
            results: resultsData,
            updatedAt: Date.now()
        };

        const existing = activeTournaments.filter(t => t.id !== id);
        const updated = [...existing, tournament];
        setActiveTournaments(updated);
        localStorage.setItem('activeTournaments', JSON.stringify(updated));
        setCurrentTournamentId(id);
    };

    const handleDeleteTournament = (tournamentId) => {
        const updated = activeTournaments.filter(t => t.id !== tournamentId);
        setActiveTournaments(updated);
        localStorage.setItem('activeTournaments', JSON.stringify(updated));
    };

    const handleStartTournament = (teamList, tournamentMode) => {
        setTeams(teamList);
        setMode(tournamentMode);
        setResults({});
        setCurrentTournamentId(null);
        setStatus('DRAW');
    };

    const handleDrawComplete = (generatedFixtures) => {
        setFixtures(generatedFixtures);
        saveTournament(teams, mode, generatedFixtures, {});
        setStatus('DASHBOARD');
    };

    const handleStartMatch = (match) => {
        // Don't start match if it's a BYE
        if (match.away === 'BYE') {
            return;
        }
        setActiveMatch(match);
        setStatus('MATCH');
    };

    const handleMatchFinish = (matchId, result) => {
        const newResults = { ...results, [matchId]: result };
        setResults(newResults);
        saveTournament(teams, mode, fixtures, newResults);
        setStatus('DASHBOARD');
        setActiveMatch(null);
    };

    const handleResumeTournament = (tournament) => {
        setTeams(tournament.teams);
        setMode(tournament.mode);
        setFixtures(tournament.fixtures);
        setResults(tournament.results);
        setCurrentTournamentId(tournament.id);
        setStatus('DASHBOARD');
    };

    const handleGoHome = () => {
        // Save current state before going home
        if (fixtures.length > 0) {
            saveTournament(teams, mode, fixtures, results);
        }
        setStatus('SETUP');
    };

    return (
        <div style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
            <AnimatePresence mode="wait">
                {status === 'SETUP' && (
                    <Setup
                        key="setup"
                        onStart={handleStartTournament}
                        activeTournaments={activeTournaments}
                        onResumeTournament={handleResumeTournament}
                        onDeleteTournament={handleDeleteTournament}
                    />
                )}
                {status === 'DRAW' && (
                    <DrawCeremony
                        key="draw"
                        teams={teams}
                        mode={mode}
                        onComplete={handleDrawComplete}
                    />
                )}
                {status === 'DASHBOARD' && (
                    <Dashboard
                        key="dashboard"
                        teams={teams}
                        fixtures={fixtures}
                        results={results}
                        mode={mode}
                        onStartMatch={handleStartMatch}
                        onGoHome={handleGoHome}
                    />
                )}
                {status === 'MATCH' && (
                    <MatchView
                        key="match"
                        match={activeMatch}
                        onFinish={handleMatchFinish}
                        onBack={() => setStatus('DASHBOARD')}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
