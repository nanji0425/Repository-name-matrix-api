'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';
import { userApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Calendar, Image, Lock, Save, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';

const copy = {
  zh: {
    title: '账户设置',
    profile: '账户资料',
    avatarAlt: '头像',
    admin: '管理员',
    user: '普通用户',
    username: '用户名',
    role: '角色',
    createdAt: '创建时间',
    avatarUrl: '头像地址',
    saveProfile: '保存资料',
    saved: '资料已保存',
    saveFailed: '保存失败',
    password: '修改密码',
    currentPassword: '当前密码',
    newPassword: '新密码',
    confirmPassword: '确认新密码',
    savePassword: '更新密码',
    passwordChanged: '密码已更新',
    passwordFailed: '修改密码失败',
    passwordTooShort: '新密码至少需要 8 位',
    passwordMismatch: '两次输入的新密码不一致',
  },
  en: {
    title: 'Account Settings',
    profile: 'Account Profile',
    avatarAlt: 'Avatar',
    admin: 'Admin',
    user: 'User',
    username: 'Username',
    role: 'Role',
    createdAt: 'Created',
    avatarUrl: 'Avatar URL',
    saveProfile: 'Save Profile',
    saved: 'Profile saved',
    saveFailed: 'Failed to save',
    password: 'Change Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    savePassword: 'Update Password',
    passwordChanged: 'Password updated',
    passwordFailed: 'Failed to change password',
    passwordTooShort: 'New password must be at least 8 characters',
    passwordMismatch: 'New passwords do not match',
  },
} as const;

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const roleLabel = user?.role === 'ADMIN' ? text.admin : text.user;
  const inputClass = 'w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-950 dark:text-white';

  const handleSaveProfile = async () => {
    try {
      const { data } = await userApi.updateProfile({ avatar });
      setUser(data?.user || data || { ...user, avatar });
      toast.success(text.saved);
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.saveFailed);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error(text.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(text.passwordMismatch);
      return;
    }

    setSavingPassword(true);
    try {
      await userApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(text.passwordChanged);
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.passwordFailed);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-950 dark:text-white">{text.title}</h1>

      <div className="grid max-w-2xl gap-6">
        <div className="card p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <h3 className="mb-4 font-semibold text-slate-950 dark:text-white">{text.profile}</h3>

          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary-100">
              {user?.avatar ? (
                <img src={user.avatar} alt={text.avatarAlt} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary-700">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="text-lg font-medium text-slate-950 dark:text-white">{user?.username}</div>
              <div className="text-sm text-gray-500">{roleLabel}</div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.05]">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">{text.username}</div>
                <div className="text-sm font-medium text-slate-950 dark:text-white">{user?.username || '-'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.05]">
              <Shield className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">{text.role}</div>
                <div className="text-sm font-medium text-slate-950 dark:text-white">{roleLabel}</div>
              </div>
            </div>
            <div className="col-span-full flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.05]">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">{text.createdAt}</div>
                <div className="text-sm font-medium text-slate-950 dark:text-white">{user?.createdAt ? formatDate(user.createdAt) : '-'}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                <Image className="h-4 w-4" /> {text.avatarUrl}
              </span>
              <input value={avatar} onChange={(event) => setAvatar(event.target.value)} className={inputClass} placeholder="https://example.com/avatar.png" />
            </label>
            <button onClick={handleSaveProfile} className="btn-primary flex items-center gap-2">
              <Save className="h-4 w-4" /> {text.saveProfile}
            </button>
          </div>
        </div>

        <div className="card p-6 dark:border-white/10 dark:bg-white/[0.04]">
          <h3 className="mb-4 font-semibold text-slate-950 dark:text-white">{text.password}</h3>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                <Lock className="h-4 w-4" /> {text.currentPassword}
              </span>
              <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} autoComplete="current-password" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.newPassword}</span>
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} autoComplete="new-password" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.confirmPassword}</span>
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} autoComplete="new-password" />
            </label>
            <button onClick={handleChangePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword} className="btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
              <Save className="h-4 w-4" /> {text.savePassword}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
