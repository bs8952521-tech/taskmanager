import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bell, AlertTriangle, Trash2 } from 'lucide-react';

export default function Profile() {
  const { user, token, logout } = useAuth();
  const [notifyApproaching, setNotifyApproaching] = useState(true);
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/users/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifyApproaching(data.notifyApproaching);
        setNotifyOverdue(data.notifyOverdue);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    try {
      if (key === 'approaching') setNotifyApproaching(value);
      if (key === 'overdue') setNotifyOverdue(value);
      
      await fetch('/api/users/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notifyApproaching: key === 'approaching' ? value : notifyApproaching,
          notifyOverdue: key === 'overdue' ? value : notifyOverdue,
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        logout();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete account');
      }
    } catch (err) {
      alert('An error occurred');
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex-1 w-full space-y-6">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Profile</h1>
        <p className="text-muted mt-1 text-sm bg-transparent">Manage your personal information and preferences.</p>
      </header>

      <div className="bg-card rounded-xl p-8 border border-border flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
        <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg shrink-0">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-xs font-bold text-faint uppercase tracking-widest mb-1">Full Name</p>
            <p className="text-lg font-medium text-foreground">{user?.name}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-faint uppercase tracking-widest mb-1">Email Address</p>
            <p className="text-muted">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-faint uppercase tracking-widest mb-1">Role</p>
            <span className="inline-block px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded font-bold uppercase text-[10px]">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-8 border border-border space-y-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Notification Preferences</h2>
          <p className="text-muted mt-1 text-sm">Choose when you want to be notified about task status.</p>
        </div>

        {!loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-input border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500 border border-sky-500/20">
                  <Bell size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Approaching Deadlines</p>
                  <p className="text-xs text-muted">Get notified 24 hours before a task is due</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={notifyApproaching} onChange={(e) => updateSetting('approaching', e.target.checked)} />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-input border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Overdue Tasks</p>
                  <p className="text-xs text-muted">Get notified when a task passes its deadline</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={notifyOverdue} onChange={(e) => updateSetting('overdue', e.target.checked)} />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#161212] rounded-xl p-8 border border-rose-500/20 space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-rose-500">Danger Zone</h2>
          <p className="text-rose-400/70 mt-1 text-sm">Delete your account and all associated personal data.</p>
        </div>
        <div className="flex items-center justify-between p-4 bg-card border border-rose-500/10 rounded-lg">
           <div className="max-w-[70%]">
             <p className="text-sm font-medium text-foreground">Delete Account</p>
             <p className="text-xs text-muted mt-1">Once you delete your account, there is no going back. Please be certain.</p>
           </div>
           <button 
             onClick={() => setShowDeleteModal(true)}
             className="px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 rounded-md text-sm font-medium transition-colors focus:ring-2 focus:ring-rose-500 focus:outline-none flex items-center gap-2"
           >
             <Trash2 size={16} />
             Delete
           </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-xl w-full max-w-md border border-border shadow-2xl p-6">
            <h2 className="text-xl font-semibold tracking-tight text-foreground mb-2">Delete Account Confirmation</h2>
            <p className="text-sm text-muted mb-6">
              Are you sure you want to delete your account? This action is irreversible and will permanently delete your personal information and settings.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-muted hover:bg-border rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-sm font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-md hover:bg-rose-500/20 transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Yes, delete my account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
