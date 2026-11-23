import { Droplet, Monitor, Trash2, Wrench, Zap } from 'lucide-react';
import { Category } from '../types';

export function CategoryIcon({
  category,
  className = 'w-4 h-4',
}: {
  category: Category;
  className?: string;
}) {
  switch (category) {
    case 'Electrical':
      return <Zap className={className} aria-hidden="true" />;
    case 'Plumbing':
      return <Droplet className={className} aria-hidden="true" />;
    case 'IT Hardware':
      return <Monitor className={className} aria-hidden="true" />;
    case 'Sanitation':
      return <Trash2 className={className} aria-hidden="true" />;
    case 'Maintenance':
      return <Wrench className={className} aria-hidden="true" />;
  }
}

export function getCategoryIconColor(category: Category): string {
  switch (category) {
    case 'Electrical':
      return 'text-amber-600';
    case 'Plumbing':
      return 'text-sky-600';
    case 'IT Hardware':
      return 'text-indigo-600';
    case 'Sanitation':
      return 'text-emerald-600';
    case 'Maintenance':
      return 'text-slate-600';
  }
}
