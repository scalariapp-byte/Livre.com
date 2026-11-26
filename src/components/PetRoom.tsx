/** Petite chambre illustrée derrière le compagnon (jour, ou nuit quand il dort). */
import type { RoomItem } from '@/lib/pet';

export function PetRoom({ night, items }: { night: boolean; items: Set<RoomItem['id']> }) {
  const has = (id: RoomItem['id']) => items.has(id);
  const wallTop = night ? '#2E3150' : '#F4E4D0';
  const wallBottom = night ? '#22243B' : '#EAD3B8';
  const skyTop = night ? '#0E1736' : '#8FCBF2';
  const skyBottom = night ? '#2A3B70' : '#D8F0FD';
  const floor = night ? '#5B4030' : '#B98657';
  const floorDark = night ? '#4A3427' : '#A27349';
  const spines = ['#C95C3A', '#4348C4', '#3D7D62', '#B07412', '#8C4080', '#1673A0', '#D98A9A', '#5C3D2E'];
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full" aria-hidden>
      <defs>
        <linearGradient id="room-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={wallTop} />
          <stop offset="1" stopColor={wallBottom} />
        </linearGradient>
        <linearGradient id="room-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop} />
          <stop offset="1" stopColor={skyBottom} />
        </linearGradient>
        <radialGradient id="room-cushion" cx="50%" cy="35%" r="70%">
          <stop offset="0" stopColor={night ? '#9A7FB8' : '#F5B7C3'} />
          <stop offset="1" stopColor={night ? '#5E4A80' : '#D97F94'} />
        </radialGradient>
        <radialGradient id="room-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={night ? '#FFE9A8' : '#FFFFFF'} stopOpacity={night ? 0.35 : 0.0} />
          <stop offset="1" stopColor="#FFE9A8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Mur et papier peint discret */}
      <rect width="400" height="200" fill="url(#room-wall)" />
      {has('wallpaper') &&
        Array.from({ length: 27 }, (_, i) => (
          <text key={i} x={14 + (i % 9) * 46 + (Math.floor(i / 9) % 2) * 23} y={26 + Math.floor(i / 9) * 56} fontSize="11" opacity={night ? 0.25 : 0.35} fill={night ? '#8E86C0' : '#D99AA8'}>
            ✿
          </text>
        ))}
      {has('frame') && (
        <g transform="translate(160 40)">
          <rect width="56" height="44" rx="4" fill={night ? '#6B4A36' : '#9A6A48'} />
          <rect x="5" y="5" width="46" height="34" rx="2" fill={night ? '#3B4470' : '#CFE6F5'} />
          <path d="M5 34 l14 -14 l10 10 l8 -6 l14 10 v5 h-46 z" fill={night ? '#3E6B52' : '#7BBF7A'} />
          <circle cx="40" cy="14" r="5" fill={night ? '#FFF3C4' : '#FFD75E'} />
        </g>
      )}
      {has('garland') && (
        <g>
          <path d="M0 14 Q 100 40 200 16 T 400 16" fill="none" stroke={night ? '#8A7A60' : '#A88A60'} strokeWidth="1.5" />
          {Array.from({ length: 12 }, (_, i) => {
            const x = 16 + i * 33;
            const y = 14 + Math.sin((x / 400) * Math.PI * 2) * -10 + 10;
            return <circle key={i} cx={x} cy={y} r="3.4" fill={['#FFD75E', '#FF8FA3', '#8FD3FF', '#B8F28F'][i % 4]} opacity={night ? 1 : 0.85} />;
          })}
        </g>
      )}

      {/* Fenêtre avec rideaux */}
      {has('window') && (
      <g transform="translate(250 30)">
        <rect x="-6" y="-6" width="122" height="102" rx="10" fill={night ? '#6B4A36' : '#9A6A48'} />
        <rect width="110" height="90" rx="6" fill="url(#room-sky)" />
        {night ? (
          <>
            <circle cx="80" cy="26" r="13" fill="#FFF3C4" />
            <circle cx="86" cy="22" r="11" fill={skyTop} />
            {[[18, 18], [40, 40], [60, 14], [24, 60], [94, 60], [70, 70]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="1.6" fill="#FFFFFF" opacity="0.9" />
            ))}
          </>
        ) : (
          <>
            <circle cx="82" cy="24" r="12" fill="#FFD75E" />
            <g fill="#FFFFFF" opacity="0.95">
              <ellipse cx="30" cy="30" rx="16" ry="7" />
              <ellipse cx="42" cy="26" rx="11" ry="7" />
              <ellipse cx="66" cy="60" rx="14" ry="6" />
            </g>
          </>
        )}
        <rect x="53" width="4" height="90" fill={night ? '#6B4A36' : '#9A6A48'} />
        <rect y="43" width="110" height="4" fill={night ? '#6B4A36' : '#9A6A48'} />
        <rect x="-10" y="92" width="130" height="8" rx="3" fill={night ? '#7A5640' : '#B27E58'} />
        {has('curtains') && (
          <>
            <path d="M-14 -10 C 6 30, -2 70, 10 96 L -14 96 Z" fill={night ? '#7B5C9C' : '#E58FA1'} />
            <path d="M124 -10 C 104 30, 112 70, 100 96 L 124 96 Z" fill={night ? '#7B5C9C' : '#E58FA1'} />
            <rect x="-16" y="-14" width="142" height="6" rx="3" fill={night ? '#5A4030' : '#8A5A3C'} />
          </>
        )}
      </g>
      )}

      {/* Étagère de livres */}
      <g transform="translate(26 58)">
        {has('shelf') && (
          <>
            <rect width="104" height="10" rx="3" fill={night ? '#6B4A36' : '#9A6A48'} y="56" />
            <rect width="104" height="10" rx="3" fill={night ? '#6B4A36' : '#9A6A48'} y="112" />
          </>
        )}
        {has('shelf') && has('books') && spines.map((c, i) => (
          <rect key={i} x={6 + i * 12} y={56 - (30 + (i % 3) * 5)} width="10" height={30 + (i % 3) * 5} rx="2" fill={c} opacity={night ? 0.75 : 1} />
        ))}
        {has('shelf') && has('books') && spines.slice(0, 6).map((_, i) => (
          <rect key={`b${i}`} x={30 + i * 11} y={112 - (26 + (i % 2) * 6)} width="9" height={26 + (i % 2) * 6} rx="2" fill={spines[(i + 3) % spines.length]} opacity={night ? 0.75 : 1} />
        ))}
        {has('plant') && (
          <g transform={has('shelf') ? undefined : 'translate(-10 70)'}>
            <path d="M10 112 h18 l-3 -16 h-12 z" fill="#C97B4A" />
            <path d="M19 96 C 6 84, 4 74, 10 66 C 16 76, 18 84, 19 96 C 22 82, 28 72, 36 70 C 34 82, 28 90, 19 96 Z" fill="#4E9A62" />
          </g>
        )}
      </g>

      {/* Lampe */}
      {has('lamp') && (
        <g transform="translate(150 150)">
          <rect x="-3" y="0" width="6" height="48" fill={night ? '#6B5A4A' : '#8A7560'} />
          <ellipse cx="0" cy="48" rx="14" ry="4" fill={night ? '#6B5A4A' : '#8A7560'} />
          <path d="M-18 0 L 18 0 L 10 -22 L -10 -22 Z" fill={night ? '#F6D58A' : '#F2C7A0'} />
        </g>
      )}
      {night && has('lamp') && <circle cx="150" cy="140" r="130" fill="url(#room-glow)" />}

      {/* Parquet */}
      <rect y="200" width="400" height="60" fill={floor} />
      {Array.from({ length: 5 }, (_, i) => (
        <rect key={i} y={208 + i * 12} width="400" height="1.5" fill={floorDark} />
      ))}
      <rect y="196" width="400" height="6" fill={night ? '#3E2C22' : '#8A5E3C'} />

      {/* Tapis et coussin */}
      {has('rug') && (
        <>
          <ellipse cx="200" cy="238" rx="150" ry="20" fill={night ? '#3D3460' : '#E9C38F'} opacity="0.9" />
          <ellipse cx="200" cy="238" rx="130" ry="15" fill="none" stroke={night ? '#544A80' : '#D7A86A'} strokeWidth="2" strokeDasharray="6 5" />
        </>
      )}
      {has('cushion') && (
        <>
          <ellipse cx="200" cy="236" rx="78" ry="14" fill="url(#room-cushion)" />
          <ellipse cx="200" cy="232" rx="64" ry="8" fill="#FFFFFF" opacity="0.18" />
        </>
      )}
    </svg>
  );
}
