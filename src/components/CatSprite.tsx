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
}

export const CAT_COATS: CatCoat[] = [
  { id: 'chocolate', name: 'Chocolat', fur: '#6E4A38', light: '#8C6450', dark: '#4A3024', inner: '#C99089', nose: '#C9858A', eyeIn: '#FFD25A', eyeOut: '#E07A12', whisker: '#F3E9E2' },
  { id: 'ginger', name: 'Roux', fur: '#D9822B', light: '#F2A75A', dark: '#A65B1A', inner: '#F2A6A0', nose: '#E07A80', eyeIn: '#D9F08A', eyeOut: '#6FA83A', whisker: '#FFF6EA' },
  { id: 'grey', name: 'Gris', fur: '#8A8C97', light: '#ADAFB9', dark: '#5F6170', inner: '#D9A3A8', nose: '#C98A93', eyeIn: '#F4E27A', eyeOut: '#D49A1E', whisker: '#F4F4F6' },
  { id: 'black', name: 'Noir', fur: '#2E2A2C', light: '#4B4448', dark: '#151213', inner: '#8E6468', nose: '#5A4044', eyeIn: '#FFF08A', eyeOut: '#E2B21F', whisker: '#D9D4D6' },
  { id: 'white', name: 'Blanc', fur: '#EFEBE5', light: '#FFFFFF', dark: '#C9C1B6', inner: '#F2B2B6', nose: '#E59AA3', eyeIn: '#BFE3FF', eyeOut: '#4A8FD6', whisker: '#9E968C' },
  { id: 'cream', name: 'Crème', fur: '#E2C394', light: '#F4DDB7', dark: '#B8956A', inner: '#EFAAA8', nose: '#D98C8F', eyeIn: '#FFE08A', eyeOut: '#D8861C', whisker: '#FFFFFF' },
];

export const coatOf = (id?: string) => CAT_COATS.find((c) => c.id === id) ?? CAT_COATS[1];

/** Chat au style plus réaliste : grosse tête, grands yeux, pelage duveteux. */
export function CatSprite({ action, size, coat }: { action: PetAction; size: number; coat: CatCoat }) {
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `${n}-${uid}`;
  const sleeping = action === 'sleep';
  const happy = action === 'happy';
  const walking = action === 'walk';
  const { fur, light, dark, inner, nose, eyeIn, eyeOut, whisker } = coat;

  const defs = (
    <defs>
      {/* Pelage duveteux : bords légèrement ébouriffés + grain */}
      <filter id={id('fuzz')} x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.5" xChannelSelector="R" yChannelSelector="G" result="fuzzy" />
        <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="1" seed="2" result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" result="grainA" />
        <feComposite in="grainA" in2="fuzzy" operator="in" result="grainIn" />
        <feMerge>
          <feMergeNode in="fuzzy" />
          <feMergeNode in="grainIn" />
        </feMerge>
      </filter>
      <radialGradient id={id('fur')} cx="40%" cy="28%" r="85%">
        <stop offset="0%" stopColor={light} />
        <stop offset="60%" stopColor={fur} />
        <stop offset="100%" stopColor={dark} />
      </radialGradient>
      <radialGradient id={id('eye')} cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor={eyeIn} />
        <stop offset="100%" stopColor={eyeOut} />
      </radialGradient>
    </defs>
  );

  const eyes = happy ? (
    <g stroke="#2A1A12" strokeWidth="4" fill="none" strokeLinecap="round">
      <path d="M68 80 q12 -11 24 0" />
      <path d="M108 80 q12 -11 24 0" />
    </g>
  ) : (
    <motion.g style={{ originX: '100px', originY: '78px' }} animate={{ scaleY: [1, 1, 0.06, 1] }} transition={{ duration: 0.32, times: [0, 0.5, 0.75, 1], repeat: Infinity, repeatDelay: 3.6 }}>
      {[80, 120].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="78" r="13.5" fill="#2A1A12" />
          <circle cx={cx} cy="78" r="12" fill={`url(#${id('eye')})`} />
          <path d={`M${cx - 9} 78 a9 9 0 0 1 18 0`} fill="none" stroke={eyeOut} strokeWidth="1.2" opacity="0.6" />
          <motion.ellipse cx={cx} cy="78" rx="4.2" ry="8.5" fill="#140A06" animate={walking ? { rx: 5 } : { rx: [4.2, 5.4, 4.2] }} transition={{ duration: 5, repeat: Infinity }} />
          <circle cx={cx - 4} cy="72.5" r="3.4" fill="#FFFFFF" />
          <circle cx={cx + 4.5} cy="83" r="1.6" fill="#FFFFFF" opacity="0.85" />
        </g>
      ))}
    </motion.g>
  );

  const face = (
    <g>
      {/* Front et sourcils */}
      <path d="M86 52 q2 6 0 10 M100 50 v12 M114 52 q-2 6 0 10" stroke={dark} strokeWidth="2" opacity="0.5" fill="none" strokeLinecap="round" />
      {sleeping ? (
        <g stroke="#2A1A12" strokeWidth="3.4" fill="none" strokeLinecap="round">
          <path d="M68 80 q12 8 24 0" />
          <path d="M108 80 q12 8 24 0" />
        </g>
      ) : (
        eyes
      )}
      <path d="M95 91 h10 l-5 5.5 z" fill={nose} stroke={nose} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M100 96.5 v3" stroke="#2A1A12" strokeWidth="1.6" />
      <path d={happy ? 'M90 100 q10 10 20 0' : 'M91 100 q4.5 5 9 0 q4.5 5 9 0'} stroke="#2A1A12" strokeWidth="2" fill="none" strokeLinecap="round" />
      <g stroke={whisker} strokeWidth="1.1" strokeLinecap="round" opacity="0.9">
        <path d="M86 95 C 72 92, 58 92, 40 94 M86 98 C 72 98, 58 100, 42 104 M87 101 C 75 103, 64 108, 52 114" fill="none" />
        <path d="M114 95 C 128 92, 142 92, 160 94 M114 98 C 128 98, 142 100, 158 104 M113 101 C 125 103, 136 108, 148 114" fill="none" />
      </g>
    </g>
  );

  const head = (
    <g>
      {/* Oreilles */}
      <motion.g style={{ originX: '74px', originY: '50px' }} animate={sleeping ? {} : { rotate: [0, 0, -8, 0] }} transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 6 }}>
        <path d="M56 58 C 56 42, 60 26, 64 18 C 74 24, 84 32, 92 42 Z" fill={`url(#${id('fur')})`} filter={`url(#${id('fuzz')})`} />
        <path d="M63 50 C 64 40, 66 31, 68 26 C 74 31, 80 36, 85 43 Z" fill={inner} opacity="0.9" />
      </motion.g>
      <motion.g style={{ originX: '126px', originY: '50px' }} animate={sleeping ? {} : { rotate: [0, 0, 8, 0] }} transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 7.5 }}>
        <path d="M144 58 C 144 42, 140 26, 136 18 C 126 24, 116 32, 108 42 Z" fill={`url(#${id('fur')})`} filter={`url(#${id('fuzz')})`} />
        <path d="M137 50 C 136 40, 134 31, 132 26 C 126 31, 120 36, 115 43 Z" fill={inner} opacity="0.9" />
      </motion.g>
      {/* Tête large aux joues rondes */}
      <path d="M50 80 C 48 52, 70 36, 100 36 C 130 36, 152 52, 150 80 C 152 96, 144 110, 128 116 C 116 121, 84 121, 72 116 C 56 110, 48 96, 50 80 Z" fill={`url(#${id('fur')})`} filter={`url(#${id('fuzz')})`} />
      <ellipse cx="100" cy="102" rx="20" ry="11" fill={light} opacity="0.35" />
      {face}
    </g>
  );

  if (sleeping)
    return (
      <svg viewBox="0 0 200 200" width={size} height={size} className="overflow-visible">
        {defs}
        <ellipse cx="104" cy="191" rx="72" ry="7" fill="rgba(0,0,0,0.25)" />
        <motion.g style={{ originX: '104px', originY: '190px' }} animate={{ scaleY: [1, 1.04, 1] }} transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}>
          <ellipse cx="112" cy="160" rx="68" ry="32" fill={`url(#${id('fur')})`} filter={`url(#${id('fuzz')})`} />
          <path d="M176 168 C 178 194, 104 198, 64 188" fill="none" stroke={fur} strokeWidth="11" strokeLinecap="round" filter={`url(#${id('fuzz')})`} />
          <ellipse cx="72" cy="184" rx="14" ry="8" fill={fur} filter={`url(#${id('fuzz')})`} />
          <ellipse cx="96" cy="186" rx="14" ry="8" fill={fur} filter={`url(#${id('fuzz')})`} />
        </motion.g>
        <motion.g transform="translate(-30 64) rotate(-8 100 80) scale(0.92)" animate={{ y: [0, 1.5, 0] }} transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}>
          {head}
        </motion.g>
      </svg>
    );

  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className="overflow-visible">
      {defs}
      <motion.ellipse cx="100" cy="192" rx="54" ry="6.5" fill="rgba(0,0,0,0.25)" animate={walking ? { rx: [54, 48, 54] } : {}} transition={{ duration: 0.5, repeat: Infinity }} />
      {/* Queue fine qui ondule */}
      <motion.g style={{ originX: '126px', originY: '186px' }} animate={happy ? { rotate: [-14, 14, -14] } : { rotate: [-5, 7, -5] }} transition={{ duration: happy ? 0.45 : 2.8, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M124 186 C 156 192, 176 180, 172 156 C 169 140, 174 130, 182 124" fill="none" stroke={fur} strokeWidth="9" strokeLinecap="round" filter={`url(#${id('fuzz')})`} />
      </motion.g>
      {/* Corps assis bien droit */}
      <motion.g style={{ originX: '100px', originY: '190px' }} animate={{ scaleY: [1, 1.025, 1] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}>
        <path d="M70 190 C 62 162, 66 130, 80 110 L 120 110 C 134 130, 138 162, 130 190 Z" fill={`url(#${id('fur')})`} filter={`url(#${id('fuzz')})`} />
        <path d="M94 116 l-3 10 M100 117 v11 M106 116 l3 10" stroke={light} strokeWidth="1.6" opacity="0.7" strokeLinecap="round" />
        {/* Cuisses */}
        <path d="M66 190 C 52 186, 50 160, 64 150 C 76 146, 82 168, 82 190 Z" fill={`url(#${id('fur')})`} filter={`url(#${id('fuzz')})`} />
        <path d="M134 190 C 148 186, 150 160, 136 150 C 124 146, 118 168, 118 190 Z" fill={`url(#${id('fur')})`} filter={`url(#${id('fuzz')})`} />
        <path d="M66 172 q6 -10 12 -4 M134 172 q-6 -10 -12 -4" stroke={dark} strokeWidth="1.6" fill="none" opacity="0.6" />
      </motion.g>
      {/* Pattes avant */}
      {[90, 110].map((cx, i) => (
        <motion.g key={cx} animate={walking ? { y: i ? [-6, 0, -6] : [0, -6, 0] } : { y: 0 }} transition={{ duration: 0.5, repeat: walking ? Infinity : 0 }}>
          <path d={`M${cx - 9} 130 L${cx - 9} 184 C ${cx - 9} 192, ${cx + 9} 192, ${cx + 9} 184 L${cx + 9} 130 Z`} fill={`url(#${id('fur')})`} filter={`url(#${id('fuzz')})`} />
          <path d={`M${cx - 3.5} 184 v5 M${cx + 3.5} 184 v5`} stroke={dark} strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
          <path d={`M${cx - 9} 140 L${cx - 9} 182`} stroke={dark} strokeWidth="1.4" opacity="0.4" />
        </motion.g>
      ))}
      {/* Tête */}
      <motion.g
        style={{ originX: '100px', originY: '116px' }}
        animate={action === 'look' ? { rotate: [0, -12, -12, 10, 10, 0] } : walking ? { y: [0, -3, 0] } : happy ? { rotate: [-7, 7, -7] } : { rotate: [0, 3, 0] }}
        transition={action === 'look' ? { duration: 3, ease: 'easeInOut' } : { duration: walking || happy ? 0.5 : 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {head}
        {happy && (
          <>
            <ellipse cx="68" cy="96" rx="8" ry="4.5" fill="#FF8FA3" opacity="0.7" />
            <ellipse cx="132" cy="96" rx="8" ry="4.5" fill="#FF8FA3" opacity="0.7" />
          </>
        )}
      </motion.g>
    </svg>
  );
}
