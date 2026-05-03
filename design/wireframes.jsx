/* global React, ReactDOM */
const { useState, useEffect } = React;

// ----- shared data (placeholder) -----
const PLAYERS = [
  { initial: "M", name: "Me",     net: +320 },
  { initial: "J", name: "Jonah",  net: +185 },
  { initial: "A", name: "Alex",   net:  +40 },
  { initial: "S", name: "Sam",    net:  -55 },
  { initial: "R", name: "Riley",  net: -120 },
  { initial: "T", name: "Tay",    net: -370 },
];

// tiny sketchy line chart — wobbly polyline
function SketchLine({ points, color = "#1a1a1a", width = 2 }) {
  // points: array of [x,y] in 0..100 normalized, y=0 top
  const path = points
    .map(([x, y], i) => {
      const jitter = (Math.sin(i * 13.7) * 0.6).toFixed(2);
      return `${i === 0 ? "M" : "L"} ${x} ${(y + +jitter).toFixed(2)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d={path} fill="none" stroke={color} strokeWidth={width}
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// helper: format currency placeholder style — uses non-breaking hyphen + nbsp
const money = (n) => (n >= 0 ? `+$${n}` : `\u2212\u00A0$${Math.abs(n)}`);
const moneyClass = "nowrap";

// =====================================================
// DIRECTION A — Session-first / Last night recap hero
// =====================================================
function DirA({ funNames }) {
  const winnerLabel = funNames ? "🏆 Tonight's Shark" : "Top Winner";
  const loserLabel  = funNames ? "💀 Donated Most"   : "Biggest Loss";
  return (
    <div className="screen">
      <div className="sk-row between">
        <div className="h-script nowrap" style={{ fontSize: 22, lineHeight: 1 }}>Poker Night</div>
        <div className="sk-pill ghost">+ Session</div>
      </div>

      <div className="sk-box felt" style={{ padding: "12px 12px 14px" }}>
        <div className="h-mono" style={{ color: "rgba(255,255,255,0.7)" }}>last session · Sat Apr 25</div>
        <div className="h-script" style={{ fontSize: 26, marginTop: 2 }}>Jonah's Basement</div>
        <div className="sk-row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {PLAYERS.slice(0,6).map(p => (
            <div key={p.name} className="sk-avatar sm" style={{ background:"#fdfaef" }}>{p.initial}</div>
          ))}
          <div className="h-mono" style={{ color: "rgba(255,255,255,0.85)", marginLeft: 4 }}>6 players · 4h 20m</div>
        </div>
      </div>

      <div className="sk-row" style={{ gap: 8 }}>
        <div className="sk-box dim" style={{ flex: 1 }}>
          <div className="h-mono">{winnerLabel}</div>
          <div className="h-script" style={{ fontSize: 18 }}>Me</div>
          <div className="num-big num-pos nowrap">+$320</div>
        </div>
        <div className="sk-box dim" style={{ flex: 1 }}>
          <div className="h-mono">{loserLabel}</div>
          <div className="h-script" style={{ fontSize: 18 }}>Tay</div>
          <div className="num-big num-neg nowrap">−&nbsp;$370</div>
        </div>
      </div>

      <div className="sk-box">
        <div className="sk-row between">
          <span className="h-mono">session results</span>
          <span className="h-mono" style={{ color: "var(--felt)" }}>see all →</span>
        </div>
        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
          {PLAYERS.slice(0,4).map(p => (
            <div key={p.name} className="sk-row between" style={{ fontFamily: "var(--hand)", fontSize: 14 }}>
              <span className="sk-row" style={{ gap: 6 }}>
                <span className="sk-avatar sm">{p.initial}</span>{p.name}
              </span>
              <span className={`${p.net >= 0 ? "num-pos" : "num-neg"} nowrap`} style={{ fontFamily: "var(--script)", fontSize: 18 }}>
                {money(p.net)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="sk-tabs">
        <div className="tab active">Home</div>
        <div className="tab">Sessions</div>
        <div className="tab">Board</div>
        <div className="tab">Me</div>
      </div>

      <div className="annot" style={{ top: 60, right: -110, width: 130 }}>
        hero = last session recap
      </div>
    </div>
  );
}

// =====================================================
// DIRECTION B — Leaderboard-first / standings rule
// =====================================================
function DirB({ funNames }) {
  return (
    <div className="screen">
      <div className="sk-row between">
        <div className="h-script nowrap" style={{ fontSize: 22 }}>Standings</div>
        <span className="h-mono">all-time ▾</span>
      </div>

      <div className="sk-row" style={{ gap: 6 }}>
        <span className="sk-pill felt">All-time</span>
        <span className="sk-pill ghost">YTD</span>
        <span className="sk-pill ghost">30d</span>
      </div>

      {/* podium */}
      <div className="sk-row" style={{ gap: 8, alignItems: "end", height: 100, marginTop: 12 }}>
        {[
          { p: PLAYERS[1], h: 56, rank: 2 },
          { p: PLAYERS[0], h: 76, rank: 1 },
          { p: PLAYERS[2], h: 40, rank: 3 },
        ].map(({p,h,rank}) => (
          <div key={p.name} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
            <div className="sk-avatar" style={{ width: 28, height: 28, fontSize: 14 }}>{p.initial}</div>
            <div className="h-script" style={{ fontSize: 14, lineHeight: 1 }}>{p.name}</div>
            <div className="num-pos nowrap" style={{ fontFamily: "var(--script)", fontSize: 14, lineHeight: 1 }}>{money(p.net*4)}</div>
            <div style={{
              width: "100%", height: h,
              border: "1.5px solid var(--ink)",
              borderRadius: "6px 6px 0 0",
              background: rank === 1 ? "var(--felt)" : "repeating-linear-gradient(45deg, transparent 0 4px, rgba(0,0,0,0.07) 4px 5px)",
              color: rank === 1 ? "#fdfaef" : "var(--ink)",
              fontFamily: "var(--script)", fontSize: 22,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{rank}</div>
          </div>
        ))}
      </div>

      <div className="sk-box">
        <div className="h-mono">full table</div>
        <div style={{ display:"flex", flexDirection:"column", gap: 3, marginTop: 4 }}>
          {PLAYERS.map((p,i) => (
            <div key={p.name} className="sk-row between" style={{ fontFamily:"var(--hand)", fontSize: 13 }}>
              <span className="sk-row" style={{ gap: 6 }}>
                <span className="h-mono" style={{ width: 14 }}>{i+1}</span>
                <span className="sk-avatar sm">{p.initial}</span>
                {p.name}
              </span>
              <span className={`${p.net >= 0 ? "num-pos" : "num-neg"} nowrap`} style={{ fontFamily:"var(--script)", fontSize: 16 }}>
                {money(p.net*4)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="sk-row between" style={{ marginTop: 2 }}>
        <span className="h-mono">{funNames ? "🦈 shark of the month" : "Player of month"}</span>
        <span className="h-script" style={{ fontSize: 18, color: "var(--felt)" }}>Jonah</span>
      </div>

      <div className="sk-tabs">
        <div className="tab active">Board</div>
        <div className="tab">Sessions</div>
        <div className="tab">Players</div>
        <div className="tab">Me</div>
      </div>

      <div className="annot" style={{ top: 110, right: -90, width: 100 }}>
        podium = brag bait
      </div>
    </div>
  );
}

// =====================================================
// DIRECTION C — Personal stats / "your money"
// =====================================================
function DirC({ funNames }) {
  return (
    <div className="screen">
      <div className="sk-row between">
        <div className="sk-row" style={{ gap: 8 }}>
          <span className="sk-avatar lg">M</span>
          <div>
            <div className="h-mono">welcome back</div>
            <div className="h-script nowrap" style={{ fontSize: 22, lineHeight: 1 }}>Hey, Me</div>
          </div>
        </div>
        <span className="h-mono">⚙</span>
      </div>

      <div className="sk-box" style={{ padding: 12 }}>
        <div className="h-mono">your bankroll · all-time</div>
        <div className="num-big num-pos nowrap" style={{ fontSize: 38, marginTop: 2 }}>+$1,280</div>
        <div className="h-mono" style={{ color: "var(--ink-faint)" }}>across 24 sessions</div>

        <div className="sk-chart" style={{ marginTop: 10 }}>
          <SketchLine
            color="var(--felt)" width="2.2"
            points={[[0,80],[15,72],[28,78],[42,55],[55,60],[68,38],[82,42],[100,15]]}
          />
        </div>
        <div className="sk-row between" style={{ marginTop: 4 }}>
          <span className="h-mono">jan</span>
          <span className="h-mono">apr</span>
        </div>
      </div>

      <div className="sk-row" style={{ gap: 8 }}>
        <div className="sk-box dim" style={{ flex: 1, textAlign: "center" }}>
          <div className="h-mono">win rate</div>
          <div className="h-script" style={{ fontSize: 22 }}>67%</div>
        </div>
        <div className="sk-box dim" style={{ flex: 1, textAlign: "center" }}>
          <div className="h-mono">best night</div>
          <div className="h-script nowrap" style={{ fontSize: 22, color: "var(--felt)" }}>+$520</div>
        </div>
        <div className="sk-box dim" style={{ flex: 1, textAlign: "center" }}>
          <div className="h-mono">{funNames ? "tilts" : "worst"}</div>
          <div className="h-script nowrap" style={{ fontSize: 22, color: "var(--chip-red)" }}>−&nbsp;$210</div>
        </div>
      </div>

      <div className="sk-box dashed" style={{ background: "transparent" }}>
        <div className="h-mono">last session · sat apr 25</div>
        <div className="sk-row between" style={{ marginTop: 4 }}>
          <span className="h-script" style={{ fontSize: 18 }}>Jonah's Basement</span>
          <span className="num-big num-pos nowrap" style={{ fontSize: 22 }}>+$320</span>
        </div>
      </div>

      <div className="sk-tabs">
        <div className="tab active">Me</div>
        <div className="tab">Board</div>
        <div className="tab">Sessions</div>
        <div className="tab">+</div>
      </div>

      <div className="annot" style={{ top: 150, right: -100, width: 110 }}>
        chart = bankroll over time
      </div>
    </div>
  );
}

// =====================================================
// DIRECTION D — Feed / scrapbook of the group
// =====================================================
function DirD({ funNames }) {
  return (
    <div className="screen">
      <div className="sk-row between">
        <div className="h-script nowrap" style={{ fontSize: 22 }}>The Felt</div>
        <span className="sk-pill felt">+ log</span>
      </div>

      {/* award card */}
      <div className="sk-box" style={{
        background: "#fdfaef", borderStyle: "solid",
        borderWidth: "2px", padding: "10px 12px"
      }}>
        <div className="h-mono" style={{ color: "var(--felt)" }}>
          ★ {funNames ? "tilt of the night" : "award"}
        </div>
        <div className="h-script" style={{ fontSize: 22, lineHeight: 1.05 }}>
          Tay rivered a flush &amp; lost it on the turn
        </div>
        <div className="sk-row" style={{ gap: 6, marginTop: 6 }}>
          <span className="sk-avatar sm">T</span>
          <span className="h-mono">apr 25 · Jonah's</span>
        </div>
      </div>

      {/* feed item: session */}
      <div className="sk-box dim">
        <div className="sk-row between">
          <span className="h-mono">session · apr 25</span>
          <span className="h-mono" style={{ color: "var(--felt)" }}>recap →</span>
        </div>
        <div className="sk-row" style={{ gap: 4, marginTop: 6, flexWrap: "wrap" }}>
          <span className="sk-chip felt"></span>
          <span className="sk-chip"></span>
          <span className="sk-chip blue"></span>
          <span className="h-script" style={{ fontSize: 16, marginLeft: 4 }}>$1,140 across the table</span>
        </div>
        <div className="sk-bar-row" style={{ marginTop: 8, height: 50 }}>
          <div className="sk-bar felt" style={{ height: "90%" }}></div>
          <div className="sk-bar felt" style={{ height: "65%" }}></div>
          <div className="sk-bar felt" style={{ height: "30%" }}></div>
          <div className="sk-bar red"  style={{ height: "20%" }}></div>
          <div className="sk-bar red"  style={{ height: "55%" }}></div>
          <div className="sk-bar red"  style={{ height: "100%" }}></div>
        </div>
      </div>

      {/* milestone */}
      <div className="sk-box" style={{ background: "#fff" }}>
        <div className="sk-row" style={{ gap: 8, alignItems: "flex-start" }}>
          <div style={{
            width: 32, height: 32, border: "1.5px solid var(--ink)",
            borderRadius: "50%", display: "flex", alignItems: "center",
            justifyContent: "center", fontFamily: "var(--script)", fontSize: 18,
            background: "var(--felt)", color: "#fdfaef", flex: "0 0 auto"
          }}>★</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="h-mono" style={{ marginBottom: 2 }}>milestone · apr 22</div>
            <div className="h-script" style={{ fontSize: 15, lineHeight: 1.15 }}>Jonah hit 10 sessions in the green</div>
          </div>
        </div>
      </div>

      <div className="sk-tabs">
        <div className="tab active">Feed</div>
        <div className="tab">Board</div>
        <div className="tab">Stats</div>
        <div className="tab">Me</div>
      </div>

      <div className="annot" style={{ top: 80, right: -100, width: 110 }}>
        award + recap + milestone, mixed feed
      </div>
    </div>
  );
}

// =====================================================
// App + Tweaks
// =====================================================
const SCREENS = [
  {
    key: "dashboard",
    label: "Dashboard",
    scribble: "~ home screen, 4 directions ~",
    desc: null,
    variations: [
      { num: "A", name: "Session Recap", desc: "Last night's table is the hero. Open the app, see who took the money.", Comp: DirA },
      { num: "B", name: "Standings First", desc: "Leaderboard up top with a podium. Lean into the rivalry.", Comp: DirB },
      { num: "C", name: "Your Bankroll ★", desc: "Personal stats &amp; bankroll chart. <b>Direction you picked.</b>", Comp: DirC },
      { num: "D", name: "The Felt (Feed)", desc: "Scrapbook of sessions, awards, milestones. Maximum vibe.", Comp: DirD },
    ],
  },
  {
    key: "entry",
    label: "Session Entry",
    scribble: "~ host adds a session, 3 patterns ~",
    desc: "You're the host doing data entry. Three input metaphors:",
    variations: [
      { num: "A", name: "Wizard", desc: "Step-by-step. Guides through players → chips → review.", Comp: () => <EntryWizard/> },
      { num: "B", name: "Grid", desc: "Single-page spreadsheet. All buy-ins / cash-outs at once.", Comp: () => <EntryGrid/> },
      { num: "C", name: "Chip Tray", desc: "Tactile chip-tap entry. Player-by-player, table-side.", Comp: () => <EntryChip/> },
    ],
  },
  {
    key: "profile",
    label: "Player Profile",
    scribble: "~ deeper stats for one person, 2 takes ~",
    desc: "Tap a player → see their story.",
    variations: [
      { num: "A", name: "Trophy Case", desc: "Awards, head-to-heads, brag-page energy.", Comp: () => <ProfileTrophy/> },
      { num: "B", name: "Stats Sheet", desc: "Numbers-first. Bankroll chart + grid of stats + recent sessions.", Comp: () => <ProfileStats/> },
    ],
  },
  {
    key: "detail",
    label: "Session Detail",
    scribble: "~ drill into one game, 2 takes ~",
    desc: "Tap a past session → see the recap.",
    variations: [
      { num: "A", name: "Story Recap", desc: "Hero card + award + results list. The story of the night.", Comp: () => <DetailRecap/> },
      { num: "B", name: "Bar Chart Split", desc: "Winners up / losers down at a glance. Data-forward.", Comp: () => <DetailBars/> },
    ],
  },
];

function App() {
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "funNames": true,
    "showAnnotations": false,
    "accent": "#2f7d4f",
    "showD": true,
    "screen": "dashboard"
  }/*EDITMODE-END*/);

  // apply accent + annotation toggles to the page
  useEffect(() => {
    document.documentElement.style.setProperty("--felt", tweaks.accent);
    document.body.classList.toggle("show-annotations", !!tweaks.showAnnotations);
  }, [tweaks.accent, tweaks.showAnnotations]);

  // build the screen-nav tabs in the page header
  useEffect(() => {
    const nav = document.getElementById("screen-nav");
    if (!nav) return;
    nav.innerHTML = "";
    SCREENS.forEach(s => {
      const btn = document.createElement("button");
      btn.textContent = s.label;
      btn.className = s.key === tweaks.screen ? "active" : "";
      btn.onclick = () => setTweak("screen", s.key);
      nav.appendChild(btn);
    });
    const scribbleEl = document.getElementById("screen-scribble");
    const current = SCREENS.find(s => s.key === tweaks.screen) || SCREENS[0];
    if (scribbleEl) scribbleEl.textContent = current.scribble;

    // footer notes update
    const footer = document.getElementById("footer-notes");
    if (footer) {
      footer.innerHTML = `
        <b>This screen →</b>
        <p style="margin: 4px 0 12px;">${current.desc || ""}</p>
        <ul>
          ${current.variations.map(v => `<li><b style="color:var(--ink); font-family:var(--hand); font-size:15px;">${v.num}.</b> <b style="color:var(--ink); font-family:var(--script); font-size:18px;">${v.name}</b> — ${v.desc}</li>`).join("")}
        </ul>
        <p style="margin-top:18px;">Toggle <b style="font-size:18px;">Tweaks</b> for fun-names, accent color, annotations, and to switch screens.</p>
      `;
    }
  }, [tweaks.screen, setTweak]);

  const current = SCREENS.find(s => s.key === tweaks.screen) || SCREENS[0];
  const visible = (tweaks.screen === "dashboard" && !tweaks.showD)
    ? current.variations.slice(0,3)
    : current.variations;

  return (
    <>
      <div className="grid">
        {visible.map(d => (
          <div key={d.num} className="dir">
            <div className="dir-label">
              <div className="num">Direction {d.num}</div>
              <div className="name">{d.name}</div>
              <div className="desc" dangerouslySetInnerHTML={{ __html: d.desc }} />
            </div>
            <div className="phone">
              <div className="notch"></div>
              <d.Comp funNames={tweaks.funNames} />
            </div>
          </div>
        ))}
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Screen">
          <TweakSelect label="Wireframe set"
            value={tweaks.screen}
            options={SCREENS.map(s => ({ value: s.key, label: s.label }))}
            onChange={v => setTweak("screen", v)} />
        </TweakSection>
        <TweakSection title="Vibe">
          <TweakToggle label="Fun names (Shark, Tilt of the Night…)"
            value={tweaks.funNames}
            onChange={v => setTweak("funNames", v)} />
          <TweakColor label="Accent color"
            value={tweaks.accent}
            onChange={v => setTweak("accent", v)} />
        </TweakSection>
        <TweakSection title="Wireframe options">
          <TweakToggle label="Show annotation notes"
            value={tweaks.showAnnotations}
            onChange={v => setTweak("showAnnotations", v)} />
          <TweakToggle label="Show direction D on dashboard"
            value={tweaks.showD}
            onChange={v => setTweak("showD", v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
