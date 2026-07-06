'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { userApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Calendar, Image, Lock, Save, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const handleSaveProfile = async () => {
    try {
      const { data } = await userApi.updateProfile({ avatar });
      setUser(data?.user || data || { ...user, avatar });
      toast.success('资料已保存');
    } catch (error: any) {
      toast.error(error.response?.data?.message || '保存失败');
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">账户设置</h1>

      <div className="grid max-w-2xl gap-6">
        <div className="card p-6">
          <h3 className="mb-4 font-semibold">账户资料</h3>

          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              {user?.avatar ? (
                <img src={user.avatar} alt="头像" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary-700">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="text-lg font-medium">{user?.username}</div>
              <div className="text-sm text-gray-500">{user?.role === 'ADMIN' ? '管理员' : '普通用户'}</div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">用户名</div>
                <div className="text-sm font-medium">{user?.username || '-'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Shield className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">角色</div>
                <div className="text-sm font-medium">{user?.role === 'ADMIN' ? '管理员' : '普通用户'}</div>
              </div>
            </div>
            <div className="col-span-full flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">创建时间</div>
                <div className="text-sm font-medium">{user?.createdAt ? formatDate(user.createdAt) : '-'}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <Image className="h-4 w-4" /> 头像地址
              </label>
              <input value={avatar} onChange={(event) => setAvatar(event.target.value)} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="https://example.com/avatar.png" />
            </div>
            <button onClick={handleSaveProfile} className="btn-primary flex items-center gap-2">
              <Save className="h-4 w-4" /> 保存资料
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 font-semibold">修改密码</h3>
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
            <Lock className="h-4 w-4" />
            <span>当前版本暂不支持在控制台修改密码，请联系管理员重置。</span>
          </div>
        </div>
      </div>
    </div>
  );
}
