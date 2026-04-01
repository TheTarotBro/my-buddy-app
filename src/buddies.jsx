// Buddy Avatar Components — Stylized Semi-Realistic
// Each buddy has 5 stages: Egg (L0), L1-L4
// Props: { size, accent, mood } where mood = "happy" | "content" | "sad"

// ═══ SHARED EGG (all buddies start here) ═══
export function EggStage({ size, accent }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <radialGradient id="eggG" cx="42%" cy="36%">
          <stop offset="0%" stopColor="#faf6f0" stopOpacity="0.4" />
          <stop offset="60%" stopColor={accent} stopOpacity="0.1" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <filter id="eggSh"><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#3a2e24" floodOpacity="0.12" /></filter>
      </defs>
      <ellipse cx="100" cy="182" rx="28" ry="5" fill="rgba(58,46,36,0.06)" />
      {/* Shell */}
      <ellipse cx="100" cy="118" rx="38" ry="50" fill={accent} filter="url(#eggSh)" />
      <ellipse cx="100" cy="118" rx="38" ry="50" fill="url(#eggG)" />
      {/* Shell texture — subtle speckles */}
      <circle cx="88" cy="100" r="1.5" fill={accent} opacity="0.3" />
      <circle cx="110" cy="108" r="1" fill={accent} opacity="0.25" />
      <circle cx="95" cy="130" r="1.2" fill={accent} opacity="0.2" />
      <circle cx="108" cy="95" r="1" fill={accent} opacity="0.3" />
      {/* Crack */}
      <path d="M 78 112 L 84 102 L 80 92 L 86 86 L 82 80" stroke="rgba(58,46,36,0.12)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 86 86 L 92 90" stroke="rgba(58,46,36,0.08)" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Pulse glow */}
      <ellipse cx="100" cy="118" rx="38" ry="50" fill="none" stroke={accent} strokeWidth="2" opacity="0.2">
        <animate attributeName="rx" values="38;42;38" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="ry" values="50;54;50" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.2;0.06;0.2" dur="2.5s" repeatCount="indefinite" />
      </ellipse>
      {/* Highlight */}
      <ellipse cx="88" cy="96" rx="14" ry="18" fill="white" opacity="0.08" transform="rotate(-15,88,96)" />
    </svg>
  );
}

// ═══ PIP (Bird) — 4 evolution stages ═══

export function BirdL1({ size, accent, mood }) {
  // Hatchling: big head, tiny body, downy fluff, huge curious eyes
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <filter id="b1s"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#3a2e24" floodOpacity="0.1" /></filter>
        <radialGradient id="b1g" cx="40%" cy="35%"><stop offset="0%" stopColor="white" stopOpacity="0.12" /><stop offset="100%" stopColor="transparent" /></radialGradient>
      </defs>
      <ellipse cx="100" cy="183" rx="22" ry="4" fill="rgba(58,46,36,0.05)" />
      {/* Tiny round body */}
      <ellipse cx="100" cy="132" rx="30" ry="28" fill={accent} filter="url(#b1s)" />
      <ellipse cx="100" cy="132" rx="30" ry="28" fill="url(#b1g)" />
      {/* Downy belly — soft texture lines */}
      <ellipse cx="100" cy="138" rx="20" ry="18" fill={`${accent}40`} />
      <path d="M 88 132 Q 90 136 92 132" stroke="white" strokeWidth="0.5" fill="none" opacity="0.15" />
      <path d="M 96 134 Q 98 138 100 134" stroke="white" strokeWidth="0.5" fill="none" opacity="0.12" />
      <path d="M 104 132 Q 106 136 108 132" stroke="white" strokeWidth="0.5" fill="none" opacity="0.15" />
      {/* Stubby proto-wings */}
      <ellipse cx="72" cy="128" rx="7" ry="12" fill={accent} opacity="0.65" transform="rotate(10,72,128)" />
      <ellipse cx="128" cy="128" rx="7" ry="12" fill={accent} opacity="0.65" transform="rotate(-10,128,128)" />
      {/* Big head (proportionally oversized for baby) */}
      <ellipse cx="100" cy="108" rx="28" ry="26" fill={accent} filter="url(#b1s)" />
      <ellipse cx="100" cy="108" rx="28" ry="26" fill="url(#b1g)" />
      {/* Face disc — lighter area around eyes */}
      <ellipse cx="100" cy="106" rx="18" ry="14" fill={`${accent}30`} />
      {/* Eyes — huge and curious with detailed reflections */}
      {mood === "happy" ? <>
        <path d="M 86 102 Q 91 92 96 102" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 104 102 Q 109 92 114 102" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Happy cheek blush */}
        <ellipse cx="82" cy="108" rx="6" ry="3.5" fill="#e8a090" opacity="0.2" />
        <ellipse cx="118" cy="108" rx="6" ry="3.5" fill="#e8a090" opacity="0.2" />
      </> : <>
        <ellipse cx="91" cy="100" rx="7" ry="8" fill="white" />
        <ellipse cx="91" cy="100" rx="7" ry="8" fill="none" stroke="#3a2e24" strokeWidth="0.5" opacity="0.15" />
        <ellipse cx="91" cy="101" rx="4.5" ry="5.5" fill="#2a1e14" />
        <ellipse cx="92.5" cy="98.5" rx="2" ry="2.5" fill="white" opacity="0.8" />
        <ellipse cx="89.5" cy="101.5" rx="1" ry="1.2" fill="white" opacity="0.35" />
        <ellipse cx="109" cy="100" rx="7" ry="8" fill="white" />
        <ellipse cx="109" cy="100" rx="7" ry="8" fill="none" stroke="#3a2e24" strokeWidth="0.5" opacity="0.15" />
        <ellipse cx="109" cy="101" rx="4.5" ry="5.5" fill="#2a1e14" />
        <ellipse cx="110.5" cy="98.5" rx="2" ry="2.5" fill="white" opacity="0.8" />
        <ellipse cx="107.5" cy="101.5" rx="1" ry="1.2" fill="white" opacity="0.35" />
        {mood === "sad" && <>
          <path d="M 84 96 Q 88 94 92 96" stroke="#3a2e24" strokeWidth="0.8" fill="none" opacity="0.3" />
          <path d="M 108 96 Q 112 94 116 96" stroke="#3a2e24" strokeWidth="0.8" fill="none" opacity="0.3" />
        </>}
      </>}
      {/* Small beak */}
      <path d="M 96 112 L 100 118 L 104 112" fill="#d4944a" stroke="#b8804a" strokeWidth="0.5" strokeLinejoin="round" />
      {/* Mouth */}
      {mood === "happy" && <path d="M 95 120 Q 100 125 105 120" stroke="#3a2e24" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4" />}
      {mood === "sad" && <path d="M 96 122 Q 100 119 104 122" stroke="#3a2e24" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.3" />}
      {/* Tiny fluff tuft on head */}
      <path d="M 98 84 Q 96 78 100 80 Q 104 78 102 84" fill={accent} opacity="0.7" />
      {/* Tiny feet */}
      <path d="M 90 158 L 86 166 M 86 166 L 82 168 M 86 166 L 90 168" stroke="#d4944a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 110 158 L 114 166 M 114 166 L 110 168 M 114 166 L 118 168" stroke="#d4944a" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function BirdL2({ size, accent, mood }) {
  // Fledgling: body fills out, real wings with feather lines, small crest, tail nubs
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <filter id="b2s"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#3a2e24" floodOpacity="0.1" /></filter>
        <radialGradient id="b2g" cx="40%" cy="35%"><stop offset="0%" stopColor="white" stopOpacity="0.1" /><stop offset="100%" stopColor="transparent" /></radialGradient>
      </defs>
      <ellipse cx="100" cy="184" rx="30" ry="5" fill="rgba(58,46,36,0.05)" />
      {/* Body — rounder, more substantial */}
      <ellipse cx="100" cy="125" rx="40" ry="42" fill={accent} filter="url(#b2s)" />
      <ellipse cx="100" cy="125" rx="40" ry="42" fill="url(#b2g)" />
      {/* Belly with soft feather texture */}
      <ellipse cx="100" cy="135" rx="26" ry="26" fill={`${accent}30`} />
      <path d="M 84 128 Q 87 133 90 128" stroke="white" strokeWidth="0.5" fill="none" opacity="0.12" />
      <path d="M 94 130 Q 97 135 100 130" stroke="white" strokeWidth="0.5" fill="none" opacity="0.1" />
      <path d="M 104 128 Q 107 133 110 128" stroke="white" strokeWidth="0.5" fill="none" opacity="0.12" />
      <path d="M 90 138 Q 93 143 96 138" stroke="white" strokeWidth="0.5" fill="none" opacity="0.08" />
      <path d="M 100 138 Q 103 143 106 138" stroke="white" strokeWidth="0.5" fill="none" opacity="0.08" />
      {/* Wings — real shape with feather lines */}
      <path d="M 62 120 Q 50 108 48 118 Q 46 130 60 138" fill={accent} opacity="0.75">
        {mood === "happy" && <animate attributeName="d" values="M 62 120 Q 50 108 48 118 Q 46 130 60 138;M 62 120 Q 44 100 42 112 Q 40 126 60 138;M 62 120 Q 50 108 48 118 Q 46 130 60 138" dur="0.7s" repeatCount="indefinite" />}
      </path>
      <line x1="52" y1="114" x2="58" y2="124" stroke={accent} strokeWidth="0.8" opacity="0.3" />
      <line x1="50" y1="120" x2="58" y2="128" stroke={accent} strokeWidth="0.6" opacity="0.2" />
      <path d="M 138 120 Q 150 108 152 118 Q 154 130 140 138" fill={accent} opacity="0.75">
        {mood === "happy" && <animate attributeName="d" values="M 138 120 Q 150 108 152 118 Q 154 130 140 138;M 138 120 Q 156 100 158 112 Q 160 126 140 138;M 138 120 Q 150 108 152 118 Q 154 130 140 138" dur="0.7s" repeatCount="indefinite" />}
      </path>
      <line x1="148" y1="114" x2="142" y2="124" stroke={accent} strokeWidth="0.8" opacity="0.3" />
      <line x1="150" y1="120" x2="142" y2="128" stroke={accent} strokeWidth="0.6" opacity="0.2" />
      {/* Head */}
      <ellipse cx="100" cy="92" rx="26" ry="24" fill={accent} filter="url(#b2s)" />
      <ellipse cx="100" cy="92" rx="26" ry="24" fill="url(#b2g)" />
      <ellipse cx="100" cy="94" rx="17" ry="13" fill={`${accent}25`} />
      {/* Small crest — 2 points */}
      <path d="M 95 70 Q 92 58 98 63 Q 102 58 105 70" fill={accent} />
      <path d="M 97 70 Q 95 62 100 65 Q 104 62 103 70" fill="white" opacity="0.06" />
      {/* Eyes */}
      {mood === "happy" ? <>
        <path d="M 84 88 Q 89 78 94 88" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 106 88 Q 111 78 116 88" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <ellipse cx="82" cy="96" rx="5" ry="3" fill="#e8a090" opacity="0.2" />
        <ellipse cx="118" cy="96" rx="5" ry="3" fill="#e8a090" opacity="0.2" />
      </> : <>
        <ellipse cx="89" cy="88" rx="6.5" ry="7.5" fill="white" />
        <ellipse cx="89" cy="88" rx="6.5" ry="7.5" fill="none" stroke="#3a2e24" strokeWidth="0.5" opacity="0.12" />
        <ellipse cx="89" cy="89" rx="4" ry="5" fill="#2a1e14" />
        <ellipse cx="90.5" cy="87" rx="1.8" ry="2.2" fill="white" opacity="0.8" />
        <ellipse cx="87.5" cy="90" rx="0.8" ry="1" fill="white" opacity="0.3" />
        <ellipse cx="111" cy="88" rx="6.5" ry="7.5" fill="white" />
        <ellipse cx="111" cy="88" rx="6.5" ry="7.5" fill="none" stroke="#3a2e24" strokeWidth="0.5" opacity="0.12" />
        <ellipse cx="111" cy="89" rx="4" ry="5" fill="#2a1e14" />
        <ellipse cx="112.5" cy="87" rx="1.8" ry="2.2" fill="white" opacity="0.8" />
        <ellipse cx="109.5" cy="90" rx="0.8" ry="1" fill="white" opacity="0.3" />
        {mood === "sad" && <>
          <path d="M 82 84 Q 86 82 90 84" stroke="#3a2e24" strokeWidth="0.8" fill="none" opacity="0.25" />
          <path d="M 110 84 Q 114 82 118 84" stroke="#3a2e24" strokeWidth="0.8" fill="none" opacity="0.25" />
        </>}
      </>}
      {/* Beak */}
      <path d="M 94 98 L 100 106 L 106 98" fill="#d4944a" stroke="#b8804a" strokeWidth="0.5" strokeLinejoin="round" />
      <line x1="94" y1="98" x2="106" y2="98" stroke="#c89050" strokeWidth="0.5" />
      {mood === "happy" && <path d="M 93 108 Q 100 116 107 108" stroke="#3a2e24" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.4" />}
      {mood === "sad" && <path d="M 95 112 Q 100 108 105 112" stroke="#3a2e24" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.3" />}
      {mood === "content" && <path d="M 95 110 Q 100 113 105 110" stroke="#3a2e24" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.3" />}
      {/* Tail nubs */}
      <path d="M 92 164 Q 86 172 80 170" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.4" />
      <path d="M 108 164 Q 114 172 120 170" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.4" />
      {/* Feet */}
      <path d="M 86 164 L 82 176 M 82 176 L 78 179 M 82 176 L 86 179" stroke="#d4944a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 114 164 L 118 176 M 118 176 L 114 179 M 118 176 L 122 179" stroke="#d4944a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function BirdL3({ size, accent, mood }) {
  // Juvenile: full wing structure, prominent 3-point crest, tail feathers, cheek marks
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <filter id="b3s"><feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#3a2e24" floodOpacity="0.1" /></filter>
        <radialGradient id="b3g" cx="40%" cy="35%"><stop offset="0%" stopColor="white" stopOpacity="0.08" /><stop offset="100%" stopColor="transparent" /></radialGradient>
      </defs>
      <ellipse cx="100" cy="184" rx="35" ry="5" fill="rgba(58,46,36,0.05)" />
      {/* Tail feathers — fanning out */}
      <path d="M 94 162 Q 76 178 62 174" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M 100 164 Q 80 184 64 180" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.35" />
      <path d="M 106 162 Q 124 178 138 174" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M 100 164 Q 120 184 136 180" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.35" />
      {/* Body */}
      <path d="M 54 118 Q 50 90 68 75 Q 85 62 100 62 Q 115 62 132 75 Q 150 90 146 118 Q 143 142 130 155 Q 115 165 100 165 Q 85 165 70 155 Q 57 142 54 118Z" fill={accent} filter="url(#b3s)" />
      <path d="M 54 118 Q 50 90 68 75 Q 85 62 100 62 Q 115 62 132 75 Q 150 90 146 118 Q 143 142 130 155 Q 115 165 100 165 Q 85 165 70 155 Q 57 142 54 118Z" fill="url(#b3g)" />
      {/* Belly with feather texture */}
      <path d="M 74 110 Q 74 95 86 88 Q 100 82 114 88 Q 126 95 126 110 Q 126 132 114 142 Q 100 150 86 142 Q 74 132 74 110Z" fill={`${accent}20`} />
      <path d="M 82 105 Q 86 112 90 105" stroke="white" strokeWidth="0.4" fill="none" opacity="0.1" />
      <path d="M 94 108 Q 98 115 102 108" stroke="white" strokeWidth="0.4" fill="none" opacity="0.08" />
      <path d="M 106 105 Q 110 112 114 105" stroke="white" strokeWidth="0.4" fill="none" opacity="0.1" />
      <path d="M 88 116 Q 92 123 96 116" stroke="white" strokeWidth="0.4" fill="none" opacity="0.07" />
      <path d="M 100 116 Q 104 123 108 116" stroke="white" strokeWidth="0.4" fill="none" opacity="0.07" />
      {/* Wings — layered feathers */}
      <path d="M 54 112 Q 36 94 30 106 Q 24 120 32 132 Q 40 140 52 136" fill={accent} opacity="0.8">
        {mood === "happy" && <animate attributeName="d" values="M 54 112 Q 36 94 30 106 Q 24 120 32 132 Q 40 140 52 136;M 54 112 Q 28 84 22 98 Q 16 114 28 128 Q 38 138 52 136;M 54 112 Q 36 94 30 106 Q 24 120 32 132 Q 40 140 52 136" dur="0.6s" repeatCount="indefinite" />}
      </path>
      {/* Wing feather lines */}
      <line x1="36" y1="100" x2="48" y2="116" stroke={accent} strokeWidth="0.7" opacity="0.25" />
      <line x1="32" y1="108" x2="46" y2="122" stroke={accent} strokeWidth="0.6" opacity="0.2" />
      <line x1="30" y1="116" x2="44" y2="128" stroke={accent} strokeWidth="0.5" opacity="0.15" />
      <path d="M 146 112 Q 164 94 170 106 Q 176 120 168 132 Q 160 140 148 136" fill={accent} opacity="0.8">
        {mood === "happy" && <animate attributeName="d" values="M 146 112 Q 164 94 170 106 Q 176 120 168 132 Q 160 140 148 136;M 146 112 Q 172 84 178 98 Q 184 114 172 128 Q 162 138 148 136;M 146 112 Q 164 94 170 106 Q 176 120 168 132 Q 160 140 148 136" dur="0.6s" repeatCount="indefinite" />}
      </path>
      <line x1="164" y1="100" x2="152" y2="116" stroke={accent} strokeWidth="0.7" opacity="0.25" />
      <line x1="168" y1="108" x2="154" y2="122" stroke={accent} strokeWidth="0.6" opacity="0.2" />
      <line x1="170" y1="116" x2="156" y2="128" stroke={accent} strokeWidth="0.5" opacity="0.15" />
      {/* Cheek markings */}
      <ellipse cx="66" cy="98" rx="4" ry="6" fill={accent} opacity="0.3" transform="rotate(-10,66,98)" />
      <ellipse cx="134" cy="98" rx="4" ry="6" fill={accent} opacity="0.3" transform="rotate(10,134,98)" />
      {/* 3-point crest */}
      <path d="M 90 64 Q 84 42 94 50 Q 96 36 100 46 Q 104 36 106 50 Q 116 42 110 64" fill={accent} />
      <path d="M 93 64 Q 90 48 96 54 Q 98 44 100 50 Q 102 44 104 54 Q 110 48 107 64" fill="white" opacity="0.05" />
      {/* Eyes */}
      {mood === "happy" ? <>
        <path d="M 80 86 Q 86 74 92 86" stroke="#3a2e24" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <path d="M 108 86 Q 114 74 120 86" stroke="#3a2e24" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        <ellipse cx="76" cy="94" rx="5" ry="3" fill="#e8a090" opacity="0.2" />
        <ellipse cx="124" cy="94" rx="5" ry="3" fill="#e8a090" opacity="0.2" />
      </> : <>
        <ellipse cx="86" cy="84" rx="7" ry="8" fill="white" />
        <ellipse cx="86" cy="84" rx="7" ry="8" fill="none" stroke="#3a2e24" strokeWidth="0.5" opacity="0.1" />
        <ellipse cx="86" cy="85" rx="4.5" ry="5.5" fill="#2a1e14" />
        <ellipse cx="87.5" cy="83" rx="2" ry="2.5" fill="white" opacity="0.8" />
        <ellipse cx="84.5" cy="86" rx="0.8" ry="1" fill="white" opacity="0.3" />
        <ellipse cx="114" cy="84" rx="7" ry="8" fill="white" />
        <ellipse cx="114" cy="84" rx="7" ry="8" fill="none" stroke="#3a2e24" strokeWidth="0.5" opacity="0.1" />
        <ellipse cx="114" cy="85" rx="4.5" ry="5.5" fill="#2a1e14" />
        <ellipse cx="115.5" cy="83" rx="2" ry="2.5" fill="white" opacity="0.8" />
        <ellipse cx="112.5" cy="86" rx="0.8" ry="1" fill="white" opacity="0.3" />
        {mood === "sad" && <>
          <path d="M 79 80 Q 83 78 87 80" stroke="#3a2e24" strokeWidth="0.8" fill="none" opacity="0.25" />
          <path d="M 113 80 Q 117 78 121 80" stroke="#3a2e24" strokeWidth="0.8" fill="none" opacity="0.25" />
        </>}
      </>}
      {/* Beak */}
      <path d="M 93 94 L 100 104 L 107 94" fill="#d4944a" stroke="#b8804a" strokeWidth="0.5" strokeLinejoin="round" />
      <line x1="93" y1="94" x2="107" y2="94" stroke="#c89050" strokeWidth="0.5" />
      {mood === "happy" && <path d="M 92 106 Q 100 116 108 106" stroke="#3a2e24" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />}
      {mood === "sad" && <path d="M 94 112 Q 100 106 106 112" stroke="#3a2e24" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.3" />}
      {mood === "content" && <path d="M 94 108 Q 100 112 106 108" stroke="#3a2e24" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.3" />}
      {/* Feet */}
      <path d="M 82 164 L 76 178 M 76 178 L 72 181 M 76 178 L 80 181" stroke="#d4944a" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M 88 164 L 88 180" stroke="#d4944a" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M 112 164 L 112 180" stroke="#d4944a" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M 118 164 L 124 178 M 124 178 L 120 181 M 124 178 L 128 181" stroke="#d4944a" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      {/* Sparkle */}
      <circle cx="38" cy="68" r="2.5" fill={accent} opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" /></circle>
    </svg>
  );
}

export function BirdL4({ size, accent, mood }) {
  // Adult: majestic crown crest, long tail plumage, detailed wing layering, aura glow
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <filter id="b4s"><feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#3a2e24" floodOpacity="0.1" /></filter>
        <filter id="b4glow"><feDropShadow dx="0" dy="0" stdDeviation="10" floodColor={accent} floodOpacity="0.12" /></filter>
        <radialGradient id="b4g" cx="40%" cy="35%"><stop offset="0%" stopColor="white" stopOpacity="0.08" /><stop offset="100%" stopColor="transparent" /></radialGradient>
      </defs>
      <ellipse cx="100" cy="184" rx="38" ry="5" fill="rgba(58,46,36,0.06)" />
      {/* Aura */}
      <ellipse cx="100" cy="110" rx="72" ry="74" fill="none" stroke={accent} strokeWidth="1" opacity="0.1" filter="url(#b4glow)">
        <animate attributeName="opacity" values="0.1;0.03;0.1" dur="3s" repeatCount="indefinite" />
      </ellipse>
      {/* Long ornamental tail plumage */}
      <path d="M 92 162 Q 68 180 48 176" stroke={accent} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d="M 96 164 Q 64 190 40 184" stroke={accent} strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.35" />
      <path d="M 100 166 Q 58 196 36 188" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.2" />
      <path d="M 108 162 Q 132 180 152 176" stroke={accent} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.55" />
      <path d="M 104 164 Q 136 190 160 184" stroke={accent} strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.35" />
      <path d="M 100 166 Q 142 196 164 188" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.2" />
      {/* Body — confident, upright */}
      <path d="M 52 115 Q 48 86 66 70 Q 84 56 100 56 Q 116 56 134 70 Q 152 86 148 115 Q 145 140 132 152 Q 116 164 100 164 Q 84 164 68 152 Q 55 140 52 115Z" fill={accent} filter="url(#b4s)" />
      <path d="M 52 115 Q 48 86 66 70 Q 84 56 100 56 Q 116 56 134 70 Q 152 86 148 115 Q 145 140 132 152 Q 116 164 100 164 Q 84 164 68 152 Q 55 140 52 115Z" fill="url(#b4g)" />
      {/* Chest marking — V pattern */}
      <path d="M 82 105 Q 100 135 118 105" fill={`${accent}15`} />
      {/* Belly feather texture */}
      <path d="M 80 100 Q 84 108 88 100" stroke="white" strokeWidth="0.4" fill="none" opacity="0.08" />
      <path d="M 92 104 Q 96 112 100 104" stroke="white" strokeWidth="0.4" fill="none" opacity="0.06" />
      <path d="M 104 100 Q 108 108 112 100" stroke="white" strokeWidth="0.4" fill="none" opacity="0.08" />
      <path d="M 86 112 Q 90 120 94 112" stroke="white" strokeWidth="0.4" fill="none" opacity="0.06" />
      <path d="M 100 112 Q 104 120 108 112" stroke="white" strokeWidth="0.4" fill="none" opacity="0.06" />
      {/* Majestic wings — multi-layered */}
      <path d="M 52 108 Q 30 86 22 100 Q 16 116 24 130 Q 34 142 50 136" fill={accent} opacity="0.8">
        {mood === "happy" && <animate attributeName="d" values="M 52 108 Q 30 86 22 100 Q 16 116 24 130 Q 34 142 50 136;M 52 108 Q 20 74 14 92 Q 8 110 18 126 Q 30 140 50 136;M 52 108 Q 30 86 22 100 Q 16 116 24 130 Q 34 142 50 136" dur="0.6s" repeatCount="indefinite" />}
      </path>
      <path d="M 52 112 Q 34 96 28 108 Q 22 122 30 132" fill={accent} opacity="0.5" />
      <line x1="28" y1="96" x2="44" y2="114" stroke={accent} strokeWidth="0.6" opacity="0.2" />
      <line x1="24" y1="104" x2="42" y2="120" stroke={accent} strokeWidth="0.5" opacity="0.15" />
      <line x1="22" y1="112" x2="40" y2="126" stroke={accent} strokeWidth="0.5" opacity="0.12" />
      <line x1="24" y1="120" x2="38" y2="132" stroke={accent} strokeWidth="0.4" opacity="0.1" />
      <path d="M 148 108 Q 170 86 178 100 Q 184 116 176 130 Q 166 142 150 136" fill={accent} opacity="0.8">
        {mood === "happy" && <animate attributeName="d" values="M 148 108 Q 170 86 178 100 Q 184 116 176 130 Q 166 142 150 136;M 148 108 Q 180 74 186 92 Q 192 110 182 126 Q 170 140 150 136;M 148 108 Q 170 86 178 100 Q 184 116 176 130 Q 166 142 150 136" dur="0.6s" repeatCount="indefinite" />}
      </path>
      <path d="M 148 112 Q 166 96 172 108 Q 178 122 170 132" fill={accent} opacity="0.5" />
      <line x1="172" y1="96" x2="156" y2="114" stroke={accent} strokeWidth="0.6" opacity="0.2" />
      <line x1="176" y1="104" x2="158" y2="120" stroke={accent} strokeWidth="0.5" opacity="0.15" />
      <line x1="178" y1="112" x2="160" y2="126" stroke={accent} strokeWidth="0.5" opacity="0.12" />
      {/* Crown crest — elaborate 5-point */}
      <path d="M 86 58 Q 78 28 90 40 Q 92 24 96 36 Q 100 18 104 36 Q 108 24 110 40 Q 122 28 114 58" fill={accent} />
      <path d="M 90 58 Q 85 36 94 44 Q 96 32 100 40 Q 104 32 106 44 Q 115 36 110 58" fill="white" opacity="0.05" />
      {/* Cheek markings */}
      <ellipse cx="62" cy="92" rx="5" ry="8" fill={accent} opacity="0.25" transform="rotate(-8,62,92)" />
      <ellipse cx="138" cy="92" rx="5" ry="8" fill={accent} opacity="0.25" transform="rotate(8,138,92)" />
      {/* Eyes */}
      {mood === "happy" ? <>
        <path d="M 78 82 Q 84 70 90 82" stroke="#3a2e24" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 110 82 Q 116 70 122 82" stroke="#3a2e24" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="74" cy="90" rx="5" ry="3" fill="#e8a090" opacity="0.2" />
        <ellipse cx="126" cy="90" rx="5" ry="3" fill="#e8a090" opacity="0.2" />
      </> : <>
        <ellipse cx="84" cy="80" rx="7" ry="8" fill="white" />
        <ellipse cx="84" cy="80" rx="7" ry="8" fill="none" stroke="#3a2e24" strokeWidth="0.5" opacity="0.1" />
        <ellipse cx="84" cy="81" rx="4.5" ry="5.5" fill="#2a1e14" />
        <ellipse cx="85.5" cy="79" rx="2" ry="2.5" fill="white" opacity="0.8" />
        <ellipse cx="82.5" cy="82" rx="0.8" ry="1" fill="white" opacity="0.3" />
        <ellipse cx="116" cy="80" rx="7" ry="8" fill="white" />
        <ellipse cx="116" cy="80" rx="7" ry="8" fill="none" stroke="#3a2e24" strokeWidth="0.5" opacity="0.1" />
        <ellipse cx="116" cy="81" rx="4.5" ry="5.5" fill="#2a1e14" />
        <ellipse cx="117.5" cy="79" rx="2" ry="2.5" fill="white" opacity="0.8" />
        <ellipse cx="114.5" cy="82" rx="0.8" ry="1" fill="white" opacity="0.3" />
        {mood === "sad" && <>
          <path d="M 77 76 Q 81 74 85 76" stroke="#3a2e24" strokeWidth="0.8" fill="none" opacity="0.2" />
          <path d="M 115 76 Q 119 74 123 76" stroke="#3a2e24" strokeWidth="0.8" fill="none" opacity="0.2" />
        </>}
      </>}
      {/* Beak — refined shape */}
      <path d="M 92 90 L 100 102 L 108 90" fill="#d4944a" stroke="#b8804a" strokeWidth="0.5" strokeLinejoin="round" />
      <line x1="92" y1="90" x2="108" y2="90" stroke="#c89050" strokeWidth="0.5" />
      {mood === "happy" && <path d="M 90 104 Q 100 116 110 104" stroke="#3a2e24" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.4" />}
      {mood === "sad" && <path d="M 94 112 Q 100 106 106 112" stroke="#3a2e24" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.3" />}
      {mood === "content" && <path d="M 94 108 Q 100 112 106 108" stroke="#3a2e24" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.3" />}
      {/* Feet */}
      <path d="M 80 162 L 74 178 M 74 178 L 70 181 M 74 178 L 78 181" stroke="#d4944a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 88 162 L 88 180" stroke="#d4944a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 112 162 L 112 180" stroke="#d4944a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 120 162 L 126 178 M 126 178 L 122 181 M 126 178 L 130 181" stroke="#d4944a" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Sparkles */}
      <circle cx="32" cy="58" r="3" fill={accent} opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="1.8s" repeatCount="indefinite" /></circle>
      <circle cx="168" cy="54" r="2.5" fill={accent} opacity="0.35"><animate attributeName="opacity" values="0.35;0.08;0.35" dur="2.2s" repeatCount="indefinite" /></circle>
      <circle cx="160" cy="76" r="2" fill={accent} opacity="0.3"><animate attributeName="opacity" values="0.3;0.06;0.3" dur="2.6s" repeatCount="indefinite" /></circle>
    </svg>
  );
}

// ═══ PLACEHOLDER STAGES for Snake, Monkey, Robot ═══
// These use the old simple style until we redesign them
// (Kept minimal to save file size — will be replaced)

export function SnakeL1({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ss1p"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.1"/></filter></defs><ellipse cx="100" cy="182" rx="25" ry="4" fill="rgba(58,46,36,0.05)"/><path d="M 100 170 Q 85 155 90 140 Q 95 125 100 120" stroke={accent} strokeWidth="18" fill="none" strokeLinecap="round" filter="url(#ss1p)"/><circle cx="100" cy="112" r="18" fill={accent} filter="url(#ss1p)"/>{mood==="happy"?<><path d="M 92 108 Q 95 102 98 108" stroke="#3a2e24" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M 102 108 Q 105 102 108 108" stroke="#3a2e24" strokeWidth="2" fill="none" strokeLinecap="round"/></>:<><ellipse cx="95" cy="106" rx="3.5" ry="4.5" fill="white" opacity="0.9"/><ellipse cx="105" cy="106" rx="3.5" ry="4.5" fill="white" opacity="0.9"/><ellipse cx="95" cy="107" rx="2" ry="3" fill="#2a1e14"/><ellipse cx="105" cy="107" rx="2" ry="3" fill="#2a1e14"/></>}{mood!=="sad"&&<line x1="100" y1="120" x2="100" y2="126" stroke="#e86a6a" strokeWidth="1.5" strokeLinecap="round"/>}</svg>);}
export function SnakeL2({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ss2p"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.1"/></filter></defs><ellipse cx="100" cy="186" rx="35" ry="5" fill="rgba(58,46,36,0.05)"/><path d="M 80 172 Q 55 155 60 130 Q 65 105 100 95" stroke={accent} strokeWidth="20" fill="none" strokeLinecap="round" filter="url(#ss2p)"/><path d="M 80 172 Q 55 155 60 130 Q 65 105 100 95" stroke="white" strokeWidth="13" fill="none" strokeLinecap="round" opacity="0.06"/><ellipse cx="100" cy="85" rx="24" ry="22" fill={accent} filter="url(#ss2p)"/>{mood==="happy"?<><path d="M 90 80 Q 94 72 98 80" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 102 80 Q 106 72 110 80" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><ellipse cx="94" cy="78" rx="4" ry="5" fill="white" opacity="0.9"/><ellipse cx="106" cy="78" rx="4" ry="5" fill="white" opacity="0.9"/><ellipse cx="94" cy="79" rx="2.5" ry="3.5" fill="#2a1e14"/><ellipse cx="106" cy="79" rx="2.5" ry="3.5" fill="#2a1e14"/></>}{mood==="happy"&&<path d="M 93 90 Q 100 98 107 90" stroke="#3a2e24" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.4"/>}</svg>);}
export function SnakeL3({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ss3p"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.1"/></filter></defs><ellipse cx="100" cy="186" rx="40" ry="5" fill="rgba(58,46,36,0.05)"/><path d="M 70 175 Q 40 155 48 125 Q 56 95 95 88 Q 135 82 142 110 Q 148 135 120 150 Q 100 160 92 148" stroke={accent} strokeWidth="22" fill="none" strokeLinecap="round" filter="url(#ss3p)"/><ellipse cx="95" cy="78" rx="28" ry="24" fill={accent} filter="url(#ss3p)"/><ellipse cx="70" cy="80" rx="8" ry="12" fill={accent} opacity="0.5"/><ellipse cx="120" cy="80" rx="8" ry="12" fill={accent} opacity="0.5"/>{mood==="happy"?<><path d="M 85 74 Q 89 66 93 74" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 99 74 Q 103 66 107 74" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><ellipse cx="89" cy="72" rx="4.5" ry="5.5" fill="white" opacity="0.9"/><ellipse cx="103" cy="72" rx="4.5" ry="5.5" fill="white" opacity="0.9"/><ellipse cx="89" cy="73" rx="3" ry="4" fill="#2a1e14"/><ellipse cx="103" cy="73" rx="3" ry="4" fill="#2a1e14"/></>}{mood==="happy"&&<path d="M 88 84 Q 96 92 104 84" stroke="#3a2e24" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4"/>}<circle cx="50" cy="70" r="2.5" fill={accent} opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite"/></circle></svg>);}
export function SnakeL4({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ss4p"><feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.12"/></filter><filter id="sGlowP"><feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={accent} floodOpacity="0.12"/></filter></defs><ellipse cx="100" cy="186" rx="42" ry="5" fill="rgba(58,46,36,0.06)"/><ellipse cx="100" cy="115" rx="68" ry="70" fill="none" stroke={accent} strokeWidth="1" opacity="0.08" filter="url(#sGlowP)"><animate attributeName="opacity" values="0.08;0.02;0.08" dur="3s" repeatCount="indefinite"/></ellipse><path d="M 68 178 Q 35 158 42 120 Q 50 82 95 75 Q 140 68 150 100 Q 158 130 128 152 Q 105 166 90 150 Q 78 138 95 126 Q 110 116 112 130" stroke={accent} strokeWidth="24" fill="none" strokeLinecap="round" filter="url(#ss4p)"/><ellipse cx="95" cy="65" rx="32" ry="28" fill={accent} filter="url(#ss4p)"/><ellipse cx="64" cy="68" rx="14" ry="20" fill={accent} opacity="0.6"/><ellipse cx="126" cy="68" rx="14" ry="20" fill={accent} opacity="0.6"/>{mood==="happy"?<><path d="M 84 60 Q 88 52 92 60" stroke="#3a2e24" strokeWidth="2.8" fill="none" strokeLinecap="round"/><path d="M 100 60 Q 104 52 108 60" stroke="#3a2e24" strokeWidth="2.8" fill="none" strokeLinecap="round"/></>:<><ellipse cx="88" cy="58" rx="5" ry="6" fill="white" opacity="0.9"/><ellipse cx="104" cy="58" rx="5" ry="6" fill="white" opacity="0.9"/><ellipse cx="88" cy="59" rx="3" ry="4" fill="#2a1e14"/><ellipse cx="104" cy="59" rx="3" ry="4" fill="#2a1e14"/></>}{mood==="happy"&&<path d="M 86 74 Q 96 84 106 74" stroke="#3a2e24" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.4"/>}<circle cx="42" cy="50" r="3" fill={accent} opacity="0.4"><animate attributeName="opacity" values="0.4;0.08;0.4" dur="1.8s" repeatCount="indefinite"/></circle><circle cx="152" cy="48" r="2.5" fill={accent} opacity="0.3"><animate attributeName="opacity" values="0.3;0.06;0.3" dur="2.2s" repeatCount="indefinite"/></circle></svg>);}

export function MonkeyL1({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ms1p"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.1"/></filter></defs><ellipse cx="100" cy="182" rx="25" ry="4" fill="rgba(58,46,36,0.05)"/><ellipse cx="100" cy="125" rx="35" ry="38" fill={accent} filter="url(#ms1p)"/><circle cx="65" cy="108" r="14" fill={accent}/><circle cx="65" cy="108" r="9" fill="white" opacity="0.08"/><circle cx="135" cy="108" r="14" fill={accent}/><circle cx="135" cy="108" r="9" fill="white" opacity="0.08"/>{mood==="happy"?<><path d="M 89 112 Q 93 104 97 112" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 103 112 Q 107 104 111 112" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><ellipse cx="93" cy="110" rx="5" ry="6" fill="white" opacity="0.9"/><ellipse cx="107" cy="110" rx="5" ry="6" fill="white" opacity="0.9"/><ellipse cx="93" cy="111" rx="3" ry="4" fill="#2a1e14"/><ellipse cx="107" cy="111" rx="3" ry="4" fill="#2a1e14"/></>}<ellipse cx="100" cy="120" rx="3" ry="2" fill="white" opacity="0.15"/>{mood==="happy"&&<path d="M 95 126 Q 100 132 105 126" stroke="#3a2e24" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4"/>}</svg>);}
export function MonkeyL2({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ms2p"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.1"/></filter></defs><ellipse cx="100" cy="184" rx="30" ry="5" fill="rgba(58,46,36,0.05)"/><path d="M 60 148 Q 40 138 42 120" stroke={accent} strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.6"/><ellipse cx="100" cy="120" rx="42" ry="46" fill={accent} filter="url(#ms2p)"/><circle cx="58" cy="96" r="15" fill={accent}/><circle cx="58" cy="96" r="10" fill="white" opacity="0.08"/><circle cx="142" cy="96" r="15" fill={accent}/><circle cx="142" cy="96" r="10" fill="white" opacity="0.08"/>{mood==="happy"?<><path d="M 88 96 Q 92 88 96 96" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 104 96 Q 108 88 112 96" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><ellipse cx="92" cy="94" rx="5" ry="6" fill="white" opacity="0.9"/><ellipse cx="108" cy="94" rx="5" ry="6" fill="white" opacity="0.9"/><ellipse cx="92" cy="95" rx="3" ry="4" fill="#2a1e14"/><ellipse cx="108" cy="95" rx="3" ry="4" fill="#2a1e14"/></>}{mood==="happy"&&<path d="M 93 110 Q 100 118 107 110" stroke="#3a2e24" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.4"/>}<ellipse cx="62" cy="130" rx="8" ry="12" fill={accent} opacity="0.65" transform="rotate(12,62,130)"/><ellipse cx="138" cy="130" rx="8" ry="12" fill={accent} opacity="0.65" transform="rotate(-12,138,130)"/><ellipse cx="82" cy="166" rx="10" ry="7" fill={accent} opacity="0.6"/><ellipse cx="118" cy="166" rx="10" ry="7" fill={accent} opacity="0.6"/></svg>);}
export function MonkeyL3({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ms3p"><feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.1"/></filter></defs><ellipse cx="100" cy="185" rx="35" ry="5" fill="rgba(58,46,36,0.05)"/><path d="M 58 148 Q 30 135 32 108 Q 34 85 48 78" stroke={accent} strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.65"/><ellipse cx="100" cy="120" rx="48" ry="52" fill={accent} filter="url(#ms3p)"/><circle cx="54" cy="88" r="16" fill={accent}/><circle cx="54" cy="88" r="10" fill="white" opacity="0.08"/><circle cx="146" cy="88" r="16" fill={accent}/><circle cx="146" cy="88" r="10" fill="white" opacity="0.08"/>{mood==="happy"?<><path d="M 86 94 Q 91 84 96 94" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 104 94 Q 109 84 114 94" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><ellipse cx="91" cy="92" rx="5.5" ry="6.5" fill="white" opacity="0.9"/><ellipse cx="109" cy="92" rx="5.5" ry="6.5" fill="white" opacity="0.9"/><ellipse cx="91" cy="93" rx="3.5" ry="4.5" fill="#2a1e14"/><ellipse cx="109" cy="93" rx="3.5" ry="4.5" fill="#2a1e14"/></>}{mood==="happy"&&<path d="M 92 108 Q 100 118 108 108" stroke="#3a2e24" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4"/>}<ellipse cx="56" cy="132" rx="10" ry="14" fill={accent} opacity="0.7" transform="rotate(12,56,132)"/><ellipse cx="144" cy="132" rx="10" ry="14" fill={accent} opacity="0.7" transform="rotate(-12,144,132)"/><ellipse cx="80" cy="170" rx="13" ry="8" fill={accent} opacity="0.65"/><ellipse cx="120" cy="170" rx="13" ry="8" fill={accent} opacity="0.65"/><circle cx="40" cy="68" r="2.5" fill={accent} opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite"/></circle></svg>);}
export function MonkeyL4({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ms4p"><feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.12"/></filter><filter id="mGlowP"><feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={accent} floodOpacity="0.1"/></filter></defs><ellipse cx="100" cy="185" rx="38" ry="5" fill="rgba(58,46,36,0.06)"/><ellipse cx="100" cy="118" rx="65" ry="68" fill="none" stroke={accent} strokeWidth="1" opacity="0.08" filter="url(#mGlowP)"><animate attributeName="opacity" values="0.08;0.02;0.08" dur="3s" repeatCount="indefinite"/></ellipse><path d="M 55 148 Q 22 132 26 100 Q 30 72 50 62 Q 55 58 52 52" stroke={accent} strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.7"/><circle cx="52" cy="50" r="4" fill={accent} opacity="0.5"/><ellipse cx="100" cy="118" rx="50" ry="54" fill={accent} filter="url(#ms4p)"/><path d="M 92 66 Q 88 54 96 58 Q 100 50 104 58 Q 112 54 108 66" fill={accent} opacity="0.8"/><circle cx="52" cy="84" r="18" fill={accent}/><circle cx="52" cy="84" r="12" fill="white" opacity="0.08"/><circle cx="148" cy="84" r="18" fill={accent}/><circle cx="148" cy="84" r="12" fill="white" opacity="0.08"/>{mood==="happy"?<><path d="M 85 90 Q 90 80 95 90" stroke="#3a2e24" strokeWidth="2.8" fill="none" strokeLinecap="round"/><path d="M 105 90 Q 110 80 115 90" stroke="#3a2e24" strokeWidth="2.8" fill="none" strokeLinecap="round"/></>:<><ellipse cx="90" cy="88" rx="6" ry="7" fill="white" opacity="0.9"/><ellipse cx="110" cy="88" rx="6" ry="7" fill="white" opacity="0.9"/><ellipse cx="90" cy="89" rx="3.5" ry="4.5" fill="#2a1e14"/><ellipse cx="110" cy="89" rx="3.5" ry="4.5" fill="#2a1e14"/></>}{mood==="happy"&&<path d="M 90 106 Q 100 118 110 106" stroke="#3a2e24" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.4"/>}<ellipse cx="54" cy="130" rx="12" ry="16" fill={accent} opacity="0.7" transform="rotate(10,54,130)"/><ellipse cx="146" cy="130" rx="12" ry="16" fill={accent} opacity="0.7" transform="rotate(-10,146,130)"/><ellipse cx="78" cy="170" rx="14" ry="9" fill={accent} opacity="0.65"/><ellipse cx="122" cy="170" rx="14" ry="9" fill={accent} opacity="0.65"/><circle cx="36" cy="60" r="3" fill={accent} opacity="0.4"><animate attributeName="opacity" values="0.4;0.08;0.4" dur="1.8s" repeatCount="indefinite"/></circle><circle cx="164" cy="56" r="2.5" fill={accent} opacity="0.3"><animate attributeName="opacity" values="0.3;0.06;0.3" dur="2.2s" repeatCount="indefinite"/></circle></svg>);}

export function RobotL1({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="rs1p"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.1"/></filter></defs><ellipse cx="100" cy="180" rx="25" ry="4" fill="rgba(58,46,36,0.05)"/><rect x="72" y="90" width="56" height="56" rx="10" fill={accent} filter="url(#rs1p)"/><rect x="80" y="100" width="40" height="24" rx="6" fill="rgba(58,46,36,0.15)"/>{mood==="happy"?<><path d="M 90 112 Q 93 106 96 112" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 104 112 Q 107 106 110 112" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><rect x="88" y="108" width="6" height="6" rx="1.5" fill={accent} opacity={mood==="sad"?"0.5":"0.8"}/><rect x="106" y="108" width="6" height="6" rx="1.5" fill={accent} opacity={mood==="sad"?"0.5":"0.8"}/></>}<rect x="80" y="146" width="14" height="10" rx="4" fill={accent} opacity="0.5"/><rect x="106" y="146" width="14" height="10" rx="4" fill={accent} opacity="0.5"/></svg>);}
export function RobotL2({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="rs2p"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.1"/></filter></defs><ellipse cx="100" cy="184" rx="30" ry="5" fill="rgba(58,46,36,0.05)"/><line x1="100" y1="68" x2="100" y2="56" stroke="rgba(58,46,36,0.15)" strokeWidth="2.5" strokeLinecap="round"/><circle cx="100" cy="52" r="4" fill={accent} opacity="0.7"/><rect x="68" y="68" width="64" height="52" rx="12" fill={accent} filter="url(#rs2p)"/><rect x="76" y="78" width="48" height="24" rx="7" fill="rgba(58,46,36,0.18)"/>{mood==="happy"?<><path d="M 88 90 Q 91 84 94 90" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 106 90 Q 109 84 112 90" stroke="#3a2e24" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><rect x="86" y="86" width="7" height="7" rx="2" fill={accent} opacity={mood==="sad"?"0.5":"0.8"}/><rect x="107" y="86" width="7" height="7" rx="2" fill={accent} opacity={mood==="sad"?"0.5":"0.8"}/></>}<rect x="76" y="122" width="48" height="38" rx="8" fill={accent} filter="url(#rs2p)"/><rect x="56" y="126" width="16" height="8" rx="4" fill={accent} opacity="0.55"/><rect x="128" y="126" width="16" height="8" rx="4" fill={accent} opacity="0.55"/><rect x="80" y="160" width="14" height="14" rx="4" fill={accent} opacity="0.55"/><rect x="106" y="160" width="14" height="14" rx="4" fill={accent} opacity="0.55"/></svg>);}
export function RobotL3({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="rs3p"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.12"/></filter><filter id="rG3p"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={accent} floodOpacity="0.2"/></filter></defs><ellipse cx="100" cy="185" rx="35" ry="5" fill="rgba(58,46,36,0.06)"/><line x1="100" y1="58" x2="100" y2="42" stroke="rgba(58,46,36,0.18)" strokeWidth="3" strokeLinecap="round"/><circle cx="100" cy="38" r="5" fill={accent} filter="url(#rG3p)"><animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite"/></circle><rect x="64" y="58" width="72" height="58" rx="14" fill={accent} filter="url(#rs3p)"/><rect x="74" y="70" width="52" height="26" rx="8" fill="rgba(58,46,36,0.18)"/>{mood==="happy"?<><path d="M 86 82 Q 89 74 92 82" stroke="#3a2e24" strokeWidth="2.8" fill="none" strokeLinecap="round"/><path d="M 108 82 Q 111 74 114 82" stroke="#3a2e24" strokeWidth="2.8" fill="none" strokeLinecap="round"/></>:<><rect x="84" y="78" width="8" height="8" rx="2" fill={accent} opacity={mood==="sad"?"0.5":"1"}/><rect x="108" y="78" width="8" height="8" rx="2" fill={accent} opacity={mood==="sad"?"0.5":"1"}/></>}<rect x="72" y="120" width="56" height="44" rx="10" fill={accent} filter="url(#rs3p)"/><rect x="86" y="128" width="28" height="16" rx="4" fill="rgba(58,46,36,0.15)"/><circle cx="95" cy="136" r="3" fill={mood==="happy"?"#6ec87a":mood==="sad"?"#c4785a":accent} opacity="0.8"><animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/></circle><rect x="50" y="124" width="18" height="10" rx="5" fill={accent} opacity="0.6"/><rect x="44" y="136" width="10" height="16" rx="4" fill={accent} opacity="0.45"/><rect x="132" y="124" width="18" height="10" rx="5" fill={accent} opacity="0.6"/><rect x="146" y="136" width="10" height="16" rx="4" fill={accent} opacity="0.45"/><rect x="78" y="164" width="14" height="16" rx="4" fill={accent} opacity="0.55"/><rect x="108" y="164" width="14" height="16" rx="4" fill={accent} opacity="0.55"/><circle cx="44" cy="54" r="2.5" fill={accent} opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite"/></circle></svg>);}
export function RobotL4({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="rs4p"><feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.12"/></filter><filter id="rG4p"><feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={accent} floodOpacity="0.2"/></filter><filter id="rAuraP"><feDropShadow dx="0" dy="0" stdDeviation="12" floodColor={accent} floodOpacity="0.08"/></filter></defs><ellipse cx="100" cy="186" rx="38" ry="5" fill="rgba(58,46,36,0.06)"/><ellipse cx="100" cy="112" rx="68" ry="70" fill="none" stroke={accent} strokeWidth="1" opacity="0.06" filter="url(#rAuraP)"><animate attributeName="opacity" values="0.06;0.02;0.06" dur="3s" repeatCount="indefinite"/></ellipse><line x1="88" y1="52" x2="85" y2="36" stroke="rgba(58,46,36,0.12)" strokeWidth="2" strokeLinecap="round"/><line x1="100" y1="52" x2="100" y2="32" stroke="rgba(58,46,36,0.18)" strokeWidth="3" strokeLinecap="round"/><line x1="112" y1="52" x2="115" y2="36" stroke="rgba(58,46,36,0.12)" strokeWidth="2" strokeLinecap="round"/><circle cx="85" cy="33" r="3.5" fill={accent} opacity="0.6" filter="url(#rG4p)"/><circle cx="100" cy="28" r="5" fill={accent} filter="url(#rG4p)"><animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite"/></circle><circle cx="115" cy="33" r="3.5" fill={accent} opacity="0.6" filter="url(#rG4p)"/><rect x="62" y="52" width="76" height="62" rx="14" fill={accent} filter="url(#rs4p)"/><rect x="72" y="64" width="56" height="28" rx="8" fill="rgba(58,46,36,0.2)"/>{mood==="happy"?<><path d="M 86 78 Q 89 70 92 78" stroke="#3a2e24" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M 108 78 Q 111 70 114 78" stroke="#3a2e24" strokeWidth="3" fill="none" strokeLinecap="round"/></>:<><rect x="84" y="74" width="9" height="9" rx="2" fill={accent} opacity={mood==="sad"?"0.5":"1"}/><rect x="107" y="74" width="9" height="9" rx="2" fill={accent} opacity={mood==="sad"?"0.5":"1"}/></>}<rect x="68" y="118" width="64" height="48" rx="10" fill={accent} filter="url(#rs4p)"/><rect x="82" y="124" width="36" height="22" rx="5" fill="rgba(58,46,36,0.15)"/><circle cx="95" cy="135" r="4" fill={mood==="happy"?"#6ec87a":mood==="sad"?"#c4785a":accent} filter="url(#rG4p)"><animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/></circle><rect x="46" y="118" width="20" height="14" rx="6" fill={accent} opacity="0.65"/><rect x="134" y="118" width="20" height="14" rx="6" fill={accent} opacity="0.65"/><rect x="42" y="134" width="14" height="22" rx="5" fill={accent} opacity="0.5"/><rect x="144" y="134" width="14" height="22" rx="5" fill={accent} opacity="0.5"/><circle cx="49" cy="160" r="5" fill={accent} opacity="0.4"/><circle cx="151" cy="160" r="5" fill={accent} opacity="0.4"/><rect x="76" y="166" width="16" height="16" rx="5" fill={accent} opacity="0.6"/><rect x="108" y="166" width="16" height="16" rx="5" fill={accent} opacity="0.6"/><circle cx="40" cy="48" r="3" fill={accent} opacity="0.4"><animate attributeName="opacity" values="0.4;0.08;0.4" dur="2s" repeatCount="indefinite"/></circle><circle cx="160" cy="44" r="2.5" fill={accent} opacity="0.3"><animate attributeName="opacity" values="0.3;0.06;0.3" dur="2.4s" repeatCount="indefinite"/></circle></svg>);}
