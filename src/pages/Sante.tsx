import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import HydrationSection from './HydrationSection';
import SleepSection from './SleepSection';
import MeasurementsSection from './MeasurementsSection';
import ActivitySection from './ActivitySection';
import BodyCompositionSection from './BodyCompositionSection';
import FastingSection from './FastingSection';

type Sub = 'hydration' | 'sleep' | 'measurements' | 'activity' | 'composition' | 'fasting';

export default function Sante() {
  const { fastingSettings } = useUser();
  const [sub, setSub] = useState<Sub>('hydration');

  const tabs: { key: Sub; label: string }[] = [
    { key: 'hydration',    label: 'Hydratation' },
    { key: 'sleep',        label: 'Sommeil' },
    { key: 'measurements', label: 'Mesures' },
    { key: 'activity',     label: 'Activite' },
    { key: 'composition',  label: 'Compo' },
    ...(fastingSettings.enabled ? [{ key: 'fasting' as Sub, label: 'Jeune' }] : []),
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Sante</h1>
      </div>

      <div className="sub-tab-bar sub-tab-bar--scroll">
        {tabs.map(t => (
          <button key={t.key} type="button"
            className={`sub-tab${sub === t.key ? ' sub-tab--active' : ''}`}
            onClick={() => setSub(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'hydration'    && <HydrationSection />}
      {sub === 'sleep'        && <SleepSection />}
      {sub === 'measurements' && <MeasurementsSection />}
      {sub === 'activity'     && <ActivitySection />}
      {sub === 'composition'  && <BodyCompositionSection />}
      {sub === 'fasting'      && <FastingSection />}
    </div>
  );
}
