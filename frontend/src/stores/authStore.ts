import { create } from 'zustand';
import { authApi, userApi } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email?: string | null;
  role: string | number;
  status?: string | number | null;
  balance: number;
  avatar?: string;
  inviteCode?: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  login: (username: string, password: string) => Promise<User>;
  register: (data: { username: string; password: string; inviteCode?: string }) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  hydrateAuth: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  hasHydrated: false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login({ username, password });
      localStorage.setItem('access_token', data.accessToken);
      set({ user: data.user, token: data.accessToken, isAuthenticated: true, isLoading: false });
      return data.user;
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || '登录失败');
    }
  },

  register: async (registerData) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.register(registerData);
      localStorage.setItem('access_token', data.accessToken);
      set({ user: data.user, token: data.accessToken, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || '注册失败');
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/';
  },

  fetchProfile: async () => {
    try {
      const { data } = await userApi.getProfile();
      set({ user: data, isAuthenticated: true });
    } catch {
      localStorage.removeItem('access_token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  },

  hydrateAuth: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    set({ token, isAuthenticated: !!token, hasHydrated: true });
  },

  setUser: (user) => set({ user }),
}));

