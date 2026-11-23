import { useState } from 'react';
import { Category } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface PhotoBoxProps {
  src: string | null;
  alt: string;
  category: Category;
  className?: string;
  iconClassName?: string;
  onClick?: () => void;
}

export function PhotoBox({
  src,
  alt,
  category,
  className = 'w-20 h-20 rounded-xl',
  iconClassName = 'w-7 h-7',
  onClick,
}: PhotoBoxProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`bg-slate-100 text-slate-400 flex flex-col items-center justify-center shrink-0 select-none ${className}`}
        aria-label={`${category} issue — no photo attached`}
      >
        <CategoryIcon category={category} className={iconClassName} />
      </div>
    );
  }

  const content = (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover"
    />
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`overflow-hidden bg-slate-100 shrink-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${className}`}
        aria-label={`View full photo: ${alt}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`overflow-hidden bg-slate-100 shrink-0 ${className}`}>
      {content}
    </div>
  );
}
