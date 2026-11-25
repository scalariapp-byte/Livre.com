import { CameraOff, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { pickIsbn } from '@/lib/scanner';

interface DetectorLike {
  detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
}

/** Scanner caméra pour la version web (BarcodeDetector natif, sinon ZXing). */
export function WebScanner({ open, onClose, onResult }: { open: boolean; onClose: () => void; onResult: (isbn: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setReady(false);
    setHint(null);
    let stopped = false;
    let stream: MediaStream | null = null;
    let raf = 0;
    let zxingStop: (() => void) | undefined;

    const found = (codes: string[]) => {
      const isbn = pickIsbn(codes);
      if (isbn && !stopped) {
        stopped = true;
        navigator.vibrate?.(60);
        onResult(isbn);
      } else if (codes.length) setHint('Code-barres lu, mais ce n’est pas un ISBN. Visez le code commençant par 978 ou 979.');
    };

    (async () => {
      const video = videoRef.current;
      if (!video) return;
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Caméra indisponible sur cet appareil ou ce navigateur.');
        return;
      }
      const Detector = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => DetectorLike }).BarcodeDetector;
      try {
        if (Detector) {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false });
          if (stopped) return;
          video.srcObject = stream;
          await video.play();
          setReady(true);
          const detector = new Detector({ formats: ['ean_13'] });
          const loop = async () => {
            if (stopped) return;
            try {
              const res = await detector.detect(video);
              found(res.map((r) => r.rawValue));
            } catch {
              /* image pas encore prête */
            }
            raf = window.setTimeout(loop, 180) as unknown as number;
          };
          loop();
        } else {
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          const reader = new BrowserMultiFormatReader();
          const controls = await reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, video, (result) => {
            if (result) found([result.getText()]);
          });
          zxingStop = () => controls.stop();
          if (stopped) zxingStop();
          setReady(true);
        }
      } catch (e) {
        const name = (e as Error).name;
        setError(
          name === 'NotAllowedError'
            ? 'Accès à la caméra refusé. Autorisez-le dans les réglages du navigateur.'
            : name === 'NotFoundError'
              ? 'Aucune caméra détectée.'
              : 'Impossible de démarrer la caméra.',
        );
      }
    })();

    return () => {
      stopped = true;
      clearTimeout(raf);
      zxingStop?.();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, onResult]);

  return (
    <Sheet open={open} onClose={onClose} title="Scanner un ISBN" description="Placez le code-barres au dos du livre dans le cadre." size="sm">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-black">
        <video ref={videoRef} playsInline muted className="size-full object-cover" />
        {!error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-[38%] w-[78%] rounded-2xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
              <div className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-accent" />
            </div>
          </div>
        )}
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white/80">
            <Loader2 className="size-8 animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white/85">
            <CameraOff className="size-8" />
            {error}
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-muted">{hint ?? 'La lecture est automatique. Vous pouvez aussi taper l’ISBN dans la recherche.'}</p>
    </Sheet>
  );
}
