import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ChatDashboard from './pages/ChatDashboard';
import ChatHistoryPage from './pages/ChatHistoryPage';
import ProfilePage from './pages/ProfilePage';
import NLPAnalyticsPage from './pages/NLPAnalyticsPage';
import ModelPerformancePage from './pages/ModelPerformancePage';
import DatasetsPage from './pages/DatasetsPage';
import PredictAIPage from './pages/PredictAIPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SettingsPage from './pages/SettingsPage';

function MainApp() {
  const { isAuthenticated, isAdmin } = useAuth();
  
  // Default to landing page so the user immediately sees the rich platform
  const [activePage, setActivePage] = useState(() => {
    try {
      const hasToken = localStorage.getItem('neurochat_token');
      return hasToken ? 'chat' : 'landing';
    } catch {
      return 'landing';
    }
  });

  // Render Page with Safe Route Guarding
  const renderPage = () => {
    switch (activePage) {
      case 'landing':
        return <LandingPage setActivePage={setActivePage} />;
      case 'login':
        return <LoginPage setActivePage={setActivePage} />;
      case 'register':
        return <RegisterPage setActivePage={setActivePage} />;
      case 'forgot-password':
        return <ForgotPasswordPage setActivePage={setActivePage} />;
      case 'chat':
        return isAuthenticated ? <ChatDashboard /> : <LoginPage setActivePage={setActivePage} />;
      case 'history':
        return isAuthenticated ? <ChatHistoryPage setActivePage={setActivePage} /> : <LoginPage setActivePage={setActivePage} />;
      case 'profile':
        return isAuthenticated ? <ProfilePage /> : <LoginPage setActivePage={setActivePage} />;
      case 'nlp':
        return <NLPAnalyticsPage />;
      case 'models':
        return <ModelPerformancePage />;
      case 'datasets':
        return <DatasetsPage />;
      case 'predictai':
        return <PredictAIPage />;
      case 'admin':
        return isAdmin ? <AdminDashboardPage /> : <LandingPage setActivePage={setActivePage} />;
      case 'settings':
        return isAuthenticated ? <SettingsPage /> : <LoginPage setActivePage={setActivePage} />;
      default:
        return <LandingPage setActivePage={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#060B18] text-slate-100 flex flex-col font-sans">
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1">
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
