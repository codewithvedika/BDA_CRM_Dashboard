import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiMail, FiPhone, FiShield, FiUser } from 'react-icons/fi';

export default function TeamPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'bda', phone: '', department: '', isActive: true });

  const fetchUsers = async () => {
    setLoading(true);
    try { const res = await getUsers(); setUsers(res.data); }
    catch { toast.error('Failed to load team'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '', department: user.department || '', isActive: user.isActive });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'bda', phone: '', department: '', isActive: true });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      if (editUser) { await updateUser(editUser._id, data); toast.success('User updated!'); }
      else { await createUser(data); toast.success('User created!'); }
      setShowModal(false);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await deleteUser(id); toast.success('User deleted'); fetchUsers(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <div className="space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} team members</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><FiPlus /> Add Member</button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: users.length, color: 'text-blue-600' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'text-purple-600' },
          { label: 'BDA Employees', value: users.filter(u => u.role === 'bda').length, color: 'text-green-600' },
          { label: 'Active', value: users.filter(u => u.isActive).length, color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Team table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {['Member', 'Role', 'Contact', 'Department', 'Leads', 'Performance', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : users.map(user => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {user.role === 'admin' ? <FiShield className="text-xs" /> : <FiUser className="text-xs" />}
                      {user.role === 'admin' ? 'Admin' : 'BDA'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {user.phone && <div className="flex items-center gap-1 text-xs text-gray-500"><FiPhone className="text-xs" />{user.phone}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.department || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{user.assignedLeads || 0}</p>
                      <p className="text-xs text-green-600">{user.wonLeads || 0} won</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 w-20">
                        <div className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${user.assignedLeads ? Math.min((user.wonLeads / user.assignedLeads) * 100, 100) : 0}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">
                        {user.assignedLeads ? ((user.wonLeads / user.assignedLeads) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(user)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-blue-600"><FiEdit2 /></button>
                      <button onClick={() => handleDelete(user._id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-gray-500 hover:text-red-500"><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editUser ? 'Edit Member' : 'Add Team Member'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><FiX /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Full Name *</label>
                  <input className="input" placeholder="Rahul Sharma" value={form.name} onChange={set('name')} required />
                </div>
                <div className="col-span-2">
                  <label className="label">Email *</label>
                  <input type="email" className="input" placeholder="rahul@company.com" value={form.email} onChange={set('email')} required />
                </div>
                <div>
                  <label className="label">Password {editUser && '(leave blank to keep)'}</label>
                  <input type="password" className="input" placeholder={editUser ? '••••••' : 'Min. 6 chars'} value={form.password} onChange={set('password')} minLength={editUser ? 0 : 6} required={!editUser} />
                </div>
                <div>
                  <label className="label">Role</label>
                  <select className="input" value={form.role} onChange={set('role')}>
                    <option value="bda">BDA Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
                </div>
                <div>
                  <label className="label">Department</label>
                  <input className="input" placeholder="Sales" value={form.department} onChange={set('department')} />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <input type="checkbox" id="isActive" checked={form.isActive} onChange={set('isActive')} className="w-4 h-4 rounded text-blue-600" />
                  <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Account Active</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" className="btn-primary flex-1 justify-center">{editUser ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
