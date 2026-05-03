/* global React */
// Screens beyond the dashboard exploration.
// Each export is a {Comp, label, desc, variations: [{num,name,desc,Comp}]} bundle.

const PLAYERS2 = [
  { initial: "M", name: "Me",     net: +320 },
  { initial: "J", name: "Jonah",  net: +185 },
  { initial: "A", name: "Alex",   net:  +40 },
  { initial: "S", name: "Sam",    net:  -55 },
  { initial: "R", name: "Riley",  net: -120 },
  { initial: "T", name: "Tay",    net: -370 },
];
const money2 = (n) => (n >= 0 ? `+$${n}` : `\u2212\u00A0$${Math.abs(n)}`);

// =====================================================
// SESSION ENTRY — variation 1: Step-by-step wizard
// =====================================================
function EntryWizard() {
  return (
    <div className="screen">
      <div className="sk-row between">
        <span className="h-mono">step 2 of 3</span>
        <span className="h-mono" style={{ color: "var(--felt)" }}>cancel</span>
      </div>
      <div className="h-script" style={{ fontSize: 24, lineHeight: 1 }}>Buy-ins &amp; cash-outs</div>

      {/* progress dots */}
      <div className="sk-row" style={{ gap: 6 }}>
        <div style={{ flex: 1, height: 4, background: "var(--felt)", borderRadius: 2 }}></div>
        <div style={{ flex: 1, height: 4, background: "var(--felt)", borderRadius: 2 }}></div>
        <div style={{ flex: 1, height: 4, background: "rgba(0,0,0,0.15)", borderRadius: 2 }}></div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
        {PLAYERS2.slice(0,5).map((p,i) => (
          <div key={p.name} className="sk-box dim" style={{ padding: "8px 10px" }}>
            <div className="sk-row between">
              <span className="sk-row" style={{ gap: 8 }}>
                <span className="sk-avatar sm">{p.initial}</span>
                <span className="h-script" style={{ fontSize: 17 }}>{p.name}</span>
              </span>
              <span className={`${p.net >= 0 ? "num-pos" : "num-neg"} nowrap`} style={{ fontFamily: "var(--script)", fontSize: 17 }}>
                {money2(p.net)}
              </span>
            </div>
            <div className="sk-row" style={{ gap: 6, marginTop: 6 }}>
              <div className="sk-box" style={{ flex: 1, padding: "4px 8px", background: "#fff" }}>
                <div className="h-mono" style={{ fontSize: 9 }}>buy-in</div>
                <div className="h-script nowrap" style={{ fontSize: 16 }}>$200</div>
              </div>
              <div className="sk-box" style={{ flex: 1, padding: "4px 8px", background: "#fff" }}>
                <div className="h-mono" style={{ fontSize: 9 }}>cash-out</div>
                <div className="h-script nowrap" style={{ fontSize: 16 }}>${200 + p.net}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto", marginLeft: -14, marginRight: -14, padding: "10px 14px 14px", borderTop: "1.5px solid var(--ink)", display: "flex", gap: 8, background: "#faf6ec" }}>
        <button className="sk-pill ghost" style={{ flex: 1, padding: "8px 0", fontSize: 14 }}>← back</button>
        <button className="sk-pill felt" style={{ flex: 2, padding: "8px 0", fontSize: 14 }}>next: review →</button>
      </div>

      <div className="annot" style={{ top: 80, right: -100, width: 110 }}>linear, guided</div>
    </div>
  );
}

// =====================================================
// SESSION ENTRY — variation 2: Single-page roster grid
// =====================================================
function EntryGrid() {
  return (
    <div className="screen">
      <div className="sk-row between">
        <span className="h-script nowrap" style={{ fontSize: 22 }}>New session</span>
        <span className="h-mono" style={{ color: "var(--felt)" }}>save</span>
      </div>

      <div className="sk-row" style={{ gap: 6 }}>
        <div className="sk-box dashed" style={{ flex: 1, padding: "4px 8px" }}>
          <div className="h-mono">date</div>
          <div className="h-hand">apr 25, 2026</div>
        </div>
        <div className="sk-box dashed" style={{ flex: 1, padding: "4px 8px" }}>
          <div className="h-mono">venue</div>
          <div className="h-hand">Jonah's</div>
        </div>
      </div>

      {/* mini header */}
      <div className="sk-row" style={{ gap: 6, padding: "0 4px" }}>
        <span className="h-mono" style={{ flex: 2 }}>player</span>
        <span className="h-mono" style={{ flex: 1, textAlign: "right" }}>buy-in</span>
        <span className="h-mono" style={{ flex: 1, textAlign: "right" }}>out</span>
        <span className="h-mono" style={{ flex: 1, textAlign: "right" }}>net</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {PLAYERS2.slice(0,6).map(p => (
          <div key={p.name} className="sk-row" style={{ gap: 6, fontFamily: "var(--hand)", fontSize: 13 }}>
            <span style={{ flex: 2 }} className="sk-row">
              <span className="sk-avatar sm" style={{ marginRight: 6 }}>{p.initial}</span>{p.name}
            </span>
            <span className="sk-box" style={{ flex: 1, padding: "2px 4px", textAlign: "right", fontSize: 12 }}>200</span>
            <span className="sk-box" style={{ flex: 1, padding: "2px 4px", textAlign: "right", fontSize: 12 }}>{200 + p.net}</span>
            <span className={`${p.net >= 0 ? "num-pos" : "num-neg"} nowrap`} style={{ flex: 1, textAlign: "right", fontFamily: "var(--script)", fontSize: 15 }}>
              {money2(p.net)}
            </span>
          </div>
        ))}
        <div className="sk-row" style={{ gap: 6, padding: "0 4px", marginTop: 4, borderTop: "1.5px dashed var(--ink)", paddingTop: 4 }}>
          <span className="h-mono" style={{ flex: 2 }}>+ add player</span>
          <span className="h-mono" style={{ flex: 3, textAlign: "right" }}>total: $0 ✓</span>
        </div>
      </div>

      <div className="sk-tabs">
        <div className="tab">Me</div>
        <div className="tab">Board</div>
        <div className="tab">Sessions</div>
        <div className="tab active">+</div>
      </div>

      <div className="annot" style={{ top: 80, right: -100, width: 110 }}>spreadsheet feel</div>
    </div>
  );
}

// =====================================================
// SESSION ENTRY — variation 3: Chip-stack quick-add
// =====================================================
function EntryChip() {
  return (
    <div className="screen">
      <div className="sk-row between">
        <span className="h-mono">apr 25 · jonah's</span>
        <span className="h-mono" style={{ color: "var(--felt)" }}>done</span>
      </div>

      <div className="sk-box felt" style={{ padding: "10px 12px" }}>
        <div className="h-mono" style={{ color: "rgba(255,255,255,0.7)" }}>currently entering</div>
        <div className="h-script" style={{ fontSize: 22 }}>Tay's chips</div>
        <div className="num-big nowrap" style={{ color: "#fdfaef", fontSize: 30, marginTop: 2 }}>−&nbsp;$370</div>
      </div>

      {/* chip tray */}
      <div className="h-mono">tap chips to add</div>
      <div className="sk-row" style={{ gap: 8, justifyContent: "center", padding: "8px 0" }}>
        {[
          { c: "felt", label: "$25" },
          { c: "blue", label: "$50" },
          { c: "",     label: "$100" },
          { c: "felt", label: "$200" },
        ].map((ch,i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div className={`sk-chip lg ${ch.c}`} style={{ width: 38, height: 38, borderWidth: 2 }}></div>
            <span className="h-script" style={{ fontSize: 13 }}>{ch.label}</span>
          </div>
        ))}
      </div>

      {/* roster strip */}
      <div className="h-mono">jump to player</div>
      <div className="sk-row" style={{ gap: 6, overflowX: "hidden" }}>
        {PLAYERS2.map((p,i) => (
          <div key={p.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, opacity: i === 5 ? 1 : 0.5 }}>
            <div className="sk-avatar" style={{
              width: 30, height: 30, fontSize: 15,
              background: i === 5 ? "var(--felt)" : "#fff",
              color: i === 5 ? "#fdfaef" : "var(--ink)",
              borderColor: i === 5 ? "#1f5634" : "var(--ink)",
              borderWidth: i === 5 ? 2 : 1.3,
            }}>{p.initial}</div>
            <span className="h-mono" style={{ fontSize: 8 }}>{i < 5 ? "✓" : "..."}</span>
          </div>
        ))}
      </div>

      <div className="sk-box dashed" style={{ marginTop: 4 }}>
        <div className="sk-row between">
          <span className="h-mono">running total</span>
          <span className="h-script nowrap" style={{ fontSize: 16, color: "var(--felt)" }}>$0 ✓</span>
        </div>
      </div>

      <div className="sk-tabs">
        <div className="tab">Me</div>
        <div className="tab">Board</div>
        <div className="tab">Sessions</div>
        <div className="tab active">+</div>
      </div>

      <div className="annot" style={{ top: 110, right: -100, width: 110 }}>tactile, table-side</div>
    </div>
  );
}

// =====================================================
// PLAYER PROFILE — variation 1: Trophy case
// =====================================================
function ProfileTrophy() {
  return (
    <div className="screen">
      <div className="sk-row between">
        <span className="h-mono">← players</span>
        <span className="h-mono">share</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 0" }}>
        <div className="sk-avatar" style={{ width: 64, height: 64, fontSize: 32, borderWidth: 2 }}>J</div>
        <div className="h-script" style={{ fontSize: 26, lineHeight: 1 }}>Jonah</div>
        <div className="h-mono">"the river rat" · 24 sessions</div>
      </div>

      <div className="sk-row" style={{ gap: 8 }}>
        <div className="sk-box dim" style={{ flex: 1, textAlign: "center", padding: "6px 4px" }}>
          <div className="h-mono">all-time</div>
          <div className="h-script nowrap num-pos" style={{ fontSize: 22 }}>+$740</div>
        </div>
        <div className="sk-box dim" style={{ flex: 1, textAlign: "center", padding: "6px 4px" }}>
          <div className="h-mono">win rate</div>
          <div className="h-script" style={{ fontSize: 22 }}>58%</div>
        </div>
      </div>

      <div className="h-mono" style={{ marginTop: 2 }}>★ trophies</div>
      <div className="sk-row" style={{ gap: 6, flexWrap: "wrap" }}>
        {["🦈 Shark", "🔥 3-streak", "💸 +$500 night", "🎯 Bluff king", "🪙 Comeback"].map(t => (
          <span key={t} className="sk-pill" style={{ fontSize: 11 }}>{t}</span>
        ))}
      </div>

      <div className="h-mono" style={{ marginTop: 4 }}>vs. the table</div>
      <div className="sk-box dim" style={{ padding: "8px 10px" }}>
        {[
          { name: "Me", v: -85 },
          { name: "Tay", v: +210 },
          { name: "Sam", v: +160 },
        ].map(r => (
          <div key={r.name} className="sk-row between" style={{ fontFamily: "var(--hand)", fontSize: 13 }}>
            <span>vs {r.name}</span>
            <span className={`${r.v >= 0 ? "num-pos" : "num-neg"} nowrap`} style={{ fontFamily: "var(--script)", fontSize: 16 }}>
              {money2(r.v)}
            </span>
          </div>
        ))}
      </div>

      <div className="sk-tabs">
        <div className="tab">Me</div>
        <div className="tab">Board</div>
        <div className="tab active">Players</div>
        <div className="tab">+</div>
      </div>

      <div className="annot" style={{ top: 100, right: -100, width: 110 }}>brag-page energy</div>
    </div>
  );
}

// =====================================================
// PLAYER PROFILE — variation 2: Stats sheet
// =====================================================
function ProfileStats() {
  return (
    <div className="screen">
      <div className="sk-row" style={{ gap: 8 }}>
        <div className="sk-avatar lg">J</div>
        <div style={{ flex: 1 }}>
          <div className="h-script" style={{ fontSize: 22, lineHeight: 1 }}>Jonah</div>
          <div className="h-mono">24 sessions · joined 2024</div>
        </div>
        <span className="h-mono">⋯</span>
      </div>

      <div className="sk-box" style={{ padding: 10 }}>
        <div className="h-mono">cumulative bankroll</div>
        <div className="num-big num-pos nowrap" style={{ fontSize: 28, marginTop: 2 }}>+$740</div>
        <div className="sk-chart" style={{ marginTop: 8, height: 60 }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 0 80 L 12 75 L 24 65 L 36 70 L 48 50 L 60 55 L 72 35 L 84 28 L 100 20"
              fill="none" stroke="var(--felt)" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          ["win rate", "58%"],
          ["$/hour", "+$8"],
          ["best night", "+$420"],
          ["worst", "−$280"],
          ["avg buy-in", "$200"],
          ["sessions", "24"],
        ].map(([k,v]) => (
          <div key={k} className="sk-box dim" style={{ padding: "5px 8px" }}>
            <div className="h-mono">{k}</div>
            <div className="h-script nowrap" style={{ fontSize: 16 }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="h-mono">recent sessions</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {[+120, -45, +220, -30, +90].map((v,i) => (
          <div key={i} className="sk-row between" style={{ fontFamily: "var(--hand)", fontSize: 13 }}>
            <span>apr {25 - i*7}</span>
            <span className={`${v >= 0 ? "num-pos" : "num-neg"} nowrap`} style={{ fontFamily: "var(--script)", fontSize: 16 }}>
              {money2(v)}
            </span>
          </div>
        ))}
      </div>

      <div className="sk-tabs">
        <div className="tab">Me</div>
        <div className="tab">Board</div>
        <div className="tab active">Players</div>
        <div className="tab">+</div>
      </div>

      <div className="annot" style={{ top: 90, right: -100, width: 110 }}>data-dense, neutral</div>
    </div>
  );
}

// =====================================================
// SESSION DETAIL — variation 1: Recap card
// =====================================================
function DetailRecap() {
  return (
    <div className="screen">
      <div className="sk-row between">
        <span className="h-mono">← sessions</span>
        <span className="h-mono">edit</span>
      </div>

      <div className="sk-box felt" style={{ padding: "10px 12px" }}>
        <div className="h-mono" style={{ color: "rgba(255,255,255,0.7)" }}>sat · apr 25 · 4h 20m</div>
        <div className="h-script" style={{ fontSize: 24, lineHeight: 1 }}>Jonah's Basement</div>
        <div className="h-script nowrap" style={{ fontSize: 14, color: "#fdfaef", marginTop: 4 }}>$1,140 changed hands</div>
      </div>

      <div className="h-mono">★ award of the night</div>
      <div className="sk-box dashed" style={{ paddingBottom: 10 }}>
        <div className="h-script" style={{ fontSize: 15, lineHeight: 1.2 }}>"Tay rivered a flush &amp; lost it on the turn"</div>
        <div className="h-mono" style={{ marginTop: 8 }}>tilt of the night</div>
      </div>

      <div className="h-mono">results</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {PLAYERS2.map(p => (
          <div key={p.name} className="sk-row between" style={{ fontFamily: "var(--hand)", fontSize: 13 }}>
            <span className="sk-row" style={{ gap: 6 }}>
              <span className="sk-avatar sm">{p.initial}</span>{p.name}
            </span>
            <span className="sk-row" style={{ gap: 8 }}>
              <span className="h-mono" style={{ fontSize: 9 }}>${200} → ${200+p.net}</span>
              <span className={`${p.net >= 0 ? "num-pos" : "num-neg"} nowrap`} style={{ fontFamily: "var(--script)", fontSize: 16 }}>
                {money2(p.net)}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="sk-tabs">
        <div className="tab">Me</div>
        <div className="tab">Board</div>
        <div className="tab active">Sessions</div>
        <div className="tab">+</div>
      </div>

      <div className="annot" style={{ top: 70, right: -100, width: 110 }}>recap = the story</div>
    </div>
  );
}

// =====================================================
// SESSION DETAIL — variation 2: Bar chart split
// =====================================================
function DetailBars() {
  return (
    <div className="screen">
      <div className="sk-row between">
        <span className="h-mono">← back</span>
        <span className="h-mono">⋯</span>
      </div>
      <div>
        <div className="h-script nowrap" style={{ fontSize: 22, lineHeight: 1 }}>Apr 25 · Jonah's</div>
        <div className="h-mono">6 players · 4h 20m · $1,140 pot flow</div>
      </div>

      {/* per-player bar — winners up, losers down */}
      <div style={{ marginTop: 6 }}>
        <div className="sk-row" style={{ alignItems: "end", gap: 6, height: 110, borderBottom: "1.5px solid var(--ink)" }}>
          {PLAYERS2.map(p => {
            const max = 380;
            const h = Math.abs(p.net) / max * 50;
            return (
              <div key={p.name} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", position: "relative" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                  {p.net >= 0 && <div style={{
                    width: "100%", height: `${h}%`,
                    background: "var(--felt)", border: "1.3px solid #1f5634",
                    borderRadius: "3px 3px 0 0",
                  }}></div>}
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-start", width: "100%" }}>
                  {p.net < 0 && <div style={{
                    width: "100%", height: `${h}%`,
                    background: "var(--chip-red)", border: "1.3px solid #8c2d24",
                    borderRadius: "0 0 3px 3px",
                  }}></div>}
                </div>
              </div>
            );
          })}
        </div>
        <div className="sk-row" style={{ gap: 6, marginTop: 4 }}>
          {PLAYERS2.map(p => (
            <div key={p.name} style={{ flex: 1, textAlign: "center" }}>
              <div className="h-script" style={{ fontSize: 12, lineHeight: 1 }}>{p.name}</div>
              <div className={`${p.net >= 0 ? "num-pos" : "num-neg"} nowrap h-mono`} style={{ fontSize: 9 }}>{money2(p.net)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="sk-row" style={{ gap: 6 }}>
        <div className="sk-box dim" style={{ flex: 1, textAlign: "center", padding: "5px 4px" }}>
          <div className="h-mono">winners</div>
          <div className="h-script nowrap num-pos" style={{ fontSize: 18 }}>+$545</div>
        </div>
        <div className="sk-box dim" style={{ flex: 1, textAlign: "center", padding: "5px 4px" }}>
          <div className="h-mono">losers</div>
          <div className="h-script nowrap num-neg" style={{ fontSize: 18 }}>−&nbsp;$545</div>
        </div>
      </div>

      <div className="h-mono">notes</div>
      <div className="sk-box dashed" style={{ padding: "6px 8px" }}>
        <div className="sk-line mid"></div>
        <div className="sk-line short" style={{ marginTop: 4 }}></div>
      </div>

      <div className="sk-tabs">
        <div className="tab">Me</div>
        <div className="tab">Board</div>
        <div className="tab active">Sessions</div>
        <div className="tab">+</div>
      </div>

      <div className="annot" style={{ top: 90, right: -100, width: 110 }}>visual at a glance</div>
    </div>
  );
}

Object.assign(window, {
  EntryWizard, EntryGrid, EntryChip,
  ProfileTrophy, ProfileStats,
  DetailRecap, DetailBars,
});
