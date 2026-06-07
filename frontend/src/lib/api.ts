export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://47.82.105.81/api';

import axios from 'axios';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;

export const authApi = {
  register: (data: { username: string; password: string; inviteCode?: string }) => api.post('/auth/register', data),
  login: (data: { username: string; password: string }) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
};

export const apiKeysApi = {
  list: () => api.get('/api-keys'),
  create: (data: { name: string; quota?: number; expiresAt?: string }) => api.post('/api-keys', data),
  delete: (id: string) => api.delete(`/api-keys/${id}`),
  toggle: (id: string) => api.patch(`/api-keys/${id}/toggle`),
};

export const modelsApi = {
  listActive: () => api.get('/models'),
  listAll: () => api.get('/models/all'),
  getById: (id: string) => api.get(`/models/${id}`),
};

export const walletApi = {
  getBalance: () => api.get('/wallet'),
  getLogs: (params?: any) => api.get('/wallet/logs', { params }),
  recharge: (data: { amount: number; payType: string }) => api.post('/wallet/recharge', data),
};

export const ordersApi = {
  list: (params?: any) => api.get('/orders', { params }),
  listAll: (params?: any) => api.get('/orders/all', { params }),
};

export const commissionsApi = {
  list: () => api.get('/commissions'),
  listInvitedBy: () => api.get('/commissions/invited-by'),
  getTotal: () => api.get('/commissions/total'),
};

export const teamsApi = {
  listOwned: () => api.get('/teams'),
  listJoined: () => api.get('/teams/joined'),
  getById: (id: string) => api.get(`/teams/${id}`),
  create: (data: { name: string }) => api.post('/teams', data),
  addMember: (teamId: string, data: { userId: string }) => api.post(`/teams/${teamId}/members`, data),
  removeMember: (teamId: string, memberId: string) => api.delete(`/teams/${teamId}/members/${memberId}`),
  delete: (id: string) => api.delete(`/teams/${id}`),
};

export const requestLogsApi = {
  list: (params?: any) => api.get('/request-logs', { params }),
  getStats: () => api.get('/request-logs/stats'),
};

export const announcementsApi = {
  listPublished: () => api.get('/announcements'),
  listAll: () => api.get('/announcements/all'),
};

export const providersApi = {
  list: () => api.get('/providers'),
  create: (data: any) => api.post('/providers', data),
  update: (id: string, data: any) => api.patch(`/providers/${id}`, data),
  delete: (id: string) => api.delete(`/providers/${id}`),
};

export const adminApi = {
  listUsers: (params?: any) => api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  toggleUserStatus: (id: string) => api.patch(`/admin/users/${id}/toggle`),
  getStats: () => api.get('/admin/stats'),
  listAllApiKeys: (params?: any) => api.get('/admin/api-keys', { params }),
};
