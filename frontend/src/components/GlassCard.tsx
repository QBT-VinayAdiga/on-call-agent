import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const GlassCard = ({ children, title, className = "" }: GlassCardProps) => (
  <div className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl ${className}`}>
    {title && <h3 className="text-lg font-semibold mb-4 text-white/90">{title}</h3>}
    {children}
  </div>
);
