import React, { useState, useEffect } from 'react';
import { getMonthlyStats, getTeamPerformance, getLeadSources, getPipelineData, getDashboardStats } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, FunnelChart, Funnel, LabelList, CartesianGrid
} from 'recharts';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#f97316'];

const ChartCard = ({ title, subtitle, children }) => (
  <div className="card p-5">
    <div className="mb-4">
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [monthly, setMonthly] = useState([]);
  const [team, setTeam] = useState([]);
  const [sources, setSources] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calls = [getMonthlyStats(), getLeadSources(), getPipelineData(), getDashboardStats()];
    if (user.role === 'admin') calls.push(getTeamPerformance());

    Promise.all(calls).then(results => {
      setMonthly(results[0].data);
      setSources(results[1].data);
      setPipeline(results[2].data);
      setStats(results[3].data);
      if (user.role === 'admin' && results[4]) setTeam(results[4].data);
    }).finally(() => setLoading(false));
  }, [user.role]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  const fmt = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : `₹${(n||0).toLocaleString()}`;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">Performance insights and metrics</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmt(stats?.revenue), sub: 'From won deals', color: 'text-green-600' },
          { label: 'Pipeline Value', value: fmt(stats?.pipelineValue), sub: 'Active deals', color: 'text-blue-600' },
          { label: 'Conversion Rate', value: `${stats?.conversionRate}%`, sub: 'Lead to deal', color: 'text-purple-600' },
          { label: 'Total Leads', value: stats?.totalLeads, sub: `${stats?.wonLeads} won · ${stats?.lostLeads} lost`, color: 'text-orange-600' },
        ].map(k => (
          <div key={k.label} className="card p-5">
            <p className="text-xs text-gray-500 font-medium">{k.label}</p>
            <p className={`text-2xl font-bold mt-1 ${k.color}`}>{k.value}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly trend + Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Monthly Lead Trend" subtitle="Leads created & won per month" >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="aTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="aWon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="total" name="Total" stroke="#3b82f6" fill="url(#aTotal)" strokeWidth={2} />
              <Area type="monotone" dataKey="won" name="Won" stroke="#10b981" fill="url(#aWon)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lead Sources" subtitle="Where your leads come from">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={sources} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" nameKey="name" paddingAngle={3}>
                {sources.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Month" subtitle="Monthly closed deal value">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 100000 ? `${(v/100000).toFixed(0)}L` : v} />
              <Tooltip formatter={v => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#8b5cf6" radius={[4,4,0,0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pipeline funnel */}
      <ChartCard title="Sales Pipeline Funnel" subtitle="Leads at each stage">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            {pipeline.map((s, i) => {
              const maxCount = pipeline[0]?.count || 1;
              const pct = ((s.count / maxCount) * 100).toFixed(0);
              return (
                <div key={s.stage} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-28 text-right flex-shrink-0">{s.stage}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-6 relative overflow-hidden">
                    <div className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}>
                      {pct > 15 && <span className="text-white text-xs font-semibold">{s.count}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-8">{pct}%</span>
                </div>
              );
            })}
          </div>
          <div className="space-y-2">
            {pipeline.map((s, i) => (
              <div key={s.stage} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{s.stage}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{s.count} leads</p>
                  <p className="text-xs text-gray-500">₹{(s.value || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      {/* Team performance (admin only) */}
      {user.role === 'admin' && team.length > 0 && (
        <ChartCard title="Team Performance" subtitle="BDA employee performance comparison">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Rank','Member','Total Leads','Won','Conversion','Revenue'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs text-gray-500 font-semibold uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {team.map((t, i) => (
                  <tr key={t.user?._id} className="py-3">
                    <td className="py-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-500'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {t.user?.name?.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{t.user?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{t.totalLeads}</td>
                    <td className="py-3 text-green-600 font-semibold">{t.wonLeads}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${t.conversionRate}%` }} />
                        </div>
                        <span className="text-gray-600 dark:text-gray-400 text-xs">{t.conversionRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 font-semibold text-purple-600">{fmt(t.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}
    </div>
  );
}
