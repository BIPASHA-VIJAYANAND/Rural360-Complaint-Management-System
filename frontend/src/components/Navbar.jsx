import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
    const { user } = useAuth();
    const { t } = useLanguage();
    if (!user) return null;

    const isAdmin = ['Admin', 'Clerk'].includes(user.role);
    const isStaff = user.role === 'Staff';
    const isCitizen = user.role === 'Citizen';

    return (
        <nav className="site-nav" aria-label="Main Navigation">
            <div className="container nav-inner">
                <ul className="nav-list">
                    {isCitizen && (
                        <>
                            <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t('navDashboard')}</NavLink></li>
                            <li><NavLink to="/submit-complaint" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t('navSubmitComplaint')}</NavLink></li>
                            <li><NavLink to="/my-complaints" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t('navMyComplaints')}</NavLink></li>
                        </>
                    )}
                    {isStaff && (
                        <>
                            <li><NavLink to="/staff-panel" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t('navMyTasks')}</NavLink></li>
                            <li><NavLink to="/my-complaints" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t('navViewComplaints')}</NavLink></li>
                        </>
                    )}
                    {isAdmin && (
                        <>
                            <li><NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t('navDashboard')}</NavLink></li>
                            <li><NavLink to="/manage-complaints" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t('navManageComplaints')}</NavLink></li>
                            <li><NavLink to="/staff-panel" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t('navStaffPanel')}</NavLink></li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
}
