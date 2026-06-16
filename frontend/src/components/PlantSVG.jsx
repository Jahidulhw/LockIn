// progress: 0–100. instanceId: unique string to avoid clipPath collisions.
export default function PlantSVG({ plantType = 'flower', progress = 0, style, instanceId = 'a', active = false }) {
  const p = Math.max(0, Math.min(100, progress));
  const uid = `ps-${instanceId}`;

  return (
    <svg viewBox="0 0 200 320" style={{ display: 'block', overflow: 'visible', ...style }} aria-label={`${plantType} plant`}>
      <Pot />
      {plantType === 'flower'    && <Flower    p={p} uid={uid} />}
      {plantType === 'sunflower' && <Sunflower p={p} />}
      {plantType === 'bamboo'    && <Bamboo    p={p} />}
      {plantType === 'cactus'    && <Cactus    p={p} />}
      {plantType === 'tree'      && <Tree      p={p} />}
      {plantType === 'crystal'   && <Crystal   p={p} />}
      {plantType === 'cosmic'    && <Cosmic    p={p} />}
      {active && (
        <circle cx="100" cy="160" r="72" fill="none" stroke="#A855F7" strokeWidth="1.5"
          opacity="0.3" style={{ animation: 'plantPulse 2.2s ease-in-out infinite' }} />
      )}
    </svg>
  );
}

// ── Shared ──────────────────────────────────────────────────────────────────
function s(p, t, r = 15) { return Math.min(1, Math.max(0, (p - t) / r)); }

function Pot() {
  return (
    <>
      <path d="M 70,258 L 65,308 L 135,308 L 130,258 Z" fill="#B45309" />
      <rect x="62" y="248" width="76" height="12" rx="4" fill="#D97706" />
      <rect x="66" y="276" width="68" height="5" rx="2" fill="#92400E" />
      <ellipse cx="100" cy="256" rx="34" ry="8" fill="#2D1B10" />
      <ellipse cx="87"  cy="254" rx="5"  ry="2" fill="#1A0D08" opacity="0.7" />
      <ellipse cx="113" cy="255" rx="4"  ry="1.5" fill="#1A0D08" opacity="0.5" />
    </>
  );
}

function Seed({ op }) {
  return (
    <>
      <ellipse cx="100" cy="252" rx="9"  ry="5.5" fill="#78350F" opacity={op} />
      <ellipse cx="98"  cy="250" rx="4"  ry="2.5" fill="#92400E" opacity={op * 0.7} />
    </>
  );
}

// ── Flower (Common) ─────────────────────────────────────────────────────────
function Flower({ p, uid }) {
  const stemProg = s(p, 5, 50);
  const stemTopY = 253 - 161 * stemProg;
  const l1 = s(p, 20, 14), l2 = s(p, 40, 14);
  const bud = s(p, 72, 12), pet = s(p, 85, 12);
  const glow = s(p, 95, 5);
  const clipId = `${uid}-f`;
  return (
    <>
      <Seed op={Math.max(0, 1 - p / 12)} />
      <defs>
        <clipPath id={clipId}>
          <rect x="72" y={stemTopY} width="56" height={264 - stemTopY} />
        </clipPath>
      </defs>
      <path d="M 100,253 C 99,228 101,208 100,168 C 99,140 101,118 100,95"
        stroke="#16A34A" strokeWidth="5.5" fill="none" strokeLinecap="round" clipPath={`url(#${clipId})`} />
      <path d="M 103,250 C 102,225 104,205 103,165 C 102,137 104,115 103,92"
        stroke="#4ADE80" strokeWidth="1.5" fill="none" strokeLinecap="round" clipPath={`url(#${clipId})`} opacity={stemProg * 0.5} />
      <g style={{ opacity: l1 }}>
        <path d="M 100,210 C 118,196 136,190 132,204 C 128,215 105,216 100,210 Z" fill="#16A34A" />
        <path d="M 100,210 C 82,196 64,190 68,204 C 72,215 95,216 100,210 Z"    fill="#15803D" />
      </g>
      <g style={{ opacity: l2 }}>
        <path d="M 100,167 C 116,153 135,148 131,162 C 127,173 104,174 100,167 Z" fill="#22C55E" />
        <path d="M 100,167 C 84,153 65,148 69,162 C 73,173 96,174 100,167 Z"    fill="#16A34A" />
      </g>
      <g opacity={bud * (1 - pet)}>
        <ellipse cx="100" cy="97" rx="7" ry="10" fill="#A855F7" />
        <ellipse cx="100" cy="91" rx="5" ry="7"  fill="#C084FC" />
      </g>
      <g opacity={pet}>
        {[0,72,144,216,288].map((a, i) => (
          <ellipse key={a} cx="100" cy="79" rx="8" ry="16"
            fill={i % 2 ? '#E879F9' : '#F9A8D4'} transform={`rotate(${a},100,96)`} />
        ))}
        <circle cx="100" cy="96" r="11" fill="#FDE047" />
        <circle cx="100" cy="96" r="6"  fill="#F59E0B" />
      </g>
      <circle cx="100" cy="96" r="30" fill="none" stroke="#FDE047" strokeWidth="1.5" opacity={glow * 0.5} />
    </>
  );
}

// ── Sunflower (Rare) ─────────────────────────────────────────────────────────
function Sunflower({ p }) {
  const stemH  = s(p,  8, 55) * 170;
  const l1     = s(p, 38, 18);
  const l2     = s(p, 54, 18);
  const head   = s(p, 65, 18);
  const petals = s(p, 78, 16);
  const glow   = s(p, 95,  5);
  const hy     = 253 - stemH;
  return (
    <>
      <Seed op={Math.max(0, 1 - p / 12)} />
      {stemH > 2 && <rect x="97.5" y={hy} width="5" height={stemH} rx="2.5" fill="#15803D" />}
      <g opacity={l1}>
        <path d="M 99,215 C 78,202 60,202 65,218 C 70,230 95,228 99,215 Z"   fill="#16A34A" />
        <path d="M 101,215 C 122,202 140,202 135,218 C 130,230 105,228 101,215 Z" fill="#15803D" />
      </g>
      <g opacity={l2}>
        <path d="M 99,173 C 80,162 62,163 67,177 C 72,189 96,187 99,173 Z"   fill="#22C55E" />
        <path d="M 101,173 C 120,162 138,163 133,177 C 128,189 104,187 101,173 Z" fill="#16A34A" />
      </g>
      <g opacity={head}>
        <g opacity={petals}>
          {Array.from({ length: 12 }, (_, i) => (
            <ellipse key={i} cx="100" cy={hy - 20} rx="7" ry="18"
              fill={i % 2 ? '#FBBF24' : '#FDE047'} transform={`rotate(${i * 30},100,${hy})`} />
          ))}
        </g>
        <circle cx="100" cy={hy} r="20" fill="#292524" />
        <circle cx="100" cy={hy} r="15" fill="#1C1917" />
        {[0,60,120,180,240,300].map((a) => {
          const r = (a * Math.PI) / 180;
          return <circle key={a} cx={100 + Math.cos(r) * 9} cy={hy + Math.sin(r) * 9} r="2" fill="#78350F" opacity=".8" />;
        })}
        <circle cx="100" cy={hy} r="4" fill="#92400E" />
      </g>
      <circle cx="100" cy={hy} r="42" fill="none" stroke="#FDE047" strokeWidth="2" opacity={glow * 0.45} />
    </>
  );
}

// ── Bamboo (Rare) ────────────────────────────────────────────────────────────
function Bamboo({ p }) {
  const h1  = s(p,  8, 58) * 188;
  const h2  = s(p, 28, 52) * 158;
  const lf1 = s(p, 48, 16);
  const lf2 = s(p, 62, 16);
  const lf3 = s(p, 74, 14);

  function Stalk({ x, h, fill, joint }) {
    if (h < 2) return null;
    const segH = 30, segs = Math.ceil(h / segH);
    return (
      <>
        {Array.from({ length: segs }, (_, i) => {
          const remaining = h - i * segH;
          if (remaining <= 0) return null;
          const sh = Math.min(segH - 2, remaining);
          const y  = 253 - i * segH - sh;
          return (
            <g key={i}>
              <rect x={x - 5} y={y} width="10" height={sh} rx="4" fill={fill} />
              {sh >= segH - 2 && i < segs - 1 &&
                <rect x={x - 7} y={253 - (i + 1) * segH - 1} width="14" height="4" rx="2" fill={joint} />}
            </g>
          );
        })}
      </>
    );
  }

  return (
    <>
      <Seed op={Math.max(0, 1 - p / 12)} />
      <Stalk x={87}  h={h1} fill="#22C55E" joint="#15803D" />
      <Stalk x={113} h={h2} fill="#4ADE80" joint="#22C55E" />
      {h1 > 80 && (
        <>
          <g opacity={lf1}>
            <path d={`M 82,${253-h1*0.52} C 58,${253-h1*0.52-28} 44,${253-h1*0.52-44} 70,${253-h1*0.52-20} Z`} fill="#16A34A" />
          </g>
          <g opacity={lf2}>
            <path d={`M 92,${253-h1*0.72} C 116,${253-h1*0.72-24} 132,${253-h1*0.72-38} 106,${253-h1*0.72-18} Z`} fill="#22C55E" />
          </g>
        </>
      )}
      {h2 > 80 && (
        <g opacity={lf3}>
          <path d={`M 118,${253-h2*0.70} C 142,${253-h2*0.70-22} 158,${253-h2*0.70-36} 132,${253-h2*0.70-16} Z`} fill="#4ADE80" />
          <path d={`M 108,${253-h2*0.88} C 84,${253-h2*0.88-20} 68,${253-h2*0.88-32} 96,${253-h2*0.88-15} Z`}  fill="#16A34A" />
        </g>
      )}
    </>
  );
}

// ── Cactus (Epic) ────────────────────────────────────────────────────────────
function Cactus({ p }) {
  const bodyH = s(p,  8, 55) * 148;
  const arm1  = s(p, 55, 20);
  const arm2  = s(p, 68, 18);
  const flwr  = s(p, 88, 12);
  const glow  = s(p, 96,  4);
  const by    = 253 - bodyH;

  return (
    <>
      <Seed op={Math.max(0, 1 - p / 12)} />
      {bodyH > 2 && (
        <>
          <rect x="83" y={by} width="34" height={bodyH} rx="17" fill="#15803D" />
          <rect x="88" y={by + 4} width="10" height={bodyH - 4} rx="4" fill="#22C55E" opacity="0.38" />
          {Array.from({ length: Math.floor(bodyH / 18) }, (_, i) => (
            <g key={i}>
              <line x1="83" y1={by + i * 18 + 10} x2="76" y2={by + i * 18 + 7} stroke="#D1FAE5" strokeWidth="1.2" opacity="0.7" />
              <line x1="117" y1={by + i * 18 + 10} x2="124" y2={by + i * 18 + 7} stroke="#D1FAE5" strokeWidth="1.2" opacity="0.7" />
            </g>
          ))}
        </>
      )}
      <g opacity={arm1}>
        <path d="M 83,192 C 60,186 50,170 56,156 C 62,144 72,150 76,162 C 80,174 80,185 83,182 Z" fill="#16A34A" />
        <line x1="60" y1="166" x2="54" y2="160" stroke="#D1FAE5" strokeWidth="1.1" opacity="0.7" />
        <line x1="64" y1="157" x2="59" y2="151" stroke="#D1FAE5" strokeWidth="1.1" opacity="0.7" />
      </g>
      <g opacity={arm2}>
        <path d="M 117,176 C 140,170 150,154 144,140 C 138,128 128,134 125,146 C 122,158 120,168 117,165 Z" fill="#22C55E" />
        <line x1="141" y1="147" x2="147" y2="141" stroke="#D1FAE5" strokeWidth="1.1" opacity="0.7" />
        <line x1="137" y1="139" x2="142" y2="133" stroke="#D1FAE5" strokeWidth="1.1" opacity="0.7" />
      </g>
      <g opacity={flwr}>
        {[0,72,144,216,288].map((a, i) => (
          <ellipse key={a} cx="100" cy={by - 8} rx="5" ry="10"
            fill={i % 2 ? '#FDE047' : '#FB923C'} transform={`rotate(${a},100,${by})`} />
        ))}
        <circle cx="100" cy={by} r="8" fill="#FCD34D" />
      </g>
      <circle cx="100" cy={by} r="30" fill="none" stroke="#FDE047" strokeWidth="1.5" opacity={glow * 0.4} />
    </>
  );
}

// ── Bonsai Tree (Epic) ───────────────────────────────────────────────────────
function Tree({ p }) {
  const trunkH   = s(p,  8, 40) * 88;
  const branches = s(p, 42, 22);
  const canopy   = s(p, 58, 22);
  const blossoms = s(p, 82, 15);
  const glow     = s(p, 95,  5);
  const ty       = 253 - trunkH;

  return (
    <>
      <Seed op={Math.max(0, 1 - p / 12)} />
      {trunkH > 2 && (
        <path d={`M 96,253 C 97,235 98,215 100,${ty}`}
          stroke="#92400E" strokeWidth="14" fill="none" strokeLinecap="round" />
      )}
      {trunkH > 28 && (
        <g opacity={branches}>
          <path d={`M 100,${ty+14} C 79,${ty-6} 63,${ty-16} 53,${ty-9}`}   stroke="#78350F" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d={`M 100,${ty+9}  C 120,${ty-9} 134,${ty-19} 144,${ty-11}`} stroke="#78350F" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d={`M 100,${ty}   C 95,${ty-22} 92,${ty-36} 90,${ty-30}`}   stroke="#92400E" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      )}
      <g opacity={canopy}>
        <ellipse cx="78"  cy={ty - 24} rx="30" ry="23" fill="#15803D" />
        <ellipse cx="122" cy={ty - 20} rx="28" ry="21" fill="#16A34A" />
        <ellipse cx="100" cy={ty - 37} rx="26" ry="22" fill="#22C55E" />
        <ellipse cx="100" cy={ty - 28} rx="22" ry="17" fill="#4ADE80" opacity="0.45" />
      </g>
      <g opacity={blossoms}>
        {[[75, ty-32],[120,ty-24],[95,ty-52],[110,ty-42],[62,ty-20],[108,ty-60]].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="8"  fill="#FBCFE8" opacity="0.9" />
            <circle cx={cx} cy={cy} r="4"  fill="#F9A8D4" />
            <circle cx={cx} cy={cy} r="2"  fill="#EC4899" opacity="0.7" />
          </g>
        ))}
      </g>
      <circle cx="100" cy={ty - 28} r="52" fill="none" stroke="#F9A8D4" strokeWidth="1.5" opacity={glow * 0.38} />
    </>
  );
}

// ── Crystal Rose (Legendary) ─────────────────────────────────────────────────
function Crystal({ p }) {
  const c1    = s(p,  8, 30);
  const c2    = s(p, 30, 25);
  const c3    = s(p, 46, 25);
  const c4    = s(p, 60, 20);
  const inner = s(p, 74, 20);
  const glow  = s(p, 90, 10);

  return (
    <>
      <Seed op={Math.max(0, 1 - p / 12)} />
      {/* Center crystal */}
      <g opacity={c1} style={{ transformOrigin: '100px 253px', transform: `scaleY(${c1})` }}>
        <path d="M 100,255 L 91,220 L 95,198 L 100,88 L 105,198 L 109,220 Z" fill="#7DD3FC" opacity="0.88" />
        <path d="M 100,255 L 103,222 L 107,200 L 100,88 L 100,198 Z"         fill="#E0F2FE" opacity="0.28" />
        <line x1="100" y1="88" x2="91" y2="198"  stroke="#0EA5E9" strokeWidth="0.8" opacity="0.55" />
        <line x1="100" y1="88" x2="109" y2="198" stroke="#0EA5E9" strokeWidth="0.8" opacity="0.55" />
      </g>
      {/* Left crystal */}
      <g opacity={c2} style={{ transformOrigin: '88px 253px', transform: `scaleY(${c2})` }}>
        <path d="M 88,255 L 79,228 L 82,212 L 87,132 L 92,212 L 95,228 Z" fill="#67E8F9" opacity="0.82" />
        <path d="M 88,255 L 91,230 L 94,214 L 87,132 L 87,212 Z"          fill="#E0F2FE" opacity="0.22" />
      </g>
      {/* Right crystal */}
      <g opacity={c3} style={{ transformOrigin: '112px 253px', transform: `scaleY(${c3})` }}>
        <path d="M 112,255 L 106,226 L 108,210 L 113,142 L 120,210 L 122,226 Z" fill="#38BDF8" opacity="0.82" />
        <path d="M 112,255 L 115,228 L 118,212 L 113,142 L 113,210 Z"            fill="#E0F2FE" opacity="0.22" />
      </g>
      {/* Small accent crystals */}
      <g opacity={c4}>
        <path d="M 75,255 L 70,238 L 72,230 L 76,186 L 80,230 L 82,238 Z"   fill="#BAE6FD" opacity="0.72" />
        <path d="M 125,255 L 121,236 L 123,228 L 127,194 L 131,228 L 133,236 Z" fill="#7DD3FC" opacity="0.72" />
        <path d="M 100,255 L 96,246 L 97,242 L 100,224 L 103,242 L 104,246 Z" fill="#E0F2FE" opacity="0.6" />
      </g>
      {/* Inner glow halos */}
      <g opacity={inner}>
        <ellipse cx="100" cy="190" rx="13" ry="68" fill="#7DD3FC" opacity="0.14" />
        <ellipse cx="87"  cy="205" rx="8"  ry="44" fill="#67E8F9" opacity="0.11" />
        <ellipse cx="113" cy="208" rx="8"  ry="40" fill="#38BDF8" opacity="0.11" />
      </g>
      {/* Sparkles */}
      {[
        [68,118],[134,142],[54,172],[148,105],[100,92],[80,155],[122,130]
      ].map(([cx, cy], i) => (
        <g key={i} opacity={glow * 0.75}>
          <line x1={cx-5} y1={cy}   x2={cx+5} y2={cy}   stroke="#BAE6FD" strokeWidth="1.5" />
          <line x1={cx}   y1={cy-5} x2={cx}   y2={cy+5} stroke="#BAE6FD" strokeWidth="1.5" />
        </g>
      ))}
      <circle cx="100" cy="172" r="36" fill="none" stroke="#7DD3FC" strokeWidth="1.5" opacity={glow * 0.5} />
      <circle cx="100" cy="172" r="58" fill="none" stroke="#BAE6FD" strokeWidth="1"   opacity={glow * 0.25} />
    </>
  );
}

// ── Cosmic Bloom (Mythic) ────────────────────────────────────────────────────
const RAINBOW7 = ['#F87171','#FB923C','#FBBF24','#4ADE80','#60A5FA','#A78BFA','#F472B6'];

function Cosmic({ p }) {
  const stem    = s(p,  8, 42);
  const spiral1 = s(p, 38, 22);
  const spiral2 = s(p, 52, 22);
  const orbs    = s(p, 64, 20);
  const bloom   = s(p, 80, 18);
  const glow    = s(p, 92,  8);

  return (
    <>
      <Seed op={Math.max(0, 1 - p / 12)} />
      <g opacity={stem}>
        <path d="M 100,253 C 96,230 104,210 98,178 C 92,148 106,128 100,98"
          stroke="#A78BFA" strokeWidth="4"   fill="none" strokeLinecap="round" />
        <path d="M 100,253 C 96,230 104,210 98,178 C 92,148 106,128 100,98"
          stroke="#E879F9" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.5" />
      </g>
      <g opacity={spiral1}>
        <path d="M 100,212 C 78,202 63,186 69,168 C 75,151 91,156 95,169 C 99,182 87,192 100,212 Z"
          fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g opacity={spiral2}>
        <path d="M 100,174 C 122,160 142,146 137,130 C 132,114 115,119 113,132 C 111,145 123,156 100,174 Z"
          fill="none" stroke="#F472B6" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g opacity={orbs}>
        {[[66,188],[135,162],[75,145],[130,130],[95,128],[112,175],[82,165]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4.5" fill={RAINBOW7[i % 7]} opacity="0.85" />
        ))}
      </g>
      <g opacity={bloom}>
        {RAINBOW7.map((color, i) => (
          <ellipse key={i} cx="100" cy="81" rx="6" ry="15"
            fill={color} opacity="0.78" transform={`rotate(${i * (360 / 7)},100,100)`} />
        ))}
        <circle cx="100" cy="100" r="13" fill="#1e1b4b" />
        <circle cx="100" cy="100" r="9"  fill="#312e81" />
        <circle cx="100" cy="100" r="5"  fill="#A78BFA" opacity="0.95" />
        <circle cx="100" cy="100" r="3"  fill="#E879F9" />
      </g>
      {[
        [62,110],[140,124],[52,165],[150,96],[76,88],[126,72],[100,75]
      ].map(([cx, cy], i) => (
        <g key={i} opacity={glow * 0.82}>
          <circle cx={cx} cy={cy} r="2.2" fill={RAINBOW7[i % 7]} />
          <line x1={cx-5} y1={cy}   x2={cx+5} y2={cy}   stroke={RAINBOW7[i % 7]} strokeWidth="1" opacity="0.6" />
          <line x1={cx}   y1={cy-5} x2={cx}   y2={cy+5} stroke={RAINBOW7[i % 7]} strokeWidth="1" opacity="0.6" />
        </g>
      ))}
      <circle cx="100" cy="100" r="44" fill="none" stroke="#A78BFA" strokeWidth="1.5" opacity={glow * 0.38} />
      <circle cx="100" cy="100" r="68" fill="none" stroke="#F472B6" strokeWidth="1"   opacity={glow * 0.2}  />
    </>
  );
}
