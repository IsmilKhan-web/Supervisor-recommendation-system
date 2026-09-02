const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const api = {
  // auth
  signup: (body: { email: string; password: string; fullName: string; role: string; department?: string }) =>
    request<{ token: string; profile: Profile }>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),

  login: (email: string, password: string) =>
    request<{ token: string; profile: Profile }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  getMe: () => request<{ profile: Profile }>('/auth/me'),
  updateMe: (body: { bio?: string; department?: string; office_hours?: string; courses?: string[]; publications?: string[]; research_keywords?: string[] }) =>
    request<{ profile: Profile }>('/auth/me', { method: 'PUT', body: JSON.stringify(body) }),

  // research areas
  getResearchAreas: () => request<ResearchArea[]>('/research-areas'),

  // faculty
  getFaculty: () => request<FacultyWithDetails[]>('/faculty'),

  // student interests
  getStudentInterests: (studentId: string) =>
    request<StudentResearchInterest[]>(`/student-interests/${studentId}`),
  saveStudentInterests: (interests: { research_area_id: string; weight: number }[]) =>
    request<StudentResearchInterest[]>('/student-interests', { method: 'PUT', body: JSON.stringify({ interests }) }),

  // faculty slots
  getFacultySlot: (facultyId: string) => request<FacultySlot | null>(`/faculty-slots/${facultyId}`),
  saveFacultySlot: (total_slots: number, taken_slots: number) =>
    request<FacultySlot>('/faculty-slots', { method: 'PUT', body: JSON.stringify({ total_slots, taken_slots }) }),

  // faculty research areas (own)
  getMyFacultyResearchAreas: () => request<FacultyResearchArea[]>('/faculty-research-areas/me'),
  saveFacultyResearchAreas: (areas: { research_area_id: string; weight: number }[]) =>
    request<FacultyResearchArea[]>('/faculty-research-areas', { method: 'PUT', body: JSON.stringify({ areas }) }),

  // recommendations (interest-based)
  getRecommendations: () => request<RecommendationResult[]>('/recommendations'),

  // recommendations (TF-IDF topic matching)
  matchByTopic: (topic: string, options?: { excludeFull?: boolean; minScore?: number }) =>
    request<TopicMatchResponse>('/recommendations/match', {
      method: 'POST',
      body: JSON.stringify({ topic, ...options }),
    }),

  // recommendation history
  getHistory: () => request<RecommendationHistoryEntry[]>('/recommendations/history'),

  // admin faculty CRUD
  adminGetFaculty: () => request<FacultyWithDetails[]>('/admin/faculty'),
  adminCreateFaculty: (body: AdminCreateFacultyBody) =>
    request<{ profile: Profile }>('/admin/faculty', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateFaculty: (id: string, body: AdminUpdateFacultyBody) =>
    request<{ profile: Profile }>(`/admin/faculty/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  adminDeleteFaculty: (id: string) =>
    request<{ success: boolean }>(`/admin/faculty/${id}`, { method: 'DELETE' }),
};

// types re-exported for convenience
import type {
  Profile,
  ResearchArea,
  FacultyResearchArea,
  StudentResearchInterest,
  FacultySlot,
  FacultyWithDetails,
  RecommendationResult,
  TopicMatchResponse,
  TextMatchResult,
  RecommendationHistoryEntry,
  AdminCreateFacultyBody,
  AdminUpdateFacultyBody,
} from '../types';
