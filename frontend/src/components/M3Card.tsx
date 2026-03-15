import React from 'react';

interface M3CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  variant?: 'elevated' | 'filled' | 'outlined';
}

export const M3Card = ({ children, title, className = "", variant = 'elevated' }: M3CardProps) => {
  const variantClass = {
    elevated: 'm3-card-elevated shadow-elevation-1',
    filled: 'm3-card-filled',
    outlined: 'm3-card-outlined',
  }[variant];

  return (
    <div className={`m3-card ${variantClass} ${className}`}>
      {title && <h3 className="text-xl font-medium mb-4 text-on-surface opacity-90">{title}</h3>}
      {children}
    </div>
  );
};
