import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

export default function MyComplaints() {
    const { t } = useLanguage();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const STATUS_OPTIONS = [
        '', 'Submitted', 'Under Review', 'Pending Approval',
        'Approved', 'Assigned', 'In Progress', 'Completed', 'Closed'
    ];

    const STATUS_KEYS = {
        'Submitted': 'statusSubmitted', 'Under Review': 'statusUnderReview',
        'Pending Approval': 'statusPendingApproval', 'Approved': 'statusApproved',
        'Assigned': 'statusAssigned', 'In Progress': 'statusInProgress',
        'Completed': 'statusCompleted', 'Closed': 'statusClosed'
    }

    const fetchComplaints = () => {
        setLoading(true);
        const params = statusFilter ? `?status=${statusFilter}` : '';
        api.get(`/complaints/${params}`)
            .then(res => setComplaints(res.data))
            .catch(() => setError('Failed to load complaints.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchComplaints(); }, [statusFilter]);

    const statusClass = (s) => {
        const m = {
            'Submitted': 'status-submitted', 'Under Review': 'status-review',
            'Pending Approval': 'status-pending', 'Approved': 'status-approved',
            'Assigned': 'status-assigned', 'In Progress': 'status-progress',
            'Completed': 'status-completed', 'Closed': 'status-closed'
        };
        return 'status-badge ' + (m[s] || '');
    };

    return (
        <main className="main-content container">
            <div className="page-header">
                <h2 className="page-title">{t('myComplaints')}</h2>
                <div className="page-header-actions">
                    <Link to="/submit-complaint" className="btn btn-primary btn-sm">{t('newComplaint')}</Link>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="filter-bar">
                <label htmlFor="status-filter" className="filter-label">{t('filterByStatus')}</label>
                <select id="status-filter" className="form-control filter-select"
                    value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">{t('all')}</option>
                    {STATUS_OPTIONS.slice(1).map(s => <option key={s} value={s}>{t(STATUS_KEYS[s]) || s}</option>)}
                </select>
            </div>

            {loading && <p className="loading-text">{t('loadingComplaints') || t('loading')}</p>}

            {!loading && complaints.length === 0 && (
                <div className="empty-state">
                    <p>{t('noComplaintsFound')} {statusFilter ? `${t('withStatus')} "${t(STATUS_KEYS[statusFilter]) || statusFilter}"` : ''}.</p>
                </div>
            )}

            {!loading && complaints.length > 0 && (
                <div className="table-wrapper">
                    <table className="data-table" aria-label="My Complaints">
                        <thead>
                            <tr>
                                <th>{t('complaintId')}</th>
                                <th>{t('category')}</th>
                                <th>{t('location')}</th>
                                <th>{t('priority')}</th>
                                <th>{t('status')}</th>
                                <th>{t('filedOn')}</th>
                                <th>{t('lastUpdated')}</th>
                                <th>{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.map(c => (
                                <tr key={c.complaint_id}>
                                    <td className="mono">#{c.complaint_id}</td>
                                    <td>{c.category}</td>
                                    <td>{c.location_text}</td>
                                    <td><span className={`priority-badge priority-${c.priority?.toLowerCase()}`}>{t('pri' + c.priority)}</span></td>
                                    <td><span className={statusClass(c.status)}>{t(STATUS_KEYS[c.status]) || c.status}</span></td>
                                    <td>{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                                    <td>{new Date(c.updated_at).toLocaleDateString('en-IN')}</td>
                                    <td>
                                        <Link to={`/track/${c.complaint_id}`} className="table-link">{t('trackArrow')}</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
