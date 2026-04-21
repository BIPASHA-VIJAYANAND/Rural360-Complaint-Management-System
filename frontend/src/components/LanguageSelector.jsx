import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector() {
    const { lang, setLang, SUPPORTED_LANGUAGES } = useLanguage();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === lang);

    return (
        <div className="lang-selector" ref={ref}>
            <button
                className="lang-toggle"
                onClick={() => setOpen(!open)}
                aria-label="Select Language"
                id="language-selector-btn"
            >
                <span className="lang-icon">🌐</span>
                <span className="lang-current">{currentLang?.name || 'English'}</span>
                <span className="lang-caret">{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div className="lang-dropdown">
                    {SUPPORTED_LANGUAGES.map(l => (
                        <button
                            key={l.code}
                            className={`lang-option ${l.code === lang ? 'active' : ''}`}
                            onClick={() => { setLang(l.code); setOpen(false); }}
                        >
                            {l.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
