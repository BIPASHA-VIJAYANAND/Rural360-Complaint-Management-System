import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import LoginSelector from './pages/LoginSelector';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import SubmitComplaint from './pages/SubmitComplaint';
import MyComplaints from './pages/MyComplaints';
import TrackComplaint from './pages/TrackComplaint';
import AdminDashboard from './pages/AdminDashboard';
import ManageComplaints from './pages/ManageComplaints';
import StaffPanel from './pages/StaffPanel';

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <Header />
      <Navbar />
      <Routes>
        {/* Public — Login Selector */}
        <Route path="/" element={!user ? <LoginSelector /> : <Navigate to="/dashboard" />} />
        <Route path="/login/:mode" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        {/* Legacy login route redirects to selector */}
        <Route path="/login" element={!user ? <Navigate to="/" /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Citizen */}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['Citizen']}><Dashboard /></ProtectedRoute>} />
        <Route path="/submit-complaint" element={<ProtectedRoute allowedRoles={['Citizen']}><SubmitComplaint /></ProtectedRoute>} />
        <Route path="/my-complaints" element={<ProtectedRoute allowedRoles={['Citizen']}><MyComplaints /></ProtectedRoute>} />
        <Route path="/track/:id" element={<ProtectedRoute><TrackComplaint /></ProtectedRoute>} />

        {/* Admin / Clerk */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin', 'Clerk']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/manage-complaints" element={<ProtectedRoute allowedRoles={['Admin', 'Clerk']}><ManageComplaints /></ProtectedRoute>} />

        {/* Staff */}
        <Route path="/staff-panel" element={<ProtectedRoute allowedRoles={['Admin', 'Clerk', 'Staff']}><StaffPanel /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} />} />
      </Routes>
    </>
  );
}
