import React, { useState } from 'react';
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
    const [results, setResults] = useState({}); // MatchID -> { homeScore, awayScore, status: 'FINISHED' }

    const handleStartTournament = (teamList, tournamentMode) => {
        setTeams(teamList);
        setMode(tournamentMode);
        setStatus('DRAW');
    };

    const handleDrawComplete = (generatedFixtures) => {
        setFixtures(generatedFixtures);
        setStatus('DASHBOARD');
    };

    const handleStartMatch = (match) => {
        setActiveMatch(match);
        setStatus('MATCH');
    };

    const handleMatchFinish = (matchId, result) => {
        setResults(prev => ({ ...prev, [matchId]: result }));
        setStatus('DASHBOARD');
        setActiveMatch(null);
    };

    return (
        <div style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
            <AnimatePresence mode="wait">
                {status === 'SETUP' && (
                    <Setup key="setup" onStart={handleStartTournament} />
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
                        onGoHome={() => setStatus('SETUP')}
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
