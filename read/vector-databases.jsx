/* aallms — chapter · Vector databases
   Embeddings become rows in a database; similarity search finds nearest
   neighbours; ANN indexes trade a little recall for big speed; a knowledge
   base is an embedded corpus plus metadata you can filter.
   Globals: React, Icon, DeepDoc, nextOf, makeRefs. Exports: VECTORDB_CH. */

const { Cite, Footnotes } = makeRefs(["arxiv-2602-08316", "arxiv-2505-19433"]);

/* =================================================== 1 · INGEST =========== */
const VDB_ITEMS = [
  { id: "i1", label: "“Returns within 30 days”", col: "var(--concept-value)" },
  { id: "i2", label: "“Reset your password”", col: "var(--concept-query)" },
  { id: "i3", label: "“Support hours & contact”", col: "var(--concept-key)" },
  { id: "i4", label: "“Shipping & delivery”", col: "var(--concept-output)" },
];
/* tiny illustrative 4-d embeddings, just enough to look real */
const VDB_VECS = {
  i1: [0.82, -0.14, 0.31, 0.07],
  i2: [-0.21, 0.76, 0.05, -0.33],
  i3: [0.12, 0.44, -0.61, 0.28],
  i4: [0.55, 0.18, 0.22, -0.48],
};
function VdbIngest() {
  const [stage, setStage] = React.useState(0); // 0 text · 1 vectors · 2 stored
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="vdb-pipe">
          {/* column 1 — raw items */}
          <div className="vdb-pcol">
            <p className="vdb-pcol-h"><Icon name="file-text" size={12} stroke={2} />Items</p>
            {VDB_ITEMS.map(it => (
              <div key={it.id} className="vdb-item" style={{ "--vc": it.col }}>{it.label}</div>
            ))}
          </div>

          <div className={"vdb-arrow" + (stage >= 1 ? " is-on" : "")}>
            <Icon name="cpu" size={15} stroke={2} />
            <span>embed</span>
            <Icon name="arrow-right" size={14} stroke={2.2} />
          </div>

          {/* column 2 — vectors */}
          <div className="vdb-pcol">
            <p className="vdb-pcol-h"><Icon name="hash" size={12} stroke={2} />Vectors</p>
            {VDB_ITEMS.map(it => (
              <div key={it.id} className={"vdb-vec" + (stage >= 1 ? " is-on" : "")} style={{ "--vc": it.col }}>
                {stage >= 1
                  ? <code>[{VDB_VECS[it.id].map(n => n.toFixed(2)).join(", ")} …]</code>
                  : <span className="vdb-vec-wait">—</span>}
              </div>
            ))}
          </div>

          <div className={"vdb-arrow" + (stage >= 2 ? " is-on" : "")}>
            <Icon name="arrow-right" size={14} stroke={2.2} />
            <span>store</span>
          </div>

          {/* column 3 — the database */}
          <div className={"vdb-db" + (stage >= 2 ? " is-on" : "")}>
            <p className="vdb-pcol-h"><Icon name="database" size={12} stroke={2} />Vector DB</p>
            <div className="vdb-db-rows">
              {VDB_ITEMS.map(it => (
                <div key={it.id} className="vdb-db-row" style={{ "--vc": it.col }}>
                  <span className="vdb-db-id">{it.id}</span>
                  <span className="vdb-db-dot" />
                  <span className="vdb-db-meta">{stage >= 2 ? "vector + id + metadata" : "…"}</span>
                </div>
              ))}
            </div>
            <p className="vdb-db-count">× millions of rows</p>
          </div>
        </div>
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={() => setStage(s => Math.min(2, s + 1))} disabled={stage >= 2}>
          <Icon name="play" size={14} stroke={2.2} />{stage === 0 ? "Embed" : "Store"}
        </button>
        <button className="dg-btn" onClick={() => setStage(0)}><Icon name="rotate-ccw" size={14} stroke={2.2} />Reset</button>
        <span className="dg-readout">{stage === 0 ? "text" : stage === 1 ? "vectors" : "stored"}</span>
      </div>
      <p className="dg-read">Back in the <b>Embedding</b> chapter, each piece of text became a list of numbers — a point in high-dimensional space. A <b>vector database</b> is what you get when you do that for a whole corpus and keep the results: every item stored as its vector, its id, and a little metadata. Step the pipeline: text → vectors → rows you can search by <i>meaning</i> rather than keywords.</p>
    </div>
  );
}

/* =================================================== 2 · SIMILARITY ======= */
const VDB_POINTS = [
  { id: "p1", label: "Returns & refunds", x: 24, y: 28, col: "var(--concept-value)" },
  { id: "p2", label: "How to request a refund", x: 36, y: 44, col: "var(--concept-value)" },
  { id: "p3", label: "Reset your password", x: 78, y: 32, col: "var(--concept-query)" },
  { id: "p4", label: "Two-factor login help", x: 70, y: 52, col: "var(--concept-query)" },
  { id: "p5", label: "Support hours & contact", x: 48, y: 80, col: "var(--concept-key)" },
  { id: "p6", label: "Shipping & delivery", x: 60, y: 20, col: "var(--concept-output)" },
  { id: "p7", label: "Account billing FAQ", x: 18, y: 64, col: "var(--concept-output)" },
];
const VDB_TOPK = 3;
/* cosine-style similarity from a 2-D layout: treat the box centre as origin,
   each point as a direction; closeness in angle + distance reads as score. */
function vdbSim(qx, qy, px, py) {
  const ax = qx - 50, ay = qy - 50, bx = px - 50, by = py - 50;
  const da = Math.hypot(ax, ay) || 1e-6, db = Math.hypot(bx, by) || 1e-6;
  const cos = (ax * bx + ay * by) / (da * db);          // angular agreement
  const dist = Math.hypot(qx - px, qy - py);            // spatial proximity
  return Math.max(0, 0.55 * ((cos + 1) / 2) + 0.45 * (1 - dist / 90));
}
function VdbSimilarity() {
  const [q, setQ] = React.useState({ x: 40, y: 36 });
  const [drag, setDrag] = React.useState(false);
  const ref = React.useRef(null);

  const move = (clientX, clientY) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, ((clientX - r.left) / r.width) * 100));
    const y = Math.max(4, Math.min(96, ((clientY - r.top) / r.height) * 100));
    setQ({ x: Math.round(x), y: Math.round(y) });
  };
  React.useEffect(() => {
    if (!drag) return;
    const mm = e => { e.preventDefault(); const t = e.touches ? e.touches[0] : e; move(t.clientX, t.clientY); };
    const mu = () => setDrag(false);
    window.addEventListener("mousemove", mm); window.addEventListener("mouseup", mu);
    window.addEventListener("touchmove", mm, { passive: false }); window.addEventListener("touchend", mu);
    return () => { window.removeEventListener("mousemove", mm); window.removeEventListener("mouseup", mu);
      window.removeEventListener("touchmove", mm); window.removeEventListener("touchend", mu); };
  }, [drag]);

  const scored = VDB_POINTS.map(p => ({ ...p, sim: vdbSim(q.x, q.y, p.x, p.y) }))
    .sort((a, b) => b.sim - a.sim);
  const top = new Set(scored.slice(0, VDB_TOPK).map(p => p.id));

  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="rag-grid">
          <div className="rag-space vdb-space" ref={ref}
            onMouseDown={e => { setDrag(true); move(e.clientX, e.clientY); }}
            onTouchStart={e => { setDrag(true); const t = e.touches[0]; move(t.clientX, t.clientY); }}>
            <svg className="rag-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {scored.slice(0, VDB_TOPK).map(p => (
                <line key={p.id} x1={q.x} y1={q.y} x2={p.x} y2={p.y}
                  stroke="var(--accent)" strokeWidth="0.5" strokeDasharray="1.5 1.5" opacity="0.55" />
              ))}
            </svg>
            {VDB_POINTS.map(p => {
              const hit = top.has(p.id);
              return (
                <div key={p.id} className={"rag-dot" + (hit ? " is-hit" : "")}
                  style={{ left: p.x + "%", top: p.y + "%", "--rc": p.col }} title={p.label}>
                  <span className="rag-dot-lab">{p.label}</span>
                </div>
              );
            })}
            <div className={"rag-query vdb-query" + (drag ? " is-drag" : "")}
              style={{ left: q.x + "%", top: q.y + "%" }} title="query — drag me">
              <Icon name="search" size={11} stroke={2.4} />
            </div>
            <span className="vdb-hint"><Icon name="move" size={11} stroke={2} />drag the query</span>
          </div>
          <div className="rag-window vdb-scores">
            <p className="rag-window-h">Nearest neighbours · cosine</p>
            {scored.map((p, i) => {
              const hit = i < VDB_TOPK;
              return (
                <div key={p.id} className={"vdb-score" + (hit ? " is-hit" : "")} style={{ "--vc": p.col }}>
                  <span className="vdb-score-rank">{hit ? i + 1 : "·"}</span>
                  <span className="vdb-score-lab">{p.label}</span>
                  <span className="vdb-score-bar"><i style={{ width: Math.round(p.sim * 100) + "%" }} /></span>
                  <span className="vdb-score-num">{p.sim.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <p className="dg-read">Searching this database means asking: which stored vectors point in nearly the same direction as the query? That's <b>cosine similarity</b> — the angle between two vectors, with <b>dot product</b> a close cousin.<Cite id="arxiv-2602-08316" /> Drag the query point and watch the nearest neighbours light up, scores re-ranking live. Notice how items about the <i>same topic</i> cluster together: meaning has become geometry.</p>
    </div>
  );
}

/* =================================================== 3 · ANN ============== */
function VdbAnn() {
  const [approx, setApprox] = React.useState(false);
  const N = 1000000; // a million vectors
  const comparisons = approx ? 1800 : N;
  const recall = approx ? 96 : 100;
  const latency = approx ? 1.4 : 420; // ms, illustrative
  const probed = approx ? 6 : 64; // cells / nodes visited, for the viz
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-5)" }}>
        <button className={!approx ? "on" : ""} onClick={() => setApprox(false)}>exact · brute force</button>
        <button className={approx ? "on" : ""} onClick={() => setApprox(true)}>approximate · HNSW</button>
      </div>
      <div className="fp-plate rd-plate">
        <div className="vdb-ann">
          <div className={"vdb-ann-field" + (approx ? " is-approx" : "")}>
            {Array.from({ length: 64 }).map((_, i) => (
              <span key={i} className={"vdb-cell" + (approx ? (i < probed ? " is-probed" : " is-skipped") : " is-probed")} />
            ))}
            <div className="vdb-ann-tag">
              {approx
                ? <><Icon name="git-branch" size={12} stroke={2} />navigate a graph · visit a few promising nodes</>
                : <><Icon name="grid-3x3" size={12} stroke={2} />compare against every single vector</>}
            </div>
          </div>
          <div className="vdb-readouts">
            <div className="vdb-stat">
              <span className="vdb-stat-k">comparisons</span>
              <b className="vdb-stat-v">{comparisons.toLocaleString()}</b>
              <span className="vdb-stat-sub">of {N.toLocaleString()}</span>
            </div>
            <div className="vdb-stat">
              <span className="vdb-stat-k">recall</span>
              <b className="vdb-stat-v" style={{ color: recall === 100 ? "var(--ok-500)" : "var(--warn-500)" }}>{recall}%</b>
              <span className="vdb-stat-sub">{recall === 100 ? "every true neighbour" : "a few may be missed"}</span>
            </div>
            <div className="vdb-stat">
              <span className="vdb-stat-k">latency</span>
              <b className="vdb-stat-v" style={{ color: latency < 50 ? "var(--ok-500)" : "var(--err-500)" }}>{latency} ms</b>
              <span className="vdb-stat-sub">{latency < 50 ? "interactive" : "too slow to scale"}</span>
            </div>
          </div>
        </div>
      </div>
      <p className="dg-read">Brute force compares the query against <b>every</b> vector — perfect recall, but hopeless at a million rows and beyond.<Cite id="arxiv-2505-19433" /> <b>Approximate nearest neighbour</b> indexes like <b>HNSW</b> (a navigable graph) and <b>IVF</b> (clustered cells) visit only a promising handful, giving up a sliver of recall for orders-of-magnitude speed. Toggle the two and watch comparisons collapse from a million to a few thousand while recall barely dips.</p>
    </div>
  );
}

/* =================================================== 4 · KNOWLEDGE BASE ==== */
const KB_DOCS = [
  { id: "d1", title: "Returns & refunds policy", source: "policy", year: 2025, sim: 0.91, col: "var(--concept-value)" },
  { id: "d2", title: "How to request a refund", source: "faq", year: 2024, sim: 0.88, col: "var(--concept-value)" },
  { id: "d3", title: "Legacy returns (deprecated)", source: "policy", year: 2021, sim: 0.84, col: "var(--concept-value)" },
  { id: "d4", title: "Refund timelines by region", source: "faq", year: 2025, sim: 0.79, col: "var(--concept-value)" },
  { id: "d5", title: "Community thread: refund late?", source: "forum", year: 2025, sim: 0.74, col: "var(--concept-output)" },
  { id: "d6", title: "Shipping & delivery times", source: "faq", year: 2025, sim: 0.41, col: "var(--concept-output)" },
];
const KB_SOURCES = ["all", "policy", "faq", "forum"];
function VdbKnowledgeBase() {
  const [src, setSrc] = React.useState("all");
  const [recent, setRecent] = React.useState(false);
  const KB_TOPK = 3;

  const passesFilter = d => (src === "all" || d.source === src) && (!recent || d.year >= 2024);
  const filtered = KB_DOCS.filter(passesFilter);
  const results = [...filtered].sort((a, b) => b.sim - a.sim).slice(0, KB_TOPK);
  const resultIds = new Set(results.map(d => d.id));

  return (
    <div>
      <div className="vdb-filters">
        <div className="dg-seg">
          {KB_SOURCES.map(s => (
            <button key={s} className={src === s ? "on" : ""} onClick={() => setSrc(s)}>{s}</button>
          ))}
        </div>
        <button className={"vdb-toggle" + (recent ? " on" : "")} onClick={() => setRecent(r => !r)}>
          <Icon name={recent ? "check-square" : "square"} size={14} stroke={2} />since 2024
        </button>
      </div>
      <div className="fp-plate rd-plate">
        <div className="vdb-kb">
          <div className="vdb-kb-col">
            <p className="vdb-pcol-h"><Icon name="filter" size={12} stroke={2} />Corpus · metadata filter</p>
            <div className="vdb-kb-list">
              {KB_DOCS.map(d => {
                const pass = passesFilter(d);
                return (
                  <div key={d.id} className={"vdb-kb-row" + (pass ? "" : " is-out")} style={{ "--vc": d.col }}>
                    <span className="vdb-kb-dot" />
                    <span className="vdb-kb-title">{d.title}</span>
                    <span className="vdb-kb-tags">
                      <span className="vdb-tag">{d.source}</span>
                      <span className="vdb-tag">{d.year}</span>
                    </span>
                    {pass ? null : <span className="vdb-kb-x"><Icon name="x" size={11} stroke={2.4} /></span>}
                  </div>
                );
              })}
            </div>
            <p className="vdb-kb-count">{filtered.length} of {KB_DOCS.length} pass the filter</p>
          </div>
          <div className="vdb-kb-col">
            <p className="vdb-pcol-h"><Icon name="search" size={12} stroke={2} />Vector search · “refund policy”</p>
            <div className="vdb-kb-results">
              {results.length ? results.map((d, i) => (
                <div key={d.id} className="vdb-kb-hit" style={{ "--vc": d.col }}>
                  <span className="vdb-score-rank">{i + 1}</span>
                  <span className="vdb-score-lab">{d.title}</span>
                  <span className="vdb-score-num">{d.sim.toFixed(2)}</span>
                </div>
              )) : <div className="vdb-kb-empty">nothing left to search</div>}
            </div>
            <p className="vdb-kb-note">searched <b>within</b> the filtered set — never the whole corpus</p>
          </div>
        </div>
      </div>
      <p className="dg-read">A <b>knowledge base</b> is more than raw vectors: it's an embedded corpus <i>plus</i> the metadata that came with each document — its source, its date, its author. Real queries combine the two. First a cheap <b>metadata filter</b> narrows the candidates (only <code>policy</code> docs, only recent ones); then <b>vector search</b> ranks what survives by meaning. Flip the source and the recency toggle, and watch the deprecated 2021 policy and off-topic forum posts drop out before the search even runs.</p>
      <Footnotes />
    </div>
  );
}

/* ================================================== CHAPTER CONFIG ========= */
const VECTORDB_CH = {
  id: "vector-databases", title: "Vector databases", nextChapter: nextOf("vector-databases"),
  steps: [
    { eyebrow: "STEP 01 · VECTOR DATABASES", title: "From embeddings to a database", navTitle: "Embeddings → DB",
      lead: "An embedding turns text into a point in space. Do that for a whole corpus and keep the points, and you have a vector database.",
      Body: () => (<><p>We met <b>embeddings</b> earlier: a model maps a piece of text to a list of numbers — coordinates in a high-dimensional space where nearby points mean similar things. On its own, one embedding is just a vector. The magic starts when you compute them for <i>everything</i> and store the lot.</p><p>That store is a <b>vector database</b>: millions of vectors, each tagged with an id and a little metadata, sitting ready to be searched by meaning rather than by exact words. Step the pipeline below — text becomes vectors becomes rows.</p></>),
      Diagram: VdbIngest, wide: true,
      caption: "Each item is embedded into a vector, then stored as a row — id, vector, and metadata — alongside millions of others." },

    { eyebrow: "STEP 02 · VECTOR DATABASES", title: "Finding the nearest neighbours", navTitle: "Similarity search",
      Body: () => (<><p>Once everything is a point, a query is a point too. Searching means finding the stored vectors closest to it — its <b>nearest neighbours</b>. "Close" is usually measured by <b>cosine similarity</b> (the angle between two vectors) or <b>dot product</b>, not plain distance, so that direction matters more than magnitude.</p><p>Drag the query around the space and watch the top matches re-rank in real time.</p></>),
      Diagram: VdbSimilarity, wide: true,
      caption: "The query is a movable point; its nearest neighbours by cosine similarity light up, with live scores on the right." },

    { eyebrow: "STEP 03 · VECTOR DATABASES", title: "Approximate nearest neighbour", navTitle: "ANN indexes",
      Body: () => (<><p>Comparing a query against every vector is <b>brute force</b>: flawless, but it grows linearly with the data. At a million rows — let alone a billion — that's far too slow for an interactive search.</p><p>The fix is an <b>approximate nearest neighbour</b> index. Structures like <b>HNSW</b> (a navigable small-world graph) and <b>IVF</b> (inverted file, clustered cells) let the search visit only a promising handful of candidates. You trade a sliver of <i>recall</i> for an enormous gain in speed. Toggle exact against approximate and watch the tradeoff.</p></>),
      Diagram: VdbAnn, wide: true,
      caption: "Exact scans every cell; the approximate index probes only a few, collapsing latency while recall barely moves." },

    { eyebrow: "STEP 04 · VECTOR DATABASES", title: "From vectors to a knowledge base", navTitle: "Knowledge bases",
      Body: () => (<><p>A bare vector store answers "what's similar?" A <b>knowledge base</b> answers "what's similar, <i>and</i> relevant, <i>and</i> trustworthy?" The difference is <b>metadata</b>: every document carries structured fields — source, date, author, access level — riding alongside its vector.</p><p>The strongest retrieval combines the two. A cheap <b>metadata filter</b> trims the corpus to what's eligible; then <b>vector search</b> ranks the survivors by meaning. Set a filter below, then search within it.</p></>),
      Diagram: VdbKnowledgeBase, wide: true,
      caption: "A metadata filter narrows the corpus first; vector search then ranks only the documents that survived the filter." },
  ],
};

Object.assign(window, { VECTORDB_CH });
