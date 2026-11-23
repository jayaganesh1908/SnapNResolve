import {
  INITIAL_COMPLAINTS,
  INITIAL_TECHNICIANS,
  INITIAL_USERS,
  MockComplaintRecord,
  MockTechnicianRecord,
  MockUserRecord,
} from '../data/mockData';
import {
  AddTechnicianInput,
  AnalysisResult,
  Analytics,
  AnalyzeComplaintInput,
  AuthResponse,
  Category,
  Complaint,
  ComplaintDetail,
  CreateComplaintInput,
  ListComplaintsParams,
  Status,
  Technician,
  UpdateComplaintInput,
  Urgency,
  User,
} from '../types';
import { CATEGORIES, STATUSES } from '../utils/format';
import { fileToDataUrl } from '../utils/image';

const TOKEN_KEY = 'snr_token';
const API_URL_KEY = 'snr_api_url';
const NETWORK_DELAY_MS = 300;

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function delay(ms = NETWORK_DELAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Settings
// ============================================================================

export function getApiBaseUrl(): string {
  try {
    const saved = localStorage.getItem(API_URL_KEY);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  } catch {
    // ignore storage errors
  }
  return (import.meta.env.VITE_API_URL as string | undefined) || '';
}

export function setApiBaseUrl(url: string): void {
  try {
    const trimmed = url.trim();
    if (!trimmed) {
      localStorage.removeItem(API_URL_KEY);
    } else {
      localStorage.setItem(API_URL_KEY, trimmed);
    }
  } catch {
    // ignore storage errors
  }
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// ============================================================================
// In-memory mock store (replaced by fetch(getApiBaseUrl() + ...) later)
// ============================================================================

const usersStore: MockUserRecord[] = INITIAL_USERS.map((u) => ({ ...u }));
const techniciansStore: MockTechnicianRecord[] = INITIAL_TECHNICIANS.map((t) => ({ ...t }));
const complaintsStore: MockComplaintRecord[] = INITIAL_COMPLAINTS.map((c) => ({
  ...c,
  ai_reasons: [...c.ai_reasons],
  upvoter_ids: [...c.upvoter_ids],
  history: c.history.map((h) => ({ ...h })),
}));

let nextUserId = Math.max(...usersStore.map((u) => u.id), 10) + 1;
let nextTechId = Math.max(...techniciansStore.map((t) => t.id), 10) + 1;
let nextComplaintId = Math.max(...complaintsStore.map((c) => c.id), 15) + 1;
let nextHistoryId = 500;

function makeMockToken(userId: number): string {
  return `mock-jwt-snr-user-${userId}`;
}

function parseMockToken(token: string | null): MockUserRecord | null {
  if (!token) return null;
  const match = token.match(/^mock-jwt-snr-user-(\d+)$/);
  if (!match) return null;
  const userId = Number(match[1]);
  return usersStore.find((u) => u.id === userId) || null;
}

function requireCurrentUser(): MockUserRecord {
  const user = parseMockToken(getAuthToken());
  if (!user) {
    throw new ApiError('Please log in to continue.', 401);
  }
  return user;
}

function requireAdminUser(): MockUserRecord {
  const user = requireCurrentUser();
  if (user.role !== 'admin') {
    throw new ApiError('Admin access is required for this action.', 403);
  }
  return user;
}

function toPublicUser(u: MockUserRecord): User {
  return {
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    role: u.role,
  };
}

function toComplaintDTO(record: MockComplaintRecord, viewer: MockUserRecord | null): Complaint {
  const tech = record.technician_id
    ? techniciansStore.find((t) => t.id === record.technician_id) || null
    : null;
  const upvoteCount = record.base_upvotes + record.upvoter_ids.length;
  const priorityScore = record.urgency_score + 5 * upvoteCount;
  const isAdmin = viewer?.role === 'admin';
  const hasUpvoted = viewer ? record.upvoter_ids.includes(viewer.id) : false;
  const isMine = viewer ? record.reporter_id === viewer.id : false;

  return {
    id: record.id,
    description: record.description,
    building: record.building,
    spot: record.spot,
    latitude: record.latitude,
    longitude: record.longitude,
    photo_url: record.photo_url,
    category: record.category,
    category_confidence: record.category_confidence,
    urgency: record.urgency,
    urgency_score: record.urgency_score,
    ai_reasons: [...record.ai_reasons],
    ai_source: record.ai_source,
    duplicate_of: record.duplicate_of,
    status: record.status,
    technician_id: record.technician_id,
    technician_name: tech ? tech.name : null,
    proof_photo_url: record.proof_photo_url,
    admin_note: record.admin_note,
    upvote_count: upvoteCount,
    priority_score: priorityScore,
    has_upvoted: hasUpvoted,
    is_mine: isMine,
    // Business rule: Normal users get reporter_name = null
    reporter_name: isAdmin ? record.reporter_name : null,
    created_at: record.created_at,
    assigned_at: record.assigned_at,
    resolved_at: record.resolved_at,
  };
}

function toTechnicianDTO(tech: MockTechnicianRecord): Technician {
  const openTickets = complaintsStore.filter(
    (c) => c.technician_id === tech.id && c.status !== 'Resolved'
  ).length;
  return {
    id: tech.id,
    name: tech.name,
    department: tech.department,
    phone: tech.phone,
    is_active: tech.is_active,
    open_tickets: openTickets,
  };
}

// ============================================================================
// Dummy AI Classifier (Simple Keywords)
// ============================================================================

function runKeywordAnalysis(
  input: AnalyzeComplaintInput,
  viewer: MockUserRecord | null
): AnalysisResult {
  const text = `${input.description} ${input.spot || ''}`.toLowerCase();

  const electricalKeywords = ['fan', 'light', 'switch', 'wire', 'socket', 'ac', 'bulb', 'tube', 'power', 'spark', 'shock', 'short circuit', 'switchboard'];
  const plumbingKeywords = ['tap', 'water', 'pipe', 'leak', 'flush', 'cooler', 'sink', 'drain', 'flood', 'basin'];
  const itKeywords = ['computer', 'wifi', 'wi-fi', 'projector', 'printer', 'monitor', 'internet', 'router', 'lan', 'keyboard', 'pc'];
  const sanitationKeywords = ['dirty', 'garbage', 'smell', 'dustbin', 'clean', 'washroom', 'toilet', 'trash', 'stink', 'overflow'];

  const matchedElectrical = electricalKeywords.filter((kw) => text.includes(kw));
  const matchedPlumbing = plumbingKeywords.filter((kw) => text.includes(kw));
  const matchedIt = itKeywords.filter((kw) => text.includes(kw));
  const matchedSanitation = sanitationKeywords.filter((kw) => text.includes(kw));

  let category: Category = 'Maintenance';
  let matchedCategoryWords: string[] = [];
  let categoryConfidence = 0.74;

  const scores: { cat: Category; words: string[] }[] = [
    { cat: 'Electrical', words: matchedElectrical },
    { cat: 'Plumbing', words: matchedPlumbing },
    { cat: 'IT Hardware', words: matchedIt },
    { cat: 'Sanitation', words: matchedSanitation },
  ];
  scores.sort((a, b) => b.words.length - a.words.length);

  if (scores[0].words.length > 0) {
    category = scores[0].cat;
    matchedCategoryWords = scores[0].words;
    categoryConfidence = Math.min(0.96, 0.8 + scores[0].words.length * 0.05);
  }

  const highUrgencyWords = [
    'spark',
    'shock',
    'fire',
    'smoke',
    'exposed wire',
    'flood',
    'falling',
    'broken glass',
    'short circuit',
    'burning',
    'electrocute',
  ];
  const mediumUrgencyWords = [
    'leak',
    'slippery',
    'broken',
    'not working',
    'dirty',
    'smell',
    'overflow',
    'no water',
    'no power',
    'jammed',
    'cracked',
    'damaged',
    'wobbling',
    'days',
  ];

  const matchedHigh = highUrgencyWords.filter((kw) => text.includes(kw));
  const matchedMedium = mediumUrgencyWords.filter((kw) => text.includes(kw));

  let urgency: Urgency = 'Low';
  let urgencyScore = 36;
  const reasons: string[] = [];

  if (matchedHigh.length > 0) {
    urgency = 'High';
    urgencyScore = Math.min(98, 86 + matchedHigh.length * 4);
    reasons.push(`Critical safety keyword detected: "${matchedHigh.join('", "')}"`);
  } else if (matchedMedium.length > 0) {
    urgency = 'Medium';
    urgencyScore = Math.min(76, 56 + matchedMedium.length * 6);
    reasons.push(`Service disruption indicator: "${matchedMedium.join('", "')}"`);
  } else {
    urgency = 'Low';
    urgencyScore = 35;
    reasons.push('No immediate safety hazard words detected; standard campus queue');
  }

  if (matchedCategoryWords.length > 0) {
    reasons.push(`Department routed to ${category} via keywords: "${matchedCategoryWords.slice(0, 3).join('", "')}"`);
  } else {
    reasons.push('Routed to general Maintenance department');
  }

  if (input.building) {
    reasons.push(`Location tagged at ${input.building}${input.spot ? ` (${input.spot})` : ''}`);
  }

  // Duplicate rule: not Resolved, same building, same category, from the last 48 hours
  const cutoffMs = Date.now() - 48 * 60 * 60 * 1000;
  const duplicateRecord = complaintsStore.find((c) => {
    if (c.status === 'Resolved') return false;
    if (c.building.toLowerCase() !== input.building.toLowerCase()) return false;
    if (c.category !== category) return false;
    return new Date(c.created_at).getTime() >= cutoffMs;
  });

  let duplicate: Complaint | null = null;
  let similarity: number | null = null;

  if (duplicateRecord) {
    duplicate = toComplaintDTO(duplicateRecord, viewer);
    // Calculate simple token overlap for a realistic similarity ratio
    const inputTokens = new Set(text.split(/\W+/).filter((w) => w.length > 2));
    const dupTokens = new Set(
      `${duplicateRecord.description} ${duplicateRecord.spot || ''}`
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 2)
    );
    let overlap = 0;
    inputTokens.forEach((tok) => {
      if (dupTokens.has(tok)) overlap += 1;
    });
    const ratio = inputTokens.size > 0 ? overlap / inputTokens.size : 0;
    similarity = Number(Math.min(0.95, Math.max(0.74, 0.72 + ratio * 0.25)).toFixed(2));
  }

  return {
    category,
    category_confidence: Number(categoryConfidence.toFixed(2)),
    urgency,
    urgency_score: urgencyScore,
    reasons,
    ai_source: 'keyword',
    duplicate,
    similarity,
  };
}

// ============================================================================
// Auth API
// ============================================================================

// Later: POST /api/auth/signup
export async function signUp(
  full_name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  await delay();
  const cleanName = full_name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (cleanName.length < 2) {
    throw new ApiError('Please enter your full name.', 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new ApiError('Please enter a valid email address.', 400);
  }
  if (password.length < 8) {
    throw new ApiError('Password must be at least 8 characters long.', 400);
  }
  if (usersStore.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new ApiError('An account with this email already exists.', 409);
  }

  const newUser: MockUserRecord = {
    id: nextUserId++,
    full_name: cleanName,
    email: cleanEmail,
    role: 'user',
    password,
  };
  usersStore.push(newUser);

  const token = makeMockToken(newUser.id);
  localStorage.setItem(TOKEN_KEY, token);

  return { token, user: toPublicUser(newUser) };
}

// Later: POST /api/auth/login
export async function login(email: string, password: string): Promise<AuthResponse> {
  await delay();
  const cleanEmail = email.trim().toLowerCase();
  const found = usersStore.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.password === password
  );
  if (!found) {
    throw new ApiError('Invalid email or password. Try the demo buttons below.', 401);
  }

  const token = makeMockToken(found.id);
  localStorage.setItem(TOKEN_KEY, token);

  return { token, user: toPublicUser(found) };
}

// Later: GET /api/auth/me
export async function getMe(): Promise<User> {
  await delay();
  const user = requireCurrentUser();
  return toPublicUser(user);
}

// Removes stored JWT token
export async function logout(): Promise<void> {
  await delay(150);
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

// ============================================================================
// Complaints API
// ============================================================================

// Later: POST /api/complaints/analyze
export async function analyzeComplaint(
  input: AnalyzeComplaintInput
): Promise<AnalysisResult> {
  await delay();
  const viewer = requireCurrentUser();
  const desc = input.description.trim();
  if (desc.length < 10) {
    throw new ApiError('Description must be at least 10 characters.', 400);
  }
  if (desc.length > 1000) {
    throw new ApiError('Description cannot exceed 1000 characters.', 400);
  }
  if (!input.building.trim()) {
    throw new ApiError('Please select a building.', 400);
  }

  return runKeywordAnalysis(input, viewer);
}

// Later: POST /api/complaints (multipart/form-data)
export async function createComplaint(
  input: CreateComplaintInput
): Promise<Complaint> {
  await delay();
  const user = requireCurrentUser();

  const desc = input.description.trim();
  if (desc.length < 10 || desc.length > 1000) {
    throw new ApiError('Description must be between 10 and 1000 characters.', 400);
  }
  if (!input.building.trim()) {
    throw new ApiError('Please choose a building.', 400);
  }

  const analysis = runKeywordAnalysis(
    {
      description: desc,
      building: input.building,
      spot: input.spot,
      latitude: input.latitude,
      longitude: input.longitude,
    },
    user
  );

  if (analysis.duplicate && !input.force) {
    throw new ApiError(
      'A similar open complaint was found in this building. Please upvote it or submit anyway.',
      409
    );
  }

  let photoUrl: string | null = null;
  if (input.photo) {
    photoUrl = await fileToDataUrl(input.photo);
  }

  const now = new Date().toISOString();
  const newRecord: MockComplaintRecord = {
    id: nextComplaintId++,
    description: desc,
    building: input.building.trim(),
    spot: input.spot && input.spot.trim() ? input.spot.trim() : null,
    latitude: input.latitude,
    longitude: input.longitude,
    photo_url: photoUrl,
    category: analysis.category,
    category_confidence: analysis.category_confidence,
    urgency: analysis.urgency,
    urgency_score: analysis.urgency_score,
    ai_reasons: analysis.reasons,
    ai_source: analysis.ai_source,
    duplicate_of: analysis.duplicate ? analysis.duplicate.id : null,
    status: 'Reported',
    technician_id: null,
    proof_photo_url: null,
    admin_note: null,
    upvoter_ids: [],
    base_upvotes: 0,
    reporter_id: user.id,
    reporter_name: user.full_name,
    created_at: now,
    assigned_at: null,
    resolved_at: null,
    history: [
      {
        id: nextHistoryId++,
        status: 'Reported',
        note: analysis.duplicate
          ? 'Submitted by student after reviewing possible duplicate.'
          : 'Complaint submitted.',
        changed_by_name: user.full_name,
        created_at: now,
      },
    ],
  };

  complaintsStore.unshift(newRecord);
  return toComplaintDTO(newRecord, user);
}

// Later: GET /api/complaints
export async function listComplaints(
  params: ListComplaintsParams = {}
): Promise<Complaint[]> {
  await delay();
  const viewer = requireCurrentUser();

  let items = complaintsStore.map((c) => toComplaintDTO(c, viewer));

  if (params.open_only) {
    items = items.filter((c) => c.status !== 'Resolved');
  }
  if (params.status) {
    items = items.filter((c) => c.status === params.status);
  }
  if (params.category) {
    items = items.filter((c) => c.category === params.category);
  }
  if (params.urgency) {
    items = items.filter((c) => c.urgency === params.urgency);
  }
  if (params.building) {
    items = items.filter((c) => c.building === params.building);
  }
  if (params.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    items = items.filter((c) => {
      const code = `snr-${String(c.id).padStart(4, '0')}`;
      return (
        code.includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.building.toLowerCase().includes(q) ||
        (c.spot && c.spot.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q) ||
        (c.technician_name && c.technician_name.toLowerCase().includes(q))
      );
    });
  }

  const sortBy = params.sort || 'priority';
  if (sortBy === 'priority') {
    items.sort((a, b) => b.priority_score - a.priority_score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sortBy === 'upvotes') {
    items.sort((a, b) => b.upvote_count - a.upvote_count || b.priority_score - a.priority_score);
  } else if (sortBy === 'newest') {
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return items;
}

// Later: GET /api/complaints/mine
export async function listMyComplaints(): Promise<Complaint[]> {
  await delay();
  const viewer = requireCurrentUser();

  return complaintsStore
    .filter((c) => c.reporter_id === viewer.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((c) => toComplaintDTO(c, viewer));
}

// Later: GET /api/complaints/{id}
export async function getComplaint(id: number): Promise<ComplaintDetail> {
  await delay();
  const viewer = requireCurrentUser();
  const record = complaintsStore.find((c) => c.id === id);
  if (!record) {
    throw new ApiError('Complaint not found.', 404);
  }

  const isAdmin = viewer.role === 'admin';
  const dto = toComplaintDTO(record, viewer);
  const history = record.history.map((h) => ({
    ...h,
    // Hide student reporter name from non-admins in history too if it matches reporter
    changed_by_name:
      !isAdmin && h.status === 'Reported' && record.reporter_id !== viewer.id
        ? 'Campus Student'
        : h.changed_by_name,
  }));

  return {
    ...dto,
    history,
  };
}

// Later: POST /api/complaints/{id}/upvote
export async function toggleUpvote(
  id: number
): Promise<{ upvoted: boolean; upvote_count: number }> {
  await delay();
  const viewer = requireCurrentUser();
  const record = complaintsStore.find((c) => c.id === id);
  if (!record) {
    throw new ApiError('Complaint not found.', 404);
  }
  if (record.reporter_id === viewer.id) {
    throw new ApiError('You cannot upvote your own complaint.', 400);
  }

  const existingIndex = record.upvoter_ids.indexOf(viewer.id);
  let upvoted: boolean;
  if (existingIndex >= 0) {
    record.upvoter_ids.splice(existingIndex, 1);
    upvoted = false;
  } else {
    record.upvoter_ids.push(viewer.id);
    upvoted = true;
  }

  const upvote_count = record.base_upvotes + record.upvoter_ids.length;
  return { upvoted, upvote_count };
}

// ============================================================================
// Admin API
// ============================================================================

// Later: PATCH /api/admin/complaints/{id}
export async function updateComplaint(
  id: number,
  input: UpdateComplaintInput
): Promise<Complaint> {
  await delay();
  const admin = requireAdminUser();
  const record = complaintsStore.find((c) => c.id === id);
  if (!record) {
    throw new ApiError('Complaint not found.', 404);
  }

  const nextTechId =
    input.technician_id !== undefined ? input.technician_id : record.technician_id;
  const nextStatus: Status = input.status !== undefined ? input.status : record.status;

  // Enforce business rules
  if ((nextStatus === 'Assigned' || nextStatus === 'In Progress') && !nextTechId) {
    throw new ApiError(
      `Assign a technician before setting status to "${nextStatus}".`,
      400
    );
  }
  if (nextStatus === 'Resolved' && !record.proof_photo_url) {
    throw new ApiError(
      'Upload a proof of resolution photo before marking this ticket Resolved.',
      400
    );
  }
  if (nextTechId !== null) {
    const techExists = techniciansStore.find((t) => t.id === nextTechId);
    if (!techExists) {
      throw new ApiError('Selected technician was not found.', 404);
    }
  }

  const now = new Date().toISOString();
  const statusChanged = nextStatus !== record.status;
  const techChanged = nextTechId !== record.technician_id;
  const categoryChanged =
    input.category !== undefined && input.category !== record.category;

  record.technician_id = nextTechId;
  if (input.category !== undefined) {
    record.category = input.category;
  }
  if (input.admin_note !== undefined) {
    record.admin_note = input.admin_note?.trim() || null;
  }

  record.status = nextStatus;
  if ((nextStatus === 'Assigned' || nextStatus === 'In Progress') && !record.assigned_at) {
    record.assigned_at = now;
  }
  if (nextStatus === 'Resolved' && !record.resolved_at) {
    record.resolved_at = now;
  }
  if (nextStatus !== 'Resolved') {
    record.resolved_at = null;
  }

  if (statusChanged || techChanged || categoryChanged || input.admin_note?.trim()) {
    const parts: string[] = [];
    if (techChanged && nextTechId) {
      const tech = techniciansStore.find((t) => t.id === nextTechId);
      if (tech) parts.push(`Assigned to ${tech.name} (${tech.department}).`);
    }
    if (categoryChanged && input.category) {
      parts.push(`Category updated to ${input.category}.`);
    }
    if (input.admin_note?.trim()) {
      parts.push(input.admin_note.trim());
    }
    record.history.push({
      id: nextHistoryId++,
      status: record.status,
      note: parts.length > 0 ? parts.join(' ') : `Status changed to ${record.status}.`,
      changed_by_name: admin.full_name,
      created_at: now,
    });
  }

  return toComplaintDTO(record, admin);
}

// Later: POST /api/admin/complaints/{id}/proof
export async function uploadProofPhoto(id: number, photo: File): Promise<Complaint> {
  await delay();
  const admin = requireAdminUser();
  const record = complaintsStore.find((c) => c.id === id);
  if (!record) {
    throw new ApiError('Complaint not found.', 404);
  }

  const dataUrl = await fileToDataUrl(photo);
  record.proof_photo_url = dataUrl;
  record.history.push({
    id: nextHistoryId++,
    status: record.status,
    note: 'Proof of resolution photo uploaded.',
    changed_by_name: admin.full_name,
    created_at: new Date().toISOString(),
  });

  return toComplaintDTO(record, admin);
}

// Later: GET /api/technicians
export async function listTechnicians(): Promise<Technician[]> {
  await delay();
  requireAdminUser();
  return techniciansStore.map((t) => toTechnicianDTO(t));
}

// Later: POST /api/admin/technicians
export async function addTechnician(input: AddTechnicianInput): Promise<Technician> {
  await delay();
  requireAdminUser();

  const name = input.name.trim();
  if (name.length < 2) {
    throw new ApiError('Please enter the technician name.', 400);
  }
  const phone = input.phone?.trim() || null;
  if (phone && !/^[0-9+\-\s]{7,15}$/.test(phone)) {
    throw new ApiError('Please enter a valid phone number.', 400);
  }

  const newTech: MockTechnicianRecord = {
    id: nextTechId++,
    name,
    department: input.department,
    phone,
    is_active: true,
  };
  techniciansStore.push(newTech);
  return toTechnicianDTO(newTech);
}

// Later: PATCH /api/admin/technicians/{id}
export async function setTechnicianActive(
  id: number,
  is_active: boolean
): Promise<Technician> {
  await delay();
  requireAdminUser();

  const tech = techniciansStore.find((t) => t.id === id);
  if (!tech) {
    throw new ApiError('Technician not found.', 404);
  }
  tech.is_active = is_active;
  return toTechnicianDTO(tech);
}

// Later: GET /api/admin/analytics
export async function getAnalytics(): Promise<Analytics> {
  await delay();
  requireAdminUser();

  const total = complaintsStore.length;
  const resolvedList = complaintsStore.filter((c) => c.status === 'Resolved');
  const openList = complaintsStore.filter((c) => c.status !== 'Resolved');
  const highOpen = openList.filter((c) => c.urgency === 'High').length;

  const weekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const resolvedThisWeek = resolvedList.filter(
    (c) => c.resolved_at && new Date(c.resolved_at).getTime() >= weekCutoff
  ).length;

  const resolutionHours = resolvedList
    .filter((c) => c.resolved_at)
    .map(
      (c) =>
        Math.max(
          1,
          (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()) /
            (1000 * 60 * 60)
        )
    );

  const avgResolutionHours =
    resolutionHours.length > 0
      ? Number(
          (
            resolutionHours.reduce((sum, h) => sum + h, 0) / resolutionHours.length
          ).toFixed(1)
        )
      : 0;

  const totalUpvotes = complaintsStore.reduce(
    (sum, c) => sum + c.base_upvotes + c.upvoter_ids.length,
    0
  );

  const by_category = CATEGORIES.map((category) => ({
    category,
    count: complaintsStore.filter((c) => c.category === category).length,
  }));

  const by_status = STATUSES.map((status) => ({
    status,
    count: complaintsStore.filter((c) => c.status === status).length,
  }));

  const avg_resolution_by_category = CATEGORIES.map((category) => {
    const resolvedInCat = resolvedList.filter(
      (c) => c.category === category && c.resolved_at
    );
    if (resolvedInCat.length === 0) {
      return { category, hours: 0 };
    }
    const avg =
      resolvedInCat.reduce(
        (sum, c) =>
          sum +
          Math.max(
            1,
            (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()) /
              (1000 * 60 * 60)
          ),
        0
      ) / resolvedInCat.length;
    return { category, hours: Number(avg.toFixed(1)) };
  });

  // Last 14 days
  const per_day: { date: string; count: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const isoDay = dayStart.toISOString().slice(0, 10);
    const count = complaintsStore.filter((c) => {
      const ts = new Date(c.created_at).getTime();
      return ts >= dayStart.getTime() && ts < dayEnd.getTime();
    }).length;
    per_day.push({ date: isoDay, count });
  }

  return {
    total,
    open: openList.length,
    resolved: resolvedList.length,
    high_open: highOpen,
    resolved_this_week: resolvedThisWeek,
    avg_resolution_hours: avgResolutionHours,
    total_upvotes: totalUpvotes,
    by_category,
    by_status,
    avg_resolution_by_category,
    per_day,
  };
}
