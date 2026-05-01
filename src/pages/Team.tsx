import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Shield, User as UserIcon, Settings } from 'lucide-react';

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to update role');
    }
  };

  const isAdmin = user?.role === 'Admin';

  if (loading) return <div>Loading team members...</div>;

  return (
    <div className="max-w-6xl mx-auto flex-1">
      <header className="mb-8 border-b border-border pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Team Members</h1>
          <p className="text-muted mt-1 text-sm">Manage roles and permissions for your team.</p>
        </div>
      </header>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] uppercase text-faint border-b border-border">
              <tr>
                <th className="px-6 py-3 font-bold">User</th>
                <th className="px-6 py-3 font-bold">Email Address</th>
                <th className="px-6 py-3 font-bold">Role</th>
                <th className="px-6 py-3 font-bold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f23] text-sm text-foreground">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-input transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 border border-card flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-medium">{u.name} {u.id === user?.id && <span className="text-[10px] text-emerald-500 ml-1">(You)</span>}</div>
                  </td>
                  <td className="px-6 py-4 text-muted">{u.email}</td>
                  <td className="px-6 py-4">
                    {isAdmin && u.id !== user?.id ? (
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        className="bg-input border border-border rounded-md px-2 py-1 outline-none focus:border-emerald-500 text-xs font-bold text-foreground transition-colors uppercase"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Member">Member</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                        u.role === 'Admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                        u.role === 'Manager' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}>
                        {u.role === 'Admin' && <Shield size={10} className="mr-1" />}
                        {u.role === 'Manager' && <Settings size={10} className="mr-1" />}
                        {u.role === 'Member' && <UserIcon size={10} className="mr-1" />}
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-faint text-xs">
                    {new Date().toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
