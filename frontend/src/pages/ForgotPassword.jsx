import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import api from '../api/axios';

const STEPS = { EMAIL: 1, OTP: 2, RESET: 3, DONE: 4 };

export default function ForgotPassword() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [step, setStep] = useState(STEPS.EMAIL);
    const [form, setForm] = useState({ email: '', otp_code: '', new_password: '', confirm: '' });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const sendOTP = async () => {
        if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setError('Enter a valid email address.');
            return;
        }
        setError(''); setLoading(true);
        try {
            await api.post('/auth/send-otp', { email: form.email });
            setMessage(`OTP sent to ${form.email}. Check your inbox.`);
            setStep(STEPS.OTP);
        } catch (err) { setError(err.response?.data?.error || 'Failed to send OTP.'); }
        finally { setLoading(false); }
    };

    const verifyOTP = () => {
        if (form.otp_code.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
        setError(''); setStep(STEPS.RESET);
    };

    const resetPassword = async (e) => {
        e.preventDefault();
        if (form.new_password !== form.confirm) { setError('Passwords do not match.'); return; }
        if (form.new_password.length < 6) { setError('Minimum 6 characters.'); return; }
        setError(''); setLoading(true);
        try {
            await api.post('/auth/forgot-password', {
                email: form.email,
                otp_code: form.otp_code,
                new_password: form.new_password
            });
            setStep(STEPS.DONE);
        } catch (err) { setError(err.response?.data?.error || 'Reset failed.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="login-selector-lang" style={{ marginBottom: '12px' }}>
                    <LanguageSelector />
                </div>
                
                <div className="auth-header">
                    <h2 className="auth-title">{t('passwordReset')}</h2>
                    <p className="auth-subtitle">{t('portalTitle')}</p>
                </div>

                {message && <div className="alert alert-info">{message}</div>}
                {error && <div className="alert alert-error">{error}</div>}

                {step === STEPS.EMAIL && (
                    <div className="auth-form">
                        <div className="form-group">
                            <label htmlFor="fp-email" className="form-label">{t('registeredEmail')}</label>
                            <input id="fp-email" type="email" name="email"
                                placeholder={t('emailPlaceholder')} value={form.email}
                                onChange={handleChange} className="form-control" />
                        </div>
                        <button onClick={sendOTP} className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? t('sending') : t('sendOTPShort')}
                        </button>
                    </div>
                )}

                {step === STEPS.OTP && (
                    <div className="auth-form">
                        <div className="form-group">
                            <label htmlFor="fp-otp" className="form-label">{t('enterOTP')}</label>
                            <input id="fp-otp" type="text" name="otp_code" maxLength={6}
                                placeholder={t('otpPlaceholder')} value={form.otp_code}
                                onChange={handleChange} className="form-control"
                                inputMode="numeric" autoComplete="one-time-code" />
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                                {t('checkInbox')} <b>{form.email}</b>
                            </p>
                        </div>
                        <button onClick={verifyOTP} className="btn btn-primary btn-block">{t('verifyOTP')}</button>
                        <button onClick={sendOTP} className="btn btn-outline btn-block mt-sm" disabled={loading}>
                            {t('resendOTP')}
                        </button>
                    </div>
                )}

                {step === STEPS.RESET && (
                    <form onSubmit={resetPassword} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="fp-pw" className="form-label">{t('newPassword')}</label>
                            <input id="fp-pw" type="password" name="new_password" minLength={6} required
                                placeholder={t('passwordMinHint')} value={form.new_password}
                                onChange={handleChange} className="form-control" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="fp-conf" className="form-label">{t('confirmNewPassword')}</label>
                            <input id="fp-conf" type="password" name="confirm" required
                                placeholder={t('reenterPassword')} value={form.confirm}
                                onChange={handleChange} className="form-control" />
                        </div>
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? t('resetting') : t('resetPassword')}
                        </button>
                    </form>
                )}

                {step === STEPS.DONE && (
                    <div className="success-panel">
                        <div className="success-icon">✓</div>
                        <h3>{t('passwordResetSuccess')}</h3>
                        <button onClick={() => navigate('/login/citizen')} className="btn btn-primary btn-block mt-md">
                            {t('signIn')}
                        </button>
                    </div>
                )}

                <div className="auth-links">
                    <Link to="/login/citizen" className="text-link">{t('backToLogin')}</Link>
                </div>
            </div>
        </div>
    );
}
