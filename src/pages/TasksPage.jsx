import React, { useState, useEffect, useCallback } from 'react';
import { getTasks, createTask, updateTask, deleteTask, getBDAList, getLeads } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FiPlus, FiCheck, FiTrash2, FiClock, FiAlertCircle, FiFilter } from 'react-icons/fi';

const statusColor = { Pending: 'bg-yellow-100 text-yellow-700', 'In Progress': 'bg-blue-100 text-blue-700', Completed: 'bg-green-100 text-green-700', Overdue: 'bg-red-100 text-red-700' };
const typeIcon = { Call: '📞', Email: '📧', Meeting: '🤝', Demo: '🖥️', 'Follow-up': '🔁', 'Send Quotation': '📄', Other: '📌' };

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [bdaList, setBdaList] = useState([]);
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', type: 'Follow-up', priority: 'Medium', dueDate: '', assignedTo: '', lead: '' });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await getTasks(params);
      setTasks(res.data);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => {
    getBDAList().then(r => setBdaList(r.data));
    getLeads({ limit: 100 }).then(r => setLeads(r.data.leads));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, assignedTo: form.assignedTo || user._id };
      if (!data.lead) delete data.lead;
      const res = await createTask(data);
      setTasks(p => [res.data, ...p]);
      setForm({ title: '', description: '', type: 'Follow-up', priority: 'Medium', dueDate: '', assignedTo: '', lead: '' });
      setShowModal(false);
      toast.success('Task created!');
    } catch { toast.error('Failed to create task'); }
  };

  const complete = async (id) => {
    try {
      const res = await updateTask(id, { status: 'Completed' });
      setTasks(p => p.map(t => t._id === id ? res.data : t));
      toast.success('Task completed!');
    } catch { toast.error('Failed'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try { await deleteTask(id); setTasks(p => p.filter(t => t._id !== id)); toast.success('Deleted'); }
    catch { toast.error('Failed'); }
  };

  const counts = { all: tasks.length, Pending: tasks.filter(t => t.status === 'Pending').length, Overdue: tasks.filter(t => t.status === 'Overdue').length, Completed: tasks.filter(t => t.status === 'Completed').length };

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks & Follow-ups</h1>
          <p className="text-gray-500 text-sm mt-0.5">{counts.Pending} pending · {counts.Overdue} overdue</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><FiPlus /> New Task</button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[['all','All'], ['Pending','Pending'], ['Overdue','Overdue'], ['In Progress','In Progress'], ['Completed','Completed']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === val ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-300'}`}>
            {label} <span className="ml-1 opacity-70">({counts[val] ?? tasks.length})</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : tasks.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">No tasks found</div>
        ) : tasks.map(task => (
          <div key={task._id} className={`card p-4 flex items-center gap-4 ${task.status === 'Completed' ? 'opacity-60' : ''}`}>
            <button onClick={() => task.status !== 'Completed' && complete(task._id)}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.status === 'Completed' ? 'bg-green-500 border-green-500' : task.status === 'Overdue' ? 'border-red-400 hover:border-red-500' : 'border-gray-300 hover:border-green-500'}`}>
              {task.status === 'Completed' && <FiCheck className="text-white text-xs" />}
            </button>

            <div className="text-xl flex-shrink-0">{typeIcon[task.type] || '📌'}</div>

            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm ${task.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{task.title}</p>
              {task.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>}
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {task.lead && <span className="text-xs text-blue-600 dark:text-blue-400">📋 {task.lead.name} · {task.lead.company}</span>}
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  {task.status === 'Overdue' ? <FiAlertCircle className="text-red-400" /> : <FiClock className="text-gray-400" />}
                  <span className={task.status === 'Overdue' ? 'text-red-500 font-medium' : ''}>{format(new Date(task.dueDate), 'dd MMM yyyy')}</span>
                </span>
                {task.assignedTo && <span className="text-xs text-gray-500">👤 {task.assignedTo.name}</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[task.status]}`}>{task.status}</span>
              <button onClick={() => remove(task._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500"><FiTrash2 /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create New Task</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input className="input" placeholder="Task title *" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} required />
              <textarea className="input resize-none" rows={2} placeholder="Description (optional)" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}>
                    {['Call','Email','Meeting','Demo','Follow-up','Send Quotation','Other'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={form.priority} onChange={e => setForm(p => ({...p, priority: e.target.value}))}>
                    {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Due Date *</label>
                  <input type="date" className="input" value={form.dueDate} onChange={e => setForm(p => ({...p, dueDate: e.target.value}))} required />
                </div>
                {user.role === 'admin' && (
                  <div>
                    <label className="label">Assign To</label>
                    <select className="input" value={form.assignedTo} onChange={e => setForm(p => ({...p, assignedTo: e.target.value}))}>
                      <option value="">Myself</option>
                      {bdaList.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="label">Link to Lead (optional)</label>
                  <select className="input" value={form.lead} onChange={e => setForm(p => ({...p, lead: e.target.value}))}>
                    <option value="">No lead</option>
                    {leads.map(l => <option key={l._id} value={l._id}>{l.name} – {l.company}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
