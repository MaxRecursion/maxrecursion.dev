import { useId } from "react";
import type { DeskIllustration } from "@/content/things";

/** Original object studies for the pieces whose exact models aren't specified. */
export function DeskObject({ kind }: { kind: DeskIllustration }) {
  const id = useId().replace(/:/g, "");
  const metal = `url(#${id}-metal)`;
  const dark = `url(#${id}-dark)`;
  const wood = `url(#${id}-wood)`;

  return (
    <svg viewBox="0 0 360 280" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-metal`} x1="80" y1="80" x2="290" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a4a6a3" /><stop offset=".5" stopColor="#555956" /><stop offset="1" stopColor="#282e2b" />
        </linearGradient>
        <linearGradient id={`${id}-dark`} x1="100" y1="90" x2="250" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4c514f" /><stop offset="1" stopColor="#171c1a" />
        </linearGradient>
        <linearGradient id={`${id}-wood`} x1="70" y1="80" x2="250" y2="160" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c29968" /><stop offset="1" stopColor="#8b6340" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`}>
          <stop stopColor="#28251f" stopOpacity=".18" /><stop offset="1" stopColor="#28251f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-light`} x1="180" y1="134" x2="180" y2="222" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d5b16e" stopOpacity=".22" /><stop offset="1" stopColor="#d5b16e" stopOpacity="0" />
        </linearGradient>
        <pattern id={`${id}-weave`} width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M0 1h5M1 0v5" stroke="#8b908b" strokeOpacity=".24" strokeWidth=".7" />
        </pattern>
      </defs>
      <ellipse cx="180" cy="237" rx="120" ry="14" fill={`url(#${id}-shadow)`} />

      {kind === "desk" && <g>
        <path d="m91 130 13-2v97l-13 1z" fill={metal} />
        <path d="m270 114 13-2v101l-13 2z" fill={metal} />
        <path d="m72 228 61-8 17 5-62 10zM249 215l57-7 16 5-58 8z" fill={dark} />
        <path d="m103 141 168-19v10l-168 20z" fill="#393e3a" />
        <path d="m42 99 218-26 61 39-219 28z" fill={wood} />
        <path d="m42 99 60 41v7l-60-40z" fill="#815b38" />
        <path d="m102 140 219-28v7l-219 28z" fill="#9a724b" />
        <path d="m61 102 194-23M77 113l194-24M95 125l194-24" stroke="#e4bd8b" strokeOpacity=".25" />
        <path d="m260 127 28-3v10l-28 4z" fill="#272d29" />
        <path d="m265 130 8-1v3l-8 1z" fill="#b1c3a2" />
        <path d="m92 180 11-1M271 168l11-1" stroke="#c0c1b9" strokeOpacity=".7" />
      </g>}

      {kind === "keyboard" && <g transform="matrix(1 -.09 .15 1 -24 21)">
        <rect x="46" y="102" width="270" height="105" rx="8" fill="#181d1b" />
        <rect x="46" y="97" width="270" height="102" rx="8" fill={dark} />
        {Array.from({ length: 4 }, (_, row) => Array.from({ length: 14 }, (_, col) => (
          <rect key={`${row}-${col}`} x={55 + col * 18} y={106 + row * 17} width="14" height="13" rx="2" fill={row === 0 && col === 0 ? "#b69a6b" : "#686d68"} stroke="#858a80" strokeWidth=".5" />
        )))}
        {[55, 79, 103, 127, 235, 259, 283].map((x) => (
          <rect key={x} x={x} y="174" width={x === 127 ? 104 : 20} height="13" rx="2" fill="#686d68" stroke="#858a80" strokeWidth=".5" />
        ))}
        <path d="M58 194h243" stroke="#b6a36e" strokeOpacity=".6" />
        <path d="M277 98h24" stroke="#c9cec4" strokeOpacity=".5" />
      </g>}

      {kind === "light-bar" && <g>
        <path d="M71 139h218l32 88H39z" fill={`url(#${id}-light)`} />
        <path d="m164 143 8-45 30 2 8 43z" fill={dark} />
        <path d="M169 103c1-7 26-7 29 0l5 21h-37z" fill={metal} />
        <rect x="51" y="119" width="258" height="21" rx="10.5" fill={dark} />
        <path d="M65 135h229" stroke="#d4bd89" strokeWidth="2" strokeLinecap="round" />
        <path d="M65 123h225" stroke="#7a8078" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M299 126v6" stroke="#949b90" strokeWidth="1.2" />
        <ellipse cx="236" cy="208" rx="24" ry="9" fill="#343a35" />
        <path d="M212 205v4c0 12 48 12 48 0v-4" fill="#343a35" />
        <ellipse cx="236" cy="205" rx="24" ry="9" fill={metal} />
        <path d="M235 201v5" stroke="#c6c9b9" strokeLinecap="round" />
      </g>}

      {kind === "plant" && <g>
        <path d="M180 188c2-43-7-76 8-124M182 152l-29-41M182 132l29-38M184 111l-22-37" stroke="#52664a" strokeWidth="3" strokeLinecap="round" />
        <path d="M187 91c-10-25-3-44 19-56 6 25 1 46-19 56z" fill="#6a7d54" />
        <path d="M177 123c-26-3-39-21-38-47 25 9 39 23 38 47z" fill="#526a49" />
        <path d="M187 139c0-28 16-44 44-45-10 28-22 42-44 45z" fill="#7a8959" />
        <path d="M179 161c-28 2-45-10-52-35 27 2 45 13 52 35z" fill="#7a8959" />
        <path d="M181 175c8-24 25-34 49-31-14 24-30 32-49 31z" fill="#566f4b" />
        <ellipse cx="180" cy="183" rx="44" ry="12" fill="#866347" />
        <path d="m136 183 12 51c5 15 59 15 64 0l12-51c-11 15-76 15-88 0z" fill={wood} />
        <path d="m144 186 10 45c4 10 12 11 17 12" stroke="#e0ba88" strokeOpacity=".35" strokeWidth="3" />
        <ellipse cx="180" cy="182" rx="37" ry="7" fill="#433d2c" />
        <path d="m180 185 1-18" stroke="#63784e" strokeWidth="3" />
      </g>}

      {kind === "stand" && <g>
        <ellipse cx="180" cy="227" rx="56" ry="14" fill="#202622" />
        <path d="M124 223v4c0 18 112 18 112 0v-4" fill="#252b27" />
        <ellipse cx="180" cy="223" rx="56" ry="14" fill={metal} />
        <rect x="174" y="91" width="13" height="132" rx="4" fill={metal} />
        <path d="M140 81c0-22 80-22 80 0v22c-13-13-67-13-80 0z" fill={dark} />
        <path d="M143 81c15-12 59-12 74 0" stroke="#858a80" strokeWidth="2" />
        <path d="M177 105v107" stroke="#959b90" strokeOpacity=".6" />
      </g>}

      {kind === "speaker" && <g>
        <path d="M111 103c0-30 138-30 138 0v112c0 31-138 31-138 0z" fill={dark} />
        <path d="M112 110c19 25 118 25 136 0v104c-16 28-120 28-136 0z" fill={`url(#${id}-weave)`} />
        <ellipse cx="180" cy="101" rx="69" ry="24" fill="#414842" />
        <ellipse cx="180" cy="99" rx="60" ry="18" stroke="#b7a07d" strokeWidth="2" />
        <ellipse cx="180" cy="99" rx="55" ry="15" fill="#272e28" />
        <path d="M176 96v6m-3-3h6M195 99h6M158 99h6" stroke="#a7aea0" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M124 218c25 15 89 15 113 0" stroke="#6e7f74" strokeWidth="2" />
        <circle cx="180" cy="165" r="3" fill="#d0b983" />
      </g>}
    </svg>
  );
}
