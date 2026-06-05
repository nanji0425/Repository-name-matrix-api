import { create } from 'zustand';
import { authApi, userApi } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  balance: number;
  avatar?: string;
  inviteCode?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; inviteCode?: string }) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,
  isLoading: false,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('access_token') : false,

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authApi.login({ username, password });
      localStorage.setItem('access_token', data.accessToken);
      set({ user: data.user, token: data.accessToken, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.message || 'Login failed');
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
      throw new Error(error.response?.data?.message || 'Registration failed');
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
      set({ user: data });
    } catch {
      // ignore
    }
  },

  setUser: (user) => set({ user }),
}));
