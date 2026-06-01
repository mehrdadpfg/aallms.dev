/* aallms — website UI kit · interactive diagrams
   TokenStream  : text → subword tokens, stepwise reveal + hover ids
   AttentionLab : the centerpiece — pick a query token, watch causal attention
                  spread back over the sentence (heat + arcs + weight bars),
                  with a softmax "sharpness" (temperature) slider and step-play.
   Exposed on window for index.html. */

/* ---- heat scale (matches --heat-* tokens) ---- */
const AALLMS_HEAT = [[244,238,226],[251,217,168],[244,161,78],[232,73,42],[158,27,11]];
function aallmsHeat(t) {
  t = Math.max(0, Math.min(1, t));
  const s = t * (AALLMS_HEAT.length - 1), i = Math.floor(s), f = s - i;
  const a = AALLMS_HEAT[i], b = AALLMS_HEAT[Math.min(i + 1, AALLMS_HEAT.length - 1)];
  const c = a.map((v, k) => Math.round(v + (b[k] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/* =================================================================== */
function TokenStream() {
  const tokens = ["The", "cat", "sat", "on", "the", "mat"];
  const [hover, setHover] = React.useState(-1);
  return (
    <div className="tstream">
      <div className="tstream-row">
        {tokens.map((t, i) => (
          <span key={i}
            className={"tstream-tok" + (hover === i ? " is-hover" : "")}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)}>
            {t}
            <span className="tstream-id">{i}</span>
          </span>
        ))}
      </div>
      <p className="tstream-note">
        {hover < 0
          ? "Six words → six tokens. Hover one to see its position id."
          : <>Token <b>“{tokens[hover]}”</b> lives at position <b>{hover}</b> — its place in the sequence is part of what the model knows.</>}
      </p>
    </div>
  );
}

/* =================================================================== */
const AALLMS_TOKENS = ["The", "tired", "cat", "sat", "on", "the", "mat", "."];
/* pre-softmax affinity logits, causal (query i only sees keys j ≤ i) */
const AALLMS_AFF = [
  [1.0],                                   // The
  [0.3, 1.0],                              // tired
  [0.8, 1.2, 0.6],                         // cat  → tired, The
  [0.1, 0.2, 1.7, 0.4],                    // sat  → cat (subject!)
  [0.0, 0.0, 0.3, 1.3, 0.4],               // on   → sat
  [0.7, 0.0, 0.2, 0.3, 0.9, 0.5],          // the  → on, The
  [0.1, 0.0, 0.4, 0.9, 0.7, 1.2, 0.5],     // mat  → the, sat, on
  [0.1, 0.0, 0.4, 0.8, 0.2, 0.2, 1.5, 0.3] // .    → mat, sat
];
function softmax(logits, temp) {
  const m = Math.max(...logits);
  const ex = logits.map(l => Math.exp((l - m) / temp));
  const s = ex.reduce((a, b) => a + b, 0);
  return ex.map(e => e / s);
}

function AttentionLab() {
  const [query, setQuery] = React.useState(6);   // default: "mat"
  const [temp, setTemp] = React.useState(0.7);
  const [playing, setPlaying] = React.useState(false);
  const rowRef = React.useRef(null);
  const [cx, setCx] = React.useState([]);

  // weights for current query (causal: only keys ≤ query)
  const logits = AALLMS_AFF[query];
  const w = softmax(logits, temp);                // length = query+1
  const maxW = Math.max(...w);

  // measure token centers for arcs
  const measure = React.useCallback(() => {
    const row = rowRef.current; if (!row) return;
    const r0 = row.getBoundingClientRect();
    const xs = [...row.querySelectorAll(".atok")].map(el => {
      const r = el.getBoundingClientRect();
      return r.left - r0.left + r.width / 2;
    });
    setCx(xs);
  }, []);
  React.useLayoutEffect(() => { measure(); }, [measure, query, temp]);
  React.useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // step-play: advance query 0..7 mechanically
  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setQuery(q => { if (q >= AALLMS_TOKENS.length - 1) { setPlaying(false); return q; } return q + 1; });
    }, 850);
    return () => clearInterval(id);
  }, [playing]);

  const play = () => { if (query >= AALLMS_TOKENS.length - 1) setQuery(0); setPlaying(true); };

  return (
    <div className="lab">
      {/* arcs + token row */}
      <div className="lab-stage">
        <svg className="lab-arcs" preserveAspectRatio="none">
          {cx.length > query && AALLMS_TOKENS.map((_, j) => {
            if (j > query) return null;
            const weight = w[j] / maxW;
            const x1 = cx[j], x2 = cx[query];
            if (x1 == null || x2 == null) return null;
            const span = Math.abs(x2 - x1);
            const midX = (x1 + x2) / 2;
            const topY = 64 - Math.min(54, 14 + span * 0.34);
            const d = `M ${x1} 64 Q ${midX} ${topY} ${x2} 64`;
            const self = j === query;
            return (
              <path key={j} d={self ? `M ${x1} 64 q 0 -20 0 0` : d}
                fill="none"
                stroke={self ? "var(--accent)" : aallmsHeat(weight)}
                strokeWidth={1 + weight * 4}
                strokeOpacity={self ? 0.25 : 0.35 + weight * 0.6}
                strokeLinecap="round" />
            );
          })}
        </svg>
        <div className="lab-row" ref={rowRef}>
          {AALLMS_TOKENS.map((t, i) => {
            const active = i <= query;
            const weight = active ? w[i] / maxW : 0;
            const isQuery = i === query;
            const lit = active && weight > 0.55;
            return (
              <button key={i}
                className={"atok" + (isQuery ? " is-query" : "") + (active ? "" : " is-masked")}
                style={{ background: active ? aallmsHeat(weight) : undefined, color: active ? (lit ? "#fff" : "#2a2118") : undefined }}
                onClick={() => { setPlaying(false); setQuery(i); }}
                title={active ? `attention ${(w[i] * 100).toFixed(0)}%` : "masked (future token)"}>
                {t}
                <span className="atok-bar"><span className="atok-bar-fill" style={{ height: (active ? weight * 100 : 0) + "%" }} /></span>
              </button>
            );
          })}
        </div>
      </div>

      {/* controls */}
      <div className="lab-controls">
        <button className="lab-play" onClick={playing ? () => setPlaying(false) : play}>
          <Icon name={playing ? "pause" : "play"} size={14} stroke={2.2} />
          {playing ? "Pause" : "Play steps"}
        </button>
        <div className="lab-slider">
          <label>Temperature</label>
          <input type="range" min="0.3" max="2" step="0.05" value={temp}
            onChange={e => setTemp(parseFloat(e.target.value))} />
          <span className="lab-temp">T={temp.toFixed(2)}</span>
        </div>
      </div>

      <p className="lab-read">
        Query token <b className="lab-q">“{AALLMS_TOKENS[query]}”</b> looks back and spreads
        {" "}<b>{((query + 1))}</b> attention weights — strongest on{" "}
        <b>“{AALLMS_TOKENS[w.indexOf(maxW)]}”</b> ({(maxW * 100).toFixed(0)}%).
        {temp > 1.2 ? " High temperature flattens it — attention smears across everything." :
         temp < 0.55 ? " Low temperature peaks it — almost all weight on one token." : ""}
      </p>
    </div>
  );
}

/* =================================================================== */
/* the context window — draggable capacity demo */
const AALLMS_CTX = ("Long ago a model read every token you gave it but a context window only "
  + "holds so many so the oldest words quietly fall away before the next is predicted").split(" ");
function ContextWindow() {
  const total = AALLMS_CTX.length;
  const [n, setN] = React.useState(12);
  const out = AALLMS_CTX.slice(0, Math.max(0, total - n));
  const inw = AALLMS_CTX.slice(Math.max(0, total - n));
  return (
    <div className="ctx-wrap">
      <div className="ctx-label"><span>dropped — out of context</span><span>{out.length} tokens</span></div>
      <div className="ctx-overflow">
        {out.map((t, i) => <span key={i} className="ctx-tok is-out">{t}</span>)}
        {out.length === 0 ? <span className="ctx-tok is-out" style={{ opacity: .25 }}>(nothing dropped yet)</span> : null}
      </div>
      <div className="ctx-label" style={{ marginTop: "16px" }}><span style={{ color: "var(--accent)" }}>inside the window</span><span>{inw.length} / {total}</span></div>
      <div className="ctx-window">{inw.map((t, i) => <span key={i} className="ctx-tok">{t}</span>)}</div>
      <div className="ctx-controls">
        <label>Window size</label>
        <input type="range" className="range" style={{ width: "150px" }} min="4" max={total} step="1" value={n} onChange={e => setN(parseInt(e.target.value))} />
        <span className="lab-temp">{n} tok</span>
      </div>
    </div>
  );
}

Object.assign(window, { TokenStream, AttentionLab, ContextWindow, aallmsHeat });
