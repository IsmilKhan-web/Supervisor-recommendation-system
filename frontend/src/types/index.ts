export type Role = 'student' | 'faculty' | 'admin';
export type ProjectMode = 'solo' | 'group';
export type RequestStatus = 'pending' | 'approved' | 'denied';

export interface GroupMember {
  name: string;
  email: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  department: string | null;
  bio: string | null;
  avatar_url: string | null;
  office_hours: string | null;
  courses: string[];
  publications: string[];
  research_keywords: string[];
  project_mode: ProjectMode;
  group_members: GroupMember[];
  created_at: string;
}

export interface ResearchArea {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  created_at: string;
}

export interface FacultyResearchArea {
  id: string;
  faculty_id: string;
  research_area_id: string;
  weight: number;
  research_area?: ResearchArea;
}

export interface StudentResearchInterest {
  id: string;
  student_id: string;
  research_area_id: string;
  weight: number;
  research_area?: ResearchArea;
}

export interface FacultySlot {
  id: string;
  faculty_id: string;
  total_slots: number;
  taken_slots: number;
  term: string;
  updated_at: string;
}

export interface FacultyWithDetails extends Profile {
  research_areas: FacultyResearchArea[];
  slot: FacultySlot | null;
}

export interface RecommendationResult {
  faculty: FacultyWithDetails;
  matchScore: number;
  matchedAreas: { id: string; name: string; studentWeight: number; facultyWeight: number }[];
  availableSlots: number;
}

export interface TextMatchResult {
  faculty: FacultyWithDetails;
  matchScore: number;
  matchedKeywords: string[];
  availableSlots: number;
  totalSlots: number;
  similarity: number;
}

export interface TopicMatchResponse {
  topic: string;
  queryKeywords: string[];
  results: TextMatchResult[];
}

export interface RecommendationHistoryEntry {
  id: string;
  student_id: string;
  search_topic: string;
  recommended_supervisors: {
    faculty_id: string | { id: string; full_name: string; email: string; department: string; bio: string };
    score: number;
    matched_keywords: string[];
  }[];
  createdAt: string;
}

export interface AdminCreateFacultyBody {
  full_name: string;
  email: string;
  password: string;
  department?: string;
  bio?: string;
  office_hours?: string;
  courses?: string[];
  publications?: string[];
  research_keywords?: string[];
  total_slots?: number;
  taken_slots?: number;
}

export interface AdminUpdateFacultyBody {
  full_name?: string;
  department?: string;
  bio?: string;
  office_hours?: string;
  courses?: string[];
  publications?: string[];
  research_keywords?: string[];
  total_slots?: number;
  taken_slots?: number;
}

export interface SupervisionRequest {
  id: string;
  student_id: string;
  faculty_id: string;
  status: RequestStatus;
  project_mode: ProjectMode;
  group_members: GroupMember[];
  project_title: string;
  project_proposal: string;
  term: string;
  createdAt: string;
  updatedAt: string;
  faculty?: Profile | null;
  student?: Profile | null;
}

export interface CreateRequestBody {
  faculty_id: string;
  project_mode: ProjectMode;
  group_members?: GroupMember[];
  project_title?: string;
  project_proposal?: string;
}
