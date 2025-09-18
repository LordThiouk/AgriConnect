import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import ProducersPage from './pages/Producers';
import TermsPage from './pages/Terms';
import PrivacyPage from './pages/Privacy';
import ResetPasswordPage from './pages/ResetPassword';
import UserRoleDebug from './components/UserRoleDebug';
import PaginationTest from './components/test/PaginationTest';
import SupabaseTest from './components/test/SupabaseTest';
import TestSupabase from './pages/TestSupabase';
import DataSeeder from './components/test/DataSeeder';
import CampaignsPage from './pages/Campaigns';
import CooperativesPage from './pages/cooperatives';
import Debug from './pages/Debug';
import './App.css';

function App() {
  console.log('🔍 App component loaded');
  
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="App">
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            
            {/* Routes protégées */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/producers" 
              element={
                <ProtectedRoute>
                  <ProducersPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/campaigns" 
              element={
                <ProtectedRoute>
                  <CampaignsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cooperatives" 
              element={
                <ProtectedRoute>
                  <CooperativesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/test-pagination" 
              element={
                <ProtectedRoute>
                  <PaginationTest />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/test-supabase" 
              element={
                <ProtectedRoute>
                  <SupabaseTest />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/test-supabase-connection" 
              element={
                <ProtectedRoute>
                  <TestSupabase />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/seed-data" 
              element={
                <ProtectedRoute>
                  <DataSeeder />
                </ProtectedRoute>
              } 
            />
            
            {/* Route de debug simple */}
            <Route 
              path="/debug"
              element={<Debug />}
            />
            
            
            {/* Route de debug (accessible même sans permissions web) */}
            <Route 
              path="/debug-role" 
              element={
                <ProtectedRoute allowDebugAccess={true}>
                  <UserRoleDebug />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirection par défaut */}
            <Route path="/" element={<Navigate to="/debug" replace />} />
            <Route path="*" element={<Navigate to="/debug" replace />} />
          </Routes>
        </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
