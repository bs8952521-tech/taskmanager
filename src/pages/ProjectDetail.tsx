import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, ArrowLeft, Users, Shield, Plus, X, ShieldAlert, Check } from 'lucide-react';
import { format } from 'date-fns';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, usersRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get('/users')
      ]);
      setProject(projRes.data);
      setAllUsers(usersRes.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch project details');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (userId: string) => {
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      setProject({
        ...project,
        members: project.members.filter((m: any) => m.userId !== userId)
      });
    } catch (err) {
      alert("Error removing member");
    }
  };

  const addMember = async (userId: string) => {
    try {
      const { data } = await api.post(`/projects/${id}/members`, { userId });
      const addedUser = allUsers.find(u => u.id === userId);
      
      setProject({
        ...project,
        members: [...project.members, { userId, user: addedUser }]
      });
      setShowAddMember(false);
    } catch (err) {
      alert("Error adding member");
    }
  };

  if (loading) return <div>Loading project details...</div>;
  if (error) return <div className="text-rose-500 p-4">{error}</div>;
  if (!project) return null;

  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';

  const memberIds = project.members.map((m: any) => m.userId);
  const availableUsers = allUsers.filter(u => !memberIds.includes(u.id));

  return (
    <div className="max-w-6xl mx-auto flex-1 w-full space-y-8">
      <div className="flex items-center space-x-4 mb-2">
        <Link to="/projects" className="p-2 rounded-md hover:bg-border text-muted hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{project.name}</h1>
          <p className="text-muted mt-1 text-sm bg-transparent">
             {project.description || 'No description provided.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-sm font-semibold text-foreground flex items-center">
                <Users size={16} className="mr-2 text-indigo-500" />
                Team Members
              </h2>
              {isAdminOrManager && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center transition-colors border border-indigo-500/20"
                >
                  <Plus size={14} className="mr-1" /> Add Member
                </button>
              )}
            </div>

            <ul className="divide-y divide-[#1f1f23]">
              {project.members.map((m: any) => (
                <li key={m.userId} className="p-4 flex items-center justify-between hover:bg-input transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 border border-card flex items-center justify-center text-sm font-bold text-white shadow-sm">
                      {m.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground flex items-center">
                        {m.user.name}
                        {m.userId === user?.id && <span className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full uppercase font-bold">You</span>}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{m.user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded inline-flex items-center ${
                      m.user.role === 'Admin' ? 'text-indigo-400 bg-indigo-500/10' : 
                      m.user.role === 'Manager' ? 'text-amber-500 bg-amber-500/10' : 
                      'text-emerald-500 bg-emerald-500/10'
                    }`}>
                      {m.user.role === 'Admin' && <ShieldAlert size={10} className="mr-1" />}
                      {m.user.role}
                    </span>

                    {isAdminOrManager && m.userId !== user?.id && (
                       <button
                         onClick={() => removeMember(m.userId)}
                         className="text-faint hover:text-rose-500 p-1.5 rounded-md hover:bg-rose-500/10 transition-colors"
                         title="Remove from project"
                       >
                         <X size={16} />
                       </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
             {project.members.length === 0 && (
                <div className="p-8 text-center text-sm text-faint italic">No members in this project.</div>
             )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4">Project Info</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-faint uppercase tracking-widest mb-2 flex items-center"><Calendar size={14} className="mr-2"/> Deadline</p>
                <div className="text-sm">
                  {project.deadline ? (
                    <span className={new Date(project.deadline) < new Date() ? 'text-rose-500 font-medium' : 'text-foreground'}>
                      {format(new Date(project.deadline), 'MMMM d, yyyy')}
                    </span>
                  ) : <span className="text-faint italic">No Deadline</span>}
                </div>
              </div>
               <div>
                  <p className="text-xs font-bold text-faint uppercase tracking-widest mb-2 flex items-center"><Check size={14} className="mr-2"/> Tasks Status</p>
                  <div className="text-sm text-foreground flex items-center space-x-2">
                     <span className="text-emerald-500">{project.tasks?.filter((t: any) => t.status === 'Done').length || 0} Done</span>
                     <span className="text-faint">•</span>
                     <span className="text-amber-500">{project.tasks?.filter((t: any) => t.status === 'In Progress').length || 0} In Progress</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

       {showAddMember && (
         <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-card rounded-xl w-full max-w-md border border-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
               <div className="p-4 border-b border-border flex justify-between items-center bg-input">
                 <h2 className="text-sm font-semibold text-foreground">Add Team Member</h2>
                 <button onClick={() => setShowAddMember(false)} className="text-muted hover:text-foreground">&times;</button>
               </div>
               
               <div className="p-4 overflow-y-auto flex-1">
                  {availableUsers.length === 0 ? (
                     <div className="text-center p-8 text-sm text-faint">All organization members are already in this project.</div>
                  ) : (
                     <ul className="space-y-2">
                       {availableUsers.map(u => (
                         <li key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-indigo-500/50 bg-input transition-colors group">
                           <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                 <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                                 <p className="text-xs text-muted truncate">{u.email}</p>
                              </div>
                           </div>
                           <button 
                             onClick={() => addMember(u.id)}
                             className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                           >
                             Add
                           </button>
                         </li>
                       ))}
                     </ul>
                  )}
               </div>
               
               <div className="p-4 border-t border-border flex justify-end bg-input">
                  <button 
                     onClick={() => setShowAddMember(false)}
                     className="text-sm font-medium text-muted hover:text-foreground transition-colors"
                  >
                     Close
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}
