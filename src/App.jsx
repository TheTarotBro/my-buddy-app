import { useState, useEffect, useRef, useCallback } from "react";
import { signInGoogle, signOutUser, onAuthChange, saveData, loadData } from "./firebase.js";

const TODAY = () => new Date().toISOString().slice(0, 10);
const DIFF_PTS = { Easy: 10, Medium: 25, Hard: 50 };
const CORE_BONUS = 10;
const LVL_XP = [0, 500, 1250, 2250, 3750, 6000];
const LVL_NAMES = ["Egg", "Sprout", "Bloom", "Radiant", "Stellar"];
const INTERVALS = [
  { label: "Daily", value: "daily" }, { label: "Every other day", value: "every_other_day" },
  { label: "Weekly", value: "weekly" }, { label: "Biweekly", value: "biweekly" }, { label: "Monthly", value: "monthly" },
];
const BUDDY_TYPES = [
  { id: "bird", name: "Pip", desc: "Cheerful bird", accent: "#5bc9e8" },
  { id: "snake", name: "Slynk", desc: "Chill serpent", accent: "#6ee7a0" },
  { id: "monkey", name: "Mochi", desc: "Playful primate", accent: "#e8a84c" },
  { id: "robot", name: "Bolt", desc: "Friendly mech", accent: "#b07ae8" },
];
const ENVIRONMENTS = [
  { id: "office", name: "Office", icon: "🏢" },
  { id: "livingroom", name: "Living Room", icon: "🛋️" },
  { id: "park", name: "Park", icon: "🌳" },
  { id: "rave", name: "Rave", icon: "🎆" },
  { id: "beach", name: "Beach", icon: "🏖️" },
  { id: "forest", name: "Forest", icon: "🌲" },
];

function isDueToday(ch, td) {
  if (ch.type === "one-off") return !ch.completedDate;
  const cr = new Date(ch.createdDate + "T00:00:00"), t = new Date(td + "T00:00:00"), d = Math.round((t - cr) / 86400000);
  if (d < 0) return false;
  switch (ch.interval) { case "daily": return true; case "every_other_day": return d % 2 === 0; case "weekly": return d % 7 === 0; case "biweekly": return d % 14 === 0; case "monthly": return t.getDate() === cr.getDate(); default: return true; }
}
function isRecurring(c) { return c.type === "recurring" && c.interval !== "daily"; }
function isDaily(c) { return c.type === "recurring" && c.interval === "daily"; }
function getLvl(xp) { let lv = 0; for (let i = LVL_XP.length - 1; i >= 0; i--) if (xp >= LVL_XP[i]) { lv = i; break; } const cur = LVL_XP[lv], nxt = LVL_XP[lv + 1] || cur + 1000; return { lv, name: LVL_NAMES[lv] || "Stellar", prog: Math.min((xp - cur) / (nxt - cur), 1), xp, need: LVL_XP[lv + 1] ? LVL_XP[lv + 1] - xp : 0 }; }
function getBdToday(bds) { const t = new Date(), m = t.getMonth(), d = t.getDate(); return bds.filter(b => { const x = new Date(b.date + "T00:00:00"); return x.getMonth() === m && x.getDate() === d; }); }
function daysUntil(ds) { const now = new Date(), bd = new Date(ds + "T00:00:00"); bd.setFullYear(now.getFullYear()); const td = new Date(now.getFullYear(), now.getMonth(), now.getDate()); if (bd < td) bd.setFullYear(now.getFullYear() + 1); return Math.round((bd - td) / 86400000); }

// ═══ BUDDY AVATARS (imported from buddies.jsx) ═══
import { EggStage, BirdL1, BirdL2, BirdL3, BirdL4, SnakeL1, SnakeL2, SnakeL3, SnakeL4, MonkeyL1, MonkeyL2, MonkeyL3, MonkeyL4, RobotL1, RobotL2, RobotL3, RobotL4 } from "./buddies.jsx";

const BUDDY_STAGES = {
  bird: [null, BirdL1, BirdL2, BirdL3, BirdL4],
  snake: [null, SnakeL1, SnakeL2, SnakeL3, SnakeL4],
  monkey: [null, MonkeyL1, MonkeyL2, MonkeyL3, MonkeyL4],
  robot: [null, RobotL1, RobotL2, RobotL3, RobotL4],
};

function BuddyFace({ mood, level, hat, buddyType, size = 140 }) {
  const bt = BUDDY_TYPES.find(b => b.id === buddyType) || BUDDY_TYPES[0];
  const stages = BUDDY_STAGES[bt.id] || BUDDY_STAGES.bird;
  const ani = mood === "happy" ? "bb 1.4s ease-in-out infinite" : mood === "sad" ? "bwob 3s ease-in-out infinite" : "bfl 2.8s ease-in-out infinite";
  let content;
  if (level === 0) content = <EggStage size={size} accent={bt.accent} />;
  else { const Stage = stages[Math.min(level, stages.length - 1)]; content = <Stage size={size} accent={bt.accent} mood={mood} />; }
  return (<div style={{ position:"relative", display:"inline-block", animation:ani }}>{hat&&(<svg width={size*0.35} height={size*0.3} viewBox="0 0 70 50" style={{position:"absolute",top:level===0?-size*0.05:-size*0.1,left:size*0.33,zIndex:2,filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.15)"}}><polygon points="35,3 52,36 18,36" fill={bt.accent} stroke="rgba(58,46,36,0.1)" strokeWidth="1"/><circle cx="35" cy="3" r="3.5" fill="#ffe066"/><rect x="18" y="35" width="34" height="4" rx="2" fill="rgba(58,46,36,0.08)"/></svg>)}{content}</div>);
}

// ═══ ENVIRONMENT BACKGROUNDS — Bright warm versions ═══
function EnvironmentBg({ envId, width = 440, height = 220 }) {
  const w = width, h = height;
  if (envId === "office") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)"}}>
      {/* Warm wall */}
      <rect width={w} height={h} fill="#f0e6d8"/>
      <rect y={h*0.68} width={w} height={h*0.32} fill="#e8dcc8"/>
      <line x1={0} y1={h*0.68} x2={w} y2={h*0.68} stroke="rgba(90,74,62,0.08)" strokeWidth="1"/>
      {/* Window with sky view */}
      <rect x={w*0.3} y={h*0.06} width={w*0.4} height={h*0.42} rx="4" fill="#d4e8f4" stroke="#c8b8a4" strokeWidth="1.5"/>
      <line x1={w*0.5} y1={h*0.06} x2={w*0.5} y2={h*0.48} stroke="#c8b8a4" strokeWidth="1"/>
      <line x1={w*0.3} y1={h*0.27} x2={w*0.7} y2={h*0.27} stroke="#c8b8a4" strokeWidth="1"/>
      {/* Clouds through window */}
      <ellipse cx={w*0.4} cy={h*0.14} rx={w*0.06} ry={h*0.03} fill="white" opacity="0.6"/>
      <ellipse cx={w*0.58} cy={h*0.18} rx={w*0.04} ry={h*0.025} fill="white" opacity="0.5"/>
      {/* Sunbeam */}
      <path d={`M ${w*0.55} ${h*0.06} L ${w*0.65} ${h*0.68} L ${w*0.45} ${h*0.68} Z`} fill="rgba(255,220,140,0.06)"/>
      {/* Desk — warm wood */}
      <rect x={w*0.08} y={h*0.58} width={w*0.4} height={h*0.04} rx="2" fill="#b89878" stroke="#a88868" strokeWidth="0.5"/>
      <rect x={w*0.12} y={h*0.62} width={w*0.04} height={h*0.16} fill="#a88868"/>
      <rect x={w*0.4} y={h*0.62} width={w*0.04} height={h*0.16} fill="#a88868"/>
      {/* Monitor */}
      <rect x={w*0.16} y={h*0.36} width={w*0.2} height={h*0.2} rx="3" fill="#e0dcd6" stroke="#b8a898" strokeWidth="1"/>
      <rect x={w*0.18} y={h*0.38} width={w*0.16} height={h*0.14} rx="2" fill="#c8dce8"/>
      <rect x={w*0.24} y={h*0.56} width={w*0.04} height={h*0.02} fill="#b8a898"/>
      {/* Coffee mug */}
      <rect x={w*0.38} y={h*0.52} width={w*0.035} height={h*0.06} rx="2" fill="#d4a878"/>
      <path d={`M ${w*0.415} ${h*0.54} Q ${w*0.43} ${h*0.55} ${w*0.415} ${h*0.56}`} stroke="#d4a878" strokeWidth="1.5" fill="none"/>
      {/* Steam */}
      <path d={`M ${w*0.39} ${h*0.5} Q ${w*0.395} ${h*0.46} ${w*0.39} ${h*0.42}`} stroke="rgba(90,74,62,0.08)" strokeWidth="1" fill="none"/>
      <path d={`M ${w*0.4} ${h*0.5} Q ${w*0.405} ${h*0.44} ${w*0.4} ${h*0.4}`} stroke="rgba(90,74,62,0.06)" strokeWidth="1" fill="none"/>
      {/* Plant */}
      <rect x={w*0.78} y={h*0.52} width={w*0.07} height={h*0.1} rx="3" fill="#c4785a" opacity="0.7"/>
      <circle cx={w*0.815} cy={h*0.46} r={w*0.045} fill="#7a9a6d"/>
      <circle cx={w*0.795} cy={h*0.42} r={w*0.035} fill="#8aaa7a"/>
      <circle cx={w*0.835} cy={h*0.44} r={w*0.03} fill="#6a8a5d"/>
      {/* Picture frame on wall */}
      <rect x={w*0.76} y={h*0.1} width={w*0.1} height={h*0.14} rx="2" fill="#ede4d8" stroke="#c8b8a4" strokeWidth="1"/>
      <rect x={w*0.77} y={h*0.11} width={w*0.08} height={h*0.12} rx="1" fill="#d4c8b8"/>
    </svg>
  );
  if (envId === "livingroom") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)"}}>
      <rect width={w} height={h} fill="#ede4d8"/>
      <rect y={h*0.65} width={w} height={h*0.35} fill="#ddd0c0"/>
      {/* Rug */}
      <ellipse cx={w*0.5} cy={h*0.82} rx={w*0.32} ry={h*0.1} fill="#c4785a" opacity="0.15"/>
      <ellipse cx={w*0.5} cy={h*0.82} rx={w*0.26} ry={h*0.07} fill="#c4785a" opacity="0.08"/>
      {/* Couch */}
      <rect x={w*0.06} y={h*0.48} width={w*0.42} height={h*0.2} rx="8" fill="#9a7ab4" opacity="0.6"/>
      <rect x={w*0.08} y={h*0.44} width={w*0.12} height={h*0.24} rx="6" fill="#9a7ab4" opacity="0.5"/>
      <rect x={w*0.34} y={h*0.44} width={w*0.12} height={h*0.24} rx="6" fill="#9a7ab4" opacity="0.5"/>
      {/* Cushions */}
      <rect x={w*0.14} y={h*0.48} width={w*0.09} height={h*0.12} rx="4" fill="#b08ac4" opacity="0.5"/>
      <rect x={w*0.26} y={h*0.48} width={w*0.09} height={h*0.12} rx="4" fill="#a88ab8" opacity="0.45"/>
      {/* Floor lamp */}
      <rect x={w*0.72} y={h*0.22} width={w*0.012} height={h*0.42} fill="#b8a898"/>
      <ellipse cx={w*0.726} cy={h*0.22} rx={w*0.04} ry={h*0.06} fill="#f0e4d0" stroke="#d4c4b0" strokeWidth="0.8"/>
      {/* Lamp glow */}
      <ellipse cx={w*0.726} cy={h*0.32} rx={w*0.08} ry={h*0.12} fill="rgba(255,220,140,0.08)"/>
      {/* Side table */}
      <rect x={w*0.68} y={h*0.56} width={w*0.1} height={h*0.04} rx="2" fill="#b89878"/>
      <rect x={w*0.71} y={h*0.6} width={w*0.04} height={h*0.12} fill="#a88868"/>
      {/* Book on table */}
      <rect x={w*0.69} y={h*0.53} width={w*0.05} height={h*0.03} rx="1" fill="#5a9ab4" opacity="0.6"/>
      {/* Picture frames */}
      <rect x={w*0.55} y={h*0.1} width={w*0.08} height={h*0.12} rx="2" fill="#ede4d8" stroke="#c8b8a4" strokeWidth="1"/>
      <rect x={w*0.65} y={h*0.08} width={w*0.06} height={h*0.1} rx="2" fill="#ede4d8" stroke="#c8b8a4" strokeWidth="1"/>
      {/* Bookshelf */}
      <rect x={w*0.82} y={h*0.14} width={w*0.14} height={h*0.46} rx="3" fill="#c8b8a4" opacity="0.4"/>
      <rect x={w*0.83} y={h*0.17} width={w*0.035} height={h*0.07} rx="1" fill="#c4785a" opacity="0.5"/>
      <rect x={w*0.87} y={h*0.17} width={w*0.03} height={h*0.07} rx="1" fill="#5a9ab4" opacity="0.5"/>
      <rect x={w*0.905} y={h*0.17} width={w*0.025} height={h*0.07} rx="1" fill="#7a9a6d" opacity="0.5"/>
      <rect x={w*0.83} y={h*0.28} width={w*0.04} height={h*0.07} rx="1" fill="#e8a84c" opacity="0.4"/>
      <rect x={w*0.88} y={h*0.28} width={w*0.03} height={h*0.07} rx="1" fill="#9a7ab4" opacity="0.4"/>
      <rect x={w*0.83} y={h*0.39} width={w*0.03} height={h*0.07} rx="1" fill="#5bc9e8" opacity="0.4"/>
      <rect x={w*0.87} y={h*0.39} width={w*0.04} height={h*0.07} rx="1" fill="#c4785a" opacity="0.35"/>
    </svg>
  );
  if (envId === "park") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)"}}>
      {/* Golden hour sky */}
      <rect width={w} height={h} fill="#d4e4f0"/>
      <rect width={w} height={h*0.3} fill="#e8d8c0" opacity="0.3"/>
      {/* Soft clouds */}
      <ellipse cx={w*0.2} cy={h*0.12} rx={w*0.08} ry={h*0.04} fill="white" opacity="0.5"/>
      <ellipse cx={w*0.6} cy={h*0.08} rx={w*0.1} ry={h*0.035} fill="white" opacity="0.4"/>
      <ellipse cx={w*0.85} cy={h*0.15} rx={w*0.06} ry={h*0.03} fill="white" opacity="0.45"/>
      {/* Rolling green ground */}
      <path d={`M 0 ${h*0.55} Q ${w*0.2} ${h*0.5} ${w*0.4} ${h*0.55} Q ${w*0.6} ${h*0.58} ${w*0.8} ${h*0.53} Q ${w*0.9} ${h*0.51} ${w} ${h*0.55} L ${w} ${h} L 0 ${h} Z`} fill="#8ab878"/>
      <path d={`M 0 ${h*0.6} Q ${w*0.3} ${h*0.56} ${w*0.5} ${h*0.6} Q ${w*0.7} ${h*0.63} ${w} ${h*0.58} L ${w} ${h} L 0 ${h} Z`} fill="#7aaa68"/>
      {/* Path */}
      <path d={`M ${w*0.35} ${h} Q ${w*0.42} ${h*0.72} ${w*0.55} ${h*0.62} Q ${w*0.65} ${h*0.58} ${w*0.7} ${h*0.55}`} stroke="#d4c8a8" strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.4"/>
      {/* Tree left */}
      <rect x={w*0.06} y={h*0.25} width={w*0.025} height={h*0.35} fill="#8a6a4a"/>
      <circle cx={w*0.07} cy={h*0.22} r={w*0.055} fill="#5a8a4a"/>
      <circle cx={w*0.055} cy={h*0.18} r={w*0.04} fill="#6a9a5a"/>
      <circle cx={w*0.09} cy={h*0.2} r={w*0.035} fill="#4a7a3a"/>
      {/* Tree right */}
      <rect x={w*0.84} y={h*0.2} width={w*0.025} height={h*0.4} fill="#8a6a4a"/>
      <circle cx={w*0.85} cy={h*0.16} r={w*0.06} fill="#5a8a4a"/>
      <circle cx={w*0.87} cy={h*0.12} r={w*0.04} fill="#6a9a5a"/>
      <circle cx={w*0.83} cy={h*0.14} r={w*0.035} fill="#4a7a3a"/>
      {/* Bench */}
      <rect x={w*0.55} y={h*0.52} width={w*0.14} height={h*0.015} rx="1" fill="#a08060"/>
      <rect x={w*0.55} y={h*0.5} width={w*0.14} height={h*0.015} rx="1" fill="#b09070"/>
      <rect x={w*0.57} y={h*0.535} width={w*0.012} height={h*0.06} fill="#907050"/>
      <rect x={w*0.67} y={h*0.535} width={w*0.012} height={h*0.06} fill="#907050"/>
      {/* Flowers */}
      <circle cx={w*0.18} cy={h*0.6} r="3.5" fill="#e86a8a" opacity="0.6"/><circle cx={w*0.21} cy={h*0.62} r="3" fill="#e8a84c" opacity="0.5"/>
      <circle cx={w*0.24} cy={h*0.59} r="2.5" fill="#b07ae8" opacity="0.5"/>
      <circle cx={w*0.76} cy={h*0.57} r="3" fill="#e86a8a" opacity="0.5"/><circle cx={w*0.79} cy={h*0.59} r="2.5" fill="#5bc9e8" opacity="0.4"/>
      {/* Distant hills */}
      <path d={`M 0 ${h*0.55} Q ${w*0.15} ${h*0.42} ${w*0.3} ${h*0.48} Q ${w*0.5} ${h*0.4} ${w*0.7} ${h*0.46} Q ${w*0.85} ${h*0.42} ${w} ${h*0.5}`} fill="#9aba88" opacity="0.3"/>
    </svg>
  );
  if (envId === "rave") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)"}}>
      <rect width={w} height={h} fill="#0a0a18"/>
      <rect y={h*0.72} width={w} height={h*0.28} fill="#0e0e1e"/>
      {/* Neon beams */}
      <line x1={w*0.1} y1={0} x2={w*0.3} y2={h} stroke="#ff00ff" strokeWidth="2" opacity="0.25"><animate attributeName="opacity" values="0.25;0.06;0.25" dur="1.5s" repeatCount="indefinite"/></line>
      <line x1={w*0.5} y1={0} x2={w*0.38} y2={h} stroke="#00ffff" strokeWidth="2" opacity="0.2"><animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite"/></line>
      <line x1={w*0.9} y1={0} x2={w*0.7} y2={h} stroke="#ff00ff" strokeWidth="2" opacity="0.25"><animate attributeName="opacity" values="0.25;0.06;0.25" dur="1.8s" repeatCount="indefinite"/></line>
      <line x1={w*0.7} y1={0} x2={w*0.85} y2={h} stroke="#00ff88" strokeWidth="1.5" opacity="0.15"><animate attributeName="opacity" values="0.15;0.04;0.15" dur="2.2s" repeatCount="indefinite"/></line>
      <line x1={w*0.3} y1={0} x2={w*0.15} y2={h} stroke="#00ffff" strokeWidth="1.5" opacity="0.12"><animate attributeName="opacity" values="0.12;0.03;0.12" dur="1.7s" repeatCount="indefinite"/></line>
      {/* Speakers */}
      <rect x={w*0.02} y={h*0.35} width={w*0.08} height={h*0.38} rx="4" fill="#1a1a2e" stroke="#ff00ff" strokeWidth="0.8" opacity="0.5"/>
      <circle cx={w*0.06} cy={h*0.46} r={w*0.022} fill="#1a1a2e" stroke="#ff00ff" strokeWidth="0.8" opacity="0.4"/>
      <circle cx={w*0.06} cy={h*0.6} r={w*0.028} fill="#1a1a2e" stroke="#ff00ff" strokeWidth="0.8" opacity="0.4"/>
      <rect x={w*0.9} y={h*0.35} width={w*0.08} height={h*0.38} rx="4" fill="#1a1a2e" stroke="#00ffff" strokeWidth="0.8" opacity="0.5"/>
      <circle cx={w*0.94} cy={h*0.46} r={w*0.022} fill="#1a1a2e" stroke="#00ffff" strokeWidth="0.8" opacity="0.4"/>
      <circle cx={w*0.94} cy={h*0.6} r={w*0.028} fill="#1a1a2e" stroke="#00ffff" strokeWidth="0.8" opacity="0.4"/>
      {/* Floating particles */}
      <circle cx={w*0.2} cy={h*0.2} r="3" fill="#ff00ff" opacity="0.5"><animate attributeName="cy" values={`${h*0.2};${h*0.14};${h*0.2}`} dur="3s" repeatCount="indefinite"/></circle>
      <circle cx={w*0.6} cy={h*0.28} r="2.5" fill="#00ffff" opacity="0.4"><animate attributeName="cy" values={`${h*0.28};${h*0.22};${h*0.28}`} dur="2.5s" repeatCount="indefinite"/></circle>
      <circle cx={w*0.8} cy={h*0.15} r="3" fill="#00ff88" opacity="0.35"><animate attributeName="cy" values={`${h*0.15};${h*0.1};${h*0.15}`} dur="3.5s" repeatCount="indefinite"/></circle>
      <circle cx={w*0.4} cy={h*0.1} r="2" fill="#ff00ff" opacity="0.4"><animate attributeName="cy" values={`${h*0.1};${h*0.06};${h*0.1}`} dur="2.8s" repeatCount="indefinite"/></circle>
      {/* Floor glow tiles */}
      <rect x={w*0.15} y={h*0.8} width={w*0.12} height={h*0.02} rx="1" fill="#ff00ff" opacity="0.12"><animate attributeName="opacity" values="0.12;0.3;0.12" dur="1.2s" repeatCount="indefinite"/></rect>
      <rect x={w*0.44} y={h*0.84} width={w*0.12} height={h*0.02} rx="1" fill="#00ffff" opacity="0.1"><animate attributeName="opacity" values="0.1;0.25;0.1" dur="1.6s" repeatCount="indefinite"/></rect>
      <rect x={w*0.72} y={h*0.78} width={w*0.12} height={h*0.02} rx="1" fill="#00ff88" opacity="0.1"><animate attributeName="opacity" values="0.1;0.25;0.1" dur="1.4s" repeatCount="indefinite"/></rect>
    </svg>
  );
  if (envId === "beach") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)"}}>
      {/* Warm sunset sky */}
      <rect width={w} height={h} fill="#e8c8a0"/>
      <rect width={w} height={h*0.35} fill="#d4e4f0" opacity="0.5"/>
      <rect y={h*0.15} width={w} height={h*0.2} fill="#f0d8b0" opacity="0.3"/>
      {/* Sun */}
      <circle cx={w*0.8} cy={h*0.12} r={w*0.05} fill="#f0c868" opacity="0.5"/>
      <circle cx={w*0.8} cy={h*0.12} r={w*0.08} fill="#f0c868" opacity="0.1"/>
      {/* Clouds */}
      <ellipse cx={w*0.25} cy={h*0.1} rx={w*0.07} ry={h*0.03} fill="white" opacity="0.4"/>
      <ellipse cx={w*0.55} cy={h*0.06} rx={w*0.06} ry={h*0.025} fill="white" opacity="0.35"/>
      {/* Ocean */}
      <rect y={h*0.35} width={w} height={h*0.28} fill="#6ab8d8"/>
      <rect y={h*0.35} width={w} height={h*0.12} fill="#7ac8e0" opacity="0.5"/>
      {/* Waves */}
      <path d={`M 0 ${h*0.42} Q ${w*0.12} ${h*0.4} ${w*0.25} ${h*0.42} Q ${w*0.38} ${h*0.44} ${w*0.5} ${h*0.42} Q ${w*0.62} ${h*0.4} ${w*0.75} ${h*0.42} Q ${w*0.88} ${h*0.44} ${w} ${h*0.42}`} stroke="white" strokeWidth="1.5" fill="none" opacity="0.2">
        <animate attributeName="d" values={`M 0 ${h*0.42} Q ${w*0.12} ${h*0.4} ${w*0.25} ${h*0.42} Q ${w*0.38} ${h*0.44} ${w*0.5} ${h*0.42} Q ${w*0.62} ${h*0.4} ${w*0.75} ${h*0.42} Q ${w*0.88} ${h*0.44} ${w} ${h*0.42};M 0 ${h*0.42} Q ${w*0.12} ${h*0.44} ${w*0.25} ${h*0.42} Q ${w*0.38} ${h*0.4} ${w*0.5} ${h*0.42} Q ${w*0.62} ${h*0.44} ${w*0.75} ${h*0.42} Q ${w*0.88} ${h*0.4} ${w} ${h*0.42};M 0 ${h*0.42} Q ${w*0.12} ${h*0.4} ${w*0.25} ${h*0.42} Q ${w*0.38} ${h*0.44} ${w*0.5} ${h*0.42} Q ${w*0.62} ${h*0.4} ${w*0.75} ${h*0.42} Q ${w*0.88} ${h*0.44} ${w} ${h*0.42}`} dur="4s" repeatCount="indefinite"/>
      </path>
      {/* Sand */}
      <path d={`M 0 ${h*0.63} Q ${w*0.25} ${h*0.6} ${w*0.5} ${h*0.63} Q ${w*0.75} ${h*0.66} ${w} ${h*0.63} L ${w} ${h} L 0 ${h} Z`} fill="#e8d4a8"/>
      <path d={`M 0 ${h*0.68} Q ${w*0.3} ${h*0.66} ${w*0.6} ${h*0.68} Q ${w*0.8} ${h*0.7} ${w} ${h*0.68} L ${w} ${h} L 0 ${h} Z`} fill="#e0c898"/>
      {/* Palm tree */}
      <path d={`M ${w*0.14} ${h*0.65} Q ${w*0.13} ${h*0.4} ${w*0.15} ${h*0.2}`} stroke="#8a6a4a" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d={`M ${w*0.15} ${h*0.2} Q ${w*0.25} ${h*0.14} ${w*0.33} ${h*0.22}`} stroke="#5a8a4a" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d={`M ${w*0.15} ${h*0.2} Q ${w*0.06} ${h*0.14} ${w*0.0} ${h*0.2}`} stroke="#5a8a4a" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      <path d={`M ${w*0.15} ${h*0.2} Q ${w*0.2} ${h*0.1} ${w*0.22} ${h*0.18}`} stroke="#6a9a5a" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d={`M ${w*0.15} ${h*0.2} Q ${w*0.1} ${h*0.12} ${w*0.08} ${h*0.16}`} stroke="#6a9a5a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Shells */}
      <ellipse cx={w*0.6} cy={h*0.74} rx="3" ry="2" fill="#d4b898" opacity="0.5"/>
      <ellipse cx={w*0.75} cy={h*0.7} rx="2.5" ry="1.5" fill="#c8a888" opacity="0.4"/>
      {/* Foam line */}
      <path d={`M 0 ${h*0.63} Q ${w*0.1} ${h*0.62} ${w*0.2} ${h*0.63} Q ${w*0.35} ${h*0.64} ${w*0.5} ${h*0.63} Q ${w*0.65} ${h*0.62} ${w*0.8} ${h*0.63} Q ${w*0.9} ${h*0.64} ${w} ${h*0.63}`} stroke="white" strokeWidth="2" fill="none" opacity="0.25"/>
    </svg>
  );
  // Forest (default)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)"}}>
      {/* Dappled sunlight sky */}
      <rect width={w} height={h} fill="#c8dca8"/>
      <rect width={w} height={h*0.3} fill="#d8e8c0" opacity="0.5"/>
      {/* Sunbeams through canopy */}
      <path d={`M ${w*0.3} 0 L ${w*0.35} ${h*0.6} L ${w*0.25} ${h*0.6} Z`} fill="rgba(255,240,180,0.1)"/>
      <path d={`M ${w*0.65} 0 L ${w*0.72} ${h*0.5} L ${w*0.62} ${h*0.5} Z`} fill="rgba(255,240,180,0.08)"/>
      {/* Ground layers */}
      <path d={`M 0 ${h*0.6} Q ${w*0.25} ${h*0.56} ${w*0.5} ${h*0.6} Q ${w*0.75} ${h*0.64} ${w} ${h*0.58} L ${w} ${h} L 0 ${h} Z`} fill="#6a8a4a"/>
      <path d={`M 0 ${h*0.68} Q ${w*0.3} ${h*0.65} ${w*0.6} ${h*0.68} Q ${w*0.85} ${h*0.7} ${w} ${h*0.66} L ${w} ${h} L 0 ${h} Z`} fill="#5a7a3a"/>
      {/* Back trees */}
      <rect x={w*0.04} y={h*0.1} width={w*0.02} height={h*0.55} fill="#6a5040"/>
      <polygon points={`${w*0.05},${h*0.1} ${w*0.12},${h*0.32} ${w*-0.02},${h*0.32}`} fill="#4a7a3a" opacity="0.8"/>
      <polygon points={`${w*0.05},${h*0.02} ${w*0.1},${h*0.18} ${w*0.0},${h*0.18}`} fill="#5a8a4a" opacity="0.7"/>
      <rect x={w*0.24} y={h*0.05} width={w*0.025} height={h*0.6} fill="#6a5040"/>
      <polygon points={`${w*0.25},${h*0.05} ${w*0.34},${h*0.28} ${w*0.16},${h*0.28}`} fill="#4a7a3a" opacity="0.8"/>
      <polygon points={`${w*0.25},${h*-0.04} ${w*0.31},${h*0.14} ${w*0.19},${h*0.14}`} fill="#5a8a4a" opacity="0.7"/>
      <rect x={w*0.72} y={h*0.08} width={w*0.025} height={h*0.56} fill="#6a5040"/>
      <polygon points={`${w*0.73},${h*0.08} ${w*0.82},${h*0.3} ${w*0.64},${h*0.3}`} fill="#4a7a3a" opacity="0.8"/>
      <polygon points={`${w*0.73},${h*0.0} ${w*0.79},${h*0.16} ${w*0.67},${h*0.16}`} fill="#5a8a4a" opacity="0.7"/>
      <rect x={w*0.92} y={h*0.12} width={w*0.02} height={h*0.5} fill="#6a5040"/>
      <polygon points={`${w*0.93},${h*0.12} ${w*1.0},${h*0.34} ${w*0.86},${h*0.34}`} fill="#4a7a3a" opacity="0.8"/>
      {/* Wildflowers */}
      <circle cx={w*0.15} cy={h*0.64} r="3" fill="#e86a8a" opacity="0.5"/><circle cx={w*0.18} cy={h*0.66} r="2.5" fill="#e8a84c" opacity="0.4"/>
      <circle cx={w*0.45} cy={h*0.62} r="2.5" fill="#b07ae8" opacity="0.45"/><circle cx={w*0.48} cy={h*0.64} r="2" fill="#e86a8a" opacity="0.4"/>
      <circle cx={w*0.8} cy={h*0.6} r="3" fill="#5bc9e8" opacity="0.35"/><circle cx={w*0.83} cy={h*0.62} r="2" fill="#e86a8a" opacity="0.4"/>
      {/* Mushrooms */}
      <rect x={w*0.55} y={h*0.65} width={w*0.008} height={h*0.04} fill="#8a7060"/>
      <ellipse cx={w*0.554} cy={h*0.65} rx={w*0.018} ry={h*0.018} fill="#c4785a" opacity="0.6"/>
      <circle cx={w*0.56} cy={h*0.648} r="1.5" fill="white" opacity="0.3"/>
      {/* Fireflies */}
      <circle cx={w*0.2} cy={h*0.35} r="2.5" fill="#e8d84c" opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.5s" repeatCount="indefinite"/></circle>
      <circle cx={w*0.55} cy={h*0.25} r="2" fill="#e8d84c" opacity="0.3"><animate attributeName="opacity" values="0.3;0.05;0.3" dur="3s" repeatCount="indefinite"/></circle>
      <circle cx={w*0.8} cy={h*0.4} r="2.5" fill="#e8d84c" opacity="0.35"><animate attributeName="opacity" values="0.35;0.08;0.35" dur="2.2s" repeatCount="indefinite"/></circle>
      {/* Soft mist */}
      <rect y={h*0.55} width={w} height={h*0.1} fill="white" opacity="0.04"/>
    </svg>
  );
}

// ═══ UI COMPONENTS ═══
function Tracker({label,value,max,unit,color,onChange,step,icon}){
  const pct=max>0?Math.min(value/max,1):0;
  const trackRef=useRef(null);
  const calcValue=(e)=>{
    const track=trackRef.current;if(!track)return;
    const rect=track.getBoundingClientRect();
    const touch=e.touches?e.touches[0]:e;
    const x=Math.max(0,Math.min(touch.clientX-rect.left,rect.width));
    const ratio=x/rect.width;
    let raw=ratio*max;
    raw=Math.round(raw/step)*step;
    raw=Math.max(0,Math.min(raw,max));
    onChange(raw);
  };
  const onStart=(e)=>{e.preventDefault();calcValue(e);
    const onMove=(ev)=>{ev.preventDefault();calcValue(ev);};
    const onEnd=()=>{document.removeEventListener("touchmove",onMove);document.removeEventListener("touchend",onEnd);document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onEnd);};
    document.addEventListener("touchmove",onMove,{passive:false});document.addEventListener("touchend",onEnd);document.addEventListener("mousemove",onMove);document.addEventListener("mouseup",onEnd);
  };
  return(<div style={{background:"rgba(90,74,62,0.04)",borderRadius:12,padding:"14px 16px",border:"1px solid rgba(90,74,62,0.08)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:15}}>{icon}</span><span style={{fontWeight:600,fontSize:13,color:"#3a2e24"}}>{label}</span></div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:13,color:pct>=1?color:"#9a8a7a",fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{value}{unit?` / ${max} ${unit}`:` / ${max}`}</span>
        {pct>=1&&<span style={{fontSize:10,fontWeight:700,color:"white",background:color,padding:"2px 6px",borderRadius:4}}>✓</span>}
      </div>
    </div>
    <div ref={trackRef} onTouchStart={onStart} onMouseDown={onStart} style={{position:"relative",height:36,display:"flex",alignItems:"center",cursor:"pointer",touchAction:"none"}}>
      <div style={{position:"absolute",left:0,right:0,height:6,background:"rgba(90,74,62,0.06)",borderRadius:3}}>
        <div style={{height:"100%",width:`${pct*100}%`,borderRadius:3,background:`linear-gradient(90deg, ${color}88, ${color})`,boxShadow:pct>0?`0 0 12px ${color}33`:"none"}}/>
      </div>
      <div style={{position:"absolute",left:`calc(${pct*100}% - 10px)`,width:20,height:20,borderRadius:"50%",background:color,boxShadow:`0 0 10px ${color}66, 0 2px 4px rgba(0,0,0,0.3)`,border:"2px solid rgba(255,255,255,0.7)",pointerEvents:"none"}}/>
    </div>
  </div>);
}

function TaskRow({chore,done,onToggle,onDelete,showInterval,onView,choreLog7,accent}){const dc={Easy:"#6ee7a0",Medium:"#e8a84c",Hard:"#e86a6a"};const isRec=chore.type==="recurring";return(<div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",borderRadius:10,background:done?"rgba(90,74,62,0.03)":"rgba(90,74,62,0.05)",border:`1px solid ${done?"rgba(106,200,122,0.2)":"rgba(90,74,62,0.08)"}`}}>
    <div onClick={onToggle} style={{width:20,height:20,borderRadius:5,flexShrink:0,border:done?`2px solid ${dc[chore.difficulty]}`:"2px solid rgba(90,74,62,0.15)",background:done?dc[chore.difficulty]:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginTop:2}}>{done&&<span style={{fontSize:11,color:"white",fontWeight:800}}>✓</span>}</div>
    <div style={{flex:1,minWidth:0,cursor:onView?"pointer":"default"}} onClick={onView||undefined}>
      <div style={{fontWeight:600,fontSize:13,color:done?"#b4a494":"#3a2e24",textDecoration:done?"line-through":"none"}}>{chore.name}</div>
      <div style={{fontSize:10.5,color:"#b4a494",marginTop:1}}>
        {showInterval&&(chore.type==="one-off"?"One-off":INTERVALS.find(i=>i.value===chore.interval)?.label)}
        {chore.type==="one-off"&&chore.completedDate&&<span style={{color:"rgba(110,231,160,0.5)"}}> · Done {chore.completedDate}</span>}
      </div>
      {isRec&&choreLog7&&<WeekDots choreId={chore.id} choreLog7={choreLog7} accent={accent||dc[chore.difficulty]}/>}
    </div>
    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2,flexShrink:0}}>
      <span style={{fontSize:9.5,fontWeight:700,color:dc[chore.difficulty],background:`${dc[chore.difficulty]}12`,padding:"2px 7px",borderRadius:4}}>{chore.difficulty.toUpperCase()}</span>
      <span style={{fontSize:11,fontWeight:700,color:"#b4a494"}}>+{DIFF_PTS[chore.difficulty]}</span>
    </div>
    {onDelete&&<button onClick={onDelete} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"#c4b4a4",padding:"2px 4px",marginTop:2}}>×</button>}
  </div>);}

function Modal({children,onClose}){
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:200,paddingTop:"env(safe-area-inset-top, 20px)"}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div style={{width:"100%",maxWidth:440,background:"#faf6f0",borderRadius:"0 0 20px 20px",padding:"20px 20px 24px",animation:"sd 0.3s cubic-bezier(.4,0,.2,1)",border:"1px solid rgba(90,74,62,0.1)",borderTop:"none",maxHeight:"80vh",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>{children}</div>
  </div>);
}

// ═══ WEEK DOTS — shows last 7 days completion for a recurring task ═══
function WeekDots({ choreId, choreLog7, accent }) {
  const days = ["M","T","W","T","F","S","S"];
  const today = new Date();
  const dots = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const done = choreLog7[key] && choreLog7[key][choreId];
    const isToday = i === 0;
    dots.push({ day: days[(d.getDay() + 6) % 7], done, isToday, key });
  }
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 6 }}>
      {dots.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.done ? accent : "rgba(90,74,62,0.1)", border: d.isToday ? `1.5px solid ${accent}88` : "1.5px solid transparent", transition: "all 0.2s" }} />
          <span style={{ fontSize: 7, color: d.isToday ? "#6b5c4d" : "#c4b4a4", fontWeight: d.isToday ? 700 : 400 }}>{d.day}</span>
        </div>
      ))}
    </div>
  );
}

// ═══ DRAGGABLE LIST — long press to pick up, drag to reorder ═══
function DraggableList({ items, renderItem, onReorder, keyExtractor }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const timerRef = useRef(null);
  const startYRef = useRef(0);
  const itemRefs = useRef([]);
  const isDragging = useRef(false);

  const handleTouchStart = (idx, e) => {
    startYRef.current = e.touches[0].clientY;
    isDragging.current = false;
    timerRef.current = setTimeout(() => {
      isDragging.current = true;
      setDragIdx(idx);
      setOverIdx(idx);
      if (navigator.vibrate) navigator.vibrate(30);
    }, 400);
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) {
      const dy = Math.abs(e.touches[0].clientY - startYRef.current);
      if (dy > 8) { clearTimeout(timerRef.current); return; }
    }
    if (!isDragging.current) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    let closest = dragIdx;
    let minDist = Infinity;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const dist = Math.abs(y - mid);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setOverIdx(closest);
  };

  const handleTouchEnd = () => {
    clearTimeout(timerRef.current);
    if (isDragging.current && dragIdx !== null && overIdx !== null && dragIdx !== overIdx) {
      const newItems = [...items];
      const [moved] = newItems.splice(dragIdx, 1);
      newItems.splice(overIdx, 0, moved);
      onReorder(newItems);
    }
    isDragging.current = false;
    setDragIdx(null);
    setOverIdx(null);
  };

  return (
    <div onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {items.map((item, i) => {
        const isDrag = dragIdx === i;
        const isOver = overIdx === i && dragIdx !== null && dragIdx !== i;
        return (
          <div key={keyExtractor(item)} ref={el => itemRefs.current[i] = el}
            style={{
              opacity: isDrag ? 0.5 : 1,
              transform: isOver ? `translateY(${dragIdx < i ? -4 : 4}px)` : "none",
              transition: isDrag ? "none" : "transform 0.15s ease, opacity 0.15s ease",
              borderLeft: isOver ? `2px solid rgba(90,74,62,0.2)` : "2px solid transparent",
              paddingLeft: isOver ? 2 : 0,
              WebkitUserSelect: "none", userSelect: "none",
              display: "flex", alignItems: "center", gap: 0,
            }}>
            <div onTouchStart={e => handleTouchStart(i, e)} style={{ padding: "8px 6px 8px 0", cursor: "grab", touchAction: "none", display: "flex", alignItems: "center", flexShrink: 0 }}>
              <svg width="12" height="16" viewBox="0 0 12 16" style={{ opacity: 0.25 }}><circle cx="3" cy="3" r="1.5" fill="#5a4a3e"/><circle cx="9" cy="3" r="1.5" fill="#5a4a3e"/><circle cx="3" cy="8" r="1.5" fill="#5a4a3e"/><circle cx="9" cy="8" r="1.5" fill="#5a4a3e"/><circle cx="3" cy="13" r="1.5" fill="#5a4a3e"/><circle cx="9" cy="13" r="1.5" fill="#5a4a3e"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>{renderItem(item, i)}</div>
          </div>
        );
      })}
    </div>
  );
}
function LoginScreen({ onSignIn, loading }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f0ea", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', -apple-system, sans-serif", padding: 32, paddingTop: "calc(env(safe-area-inset-top, 20px) + 32px)" }}>
      <div style={{ animation: "bfl 2.8s ease-in-out infinite", marginBottom: 24 }}>
        <BuddyFace mood="content" level={2} hat={false} buddyType="bird" size={120} />
      </div>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: "#3a2e24", letterSpacing: -1, marginBottom: 8 }}>MY BUDDY</h1>
      <p style={{ fontSize: 13, color: "#8a7a6a", marginBottom: 32, textAlign: "center", lineHeight: 1.5 }}>Track your habits, complete tasks,<br />and watch your Buddy grow.</p>
      <button onClick={onSignIn} disabled={loading} style={{
        padding: "14px 32px", borderRadius: 12, border: "none", cursor: loading ? "wait" : "pointer",
        background: loading ? "rgba(90,74,62,0.08)" : "#3a2e24", color: "#f5f0ea",
        fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 4px 20px rgba(58,46,36,0.15)", transition: "all 0.2s",
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>
    </div>
  );
}

// ═══ MAIN APP ═══
const IS_PREVIEW = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("preview");

export default function App() {
  const [user, setUser] = useState(IS_PREVIEW ? { uid: "preview", displayName: "Preview User" } : null);
  const [authLoading, setAuthLoading] = useState(!IS_PREVIEW);
  const [signInLoading, setSignInLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(IS_PREVIEW);

  const today = TODAY();
  const [goals, setGoals] = useState({ water: 100, sleep: 8, meals: 3 });
  const [log, setLog] = useState(IS_PREVIEW ? { water: 64, sleep: 6, meals: 2 } : { water: 0, sleep: 0, meals: 0 });
  const [chores, setChores] = useState(IS_PREVIEW ? [
    { id:"p1", name:"Make the bed", difficulty:"Easy", interval:"daily", type:"recurring", createdDate:today },
    { id:"p2", name:"Take out trash", difficulty:"Medium", interval:"weekly", type:"recurring", createdDate:today },
    { id:"p3", name:"Deep clean kitchen", difficulty:"Hard", interval:"biweekly", type:"recurring", createdDate:today },
    { id:"p4", name:"File taxes", difficulty:"Hard", type:"one-off", createdDate:today },
  ] : []);
  const [choreLog, setChoreLog] = useState(IS_PREVIEW ? { "p1": true } : {});
  const [choreLog7, setChoreLog7] = useState({});
  const [xp, setXp] = useState(IS_PREVIEW ? 1320 : 0);
  const [bdays, setBdays] = useState(IS_PREVIEW ? [
    { id:"b1", name:"Mom", date:`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`, notes:"Loves orchids" },
    { id:"b2", name:"Jake", date:"1992-04-15", notes:"Vinyl collector" },
  ] : []);
  const [wishes, setWishes] = useState({});
  const [activeBuddy, setActiveBuddy] = useState("bird");
  const [activeEnv, setActiveEnv] = useState("park");
  const [tab, setTab] = useState("home");
  const [modal, setModal] = useState(null);
  const [nc, setNc] = useState({ name: "", difficulty: "Easy", interval: "daily", type: "recurring" });
  const [nb, setNb] = useState({ name: "", date: "", notes: "" });
  const [popup, setPopup] = useState(null);
  const [settings, setSettings] = useState(false);
  const [bdFilter, setBdFilter] = useState("all");
  const [bdSearch, setBdSearch] = useState("");
  const [oneOffFilter, setOneOffFilter] = useState("upcoming");
  const [viewingBd, setViewingBd] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [viewingTask, setViewingTask] = useState(null);
  const [editTask, setEditTask] = useState(null);

  // Debounced save to Firebase (skipped in preview)
  const saveTimer = useRef(null);
  const save = useCallback((path, data) => {
    if (!user || IS_PREVIEW) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveData(user.uid, path, data), 300);
  }, [user]);

  // Auth listener (skipped in preview)
  useEffect(() => {
    if (IS_PREVIEW) return;
    const unsub = onAuthChange((u) => { setUser(u); setAuthLoading(false); });
    return unsub;
  }, []);

  // Load data from Firebase (skipped in preview)
  useEffect(() => {
    if (IS_PREVIEW) return;
    if (!user) { setDataLoaded(false); return; }
    (async () => {
      const [g, x, c, b, ab, ae] = await Promise.all([
        loadData(user.uid, "goals"), loadData(user.uid, "xp"),
        loadData(user.uid, "chores"), loadData(user.uid, "birthdays"),
        loadData(user.uid, "activeBuddy"), loadData(user.uid, "activeEnv"),
      ]);
      const dl = await loadData(user.uid, `dailyLog/${today}`);
      const cl = await loadData(user.uid, `choreLog/${today}`);
      const w = await loadData(user.uid, `wishes/${today}`);
      if (g) setGoals(g);
      if (typeof x === "number") setXp(x);
      if (c) setChores(Object.values(c));
      if (b) setBdays(Object.values(b));
      if (ab) setActiveBuddy(ab);
      if (ae) setActiveEnv(ae);
      if (dl) setLog(dl);
      if (cl) setChoreLog(cl);
      if (w) setWishes(w);
      const log7 = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dk = d.toISOString().slice(0, 10);
        if (dk === today && cl) { log7[dk] = cl; }
        else { const dayLog = await loadData(user.uid, `choreLog/${dk}`); if (dayLog) log7[dk] = dayLog; }
      }
      setChoreLog7(log7);
      setDataLoaded(true);
    })();
  }, [user, today]);

  // Save effects (skipped in preview)
  useEffect(() => { if (dataLoaded && !IS_PREVIEW) save("goals", goals); }, [goals, dataLoaded]);
  useEffect(() => { if (dataLoaded && !IS_PREVIEW) save(`dailyLog/${today}`, log); }, [log, dataLoaded]);
  useEffect(() => { if (dataLoaded && !IS_PREVIEW) { const obj = {}; chores.forEach(c => obj[c.id] = c); save("chores", obj); } }, [chores, dataLoaded]);
  useEffect(() => { if (dataLoaded && !IS_PREVIEW) save(`choreLog/${today}`, choreLog); }, [choreLog, dataLoaded]);
  useEffect(() => { if (dataLoaded) setChoreLog7(prev => ({ ...prev, [today]: choreLog })); }, [choreLog, dataLoaded, today]);
  useEffect(() => { if (dataLoaded && !IS_PREVIEW) save("xp", xp); }, [xp, dataLoaded]);
  useEffect(() => { if (dataLoaded && !IS_PREVIEW) { const obj = {}; bdays.forEach(b => obj[b.id] = b); save("birthdays", obj); } }, [bdays, dataLoaded]);
  useEffect(() => { if (dataLoaded && !IS_PREVIEW) save(`wishes/${today}`, wishes); }, [wishes, dataLoaded]);
  useEffect(() => { if (dataLoaded && !IS_PREVIEW) save("activeBuddy", activeBuddy); }, [activeBuddy, dataLoaded]);
  useEffect(() => { if (dataLoaded && !IS_PREVIEW) save("activeEnv", activeEnv); }, [activeEnv, dataLoaded]);

  const handleSignIn = async () => { setSignInLoading(true); await signInGoogle(); setSignInLoading(false); };

  // Auth gates (not in preview)
  if (authLoading) return <div style={{ minHeight: "100vh", background: "#f5f0ea", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a7a6a", fontFamily: "'Inter', sans-serif", fontSize: 13 }}>Loading...</div>;
  if (!user) return <LoginScreen onSignIn={handleSignIn} loading={signInLoading} />;
  if (!dataLoaded) return <div style={{ minHeight: "100vh", background: "#f5f0ea", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a7a6a", fontFamily: "'Inter', sans-serif", fontSize: 13 }}>Loading your data...</div>;

  // ═══ DAILY SESSION XP SYSTEM ═══
  // Tracker tier: 0-49% → 0 XP (sad), 50-99% → 5 XP (content), 100% → 10 XP (happy)
  const getTrackerTier = (val, goal) => {
    if (goal <= 0) return { xp: 10, mood: "happy" };
    const pct = val / goal;
    if (pct >= 1) return { xp: 10, mood: "happy" };
    if (pct >= 0.5) return { xp: 5, mood: "content" };
    return { xp: 0, mood: "sad" };
  };
  const trackerTiers = [
    getTrackerTier(log.water, goals.water),
    getTrackerTier(log.sleep, goals.sleep),
    getTrackerTier(log.meals, goals.meals),
  ];
  const trackerXP = trackerTiers.reduce((sum, t) => sum + t.xp, 0);

  // Mood: majority vote across trackers
  const moodCounts = { happy: 0, content: 0, sad: 0 };
  trackerTiers.forEach(t => moodCounts[t.mood]++);
  let mood;
  if (moodCounts.happy > moodCounts.content && moodCounts.happy > moodCounts.sad) mood = "happy";
  else if (moodCounts.sad > moodCounts.content && moodCounts.sad > moodCounts.happy) mood = "sad";
  else mood = "content";

  // Task lists
  const dailyChores = chores.filter(c => isDaily(c));
  const recurringChores = chores.filter(c => isRecurring(c));
  const oneOffChores = chores.filter(c => c.type === "one-off");
  const dueDailies = dailyChores.filter(c => isDueToday(c, today));
  const dueRecurring = recurringChores.filter(c => isDueToday(c, today));
  const dueOneOffs = oneOffChores.filter(c => isDueToday(c, today));

  // Filtered one-offs for Tasks tab
  const filteredOneOffs = (() => {
    const now = new Date();
    const daysAgo = (dateStr) => { const d = new Date(dateStr + "T00:00:00"); return Math.round((now - d) / 86400000); };
    switch (oneOffFilter) {
      case "upcoming": return oneOffChores.filter(c => !c.completedDate);
      case "week": return oneOffChores.filter(c => c.completedDate && daysAgo(c.completedDate) <= 7);
      case "month": return oneOffChores.filter(c => c.completedDate && daysAgo(c.completedDate) <= 30);
      case "all": default: return oneOffChores;
    }
  })();

  // Daily task XP: sum of completed daily/recurring tasks for today
  const dailyTaskXP = [...dueDailies, ...dueRecurring].reduce((sum, c) => {
    return sum + (choreLog[c.id] ? (DIFF_PTS[c.difficulty] || 10) : 0);
  }, 0);
  const dailyXP = trackerXP + dailyTaskXP;

  // Total XP = banked (past days + one-offs) + today's session
  const totalXP = xp + dailyXP;
  const li = getLvl(totalXP);
  const todayBd = getBdToday(bdays);
  const allWished = todayBd.length > 0 && todayBd.every(b => wishes[b.name]);
  const accent = (BUDDY_TYPES.find(b => b.id === activeBuddy) || BUDDY_TYPES[0]).accent;

  const flash = (pts, neg) => { setPopup((neg ? "-" : "+") + pts + " XP"); setTimeout(() => setPopup(null), 1200); };

  // Toggle chore
  const toggleChore = (id) => {
    const ch = chores.find(c => c.id === id); if (!ch) return;
    const was = choreLog[id];
    const pts = DIFF_PTS[ch.difficulty] || 10;
    if (ch.type === "one-off") {
      // One-off: permanently bank/unbank XP
      if (was) {
        setChoreLog(p => { const n = { ...p }; delete n[id]; return n; });
        setXp(p => Math.max(0, p - pts));
        setChores(prev => prev.map(c => c.id === id ? { ...c, completedDate: undefined } : c));
        flash(pts, true);
      } else {
        setChoreLog(p => ({ ...p, [id]: true }));
        setXp(p => p + pts);
        setChores(prev => prev.map(c => c.id === id ? { ...c, completedDate: today } : c));
        flash(pts, false);
      }
    } else {
      // Daily/recurring: toggle choreLog only, XP is derived
      if (was) {
        setChoreLog(p => { const n = { ...p }; delete n[id]; return n; });
        flash(pts, true);
      } else {
        setChoreLog(p => ({ ...p, [id]: true }));
        flash(pts, false);
      }
    }
  };

  // Core tracker: just set value, XP derived from tiers
  const updateCore = (key, nv) => { setLog(prev => ({ ...prev, [key]: nv })); };

  const toggleWish = (name) => { setWishes(p => { const n = { ...p }; if (n[name]) delete n[name]; else n[name] = true; return { ...n }; }); };
  const saveChore = () => { if (!nc.name.trim()) return; setChores(p => [...p, { ...nc, id: Date.now().toString(), createdDate: today }]); setNc({ name: "", difficulty: "Easy", interval: "daily", type: "recurring" }); setModal(null); };
  const saveTaskEdit = () => { if (!editTask || !editTask.name.trim()) return; setChores(p => p.map(c => c.id === editTask.id ? { ...c, name: editTask.name, difficulty: editTask.difficulty, interval: editTask.interval, type: editTask.type } : c)); setModal(null); setViewingTask(null); setEditTask(null); };
  const saveBd = () => { if (!nb.name.trim() || !nb.date) return; setBdays(p => [...p, { ...nb, id: Date.now().toString() }]); setNb({ name: "", date: "", notes: "" }); setModal(null); };
  const reorderChores = (type, newList) => {
    setChores(prev => {
      const others = prev.filter(c => {
        if (type === "daily") return !isDaily(c);
        if (type === "recurring") return !isRecurring(c);
        return c.type !== "one-off";
      });
      return [...others, ...newList];
    });
  };
  const filteredBdays = bdays.filter(b => { if (bdSearch && !b.name.toLowerCase().includes(bdSearch.toLowerCase())) return false; const d = daysUntil(b.date); if (bdFilter === "week") return d <= 7; if (bdFilter === "month") return d <= 30; return true; }).sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  const sortedTodayBd = [...todayBd].sort((a, b) => (wishes[a.name] ? 1 : 0) - (wishes[b.name] ? 1 : 0));
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const sL = (t) => <div style={{ fontSize: 10, fontWeight: 700, color: "#b4a494", marginBottom: 8, letterSpacing: 1.5, textTransform: "uppercase" }}>{t}</div>;
  const tBtn = (id, l, ico) => <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: tab === id ? `1px solid ${accent}44` : "1px solid rgba(90,74,62,0.1)", cursor: "pointer", fontWeight: 700, fontSize: 11, background: tab === id ? `${accent}18` : "rgba(90,74,62,0.04)", color: tab === id ? accent : "#6b5c4d", letterSpacing: 0.3, transition: "all 0.2s" }}>{ico} {l}</button>;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0ea", fontFamily: "'Inter', -apple-system, sans-serif", color: "#3a2e24", maxWidth: 480, margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes bb{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes bfl{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes bwob{0%,100%{transform:rotate(0)}25%{transform:rotate(-2deg)}75%{transform:rotate(2deg)}}
        @keyframes xpP{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-35px) scale(1.2)}}
        @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes su{from{opacity:0;transform:translateY(60px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sd{from{opacity:0;transform:translateY(-40px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;margin:0}input,select,button,textarea{font-family:'Inter',-apple-system,sans-serif}
        button:active{transform:scale(0.97)!important}
        ::-webkit-scrollbar{width:0}textarea{resize:vertical}
      `}</style>

      {/* Header */}
      <div style={{ paddingTop: "env(safe-area-inset-top, 20px)", background: "linear-gradient(180deg, rgba(90,74,62,0.04) 0%, transparent 100%)" }}>
        <div style={{ padding: "16px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}18`, border: `1px solid ${accent}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill={accent} opacity="0.6"/><circle cx="12" cy="12" r="4" fill={accent}/></svg>
            </div>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#3a2e24", letterSpacing: -0.5 }}>MY BUDDY</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#8a7a6a", letterSpacing: 0.8 }}>LV.{li.lv + 1} {li.name}</span>
                <span style={{ fontSize: 9, color: "#c4b4a4" }}>·</span>
                <span style={{ fontSize: 10, color: "#b4a494" }}>{BUDDY_TYPES.find(b => b.id === activeBuddy)?.name}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: `${accent}15`, borderRadius: 10, padding: "6px 14px", fontWeight: 700, fontSize: 12, color: accent, border: `1px solid ${accent}30` }}>{totalXP} XP</div>
            <button onClick={() => setSettings(!settings)} style={{ background: "rgba(90,74,62,0.06)", border: "1px solid rgba(90,74,62,0.1)", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 15, color: "#8a7a6a", display: "flex", alignItems: "center", justifyContent: "center" }}>⚙</button>
          </div>
        </div>

        {/* XP progress bar */}
        <div style={{ padding: "0 20px 4px" }}>
          <div style={{ height: 4, background: "rgba(90,74,62,0.06)", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${li.prog * 100}%`, background: `linear-gradient(90deg, ${accent}88, ${accent})`, borderRadius: 2, transition: "width 0.5s cubic-bezier(.4,0,.2,1)" }} /></div>
          <div style={{ fontSize: 9, color: "#b4a494", fontWeight: 600, marginTop: 3, textAlign: "right" }}>{li.need > 0 ? `${li.need} XP to next level` : "Max level"}</div>
          <div style={{ fontSize: 9, color: "#c4b4a4", marginTop: 1, textAlign: "right" }}>Today: +{dailyXP} XP ({trackerXP} trackers + {dailyTaskXP} tasks)</div>
        </div>

        {/* Tabs — right below header */}
        <div style={{ display: "flex", gap: 5, padding: "4px 20px 12px" }}>{tBtn("home", "Today", "◉")}{tBtn("tasks", "Tasks", "☰")}{tBtn("collection", "Buddies", "◈")}{tBtn("birthdays", "Birthdays", "♡")}</div>
        <div style={{ height: 1, background: "rgba(90,74,62,0.04)", margin: "0 20px" }} />
      </div>

      {settings && (
        <div style={{ margin: "4px 20px 8px", padding: 14, background: "rgba(90,74,62,0.03)", borderRadius: 12, border: "1px solid rgba(90,74,62,0.08)", animation: "fi 0.2s ease" }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: "#9a8a7a", marginBottom: 10, letterSpacing: 0.5 }}>DAILY GOALS</div>
          {[{ k: "water", l: "Water (oz)", i: "💧" }, { k: "sleep", l: "Sleep (hrs)", i: "🌙" }, { k: "meals", l: "Meals", i: "🥗" }].map(g => (
            <div key={g.k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#8a7a6a", width: 100 }}>{g.i} {g.l}</span>
              <input type="number" value={goals[g.k]} onChange={e => setGoals(p => ({ ...p, [g.k]: Math.max(0, Number(e.target.value)) }))} style={{ width: 60, padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(90,74,62,0.12)", background: "rgba(90,74,62,0.04)", fontSize: 13, fontWeight: 700, color: "#3a2e24", textAlign: "center", outline: "none" }} />
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 10, color: "#c4b4a4" }}>Easy=10 · Med=25 · Hard=50 · Core 100%=+10 each</div>
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(90,74,62,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#8a7a6a" }}>Signed in as {user.displayName || user.email}</span>
              <button onClick={signOutUser} style={{ fontSize: 10, fontWeight: 700, border: "1px solid rgba(232,106,106,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", background: "transparent", color: "#e86a6a" }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {sortedTodayBd.length > 0 && (
        <div style={{ margin: "4px 20px 6px", padding: "10px 14px", borderRadius: 10, background: `${accent}08`, border: `1px solid ${accent}18`, animation: "fi 0.4s ease" }}>
          <div style={{ fontWeight: 700, fontSize: 10, color: accent, marginBottom: 6, letterSpacing: 1 }}>🎂 BIRTHDAY TODAY</div>
          {sortedTodayBd.map(b => (<div key={b.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3, opacity: wishes[b.name] ? 0.5 : 1 }}><span style={{ fontSize: 12.5, fontWeight: 600 }}>{b.name}</span><button onClick={() => toggleWish(b.name)} style={{ fontSize: 10.5, fontWeight: 700, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", background: wishes[b.name] ? "rgba(90,74,62,0.08)" : accent, color: wishes[b.name] ? "#8a7a6a" : "white" }}>{wishes[b.name] ? "↩ Undo" : "Wish HBD"}</button></div>))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", padding: "0", position: "relative", margin: "0 20px 6px", borderRadius: 16, overflow: "hidden", height: 220, background: "#f5f0ea" }}>
        <EnvironmentBg envId={activeEnv} width={440} height={220} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 6 }}>
          <BuddyFace mood={mood} level={li.lv} hat={allWished} buddyType={activeBuddy} size={130} />
        </div>
        {popup && <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 2, fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: popup.startsWith("-") ? "#e86a6a" : accent, textShadow: `0 0 12px ${popup.startsWith("-") ? "rgba(232,106,106,0.4)" : accent + "44"}`, animation: "xpP 1.2s ease forwards", pointerEvents: "none" }}>{popup}</div>}
        <div style={{ position: "absolute", bottom: 6, zIndex: 1, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: mood === "happy" ? accent : mood === "content" ? "rgba(255,255,255,0.6)" : "rgba(232,106,106,0.7)", textShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>{mood === "happy" ? "Happy" : mood === "content" ? "Content" : "Needs care"}</div>
      </div>




      {tab === "home" && (<div style={{ padding: "0 20px 80px", animation: "fi 0.25s ease" }}>{sL("Core Trackers")}<div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}><Tracker label="Hydration" value={log.water} max={goals.water} unit="oz" color="#5baed6" icon="💧" step={1} onChange={v => updateCore("water", v)} /><Tracker label="Sleep" value={log.sleep} max={goals.sleep} unit="hrs" color="#9c7cb8" icon="🌙" step={0.5} onChange={v => updateCore("sleep", v)} /><Tracker label="Healthy Meals" value={log.meals} max={goals.meals} unit="" color="#6ee7a0" icon="🥗" step={1} onChange={v => updateCore("meals", v)} /></div>{dueDailies.length>0&&<>{sL("Daily Tasks")}<div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16}}>{dueDailies.map(c=><TaskRow key={c.id} chore={c} done={!!choreLog[c.id]} onToggle={()=>toggleChore(c.id)} choreLog7={choreLog7} accent={accent} showInterval={false}/>)}</div></>}{dueRecurring.length>0&&<>{sL("Recurring — Due Today")}<div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16}}>{dueRecurring.map(c=><TaskRow key={c.id} chore={c} done={!!choreLog[c.id]} onToggle={()=>toggleChore(c.id)} choreLog7={choreLog7} accent={accent} showInterval/>)}</div></>}{dueOneOffs.length>0&&<>{sL("One-off Tasks")}<div style={{display:"flex",flexDirection:"column",gap:5}}>{dueOneOffs.map(c=><TaskRow key={c.id} chore={c} done={!!choreLog[c.id]} onToggle={()=>toggleChore(c.id)} showInterval={false}/>)}</div></>}{dueDailies.length===0&&dueRecurring.length===0&&dueOneOffs.length===0&&<div style={{textAlign:"center",padding:28,color:"#c4b4a4",fontSize:12}}>No tasks due today</div>}</div>)}

      {tab === "tasks" && (<div style={{ padding: "0 20px 80px", animation: "fi 0.25s ease" }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <span style={{fontWeight:700,fontSize:14,color:"#3a2e24"}}>Task Manager</span>
          <button onClick={()=>{setNc({name:"",difficulty:"Easy",interval:"daily",type:"recurring"});setModal("chore")}} style={{fontWeight:700,fontSize:11,border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",background:accent,color:"white"}}>+ New Task</button>
        </div>
        <div style={{fontSize:10,color:"#c4b4a4",marginBottom:12}}>Long-press and drag to reorder tasks</div>
        {sL("Daily")}
        {dailyChores.length>0 ? <DraggableList items={dailyChores} keyExtractor={c=>c.id} onReorder={nl=>reorderChores("daily",nl)} renderItem={(c)=><TaskRow chore={c} done={!!choreLog[c.id]} onToggle={()=>toggleChore(c.id)} onDelete={()=>setChores(p=>p.filter(x=>x.id!==c.id))} onView={()=>{setViewingTask(c);setEditTask({...c});setModal("editTask")}} choreLog7={choreLog7} accent={accent} showInterval={false}/>} /> : <div style={{fontSize:11,color:"#c4b4a4",textAlign:"center",padding:12}}>No daily tasks</div>}
        <div style={{marginBottom:16}}/>
        {sL("Recurring")}
        {recurringChores.length>0 ? <DraggableList items={recurringChores} keyExtractor={c=>c.id} onReorder={nl=>reorderChores("recurring",nl)} renderItem={(c)=><TaskRow chore={c} done={!!choreLog[c.id]} onToggle={()=>toggleChore(c.id)} onDelete={()=>setChores(p=>p.filter(x=>x.id!==c.id))} onView={()=>{setViewingTask(c);setEditTask({...c});setModal("editTask")}} choreLog7={choreLog7} accent={accent} showInterval/>} /> : <div style={{fontSize:11,color:"#c4b4a4",textAlign:"center",padding:12}}>No recurring tasks</div>}
        <div style={{marginBottom:16}}/>
        {sL("One-off")}
        <div style={{display:"flex",gap:4,marginBottom:10}}>
          {[{v:"upcoming",l:"Upcoming"},{v:"week",l:"Last 7 Days"},{v:"month",l:"Last 30 Days"},{v:"all",l:"All"}].map(f=>(
            <button key={f.v} onClick={()=>setOneOffFilter(f.v)} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${oneOffFilter===f.v?accent+"44":"rgba(90,74,62,0.08)"}`,cursor:"pointer",fontWeight:600,fontSize:10,background:oneOffFilter===f.v?`${accent}12`:"transparent",color:oneOffFilter===f.v?accent:"#8a7a6a"}}>{f.l}</button>
          ))}
        </div>
        {filteredOneOffs.length>0 ? <DraggableList items={filteredOneOffs} keyExtractor={c=>c.id} onReorder={nl=>reorderChores("one-off",nl)} renderItem={(c)=><TaskRow chore={c} done={!!choreLog[c.id]||!!c.completedDate} onToggle={()=>toggleChore(c.id)} onDelete={()=>setChores(p=>p.filter(x=>x.id!==c.id))} onView={()=>{setViewingTask(c);setEditTask({...c});setModal("editTask")}} showInterval={false}/>} /> : <div style={{fontSize:11,color:"#c4b4a4",textAlign:"center",padding:12}}>{oneOffFilter==="upcoming"?"No upcoming tasks":"No completed tasks in this range"}</div>}
      </div>)}

      {tab === "collection" && (<div style={{ padding: "0 20px 80px", animation: "fi 0.25s ease" }}>{sL("Choose Your Buddy")}<p style={{fontSize:11,color:"#b4a494",marginBottom:14,lineHeight:1.5}}>Each buddy evolves through 5 stages as you level up.</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:24}}>{BUDDY_TYPES.map(bt=>{const active=activeBuddy===bt.id;return(<div key={bt.id} onClick={()=>setActiveBuddy(bt.id)} style={{padding:"14px 10px 12px",borderRadius:12,cursor:"pointer",background:active?`${bt.accent}0c`:"rgba(90,74,62,0.03)",border:`1.5px solid ${active?bt.accent+"44":"rgba(90,74,62,0.08)"}`}}><div style={{display:"flex",justifyContent:"center",marginBottom:8}}><BuddyFace mood="happy" level={4} hat={false} buddyType={bt.id} size={80}/></div><div style={{textAlign:"center"}}><div style={{fontWeight:700,fontSize:13,color:active?bt.accent:"#3a2e24"}}>{bt.name}</div><div style={{fontSize:10,color:"#b4a494",marginTop:2}}>{bt.desc}</div>{active&&<div style={{fontSize:9,fontWeight:700,color:bt.accent,marginTop:4,letterSpacing:1}}>ACTIVE</div>}</div></div>)})}</div>

        {sL("Environment")}
        <p style={{fontSize:11,color:"#b4a494",marginBottom:14,lineHeight:1.5}}>Pick a scene for your buddy to hang out in.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
          {ENVIRONMENTS.map(env => {
            const active = activeEnv === env.id;
            return (
              <div key={env.id} onClick={() => setActiveEnv(env.id)} style={{
                padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                background: active ? `${accent}10` : "rgba(90,74,62,0.03)",
                border: `1.5px solid ${active ? accent + "44" : "rgba(90,74,62,0.08)"}`,
                transition: "all 0.2s",
              }}>
                <div style={{ position: "relative", width: "100%", height: 50, borderRadius: 6, overflow: "hidden", marginBottom: 6 }}>
                  <EnvironmentBg envId={env.id} width={120} height={50} />
                </div>
                <div style={{ fontSize: 14, marginBottom: 2 }}>{env.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 10.5, color: active ? accent : "#6b5c4d" }}>{env.name}</div>
                {active && <div style={{ fontSize: 8, fontWeight: 700, color: accent, marginTop: 2, letterSpacing: 1 }}>ACTIVE</div>}
              </div>
            );
          })}
        </div>
      </div>)}

      {tab === "birthdays" && (<div style={{ padding: "0 20px 80px", animation: "fi 0.25s ease" }}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{fontWeight:700,fontSize:14,color:"#3a2e24"}}>Birthdays</span><button onClick={()=>{setNb({name:"",date:"",notes:""});setModal("birthday")}} style={{fontWeight:700,fontSize:11,border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",background:"#e86a8a",color:"#3a2e24"}}>+ Add</button></div><input placeholder="Search names..." value={bdSearch} onChange={e=>setBdSearch(e.target.value)} style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid rgba(90,74,62,0.1)",background:"rgba(90,74,62,0.04)",fontSize:12.5,color:"#3a2e24",marginBottom:10,outline:"none"}}/><div style={{display:"flex",gap:4,marginBottom:14}}>{[{v:"all",l:"All"},{v:"week",l:"This Week"},{v:"month",l:"Next 30 Days"}].map(f=>(<button key={f.v} onClick={()=>setBdFilter(f.v)} style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${bdFilter===f.v?accent+"44":"rgba(90,74,62,0.08)"}`,cursor:"pointer",fontWeight:600,fontSize:11,background:bdFilter===f.v?`${accent}12`:"transparent",color:bdFilter===f.v?accent:"#8a7a6a"}}>{f.l}</button>))}</div><div style={{display:"flex",flexDirection:"column",gap:5}}>{filteredBdays.map(b=>{const bd=new Date(b.date+"T00:00:00"),d=daysUntil(b.date),isTd=d===0;return(<div key={b.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:isTd?`${accent}08`:"rgba(90,74,62,0.03)",border:`1px solid ${isTd?accent+"20":"rgba(90,74,62,0.06)"}`,cursor:"pointer"}} onClick={()=>{setViewingBd(b);setEditNotes(b.notes||"");setModal("viewBd")}}><div style={{width:34,height:34,borderRadius:8,background:isTd?`${accent}20`:"rgba(90,74,62,0.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>🎂</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:13}}>{b.name}</div><div style={{fontSize:10.5,color:"#b4a494"}}>{months[bd.getMonth()]} {bd.getDate()}{b.notes?" · 📝":""}</div></div><div style={{textAlign:"right",flexShrink:0}}>{isTd?<button onClick={e=>{e.stopPropagation();toggleWish(b.name)}} style={{fontSize:10,fontWeight:700,border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",background:wishes[b.name]?"rgba(90,74,62,0.08)":accent,color:wishes[b.name]?"#8a7a6a":"white"}}>{wishes[b.name]?"↩ Undo":"Wish"}</button>:<span style={{fontSize:10.5,color:"#c4b4a4",fontWeight:600}}>{d===1?"Tomorrow":`${d}d`}</span>}</div></div>)})}{filteredBdays.length===0&&<div style={{textAlign:"center",padding:24,color:"#c4b4a4",fontSize:12}}>{bdSearch?"No matches":"No birthdays saved"}</div>}</div><div style={{textAlign:"center",marginTop:12,fontSize:10,color:"#c4b4a4"}}>{bdays.length} total</div></div>)}

      {/* Modals */}
      {modal === "chore" && (<Modal onClose={() => setModal(null)}><div style={{fontFamily:"'Space Grotesk'",fontSize:16,fontWeight:700,color:"#3a2e24",marginBottom:16}}>New Task</div><input placeholder="Task name..." value={nc.name} onChange={e=>setNc(p=>({...p,name:e.target.value}))} autoFocus style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(90,74,62,0.12)",background:"rgba(90,74,62,0.04)",fontSize:13,fontWeight:600,color:"#3a2e24",marginBottom:12,outline:"none"}}/><div style={{display:"flex",gap:4,marginBottom:12}}>{[{t:"recurring",l:"♻ Recurring"},{t:"one-off",l:"◎ One-off"}].map(x=>(<button key={x.t} onClick={()=>setNc(p=>({...p,type:x.t}))} style={{flex:1,padding:"8px 0",borderRadius:8,border:`1px solid ${nc.type===x.t?"rgba(90,74,62,0.2)":"rgba(90,74,62,0.08)"}`,cursor:"pointer",fontWeight:700,fontSize:11.5,background:nc.type===x.t?"rgba(90,74,62,0.08)":"transparent",color:nc.type===x.t?"#3a2e24":"#8a7a6a"}}>{x.l}</button>))}</div>{nc.type==="recurring"&&<div style={{marginBottom:12}}><div style={{fontSize:10,fontWeight:700,color:"#b4a494",marginBottom:6,letterSpacing:1}}>FREQUENCY</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{INTERVALS.map(i=><button key={i.value} onClick={()=>setNc(p=>({...p,interval:i.value}))} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${nc.interval===i.value?accent+"44":"rgba(90,74,62,0.08)"}`,cursor:"pointer",fontWeight:600,fontSize:11,background:nc.interval===i.value?`${accent}15`:"transparent",color:nc.interval===i.value?accent:"#8a7a6a"}}>{i.label}</button>)}</div></div>}<div style={{marginBottom:16}}><div style={{fontSize:10,fontWeight:700,color:"#b4a494",marginBottom:6,letterSpacing:1}}>DIFFICULTY</div><div style={{display:"flex",gap:6}}>{[{d:"Easy",c:"#6ee7a0"},{d:"Medium",c:"#e8a84c"},{d:"Hard",c:"#e86a6a"}].map(x=><button key={x.d} onClick={()=>setNc(p=>({...p,difficulty:x.d}))} style={{flex:1,padding:"10px 0",borderRadius:8,border:`1.5px solid ${nc.difficulty===x.d?x.c+"66":"rgba(90,74,62,0.08)"}`,cursor:"pointer",fontWeight:700,fontSize:12,background:nc.difficulty===x.d?`${x.c}12`:"transparent",color:x.c}}>{x.d}<div style={{fontSize:9,fontWeight:600,marginTop:2,opacity:0.5}}>+{DIFF_PTS[x.d]} XP</div></button>)}</div></div><div style={{display:"flex",gap:8}}><button onClick={()=>setModal(null)} style={{flex:1,padding:"11px 0",borderRadius:10,border:"1px solid rgba(90,74,62,0.1)",background:"transparent",cursor:"pointer",fontWeight:700,fontSize:12,color:"#8a7a6a"}}>Cancel</button><button onClick={saveChore} style={{flex:2,padding:"11px 0",borderRadius:10,border:"none",background:accent,cursor:"pointer",fontWeight:700,fontSize:12,color:"white"}}>Add Task</button></div></Modal>)}

      {modal === "birthday" && (<Modal onClose={() => setModal(null)}><div style={{fontFamily:"'Space Grotesk'",fontSize:16,fontWeight:700,color:"#3a2e24",marginBottom:16}}>Add Birthday</div><input placeholder="Name..." value={nb.name} onChange={e=>setNb(p=>({...p,name:e.target.value}))} autoFocus style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(90,74,62,0.12)",background:"rgba(90,74,62,0.04)",fontSize:13,fontWeight:600,color:"#3a2e24",marginBottom:10,outline:"none"}}/><input type="date" value={nb.date} onChange={e=>setNb(p=>({...p,date:e.target.value}))} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(90,74,62,0.12)",background:"rgba(90,74,62,0.04)",fontSize:13,fontWeight:600,color:"#3a2e24",marginBottom:10,outline:"none",colorScheme:"light"}}/><textarea placeholder="Notes (gift ideas, interests...)..." value={nb.notes} onChange={e=>setNb(p=>({...p,notes:e.target.value}))} rows={3} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(90,74,62,0.12)",background:"rgba(90,74,62,0.04)",fontSize:12.5,color:"#3a2e24",marginBottom:16,outline:"none",lineHeight:1.5}}/><div style={{display:"flex",gap:8}}><button onClick={()=>setModal(null)} style={{flex:1,padding:"11px 0",borderRadius:10,border:"1px solid rgba(90,74,62,0.1)",background:"transparent",cursor:"pointer",fontWeight:700,fontSize:12,color:"#8a7a6a"}}>Cancel</button><button onClick={saveBd} style={{flex:2,padding:"11px 0",borderRadius:10,border:"none",background:"#e86a8a",cursor:"pointer",fontWeight:700,fontSize:12,color:"#3a2e24"}}>Save</button></div></Modal>)}

      {modal === "viewBd" && viewingBd && (<Modal onClose={() => {setModal(null);setViewingBd(null)}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}><div><div style={{fontFamily:"'Space Grotesk'",fontSize:18,fontWeight:700,color:"#3a2e24"}}>{viewingBd.name}</div><div style={{fontSize:12,color:"#8a7a6a",marginTop:2}}>{months[new Date(viewingBd.date+"T00:00:00").getMonth()]} {new Date(viewingBd.date+"T00:00:00").getDate()} · {daysUntil(viewingBd.date)===0?"Today!":`${daysUntil(viewingBd.date)}d away`}</div></div><button onClick={()=>{setBdays(p=>p.filter(x=>x.id!==viewingBd.id));setModal(null);setViewingBd(null)}} style={{fontSize:10,fontWeight:700,border:"1px solid rgba(232,106,106,0.3)",borderRadius:6,padding:"4px 10px",cursor:"pointer",background:"transparent",color:"#e86a6a"}}>Delete</button></div><div style={{fontSize:10,fontWeight:700,color:"#b4a494",marginBottom:6,letterSpacing:1}}>NOTES</div><textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)} rows={5} placeholder="Gift ideas, relationship notes..." style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(90,74,62,0.12)",background:"rgba(90,74,62,0.04)",fontSize:12.5,color:"#3a2e24",outline:"none",lineHeight:1.6,marginBottom:14}}/><div style={{display:"flex",gap:8}}><button onClick={()=>{setModal(null);setViewingBd(null)}} style={{flex:1,padding:"11px 0",borderRadius:10,border:"1px solid rgba(90,74,62,0.1)",background:"transparent",cursor:"pointer",fontWeight:700,fontSize:12,color:"#8a7a6a"}}>Close</button><button onClick={()=>{setBdays(p=>p.map(b=>b.id===viewingBd.id?{...b,notes:editNotes}:b));setModal(null);setViewingBd(null)}} style={{flex:2,padding:"11px 0",borderRadius:10,border:"none",background:accent,cursor:"pointer",fontWeight:700,fontSize:12,color:"white"}}>Save Notes</button></div></Modal>)}

      {modal === "editTask" && editTask && (<Modal onClose={() => {setModal(null);setViewingTask(null);setEditTask(null)}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div style={{fontFamily:"'Space Grotesk'",fontSize:16,fontWeight:700,color:"#3a2e24"}}>Edit Task</div>
          <button onClick={()=>{setChores(p=>p.filter(x=>x.id!==editTask.id));setModal(null);setViewingTask(null);setEditTask(null)}} style={{fontSize:10,fontWeight:700,border:"1px solid rgba(232,106,106,0.3)",borderRadius:6,padding:"4px 10px",cursor:"pointer",background:"transparent",color:"#e86a6a"}}>Delete</button>
        </div>
        <div style={{fontSize:10,fontWeight:700,color:"#b4a494",marginBottom:6,letterSpacing:1}}>TASK NAME</div>
        <input value={editTask.name} onChange={e=>setEditTask(p=>({...p,name:e.target.value}))} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(90,74,62,0.12)",background:"rgba(90,74,62,0.04)",fontSize:13,fontWeight:600,color:"#3a2e24",marginBottom:12,outline:"none"}}/>
        <div style={{fontSize:10,fontWeight:700,color:"#b4a494",marginBottom:6,letterSpacing:1}}>TYPE</div>
        <div style={{display:"flex",gap:4,marginBottom:12}}>
          {[{t:"recurring",l:"♻ Recurring"},{t:"one-off",l:"◎ One-off"}].map(x=>(
            <button key={x.t} onClick={()=>setEditTask(p=>({...p,type:x.t}))} style={{flex:1,padding:"8px 0",borderRadius:8,border:`1px solid ${editTask.type===x.t?"rgba(90,74,62,0.2)":"rgba(90,74,62,0.08)"}`,cursor:"pointer",fontWeight:700,fontSize:11.5,background:editTask.type===x.t?"rgba(90,74,62,0.08)":"transparent",color:editTask.type===x.t?"#3a2e24":"#8a7a6a"}}>{x.l}</button>
          ))}
        </div>
        {editTask.type==="recurring"&&<div style={{marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:"#b4a494",marginBottom:6,letterSpacing:1}}>FREQUENCY</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {INTERVALS.map(i=><button key={i.value} onClick={()=>setEditTask(p=>({...p,interval:i.value}))} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${editTask.interval===i.value?accent+"44":"rgba(90,74,62,0.08)"}`,cursor:"pointer",fontWeight:600,fontSize:11,background:editTask.interval===i.value?`${accent}15`:"transparent",color:editTask.interval===i.value?accent:"#8a7a6a"}}>{i.label}</button>)}
          </div>
        </div>}
        <div style={{fontSize:10,fontWeight:700,color:"#b4a494",marginBottom:6,letterSpacing:1}}>DIFFICULTY</div>
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[{d:"Easy",c:"#6ee7a0"},{d:"Medium",c:"#e8a84c"},{d:"Hard",c:"#e86a6a"}].map(x=>(
            <button key={x.d} onClick={()=>setEditTask(p=>({...p,difficulty:x.d}))} style={{flex:1,padding:"10px 0",borderRadius:8,border:`1.5px solid ${editTask.difficulty===x.d?x.c+"66":"rgba(90,74,62,0.08)"}`,cursor:"pointer",fontWeight:700,fontSize:12,background:editTask.difficulty===x.d?`${x.c}12`:"transparent",color:x.c}}>{x.d}<div style={{fontSize:9,fontWeight:600,marginTop:2,opacity:0.5}}>+{DIFF_PTS[x.d]} XP</div></button>
          ))}
        </div>
        {editTask.type==="one-off"&&editTask.completedDate&&<div style={{fontSize:11,color:"#b4a494",marginBottom:12}}>Completed: {editTask.completedDate}</div>}
        <div style={{fontSize:10,color:"#c4b4a4",marginBottom:14}}>Created: {editTask.createdDate}</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setModal(null);setViewingTask(null);setEditTask(null)}} style={{flex:1,padding:"11px 0",borderRadius:10,border:"1px solid rgba(90,74,62,0.1)",background:"transparent",cursor:"pointer",fontWeight:700,fontSize:12,color:"#8a7a6a"}}>Cancel</button>
          <button onClick={saveTaskEdit} style={{flex:2,padding:"11px 0",borderRadius:10,border:"none",background:accent,cursor:"pointer",fontWeight:700,fontSize:12,color:"white"}}>Save Changes</button>
        </div>
      </Modal>)}
    </div>
  );
}