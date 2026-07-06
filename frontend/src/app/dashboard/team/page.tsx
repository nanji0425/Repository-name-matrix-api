'use client';

import { useEffect, useMemo, useState } from 'react';
import { teamsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { ChevronDown, ChevronUp, Plus, Trash2, UserMinus, UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    title: '团队管理',
    createTeam: '创建团队',
    teamName: '团队名称',
    teamNamePlaceholder: '请输入团队名称',
    create: '创建',
    nameRequired: '请输入团队名称',
    created: '团队已创建',
    createFailed: '创建团队失败',
    userIdRequired: '请输入用户 ID',
    memberAdded: '成员已添加',
    addMemberFailed: '添加成员失败',
    removeConfirm: '确认移除该成员吗？',
    memberRemoved: '成员已移除',
    removeFailed: '移除成员失败',
    deleteConfirm: '确认删除该团队吗？此操作不可撤销。',
    teamDeleted: '团队已删除',
    deleteFailed: '删除团队失败',
    empty: '暂无团队，可先创建一个团队。',
    owner: '负责人',
    people: '人',
    balance: '余额',
    createdAt: '创建时间',
    deleteTeam: '删除团队',
    members: '成员列表',
    noMembers: '暂无成员。',
    removeMember: '移除成员',
    addMemberLabel: '添加成员（用户 ID）',
    userIdPlaceholder: '请输入用户 ID',
    add: '添加',
  },
  en: {
    title: 'Team Management',
    createTeam: 'Create Team',
    teamName: 'Team Name',
    teamNamePlaceholder: 'Enter team name',
    create: 'Create',
    nameRequired: 'Enter a team name',
    created: 'Team created',
    createFailed: 'Failed to create team',
    userIdRequired: 'Enter a user ID',
    memberAdded: 'Member added',
    addMemberFailed: 'Failed to add member',
    removeConfirm: 'Remove this member?',
    memberRemoved: 'Member removed',
    removeFailed: 'Failed to remove member',
    deleteConfirm: 'Delete this team? This cannot be undone.',
    teamDeleted: 'Team deleted',
    deleteFailed: 'Failed to delete team',
    empty: 'No teams yet. Create one first.',
    owner: 'Owner',
    people: 'members',
    balance: 'Balance',
    createdAt: 'Created',
    deleteTeam: 'Delete team',
    members: 'Members',
    noMembers: 'No members yet.',
    removeMember: 'Remove member',
    addMemberLabel: 'Add member (User ID)',
    userIdPlaceholder: 'Enter user ID',
    add: 'Add',
  },
} as const;

export default function TeamPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
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
      toast.error(text.nameRequired);
      return;
    }
    try {
      await teamsApi.create({ name: newName.trim() });
      toast.success(text.created);
      setNewName('');
      setShowCreate(false);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.createFailed);
    }
  };

  const addMember = async (teamId: string) => {
    if (!addMemberId.trim()) {
      toast.error(text.userIdRequired);
      return;
    }
    try {
      await teamsApi.addMember(teamId, { userId: addMemberId.trim() });
      toast.success(text.memberAdded);
      setAddMemberId('');
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.addMemberFailed);
    }
  };

  const removeMember = async (teamId: string, member: any) => {
    const memberUserId = member.userId || member.user?.id || member.id;
    if (!confirm(text.removeConfirm)) return;
    try {
      await teamsApi.removeMember(teamId, memberUserId);
      toast.success(text.memberRemoved);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.removeFailed);
    }
  };

  const deleteTeam = async (teamId: string) => {
    if (!confirm(text.deleteConfirm)) return;
    try {
      await teamsApi.delete(teamId);
      toast.success(text.teamDeleted);
      load();
    } catch (error: any) {
      toast.error(error.response?.data?.message || text.deleteFailed);
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
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{text.title}</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {text.createTeam}
        </button>
      </div>

      {showCreate && (
        <div className="card mb-6 flex flex-col gap-3 p-4 dark:border-white/10 dark:bg-white/[0.04] md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">{text.teamName}</label>
            <input value={newName} onChange={(event) => setNewName(event.target.value)} className="w-full rounded-lg border px-3 py-2 text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" placeholder={text.teamNamePlaceholder} onKeyDown={(event) => event.key === 'Enter' && createTeam()} />
          </div>
          <button onClick={createTeam} className="btn-primary">
            {text.create}
          </button>
        </div>
      )}

      {allTeams.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 dark:border-white/10 dark:bg-white/[0.04]">
          <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <p>{text.empty}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {allTeams.map((team: any) => (
            <div key={team.id} className="card dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex cursor-pointer items-start justify-between p-5" onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-semibold text-slate-950 dark:text-white">{team.name}</h3>
                    {team.isOwner && <span className="rounded bg-primary-50 px-1.5 py-0.5 text-xs font-medium text-primary-700">{text.owner}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {team.memberCount || team.members?.length || 0} {text.people}
                    </span>
                    <span>{text.balance}: ¥{Number(team.balance || 0).toFixed(2)}</span>
                    <span>{text.createdAt}: {team.createdAt ? formatDate(team.createdAt) : '-'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {team.isOwner && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteTeam(team.id);
                      }}
                      className="rounded p-1 hover:bg-red-50 dark:hover:bg-red-500/10"
                      title={text.deleteTeam}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  )}
                  {expandedTeam === team.id ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </div>

              {expandedTeam === team.id && (
                <div className="border-t border-gray-100 p-5 dark:border-white/10">
                  <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-slate-300">{text.members}</h4>

                  {(!team.members || team.members.length === 0) ? (
                    <p className="mb-3 text-sm text-gray-400">{text.noMembers}</p>
                  ) : (
                    <div className="mb-4 space-y-2">
                      {team.members.map((member: any) => {
                        const user = member.user || member;
                        return (
                          <div key={member.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.05]">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100">
                                <span className="text-xs font-medium text-primary-700">{user.username?.charAt(0).toUpperCase() || '?'}</span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-slate-950 dark:text-white">{user.username || user.email || user.id}</div>
                                <div className="text-xs text-gray-400">{member.role || 'MEMBER'}</div>
                              </div>
                            </div>
                            {team.isOwner && member.role !== 'OWNER' && (
                              <button onClick={() => removeMember(team.id, member)} className="rounded p-1 hover:bg-red-50 dark:hover:bg-red-500/10" title={text.removeMember}>
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
                        <label className="mb-1 block text-xs font-medium text-gray-500">{text.addMemberLabel}</label>
                        <input value={addMemberId} onChange={(event) => setAddMemberId(event.target.value)} className="w-full rounded-lg border px-3 py-1.5 text-sm text-slate-950 outline-none focus:ring-2 focus:ring-primary-500 dark:border-white/10 dark:bg-slate-950 dark:text-white" placeholder={text.userIdPlaceholder} onKeyDown={(event) => event.key === 'Enter' && addMember(team.id)} />
                      </div>
                      <button onClick={() => addMember(team.id)} className="btn-secondary flex items-center gap-1 text-sm">
                        <UserPlus className="h-3.5 w-3.5" />
                        {text.add}
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
