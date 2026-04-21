import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { t as translate, SUPPORTED_LANGUAGES } from '../i18n/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => {
        return localStorage.getItem('panchayat_lang') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('panchayat_lang', lang);
        document.documentElement.lang = lang;
    }, [lang]);

    const t = useCallback((key) => translate(lang, key), [lang]);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t, SUPPORTED_LANGUAGES }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
