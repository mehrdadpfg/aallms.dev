/* aallms — chapter · Attention
   Reuses the kit's AttentionLab (lib/diagrams.jsx) as the centerpiece, plus
   AttnVote / AttnQKV / AttnHeads / AttnKV and a deep-dive on how weights are
   computed and how attention is made cheaper.
   Globals: React, Icon, DeepDoc, AttentionLab, aallmsHeat, nextOf. Exports: ATTENTION. */

function attnHeat(t) { return (window.aallmsHeat ? window.aallmsHeat(t) : "var(--accent)"); }
function attnVec(seed, n) { let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 131 + seed.charCodeAt(i)) >>> 0; return Array.from({ length: n }, (_, k) => (((h >> (k * 3)) % 17) - 8) / 8); }
function AttnVecRow({ seed, n, col, salt }) {
  const v = attnVec(seed + (salt || ""), n);
  return <span className="emb-vec" style={{ height: 30 }}>{v.map((x, k) => <span key={k} className="emb-vec-cell"><span className="emb-vec-bar" style={{ height: Math.abs(x) * 100 + "%", alignSelf: x >= 0 ? "flex-end" : "flex-start", background: col }} /></span>)}</span>;
}

/* =================================================== 1 · VOTE ============= */
function AttnVote() {
  const toks = ["The", "tired", "cat", "sat", "on", "the", "mat"];
  const q = 3;
  const wt = [0.12, 0.18, 0.62, 0, 0, 0, 0];
  const W = 580, H = 150, gap = W / (toks.length + 1), rowY = 122;
  const cx = i => gap * (i + 1);
  const maxw = Math.max(...wt);
  return (
    <div>
      <div className="fp-plate rd-plate">
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
          {toks.map((t, i) => {
            if (i >= q) return null;
            const w = wt[i], x1 = cx(i), x2 = cx(q), midX = (x1 + x2) / 2, top = rowY - 26 - Math.abs(x2 - x1) * 0.2;
            return <path key={i} d={`M ${x1} ${rowY - 16} Q ${midX} ${top} ${x2} ${rowY - 16}`} fill="none" stroke={attnHeat(w / maxw)} strokeWidth={1 + w * 9} strokeOpacity={0.4 + w} strokeLinecap="round" />;
          })}
          {toks.map((t, i) => (
            <g key={i}>
              <rect x={cx(i) - 27} y={rowY - 16} width="54" height="30" rx="5" fill={i === q ? "var(--accent)" : "var(--surface)"} stroke={i === q ? "none" : "var(--border)"} />
              <text x={cx(i)} y={rowY + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12.5" fill={i === q ? "var(--on-accent)" : "var(--fg2)"}>{t}</text>
            </g>
          ))}
        </svg>
      </div>
      <p className="dg-read">To predict what follows <b>"sat"</b>, that position looks back at every earlier word and decides how much each matters. Here it leans hard on <b>"cat"</b> — the thing doing the sitting. Those "how much" numbers are <b>attention weights</b>.</p>
    </div>
  );
}

/* =================================================== 3 · Q/K/V ============ */
function AttnQKV() {
  const rows = [
    { k: "Query", col: "var(--concept-query)", salt: "Q", role: "“what am I looking for?”" },
    { k: "Key", col: "var(--concept-key)", salt: "K", role: "“what do I offer to others?”" },
    { k: "Value", col: "var(--concept-value)", salt: "V", role: "“what do I pass on if chosen?”" },
  ];
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="qkv-src"><span className="emb-tok">cat</span><span className="qkv-srclab">one token's vector is projected three ways</span></div>
        <div className="qkv-rows">
          {rows.map(r => (
            <div key={r.k} className="qkv-row">
              <span className="qkv-badge" style={{ background: r.col }}>{r.k[0]}</span>
              <div className="qkv-meta"><b style={{ color: r.col }}>{r.k}</b><span>{r.role}</span></div>
              <AttnVecRow seed="cat" n={14} col={r.col} salt={r.salt} />
            </div>
          ))}
        </div>
      </div>
      <p className="dg-read">Each token makes three vectors. A token's <b style={{ color: "var(--concept-query)" }}>Query</b> is compared against every other token's <b style={{ color: "var(--concept-key)" }}>Key</b> to score relevance; the winners' <b style={{ color: "var(--concept-value)" }}>Values</b> are blended into the answer. Attention is just this match-and-mix, done for every token at once.</p>
    </div>
  );
}

/* ===================================== 3b · THE MECHANISM ITSELF ========== */
/* The query is fixed on the ambiguous word "apple". The user toggles between
   two sentences; in each, attention lets "apple" attend to the meaning-giving
   words and the SAME word resolves to two different senses.
   Full scaled-dot-product pipeline, live:
     q·kᵢ scores → ÷√d → softmax weights (sum to 1) → weighted sum of Values.
   No causal mask here — the point is sense-disambiguation, so "apple" reads the
   whole sentence (the context words can sit on either side of it).
   Toy d=4 vectors are hand-tuned around two semantic axes:
     dim0 = food / fruit-ness,  dim1 = tech / company-ness,
     dim2,3 = generic filler.   The query "apple" asks on BOTH axes (it doesn't
   know yet which it is); meaning-giving keys answer on one axis, fillers don't,
   and each word's VALUE carries the sense it contributes. */
const MECH_D = 4;            // toy head dimension
const MECH_SQRT_D = 2;       // √4, shown as the scaling divisor
const MECH_COL = { q: "var(--concept-query)", k: "var(--concept-key)", v: "var(--concept-value)", o: "var(--concept-output)" };

// "apple" asks strongly on both the food axis (dim0) and the tech axis (dim1).
const APPLE_Q = [1.0, 1.0, 0.1, 0.1];

// Per-token toy vectors, keyed by the displayed word. Keys decide who "apple"
// attends to; values decide what meaning gets blended in.
const MECH_WORD = {
  // --- fruit sentence: "she ate a ripe apple" ---
  she:   { k: [0.05, 0.05, 0.6, 0.2], v: [0.1, 0.1, 0.5, 0.2] },
  ate:   { k: [2.0, 0.0, 0.1, 0.1],  v: [0.95, -0.1, 0.2, 0.1] },
  a:     { k: [0.05, 0.05, 0.5, 0.3], v: [0.1, 0.1, 0.4, 0.3] },
  ripe:  { k: [1.8, -0.1, 0.1, 0.1], v: [0.85, -0.15, 0.15, 0.1] },
  // --- company sentence: "apple released a new phone" ---
  released: { k: [0.0, 2.0, 0.1, 0.1],  v: [-0.1, 0.95, 0.2, 0.1] },
  new:      { k: [0.05, 0.1, 0.5, 0.3], v: [0.1, 0.15, 0.4, 0.3] },
  phone:    { k: [-0.1, 1.8, 0.1, 0.1], v: [-0.15, 0.9, 0.15, 0.1] },
  // --- the ambiguous word itself (its own key/value, neutral) ---
  apple: { k: [0.4, 0.4, 0.2, 0.4], v: [0.2, 0.2, 0.1, 0.3] },
};

// The two sentences. `apple` marks the query position in each.
const MECH_SENT = {
  fruit:   { label: "Fruit",   emoji: "🍎", sense: "fruit",   tint: "var(--concept-value)",  words: ["she", "ate", "a", "ripe", "apple"] },
  company: { label: "Company", emoji: "🏢", sense: "company", tint: "var(--concept-key)",    words: ["apple", "released", "a", "new", "phone"] },
};

function mechDot(a, b) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }
function MiniVec({ vec, col, w }) {
  // a compact bar-strip rendering of a small vector (signed bars from center)
  return (
    <span className="mech-vec" style={{ width: w || undefined }}>
      {vec.map((x, k) => (
        <span key={k} className="mech-vec-cell">
          <span className="mech-vec-bar" style={{ height: Math.min(100, Math.abs(x) * 90) + "%", alignSelf: x >= 0 ? "flex-end" : "flex-start", background: col }} />
        </span>
      ))}
    </span>
  );
}
function AttnMechanism() {
  const [sk, setSk] = React.useState("fruit");
  const sent = MECH_SENT[sk];
  const words = sent.words;
  const q = APPLE_Q;

  // raw score q·k for every token, then scaled ÷√d. No causal mask: "apple"
  // reads the whole sentence so it can resolve its sense from either side.
  const rows = words.map((t, i) => {
    const isQuery = t === "apple";
    const raw = mechDot(q, MECH_WORD[t].k);
    return { t, i, isQuery, raw, scaled: raw / MECH_SQRT_D };
  });

  // softmax over the scaled scores
  const mx = Math.max(...rows.map(r => r.scaled));
  const exps = rows.map(r => Math.exp(r.scaled - mx));
  const denom = exps.reduce((s, e) => s + e, 0) || 1;
  const weights = exps.map(e => e / denom);
  const maxW = Math.max(...weights);

  // output = Σ wᵢ · vᵢ
  const out = Array.from({ length: MECH_D }, (_, d) =>
    rows.reduce((s, r, i) => s + weights[i] * MECH_WORD[r.t].v[d], 0));
  // which sense won? compare the food axis (dim0) vs tech axis (dim1) of output.
  const resolvedFruit = out[0] >= out[1];
  const resolved = resolvedFruit
    ? { emoji: "🍎", word: "fruit",   col: MECH_COL.v }
    : { emoji: "🏢", word: "company", col: MECH_COL.k };

  return (
    <div>
      <div className="dg-seg mech-seg" style={{ marginBottom: "var(--sp-4)" }}>
        {Object.keys(MECH_SENT).map(k => (
          <button key={k} className={sk === k ? "on" : ""} onClick={() => setSk(k)}>
            {MECH_SENT[k].emoji}&nbsp;{MECH_SENT[k].label}
          </button>
        ))}
      </div>

      <div className="fp-plate rd-plate">
        {/* the sentence, with the meaning-givers lit by their attention weight */}
        <div className="mech-sent">
          {words.map((t, i) => (
            <span key={i}
              className={"mech-sent-tok" + (t === "apple" ? " is-q" : "")}
              style={t === "apple"
                ? { background: MECH_COL.q, color: "var(--on-accent)" }
                : { background: attnHeat(weights[i] / maxW), color: weights[i] / maxW > 0.45 ? "#2a2118" : "var(--fg2)" }}>
              {t}
            </span>
          ))}
        </div>

        {/* the fixed query */}
        <div className="mech-q">
          <span className="mech-q-lab">query</span>
          <span className="emb-tok" style={{ background: MECH_COL.q, color: "var(--on-accent)", border: "none" }}>apple</span>
          <MiniVec vec={q} col={MECH_COL.q} w={120} />
          <span className="mech-q-note">“apple” is ambiguous. Its query asks on <i>both</i> the food and the tech axis — the sentence decides which one gets answered.</span>
        </div>

        {/* the table: key · score · ÷√d · weight · value */}
        <div className="mech-table" role="table">
          <div className="mech-trow mech-thead" role="row">
            <span className="mech-tok-h">token</span>
            <span style={{ color: MECH_COL.k }}>key kᵢ</span>
            <span>q·kᵢ</span>
            <span>÷√d</span>
            <span className="mech-w-h">weight</span>
            <span style={{ color: MECH_COL.v }}>value vᵢ</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className={"mech-trow" + (r.isQuery ? " is-self" : "")} role="row">
              <span className="mech-tok" style={r.isQuery ? { color: MECH_COL.q, fontWeight: 600 } : undefined}>{r.t}</span>
              <MiniVec vec={MECH_WORD[r.t].k} col={MECH_COL.k} />
              <span className="mech-num">{r.raw.toFixed(2)}</span>
              <span className="mech-num">{r.scaled.toFixed(2)}</span>
              <span className="mech-wcell">
                <span className="mech-wbar-wrap">
                  <span className="mech-wbar" style={{ width: Math.max(2, (weights[i] / maxW) * 100) + "%", background: attnHeat(weights[i] / maxW) }} />
                  <span className="mech-wval" style={{ color: weights[i] / maxW > 0.45 ? "#2a2118" : "var(--fg2)" }}>{weights[i].toFixed(2)}</span>
                </span>
              </span>
              <MiniVec vec={MECH_WORD[r.t].v} col={MECH_COL.v} />
            </div>
          ))}
        </div>

        <div className="mech-flow">
          <span className="mech-flow-step"><b>dot product</b><span>q·kᵢ</span></span>
          <Icon name="arrow-right" size={14} stroke={2} />
          <span className="mech-flow-step"><b>scale</b><span>÷√d&nbsp;(√{MECH_D}={MECH_SQRT_D})</span></span>
          <Icon name="arrow-right" size={14} stroke={2} />
          <span className="mech-flow-step"><b>softmax</b><span>Σ weights = {weights.reduce((s, w) => s + w, 0).toFixed(2)}</span></span>
          <Icon name="arrow-right" size={14} stroke={2} />
          <span className="mech-flow-step mech-flow-out"><b>weighted sum</b><span>Σ wᵢ·vᵢ</span></span>
        </div>

        {/* the output vector + resolved meaning */}
        <div className="mech-out">
          <span className="mech-out-lab" style={{ color: MECH_COL.o }}>output for “apple”</span>
          <MiniVec vec={out} col={MECH_COL.o} w={150} />
          <span className="mech-resolved" style={{ background: "color-mix(in srgb, " + resolved.col + " 20%, transparent)", borderColor: "color-mix(in srgb, " + resolved.col + " 50%, transparent)" }}>
            <span className="mech-resolved-arrow">resolved meaning →</span>
            <span className="mech-resolved-tag" style={{ color: resolved.col }}>{resolved.emoji} {resolved.word}</span>
          </span>
        </div>
      </div>

      <p className="dg-read">Same word, two meanings. The <b style={{ color: "var(--concept-query)" }}>query</b> for “apple” asks on both axes at once. In each sentence it meets every <b style={{ color: "var(--concept-key)" }}>key</b> in a <b>dot product</b> — one similarity number per token — then divides by <b>√d</b> so the scores don't blow up. <b>Softmax</b> turns those into <b>weights that sum to 1</b>: in the fruit sentence “apple” leans on <b>ate</b> and <b>ripe</b>; in the company one it leans on <b>released</b> and <b>phone</b>, while filler words like <i>she</i>, <i>a</i>, <i>new</i> are nearly ignored. The <b>weighted sum of <span style={{ color: "var(--concept-value)" }}>values</span></b> then lands the <b style={{ color: "var(--concept-output)" }}>output</b> in a different place each time — the same token resolves to <span style={{ color: MECH_COL.v }}>🍎 fruit</span> or <span style={{ color: MECH_COL.k }}>🏢 company</span> purely from what it attended to. That is attention's job: <b>reading meaning out of context</b>.</p>
    </div>
  );
}

/* =================================================== 4 · HEADS ============ */
const HEAD_SENT = ["The", "cat", "sat", "on", "the", "mat"];
const HEADS = {
  A: { name: "Head A — the previous word", w: [0, 0, 0, 0, 0.18, 0.82] },
  B: { name: "Head B — the subject", w: [0.06, 0.8, 0.08, 0.02, 0.02, 0.02] },
  C: { name: "Head C — broad context", w: [0.2, 0.2, 0.18, 0.14, 0.13, 0.15] },
};
function AttnHeads() {
  const [h, setH] = React.useState("A");
  const head = HEADS[h]; const mx = Math.max(...head.w);
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        {Object.keys(HEADS).map(k => <button key={k} className={h === k ? "on" : ""} onClick={() => setH(k)}>{"Head " + k}</button>)}
      </div>
      <div className="fp-plate rd-plate">
        <div className="tk-row" style={{ gap: 6 }}>
          {HEAD_SENT.map((t, i) => {
            const w = head.w[i], lit = w / mx > 0.55;
            return <span key={i} className="tk-tok" style={{ background: attnHeat(w / mx), color: lit ? "#fff" : "#2a2118", fontSize: 14 }}><span className="tk-glyph">{t}</span></span>;
          })}
        </div>
        <p className="heads-name">{head.name}</p>
      </div>
      <p className="dg-read">A layer runs <b>many attention heads in parallel</b>, and each learns to look for something different — the word just before, the grammatical subject, a broad summary. Their answers are concatenated, so one layer can track several relationships at once.</p>
    </div>
  );
}

/* =================================================== 5 · KV / CHEAP ======= */
/* MHA → MQA → GQA → MLA: how many K/V heads each keeps, and the KV-cache it
   leaves behind. Eight query heads throughout; only the K/V sharing changes. */
const KV_MODES = {
  MHA: { name: "Multi-head", kv: 8, tag: "Full quality. Eight separate K/V — the biggest cache to carry.", col: "var(--err-500)" },
  GQA: { name: "Grouped-query", kv: 4, tag: "The modern default: heads share K/V in small groups. Most of the quality, half the cache.", col: "var(--ok-500)" },
  MQA: { name: "Multi-query", kv: 1, tag: "Every head shares one K/V. Tiny cache, fastest decode, a touch of quality given up.", col: "var(--warn-500)" },
  MLA: { name: "Latent", kv: 0.5, tag: "K/V squeezed into a low-rank latent and rebuilt on the fly — smaller still than one head.", col: "var(--accent)" },
};
function AttnKV() {
  const [m, setM] = React.useState("MHA");
  const mode = KV_MODES[m], QH = 8;
  const full = KV_MODES.MHA.kv;
  const pct = Math.max(7, (mode.kv / full) * 100);
  // how many distinct K/V slots to draw (MLA shown as a single compressed slot)
  const slots = mode.kv >= 1 ? mode.kv : 1;
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        {Object.keys(KV_MODES).map(k => <button key={k} className={m === k ? "on" : ""} onClick={() => setM(k)}>{k}</button>)}
      </div>
      <div className="fp-plate rd-plate">
        <div className="kv-grid">
          <div className="kv-side">
            <span className="kv-side-lab">query heads</span>
            <div className="kv-heads">
              {Array.from({ length: QH }, (_, i) => <span key={i} className="kv-head kv-q" />)}
            </div>
          </div>
          <div className="kv-side">
            <span className="kv-side-lab">key / value heads</span>
            <div className="kv-heads">
              {m === "MLA"
                ? <span className="kv-head kv-latent" style={{ background: mode.col }}>z</span>
                : Array.from({ length: slots }, (_, i) => <span key={i} className="kv-head kv-kv" style={{ background: mode.col }} />)}
            </div>
          </div>
        </div>
        <div className="kv-bar-wrap">
          <span className="kv-bar-lab">KV cache</span>
          <div className="kv-bar-track">
            <div className="kv-bar-fill" style={{ width: pct + "%", background: mode.col }}>
              <span className="kv-bar-x">{mode.kv >= 1 ? mode.kv + "×" : "~½×"}</span>
            </div>
          </div>
        </div>
        <p className="kv-tag"><b style={{ color: mode.col }}>{mode.name}.</b> {mode.tag}</p>
      </div>
      <p className="dg-read">Self-attention is <b>O(N²)</b>: every token attends to every token, so cost and memory grow with the square of the sequence. The fix is to spend less per pair. Sharing <b style={{ color: "var(--concept-key)" }}>keys</b> and <b style={{ color: "var(--concept-value)" }}>values</b> across heads shrinks the <b>KV cache</b> — the running store of past keys and values that decoding reuses token after token. The same cache reappears in the <span className="term">Inference</span> chapter, where reusing it is what makes generation fast.</p>
    </div>
  );
}

/* combined step-03 payload: the Q/K/V projection as a quick intro, then the
   live mechanism visual as the main event. */
function AttnQKVMechanism() {
  return (
    <div className="mech-stack">
      <AttnQKV />
      <div className="mech-divider"><span>now watch them interact</span></div>
      <AttnMechanism />
    </div>
  );
}

/* ============================================ APPENDIX · efficiency ========= */
/* Step 05 only: the cost story and the shortcuts that tame it. */
function AttnDeepDoc() {
  return (
    <DeepDoc sections={[
      {
        id: "cheap", label: "Cost & shortcuts", title: "Why it's expensive, and how it's tamed",
        intro: "Attention buys a direct path between any two tokens — but at a price that grows with the square of the sequence.",
        render: () => (<div className="rd-prose">
          <p>Before attention, recurrent networks read a sentence one step at a time: position N could only reach position 1 by passing a signal through every token in between — <b>O(N) sequential steps</b>, no parallelism, and a gradient that fades over distance. Attention replaced that with an <b>O(1) path</b> between any two tokens and a single parallel pass over the whole sequence. That is why it won.</p>
          <p>The bill comes due as <b>O(N²)</b>: with every token attending to every token, there are N² pairwise scores to compute and hold. Doubling the context quadruples the work. Most long-context research is a fight against this one term, and a handful of moves do the fighting:</p>
          <ul>
            <li><b>FlashAttention</b> — same exact math, but IO-aware: it tiles the computation so the full N×N matrix is never written out to slow memory. Far less memory traffic, identical result.</li>
            <li><b>Multi-query (MQA)</b> — all heads share one set of keys and values. The KV cache collapses to a single head's worth, so decoding is faster, at a small quality cost.</li>
            <li><b>Grouped-query (GQA)</b> — the middle ground: heads share K/V in small groups, between full multi-head and MQA. The common modern default.</li>
            <li><b>Multi-head latent (MLA)</b> — compress K/V into a low-rank <i>latent</i> and reconstruct it on demand, shrinking the cache below even a single head.</li>
            <li><b>Sparse / sliding-window</b> — drop the "every token" rule: each position attends to a local window or a sparse subset, turning N² back toward linear.</li>
            <li><b>RoPE</b> — rotary positional encoding rotates the Q and K vectors by an angle set by position, giving relative-position awareness that extrapolates to longer sequences than were seen in training.</li>
          </ul>
          <p>The KV-cache savings above (MQA, GQA, MLA) matter most at <i>generation</i> time, where the cache of past keys and values is reused for every new token — the thread the <b>Inference</b> chapter picks up.</p>
        </div>),
      },
    ]} />
  );
}

/* ================================================== CHAPTER CONFIG ========= */
const ATTENTION = {
  id: "attention",
  title: "Attention",
  nextChapter: nextOf("attention"),
  steps: [
    {
      eyebrow: "STEP 01 · ATTENTION", title: "Every word gets to vote", navTitle: "Every word gets to vote",
      lead: "A model doesn't read left to right and forget. Each token looks back at all the others and decides what matters.",
      Body: () => (<><p>So far each token is a vector sitting in a row. Attention is what lets them <b>communicate</b>. When the model works out a token, that token gets to look at every earlier token and pull in whatever is relevant.</p><p>Below, the word being predicted votes on which earlier words matter.</p></>),
      Diagram: AttnVote,
      caption: "Thicker, hotter arcs mean more attention. Notice the pull toward the subject, “cat.”",
    },
    {
      eyebrow: "STEP 02 · ATTENTION", title: "Steer the attention yourself", navTitle: "The attention lab",
      Body: () => (<><p>Here's the real thing. Pick any <b>query token</b> and watch its attention spread back over the sentence — as heat on the tokens, as arcs above, and as weight bars. Press <b>play</b> to walk the query through the sentence, or drag <b>temperature</b> to sharpen or blur the focus.</p></>),
      Diagram: () => <AttentionLab />,
      wide: true,
      caption: "Causal attention: each query only sees itself and earlier tokens. Future tokens stay masked.",
    },
    {
      eyebrow: "STEP 03 · ATTENTION", title: "Query, Key, Value", navTitle: "Query, Key, Value",
      Body: () => (<>
        <p>How does a token decide what to attend to? Each one produces three vectors. The <b style={{ color: "var(--concept-query)" }}>Query</b> is what it's looking for; the <b style={{ color: "var(--concept-key)" }}>Key</b> is what it advertises; the <b style={{ color: "var(--concept-value)" }}>Value</b> is what it contributes if chosen.</p>
        <p>Here's what this buys you: <b>meaning, read out of context</b>. Take the word <b>apple</b>. On its own it's ambiguous — fruit or company? — and its raw vector can't tell you which. Attention resolves it. In <i>“she ate a ripe apple,”</i> apple's query matches the keys of <b>ate</b> and <b>ripe</b>; in <i>“apple released a new phone,”</i> it matches <b>released</b> and <b>phone</b>. The same token, attending to different neighbours, lands in two different meanings.</p>
        <p>Below is exactly how the weights that do this are computed. For the query <code className="code-inline">q</code> (fixed on “apple”), take the <b>dot product</b> with each word's key, <code className="code-inline">q·kᵢ</code> — one similarity number per token, large when the two vectors point the same way. Divide each by <code className="code-inline">√d</code> (the head's dimension) so the scores don't blow up as vectors get longer. Push the scaled scores through <b>softmax</b> — exponentiate and normalise — and they become a set of <b>weights that sum to 1</b>, a clean distribution of focus across the sentence. Finally, take the <b>weighted sum of the values</b>, <code className="code-inline">Σ wᵢ·vᵢ</code> — and that blend is apple's output, now firmly fruit or company. Toggle the two sentences and watch the same word resolve.</p>
      </>),
      Diagram: AttnQKVMechanism,
      wide: true,
      caption: "The query is fixed on the ambiguous word “apple.” Toggle the sentence: q·kᵢ → ÷√d → softmax → weighted sum of V resolves it to 🍎 fruit or 🏢 company.",
    },
    {
      eyebrow: "STEP 04 · ATTENTION", title: "Many heads, many views", navTitle: "Many heads",
      Body: () => (<><p>Everything on the last page — projecting each token to a <b style={{ color: "var(--concept-query)" }}>Query</b>, <b style={{ color: "var(--concept-key)" }}>Key</b>, and <b style={{ color: "var(--concept-value)" }}>Value</b>, scoring, and blending — is <b>one attention head</b>. A head is a single, self-contained copy of that whole mechanism, with its own learned Q/K/V projections.</p><p>The catch: one head can only follow <i>one</i> kind of relationship at a time. So every layer runs <b>several heads in parallel</b> — each free to specialise (the word just before, the grammatical subject, broad context) — and their outputs are concatenated back into one vector. Toggle between three and watch the focus completely change.</p></>),
      Diagram: AttnHeads,
      caption: "Different heads, same sentence, different focus — concatenated into one richer representation.",
    },
    {
      eyebrow: "STEP 05 · ATTENTION", title: "Making attention cheaper", navTitle: "Making it cheaper",
      Body: () => (<><p>Attention's gift is a <b>direct path</b> between any two tokens, computed in parallel — that's why it beat the older recurrent models. Its curse is the price: every token attends to every token, so cost grows with the <b>square</b> of the sequence length.</p><p>Modern variants chip away at that. Toggle between four to see how sharing keys and values across heads shrinks the running <b>KV cache</b> — with a different quality-versus-speed bargain each time.</p></>),
      Diagram: AttnKV,
      caption: "Same eight query heads throughout; only the shared K/V changes. Fewer K/V → a smaller cache to carry while generating.",
      deeper: [{ id: "attn-cheap", label: "Cost & efficient attention", kicker: "Appendix · attention", title: "Inside attention", wide: true, Panel: AttnDeepDoc }],
    },
    {
      eyebrow: "STEP 06 · ATTENTION", title: "One block, stacked deep", navTitle: "Stacked deep",
      Body: () => (<><p>Attention is half of a transformer block; a small feed-forward network refines each token afterward. Then the whole block repeats — dozens of times.</p><p>Stack enough of these and you get the <span className="term">forward pass</span>: raw vectors in, a next-token prediction out. That's the next chapter.</p></>),
      Diagram: () => (<div className="attn-stack">{[0, 1, 2, 3].map(i => (<div key={i} className="attn-layer" style={{ opacity: 1 - i * 0.18 }}><span className="attn-layer-lab">layer {i + 1}</span><span className="attn-layer-sub">attention → feed-forward</span></div>))}<div className="attn-layer-more">× N layers</div></div>),
      caption: "Each block mixes tokens with attention, then refines them. Depth is where understanding accrues.",
    },
  ],
};

Object.assign(window, { ATTENTION });
