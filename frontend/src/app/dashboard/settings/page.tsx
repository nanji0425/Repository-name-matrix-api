'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { userApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { User, Mail, Image, Lock, Shield, Calendar, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();

  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSaveProfile = async () => {
    try {
      const { data } = await userApi.updateProfile({ avatar, email });
      setUser(data?.user || data || { ...user, avatar, email });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <div className="grid gap-6 max-w-2xl">
        {/* Profile Info */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Profile Information</h3>

          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary-700">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="font-medium text-lg">{user?.username}</div>
              <div className="text-sm text-gray-500">{user?.email}</div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Username</div>
                <div className="text-sm font-medium">{user?.username || '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Role</div>
                <div className="text-sm font-medium capitalize">{user?.role?.toLowerCase() || '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg col-span-full">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Account Created</div>
                <div className="text-sm font-medium">
                  {user?.createdAt ? formatDate(user.createdAt) : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <Image className="w-4 h-4" /> Avatar URL
              </label>
              <input
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="https://example.com/avatar.png"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4" /> Email
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="your@email.com"
              />
            </div>
            <button onClick={handleSaveProfile} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>

        {/* Password Change (UI only) */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Change Password</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Lock className="w-4 h-4" />
            <span>Password change is not available from this panel.</span>
          </div>
          <div className="grid gap-4 max-w-sm opacity-50 pointer-events-none select-none">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 outline-none"
                placeholder="Enter current password"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 outline-none"
                placeholder="Enter new password"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 outline-none"
                placeholder="Confirm new password"
                disabled
              />
            </div>
            <button className="btn-secondary opacity-50 cursor-not-allowed" disabled>
              Update Password
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">Password change will be available in a future update.</p>
        </div>
      </div>
    </div>
  );
}
