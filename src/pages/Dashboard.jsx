import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getMonthlyStats, getPipelineData, getActivities } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import { FiUsers, FiTrendingUp, FiDollarSign, FiAlertCircle, FiClock, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];

const StatCard = ({ title, value, icon, color, sub, onClick }) => (
  <div onClick={onClick} className={`card p-5 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
    <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getMonthlyStats(), getPipelineData(), getActivities({ limit: 8 })])
      .then(([s, m, p, a]) => {
        setStats(s.data);
        setMonthly(m.data);
        setPipeline(p.data.filter(d => !['Won','Lost'].includes(d.stage)));
        setActivities(a.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  const fmt = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${n?.toLocaleString()}`;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Here's what's happening with your sales pipeline.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Leads" value={stats?.totalLeads || 0} icon={<FiUsers className="text-white text-lg" />} color="bg-blue-500" onClick={() => navigate('/leads')} />
        <StatCard title="New Leads" value={stats?.newLeads || 0} icon={<FiTrendingUp className="text-white text-lg" />} color="bg-green-500" onClick={() => navigate('/leads?status=New Lead')} />
        <StatCard title="Won Leads" value={stats?.wonLeads || 0} icon={<FiCheckCircle className="text-white text-lg" />} color="bg-emerald-500" sub={`${stats?.conversionRate}% conversion`} />
        <StatCard title="Revenue" value={fmt(stats?.revenue)} icon={<FiDollarSign className="text-white text-lg" />} color="bg-purple-500" sub={`Pipeline: ${fmt(stats?.pipelineValue)}`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Tasks" value={stats?.pendingTasks || 0} icon={<FiClock className="text-white text-lg" />} color="bg-yellow-500" onClick={() => navigate('/tasks')} />
        <StatCard title="Overdue Tasks" value={stats?.overdueTasks || 0} icon={<FiAlertCircle className="text-white text-lg" />} color="bg-red-500" onClick={() => navigate('/tasks?status=Overdue')} />
        <StatCard title="Contacted" value={stats?.contactedLeads || 0} icon={<FiUsers className="text-white text-lg" />} color="bg-cyan-500" />
        <StatCard title="Lost Leads" value={stats?.lostLeads || 0} icon={<FiAlertCircle className="text-white text-lg" />} color="bg-gray-500" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly leads */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Lead Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="wonGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#totalGrad)" name="Total Leads" />
              <Area type="monotone" dataKey="won" stroke="#10b981" fill="url(#wonGrad)" name="Won" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline funnel */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Pipeline Stages</h3>
          <div className="space-y-2">
            {pipeline.map((s, i) => (
              <div key={s.stage} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 truncate">{s.stage}</span>
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${pipeline[0]?.count ? (s.count / pipeline[0].count) * 100 : 0}%`, backgroundColor: COLORS[i] }}
                  />
                </div>
                <span className="text-xs font-semibold w-6 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity feed */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          <button onClick={() => navigate('/leads')} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View all <FiArrowRight />
          </button>
        </div>
        {activities.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activities.map(a => (
              <div key={a._id} className="flex items-start gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 flex-shrink-0 text-sm font-semibold">
                  {a.user?.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-200">{a.description}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
