import React, { useEffect } from 'react';
import { Badge } from '../types';

interface BadgeToastProps {
  badge: Badge;
  onClose: () => void;
}

export default function BadgeToast({ badge, onClose }: BadgeToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="badge-toast" onClick={onClose} role="alert">
      <div className="badge-toast__confetti">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="confetti-particle" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>
      <div className="badge-toast__content">
        <div className="badge-toast__header">🎉 Badge debloque !</div>
        <div className="badge-toast__icon">{badge.icon}</div>
        <div className="badge-toast__name">{badge.name}</div>
        <div className="badge-toast__desc">{badge.description}</div>
      </div>
    </div>
  );
}
