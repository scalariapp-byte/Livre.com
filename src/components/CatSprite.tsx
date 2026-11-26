import { motion } from 'framer-motion';
import { useId } from 'react';
import type { PetAction } from './PetSprite';

export interface CatCoat {
  id: string;
  name: string;
  fur: string;
  light: string;
  dark: string;
  inner: string;
  nose: string;
  eyeIn: string;
  eyeOut: string;
  whisker: string;
  /** Rayures de chat tigré. */
  stripes?: boolean;
}

export const CAT_COATS: CatCoat[] = [
  { id: 'chocolate', name: 'Chocolat', fur: '#6E4A38', light: '#8C6450', dark: '#4A3024', inner: '#C99089', nose: '#C9858A', eyeIn: '#FFD25A', eyeOut: '#E07A12', whisker: '#F3E9E2' },
  { id: 'ginger', name: 'Roux', fur: '#D9822B', light: '#F2A75A', dark: '#A65B1A', inner: '#F2A6A0', nose: '#E07A80', eyeIn: '#D9F08A', eyeOut: '#6FA83A', whisker: '#FFF6EA', stripes: true },
  { id: 'grey', name: 'Gris', fur: '#8A8C97', light: '#ADAFB9', dark: '#5F6170', inner: '#D9A3A8', nose: '#C98A93', eyeIn: '#F4E27A', eyeOut: '#D49A1E', whisker: '#F4F4F6', stripes: true },
  { id: 'black', name: 'Noir', fur: '#2E2A2C', light: '#4B4448', dark: '#151213', inner: '#8E6468', nose: '#5A4044', eyeIn: '#FFF08A', eyeOut: '#E2B21F', whisker: '#D9D4D6' },
  { id: 'white', name: 'Blanc', fur: '#EFEBE5', light: '#FFFFFF', dark: '#C9C1B6', inner: '#F2B2B6', nose: '#E59AA3', eyeIn: '#BFE3FF', eyeOut: '#4A8FD6', whisker: '#9E968C' },
  { id: 'cream', name: 'Crème', fur: '#E2C394', light: '#F4DDB7', dark: '#B8956A', inner: '#EFAAA8', nose: '#D98C8F', eyeIn: '#FFE08A', eyeOut: '#D8861C', whisker: '#FFFFFF', stripes: true },
];

export const coatOf = (id?: string) => CAT_COATS.find((c) => c.id === id) ?? CAT_COATS[1];

const ellipse = (cx: number, cy: number, rx: number, ry: number) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`;

/** Chat au style plus réaliste : grosse tête, grands yeux, fourrure nette (mèches sur les contours + grain). */
export function CatSprite({ action, size, coat }: { action: PetAction; size: number; coat: CatCoat }) {
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `${n}-${uid}`;
  const sleeping = action === 'sleep';
  const happy = action === 'happy';
  const walking = action === 'walk';
  const { fur, light, dark, inner, nose, eyeIn, eyeOut, whisker } = coat;

  /** Forme de fourrure : dégradé + grain + petites mèches régulières sur le contour. */
  const Fur = ({ d, fill = `url(#${id('fur')})` }: { d: string; fill?: string }) => (
    <g>
      <path d={d} fill={fill} />
      <path d={d} fill={`url(#${id('grain')})`} />
      <path d={d} fill="none" stroke={fur} strokeWidth="5.5" strokeDasharray="0.1 3.6" strokeLinecap="round" />
      <path d={d} fill="none" stroke={dark} strokeWidth="1.2" opacity="0.35" />
    </g>
  );

  const defs = (
    <defs>
      <radialGradient id={id('fur')} cx="40%" cy="28%" r="85%">
        <stop offset="0%" stopColor={light} />
        <stop offset="58%" stopColor={fur} />
        <stop offset="100%" stopColor={dark} />
      </radialGradient>
      <radialGradient id={id('bib')} cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
        <stop offset="100%" stopColor={light} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id('eye')} cx="50%" cy="42%" r="58%">
        <stop offset="0%" stopColor={eyeIn} />
        <stop offset="100%" stopColor={eyeOut} />
      </radialGradient>
      {/* Grain de fourrure : petits poils orientés */}
      <pattern id={id('grain')} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
        <path d="M1 1 l0 3.2 M4.5 3 l0 3" stroke={dark} strokeWidth="0.7" strokeLinecap="round" opacity="0.28" />
        <path d="M3 0.5 l0 2.4" stroke={light} strokeWidth="0.6" strokeLinecap="round" opacity="0.35" />
      </pattern>
    </defs>
  );

  const openEyes = (
    <motion.g style={{ originX: '100px', originY: '78px' }} animate={{ scaleY: [1, 1, 0.06, 1] }} transition={{ duration: 0.32, times: [0, 0.5, 0.75, 1], repeat: Infinity, repeatDelay: 3.6 }}>
      {[80, 120].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="78" r="13.5" fill="#24150E" />
          <circle cx={cx} cy="78" r="12" fill={`url(#${id('eye')})`} />
          {/* Stries de l'iris */}
          {Array.from({ length: 10 }, (_, k) => {
            const a = (k / 10) * Math.PI * 2;
            return <path key={k} d={`M${cx + Math.cos(a) * 5.5} ${78 + Math.sin(a) * 5.5} L${cx + Math.cos(a) * 11} ${78 + Math.sin(a) * 11}`} stroke={eyeOut} strokeWidth="0.8" opacity="0.5" />;
          })}
          <motion.ellipse cx={cx} cy="78" rx="4.2" ry="8.6" fill="#120804" animate={walking ? { rx: 5 } : { rx: [4.2, 5.4, 4.2] }} transition={{ duration: 5, repeat: Infinity }} />
          <circle cx={cx - 4} cy="72.5" r="3.4" fill="#FFFFFF" />
          <circle cx={cx + 4.5} cy="83" r="1.6" fill="#FFFFFF" opacity="0.85" />
          {/* Paupière */}
          <path d={`M${cx - 14} 74 q14 -12 28 0`} stroke="#24150E" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8" />
        </g>
      ))}
    </motion.g>
  );

  const face = (mode: 'open' | 'happy' | 'sleep') => (
    <g>
      {coat.stripes ? (
        <path d="M84 50 q3 7 0 12 M92 47 q2 8 0 14 M100 46 v15 M108 47 q-2 8 0 14 M116 50 q-3 7 0 12" stroke={dark} strokeWidth="3" opacity="0.7" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M90 52 q2 6 0 10 M100 50 v12 M110 52 q-2 6 0 10" stroke={dark} strokeWidth="1.8" opacity="0.45" fill="none" strokeLinecap="round" />
      )}
      {coat.stripes && <path d="M54 82 l10 2 M54 90 l9 0 M146 82 l-10 2 M146 90 l-9 0" stroke={dark} strokeWidth="3" opacity="0.6" strokeLinecap="round" />}
      {/* Museau clair */}
      <ellipse cx="100" cy="100" rx="21" ry="12" fill={light} opacity="0.45" />
      {mode === 'open' ? (
        openEyes
      ) : (
        <g stroke="#24150E" strokeWidth="3.6" fill="none" strokeLinecap="round">
          {mode === 'happy' ? (
            <>
              <path d="M68 81 q12 -11 24 0" />
              <path d="M108 81 q12 -11 24 0" />
            </>
          ) : (
            <>
              <path d="M68 79 q12 9 24 0" />
              <path d="M108 79 q12 9 24 0" />
            </>
          )}
        </g>
      )}
      <path d="M94.5 90.5 h11 l-5.5 6 z" fill={nose} stroke={nose} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M100 96.5 v3.5" stroke="#24150E" strokeWidth="1.6" />
      <path d={mode === 'happy' ? 'M90 100 q10 10 20 0' : 'M91 100 q4.5 5 9 0 q4.5 5 9 0'} stroke="#24150E" strokeWidth="2" fill="none" strokeLinecap="round" />
      {mode === 'happy' && (
        <>
          <ellipse cx="68" cy="96" rx="8" ry="4.5" fill="#FF8FA3" opacity="0.7" />
          <ellipse cx="132" cy="96" rx="8" ry="4.5" fill="#FF8FA3" opacity="0.7" />
        </>
      )}
      <g stroke={whisker} strokeWidth="1.1" strokeLinecap="round" opacity="0.9" fill="none">
        <path d="M86 95 C 72 92, 58 92, 40 94 M86 98 C 72 98, 58 100, 42 104 M87 101 C 75 103, 64 108, 52 114" />
        <path d="M114 95 C 128 92, 142 92, 160 94 M114 98 C 128 98, 142 100, 158 104 M113 101 C 125 103, 136 108, 148 114" />
      </g>
    </g>
  );

  const HEAD = 'M50 80 C 48 52, 70 36, 100 36 C 130 36, 152 52, 150 80 C 152 96, 144 110, 128 116 C 116 121, 84 121, 72 116 C 56 110, 48 96, 50 80 Z';
  const EAR_L = 'M56 58 C 56 42, 60 26, 64 18 C 74 24, 84 32, 92 42 Z';
  const EAR_R = 'M144 58 C 144 42, 140 26, 136 18 C 126 24, 116 32, 108 42 Z';

  const head = (mode: 'open' | 'happy' | 'sleep') => (
    <g>
      <motion.g style={{ originX: '74px', originY: '50px' }} animate={mode === 'sleep' ? { rotate: -10 } : { rotate: [0, 0, -8, 0] }} transition={mode === 'sleep' ? {} : { duration: 0.4, repeat: Infinity, repeatDelay: 6 }}>
        <Fur d={EAR_L} />
        <path d="M63 50 C 64 40, 66 31, 68 26 C 74 31, 80 36, 85 43 Z" fill={inner} opacity="0.9" />
        <path d="M66 46 l5 -6 M68 49 l6 -5 M71 51 l5 -3" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" strokeLinecap="round" />
      </motion.g>
      <motion.g style={{ originX: '126px', originY: '50px' }} animate={mode === 'sleep' ? { rotate: 10 } : { rotate: [0, 0, 8, 0] }} transition={mode === 'sleep' ? {} : { duration: 0.4, repeat: Infinity, repeatDelay: 7.5 }}>
        <Fur d={EAR_R} />
        <path d="M137 50 C 136 40, 134 31, 132 26 C 126 31, 120 36, 115 43 Z" fill={inner} opacity="0.9" />
        <path d="M134 46 l-5 -6 M132 49 l-6 -5 M129 51 l-5 -3" stroke="#FFFFFF" strokeWidth="1" opacity="0.7" strokeLinecap="round" />
      </motion.g>
      <Fur d={HEAD} />
      {face(mode)}
    </g>
  );

  const tailStripes = coat.stripes;

  if (sleeping)
    return (
      <svg viewBox="0 0 200 200" width={size} height={size} className="overflow-visible">
        {defs}
        <ellipse cx="108" cy="192" rx="78" ry="7" fill="rgba(0,0,0,0.25)" />
        {/* Corps roulé en boule qui respire */}
        <motion.g style={{ originX: '108px', originY: '192px' }} animate={{ scaleY: [1, 1.035, 1] }} transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}>
          <Fur d={ellipse(116, 156, 70, 36)} />
          {tailStripes && <path d="M120 124 q8 10 2 22 M142 128 q8 10 2 20 M164 138 q6 8 0 16" stroke={dark} strokeWidth="4" opacity="0.6" fill="none" strokeLinecap="round" />}
          <path d="M84 168 q30 14 70 4" stroke={dark} strokeWidth="1.5" opacity="0.35" fill="none" />
          {/* Queue enroulée devant */}
          <path d="M180 162 C 186 196, 108 200, 58 186" fill="none" stroke={dark} strokeWidth="13" strokeLinecap="round" opacity="0.5" />
          <path d="M180 162 C 186 196, 108 200, 58 186" fill="none" stroke={fur} strokeWidth="11" strokeLinecap="round" />
          {tailStripes && <path d="M168 186 l-2 -9 M146 193 l-1 -10 M122 195 l0 -10 M98 194 l1 -10" stroke={dark} strokeWidth="3.5" opacity="0.6" strokeLinecap="round" />}
          {/* Pattes sous le menton */}
          <Fur d={ellipse(62, 182, 15, 8)} />
          <Fur d={ellipse(88, 185, 15, 8)} />
        </motion.g>
        {/* Tête posée sur l'avant du corps */}
        <motion.g transform="translate(-28 62) scale(0.95)" animate={{ y: [0, 1.6, 0] }} transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}>
          {head('sleep')}
        </motion.g>
      </svg>
    );

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className="overflow-visible">
      {defs}
      <motion.ellipse cx="100" cy="192" rx="54" ry="6.5" fill="rgba(0,0,0,0.25)" animate={walking ? { rx: [54, 48, 54] } : {}} transition={{ duration: 0.5, repeat: Infinity }} />
      {/* Queue qui ondule */}
      <motion.g style={{ originX: '126px', originY: '186px' }} animate={happy ? { rotate: [-14, 14, -14] } : { rotate: [-5, 7, -5] }} transition={{ duration: happy ? 0.45 : 2.8, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M124 186 C 156 192, 176 180, 172 156 C 169 140, 174 130, 182 124" fill="none" stroke={dark} strokeWidth="11" strokeLinecap="round" opacity="0.45" />
        <path d="M124 186 C 156 192, 176 180, 172 156 C 169 140, 174 130, 182 124" fill="none" stroke={fur} strokeWidth="9" strokeLinecap="round" />
        <path d="M124 186 C 156 192, 176 180, 172 156 C 169 140, 174 130, 182 124" fill="none" stroke={fur} strokeWidth="12" strokeDasharray="0.1 3.4" strokeLinecap="round" />
        {tailStripes && <path d="M150 191 l1 -9 M166 182 l-7 -5 M173 166 l-9 0 M171 148 l-9 2 M176 133 l-8 -3" stroke={dark} strokeWidth="3.2" opacity="0.65" strokeLinecap="round" />}
      </motion.g>
      {/* Corps assis bien droit */}
      <motion.g style={{ originX: '100px', originY: '190px' }} animate={{ scaleY: [1, 1.025, 1] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}>
        <Fur d="M70 190 C 62 162, 66 130, 80 110 L 120 110 C 134 130, 138 162, 130 190 Z" />
        {/* Plastron clair */}
        <path d="M84 112 C 88 130, 112 130, 116 112 C 114 140, 108 156, 100 160 C 92 156, 86 140, 84 112 Z" fill={`url(#${id('bib')})`} />
        <path d="M94 116 l-3 10 M100 117 v11 M106 116 l3 10" stroke={light} strokeWidth="1.6" opacity="0.8" strokeLinecap="round" />
        {tailStripes && <path d="M74 132 q8 4 10 12 M126 132 q-8 4 -10 12 M70 150 q8 3 10 10 M130 150 q-8 3 -10 10" stroke={dark} strokeWidth="3.2" opacity="0.6" fill="none" strokeLinecap="round" />}
        {/* Cuisses */}
        <Fur d="M66 190 C 52 186, 50 160, 64 150 C 76 146, 82 168, 82 190 Z" />
        <Fur d="M134 190 C 148 186, 150 160, 136 150 C 124 146, 118 168, 118 190 Z" />
        <path d="M64 168 q7 -10 13 -3 M136 168 q-7 -10 -13 -3" stroke={dark} strokeWidth="1.6" fill="none" opacity="0.55" />
      </motion.g>
      {/* Pattes avant */}
      {[90, 110].map((cx, i) => (
        <motion.g key={cx} animate={walking ? { y: i ? [-6, 0, -6] : [0, -6, 0] } : { y: 0 }} transition={{ duration: 0.5, repeat: walking ? Infinity : 0 }}>
          <Fur d={`M${cx - 9} 130 L${cx - 9} 184 C ${cx - 9} 192, ${cx + 9} 192, ${cx + 9} 184 L${cx + 9} 130 Z`} />
          <path d={`M${cx - 3.5} 184.5 v5 M${cx + 3.5} 184.5 v5`} stroke={dark} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
          <ellipse cx={cx} cy="188" rx="7" ry="2.5" fill={light} opacity="0.35" />
        </motion.g>
      ))}
      <path d="M100 136 v52" stroke={dark} strokeWidth="1.6" opacity="0.5" />
      {/* Tête */}
      <motion.g
        style={{ originX: '100px', originY: '116px' }}
        animate={action === 'look' ? { rotate: [0, -12, -12, 10, 10, 0] } : walking ? { y: [0, -3, 0] } : happy ? { rotate: [-7, 7, -7] } : { rotate: [0, 3, 0] }}
        transition={action === 'look' ? { duration: 3, ease: 'easeInOut' } : { duration: walking || happy ? 0.5 : 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {head(happy ? 'happy' : 'open')}
      </motion.g>
    </svg>
  );
}
