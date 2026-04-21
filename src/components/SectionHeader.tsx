import React from 'react';
import { cn } from '../lib/utils';

interface SectionHeaderProps {
  title: string;
  label: string;
  subtitle?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, label, subtitle, className }) => {
  return (
    <div className={cn("mb-6 md:mb-8", className)}>
      <div className="offwhite-label">{label}</div>
      <div className="flex items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none">
          {title}
        </h2>
        <div className="flex-1 h-0.5 bg-black" />
      </div>
      {subtitle ? (
        <p className="mt-3 max-w-2xl font-mono text-[10px] font-bold uppercase leading-relaxed tracking-[0.12em] text-black/50">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
};
