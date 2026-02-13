import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Users, UserPlus, Trash2, Shield, User, ArrowLeft } from 'lucide-react';

const UserManagement = ({ onBack }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    // Form state
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        fullName: '',
        role: 'student'
    });

    const API_URL = import.meta.env.PROD ? '/api/auth' : 'http://localhost:5001/api/auth';
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                setError('Kullanıcılar getirilemedi.');
            }
        } catch (err) {
            setError('Bağlantı hatası.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            });

            if (res.ok) {
                alert('Kullanıcı oluşturuldu!');
                setNewUser({ username: '', password: '', fullName: '', role: 'student' });
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.message || 'Hata oluştu');
            }
        } catch (err) {
            alert('Hata oluştu');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;

        try {
            const res = await fetch(`${API_URL}/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchUsers();
            } else {
                alert('Silinemedi.');
            }
        } catch (err) {
            alert('Hata oluştu.');
        }
    };

    return (
        <motion.div
            className="user-management-page glass-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
                maxWidth: '1000px',
                margin: '2rem auto',
                padding: '2rem',
                color: 'white'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Shield size={32} color="#00ff88" /> Kullanıcı Yönetimi
                </h1>
            </div>

            <div className="admin-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Create User Form */}
                <div className="create-user-section" style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '15px' }}>
                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <UserPlus size={20} /> Yeni Kullanıcı Ekle
                    </h3>
                    <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            type="text" placeholder="Ad Soyad" required
                            value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })}
                            style={inputStyle}
                        />
                        <input
                            type="text" placeholder="Kullanıcı Adı" required
                            value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                            style={inputStyle}
                        />
                        <input
                            type="text" placeholder="Şifre" required
                            value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                            style={inputStyle}
                        />
                        <select
                            value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="student">Öğrenci</option>
                            <option value="parent">Veli</option>
                            <option value="staff">Personel</option>
                            <option value="admin">Yönetici</option>
                        </select>
                        <button type="submit" style={buttonStyle}>Oluştur</button>
                    </form>
                </div>

                {/* User List */}
                <div className="user-list-section" style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '15px' }}>
                    <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Users size={20} /> Kayıtlı Kullanıcılar
                    </h3>
                    {loading ? <p>Yükleniyor...</p> : (
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                        <th style={{ padding: '10px' }}>Ad Soyad</th>
                                        <th style={{ padding: '10px' }}>Kullanıcı Adı</th>
                                        <th style={{ padding: '10px' }}>Rol</th>
                                        <th style={{ padding: '10px' }}>İşlem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '10px' }}>{u.fullName}</td>
                                            <td style={{ padding: '10px', opacity: 0.7 }}>{u.username}</td>
                                            <td style={{ padding: '10px' }}>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.8rem',
                                                    background: getRoleColor(u.role),
                                                    color: 'black',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {u.role.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px' }}>
                                                {u.username !== 'admin' && u._id !== user._id && (
                                                    <button
                                                        onClick={() => handleDeleteUser(u._id)}
                                                        style={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444', border: 'none', padding: '5px', borderRadius: '5px', cursor: 'pointer' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const inputStyle = {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    padding: '10px',
    borderRadius: '8px',
    outline: 'none'
};

const buttonStyle = {
    background: 'linear-gradient(45deg, #00ff88, #00b8ff)',
    border: 'none',
    color: 'black',
    padding: '10px',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer'
};

const getRoleColor = (role) => {
    switch (role) {
        case 'admin': return '#ff0055';
        case 'staff': return '#eba834';
        case 'parent': return '#b834eb';
        case 'student': return '#00ff88';
        default: return '#ccc';
    }
};

export default UserManagement;
