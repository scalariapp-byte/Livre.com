import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export type PetAction = 'idle' | 'walk' | 'happy' | 'sleep' | 'look';

interface Palette {
  fur: string;
  dark: string;
  belly: string;
  inner: string;
  nose: string;
}

type Ears = 'cat' | 'fox' | 'dog' | 'rabbit' | 'round';
type Tail = 'cat' | 'fox' | 'dog' | 'pom' | 'stub';

interface Look {
  palette: Palette;
  ears: Ears;
  tail: Tail;
  whiskers?: boolean;
  stripes?: boolean;
  muzzle?: boolean;
  panda?: boolean;
  chubby?: boolean;
}

/** Apparence dessinée de chaque animal (le hibou et la tortue restent en emoji). */
export const LOOKS: Record<string, Look> = {
  cat: { palette: { fur: '#F2B544', dark: '#D4892A', belly: '#FCE6B8', inner: '#F6A9A3', nose: '#E07A7A' }, ears: 'cat', tail: 'cat', whiskers: true, stripes: true },
  dog: { palette: { fur: '#C98A55', dark: '#8A5A35', belly: '#F4E0C8', inner: '#B07045', nose: '#3A2A22' }, ears: 'dog', tail: 'dog', muzzle: true },
  fox: { palette: { fur: '#F07A2E', dark: '#3A2A20', belly: '#FFF4E6', inner: '#3A2A20', nose: '#2A1D16' }, ears: 'fox', tail: 'fox', whiskers: true, muzzle: true },
  rabbit: { palette: { fur: '#EEE7E2', dark: '#CFC3BB', belly: '#FFFFFF', inner: '#F6B6C1', nose: '#E58A9A' }, ears: 'rabbit', tail: 'pom', whiskers: true },
  panda: { palette: { fur: '#FAFAF7', dark: '#2B2B2E', belly: '#FFFFFF', inner: '#2B2B2E', nose: '#2B2B2E' }, ears: 'round', tail: 'stub', panda: true },
  hamster: { palette: { fur: '#E8B47A', dark: '#C98C4E', belly: '#FFF1DD', inner: '#F2A0A0', nose: '#D9787F' }, ears: 'round', tail: 'stub', whiskers: true, chubby: true },
};

const blink = { scaleY: [1, 1, 0.08, 1] , transition: { duration: 0.35, times: [0, 0.5, 0.75, 1], repeat: Infinity, repeatDelay: 3.2 } };

function Ear({ side, look }: { side: -1 | 1; look: Look }) {
  const { fur, inner, dark } = look.palette;
  const m = (x: number) => 100 + side * (100 - x); // miroir horizontal
  switch (look.ears) {
    case 'cat':
    case 'fox': {
      const tip = look.ears === 'fox' ? 18 : 30;
      return (
        <g>
          <path d={`M${m(62)} 74 L${m(68)} ${tip} L${m(97)} 56 Z`} fill={fur} stroke={look.ears === 'fox' ? fur : look.palette.dark} strokeWidth="2" strokeLinejoin="round" />
          <path d={`M${m(69)} 66 L${m(72)} ${tip + 14} L${m(88)} 58 Z`} fill={inner} />
        </g>
      );
    }
    case 'dog':
      return <ellipse cx={m(60)} cy="92" rx="14" ry="30" fill={dark} transform={`rotate(${side * -18} ${m(60)} 92)`} />;
    case 'rabbit':
      return (
        <g>
          <ellipse cx={m(80)} cy="30" rx="12" ry="36" fill={fur} />
          <ellipse cx={m(80)} cy="32" rx="6" ry="27" fill={inner} />
        </g>
      );
    case 'round':
      return (
        <g>
          <circle cx={m(64)} cy="56" r="15" fill={look.panda ? dark : fur} />
          {!look.panda && <circle cx={m(64)} cy="57" r="8" fill={inner} />}
        </g>
      );
  }
}

function TailShape({ look }: { look: Look }) {
  const { fur, dark, belly } = look.palette;
  switch (look.tail) {
    case 'cat':
      return (
        <g>
          <path d="M132 168 C 168 160, 176 128, 160 108" fill="none" stroke={fur} strokeWidth="13" strokeLinecap="round" />
          <path d="M150 162 l8 -5 M160 146 l9 -2 M163 128 l9 1" stroke={dark} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case 'fox':
      return (
        <g>
          <path d="M128 170 C 170 172, 190 130, 168 100 C 160 122, 150 140, 128 150 Z" fill={fur} />
          <path d="M168 100 C 160 112, 160 118, 176 120 C 180 112, 176 104, 168 100 Z" fill={belly} />
        </g>
      );
    case 'dog':
      return <path d="M132 160 C 152 152, 160 138, 156 124" fill="none" stroke={fur} strokeWidth="11" strokeLinecap="round" />;
    case 'pom':
      return <circle cx="140" cy="168" r="11" fill={belly} />;
    case 'stub':
      return <circle cx="138" cy="170" r="7" fill={look.panda ? dark : fur} />;
  }
}

interface Props {
  species: string;
  action: PetAction;
  size?: number;
  head?: ReactNode;
  side?: ReactNode;
}

/** Animal dessiné et animé (respiration, clignement, queue, marche, sommeil, câlin). */
export function PetSprite({ species, action, size = 180, head, side }: Props) {
  const look = LOOKS[species] ?? LOOKS.cat;
  const { fur, dark, belly, nose } = look.palette;
  const sleeping = action === 'sleep';
  const happy = action === 'happy';
  const walking = action === 'walk';
  const eyesClosed = sleeping || happy;
  const headR = look.chubby ? 46 : 42;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className="overflow-visible"
        animate={sleeping ? { y: 10 } : { y: 0 }}
        transition={{ type: 'spring', bounce: 0.3 }}
      >
        {/* Ombre */}
        <motion.ellipse cx="100" cy="190" rx="54" ry="7" fill="rgba(0,0,0,0.18)" animate={walking ? { rx: [54, 48, 54] } : {}} transition={{ duration: 0.5, repeat: Infinity }} />

        {/* Queue */}
        <motion.g
          style={{ originX: '132px', originY: '168px' }}
          animate={sleeping ? { rotate: 40 } : happy ? { rotate: [-18, 18, -18] } : { rotate: [-8, 10, -8] }}
          transition={sleeping ? { duration: 0.6 } : { duration: happy ? 0.45 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <TailShape look={look} />
        </motion.g>

        {/* Corps qui respire */}
        <motion.g
          style={{ originX: '100px', originY: '185px' }}
          animate={{ scaleY: sleeping ? [0.86, 0.9, 0.86] : [1, 1.03, 1], scaleX: sleeping ? 1.12 : 1 }}
          transition={{ duration: sleeping ? 3.6 : 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ellipse cx="100" cy="150" rx={look.chubby ? 50 : 45} ry="38" fill={fur} />
          <ellipse cx="100" cy="158" rx="26" ry="24" fill={belly} />
          {look.stripes && <path d="M66 136 q8 4 6 12 M134 136 q-8 4 -6 12 M62 154 q8 3 7 10 M138 154 q-8 3 -7 10" stroke={dark} strokeWidth="4" fill="none" strokeLinecap="round" />}
          {look.panda && (
            <>
              <ellipse cx="62" cy="150" rx="14" ry="24" fill={dark} />
              <ellipse cx="138" cy="150" rx="14" ry="24" fill={dark} />
            </>
          )}
          {/* Pattes arrière */}
          <ellipse cx="70" cy="181" rx="17" ry="9" fill={look.panda ? dark : fur} />
          <ellipse cx="130" cy="181" rx="17" ry="9" fill={look.panda ? dark : fur} />
        </motion.g>

        {/* Pattes avant (marche en alternance) */}
        {!sleeping && (
          <>
            <motion.ellipse cx="86" cy="183" rx="10" ry="8" fill={look.panda ? dark : belly} animate={walking ? { cy: [183, 176, 183] } : { cy: 183 }} transition={{ duration: 0.5, repeat: walking ? Infinity : 0 }} />
            <motion.ellipse cx="114" cy="183" rx="10" ry="8" fill={look.panda ? dark : belly} animate={walking ? { cy: [176, 183, 176] } : { cy: 183 }} transition={{ duration: 0.5, repeat: walking ? Infinity : 0 }} />
          </>
        )}

        {/* Tête */}
        <motion.g
          style={{ originX: '100px', originY: '130px' }}
          animate={
            sleeping
              ? { rotate: 14, y: 22 }
              : action === 'look'
                ? { rotate: [0, -12, -12, 10, 10, 0], y: 0 }
                : walking
                  ? { y: [0, -3, 0], rotate: 0 }
                  : happy
                    ? { rotate: [-6, 6, -6], y: 0 }
                    : { rotate: [0, 3, 0], y: 0 }
          }
          transition={
            sleeping
              ? { duration: 0.8 }
              : action === 'look'
                ? { duration: 3, ease: 'easeInOut' }
                : { duration: walking ? 0.5 : happy ? 0.5 : 4, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          {/* Oreilles qui frémissent */}
          <motion.g style={{ originX: '76px', originY: '62px' }} animate={sleeping ? {} : { rotate: [0, 0, -9, 0] }} transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 5.5 }}>
            <Ear side={1} look={look} />
          </motion.g>
          <motion.g style={{ originX: '124px', originY: '62px' }} animate={sleeping ? {} : { rotate: [0, 0, 9, 0] }} transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 7 }}>
            <Ear side={-1} look={look} />
          </motion.g>

          <ellipse cx="100" cy="94" rx={headR + (look.chubby ? 6 : 0)} ry={headR} fill={fur} />
          {look.stripes && <path d="M92 56 q2 9 0 14 M100 54 v16 M108 56 q-2 9 0 14" stroke={dark} strokeWidth="4" fill="none" strokeLinecap="round" />}
          {look.muzzle && <ellipse cx="100" cy="110" rx="24" ry="17" fill={belly} />}
          {look.chubby && (
            <>
              <circle cx="66" cy="108" r="15" fill={belly} />
              <circle cx="134" cy="108" r="15" fill={belly} />
            </>
          )}
          {look.panda && (
            <>
              <ellipse cx="82" cy="92" rx="13" ry="16" fill={dark} transform="rotate(-25 82 92)" />
              <ellipse cx="118" cy="92" rx="13" ry="16" fill={dark} transform="rotate(25 118 92)" />
            </>
          )}

          {/* Yeux */}
          {eyesClosed ? (
            <g stroke={look.panda ? '#fff' : '#2B1D14'} strokeWidth="4" fill="none" strokeLinecap="round">
              {happy ? (
                <>
                  <path d="M76 94 q8 -9 16 0" />
                  <path d="M108 94 q8 -9 16 0" />
                </>
              ) : (
                <>
                  <path d="M76 92 q8 7 16 0" />
                  <path d="M108 92 q8 7 16 0" />
                </>
              )}
            </g>
          ) : (
            <motion.g style={{ originX: '100px', originY: '92px' }} animate={blink}>
              <ellipse cx="84" cy="92" rx="7" ry="9" fill="#2B1D14" />
              <ellipse cx="116" cy="92" rx="7" ry="9" fill="#2B1D14" />
              <circle cx="86.5" cy="88.5" r="2.6" fill="#fff" />
              <circle cx="118.5" cy="88.5" r="2.6" fill="#fff" />
            </motion.g>
          )}

          {/* Joues, nez, bouche, moustaches */}
          <motion.ellipse cx="72" cy="106" rx="8" ry="5" fill="#FF8FA3" animate={{ opacity: happy ? 0.85 : 0.35 }} />
          <motion.ellipse cx="128" cy="106" rx="8" ry="5" fill="#FF8FA3" animate={{ opacity: happy ? 0.85 : 0.35 }} />
          <path d="M95 103 h10 l-5 6 z" fill={nose} strokeLinejoin="round" stroke={nose} strokeWidth="2" />
          <path d={happy ? 'M92 111 q8 10 16 0' : 'M93 111 q7 6 7 0 q0 6 7 0'} stroke="#2B1D14" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {look.whiskers && (
            <g stroke={look.panda ? dark : '#5A4636'} strokeWidth="1.8" strokeLinecap="round" opacity="0.7">
              <path d="M70 104 l-20 -4 M70 109 l-20 2" />
              <path d="M130 104 l20 -4 M130 109 l20 2" />
            </g>
          )}
        </motion.g>
      </motion.svg>

      {/* Accessoires */}
      {head && (
        <motion.span
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 leading-none"
          style={{ top: size * (sleeping ? 0.25 : 0.12), fontSize: size * 0.2 }}
          animate={walking ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {head}
        </motion.span>
      )}
      {side && (
        <span className="pointer-events-none absolute leading-none" style={{ right: -size * 0.12, bottom: size * 0.02, fontSize: size * 0.22 }}>
          {side}
        </span>
      )}
    </div>
  );
}
