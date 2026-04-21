/**
 * Multi-lingual translations for the Panchayat Grievance Redressal Portal (Mobile).
 * Ported from Web Application.
 */

const translations = {
  en: {
    langName: 'English',
    govOfIndia: 'Government of India',
    portalTitle: 'Gram Panchayat Grievance Redressal Portal',
    portalSubtitle: 'Smart City Initiative',
    signOut: 'Sign Out',
    selectLoginType: 'Select Login Type',
    citizenLogin: 'Citizen Login',
    citizenLoginDesc: 'File and track grievances with your local Panchayat',
    adminLogin: 'Admin / Staff Login',
    adminLoginDesc: 'Manage, review and resolve complaints',
    loginTitle: 'Sign In',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    signIn: 'Sign In',
    forgotPassword: 'Forgot Password?',
    newRegistration: 'New Registration',
    citizenDashboard: 'Citizen Dashboard',
    submitNewGrievance: '+ Submit New Grievance',
    myComplaints: 'My Complaints',
    trackComplaint: 'Track Complaint',
    status: 'Status',
    category: 'Category',
    filedOn: 'Filed On',
    loading: 'Loading...',
    error: 'An error occurred',
  },
  hi: {
    langName: 'हिन्दी',
    govOfIndia: 'भारत सरकार',
    portalTitle: 'ग्राम पंचायत शिकायत निवारण पोर्टल',
    portalSubtitle: 'स्मार्ट सिटी पहल',
    signOut: 'लॉग आउट',
    selectLoginType: 'लॉगिन प्रकार चुनें',
    citizenLogin: 'नागरिक लॉगिन',
    citizenLoginDesc: 'अपनी स्थानीय पंचायत में शिकायत दर्ज करें और ट्रैक करें',
    adminLogin: 'प्रशासक / कर्मचारी लॉगिन',
    adminLoginDesc: 'शिकायतों की समीक्षा, प्रबंधन और समाधान करें',
    loginTitle: 'साइन इन करें',
    emailLabel: 'ईमेल पता',
    passwordLabel: 'पासवर्ड',
    signIn: 'साइन इन',
    forgotPassword: 'पासवर्ड भूल गए?',
    newRegistration: 'नया पंजीकरण',
    citizenDashboard: 'नागरिक डैशबोर्ड',
    submitNewGrievance: '+ नई शिकायत दर्ज करें',
    myComplaints: 'मेरी शिकायतें',
    trackComplaint: 'शिकायत ट्रैक करें',
    status: 'स्थिति',
    category: 'श्रेणी',
    filedOn: 'दर्ज तिथि',
    loading: 'लोड हो रहा है...',
    error: 'एक त्रुटि हुई',
  }
};

export const t = (lang, key) => {
  const langData = translations[lang] || translations.en;
  return langData[key] || translations.en[key] || key;
};

export default translations;
