import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

export default function AdminDashboard() {
    const { t } = useLanguage();
    const [stats, setStats] = useState(null);
    const [catData, setCatData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [perf, setPerf] = useState([]);
    const [avgDays, setAvgDays] = useState(null);
    const [loading, setLoading] = useState(true);

    const STATUS_KEYS = {
        'Submitted': 'statusSubmitted', 'Under Review': 'statusUnderReview',
        'Pending Approval': 'statusPendingApproval', 'Approved': 'statusApproved',
        'Assigned': 'statusAssigned', 'In Progress': 'statusInProgress',
        'Completed': 'statusCompleted', 'Closed': 'statusClosed'
    };

    const CATEGORY_KEYS = {
        'Road & Infrastructure': 'catRoad', 'Water Supply': 'catWater', 'Sanitation & Drainage': 'catSanitation',
        'Electricity': 'catElectricity', 'Public Health': 'catHealth', 'Education': 'catEducation',
        'Agriculture Support': 'catAgriculture', 'Social Welfare': 'catWelfare',
        'Revenue / Land Records': 'catRevenue', 'Other': 'catOther'
    };


    useEffect(() => {
        Promise.all([
            api.get('/admin/stats'),
            api.get('/admin/category-breakdown'),
            api.get('/admin/status-breakdown'),
            api.get('/admin/staff-performance'),
            api.get('/admin/avg-resolution-time'),
        ]).then(([s, cat, st, pf, avg]) => {
            setStats(s.data);
            setCatData(cat.data);
            setStatusData(st.data);
            setPerf(pf.data);
            setAvgDays(avg.data.avg_resolution_days);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    if (loading) return <main className="main-content container"><p className="loading-text">{t('loading')}</p></main>;

    return (
        <main className="main-content container">
            <div className="page-header">
                <h2 className="page-title">{t('adminDashboard')}</h2>
                <p className="page-desc">{t('adminDashDesc')}</p>
            </div>

            {/* KPI Cards */}
            {stats && (
                <div className="kpi-grid">
                    <div className="kpi-card">
                        <div className="kpi-value">{stats.total_complaints}</div>
                        <div className="kpi-label">{t('totalComplaints')}</div>
                    </div>
                    <div className="kpi-card kpi-blue">
                        <div className="kpi-value">{stats.open_complaints}</div>
                        <div className="kpi-label">{t('openComplaints')}</div>
                    </div>
                    <div className="kpi-card kpi-green">
                        <div className="kpi-value">{stats.closed_complaints}</div>
                        <div className="kpi-label">{t('resolvedClosed')}</div>
                    </div>
                    <div className="kpi-card kpi-amber">
                        <div className="kpi-value">{stats.pending_approval}</div>
                        <div className="kpi-label">{t('pendingApproval')}</div>
                    </div>
                    <div className="kpi-card kpi-grey">
                        <div className="kpi-value">{avgDays ?? '—'}</div>
                        <div className="kpi-label">{t('avgResolution')}</div>
                    </div>
                </div>
            )}

            <div className="dashboard-grid-2">
                {/* Category Breakdown */}
                <div className="detail-card">
                    <h3 className="detail-card-title">{t('byCategory')}</h3>
                    <table className="data-table">
                        <thead>
                            <tr><th>{t('category')}</th><th>{t('count')}</th></tr>
                        </thead>
                        <tbody>
                            {catData.map(r => (
                                <tr key={r.category}>
                                    <td>{CATEGORY_KEYS[r.category] ? t(CATEGORY_KEYS[r.category]) : r.category}</td>
                                    <td><strong>{r.complaint_count}</strong></td>
                                </tr>
                            ))}
                            {catData.length === 0 && <tr><td colSpan={2} className="empty-note">{t('noData')}</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* Status Breakdown */}
                <div className="detail-card">
                    <h3 className="detail-card-title">{t('byStatus')}</h3>
                    <table className="data-table">
                        <thead>
                            <tr><th>{t('status')}</th><th>{t('count')}</th></tr>
                        </thead>
                        <tbody>
                            {statusData.map(r => (
                                <tr key={r.status}>
                                    <td><span className="status-badge">{t(STATUS_KEYS[r.status]) || r.status}</span></td>
                                    <td><strong>{r.count}</strong></td>
                                </tr>
                            ))}
                            {statusData.length === 0 && <tr><td colSpan={2} className="empty-note">{t('noData')}</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Staff Performance */}
            <div className="detail-card">
                <h3 className="detail-card-title">{t('staffPerformance')}</h3>
                <table className="data-table" aria-label="Staff Performance">
                    <thead>
                        <tr>
                            <th>{t('staffId')}</th>
                            <th>{t('name')}</th>
                            <th>{t('totalAssigned')}</th>
                            <th>{t('completed')}</th>
                            <th>{t('completionRate')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {perf.map(s => {
                            const rate = s.total_assigned > 0
                                ? Math.round((s.completed / s.total_assigned) * 100)
                                : 0;
                            return (
                                <tr key={s.user_id}>
                                    <td className="mono">#{s.user_id}</td>
                                    <td>{s.full_name}</td>
                                    <td>{s.total_assigned}</td>
                                    <td>{s.completed}</td>
                                    <td>
                                        <div className="progress-bar-wrap">
                                            <div className="progress-bar" style={{ width: `${rate}%` }} />
                                            <span className="progress-label">{rate}%</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {perf.length === 0 && <tr><td colSpan={5} className="empty-note">{t('noStaffRecords')}</td></tr>}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
