/* aallms — landing hero · three takes on the nested model
   Transformer (core) → LLM → Context + Prompt → Harness (outer shell)

   Exports to window: FitStage, HeroRings, HeroBoxes, HeroGraph, HERO_VARIANTS
   Robust, library-free motion: CSS keyframes + transforms + a little SMIL.
   Load AFTER React + parts.jsx (uses <Icon>). */

/* ------------------------------------------------------------------ data -- */
const HERO_LAYERS = [
  { id: "transformer", name: "Transformer",      sub: "attention · the forward pass", color: "var(--accent)" },
  { id: "llm",         name: "LLM",              sub: "weights, at scale",            color: "var(--concept-key)" },
  { id: "context",     name: "Context + Prompt", sub: "what you feed it",             color: "var(--concept-query)" },
  { id: "harness",     name: "Harness",          sub: "tools · agents · orchestration", color: "var(--concept-output)" },
];

/* --------------------------------------------------- mount-gated reveal -- */
function useMounted() {
  const [m, setM] = React.useState(false);
  React.useEffect(() => {
    const id = setTimeout(() => setM(true), 60);
    return () => clearTimeout(id);
  }, []);
  return m;
}

/* --------------------------------------------------- fit-to-parent stage -- */
function FitStage({ w, h, max = 1, children }) {
  const ref = React.useRef(null);
  const [s, setS] = React.useState(0.6);
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      const sw = r.width / w;
      const sh = r.height > 4 ? r.height / h : Infinity;
      setS(Math.max(0.1, Math.min(max, sw, sh)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h, max]);
  return (
    <div className="fitstage" ref={ref}>
      <div className="fitstage-inner" style={{ width: w, height: h, transform: `scale(${s})` }}>
        {children}
      </div>
    </div>
  );
}

/* ======================================================= VARIANT A · RINGS = */
function HeroRings({ onPick }) {
  const W = 720, H = 644, cx = 360, cy = 332;
  const RINGS = [
    { id: "transformer", r: 50 },
    { id: "llm",         r: 116 },
    { id: "context",     r: 186 },
    { id: "harness",     r: 258 },
  ].map(r => ({ ...r, ...HERO_LAYERS.find(l => l.id === r.id) }));

  const [hover, setHover] = React.useState(null);
  const mounted = useMounted();
  const ANG = -Math.PI / 3; // up-right diagonal annotation (steep, avoids clip)
  const chipPt = r => ({ x: cx + r * Math.cos(ANG), y: cy + r * Math.sin(ANG) });

  // core attention micro-grid
  const cells = [];
  const g = 4, cell = 8, gap = 3, span = g * cell + (g - 1) * gap;
  for (let i = 0; i < g; i++) for (let j = 0; j < g; j++) {
    cells.push({ x: cx - span / 2 + j * (cell + gap), y: cy - span / 2 + i * (cell + gap), d: ((i + j) % 5) * 0.32 });
  }

  return (
    <div className="hero-stage" style={{ width: W, height: H, "--cx": cx + "px", "--cy": cy + "px" }}>
      <svg className="hero-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* paint outer→inner so the core sits on top */}
        {[...RINGS].reverse().map((ring, idx) => {
          const order = RINGS.length - 1 - idx; // 0..3 inner..outer for delay
          const dim = hover && hover !== ring.id;
          const on = hover === ring.id;
          if (ring.id === "transformer") {
            return (
              <g key={ring.id} className={"ring-entrance" + (mounted ? "" : " is-pre")} style={{ transitionDelay: `${order * 110}ms` }}>
                <g className="core-pulse">
                  <circle cx={cx} cy={cy} r={ring.r} fill={ring.color} opacity={dim ? 0.5 : 1} />
                  <circle cx={cx} cy={cy} r={ring.r + 7} fill="none" stroke={ring.color} strokeOpacity={on ? 0.5 : 0.22} strokeWidth="2" />
                  {cells.map((c, i) => (
                    <rect key={i} x={c.x} y={c.y} width={cell} height={cell} rx="1.5"
                      fill="var(--on-accent)" style={{ animation: `heroTwinkle 2.6s ${c.d}s var(--ease-in-out) infinite` }} />
                  ))}
                </g>
                <circle className="hero-hit" cx={cx} cy={cy} r={ring.r} strokeWidth="40"
                  onMouseEnter={() => setHover(ring.id)} onMouseLeave={() => setHover(null)} onClick={() => onPick && onPick(ring.id)} />
              </g>
            );
          }
          const dur = 16 + order * 7;
          const rev = order % 2 === 1;
          return (
            <g key={ring.id} className={"ring-entrance" + (mounted ? "" : " is-pre")} style={{ transitionDelay: `${order * 110}ms` }}>
              <circle className="hero-ring-stroke" cx={cx} cy={cy} r={ring.r}
                stroke={ring.color} strokeWidth={on ? 3.5 : 2} strokeOpacity={dim ? 0.28 : 0.9}
                strokeDasharray={ring.id === "harness" ? "2 9" : undefined}
                strokeLinecap="round" />
              {/* orbiting marker */}
              <g className="ring-orbit" style={{ animation: `${rev ? "heroSpinR" : "heroSpin"} ${dur}s linear infinite`, opacity: dim ? 0.3 : 1 }}>
                <circle cx={cx + ring.r} cy={cy} r={ring.id === "harness" ? 4.5 : 5.5} fill={ring.color} />
                <circle cx={cx + ring.r} cy={cy} r="11" fill={ring.color} opacity="0.16" />
              </g>
              {/* a second slower marker on the harness shell + tool ticks */}
              {ring.id === "harness" && [0, 1, 2, 3, 4, 5].map(k => {
                const a = (Math.PI * 2 * k) / 6 + Math.PI / 6;
                return <rect key={k} x={cx + ring.r * Math.cos(a) - 4} y={cy + ring.r * Math.sin(a) - 4} width="8" height="8" rx="1.5"
                  fill="var(--surface)" stroke={ring.color} strokeWidth="1.5" opacity={dim ? 0.3 : 0.85} transform={`rotate(45 ${cx + ring.r * Math.cos(a)} ${cy + ring.r * Math.sin(a)})`} />;
              })}
              <circle className="hero-hit" cx={cx} cy={cy} r={ring.r} strokeWidth="30"
                onMouseEnter={() => setHover(ring.id)} onMouseLeave={() => setHover(null)} onClick={() => onPick && onPick(ring.id)} />
            </g>
          );
        })}
      </svg>

      <div className="hero-labels">
        {/* core label, set just beneath the node */}
        <div className="hero-corelabel" style={{ left: cx, top: cy + 50 + 15 }}>
          <span className="hero-corelabel__name">Transformer</span>
        </div>
        {RINGS.filter(r => r.id !== "transformer").map((ring, i) => {
          const p = chipPt(ring.r);
          const dim = hover && hover !== ring.id;
          return (
            <div key={ring.id}
              className={"hero-chip" + (dim ? " is-dim" : "") + (hover === ring.id ? " is-on" : "")}
              style={{ left: p.x, top: p.y, opacity: mounted ? undefined : 0, transform: mounted ? "translateY(-50%)" : "translateY(calc(-50% + 12px))", transitionDelay: `${360 + i * 120}ms` }}
              onMouseEnter={() => setHover(ring.id)} onMouseLeave={() => setHover(null)} onClick={() => onPick && onPick(ring.id)}>
              <span className="hero-chip__top">
                <span className="hero-chip__dot" style={{ background: ring.color }} />
                <span className="hero-chip__name">{ring.name}</span>
              </span>
              <span className="hero-chip__sub">{ring.sub}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ======================================================= VARIANT B · BOXES = */
function HeroBoxes() {
  const W = 700, H = 564;
  const LAYERS = [
    { id: "harness", w: 660, h: 500, name: "Harness",      sub: "tools · agents · orchestration", color: "var(--concept-output)" },
    { id: "context", w: 484, h: 360, name: "Context + Prompt", sub: "what you feed it",            color: "var(--concept-query)" },
    { id: "llm",     w: 320, h: 224, name: "LLM",          sub: "weights at scale",               color: "var(--concept-key)" },
  ];
  const [hover, setHover] = React.useState(null);
  const mounted = useMounted();
  return (
    <div className="bx-stage fp-plate" style={{ width: W, height: H, overflow: "hidden" }}>
      <div className="bx-scan" style={{ "--scan-h": "500px" }} />
      {LAYERS.map((L, i) => {
        const dim = hover && hover !== L.id;
        return (
          <div key={L.id}
            className={"bx-layer" + (dim ? " is-dim" : "")}
            style={{ width: L.w, height: L.h, "--lc": L.color, transitionDelay: `${i * 130}ms`,
              opacity: mounted ? undefined : 0, transform: mounted ? "translate(-50%,-50%) scale(1)" : "translate(-50%,-50%) scale(.82)",
              boxShadow: hover === L.id ? "var(--sh-3)" : "none", borderColor: hover === L.id ? L.color : undefined }}
            onMouseEnter={() => setHover(L.id)} onMouseLeave={() => setHover(null)}>
            <span className="bx-tag">{L.name}</span>
            <span className="bx-sub">{L.sub}</span>
            {L.id === "context" && (
              <div style={{ position: "absolute", left: 12, bottom: 12, display: "flex", gap: 6 }}>
                <span className="bx-tok">system</span><span className="bx-tok">user prompt</span><span className="bx-tok">history</span>
              </div>
            )}
          </div>
        );
      })}
      <div className="bx-core" style={{ width: 152, height: 100, transitionDelay: "390ms", opacity: mounted ? undefined : 0, transform: mounted ? "translate(-50%,-50%) scale(1)" : "translate(-50%,-50%) scale(.82)" }}>
        <div className="bx-core__grid">
          {Array.from({ length: 16 }).map((_, k) => (
            <span key={k} className="bx-core__cell" style={{ animationDelay: `${(k % 5) * 0.3}s` }} />
          ))}
        </div>
        <span className="bx-core__name">Transformer</span>
      </div>
    </div>
  );
}

/* ======================================================= VARIANT C · GRAPH = */
function HeroGraph() {
  const W = 720, H = 600;
  const [hover, setHover] = React.useState(null);
  // node geometry
  const llm = { x: 360, y: 300, w: 220, h: 168 };
  const tf  = { x: 360, y: 312, w: 128, h: 66 };
  const ctx = { x: 132, y: 232, w: 132, h: 56, color: "var(--concept-query)", name: "Context" };
  const prm = { x: 132, y: 372, w: 132, h: 56, color: "var(--concept-query)", name: "Prompt" };
  const tools = [
    { id: "search", x: 600, y: 168, name: "search" },
    { id: "run",    x: 632, y: 300, name: "run" },
    { id: "files",  x: 600, y: 432, name: "edit" },
  ];
  const harnessCol = "var(--concept-output)";
  const edge = (x1, y1, x2, y2, c) => `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`;
  const rectNode = (n, color, fill, idKey) => {
    const dim = hover && hover !== idKey;
    return (
      <g style={{ opacity: dim ? 0.4 : 1, transition: "opacity var(--dur-2) var(--ease-standard)" }}
        onMouseEnter={() => setHover(idKey)} onMouseLeave={() => setHover(null)} cursor="pointer">
        <rect x={n.x - n.w / 2} y={n.y - n.h / 2} width={n.w} height={n.h} rx="8"
          fill={fill} stroke={color} strokeWidth={hover === idKey ? 2.4 : 1.6} />
        <text x={n.x} y={n.y + 4} textAnchor="middle" className="gr-node-label">{n.name}</text>
      </g>
    );
  };

  return (
    <div style={{ width: W, height: H }}>
      <svg className="hero-svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* harness boundary */}
        <g style={{ opacity: hover && hover !== "harness" ? 0.5 : 1, transition: "opacity var(--dur-2)" }}>
          <rect x="40" y="46" width="640" height="508" rx="14" fill="color-mix(in srgb, var(--concept-output) 5%, transparent)"
            stroke={harnessCol} strokeWidth="1.6" strokeDasharray="3 9" strokeLinecap="round"
            onMouseEnter={() => setHover("harness")} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }} />
          <text x="58" y="38" className="gr-node-sub" fill={harnessCol} style={{ letterSpacing: ".14em" }}>HARNESS</text>
        </g>

        {/* edges */}
        <g>
          <path className="gr-edge" d={edge(ctx.x + ctx.w / 2, ctx.y, llm.x - llm.w / 2, llm.y - 30)} />
          <path className="gr-edge is-flow" style={{ stroke: "var(--concept-query)" }} id="e-prm" d={edge(prm.x + prm.w / 2, prm.y, llm.x - llm.w / 2, llm.y + 30)} />
          {tools.map((t, i) => (
            <path key={t.id} className={"gr-edge" + (i === 1 ? " is-flow" : "")} style={i === 1 ? { stroke: harnessCol } : null}
              id={`e-${t.id}`} d={edge(t.x - 30, t.y, llm.x + llm.w / 2, llm.y - 40 + i * 40)} />
          ))}
        </g>

        {/* flow particles (SMIL) */}
        <circle r="4" fill="var(--concept-query)">
          <animateMotion dur="3.4s" repeatCount="indefinite" rotate="0"><mpath href="#e-prm" /></animateMotion>
        </circle>
        <circle r="4" fill={harnessCol}>
          <animateMotion dur="3.8s" begin="1s" repeatCount="indefinite" rotate="0"><mpath href="#e-run" /></animateMotion>
        </circle>

        {/* LLM shell (wraps transformer) */}
        {(() => {
          const dim = hover && hover !== "llm";
          return (
            <g style={{ opacity: dim ? 0.45 : 1, transition: "opacity var(--dur-2)" }}
              onMouseEnter={() => setHover("llm")} onMouseLeave={() => setHover(null)} cursor="pointer">
              <rect x={llm.x - llm.w / 2} y={llm.y - llm.h / 2} width={llm.w} height={llm.h} rx="12"
                fill="color-mix(in srgb, var(--concept-key) 7%, var(--surface))" stroke="var(--concept-key)" strokeWidth={hover === "llm" ? 2.4 : 1.6} />
              <text x={llm.x} y={llm.y - llm.h / 2 + 18} textAnchor="middle" className="gr-node-sub" fill="var(--concept-key)" style={{ letterSpacing: ".14em" }}>LLM</text>
            </g>
          );
        })()}

        {/* transformer core */}
        <g className="gr-float" style={{ animation: "heroFloat 5s var(--ease-in-out) infinite" }}
          onMouseEnter={() => setHover("transformer")} onMouseLeave={() => setHover(null)} cursor="pointer">
          <rect x={tf.x - tf.w / 2} y={tf.y - tf.h / 2} width={tf.w} height={tf.h} rx="8" fill="var(--accent)" />
          {[0, 1, 2, 3].map(k => <rect key={k} x={tf.x - 26 + k * 14} y={tf.y - 4} width="8" height="8" rx="1.5" fill="var(--on-accent)" style={{ animation: `heroTwinkle 2.4s ${k * 0.3}s ease-in-out infinite` }} />)}
          <text x={tf.x} y={tf.y - 12} textAnchor="middle" className="gr-node-sub" fill="var(--on-accent)" style={{ fontWeight: 600 }}>Transformer</text>
        </g>

        {/* context + prompt */}
        {rectNode(ctx, "var(--concept-query)", "color-mix(in srgb, var(--concept-query) 8%, var(--surface))", "context")}
        {rectNode(prm, "var(--concept-query)", "color-mix(in srgb, var(--concept-query) 8%, var(--surface))", "context")}

        {/* tools */}
        {tools.map((t, i) => {
          const dim = hover && hover !== "harness";
          return (
            <g key={t.id} className="gr-float" style={{ animation: `heroFloat ${4 + i}s ${i * 0.4}s var(--ease-in-out) infinite`, opacity: dim ? 0.5 : 1 }}
              onMouseEnter={() => setHover("harness")} onMouseLeave={() => setHover(null)} cursor="pointer">
              <circle cx={t.x} cy={t.y} r="26" fill="color-mix(in srgb, var(--concept-output) 8%, var(--surface))" stroke={harnessCol} strokeWidth="1.6" />
              <text x={t.x} y={t.y + 3} textAnchor="middle" className="gr-tool-label">{t.name}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const HERO_VARIANTS = [
  { id: "rings", name: "Concentric rings", Comp: HeroRings, w: 720, h: 644 },
  { id: "boxes", name: "Nested blueprint", Comp: HeroBoxes, w: 700, h: 564 },
  { id: "graph", name: "System graph",     Comp: HeroGraph, w: 720, h: 600 },
];

Object.assign(window, { FitStage, HeroRings, HeroBoxes, HeroGraph, HERO_LAYERS, HERO_VARIANTS });
