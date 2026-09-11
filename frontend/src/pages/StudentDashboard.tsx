import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { ResearchArea, StudentResearchInterest, SupervisionRequest, ProjectMode, GroupMember } from '../types';
import ResearchAreaSelector from '../components/ResearchAreaSelector';
import { Sparkles, Save, CheckCircle2, ArrowRight, BookOpen, Search, User, Users, Plus, Trash2, Clock, CheckCircle, XCircle, ClipboardList } from 'lucide-react';

export default function StudentDashboard() {
  const { profile, refreshProfile } = useAuth();
  const [areas, setAreas] = useState<ResearchArea[]>([]);
  const [interests, setInterests] = useState<StudentResearchInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({});

  const [projectMode, setProjectMode] = useState<ProjectMode>(profile?.project_mode ?? 'solo');
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>(profile?.group_members ?? []);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(false);

  const [myRequests, setMyRequests] = useState<SupervisionRequest[]>([]);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [areasData, interestsData, requestsData] = await Promise.all([
        api.getResearchAreas(),
        api.getStudentInterests(profile.id),
        api.getMyRequests(),
      ]);
      setAreas(areasData);
      setInterests(interestsData);
      setSelectedIds(interestsData.map((i) => i.research_area_id));
      setWeights(Object.fromEntries(interestsData.map((i) => [i.research_area_id, i.weight])));
      setMyRequests(requestsData);
      setProjectMode(profile.project_mode ?? 'solo');
      setGroupMembers(profile.group_members ?? []);
    } catch (err) {
      console.error('Failed to load:', (err as Error).message);
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = (areaId: string) => {
    setSelectedIds((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId],
    );
    setWeights((prev) => {
      const next = { ...prev };
      if (!(areaId in next)) next[areaId] = 3;
      return next;
    });
  };

  const handleWeightChange = (areaId: string, w: number) => {
    setWeights((prev) => ({ ...prev, [areaId]: w }));
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSavedMsg(false);
    try {
      const updated = await api.saveStudentInterests(
        selectedIds.map((id) => ({ research_area_id: id, weight: weights[id] ?? 3 })),
      );
      setInterests(updated);
      setSelectedIds(updated.map((i) => i.research_area_id));
      setWeights(Object.fromEntries(updated.map((i) => [i.research_area_id, i.weight])));
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (err) {
      console.error('Save failed:', (err as Error).message);
    }
    setSaving(false);
  };

  const addGroupMember = () => {
    setGroupMembers((prev) => [...prev, { name: '', email: '' }]);
  };

  const updateGroupMember = (index: number, field: keyof GroupMember, value: string) => {
    setGroupMembers((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const removeGroupMember = (index: number) => {
    setGroupMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(false);
    try {
      await api.updateMe({
        project_mode: projectMode,
        group_members: projectMode === 'group' ? groupMembers.filter((m) => m.name.trim() || m.email.trim()) : [],
      });
      await refreshProfile();
      setProfileMsg(true);
      setTimeout(() => setProfileMsg(false), 3000);
    } catch (err) {
      console.error('Save failed:', (err as Error).message);
    }
    setSavingProfile(false);
  };

  const pendingCount = myRequests.filter((r) => r.status === 'pending').length;
  const approvedCount = myRequests.filter((r) => r.status === 'approved').length;
  const deniedCount = myRequests.filter((r) => r.status === 'denied').length;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton mt-3 h-5 w-96" />
        <div className="skeleton mt-8 h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-neutral-900">
          Welcome, {profile?.full_name.split(' ')[0]}
        </h1>
        <p className="mt-2 text-neutral-600">
          Select the research areas you're interested in and rank them by priority. We'll use these to recommend supervisors.
        </p>
      </div>

      {/* Request status summary */}
      {myRequests.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4 animate-slide-up">
          <RequestStatusCard icon={<Clock className="h-5 w-5" />} label="Pending" count={pendingCount} color="amber" />
          <RequestStatusCard icon={<CheckCircle className="h-5 w-5" />} label="Approved" count={approvedCount} color="emerald" />
          <RequestStatusCard icon={<XCircle className="h-5 w-5" />} label="Denied" count={deniedCount} color="rose" />
        </div>
      )}

      {/* Project mode & group members */}
      <div className="mt-6 card p-6 animate-slide-up shadow-soft">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-neutral-900">
          <Users className="h-5 w-5 text-primary-600" /> Project mode
        </h2>
        <p className="mt-1 text-sm text-neutral-500">Are you working solo or as part of a group? This information is included when you apply for a supervisor.</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => setProjectMode('solo')}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
              projectMode === 'solo'
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100'
                : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${projectMode === 'solo' ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-sm font-bold ${projectMode === 'solo' ? 'text-primary-700' : 'text-neutral-800'}`}>Solo</p>
              <p className="text-xs text-neutral-500">Individual project</p>
            </div>
          </button>

          <button
            onClick={() => setProjectMode('group')}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 ${
              projectMode === 'group'
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100'
                : 'border-neutral-200 bg-white hover:border-neutral-300'
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${projectMode === 'group' ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-sm font-bold ${projectMode === 'group' ? 'text-primary-700' : 'text-neutral-800'}`}>Group</p>
              <p className="text-xs text-neutral-500">Team project</p>
            </div>
          </button>
        </div>

        {projectMode === 'group' && (
          <div className="mt-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-700">Group members</h3>
              <button onClick={addGroupMember} className="btn-secondary !py-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add member
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {groupMembers.map((member, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => updateGroupMember(index, 'name', e.target.value)}
                    className="input flex-1"
                    placeholder="Member name"
                  />
                  <input
                    type="email"
                    value={member.email}
                    onChange={(e) => updateGroupMember(index, 'email', e.target.value)}
                    className="input flex-1"
                    placeholder="Member email / student ID"
                  />
                  <button
                    onClick={() => removeGroupMember(index)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {groupMembers.length === 0 && (
                <p className="rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-400">No group members added yet. Click "Add member" to add your teammates.</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary">
            <Save className="h-4 w-4" /> {savingProfile ? 'Saving…' : 'Save project mode'}
          </button>
          {profileMsg && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 animate-fade-in">
              <CheckCircle2 className="h-4 w-4" /> Saved!
            </span>
          )}
        </div>
      </div>

      {/* Research interests */}
      <div className="mt-6 card p-6 animate-slide-up shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-neutral-900">
            <BookOpen className="h-5 w-5 text-primary-600" />
            Your research interests
          </h2>
          {selectedIds.length > 0 && (
            <span className="badge bg-primary-50 text-primary-700">{selectedIds.length} selected</span>
          )}
        </div>

        <ResearchAreaSelector
          areas={areas}
          selectedIds={selectedIds}
          weights={weights}
          onToggle={handleToggle}
          onWeightChange={handleWeightChange}
        />

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            {savedMsg ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 animate-fade-in">
                <CheckCircle2 className="h-4 w-4" /> Saved! Your matches have been updated.
              </span>
            ) : (
              <span className="text-sm text-neutral-500">
                {selectedIds.length === 0 ? 'Select at least one area to get recommendations.' : 'Changes are saved when you click Save.'}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/supervisions" className="btn-secondary">
              <ClipboardList className="h-4 w-4" /> Supervisions
            </Link>
            <Link to="/my-requests" className="btn-secondary">
              <ClipboardList className="h-4 w-4" /> My Requests
            </Link>
            <Link to="/search" className="btn-secondary">
              <Search className="h-4 w-4" /> Topic search
            </Link>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save interests'}
            </button>
            {selectedIds.length > 0 && (
              <Link to="/recommendations" className="btn-accent">
                <Sparkles className="h-4 w-4" /> View matches <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {interests.length > 0 && (
        <div className="mt-6 card p-6 animate-slide-up">
          <h2 className="font-display text-lg font-bold text-neutral-900">Your current interests</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {interests
              .slice()
              .sort((a, b) => b.weight - a.weight)
              .map((i) => (
                <span key={i.id} className="badge bg-primary-50 py-1.5 pl-3 pr-2 text-primary-700">
                  {i.research_area?.name}
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                    {i.weight}
                  </span>
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RequestStatusCard({ icon, label, count, color }: {
  icon: React.ReactNode; label: string; count: number; color: 'amber' | 'emerald' | 'rose';
}) {
  const styles = {
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
  };
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${styles[color]}`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/60">{icon}</div>
      <div>
        <p className="font-display text-2xl font-bold">{count}</p>
        <p className="text-xs font-semibold">{label}</p>
      </div>
    </div>
  );
}
