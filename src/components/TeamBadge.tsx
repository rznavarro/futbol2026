import React from 'react';
import { TeamId } from '../types/game';

interface TeamBadgeProps {
  teamId: TeamId;
  size?: number;
  className?: string;
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({ teamId, size = 48, className = '' }) => {
  const s = size;

  switch (teamId) {
    case 'real-madrid':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 100 100"
          className={`drop-shadow-md ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Circular shield */}
          <circle cx="50" cy="56" r="38" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="5" />
          {/* Diagonal Royal Sash */}
          <path d="M22 40L72 84L80 74L30 30Z" fill="#3B2874" />
          {/* Crown */}
          <path
            d="M26 30L34 20L50 28L66 20L74 30L68 34L32 34Z"
            fill="#D4AF37"
            stroke="#997010"
            strokeWidth="2"
          />
          <circle cx="50" cy="16" r="3.5" fill="#EF4444" stroke="#D4AF37" strokeWidth="1.5" />
          <circle cx="34" cy="18" r="2.5" fill="#3B82F6" stroke="#D4AF37" strokeWidth="1.5" />
          <circle cx="66" cy="18" r="2.5" fill="#3B82F6" stroke="#D4AF37" strokeWidth="1.5" />
          {/* Center Monogram Insignia */}
          <circle cx="50" cy="56" r="24" stroke="#D4AF37" strokeWidth="2.5" fill="none" />
          <text
            x="50"
            y="64"
            textAnchor="middle"
            fill="#D4AF37"
            fontWeight="bold"
            fontSize="26"
            fontFamily="Montserrat, system-ui, sans-serif"
          >
            M
          </text>
        </svg>
      );

    case 'fc-barcelona':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 100 100"
          className={`drop-shadow-md ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shield Outline with Golden Bezel */}
          <path
            d="M18 18H82C82 46 74 76 50 92C26 76 18 46 18 18Z"
            fill="#004D98"
            stroke="#EDBB00"
            strokeWidth="5"
          />
          {/* Upper Left: Saint George Cross */}
          <path d="M18 18H50V46H18Z" fill="#FFFFFF" />
          <rect x="31" y="18" width="6" height="28" fill="#DC2626" />
          <rect x="18" y="29" width="32" height="6" fill="#DC2626" />
          {/* Upper Right: Catalan Senyera Stripes */}
          <path d="M50 18H82V46H50Z" fill="#EDBB00" />
          <rect x="56" y="18" width="5" height="28" fill="#DC2626" />
          <rect x="67" y="18" width="5" height="28" fill="#DC2626" />
          <rect x="77" y="18" width="5" height="28" fill="#DC2626" />
          {/* Dividing Gold Belt */}
          <rect x="18" y="44" width="64" height="6" fill="#EDBB00" />
          {/* Lower Blaugrana Vertical Stripes */}
          <path d="M22 50H78C74 72 50 86 50 86C50 86 26 72 22 50Z" fill="#8A1538" />
          <path d="M33 50H45C45 68 50 82 50 82C50 82 35 68 33 50Z" fill="#004D98" />
          <path d="M55 50H67C65 68 50 82 50 82C50 82 65 68 67 50Z" fill="#004D98" />
          {/* Golden Vintage Ball */}
          <circle cx="50" cy="62" r="11" fill="#EDBB00" stroke="#8A1538" strokeWidth="2" />
        </svg>
      );

    case 'manchester-city':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 100 100"
          className={`drop-shadow-md ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Concentric Double Rings */}
          <circle cx="50" cy="50" r="44" fill="#1C2C5B" stroke="#6CABDD" strokeWidth="4" />
          <circle cx="50" cy="50" r="34" fill="#FFFFFF" />
          {/* Center Sky Blue Shield */}
          <path
            d="M32 30H68V54C68 66 50 74 50 74C50 74 32 66 32 54Z"
            fill="#6CABDD"
            stroke="#1C2C5B"
            strokeWidth="2"
          />
          {/* Golden Ship (Navío) */}
          <path
            d="M36 40C42 34 58 34 64 40L60 45H40L36 40Z"
            fill="#EDBB00"
            stroke="#1C2C5B"
            strokeWidth="1.5"
          />
          <path d="M50 32V42M44 35H56" stroke="#1C2C5B" strokeWidth="2" />
          {/* Red Rose of Lancashire */}
          <circle cx="50" cy="60" r="7" fill="#DC2626" />
          <circle cx="50" cy="60" r="3.5" fill="#EDBB00" />
        </svg>
      );

    case 'bayern-munich':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 100 100"
          className={`drop-shadow-md ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Crimson Ring */}
          <circle cx="50" cy="50" r="44" fill="#DC052D" stroke="#FFFFFF" strokeWidth="4" />
          <circle cx="50" cy="50" r="36" fill="#0066B2" stroke="#FFFFFF" strokeWidth="2" />
          {/* Center Bavarian Diamond Lozenges */}
          <mask id="bavarian-mask">
            <circle cx="50" cy="50" r="34" fill="#FFFFFF" />
          </mask>
          <g mask="url(#bavarian-mask)">
            <rect x="15" y="15" width="70" height="70" fill="#0066B2" />
            <path
              d="M10 20L30 0L50 20L30 40Z M30 40L50 20L70 40L50 60Z M50 60L70 40L90 60L70 80Z M10 60L30 40L50 60L30 80Z M30 80L50 60L70 80L50 100Z"
              fill="#FFFFFF"
            />
          </g>
          {/* Golden Stars on top */}
          <path
            d="M50 6L52 11L57 11L53 14L55 19L50 16L45 19L47 14L43 11L48 11Z"
            fill="#FFD700"
          />
        </svg>
      );

    case 'liverpool':
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 100 100"
          className={`drop-shadow-md ${className}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Anfield Crimson Shield */}
          <path
            d="M20 18H80V54C80 74 50 90 50 90C50 90 20 74 20 54Z"
            fill="#C8102E"
            stroke="#00B2A9"
            strokeWidth="4"
          />
          {/* Golden Liverbird Silhouette */}
          <path
            d="M50 30C53 30 55 33 55 36C55 38 52 40 50 42C48 45 48 50 47 55C50 54 54 53 58 55C60 52 61 47 64 45C61 48 60 54 62 58C60 62 55 64 50 66C48 70 45 74 42 76C44 72 45 68 46 64C42 62 39 58 40 52C42 54 44 56 47 55C46 50 45 44 47 38C48 35 47 32 50 30Z"
            fill="#F6EB61"
          />
          {/* Twig / Seaweed in beak */}
          <path d="M54 36C58 35 62 36 65 34" stroke="#00B2A9" strokeWidth="2" strokeLinecap="round" />
          {/* Shankly Gates Crest Top */}
          <path d="M26 18C36 10 64 10 74 18" stroke="#00B2A9" strokeWidth="3" />
        </svg>
      );

    default:
      return (
        <div
          style={{ width: s, height: s }}
          className="rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center font-bold text-white text-xs"
        >
          FC
        </div>
      );
  }
};
