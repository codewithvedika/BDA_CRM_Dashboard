import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getLeads, deleteLead, getBDAList } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import LeadModal from '../components/leads/LeadModal';
import { FiPlus, FiSearch, FiFilter, FiEdit2, FiTrash2, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { format } from 'date-fns';

const statusBadge = (s) => {
  const map = { 'New Lead':'badge-new','Contacted':'badge-contacted','Qualified':'badge-qualified','Proposal Sent':'badge-proposal','Negotiation':'badge-negotiation','Won':'badge-won','Lost':'badge-lost' };
  return <span className={map[s] || 'badge-new'}>{s}</span>;
};
const priorityBadge = (p) => {
  const map = { High:'badge-high', Medium:'badge-medium', Low:'badge-low' };
  return <span className={map[p] || 'badge-medium'}>{p}</span>;
};

export default function LeadsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editLead, setEditLead] = useState(null);
  const [bdaList, setBdaList] = useState([]);
  const [filters, setFilters] = useState({
    search: '', status: searchParams.get('status') || '', priority: '', assignedTo: '', source: ''
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await getLeads(params);
      setLeads(res.data.leads);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load leads'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { getBDAList().then(r => setBdaList(r.data)); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try { await deleteLead(id); toast.success('Lead deleted'); fetchLeads(); }
    catch { toast.error('Failed to delete'); }
  };

  const pages = Math.ceil(total / 15);

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total leads</p>
        </div>
        <button onClick={() => { setEditLead(null); setShowModal(true); }} className="btn-primary">
          <FiPlus /> Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="col-span-2 md:col-span-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search leads..." value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
          </div>
          <select className="input" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
            <option value="">All Status</option>
            {['New Lead','Contacted','Qualified','Proposal Sent','Negotiation','Won','Lost'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="input" value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}>
            <option value="">All Priority</option>
            {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
          </select>
          <select className="input" value={filters.source} onChange={e => setFilters(p => ({ ...p, source: e.target.value }))}>
            <option value="">All Sources</option>
            {['Website','Referral','Cold Call','Email Campaign','LinkedIn','Trade Show','Other'].map(s => <option key={s}>{s}</option>)}
          </select>
          {user.role === 'admin' && (
            <select className="input" value={filters.assignedTo} onChange={e => setFilters(p => ({ ...p, assignedTo: e.target.value }))}>
              <option value="">All BDA</option>
              {bdaList.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Name / Company','Status','Priority','Assigned To','Deal Value','Follow-up','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No leads found</td></tr>
              ) : leads.map(lead => (
                <tr key={lead._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">{lead.name}</div>
                    <div className="text-xs text-gray-500">{lead.company}</div>
                  </td>
                  <td className="px-4 py-3">{statusBadge(lead.status)}</td>
                  <td className="px-4 py-3">{priorityBadge(lead.priority)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 text-xs font-semibold">
                        {lead.assignedTo?.name?.charAt(0) || '?'}
                      </div>
                      <span className="text-gray-600 dark:text-gray-400 text-xs">{lead.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                    ₹{(lead.expectedDealValue || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {lead.nextFollowUpDate ? format(new Date(lead.nextFollowUpDate), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/leads/${lead._id}`)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-600 hover:text-blue-700">
                        <FiEye />
                      </button>
                      <button onClick={() => { setEditLead(lead); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500">
                        <FiEdit2 />
                      </button>
                      {user.role === 'admin' && (
                        <button onClick={() => handleDelete(lead._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500">
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-sm text-gray-500">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary py-1 px-2 disabled:opacity-40"><FiChevronLeft /></button>
              <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-secondary py-1 px-2 disabled:opacity-40"><FiChevronRight /></button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <LeadModal
          lead={editLead}
          bdaList={bdaList}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchLeads(); }}
        />
      )}
    </div>
  );
}
