import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, BookOpen, Trophy, GraduationCap,
    User, Shield, LogOut, Menu, X, ChevronRight, Zap, Database
} from 'lucide-react';

const Sidebar = ({ currentPage, onNavigate }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const isAdmin = user?.role === 'admin';

    const navItems = [
        { id: 'HOME', label: 'Ana Sayfa', icon: <LayoutDashboard size={22} />, always: true },
        { id: 'DAILY_QUIZ', label: 'Günlük Quiz', icon: <Zap size={22} />, sub: 'Soru & Sıralama', always: true },
        { id: 'ARENA', label: 'Arena', icon: <Trophy size={22} />, sub: 'Turnuvalar', always: true },
        { id: 'STUDY', label: 'Kütüphane', icon: <BookOpen size={22} />, sub: 'Dersler', always: true },
        { id: 'STUDENT_PANEL', label: 'Eğitim', icon: <GraduationCap size={22} />, sub: 'Takip & Sorular', always: true },
        { id: 'PROFILE', label: 'Profil', icon: <User size={22} />, sub: 'Başarılar', always: true },
    ];

    if (isAdmin || user?.role === 'staff') {
        navItems.push({ id: 'QUIZ_BANK', label: 'Soru Bankası', icon: <Database size={22} />, sub: 'Soru Yönetimi', always: false });
    }
    if (isAdmin) {
        navItems.push({ id: 'USER_MANAGEMENT', label: 'Yönetim', icon: <Shield size={22} />, sub: 'Admin Paneli', always: false });
    }

    const handleNav = (id) => {
        onNavigate(id);
        setMobileOpen(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Mobile hamburger */}
            <button className="sidebar-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

            <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
                {/* Logo area */}
                <div className="sidebar-logo">
                    {!collapsed && (
                        <>
                            <span className="sidebar-logo-text">halilhoca</span>
                            <span className="sidebar-logo-dot">.com</span>
                        </>
                    )}
                    {collapsed && <span className="sidebar-logo-mini">H</span>}
                    <button className="sidebar-collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                        <ChevronRight size={16} style={{ transform: collapsed ? 'rotate(0)' : 'rotate(180deg)' }} />
                    </button>
                </div>

                {/* Nav items */}
                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`sidebar-item ${currentPage === item.id ? 'sidebar-item-active' : ''}`}
                            onClick={() => handleNav(item.id)}
                            title={collapsed ? item.label : ''}
                        >
                            <span className="sidebar-item-icon">{item.icon}</span>
                            {!collapsed && (
                                <div className="sidebar-item-text">
                                    <span className="sidebar-item-label">{item.label}</span>
                                    {item.sub && <span className="sidebar-item-sub">{item.sub}</span>}
                                </div>
                            )}
                            {!collapsed && currentPage === item.id && (
                                <span className="sidebar-item-indicator" />
                            )}
                        </button>
                    ))}
                </nav>

                {/* User section at bottom */}
                <div className="sidebar-user">
                    {!collapsed && (
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">{user?.fullName}</span>
                            <span className="sidebar-user-role">
                                {user?.role === 'admin' ? '🛡️ Yönetici' : user?.role === 'staff' ? '👨‍🏫 Öğretmen' : user?.role === 'parent' ? '👨‍👧 Veli' : '🎓 Öğrenci'}
                            </span>
                        </div>
                    )}
                    <button className="sidebar-logout" onClick={handleLogout} title="Çıkış Yap">
                        <LogOut size={18} />
                        {!collapsed && <span>Çıkış</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
