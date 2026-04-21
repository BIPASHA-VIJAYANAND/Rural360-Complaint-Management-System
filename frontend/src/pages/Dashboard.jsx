import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

export default function Dashboard() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/complaints/')
            .then(res => setComplaints(res.data))
            .catch(() => setError('Failed to load complaints.'))
            .finally(() => setLoading(false));
    }, []);

    const statusClass = (status) => {
        const map = {
            'Submitted': 'status-submitted', 'Under Review': 'status-review',
            'Pending Approval': 'status-pending', 'Approved': 'status-approved',
            'Assigned': 'status-assigned', 'In Progress': 'status-progress',
            'Completed': 'status-completed', 'Closed': 'status-closed'
        };
        return 'status-badge ' + (map[status] || '');
    };

    return (
        <main className="main-content container">
            <div className="page-header">
                <h2 className="page-title">{t('citizenDashboard')}</h2>
                <p className="page-desc">{t('welcomeMsg')} <strong>{user?.full_name}</strong>. {t('dashboardDesc')}</p>
            </div>

            <div className="info-banner">
                <strong>{t('notice')}:</strong> {t('noticeText')}
            </div>

            <div className="action-bar">
                <Link to="/submit-complaint" className="btn btn-primary">{t('submitNewGrievance')}</Link>
                <Link to="/my-complaints" className="btn btn-outline">{t('viewAllComplaints')}</Link>
            </div>

            <section className="card-section">
                <h3 className="section-title">{t('recentComplaints')}</h3>

                {loading && <p className="loading-text">{t('loading')}</p>}
                {error && <div className="alert alert-error">{error}</div>}

                {!loading && complaints.length === 0 && (
                    <div className="empty-state">
                        <p>{t('noComplaintsFiled')}</p>
                        <Link to="/submit-complaint" className="text-link">{t('fileFirstComplaint')}</Link>
                    </div>
                )}

                {!loading && complaints.length > 0 && (
                    <table className="data-table" aria-label="Recent Complaints">
                        <thead>
                            <tr>
                                <th>{t('complaintId')}</th>
                                <th>{t('category')}</th>
                                <th>{t('location')}</th>
                                <th>{t('priority')}</th>
                                <th>{t('status')}</th>
                                <th>{t('filedOn')}</th>
                                <th>{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.slice(0, 5).map(c => (
                                <tr key={c.complaint_id}>
                                    <td className="mono">#{c.complaint_id}</td>
                                    <td>{c.category}</td>
                                    <td>{c.location_text}</td>
                                    <td><span className={`priority-badge priority-${c.priority?.toLowerCase()}`}>{c.priority}</span></td>
                                    <td><span className={statusClass(c.status)}>{c.status}</span></td>
                                    <td>{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                                    <td><Link to={`/track/${c.complaint_id}`} className="table-link">{t('track')}</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </main>
    );
}
