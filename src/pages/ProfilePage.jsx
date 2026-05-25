import React, { useState } from 'react';
import { updateProfile } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiBriefcase, FiLock, FiSave } from 'react-icons/fi';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', department: user?.department || '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    setLoading(true);
    try {
      const data = { name: form.name, phone: form.phone, department: form.department };
      if (form.password) data.password = form.password;
      const res = await updateProfile(data);
      const updated = { ...user, ...res.data };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setForm(p => ({ ...p, password: '', confirmPassword: '' }));
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account settings</p>
      </div>

      {/* Avatar card */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
          <p className="text-gray-500">{user?.email}</p>
          <span className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
            {user?.role === 'admin' ? '🛡️ Administrator' : '👤 BDA Employee'}
          </span>
        </div>
      </div>

      {/* Edit form */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-5">Edit Information</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5"><FiUser className="text-gray-400 text-xs" /> Full Name</label>
              <input className="input" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><FiMail className="text-gray-400 text-xs" /> Email</label>
              <input className="input" value={user?.email} disabled className="input opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><FiPhone className="text-gray-400 text-xs" /> Phone</label>
              <input className="input" value={form.phone} onChange={set('phone')} placeholder="9876543210" />
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><FiBriefcase className="text-gray-400 text-xs" /> Department</label>
              <input className="input" value={form.department} onChange={set('department')} placeholder="Sales" />
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5"><FiLock /> Change Password</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input" value={form.password} onChange={set('password')} placeholder="Leave blank to keep" minLength={form.password ? 6 : 0} />
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <input type="password" className="input" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat new password" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Account Info</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Account ID', value: user?._id?.slice(-8).toUpperCase() },
            { label: 'Role', value: user?.role?.toUpperCase() },
            { label: 'Last Login', value: user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A' },
            { label: 'Status', value: 'Active' },
          ].map(r => (
            <div key={r.label} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-400">{r.label}</p>
              <p className="font-semibold text-gray-900 dark:text-white mt-0.5">{r.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
