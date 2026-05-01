import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/dashboard');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  const barData = [
    { name: 'To Do', value: stats.pending },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Done', value: stats.completed },
  ];

  const pieData = [
    { name: 'On Time', value: stats.total - stats.overdue },
    { name: 'Overdue', value: stats.overdue },
  ];
  const COLORS = ['#3b82f6', '#ef4444'];

  return (
    <div className="max-w-6xl mx-auto flex-1">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted mt-1 text-sm bg-transparent">Welcome back, {user?.name}. Here's what's happening.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Tasks', value: stats.total, color: 'text-emerald-500', extra: '+ from last week' },
          { label: 'Completed', value: stats.completed, color: 'text-blue-500', extra: 'Overall efficiency' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-amber-500', extra: 'Active tasks' },
          { label: 'Overdue', value: stats.overdue, color: 'text-rose-500', extra: 'Requires attention' },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border p-5 rounded-xl">
            <p className="text-xs text-faint uppercase font-bold tracking-widest mb-1">{stat.label}</p>
            <p className={`text-3xl font-light tracking-tighter ${stat.label === 'Overdue' && stat.value > 0 ? 'text-rose-500' : 'text-foreground'}`}>{stat.value}</p>
            <div className={`mt-2 text-[10px] ${stat.color} font-medium`}>{stat.extra}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="text-sm font-semibold mb-6">Task Status Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#a1a1aa', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{fill: '#a1a1aa', fontSize: 12}} />
                <Tooltip cursor={{ fill: '#161618' }} contentStyle={{ borderRadius: '8px', border: '1px solid #1f1f23', backgroundColor: '#0d0d0f', color: '#ecedee' }} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl">
          <h3 className="text-sm font-semibold mb-6">Due Date Status</h3>
          <div className="h-72 flex items-center justify-center">
            {stats.total > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={pieData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={100}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {pieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                     ))}
                   </Pie>
                   <Tooltip formatter={(value, name) => [`${value} Tasks`, name]} contentStyle={{ borderRadius: '8px', border: '1px solid #1f1f23', backgroundColor: '#0d0d0f', color: '#ecedee' }} />
                 </PieChart>
               </ResponsiveContainer>
            ) : (
              <p className="text-faint">No tasks available</p>
            )}
          </div>
          <div className="flex justify-center mt-4 space-x-6">
            <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div><span className="text-[10px] text-muted">On Time</span></div>
            <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-rose-500 mr-2"></div><span className="text-[10px] text-muted">Overdue</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
