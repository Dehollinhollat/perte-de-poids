import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { BodyCompositionEntry } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

interface ExtractedData {
  weight?: number;
  bmi?: number;
  bodyFatPct?: number;
  muscleMassKg?: number;
  waterPct?: number;
  bmr?: number;
  bodyAge?: number;
}

function extractValue(text: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseFloat(match[1].replace(',', '.'));
  }
  return undefined;
}

function parseFitdaysText(text: string): ExtractedData {
  return {
    weight:       extractValue(text, [/poids[^\d]*([\d.,]+)\s*kg/i, /([\d.,]+)\s*kg/i]),
    bmi:          extractValue(text, [/imc[^\d]*([\d.,]+)/i, /bmi[^\d]*([\d.,]+)/i]),
    bodyFatPct:   extractValue(text, [/graisse[^\d]*([\d.,]+)\s*%/i, /masse\s*grasse[^\d]*([\d.,]+)/i]),
    muscleMassKg: extractValue(text, [/masse\s*musculaire[^\d]*([\d.,]+)/i, /muscle[^\d]*([\d.,]+)/i]),
    waterPct:     extractValue(text, [/eau[^\d]*([\d.,]+)\s*%/i]),
    bmr:          extractValue(text, [/tmb[^\d]*([\d]+)/i, /metabolism[^\d]*([\d]+)/i]),
    bodyAge:      extractValue(text, [/[âa]ge\s*corporel[^\d]*([\d]+)/i, /[âa]ge[^\d]*([\d]+)/i]),
  };
}

function MiniChart({ entries, field, label, color, suffix }: {
  entries: BodyCompositionEntry[];
  field: keyof BodyCompositionEntry;
  label: string;
  color: string;
  suffix: string;
}) {
  const pts = [...entries].reverse()
    .filter(e => e[field] != null)
    .map(e => ({ val: e[field] as number, date: e.date }));

  if (pts.length < 2) return null;

  const W = 200; const H = 50; const PAD = 4;
  const vals = pts.map(p => p.val);
  const min = Math.min(...vals); const max = Math.max(...vals);
  const range = max - min || 1;
  const coords = pts.map((p, i) => ({
    x: PAD + (i / (pts.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (p.val - min) / range) * (H - PAD * 2),
  }));
  const path = coords.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = coords[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `${acc} C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
  }, '');

  const last = pts[pts.length - 1];
  const first = pts[0];
  const delta = last.val - first.val;

  return (
    <div className="comp-chart-card">
      <div className="comp-chart-card__header">
        <span className="comp-chart-card__label" style={{ color }}>{label}</span>
        <span className="comp-chart-card__val">{last.val}{suffix}</span>
        <span style={{ fontSize: '11px', color: delta < 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
          {delta < 0 ? '↓' : '+'}{Math.abs(delta).toFixed(1)}{suffix}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%">
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="3" fill={color} />
      </svg>
    </div>
  );
}

export default function BodyCompositionSection() {
  const { bodyComposition, addBodyComp, deleteBodyComp } = useUser();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [analyzeError, setAnalyzeError] = useState('');
  const [editForm, setEditForm] = useState<ExtractedData>({});
  const [mode, setMode] = useState<'view' | 'import'>('view');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setExtracted(null);
    setAnalyzeError('');
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    setAnalyzing(true);
    setAnalyzeError('');
    try {
      const Tesseract = await import('tesseract.js');
      const { data: { text } } = await Tesseract.recognize(imageFile, 'fra');
      const result = parseFitdaysText(text);
      setExtracted(result);
      setEditForm(result);
    } catch {
      setAnalyzeError('Erreur lors de l\'analyse. Essayez une image plus nette.');
    }
    setAnalyzing(false);
  };

  const handleValidate = () => {
    if (!editForm.weight) return;
    const entry: BodyCompositionEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      weight: editForm.weight,
      bodyFatPct: editForm.bodyFatPct,
      muscleMassKg: editForm.muscleMassKg,
      waterPct: editForm.waterPct,
      bmr: editForm.bmr,
      bodyAge: editForm.bodyAge,
      bmi: editForm.bmi,
      source: 'fitdays',
    };
    addBodyComp(entry);
    setMode('view');
    setImageFile(null);
    setImagePreview(null);
    setExtracted(null);
    setEditForm({});
  };

  const update = (field: keyof ExtractedData, val: string) =>
    setEditForm(prev => ({ ...prev, [field]: val ? parseFloat(val) : undefined }));

  const latest = bodyComposition[0];
  const prev = bodyComposition[1];

  return (
    <div className="section-stack">
      {/* Header + mode toggle */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button variant={mode === 'view' ? 'primary' : 'secondary'} fullWidth onClick={() => setMode('view')}>
          Mes donnees
        </Button>
        <Button variant={mode === 'import' ? 'primary' : 'secondary'} fullWidth onClick={() => setMode('import')}>
          📷 Import Fitdays
        </Button>
      </div>

      {mode === 'import' && (
        <Card>
          <h3 className="section-title" style={{ marginBottom: '14px' }}>Import Fitdays (OCR)</h3>

          <div className="fitdays-upload">
            <label className="fitdays-upload__label">
              <input type="file" accept="image/*" capture="environment" onChange={handleFileChange}
                style={{ display: 'none' }} />
              <span className="fitdays-upload__btn">📷 Selectionner photo Fitdays</span>
            </label>
          </div>

          {imagePreview && (
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
            </div>
          )}

          {imageFile && !extracted && (
            <Button fullWidth onClick={handleAnalyze} style={{ marginTop: '12px' }} disabled={analyzing}>
              {analyzing ? '🤖 Analyse en cours...' : '🤖 Analyser'}
            </Button>
          )}

          {analyzeError && <p style={{ color: '#EF4444', fontSize: '13px', marginTop: '8px' }}>{analyzeError}</p>}

          {extracted && (
            <div style={{ marginTop: '14px' }} className="form-stack">
              <p className="card-label" style={{ marginBottom: '8px' }}>Verifiez et corrigez les valeurs :</p>

              {([
                ['weight', 'Poids', 'kg'],
                ['bmi', 'IMC', ''],
                ['bodyFatPct', 'Graisse corporelle', '%'],
                ['muscleMassKg', 'Masse musculaire', 'kg'],
                ['waterPct', 'Eau corporelle', '%'],
                ['bmr', 'TMB', 'kcal'],
                ['bodyAge', 'Age corporel', 'ans'],
              ] as [keyof ExtractedData, string, string][]).map(([field, label, suffix]) => (
                <div key={field} className="form-row" style={{ alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', width: '130px', flexShrink: 0, color: 'var(--gray)' }}>{label}</span>
                  <input className="input-field" type="number" step="0.1"
                    value={editForm[field] ?? ''}
                    onChange={e => update(field, e.target.value)}
                    placeholder="—"
                    style={{ flex: 1 }} />
                  {suffix && <span className="input-suffix">{suffix}</span>}
                </div>
              ))}

              <Button fullWidth onClick={handleValidate} disabled={!editForm.weight}>
                Valider et enregistrer
              </Button>
            </div>
          )}
        </Card>
      )}

      {mode === 'view' && (
        <>
          {/* Latest stats */}
          {latest && (
            <Card>
              <div className="card-row card-row--between">
                <span className="card-label">Derniere composition</span>
                <span className="card-label">
                  {new Date(latest.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div className="measurements-grid" style={{ marginTop: '12px' }}>
                {latest.bodyFatPct != null && (
                  <div className="measure-cell">
                    <div className="measure-cell__label">Graisse</div>
                    <div className="measure-cell__val" style={{ color: '#F59E0B' }}>{latest.bodyFatPct}%</div>
                    {prev?.bodyFatPct != null && (
                      <span style={{ fontSize: '11px', color: latest.bodyFatPct < prev.bodyFatPct ? '#10B981' : '#EF4444' }}>
                        {latest.bodyFatPct < prev.bodyFatPct ? '↓' : '↑'} {Math.abs(latest.bodyFatPct - prev.bodyFatPct).toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
                {latest.muscleMassKg != null && (
                  <div className="measure-cell">
                    <div className="measure-cell__label">Muscle</div>
                    <div className="measure-cell__val" style={{ color: '#10B981' }}>{latest.muscleMassKg}kg</div>
                    {prev?.muscleMassKg != null && (
                      <span style={{ fontSize: '11px', color: latest.muscleMassKg > prev.muscleMassKg ? '#10B981' : '#EF4444' }}>
                        {latest.muscleMassKg > prev.muscleMassKg ? '↑' : '↓'} {Math.abs(latest.muscleMassKg - prev.muscleMassKg).toFixed(1)}kg
                      </span>
                    )}
                  </div>
                )}
                {latest.waterPct != null && (
                  <div className="measure-cell">
                    <div className="measure-cell__label">Eau</div>
                    <div className="measure-cell__val" style={{ color: '#3B82F6' }}>{latest.waterPct}%</div>
                  </div>
                )}
                {latest.bmr != null && (
                  <div className="measure-cell">
                    <div className="measure-cell__label">TMB</div>
                    <div className="measure-cell__val">{latest.bmr}</div>
                  </div>
                )}
                {latest.bodyAge != null && (
                  <div className="measure-cell">
                    <div className="measure-cell__label">Age corporel</div>
                    <div className="measure-cell__val" style={{ color: '#8B5CF6' }}>{latest.bodyAge} ans</div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Trend charts */}
          {bodyComposition.length >= 2 && (
            <Card>
              <span className="card-label" style={{ display: 'block', marginBottom: '10px' }}>Evolution</span>
              <MiniChart entries={bodyComposition} field="bodyFatPct" label="Graisse %" color="#F59E0B" suffix="%" />
              <MiniChart entries={bodyComposition} field="muscleMassKg" label="Muscle kg" color="#10B981" suffix="kg" />
              <MiniChart entries={bodyComposition} field="waterPct" label="Eau %" color="#3B82F6" suffix="%" />
            </Card>
          )}

          {/* History */}
          {bodyComposition.length > 0 && (
            <div className="list-section">
              <h3 className="list-title">Historique</h3>
              {bodyComposition.slice(0, 10).map(e => (
                <div key={e.id} className="list-row">
                  <div className="list-row__main">
                    <span className="list-row__date">
                      {new Date(e.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{e.weight}kg
                    </span>
                    <span className="list-row__notes">
                      {[
                        e.bodyFatPct && `Graisse:${e.bodyFatPct}%`,
                        e.muscleMassKg && `Muscle:${e.muscleMassKg}kg`,
                        e.bmr && `TMB:${e.bmr}`,
                      ].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <div className="list-row__right">
                    <button className="list-row__delete" onClick={() => deleteBodyComp(e.id)} type="button">×</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {bodyComposition.length === 0 && (
            <div className="empty-state">
              Utilisez le bouton "Import Fitdays" pour importer vos donnees de composition corporelle.
            </div>
          )}
        </>
      )}
    </div>
  );
}
