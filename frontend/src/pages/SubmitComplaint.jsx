import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

const CATEGORIES = [
    'Road & Infrastructure', 'Water Supply', 'Sanitation & Drainage',
    'Electricity', 'Public Health', 'Education', 'Agriculture Support',
    'Social Welfare', 'Revenue / Land Records', 'Other'
];

const CATEGORY_KEYS = [
    'catRoad', 'catWater', 'catSanitation',
    'catElectricity', 'catHealth', 'catEducation', 'catAgriculture',
    'catWelfare', 'catRevenue', 'catOther'
];

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function SubmitComplaint() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        category: '', description: '', location_text: '', priority: 'Normal'
    });
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const currentTotal = images.length;
        const allowed = MAX_IMAGES - currentTotal;

        if (files.length > allowed) {
            setError(`You can upload a maximum of ${MAX_IMAGES} images. You already have ${currentTotal} selected.`);
            return;
        }

        const validFiles = [];
        const newPreviews = [];

        for (const file of files) {
            if (file.size > MAX_FILE_SIZE) {
                setError(`File "${file.name}" exceeds 5MB limit.`);
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
                setError(`File "${file.name}" is not a supported image format (JPG, PNG, WebP).`);
                return;
            }
            validFiles.push(file);
            newPreviews.push(URL.createObjectURL(file));
        }

        setError('');
        setImages(prev => [...prev, ...validFiles]);
        setPreviews(prev => [...prev, ...newPreviews]);

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (idx) => {
        URL.revokeObjectURL(previews[idx]);
        setImages(prev => prev.filter((_, i) => i !== idx));
        setPreviews(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.description.length < 20) {
            setError('Description must be at least 20 characters.'); return;
        }
        setError(''); setLoading(true);
        try {
            // Step 1: Submit the complaint
            const res = await api.post('/complaints/', form);
            const complaintId = res.data.complaint_id;

            // Step 2: Upload images if any
            if (images.length > 0) {
                const formData = new FormData();
                images.forEach(file => formData.append('images', file));

                await api.post(`/complaints/${complaintId}/images`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            setSuccess(`${t('complaintId')} #${complaintId} - ${t('submitGrievanceBtn')} ✓`);
            setTimeout(() => navigate('/my-complaints'), 2000);
        } catch (err) {
            const msgs = err.response?.data?.errors || err.response?.data?.error;
            setError(typeof msgs === 'object' ? JSON.stringify(msgs) : msgs || 'Submission failed.');
        } finally { setLoading(false); }
    };

    return (
        <main className="main-content container">
            <div className="page-header">
                <h2 className="page-title">{t('submitGrievance')}</h2>
                <p className="page-desc">{t('submitDesc')}</p>
            </div>

            {error && <div className="alert alert-error" role="alert">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="form-card">
                <form onSubmit={handleSubmit} noValidate>
                    <fieldset className="form-section">
                        <legend className="form-section-title">{t('grievanceDetails')}</legend>

                        <div className="form-row-2">
                            <div className="form-group">
                                <label htmlFor="category" className="form-label">{t('category')} <span className="req">*</span></label>
                                <select id="category" name="category" value={form.category}
                                    onChange={handleChange} className="form-control" required>
                                    <option value="">{t('selectCategory')}</option>
                                    {CATEGORIES.map((c, i) => (
                                        <option key={c} value={c}>{t(CATEGORY_KEYS[i])}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="priority" className="form-label">{t('priorityLevel')}</label>
                                <select id="priority" name="priority" value={form.priority}
                                    onChange={handleChange} className="form-control">
                                    <option value="Low">{t('priLow')}</option>
                                    <option value="Normal">{t('priNormal')}</option>
                                    <option value="High">{t('priHigh')}</option>
                                    <option value="Urgent">{t('priUrgent')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="location_text" className="form-label">{t('locationLabel')} <span className="req">*</span></label>
                            <input id="location_text" type="text" name="location_text" required
                                maxLength={300} placeholder={t('locationPlaceholder')}
                                value={form.location_text} onChange={handleChange} className="form-control" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description" className="form-label">
                                {t('description')} <span className="req">*</span>
                                <span className="field-hint">{t('descMinHint')}</span>
                            </label>
                            <textarea id="description" name="description" required
                                minLength={20} maxLength={2000} rows={6}
                                placeholder={t('descPlaceholder')}
                                value={form.description} onChange={handleChange} className="form-control" />
                            <small className="char-count">{form.description.length}/2000 {t('characters')}</small>
                        </div>
                    </fieldset>

                    {/* Image Upload Section */}
                    <fieldset className="form-section">
                        <legend className="form-section-title">{t('attachImages')}</legend>
                        <p className="field-hint" style={{ marginBottom: '12px', display: 'block' }}>
                            {t('attachImagesHint')}
                        </p>

                        <div className="image-upload-area">
                            <input
                                ref={fileInputRef}
                                type="file"
                                id="complaint-images"
                                accept="image/jpeg,image/png,image/jpg,image/webp"
                                multiple
                                onChange={handleImageChange}
                                className="file-input-hidden"
                            />
                            {images.length < MAX_IMAGES && (
                                <label htmlFor="complaint-images" className="image-upload-btn">
                                    <span className="upload-icon">📷</span>
                                    <span>{t('browseFiles')}</span>
                                    <span className="upload-hint">{images.length}/{MAX_IMAGES} {t('selectedFiles')}</span>
                                </label>
                            )}
                        </div>

                        {previews.length > 0 && (
                            <div className="image-preview-grid">
                                {previews.map((src, idx) => (
                                    <div key={idx} className="image-preview-item">
                                        <img src={src} alt={`Preview ${idx + 1}`} className="image-preview-img" />
                                        <button
                                            type="button"
                                            className="image-remove-btn"
                                            onClick={() => removeImage(idx)}
                                            aria-label="Remove image"
                                        >✕</button>
                                        <span className="image-preview-name">{images[idx]?.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </fieldset>

                    <div className="form-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? t('submitting') : t('submitGrievanceBtn')}
                        </button>
                        <button type="reset" className="btn btn-outline" onClick={() => {
                            setForm({ category: '', description: '', location_text: '', priority: 'Normal' });
                            setImages([]);
                            setPreviews([]);
                        }}>
                            {t('clearForm')}
                        </button>
                    </div>
                </form>
            </div>

            <div className="info-banner mt-md">
                <strong>{t('importantNotice')}</strong> {t('falseInfoWarning')}
            </div>
        </main>
    );
}
