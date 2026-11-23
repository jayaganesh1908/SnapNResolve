import { Category, Status, Urgency } from '../types';

export const BUILDINGS: string[] = [
  'Block A',
  'Block B',
  'Block C',
  'Library',
  'Canteen',
  'Auditorium',
  'Boys Hostel',
  'Girls Hostel',
  'Admin Office',
  'Parking',
  'Playground',
  'Other',
];

export const CATEGORIES: Category[] = [
  'Electrical',
  'Plumbing',
  'IT Hardware',
  'Sanitation',
  'Maintenance',
];

export const STATUSES: Status[] = [
  'Reported',
  'Assigned',
  'In Progress',
  'Resolved',
];

export const URGENCIES: Urgency[] = ['High', 'Medium', 'Low'];

export const APP_VERSION = '1.0.0';

export function formatTicketCode(id: number): string {
  return `SNR-${String(id).padStart(4, '0')}`;
}

export function timeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'min' : 'mins'} ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
}

export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

export function formatLocation(building: string, spot: string | null): string {
  return spot && spot.trim() ? `${building} · ${spot.trim()}` : building;
}
