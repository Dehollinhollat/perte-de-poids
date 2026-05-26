import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

export default function Card({
  children,
  className = '',
  onClick,
  padding = 'md',
}: CardProps) {
  return (
    <div
      className={`card card--pad-${padding}${onClick ? ' card--clickable' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
