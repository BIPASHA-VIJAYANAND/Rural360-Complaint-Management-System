import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

export default function StaffPanel() {
    const { t } = useLanguage();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMsg, setActionMsg] = useState('');

    const STATUS_KEYS = {
        'Submitted': 'statusSubmitted', 'Under Review': 'statusUnderReview',
        'Pending Approval': 'statusPendingApproval', 'Approved': 'statusApproved',
        'Assigned': 'statusAssigned', 'In Progress': 'statusInProgress',
        'Completed': 'statusCompleted', 'Closed': 'statusClosed'
    };

    const fetchAssignments = () => {
        setLoading(true);
        api.get('/assignments/')
            .then(res => setAssignments(res.data))
            .catch(() => setError('Failed to load assignments.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchAssignments(); }, []);

    const updateStatus = async (complaintId, newStatus) => {
        setActionMsg('');
        try {
            await api.patch(`/complaints/${complaintId}/status`, { new_status: newStatus });
            setActionMsg(`Status updated to "${newStatus}".`);
            fetchAssignments();
        } catch (err) {
            setActionMsg(err.response?.data?.error || 'Update failed.');
        }
    };

    const getNextStatus = (current) => {
        if (current === 'Assigned') return 'In Progress';
        if (current === 'In Progress') return 'Completed';
        return null;
    };

    const today = new Date();

    return (
        <main className="main-content container">
            <div className="page-header">
                <h2 className="page-title">{t('staffTaskPanel')}</h2>
                <p className="page-desc">{t('staffPanelDesc')}</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {actionMsg && <div className="alert alert-info">{actionMsg}</div>}

            {loading && <p className="loading-text">{t('loadingAssignments')}</p>}

            {!loading && assignments.length === 0 && (
                <div className="empty-state"><p>{t('noTasks')}</p></div>
            )}

            {!loading && assignments.length > 0 && (
                <div className="table-wrapper">
                    <table className="data-table" aria-label="Staff Assignments">
                        <thead>
                            <tr>
                                <th>{t('complaintId')}</th>
                                <th>{t('category')}</th>
                                <th>{t('location')}</th>
                                <th>{t('priority')}</th>
                                <th>{t('progressStatus')}</th>
                                <th>{t('deadline')}</th>
                                <th>{t('deadlineStatus')}</th>
                                <th>{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map(a => {
                                const dl = new Date(a.deadline);
                                const status = a.complaint_status || a.progress_status;
                                const overdue = dl < today && status !== 'Completed' && status !== 'Closed';
                                const next = getNextStatus(status);
                                return (
                                    <tr key={a.assignment_id} className={overdue ? 'row-overdue' : ''}>
                                        <td className="mono">#{a.complaint_id}</td>
                                        <td>{a.category}</td>
                                        <td>{a.location_text}</td>
                                        <td><span className={`priority-badge priority-${a.priority?.toLowerCase()}`}>{t('pri'+a.priority)}</span></td>
                                        <td><span className="status-badge">{t(STATUS_KEYS[status]) || status}</span></td>
                                        <td>{dl.toLocaleDateString('en-IN')}</td>
                                        <td>
                                            {status === 'Completed' || status === 'Closed' ? (
                                                <span className="muted">{t('done')}</span>
                                            ) : overdue ? (
                                                <span className="overdue-label">{t('overdue')}</span>
                                            ) : (
                                                <span className="ontrack-label">{t('onTrack')}</span>
                                            )}
                                        </td>
                                        <td>
                                            {next ? (
                                                <button className="btn btn-primary btn-xs"
                                                    onClick={() => updateStatus(a.complaint_id, next)}>
                                                    {t('mark')} {t(STATUS_KEYS[next]) || next}
                                                </button>
                                            ) : (
                                                <span className="muted">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
