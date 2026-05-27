import React, { useState, useEffect } from 'react';

export default function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Dismissed recently (within 7 days)
    const dismissed = localStorage.getItem('installBannerDismissed');
    if (dismissed) {
      const diffDays = (Date.now() - new Date(dismissed).getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 7) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> });
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('installBannerDismissed', new Date().toISOString());
  };

  if (!showBanner) return null;

  return (
    <div className="install-banner">
      <span className="install-banner__text">📱 Installez l'app pour un accès rapide !</span>
      <div className="install-banner__actions">
        <button className="install-banner__btn" onClick={handleInstall} type="button">
          Installer
        </button>
        <button className="install-banner__close" onClick={handleDismiss} type="button" aria-label="Fermer">
          ✕
        </button>
      </div>
    </div>
  );
}
