import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  FiHome, FiUsers, FiList, FiTrello, FiCheckSquare, FiBarChart2,
  FiLogOut, FiMoon, FiSun, FiMenu, FiX, FiBell, FiUser
} from 'react-icons/fi';

let socket;

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    socket = io('http://localhost:5000');
    socket.emit('join', user._id);
    socket.on('notification', (data) => {
      setNotifications(prev => [data, ...prev.slice(0, 9)]);
      toast(data.message, { icon: '🔔' });
    });
    return () => socket.disconnect();
  }, [user._id]);

  const navItems = [
    { to: '/', icon: <FiHome />, label: 'Dashboard', end: true },
    { to: '/leads', icon: <FiList />, label: 'Leads' },
    { to: '/kanban', icon: <FiTrello />, label: 'Pipeline' },
    { to: '/tasks', icon: <FiCheckSquare />, label: 'Tasks' },
    { to: '/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
    ...(user?.role === 'admin' ? [{ to: '/team', icon: <FiUsers />, label: 'Team' }] : []),
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white text-lg">BDA CRM</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500"><FiX /></button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button onClick={() => navigate('/profile')} className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <FiMenu className="text-xl" />
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={toggleDark} className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              {dark ? <FiSun className="text-xl" /> : <FiMoon className="text-xl" />}
            </button>
            <div className="relative">
              <button className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <FiBell className="text-xl" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            </div>
            <button onClick={() => navigate('/profile')} className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              <FiUser className="text-xl" />
            </button>
            <button onClick={logout} className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
              <FiLogOut className="text-xl" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
