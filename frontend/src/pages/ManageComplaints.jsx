import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

const STATUS_OPTIONS = [
    '', 'Submitted', 'Under Review', 'Pending Approval',
    'Approved', 'Assigned', 'In Progress', 'Completed', 'Closed'
];

export default function ManageComplaints() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [complaints, setComplaints] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const [actionMsg, setActionMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const STATUS_KEYS = {
        'Submitted': 'statusSubmitted', 'Under Review': 'statusUnderReview',
        'Pending Approval': 'statusPendingApproval', 'Approved': 'statusApproved',
        'Assigned': 'statusAssigned', 'In Progress': 'statusInProgress',
        'Completed': 'statusCompleted', 'Closed': 'statusClosed'
    };

    const fetchComplaints = () => {
        setLoading(true);
        let url = '/complaints/';
        const params = new URLSearchParams();
        if (filterStatus) params.append('status', filterStatus);
        if (filterCategory) params.append('category', filterCategory);
        if (params.toString()) url += `?${params.toString()}`;

        api.get(url)
            .then(res => setComplaints(res.data))
            .catch(() => setErrorMsg('Failed to fetch complaints.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchComplaints();
        if (['Admin', 'Clerk'].includes(user.role)) {
            api.get('/admin/staff')
                .then(res => setStaffList(res.data.filter(s => s.role === 'Staff' && s.is_active)))
                .catch(() => { });
        }
    }, [filterStatus, filterCategory]);

    const handleUpdateStatus = async (complaintId, newStatus, remarks) => {
        setActionMsg(''); setErrorMsg('');
        try {
            await api.patch(`/complaints/${complaintId}/status`, { new_status: newStatus, remarks });
            setActionMsg(`Status for #${complaintId} updated successfully.`);
            fetchComplaints();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Update failed.');
        }
    };

    const handleAssign = async (complaintId, staffId, deadline) => {
        setActionMsg(''); setErrorMsg('');
        try {
            await api.post(`/assignments/${complaintId}`, { staff_id: staffId, deadline });
            setActionMsg(`Complaint #${complaintId} assigned successfully.`);
            fetchComplaints();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Assignment failed.');
        }
    };

    return (
        <main className="main-content container flex-col gap-lg">
            <div className="page-header">
                <h2 className="page-title">{t('manageComplaints')}</h2>
                <p className="page-desc">{t('manageDesc')}</p>
            </div>

            {/* Filters */}
            <div className="filter-bar">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label className="filter-label">{t('statusLabel')}</label>
                    <select className="form-control filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="">{t('all')}</option>
                        {STATUS_OPTIONS.slice(1).map(s => <option key={s} value={s}>{t(STATUS_KEYS[s]) || s}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <label className="filter-label">{t('categoryKeyword')}</label>
                    <input type="text" className="form-control" placeholder={t('search')}
                        value={filterCategory} onChange={e => setFilterCategory(e.target.value)} />
                </div>
            </div>

            {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
            {actionMsg && <div className="alert alert-success">{actionMsg}</div>}

            {loading ? (
                <p className="loading-text">{t('loadingComplaints')}</p>
            ) : complaints.length === 0 ? (
                <div className="empty-state"><p>{t('noComplaintsFoundTable')}</p></div>
            ) : (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('complaintId')}</th>
                                <th>{t('citizen')}</th>
                                <th>{t('category')}</th>
                                <th>{t('status')}</th>
                                <th>{t('filedOn')}</th>
                                <th>{t('action')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {complaints.map(c => (
                                <ExpandableRow key={c.complaint_id} complaint={c} role={user.role}
                                    staffList={staffList}
                                    onUpdate={handleUpdateStatus}
                                    onAssign={handleAssign}
                                    t={t} STATUS_KEYS={STATUS_KEYS} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}

function ExpandableRow({ complaint, role, staffList, onUpdate, onAssign, t, STATUS_KEYS }) {
    const [open, setOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [remarks, setRemarks] = useState('');
    const [staffId, setStaffId] = useState('');
    const [deadline, setDeadline] = useState('');

    const c = complaint;

    const allowedTransitions = useMemo(() => {
        const trans = {
            Admin: { 'Submitted': ['Under Review', 'Closed'], 'Under Review': ['Pending Approval', 'Closed'], 'Pending Approval': ['Approved', 'Closed'] },
            Clerk: { 'Submitted': ['Under Review'], 'Under Review': ['Pending Approval'] }
        };
        return trans[role]?.[c.status] || [];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [c.status, role]);

    const canAssign = ['Admin', 'Clerk'].includes(role) && c.status === 'Approved';

    return (
        <>
            <tr>
                <td className="mono">#{c.complaint_id}</td>
                <td>
                    <div className="text-strong">{c.citizen_name}</div>
                    <div className="text-muted text-xs">{c.citizen_phone}</div>
                </td>
                <td>{c.category}</td>
                <td><span className="status-badge">{t(STATUS_KEYS[c.status]) || c.status}</span></td>
                <td>{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                <td>
                    <button className={`btn ${open ? 'btn-outline' : 'btn-primary'} btn-xs`} onClick={() => setOpen(!open)}>
                        {open ? '✕' : t('manage')}
                    </button>
                    &nbsp;
                    <Link to={`/track/${c.complaint_id}`} className="btn btn-outline btn-xs">{t('trackArrow')}</Link>
                </td>
            </tr>
            {open && (
                <tr className="row-expanded">
                    <td colSpan={6}>
                        <div className="expanded-content">
                            <div className="expanded-details">
                                <p><strong>{t('location')}:</strong> {c.location_text}</p>
                                <p><strong>{t('description')}:</strong> {c.description}</p>
                                <p><strong>{t('priority')}:</strong> <span className={`priority-badge priority-${c.priority?.toLowerCase()}`}>{t('pri' + c.priority)}</span></p>
                            </div>

                            <div className="expanded-actions">
                                {allowedTransitions.length > 0 && (
                                    <div className="action-box">
                                        <h4>{t('updateStatus')}</h4>
                                        <div className="form-group">
                                            <label className="form-label">{t('newStatusLabel')}</label>
                                            <select className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                                                <option value="">{t('selectOption')}</option>
                                                {allowedTransitions.map(s => <option key={s} value={s}>{t(STATUS_KEYS[s]) || s}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('remarks')}</label>
                                            <input type="text" className="form-control" maxLength={250} placeholder={t('remarksPlaceholder')}
                                                value={remarks} onChange={e => setRemarks(e.target.value)} />
                                        </div>
                                        <button className="btn btn-primary btn-sm" disabled={!newStatus}
                                            onClick={() => { onUpdate(c.complaint_id, newStatus, remarks); setOpen(false); }}>
                                            {t('updateStatusBtn')}
                                        </button>
                                    </div>
                                )}

                                {canAssign && (
                                    <div className="action-box">
                                        <h4>{t('assignStaff')}</h4>
                                        <div className="form-group">
                                            <label className="form-label">{t('selectStaff')}</label>
                                            <select className="form-control" value={staffId} onChange={e => setStaffId(e.target.value)}>
                                                <option value="">{t('selectStaffOption')}</option>
                                                {staffList.map(s => <option key={s.user_id} value={s.user_id}>{s.full_name} (#{s.user_id})</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">{t('resolutionDeadline')}</label>
                                            <input type="date" className="form-control"
                                                value={deadline} onChange={e => setDeadline(e.target.value)}
                                                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} />
                                        </div>
                                        <button className="btn btn-primary btn-sm" disabled={!staffId || !deadline}
                                            onClick={() => { onAssign(c.complaint_id, staffId, deadline); setOpen(false); }}>
                                            {t('assignNotify')}
                                        </button>
                                    </div>
                                )}

                                {allowedTransitions.length === 0 && !canAssign && (
                                    <p className="text-muted text-sm">{t('noActions')}</p>
                                )}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
