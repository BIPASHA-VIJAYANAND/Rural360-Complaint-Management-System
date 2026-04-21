import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from './LanguageSelector';

export default function Header() {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="site-header">
            <div className="header-inner container">
                <div className="header-brand">
                    <div className="header-emblem" aria-hidden="true">
                        <span className="emblem-icon">⚙</span>
                    </div>
                    <div className="header-titles">
                        <p className="header-supertitle">{t('govOfIndia')}</p>
                        <h1 className="header-title">{t('portalTitle')}</h1>
                        <p className="header-subtitle">{t('portalSubtitle')}</p>
                    </div>
                </div>
                <div className="header-right">
                    {user && (
                        <LanguageSelector />
                    )}
                    {user && (
                        <div className="header-user">
                            <span className="user-info">
                                <strong>{user.full_name}</strong>
                                <span className="user-role-badge">{user.role}</span>
                            </span>
                            <button className="btn btn-outline-sm" onClick={handleLogout}>
                                {t('signOut')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
