import { motion } from 'framer-motion';
import { useId, type ReactNode } from 'react';

export type PetAction = 'idle' | 'walk' | 'happy' | 'sleep' | 'look';

interface Palette {
  fur: string;
  light: string;
  dark: string;
  line: string;
  belly: string;
  inner: string;
  nose: string;
  iris: string;
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
  tufts?: boolean;
}

/** Apparence dessinée de chaque animal (le hibou et la tortue restent en emoji). */
export const LOOKS: Record<string, Look> = {
  cat: { palette: { fur: '#F4B248', light: '#FFD889', dark: '#D7832A', line: '#9A5A1E', belly: '#FFF0D2', inner: '#F7A7A0', nose: '#E8747E', iris: '#7BB661' }, ears: 'cat', tail: 'cat', whiskers: true, stripes: true, tufts: true },
  dog: { palette: { fur: '#C98A55', light: '#E3AE7C', dark: '#8A5A35', line: '#5E3B22', belly: '#F6E4CD', inner: '#B07045', nose: '#3A2A22', iris: '#6B4226' }, ears: 'dog', tail: 'dog', muzzle: true },
  fox: { palette: { fur: '#F1782B', light: '#FFA25C', dark: '#3A2A20', line: '#9C4512', belly: '#FFF6EA', inner: '#3A2A20', nose: '#2A1D16', iris: '#C7861F' }, ears: 'fox', tail: 'fox', whiskers: true, muzzle: true, tufts: true },
  rabbit: { palette: { fur: '#EFE8E3', light: '#FFFFFF', dark: '#CFC3BB', line: '#9E8F86', belly: '#FFFFFF', inner: '#F6B6C1', nose: '#E58A9A', iris: '#7A5240' }, ears: 'rabbit', tail: 'pom', whiskers: true },
  panda: { palette: { fur: '#FBFBF8', light: '#FFFFFF', dark: '#2B2B2E', line: '#4A4A50', belly: '#FFFFFF', inner: '#2B2B2E', nose: '#2B2B2E', iris: '#3A2A20' }, ears: 'round', tail: 'stub', panda: true },
  hamster: { palette: { fur: '#E9B57C', light: '#FFD9A8', dark: '#C98C4E', line: '#8E5A2C', belly: '#FFF3E2', inner: '#F2A0A0', nose: '#D9787F', iris: '#3A2A20' }, ears: 'round', tail: 'stub', whiskers: true, chubby: true },
};

function Ear({ side, look, g }: { side: -1 | 1; look: Look; g: (n: string) => string }) {
  const { inner, dark, line } = look.palette;
  const m = (x: number) => 100 + side * (100 - x);
  switch (look.ears) {
    case 'cat':
    case 'fox': {
      const tip = look.ears === 'fox' ? 16 : 28;
      return (
        <g>
          <path d={`M${m(60)} 76 Q${m(62)} ${tip + 10} ${m(70)} ${tip} Q${m(84)} ${tip + 16} ${m(98)} 56 Z`} fill={`url(#${g('fur')})`} stroke={line} strokeWidth="2.4" strokeLinejoin="round" />
          <path d={`M${m(68)} 68 Q${m(70)} ${tip + 18} ${m(72)} ${tip + 12} Q${m(82)} ${tip + 22} ${m(89)} 58 Z`} fill={inner} opacity="0.9" />
        </g>
      );
    }
    case 'dog':
      return <path d={`M${m(70)} 62 C ${m(46)} 58, ${m(40)} 98, ${m(52)} 122 C ${m(62)} 126, ${m(70)} 108, ${m(74)} 86 Z`} fill={dark} stroke={line} strokeWidth="2.4" strokeLinejoin="round" />;
    case 'rabbit':
      return (
        <g transform={`rotate(${side * -6} ${m(82)} 60)`}>
          <ellipse cx={m(82)} cy="26" rx="13" ry="38" fill={`url(#${g('fur')})`} stroke={line} strokeWidth="2.4" />
          <ellipse cx={m(82)} cy="30" rx="6.5" ry="27" fill={inner} />
        </g>
      );
    case 'round':
      return (
        <g>
          <circle cx={m(64)} cy="56" r="16" fill={look.panda ? dark : `url(#${g('fur')})`} stroke={line} strokeWidth="2.4" />
          {!look.panda && <circle cx={m(64)} cy="57" r="8.5" fill={inner} />}
        </g>
      );
  }
}

function TailShape({ look, g }: { look: Look; g: (n: string) => string }) {
  const { fur, dark, belly, line } = look.palette;
  switch (look.tail) {
    case 'cat':
      return (
        <g>
          <path d="M132 170 C 172 164, 180 128, 158 104" fill="none" stroke={line} strokeWidth="17" strokeLinecap="round" />
          <path d="M132 170 C 172 164, 180 128, 158 104" fill="none" stroke={fur} strokeWidth="12.5" strokeLinecap="round" />
          <path d="M152 163 l7 -6 M163 147 l9 -2 M166 128 l9 2 M160 112 l8 4" stroke={dark} strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case 'fox':
      return (
        <g>
          <path d="M126 172 C 174 176, 194 128, 168 96 C 160 120, 148 140, 126 150 Z" fill={`url(#${g('fur')})`} stroke={line} strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M168 96 C 158 110, 160 120, 178 122 C 182 112, 178 102, 168 96 Z" fill={belly} />
        </g>
      );
    case 'dog':
      return (
        <g>
          <path d="M132 162 C 154 152, 162 136, 156 120" fill="none" stroke={line} strokeWidth="15" strokeLinecap="round" />
          <path d="M132 162 C 154 152, 162 136, 156 120" fill="none" stroke={fur} strokeWidth="10.5" strokeLinecap="round" />
        </g>
      );
    case 'pom':
      return <circle cx="142" cy="170" r="12" fill={belly} stroke={line} strokeWidth="2.4" />;
    case 'stub':
      return <circle cx="139" cy="172" r="8" fill={look.panda ? dark : fur} stroke={line} strokeWidth="2.4" />;
  }
}

function Eyes({ look, mode }: { look: Look; mode: 'open' | 'happy' | 'sleep' }) {
  const stroke = look.panda ? '#FFFFFF' : '#2B1D14';
  if (mode === 'happy')
    return (
      <g stroke={stroke} strokeWidth="4.5" fill="none" strokeLinecap="round">
        <path d="M75 95 q9 -10 18 0" />
        <path d="M107 95 q9 -10 18 0" />
      </g>
    );
  if (mode === 'sleep')
    return (
      <g stroke={stroke} strokeWidth="4" fill="none" strokeLinecap="round">
        <path d="M75 93 q9 8 18 0" />
        <path d="M107 93 q9 8 18 0" />
      </g>
    );
  return (
    <motion.g style={{ originX: '100px', originY: '93px' }} animate={{ scaleY: [1, 1, 0.08, 1] }} transition={{ duration: 0.35, times: [0, 0.5, 0.75, 1], repeat: Infinity, repeatDelay: 3.4 }}>
      {[84, 116].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="93" rx="9" ry="11" fill="#2B1D14" />
          <ellipse cx={cx} cy="97" rx="6.5" ry="6" fill={look.palette.iris} opacity="0.85" />
          <ellipse cx={cx} cy="96" rx="4" ry="5" fill="#160E09" />
          <circle cx={cx + 3} cy="88" r="3.4" fill="#FFFFFF" />
          <circle cx={cx - 3} cy="99" r="1.6" fill="#FFFFFF" opacity="0.9" />
        </g>
      ))}
    </motion.g>
  );
}

function Face({ look, mode }: { look: Look; mode: 'open' | 'happy' | 'sleep' }) {
  const { nose, dark, line, belly } = look.palette;
  const happy = mode === 'happy';
  return (
    <g>
      {look.muzzle && <ellipse cx="100" cy="111" rx="25" ry="17" fill={belly} />}
      {look.chubby && (
        <>
          <ellipse cx="65" cy="110" rx="16" ry="14" fill={belly} />
          <ellipse cx="135" cy="110" rx="16" ry="14" fill={belly} />
        </>
      )}
      {look.panda && (
        <>
          <ellipse cx="82" cy="93" rx="14" ry="17" fill={dark} transform="rotate(-25 82 93)" />
          <ellipse cx="118" cy="93" rx="14" ry="17" fill={dark} transform="rotate(25 118 93)" />
        </>
      )}
      <Eyes look={look} mode={mode} />
      <motion.ellipse cx="70" cy="108" rx="9" ry="5.5" fill="#FF8FA3" animate={{ opacity: happy ? 0.85 : 0.45 }} />
      <motion.ellipse cx="130" cy="108" rx="9" ry="5.5" fill="#FF8FA3" animate={{ opacity: happy ? 0.85 : 0.45 }} />
      {/* Nez en cœur */}
      <path d="M100 109 C 94 104, 92 100, 96 99 C 98 98.5, 100 100, 100 101 C 100 100, 102 98.5, 104 99 C 108 100, 106 104, 100 109 Z" fill={nose} />
      <path d={happy ? 'M91 112 q9 11 18 0' : 'M92 112 q4 5 8 0 q4 5 8 0'} stroke="#2B1D14" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {happy && <path d="M96 116 q4 6 8 0 z" fill="#E8747E" />}
      {look.whiskers && (
        <g stroke={look.panda ? dark : line} strokeWidth="1.8" strokeLinecap="round" opacity="0.65">
          <path d="M68 105 l-21 -5 M68 110 l-21 2 M69 114 l-17 7" />
          <path d="M132 105 l21 -5 M132 110 l21 2 M131 114 l17 7" />
        </g>
      )}
    </g>
  );
}

interface Props {
  species: string;
  action: PetAction;
  size?: number;
  head?: ReactNode;
  side?: ReactNode;
}

/** Animal dessiné et animé : respiration, clignement, queue, oreilles, marche, sommeil, câlin. */
export function PetSprite({ species, action, size = 180, head, side }: Props) {
  const uid = useId().replace(/:/g, '');
  const g = (n: string) => `${n}-${uid}`;
  const look = LOOKS[species] ?? LOOKS.cat;
  const { fur, light, dark, line, belly } = look.palette;
  const sleeping = action === 'sleep';
  const happy = action === 'happy';
  const walking = action === 'walk';
  const pawFill = look.panda ? dark : belly;

  const defs = (
    <defs>
      <radialGradient id={g('fur')} cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor={light} />
        <stop offset="55%" stopColor={fur} />
        <stop offset="100%" stopColor={look.panda ? "#E2E2E8" : dark} stopOpacity={look.panda ? 1 : 0.55} />
      </radialGradient>
      <radialGradient id={g('belly')} cx="50%" cy="35%" r="70%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor={belly} />
      </radialGradient>
    </defs>
  );

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {sleeping ? (
        /* ---- Pose endormie : roulé en boule ---- */
        <svg viewBox="0 0 200 200" width={size} height={size} className="overflow-visible">
          {defs}
          <ellipse cx="100" cy="190" rx="70" ry="7" fill="rgba(0,0,0,0.22)" />
          <motion.g style={{ originX: '100px', originY: '188px' }} animate={{ scaleY: [1, 1.04, 1] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}>
            <ellipse cx="108" cy="160" rx="66" ry="32" fill={`url(#${g('fur')})`} stroke={line} strokeWidth="2.4" />
            {look.stripes && <path d="M110 132 q6 8 2 16 M128 134 q6 8 2 16 M146 140 q4 7 0 14" stroke={dark} strokeWidth="4" fill="none" strokeLinecap="round" />}
            {look.panda && <ellipse cx="140" cy="160" rx="22" ry="20" fill={dark} />}
            {/* Queue enroulée devant */}
            {look.tail === 'cat' || look.tail === 'dog' || look.tail === 'fox' ? (
              <>
                <path d="M168 168 C 170 192, 100 196, 66 186" fill="none" stroke={line} strokeWidth={look.tail === 'fox' ? 22 : 16} strokeLinecap="round" />
                <path d="M168 168 C 170 192, 100 196, 66 186" fill="none" stroke={fur} strokeWidth={look.tail === 'fox' ? 18 : 11.5} strokeLinecap="round" />
                {look.tail === 'fox' && <circle cx="66" cy="186" r="9" fill={belly} />}
              </>
            ) : null}
            {/* Pattes sous la tête */}
            <ellipse cx="66" cy="182" rx="14" ry="8" fill={pawFill} stroke={line} strokeWidth="2" />
            <ellipse cx="90" cy="184" rx="14" ry="8" fill={pawFill} stroke={line} strokeWidth="2" />
          </motion.g>
          {/* Tête posée */}
          <motion.g transform="translate(-30 52) rotate(-8 100 100)" animate={{ y: [0, 1.5, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}>
            <Ear side={1} look={look} g={g} />
            <Ear side={-1} look={look} g={g} />
            <ellipse cx="100" cy="95" rx={look.chubby ? 50 : 44} ry="41" fill={`url(#${g('fur')})`} stroke={line} strokeWidth="2.4" />
            {look.stripes && <path d="M92 58 q2 8 0 13 M100 56 v15 M108 58 q-2 8 0 13" stroke={dark} strokeWidth="4" fill="none" strokeLinecap="round" />}
            <Face look={look} mode="sleep" />
          </motion.g>
        </svg>
      ) : (
        /* ---- Pose assise / debout ---- */
        <svg viewBox="0 0 200 200" width={size} height={size} className="overflow-visible">
          {defs}
          <motion.ellipse cx="100" cy="190" rx="52" ry="7" fill="rgba(0,0,0,0.22)" animate={walking ? { rx: [52, 46, 52] } : {}} transition={{ duration: 0.5, repeat: Infinity }} />

          <motion.g
            style={{ originX: '132px', originY: '170px' }}
            animate={happy ? { rotate: [-18, 18, -18] } : { rotate: [-8, 10, -8] }}
            transition={{ duration: happy ? 0.45 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <TailShape look={look} g={g} />
          </motion.g>

          <motion.g style={{ originX: '100px', originY: '186px' }} animate={{ scaleY: [1, 1.035, 1] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}>
            {/* Corps en forme de poire */}
            <path d="M56 186 C 46 150, 62 116, 100 114 C 138 116, 154 150, 144 186 Z" fill={`url(#${g('fur')})`} stroke={line} strokeWidth="2.4" strokeLinejoin="round" />
            <ellipse cx="100" cy="158" rx="25" ry="26" fill={`url(#${g('belly')})`} />
            {look.stripes && <path d="M62 140 q9 4 7 12 M138 140 q-9 4 -7 12 M58 160 q9 3 8 10 M142 160 q-9 3 -8 10" stroke={dark} strokeWidth="4" fill="none" strokeLinecap="round" />}
            {look.panda && (
              <>
                <path d="M58 130 C 44 150, 50 178, 70 182 C 76 160, 74 140, 70 128 Z" fill={dark} />
                <path d="M142 130 C 156 150, 150 178, 130 182 C 124 160, 126 140, 130 128 Z" fill={dark} />
              </>
            )}
            {/* Cuisses arrière */}
            <ellipse cx="66" cy="178" rx="18" ry="12" fill={look.panda ? dark : `url(#${g('fur')})`} stroke={line} strokeWidth="2.2" />
            <ellipse cx="134" cy="178" rx="18" ry="12" fill={look.panda ? dark : `url(#${g('fur')})`} stroke={line} strokeWidth="2.2" />
          </motion.g>

          {/* Pattes avant avec coussinets */}
          {[86, 114].map((cx, i) => (
            <motion.g key={cx} animate={walking ? { y: i ? [-7, 0, -7] : [0, -7, 0] } : { y: 0 }} transition={{ duration: 0.5, repeat: walking ? Infinity : 0 }}>
              <rect x={cx - 11} y="174" width="22" height="16" rx="8" fill={pawFill} stroke={line} strokeWidth="2.2" />
              <path d={`M${cx - 4} 183 v4 M${cx} 183 v5 M${cx + 4} 183 v4`} stroke={line} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
            </motion.g>
          ))}

          {/* Tête */}
          <motion.g
            style={{ originX: '100px', originY: '132px' }}
            animate={
              action === 'look' ? { rotate: [0, -12, -12, 10, 10, 0] } : walking ? { y: [0, -3, 0] } : happy ? { rotate: [-7, 7, -7] } : { rotate: [0, 3, 0] }
            }
            transition={action === 'look' ? { duration: 3, ease: 'easeInOut' } : { duration: walking || happy ? 0.5 : 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.g style={{ originX: '76px', originY: '64px' }} animate={{ rotate: [0, 0, -10, 0] }} transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 5.5 }}>
              <Ear side={1} look={look} g={g} />
            </motion.g>
            <motion.g style={{ originX: '124px', originY: '64px' }} animate={{ rotate: [0, 0, 10, 0] }} transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 7 }}>
              <Ear side={-1} look={look} g={g} />
            </motion.g>
            {/* Touffes de joues */}
            {look.tufts && (
              <g fill={`url(#${g('fur')})`} stroke={line} strokeWidth="2.2" strokeLinejoin="round">
                <path d="M60 104 l-12 4 l10 4 l-8 6 l14 -2 z" />
                <path d="M140 104 l12 4 l-10 4 l8 6 l-14 -2 z" />
              </g>
            )}
            <ellipse cx="100" cy="95" rx={look.chubby ? 51 : 45} ry="42" fill={`url(#${g('fur')})`} stroke={line} strokeWidth="2.4" />
            {look.stripes && <path d="M91 56 q2 9 0 14 M100 54 v16 M109 56 q-2 9 0 14" stroke={dark} strokeWidth="4" fill="none" strokeLinecap="round" />}
            <Face look={look} mode={happy ? 'happy' : 'open'} />
          </motion.g>
        </svg>
      )}

      {/* Accessoires */}
      {head && (
        <motion.span
          className="pointer-events-none absolute leading-none"
          style={{ top: size * (sleeping ? 0.36 : 0.1), left: sleeping ? '35%' : '50%', translateX: '-50%', fontSize: size * 0.2 }}
          animate={walking ? { y: [0, -3, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {head}
        </motion.span>
      )}
      {side && (
        <span className="pointer-events-none absolute leading-none" style={{ right: -size * 0.14, bottom: size * 0.02, fontSize: size * 0.22 }}>
          {side}
        </span>
      )}
    </div>
  );
}
