export type Role = 'user' | 'admin';

export type Category =
  | 'Electrical'
  | 'Plumbing'
  | 'IT Hardware'
  | 'Sanitation'
  | 'Maintenance';

export type Urgency = 'High' | 'Medium' | 'Low';

export type Status = 'Reported' | 'Assigned' | 'In Progress' | 'Resolved';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Complaint {
  id: number;
  description: string;
  building: string;
  spot: string | null;
  latitude: number | null;
  longitude: number | null;
  photo_url: string | null;
  category: Category;
  category_confidence: number;
  urgency: Urgency;
  urgency_score: number;
  ai_reasons: string[];
  ai_source: 'ml' | 'keyword';
  duplicate_of: number | null;
  status: Status;
  technician_id: number | null;
  technician_name: string | null;
  proof_photo_url: string | null;
  admin_note: string | null;
  upvote_count: number;
  priority_score: number;
  has_upvoted: boolean;
  is_mine: boolean;
  reporter_name: string | null;
  created_at: string;
  assigned_at: string | null;
  resolved_at: string | null;
}

export interface StatusHistory {
  id: number;
  status: Status;
  note: string | null;
  changed_by_name: string | null;
  created_at: string;
}

export type ComplaintDetail = Complaint & {
  history: StatusHistory[];
};

export interface Technician {
  id: number;
  name: string;
  department: Category;
  phone: string | null;
  is_active: boolean;
  open_tickets: number;
}

export interface AnalysisResult {
  category: Category;
  category_confidence: number;
  urgency: Urgency;
  urgency_score: number;
  reasons: string[];
  ai_source: 'ml' | 'keyword';
  duplicate: Complaint | null;
  similarity: number | null;
}

export interface Analytics {
  total: number;
  open: number;
  resolved: number;
  high_open: number;
  resolved_this_week: number;
  avg_resolution_hours: number;
  total_upvotes: number;
  by_category: { category: Category; count: number }[];
  by_status: { status: Status; count: number }[];
  avg_resolution_by_category: { category: Category; hours: number }[];
  per_day: { date: string; count: number }[];
}

export interface AnalyzeComplaintInput {
  description: string;
  building: string;
  spot: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface CreateComplaintInput {
  description: string;
  building: string;
  spot: string | null;
  latitude: number | null;
  longitude: number | null;
  photo: File | null;
  force: boolean;
}

export interface ListComplaintsParams {
  status?: Status | '';
  category?: Category | '';
  urgency?: Urgency | '';
  building?: string;
  search?: string;
  sort?: 'priority' | 'upvotes' | 'newest';
  open_only?: boolean;
}

export interface UpdateComplaintInput {
  status?: Status;
  technician_id?: number | null;
  category?: Category;
  admin_note?: string | null;
}

export interface AddTechnicianInput {
  name: string;
  department: Category;
  phone: string | null;
}
