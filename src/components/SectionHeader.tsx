import React from 'react';
import { cn } from '../lib/utils';

interface SectionHeaderProps {
  title: string;
  label: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, label, className }) => {
  return (
    <div className={cn("mb-6 md:mb-8", className)}>
      <div className="offwhite-label">{label}</div>
      <div className="flex items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none">
          {title}
        </h2>
        <div className="flex-1 h-0.5 bg-black" />
      </div>
    </div>
  );
};
