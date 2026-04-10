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
const CADENCES = [
  { id: "2weeks", label: "Every 2 weeks", days: 14 },
  { id: "monthly", label: "Monthly", days: 30 },
  { id: "quarterly", label: "Quarterly", days: 90 },
  { id: "annually", label: "Annually", days: 365 },
  { id: "na", label: "N/A", days: Infinity },
];
function getCadenceDays(c) { return (CADENCES.find(x => x.id === c) || CADENCES[1]).days; }
function getOverdueInfo(person, today) {
  const cadence = person.cadence || "monthly";
  if (cadence === "na") return null;
  const cDays = getCadenceDays(cadence);
  const tps = person.touchpoints || [];
  const lastDate = tps.length > 0 ? tps[tps.length - 1].date : (person.cadenceBaseline || today);
  const now = new Date(today + "T00:00:00"), last = new Date(lastDate + "T00:00:00");
  const daysSince = Math.round((now - last) / 86400000);
  const daysUntilDue = cDays - daysSince;
  return { cadence, cDays, daysSince, daysUntilDue, ratio: daysSince / cDays, lastDate };
}

function getBdToday(ppl) { const t = new Date(), m = t.getMonth(), d = t.getDate(); return ppl.filter(b => { if (!b.date) return false; const x = new Date(b.date + "T00:00:00"); return !isNaN(x) && x.getMonth() === m && x.getDate() === d; }); }
function daysUntil(ds) { if (!ds) return Infinity; const now = new Date(), bd = new Date(ds + "T00:00:00"); if (isNaN(bd)) return Infinity; bd.setFullYear(now.getFullYear()); const td = new Date(now.getFullYear(), now.getMonth(), now.getDate()); if (bd < td) bd.setFullYear(now.getFullYear() + 1); return Math.round((bd - td) / 86400000); }

function Modal({children,onClose}){
  return(<div role="dialog" aria-modal="true" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:200,paddingTop:"env(safe-area-inset-top, 20px)"}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div style={{background:"#F6F2EB",borderRadius:14,padding:"20px 18px",width:"92%",maxWidth:400,maxHeight:"85vh",overflow:"auto",animation:"sd 0.25s ease",marginTop:16,WebkitOverflowScrolling:"touch",overflowX:"hidden"}}>{children}</div>
  </div>);
}

function LoginScreen({ onSignIn, loading }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F6F2EB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', -apple-system, sans-serif", padding: 32, paddingTop: "calc(env(safe-area-inset-top, 20px) + 32px)" }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: "#1E1B18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 28, color: "#F6F2EB" }}>●</span>
      </div>
      <h1 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 28, fontWeight: 400, color: "#1E1B18", letterSpacing: -0.5, marginBottom: 8 }}>My Circle</h1>
      <p style={{ fontSize: 13, color: "#8A8078", marginBottom: 32, textAlign: "center", lineHeight: 1.5 }}>Your personal CRM.<br/>Remember everyone who matters.</p>
      <button onClick={onSignIn} disabled={loading} aria-label="Sign in with Google" style={{ padding: "14px 32px", borderRadius: 12, border: "none", cursor: loading ? "wait" : "pointer", background: "#1E1B18", color: "#F6F2EB", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(30,27,24,0.15)" }}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#F6F2EB" opacity="0.7"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#F6F2EB" opacity="0.7"/><path d="M5.84 14.09A6.95 6.95 0 0 1 5.48 12c0-.72.12-1.42.36-2.09V7.07H2.18A11.03 11.03 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#F6F2EB" opacity="0.7"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#F6F2EB" opacity="0.7"/></svg>
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>
    </div>
  );
}

const accent = "#3D6B52";

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
    { id: "1", name: "Sarah Connor", date: "1995-04-15", notes: "Loves hiking", interests: ["outdoors","sci-fi"], gifts: [], events: [{ id: "e1", text: "Wedding", date: "2026-06-15", significant: true, privateNote: "Don't mention venue drama" }, { id: "e2", text: "Moving to Denver", date: "2026-05-01", significant: false, privateNote: "" }], relationships: [], cadence: "monthly", touchpoints: [], cadenceBaseline: "2026-04-01", tags: ["Austin friends"] },
    { id: "2", name: "John Doe", date: "1990-07-22", notes: "", interests: [], gifts: [], events: [], relationships: [], cadence: "quarterly", touchpoints: [], cadenceBaseline: "2026-03-01" },
    { id: "3", name: "Jane Smith", date: "", notes: "Met at conference", interests: ["design"], gifts: [], events: [], relationships: [], cadence: "2weeks", touchpoints: [{ id: "t1", type: "Text", date: "2026-03-28", note: "" }], cadenceBaseline: "2026-03-15" },
  ] : []);
  const [wishes, setWishes] = useState({});
  const [tab, setTab] = useState("people");
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [nb, setNb] = useState({ name: "", date: "", notes: "", cadence: "monthly", interests: [], tags: [] });
  const [nbInterest, setNbInterest] = useState("");

  // Places state
  const [places, setPlaces] = useState(IS_PREVIEW ? [
    { id: "p1", name: "St. Elmo (North)", notes: "Great brunch", rating: 4, mapsUrl: "", category: "Restaurants", visits: [{ id: "evt_1", date: "2026-03-20", note: "Birthday dinner", people: [] }] },
    { id: "p2", name: "Zilker Park", notes: "Nice trails", rating: 5, mapsUrl: "", category: "Outdoors", visits: [] },
  ] : []);
  const [placeCategories, setPlaceCategories] = useState(["Restaurants", "Bars", "Outdoors", "Other"]);
  const [peopleTags, setPeopleTags] = useState(["Austin friends", "Work", "Family", "College"]);
  const [peopleTagFilter, setPeopleTagFilter] = useState("all");
  const [editingPeopleTags, setEditingPeopleTags] = useState(false);
  const [newPeopleTagName, setNewPeopleTagName] = useState("");
  const [newPlace, setNewPlace] = useState({ name: "", notes: "", rating: 0, mapsUrl: "", category: "" });
  const [viewingPlace, setViewingPlace] = useState(null);
  const [placeSearch, setPlaceSearch] = useState("");
  const [placeCatFilter, setPlaceCatFilter] = useState("all");
  const [placeStatusFilter, setPlaceStatusFilter] = useState("all");
  const [placeSort, setPlaceSort] = useState("alpha");
  const [editingCategory, setEditingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  // Visit logging state
  const [visitNote, setVisitNote] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitPeopleSearch, setVisitPeopleSearch] = useState("");
  const [visitPeopleSelected, setVisitPeopleSelected] = useState([]);
  const [editingVisit, setEditingVisit] = useState(null);
  const [evPeopleSearch, setEvPeopleSearch] = useState("");
  // In Person touchpoint linking state
  const [tpPlaceSearch, setTpPlaceSearch] = useState("");
  const [tpPlaceSelected, setTpPlaceSelected] = useState(null);
  const [tpPeopleSearch, setTpPeopleSearch] = useState("");
  const [tpPeopleSelected, setTpPeopleSelected] = useState([]);
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
  const [newEventSignificant, setNewEventSignificant] = useState(false);
  const [newEventPrivateNote, setNewEventPrivateNote] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [tpType, setTpType] = useState("Text");
  const [tpNote, setTpNote] = useState("");
  const [viewingZodiac, setViewingZodiac] = useState(null);
  const [showAllReconnect, setShowAllReconnect] = useState(false);
  const [editingTp, setEditingTp] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null); // { personId, event }
  const [showAllMilestones, setShowAllMilestones] = useState(false);

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
      const [b, w, pl, cats, ptags] = await Promise.all([loadData(user.uid, "birthdays"), loadData(user.uid, `wishes/${today}`), loadData(user.uid, "places"), loadData(user.uid, "placeCategories"), loadData(user.uid, "peopleTags")]);
      if (b) {
        const loaded = Object.values(b).map(p => ({
          ...p,
          cadence: p.cadence || "monthly",
          touchpoints: p.touchpoints || [],
          cadenceBaseline: p.cadenceBaseline || TODAY(),
        }));
        setPeople(loaded);
      }
      if (w) setWishes(w);
      if (pl) setPlaces(Object.values(pl));
      if (cats) setPlaceCategories(cats);
      if (ptags) setPeopleTags(ptags);
      setDataLoaded(true);
    })();
  }, [user, today]);

  useEffect(() => { if (dataLoaded && !IS_PREVIEW) { const obj = {}; people.forEach(p => obj[p.id] = p); save("birthdays", obj, true); } }, [people, dataLoaded]);
  useEffect(() => { if (dataLoaded && !IS_PREVIEW) save(`wishes/${today}`, wishes, true); }, [wishes, dataLoaded]);
  useEffect(() => { if (dataLoaded && !IS_PREVIEW) { const obj = {}; places.forEach(p => obj[p.id] = p); save("places", obj, true); } }, [places, dataLoaded]);
  useEffect(() => { if (dataLoaded && !IS_PREVIEW) save("placeCategories", placeCategories, true); }, [placeCategories, dataLoaded]);
  useEffect(() => { if (dataLoaded && !IS_PREVIEW) save("peopleTags", peopleTags, true); }, [peopleTags, dataLoaded]);

  const handleSignIn = async () => { setSignInLoading(true); await signInGoogle(); setSignInLoading(false); };

  if (authLoading) return <div style={{ minHeight: "100vh", background: "#F6F2EB", display: "flex", alignItems: "center", justifyContent: "center", color: "#8A8078", fontFamily: "'Lora', Georgia, serif", fontSize: 14 }}>Loading...</div>;
  if (!user) return <LoginScreen onSignIn={handleSignIn} loading={signInLoading} />;
  if (!dataLoaded) return <div style={{ minHeight: "100vh", background: "#F6F2EB", display: "flex", alignItems: "center", justifyContent: "center", color: "#8A8078", fontFamily: "'Lora', Georgia, serif", fontSize: 14 }}>Loading your data...</div>;

  const todayBd = getBdToday(people);
  const sortedTodayBd = [...todayBd].sort((a, b) => (wishes[a.name] ? 1 : 0) - (wishes[b.name] ? 1 : 0));
  const toggleWish = (name) => setWishes(p => ({ ...p, [name]: !p[name] }));
  const savePerson = () => { if (!nb.name.trim()) return; setPeople(p => [...p, { ...nb, id: Date.now().toString(), gifts: [], events: [], relationships: [], touchpoints: [], cadenceBaseline: TODAY() }]); setNb({ name: "", date: "", notes: "", cadence: "monthly", interests: [], tags: [] }); setNbInterest(""); setModal(null); };
  const openPerson = (p) => { setViewingPerson(p); setEditNotes(p.notes || ""); setProfileTab("info"); setNewGift(""); setNewEvent(""); setNewEventDate(TODAY()); setNewEventSignificant(false); setNewEventPrivateNote(""); setNewInterest(""); setLinkSearch(""); setTpType("Text"); setTpNote(""); setModal("viewPerson"); };

  const upcoming = people.filter(p => p.date && daysUntil(p.date) > 0 && daysUntil(p.date) < Infinity).sort((a, b) => daysUntil(a.date) - daysUntil(b.date)).slice(0, 3);

  // Upcoming milestones — future events + significant event anniversaries
  const allMilestones = (() => {
    const ms = [];
    const todayD = new Date(today + "T00:00:00");
    people.forEach(p => {
      (p.events || []).forEach(ev => {
        if (!ev.date) return;
        const evDate = new Date(ev.date + "T00:00:00");
        if (isNaN(evDate)) return;
        if (evDate >= todayD) {
          const d = Math.round((evDate - todayD) / 86400000);
          ms.push({ person: p, event: ev, daysAway: d, isAnniversary: false });
        } else if (ev.significant) {
          const thisYear = new Date(todayD.getFullYear(), evDate.getMonth(), evDate.getDate());
          let target = thisYear;
          if (target < todayD) target = new Date(todayD.getFullYear() + 1, evDate.getMonth(), evDate.getDate());
          const d = Math.round((target - todayD) / 86400000);
          const years = target.getFullYear() - evDate.getFullYear();
          ms.push({ person: p, event: ev, daysAway: d, isAnniversary: true, years });
        }
      });
    });
    return ms.sort((a, b) => a.daysAway - b.daysAway);
  })();
  const upcomingMilestones = allMilestones.filter(m => m.daysAway <= 90);

  // Reconnect suggestions — sorted by overdue ratio (most overdue first)
  const reconnectAll = people.map(p => ({ person: p, info: getOverdueInfo(p, today) })).filter(x => x.info && x.info.daysUntilDue <= 0).sort((a, b) => b.info.ratio - a.info.ratio);
  // Coming up — not yet overdue, sorted by soonest due
  const comingUpAll = people.map(p => ({ person: p, info: getOverdueInfo(p, today) })).filter(x => x.info && x.info.daysUntilDue > 0).sort((a, b) => a.info.daysUntilDue - b.info.daysUntilDue);
  const filteredPeople = people.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (peopleTagFilter !== "all" && !(p.tags || []).includes(peopleTagFilter)) return false;
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));
  const filteredBdays = people.filter(b => { if (bdSearch && !b.name.toLowerCase().includes(bdSearch.toLowerCase())) return false; const d = daysUntil(b.date); if (bdFilter === "week") return d <= 7; if (bdFilter === "month") return d <= 30; return true; }).sort((a, b) => daysUntil(a.date) - daysUntil(b.date));

  const sL = (t) => <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 11, fontWeight: 400, color: "#1E1B18", letterSpacing: 0.3, marginBottom: 8, marginTop: 4 }}>{t}</div>;
  const letterGroups = {};
  filteredPeople.forEach(p => { const letter = p.name[0]?.toUpperCase() || "#"; if (!letterGroups[letter]) letterGroups[letter] = []; letterGroups[letter].push(p); });

  return (
    <div style={{ minHeight: "100vh", background: "#F6F2EB", fontFamily: "'Inter', -apple-system, sans-serif", color: "#1E1B18", maxWidth: 480, margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:wght@400;500;600;700&display=swap');
        @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sd{from{opacity:0;transform:translateY(-40px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;margin:0}input,select,button,textarea{font-family:'Inter',-apple-system,sans-serif;max-width:100%}
        input[type="date"]{-webkit-min-logical-width:0!important;min-width:0!important}
        button:active{transform:scale(0.97)!important}
        ::-webkit-scrollbar{width:0}textarea{resize:vertical}
        button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid #3D6B52;outline-offset:2px}
        a:focus-visible{outline:2px solid #3D6B52;outline-offset:2px}
      `}</style>

      <div style={{ paddingTop: "env(safe-area-inset-top, 20px)", background: "linear-gradient(180deg, rgba(30,27,24,0.03) 0%, transparent 100%)" }}>
        <div style={{ padding: "16px 18px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 22, fontWeight: 400, color: "#1E1B18", letterSpacing: -0.3 }}>My Circle</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => { setNb({ name: "", date: "", notes: "", cadence: "monthly", interests: [], tags: [] }); setModal("addPerson"); }} aria-label="Add person" style={{ background: "#1E1B18", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#F6F2EB", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
            <button onClick={() => setSettings(!settings)} aria-label="Settings" style={{ background: "#EDEAE3", border: "1px solid #D6D0C6", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 13, color: "#8A8078", display: "flex", alignItems: "center", justifyContent: "center" }}>...</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, padding: "4px 20px 12px" }}>
          {[{ id: "people", l: "People" }, { id: "touchpoints", l: "Touch" }, { id: "birthdays", l: "Birthdays" }, { id: "places", l: "Places" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} aria-label={`${t.l} tab`} aria-current={tab === t.id ? "page" : undefined} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: tab === t.id ? "1px solid #1E1B18" : "1px solid #D6D0C6", cursor: "pointer", fontWeight: tab === t.id ? 500 : 400, fontSize: 10, background: tab === t.id ? "#1E1B18" : "transparent", color: tab === t.id ? "#F6F2EB" : "#8A8078", letterSpacing: 0.3 }}>{t.l}</button>
          ))}
        </div>
        <div style={{ height: 1, background: "#EDEAE3", margin: "0 20px" }} />
      </div>

      {settings && (<div style={{ margin: "4px 20px 8px", padding: 14, background: "#EDEAE3", borderRadius: 12, border: "1px solid #D6D0C6", animation: "fi 0.2s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: "#8A8078" }}>Signed in as {user.displayName || user.email}</span>
          <button onClick={signOutUser} style={{ fontSize: 10, fontWeight: 700, border: "1px solid rgba(232,106,106,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", background: "transparent", color: "#e86a6a" }}>Sign Out</button>
        </div>
        <div style={{ paddingTop: 10, borderTop: "1px solid #E8E4DC", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#1E1B18" }}>Export Data</div>
            <div style={{ fontSize: 9, color: "#A09888" }}>{people.length} people · {places.length} places</div>
          </div>
          <button onClick={() => {
            const data = { exportDate: TODAY(), version: "2.2", people, places, placeCategories, peopleTags };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `my-circle-backup-${TODAY()}.json`; a.click();
            URL.revokeObjectURL(url);
          }} style={{ fontSize: 10, fontWeight: 700, border: `1px solid ${accent}44`, borderRadius: 6, padding: "6px 12px", cursor: "pointer", background: `${accent}12`, color: accent }}>Download</button>
        </div>
      </div>)}

      {sortedTodayBd.length > 0 && (<div style={{ margin: "4px 20px 6px", padding: "10px 14px", borderRadius: 10, background: "#e86a8a08", border: "1px solid #e86a8a18", animation: "fi 0.4s ease" }}>
        <div style={{ fontWeight: 700, fontSize: 10, color: "#e86a8a", marginBottom: 6, letterSpacing: 1 }}>🎂 BIRTHDAY TODAY</div>
        {sortedTodayBd.map(b => (<div key={b.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3, opacity: wishes[b.name] ? 0.5 : 1 }}><span style={{ fontSize: 12.5, fontWeight: 600, cursor: "pointer" }} onClick={() => openPerson(b)}>{b.name}</span><button onClick={() => toggleWish(b.name)} style={{ fontSize: 10.5, fontWeight: 700, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", background: wishes[b.name] ? "#E8E4DC" : "#e86a8a", color: wishes[b.name] ? "#8A8078" : "white" }}>{wishes[b.name] ? "↩ Undo" : "Wish HBD"}</button></div>))}
      </div>)}

      {tab === "people" && (<div style={{ padding: "0 20px 80px", animation: "fi 0.25s ease" }}>
        <div style={{ position: "relative", marginBottom: 14, marginTop: 8 }}>
          <input placeholder="Search people..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "10px 36px 10px 14px", borderRadius: 10, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 13, color: "#1E1B18", outline: "none" }} />
          {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "#E0DCD4", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 11, color: "#8A8078", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>×</button>}
        </div>

        {/* Tag filter */}
        {!search && peopleTags.length > 0 && (<div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
          <button onClick={() => setPeopleTagFilter("all")} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${peopleTagFilter === "all" ? accent + "44" : "#E8E4DC"}`, cursor: "pointer", fontWeight: 600, fontSize: 10, background: peopleTagFilter === "all" ? `${accent}12` : "transparent", color: peopleTagFilter === "all" ? accent : "#8A8078" }}>All</button>
          {peopleTags.map(t => (<button key={t} onClick={() => setPeopleTagFilter(peopleTagFilter === t ? "all" : t)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${peopleTagFilter === t ? accent + "44" : "#E8E4DC"}`, cursor: "pointer", fontWeight: 600, fontSize: 10, background: peopleTagFilter === t ? `${accent}12` : "transparent", color: peopleTagFilter === t ? accent : "#8A8078" }}>{t}</button>))}
          <button onClick={() => setEditingPeopleTags(true)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #D6D0C6", cursor: "pointer", fontWeight: 600, fontSize: 10, background: "transparent", color: "#A09888" }}>✎</button>
        </div>)}

        {!search && upcoming.length > 0 && (<div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 12, background: "#FFFFFF", border: "1px solid #DDD8D0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 11, fontWeight: 400, color: "#1E1B18", letterSpacing: 0.3 }}>UPCOMING BIRTHDAYS</span>
            <button onClick={() => setTab("birthdays")} style={{ fontSize: 10, fontWeight: 700, color: accent, background: "none", border: "none", cursor: "pointer" }}>View all →</button>
          </div>
          {upcoming.map(p => { const z = getZodiacSign(p.date), d = daysUntil(p.date), bd = new Date(p.date + "T00:00:00"); return (
            <div key={p.id} onClick={() => openPerson(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer", borderTop: "0.5px solid #EDE9E2" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: z ? `${z.color}15` : "#EDEAE3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "'Times New Roman', Georgia, serif", fontSize: 18, color: z ? z.color : "#A09888", fontVariantEmoji: "text" }}>{z ? z.symbol : "?"}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#1E1B18" }}>{p.name}</div>
                <div style={{ fontSize: 10, color: "#A09888" }}>{months[bd.getMonth()]} {bd.getDate()}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: d <= 7 ? "#e86a8a" : "#A09888" }}>{d === 1 ? "Tomorrow" : `${d}d`}</span>
            </div>
          ); })}
        </div>)}

        {/* Upcoming Milestones */}
        {!search && (upcomingMilestones.length > 0 || allMilestones.length > 0) && (<div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 12, background: "#FFFFFF", border: "1px solid #DDD8D0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: upcomingMilestones.length > 0 ? 10 : 0 }}>
            <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 11, fontWeight: 400, color: "#1E1B18", letterSpacing: 0.3 }}>UPCOMING MILESTONES</span>
            <button onClick={() => setShowAllMilestones(true)} style={{ fontSize: 10, fontWeight: 700, color: accent, background: "none", border: "none", cursor: "pointer" }}>{upcomingMilestones.length === 0 ? `${allMilestones.length} upcoming →` : `View all (${allMilestones.length}) →`}</button>
          </div>
          {upcomingMilestones.slice(0, 5).map((m, i) => (
            <div key={m.event.id || i} onClick={() => setEditingEvent({ personId: m.person.id, event: { ...m.event } })} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer", borderTop: i > 0 ? "1px solid #F0EDE6" : "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: m.daysAway === 0 ? "rgba(232,106,138,0.1)" : m.event.significant ? "rgba(232,168,76,0.1)" : "#EDEAE3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 13, color: m.daysAway === 0 ? "#e86a8a" : m.event.significant ? "#e8a84c" : "#8A8078" }}>{m.event.significant ? "✦" : "◆"}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: "#1E1B18" }}>{m.person.name}</div>
                <div style={{ fontSize: 10, color: "#8A8078" }}>{m.event.text}{m.isAnniversary ? ` (${m.years}yr)` : ""}</div>
                {m.event.privateNote && <div style={{ fontSize: 9, color: "#e8a84c", fontStyle: "italic", marginTop: 1 }}>📌 {m.event.privateNote}</div>}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: m.daysAway === 0 ? "#e86a8a" : m.daysAway <= 7 ? "#e8a84c" : "#A09888", flexShrink: 0 }}>{m.daysAway === 0 ? "Today" : m.daysAway === 1 ? "Tomorrow" : `${m.daysAway}d`}</span>
            </div>
          ))}
        </div>)}

        {/* Touchpoints summary */}
        {!search && reconnectAll.length > 0 && (<div onClick={() => setTab("touchpoints")} style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 12, background: "rgba(232,106,106,0.04)", border: "1px solid rgba(232,106,106,0.1)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#e86a6a", letterSpacing: 1.2, marginBottom: 2 }}>OVERDUE TOUCHPOINTS</div>
            <div style={{ fontSize: 12, color: "#8A8078" }}>{reconnectAll.length} {reconnectAll.length === 1 ? "person needs" : "people need"} a check-in</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: accent }}>View →</span>
        </div>)}

        {!search && <div style={{ marginBottom: 8 }}>{sL("ALL PEOPLE")}</div>}
        {search && filteredPeople.length > 0 && <div style={{ marginBottom: 8 }}>{sL(`${filteredPeople.length} RESULT${filteredPeople.length !== 1 ? "S" : ""}`)}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {Object.keys(letterGroups).sort().map(letter => (
            <div key={letter}>
              <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, fontWeight: 400, color: accent, padding: "4px 0 4px" }}>{letter}</div>
              {letterGroups[letter].map(p => { const z = getZodiacSign(p.date); const tags = p.tags || []; const preview = tags.length > 0 ? tags.join(" · ") : (p.notes ? "Has notes" : ""); const initials = p.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase(); return (
                <div key={p.id} onClick={() => openPerson(p)} role="button" tabIndex={0} aria-label={p.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", cursor: "pointer", borderTop: "0.5px solid #E8E4DC" }}>
                  <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 18, fontWeight: 400, color: z ? z.color : "#8A8078", lineHeight: 1, width: 28 }}>{initials}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, color: "#1E1B18" }}>{p.name}</div>
                    {preview && <div style={{ fontSize: 10, color: "#A09888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{preview}</div>}
                  </div>
                  {z && <span style={{ fontFamily: "'Times New Roman', Georgia, serif", fontSize: 14, color: z.color, fontVariantEmoji: "text", opacity: 0.4, flexShrink: 0 }}>{z.symbol}</span>}
                </div>
              ); })}
            </div>
          ))}
        </div>
        {filteredPeople.length === 0 && (<div style={{ textAlign: "center", padding: 32, color: "#B8B0A4", fontSize: 12 }}>
          {search ? "No people match your search" : "No people added yet"}
          <div style={{ marginTop: 12 }}><button onClick={() => { setNb({ name: "", date: "", notes: "", cadence: "monthly", interests: [], tags: [] }); setModal("addPerson"); }} style={{ fontSize: 12, fontWeight: 700, border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", background: accent, color: "white" }}>+ Add someone</button></div>
        </div>)}
      </div>)}

      {/* ═══ TOUCHPOINTS TAB ═══ */}
      {tab === "touchpoints" && (<div style={{ padding: "0 20px 80px", animation: "fi 0.25s ease" }}>
        {/* Overdue section */}
        {reconnectAll.length > 0 && (<div style={{ marginTop: 8, marginBottom: 20 }}>
          {sL(`OVERDUE (${reconnectAll.length})`)}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {reconnectAll.map(({ person: p, info }) => { const overdueDays = Math.abs(info.daysUntilDue); const cadLabel = CADENCES.find(c => c.id === info.cadence)?.label || info.cadence; return (
              <div key={p.id} onClick={() => openPerson(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(232,106,106,0.04)", border: "1px solid rgba(232,106,106,0.12)", cursor: "pointer" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: overdueDays > getCadenceDays(info.cadence) ? "rgba(232,106,106,0.12)" : "rgba(232,168,76,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 13, color: overdueDays > getCadenceDays(info.cadence) ? "#e86a6a" : "#e8a84c" }}>↻</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#1E1B18" }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "#A09888" }}>{cadLabel} · last {info.daysSince}d ago</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: overdueDays > getCadenceDays(info.cadence) ? "#e86a6a" : "#e8a84c", flexShrink: 0 }}>{overdueDays}d overdue</span>
              </div>
            ); })}
          </div>
        </div>)}

        {/* Coming Up section */}
        {comingUpAll.length > 0 && (<div style={{ marginTop: reconnectAll.length > 0 ? 0 : 8, marginBottom: 20 }}>
          {sL(`COMING UP (${comingUpAll.length})`)}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {comingUpAll.map(({ person: p, info }) => { const cadLabel = CADENCES.find(c => c.id === info.cadence)?.label || info.cadence; const z = getZodiacSign(p.date); return (
              <div key={p.id} onClick={() => openPerson(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "#FFFFFF", border: "1px solid #DDD8D0", cursor: "pointer" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: z ? `${z.color}12` : "#EDEAE3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Times New Roman', Georgia, serif", fontSize: 18, color: z ? z.color : "#A09888", fontVariantEmoji: "text" }}>{z ? z.symbol : "?"}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#1E1B18" }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "#A09888" }}>{cadLabel} · last {info.daysSince}d ago</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: info.daysUntilDue <= 7 ? "#e8a84c" : "#A09888", flexShrink: 0 }}>in {info.daysUntilDue}d</span>
              </div>
            ); })}
          </div>
        </div>)}

        {reconnectAll.length === 0 && comingUpAll.length === 0 && (
          <div style={{ textAlign: "center", padding: 32, color: "#B8B0A4", fontSize: 12, marginTop: 8 }}>No touchpoint cadences active. Set a cadence on someone's profile to start tracking.</div>
        )}
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
            <span style={{ fontWeight: 700, fontSize: 14, color: "#1E1B18" }}>Birthdays</span>
            <button onClick={() => { setNb({ name: "", date: "", notes: "", cadence: "monthly", interests: [], tags: [] }); setModal("addPerson"); }} style={{ fontWeight: 600, fontSize: 11, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", background: "#e86a8a", color: "white" }}>+ Add</button>
          </div>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <input placeholder="Search names..." value={bdSearch} onChange={e => setBdSearch(e.target.value)} style={{ width: "100%", padding: "8px 34px 8px 12px", borderRadius: 8, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 12.5, color: "#1E1B18", outline: "none" }} />
            {bdSearch && <button onClick={() => setBdSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "#E0DCD4", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 10, color: "#8A8078", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>×</button>}
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
            {[{ v: "all", l: "All" }, { v: "week", l: "This Week" }, { v: "month", l: "Next 30 Days" }].map(f => (
              <button key={f.v} onClick={() => setBdFilter(f.v)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${bdFilter === f.v ? accent + "44" : "#E8E4DC"}`, cursor: "pointer", fontWeight: 600, fontSize: 11, background: bdFilter === f.v ? `${accent}12` : "transparent", color: bdFilter === f.v ? accent : "#8A8078" }}>{f.l}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {sections.map(sec => { const z = sec.zodiac, isUnknown = !z, sColor = isUnknown ? "#A09888" : z.color; return (
              <div key={sec.key} style={{ display: "flex", gap: 0, marginBottom: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 42, flexShrink: 0, paddingTop: 2 }}>
                  <div onClick={() => !isUnknown && setViewingZodiac(z)} style={{ cursor: isUnknown ? "default" : "pointer", textAlign: "center", marginBottom: 4 }}>
                    <div style={{ fontFamily: "'Times New Roman', Georgia, serif", fontSize: 20, lineHeight: 1, color: sColor, fontVariantEmoji: "text", opacity: sec.sublabel === "passed" ? 0.4 : 1 }}>{isUnknown ? "?" : z.symbol}</div>
                    <div style={{ fontSize: 7.5, fontWeight: 700, color: sColor, letterSpacing: 0.3, marginTop: 2, lineHeight: 1.1, opacity: sec.sublabel === "passed" ? 0.4 : 1 }}>{isUnknown ? "UNKNOWN" : z.sign.toUpperCase()}</div>
                    {sec.sublabel && !isUnknown && <div style={{ fontSize: 6.5, fontWeight: 600, color: sec.sublabel === "passed" ? "#B8B0A4" : z.color, marginTop: 1, letterSpacing: 0.5 }}>{sec.sublabel === "passed" ? "PASSED" : "SOON"}</div>}
                  </div>
                  <div style={{ flex: 1, width: 3, borderRadius: 2, background: sColor, opacity: sec.sublabel === "passed" ? 0.12 : 0.2, minHeight: 20 }} />
                  {!isUnknown && <div style={{ fontSize: 7, color: "#A09888", marginTop: 3, textAlign: "center", lineHeight: 1.2, whiteSpace: "nowrap" }}>{fmtRange(z)}</div>}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5, paddingLeft: 8 }}>
                  {sec.bdays.map(b => { const hasDate = !!b.date, bd = hasDate ? new Date(b.date + "T00:00:00") : null, d = hasDate ? daysUntil(b.date) : Infinity, isTd = d === 0, isPassed = sec.sublabel === "passed"; return (
                    <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: isTd ? "#e86a8a08" : "#F2EFE8", border: `1px solid ${isTd ? "#e86a8a20" : "#EDEAE3"}`, cursor: "pointer", opacity: isPassed ? 0.5 : 1 }} onClick={() => openPerson(b)}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: isUnknown ? "#EDEAE3" : (isTd ? "#e86a8a20" : `${sColor}12`), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: "'Times New Roman', Georgia, serif", fontSize: 16, color: sColor, fontVariantEmoji: "text" }}>{isUnknown ? "?" : z.symbol}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#1E1B18" }}>{b.name}</div>
                        <div style={{ fontSize: 10, color: "#A09888" }}>{hasDate ? `${months[bd.getMonth()]} ${bd.getDate()}` : "Date unknown"}{b.notes ? " · 📝" : ""}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {isTd ? <button onClick={e => { e.stopPropagation(); toggleWish(b.name) }} style={{ fontSize: 10, fontWeight: 700, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", background: wishes[b.name] ? "#E8E4DC" : "#e86a8a", color: wishes[b.name] ? "#8A8078" : "white" }}>{wishes[b.name] ? "↩ Undo" : "Wish"}</button>
                        : <span style={{ fontSize: 10.5, color: "#B8B0A4", fontWeight: 600 }}>{!hasDate ? "—" : (isPassed ? "Passed" : (d === 1 ? "Tomorrow" : `${d}d`))}</span>}
                      </div>
                    </div>
                  ); })}
                </div>
              </div>
            ); })}
            {filteredBdays.length === 0 && <div style={{ textAlign: "center", padding: 24, color: "#B8B0A4", fontSize: 12 }}>{bdSearch ? "No results" : "No birthdays yet"}</div>}
          </div>
        </div>);
      })()}

      {/* ═══ PLACES TAB ═══ */}
      {tab === "places" && (() => {
        const lastVisitDate = (p) => { const v = (p.visits || []); if (v.length === 0) return null; return v.reduce((latest, x) => x.date > latest ? x.date : latest, ""); };
        const daysSinceVisit = (p) => { const d = lastVisitDate(p); if (!d) return Infinity; const now = new Date(today + "T00:00:00"), last = new Date(d + "T00:00:00"); return Math.round((now - last) / 86400000); };
        let filtered = places.filter(p => !placeSearch || p.name.toLowerCase().includes(placeSearch.toLowerCase()));
        if (placeCatFilter !== "all") filtered = filtered.filter(p => (p.category || "Other") === placeCatFilter);
        if (placeStatusFilter === "visited") filtered = filtered.filter(p => (p.visits || []).length > 0);
        if (placeStatusFilter === "wantto") filtered = filtered.filter(p => (p.visits || []).length === 0);
        if (placeSort === "alpha") filtered.sort((a, b) => a.name.localeCompare(b.name));
        else if (placeSort === "rating") filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        else if (placeSort === "recent") filtered.sort((a, b) => { const da = lastVisitDate(a) || "", db = lastVisitDate(b) || ""; return db.localeCompare(da); });
        const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);
        return (<div style={{ padding: "0 20px 80px", animation: "fi 0.25s ease" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, marginTop: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#1E1B18" }}>Places</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setEditingCategory(true)} style={{ fontWeight: 600, fontSize: 10, border: "1px solid #D6D0C6", borderRadius: 8, padding: "5px 10px", cursor: "pointer", background: "transparent", color: "#8A8078" }}>Edit tags</button>
              <button onClick={() => { setNewPlace({ name: "", notes: "", rating: 0, mapsUrl: "", category: placeCategories[0] || "" }); setModal("addPlace"); }} style={{ fontWeight: 600, fontSize: 11, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", background: accent, color: "white" }}>+ Add</button>
            </div>
          </div>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <input placeholder="Search places..." value={placeSearch} onChange={e => setPlaceSearch(e.target.value)} style={{ width: "100%", padding: "10px 36px 10px 14px", borderRadius: 10, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 13, color: "#1E1B18", outline: "none" }} />
            {placeSearch && <button onClick={() => setPlaceSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "#E0DCD4", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 11, color: "#8A8078", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>×</button>}
          </div>
          {/* Category filter */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
            <button onClick={() => setPlaceCatFilter("all")} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${placeCatFilter === "all" ? accent + "44" : "#E8E4DC"}`, cursor: "pointer", fontWeight: 600, fontSize: 10, background: placeCatFilter === "all" ? `${accent}12` : "transparent", color: placeCatFilter === "all" ? accent : "#8A8078" }}>All</button>
            {placeCategories.map(c => (<button key={c} onClick={() => setPlaceCatFilter(placeCatFilter === c ? "all" : c)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${placeCatFilter === c ? accent + "44" : "#E8E4DC"}`, cursor: "pointer", fontWeight: 600, fontSize: 10, background: placeCatFilter === c ? `${accent}12` : "transparent", color: placeCatFilter === c ? accent : "#8A8078" }}>{c}</button>))}
          </div>
          {/* Status + Sort */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[{ v: "all", l: "All" }, { v: "visited", l: "Visited" }, { v: "wantto", l: "Want to go" }].map(f => (
                <button key={f.v} onClick={() => setPlaceStatusFilter(f.v)} style={{ padding: "4px 8px", borderRadius: 5, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 9, background: placeStatusFilter === f.v ? "#E4E0D8" : "transparent", color: placeStatusFilter === f.v ? "#1E1B18" : "#A09888" }}>{f.l}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[{ v: "alpha", l: "A-Z" }, { v: "rating", l: "★" }, { v: "recent", l: "Recent" }].map(s => (
                <button key={s.v} onClick={() => setPlaceSort(s.v)} style={{ padding: "4px 8px", borderRadius: 5, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 9, background: placeSort === s.v ? "#E4E0D8" : "transparent", color: placeSort === s.v ? "#1E1B18" : "#A09888" }}>{s.l}</button>
              ))}
            </div>
          </div>
          {/* Place list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {filtered.map(p => { const visitCount = (p.visits || []).length; const dsv = daysSinceVisit(p); const isWantTo = visitCount === 0; return (
              <div key={p.id} onClick={() => { setViewingPlace(p); setVisitNote(""); setVisitDate(TODAY()); setVisitPeopleSearch(""); setVisitPeopleSelected([]); setEditingVisit(null); setEvPeopleSearch(""); setModal("viewPlace"); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: isWantTo ? "rgba(90,122,106,0.04)" : "#F2EFE8", border: `1px solid ${isWantTo ? accent + "15" : "#EDEAE3"}`, cursor: "pointer" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: isWantTo ? `${accent}18` : `${accent}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 15, color: accent }}>{isWantTo ? "✦" : "◎"}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#1E1B18" }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: "#A09888" }}>
                    {p.category && <span>{p.category} · </span>}
                    {p.rating > 0 ? stars(p.rating) + " · " : ""}
                    {isWantTo ? "Want to go" : `${visitCount} visit${visitCount !== 1 ? "s" : ""}${dsv < Infinity ? ` · ${dsv}d ago` : ""}`}
                  </div>
                </div>
                {p.mapsUrl && <span style={{ fontSize: 12, color: accent, flexShrink: 0 }}>📍</span>}
              </div>
            ); })}
            {filtered.length === 0 && (<div style={{ textAlign: "center", padding: 32, color: "#B8B0A4", fontSize: 12 }}>
              {placeSearch || placeCatFilter !== "all" || placeStatusFilter !== "all" ? "No places match your filters" : "No places added yet"}
              <div style={{ marginTop: 12 }}><button onClick={() => { setNewPlace({ name: "", notes: "", rating: 0, mapsUrl: "", category: placeCategories[0] || "" }); setModal("addPlace"); }} style={{ fontSize: 12, fontWeight: 700, border: "none", borderRadius: 8, padding: "8px 18px", cursor: "pointer", background: accent, color: "white" }}>+ Add a place</button></div>
            </div>)}
          </div>
        </div>);
      })()}

      {/* ═══ MODALS ═══ */}

      {modal === "addPerson" && (<Modal onClose={() => setModal(null)}>
        <div style={{ fontFamily: "'Lora'", fontSize: 16, fontWeight: 700, color: "#1E1B18", marginBottom: 16 }}>Add Person</div>
        <input placeholder="Name..." value={nb.name} onChange={e => setNb(p => ({ ...p, name: e.target.value }))} autoFocus style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 13, fontWeight: 600, color: "#1E1B18", marginBottom: 10, outline: "none" }} />
        <div style={{ overflow: "hidden", marginBottom: 2, width: "100%" }}><input type="date" value={nb.date} onChange={e => setNb(p => ({ ...p, date: e.target.value }))} style={{ display: "block", width: "calc(100% - 2px)", padding: "10px 10px 10px 14px", borderRadius: 8, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 13, fontWeight: 600, color: "#1E1B18", outline: "none", colorScheme: "light", boxSizing: "border-box", WebkitAppearance: "none", appearance: "none" }} /></div>
        <div style={{ fontSize: 9, color: "#A09888", marginBottom: 10, paddingLeft: 2 }}>Birthday — optional, leave blank if unknown</div>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#A09888", marginBottom: 5, letterSpacing: 1 }}>KEEP IN TOUCH</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
          {CADENCES.map(c => (<button key={c.id} onClick={() => setNb(p => ({ ...p, cadence: c.id }))} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${nb.cadence === c.id ? accent + "44" : "#E8E4DC"}`, cursor: "pointer", fontWeight: 600, fontSize: 10, background: nb.cadence === c.id ? `${accent}12` : "transparent", color: nb.cadence === c.id ? accent : "#8A8078" }}>{c.label}</button>))}
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#A09888", marginBottom: 5, letterSpacing: 1 }}>TAGS</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
          {nb.tags.map((tag, i) => (
            <span key={i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: `${accent}12`, color: accent, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              {tag}<button onClick={() => setNb(p => ({ ...p, tags: p.tags.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", fontSize: 10, color: accent, cursor: "pointer", padding: 0, opacity: 0.5 }}>×</button>
            </span>
          ))}
          {peopleTags.filter(t => !nb.tags.includes(t)).map(t => (
            <button key={t} onClick={() => setNb(p => ({ ...p, tags: [...p.tags, t] }))} style={{ padding: "3px 8px", borderRadius: 6, border: "1px dashed #D6D0C6", cursor: "pointer", fontWeight: 600, fontSize: 10, background: "transparent", color: "#A09888" }}>+ {t}</button>
          ))}
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#A09888", marginBottom: 5, letterSpacing: 1 }}>INTERESTS</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
          {nb.interests.map((int, i) => (
            <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: `${accent}10`, color: accent, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              {int}<button onClick={() => setNb(p => ({ ...p, interests: p.interests.filter((_, j) => j !== i) }))} style={{ background: "none", border: "none", fontSize: 11, color: accent, cursor: "pointer", padding: 0, opacity: 0.5 }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          <input placeholder="Add interest..." value={nbInterest} onChange={e => setNbInterest(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && nbInterest.trim()) { setNb(p => ({ ...p, interests: [...p.interests, nbInterest.trim()] })); setNbInterest(""); } }} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 11, color: "#1E1B18", outline: "none" }} />
          <button onClick={() => { if (nbInterest.trim()) { setNb(p => ({ ...p, interests: [...p.interests, nbInterest.trim()] })); setNbInterest(""); } }} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: accent, color: "white", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>+</button>
        </div>
        <textarea placeholder="Notes..." value={nb.notes} onChange={e => setNb(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 12.5, color: "#1E1B18", marginBottom: 6, outline: "none", lineHeight: 1.5 }} />
        <div style={{ fontSize: 9, color: "#A09888", marginBottom: 14, paddingLeft: 2 }}>Relationships can be added after saving</div>
        <div style={{ display: "flex", gap: 8 }}><button onClick={() => setModal(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #D6D0C6", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: 12, color: "#8A8078" }}>Cancel</button><button onClick={savePerson} style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: accent, cursor: "pointer", fontWeight: 600, fontSize: 12, color: "white" }}>Save</button></div>
      </Modal>)}

      {modal === "viewPerson" && viewingPerson && (() => {
        const z = getZodiacSign(viewingPerson.date) || { sign: "Unknown", symbol: "?", color: "#A09888" };
        const bd = viewingPerson.date ? new Date(viewingPerson.date + "T00:00:00") : null;
        const hasDate = !!viewingPerson.date && bd && !isNaN(bd);
        const gifts = viewingPerson.gifts || [], events = viewingPerson.events || [], interests = viewingPerson.interests || [], rels = viewingPerson.relationships || [];
        const upd = (changes) => setViewingPerson(p => ({ ...p, ...changes }));
        const pTab = (id, l) => <button key={id} onClick={() => setProfileTab(id)} style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: profileTab === id ? `1px solid ${z.color}44` : "1px solid #E8E4DC", cursor: "pointer", fontWeight: 700, fontSize: 10, background: profileTab === id ? `${z.color}12` : "transparent", color: profileTab === id ? z.color : "#8A8078" }}>{l}</button>;
        const sH = (t) => <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 11, fontWeight: 400, color: "#1E1B18", marginBottom: 5, marginTop: 10, letterSpacing: 0.3 }}>{t}</div>;
        const searchResults = linkSearch.length > 0 ? people.filter(b => b.id !== viewingPerson.id && b.name.toLowerCase().includes(linkSearch.toLowerCase()) && !rels.find(r => r.personId === b.id)) : [];
        return (<Modal onClose={() => { setPeople(p => p.map(b => b.id === viewingPerson.id ? { ...viewingPerson, notes: editNotes } : b)); setModal(null); setViewingPerson(null); setProfileTab("info"); setLinkSearch(""); }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${z.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontFamily: "'Times New Roman', Georgia, serif", fontSize: 24, color: z.color, fontVariantEmoji: "text" }}>{z.symbol}</span></div>
            <div style={{ flex: 1 }}>
              <input value={viewingPerson.name} onChange={e => upd({ name: e.target.value })} style={{ width: "100%", fontSize: 16, fontWeight: 700, color: "#1E1B18", border: "none", background: "transparent", outline: "none", padding: 0, fontFamily: "'Lora', Georgia, serif" }} />
              <div style={{ fontSize: 11, color: "#8A8078" }}>{z.sign}{hasDate ? ` · ${months[bd.getMonth()]} ${bd.getDate()} · ${daysUntil(viewingPerson.date) === 0 ? "Today!" : `${daysUntil(viewingPerson.date)}d away`}` : ""}</div>
            </div>
          </div>
          <div style={{ overflow: "hidden", marginBottom: 10, width: "100%" }}><input type="date" value={viewingPerson.date || ""} onChange={e => upd({ date: e.target.value })} style={{ display: "block", width: "calc(100% - 2px)", padding: "6px 6px 6px 10px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 11, color: "#6B6058", outline: "none", colorScheme: "light", boxSizing: "border-box", WebkitAppearance: "none", appearance: "none" }} /></div>
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>{pTab("info", "Info")}{pTab("touch", "Touch")}{pTab("gifts", "Gifts")}{pTab("events", "Events")}{pTab("notes", "Notes")}</div>

          {profileTab === "info" && <div>
            {sH("TAGS")}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
              {(viewingPerson.tags || []).map((tag, i) => (
                <span key={i} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: `${accent}12`, color: accent, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  {tag}<button onClick={() => upd({ tags: (viewingPerson.tags || []).filter((_, j) => j !== i) })} style={{ background: "none", border: "none", fontSize: 10, color: accent, cursor: "pointer", padding: 0, opacity: 0.5 }}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
              {peopleTags.filter(t => !(viewingPerson.tags || []).includes(t)).map(t => (
                <button key={t} onClick={() => upd({ tags: [...(viewingPerson.tags || []), t] })} style={{ padding: "3px 8px", borderRadius: 6, border: "1px dashed #D6D0C6", cursor: "pointer", fontWeight: 600, fontSize: 10, background: "transparent", color: "#A09888" }}>+ {t}</button>
              ))}
            </div>
            {sH("RELATIONSHIPS")}
            {rels.length > 0 && <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>{rels.map((r, i) => { const linked = people.find(b => b.id === r.personId); return (<div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "#FFFFFF", border: "1px solid #DDD8D0" }}><span style={{ fontSize: 10, fontWeight: 700, color: z.color, background: `${z.color}12`, padding: "2px 6px", borderRadius: 4 }}>{r.label}</span><span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#1E1B18", cursor: linked ? "pointer" : "default" }} onClick={() => { if (linked) { upd({ gifts, events, interests, rels, notes: editNotes }); setPeople(p => p.map(b => b.id === viewingPerson.id ? { ...viewingPerson, notes: editNotes } : b)); setViewingPerson(linked); setEditNotes(linked.notes || ""); setProfileTab("info"); setLinkSearch(""); } }}>{linked ? linked.name : "(removed)"}</span><button onClick={() => { const newRels = rels.filter((_, j) => j !== i); upd({ relationships: newRels }); if (linked) { setPeople(p => p.map(b => b.id === r.personId ? { ...b, relationships: (b.relationships || []).filter(lr => lr.personId !== viewingPerson.id) } : b)); } }} style={{ background: "none", border: "none", fontSize: 13, color: "#B8B0A4", cursor: "pointer", padding: "0 4px" }}>×</button></div>); })}</div>}
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}><input placeholder="Search to link..." value={linkSearch} onChange={e => setLinkSearch(e.target.value)} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 11, color: "#1E1B18", outline: "none" }} /><select value={linkLabel} onChange={e => setLinkLabel(e.target.value)} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 10, color: "#1E1B18", outline: "none" }}>{REL_LABELS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
            {searchResults.length > 0 && <div style={{ border: "1px solid #D6D0C6", borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>{searchResults.slice(0, 5).map(b => (<div key={b.id} onClick={() => { upd({ relationships: [...rels, { personId: b.id, label: linkLabel }] }); setPeople(p => p.map(x => x.id === b.id ? { ...x, relationships: [...(x.relationships || []), { personId: viewingPerson.id, label: REL_REVERSE[linkLabel] || linkLabel }] } : x)); setLinkSearch(""); }} style={{ padding: "8px 10px", fontSize: 12, color: "#1E1B18", cursor: "pointer", borderBottom: "0.5px solid #EDE9E2", background: "#F0EDE6" }}>{b.name} <span style={{ fontSize: 10, color: "#A09888" }}>· {(getZodiacSign(b.date) || { symbol: "?" }).symbol}</span></div>))}</div>}
            {sH("INTERESTS")}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>{interests.map((int, i) => (<span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: `${z.color}10`, color: z.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>{int}<button onClick={() => upd({ interests: interests.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", fontSize: 11, color: z.color, cursor: "pointer", padding: 0, opacity: 0.5 }}>×</button></span>))}</div>
            <div style={{ display: "flex", gap: 4 }}><input placeholder="Add interest..." value={newInterest} onChange={e => setNewInterest(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newInterest.trim()) { upd({ interests: [...interests, newInterest.trim()] }); setNewInterest(""); } }} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 11, color: "#1E1B18", outline: "none" }} /><button onClick={() => { if (newInterest.trim()) { upd({ interests: [...interests, newInterest.trim()] }); setNewInterest(""); } }} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: z.color, color: "white", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>+</button></div>
          </div>}

          {/* TAB: Touch */}
          {profileTab === "touch" && (() => {
            const tps = viewingPerson.touchpoints || [];
            const cadence = viewingPerson.cadence || "monthly";
            const info = getOverdueInfo(viewingPerson, today);
            const TP_TYPES = ["Text","Call","In Person","Postcard","Gift","Other"];
            return <div>
              {sH("CADENCE")}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                {CADENCES.map(c => (<button key={c.id} onClick={() => upd({ cadence: c.id })} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${cadence === c.id ? z.color + "44" : "#E8E4DC"}`, cursor: "pointer", fontWeight: 600, fontSize: 10, background: cadence === c.id ? `${z.color}12` : "transparent", color: cadence === c.id ? z.color : "#8A8078" }}>{c.label}</button>))}
              </div>
              {info && <div style={{ fontSize: 11, color: info.daysUntilDue <= 0 ? "#e86a6a" : "#8A8078", marginBottom: 12, padding: "8px 12px", borderRadius: 8, background: info.daysUntilDue <= 0 ? "rgba(232,106,106,0.06)" : "#F2EFE8", border: `1px solid ${info.daysUntilDue <= 0 ? "rgba(232,106,106,0.15)" : "#EDEAE3"}` }}>
                {info.daysUntilDue <= 0 ? `${Math.abs(info.daysUntilDue)}d overdue` : `Due in ${info.daysUntilDue}d`} · Last reached out {info.daysSince}d ago
              </div>}
              {sH("LOG TOUCHPOINT")}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                {TP_TYPES.map(t => (<button key={t} onClick={() => setTpType(t)} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${tpType === t ? z.color + "44" : "#E8E4DC"}`, cursor: "pointer", fontWeight: 600, fontSize: 10, background: tpType === t ? `${z.color}12` : "transparent", color: tpType === t ? z.color : "#8A8078" }}>{t}</button>))}
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                <input placeholder="Note (optional)..." value={tpNote} onChange={e => setTpNote(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { upd({ touchpoints: [...tps, { id: Date.now().toString(), type: tpType, date: TODAY(), note: tpNote.trim() }] }); setTpNote(""); } }} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 11, color: "#1E1B18", outline: "none" }} />
                <button onClick={() => { upd({ touchpoints: [...tps, { id: Date.now().toString(), type: tpType, date: TODAY(), note: tpNote.trim() }] }); setTpNote(""); }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: z.color, color: "white", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>Log</button>
              </div>
              {sH("HISTORY")}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[...tps].reverse().map((tp, i) => {
                  const isEditing = editingTp && editingTp.id === tp.id;
                  if (isEditing) return (
                    <div key={tp.id || i} style={{ padding: "8px 10px", borderRadius: 8, background: `${z.color}06`, border: `1px solid ${z.color}22` }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                        {TP_TYPES.map(t => (<button key={t} onClick={() => setEditingTp(p => ({ ...p, type: t }))} style={{ padding: "4px 8px", borderRadius: 5, border: `1px solid ${editingTp.type === t ? z.color + "44" : "#E8E4DC"}`, cursor: "pointer", fontWeight: 600, fontSize: 9, background: editingTp.type === t ? `${z.color}12` : "transparent", color: editingTp.type === t ? z.color : "#8A8078" }}>{t}</button>))}
                      </div>
                      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                        <input type="date" value={editingTp.date} onChange={e => setEditingTp(p => ({ ...p, date: e.target.value }))} style={{ flex: 1, padding: "5px 8px", borderRadius: 5, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 10, color: "#1E1B18", outline: "none", colorScheme: "light", maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }} />
                      </div>
                      <input value={editingTp.note} onChange={e => setEditingTp(p => ({ ...p, note: e.target.value }))} placeholder="Note..." style={{ width: "100%", padding: "5px 8px", borderRadius: 5, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 10, color: "#1E1B18", outline: "none", marginBottom: 6, maxWidth: "100%", minWidth: 0, boxSizing: "border-box" }} />
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => setEditingTp(null)} style={{ flex: 1, padding: "5px 0", borderRadius: 5, border: "1px solid #D6D0C6", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: 10, color: "#8A8078" }}>Cancel</button>
                        <button onClick={() => { upd({ touchpoints: tps.map(x => x.id === editingTp.id ? { ...editingTp } : x) }); setEditingTp(null); }} style={{ flex: 1, padding: "5px 0", borderRadius: 5, border: "none", background: z.color, cursor: "pointer", fontWeight: 600, fontSize: 10, color: "white" }}>Save</button>
                      </div>
                    </div>
                  );
                  return (
                  <div key={tp.id || i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "#FFFFFF", border: "1px solid #DDD8D0" }}>
                    <span onClick={() => setEditingTp({ ...tp })} style={{ fontSize: 10, fontWeight: 700, color: z.color, background: `${z.color}12`, padding: "2px 6px", borderRadius: 4, cursor: "pointer" }}>{tp.type}</span>
                    <div onClick={() => setEditingTp({ ...tp })} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                      {tp.note && <div style={{ fontSize: 11, color: "#1E1B18" }}>{tp.note}</div>}
                      {tp.placeId && (() => { const pl = places.find(x => x.id === tp.placeId); return pl ? <div style={{ fontSize: 9, color: accent, fontWeight: 600 }}>📍 {pl.name}</div> : null; })()}
                      <div style={{ fontSize: 9, color: "#A09888" }}>{tp.date}</div>
                    </div>
                    <button onClick={() => upd({ touchpoints: tps.filter(x => (x.id || x.date + x.type) !== (tp.id || tp.date + tp.type)) })} style={{ background: "none", border: "none", fontSize: 13, color: "#B8B0A4", cursor: "pointer", padding: "0 4px" }}>×</button>
                  </div>
                  );
                })}
                {tps.length === 0 && <div style={{ fontSize: 11, color: "#B8B0A4", textAlign: "center", padding: 8 }}>No touchpoints logged yet</div>}
              </div>
            </div>;
          })()}

          {profileTab === "gifts" && <div>
            {sH("GIFT IDEAS")}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>{[...gifts].sort((a, b) => (a.given ? 1 : 0) - (b.given ? 1 : 0)).map((g, i) => (<div key={g.id || i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "#FFFFFF", border: "1px solid #DDD8D0", opacity: g.given ? 0.5 : 1 }}><div onClick={() => { const ng = [...gifts]; const fi = gifts.findIndex(x => (x.id || x.text) === (g.id || g.text)); ng[fi] = { ...ng[fi], given: !ng[fi].given }; upd({ gifts: ng }); }} style={{ width: 18, height: 18, borderRadius: 4, border: g.given ? `2px solid ${z.color}` : "2px solid #D6D0C6", background: g.given ? z.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>{g.given && <span style={{ fontSize: 10, color: "white", fontWeight: 800 }}>✓</span>}</div><span style={{ flex: 1, fontSize: 12, color: "#1E1B18", textDecoration: g.given ? "line-through" : "none" }}>{g.text}</span><button onClick={() => upd({ gifts: gifts.filter(x => (x.id || x.text) !== (g.id || g.text)) })} style={{ background: "none", border: "none", fontSize: 13, color: "#B8B0A4", cursor: "pointer", padding: "0 4px" }}>×</button></div>))}{gifts.length === 0 && <div style={{ fontSize: 11, color: "#B8B0A4", textAlign: "center", padding: 8 }}>No gift ideas yet</div>}</div>
            <div style={{ display: "flex", gap: 4 }}><input placeholder="Add gift idea..." value={newGift} onChange={e => setNewGift(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newGift.trim()) { upd({ gifts: [...gifts, { id: Date.now().toString(), text: newGift.trim(), given: false }] }); setNewGift(""); } }} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 11, color: "#1E1B18", outline: "none" }} /><button onClick={() => { if (newGift.trim()) { upd({ gifts: [...gifts, { id: Date.now().toString(), text: newGift.trim(), given: false }] }); setNewGift(""); } }} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: z.color, color: "white", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>+</button></div>
          </div>}

          {profileTab === "events" && <div>
            {(() => {
              const todayD = new Date(today + "T00:00:00");
              const futureEvents = [...events].filter(ev => ev.date && new Date(ev.date + "T00:00:00") >= todayD).sort((a, b) => a.date.localeCompare(b.date));
              const pastEvents = [...events].filter(ev => !ev.date || new Date(ev.date + "T00:00:00") < todayD).sort((a, b) => b.date.localeCompare(a.date));
              const renderEvent = (ev, i) => (
                <div key={ev.id || i} style={{ padding: "8px 10px", borderRadius: 8, background: "#FFFFFF", border: "1px solid #DDD8D0" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <button onClick={() => { const updated = events.map(x => x.id === ev.id ? { ...x, significant: !x.significant } : x); upd({ events: updated }); }} style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 6, border: ev.significant ? "1.5px solid #e8a84c" : "1.5px solid #E0DCD4", background: ev.significant ? "#e8a84c15" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, padding: 0 }}>
                      <span style={{ fontSize: 12, color: ev.significant ? "#e8a84c" : "#B8B0A4" }}>✦</span>
                    </button>
                    <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setEditingEvent({ personId: viewingPerson.id, event: { ...ev } })}>
                      <div style={{ fontSize: 12, color: "#1E1B18" }}>{ev.text}</div>
                      <div style={{ fontSize: 9, color: "#A09888", marginTop: 1 }}>{ev.date}{ev.significant ? " · repeats annually" : ""}</div>
                      {ev.privateNote && <div style={{ fontSize: 9, color: "#e8a84c", fontStyle: "italic", marginTop: 2 }}>📌 {ev.privateNote}</div>}
                    </div>
                    <button onClick={() => upd({ events: events.filter(x => (x.id || x.text) !== (ev.id || ev.text)) })} style={{ background: "none", border: "none", fontSize: 13, color: "#B8B0A4", cursor: "pointer", padding: "0 4px", flexShrink: 0 }}>×</button>
                  </div>
                </div>
              );
              return <>
                {futureEvents.length > 0 && <>{sH("UPCOMING")}<div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>{futureEvents.map(renderEvent)}</div></>}
                {pastEvents.length > 0 && <>{sH("PAST")}<div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>{pastEvents.map(renderEvent)}</div></>}
                {events.length === 0 && <div style={{ fontSize: 11, color: "#B8B0A4", textAlign: "center", padding: 8 }}>No events recorded</div>}
              </>;
            })()}
            {sH("ADD EVENT")}
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              <input placeholder="What's happening..." value={newEvent} onChange={e => setNewEvent(e.target.value)} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 11, color: "#1E1B18", outline: "none" }} />
              <div style={{ overflow: "hidden", width: 90, flexShrink: 0 }}><input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} style={{ display: "block", width: "100%", padding: "6px 4px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 9, color: "#6B6058", outline: "none", colorScheme: "light", boxSizing: "border-box", WebkitAppearance: "none", appearance: "none" }} /></div>
            </div>
            <div style={{ display: "flex", gap: 4, marginBottom: 4, alignItems: "center" }}>
              <input placeholder="Private note to self (optional)..." value={newEventPrivateNote} onChange={e => setNewEventPrivateNote(e.target.value)} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 11, color: "#1E1B18", outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
              <button onClick={() => setNewEventSignificant(p => !p)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${newEventSignificant ? "#e8a84c44" : "#E8E4DC"}`, cursor: "pointer", fontWeight: 600, fontSize: 10, background: newEventSignificant ? "#e8a84c12" : "transparent", color: newEventSignificant ? "#e8a84c" : "#8A8078" }}>✦ {newEventSignificant ? "Significant" : "Mark significant"}</button>
              <button onClick={() => { if (newEvent.trim()) { upd({ events: [...events, { id: Date.now().toString(), text: newEvent.trim(), date: newEventDate, significant: newEventSignificant, privateNote: newEventPrivateNote.trim() || null }] }); setNewEvent(""); setNewEventSignificant(false); setNewEventPrivateNote(""); } }} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: z.color, color: "white", fontWeight: 700, fontSize: 10, cursor: "pointer", marginLeft: "auto" }}>Add</button>
            </div>
          </div>}

          {profileTab === "notes" && <div>
            {sH("GENERAL NOTES")}
            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={6} placeholder="Anything you want to remember..." style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 12.5, color: "#1E1B18", outline: "none", lineHeight: 1.6 }} />
          </div>}

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={() => { setPeople(p => p.filter(x => x.id !== viewingPerson.id)); setModal(null); setViewingPerson(null); }} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(232,106,106,0.3)", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: 11, color: "#e86a6a" }}>Delete</button>
            <button onClick={() => { setModal(null); setViewingPerson(null); setProfileTab("info"); setLinkSearch(""); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #D6D0C6", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: 11, color: "#8A8078" }}>Cancel</button>
            <button onClick={() => { setPeople(p => p.map(b => b.id === viewingPerson.id ? { ...viewingPerson, notes: editNotes } : b)); setModal(null); setViewingPerson(null); setProfileTab("info"); setLinkSearch(""); }} style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: z.color, cursor: "pointer", fontWeight: 600, fontSize: 11, color: "white" }}>Save</button>
          </div>
        </Modal>);
      })()}

      {/* All Milestones Modal */}
      {showAllMilestones && (<Modal onClose={() => setShowAllMilestones(false)}>
        <div style={{ fontFamily: "'Lora'", fontSize: 16, fontWeight: 700, color: "#1E1B18", marginBottom: 14 }}>All Upcoming Milestones</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {allMilestones.map((m, i) => {
            const inRange = m.daysAway <= 90;
            return (
            <div key={m.event.id + "-" + i} onClick={() => { setEditingEvent({ personId: m.person.id, event: { ...m.event } }); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: inRange ? "#F0EDE6" : "#F5F2EB", border: `1px solid ${inRange ? "#E8E4DC" : "#F0EDE6"}`, cursor: "pointer", opacity: inRange ? 1 : 0.8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: m.daysAway === 0 ? "rgba(232,106,138,0.1)" : m.event.significant ? "rgba(232,168,76,0.1)" : "#EDEAE3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 13, color: m.daysAway === 0 ? "#e86a8a" : m.event.significant ? "#e8a84c" : "#8A8078" }}>{m.event.significant ? "✦" : "◆"}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 12, color: "#1E1B18" }}>{m.person.name}</div>
                <div style={{ fontSize: 10, color: "#8A8078" }}>{m.event.text}{m.isAnniversary ? ` (${m.years}yr)` : ""}</div>
                {m.event.privateNote && <div style={{ fontSize: 9, color: "#e8a84c", fontStyle: "italic", marginTop: 1 }}>📌 {m.event.privateNote}</div>}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: m.daysAway === 0 ? "#e86a8a" : m.daysAway <= 7 ? "#e8a84c" : m.daysAway <= 90 ? "#1E1B18" : "#8A8078" }}>{m.daysAway === 0 ? "Today" : m.daysAway === 1 ? "Tomorrow" : `${m.daysAway}d`}</div>
                <div style={{ fontSize: 9, color: "#8A8078", fontWeight: 500 }}>{m.event.date}</div>
              </div>
            </div>
          ); })}
          {allMilestones.length === 0 && <div style={{ fontSize: 11, color: "#B8B0A4", textAlign: "center", padding: 16 }}>No upcoming milestones</div>}
        </div>
        <button onClick={() => setShowAllMilestones(false)} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: accent, cursor: "pointer", fontWeight: 600, fontSize: 12, color: "white", marginTop: 14 }}>Close</button>
      </Modal>)}

      {/* Edit Event Modal */}
      {editingEvent && (<Modal onClose={() => setEditingEvent(null)}>
        <div style={{ fontFamily: "'Lora'", fontSize: 16, fontWeight: 700, color: "#1E1B18", marginBottom: 4 }}>Edit Event</div>
        <div style={{ fontSize: 10, color: "#8A8078", marginBottom: 14 }}>{(() => { const p = people.find(x => x.id === editingEvent.personId); return p ? p.name : ""; })()}</div>
        <input value={editingEvent.event.text} onChange={e => setEditingEvent(p => ({ ...p, event: { ...p.event, text: e.target.value } }))} placeholder="Event description..." style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 13, fontWeight: 600, color: "#1E1B18", marginBottom: 10, outline: "none" }} />
        <div style={{ overflow: "hidden", marginBottom: 10, width: "100%" }}><input type="date" value={editingEvent.event.date} onChange={e => setEditingEvent(p => ({ ...p, event: { ...p.event, date: e.target.value } }))} style={{ display: "block", width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 13, color: "#1E1B18", outline: "none", colorScheme: "light", boxSizing: "border-box", WebkitAppearance: "none", appearance: "none" }} /></div>
        <input value={editingEvent.event.privateNote || ""} onChange={e => setEditingEvent(p => ({ ...p, event: { ...p.event, privateNote: e.target.value } }))} placeholder="Private note to self (optional)..." style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 12, color: "#1E1B18", marginBottom: 12, outline: "none" }} />
        <button onClick={() => setEditingEvent(p => ({ ...p, event: { ...p.event, significant: !p.event.significant } }))} style={{ padding: "8px 14px", borderRadius: 8, border: editingEvent.event.significant ? "1.5px solid #e8a84c" : "1.5px solid #E0DCD4", cursor: "pointer", fontWeight: 600, fontSize: 11, background: editingEvent.event.significant ? "#e8a84c15" : "transparent", color: editingEvent.event.significant ? "#e8a84c" : "#8A8078", marginBottom: 16, display: "block" }}>✦ {editingEvent.event.significant ? "Significant — repeats annually" : "Mark as significant (annual reminder)"}</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setEditingEvent(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #D6D0C6", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: 12, color: "#8A8078" }}>Cancel</button>
          <button onClick={() => {
            setPeople(p => p.map(person => person.id === editingEvent.personId ? { ...person, events: (person.events || []).map(ev => ev.id === editingEvent.event.id ? { ...editingEvent.event, privateNote: editingEvent.event.privateNote || null } : ev) } : person));
            if (viewingPerson && viewingPerson.id === editingEvent.personId) {
              setViewingPerson(p => ({ ...p, events: (p.events || []).map(ev => ev.id === editingEvent.event.id ? { ...editingEvent.event, privateNote: editingEvent.event.privateNote || null } : ev) }));
            }
            setEditingEvent(null);
          }} style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: accent, cursor: "pointer", fontWeight: 600, fontSize: 12, color: "white" }}>Save</button>
        </div>
      </Modal>)}

      {viewingZodiac && (<Modal onClose={() => setViewingZodiac(null)}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Times New Roman', Georgia, serif", fontSize: 48, lineHeight: 1, color: viewingZodiac.color, fontVariantEmoji: "text", marginBottom: 8 }}>{viewingZodiac.symbol}</div>
          <div style={{ fontFamily: "'Lora'", fontSize: 20, fontWeight: 700, color: "#1E1B18" }}>{viewingZodiac.sign}</div>
          <div style={{ fontSize: 12, color: "#8A8078", marginTop: 4 }}>{months[viewingZodiac.start[0] - 1]} {viewingZodiac.start[1]} – {months[viewingZodiac.end[0] - 1]} {viewingZodiac.end[1]}</div>
        </div>
        <div style={{ background: `${viewingZodiac.color}08`, borderRadius: 10, padding: "12px 14px", marginBottom: 12, borderLeft: `3px solid ${viewingZodiac.color}` }}><div style={{ fontSize: 12, color: "#1E1B18", lineHeight: 1.6 }}>{viewingZodiac.traits}</div></div>
        <div style={{ marginBottom: 10 }}><div style={{ fontSize: 10, fontWeight: 700, color: viewingZodiac.color, marginBottom: 4, letterSpacing: 1 }}>LIKES</div><div style={{ fontSize: 12, color: "#6B6058", lineHeight: 1.5 }}>{viewingZodiac.likes}</div></div>
        <div style={{ marginBottom: 16 }}><div style={{ fontSize: 10, fontWeight: 700, color: viewingZodiac.color, marginBottom: 4, letterSpacing: 1 }}>DISLIKES</div><div style={{ fontSize: 12, color: "#6B6058", lineHeight: 1.5 }}>{viewingZodiac.dislikes}</div></div>
        <div style={{ fontSize: 10, color: "#B8B0A4", textAlign: "center", marginBottom: 12 }}>{people.filter(b => { const s = getZodiacSign(b.date); return s && s.sign === viewingZodiac.sign; }).length} {people.filter(b => { const s = getZodiacSign(b.date); return s && s.sign === viewingZodiac.sign; }).length !== 1 ? "people" : "person"} in your circle</div>
        <button onClick={() => setViewingZodiac(null)} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: viewingZodiac.color, cursor: "pointer", fontWeight: 600, fontSize: 12, color: "white" }}>Close</button>
      </Modal>)}

      {/* Add Place Modal */}
      {modal === "addPlace" && (<Modal onClose={() => setModal(null)}>
        <div style={{ fontFamily: "'Lora'", fontSize: 16, fontWeight: 700, color: "#1E1B18", marginBottom: 16 }}>Add Place</div>
        <input placeholder="Name..." value={newPlace.name} onChange={e => setNewPlace(p => ({ ...p, name: e.target.value }))} autoFocus style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 13, fontWeight: 600, color: "#1E1B18", marginBottom: 10, outline: "none" }} />
        <div style={{ fontSize: 9, fontWeight: 700, color: "#A09888", marginBottom: 5, letterSpacing: 1 }}>CATEGORY</div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
          {placeCategories.map(c => (<button key={c} onClick={() => setNewPlace(p => ({ ...p, category: c }))} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${newPlace.category === c ? accent + "44" : "#E8E4DC"}`, cursor: "pointer", fontWeight: 600, fontSize: 10, background: newPlace.category === c ? `${accent}12` : "transparent", color: newPlace.category === c ? accent : "#8A8078" }}>{c}</button>))}
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, color: "#A09888", marginBottom: 5, letterSpacing: 1 }}>RATING</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {[1,2,3,4,5].map(n => (<button key={n} onClick={() => setNewPlace(p => ({ ...p, rating: p.rating === n ? 0 : n }))} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", padding: "2px 4px", color: n <= newPlace.rating ? "#e8a84c" : "#D6D0C6" }}>★</button>))}
        </div>
        <input placeholder="Google Maps link (optional)..." value={newPlace.mapsUrl} onChange={e => setNewPlace(p => ({ ...p, mapsUrl: e.target.value }))} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 12, color: "#1E1B18", marginBottom: 10, outline: "none" }} />
        <textarea placeholder="Notes..." value={newPlace.notes} onChange={e => setNewPlace(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 12.5, color: "#1E1B18", marginBottom: 16, outline: "none", lineHeight: 1.5 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setModal(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid #D6D0C6", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: 12, color: "#8A8078" }}>Cancel</button>
          <button onClick={() => { if (!newPlace.name.trim()) return; setPlaces(p => [...p, { ...newPlace, id: Date.now().toString(), visits: [] }]); setNewPlace({ name: "", notes: "", rating: 0, mapsUrl: "", category: "" }); setModal(null); }} style={{ flex: 2, padding: "11px 0", borderRadius: 10, border: "none", background: accent, cursor: "pointer", fontWeight: 600, fontSize: 12, color: "white" }}>Save</button>
        </div>
      </Modal>)}

      {/* View Place Modal */}
      {modal === "viewPlace" && viewingPlace && (() => {
        const visits = viewingPlace.visits || [];
        const updP = (changes) => setViewingPlace(p => ({ ...p, ...changes }));
        const starsR = (n, setter) => <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(i => (<button key={i} onClick={() => setter(i)} style={{ fontSize: 18, background: "none", border: "none", cursor: "pointer", padding: "0 2px", color: i <= n ? "#e8a84c" : "#D6D0C6" }}>★</button>))}</div>;
        const addVisit = () => {
          const eventId = "evt_" + Date.now();
          const newVisit = { id: eventId, date: visitDate || TODAY(), note: visitNote.trim(), people: visitPeopleSelected.map(p => p.id) };
          updP({ visits: [...visits, newVisit] });
          if (visitPeopleSelected.length > 0) {
            setPeople(prev => prev.map(person => {
              if (visitPeopleSelected.find(vp => vp.id === person.id)) {
                return { ...person, touchpoints: [...(person.touchpoints || []), { id: "tp_" + Date.now() + "_" + person.id, type: "In Person", date: visitDate || TODAY(), note: (visitNote.trim() ? visitNote.trim() + " @ " : "") + viewingPlace.name, eventId, placeId: viewingPlace.id }] };
              }
              return person;
            }));
          }
          setVisitNote(""); setVisitDate(TODAY()); setVisitPeopleSearch(""); setVisitPeopleSelected([]);
        };
        const deleteVisit = (v) => {
          updP({ visits: visits.filter(x => x.id !== v.id) });
          if (v.people && v.people.length > 0) {
            setPeople(prev => prev.map(person => ({ ...person, touchpoints: (person.touchpoints || []).filter(tp => tp.eventId !== v.id) })));
          }
        };
        const saveVisitEdit = () => {
          if (!editingVisit) return;
          const oldVisit = visits.find(v => v.id === editingVisit.id);
          const oldPids = oldVisit ? (oldVisit.people || []) : [];
          const newPids = editingVisit.people || [];
          updP({ visits: visits.map(v => v.id === editingVisit.id ? editingVisit : v) });
          setPeople(prev => prev.map(person => {
            const was = oldPids.includes(person.id), is = newPids.includes(person.id);
            let tps = [...(person.touchpoints || [])];
            if (was && !is) tps = tps.filter(tp => tp.eventId !== editingVisit.id);
            else if (!was && is) tps.push({ id: "tp_" + Date.now() + "_" + person.id, type: "In Person", date: editingVisit.date, note: (editingVisit.note ? editingVisit.note + " @ " : "") + viewingPlace.name, eventId: editingVisit.id, placeId: viewingPlace.id });
            else if (was && is) tps = tps.map(tp => tp.eventId === editingVisit.id ? { ...tp, date: editingVisit.date, note: (editingVisit.note ? editingVisit.note + " @ " : "") + viewingPlace.name } : tp);
            return { ...person, touchpoints: tps };
          }));
          setEditingVisit(null); setEvPeopleSearch("");
        };
        const vpSR = visitPeopleSearch.length > 0 ? people.filter(p => p.name.toLowerCase().includes(visitPeopleSearch.toLowerCase()) && !visitPeopleSelected.find(s => s.id === p.id)).slice(0, 5) : [];
        const evSR = evPeopleSearch.length > 0 && editingVisit ? people.filter(p => p.name.toLowerCase().includes(evPeopleSearch.toLowerCase()) && !(editingVisit.people || []).includes(p.id)).slice(0, 5) : [];
        return (<Modal onClose={() => { setPlaces(p => p.map(x => x.id === viewingPlace.id ? viewingPlace : x)); setModal(null); setViewingPlace(null); }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 20, color: accent }}>◎</span></div>
            <div style={{ flex: 1 }}>
              <input value={viewingPlace.name} onChange={e => updP({ name: e.target.value })} style={{ width: "100%", fontSize: 16, fontWeight: 700, color: "#1E1B18", border: "none", background: "transparent", outline: "none", padding: 0, fontFamily: "'Lora', Georgia, serif" }} />
              <div style={{ fontSize: 10, color: "#8A8078" }}>{viewingPlace.category || "Uncategorized"} · {visits.length} visit{visits.length !== 1 ? "s" : ""}</div>
            </div>
          </div>
          {starsR(viewingPlace.rating, (n) => updP({ rating: viewingPlace.rating === n ? 0 : n }))}
          <div style={{ fontSize: 9, fontWeight: 700, color: "#A09888", marginBottom: 5, marginTop: 10, letterSpacing: 1 }}>CATEGORY</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
            {placeCategories.map(c => (<button key={c} onClick={() => updP({ category: c })} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${viewingPlace.category === c ? accent + "44" : "#E8E4DC"}`, cursor: "pointer", fontWeight: 600, fontSize: 10, background: viewingPlace.category === c ? `${accent}12` : "transparent", color: viewingPlace.category === c ? accent : "#8A8078" }}>{c}</button>))}
          </div>
          <input placeholder="Google Maps link..." value={viewingPlace.mapsUrl || ""} onChange={e => updP({ mapsUrl: e.target.value })} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 11, color: "#1E1B18", marginBottom: 4, outline: "none" }} />
          {viewingPlace.mapsUrl && <a href={viewingPlace.mapsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: accent, fontWeight: 600, display: "inline-block", marginBottom: 8 }}>Open in Maps →</a>}
          {!viewingPlace.mapsUrl && <div style={{ marginBottom: 8 }} />}
          <textarea value={viewingPlace.notes || ""} onChange={e => updP({ notes: e.target.value })} rows={2} placeholder="Notes..." style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 11, color: "#1E1B18", marginBottom: 12, outline: "none", lineHeight: 1.5 }} />
          <div style={{ fontSize: 9, fontWeight: 700, color: "#A09888", marginBottom: 5, letterSpacing: 1 }}>LOG A VISIT</div>
          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            <input placeholder="What happened..." value={visitNote} onChange={e => setVisitNote(e.target.value)} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 11, color: "#1E1B18", outline: "none" }} />
            <div style={{ overflow: "hidden", width: 90, flexShrink: 0 }}><input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} style={{ display: "block", width: "100%", padding: "6px 4px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 9, color: "#6B6058", outline: "none", colorScheme: "light", boxSizing: "border-box", WebkitAppearance: "none", appearance: "none" }} /></div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: visitPeopleSelected.length > 0 ? 6 : 0 }}>
            {visitPeopleSelected.map(p => (<span key={p.id} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: `${accent}12`, color: accent, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>{p.name}<button onClick={() => setVisitPeopleSelected(s => s.filter(x => x.id !== p.id))} style={{ background: "none", border: "none", fontSize: 10, color: accent, cursor: "pointer", padding: 0, opacity: 0.5 }}>×</button></span>))}
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
            <input placeholder="Tag people..." value={visitPeopleSearch} onChange={e => setVisitPeopleSearch(e.target.value)} style={{ flex: 1, padding: "6px 10px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 11, color: "#1E1B18", outline: "none" }} />
            <button onClick={addVisit} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: accent, color: "white", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>Log</button>
          </div>
          {vpSR.length > 0 && <div style={{ border: "1px solid #D6D0C6", borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>{vpSR.map(p => (<div key={p.id} onClick={() => { setVisitPeopleSelected(s => [...s, p]); setVisitPeopleSearch(""); }} style={{ padding: "7px 10px", fontSize: 11, color: "#1E1B18", cursor: "pointer", borderBottom: "0.5px solid #EDE9E2", background: "#F0EDE6" }}>{p.name}</div>))}</div>}
          <div style={{ fontSize: 9, fontWeight: 700, color: "#A09888", marginBottom: 5, marginTop: 8, letterSpacing: 1 }}>VISIT HISTORY</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[...visits].reverse().map((v, i) => {
              const isEd = editingVisit && editingVisit.id === v.id;
              if (isEd) return (
                <div key={v.id || i} style={{ padding: "8px 10px", borderRadius: 8, background: `${accent}06`, border: `1px solid ${accent}22` }}>
                  <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                    <input value={editingVisit.note} onChange={e => setEditingVisit(p => ({ ...p, note: e.target.value }))} placeholder="Note..." style={{ flex: 1, padding: "5px 8px", borderRadius: 5, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 10, color: "#1E1B18", outline: "none" }} />
                    <div style={{ overflow: "hidden", width: 85, flexShrink: 0 }}><input type="date" value={editingVisit.date} onChange={e => setEditingVisit(p => ({ ...p, date: e.target.value }))} style={{ display: "block", width: "100%", padding: "5px 4px", borderRadius: 5, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 9, color: "#1E1B18", outline: "none", colorScheme: "light", boxSizing: "border-box", WebkitAppearance: "none", appearance: "none" }} /></div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 6 }}>
                    {(editingVisit.people || []).map(pid => { const person = people.find(x => x.id === pid); return person ? <span key={pid} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${accent}12`, color: accent, fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}>{person.name}<button onClick={() => setEditingVisit(p => ({ ...p, people: (p.people || []).filter(x => x !== pid) }))} style={{ background: "none", border: "none", fontSize: 9, color: accent, cursor: "pointer", padding: 0, opacity: 0.5 }}>×</button></span> : null; })}
                  </div>
                  <div style={{ display: "flex", gap: 4, marginBottom: evSR.length > 0 ? 4 : 6 }}>
                    <input placeholder="Tag people..." value={evPeopleSearch} onChange={e => setEvPeopleSearch(e.target.value)} style={{ flex: 1, padding: "5px 8px", borderRadius: 5, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 10, color: "#1E1B18", outline: "none" }} />
                  </div>
                  {evSR.length > 0 && <div style={{ border: "1px solid #D6D0C6", borderRadius: 6, overflow: "hidden", marginBottom: 6 }}>{evSR.map(p => (<div key={p.id} onClick={() => { setEditingVisit(prev => ({ ...prev, people: [...(prev.people || []), p.id] })); setEvPeopleSearch(""); }} style={{ padding: "6px 8px", fontSize: 10, color: "#1E1B18", cursor: "pointer", borderBottom: "0.5px solid #EDE9E2", background: "#F0EDE6" }}>{p.name}</div>))}</div>}
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => { setEditingVisit(null); setEvPeopleSearch(""); }} style={{ flex: 1, padding: "5px 0", borderRadius: 5, border: "1px solid #D6D0C6", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: 10, color: "#8A8078" }}>Cancel</button>
                    <button onClick={saveVisitEdit} style={{ flex: 1, padding: "5px 0", borderRadius: 5, border: "none", background: accent, cursor: "pointer", fontWeight: 600, fontSize: 10, color: "white" }}>Save</button>
                  </div>
                </div>
              );
              return (
              <div key={v.id || i} onClick={() => { setEditingVisit({ ...v }); setEvPeopleSearch(""); }} style={{ padding: "8px 10px", borderRadius: 8, background: "#FFFFFF", border: "1px solid #DDD8D0", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    {v.note && <div style={{ fontSize: 12, color: "#1E1B18", marginBottom: 2 }}>{v.note}</div>}
                    <div style={{ fontSize: 9, color: "#A09888" }}>{v.date}</div>
                    {v.people && v.people.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>{v.people.map(pid => { const person = people.find(x => x.id === pid); return person ? <span key={pid} style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: `${accent}10`, color: accent, fontWeight: 600 }}>{person.name}</span> : null; })}</div>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteVisit(v); }} style={{ background: "none", border: "none", fontSize: 13, color: "#B8B0A4", cursor: "pointer", padding: "0 4px" }}>×</button>
                </div>
              </div>
              );
            })}
            {visits.length === 0 && <div style={{ fontSize: 11, color: "#B8B0A4", textAlign: "center", padding: 8 }}>No visits logged yet</div>}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={() => { setPlaces(p => p.filter(x => x.id !== viewingPlace.id)); setModal(null); setViewingPlace(null); }} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(232,106,106,0.3)", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: 11, color: "#e86a6a" }}>Delete</button>
            <button onClick={() => { setModal(null); setViewingPlace(null); }} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #D6D0C6", background: "transparent", cursor: "pointer", fontWeight: 600, fontSize: 11, color: "#8A8078" }}>Cancel</button>
            <button onClick={() => { setPlaces(p => p.map(x => x.id === viewingPlace.id ? viewingPlace : x)); setModal(null); setViewingPlace(null); }} style={{ flex: 2, padding: "10px 0", borderRadius: 10, border: "none", background: accent, cursor: "pointer", fontWeight: 600, fontSize: 11, color: "white" }}>Save</button>
          </div>
        </Modal>);
      })()}

      {/* Edit Categories Modal */}
      {editingCategory && (<Modal onClose={() => setEditingCategory(false)}>
        <div style={{ fontFamily: "'Lora'", fontSize: 16, fontWeight: 700, color: "#1E1B18", marginBottom: 14 }}>Edit Categories</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
          {placeCategories.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "#FFFFFF", border: "1px solid #DDD8D0" }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#1E1B18" }}>{c}</span>
              <button onClick={() => setPlaceCategories(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", fontSize: 13, color: "#B8B0A4", cursor: "pointer", padding: "0 4px" }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          <input placeholder="New category..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newCategoryName.trim()) { setPlaceCategories(p => [...p, newCategoryName.trim()]); setNewCategoryName(""); } }} style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 12, color: "#1E1B18", outline: "none" }} />
          <button onClick={() => { if (newCategoryName.trim()) { setPlaceCategories(p => [...p, newCategoryName.trim()]); setNewCategoryName(""); } }} style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: accent, color: "white", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>+</button>
        </div>
        <button onClick={() => setEditingCategory(false)} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: accent, cursor: "pointer", fontWeight: 600, fontSize: 12, color: "white" }}>Done</button>
      </Modal>)}

      {/* Edit People Tags Modal */}
      {editingPeopleTags && (<Modal onClose={() => setEditingPeopleTags(false)}>
        <div style={{ fontFamily: "'Lora'", fontSize: 16, fontWeight: 700, color: "#1E1B18", marginBottom: 14 }}>Edit People Tags</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
          {peopleTags.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "#FFFFFF", border: "1px solid #DDD8D0" }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#1E1B18" }}>{c}</span>
              <span style={{ fontSize: 9, color: "#A09888" }}>{people.filter(p => (p.tags || []).includes(c)).length}</span>
              <button onClick={() => setPeopleTags(p => p.filter((_, j) => j !== i))} style={{ background: "none", border: "none", fontSize: 13, color: "#B8B0A4", cursor: "pointer", padding: "0 4px" }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          <input placeholder="New tag..." value={newPeopleTagName} onChange={e => setNewPeopleTagName(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newPeopleTagName.trim()) { setPeopleTags(p => [...p, newPeopleTagName.trim()]); setNewPeopleTagName(""); } }} style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #D6D0C6", background: "#EDEAE3", fontSize: 12, color: "#1E1B18", outline: "none" }} />
          <button onClick={() => { if (newPeopleTagName.trim()) { setPeopleTags(p => [...p, newPeopleTagName.trim()]); setNewPeopleTagName(""); } }} style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: accent, color: "white", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>+</button>
        </div>
        <button onClick={() => setEditingPeopleTags(false)} style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: accent, cursor: "pointer", fontWeight: 600, fontSize: 12, color: "white" }}>Done</button>
      </Modal>)}
    </div>
  );
}
