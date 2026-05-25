import axios from 'axios';

const API = axios.create({ baseURL: 'https://bda-crm-api-tw9j.onrender.com/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);

// Leads
export const getLeads = (params) => API.get('/leads', { params });
export const getKanbanLeads = () => API.get('/leads/kanban');
export const getLead = (id) => API.get(`/leads/${id}`);
export const createLead = (data) => API.post('/leads', data);
export const updateLead = (id, data) => API.put(`/leads/${id}`, data);
export const deleteLead = (id) => API.delete(`/leads/${id}`);
export const updateKanbanPositions = (data) => API.put('/leads/kanban/positions', data);

// Tasks
export const getTasks = (params) => API.get('/tasks', { params });
export const createTask = (data) => API.post('/tasks', data);
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);

// Notes
export const getNotes = (leadId) => API.get(`/notes/lead/${leadId}`);
export const createNote = (leadId, data) => API.post(`/notes/lead/${leadId}`, data);
export const deleteNote = (id) => API.delete(`/notes/${id}`);

// Users
export const getUsers = () => API.get('/users');
export const getBDAList = () => API.get('/users/bda-list');
export const createUser = (data) => API.post('/users', data);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// Analytics
export const getDashboardStats = () => API.get('/analytics/dashboard');
export const getMonthlyStats = () => API.get('/analytics/monthly');
export const getTeamPerformance = () => API.get('/analytics/team-performance');
export const getLeadSources = () => API.get('/analytics/lead-sources');
export const getPipelineData = () => API.get('/analytics/pipeline');

// Activities
export const getActivities = (params) => API.get('/activities', { params });

// Email
export const sendEmail = (data) => API.post('/email/send', data);

export default API;
