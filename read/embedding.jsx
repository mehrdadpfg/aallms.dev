/* aallms — chapter · Embedding
   id → vector, the semantic map, analogies (vector arithmetic), positional info.
   Globals: React, Icon, DeepDoc, nextOf. Exports: EMBEDDING. */

/* shared: a token id (reuse hash) */
function embId(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; } return h % 50257; }
function embVec(s, n) { return Array.from({ length: n }, (_, k) => ((embId(s) >> (k * 2)) % 19 - 9) / 9); }

const EMB_CONCEPT = ["var(--concept-key)", "var(--concept-output)"];
function VecStrip({ word, n = 16, h = 40 }) {
  const v = embVec(word, n);
  return (
    <span className="emb-vec" style={{ height: h }}>
      {v.map((x, k) => (
        <span key={k} className="emb-vec-cell" title={x.toFixed(2)}>
          <span className="emb-vec-bar" style={{ height: Math.abs(x) * 100 + "%", alignSelf: x >= 0 ? "flex-end" : "flex-start", background: x >= 0 ? EMB_CONCEPT[0] : EMB_CONCEPT[1] }} />
        </span>
      ))}
    </span>
  );
}

/* =================================================== 1 · LOOKUP =========== */
const EMB_LOOKUP = ["model", "language", "cat", "Paris", "42"];
function EmbLookup() {
  const [w, setW] = React.useState("model");
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-5)" }}>
        {EMB_LOOKUP.map(x => <button key={x} className={w === x ? "on" : ""} onClick={() => setW(x)}>{x}</button>)}
      </div>
      <div className="emb-lookup">
        <span className="emb-tok">{w}</span>
        <span className="emb-step"><span className="emb-step-lab">id</span><b>{embId(w)}</b></span>
        <Icon name="arrow-right" size={18} stroke={2} />
        <span className="emb-step"><span className="emb-step-lab">row {embId(w)} of the table</span><VecStrip word={w} n={20} /></span>
      </div>
      <p className="dg-read">Each token id selects one <b>row</b> of a giant learned table — the <b>embedding matrix</b>. That row is a vector of a few thousand numbers. From here the model only ever works with these vectors, never the text.</p>
    </div>
  );
}

/* =================================================== 2 · SEMANTIC MAP ===== */
const EMB_WORDS = [
  { w: "cat", x: .16, y: .30, c: "animals" }, { w: "dog", x: .24, y: .40, c: "animals" }, { w: "lion", x: .10, y: .50, c: "animals" },
  { w: "king", x: .74, y: .24, c: "royalty" }, { w: "queen", x: .82, y: .32, c: "royalty" }, { w: "prince", x: .68, y: .16, c: "royalty" },
  { w: "one", x: .28, y: .82, c: "numbers" }, { w: "two", x: .38, y: .88, c: "numbers" }, { w: "three", x: .32, y: .74, c: "numbers" },
  { w: "loop", x: .84, y: .72, c: "code" }, { w: "array", x: .74, y: .80, c: "code" }, { w: "print", x: .90, y: .64, c: "code" },
];
const EMB_CLUSTER_COL = { animals: "var(--concept-key)", royalty: "var(--concept-output)", numbers: "var(--concept-query)", code: "var(--concept-value)" };
function EmbSpace() {
  const W = 520, H = 320, pad = 30;
  const [sel, setSel] = React.useState("king");
  const px = x => pad + x * (W - 2 * pad), py = y => pad + y * (H - 2 * pad);
  const selPt = EMB_WORDS.find(p => p.w === sel);
  const neighbors = EMB_WORDS.filter(p => p.w !== sel)
    .map(p => ({ ...p, d: Math.hypot(p.x - selPt.x, p.y - selPt.y) }))
    .sort((a, b) => a.d - b.d).slice(0, 3);
  const nset = new Set(neighbors.map(n => n.w));
  return (
    <div>
      <div className="fp-plate rd-plate" style={{ padding: "var(--sp-4)" }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
          {neighbors.map(n => <line key={n.w} x1={px(selPt.x)} y1={py(selPt.y)} x2={px(n.x)} y2={py(n.y)} stroke="var(--accent)" strokeWidth="1.5" strokeOpacity={.5 - n.d * .3} strokeDasharray="3 4" />)}
          {EMB_WORDS.map(p => {
            const on = p.w === sel, near = nset.has(p.w);
            return (
              <g key={p.w} onClick={() => setSel(p.w)} style={{ cursor: "pointer" }}>
                <circle cx={px(p.x)} cy={py(p.y)} r={on ? 8 : 6} fill={EMB_CLUSTER_COL[p.c]} fillOpacity={on || near ? 1 : .55} stroke={on ? "var(--accent)" : "none"} strokeWidth="2.5" />
                <text x={px(p.x)} y={py(p.y) - 12} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill={on ? "var(--fg1)" : "var(--fg2)"} fontWeight={on ? 600 : 400}>{p.w}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="dg-read">Click any word. The model places similar meanings <b>near each other</b> — animals here, royalty there, numbers below. "{sel}"'s nearest neighbors are <b>{neighbors.map(n => n.w).join(", ")}</b>. (Real spaces have thousands of dimensions; this is a flattened glimpse.)</p>
    </div>
  );
}

/* =================================================== 3 · ANALOGY ========== */
const EMB_ANALOGY = {
  gender: { label: "king − man + woman", a: { w: "man", x: .30, y: .60 }, b: { w: "woman", x: .30, y: .38 }, c: { w: "king", x: .70, y: .60 }, d: { w: "queen", x: .70, y: .38 } },
  tense: { label: "swim − walk + walked", a: { w: "walk", x: .26, y: .64 }, b: { w: "walked", x: .50, y: .64 }, c: { w: "swim", x: .26, y: .30 }, d: { w: "swam", x: .50, y: .30 } },
};
function EmbAnalogy() {
  const [k, setK] = React.useState("gender");
  const [show, setShow] = React.useState(false);
  React.useEffect(() => { setShow(false); const t = setTimeout(() => setShow(true), 250); return () => clearTimeout(t); }, [k]);
  const A = EMB_ANALOGY[k]; const W = 520, H = 300, pad = 40;
  const px = x => pad + x * (W - 2 * pad), py = y => pad + y * (H - 2 * pad);
  const pts = [A.a, A.b, A.c, A.d];
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        {Object.keys(EMB_ANALOGY).map(x => <button key={x} className={k === x ? "on" : ""} onClick={() => setK(x)}>{EMB_ANALOGY[x].label}</button>)}
      </div>
      <div className="fp-plate rd-plate" style={{ padding: "var(--sp-4)" }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
          <defs><marker id="emb-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M1 1 L8 4.5 L1 8" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></marker></defs>
          <line x1={px(A.a.x)} y1={py(A.a.y)} x2={px(A.b.x)} y2={py(A.b.y)} stroke="var(--concept-query)" strokeWidth="2" markerEnd="url(#emb-arrow)" opacity=".8" />
          <line x1={px(A.c.x)} y1={py(A.c.y)} x2={px(A.d.x)} y2={py(A.d.y)} stroke="var(--accent)" strokeWidth="2" markerEnd="url(#emb-arrow)" strokeDasharray={show ? "none" : "4 4"} style={{ transition: "stroke-dashoffset .4s", opacity: show ? 1 : .3 }} />
          {pts.map((p, i) => (
            <g key={p.w}>
              <circle cx={px(p.x)} cy={py(p.y)} r="7" fill={i === 3 ? "var(--accent)" : "var(--fg2)"} fillOpacity={i === 3 && !show ? .3 : 1} />
              <text x={px(p.x)} y={py(p.y) - 13} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="12" fill="var(--fg1)" fontWeight={i === 3 ? 600 : 400}>{i === 3 && !show ? "?" : p.w}</text>
            </g>
          ))}
        </svg>
      </div>
      <p className="dg-read">The same <b>direction</b> means the same thing everywhere. The arrow from <b>{A.a.w}</b> to <b>{A.b.w}</b> is the same move as <b>{A.c.w}</b> to <b>{A.d.w}</b> — so meaning can be done with arithmetic on vectors.</p>
    </div>
  );
}

/* =================================================== 4 · POSITIONAL ======= */
function EmbPositional() {
  const [pos, setPos] = React.useState(3);
  const n = 16;
  const base = embVec("the", n);
  const posPat = Array.from({ length: n }, (_, k) => Math.sin(pos / Math.pow(10000, (2 * Math.floor(k / 2)) / n) + (k % 2) * Math.PI / 2));
  const combined = base.map((b, k) => Math.max(-1, Math.min(1, b * 0.7 + posPat[k] * 0.5)));
  const Row = ({ vals, label, col }) => (
    <div className="emb-prow"><span className="emb-prow-lab">{label}</span><span className="emb-vec" style={{ height: 32 }}>{vals.map((x, k) => <span key={k} className="emb-vec-cell"><span className="emb-vec-bar" style={{ height: Math.abs(x) * 100 + "%", alignSelf: x >= 0 ? "flex-end" : "flex-start", background: col }} /></span>)}</span></div>
  );
  return (
    <div>
      <div className="fp-plate rd-plate">
        <Row vals={base} label="token “the”" col="var(--concept-key)" />
        <Row vals={posPat} label={`position ${pos}`} col="var(--concept-value)" />
        <div className="emb-plus">＋</div>
        <Row vals={combined} label="what the model sees" col="var(--accent)" />
      </div>
      <div className="dg-slider" style={{ marginTop: "var(--sp-5)" }}>
        <label>Position</label>
        <input type="range" min="0" max="20" step="1" value={pos} onChange={e => setPos(parseInt(e.target.value))} />
        <span className="dg-readout">#{pos}</span>
      </div>
      <p className="dg-read">The word "the" is the same token everywhere — but the model adds a <b>position signal</b> so the 1st "the" and the 9th "the" are different inputs. Slide the position and watch the combined vector shift. Without this, a sentence would be an unordered bag of words.</p>
    </div>
  );
}

/* ============================================ APPENDIX · embedding ========= */
function EmbDeepDoc() {
  return (
    <DeepDoc sections={[
      {
        id: "cos", label: "Measuring similarity", title: "How “close” is measured",
        intro: "Nearness in embedding space is usually cosine similarity — the angle between two vectors, not the distance.",
        render: () => (<div className="rd-prose"><p>Two vectors pointing the same way score <b>1</b>; perpendicular, <b>0</b>; opposite, <b>−1</b>. Because it ignores length and only looks at <i>direction</i>, cosine similarity captures "same meaning" even when one word is far more frequent (and so has a longer vector) than another.</p><p>Every retrieval system you'll meet later — semantic search, RAG — is, underneath, just cosine similarity against a pile of stored embeddings.</p></div>),
      },
      {
        id: "table", label: "A learned table", title: "Where embeddings come from",
        intro: "Nobody hand-places these vectors. They are parameters, nudged by training.",
        render: () => (<div className="rd-prose"><p>The embedding matrix starts as random noise. During training, every time a token appears, gradients tug its row a little so that predictions improve. After billions of tokens, related words have drifted together — the geometry is <b>emergent</b>, not designed.</p><p>The same table is often reused at the output to turn the final vector back into token probabilities — "tied" embeddings.</p></div>),
      },
      {
        id: "pos", label: "Positional schemes", title: "Absolute vs. rotary (RoPE)",
        intro: "Adding a fixed sine pattern is the original recipe. Modern models mostly rotate instead.",
        render: () => (<div className="rd-prose"><p>The first transformers <b>added</b> a sinusoidal position vector, as in the diagram. Newer models use <b>RoPE</b> — they <i>rotate</i> each query and key by an angle proportional to position, so attention naturally depends on the <b>distance</b> between tokens rather than their absolute index.</p><p>This is a big part of why context windows can be stretched after training: you can interpolate the rotation.</p></div>),
      },
    ]} />
  );
}

/* ================================================== CHAPTER CONFIG ========= */
const EMBEDDING = {
  id: "embedding",
  title: "Embedding",
  nextChapter: nextOf("embedding"),
  steps: [
    {
      eyebrow: "STEP 01 · EMBEDDING", title: "From a number to a meaning", navTitle: "Number to meaning",
      lead: "A token id is just an index. The embedding is the first place the model turns it into something it can reason with.",
      Body: () => (<><p>Last chapter ended with a token id — say <b>8,421</b>. On its own that number means nothing; 8,421 isn't "bigger" or "better" than 8,420.</p><p>So the model looks the id up in a table and pulls out a <b>vector</b>: a long list of numbers that represents the token's meaning. Pick a word and watch the lookup.</p></>),
      Diagram: EmbLookup,
      caption: "id → one row of the embedding matrix. Every token becomes a point in a high-dimensional space.",
    },
    {
      eyebrow: "STEP 02 · EMBEDDING", title: "Meaning becomes geometry", navTitle: "Meaning becomes geometry",
      Body: () => (<><p>The point of these vectors is <b>position</b>. Words with similar meaning end up near each other; unrelated words land far apart. The model learns this layout from data — nobody places the words by hand.</p><p>Click around the map below.</p></>),
      Diagram: EmbSpace,
      caption: "Similar tokens cluster. Distance in this space is the model's notion of \u201crelatedness.\u201d",
      deeper: [{ id: "emb-appx", label: "Similarity, learning & RoPE", kicker: "Appendix · embedding", title: "Inside embeddings", wide: true, Panel: EmbDeepDoc }],
    },
    {
      eyebrow: "STEP 03 · EMBEDDING", title: "Directions carry meaning", navTitle: "Directions carry meaning",
      Body: () => (<><p>Here's the surprising part: not just <i>where</i> a word sits, but the <b>directions</b> between words are meaningful. Move "man" → "woman" and you've found the "gender" direction. Apply that same move to "king" and you land near "queen".</p></>),
      Diagram: EmbAnalogy,
      caption: "Vector arithmetic: king − man + woman ≈ queen. The same direction means the same change everywhere.",
    },
    {
      eyebrow: "STEP 04 · EMBEDDING", title: "Order has to be added", navTitle: "Order has to be added",
      Body: () => (<><p>Embeddings capture <i>what</i> a token means, but not <i>where</i> it is. "dog bites man" and "man bites dog" use identical tokens. So the model adds a <b>positional signal</b> to each embedding.</p></>),
      Diagram: EmbPositional,
      caption: "Token embedding + position signal = the vector that enters the first transformer layer.",
    },
    {
      eyebrow: "STEP 05 · EMBEDDING", title: "Ready to be compared", navTitle: "Ready to be compared",
      Body: () => (<><p>Every token is now a vector that encodes both its meaning and its place in the sequence. They're lined up, waiting.</p><p>The next step is the heart of the whole machine: letting these vectors <span className="term">look at each other</span> and decide what matters. That's <b>attention</b>.</p></>),
      Diagram: () => (<div className="emb-ready">{["The", "model", "reads", "every", "token"].map((t, i) => (<div key={i} className="emb-ready-col"><span className="emb-tok emb-tok--sm">{t}</span><VecStrip word={t} n={10} h={54} /></div>))}</div>),
      caption: "A row of meaning-and-position vectors — the input to attention.",
    },
  ],
};

Object.assign(window, { EMBEDDING, embVec, VecStrip });
