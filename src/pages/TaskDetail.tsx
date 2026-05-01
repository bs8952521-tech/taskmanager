import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, AlertCircle, CheckCircle2, Circle, Clock, ArrowLeft, User as UserIcon, Tag, Folder, Paperclip, Upload, Trash2, File as FileIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to fetch task');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Max 5MB allowed.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result;
      
      try {
        const res = await fetch(`/api/tasks/${id}/attachments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ filename: file.name, url: base64Url })
        });
        
        if (res.ok) {
          const newAttachment = await res.json();
          setTask((prev: any) => ({
            ...prev,
            attachments: [...(prev.attachments || []), newAttachment]
          }));
        } else {
          alert("Failed to upload file");
        }
      } catch (err) {
        alert("Upload error");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    
    try {
      const res = await fetch(`/api/tasks/${id}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTask((prev: any) => ({
          ...prev,
          attachments: prev.attachments.filter((a: any) => a.id !== attachmentId)
        }));
      }
    } catch (err) {
      alert("Error deleting attachment");
    }
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'High': return 'text-rose-500 border border-rose-500/20 bg-rose-500/10';
      case 'Medium': return 'text-amber-500 border border-amber-500/20 bg-amber-500/10';
      case 'Low': return 'text-emerald-500 border border-emerald-500/20 bg-emerald-500/10';
      default: return 'text-muted border border-border bg-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Done': return <CheckCircle2 size={16} className="text-emerald-500 mr-2" />;
      case 'In Progress': return <Clock size={16} className="text-amber-500 mr-2" />;
      case 'To Do': return <Circle size={16} className="text-muted mr-2" />;
      default: return null;
    }
  };

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setTask({ ...task, status });
      } else {
        alert("Failed to update status");
      }
    } catch {
      alert("Error updating status");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-rose-500 p-4">{error}</div>;
  if (!task) return null;

  const canEditStatus = user?.role === 'Admin' || user?.role === 'Manager' || task.assignee?.id === user?.id;

  return (
    <div className="max-w-4xl mx-auto flex-1 w-full space-y-6">
      <div className="flex items-center space-x-4 mb-2">
        <Link to="/tasks" className="p-2 rounded-md hover:bg-border text-muted hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <p className="text-xs font-bold text-faint uppercase tracking-widest mb-1">{task.project?.name || 'No Project'}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{task.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground mb-4">Description</h2>
            <div className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
              {task.description || <span className="italic text-faint">No description provided.</span>}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground flex items-center">
                <Paperclip size={16} className="mr-2 text-faint" />
                Attachments
              </h2>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploading}
                className="text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 px-3 py-1.5 rounded flex items-center border border-emerald-500/20 transition-colors disabled:opacity-50"
              >
                <Upload size={14} className="mr-1.5" />
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload}
              />
            </div>

            {(!task.attachments || task.attachments.length === 0) ? (
              <div className="text-sm text-faint italic py-4 text-center border-2 border-dashed border-border rounded-lg">
                No attachments yet. Upload a file to get started.
              </div>
            ) : (
              <ul className="space-y-2">
                {task.attachments.map((attachment: any) => (
                  <li key={attachment.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-input hover:border-emerald-500/30 transition-colors group">
                    <a href={attachment.url} target="_blank" rel="noreferrer" className="flex items-center space-x-3 truncate flex-1 hover:opacity-80">
                      <div className="w-8 h-8 rounded bg-background flex items-center justify-center text-emerald-500">
                        <FileIcon size={16} />
                      </div>
                      <span className="text-sm font-medium text-foreground truncate">{attachment.filename}</span>
                    </a>
                    {canEditStatus && (
                      <button 
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="ml-3 p-1.5 text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete attachment"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4">Task Details</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-faint uppercase tracking-widest mb-2 flex items-center"><Folder size={14} className="mr-2"/> Project</p>
                <div className="text-sm text-foreground">{task.project?.name || 'None'}</div>
              </div>

              <div>
                <p className="text-xs font-bold text-faint uppercase tracking-widest mb-2 flex items-center"><UserIcon size={14} className="mr-2"/> Assignee</p>
                {task.assignee ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 border border-card flex items-center justify-center text-xs font-bold text-white shadow-sm">
                      {task.assignee.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{task.assignee.name}</div>
                      <div className="text-xs text-muted">{task.assignee.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-faint italic">Unassigned</div>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-faint uppercase tracking-widest mb-2 flex items-center"><Calendar size={14} className="mr-2"/> Due Date</p>
                <div className="text-sm">
                  {task.dueDate ? (
                    <span className={new Date(task.dueDate) < new Date() && task.status !== 'Done' ? 'text-rose-500 font-medium' : 'text-foreground'}>
                      {format(new Date(task.dueDate), 'MMMM d, yyyy')}
                    </span>
                  ) : <span className="text-faint">-</span>}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-faint uppercase tracking-widest mb-2 flex items-center"><Tag size={14} className="mr-2"/> Priority</p>
                <span className={`inline-block text-[10px] px-2.5 py-1 rounded-md font-bold uppercase ${getPriorityColor(task.priority)}`}>
                  {task.priority || 'None'}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-faint uppercase tracking-widest mb-2 flex items-center"><AlertCircle size={14} className="mr-2"/> Status</p>
                <div className="flex items-center">
                   <select
                        value={task.status}
                        onChange={(e) => updateStatus(e.target.value)}
                        disabled={!canEditStatus}
                        className={`text-xs rounded-md px-3 py-1.5 font-bold uppercase border focus:outline-none appearance-none ${!canEditStatus ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} ${
                          task.status === 'Done' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          task.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-transparent text-muted border-border'
                        }`}
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
