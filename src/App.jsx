import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './components/LandingPage';
import StudySection from './components/StudySection';
import EnglishSection from './components/EnglishSection';
import Setup from './components/Setup';
import DrawCeremony from './components/DrawCeremony';
import Dashboard from './components/Dashboard';
import MatchView from './components/MatchView';

import { getTournaments, createTournament, updateTournament, deleteTournament } from './api';

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

    // Load saved tournaments from API
    useEffect(() => {
        const fetchTournaments = async () => {
            const data = await getTournaments();
            const active = data.filter(t => t.status !== 'COMPLETED');
            const completed = data.filter(t => t.status === 'COMPLETED');
            setActiveTournaments(active);
            setCompletedTournaments(completed);
        };
        fetchTournaments();
    }, []);

    // Save current tournament state (Create or Update)
    const saveTournament = async (teamsData, modeData, fixturesData, resultsData, name, status = 'DASHBOARD', winner = null) => {
        const tournamentData = {
            name: name || tournamentName || `Turnuva ${new Date().toLocaleDateString('tr-TR')}`,
            mode: modeData,
            teams: teamsData,
            fixtures: fixturesData,
            results: resultsData,
            status: status,
            winner: winner
        };

        try {
            if (currentTournamentId) {
                // Update existing
                await updateTournament(currentTournamentId, tournamentData);

                // Refresh list locally to reflect changes immediately (optimistic update or re-fetch)
                const updatedActive = activeTournaments.map(t =>
                    t._id === currentTournamentId ? { ...t, ...tournamentData } : t
                );
                setActiveTournaments(updatedActive);
            } else {
                // Create new
                const newTournament = await createTournament(tournamentData);
                setCurrentTournamentId(newTournament._id);
                setActiveTournaments([...activeTournaments, newTournament]);
            }
        } catch (error) {
            console.error("Failed to save tournament", error);
        }
    };

    // Complete a tournament with a winner
    const completeTournament = async (winner) => {
        if (!currentTournamentId) return;

        // Save final state with winner and COMPLETED status
        await saveTournament(teams, mode, fixtures, results, tournamentName, 'COMPLETED', winner);

        // Move from active to completed in local state
        const tournament = activeTournaments.find(t => t._id === currentTournamentId);
        if (tournament) {
            const completedTournament = { ...tournament, status: 'COMPLETED', winner };
            setCompletedTournaments([...completedTournaments, completedTournament]);
            setActiveTournaments(activeTournaments.filter(t => t._id !== currentTournamentId));
        }
    };

    const handleDeleteTournament = async (tournamentId) => {
        try {
            await deleteTournament(tournamentId);
            setActiveTournaments(activeTournaments.filter(t => t._id !== tournamentId));
        } catch (error) {
            console.error("Failed to delete tournament", error);
        }
    };

    const handleDeleteTrophy = async (trophyId) => {
        try {
            await deleteTournament(trophyId);
            setCompletedTournaments(completedTournaments.filter(t => t._id !== trophyId));
        } catch (error) {
            console.error("Failed to delete trophy", error);
        }
    };

    const handleEditTrophy = async (trophyId, newData) => {
        try {
            await updateTournament(trophyId, newData);
            const updated = completedTournaments.map(t =>
                t._id === trophyId ? { ...t, ...newData } : t
            );
            setCompletedTournaments(updated);
        } catch (error) {
            console.error("Failed to update trophy", error);
        }
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
        setCurrentTournamentId(tournament._id); // Use _id from MongoDB
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
                            if (subject.id === 'english') {
                                setStatus('ENGLISH');
                            } else {
                                alert(`${subject.name} yakında aktif olacak!`);
                            }
                        }}
                    />
                )}
                {status === 'ENGLISH' && (
                    <EnglishSection
                        key="english"
                        onBack={() => setStatus('STUDY')}
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
