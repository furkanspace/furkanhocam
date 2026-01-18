import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './components/LandingPage';
import StudySection from './components/StudySection';
import Setup from './components/Setup';
import DrawCeremony from './components/DrawCeremony';
import Dashboard from './components/Dashboard';
import MatchView from './components/MatchView';

function App() {
    const [status, setStatus] = useState('LANDING'); // LANDING, SETUP, DRAW, DASHBOARD, MATCH
    const [teams, setTeams] = useState([]);
    const [mode, setMode] = useState('LEAGUE');
    const [tournamentName, setTournamentName] = useState('');
    const [fixtures, setFixtures] = useState([]);
    const [activeMatch, setActiveMatch] = useState(null);
    const [results, setResults] = useState({});
    const [activeTournaments, setActiveTournaments] = useState([]);
    const [completedTournaments, setCompletedTournaments] = useState([]);
    const [currentTournamentId, setCurrentTournamentId] = useState(null);

    // Load saved tournaments from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('activeTournaments');
        if (saved) {
            setActiveTournaments(JSON.parse(saved));
        }
        const completed = localStorage.getItem('completedTournaments');
        if (completed) {
            setCompletedTournaments(JSON.parse(completed));
        }
    }, []);

    // Save current tournament state
    const saveTournament = (teamsData, modeData, fixturesData, resultsData, name) => {
        const id = currentTournamentId || Date.now().toString();
        const tournament = {
            id,
            name: name || tournamentName || `Turnuva ${new Date().toLocaleDateString('tr-TR')}`,
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

    // Complete a tournament with a winner
    const completeTournament = (winner) => {
        const tournament = activeTournaments.find(t => t.id === currentTournamentId);
        if (!tournament) return;

        const completed = {
            id: currentTournamentId,
            name: tournament.name,
            winner: winner,
            date: new Date().toLocaleDateString('tr-TR'),
            mode: mode
        };

        const updatedCompleted = [...completedTournaments, completed];
        setCompletedTournaments(updatedCompleted);
        localStorage.setItem('completedTournaments', JSON.stringify(updatedCompleted));

        // Remove from active
        const updatedActive = activeTournaments.filter(t => t.id !== currentTournamentId);
        setActiveTournaments(updatedActive);
        localStorage.setItem('activeTournaments', JSON.stringify(updatedActive));
    };

    const handleDeleteTournament = (tournamentId) => {
        const updated = activeTournaments.filter(t => t.id !== tournamentId);
        setActiveTournaments(updated);
        localStorage.setItem('activeTournaments', JSON.stringify(updated));
    };

    const handleDeleteTrophy = (trophyId) => {
        const updated = completedTournaments.filter(t => t.id !== trophyId);
        setCompletedTournaments(updated);
        localStorage.setItem('completedTournaments', JSON.stringify(updated));
    };

    const handleEditTrophy = (trophyId, newData) => {
        const updated = completedTournaments.map(t =>
            t.id === trophyId ? { ...t, ...newData } : t
        );
        setCompletedTournaments(updated);
        localStorage.setItem('completedTournaments', JSON.stringify(updated));
    };

    const handleStartTournament = (teamList, tournamentMode, name) => {
        setTeams(teamList);
        setMode(tournamentMode);
        setTournamentName(name);
        setResults({});
        setCurrentTournamentId(null);
        setStatus('DRAW');
    };

    const handleDrawComplete = (generatedFixtures) => {
        setFixtures(generatedFixtures);
        saveTournament(teams, mode, generatedFixtures, {}, tournamentName);
        setStatus('DASHBOARD');
    };

    const handleStartMatch = (match) => {
        if (match.away === 'BYE') {
            return;
        }
        setActiveMatch(match);
        setStatus('MATCH');
    };

    const handleMatchFinish = (matchId, result) => {
        const newResults = { ...results, [matchId]: result };
        setResults(newResults);
        saveTournament(teams, mode, fixtures, newResults, tournamentName);
        setStatus('DASHBOARD');
        setActiveMatch(null);
    };

    const handleResumeTournament = (tournament) => {
        setTeams(tournament.teams);
        setMode(tournament.mode);
        setTournamentName(tournament.name);
        setFixtures(tournament.fixtures);
        setResults(tournament.results);
        setCurrentTournamentId(tournament.id);
        setStatus('DASHBOARD');
    };

    const handleGoHome = () => {
        if (fixtures.length > 0) {
            saveTournament(teams, mode, fixtures, results, tournamentName);
        }
        setStatus('SETUP');
    };

    const handleCompleteTournament = (winner) => {
        completeTournament(winner);
        setStatus('SETUP');
    };

    const handleUpdateTournamentName = (newName) => {
        setTournamentName(newName);
        saveTournament(teams, mode, fixtures, results, newName);
    };

    return (
        <div style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
            <AnimatePresence mode="wait">
                {status === 'LANDING' && (
                    <LandingPage
                        key="landing"
                        onEnterGame={() => setStatus('SETUP')}
                        onEnterStudy={() => setStatus('STUDY')}
                    />
                )}
                {status === 'STUDY' && (
                    <StudySection
                        key="study"
                        onBack={() => setStatus('LANDING')}
                        onSelectSubject={(subject) => {
                            // Future: handle subject selection
                            alert(`${subject.name} yakında aktif olacak!`);
                        }}
                    />
                )}
                {status === 'SETUP' && (
                    <Setup
                        key="setup"
                        onStart={handleStartTournament}
                        activeTournaments={activeTournaments}
                        onResumeTournament={handleResumeTournament}
                        onDeleteTournament={handleDeleteTournament}
                        completedTournaments={completedTournaments}
                        onDeleteTrophy={handleDeleteTrophy}
                        onEditTrophy={handleEditTrophy}
                        onBackToLanding={() => setStatus('LANDING')}
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
                        tournamentName={tournamentName}
                        onStartMatch={handleStartMatch}
                        onGoHome={handleGoHome}
                        onUpdateResult={(matchId, result) => {
                            const newResults = { ...results, [matchId]: result };
                            setResults(newResults);
                            saveTournament(teams, mode, fixtures, newResults, tournamentName);
                        }}
                        onCompleteTournament={handleCompleteTournament}
                        onUpdateTournamentName={handleUpdateTournamentName}
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
