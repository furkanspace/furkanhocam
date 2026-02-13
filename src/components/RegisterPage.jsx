import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, User, Lock, ArrowRight, Type, AlertCircle } from 'lucide-react';
import BackgroundIcons from './BackgroundIcons';

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
            <BackgroundIcons theme="study" />

            <motion.div
                className="auth-card"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <div className="auth-header">
                    <motion.div
                        className="auth-icon-wrapper"
                        style={{ color: '#3b82f6', boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)' }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                        <UserPlus size={32} />
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        Kayıt Ol
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        Aramıza katılın ve öğrenmeye başlayın
                    </motion.p>
                </div>

                {error && (
                    <motion.div
                        className="auth-error"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                    >
                        <AlertCircle size={18} /> {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <motion.div
                        className="form-group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Type size={20} className="input-icon" />
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Ad Soyad"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </motion.div>

                    <motion.div
                        className="form-group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <User size={20} className="input-icon" />
                        <input
                            type="text"
                            name="username"
                            placeholder="Kullanıcı Adı"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </motion.div>

                    <motion.div
                        className="form-group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <Lock size={20} className="input-icon" />
                        <input
                            type="password"
                            name="password"
                            placeholder="Şifre"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </motion.div>

                    <motion.div
                        className="form-group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="auth-select"
                        >
                            <option value="student">Öğrenci</option>
                            <option value="parent">Veli</option>
                            <option value="staff">Personel</option>
                        </select>
                    </motion.div>

                    <motion.button
                        type="submit"
                        className="btn-auth-submit btn-register"
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                    >
                        {isLoading ? 'Kaydediliyor...' : 'Kayıt Ol'} <ArrowRight size={20} />
                    </motion.button>
                </form>

                <motion.div
                    className="auth-footer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                >
                    <p>Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link></p>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
