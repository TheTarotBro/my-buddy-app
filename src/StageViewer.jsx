import { useState } from "react";
import { EggStage, BirdL1, BirdL2, BirdL3, BirdL4, SnakeL1, SnakeL2, SnakeL3, SnakeL4, MonkeyL1, MonkeyL2, MonkeyL3, MonkeyL4, RobotL1, RobotL2, RobotL3, RobotL4 } from "./buddies.jsx";

const BUDDIES = {
  bird: { name: "Pip", accent: "#5bc9e8", stages: [EggStage, BirdL1, BirdL2, BirdL3, BirdL4] },
  snake: { name: "Slynk", accent: "#6ee7a0", stages: [EggStage, SnakeL1, SnakeL2, SnakeL3, SnakeL4] },
  monkey: { name: "Mochi", accent: "#e8a84c", stages: [EggStage, MonkeyL1, MonkeyL2, MonkeyL3, MonkeyL4] },
  robot: { name: "Bolt", accent: "#b07ae8", stages: [EggStage, RobotL1, RobotL2, RobotL3, RobotL4] },
};

const LEVEL_NAMES = ["Egg", "Hatchling", "Fledgling", "Juvenile", "Adult"];

export default function StageViewer() {
  const [buddy, setBuddy] = useState("bird");
  const [mood, setMood] = useState("happy");
  const b = BUDDIES[buddy];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0ea", fontFamily: "'Inter', -apple-system, sans-serif", padding: "20px 16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap');
        * { box-sizing: border-box; margin: 0; }
        button { font-family: 'Inter', sans-serif; }
        button:active { transform: scale(0.97); }
      `}</style>

      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#3a2e24", marginBottom: 4 }}>Buddy Stage Viewer</h1>
      <p style={{ fontSize: 12, color: "#8a7a6a", marginBottom: 16 }}>Preview all 5 evolution phases for each buddy type and mood.</p>

      {/* Buddy selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {Object.entries(BUDDIES).map(([id, b]) => (
          <button key={id} onClick={() => setBuddy(id)} style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: buddy === id ? `2px solid ${b.accent}` : "1px solid rgba(90,74,62,0.1)",
            background: buddy === id ? `${b.accent}15` : "rgba(90,74,62,0.03)", cursor: "pointer",
            fontWeight: 700, fontSize: 12, color: buddy === id ? b.accent : "#6b5c4d",
          }}>{b.name}</button>
        ))}
      </div>

      {/* Mood selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {["happy", "content", "sad"].map(m => (
          <button key={m} onClick={() => setMood(m)} style={{
            flex: 1, padding: "8px 0", borderRadius: 8, border: mood === m ? "2px solid #3a2e24" : "1px solid rgba(90,74,62,0.1)",
            background: mood === m ? "rgba(58,46,36,0.08)" : "rgba(90,74,62,0.03)", cursor: "pointer",
            fontWeight: 600, fontSize: 12, color: mood === m ? "#3a2e24" : "#8a7a6a", textTransform: "capitalize",
          }}>{m === "happy" ? "😊 Happy" : m === "content" ? "😌 Content" : "😢 Sad"}</button>
        ))}
      </div>

      {/* Stage grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {b.stages.map((Stage, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px",
            background: "rgba(90,74,62,0.03)", borderRadius: 12, border: "1px solid rgba(90,74,62,0.06)",
          }}>
            <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", width: 100 }}>
              {i === 0 ? <Stage size={80} accent={b.accent} /> : <Stage size={80} accent={b.accent} mood={mood} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#3a2e24" }}>Level {i}{i > 0 ? ` — ${LEVEL_NAMES[i]}` : ""}</div>
              <div style={{ fontSize: 11, color: "#8a7a6a", marginTop: 2 }}>{LEVEL_NAMES[i]}</div>
              <div style={{ fontSize: 10, color: "#b4a494", marginTop: 4 }}>
                {i === 0 && "All buddies start here. Cracks hint at what's inside."}
                {i === 1 && "Just hatched. Oversized head, tiny body, huge eyes."}
                {i === 2 && "Growing up. Real wings/limbs, starting to show personality."}
                {i === 3 && "Nearly mature. Full features, confident presence."}
                {i === 4 && "Fully evolved. Majestic, detailed, glowing with power."}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}