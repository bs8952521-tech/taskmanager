import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  
  // Task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    fetchData();
  }, [filterProject, filterStatus, filterPriority, filterAssignee]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (filterProject) params.append('projectId', filterProject);
      if (filterStatus) params.append('status', filterStatus);
      if (filterPriority) params.append('priority', filterPriority);
      if (filterAssignee) params.append('assigneeId', filterAssignee);

      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        api.get(`/tasks?${params.toString()}`),
        api.get('/projects'),
        api.get('/users')
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tasks', { title, description, projectId, assigneeId, priority, dueDate });
      setShowModal(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error creating task');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/tasks/${id}`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const isAdminOrManager = user?.role === 'Admin' || user?.role === 'Manager';

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'High': return 'text-rose-500 border border-rose-500/20 bg-rose-500/10';
      case 'Medium': return 'text-amber-500 border border-amber-500/20 bg-amber-500/10';
      case 'Low': return 'text-emerald-500 border border-emerald-500/20 bg-emerald-500/10';
      default: return 'text-muted border border-border bg-border';
    }
  };

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div className="max-w-6xl mx-auto flex-1">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-border pb-6 gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Tasks</h1>
          <p className="text-muted mt-1 text-sm bg-transparent">Track and manage work across your team.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <select 
            value={filterProject} 
            onChange={(e) => setFilterProject(e.target.value)}
            className="bg-input border border-border rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 text-sm font-medium text-foreground transition-colors"
          >
            <option value="">All Projects</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-input border border-border rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 text-sm font-medium text-foreground transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>

          <select 
            value={filterPriority} 
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-input border border-border rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 text-sm font-medium text-foreground transition-colors"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <select 
            value={filterAssignee} 
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="bg-input border border-border rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 text-sm font-medium text-foreground transition-colors"
          >
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {users.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          
          {isAdminOrManager && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors border border-emerald-500/20"
            >
              <Plus size={16} />
              <span>New Task</span>
            </button>
          )}
        </div>
      </header>

      <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] uppercase text-faint border-b border-border">
              <tr>
                <th className="px-6 py-3 font-bold">Task Name</th>
                <th className="px-6 py-3 font-bold">Project</th>
                <th className="px-6 py-3 font-bold">Assignee</th>
                <th className="px-6 py-3 font-bold">Status & Priority</th>
                <th className="px-6 py-3 font-bold">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f23] text-sm text-foreground">
              {tasks.map((t: any) => (
                <tr key={t.id} className="hover:bg-input transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/tasks/${t.id}`} className="font-medium text-foreground hover:text-emerald-500 transition-colors block">
                      {t.title}
                    </Link>
                    {t.description && <div className="text-[10px] text-faint truncate max-w-xs mt-0.5">{t.description}</div>}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-muted">{t.project?.name}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    {t.assignee ? (
                      <>
                         <div className="w-6 h-6 rounded-full bg-indigo-600 border border-card text-[10px] flex items-center justify-center font-bold text-white">
                           {t.assignee.name.charAt(0)}
                         </div>
                         <span className="text-muted">{t.assignee.name}</span>
                      </>
                    ) : <span className="text-faint">Unassigned</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-2 items-start">
                      <select
                        value={t.status}
                        onChange={(e) => updateStatus(t.id, e.target.value)}
                        disabled={user?.role === 'Member' && t.assigneeId !== user?.id}
                        className={`text-[10px] rounded px-2 py-0.5 font-bold uppercase border focus:outline-none cursor-pointer appearance-none ${
                          t.status === 'Done' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          t.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-transparent text-muted border-border'
                        }`}
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getPriorityColor(t.priority)}`}>
                        {t.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {t.dueDate ? (
                      <span className={new Date(t.dueDate) < new Date() && t.status !== 'Done' ? 'text-rose-500 font-medium' : 'text-muted'}>
                        {format(new Date(t.dueDate), 'MMM d, yyyy')}
                      </span>
                    ) : <span className="text-faint">-</span>}
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-faint text-sm">
                    No tasks found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card rounded-xl border border-border w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-foreground">Create Task</h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-foreground">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-faint uppercase tracking-widest mb-1">Task Title</label>
                <input required type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-input rounded-md border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors" placeholder="Implement login UI" />
              </div>
              <div>
                <label className="block text-xs font-bold text-faint uppercase tracking-widest mb-1">Project</label>
                <select required value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full bg-input rounded-md border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors">
                  <option value="">Select Project</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-faint uppercase tracking-widest mb-1">Assignee</label>
                  <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full bg-input rounded-md border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors">
                    <option value="">Unassigned</option>
                    {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-faint uppercase tracking-widest mb-1">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full bg-input rounded-md border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-faint uppercase tracking-widest mb-1">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-input rounded-md border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-emerald-500 transition-colors" style={{colorScheme: 'dark'}} />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-muted hover:bg-border rounded-md transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md hover:bg-emerald-500/20 transition-colors">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
