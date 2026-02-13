import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LandingPage from './components/LandingPage';
import StudySection from './components/StudySection';
import EnglishSection from './components/EnglishSection';
import Setup from './components/Setup';
import DrawCeremony from './components/DrawCeremony';
import Dashboard from './components/Dashboard';
import MatchView from './components/MatchView';
import UserManagement from './components/UserManagement';
import StudentPanel from './components/StudentPanel';

import { getTournaments, createTournament, updateTournament, deleteTournament } from './api';

function GameContainer() {
    const [status, setStatus] = useState('LANDING'); // LANDING, SETUP, DRAW, DASHBOARD, MATCH, USER_MANAGEMENT
    const [teams, setTeams] = useState([]);
    const [mode, setMode] = useState('LEAGUE');
    const [tournamentName, setTournamentName] = useState('');
    const [fixtures, setFixtures] = useState([]);
    const [activeMatch, setActiveMatch] = useState(null);
    const [results, setResults] = useState({});
    const [activeTournaments, setActiveTournaments] = useState([]);
    const [completedTournaments, setCompletedTournaments] = useState([]);
    const [currentTournamentId, setCurrentTournamentId] = useState(null);

    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Load saved tournaments from API
    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const data = await getTournaments();
                const active = data.filter(t => t.status !== 'COMPLETED');
                const completed = data.filter(t => t.status === 'COMPLETED');
                setActiveTournaments(active);
                setCompletedTournaments(completed);
            } catch (error) {
                console.error("Error fetching tournaments:", error);
            }
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
            {/* User Info Header */}
            {user ? (
                <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    zIndex: 1000,
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center'
                }}>
                    <span style={{
                        color: 'white',
                        background: 'rgba(0,0,0,0.6)',
                        padding: '8px 15px',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '0.9rem',
                        backdropFilter: 'blur(5px)'
                    }}>
                        👤 {user.fullName} <span style={{ opacity: 0.6, fontSize: '0.8rem' }}>({user.role})</span>
                    </span>

                    <button
                        onClick={() => setStatus('STUDENT_PANEL')}
                        style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#3b82f6',
                            padding: '8px 15px',
                            borderRadius: '20px',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                    >
                        📚 Ders Takip
                    </button>

                    {user.role === 'admin' && (
                        <button
                            onClick={() => setStatus('USER_MANAGEMENT')}
                            style={{
                                background: 'rgba(59, 130, 246, 0.2)',
                                color: '#3b82f6',
                                padding: '8px 15px',
                                borderRadius: '20px',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            🛡️ Yönetim Paneli
                        </button>
                    )}

                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            padding: '8px 15px',
                            borderRadius: '20px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Çıkış
                    </button>
                </div>
            ) : (
                status === 'LANDING' && (
                    <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        zIndex: 1000,
                        display: 'flex',
                        gap: '1rem'
                    }}>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                color: '#00ff88',
                                background: 'rgba(0, 255, 136, 0.1)',
                                border: '1px solid rgba(0, 255, 136, 0.3)',
                                padding: '8px 20px',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Giriş Yap
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            style={{
                                color: '#00b8ff',
                                background: 'rgba(0, 184, 255, 0.1)',
                                border: '1px solid rgba(0, 184, 255, 0.3)',
                                padding: '8px 20px',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Kayıt Ol
                        </button>
                    </div>
                )
            )}

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
                {status === 'USER_MANAGEMENT' && user?.role === 'admin' && (
                    <UserManagement
                        key="user-management"
                        onBack={() => setStatus('LANDING')}
                    />
                )}
                {status === 'STUDENT_PANEL' && (
                    <StudentPanel
                        key="student-panel"
                        onBack={() => setStatus('LANDING')}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/*" element={<GameContainer />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
