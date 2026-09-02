import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { ResearchArea, StudentResearchInterest } from '../types';
import ResearchAreaSelector from '../components/ResearchAreaSelector';
import { Sparkles, Save, CheckCircle2, ArrowRight, BookOpen, Search } from 'lucide-react';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [areas, setAreas] = useState<ResearchArea[]>([]);
  const [interests, setInterests] = useState<StudentResearchInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [areasData, interestsData] = await Promise.all([
        api.getResearchAreas(),
        api.getStudentInterests(profile.id),
      ]);
      setAreas(areasData);
      setInterests(interestsData);
      setSelectedIds(interestsData.map((i) => i.research_area_id));
      setWeights(Object.fromEntries(interestsData.map((i) => [i.research_area_id, i.weight])));
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

      <div className="mt-8 card p-6 animate-slide-up shadow-soft">
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
          <div className="flex items-center gap-2">
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
