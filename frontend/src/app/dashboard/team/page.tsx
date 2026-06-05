'use client';

import { useEffect, useState } from 'react';
import { teamsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, Users, UserPlus, UserMinus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TeamPage() {
  const [owned, setOwned] = useState<any[]>([]);
  const [joined, setJoined] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [addMemberId, setAddMemberId] = useState('');

  const load = () => {
    teamsApi.listOwned().then((r) => setOwned(r.data || [])).catch(() => {});
    teamsApi.listJoined().then((r) => setJoined(r.data || [])).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const createTeam = async () => {
    if (!newName.trim()) return toast.error('Team name is required');
    try {
      await teamsApi.create({ name: newName });
      toast.success('Team created!');
      setNewName('');
      setShowCreate(false);
      load();
    } catch {
      toast.error('Failed to create team');
    }
  };

  const addMember = async (teamId: string) => {
    if (!addMemberId.trim()) return toast.error('User ID is required');
    try {
      await teamsApi.addMember(teamId, { userId: addMemberId });
      toast.success('Member added!');
      setAddMemberId('');
      load();
    } catch {
      toast.error('Failed to add member');
    }
  };

  const removeMember = async (teamId: string, memberId: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      await teamsApi.removeMember(teamId, memberId);
      toast.success('Member removed');
      load();
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const deleteTeam = async (teamId: string) => {
    if (!confirm('Delete this team? This cannot be undone.')) return;
    try {
      await teamsApi.delete(teamId);
      toast.success('Team deleted');
      load();
    } catch {
      toast.error('Failed to delete team');
    }
  };

  const allTeams = [...owned, ...joined];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Team
        </button>
      </div>

      {/* Create Team Form */}
      {showCreate && (
        <div className="card p-4 mb-6 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Enter team name..."
              onKeyDown={(e) => e.key === 'Enter' && createTeam()}
            />
          </div>
          <button onClick={createTeam} className="btn-primary">Create</button>
        </div>
      )}

      {allTeams.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No teams yet. Create one or join an existing team!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {allTeams.map((team: any) => (
            <div key={team.id} className="card">
              {/* Team Header */}
              <div
                className="p-5 cursor-pointer flex items-start justify-between"
                onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{team.name}</h3>
                    {team.isOwner && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-700">
                        Owner
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {team.memberCount || team.members?.length || 0} members
                    </span>
                    <span>Balance: ${team.balance?.toFixed(2) || '0.00'}</span>
                    <span>Created: {formatDate(team.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {team.isOwner && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTeam(team.id); }}
                      className="p-1 hover:bg-red-50 rounded"
                      title="Delete team"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                  {expandedTeam === team.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Members Section */}
              {expandedTeam === team.id && (
                <div className="border-t border-gray-100 p-5">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Members</h4>

                  {/* Member List */}
                  {(!team.members || team.members.length === 0) ? (
                    <p className="text-sm text-gray-400 mb-3">No members yet.</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {team.members.map((member: any) => (
                        <div key={member.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary-700">
                                {member.username?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium">{member.username || member.user?.username}</div>
                              <div className="text-xs text-gray-400">{member.role || 'member'}</div>
                            </div>
                          </div>
                          {team.isOwner && (
                            <button
                              onClick={() => removeMember(team.id, member.id)}
                              className="p-1 hover:bg-red-50 rounded"
                              title="Remove member"
                            >
                              <UserMinus className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Member (owner only) */}
                  {team.isOwner && (
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Add Member (User ID)</label>
                        <input
                          value={addMemberId}
                          onChange={(e) => setAddMemberId(e.target.value)}
                          className="w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="Enter user ID..."
                          onKeyDown={(e) => e.key === 'Enter' && addMember(team.id)}
                        />
                      </div>
                      <button
                        onClick={() => addMember(team.id)}
                        className="btn-secondary flex items-center gap-1 text-sm"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Add
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
