import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Folder, CheckSquare, User, LogOut, Users, Moon, Sun, ListTodo } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Notifications from './Notifications';

export default function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/projects', icon: Folder, label: 'Projects' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/team', icon: Users, label: 'Team Members', adminOnly: true },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
            <ListTodo size={20} />
          </div>
          <span className="text-lg font-semibold tracking-tight">TaskManager</span>
        </div>
        <button onClick={toggleTheme} className="p-2 text-muted hover:text-foreground transition-colors" title="Toggle Theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
      <nav className="flex-1 px-4 mt-6 space-y-1">
        <ul>
          {links.filter(link => !link.adminOnly || user?.role === 'Admin').map(link => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.to);
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-muted hover:bg-border'
                  }`}
                >
                  <Icon size={16} />
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 mt-auto border-t border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-xs font-semibold text-foreground truncate">{user?.name}</span>
          <span className="text-[10px] text-emerald-500 font-bold uppercase">{user?.role}</span>
        </div>
        <div className="flex items-center gap-1">
          <Notifications />
          <button
            onClick={logout}
            className="p-2 text-muted hover:bg-border hover:text-foreground rounded-md transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
