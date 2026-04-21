import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

const ALL_STAGES = [
    'Submitted', 'Under Review', 'Pending Approval',
    'Approved', 'Assigned', 'In Progress', 'Completed', 'Closed'
];

export default function TrackComplaint() {
    const { id } = useParams();
    const { user } = useAuth();
    const { t } = useLanguage();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Feedback state
    const [feedback, setFeedback] = useState({ rating: 5, comments: '' });
    const [fbMsg, setFbMsg] = useState('');
    const [fbError, setFbError] = useState('');
    const [fbLoading, setFbLoading] = useState(false);
    const [fbExists, setFbExists] = useState(false);

    // Image lightbox
    const [lightboxImg, setLightboxImg] = useState(null);

    useEffect(() => {
        api.get(`/complaints/${id}`)
            .then(res => {
                setData(res.data);
                // Check existing feedback
                if (['Completed', 'Closed'].includes(res.data.status) && user?.role === 'Citizen') {
                    api.get(`/feedback/${id}`)
                        .then(() => setFbExists(true))
                        .catch(() => { });
                }
            })
            .catch(() => setError('Complaint not found or access denied.'))
            .finally(() => setLoading(false));
    }, [id]);

    const submitFeedback = async (e) => {
        e.preventDefault();
        setFbError(''); setFbLoading(true);
        try {
            await api.post(`/feedback/${id}`, feedback);
            setFbMsg('Feedback submitted. Thank you.');
            setFbExists(true);
        } catch (err) {
            setFbError(err.response?.data?.error || 'Feedback submission failed.');
        } finally { setFbLoading(false); }
    };

    const currentStageIdx = data ? ALL_STAGES.indexOf(data.status) : -1;

    if (loading) return <main className="main-content container"><p className="loading-text">{t('loading')}</p></main>;
    if (error) return <main className="main-content container"><div className="alert alert-error">{error}</div></main>;

    return (
        <main className="main-content container">
            <div className="page-header">
                <h2 className="page-title">{t('complaintTracking')} — #{data.complaint_id}</h2>
                <Link to="/my-complaints" className="btn btn-outline btn-sm">{t('backToList')}</Link>
            </div>

            {/* Complaint Details */}
            <div className="detail-card">
                <h3 className="detail-card-title">{t('complaintInfo')}</h3>
                <table className="detail-table">
                    <tbody>
                        <tr><th>{t('complaintId')}</th><td className="mono">#{data.complaint_id}</td></tr>
                        <tr><th>{t('category')}</th><td>{data.category}</td></tr>
                        <tr><th>{t('location')}</th><td>{data.location_text}</td></tr>
                        <tr><th>{t('priority')}</th><td><span className={`priority-badge priority-${data.priority?.toLowerCase()}`}>{data.priority}</span></td></tr>
                        <tr><th>{t('currentStatus')}</th><td><span className="status-badge status-progress">{data.status}</span></td></tr>
                        <tr><th>{t('filedOn')}</th><td>{new Date(data.created_at).toLocaleString('en-IN')}</td></tr>
                        <tr><th>{t('lastUpdated')}</th><td>{new Date(data.updated_at).toLocaleString('en-IN')}</td></tr>
                        <tr><th>{t('description')}</th><td>{data.description}</td></tr>
                    </tbody>
                </table>
            </div>

            {/* Attached Images */}
            {data.images && data.images.length > 0 && (
                <div className="detail-card">
                    <h3 className="detail-card-title">{t('attachImages')} ({data.images.length})</h3>
                    <div className="complaint-images-grid">
                        {data.images.map((img, idx) => (
                            <div key={img.image_id || idx} className="complaint-image-item">
                                <img
                                    src={img.url}
                                    alt={img.original_name}
                                    className="complaint-image-thumb"
                                    onClick={() => setLightboxImg(img)}
                                />
                                <span className="complaint-image-name">{img.original_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lightbox */}
            {lightboxImg && (
                <div className="modal-overlay" onClick={() => setLightboxImg(null)}>
                    <div className="lightbox-box" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setLightboxImg(null)}>✕</button>
                        <img src={lightboxImg.url} alt={lightboxImg.original_name} className="lightbox-img" />
                        <p className="lightbox-caption">{lightboxImg.original_name}</p>
                    </div>
                </div>
            )}

            {/* Progress Timeline */}
            <div className="detail-card">
                <h3 className="detail-card-title">{t('progressTracker')}</h3>
                <div className="timeline-stages">
                    {ALL_STAGES.map((stage, idx) => {
                        const done = idx < currentStageIdx;
                        const current = idx === currentStageIdx;
                        const pending = idx > currentStageIdx;
                        return (
                            <div key={stage} className={`stage-item ${done ? 'stage-done' : ''} ${current ? 'stage-current' : ''} ${pending ? 'stage-pending' : ''}`}>
                                <div className="stage-dot">
                                    {done ? '✓' : idx + 1}
                                </div>
                                <div className="stage-label">{stage}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Status History */}
            <div className="detail-card">
                <h3 className="detail-card-title">{t('statusHistory')}</h3>
                {(!data.history || data.history.length === 0) && <p className="empty-note">{t('noHistory')}</p>}
                {data.history && data.history.length > 0 && (
                    <ol className="activity-log">
                        {data.history.map((h, i) => (
                            <li key={i} className="activity-item">
                                <div className="activity-dot"></div>
                                <div className="activity-body">
                                    <span className="activity-status">
                                        {h.old_status ? `${h.old_status} → ${h.new_status}` : h.new_status}
                                    </span>
                                    <span className="activity-by">by {h.changed_by_name}</span>
                                    <span className="activity-time">{new Date(h.changed_at).toLocaleString('en-IN')}</span>
                                    {h.remarks && <span className="activity-remark">Remark: {h.remarks}</span>}
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </div>

            {/* Feedback Form */}
            {user?.role === 'Citizen' && ['Completed', 'Closed'].includes(data.status) && !fbExists && (
                <div className="detail-card">
                    <h3 className="detail-card-title">{t('submitFeedback')}</h3>
                    {fbMsg && <div className="alert alert-success">{fbMsg}</div>}
                    {fbError && <div className="alert alert-error">{fbError}</div>}
                    <form onSubmit={submitFeedback}>
                        <div className="form-group">
                            <label htmlFor="rating" className="form-label">{t('satisfactionRating')}</label>
                            <select id="rating" className="form-control" style={{ maxWidth: '160px' }}
                                value={feedback.rating}
                                onChange={e => setFeedback({ ...feedback, rating: parseInt(e.target.value) })}>
                                {[5, 4, 3, 2, 1].map(r => (
                                    <option key={r} value={r}>
                                        {r} — {[
                                            '', t('ratingPoor'), t('ratingBelowAvg'),
                                            t('ratingAverage'), t('ratingGood'), t('ratingExcellent')
                                        ][r]}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="fb-comments" className="form-label">{t('commentsOptional')}</label>
                            <textarea id="fb-comments" rows={3} maxLength={1000} className="form-control"
                                placeholder={t('commentsPlaceholder')}
                                value={feedback.comments}
                                onChange={e => setFeedback({ ...feedback, comments: e.target.value })} />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={fbLoading}>
                            {fbLoading ? t('submittingFeedback') : t('submitFeedbackBtn')}
                        </button>
                    </form>
                </div>
            )}

            {fbExists && (
                <div className="alert alert-info">{t('feedbackAlready')}</div>
            )}
        </main>
    );
}
