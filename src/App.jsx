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

// ═══ BUDDY AVATARS ═══
function EggStage({ size, accent }) {
  return (<svg width={size} height={size} viewBox="0 0 200 200"><defs><radialGradient id="eggG" cx="45%" cy="38%"><stop offset="0%" stopColor="rgba(255,255,255,0.15)" /><stop offset="100%" stopColor="rgba(255,255,255,0.03)" /></radialGradient><filter id="eggSh"><feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.25" /></filter></defs><ellipse cx="100" cy="184" rx="30" ry="5" fill="rgba(0,0,0,0.12)" /><ellipse cx="100" cy="120" rx="40" ry="52" fill={accent} filter="url(#eggSh)" /><ellipse cx="100" cy="120" rx="40" ry="52" fill="url(#eggG)" /><path d="M 75 110 L 82 100 L 78 90 L 88 85" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" strokeLinecap="round" /><ellipse cx="100" cy="120" rx="40" ry="52" fill="none" stroke={accent} strokeWidth="1.5" opacity="0.3"><animate attributeName="rx" values="40;43;40" dur="2.5s" repeatCount="indefinite" /><animate attributeName="ry" values="52;55;52" dur="2.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.3;0.1;0.3" dur="2.5s" repeatCount="indefinite" /></ellipse></svg>);
}

function BirdL1({ size, accent, mood }) {
  return (<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="bs1"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.2" /></filter></defs><ellipse cx="100" cy="184" rx="28" ry="5" fill="rgba(0,0,0,0.1)" /><ellipse cx="100" cy="125" rx="38" ry="40" fill={accent} filter="url(#bs1)" /><ellipse cx="100" cy="135" rx="26" ry="24" fill="rgba(255,255,255,0.1)" /><ellipse cx="66" cy="120" rx="8" ry="14" fill={accent} opacity="0.6" transform="rotate(12,66,120)" /><ellipse cx="134" cy="120" rx="8" ry="14" fill={accent} opacity="0.6" transform="rotate(-12,134,120)" />{mood==="happy"?<><path d="M 86 112 Q 90 104 94 112" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 106 112 Q 110 104 114 112" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><ellipse cx="90" cy="110" rx="6" ry="7" fill="white" opacity="0.85"/><ellipse cx="110" cy="110" rx="6" ry="7" fill="white" opacity="0.85"/><ellipse cx="91" cy="108" rx="2.5" ry="3" fill="#2d2d2d" opacity="0.7"/><ellipse cx="111" cy="108" rx="2.5" ry="3" fill="#2d2d2d" opacity="0.7"/></>}<polygon points="100,118 95,114 105,114" fill="#e8a84c" />{mood==="happy"&&<path d="M 94 124 Q 100 130 106 124" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7"/>}{mood==="sad"&&<path d="M 95 126 Q 100 122 105 126" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5"/>}<line x1="90" y1="163" x2="88" y2="174" stroke="#e8a84c" strokeWidth="2.5" strokeLinecap="round"/><line x1="110" y1="163" x2="112" y2="174" stroke="#e8a84c" strokeWidth="2.5" strokeLinecap="round"/></svg>);
}

function BirdL2({ size, accent, mood }) {
  return (<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="bs2"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.22"/></filter></defs><ellipse cx="100" cy="184" rx="32" ry="5" fill="rgba(0,0,0,0.12)"/><ellipse cx="100" cy="118" rx="46" ry="50" fill={accent} filter="url(#bs2)"/><ellipse cx="100" cy="132" rx="30" ry="30" fill="rgba(255,255,255,0.1)"/><ellipse cx="58" cy="112" rx="14" ry="24" fill={accent} opacity="0.7" transform="rotate(12,58,112)">{mood==="happy"&&<animateTransform attributeName="transform" type="rotate" values="12,58,112;-5,58,112;12,58,112" dur="0.7s" repeatCount="indefinite"/>}</ellipse><ellipse cx="142" cy="112" rx="14" ry="24" fill={accent} opacity="0.7" transform="rotate(-12,142,112)">{mood==="happy"&&<animateTransform attributeName="transform" type="rotate" values="-12,142,112;5,142,112;-12,142,112" dur="0.7s" repeatCount="indefinite"/>}</ellipse><path d="M 96 70 Q 94 56 100 60 Q 106 56 104 70" fill={accent} opacity="0.8"/>{mood==="happy"?<><path d="M 82 98 Q 87 90 92 98" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 108 98 Q 113 90 118 98" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><ellipse cx="87" cy="96" rx="5.5" ry="6.5" fill="white" opacity="0.85"/><ellipse cx="113" cy="96" rx="5.5" ry="6.5" fill="white" opacity="0.85"/><ellipse cx="88" cy="94" rx="2" ry="2.5" fill="#2d2d2d" opacity="0.7"/><ellipse cx="114" cy="94" rx="2" ry="2.5" fill="#2d2d2d" opacity="0.7"/></>}<polygon points="100,106 93,100 107,100" fill="#e8a84c"/>{mood==="happy"&&<path d="M 92 112 Q 100 120 108 112" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8"/>}{mood==="sad"&&<path d="M 94 116 Q 100 110 106 116" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.5"/>}{mood==="content"&&<path d="M 94 112 Q 100 116 106 112" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.6"/>}<line x1="85" y1="166" x2="80" y2="178" stroke="#e8a84c" strokeWidth="3" strokeLinecap="round"/><line x1="90" y1="166" x2="90" y2="180" stroke="#e8a84c" strokeWidth="3" strokeLinecap="round"/><line x1="110" y1="166" x2="110" y2="180" stroke="#e8a84c" strokeWidth="3" strokeLinecap="round"/><line x1="115" y1="166" x2="120" y2="178" stroke="#e8a84c" strokeWidth="3" strokeLinecap="round"/></svg>);
}

function BirdL3({ size, accent, mood }) {
  return (<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="bs3"><feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.22"/></filter></defs><ellipse cx="100" cy="184" rx="35" ry="5" fill="rgba(0,0,0,0.12)"/><path d="M 100 165 Q 80 180 65 175" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.5"/><path d="M 100 165 Q 120 180 135 175" stroke={accent} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.5"/><ellipse cx="100" cy="115" rx="52" ry="55" fill={accent} filter="url(#bs3)"/><ellipse cx="100" cy="130" rx="34" ry="35" fill="rgba(255,255,255,0.12)"/><ellipse cx="52" cy="110" rx="18" ry="30" fill={accent} opacity="0.7" transform="rotate(15,52,110)">{mood==="happy"&&<animateTransform attributeName="transform" type="rotate" values="15,52,110;-8,52,110;15,52,110" dur="0.6s" repeatCount="indefinite"/>}</ellipse><ellipse cx="148" cy="110" rx="18" ry="30" fill={accent} opacity="0.7" transform="rotate(-15,148,110)">{mood==="happy"&&<animateTransform attributeName="transform" type="rotate" values="-15,148,110;8,148,110;-15,148,110" dur="0.6s" repeatCount="indefinite"/>}</ellipse><path d="M 93 62 Q 88 40 97 48 Q 100 38 103 48 Q 112 40 107 62" fill={accent} opacity="0.85"/>{mood==="happy"?<><path d="M 80 94 Q 86 84 92 94" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round"/><path d="M 108 94 Q 114 84 120 94" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round"/></>:<><ellipse cx="86" cy="92" rx="6" ry="7" fill="white" opacity="0.85"/><ellipse cx="114" cy="92" rx="6" ry="7" fill="white" opacity="0.85"/><ellipse cx="87" cy="90" rx="2.5" ry="3" fill="#2d2d2d" opacity="0.7"/><ellipse cx="115" cy="90" rx="2.5" ry="3" fill="#2d2d2d" opacity="0.7"/></>}<polygon points="100,102 92,96 108,96" fill="#e8a84c"/>{mood==="happy"&&<path d="M 90 110 Q 100 122 110 110" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.8"/>}{mood==="sad"&&<path d="M 93 116 Q 100 110 107 116" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>}<line x1="82" y1="168" x2="76" y2="180" stroke="#e8a84c" strokeWidth="3" strokeLinecap="round"/><line x1="88" y1="168" x2="88" y2="182" stroke="#e8a84c" strokeWidth="3" strokeLinecap="round"/><line x1="112" y1="168" x2="112" y2="182" stroke="#e8a84c" strokeWidth="3" strokeLinecap="round"/><line x1="118" y1="168" x2="124" y2="180" stroke="#e8a84c" strokeWidth="3" strokeLinecap="round"/><circle cx="42" cy="68" r="2.5" fill={accent} opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite"/></circle></svg>);
}

function BirdL4({ size, accent, mood }) {
  return (<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="bs4"><feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.25"/></filter><filter id="bGlow"><feDropShadow dx="0" dy="0" stdDeviation="10" floodColor={accent} floodOpacity="0.2"/></filter></defs><ellipse cx="100" cy="184" rx="38" ry="5" fill="rgba(0,0,0,0.15)"/><ellipse cx="100" cy="112" rx="70" ry="72" fill="none" stroke={accent} strokeWidth="1" opacity="0.15" filter="url(#bGlow)"><animate attributeName="opacity" values="0.15;0.05;0.15" dur="3s" repeatCount="indefinite"/></ellipse><path d="M 100 168 Q 70 185 50 178" stroke={accent} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.6"/><path d="M 100 168 Q 130 185 150 178" stroke={accent} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.6"/><path d="M 100 168 Q 60 195 45 185" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.35"/><path d="M 100 168 Q 140 195 155 185" stroke={accent} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.35"/><ellipse cx="100" cy="115" rx="52" ry="55" fill={accent} filter="url(#bs4)"/><ellipse cx="100" cy="130" rx="34" ry="35" fill="rgba(255,255,255,0.12)"/><path d="M 86 120 Q 100 145 114 120" fill="rgba(255,255,255,0.08)"/><path d="M 50 110 Q 30 90 25 105 Q 20 120 48 130" fill={accent} opacity="0.7">{mood==="happy"&&<animate attributeName="d" values="M 50 110 Q 30 90 25 105 Q 20 120 48 130;M 50 110 Q 22 82 18 100 Q 14 118 48 130;M 50 110 Q 30 90 25 105 Q 20 120 48 130" dur="0.7s" repeatCount="indefinite"/>}</path><path d="M 150 110 Q 170 90 175 105 Q 180 120 152 130" fill={accent} opacity="0.7">{mood==="happy"&&<animate attributeName="d" values="M 150 110 Q 170 90 175 105 Q 180 120 152 130;M 150 110 Q 178 82 182 100 Q 186 118 152 130;M 150 110 Q 170 90 175 105 Q 180 120 152 130" dur="0.7s" repeatCount="indefinite"/>}</path><path d="M 88 60 Q 82 32 92 42 Q 96 28 100 38 Q 104 28 108 42 Q 118 32 112 60" fill={accent} opacity="0.9"/>{mood==="happy"?<><path d="M 80 94 Q 86 82 92 94" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/><path d="M 108 94 Q 114 82 120 94" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/></>:<><ellipse cx="86" cy="92" rx="6" ry="7" fill="white" opacity="0.9"/><ellipse cx="114" cy="92" rx="6" ry="7" fill="white" opacity="0.9"/><ellipse cx="87" cy="90" rx="2.5" ry="3" fill={accent} opacity="0.5"/><ellipse cx="115" cy="90" rx="2.5" ry="3" fill={accent} opacity="0.5"/></>}<polygon points="100,102 91,95 109,95" fill="#e8a84c"/>{mood==="happy"&&<path d="M 88 110 Q 100 124 112 110" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85"/>}{mood==="sad"&&<path d="M 92 118 Q 100 110 108 118" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"/>}<line x1="82" y1="168" x2="76" y2="180" stroke="#e8a84c" strokeWidth="3" strokeLinecap="round"/><line x1="88" y1="168" x2="88" y2="182" stroke="#e8a84c" strokeWidth="3" strokeLinecap="round"/><line x1="112" y1="168" x2="112" y2="182" stroke="#e8a84c" strokeWidth="3" strokeLinecap="round"/><line x1="118" y1="168" x2="124" y2="180" stroke="#e8a84c" strokeWidth="3" strokeLinecap="round"/><circle cx="36" cy="62" r="3" fill={accent} opacity="0.6"><animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.8s" repeatCount="indefinite"/></circle><circle cx="164" cy="58" r="2.5" fill={accent} opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.2s" repeatCount="indefinite"/></circle></svg>);
}

// Simplified snake/monkey/robot L1-L4 (same as before, kept compact)
function SnakeL1({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ss1"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.2"/></filter></defs><ellipse cx="100" cy="182" rx="25" ry="4" fill="rgba(0,0,0,0.1)"/><path d="M 100 170 Q 85 155 90 140 Q 95 125 100 120" stroke={accent} strokeWidth="18" fill="none" strokeLinecap="round" filter="url(#ss1)"/><circle cx="100" cy="112" r="18" fill={accent} filter="url(#ss1)"/>{mood==="happy"?<><path d="M 92 108 Q 95 102 98 108" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/><path d="M 102 108 Q 105 102 108 108" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/></>:<><ellipse cx="95" cy="106" rx="3.5" ry="4.5" fill="white" opacity="0.85"/><ellipse cx="105" cy="106" rx="3.5" ry="4.5" fill="white" opacity="0.85"/></>}{mood!=="sad"&&<line x1="100" y1="120" x2="100" y2="126" stroke="#e86a6a" strokeWidth="1.5" strokeLinecap="round"/>}</svg>);}
function SnakeL2({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ss2"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.22"/></filter></defs><ellipse cx="100" cy="186" rx="35" ry="5" fill="rgba(0,0,0,0.12)"/><path d="M 80 172 Q 55 155 60 130 Q 65 105 100 95" stroke={accent} strokeWidth="20" fill="none" strokeLinecap="round" filter="url(#ss2)"/><path d="M 80 172 Q 55 155 60 130 Q 65 105 100 95" stroke="rgba(255,255,255,0.08)" strokeWidth="13" fill="none" strokeLinecap="round"/><ellipse cx="100" cy="85" rx="24" ry="22" fill={accent} filter="url(#ss2)"/>{mood==="happy"?<><path d="M 90 80 Q 94 72 98 80" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 102 80 Q 106 72 110 80" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><ellipse cx="94" cy="78" rx="4" ry="5" fill="white" opacity="0.85"/><ellipse cx="106" cy="78" rx="4" ry="5" fill="white" opacity="0.85"/></>}{mood==="happy"&&<path d="M 93 90 Q 100 98 107 90" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7"/>}</svg>);}
function SnakeL3({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ss3"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.22"/></filter></defs><ellipse cx="100" cy="186" rx="40" ry="5" fill="rgba(0,0,0,0.12)"/><path d="M 70 175 Q 40 155 48 125 Q 56 95 95 88 Q 135 82 142 110 Q 148 135 120 150 Q 100 160 92 148" stroke={accent} strokeWidth="22" fill="none" strokeLinecap="round" filter="url(#ss3)"/><path d="M 70 175 Q 40 155 48 125 Q 56 95 95 88 Q 135 82 142 110 Q 148 135 120 150 Q 100 160 92 148" stroke="rgba(255,255,255,0.08)" strokeWidth="14" fill="none" strokeLinecap="round"/><ellipse cx="95" cy="78" rx="28" ry="24" fill={accent} filter="url(#ss3)"/><ellipse cx="70" cy="80" rx="8" ry="12" fill={accent} opacity="0.5"/><ellipse cx="120" cy="80" rx="8" ry="12" fill={accent} opacity="0.5"/>{mood==="happy"?<><path d="M 85 74 Q 89 66 93 74" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 99 74 Q 103 66 107 74" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><ellipse cx="89" cy="72" rx="4.5" ry="5.5" fill="white" opacity="0.85"/><ellipse cx="103" cy="72" rx="4.5" ry="5.5" fill="white" opacity="0.85"/></>}{mood==="happy"&&<path d="M 88 84 Q 96 92 104 84" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8"/>}<circle cx="50" cy="70" r="2.5" fill={accent} opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite"/></circle></svg>);}
function SnakeL4({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ss4"><feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.25"/></filter><filter id="sGlow"><feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={accent} floodOpacity="0.2"/></filter></defs><ellipse cx="100" cy="186" rx="42" ry="5" fill="rgba(0,0,0,0.15)"/><ellipse cx="100" cy="115" rx="68" ry="70" fill="none" stroke={accent} strokeWidth="1" opacity="0.12" filter="url(#sGlow)"><animate attributeName="opacity" values="0.12;0.04;0.12" dur="3s" repeatCount="indefinite"/></ellipse><path d="M 68 178 Q 35 158 42 120 Q 50 82 95 75 Q 140 68 150 100 Q 158 130 128 152 Q 105 166 90 150 Q 78 138 95 126 Q 110 116 112 130" stroke={accent} strokeWidth="24" fill="none" strokeLinecap="round" filter="url(#ss4)"/><path d="M 68 178 Q 35 158 42 120 Q 50 82 95 75 Q 140 68 150 100 Q 158 130 128 152 Q 105 166 90 150 Q 78 138 95 126 Q 110 116 112 130" stroke="rgba(255,255,255,0.08)" strokeWidth="16" fill="none" strokeLinecap="round"/><ellipse cx="95" cy="65" rx="32" ry="28" fill={accent} filter="url(#ss4)"/><ellipse cx="64" cy="68" rx="14" ry="20" fill={accent} opacity="0.6"/><ellipse cx="126" cy="68" rx="14" ry="20" fill={accent} opacity="0.6"/>{mood==="happy"?<><path d="M 84 60 Q 88 52 92 60" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round"/><path d="M 100 60 Q 104 52 108 60" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round"/></>:<><ellipse cx="88" cy="58" rx="5" ry="6" fill="white" opacity="0.9"/><ellipse cx="104" cy="58" rx="5" ry="6" fill="white" opacity="0.9"/></>}{mood==="happy"&&<path d="M 86 74 Q 96 84 106 74" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.85"/>}<circle cx="42" cy="50" r="3" fill={accent} opacity="0.6"><animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.8s" repeatCount="indefinite"/></circle><circle cx="152" cy="48" r="2.5" fill={accent} opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.2s" repeatCount="indefinite"/></circle></svg>);}

function MonkeyL1({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ms1"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.2"/></filter></defs><ellipse cx="100" cy="182" rx="25" ry="4" fill="rgba(0,0,0,0.1)"/><ellipse cx="100" cy="125" rx="35" ry="38" fill={accent} filter="url(#ms1)"/><circle cx="65" cy="108" r="14" fill={accent}/><circle cx="65" cy="108" r="9" fill="rgba(255,255,255,0.12)"/><circle cx="135" cy="108" r="14" fill={accent}/><circle cx="135" cy="108" r="9" fill="rgba(255,255,255,0.12)"/>{mood==="happy"?<><path d="M 89 112 Q 93 104 97 112" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 103 112 Q 107 104 111 112" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><ellipse cx="93" cy="110" rx="5" ry="6" fill="white" opacity="0.85"/><ellipse cx="107" cy="110" rx="5" ry="6" fill="white" opacity="0.85"/></>}<ellipse cx="100" cy="120" rx="3" ry="2" fill="rgba(255,255,255,0.25)"/>{mood==="happy"&&<path d="M 95 126 Q 100 132 105 126" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7"/>}</svg>);}
function MonkeyL2({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ms2"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.22"/></filter></defs><ellipse cx="100" cy="184" rx="30" ry="5" fill="rgba(0,0,0,0.12)"/><path d="M 60 148 Q 40 138 42 120" stroke={accent} strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.6"/><ellipse cx="100" cy="120" rx="42" ry="46" fill={accent} filter="url(#ms2)"/><circle cx="58" cy="96" r="15" fill={accent}/><circle cx="58" cy="96" r="10" fill="rgba(255,255,255,0.12)"/><circle cx="142" cy="96" r="15" fill={accent}/><circle cx="142" cy="96" r="10" fill="rgba(255,255,255,0.12)"/>{mood==="happy"?<><path d="M 88 96 Q 92 88 96 96" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 104 96 Q 108 88 112 96" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><ellipse cx="92" cy="94" rx="5" ry="6" fill="white" opacity="0.85"/><ellipse cx="108" cy="94" rx="5" ry="6" fill="white" opacity="0.85"/></>}<ellipse cx="100" cy="104" rx="3.5" ry="2" fill="rgba(255,255,255,0.25)"/>{mood==="happy"&&<path d="M 93 110 Q 100 118 107 110" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.7"/>}<ellipse cx="62" cy="130" rx="8" ry="12" fill={accent} opacity="0.65" transform="rotate(12,62,130)"/><ellipse cx="138" cy="130" rx="8" ry="12" fill={accent} opacity="0.65" transform="rotate(-12,138,130)"/><ellipse cx="82" cy="166" rx="10" ry="7" fill={accent} opacity="0.6"/><ellipse cx="118" cy="166" rx="10" ry="7" fill={accent} opacity="0.6"/></svg>);}
function MonkeyL3({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ms3"><feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.22"/></filter></defs><ellipse cx="100" cy="185" rx="35" ry="5" fill="rgba(0,0,0,0.12)"/><path d="M 58 148 Q 30 135 32 108 Q 34 85 48 78" stroke={accent} strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.65"/><ellipse cx="100" cy="120" rx="48" ry="52" fill={accent} filter="url(#ms3)"/><path d="M 88 118 Q 100 140 112 118" fill="rgba(255,255,255,0.06)"/><circle cx="54" cy="88" r="16" fill={accent}/><circle cx="54" cy="88" r="10" fill="rgba(255,255,255,0.12)"/><circle cx="146" cy="88" r="16" fill={accent}/><circle cx="146" cy="88" r="10" fill="rgba(255,255,255,0.12)"/>{mood==="happy"?<><path d="M 86 94 Q 91 84 96 94" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 104 94 Q 109 84 114 94" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><ellipse cx="91" cy="92" rx="5.5" ry="6.5" fill="white" opacity="0.85"/><ellipse cx="109" cy="92" rx="5.5" ry="6.5" fill="white" opacity="0.85"/></>}<ellipse cx="100" cy="102" rx="4" ry="2.5" fill="rgba(255,255,255,0.25)"/>{mood==="happy"&&<path d="M 92 108 Q 100 118 108 108" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.8"/>}<ellipse cx="56" cy="132" rx="10" ry="14" fill={accent} opacity="0.7" transform="rotate(12,56,132)"/><ellipse cx="144" cy="132" rx="10" ry="14" fill={accent} opacity="0.7" transform="rotate(-12,144,132)"/><ellipse cx="80" cy="170" rx="13" ry="8" fill={accent} opacity="0.65"/><ellipse cx="120" cy="170" rx="13" ry="8" fill={accent} opacity="0.65"/><circle cx="40" cy="68" r="2.5" fill={accent} opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite"/></circle></svg>);}
function MonkeyL4({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="ms4"><feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.25"/></filter><filter id="mGlow"><feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={accent} floodOpacity="0.18"/></filter></defs><ellipse cx="100" cy="185" rx="38" ry="5" fill="rgba(0,0,0,0.15)"/><ellipse cx="100" cy="118" rx="65" ry="68" fill="none" stroke={accent} strokeWidth="1" opacity="0.12" filter="url(#mGlow)"><animate attributeName="opacity" values="0.12;0.04;0.12" dur="3s" repeatCount="indefinite"/></ellipse><path d="M 55 148 Q 22 132 26 100 Q 30 72 50 62 Q 55 58 52 52" stroke={accent} strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.7"/><circle cx="52" cy="50" r="4" fill={accent} opacity="0.5"/><ellipse cx="100" cy="118" rx="50" ry="54" fill={accent} filter="url(#ms4)"/><path d="M 92 66 Q 88 54 96 58 Q 100 50 104 58 Q 112 54 108 66" fill={accent} opacity="0.8"/><circle cx="52" cy="84" r="18" fill={accent}/><circle cx="52" cy="84" r="12" fill="rgba(255,255,255,0.12)"/><circle cx="148" cy="84" r="18" fill={accent}/><circle cx="148" cy="84" r="12" fill="rgba(255,255,255,0.12)"/>{mood==="happy"?<><path d="M 85 90 Q 90 80 95 90" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round"/><path d="M 105 90 Q 110 80 115 90" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round"/></>:<><ellipse cx="90" cy="88" rx="6" ry="7" fill="white" opacity="0.9"/><ellipse cx="110" cy="88" rx="6" ry="7" fill="white" opacity="0.9"/></>}<ellipse cx="100" cy="100" rx="4.5" ry="2.5" fill="rgba(255,255,255,0.3)"/>{mood==="happy"&&<path d="M 90 106 Q 100 118 110 106" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.85"/>}<ellipse cx="54" cy="130" rx="12" ry="16" fill={accent} opacity="0.7" transform="rotate(10,54,130)"/><ellipse cx="146" cy="130" rx="12" ry="16" fill={accent} opacity="0.7" transform="rotate(-10,146,130)"/><ellipse cx="78" cy="170" rx="14" ry="9" fill={accent} opacity="0.65"/><ellipse cx="122" cy="170" rx="14" ry="9" fill={accent} opacity="0.65"/><circle cx="36" cy="60" r="3" fill={accent} opacity="0.6"><animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.8s" repeatCount="indefinite"/></circle><circle cx="164" cy="56" r="2.5" fill={accent} opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.2s" repeatCount="indefinite"/></circle></svg>);}

function RobotL1({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="rs1"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.2"/></filter></defs><ellipse cx="100" cy="180" rx="25" ry="4" fill="rgba(0,0,0,0.15)"/><rect x="72" y="90" width="56" height="56" rx="10" fill={accent} filter="url(#rs1)"/><rect x="80" y="100" width="40" height="24" rx="6" fill="rgba(0,0,0,0.25)"/>{mood==="happy"?<><path d="M 90 112 Q 93 106 96 112" stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 104 112 Q 107 106 110 112" stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><rect x="88" y="108" width="6" height="6" rx="1.5" fill={accent} opacity={mood==="sad"?"0.5":"0.8"}/><rect x="106" y="108" width="6" height="6" rx="1.5" fill={accent} opacity={mood==="sad"?"0.5":"0.8"}/></>}<rect x="80" y="146" width="14" height="10" rx="4" fill={accent} opacity="0.5"/><rect x="106" y="146" width="14" height="10" rx="4" fill={accent} opacity="0.5"/></svg>);}
function RobotL2({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="rs2"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.22"/></filter></defs><ellipse cx="100" cy="184" rx="30" ry="5" fill="rgba(0,0,0,0.15)"/><line x1="100" y1="68" x2="100" y2="56" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round"/><circle cx="100" cy="52" r="4" fill={accent} opacity="0.7"/><rect x="68" y="68" width="64" height="52" rx="12" fill={accent} filter="url(#rs2)"/><rect x="76" y="78" width="48" height="24" rx="7" fill="rgba(0,0,0,0.28)"/>{mood==="happy"?<><path d="M 88 90 Q 91 84 94 90" stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M 106 90 Q 109 84 112 90" stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round"/></>:<><rect x="86" y="86" width="7" height="7" rx="2" fill={accent} opacity={mood==="sad"?"0.5":"0.8"}/><rect x="107" y="86" width="7" height="7" rx="2" fill={accent} opacity={mood==="sad"?"0.5":"0.8"}/></>}<rect x="76" y="122" width="48" height="38" rx="8" fill={accent} filter="url(#rs2)"/><rect x="56" y="126" width="16" height="8" rx="4" fill={accent} opacity="0.55"/><rect x="128" y="126" width="16" height="8" rx="4" fill={accent} opacity="0.55"/><rect x="80" y="160" width="14" height="14" rx="4" fill={accent} opacity="0.55"/><rect x="106" y="160" width="14" height="14" rx="4" fill={accent} opacity="0.55"/></svg>);}
function RobotL3({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="rs3"><feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.25"/></filter><filter id="rG3"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={accent} floodOpacity="0.35"/></filter></defs><ellipse cx="100" cy="185" rx="35" ry="5" fill="rgba(0,0,0,0.18)"/><line x1="100" y1="58" x2="100" y2="42" stroke="rgba(255,255,255,0.3)" strokeWidth="3" strokeLinecap="round"/><circle cx="100" cy="38" r="5" fill={accent} filter="url(#rG3)"><animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite"/></circle><rect x="64" y="58" width="72" height="58" rx="14" fill={accent} filter="url(#rs3)"/><rect x="74" y="70" width="52" height="26" rx="8" fill="rgba(0,0,0,0.3)"/>{mood==="happy"?<><path d="M 86 82 Q 89 74 92 82" stroke={accent} strokeWidth="2.8" fill="none" strokeLinecap="round" filter="url(#rG3)"/><path d="M 108 82 Q 111 74 114 82" stroke={accent} strokeWidth="2.8" fill="none" strokeLinecap="round" filter="url(#rG3)"/></>:<><rect x="84" y="78" width="8" height="8" rx="2" fill={accent} opacity={mood==="sad"?"0.5":"1"} filter="url(#rG3)"/><rect x="108" y="78" width="8" height="8" rx="2" fill={accent} opacity={mood==="sad"?"0.5":"1"} filter="url(#rG3)"/></>}<rect x="72" y="120" width="56" height="44" rx="10" fill={accent} filter="url(#rs3)"/><rect x="86" y="128" width="28" height="16" rx="4" fill="rgba(0,0,0,0.22)"/><circle cx="95" cy="136" r="3" fill={mood==="happy"?"#6ee7a0":mood==="sad"?"#e86a6a":accent} opacity="0.8"><animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite"/></circle><rect x="50" y="124" width="18" height="10" rx="5" fill={accent} opacity="0.6"/><rect x="44" y="136" width="10" height="16" rx="4" fill={accent} opacity="0.45"/><rect x="132" y="124" width="18" height="10" rx="5" fill={accent} opacity="0.6"/><rect x="146" y="136" width="10" height="16" rx="4" fill={accent} opacity="0.45"/><rect x="78" y="164" width="14" height="16" rx="4" fill={accent} opacity="0.55"/><rect x="108" y="164" width="14" height="16" rx="4" fill={accent} opacity="0.55"/><circle cx="44" cy="54" r="2.5" fill={accent} opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite"/></circle></svg>);}
function RobotL4({size,accent,mood}){return(<svg width={size} height={size} viewBox="0 0 200 200"><defs><filter id="rs4"><feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity="0.3"/></filter><filter id="rG4"><feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={accent} floodOpacity="0.4"/></filter><filter id="rAura"><feDropShadow dx="0" dy="0" stdDeviation="12" floodColor={accent} floodOpacity="0.15"/></filter></defs><ellipse cx="100" cy="186" rx="38" ry="5" fill="rgba(0,0,0,0.2)"/><ellipse cx="100" cy="112" rx="68" ry="70" fill="none" stroke={accent} strokeWidth="1" opacity="0.1" filter="url(#rAura)"><animate attributeName="opacity" values="0.1;0.03;0.1" dur="3s" repeatCount="indefinite"/></ellipse><line x1="88" y1="52" x2="85" y2="36" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"/><line x1="100" y1="52" x2="100" y2="32" stroke="rgba(255,255,255,0.3)" strokeWidth="3" strokeLinecap="round"/><line x1="112" y1="52" x2="115" y2="36" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"/><circle cx="85" cy="33" r="3.5" fill={accent} opacity="0.6" filter="url(#rG4)"/><circle cx="100" cy="28" r="5" fill={accent} filter="url(#rG4)"><animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite"/></circle><circle cx="115" cy="33" r="3.5" fill={accent} opacity="0.6" filter="url(#rG4)"/><rect x="62" y="52" width="76" height="62" rx="14" fill={accent} filter="url(#rs4)"/><rect x="52" y="62" width="10" height="20" rx="4" fill={accent} opacity="0.5"/><rect x="138" y="62" width="10" height="20" rx="4" fill={accent} opacity="0.5"/><rect x="72" y="64" width="56" height="28" rx="8" fill="rgba(0,0,0,0.32)"/>{mood==="happy"?<><path d="M 86 78 Q 89 70 92 78" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" filter="url(#rG4)"/><path d="M 108 78 Q 111 70 114 78" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" filter="url(#rG4)"/></>:<><rect x="84" y="74" width="9" height="9" rx="2" fill={accent} opacity={mood==="sad"?"0.5":"1"} filter="url(#rG4)"/><rect x="107" y="74" width="9" height="9" rx="2" fill={accent} opacity={mood==="sad"?"0.5":"1"} filter="url(#rG4)"/></>}<rect x="68" y="118" width="64" height="48" rx="10" fill={accent} filter="url(#rs4)"/><rect x="82" y="124" width="36" height="22" rx="5" fill="rgba(0,0,0,0.25)"/><circle cx="95" cy="135" r="4" fill={mood==="happy"?"#6ee7a0":mood==="sad"?"#e86a6a":accent} filter="url(#rG4)"><animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/></circle><rect x="46" y="118" width="20" height="14" rx="6" fill={accent} opacity="0.65"/><rect x="134" y="118" width="20" height="14" rx="6" fill={accent} opacity="0.65"/><rect x="42" y="134" width="14" height="22" rx="5" fill={accent} opacity="0.5"/><rect x="144" y="134" width="14" height="22" rx="5" fill={accent} opacity="0.5"/><circle cx="49" cy="160" r="5" fill={accent} opacity="0.4"/><circle cx="151" cy="160" r="5" fill={accent} opacity="0.4"/><rect x="76" y="166" width="16" height="16" rx="5" fill={accent} opacity="0.6"/><rect x="108" y="166" width="16" height="16" rx="5" fill={accent} opacity="0.6"/><circle cx="40" cy="48" r="3" fill={accent} opacity="0.5"><animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite"/></circle><circle cx="160" cy="44" r="2.5" fill={accent} opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.4s" repeatCount="indefinite"/></circle></svg>);}

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
  return (<div style={{ position:"relative", display:"inline-block", animation:ani }}>{hat&&(<svg width={size*0.35} height={size*0.3} viewBox="0 0 70 50" style={{position:"absolute",top:level===0?-size*0.05:-size*0.1,left:size*0.33,zIndex:2,filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))"}}><polygon points="35,3 52,36 18,36" fill={bt.accent} stroke="rgba(255,255,255,0.2)" strokeWidth="1"/><circle cx="35" cy="3" r="3.5" fill="#ffe066"/><rect x="18" y="35" width="34" height="4" rx="2" fill="rgba(255,255,255,0.2)"/></svg>)}{content}</div>);
}

// ═══ ENVIRONMENT BACKGROUNDS ═══
function EnvironmentBg({ envId, width = 320, height = 180 }) {
  const w = width, h = height;
  if (envId === "office") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)"}}>
      <rect width={w} height={h} fill="#1a1a2e"/>
      {/* Wall */}
      <rect y={0} width={w} height={h*0.65} fill="#1e2038"/>
      {/* Floor */}
      <rect y={h*0.65} width={w} height={h*0.35} fill="#252540"/>
      <line x1={0} y1={h*0.65} x2={w} y2={h*0.65} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      {/* Window */}
      <rect x={w*0.35} y={h*0.08} width={w*0.3} height={h*0.35} rx="3" fill="#2a3a5c" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <line x1={w*0.5} y1={h*0.08} x2={w*0.5} y2={h*0.43} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      <line x1={w*0.35} y1={h*0.25} x2={w*0.65} y2={h*0.25} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
      {/* Desk */}
      <rect x={w*0.1} y={h*0.55} width={w*0.35} height={h*0.04} rx="2" fill="#3a3a5a"/>
      <rect x={w*0.14} y={h*0.59} width={w*0.04} height={h*0.15} fill="#333350"/>
      <rect x={w*0.38} y={h*0.59} width={w*0.04} height={h*0.15} fill="#333350"/>
      {/* Monitor */}
      <rect x={w*0.18} y={h*0.35} width={w*0.18} height={h*0.18} rx="2" fill="#333358" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/>
      <rect x={w*0.2} y={h*0.37} width={w*0.14} height={h*0.12} rx="1" fill="#4a5a8a" opacity="0.4"/>
      <rect x={w*0.25} y={h*0.53} width={w*0.04} height={h*0.02} fill="#333358"/>
      {/* Plant */}
      <rect x={w*0.78} y={h*0.5} width={w*0.06} height={h*0.08} rx="2" fill="#4a3a2a"/>
      <circle cx={w*0.81} cy={h*0.46} r={w*0.04} fill="#2d5a3a"/>
      <circle cx={w*0.78} cy={h*0.42} r={w*0.03} fill="#3a6b4a"/>
      {/* Coffee mug */}
      <rect x={w*0.06} y={h*0.5} width={w*0.035} height={h*0.05} rx="1.5" fill="#5a4a3a"/>
    </svg>
  );
  if (envId === "livingroom") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)"}}>
      <rect width={w} height={h} fill="#1a1a2e"/>
      <rect y={0} width={w} height={h*0.6} fill="#22202e"/>
      <rect y={h*0.6} width={w} height={h*0.4} fill="#2a2535"/>
      {/* Rug */}
      <ellipse cx={w*0.5} cy={h*0.78} rx={w*0.3} ry={h*0.1} fill="#3a2a3a" opacity="0.5"/>
      {/* Couch */}
      <rect x={w*0.08} y={h*0.45} width={w*0.38} height={h*0.2} rx="6" fill="#4a3a5a"/>
      <rect x={w*0.1} y={h*0.42} width={w*0.1} height={h*0.22} rx="5" fill="#4a3a5a"/>
      <rect x={w*0.34} y={h*0.42} width={w*0.1} height={h*0.22} rx="5" fill="#4a3a5a"/>
      {/* Cushions */}
      <rect x={w*0.15} y={h*0.46} width={w*0.08} height={h*0.1} rx="3" fill="#5a4a6a"/>
      <rect x={w*0.26} y={h*0.46} width={w*0.08} height={h*0.1} rx="3" fill="#5a4a6a"/>
      {/* Lamp */}
      <rect x={w*0.72} y={h*0.2} width={w*0.015} height={h*0.38} fill="#5a5a6a"/>
      <path d={`M ${w*0.68} ${h*0.2} Q ${w*0.73} ${h*0.1} ${w*0.78} ${h*0.2}`} fill="#6a5a3a" opacity="0.8"/>
      <circle cx={w*0.73} cy={h*0.18} r={w*0.008} fill="#ffe088" opacity="0.6"/>
      {/* Side table */}
      <rect x={w*0.68} y={h*0.52} width={w*0.1} height={h*0.04} rx="2" fill="#3a3545"/>
      <rect x={w*0.71} y={h*0.56} width={w*0.04} height={h*0.12} fill="#333040"/>
      {/* Picture frame */}
      <rect x={w*0.55} y={h*0.12} width={w*0.12} height={h*0.16} rx="2" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="#2a2a3a"/>
      {/* Bookshelf */}
      <rect x={w*0.82} y={h*0.15} width={w*0.12} height={h*0.4} rx="2" fill="#332e3e"/>
      <rect x={w*0.83} y={h*0.18} width={w*0.03} height={h*0.06} rx="1" fill="#5a4a4a"/><rect x={w*0.87} y={h*0.18} width={w*0.025} height={h*0.06} rx="1" fill="#4a5a5a"/><rect x={w*0.9} y={h*0.18} width={w*0.02} height={h*0.06} rx="1" fill="#5a5a4a"/>
      <rect x={w*0.83} y={h*0.28} width={w*0.035} height={h*0.06} rx="1" fill="#4a4a5a"/><rect x={w*0.875} y={h*0.28} width={w*0.03} height={h*0.06} rx="1" fill="#5a4a5a"/>
    </svg>
  );
  if (envId === "park") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)"}}>
      {/* Sky */}
      <rect width={w} height={h} fill="#1a2a3e"/>
      <rect y={h*0.55} width={w} height={h*0.45} fill="#1a3a2a"/>
      {/* Path */}
      <path d={`M ${w*0.3} ${h} Q ${w*0.45} ${h*0.65} ${w*0.7} ${h}`} fill="#2a2a1a" opacity="0.4"/>
      {/* Trees */}
      <rect x={w*0.08} y={h*0.3} width={w*0.025} height={h*0.35} fill="#3a2a1a"/>
      <circle cx={w*0.09} cy={h*0.25} r={w*0.06} fill="#2a5a3a"/><circle cx={w*0.07} cy={h*0.2} r={w*0.04} fill="#3a6a4a"/>
      <rect x={w*0.82} y={h*0.25} width={w*0.025} height={h*0.4} fill="#3a2a1a"/>
      <circle cx={w*0.83} cy={h*0.2} r={w*0.065} fill="#2a5a3a"/><circle cx={w*0.85} cy={h*0.15} r={w*0.04} fill="#3a6a4a"/>
      {/* Bench */}
      <rect x={w*0.55} y={h*0.58} width={w*0.15} height={h*0.025} rx="2" fill="#5a4a3a"/>
      <rect x={w*0.55} y={h*0.55} width={w*0.15} height={h*0.025} rx="2" fill="#5a4a3a"/>
      <rect x={w*0.57} y={h*0.6} width={w*0.015} height={h*0.08} fill="#4a3a2a"/>
      <rect x={w*0.68} y={h*0.6} width={w*0.015} height={h*0.08} fill="#4a3a2a"/>
      {/* Flowers */}
      <circle cx={w*0.2} cy={h*0.62} r={3} fill="#e86a8a" opacity="0.7"/><circle cx={w*0.24} cy={h*0.65} r={2.5} fill="#e8a84c" opacity="0.6"/>
      <circle cx={w*0.75} cy={h*0.6} r={3} fill="#b07ae8" opacity="0.6"/><circle cx={w*0.78} cy={h*0.63} r={2.5} fill="#e86a8a" opacity="0.5"/>
      {/* Stars */}
      <circle cx={w*0.15} cy={h*0.08} r="1.5" fill="white" opacity="0.3"/><circle cx={w*0.5} cy={h*0.05} r="1" fill="white" opacity="0.25"/>
      <circle cx={w*0.8} cy={h*0.1} r="1.5" fill="white" opacity="0.2"/><circle cx={w*0.35} cy={h*0.12} r="1" fill="white" opacity="0.15"/>
      {/* Moon */}
      <circle cx={w*0.85} cy={h*0.08} r={w*0.03} fill="#e8e0c0" opacity="0.4"/>
    </svg>
  );
  if (envId === "rave") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)"}}>
      <rect width={w} height={h} fill="#0a0a14"/>
      {/* Floor glow */}
      <rect y={h*0.7} width={w} height={h*0.3} fill="#0e0e1a"/>
      <rect y={h*0.7} width={w} height={h*0.01} fill="#ff00ff" opacity="0.15"/>
      {/* Neon beams */}
      <line x1={w*0.1} y1={0} x2={w*0.3} y2={h} stroke="#ff00ff" strokeWidth="1.5" opacity="0.2"><animate attributeName="opacity" values="0.2;0.05;0.2" dur="1.5s" repeatCount="indefinite"/></line>
      <line x1={w*0.5} y1={0} x2={w*0.4} y2={h} stroke="#00ffff" strokeWidth="1.5" opacity="0.15"><animate attributeName="opacity" values="0.15;0.05;0.15" dur="2s" repeatCount="indefinite"/></line>
      <line x1={w*0.9} y1={0} x2={w*0.7} y2={h} stroke="#ff00ff" strokeWidth="1.5" opacity="0.2"><animate attributeName="opacity" values="0.2;0.05;0.2" dur="1.8s" repeatCount="indefinite"/></line>
      <line x1={w*0.7} y1={0} x2={w*0.85} y2={h} stroke="#00ff88" strokeWidth="1" opacity="0.12"><animate attributeName="opacity" values="0.12;0.03;0.12" dur="2.2s" repeatCount="indefinite"/></line>
      <line x1={w*0.3} y1={0} x2={w*0.15} y2={h} stroke="#00ffff" strokeWidth="1" opacity="0.1"><animate attributeName="opacity" values="0.1;0.03;0.1" dur="1.7s" repeatCount="indefinite"/></line>
      {/* Speaker stacks */}
      <rect x={w*0.02} y={h*0.35} width={w*0.08} height={h*0.35} rx="3" fill="#1a1a2a" stroke="#ff00ff" strokeWidth="0.5" opacity="0.5"/>
      <circle cx={w*0.06} cy={h*0.45} r={w*0.02} fill="#1a1a2a" stroke="#ff00ff" strokeWidth="0.5" opacity="0.4"/>
      <circle cx={w*0.06} cy={h*0.58} r={w*0.025} fill="#1a1a2a" stroke="#ff00ff" strokeWidth="0.5" opacity="0.4"/>
      <rect x={w*0.9} y={h*0.35} width={w*0.08} height={h*0.35} rx="3" fill="#1a1a2a" stroke="#00ffff" strokeWidth="0.5" opacity="0.5"/>
      <circle cx={w*0.94} cy={h*0.45} r={w*0.02} fill="#1a1a2a" stroke="#00ffff" strokeWidth="0.5" opacity="0.4"/>
      <circle cx={w*0.94} cy={h*0.58} r={w*0.025} fill="#1a1a2a" stroke="#00ffff" strokeWidth="0.5" opacity="0.4"/>
      {/* Floating particles */}
      <circle cx={w*0.2} cy={h*0.2} r="2" fill="#ff00ff" opacity="0.5"><animate attributeName="cy" values={`${h*0.2};${h*0.15};${h*0.2}`} dur="3s" repeatCount="indefinite"/></circle>
      <circle cx={w*0.6} cy={h*0.3} r="1.5" fill="#00ffff" opacity="0.4"><animate attributeName="cy" values={`${h*0.3};${h*0.25};${h*0.3}`} dur="2.5s" repeatCount="indefinite"/></circle>
      <circle cx={w*0.8} cy={h*0.15} r="2" fill="#00ff88" opacity="0.3"><animate attributeName="cy" values={`${h*0.15};${h*0.1};${h*0.15}`} dur="3.5s" repeatCount="indefinite"/></circle>
      <circle cx={w*0.4} cy={h*0.1} r="1.5" fill="#ff00ff" opacity="0.35"><animate attributeName="cy" values={`${h*0.1};${h*0.06};${h*0.1}`} dur="2.8s" repeatCount="indefinite"/></circle>
      {/* Floor tiles glow */}
      <rect x={w*0.15} y={h*0.78} width={w*0.1} height={h*0.02} rx="1" fill="#ff00ff" opacity="0.1"><animate attributeName="opacity" values="0.1;0.25;0.1" dur="1.2s" repeatCount="indefinite"/></rect>
      <rect x={w*0.45} y={h*0.82} width={w*0.1} height={h*0.02} rx="1" fill="#00ffff" opacity="0.1"><animate attributeName="opacity" values="0.1;0.2;0.1" dur="1.6s" repeatCount="indefinite"/></rect>
      <rect x={w*0.72} y={h*0.76} width={w*0.1} height={h*0.02} rx="1" fill="#00ff88" opacity="0.08"><animate attributeName="opacity" values="0.08;0.2;0.08" dur="1.4s" repeatCount="indefinite"/></rect>
    </svg>
  );
  if (envId === "beach") return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)"}}>
      {/* Night sky */}
      <rect width={w} height={h} fill="#0e1a2e"/>
      {/* Ocean */}
      <rect y={h*0.35} width={w} height={h*0.25} fill="#142840"/>
      {/* Wave lines */}
      <path d={`M 0 ${h*0.4} Q ${w*0.15} ${h*0.38} ${w*0.3} ${h*0.4} Q ${w*0.45} ${h*0.42} ${w*0.6} ${h*0.4} Q ${w*0.75} ${h*0.38} ${w} ${h*0.4}`} stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none"><animate attributeName="d" values={`M 0 ${h*0.4} Q ${w*0.15} ${h*0.38} ${w*0.3} ${h*0.4} Q ${w*0.45} ${h*0.42} ${w*0.6} ${h*0.4} Q ${w*0.75} ${h*0.38} ${w} ${h*0.4};M 0 ${h*0.4} Q ${w*0.15} ${h*0.42} ${w*0.3} ${h*0.4} Q ${w*0.45} ${h*0.38} ${w*0.6} ${h*0.4} Q ${w*0.75} ${h*0.42} ${w} ${h*0.4};M 0 ${h*0.4} Q ${w*0.15} ${h*0.38} ${w*0.3} ${h*0.4} Q ${w*0.45} ${h*0.42} ${w*0.6} ${h*0.4} Q ${w*0.75} ${h*0.38} ${w} ${h*0.4}`} dur="4s" repeatCount="indefinite"/></path>
      {/* Sand */}
      <rect y={h*0.6} width={w} height={h*0.4} fill="#2a2518"/>
      <path d={`M 0 ${h*0.6} Q ${w*0.25} ${h*0.57} ${w*0.5} ${h*0.6} Q ${w*0.75} ${h*0.63} ${w} ${h*0.6}`} fill="#2a2518"/>
      {/* Palm tree */}
      <path d={`M ${w*0.15} ${h*0.62} Q ${w*0.14} ${h*0.4} ${w*0.16} ${h*0.2}`} stroke="#3a2a1a" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d={`M ${w*0.16} ${h*0.2} Q ${w*0.25} ${h*0.15} ${w*0.32} ${h*0.22}`} stroke="#2a5a3a" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d={`M ${w*0.16} ${h*0.2} Q ${w*0.08} ${h*0.14} ${w*0.02} ${h*0.2}`} stroke="#2a5a3a" strokeWidth="3" fill="none" strokeLinecap="round"/>
      <path d={`M ${w*0.16} ${h*0.2} Q ${w*0.2} ${h*0.1} ${w*0.22} ${h*0.18}`} stroke="#3a6a4a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      {/* Shells */}
      <circle cx={w*0.6} cy={h*0.72} r="2" fill="#5a5040" opacity="0.5"/>
      <circle cx={w*0.75} cy={h*0.68} r="1.5" fill="#6a5a4a" opacity="0.4"/>
      {/* Stars */}
      <circle cx={w*0.3} cy={h*0.06} r="1.5" fill="white" opacity="0.3"/><circle cx={w*0.55} cy={h*0.1} r="1" fill="white" opacity="0.2"/>
      <circle cx={w*0.7} cy={h*0.04} r="1.5" fill="white" opacity="0.25"/><circle cx={w*0.45} cy={h*0.15} r="1" fill="white" opacity="0.15"/>
      {/* Moon */}
      <circle cx={w*0.82} cy={h*0.08} r={w*0.035} fill="#e8e0c0" opacity="0.35"/>
      <circle cx={w*0.82} cy={h*0.08} r={w*0.035} fill="none" stroke="#e8e0c0" strokeWidth="0.5" opacity="0.15"/>
    </svg>
  );
  // Forest (default)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)"}}>
      <rect width={w} height={h} fill="#0e1a12"/>
      {/* Ground */}
      <rect y={h*0.6} width={w} height={h*0.4} fill="#142218"/>
      {/* Back trees */}
      <rect x={w*0.05} y={h*0.15} width={w*0.02} height={h*0.5} fill="#1a2a1a"/>
      <polygon points={`${w*0.06},${h*0.15} ${w*0.12},${h*0.35} ${w*0},${h*0.35}`} fill="#1a3a1e" opacity="0.7"/>
      <polygon points={`${w*0.06},${h*0.08} ${w*0.1},${h*0.22} ${w*0.02},${h*0.22}`} fill="#1a3a1e" opacity="0.6"/>
      <rect x={w*0.28} y={h*0.1} width={w*0.025} height={h*0.55} fill="#1a2a1a"/>
      <polygon points={`${w*0.29},${h*0.1} ${w*0.36},${h*0.32} ${w*0.22},${h*0.32}`} fill="#1e3a20" opacity="0.7"/>
      <polygon points={`${w*0.29},${h*0.02} ${w*0.34},${h*0.18} ${w*0.24},${h*0.18}`} fill="#1e3a20" opacity="0.6"/>
      <rect x={w*0.72} y={h*0.12} width={w*0.025} height={h*0.52} fill="#1a2a1a"/>
      <polygon points={`${w*0.73},${h*0.12} ${w*0.8},${h*0.34} ${w*0.66},${h*0.34}`} fill="#1a3a1e" opacity="0.7"/>
      <polygon points={`${w*0.73},${h*0.04} ${w*0.78},${h*0.2} ${w*0.68},${h*0.2}`} fill="#1a3a1e" opacity="0.6"/>
      <rect x={w*0.92} y={h*0.18} width={w*0.02} height={h*0.46} fill="#1a2a1a"/>
      <polygon points={`${w*0.93},${h*0.18} ${w*0.99},${h*0.38} ${w*0.87},${h*0.38}`} fill="#1e3a20" opacity="0.7"/>
      {/* Mushrooms */}
      <rect x={w*0.48} y={h*0.66} width={w*0.01} height={h*0.05} fill="#5a4a3a"/>
      <ellipse cx={w*0.485} cy={h*0.66} rx={w*0.02} ry={h*0.02} fill="#8a3a3a" opacity="0.7"/>
      <rect x={w*0.85} y={h*0.68} width={w*0.008} height={h*0.04} fill="#5a4a3a"/>
      <ellipse cx={w*0.854} cy={h*0.68} rx={w*0.015} ry={h*0.015} fill="#8a5a3a" opacity="0.6"/>
      {/* Fireflies */}
      <circle cx={w*0.2} cy={h*0.35} r="2" fill="#aaee66" opacity="0.4"><animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.5s" repeatCount="indefinite"/></circle>
      <circle cx={w*0.55} cy={h*0.25} r="1.5" fill="#aaee66" opacity="0.3"><animate attributeName="opacity" values="0.3;0.05;0.3" dur="3s" repeatCount="indefinite"/></circle>
      <circle cx={w*0.8} cy={h*0.4} r="2" fill="#aaee66" opacity="0.35"><animate attributeName="opacity" values="0.35;0.08;0.35" dur="2.2s" repeatCount="indefinite"/></circle>
      <circle cx={w*0.4} cy={h*0.45} r="1.5" fill="#aaee66" opacity="0.25"><animate attributeName="opacity" values="0.25;0.05;0.25" dur="3.2s" repeatCount="indefinite"/></circle>
      {/* Fog */}
      <rect y={h*0.55} width={w} height={h*0.1} fill="rgba(255,255,255,0.02)"/>
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
  return(<div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"14px 16px",border:"1px solid rgba(255,255,255,0.06)"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:15}}>{icon}</span><span style={{fontWeight:600,fontSize:13,color:"#e0e0e0"}}>{label}</span></div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:13,color:pct>=1?color:"rgba(255,255,255,0.4)",fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{value}{unit?` / ${max} ${unit}`:` / ${max}`}</span>
        {pct>=1&&<span style={{fontSize:10,fontWeight:700,color:"#12121e",background:color,padding:"2px 6px",borderRadius:4}}>✓</span>}
      </div>
    </div>
    <div ref={trackRef} onTouchStart={onStart} onMouseDown={onStart} style={{position:"relative",height:36,display:"flex",alignItems:"center",cursor:"pointer",touchAction:"none"}}>
      <div style={{position:"absolute",left:0,right:0,height:6,background:"rgba(255,255,255,0.08)",borderRadius:3}}>
        <div style={{height:"100%",width:`${pct*100}%`,borderRadius:3,background:`linear-gradient(90deg, ${color}88, ${color})`,boxShadow:pct>0?`0 0 12px ${color}33`:"none"}}/>
      </div>
      <div style={{position:"absolute",left:`calc(${pct*100}% - 10px)`,width:20,height:20,borderRadius:"50%",background:color,boxShadow:`0 0 10px ${color}66, 0 2px 4px rgba(0,0,0,0.3)`,border:"2px solid rgba(255,255,255,0.25)",pointerEvents:"none"}}/>
    </div>
  </div>);
}

function TaskRow({chore,done,onToggle,onDelete,showInterval,onView}){const dc={Easy:"#6ee7a0",Medium:"#e8a84c",Hard:"#e86a6a"};return(<div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:done?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.04)",border:`1px solid ${done?"rgba(110,231,160,0.15)":"rgba(255,255,255,0.06)"}`}}>
    <div onClick={onToggle} style={{width:20,height:20,borderRadius:5,flexShrink:0,border:done?`2px solid ${dc[chore.difficulty]}`:"2px solid rgba(255,255,255,0.15)",background:done?dc[chore.difficulty]:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>{done&&<span style={{fontSize:11,color:"#12121e",fontWeight:800}}>✓</span>}</div>
    <div style={{flex:1,minWidth:0,cursor:onView?"pointer":"default"}} onClick={onView||undefined}>
      <div style={{fontWeight:600,fontSize:13,color:done?"rgba(255,255,255,0.3)":"#e0e0e0",textDecoration:done?"line-through":"none"}}>{chore.name}</div>
      <div style={{fontSize:10.5,color:"rgba(255,255,255,0.2)",marginTop:1}}>
        {showInterval&&(chore.type==="one-off"?"One-off":INTERVALS.find(i=>i.value===chore.interval)?.label)}
        {chore.type==="one-off"&&chore.completedDate&&<span> · Done {chore.completedDate}</span>}
      </div>
    </div>
    <span style={{fontSize:9.5,fontWeight:700,color:dc[chore.difficulty],background:`${dc[chore.difficulty]}12`,padding:"2px 7px",borderRadius:4}}>{chore.difficulty.toUpperCase()}</span>
    <span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.25)"}}>+{DIFF_PTS[chore.difficulty]}</span>
    {onDelete&&<button onClick={onDelete} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:"rgba(255,255,255,0.15)",padding:"2px 4px"}}>×</button>}
  </div>);}

function Modal({children,onClose}){
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:200,paddingTop:"env(safe-area-inset-top, 20px)"}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div style={{width:"100%",maxWidth:440,background:"#1e1e30",borderRadius:"0 0 20px 20px",padding:"20px 20px 24px",animation:"sd 0.3s cubic-bezier(.4,0,.2,1)",border:"1px solid rgba(255,255,255,0.08)",borderTop:"none",maxHeight:"80vh",overflowY:"auto",WebkitOverflowScrolling:"touch"}}>{children}</div>
  </div>);
}

// ═══ LOGIN SCREEN ═══
function LoginScreen({ onSignIn, loading }) {
  return (
    <div style={{ minHeight: "100vh", background: "#12121e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', -apple-system, sans-serif", padding: 32, paddingTop: "calc(env(safe-area-inset-top, 20px) + 32px)" }}>
      <div style={{ animation: "bfl 2.8s ease-in-out infinite", marginBottom: 24 }}>
        <BuddyFace mood="content" level={2} hat={false} buddyType="bird" size={120} />
      </div>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: -1, marginBottom: 8 }}>MY BUDDY</h1>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 32, textAlign: "center", lineHeight: 1.5 }}>Track your habits, complete tasks,<br />and watch your Buddy grow.</p>
      <button onClick={onSignIn} disabled={loading} style={{
        padding: "14px 32px", borderRadius: 12, border: "none", cursor: loading ? "wait" : "pointer",
        background: loading ? "rgba(255,255,255,0.1)" : "white", color: "#12121e",
        fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 4px 20px rgba(255,255,255,0.1)", transition: "all 0.2s",
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>
    </div>
  );
}

// ═══ MAIN APP ═══
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signInLoading, setSignInLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const today = TODAY();
  const [goals, setGoals] = useState({ water: 100, sleep: 8, meals: 3 });
  const [log, setLog] = useState({ water: 0, sleep: 0, meals: 0 });
  const [chores, setChores] = useState([]);
  const [choreLog, setChoreLog] = useState({});
  const [xp, setXp] = useState(0);
  const [bdays, setBdays] = useState([]);
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
  const [viewingBd, setViewingBd] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [viewingTask, setViewingTask] = useState(null);
  const [editTask, setEditTask] = useState(null);

  // Debounced save to Firebase
  const saveTimer = useRef(null);
  const save = useCallback((path, data) => {
    if (!user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveData(user.uid, path, data), 300);
  }, [user]);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthChange((u) => { setUser(u); setAuthLoading(false); });
    return unsub;
  }, []);

  // Load data from Firebase when user signs in
  useEffect(() => {
    if (!user) { setDataLoaded(false); return; }
    (async () => {
      const [g, x, c, b, ab, ae] = await Promise.all([
        loadData(user.uid, "goals"),
        loadData(user.uid, "xp"),
        loadData(user.uid, "chores"),
        loadData(user.uid, "birthdays"),
        loadData(user.uid, "activeBuddy"),
        loadData(user.uid, "activeEnv"),
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
      setDataLoaded(true);
    })();
  }, [user, today]);

  // Save to Firebase on changes (only after initial load)
  useEffect(() => { if (dataLoaded && user) save("goals", goals); }, [goals, dataLoaded]);
  useEffect(() => { if (dataLoaded && user) save(`dailyLog/${today}`, log); }, [log, dataLoaded]);
  useEffect(() => { if (dataLoaded && user) { const obj = {}; chores.forEach(c => obj[c.id] = c); save("chores", obj); } }, [chores, dataLoaded]);
  useEffect(() => { if (dataLoaded && user) save(`choreLog/${today}`, choreLog); }, [choreLog, dataLoaded]);
  useEffect(() => { if (dataLoaded && user) save("xp", xp); }, [xp, dataLoaded]);
  useEffect(() => { if (dataLoaded && user) { const obj = {}; bdays.forEach(b => obj[b.id] = b); save("birthdays", obj); } }, [bdays, dataLoaded]);
  useEffect(() => { if (dataLoaded && user) save(`wishes/${today}`, wishes); }, [wishes, dataLoaded]);
  useEffect(() => { if (dataLoaded && user) save("activeBuddy", activeBuddy); }, [activeBuddy, dataLoaded]);
  useEffect(() => { if (dataLoaded && user) save("activeEnv", activeEnv); }, [activeEnv, dataLoaded]);

  const handleSignIn = async () => { setSignInLoading(true); await signInGoogle(); setSignInLoading(false); };

  // Show loading or login
  if (authLoading) return <div style={{ minHeight: "100vh", background: "#12121e", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontFamily: "'Inter', sans-serif", fontSize: 13 }}>Loading...</div>;
  if (!user) return <LoginScreen onSignIn={handleSignIn} loading={signInLoading} />;
  if (!dataLoaded) return <div style={{ minHeight: "100vh", background: "#12121e", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontFamily: "'Inter', sans-serif", fontSize: 13 }}>Loading your data...</div>;

  // ─── Game logic (same as before) ───
  const pcts = [goals.water > 0 ? log.water / goals.water : 1, goals.sleep > 0 ? log.sleep / goals.sleep : 1, goals.meals > 0 ? log.meals / goals.meals : 1];
  const avg = pcts.reduce((a, b) => a + b, 0) / 3;
  const mood = avg >= 1 ? "happy" : avg >= 0.5 ? "content" : "sad";
  const todayBd = getBdToday(bdays);
  const allWished = todayBd.length > 0 && todayBd.every(b => wishes[b.name]);
  const li = getLvl(xp);
  const accent = (BUDDY_TYPES.find(b => b.id === activeBuddy) || BUDDY_TYPES[0]).accent;
  const dailyChores = chores.filter(c => isDaily(c));
  const recurringChores = chores.filter(c => isRecurring(c));
  const oneOffChores = chores.filter(c => c.type === "one-off");
  const dueDailies = dailyChores.filter(c => isDueToday(c, today));
  const dueRecurring = recurringChores.filter(c => isDueToday(c, today));
  const dueOneOffs = oneOffChores.filter(c => isDueToday(c, today));

  const flash = (pts, neg) => { setPopup((neg ? "-" : "+") + pts + " XP"); setTimeout(() => setPopup(null), 1200); };
  const toggleChore = (id) => { const was = choreLog[id]; const ch = chores.find(c => c.id === id); if (!ch) return; const pts = DIFF_PTS[ch.difficulty] || 10; if (was) { setChoreLog(p => { const n = { ...p }; delete n[id]; return n; }); setXp(p => Math.max(0, p - pts)); flash(pts, true); if (ch.type === "one-off") setChores(prev => prev.map(c => c.id === id ? { ...c, completedDate: undefined } : c)); } else { setChoreLog(p => ({ ...p, [id]: true })); setXp(p => p + pts); flash(pts, false); if (ch.type === "one-off") setChores(prev => prev.map(c => c.id === id ? { ...c, completedDate: today } : c)); } };
  const updateCore = (key, nv) => { const ov = log[key], g = goals[key]; if (g > 0 && ov < g && nv >= g) { setXp(p => p + CORE_BONUS); flash(CORE_BONUS, false); } if (g > 0 && ov >= g && nv < g) { setXp(p => Math.max(0, p - CORE_BONUS)); flash(CORE_BONUS, true); } setLog(prev => ({ ...prev, [key]: nv })); };
  const toggleWish = (name) => { setWishes(p => { const n = { ...p }; if (n[name]) delete n[name]; else n[name] = true; return { ...n }; }); };
  const saveChore = () => { if (!nc.name.trim()) return; setChores(p => [...p, { ...nc, id: Date.now().toString(), createdDate: today }]); setNc({ name: "", difficulty: "Easy", interval: "daily", type: "recurring" }); setModal(null); };
  const saveTaskEdit = () => { if (!editTask || !editTask.name.trim()) return; setChores(p => p.map(c => c.id === editTask.id ? { ...c, name: editTask.name, difficulty: editTask.difficulty, interval: editTask.interval, type: editTask.type } : c)); setModal(null); setViewingTask(null); setEditTask(null); };
  const saveBd = () => { if (!nb.name.trim() || !nb.date) return; setBdays(p => [...p, { ...nb, id: Date.now().toString() }]); setNb({ name: "", date: "", notes: "" }); setModal(null); };
  const filteredBdays = bdays.filter(b => { if (bdSearch && !b.name.toLowerCase().includes(bdSearch.toLowerCase())) return false; const d = daysUntil(b.date); if (bdFilter === "week") return d <= 7; if (bdFilter === "month") return d <= 30; return true; }).sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  const sortedTodayBd = [...todayBd].sort((a, b) => (wishes[a.name] ? 1 : 0) - (wishes[b.name] ? 1 : 0));
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const sL = (t) => <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)", marginBottom: 8, letterSpacing: 1.5, textTransform: "uppercase" }}>{t}</div>;
  const tBtn = (id, l, ico) => <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: tab === id ? `1px solid ${accent}44` : "1px solid rgba(255,255,255,0.08)", cursor: "pointer", fontWeight: 700, fontSize: 11, background: tab === id ? `${accent}18` : "rgba(255,255,255,0.05)", color: tab === id ? accent : "rgba(255,255,255,0.5)", letterSpacing: 0.3, transition: "all 0.2s" }}>{ico} {l}</button>;

  return (
    <div style={{ minHeight: "100vh", background: "#12121e", fontFamily: "'Inter', -apple-system, sans-serif", color: "#e0e0e0", maxWidth: 480, margin: "0 auto" }}>
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
      <div style={{ paddingTop: "env(safe-area-inset-top, 20px)", background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)" }}>
        <div style={{ padding: "16px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}18`, border: `1px solid ${accent}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" fill={accent} opacity="0.6"/><circle cx="12" cy="12" r="4" fill={accent}/></svg>
            </div>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: -0.5 }}>MY BUDDY</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 0.8 }}>LV.{li.lv + 1} {li.name}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.12)" }}>·</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{BUDDY_TYPES.find(b => b.id === activeBuddy)?.name}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: `${accent}15`, borderRadius: 10, padding: "6px 14px", fontWeight: 700, fontSize: 12, color: accent, border: `1px solid ${accent}30` }}>{xp} XP</div>
            <button onClick={() => setSettings(!settings)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 15, color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>⚙</button>
          </div>
        </div>

        {/* XP progress bar */}
        <div style={{ padding: "0 20px 4px" }}>
          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${li.prog * 100}%`, background: `linear-gradient(90deg, ${accent}88, ${accent})`, borderRadius: 2, transition: "width 0.5s cubic-bezier(.4,0,.2,1)" }} /></div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", fontWeight: 600, marginTop: 3, textAlign: "right" }}>{li.need > 0 ? `${li.need} XP to next level` : "Max level"}</div>
        </div>

        {/* Tabs — right below header */}
        <div style={{ display: "flex", gap: 5, padding: "4px 20px 12px" }}>{tBtn("home", "Today", "◉")}{tBtn("tasks", "Tasks", "☰")}{tBtn("collection", "Buddies", "◈")}{tBtn("birthdays", "Birthdays", "♡")}</div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "0 20px" }} />
      </div>

      {settings && (
        <div style={{ margin: "4px 20px 8px", padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", animation: "fi 0.2s ease" }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10, letterSpacing: 0.5 }}>DAILY GOALS</div>
          {[{ k: "water", l: "Water (oz)", i: "💧" }, { k: "sleep", l: "Sleep (hrs)", i: "🌙" }, { k: "meals", l: "Meals", i: "🥗" }].map(g => (
            <div key={g.k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.35)", width: 100 }}>{g.i} {g.l}</span>
              <input type="number" value={goals[g.k]} onChange={e => setGoals(p => ({ ...p, [g.k]: Math.max(0, Number(e.target.value)) }))} style={{ width: 60, padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", fontSize: 13, fontWeight: 700, color: "#fff", textAlign: "center", outline: "none" }} />
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 10, color: "rgba(255,255,255,0.12)" }}>Easy=10 · Med=25 · Hard=50 · Core 100%=+10 each</div>
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Signed in as {user.displayName || user.email}</span>
              <button onClick={signOutUser} style={{ fontSize: 10, fontWeight: 700, border: "1px solid rgba(232,106,106,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", background: "transparent", color: "#e86a6a" }}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {sortedTodayBd.length > 0 && (
        <div style={{ margin: "4px 20px 6px", padding: "10px 14px", borderRadius: 10, background: `${accent}08`, border: `1px solid ${accent}18`, animation: "fi 0.4s ease" }}>
          <div style={{ fontWeight: 700, fontSize: 10, color: accent, marginBottom: 6, letterSpacing: 1 }}>🎂 BIRTHDAY TODAY</div>
          {sortedTodayBd.map(b => (<div key={b.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3, opacity: wishes[b.name] ? 0.5 : 1 }}><span style={{ fontSize: 12.5, fontWeight: 600 }}>{b.name}</span><button onClick={() => toggleWish(b.name)} style={{ fontSize: 10.5, fontWeight: 700, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", background: wishes[b.name] ? "rgba(255,255,255,0.06)" : accent, color: wishes[b.name] ? "rgba(255,255,255,0.4)" : "#12121e" }}>{wishes[b.name] ? "↩ Undo" : "Wish HBD"}</button></div>))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", padding: "0", position: "relative", margin: "0 20px 6px", borderRadius: 16, overflow: "hidden", height: 180, background: "#12121e" }}>
        <EnvironmentBg envId={activeEnv} width={440} height={180} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 6 }}>
          <BuddyFace mood={mood} level={li.lv} hat={allWished} buddyType={activeBuddy} size={130} />
        </div>
        {popup && <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 2, fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: popup.startsWith("-") ? "#e86a6a" : accent, textShadow: `0 0 12px ${popup.startsWith("-") ? "rgba(232,106,106,0.4)" : accent + "44"}`, animation: "xpP 1.2s ease forwards", pointerEvents: "none" }}>{popup}</div>}
        <div style={{ position: "absolute", bottom: 6, zIndex: 1, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: mood === "happy" ? accent : mood === "content" ? "rgba(255,255,255,0.4)" : "rgba(232,106,106,0.7)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>{mood === "happy" ? "Happy" : mood === "content" ? "Content" : "Needs care"}</div>
      </div>




      {tab === "home" && (<div style={{ padding: "0 20px 80px", animation: "fi 0.25s ease" }}>{sL("Core Trackers")}<div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}><Tracker label="Hydration" value={log.water} max={goals.water} unit="oz" color="#5baed6" icon="💧" step={1} onChange={v => updateCore("water", v)} /><Tracker label="Sleep" value={log.sleep} max={goals.sleep} unit="hrs" color="#9c7cb8" icon="🌙" step={0.5} onChange={v => updateCore("sleep", v)} /><Tracker label="Healthy Meals" value={log.meals} max={goals.meals} unit="" color="#6ee7a0" icon="🥗" step={1} onChange={v => updateCore("meals", v)} /></div>{dueDailies.length>0&&<>{sL("Daily Tasks")}<div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16}}>{dueDailies.map(c=><TaskRow key={c.id} chore={c} done={!!choreLog[c.id]} onToggle={()=>toggleChore(c.id)} showInterval={false}/>)}</div></>}{dueRecurring.length>0&&<>{sL("Recurring — Due Today")}<div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16}}>{dueRecurring.map(c=><TaskRow key={c.id} chore={c} done={!!choreLog[c.id]} onToggle={()=>toggleChore(c.id)} showInterval/>)}</div></>}{dueOneOffs.length>0&&<>{sL("One-off Tasks")}<div style={{display:"flex",flexDirection:"column",gap:5}}>{dueOneOffs.map(c=><TaskRow key={c.id} chore={c} done={!!choreLog[c.id]} onToggle={()=>toggleChore(c.id)} showInterval={false}/>)}</div></>}{dueDailies.length===0&&dueRecurring.length===0&&dueOneOffs.length===0&&<div style={{textAlign:"center",padding:28,color:"rgba(255,255,255,0.12)",fontSize:12}}>No tasks due today</div>}</div>)}

      {tab === "tasks" && (<div style={{ padding: "0 20px 80px", animation: "fi 0.25s ease" }}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><span style={{fontWeight:700,fontSize:14,color:"#fff"}}>Task Manager</span><button onClick={()=>{setNc({name:"",difficulty:"Easy",interval:"daily",type:"recurring"});setModal("chore")}} style={{fontWeight:700,fontSize:11,border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",background:accent,color:"#12121e"}}>+ New Task</button></div>{sL("Daily")}<div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16}}>{dailyChores.map(c=><TaskRow key={c.id} chore={c} done={!!choreLog[c.id]} onToggle={()=>toggleChore(c.id)} onDelete={()=>setChores(p=>p.filter(x=>x.id!==c.id))} onView={()=>{setViewingTask(c);setEditTask({...c});setModal("editTask")}} showInterval={false}/>)}{dailyChores.length===0&&<div style={{fontSize:11,color:"rgba(255,255,255,0.1)",textAlign:"center",padding:12}}>No daily tasks</div>}</div>{sL("Recurring")}<div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16}}>{recurringChores.map(c=><TaskRow key={c.id} chore={c} done={!!choreLog[c.id]} onToggle={()=>toggleChore(c.id)} onDelete={()=>setChores(p=>p.filter(x=>x.id!==c.id))} onView={()=>{setViewingTask(c);setEditTask({...c});setModal("editTask")}} showInterval/>)}{recurringChores.length===0&&<div style={{fontSize:11,color:"rgba(255,255,255,0.1)",textAlign:"center",padding:12}}>No recurring tasks</div>}</div>{sL("One-off")}<div style={{display:"flex",flexDirection:"column",gap:5}}>{oneOffChores.map(c=><TaskRow key={c.id} chore={c} done={!!choreLog[c.id]||!!c.completedDate} onToggle={()=>toggleChore(c.id)} onDelete={()=>setChores(p=>p.filter(x=>x.id!==c.id))} onView={()=>{setViewingTask(c);setEditTask({...c});setModal("editTask")}} showInterval={false}/>)}{oneOffChores.length===0&&<div style={{fontSize:11,color:"rgba(255,255,255,0.1)",textAlign:"center",padding:12}}>No one-off tasks</div>}</div></div>)}

      {tab === "collection" && (<div style={{ padding: "0 20px 80px", animation: "fi 0.25s ease" }}>{sL("Choose Your Buddy")}<p style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginBottom:14,lineHeight:1.5}}>Each buddy evolves through 5 stages as you level up.</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:24}}>{BUDDY_TYPES.map(bt=>{const active=activeBuddy===bt.id;return(<div key={bt.id} onClick={()=>setActiveBuddy(bt.id)} style={{padding:"14px 10px 12px",borderRadius:12,cursor:"pointer",background:active?`${bt.accent}0c`:"rgba(255,255,255,0.02)",border:`1.5px solid ${active?bt.accent+"44":"rgba(255,255,255,0.05)"}`}}><div style={{display:"flex",justifyContent:"center",marginBottom:8}}><BuddyFace mood="happy" level={4} hat={false} buddyType={bt.id} size={80}/></div><div style={{textAlign:"center"}}><div style={{fontWeight:700,fontSize:13,color:active?bt.accent:"#e0e0e0"}}>{bt.name}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.2)",marginTop:2}}>{bt.desc}</div>{active&&<div style={{fontSize:9,fontWeight:700,color:bt.accent,marginTop:4,letterSpacing:1}}>ACTIVE</div>}</div></div>)})}</div>

        {sL("Environment")}
        <p style={{fontSize:11,color:"rgba(255,255,255,0.2)",marginBottom:14,lineHeight:1.5}}>Pick a scene for your buddy to hang out in.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
          {ENVIRONMENTS.map(env => {
            const active = activeEnv === env.id;
            return (
              <div key={env.id} onClick={() => setActiveEnv(env.id)} style={{
                padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center",
                background: active ? `${accent}10` : "rgba(255,255,255,0.02)",
                border: `1.5px solid ${active ? accent + "44" : "rgba(255,255,255,0.05)"}`,
                transition: "all 0.2s",
              }}>
                <div style={{ position: "relative", width: "100%", height: 50, borderRadius: 6, overflow: "hidden", marginBottom: 6 }}>
                  <EnvironmentBg envId={env.id} width={120} height={50} />
                </div>
                <div style={{ fontSize: 14, marginBottom: 2 }}>{env.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 10.5, color: active ? accent : "rgba(255,255,255,0.5)" }}>{env.name}</div>
                {active && <div style={{ fontSize: 8, fontWeight: 700, color: accent, marginTop: 2, letterSpacing: 1 }}>ACTIVE</div>}
              </div>
            );
          })}
        </div>
      </div>)}

      {tab === "birthdays" && (<div style={{ padding: "0 20px 80px", animation: "fi 0.25s ease" }}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><span style={{fontWeight:700,fontSize:14,color:"#fff"}}>Birthdays</span><button onClick={()=>{setNb({name:"",date:"",notes:""});setModal("birthday")}} style={{fontWeight:700,fontSize:11,border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer",background:"#e86a8a",color:"#fff"}}>+ Add</button></div><input placeholder="Search names..." value={bdSearch} onChange={e=>setBdSearch(e.target.value)} style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.04)",fontSize:12.5,color:"#fff",marginBottom:10,outline:"none"}}/><div style={{display:"flex",gap:4,marginBottom:14}}>{[{v:"all",l:"All"},{v:"week",l:"This Week"},{v:"month",l:"Next 30 Days"}].map(f=>(<button key={f.v} onClick={()=>setBdFilter(f.v)} style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${bdFilter===f.v?accent+"44":"rgba(255,255,255,0.06)"}`,cursor:"pointer",fontWeight:600,fontSize:11,background:bdFilter===f.v?`${accent}12`:"transparent",color:bdFilter===f.v?accent:"rgba(255,255,255,0.3)"}}>{f.l}</button>))}</div><div style={{display:"flex",flexDirection:"column",gap:5}}>{filteredBdays.map(b=>{const bd=new Date(b.date+"T00:00:00"),d=daysUntil(b.date),isTd=d===0;return(<div key={b.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:isTd?`${accent}08`:"rgba(255,255,255,0.03)",border:`1px solid ${isTd?accent+"20":"rgba(255,255,255,0.05)"}`,cursor:"pointer"}} onClick={()=>{setViewingBd(b);setEditNotes(b.notes||"");setModal("viewBd")}}><div style={{width:34,height:34,borderRadius:8,background:isTd?`${accent}20`:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>🎂</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:13}}>{b.name}</div><div style={{fontSize:10.5,color:"rgba(255,255,255,0.2)"}}>{months[bd.getMonth()]} {bd.getDate()}{b.notes?" · 📝":""}</div></div><div style={{textAlign:"right",flexShrink:0}}>{isTd?<button onClick={e=>{e.stopPropagation();toggleWish(b.name)}} style={{fontSize:10,fontWeight:700,border:"none",borderRadius:6,padding:"4px 10px",cursor:"pointer",background:wishes[b.name]?"rgba(255,255,255,0.06)":accent,color:wishes[b.name]?"rgba(255,255,255,0.4)":"#12121e"}}>{wishes[b.name]?"↩ Undo":"Wish"}</button>:<span style={{fontSize:10.5,color:"rgba(255,255,255,0.15)",fontWeight:600}}>{d===1?"Tomorrow":`${d}d`}</span>}</div></div>)})}{filteredBdays.length===0&&<div style={{textAlign:"center",padding:24,color:"rgba(255,255,255,0.1)",fontSize:12}}>{bdSearch?"No matches":"No birthdays saved"}</div>}</div><div style={{textAlign:"center",marginTop:12,fontSize:10,color:"rgba(255,255,255,0.1)"}}>{bdays.length} total</div></div>)}

      {/* Modals */}
      {modal === "chore" && (<Modal onClose={() => setModal(null)}><div style={{fontFamily:"'Space Grotesk'",fontSize:16,fontWeight:700,color:"#fff",marginBottom:16}}>New Task</div><input placeholder="Task name..." value={nc.name} onChange={e=>setNc(p=>({...p,name:e.target.value}))} autoFocus style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",fontSize:13,fontWeight:600,color:"#fff",marginBottom:12,outline:"none"}}/><div style={{display:"flex",gap:4,marginBottom:12}}>{[{t:"recurring",l:"♻ Recurring"},{t:"one-off",l:"◎ One-off"}].map(x=>(<button key={x.t} onClick={()=>setNc(p=>({...p,type:x.t}))} style={{flex:1,padding:"8px 0",borderRadius:8,border:`1px solid ${nc.type===x.t?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.06)"}`,cursor:"pointer",fontWeight:700,fontSize:11.5,background:nc.type===x.t?"rgba(255,255,255,0.08)":"transparent",color:nc.type===x.t?"#fff":"rgba(255,255,255,0.3)"}}>{x.l}</button>))}</div>{nc.type==="recurring"&&<div style={{marginBottom:12}}><div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.2)",marginBottom:6,letterSpacing:1}}>FREQUENCY</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{INTERVALS.map(i=><button key={i.value} onClick={()=>setNc(p=>({...p,interval:i.value}))} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${nc.interval===i.value?accent+"44":"rgba(255,255,255,0.06)"}`,cursor:"pointer",fontWeight:600,fontSize:11,background:nc.interval===i.value?`${accent}15`:"transparent",color:nc.interval===i.value?accent:"rgba(255,255,255,0.3)"}}>{i.label}</button>)}</div></div>}<div style={{marginBottom:16}}><div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.2)",marginBottom:6,letterSpacing:1}}>DIFFICULTY</div><div style={{display:"flex",gap:6}}>{[{d:"Easy",c:"#6ee7a0"},{d:"Medium",c:"#e8a84c"},{d:"Hard",c:"#e86a6a"}].map(x=><button key={x.d} onClick={()=>setNc(p=>({...p,difficulty:x.d}))} style={{flex:1,padding:"10px 0",borderRadius:8,border:`1.5px solid ${nc.difficulty===x.d?x.c+"66":"rgba(255,255,255,0.06)"}`,cursor:"pointer",fontWeight:700,fontSize:12,background:nc.difficulty===x.d?`${x.c}12`:"transparent",color:x.c}}>{x.d}<div style={{fontSize:9,fontWeight:600,marginTop:2,opacity:0.5}}>+{DIFF_PTS[x.d]} XP</div></button>)}</div></div><div style={{display:"flex",gap:8}}><button onClick={()=>setModal(null)} style={{flex:1,padding:"11px 0",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"transparent",cursor:"pointer",fontWeight:700,fontSize:12,color:"rgba(255,255,255,0.3)"}}>Cancel</button><button onClick={saveChore} style={{flex:2,padding:"11px 0",borderRadius:10,border:"none",background:accent,cursor:"pointer",fontWeight:700,fontSize:12,color:"#12121e"}}>Add Task</button></div></Modal>)}

      {modal === "birthday" && (<Modal onClose={() => setModal(null)}><div style={{fontFamily:"'Space Grotesk'",fontSize:16,fontWeight:700,color:"#fff",marginBottom:16}}>Add Birthday</div><input placeholder="Name..." value={nb.name} onChange={e=>setNb(p=>({...p,name:e.target.value}))} autoFocus style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",fontSize:13,fontWeight:600,color:"#fff",marginBottom:10,outline:"none"}}/><input type="date" value={nb.date} onChange={e=>setNb(p=>({...p,date:e.target.value}))} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",fontSize:13,fontWeight:600,color:"#fff",marginBottom:10,outline:"none",colorScheme:"dark"}}/><textarea placeholder="Notes (gift ideas, interests...)..." value={nb.notes} onChange={e=>setNb(p=>({...p,notes:e.target.value}))} rows={3} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",fontSize:12.5,color:"#fff",marginBottom:16,outline:"none",lineHeight:1.5}}/><div style={{display:"flex",gap:8}}><button onClick={()=>setModal(null)} style={{flex:1,padding:"11px 0",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"transparent",cursor:"pointer",fontWeight:700,fontSize:12,color:"rgba(255,255,255,0.3)"}}>Cancel</button><button onClick={saveBd} style={{flex:2,padding:"11px 0",borderRadius:10,border:"none",background:"#e86a8a",cursor:"pointer",fontWeight:700,fontSize:12,color:"#fff"}}>Save</button></div></Modal>)}

      {modal === "viewBd" && viewingBd && (<Modal onClose={() => {setModal(null);setViewingBd(null)}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}><div><div style={{fontFamily:"'Space Grotesk'",fontSize:18,fontWeight:700,color:"#fff"}}>{viewingBd.name}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:2}}>{months[new Date(viewingBd.date+"T00:00:00").getMonth()]} {new Date(viewingBd.date+"T00:00:00").getDate()} · {daysUntil(viewingBd.date)===0?"Today!":`${daysUntil(viewingBd.date)}d away`}</div></div><button onClick={()=>{setBdays(p=>p.filter(x=>x.id!==viewingBd.id));setModal(null);setViewingBd(null)}} style={{fontSize:10,fontWeight:700,border:"1px solid rgba(232,106,106,0.3)",borderRadius:6,padding:"4px 10px",cursor:"pointer",background:"transparent",color:"#e86a6a"}}>Delete</button></div><div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.2)",marginBottom:6,letterSpacing:1}}>NOTES</div><textarea value={editNotes} onChange={e=>setEditNotes(e.target.value)} rows={5} placeholder="Gift ideas, relationship notes..." style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",fontSize:12.5,color:"#fff",outline:"none",lineHeight:1.6,marginBottom:14}}/><div style={{display:"flex",gap:8}}><button onClick={()=>{setModal(null);setViewingBd(null)}} style={{flex:1,padding:"11px 0",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"transparent",cursor:"pointer",fontWeight:700,fontSize:12,color:"rgba(255,255,255,0.3)"}}>Close</button><button onClick={()=>{setBdays(p=>p.map(b=>b.id===viewingBd.id?{...b,notes:editNotes}:b));setModal(null);setViewingBd(null)}} style={{flex:2,padding:"11px 0",borderRadius:10,border:"none",background:accent,cursor:"pointer",fontWeight:700,fontSize:12,color:"#12121e"}}>Save Notes</button></div></Modal>)}

      {modal === "editTask" && editTask && (<Modal onClose={() => {setModal(null);setViewingTask(null);setEditTask(null)}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <div style={{fontFamily:"'Space Grotesk'",fontSize:16,fontWeight:700,color:"#fff"}}>Edit Task</div>
          <button onClick={()=>{setChores(p=>p.filter(x=>x.id!==editTask.id));setModal(null);setViewingTask(null);setEditTask(null)}} style={{fontSize:10,fontWeight:700,border:"1px solid rgba(232,106,106,0.3)",borderRadius:6,padding:"4px 10px",cursor:"pointer",background:"transparent",color:"#e86a6a"}}>Delete</button>
        </div>
        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.2)",marginBottom:6,letterSpacing:1}}>TASK NAME</div>
        <input value={editTask.name} onChange={e=>setEditTask(p=>({...p,name:e.target.value}))} style={{width:"100%",padding:"10px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.04)",fontSize:13,fontWeight:600,color:"#fff",marginBottom:12,outline:"none"}}/>
        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.2)",marginBottom:6,letterSpacing:1}}>TYPE</div>
        <div style={{display:"flex",gap:4,marginBottom:12}}>
          {[{t:"recurring",l:"♻ Recurring"},{t:"one-off",l:"◎ One-off"}].map(x=>(
            <button key={x.t} onClick={()=>setEditTask(p=>({...p,type:x.t}))} style={{flex:1,padding:"8px 0",borderRadius:8,border:`1px solid ${editTask.type===x.t?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.06)"}`,cursor:"pointer",fontWeight:700,fontSize:11.5,background:editTask.type===x.t?"rgba(255,255,255,0.08)":"transparent",color:editTask.type===x.t?"#fff":"rgba(255,255,255,0.3)"}}>{x.l}</button>
          ))}
        </div>
        {editTask.type==="recurring"&&<div style={{marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.2)",marginBottom:6,letterSpacing:1}}>FREQUENCY</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {INTERVALS.map(i=><button key={i.value} onClick={()=>setEditTask(p=>({...p,interval:i.value}))} style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${editTask.interval===i.value?accent+"44":"rgba(255,255,255,0.06)"}`,cursor:"pointer",fontWeight:600,fontSize:11,background:editTask.interval===i.value?`${accent}15`:"transparent",color:editTask.interval===i.value?accent:"rgba(255,255,255,0.3)"}}>{i.label}</button>)}
          </div>
        </div>}
        <div style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.2)",marginBottom:6,letterSpacing:1}}>DIFFICULTY</div>
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {[{d:"Easy",c:"#6ee7a0"},{d:"Medium",c:"#e8a84c"},{d:"Hard",c:"#e86a6a"}].map(x=>(
            <button key={x.d} onClick={()=>setEditTask(p=>({...p,difficulty:x.d}))} style={{flex:1,padding:"10px 0",borderRadius:8,border:`1.5px solid ${editTask.difficulty===x.d?x.c+"66":"rgba(255,255,255,0.06)"}`,cursor:"pointer",fontWeight:700,fontSize:12,background:editTask.difficulty===x.d?`${x.c}12`:"transparent",color:x.c}}>{x.d}<div style={{fontSize:9,fontWeight:600,marginTop:2,opacity:0.5}}>+{DIFF_PTS[x.d]} XP</div></button>
          ))}
        </div>
        {editTask.type==="one-off"&&editTask.completedDate&&<div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginBottom:12}}>Completed: {editTask.completedDate}</div>}
        <div style={{fontSize:10,color:"rgba(255,255,255,0.12)",marginBottom:14}}>Created: {editTask.createdDate}</div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{setModal(null);setViewingTask(null);setEditTask(null)}} style={{flex:1,padding:"11px 0",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)",background:"transparent",cursor:"pointer",fontWeight:700,fontSize:12,color:"rgba(255,255,255,0.3)"}}>Cancel</button>
          <button onClick={saveTaskEdit} style={{flex:2,padding:"11px 0",borderRadius:10,border:"none",background:accent,cursor:"pointer",fontWeight:700,fontSize:12,color:"#12121e"}}>Save Changes</button>
        </div>
      </Modal>)}
    </div>
  );
}