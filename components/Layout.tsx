import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { 
  LayoutDashboard, Users, Receipt, Settings, 
  LogOut, Menu, X, FileText 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const NavItem = ({ id, icon: Icon, label, roles }: any) => {
    if (roles && !roles.includes(user?.role)) return null;
    const isActive = activePage === id;
    return (
      <button
        onClick={() => {
          onNavigate(id);
          setSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive 
            ? 'bg-primary text-white shadow-md' 
            : 'text-text-secondary hover:bg-background-light hover:text-primary dark:hover:bg-gray-800 dark:text-gray-400'
        }`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        <span className={`font-medium ${isActive ? 'font-semibold' : ''}`}>{label}</span>
      </button>
    );
  };

  // Dashboard uses a full-width custom design
  const isDashboard = activePage === 'dashboard';

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex font-display">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-border-color transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="p-8 border-b border-border-color flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2 tracking-tight">
            <span className="material-symbols-outlined text-3xl">school</span> FeeManager
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-text-secondary hover:text-primary">
            <X />
          </button>
        </div>

        <nav className="p-6 space-y-2">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem 
            id="students" 
            icon={Users} 
            label="Students" 
            roles={['admin', 'accountant', 'teacher']} 
          />
          <NavItem 
            id="payments" 
            icon={Receipt} 
            label="Fees & Payments" 
            roles={['admin', 'accountant', 'parent']} 
          />
          <NavItem 
            id="reports" 
            icon={FileText} 
            label="Reports" 
            roles={['admin', 'accountant']} 
          />
          <NavItem 
            id="admin" 
            icon={Settings} 
            label="Administration" 
            roles={['admin']} 
          />
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-border-color bg-white dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                {user?.name?.charAt(0)}
            </div>
            <div>
                <p className="text-sm font-bold text-text-main dark:text-white">{user?.name}</p>
                <p className="text-xs text-text-secondary capitalize">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen bg-background-light dark:bg-background-dark relative">
        {/* Mobile Header - Hide on dashboard to let dashboard's own header take over */}
        {!isDashboard && (
          <header className="bg-white dark:bg-gray-900 border-b border-border-color p-4 md:hidden flex items-center justify-between sticky top-0 z-40">
            <button onClick={() => setSidebarOpen(true)} className="text-text-main dark:text-white">
              <Menu />
            </button>
            <span className="font-semibold text-text-main dark:text-white capitalize">{activePage}</span>
            <div className="w-6"></div>
          </header>
        )}
        
        {/* Conditionally remove padding for full-width pages like Dashboard */}
        <div className={`mx-auto h-full ${isDashboard ? '' : 'p-4 md:p-8 max-w-7xl space-y-6'}`}>
          {children}
        </div>
      </main>
    </div>
  );
};