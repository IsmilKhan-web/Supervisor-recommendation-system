import { useEffect, useState, useMemo, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { FacultyWithDetails, SupervisionRequest } from '../types';
import { getInitials, avatarColorFor } from '../lib/utils';
import { Search, X, Users as Users2, Building as Building2, Clock, FileText, BookOpen, ChevronDown, ChevronUp, Sparkles, Send, CircleCheck as CheckCircle2, Circle as XCircle, CircleAlert as AlertCircle, Loader as Loader2, X as XIcon } from 'lucide-react';

export default function SupervisionsList() {
  const { profile } = useAuth();
  const [faculty, setFaculty] = useState<FacultyWithDetails[]>([]);
  const [myRequests, setMyRequests] = useState<SupervisionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [requestModal Faculty, setRequestModalFaculty] = useState<FacultyWithDetails | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [facultyData, requestsData] = await Promise.all([
        api.getFaculty(),
        api.getMyRequests(),
      ]);
      setFaculty(facultyData);
      setMyRequests(requestsData);
    } catch (err) {
      console.error('Failed to load:', (err as Error).message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faculty.filter((f) => {
      const matchesQuery = !q ||
        f.full_name.toLowerCase().includes(q) ||
        (f.department ?? '').toLowerCase().includes(q) ||
        f.research_areas.some((r) => r.research_area?.name.toLowerCase().includes(q)) ||
        f.research_keywords.some((k) => k.toLowerCase().includes(q));
      const available = f.slot ? Math.max(0, f.slot.total_slots - f.slot.taken_slots) : 0;
      const matchesAvail = availabilityFilter === 'all' || available > 0;
      return matchesQuery && matchesAvail;
    });
  }, [faculty, query, availabilityFilter]);

  const getRequestStatus = (facultyId: string): SupervisionRequest | null => {
    return myRequests.find((r) => r.faculty_id === facultyId) ?? null;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton mt-3 h-5 w-96" />
        <div className="skeleton mt-6 h-12 w-full" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-56" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-neutral-900">List of Supervisions</h1>
        <p className="mt-2 text-neutral-600">
          Browse all available supervisors, their domain expertise, and open slot counts. Apply for a supervision slot directly.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, department, research area, or keyword…"
            className="input pl-10"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(['all', 'available'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setAvailabilityFilter(opt)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200 ${
                availabilityFilter === opt ? 'bg-primary-600 text-white shadow-sm' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {opt === 'all' ? 'All' : 'Has open slots'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((f, i) => {
          const available = f.slot ? Math.max(0, f.slot.total_slots - f.slot.taken_slots) : 0;
          const total = f.slot?.total_slots ?? 0;
          const existingRequest = getRequestStatus(f.id);
          return (
            <div key={f.id} className={`card-hover group p-5 animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
              <div className="flex items-start gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${avatarColorFor(f.id)}`}>
                  {getInitials(f.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display font-bold text-neutral-900">{f.full_name}</h3>
                  {f.department && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                      <Building2 className="h-3 w-3" /> {f.department}
                    </p>
                  )}
                  {f.office_hours && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                      <Clock className="h-3 w-3" /> {f.office_hours}
                    </p>
                  )}
                </div>
              </div>

              {f.bio && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-neutral-600">{f.bio}</p>}

              {f.research_keywords.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {f.research_keywords.slice(0, 5).map((k) => (
                    <span key={k} className="badge bg-accent-50 text-accent-700 text-[11px]">{k}</span>
                  ))}
                  {f.research_keywords.length > 5 && (
                    <span className="badge bg-neutral-100 text-neutral-500 text-[11px]">+{f.research_keywords.length - 5}</span>
                  )}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {f.research_areas.slice(0, 4).map((r) => (
                  <span key={r.id} className="badge bg-primary-50 text-primary-700">
                    {r.research_area?.name}
                  </span>
                ))}
                {f.research_areas.length > 4 && (
                  <span className="badge bg-neutral-100 text-neutral-500">+{f.research_areas.length - 4}</span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
                {f.publications.length > 0 && (
                  <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {f.publications.length} pub{f.publications.length === 1 ? '' : 's'}</span>
                )}
                {f.courses.length > 0 && (
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {f.courses.length} course{f.courses.length === 1 ? '' : 's'}</span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    available > 0 ? 'bg-emerald-50 text-emerald-600' : total === 0 ? 'bg-neutral-100 text-neutral-400' : 'bg-rose-50 text-rose-500'
                  }`}>
                    <Users2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="text-sm">
                    <span className={`font-bold ${available > 0 ? 'text-emerald-600' : total === 0 ? 'text-neutral-400' : 'text-rose-600'}`}>
                      {total === 0 ? 'Not accepting' : `${available} / ${total} open`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {existingRequest ? (
                    <RequestStatusBadge status={existingRequest.status} />
                  ) : (
                    available > 0 && (
                      <button
                        onClick={() => setRequestModalFaculty(f)}
                        className="btn-primary !py-1.5 text-xs"
                      >
                        <Send className="h-3 w-3" /> Request
                      </button>
                    )
                  )}
                  <button onClick={() => setExpandedId(expandedId === f.id ? null : f.id)} className="text-xs font-semibold text-neutral-500 hover:text-neutral-700 transition-colors">
                    {expandedId === f.id ? <><ChevronUp className="mr-0.5 inline h-3 w-3" />Less</> : <><ChevronDown className="mr-0.5 inline h-3 w-3" />More</>}
                  </button>
                </div>
              </div>

              {expandedId === f.id && (
                <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4 animate-fade-in">
                  {f.publications.length > 0 && (
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500"><FileText className="h-3.5 w-3.5" /> Publications</p>
                      <ul className="mt-1.5 space-y-1">
                        {f.publications.map((p, idx) => (
                          <li key={idx} className="text-xs leading-relaxed text-neutral-600 pl-3 relative before:absolute before:left-0 before:top-1.5 before:h-1 before:w-1 before:rounded-full before:bg-neutral-400">{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {f.courses.length > 0 && (
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500"><BookOpen className="h-3.5 w-3.5" /> Courses taught</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {f.courses.map((c) => (
                          <span key={c} className="badge bg-neutral-100 text-neutral-600 text-[11px]">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {f.research_areas.length > 0 && (
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500"><Sparkles className="h-3.5 w-3.5" /> Research areas (expertise weight)</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {f.research_areas.map((ra) => (
                          <span key={ra.id} className="badge bg-primary-50 text-primary-700 text-[11px]">
                            {ra.research_area?.name}
                            <span className="ml-1 text-primary-400">·{ra.weight}/5</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-16 text-center animate-fade-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
            <Search className="h-8 w-8" />
          </div>
          <p className="mt-4 font-medium text-neutral-500">No supervisors match your filters.</p>
          <button onClick={() => { setQuery(''); setAvailabilityFilter('all'); }} className="btn-secondary mt-4">Clear filters</button>
        </div>
      )}

      {requestModalFaculty && (
        <RequestModal
          faculty={requestModalFaculty}
          projectMode={profile?.project_mode ?? 'solo'}
          groupMembers={profile?.group_members ?? []}
          onClose={() => setRequestModalFaculty(null)}
          onSubmitted={() => { setRequestModalFaculty(null); load(); }}
        />
      )}
    </div>
  );
}

function RequestStatusBadge({ status }: { status: string }) {
  if (status === 'pending') {
    return <span className="badge bg-amber-50 text-amber-700 text-[11px]"><Clock className="mr-1 h-3 w-3" />Pending</span>;
  }
  if (status === 'approved') {
    return <span className="badge bg-emerald-50 text-emerald-700 text-[11px]"><CheckCircle2 className="mr-1 h-3 w-3" />Approved</span>;
  }
  return <span className="badge bg-rose-50 text-rose-700 text-[11px]"><XCircle className="mr-1 h-3 w-3" />Denied</span>;
}

function RequestModal({ faculty, projectMode, groupMembers, onClose, onSubmitted }: {
  faculty: FacultyWithDetails;
  projectMode: 'solo' | 'group';
  groupMembers: { name: string; email: string }[];
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [projectTitle, setProjectTitle] = useState('');
  const [projectProposal, setProjectProposal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (!projectTitle.trim()) {
      setError('Please enter a project title.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.createRequest({
        faculty_id: faculty.id,
        project_mode: projectMode,
        group_members: projectMode === 'group' ? groupMembers : [],
        project_title: projectTitle.trim(),
        project_proposal: projectProposal.trim(),
      });
      onSubmitted();
    } catch (err) {
      setError((err as Error).message);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-neutral-900">Request Supervision</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 hover:bg-neutral-200">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-neutral-50 p-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${avatarColorFor(faculty.id)}`}>
            {getInitials(faculty.full_name)}
          </div>
          <div>
            <p className="font-bold text-neutral-900">{faculty.full_name}</p>
            <p className="text-xs text-neutral-500">{faculty.department}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="badge bg-primary-50 text-primary-700">
            {projectMode === 'solo' ? 'Solo project' : `Group project (${groupMembers.length} members)`}
          </span>
        </div>

        {projectMode === 'group' && groupMembers.length > 0 && (
          <div className="mt-3 rounded-xl border border-neutral-200 p-3">
            <p className="text-xs font-semibold text-neutral-500">Group members included in this request:</p>
            <ul className="mt-1.5 space-y-1">
              {groupMembers.map((m, i) => (
                <li key={i} className="text-xs text-neutral-600">{m.name}{m.email && ` — ${m.email}`}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 animate-fade-in">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4">
          <label className="label">Project title</label>
          <input className="input" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="e.g. Deep Learning for Medical Image Analysis" />
        </div>

        <div className="mt-4">
          <label className="label">Project proposal <span className="font-normal text-neutral-400">(optional)</span></label>
          <textarea className="input min-h-[100px] resize-y" value={projectProposal} onChange={(e) => setProjectProposal(e.target.value)} placeholder="Briefly describe your project idea and why this supervisor is a good fit." />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleApply} disabled={submitting} className="btn-primary">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Send className="h-4 w-4" /> Send request</>}
          </button>
        </div>
      </div>
    </div>
  );
}
