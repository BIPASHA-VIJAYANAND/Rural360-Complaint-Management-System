import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import api from '../api/axios';

export default function Login() {
    const { login } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { mode } = useParams(); // 'citizen' or 'admin'

    const isAdmin = mode === 'admin';

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/auth/login', {
                email: form.email,
                password: form.password
            });

            const role = res.data.role;

            // Validate login mode vs actual role
            if (isAdmin && role === 'Citizen') {
                setError('This account is registered as a Citizen. Please use Citizen Login.');
                setLoading(false);
                return;
            }
            if (!isAdmin && role !== 'Citizen') {
                setError('This account is registered as ' + role + '. Please use Admin/Staff Login.');
                setLoading(false);
                return;
            }

            login(
                { user_id: res.data.user_id, full_name: res.data.full_name, role: res.data.role },
                res.data.token
            );

            if (role === 'Admin' || role === 'Clerk') navigate('/admin');
            else if (role === 'Staff') navigate('/staff-panel');
            else navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="login-selector-lang" style={{ marginBottom: '12px' }}>
                    <LanguageSelector />
                </div>

                <div className="auth-header">
                    <div className={`auth-emblem ${isAdmin ? 'auth-emblem-admin' : ''}`}>
                        {isAdmin ? '🛡️' : '⚙'}
                    </div>
                    <h2 className="auth-title">{t('portalTitle')}</h2>
                    <p className="auth-subtitle">
                        {isAdmin ? t('adminLogin') : t('citizenLogin')}
                    </p>
                </div>

                {error && <div className="alert alert-error" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">{t('emailLabel')}</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            placeholder={t('emailPlaceholder')}
                            value={form.email}
                            onChange={handleChange}
                            className="form-control"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">{t('passwordLabel')}</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            placeholder={t('passwordPlaceholder')}
                            value={form.password}
                            onChange={handleChange}
                            className="form-control"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? t('signingIn') : t('signIn')}
                    </button>
                </form>

                <div className="auth-links">
                    <Link to="/forgot-password" className="text-link">{t('forgotPassword')}</Link>
                    {!isAdmin && (
                        <>
                            <span className="divider">|</span>
                            <Link to="/register" className="text-link">{t('newRegistration')}</Link>
                        </>
                    )}
                </div>

                <div className="auth-links" style={{ marginTop: '8px' }}>
                    <Link to="/" className="text-link">
                        ← {t('selectLoginType')}
                    </Link>
                </div>

                <p className="auth-footnote">
                    {t('loginFootnote')}
                </p>
            </div>
        </div>
    );
}
