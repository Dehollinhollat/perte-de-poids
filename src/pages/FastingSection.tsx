import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { FastingSession } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

function parseTime(timeStr: string, baseDate: Date = new Date()): Date {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function CircleTimer({ pct, label, sub, color }: { pct: number; label: string; sub: string; color: string }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(1, pct));
  return (
    <div className="fasting-ring">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
      </svg>
      <div className="fasting-ring__inner">
        <div className="fasting-ring__label">{label}</div>
        <div className="fasting-ring__sub">{sub}</div>
      </div>
    </div>
  );
}

export default function FastingSection() {
  const { fastingSessions, fastingSettings, addFastingSession, updateFastingSession, deleteFastingSession } = useUser();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const ongoingSession = fastingSessions.find(s => !s.endTime);

  // Determine if in fasting window based on settings
  const windowStartToday = parseTime(fastingSettings.windowStart, now);
  let windowEndTomorrow = parseTime(fastingSettings.windowEnd, now);
  if (windowEndTomorrow <= windowStartToday) windowEndTomorrow.setDate(windowEndTomorrow.getDate() + 1);

  const nowTs = now.getTime();
  const inFastWindow = nowTs >= windowStartToday.getTime() && nowTs < windowEndTomorrow.getTime();
  const windowDuration = (fastingSettings.targetHours * 3600 * 1000);

  const startFast = () => {
    const session: FastingSession = {
      id: crypto.randomUUID(),
      startTime: now.toISOString(),
      targetHours: fastingSettings.targetHours,
      completed: false,
    };
    addFastingSession(session);
  };

  const stopFast = () => {
    if (!ongoingSession) return;
    const elapsedHours = (now.getTime() - new Date(ongoingSession.startTime).getTime()) / 3600000;
    updateFastingSession(ongoingSession.id, {
      endTime: now.toISOString(),
      completed: elapsedHours >= ongoingSession.targetHours,
    });
  };

  // Compute timer data
  let timerPct = 0;
  let timerLabel = '--:--:--';
  let timerSub = '';
  let timerColor = '#3B82F6';

  if (ongoingSession) {
    const elapsed = (now.getTime() - new Date(ongoingSession.startTime).getTime()) / 1000;
    const target = ongoingSession.targetHours * 3600;
    timerPct = elapsed / target;
    timerLabel = formatDuration(Math.round(elapsed));
    timerColor = timerPct >= 1 ? '#10B981' : '#3B82F6';
    const remaining = Math.max(0, target - elapsed);
    timerSub = timerPct >= 1 ? 'Objectif atteint !' : `Reste ${formatDuration(Math.round(remaining))}`;
  }

  // Streak: consecutive completed fasts
  const completedSessions = fastingSessions.filter(s => s.completed && s.endTime);
  const streak = completedSessions.length;

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="section-stack">
      {/* Window status */}
      <div className="fasting-status-card" style={{
        background: inFastWindow ? '#EFF6FF' : '#F0FDF4',
        borderColor: inFastWindow ? '#BFDBFE' : '#BBF7D0',
      }}>
        <div className="fasting-status-label" style={{ color: inFastWindow ? '#2563EB' : '#059669' }}>
          {inFastWindow ? '🔵 Fenetre de jeune' : '🟢 Fenetre alimentaire'}
        </div>
        <div className="fasting-status-times">
          Jeune : {fastingSettings.windowStart} → {fastingSettings.windowEnd}
          {' · '}{fastingSettings.targetHours}h
        </div>
      </div>

      {/* Timer */}
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          {ongoingSession ? (
            <CircleTimer pct={timerPct} label={timerLabel} sub={timerSub} color={timerColor} />
          ) : (
            <div className="fasting-idle">
              <div className="fasting-idle__icon">🕐</div>
              <div className="fasting-idle__text">Aucun jeune en cours</div>
            </div>
          )}

          {streak > 0 && (
            <div className="streak-badge" style={{ alignSelf: 'center' }}>
              🔥 {streak} jeune{streak > 1 ? 's' : ''} complete{streak > 1 ? 's' : ''}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            {!ongoingSession ? (
              <Button fullWidth onClick={startFast}>
                Commencer le jeune
              </Button>
            ) : (
              <Button fullWidth variant="danger" onClick={stopFast}>
                Terminer le jeune
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* History */}
      {fastingSessions.filter(s => s.endTime).length > 0 && (
        <div className="list-section">
          <h3 className="list-title">Historique</h3>
          {fastingSessions.filter(s => s.endTime).slice(0, 10).map(s => {
            const elapsed = (new Date(s.endTime!).getTime() - new Date(s.startTime).getTime()) / 3600000;
            return (
              <div key={s.id} className="list-row">
                <div className="list-row__main">
                  <span className="list-row__date">{formatDateTime(s.startTime)}</span>
                  <span className="list-row__notes">{elapsed.toFixed(1)}h / {s.targetHours}h objectif</span>
                </div>
                <div className="list-row__right">
                  <span className="list-row__badge" style={{ color: s.completed ? '#10B981' : '#9CA3AF' }}>
                    {s.completed ? '✓' : '×'}
                  </span>
                  <button className="list-row__delete" onClick={() => deleteFastingSession(s.id)} type="button">×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {fastingSessions.length === 0 && (
        <div className="empty-state">
          Appuyez sur "Commencer le jeune" pour demarrer votre premier jeune intermittent.
        </div>
      )}
    </div>
  );
}
