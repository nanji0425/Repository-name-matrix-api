'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Fingerprint, Image, KeyRound, Lock, Shield, Save, ToggleLeft, User, UserCircle2 } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { useAuthStore } from '@/stores/authStore';
import { formatDate } from '@/lib/utils';
import { userApi } from '@/lib/api';

const cards = [
  { key: 'chat', title: '聊天区域', desc: '搜索和聊天功能', defaultChecked: true },
  { key: 'playground', title: '游乐场', desc: 'AI 模型测试环境', defaultChecked: true },
  { key: 'chatlogs', title: '聊天', desc: '聊天会话管理', defaultChecked: true },
  { key: 'dashboard', title: '控制台区域', desc: '数据管理和日志', defaultChecked: true },
  { key: 'metrics', title: '数据看板', desc: '系统数据统计', defaultChecked: true },
  { key: 'keys', title: '令牌管理', desc: 'API 令牌管理', defaultChecked: true },
  { key: 'usage', title: '使用日志', desc: 'API 使用记录', defaultChecked: true },
  { key: 'tasks', title: '任务日志', desc: '系统任务记录', defaultChecked: true },
  { key: 'profile', title: '个人中心区域', desc: '用户个人功能', defaultChecked: true },
  { key: 'wallet', title: '钱包管理', desc: '余额充值管理', defaultChecked: true },
  { key: 'account', title: '个人设置', desc: '个人信息设置', defaultChecked: true },
];

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(cards.map((card) => [card.key, card.defaultChecked])),
  );

  const roleLabel = useMemo(() => (user?.role === 'ADMIN' ? '管理员' : '用户'), [user?.role]);

  const handleSaveProfile = async () => {
    try {
      const { data } = await userApi.updateProfile({ avatar });
      setUser(data?.user || data || { ...user, avatar });
      toast.success('资料已保存');
    } catch (error: any) {
      toast.error(error.response?.data?.message || '保存失败');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('新密码至少需要 8 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }

    setSavingPassword(true);
    try {
      await userApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('密码已更新');
    } catch (error: any) {
      toast.error(error.response?.data?.message || '修改密码失败');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <ConsolePage className="pb-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-4">
          <div className="console-card p-0">
            <div className="flex items-center gap-4 border-b border-[#f3d9e5] px-6 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] text-2xl font-bold text-white">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-2xl font-bold text-[#231f27]">{user?.username || 'aming'}</div>
                  <span className="rounded-full bg-[#f8e6ef] px-3 py-1 text-xs font-semibold text-[#d36b9a]">{roleLabel}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#8f7384]">
                  <span className="inline-flex items-center gap-1"><UserCircle2 className="h-4 w-4" /> @{user?.username || 'aming'}</span>
                  <span className="inline-flex items-center gap-1">3315419516@qq.com</span>
                  <span className="inline-flex items-center gap-1">default</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-b border-[#f3d9e5] px-6 py-5 md:grid-cols-3">
              <div className="rounded-[22px] bg-[#fff7fb] p-4">
                <div className="text-xs text-[#ad8fa0]">当前余额</div>
                <div className="mt-1 text-2xl font-bold text-[#231f27]">${Number(user?.balance || 0).toFixed(2)}</div>
              </div>
              <div className="rounded-[22px] bg-[#fff7fb] p-4">
                <div className="text-xs text-[#ad8fa0]">总用量</div>
                <div className="mt-1 text-2xl font-bold text-[#231f27]">$792.72</div>
              </div>
              <div className="rounded-[22px] bg-[#fff7fb] p-4">
                <div className="text-xs text-[#ad8fa0]">API 请求</div>
                <div className="mt-1 text-2xl font-bold text-[#231f27]">5613</div>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-5">
              <div className="rounded-[26px] border border-[#f1d6e2] bg-white/90 p-5">
                <div className="flex items-center gap-2 text-[#d36b9a]">
                  <User className="h-4 w-4" />
                  <div className="font-bold">设置</div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <button className="console-button-white justify-start gap-2 bg-white px-5 text-sm font-semibold text-[#231f27]">
                    <User className="h-4 w-4" />
                    账户绑定
                  </button>
                  <button className="console-button-white justify-start gap-2 bg-[#fff7fb] px-5 text-sm font-semibold text-[#8f7384]">
                    <ToggleLeft className="h-4 w-4" />
                    设置与偏好
                  </button>
                </div>
                <div className="mt-4 rounded-[22px] border border-[#f3d9e5] bg-[#fffafd] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#231f27]">邮箱</div>
                      <div className="text-xs text-[#8f7384]">3315419516@qq.com</div>
                    </div>
                    <button className="console-button-white h-9 px-3 text-xs">更改</button>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-[#f1d6e2] bg-white/90 p-5">
                <div className="flex items-center gap-2 text-[#d36b9a]">
                  <Image className="h-4 w-4" />
                  <div className="font-bold">语言偏好</div>
                </div>
                <div className="mt-4 rounded-[22px] border border-[#f3d9e5] bg-[#fffafd] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-[#231f27]">界面语言</div>
                      <div className="text-xs text-[#8f7384]">语言偏好会同步到登录的所有设备。</div>
                    </div>
                    <div className="rounded-full border border-[#f1d6e2] bg-white px-4 py-2 text-sm text-[#6b5363]">简体中文</div>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-[#f1d6e2] bg-white/90 p-5">
                <div className="flex items-center gap-2 text-[#d36b9a]">
                  <Shield className="h-4 w-4" />
                  <div className="font-bold">安全</div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <button className="rounded-[22px] border border-[#f3d9e5] bg-[#fffafd] p-4 text-center">
                    <Lock className="mx-auto h-5 w-5 text-[#d36b9a]" />
                    <div className="mt-2 text-sm font-semibold text-[#231f27]">更改密码</div>
                    <div className="mt-1 text-xs text-[#8f7384]">更新您的密码以确保账户安全</div>
                  </button>
                  <button className="rounded-[22px] border border-[#f3d9e5] bg-[#fffafd] p-4 text-center">
                    <KeyRound className="mx-auto h-5 w-5 text-[#d36b9a]" />
                    <div className="mt-2 text-sm font-semibold text-[#231f27]">访问令牌</div>
                    <div className="mt-1 text-xs text-[#8f7384]">生成和管理您的 API 访问令牌</div>
                  </button>
                  <button className="rounded-[22px] border border-[#f3b9c9] bg-[#fff7fb] p-4 text-center">
                    <Shield className="mx-auto h-5 w-5 text-[#fb7185]" />
                    <div className="mt-2 text-sm font-semibold text-[#231f27]">删除账户</div>
                    <div className="mt-1 text-xs text-[#8f7384]">永久删除您的账户和所有数据</div>
                  </button>
                </div>
              </div>

              <div className="rounded-[26px] border border-[#f1d6e2] bg-white/90 p-5">
                <div className="flex items-center gap-2 text-[#d36b9a]">
                  <Fingerprint className="h-4 w-4" />
                  <div className="font-bold">Passkey 登录</div>
                </div>
                <div className="mt-3 rounded-[22px] border border-[#f3d9e5] bg-[#fffafd] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-[#231f27]">通行密钥认证 · 已禁用</div>
                      <div className="text-xs text-[#8f7384]">上次使用时间：暂未使用</div>
                    </div>
                    <button className="console-button-white h-9 px-4 text-xs">启用 Passkey</button>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-[#f1d6e2] bg-white/90 p-5">
                <div className="flex items-center gap-2 text-[#d36b9a]">
                  <Shield className="h-4 w-4" />
                  <div className="font-bold">两步验证</div>
                </div>
                <div className="mt-3 rounded-[22px] border border-[#f3d9e5] bg-[#fffafd] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-[#231f27]">两步验证 · 已禁用</div>
                      <div className="text-xs text-[#8f7384]">为您的账户添加额外的安全层</div>
                    </div>
                    <button className="console-button-white h-9 px-4 text-xs">启用</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="console-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-[#231f27]">左侧边栏个人设置</div>
                <div className="text-sm text-[#9b8292]">个性化设置左侧边栏的显示内容</div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {cards.map((card) => (
                <div key={card.key} className="rounded-[22px] border border-[#f3d9e5] bg-white/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#231f27]">{card.title}</div>
                      <div className="text-xs text-[#8f7384]">{card.desc}</div>
                    </div>
                    <button
                      onClick={() => setPreferences((current) => ({ ...current, [card.key]: !current[card.key] }))}
                      className={`h-7 w-12 rounded-full p-1 transition ${preferences[card.key] ? 'bg-[#f472b6]' : 'bg-[#ead9e2]'}`}
                      type="button"
                    >
                      <span className={`block h-5 w-5 rounded-full bg-white transition ${preferences[card.key] ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="console-button-white px-4 text-sm">重置为默认</button>
              <button className="console-button-white bg-gradient-to-r from-[#f472b6] to-[#ec4899] px-4 text-sm text-white">保存更改</button>
            </div>
          </div>

          <div className="console-card p-5">
            <div className="flex items-center gap-2 text-[#d36b9a]">
              <Calendar className="h-4 w-4" />
              <div className="font-bold">账户资料</div>
            </div>
            <div className="mt-4 rounded-[22px] border border-[#f3d9e5] bg-white/80 p-4 text-sm text-[#6b5363]">
              <div>用户名：{user?.username || 'aming'}</div>
              <div className="mt-1">角色：{roleLabel}</div>
              <div className="mt-1">创建时间：{user?.createdAt ? formatDate(user.createdAt) : '-'}</div>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <label className="block">
                <span className="mb-1 flex items-center gap-1.5 text-sm font-medium text-[#6b5363]">
                  <Image className="h-4 w-4" /> 头像地址
                </span>
                <input value={avatar} onChange={(event) => setAvatar(event.target.value)} className="console-input w-full" placeholder="https://example.com/avatar.png" />
              </label>
              <button onClick={handleSaveProfile} className="console-button-white flex items-center gap-2">
                <Save className="h-4 w-4" /> 保存资料
              </button>
            </div>
          </div>

          <div className="console-card p-5">
            <div className="flex items-center gap-2 text-[#d36b9a]">
              <Lock className="h-4 w-4" />
              <div className="font-bold">修改密码</div>
            </div>
            <div className="mt-4 space-y-3">
              <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="console-input w-full" placeholder="当前密码" />
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="console-input w-full" placeholder="新密码" />
              <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="console-input w-full" placeholder="确认新密码" />
              <button onClick={handleChangePassword} disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword} className="console-button-white flex w-full items-center justify-center gap-2 disabled:opacity-60">
                <Save className="h-4 w-4" /> {savingPassword ? '更新中...' : '更新密码'}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </ConsolePage>
  );
}
