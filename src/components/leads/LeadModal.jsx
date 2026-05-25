import React, { useState, useEffect } from 'react';
import { createLead, updateLead } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';

export default function LeadModal({ lead, bdaList, onClose, onSave }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', industry: 'Manufacturing',
    source: 'Website', status: 'New Lead', priority: 'Medium', assignedTo: '',
    expectedDealValue: '', nextFollowUpDate: '', address: '', website: '', tags: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || '',
        company: lead.company || '',
        email: lead.email || '',
        phone: lead.phone || '',
        industry: lead.industry || 'Manufacturing',
        source: lead.source || 'Website',
        status: lead.status || 'New Lead',
        priority: lead.priority || 'Medium',
        assignedTo: lead.assignedTo?._id || lead.assignedTo || '',
        expectedDealValue: lead.expectedDealValue || '',
        nextFollowUpDate: lead.nextFollowUpDate ? lead.nextFollowUpDate.split('T')[0] : '',
        address: lead.address || '',
        website: lead.website || '',
        tags: lead.tags?.join(', ') || '',
      });
    }
  }, [lead]);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (!data.assignedTo) delete data.assignedTo;
      if (lead) await updateLead(lead._id, data);
      else await createLead(data);
      toast.success(lead ? 'Lead updated!' : 'Lead created!');
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" placeholder="Client name" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="label">Company *</label>
              <input className="input" placeholder="Company name" value={form.company} onChange={set('company')} required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" placeholder="client@company.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input className="input" placeholder="9876543210" value={form.phone} onChange={set('phone')} required />
            </div>
            <div>
              <label className="label">Industry</label>
              <select className="input" value={form.industry} onChange={set('industry')}>
                {['Manufacturing','Automotive','Electronics','Textile','Chemical','Food & Beverage','Pharma','Construction','Other'].map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Source</label>
              <select className="input" value={form.source} onChange={set('source')}>
                {['Website','Referral','Cold Call','Email Campaign','LinkedIn','Trade Show','Other'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={set('status')}>
                {['New Lead','Contacted','Qualified','Proposal Sent','Negotiation','Won','Lost'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={set('priority')}>
                {['High','Medium','Low'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            {user.role === 'admin' && (
              <div>
                <label className="label">Assign To</label>
                <select className="input" value={form.assignedTo} onChange={set('assignedTo')}>
                  <option value="">Unassigned</option>
                  {bdaList.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label">Expected Deal Value (₹)</label>
              <input type="number" className="input" placeholder="500000" value={form.expectedDealValue} onChange={set('expectedDealValue')} />
            </div>
            <div>
              <label className="label">Next Follow-up Date</label>
              <input type="date" className="input" value={form.nextFollowUpDate} onChange={set('nextFollowUpDate')} />
            </div>
            <div>
              <label className="label">Website</label>
              <input className="input" placeholder="https://company.com" value={form.website} onChange={set('website')} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Address</label>
              <input className="input" placeholder="Mumbai, Maharashtra" value={form.address} onChange={set('address')} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Tags (comma-separated)</label>
              <input className="input" placeholder="vip, high-value, manufacturing" value={form.tags} onChange={set('tags')} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
