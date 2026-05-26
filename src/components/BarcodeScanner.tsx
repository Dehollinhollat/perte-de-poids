import React, { useRef, useEffect, useState, useCallback } from 'react';

interface ProductData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugars: number;
}

interface BarcodeScannerProps {
  onResult: (product: ProductData) => void;
  onClose: () => void;
}

declare global {
  class BarcodeDetector {
    constructor(options?: { formats?: string[] });
    detect(image: HTMLVideoElement | HTMLCanvasElement): Promise<{ rawValue: string; format: string }[]>;
    static getSupportedFormats(): Promise<string[]>;
  }
}

const isSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window;

async function fetchProduct(barcode: string): Promise<ProductData | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();
    if (data.status !== 1) return null;
    const p = data.product;
    const n = p.nutriments ?? {};
    return {
      name: p.product_name_fr || p.product_name || 'Produit inconnu',
      calories: Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0),
      protein: Math.round((n.proteins_100g ?? 0) * 10) / 10,
      carbs: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
      fat: Math.round((n.fat_100g ?? 0) * 10) / 10,
      sugars: Math.round((n.sugars_100g ?? 0) * 10) / 10,
    };
  } catch {
    return null;
  }
}

export default function BarcodeScanner({ onResult, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'starting' | 'scanning' | 'found' | 'error' | 'notfound'>('starting');
  const [product, setProduct] = useState<ProductData | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [errorMsg, setErrorMsg] = useState('');
  const scanningRef = useRef(true);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!isSupported) {
      setStatus('error');
      setErrorMsg('BarcodeDetector non disponible sur ce navigateur. Utilisez Chrome ou Edge.');
      return;
    }

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('scanning');

        const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });

        const scan = async () => {
          if (!scanningRef.current || !videoRef.current) return;
          try {
            const results = await detector.detect(videoRef.current);
            if (results.length > 0) {
              const barcode = results[0].rawValue;
              stopCamera();
              setStatus('found');
              const p = await fetchProduct(barcode);
              if (p) {
                setProduct(p);
              } else {
                setStatus('notfound');
              }
              return;
            }
          } catch { /* ignore frame errors */ }
          if (scanningRef.current) requestAnimationFrame(scan);
        };

        requestAnimationFrame(scan);
      } catch (err: unknown) {
        setStatus('error');
        setErrorMsg(err instanceof Error && err.name === 'NotAllowedError'
          ? 'Acces camera refuse. Autorisez l\'acces dans les parametres.'
          : 'Impossible d\'acceder a la camera.');
      }
    })();

    return () => stopCamera();
  }, [stopCamera]);

  const handleAdd = () => {
    if (!product) return;
    const qty = Number(quantity);
    const ratio = qty / 100;
    onResult({
      name: `${product.name} (${qty}g)`,
      calories: Math.round(product.calories * ratio),
      protein: Math.round(product.protein * ratio * 10) / 10,
      carbs: Math.round(product.carbs * ratio * 10) / 10,
      fat: Math.round(product.fat * ratio * 10) / 10,
      sugars: Math.round(product.sugars * ratio * 10) / 10,
    });
  };

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-modal__header">
          <span className="scanner-modal__title">Scanner un code-barres</span>
          <button type="button" className="scanner-modal__close" onClick={() => { stopCamera(); onClose(); }}>×</button>
        </div>

        {(status === 'starting' || status === 'scanning') && (
          <div className="scanner-view">
            <video ref={videoRef} className="scanner-video" muted playsInline />
            <div className="scanner-frame">
              <div className="scanner-line" />
            </div>
            <p className="scanner-hint">
              {status === 'starting' ? 'Ouverture de la camera...' : 'Pointez vers un code-barres'}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="scanner-message scanner-message--error">
            <div className="scanner-message__icon">📷</div>
            <p>{errorMsg}</p>
          </div>
        )}

        {status === 'notfound' && (
          <div className="scanner-message scanner-message--warn">
            <div className="scanner-message__icon">🔍</div>
            <p>Produit non trouve dans la base de donnees Open Food Facts.</p>
          </div>
        )}

        {status === 'found' && product && (
          <div className="scanner-result">
            <div className="scanner-result__name">{product.name}</div>
            <div className="scanner-result__per">Pour 100g :</div>
            <div className="scanner-result__macros">
              <div className="scanner-macro"><strong>{product.calories}</strong><span>kcal</span></div>
              <div className="scanner-macro"><strong>{product.protein}g</strong><span>Prot.</span></div>
              <div className="scanner-macro"><strong>{product.carbs}g</strong><span>Gluc.</span></div>
              <div className="scanner-macro"><strong>{product.fat}g</strong><span>Lip.</span></div>
            </div>
            <div className="scanner-qty-row">
              <label className="input-label">Quantite</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input className="input-field" type="number" value={quantity}
                  onChange={e => setQuantity(e.target.value)} min="1" style={{ flex: 1 }} />
                <span className="input-suffix">g</span>
              </div>
            </div>
            <div className="scanner-result__note">
              Le scanner aide a tracker, pas a interdire. Mangez ce que vous voulez dans votre objectif calorique !
            </div>
            <button type="button" className="btn btn--primary btn--full" onClick={handleAdd}>
              Ajouter ({Math.round(product.calories * Number(quantity) / 100)} kcal)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
