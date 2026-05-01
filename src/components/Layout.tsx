import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden select-none">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto p-8 relative">
        <div className="flex-1">
          <Outlet />
        </div>
        <footer className="mt-8 pt-4 border-t border-border flex items-center justify-center text-xs text-muted shrink-0">
          <span>Designed & Developed by Insha Quamar</span>
          <a href="https://got-theme-portfolio11.onrender.com" target="_blank" rel="noopener noreferrer" className="ml-2 flex items-center justify-center w-5 h-5 bg-emerald-500 text-white rounded font-bold text-[10px] hover:bg-emerald-600 transition-colors" title="Insha Quamar's Portfolio">
            iq
          </a>
        </footer>
      </main>
    </div>
  );
}
