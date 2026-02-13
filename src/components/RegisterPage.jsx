import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, User, Lock, ArrowRight, Type } from 'lucide-react';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        role: 'student' // Default role
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await register(formData);

        if (result.success) {
            alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
            navigate('/login');
        } else {
            setError(result.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="auth-page">
            <motion.div
                className="auth-card glass-panel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="auth-header">
                    <div className="auth-icon-wrapper" style={{ borderColor: '#00ff88', color: '#00ff88' }}>
                        <UserPlus size={32} />
                    </div>
                    <h2>Kayıt Ol</h2>
                    <p>Yeni bir hesap oluşturun</p>
                </div>

                {error && (
                    <motion.div
                        className="auth-error"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <Type size={18} className="input-icon" />
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Ad Soyad"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <User size={18} className="input-icon" />
                        <input
                            type="text"
                            name="username"
                            placeholder="Kullanıcı Adı"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <Lock size={18} className="input-icon" />
                        <input
                            type="password"
                            name="password"
                            placeholder="Şifre"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '5px', color: '#888', fontSize: '0.9rem' }}>Rol Seçin:</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="auth-select">
                            <option value="student">Öğrenci</option>
                            <option value="parent">Veli</option>
                            <option value="staff">Personel</option>
                        </select>
                    </div>

                    <button type="submit" className="btn-auth-submit btn-register" disabled={isLoading}>
                        {isLoading ? 'Kaydediliyor...' : 'Kayıt Ol'} <ArrowRight size={18} />
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link></p>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
