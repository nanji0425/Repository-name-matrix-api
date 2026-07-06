'use client';

import { useEffect, useMemo, useState } from 'react';
import { teamsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ChevronDown, ChevronUp, Plus, Trash2, UserMinus, UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const [owned, setOwned] = useState<any[]>([]);
  const [joined, setJoined] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [addMemberId, setAddMemberId] = useState('');

  const load = () => {
    teamsApi.listOwned().then((response) => setOwned(response.data || [])).catch(() => {});
    teamsApi.listJoined().then((response) => setJoined(response.data || [])).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const createTeam = async () => {
    if (!newName.trim()) {
      toast.error('请输入团队名称');
      return;
    }
    try {
      await teamsApi.create({ name: newName.trim() });
      toast.success('团队已创建');
      setNewName('');
      setShowCreate(false);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '创建团队失败');
    }
  };

  const addMember = async (teamId: string) => {
    if (!addMemberId.trim()) {
      toast.error('请输入用户 ID');
      return;
    }
    try {
      await teamsApi.addMember(teamId, { userId: addMemberId.trim() });
      toast.success('成员已添加');
      setAddMemberId('');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '添加成员失败');
    }
  };

  const removeMember = async (teamId: string, member: any) => {
    const memberUserId = member.userId || member.user?.id || member.id;
    if (!confirm('确认移除该成员吗？')) return;
    try {
      await teamsApi.removeMember(teamId, memberUserId);
      toast.success('成员已移除');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '移除成员失败');
    }
  };

  const deleteTeam = async (teamId: string) => {
    if (!confirm('确认删除该团队吗？此操作不可撤销。')) return;
    try {
      await teamsApi.delete(teamId);
      toast.success('团队已删除');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '删除团队失败');
    }
  };

  const allTeams = useMemo(() => {
    const ownedIds = new Set(owned.map((team) => team.id));
    return [
      ...owned.map((team) => ({ ...team, isOwner: true })),
      ...joined.filter((team) => !ownedIds.has(team.id)).map((team) => ({ ...team, isOwner: false })),
    ];
  }, [owned, joined]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">团队管理</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          创建团队
        </button>
      </div>

      {showCreate && (
        <div className="card mb-6 flex items-end gap-3 p-4">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">团队名称</label>
            <input value={newName} onChange={(event) => setNewName(event.target.value)} className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500" placeholder="请输入团队名称" onKeyDown={(event) => event.key === 'Enter' && createTeam()} />
          </div>
          <button onClick={createTeam} className="btn-primary">
            创建
          </button>
        </div>
      )}

      {allTeams.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p>暂无团队，可先创建一个团队。</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {allTeams.map((team: any) => (
            <div key={team.id} className="card">
              <div className="flex cursor-pointer items-start justify-between p-5" onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-semibold">{team.name}</h3>
                    {team.isOwner && <span className="rounded bg-primary-50 px-1.5 py-0.5 text-xs font-medium text-primary-700">负责人</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {team.memberCount || team.members?.length || 0} 人
                    </span>
                    <span>余额：￥{Number(team.balance || 0).toFixed(2)}</span>
                    <span>创建时间：{team.createdAt ? formatDate(team.createdAt) : '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {team.isOwner && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteTeam(team.id);
                      }}
                      className="rounded p-1 hover:bg-red-50"
                      title="删除团队"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  )}
                  {expandedTeam === team.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </div>

              {expandedTeam === team.id && (
                <div className="border-t border-gray-100 p-5">
                  <h4 className="mb-3 text-sm font-medium text-gray-700">成员列表</h4>

                  {(!team.members || team.members.length === 0) ? (
                    <p className="mb-3 text-sm text-gray-400">暂无成员。</p>
                  ) : (
                    <div className="mb-4 space-y-2">
                      {team.members.map((member: any) => {
                        const user = member.user || member;
                        return (
                          <div key={member.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100">
                                <span className="text-xs font-medium text-primary-700">{user.username?.charAt(0).toUpperCase() || '?'}</span>
                              </div>
                              <div>
                                <div className="text-sm font-medium">{user.username || user.email || user.id}</div>
                                <div className="text-xs text-gray-400">{member.role || 'MEMBER'}</div>
                              </div>
                            </div>
                            {team.isOwner && member.role !== 'OWNER' && (
                              <button onClick={() => removeMember(team.id, member)} className="rounded p-1 hover:bg-red-50" title="移除成员">
                                <UserMinus className="h-3.5 w-3.5 text-red-400" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {team.isOwner && (
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium text-gray-500">添加成员（用户 ID）</label>
                        <input value={addMemberId} onChange={(event) => setAddMemberId(event.target.value)} className="w-full rounded-lg border px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="请输入用户 ID" onKeyDown={(event) => event.key === 'Enter' && addMember(team.id)} />
                      </div>
                      <button onClick={() => addMember(team.id)} className="btn-secondary flex items-center gap-1 text-sm">
                        <UserPlus className="h-3.5 w-3.5" />
                        添加
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
