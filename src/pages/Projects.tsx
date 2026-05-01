import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projects', { name, description, deadline, memberIds: selectedMembers });
      setShowModal(false);
      setName('');
      setDescription('');
      setDeadline('');
      setSelectedMembers([]);
      fetchProjects();
    } catch (err) {
      console.error(err);
      alert('Error creating project');
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';

  if (loading) return <div>Loading projects...</div>;

  return (
    <div className="max-w-6xl mx-auto flex-1">
      <header className="mb-8 border-b border-border pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Projects</h1>
          <p className="text-muted mt-1 text-sm bg-transparent">Manage your team's projects and workflows.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors border border-emerald-500/20"
        >
          <Plus size={16} />
          <span>New Project</span>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p: any) => (
          <Link to={`/projects/${p.id}`} key={p.id} className="bg-card rounded-xl p-6 border border-border hover:border-[#10b981]/50 transition-colors block">
            <h3 className="text-sm font-semibold text-foreground mb-2">{p.name}</h3>
            <p className="text-faint text-xs mb-6 line-clamp-2 min-h-[32px]">
              {p.description || 'No description provided.'}
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center text-xs text-muted">
                <Calendar size={14} className="mr-3 text-faint" />
                <span>{p.deadline ? format(new Date(p.deadline), 'MMM d, yyyy') : 'No deadline'}</span>
              </div>
              <div className="flex items-center text-xs text-muted">
                <Users size={14} className="mr-3 text-faint" />
                <span>{p.members.length} {p.members.length === 1 ? 'member' : 'members'}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border flex items-center">
              <div className="flex -space-x-2">
                {p.members.slice(0, 4).map((m: any, i: number) => (
                  <div key={i} className="w-6 h-6 rounded-full bg-indigo-600 border border-card flex items-center justify-center text-[10px] font-bold text-white title={m.user.name}">
                    {m.user.name.charAt(0)}
                  </div>
                ))}
                {p.members.length > 4 && (
                  <div className="w-6 h-6 rounded-full bg-border border border-card flex items-center justify-center text-[10px] font-medium text-muted">
                    +{p.members.length - 4}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full py-12 text-center bg-card rounded-xl border border-dashed border-border">
            <p className="text-faint text-sm">No projects found. Create one to get started.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card rounded-xl border border-border w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-foreground">Create Project</h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-faint uppercase tracking-widest mb-1">Project Name</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-input rounded-md border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors" placeholder="Website Redesign" />
              </div>
              <div>
                <label className="block text-xs font-bold text-faint uppercase tracking-widest mb-1">Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-input rounded-md border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors" placeholder="Brief explanation..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-faint uppercase tracking-widest mb-1">Deadline</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-input rounded-md border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors" style={{colorScheme: 'dark'}} />
              </div>
              <div>
                <label className="block text-xs font-bold text-faint uppercase tracking-widest mb-2">Team Members</label>
                <div className="max-h-32 overflow-y-auto bg-input rounded-md border border-border p-2 space-y-1">
                  {users.filter((u: any) => u.id !== user?.id).map((u: any) => (
                    <label key={u.id} className="flex items-center space-x-3 p-1.5 hover:bg-border rounded cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedMembers.includes(u.id)}
                        onChange={() => toggleMember(u.id)}
                        className="accent-emerald-500 w-4 h-4 rounded border-[#3f3f46] bg-card"
                      />
                      <span className="text-sm text-foreground">{u.name}</span>
                      <span className="text-[10px] text-faint uppercase ml-auto">{u.role}</span>
                    </label>
                  ))}
                  {users.length <= 1 && (
                    <div className="text-xs text-faint p-1 text-center">No other members available</div>
                  )}
                </div>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-muted hover:bg-border rounded-md transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md hover:bg-emerald-500/20 transition-colors">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
