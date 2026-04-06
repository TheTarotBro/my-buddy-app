import { useState, useEffect, useRef, useCallback } from "react";
import { signInGoogle, signOutUser, onAuthChange, saveData, loadData } from "./firebase.js";

const TODAY = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const IS_PREVIEW = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "1";
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const ZODIAC = [
  { sign: "Aries", symbol: "♈", start: [3,21], end: [4,19], color: "#e84040", traits: "Bold, ambitious, and energetic. Natural leaders who love a challenge.", likes: "Comfortable clothes, taking on leadership, individual sports, physical challenges", dislikes: "Inactivity, delays, work that doesn't use their talents" },
  { sign: "Taurus", symbol: "♉", start: [4,20], end: [5,20], color: "#e87040", traits: "Reliable, patient, and devoted. Lovers of beauty and comfort.", likes: "Gardening, cooking, good music, romance, quality craftsmanship", dislikes: "Sudden changes, complications, insecurity, synthetic fabrics" },
  { sign: "Gemini", symbol: "♊", start: [5,21], end: [6,20], color: "#e8a840", traits: "Curious, adaptable, and expressive. Quick-witted social butterflies.", likes: "Music, books, magazines, chats with nearly anyone, short trips", dislikes: "Being alone, being confined, repetition and routine" },
  { sign: "Cancer", symbol: "♋", start: [6,21], end: [7,22], color: "#c8d840", traits: "Intuitive, sentimental, and protective. Deeply caring and loyal.", likes: "Art, home-based hobbies, helping loved ones, a good meal with friends", dislikes: "Strangers, criticism of their loved ones, revealing personal life" },
  { sign: "Leo", symbol: "♌", start: [7,23], end: [8,22], color: "#60c848", traits: "Creative, passionate, and generous. Warm-hearted natural performers.", likes: "Theater, vacations, being admired, fun with friends, bright colors", dislikes: "Being ignored, facing reality, not being treated like royalty" },
  { sign: "Virgo", symbol: "♍", start: [8,23], end: [9,22], color: "#40b8a0", traits: "Analytical, practical, and hardworking. Detail-oriented perfectionists.", likes: "Animals, healthy food, books, nature, cleanliness and order", dislikes: "Rudeness, asking for help, being the center of attention" },
  { sign: "Libra", symbol: "♎", start: [9,23], end: [10,22], color: "#40a0d8", traits: "Diplomatic, gracious, and fair-minded. Seekers of balance and harmony.", likes: "Harmony, gentleness, sharing with others, the outdoors", dislikes: "Violence, injustice, loudmouths, conformity" },
  { sign: "Scorpio", symbol: "♏", start: [10,23], end: [11,21], color: "#4878d8", traits: "Resourceful, powerful, and passionate. Intense and magnetic.", likes: "Truth, facts, being right, longtime friends, teasing, grand passion", dislikes: "Dishonesty, revealing secrets, superficiality, small talk" },
  { sign: "Sagittarius", symbol: "♐", start: [11,22], end: [12,21], color: "#6858c8", traits: "Adventurous, optimistic, and freedom-loving. Philosophical wanderers.", likes: "Freedom, travel, philosophy, being outdoors, open-minded people", dislikes: "Clingy people, being constrained, off-the-wall theories, details" },
  { sign: "Capricorn", symbol: "♑", start: [12,22], end: [1,19], color: "#8848b8", traits: "Disciplined, responsible, and ambitious. Masters of self-control.", likes: "Family, tradition, quality craftsmanship, understated status", dislikes: "Almost everything at some point, public displays of emotion" },
  { sign: "Aquarius", symbol: "♒", start: [1,20], end: [2,18], color: "#a840a8", traits: "Progressive, original, and independent. Humanitarian visionaries.", likes: "Fun with friends, intellectual conversation, fighting for causes", dislikes: "Limitations, broken promises, being lonely, dull or boring situations" },
  { sign: "Pisces", symbol: "♓", start: [2,19], end: [3,20], color: "#c840a0", traits: "Compassionate, artistic, and intuitive. Gentle dreamers and healers.", likes: "Being alone, music, romance, visual media, swimming, spiritual themes", dislikes: "Know-it-alls, being criticized, the past coming back to haunt, cruelty" },
];

function getZodiacSign(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return null;
  const m = d.getMonth() + 1, day = d.getDate();
  return ZODIAC.find(z => {
    const [sm, sd] = z.start, [em, ed] = z.end;
    if (sm <= em) return (m > sm || (m === sm && day >= sd)) && (m < em || (m === em && day <= ed));
    return (m > sm || (m === sm && day >= sd)) || (m < em || (m === em && day <= ed));
  }) || ZODIAC[0];
}

function getZodiacDaysUntilStart(z) {
  const now = new Date(), year = now.getFullYear(), [sm, sd] = z.start;
  let target = new Date(year, sm - 1, sd);
  if (target < now) target = new Date(year + 1, sm - 1, sd);
  return Math.round((target - now) / 86400000);
}

const REL_LABELS = ["Spouse","Partner","Parent","Child","Sibling","Friend","Coworker","Cousin","Other"];
const REL_REVERSE = { Spouse:"Spouse", Partner:"Partner", Parent:"Child", Child:"Parent", Sibling:"Sibling", Friend:"Friend", Coworker:"Coworker", Cousin:"Cousin", Other:"Other" };

function getBdToday(ppl) { const t = new Date(), m = t.getMonth(), d = t.getDate(); return ppl.filter(b => { if (!b.date) return false; const x = new Date(b.date + "T00:00:00"); return !isNaN(x) && x.getMonth() === m && x.getDate() === d; }); }
function daysUntil(ds) { if (!ds) return Infinity; const now = new Date(), bd = new Date(ds + "T00:00:00"); if (isNaN(bd)) return Infinity; bd.setFullYear(now.getFullYear()); const td = new Date(now.getFullYear(), now.getMonth(), now.getDate()); if (bd < td) bd.setFullYear(now.getFullYear() + 1); return Math.round((bd - td) / 86400000); }

function Modal({children,onClose}){
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:200,paddingTop:"env(safe-area-inset-top, 20px)"}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div style={{background:"#f5f0ea",borderRadius:16,padding:"20px 18px",width:"92%",maxWidth:400,maxHeight:"85vh",overflow:"auto",animation:"sd 0.25s ease",marginTop:16,WebkitOverflowScrolling:"touch"}}>{children}</div>
  </div>);
}

function LoginScreen({ onSignIn, loading }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f0ea", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', -apple-system, sans-serif", padding: 32, paddingTop: "calc(env(safe-area-inset-top, 20px) + 32px)" }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: "#3a2e24", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 28, color: "#f5f0ea" }}>●</span>
      </div>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: "#3a2e24", letterSpacing: -1, marginBottom: 8 }}>MY CIRCLE</h1>
      <p style={{ fontSize: 13, color: "#8a7a6a", marginBottom: 32, textAlign: "center", lineHeight: 1.5 }}>Your personal CRM.<br/>Remember everyone who matters.</p>
      <button onClick={onSignIn} disabled={loading} style={{ padding: "14px 32px", borderRadius: 12, border: "none", cursor: loading ? "wait" : "pointer", background: "#3a2e24", color: "#f5f0ea", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(58,46,36,0.15)" }}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#f5f0ea" opacity="0.7"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#f5f0ea" opacity="0.7"/><path d="M5.84 14.09A6.95 6.95 0 0 1 5.48 12c0-.72.12-1.42.36-2.09V7.07H2.18A11.03 11.03 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#f5f0ea" opacity="0.7"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#f5f0ea" opacity="0.7"/></svg>
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>
    </div>
  );
}

const accent = "#5A7A6A";

export default function App() {
  const [user, setUser] = useState(IS_PREVIEW ? { uid: "preview", displayName: "Preview User" } : null);
  const [authLoading, setAuthLoading] = useState(!IS_PREVIEW);
  const [signInLoading, setSignInLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(IS_PREVIEW);
  const [today, setToday] = useState(TODAY());

  useEffect(() => {
    const check = () => { const t = TODAY(); if (t !== today) setToday(t); };
    const iv = setInterval(check, 30000);
    const onVis = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
  }, [today]);

  const [people, setPeople] = useState(IS_PREVIEW ? [
    { id: "1", name: "Sarah Connor", date: "1995-04-15", notes: "Loves hiking", interests: ["outdoors","sci-fi"], gifts: [], events: [], relationships: [] },
    { id: "2", name: "John Doe", date: "1990-07-22", notes: "", interests: [], gifts: [], events: [], relationships: [] },
    { id: "3", name: "Jane Smith", date: "", notes: "Met at conference", interests: ["design"], gifts: [], events: [], relationships: [] },
  ] : []);
  const [wishes, setWishes] = useState({});
  const [tab, setTab] = useState("people");
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [nb, setNb] = useState({ name: "", date: "", notes: "" });
  const [settings, setSettings] = useState(false);
  const [bdFilter, setBdFilter] = useState("all");
  const [bdSearch, setBdSearch] = useState("");
  const [viewingPerson, setViewingPerson] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [profileTab, setProfileTab] = useState("info");
  const [linkSearch, setLinkSearch] = useState("");
  const [linkLabel, setLinkLabel] = useState("Friend");
  const [newGift, setNewGift] = useState("");
  const [newEvent, setNewEvent] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [viewingZodiac, setViewingZodiac] = useState(null);

  const saveTimers = useRef({});
  const save = useCallback((path, data, immediate) => {
    if (!user || IS_PREVIEW) return;
    if (immediate) { saveData(user.uid, path, data); return; }
    if (saveTimers.current[path]) clearTimeout(saveTimers.current[path]);
    saveTimers.current[path] = setTimeout(() => saveData(user.uid, path, data), 300);
  }, [user]);

  useEffect(() => { if (IS_PREVIEW) return; const unsub = onAuthChange((u) => { setUser(u); setAuthLoading(false); }); return unsub; }, []);

  useEffect(() => {
    if (IS_PREVIEW) return;
    if (!user) { setDataLoaded(false); return; }
    (async () => {
      const [b, w] = await Promise.all([loadData(user.uid, "birthdays"), loadData(user.uid, `wishes/${today}`)]);
      if (b) setPeople(Object.values(b));
      if (w) setWishes(w);
      setDataLoaded(true);
    })();
  }, [user, today]);

  useEffect(() => { if (dataLoaded && !IS_PREVIEW) { const obj = {}; people.forEach(p => obj[p.id] = p); save("birthdays", obj, true); } }, [people, dataLoaded]);
  useEffect(() => { if (dataLoaded && !IS_PREVIEW) save(`wishes/${today}`, wishes, true); }, [wishes, dataLoaded]);

  const handleSignIn = async () => { setSignInLoading(true); await signInGoogle(); setSignInLoading(false); };

  if (authLoading) return <div style={{ minHeight: "100vh", background: "#f5f0ea", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a7a6a", fontFamily: "'Inter', sans-serif", fontSize: 13 }}>Loading...</div>;
  if (!user) return <LoginScreen onSignIn={handleSignIn} loading={signInLoading} />;
  if (!dataLoaded) return <div style={{ minHeight: "100vh", background: "#f5f0ea", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a7a6a", fontFamily: "'Inter', sans-serif", fontSize: 13 }}>Loading your data...</div>;

  const todayBd = getBdToday(people);
  const sortedTodayBd = [...todayBd].sort((a, b) => (wishes[a.name] ? 1 : 0) - (wishes[b.name] ? 1 : 0));
  const toggleWish = (name) => setWishes(p => ({ ...p, [name]: !p[name] }));
  const savePerson = () => { if (!nb.name.trim()) return; setPeople(p => [...p, { ...nb, id: Date.now().toString(), interests: [], gifts: [], events: [], relationships: [] }]); setNb({ name: "", date: "", notes: "" }); setModal(null); };
  const openPerson = (p) => { setViewingPerson(p); setEditNotes(p.notes || ""); setProfileTab("info"); setNewGift(""); setNewEvent(""); setNewEventDate(TODAY()); setNewInterest(""); setLinkSearch(""); setModal("viewPerson"); };

  const upcoming = people.filter(p => p.date && daysUntil(p.date) > 0 && daysUntil(p.date) < Infinity).sort((a, b) => daysUntil(a.date) - daysUntil(b.date)).slice(0, 3);
  const filteredPeople = people.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
  const filteredBdays = people.filter(b => { if (bdSearch && !b.name.toLowerCase().includes(bdSearch.toLowerCase())) return false; const d = daysUntil(b.date); if (bdFilter === "week") return d <= 7; if (bdFilter === "month") return d <= 30; return true; }).sort((a, b) => daysUntil(a.date) - daysUntil(b.date));

  const sL = (t) => <div style={{ fontSize: 10, fontWeight: 700, color: "#b4a494", letterSpacing: 1.2, marginBottom: 8, marginTop: 4 }}>{t}</div>;
  const letterGroups = {};
  filteredPeople.forEach(p => { const letter = p.name[0]?.toUpperCase() || "#"; if (!letterGroups[letter]) letterGroups[letter] = []; letterGroups[letter].push(p); });

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0ea", fontFamily: "'Inter', -apple-system, sans-serif", color: "#3a2e24", maxWidth: 480, margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sd{from{opacity:0;transform:translateY(-40px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;margin:0}input,select,button,textarea{font-family:'Inter',-apple-system,sans-serif}
        button:active{transform:scale(0.97)!important}
        ::-webkit-scrollbar{width:0}textarea{resize:vertical}
      `}</style>

      <div style={{ paddingTop: "env(safe-area-inset-top, 20px)", background: "linear-gradient(180deg, rgba(90,74,62,0.04) 0%, transparent 100%)" }}>
        <div style={{ padding: "16px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}22`, border: `1px solid ${accent}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 16, color: accent }}>●</span>
            </div>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#3a2e24", letterSpacing: -0.5 }}>MY CIRCLE</h1>
              <div style={{ fontSize: 10, color: "#8a7a6a", fontWeight: 500 }}>{people.length} {people.length === 1 ? "person" : "people"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => { setNb({ name: "", date: "", notes: "" }); setModal("addPerson"); }} style={{ background: accent, border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 18, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            <button onClick={() => setSettings(!settings)} style={{ background: "rgba(90,74,62,0.06)", border: "1px solid rgba(90,74,62,0.1)", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 15, color: "#8a7a6a", display: "flex", alignItems: "center", justifyContent: "center" }}>⚙</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, padding: "4px 20px 12px" }}>
          {[{ id: "people", l: "People", ico: "◉" }, { id: "birthdays", l: "Birthdays", ico: "♡" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: tab === t.id ? `1px solid ${accent}44` : "1px solid rgba(90,74,62,0.1)", cursor: "pointer", fontWeight: 700, fontSize: 11, background: tab === t.id ? `${accent}18` : "rgba(90,74,62,0.04)", color: tab === t.id ? accent : "#6b5c4d", letterSpacing: 0.3 }}>{t.ico} {t.l}</button>
          ))}
        </div>
        <div style={{ height: 1, background: "rgba(90,74,62,0.04)", margin: "0 20px" }} />
      </div>

      {settings && (<div style={{ margin: "4px 20px 8px", padding: 14, background: "rgba(90,74,62,0.03)", borderRadius: 12, border: "1px solid rgba(90,74,62,0.08)", animation: "fi 0.2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#8a7a6a" }}>Signed in as {user.displayName || user.email}</span>
          <button onClick={signOutUser} style={{ fontSize: 10, fontWeight: 700, border: "1px solid rgba(232,106,106,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", background: "transparent", color: "#e86a6a" }}>Sign Out</button>
        </div>
      </div>)}

      {sortedTodayBd.length > 0 && (<div style={{ margin: "4px 20px 6px", padding: "10px 14px", borderRadius: 10, background: "#e86a8a08", border: "1px solid #e86a8a18", animation: "fi 0.4s ease" }}>
        <div style={{ fontWeight: 700, fontSize: 10, color: "#e86a8a", marginBottom: 6, letterSpacing: 1 }}>🎂 BIRTHDAY TODAY</div>
        {sortedTodayBd.map(b => (<div key={b.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3, opacity: wishes[b.name] ? 0.5 : 1 }}><span style={{ fontSize: 12.5, fontWeight: 600, cursor: "pointer" }} onClick={() => openPerson(b)}>{b.name}</span><button onClick={() => toggleWish(b.name)} style={{ fontSize: 10.5, fontWeight: 700, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", background: wishes[b.name] ? "rgba(90,74,62,0.08)" : "#e86a8a", color: wishes[b.name] ? "#8a7a6a" : "white" }}>{wishes[b.name] ? "↩ Undo" : "Wish HBD"}</button></div>))}
      </div>)}

      {tab === "people" && (<div style={{ padding: "0 20px 80px", animation: "fi 0.25s ease" }}>
        <input placeholder="Search people..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(90,74,62,0.1)", background: "rgba(90,74,62,0.04)", fontSize: 13, color: "#3a2e24", marginBottom: 14, marginTop: 8, outline: "none" }} />

        {!search && upcoming.length > 0 && (<div style={{ marginBottom: 16, padding: "14px 16px", borderRadius: 12, background: "rgba(90,74,62,0.03)", border: "1px solid rgba(90,74,62,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#b4a494", letterSpacing: 1.2 }}>UPCOMING BIRTHDAYS</span>
            <button onClick={() => setTab("birthdays")} style={{ fontSize: 10, fontWeight: 700, color: accent, background: "none", border: "none", cursor: "pointer" }}>View all →</button>
          </div>
          {upcoming.map(p => { const z = getZodiacSign(p.date), d = daysUntil(p.date), bd = new Date(p.date + "T00:00:00"); return (
            <div key={p.id} onClick={() => openPerson(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer", borderTop: "1px solid rgba(90,74,62,0.04)" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: z ? `${z.color}15` : "rgba(90,74,62,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 14, color: z ? z.color : "#b4a494" }}>{z ? z.symbol : "?"}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#3a2e24" }}>{p.name}</div>
                <div style={{ fontSize: 10, color: "#b4a494" }}>{months[bd.getMonth()]} {bd.getDate()}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: d <= 7 ? "#e86a8a" : "#b4a494" }}>{d === 1 ? "Tomorrow" : `${d}d`}</span>
            </div>
          ); })}
        </div>)}

        {!search && <div style={{ marginBottom: 8 }}>{sL("ALL PEOPLE")}</div>}
        {search && filteredPeople.length > 0 && <div style={{ marginBottom: 8 }}>{sL(`${filteredPeople.length} RESULT${filteredPeople.length !== 1 ? "S" : ""}`)}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {Object.keys(letterGroups).sort().map(letter => (
            <div key={letter}>
              <div style={{ fontSize: 11, fontWeight: 700, color: accent, padding: "8px 0 4px", borderBottom: `1px solid ${accent}15` }}>{letter}</div>
              {letterGroups[letter].map(p => { const z = getZodiacSign(p.date); const rels = p.relationships || []; const ints = p.interests || []; const preview = rels.length > 0 ? rels[0].label : (ints.length > 0 ? ints[0] : (p.notes ? "📝 Has notes" : "")); return (
                <div key={p.id} onClick={() => openPerson(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", cursor: "pointer", borderBottom: "1px solid rgba(90,74,62,0.04)" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: z ? `${z.color}12` : "rgba(90,74,62,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 14, color: z ? z.color : "#b4a494" }}>{z ? z.symbol : "?"}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#3a2e24" }}>{p.name}</div>
                    {preview && <div style={{ fontSize: 10, color: "#b4a494", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</div>}
                  </div>
                  {z && p.date && <span style={{ fontSize: 10, color: "#c4b4a4", flexShrink: 0 }}>{months[new Date(p.date + "T00:00:00").getMonth()]} {new Date(p.date + "T00:00:00").getDate()}</span>}
                </div>
              ); })}
            </div>
          ))}
        </div>
        {filteredPeople.length === 0 && (<div style={{ textAlign: "center", padding: 32, color: "#c4b4a4", fontSize: 12 }}>
          {search ? "No people match your search" : "No people added yet"}
          <div style={{ marginTop: 12 }}><button onClick={() => { setNb({ name: "", date: "", notes: "" }); setModal("addPerson"); }} style={{ fontSize: 12, fontWeight: 700, border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", background: accent, color: "white" }}>+ Add someone</button></div>
        </div>)}
      </div>)}

      {tab === "birthdays" && (()=>{
        const now = new Date(), currentMonth = now.getMonth() + 1, currentDay = now.getDate();
        const activeSign = ZODIAC.find(z => { const [sm, sd] = z.start, [em, ed] = z.end; if (sm <= em) return (currentMonth > sm || (currentMonth === sm && currentDay >= sd)) && (currentMonth < em || (currentMonth === em && currentDay <= ed)); return (currentMonth > sm || (currentMonth === sm && currentDay >= sd)) || (currentMonth < em || (currentMonth === em && currentDay <= ed)); });
        const bdaysBySign = {}, unknownBdays = [];
        filteredBdays.forEach(b => { const z = getZodiacSign(b.date); if (!z) { unknownBdays.push(b); return; } if (!bdaysBySign[z.sign]) bdaysBySign[z.sign] = []; bdaysBySign[z.sign].push(b); });
        const zodiacOrder = [...ZODIAC].sort((a, b) => getZodiacDaysUntilStart(a) - getZodiacDaysUntilStart(b));
        const sections = [];
        zodiacOrder.forEach(z => { const sb = bdaysBySign[z.sign]; if (!sb || sb.length === 0) return; if (activeSign && z.sign === activeSign.sign) { const up = sb.filter(b => daysUntil(b.date) <= 183), past = sb.filter(b => daysUntil(b.date) > 183); if (up.length > 0) sections.unshift({ zodiac: z, bdays: up, key: z.sign + "-upcoming", sublabel: "upcoming" }); if (past.length > 0) sections.push({ zodiac: z, bdays: past, key: z.sign + "-passed", sublabel: "passed" }); } else { sections.push({ zodiac: z, bdays: sb, key: z.sign }); } });
        if (unknownBdays.length > 0) sections.push({ zodiac: null, bdays: unknownBdays, key: "unknown", sublabel: "unknown" });
        const fmtRange = (z) => `${months[z.start[0]-1]} ${z.start[1]} – ${months[z.end[0]-1]} ${z.end[1]}`;

        return (<div style={{ padding: "0 20px 80px", animation: "fi 0.25s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#3a2e24" }}>Birthdays</span>
            <button onClick={() => { setNb({ name: "", date: "", notes: "" }); setModal("addPerson"); }} style={{ fontWeight: 700, fontSize: 11, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", background: "#e86a8a", color: "white" }}>+ Add</button>
          </div>
          <input placeholder="Search names..." value={bdSearch} onChange={e => setBdSearch(e.target.value)} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(90,74,62,0.1)", background: "rgba(90,74,62,0.04)", fontSize: 12.5, color: "#3a2e24", marginBottom: 10, outline: "none" }} />
          <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
            {[{ v: "all", l: "All" }, { v: "week", l: "This Week" }, { v: "month", l: "Next 30 Days" }].map(f => (
              <button key={f.v} onClick={() => setBdFilter(f.v)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${bdFilter === f.v ? accent + "44" : "rgba(90,74,62,0.08)"}`, cursor: "pointer", fontWeight: 600, fontSize: 11, background: bdFilter === f.v ? `${accent}12` : "transparent", color: bdFilter === f.v ? accent : "#8a7a6a" }}>{f.l}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {sections.map(sec => { const z = sec.zodiac, isUnknown = !z, sColor = isUnknown ? "#b4a494" : z.color; return (
              <div key={sec.key} style={{ display: "flex", gap: 0, marginBottom: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 42, flexShrink: 0, paddingTop: 2 }}>
                  <div onClick={() => !isUnknown && setViewingZodiac(z)} style={{ cursor: isUnknown ? "default" : "pointer", textAlign: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: 20, lineHeight: 1, color: sColor, opacity: sec.sublabel === "passed" ? 0.4 : 1 }}>{isUnknown ? "?" : z.symbol}</div>
                    <div style={{ fontSize: 7.5, fontWeight: 700, color: sColor, letterSpacing: 0.3, marginTop: 2, lineHeight: 1.1, opacity: sec.sublabel === "passed" ? 0.4 : 1 }}>{isUnknown ? "UNKNOWN" : z.sign.toUpperCase()}</div>
                    {sec.sublabel && !isUnknown && <div style={{ fontSize: 6.5, fontWeight: 600, color: sec.sublabel === "passed" ? "#c4b4a4" : z.color, marginTop: 1, letterSpacing: 0.5 }}>{sec.sublabel === "passed" ? "PASSED" : "SOON"}</div>}
                  </div>
                  <div style={{ flex: 1, width: 3, borderRadius: 2, background: sColor, opacity: sec.sublabel === "passed" ? 0.12 : 0.2, minHeight: 20 }} />
                  {!isUnknown && <div style={{ fontSize: 7, color: "#b4a494", marginTop: 3, textAlign: "center", lineHeight: 1.2, whiteSpace: "nowrap" }}>{fmtRange(z)}</div>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, paddingLeft: 8 }}>
                  {sec.bdays.map(b => { const hasDate = !!b.date, bd = hasDate ? new Date(b.date + "T00:00:00") : null, d = hasDate ? daysUntil(b.date) : Infinity, isTd = d === 0, isPassed = sec.sublabel === "passed"; return (
                    <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: isTd ? "#e86a8a08" : "rgba(90,74,62,0.03)", border: `1px solid ${isTd ? "#e86a8a20" : "rgba(90,74,62,0.06)"}`, cursor: "pointer", opacity: isPassed ? 0.5 : 1 }} onClick={() => openPerson(b)}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: isUnknown ? "rgba(90,74,62,0.06)" : (isTd ? "#e86a8a20" : `${sColor}12`), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: sColor, fontWeight: 700 }}>{isUnknown ? "?" : z.symbol}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#3a2e24" }}>{b.name}</div>
                        <div style={{ fontSize: 10, color: "#b4a494" }}>{hasDate ? `${months[bd.getMonth()]} ${bd.getDate()}` : "Date unknown"}{b.notes ? " · 📝" : ""}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {isTd ? <button onClick={e => { e.stopPropagation(); toggleWish(b.name) }} style={{ fontSize: 10, fontWeight: 700, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", background: wishes[b.name] ? "rgba(90,74,62,0.08)" : "#e86a8a", color: wishes[b.name] ? "#8a7a6a" : "white" }}>{wishes[b.name] ? "↩ Undo" : "Wish"}</button>
                        : <span style={{ fontSize: 10.5, color: "#c4b4a4", fontWeight: 600 }}>{!hasDate ? "—" : (isPassed ? "Passed" : (d === 1 ? "Tomorrow" : `${d}d`))}</span>}
                      </div>
                    </div>
                  ); })}
                </div>
              </div>
            ); })}
            {filteredBdays.length === 0 && <div style={{ textAlign: "center", padding: 24, color: "#c4b4a4", fontSize: 12 }}>{bdSearch ? "No results" : "No birthdays yet"}</div>}
          </div>
        </div>);
      })()}

      {modal === "addPerson" && (<Modal onClose={() => setModal(null)}>
        <div style={{ fontFamily: "'Space Grotesk'", fontSize: 16, fontWeight: 700, color: "#3a2e24", marginBottom: 16 }}>Add Person</div>
        <input placeholder="Name..." value={nb.name} onChange={e => setNb(p => ({ ...p, name: e.target.value }))} autoFocus style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(90,74,62,0.12)", background: "rgba(90,74,62,0.04)", fontSize: 13, fontWeight: 600, color: "#3a2e24", marginBottom: 10, outline: "none" }} />
        <input type="date" value={nb.date} onChange={e => setNb(p => ({ ...p, date: e.target.value }))} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(90,74,62,0.12)", background: "rgba(90,74,62,0.04)", fontSize: 13, fontWeight: 600, color: "#3a2e24", marginBottom: 2, outline: "none", colorScheme: "light" }} />
        <div style={{ fontSize: 9, color: "#b4a494", marginBottom: 8, paddingLeft: 2 }}>Birthday — optional, leave blank if unknown</div>
        <textarea placeholder="Notes..." value={nb.notes} onChange={e => setNb(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(90,74,62,0.12)", background: "rgba(90,74,62,0.04)", fontSize: 12.5, color: "#3a2e24", marginBottom: 16, outline: "none", lineHeight: 1.5 }} />
        <div style={{ display: "flex", gap: 8 }}><button onClick={() => setModal(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(90,74,62,0.1)", background: "transparent", cursor: "pointer", fontWeight: 700, fontSize: 12, color: "#8a7a6a" }}>Cancel</button><button onClick={savePerson} style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: accent, cursor: "pointer", fontWeight: 700, fontSize: 12, color: "white" }}>Save</button></div>
      </Modal>)}

      {modal === "viewPerson" && viewingPerson && (() => {
        const z = getZodiacSign(viewingPerson.date) || { sign: "Unknown", symbol: "?", color: "#b4a494" };
        const bd = viewingPerson.date ? new Date(viewingPerson.date + "T00:00:00") : null;
        const hasDate = !!viewingPerson.date && bd && !isNaN(bd);
        const gifts = viewingPerson.gifts || [], events = viewingPerson.events || [], interests = viewingPerson.interests || [], rels = viewingPerson.relationships || [];
        const upd = (changes) => setViewingPerson(p => ({ ...p, ...changes }));
        const pTab = (id, l) => <button key={id} onClick={() => setProfileTab(id)} style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: profileTab === id ? `1px solid ${z.color}44` : "1px solid rgba(90,74,62,0.08)", cursor: "pointer", fontWeight: 700, fontSize: 10, background: profileTab === id ? `${z.color}12` : "transparent", color: profileTab === id ? z.color : "#8a7a6a" }}>{l}</button>;
        const sH = (t) => <div style={{ fontSize: 9, fontWeight: 700, color: "#b4a494", marginBottom: 5, marginTop: 10, letterSpacing: 1 }}>{t}</div>;
        const searchResults = linkSearch.length > 0 ? people.filter(b => b.id !== viewingPerson.id && b.name.toLowerCase().includes(linkSearch.toLowerCase()) && !rels.find(r => r.personId === b.id)) : [];
        return (<Modal onClose={() => { setPeople(p => p.map(b => b.id === viewingPerson.id ? { ...viewingPerson, notes: editNotes } : b)); setModal(null); setViewingPerson(null); setProfileTab("info"); setLinkSearch(""); }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${z.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 22, color: z.color }}>{z.symbol}</span></div>
            <div style={{ flex: 1 }}>
              <input value={viewingPerson.name} onChange={e => upd({ name: e.target.value })} style={{ width: "100%", fontSize: 16, fontWeight: 700, color: "#3a2e24", border: "none", background: "transparent", outline: "none", padding: 0, fontFamily: "'Space Grotesk', sans-serif" }} />
              <div style={{ fontSize: 11, color: "#8a7a6a" }}>{z.sign}{hasDate ? ` · ${months[bd.getMonth()]} ${bd.getDate()} · ${daysUntil(viewingPerson.date) === 0 ? "Today!" : `${daysUntil(viewingPerson.date)}d away`}` : ""}</div>
            </div>
          </div>
          <input type="date" value={viewingPerson.date || ""} onChange={e => upd({ date: e.target.value })} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(90,74,62,0.1)", background: "rgba(90,74,62,0.03)", fontSize: 11, color: "#6b5c4d", marginBottom: 10, outline: "none", colorScheme: "light" }} />
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>{pTab("info", "Info")}{pTab("gifts", "Gifts")}{pTab("events", "Events")}{pTab("notes", "Notes")}</div>

          {profileTab === "info" && <div>
            {sH("RELATIONSHIPS")}
            {rels.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>{rels.map((r, i) => { const linked = people.find(b => b.id === r.personId); return (<div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "rgba(90,74,62,0.03)", border: "1px solid rgba(90,74,62,0.06)" }}><span style={{ fontSize: 10, fontWeight: 700, color: z.color, background: `${z.color}12`, padding: "2px 6px", borderRadius: 4 }}>{r.label}</span><span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#3a2e24", cursor: linked ? "pointer" : "default" }} onClick={() => { if (linked) { upd({ gifts, events, interests, rels, notes: editNotes }); setPeople(p => p.map(b => b.id === viewingPerson.id ? { ...viewingPerson, notes: editNotes } : b)); setViewingPerson(linked); setEditNotes(linked.notes || ""); setProfileTab("info"); setLinkSearch(""); } }}>{linked ? linked.name : "(removed)"}</span><button onClick={() => { const newRels = rels.filter((_, j) => j !== i); upd({ relationships: newRels }); if (linked) { setPeople(p => p.map(b => b.id === r.personId ? { ...b, relationships: (b.relationships || []).filter(lr => lr.personId !== viewingPerson.id) } : b)); } }} style={{ background: "none", border: "none", fontSize: 13, color: "#c4b4a4", cursor: "pointer", padding: "0 4px" }}>×</button></div>); })}</div>}
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}><input placeholder="Search to link..." value={linkSearch} onChange={e => setLinkSearch(e.target.value)} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(90,74,62,0.1)", background: "rgba(90,74,62,0.03)", fontSize: 11, color: "#3a2e24", outline: "none" }} /><select value={linkLabel} onChange={e => setLinkLabel(e.target.value)} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(90,74,62,0.1)", background: "rgba(90,74,62,0.03)", fontSize: 10, color: "#3a2e24", outline: "none" }}>{REL_LABELS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            {searchResults.length > 0 && <div style={{ border: "1px solid rgba(90,74,62,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>{searchResults.slice(0, 5).map(b => (<div key={b.id} onClick={() => { upd({ relationships: [...rels, { personId: b.id, label: linkLabel }] }); setPeople(p => p.map(x => x.id === b.id ? { ...x, relationships: [...(x.relationships || []), { personId: viewingPerson.id, label: REL_REVERSE[linkLabel] || linkLabel }] } : x)); setLinkSearch(""); }} style={{ padding: "8px 10px", fontSize: 12, color: "#3a2e24", cursor: "pointer", borderBottom: "1px solid rgba(90,74,62,0.04)", background: "rgba(90,74,62,0.02)" }}>{b.name} <span style={{ fontSize: 10, color: "#b4a494" }}>· {(getZodiacSign(b.date) || { symbol: "?" }).symbol}</span></div>))}</div>}
            {sH("INTERESTS")}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>{interests.map((int, i) => (<span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: `${z.color}10`, color: z.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>{int}<button onClick={() => upd({ interests: interests.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", fontSize: 11, color: z.color, cursor: "pointer", padding: 0, opacity: 0.5 }}>×</button></span>))}</div>
            <div style={{ display: "flex", gap: 4 }}><input placeholder="Add interest..." value={newInterest} onChange={e => setNewInterest(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newInterest.trim()) { upd({ interests: [...interests, newInterest.trim()] }); setNewInterest(""); } }} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(90,74,62,0.1)", background: "rgba(90,74,62,0.03)", fontSize: 11, color: "#3a2e24", outline: "none" }} /><button onClick={() => { if (newInterest.trim()) { upd({ interests: [...interests, newInterest.trim()] }); setNewInterest(""); } }} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: z.color, color: "white", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>+</button></div>
          </div>}

          {profileTab === "gifts" && <div>
            {sH("GIFT IDEAS")}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>{[...gifts].sort((a, b) => (a.given ? 1 : 0) - (b.given ? 1 : 0)).map((g, i) => (<div key={g.id || i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "rgba(90,74,62,0.03)", border: "1px solid rgba(90,74,62,0.06)", opacity: g.given ? 0.5 : 1 }}><div onClick={() => { const ng = [...gifts]; const fi = gifts.findIndex(x => (x.id || x.text) === (g.id || g.text)); ng[fi] = { ...ng[fi], given: !ng[fi].given }; upd({ gifts: ng }); }} style={{ width: 18, height: 18, borderRadius: 4, border: g.given ? `2px solid ${z.color}` : "2px solid rgba(90,74,62,0.15)", background: g.given ? z.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>{g.given && <span style={{ fontSize: 10, color: "white", fontWeight: 800 }}>✓</span>}</div><span style={{ flex: 1, fontSize: 12, color: "#3a2e24", textDecoration: g.given ? "line-through" : "none" }}>{g.text}</span><button onClick={() => upd({ gifts: gifts.filter(x => (x.id || x.text) !== (g.id || g.text)) })} style={{ background: "none", border: "none", fontSize: 13, color: "#c4b4a4", cursor: "pointer", padding: "0 4px" }}>×</button></div>))}{gifts.length === 0 && <div style={{ fontSize: 11, color: "#c4b4a4", textAlign: "center", padding: 8 }}>No gift ideas yet</div>}</div>
            <div style={{ display: "flex", gap: 4 }}><input placeholder="Add gift idea..." value={newGift} onChange={e => setNewGift(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newGift.trim()) { upd({ gifts: [...gifts, { id: Date.now().toString(), text: newGift.trim(), given: false }] }); setNewGift(""); } }} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(90,74,62,0.1)", background: "rgba(90,74,62,0.03)", fontSize: 11, color: "#3a2e24", outline: "none" }} /><button onClick={() => { if (newGift.trim()) { upd({ gifts: [...gifts, { id: Date.now().toString(), text: newGift.trim(), given: false }] }); setNewGift(""); } }} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: z.color, color: "white", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>+</button></div>
          </div>}

          {profileTab === "events" && <div>
            {sH("LIFE EVENTS")}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>{[...events].sort((a, b) => b.date.localeCompare(a.date)).map((ev, i) => (<div key={ev.id || i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 10px", borderRadius: 8, background: "rgba(90,74,62,0.03)", border: "1px solid rgba(90,74,62,0.06)" }}><div style={{ flexShrink: 0, width: 6, height: 6, borderRadius: "50%", background: z.color, marginTop: 5, opacity: 0.5 }} /><div style={{ flex: 1 }}><div style={{ fontSize: 12, color: "#3a2e24" }}>{ev.text}</div><div style={{ fontSize: 9, color: "#b4a494", marginTop: 1 }}>{ev.date}</div></div><button onClick={() => upd({ events: events.filter(x => (x.id || x.text) !== (ev.id || ev.text)) })} style={{ background: "none", border: "none", fontSize: 13, color: "#c4b4a4", cursor: "pointer", padding: "0 4px" }}>×</button></div>))}{events.length === 0 && <div style={{ fontSize: 11, color: "#c4b4a4", textAlign: "center", padding: 8 }}>No events recorded</div>}</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}><input placeholder="What happened..." value={newEvent} onChange={e => setNewEvent(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newEvent.trim()) { upd({ events: [...events, { id: Date.now().toString(), text: newEvent.trim(), date: newEventDate }] }); setNewEvent(""); } }} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(90,74,62,0.1)", background: "rgba(90,74,62,0.03)", fontSize: 11, color: "#3a2e24", outline: "none" }} /><input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} style={{ width: 100, padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(90,74,62,0.1)", background: "rgba(90,74,62,0.03)", fontSize: 10, color: "#6b5c4d", outline: "none", colorScheme: "light" }} /><button onClick={() => { if (newEvent.trim()) { upd({ events: [...events, { id: Date.now().toString(), text: newEvent.trim(), date: newEventDate }] }); setNewEvent(""); } }} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: z.color, color: "white", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>+</button></div>
          </div>}

          {profileTab === "notes" && <div>
            {sH("GENERAL NOTES")}
            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={6} placeholder="Anything you want to remember..." style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(90,74,62,0.12)", background: "rgba(90,74,62,0.04)", fontSize: 12.5, color: "#3a2e24", outline: "none", lineHeight: 1.6 }} />
          </div>}

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={() => { setPeople(p => p.filter(x => x.id !== viewingPerson.id)); setModal(null); setViewingPerson(null); }} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(232,106,106,0.3)", background: "transparent", cursor: "pointer", fontWeight: 700, fontSize: 11, color: "#e86a6a" }}>Delete</button>
            <button onClick={() => { setModal(null); setViewingPerson(null); setProfileTab("info"); setLinkSearch(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(90,74,62,0.1)", background: "transparent", cursor: "pointer", fontWeight: 700, fontSize: 11, color: "#8a7a6a" }}>Cancel</button>
            <button onClick={() => { setPeople(p => p.map(b => b.id === viewingPerson.id ? { ...viewingPerson, notes: editNotes } : b)); setModal(null); setViewingPerson(null); setProfileTab("info"); setLinkSearch(""); }} style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: z.color, cursor: "pointer", fontWeight: 700, fontSize: 11, color: "white" }}>Save</button>
          </div>
        </Modal>);
      })()}

      {viewingZodiac && (<Modal onClose={() => setViewingZodiac(null)}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 48, lineHeight: 1, color: viewingZodiac.color, marginBottom: 8 }}>{viewingZodiac.symbol}</div>
          <div style={{ fontFamily: "'Space Grotesk'", fontSize: 20, fontWeight: 700, color: "#3a2e24" }}>{viewingZodiac.sign}</div>
          <div style={{ fontSize: 12, color: "#8a7a6a", marginTop: 4 }}>{months[viewingZodiac.start[0] - 1]} {viewingZodiac.start[1]} – {months[viewingZodiac.end[0] - 1]} {viewingZodiac.end[1]}</div>
        </div>
        <div style={{ background: `${viewingZodiac.color}08`, borderRadius: 10, padding: "12px 14px", marginBottom: 12, borderLeft: `3px solid ${viewingZodiac.color}` }}><div style={{ fontSize: 12, color: "#3a2e24", lineHeight: 1.6 }}>{viewingZodiac.traits}</div></div>
        <div style={{ marginBottom: 10 }}><div style={{ fontSize: 10, fontWeight: 700, color: viewingZodiac.color, marginBottom: 4, letterSpacing: 1 }}>LIKES</div><div style={{ fontSize: 12, color: "#6b5c4d", lineHeight: 1.5 }}>{viewingZodiac.likes}</div></div>
        <div style={{ marginBottom: 16 }}><div style={{ fontSize: 10, fontWeight: 700, color: viewingZodiac.color, marginBottom: 4, letterSpacing: 1 }}>DISLIKES</div><div style={{ fontSize: 12, color: "#6b5c4d", lineHeight: 1.5 }}>{viewingZodiac.dislikes}</div></div>
        <div style={{ fontSize: 10, color: "#c4b4a4", textAlign: "center", marginBottom: 12 }}>{people.filter(b => { const s = getZodiacSign(b.date); return s && s.sign === viewingZodiac.sign; }).length} {people.filter(b => { const s = getZodiacSign(b.date); return s && s.sign === viewingZodiac.sign; }).length !== 1 ? "people" : "person"} in your circle</div>
        <button onClick={() => setViewingZodiac(null)} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: viewingZodiac.color, cursor: "pointer", fontWeight: 700, fontSize: 12, color: "white" }}>Close</button>
      </Modal>)}
    </div>
  );
}
