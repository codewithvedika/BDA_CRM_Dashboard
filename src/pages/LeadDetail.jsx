import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLead, getNotes, createNote, deleteNote, getTasks, createTask, updateTask, getActivities, updateLead, sendEmail } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { FiArrowLeft, FiEdit2, FiMail, FiPhone, FiGlobe, FiMapPin, FiPlus, FiTrash2, FiCheck, FiClock } from 'react-icons/fi';

const statusColors = { 'New Lead':'bg-blue-500','Contacted':'bg-yellow-500','Qualified':'bg-purple-500','Proposal Sent':'bg-orange-500','Negotiation':'bg-indigo-500','Won':'bg-green-500','Lost':'bg-red-500' };

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('Note');
  const [taskForm, setTaskForm] = useState({ title: '', dueDate: '', type: 'Follow-up', priority: 'Medium' });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailForm, setEmailForm] = useState({ subject: '', message: '' });
  const [activeTab, setActiveTab] = useState('notes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLead(id), getNotes(id), getTasks({ lead: id }), getActivities({ leadId: id })])
      .then(([l, n, t, a]) => { setLead(l.data); setNotes(n.data); setTasks(t.data); setActivities(a.data); })
      .catch(() => toast.error('Failed to load lead'))
      .finally(() => setLoading(false));
  }, [id]);

  const addNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      const res = await createNote(id, { content: noteText, type: noteType });
      setNotes(p => [res.data, ...p]);
      setNoteText('');
      toast.success('Note added');
    } catch { toast.error('Failed to add note'); }
  };

  const addTask = async (e) => {
    e.preventDefault();
    try {
      const res = await createTask({ ...taskForm, lead: id, assignedTo: lead.assignedTo?._id || user._id });
      setTasks(p => [...p, res.data]);
      setTaskForm({ title: '', dueDate: '', type: 'Follow-up', priority: 'Medium' });
      setShowTaskForm(false);
      toast.success('Task created');
    } catch { toast.error('Failed to create task'); }
  };

  const completeTask = async (taskId) => {
    try {
      const res = await updateTask(taskId, { status: 'Completed' });
      setTasks(p => p.map(t => t._id === taskId ? res.data : t));
      toast.success('Task completed!');
    } catch { toast.error('Failed'); }
  };

  const sendFollowUp = async (e) => {
    e.preventDefault();
    try {
      await sendEmail({ leadId: id, ...emailForm });
      setShowEmailForm(false);
      setEmailForm({ subject: '', message: '' });
      toast.success('Email sent!');
    } catch { toast.error('Failed to send email'); }
  };

  const updateStatus = async (status) => {
    try {
      const res = await updateLead(id, { status });
      setLead(res.data);
      toast.success('Status updated');
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
  if (!lead) return <div className="text-center py-20 text-gray-500">Lead not found</div>;

  return (
    <div className="space-y-6 fade-in max-w-6xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/leads')} className="btn-secondary py-2 px-3 mt-1"><FiArrowLeft /></button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lead.name}</h1>
            <div className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${statusColors[lead.status]}`}>
              {lead.status}
            </div>
            <span className={`badge-${lead.priority.toLowerCase()}`}>{lead.priority} Priority</span>
          </div>
          <p className="text-gray-500 mt-1">{lead.company} · {lead.industry}</p>
        </div>
        <button onClick={() => navigate(`/leads?edit=${id}`)} className="btn-secondary"><FiEdit2 /> Edit</button>
      </div>

      {/* Quick status update */}
      <div className="card p-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Move to Stage</p>
        <div className="flex flex-wrap gap-2">
          {['New Lead','Contacted','Qualified','Proposal Sent','Negotiation','Won','Lost'].map(s => (
            <button key={s} onClick={() => updateStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${lead.status === s ? `${statusColors[s]} text-white border-transparent` : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact info */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Details</h3>
            <div className="space-y-3">
              {[
                { icon: <FiMail />, label: 'Email', value: lead.email, href: `mailto:${lead.email}` },
                { icon: <FiPhone />, label: 'Phone', value: lead.phone, href: `tel:${lead.phone}` },
                { icon: <FiGlobe />, label: 'Website', value: lead.website, href: lead.website },
                { icon: <FiMapPin />, label: 'Address', value: lead.address },
              ].filter(i => i.value).map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="text-gray-400 mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-xs text-gray-400">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm text-blue-600 hover:underline">{item.value}</a>
                    ) : (
                      <p className="text-sm text-gray-800 dark:text-gray-200">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowEmailForm(true)} className="btn-primary w-full mt-4 justify-center text-sm">
              <FiMail /> Send Email
            </button>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Deal Info</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Expected Value', value: `₹${(lead.expectedDealValue || 0).toLocaleString()}` },
                { label: 'Source', value: lead.source },
                { label: 'Assigned To', value: lead.assignedTo?.name || 'Unassigned' },
                { label: 'Next Follow-up', value: lead.nextFollowUpDate ? format(new Date(lead.nextFollowUpDate), 'dd MMM yyyy') : '—' },
                { label: 'Created', value: format(new Date(lead.createdAt), 'dd MMM yyyy') },
              ].map(r => (
                <div key={r.label} className="flex justify-between">
                  <span className="text-sm text-gray-500">{r.label}</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {lead.tags?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {lead.tags.map(t => <span key={t} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs">{t}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-800 gap-1">
            {['notes','tasks','activity'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab} {tab === 'notes' ? `(${notes.length})` : tab === 'tasks' ? `(${tasks.length})` : `(${activities.length})`}
              </button>
            ))}
          </div>

          {/* Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              <form onSubmit={addNote} className="card p-4">
                <div className="flex gap-2 mb-3">
                  {['Note','Call Log','Email Log','Meeting Log'].map(t => (
                    <button key={t} type="button" onClick={() => setNoteType(t)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${noteType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <textarea className="input resize-none" rows={3} placeholder="Add a note..." value={noteText} onChange={e => setNoteText(e.target.value)} />
                <button type="submit" className="btn-primary mt-2 text-sm">Add Note</button>
              </form>
              {notes.map(note => (
                <div key={note._id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-bold">
                        {note.author?.name?.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{note.author?.name}</span>
                        <span className="mx-2 text-gray-300">·</span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">{note.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}</span>
                      {(note.author?._id === user._id || user.role === 'admin') && (
                        <button onClick={() => { deleteNote(note._id); setNotes(p => p.filter(n => n._id !== note._id)); }}
                          className="p-1 hover:text-red-500 text-gray-400"><FiTrash2 className="text-xs" /></button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 ml-9">{note.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tasks */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <button onClick={() => setShowTaskForm(p => !p)} className="btn-primary text-sm"><FiPlus /> Add Task</button>
              {showTaskForm && (
                <form onSubmit={addTask} className="card p-4 space-y-3">
                  <input className="input" placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm(p => ({...p, title: e.target.value}))} required />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="date" className="input" value={taskForm.dueDate} onChange={e => setTaskForm(p => ({...p, dueDate: e.target.value}))} required />
                    <select className="input" value={taskForm.type} onChange={e => setTaskForm(p => ({...p, type: e.target.value}))}>
                      {['Call','Email','Meeting','Demo','Follow-up','Send Quotation','Other'].map(t => <option key={t}>{t}</option>)}
                    </select>
                    <select className="input" value={taskForm.priority} onChange={e => setTaskForm(p => ({...p, priority: e.target.value}))}>
                      {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm">Create Task</button>
                    <button type="button" onClick={() => setShowTaskForm(false)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </form>
              )}
              {tasks.map(task => (
                <div key={task._id} className={`card p-4 flex items-center gap-3 ${task.status === 'Completed' ? 'opacity-60' : ''}`}>
                  <button onClick={() => task.status !== 'Completed' && completeTask(task._id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${task.status === 'Completed' ? 'bg-green-500 border-green-500' : task.status === 'Overdue' ? 'border-red-400' : 'border-gray-300'}`}>
                    {task.status === 'Completed' && <FiCheck className="text-white text-xs" />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${task.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{task.type}</span>
                      <span className="text-gray-300">·</span>
                      <span className={`text-xs ${task.status === 'Overdue' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        <FiClock className="inline mr-1" />{format(new Date(task.dueDate), 'dd MMM yyyy')}
                      </span>
                    </div>
                  </div>
                  <span className={`badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.status === 'Completed' ? 'bg-green-100 text-green-700' : task.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Activity */}
          {activeTab === 'activity' && (
            <div className="space-y-0 relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800" />
              {activities.map((a, i) => (
                <div key={a._id} className="flex gap-4 pb-4 relative">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0 z-10 border-2 border-white dark:border-gray-950">
                    {a.user?.name?.charAt(0)}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm text-gray-800 dark:text-gray-200">{a.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email modal */}
      {showEmailForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Send Email to {lead.name}</h3>
            <form onSubmit={sendFollowUp} className="space-y-4">
              <input className="input" placeholder="Subject" value={emailForm.subject} onChange={e => setEmailForm(p => ({...p, subject: e.target.value}))} required />
              <textarea className="input resize-none" rows={5} placeholder="Your message..." value={emailForm.message} onChange={e => setEmailForm(p => ({...p, message: e.target.value}))} required />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowEmailForm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Send Email</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
