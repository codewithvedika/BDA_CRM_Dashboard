import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'bda', phone: '', department: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">B</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Join BDA CRM</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Full Name</label>
                <input type="text" className="input" placeholder="Rahul Sharma" value={form.name} onChange={set('name')} required />
              </div>
              <div className="col-span-2">
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="tel" className="input" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={set('role')}>
                  <option value="bda">BDA Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Department</label>
                <input type="text" className="input" placeholder="Sales" value={form.department} onChange={set('department')} />
              </div>
              <div className="col-span-2">
                <label className="label">Password</label>
                <input type="password" className="input" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
