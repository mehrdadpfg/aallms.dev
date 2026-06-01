/* aallms — chapter · Inference
   The cost of the loop, the KV cache, sampling, and serving.
   Globals: React, Icon, DeepDoc, nextOf. Exports: INFERENCE. */

/* =================================================== 1 · KV CACHE ========= */
const KV_TOKENS = ["The", "cat", "sat", "on", "the", "mat", "."];
function KVCache() {
  const [n, setN] = React.useState(3);
  const [cache, setCache] = React.useState(true);
  const [playing, setPlaying] = React.useState(false);
  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setN(v => { if (v >= KV_TOKENS.length) { setPlaying(false); return v; } return v + 1; }), 800);
    return () => clearInterval(id);
  }, [playing]);
  const work = cache ? 1 : n; // columns recomputed this step
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="kv-seq">{KV_TOKENS.slice(0, n).map((t, i) => <span key={i} className={"kv-tok" + (i === n - 1 ? " is-new" : "")}>{t}</span>)}<span className="fwd-caret">▮</span></div>
        <div className="kv-grid">
          {["K", "V"].map(row => (
            <div key={row} className="kv-row">
              <span className="kv-rowlab">{row}</span>
              {KV_TOKENS.slice(0, n).map((t, i) => {
                const recompute = !cache; const fresh = i === n - 1;
                return <span key={i} className={"kv-cell" + (fresh ? " is-fresh" : recompute ? " is-recomp" : " is-cached")} />;
              })}
            </div>
          ))}
        </div>
        <div className="kv-readout">
          <span className={"kv-pill" + (cache ? " good" : " bad")}>{cache ? "1 column computed this step" : `${work} columns recomputed this step`}</span>
        </div>
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={() => { if (n >= KV_TOKENS.length) setN(1); setPlaying(p => !p); }}><Icon name={playing ? "pause" : "play"} size={14} stroke={2.2} />{playing ? "Pause" : "Generate"}</button>
        <label className="switch" style={{ marginLeft: 4 }}><input type="checkbox" checked={cache} onChange={e => setCache(e.target.checked)} /><span className="switch-track"><span className="switch-knob" /></span>KV cache on</label>
        <button className="dg-btn" onClick={() => { setPlaying(false); setN(1); }}><Icon name="rotate-ccw" size={14} stroke={2.2} />Reset</button>
      </div>
      <p className="dg-read">Each new token needs the Keys and Values of <i>every</i> earlier token. Without a cache the model recomputes them all, every step — quadratic waste. The <b>KV cache</b> stores them once and reuses them, so each step only computes <b>one new column</b>. It's the single biggest reason generation is affordable.</p>
    </div>
  );
}

/* =================================================== 2 · SAMPLING ========= */
const SAMP_BASE = [["mat", 0.46], ["floor", 0.19], ["rug", 0.13], ["sofa", 0.1], ["roof", 0.07], ["sky", 0.03], ["idea", 0.02]];
function Sampling() {
  const [temp, setTemp] = React.useState(0.8);
  const [topp, setTopp] = React.useState(0.9);
  const [pick, setPick] = React.useState(null);
  const probs = React.useMemo(() => {
    const logits = SAMP_BASE.map(([t, p]) => [t, Math.log(p)]);
    const scaled = logits.map(([t, l]) => [t, l / Math.max(0.05, temp)]);
    const m = Math.max(...scaled.map(x => x[1]));
    const ex = scaled.map(([t, l]) => [t, Math.exp(l - m)]);
    const s = ex.reduce((a, b) => a + b[1], 0);
    let arr = ex.map(([t, e]) => [t, e / s]).sort((a, b) => b[1] - a[1]);
    // top-p cut
    let cum = 0; arr = arr.map(([t, p]) => { const inc = cum < topp; cum += p; return [t, p, inc]; });
    return arr;
  }, [temp, topp]);
  const mx = Math.max(...probs.map(p => p[1]));
  const sample = () => {
    const live = probs.filter(p => p[2]); const z = live.reduce((a, b) => a + b[1], 0);
    let r = Math.random() * z; for (const [t, p] of live) { r -= p; if (r <= 0) { setPick(t); return; } }
    setPick(live[0][0]);
  };
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="fwd-bars">
          {probs.map(([t, p, inc]) => (
            <div key={t} className={"fwd-bar" + (inc ? "" : " is-cut")}>
              <span className="fwd-bar-tok">{t}</span>
              <div className="fwd-bar-track"><div className="fwd-bar-fill" style={{ width: p * 100 + "%", background: pick === t ? "var(--ok-500)" : inc ? "var(--accent)" : "var(--border-strong)" }} /></div>
              <span className="fwd-bar-pct">{(p * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="dg-controls">
        <div className="dg-slider"><label>Temp</label><input type="range" min="0.1" max="1.6" step="0.05" value={temp} onChange={e => { setTemp(parseFloat(e.target.value)); setPick(null); }} /><span className="dg-readout">{temp.toFixed(2)}</span></div>
        <div className="dg-slider"><label>Top-p</label><input type="range" min="0.2" max="1" step="0.05" value={topp} onChange={e => { setTopp(parseFloat(e.target.value)); setPick(null); }} /><span className="dg-readout">{topp.toFixed(2)}</span></div>
        <button className="dg-btn" onClick={sample}><Icon name="dice-5" size={14} stroke={2.2} />Sample</button>
      </div>
      <p className="dg-read">The model gives a distribution; <b>sampling</b> picks from it. <b>Temperature</b> sharpens (low) or flattens (high) the odds. <b>Top-p</b> keeps only the most likely tokens that together cover p of the mass (the greyed ones are cut). {pick ? <>It drew <b style={{ color: "var(--ok-500)" }}>"{pick}"</b>.</> : "Press sample to draw one."}</p>
    </div>
  );
}

/* ============================================ APPENDIX · inference ========= */
function InfDeepDoc() {
  return (
    <DeepDoc sections={[
      { id: "prefill", label: "Prefill vs decode", title: "Two very different phases", intro: "Reading the prompt and writing the answer have opposite performance profiles.", render: () => (<div className="rd-prose"><p><b>Prefill</b> processes the whole prompt in parallel — one big, compute-heavy pass that fills the KV cache. <b>Decode</b> then emits one token at a time, each step tiny but memory-bound by the growing cache.</p><p>This is why a long prompt has a "time to first token", and why output length drives most of the cost after that.</p></div>) },
      { id: "batch", label: "Batching", title: "Serving many at once", intro: "Throughput comes from running many requests through the model together.", render: () => (<div className="rd-prose"><p>A single request barely uses a GPU. Servers <b>batch</b> many users' tokens into one pass, and <i>continuous batching</i> slots new requests in as others finish — keeping the hardware busy and the cost-per-token low.</p></div>) },
      { id: "spec", label: "Speculative decoding", title: "Guess ahead, verify in bulk", intro: "A small model drafts several tokens; the big model checks them in one pass.", render: () => (<div className="rd-prose"><p>A cheap "draft" model proposes the next few tokens; the full model verifies them all in a single forward pass and accepts the ones it agrees with. When the draft is good, you get several tokens for the price of one — a large speedup with identical output.</p></div>) },
    ]} />
  );
}

/* ================================================== CHAPTER CONFIG ========= */
const INFERENCE = {
  id: "inference", title: "Inference", nextChapter: nextOf("inference"),
  steps: [
    { eyebrow: "STEP 01 · INFERENCE", title: "Generation is expensive on purpose", navTitle: "The cost of the loop",
      lead: "Every token is a full forward pass. Making that loop fast is its own engineering discipline.",
      Body: () => (<><p>We saw that writing text means running the forward pass once per token. Done naively, each step would recompute the attention Keys and Values for the entire sequence so far — work that grows with every token.</p><p>The first big optimization fixes exactly this.</p></>),
      Diagram: KVCache, caption: "With the cache, each step adds one column instead of redoing all of them. Toggle it off to see the waste.",
      deeper: [{ id: "inf-appx", label: "Prefill, batching & speculation", kicker: "Appendix · inference", title: "Serving at scale", wide: true, Panel: InfDeepDoc }] },
    { eyebrow: "STEP 02 · INFERENCE", title: "Choosing the next token", navTitle: "Sampling",
      Body: () => (<><p>The forward pass ends in a probability distribution, but something has to actually <b>pick</b> a token. That choice — <b>sampling</b> — is where you trade off between safe and surprising.</p><p>Reshape the odds and draw.</p></>),
      Diagram: Sampling, caption: "Temperature and top-p reshape the distribution before a token is drawn from it." },
  ],
};

Object.assign(window, { INFERENCE });
