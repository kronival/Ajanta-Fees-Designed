import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './components/Auth';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Payments } from './pages/Payments';
import { Reports } from './pages/Reports';
import { Admin } from './pages/Admin';
import { ToastProvider } from './components/ToastContext';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [paymentStudentId, setPaymentStudentId] = useState<string | null>(null);

  if (!user) return <Login />;

  const handleNavigate = (page: string, studentId?: string) => {
    setCurrentPage(page);
    setPaymentStudentId(studentId || null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'students': return <Students onNavigate={handleNavigate} />;
      case 'payments': return <Payments initialStudentId={paymentStudentId} />;
      case 'reports': return <Reports />;
      case 'admin': return <Admin />;
      default: return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout activePage={currentPage} onNavigate={(page) => handleNavigate(page)}>
      {renderPage()}
    </Layout>
  );
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;