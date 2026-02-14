import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
import StudySection from './components/StudySection';
import EnglishSection from './components/EnglishSection';
import Setup from './components/Setup';
import DrawCeremony from './components/DrawCeremony';
import Dashboard from './components/Dashboard';
import MatchView from './components/MatchView';
import UserManagement from './components/UserManagement';
import StudentPanel from './components/StudentPanel';
import ProfilePage from './components/ProfilePage';
import QuizBankPage from './components/QuizBankPage';
import DailyQuizPage from './components/DailyQuizPage';
import LeaguePage from './components/LeaguePage';
import SkillTreePage from './components/SkillTreePage';
import DailyTournamentPage from './components/DailyTournamentPage';

import { getTournaments, createTournament, updateTournament, deleteTournament } from './api';

function GameContainer() {
    // Page hierarchy:
    // HOME (dashboard), ARENA (→SETUP/DRAW/DASHBOARD/MATCH), STUDY (→ENGLISH), STUDENT_PANEL, PROFILE, USER_MANAGEMENT
    const [currentPage, setCurrentPage] = useState('HOME');
    // Tournament sub-states
    const [arenaStatus, setArenaStatus] = useState('SETUP'); // SETUP, DRAW, DASHBOARD, MATCH
    const [studyStatus, setStudyStatus] = useState('SUBJECTS'); // SUBJECTS, ENGLISH

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
                await updateTournament(currentTournamentId, tournamentData);
                const updatedActive = activeTournaments.map(t =>
                    t._id === currentTournamentId ? { ...t, ...tournamentData } : t
                );
                setActiveTournaments(updatedActive);
            } else {
                const newTournament = await createTournament(tournamentData);
                setCurrentTournamentId(newTournament._id);
                setActiveTournaments([...activeTournaments, newTournament]);
            }
        } catch (error) {
            console.error("Failed to save tournament", error);
        }
    };

    const completeTournament = async (winner) => {
        if (!currentTournamentId) return;
        await saveTournament(teams, mode, fixtures, results, tournamentName, 'COMPLETED', winner);
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
        setArenaStatus('DRAW');
    };

    const handleDrawComplete = (generatedFixtures) => {
        setFixtures(generatedFixtures);
        saveTournament(teams, mode, generatedFixtures, {}, tournamentName);
        setArenaStatus('DASHBOARD');
    };

    const handleStartMatch = (match) => {
        if (match.away === 'BYE') return;
        setActiveMatch(match);
        setArenaStatus('MATCH');
    };

    const handleMatchFinish = (matchId, result) => {
        const newResults = { ...results, [matchId]: result };
        setResults(newResults);
        saveTournament(teams, mode, fixtures, newResults, tournamentName);
        setArenaStatus('DASHBOARD');
        setActiveMatch(null);
    };

    const handleResumeTournament = (tournament) => {
        setTeams(tournament.teams);
        setMode(tournament.mode);
        setTournamentName(tournament.name);
        setFixtures(tournament.fixtures);
        setResults(tournament.results);
        setCurrentTournamentId(tournament._id);
        setArenaStatus('DASHBOARD');
    };

    const handleGoHome = () => {
        if (fixtures.length > 0) {
            saveTournament(teams, mode, fixtures, results, tournamentName);
        }
        setArenaStatus('SETUP');
    };

    const handleCompleteTournament = (winner) => {
        completeTournament(winner);
        setArenaStatus('SETUP');
    };

    const handleUpdateTournamentName = (newName) => {
        setTournamentName(newName);
        saveTournament(teams, mode, fixtures, results, newName);
    };

    const handleNavigate = (page) => {
        setCurrentPage(page);
        // Reset sub-states when navigating
        if (page === 'ARENA') setArenaStatus('SETUP');
        if (page === 'STUDY') setStudyStatus('SUBJECTS');
    };

    // If user is not logged in, show landing
    if (!user) {
        return (
            <div style={{ minHeight: '100vh', width: '100%', position: 'relative' }}>
                <div style={{
                    position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000,
                    display: 'flex', gap: '1rem'
                }}>
                    <button onClick={() => navigate('/login')} style={{
                        color: '#00ff88', background: 'rgba(0, 255, 136, 0.1)',
                        border: '1px solid rgba(0, 255, 136, 0.3)', padding: '8px 20px',
                        borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold'
                    }}>Giriş Yap</button>
                    <button onClick={() => navigate('/register')} style={{
                        color: '#00b8ff', background: 'rgba(0, 184, 255, 0.1)',
                        border: '1px solid rgba(0, 184, 255, 0.3)', padding: '8px 20px',
                        borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold'
                    }}>Kayıt Ol</button>
                </div>
                <LandingPage
                    onEnterGame={() => navigate('/login')}
                    onEnterStudy={() => navigate('/login')}
                />
            </div>
        );
    }

    // Logged in: sidebar + content
    return (
        <div className="app-layout">
            <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
            <main className="app-content">
                <AnimatePresence mode="wait">
                    {/* HOME */}
                    {currentPage === 'HOME' && (
                        <HomePage key="home" onNavigate={handleNavigate} />
                    )}

                    {/* ARENA (Tournament System) */}
                    {currentPage === 'ARENA' && arenaStatus === 'SETUP' && (
                        <Setup
                            key="setup"
                            onStart={handleStartTournament}
                            activeTournaments={activeTournaments}
                            onResumeTournament={handleResumeTournament}
                            onDeleteTournament={handleDeleteTournament}
                            completedTournaments={completedTournaments}
                            onDeleteTrophy={handleDeleteTrophy}
                            onEditTrophy={handleEditTrophy}
                            onBackToLanding={() => handleNavigate('HOME')}
                        />
                    )}
                    {currentPage === 'ARENA' && arenaStatus === 'DRAW' && (
                        <DrawCeremony
                            key="draw"
                            teams={teams}
                            mode={mode}
                            onComplete={handleDrawComplete}
                        />
                    )}
                    {currentPage === 'ARENA' && arenaStatus === 'DASHBOARD' && (
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
                    {currentPage === 'ARENA' && arenaStatus === 'MATCH' && (
                        <MatchView
                            key="match"
                            match={activeMatch}
                            onFinish={handleMatchFinish}
                            onBack={() => setArenaStatus('DASHBOARD')}
                        />
                    )}

                    {/* STUDY (Kütüphane) */}
                    {currentPage === 'STUDY' && studyStatus === 'SUBJECTS' && (
                        <StudySection
                            key="study"
                            onBack={() => handleNavigate('HOME')}
                            onSelectSubject={(subject) => {
                                if (subject.id === 'english') {
                                    setStudyStatus('ENGLISH');
                                } else {
                                    alert(`${subject.name} yakında aktif olacak!`);
                                }
                            }}
                        />
                    )}
                    {currentPage === 'STUDY' && studyStatus === 'ENGLISH' && (
                        <EnglishSection
                            key="english"
                            onBack={() => setStudyStatus('SUBJECTS')}
                        />
                    )}

                    {/* STUDENT PANEL (Eğitim) */}
                    {currentPage === 'STUDENT_PANEL' && (
                        <StudentPanel
                            key="student-panel"
                            onBack={() => handleNavigate('HOME')}
                        />
                    )}

                    {/* DAILY QUIZ */}
                    {currentPage === 'DAILY_QUIZ' && (
                        <DailyQuizPage
                            key="daily-quiz"
                            onBack={() => handleNavigate('HOME')}
                        />
                    )}

                    {/* QUIZ BANK (Admin/Staff) */}
                    {currentPage === 'QUIZ_BANK' && (user?.role === 'admin' || user?.role === 'staff') && (
                        <QuizBankPage
                            key="quiz-bank"
                            onBack={() => handleNavigate('HOME')}
                        />
                    )}

                    {/* LEAGUE (Lig Sıralaması) */}
                    {currentPage === 'LEAGUE' && (
                        <LeaguePage
                            key="league"
                            onBack={() => handleNavigate('HOME')}
                        />
                    )}

                    {/* SKILL TREE (Beceri Ağacı) */}
                    {currentPage === 'SKILL_TREE' && (
                        <SkillTreePage
                            key="skill-tree"
                            onBack={() => handleNavigate('HOME')}
                        />
                    )}

                    {/* DAILY TOURNAMENT (Günlük Turnuva) */}
                    {currentPage === 'DAILY_TOURNAMENT' && (
                        <DailyTournamentPage
                            key="daily-tournament"
                            onBack={() => handleNavigate('HOME')}
                        />
                    )}

                    {/* PROFILE */}
                    {currentPage === 'PROFILE' && (
                        <ProfilePage
                            key="profile"
                            onBack={() => handleNavigate('HOME')}
                        />
                    )}

                    {/* USER MANAGEMENT */}
                    {currentPage === 'USER_MANAGEMENT' && user?.role === 'admin' && (
                        <UserManagement
                            key="user-management"
                            onBack={() => handleNavigate('HOME')}
                        />
                    )}
                </AnimatePresence>
            </main>
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
