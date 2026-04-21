import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import api from '../api/axios';

const STEPS = { EMAIL: 1, OTP: 2, DETAILS: 3, DONE: 4 };

export default function Register() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [step, setStep] = useState(STEPS.EMAIL);
    const [form, setForm] = useState({
        email: '', otp_code: '',
        full_name: '', password: '', confirm: '', role: 'Citizen'
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const sendOTP = async () => {
        setError('');
        if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setError('Enter a valid email address.');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/send-otp', { email: form.email });
            setMessage(`OTP sent to ${form.email}. Check your inbox (and spam folder).`);
            setStep(STEPS.OTP);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP.');
        } finally { setLoading(false); }
    };

    const verifyOTP = () => {
        if (form.otp_code.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
        setError('');
        setStep(STEPS.DETAILS);
    };

    const register = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setError(''); setLoading(true);
        try {
            await api.post('/auth/register', {
                full_name: form.full_name,
                email: form.email,
                otp_code: form.otp_code,
                password: form.password,
                role: form.role
            });
            setStep(STEPS.DONE);
        } catch (err) {
            setError(err.response?.data?.error || JSON.stringify(err.response?.data?.errors) || 'Registration failed.');
        } finally { setLoading(false); }
    };

    const stepLabels = [t('stepEmail'), t('stepOTP'), t('stepDetails'), t('stepComplete')];

    return (
        <div className="auth-page">
            <div className="auth-card auth-card-wide">
                <div className="login-selector-lang" style={{ marginBottom: '12px' }}>
                    <LanguageSelector />
                </div>

                <div className="auth-header">
                    <div className="auth-emblem">⚙</div>
                    <h2 className="auth-title">{t('registerTitle')}</h2>
                    <p className="auth-subtitle">{t('portalTitle')}</p>
                </div>

                {/* Step indicator */}
                <div className="step-indicator">
                    {stepLabels.map((label, i) => (
                        <div key={label} className={`step-item ${step > i ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}>
                            <span className="step-num">{i + 1}</span>
                            <span className="step-label">{label}</span>
                        </div>
                    ))}
                </div>

                {message && <div className="alert alert-info">{message}</div>}
                {error && <div className="alert alert-error" role="alert">{error}</div>}

                {/* Step 1 – Email */}
                {step === STEPS.EMAIL && (
                    <div className="auth-form">
                        <div className="form-group">
                            <label htmlFor="reg-email" className="form-label">{t('emailLabel')}</label>
                            <input
                                id="reg-email"
                                type="email"
                                name="email"
                                placeholder={t('emailPlaceholder')}
                                value={form.email}
                                onChange={handleChange}
                                className="form-control"
                                autoComplete="email"
                            />
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                                {t('otpSendHint')}
                            </p>
                        </div>

                        <button onClick={sendOTP} className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? t('sendingOTP') : t('sendOTP')}
                        </button>
                    </div>
                )}

                {/* Step 2 – OTP */}
                {step === STEPS.OTP && (
                    <div className="auth-form">
                        <div className="form-group">
                            <label htmlFor="otp_code" className="form-label">{t('otpLabel')}</label>
                            <input
                                id="otp_code"
                                type="text"
                                name="otp_code"
                                maxLength={6}
                                placeholder={t('otpPlaceholder')}
                                value={form.otp_code}
                                onChange={handleChange}
                                className="form-control"
                                autoComplete="one-time-code"
                                inputMode="numeric"
                            />
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

                {/* Step 3 – Details */}
                {step === STEPS.DETAILS && (
                    <form onSubmit={register} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="full_name" className="form-label">{t('fullNameLabel')}</label>
                            <input id="full_name" type="text" name="full_name" required
                                minLength={2} maxLength={150} placeholder={t('fullNamePlaceholder')}
                                value={form.full_name} onChange={handleChange} className="form-control" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password" className="form-label">{t('createPassword')}</label>
                            <input id="password" type="password" name="password" required minLength={6}
                                placeholder={t('passwordMinHint')}
                                value={form.password} onChange={handleChange} className="form-control" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirm" className="form-label">{t('confirmPassword')}</label>
                            <input id="confirm" type="password" name="confirm" required
                                placeholder={t('reenterPassword')}
                                value={form.confirm} onChange={handleChange} className="form-control" />
                        </div>
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? t('registering') : t('completeRegistration')}
                        </button>
                    </form>
                )}

                {/* Step 4 – Done */}
                {step === STEPS.DONE && (
                    <div className="success-panel">
                        <div className="success-icon">✓</div>
                        <h3>{t('registrationSuccess')}</h3>
                        <p>{t('registrationSuccessMsg')}</p>
                        <button onClick={() => navigate('/login/citizen')} className="btn btn-primary btn-block mt-md">
                            {t('proceedToLogin')}
                        </button>
                    </div>
                )}

                <div className="auth-links">
                    <Link to="/login/citizen" className="text-link">{t('alreadyRegistered')}</Link>
                </div>
            </div>
        </div>
    );
}
