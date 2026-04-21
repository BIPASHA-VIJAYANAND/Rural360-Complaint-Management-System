import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

export default function LoginSelector() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <div className="auth-page">
            <div className="login-selector-card">
                <div className="login-selector-lang">
                    <LanguageSelector />
                </div>

                <div className="auth-header">
                    <div className="auth-emblem">⚙</div>
                    <h2 className="auth-title">{t('portalTitle')}</h2>
                    <p className="auth-subtitle">{t('govOfIndia')}</p>
                </div>

                <h3 className="login-selector-heading">{t('selectLoginType')}</h3>

                <div className="login-selector-grid">
                    {/* Citizen Login Card */}
                    <button
                        id="citizen-login-btn"
                        className="login-type-card login-type-citizen"
                        onClick={() => navigate('/login/citizen')}
                    >
                        <div className="login-type-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <h4 className="login-type-title">{t('citizenLogin')}</h4>
                        <p className="login-type-desc">{t('citizenLoginDesc')}</p>
                        <span className="login-type-arrow">→</span>
                    </button>

                    {/* Admin / Staff Login Card */}
                    <button
                        id="admin-login-btn"
                        className="login-type-card login-type-admin"
                        onClick={() => navigate('/login/admin')}
                    >
                        <div className="login-type-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h4 className="login-type-title">{t('adminLogin')}</h4>
                        <p className="login-type-desc">{t('adminLoginDesc')}</p>
                        <span className="login-type-arrow">→</span>
                    </button>
                </div>

                <p className="auth-footnote">
                    {t('loginFootnote')}
                </p>
            </div>
        </div>
    );
}
