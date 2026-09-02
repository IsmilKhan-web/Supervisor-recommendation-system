import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { FacultyWithDetails } from '../types';
import { getInitials, avatarColorFor } from '../lib/utils';
import {
  ShieldCheck, Plus, Edit2, Trash2, X, Save, Building2, Mail, Users2, FileText, BookOpen, Clock, AlertCircle, Loader2,
} from 'lucide-react';

const DEPARTMENTS = ['Computer Science', 'Software Engineering', 'IT', 'Data Science', 'AI'];

export default function AdminDashboard() {
  const [faculty, setFaculty] = useState<FacultyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminGetFaculty();
      setFaculty(data);
    } catch (err) {
      setError((err as Error).message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    try {
      await api.adminDeleteFaculty(id);
      setFaculty((prev) => prev.filter((f) => f.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="skeleton h-10 w-48" />
        <div className="skeleton mt-3 h-5 w-72" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-900 text-white shadow-soft">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h1 className="font-display text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
          </div>
          <p className="mt-2 text-neutral-600">Manage faculty profiles, publications, and supervision capacity.</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setShowModal(true); }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> Add Faculty
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 animate-fade-in">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {faculty.map((f, i) => {
          const available = f.slot ? Math.max(0, f.slot.total_slots - f.slot.taken_slots) : 0;
          const total = f.slot?.total_slots ?? 0;
          return (
            <div key={f.id} className={`card-hover p-5 animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
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
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                    <Mail className="h-3 w-3" /> {f.email}
                  </p>
                </div>
              </div>

              {f.bio && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-neutral-600">{f.bio}</p>}

              <div className="mt-3 flex flex-wrap gap-1.5">
                {f.research_keywords.slice(0, 4).map((k) => (
                  <span key={k} className="badge bg-primary-50 text-primary-700 text-[11px]">{k}</span>
                ))}
                {f.research_keywords.length > 4 && (
                  <span className="badge bg-neutral-100 text-neutral-500 text-[11px]">+{f.research_keywords.length - 4}</span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {f.publications.length} pubs</span>
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {f.courses.length} courses</span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
                <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                  available > 0 ? 'bg-emerald-50 text-emerald-700' : total === 0 ? 'bg-neutral-50 text-neutral-500' : 'bg-rose-50 text-rose-600'
                }`}>
                  <Users2 className="h-3.5 w-3.5" />
                  {total === 0 ? 'Not accepting' : `${available}/${total} open`}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingId(f.id); setShowModal(true); }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(f.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {faculty.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-neutral-500">No faculty members yet. Click "Add Faculty" to create one.</p>
        </div>
      )}

      {/* Edit/Create modal */}
      {showModal && (
        <FacultyModal
          editingId={editingId}
          faculty={faculty}
          onClose={() => { setShowModal(false); setEditingId(null); }}
          onSaved={() => { setShowModal(false); setEditingId(null); load(); }}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmDelete(null)}>
          <div className="card max-w-sm p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-neutral-900">Delete faculty?</h3>
            </div>
            <p className="mt-3 text-sm text-neutral-600">This will permanently remove the faculty member and all associated data. This cannot be undone.</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="btn-primary flex-1 bg-rose-600 hover:bg-rose-700 from-rose-600 to-rose-500">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Faculty create/edit modal ──────────────────────────────────────────
function FacultyModal({ editingId, faculty, onClose, onSaved }: {
  editingId: string | null;
  faculty: FacultyWithDetails[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const existing = editingId ? faculty.find((f) => f.id === editingId) : null;
  const isEdit = !!existing;

  const [full_name, setFullName] = useState(existing?.full_name ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState(existing?.department ?? '');
  const [bio, setBio] = useState(existing?.bio ?? '');
  const [office_hours, setOfficeHours] = useState(existing?.office_hours ?? '');
  const [courses, setCourses] = useState((existing?.courses ?? []).join('\n'));
  const [publications, setPublications] = useState((existing?.publications ?? []).join('\n'));
  const [research_keywords, setKeywords] = useState((existing?.research_keywords ?? []).join(', '));
  const [total_slots, setTotalSlots] = useState(existing?.slot?.total_slots ?? 0);
  const [taken_slots, setTakenSlots] = useState(existing?.slot?.taken_slots ?? 0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!full_name.trim()) { setError('Name is required'); return; }
    if (!isEdit && !email.trim()) { setError('Email is required'); return; }
    if (!isEdit && password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setSaving(true);
    const splitLines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);
    const splitCommas = (s: string) => s.split(',').map((l) => l.trim()).filter(Boolean);

    try {
      if (isEdit && editingId) {
        await api.adminUpdateFaculty(editingId, {
          full_name: full_name.trim(),
          department,
          bio,
          office_hours,
          courses: splitLines(courses),
          publications: splitLines(publications),
          research_keywords: splitCommas(research_keywords),
          total_slots,
          taken_slots,
        });
      } else {
        await api.adminCreateFaculty({
          full_name: full_name.trim(),
          email: email.trim(),
          password,
          department,
          bio,
          office_hours,
          courses: splitLines(courses),
          publications: splitLines(publications),
          research_keywords: splitCommas(research_keywords),
          total_slots,
          taken_slots,
        });
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-neutral-900">
            {isEdit ? 'Edit Faculty' : 'Add New Faculty'}
          </h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 hover:bg-neutral-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 animate-fade-in">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={full_name} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Jane Smith" />
          </div>
          <div>
            <label className="label">Email {isEdit && <span className="font-normal text-neutral-400">(read-only)</span>}</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isEdit} placeholder="jane@university.edu" />
          </div>
          {!isEdit && (
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
          )}
          <div>
            <label className="label">Department</label>
            <select className="input-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="label">Bio</label>
          <textarea className="input min-h-[70px] resize-y" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Brief description of research and teaching." />
        </div>

        <div className="mt-4">
          <label className="label">Office hours</label>
          <input className="input" value={office_hours} onChange={(e) => setOfficeHours(e.target.value)} placeholder="Mon 2-4pm, Wed 10am-12pm, Room CS-301" />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Total supervision slots</label>
            <input type="number" min={0} max={20} className="input" value={total_slots} onChange={(e) => setTotalSlots(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Currently taken slots</label>
            <input type="number" min={0} max={total_slots} className="input" value={taken_slots} onChange={(e) => setTakenSlots(Number(e.target.value))} />
          </div>
        </div>

        <div className="mt-4">
          <label className="label">Research keywords <span className="font-normal text-neutral-400">(comma-separated)</span></label>
          <input className="input" value={research_keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="machine learning, computer vision, NLP" />
        </div>

        <div className="mt-4">
          <label className="label">Publications <span className="font-normal text-neutral-400">(one per line)</span></label>
          <textarea className="input min-h-[80px] resize-y font-mono text-xs" value={publications} onChange={(e) => setPublications(e.target.value)} placeholder={'Smith, J. et al. "Paper Title" — Conference 2024'} />
        </div>

        <div className="mt-4">
          <label className="label">Courses taught <span className="font-normal text-neutral-400">(one per line)</span></label>
          <textarea className="input min-h-[60px] resize-y" value={courses} onChange={(e) => setCourses(e.target.value)} placeholder={'CS 445: Deep Learning'} />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> {isEdit ? 'Save changes' : 'Create faculty'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
