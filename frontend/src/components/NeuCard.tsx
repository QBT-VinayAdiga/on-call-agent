import React from 'react';

interface NeuCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  variant?: 'flat' | 'pressed';
}

export const NeuCard = ({ children, title, className = "", variant = 'flat' }: NeuCardProps) => (
  <div className={`${variant === 'flat' ? 'neu-flat' : 'neu-pressed'} rounded-[30px] p-6 ${className} transition-all duration-300`}>
    {title && <h3 className="text-lg font-bold mb-4 opacity-80 uppercase tracking-wider">{title}</h3>}
    {children}
  </div>
);
