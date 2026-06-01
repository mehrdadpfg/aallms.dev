/* aallms — chapter · Retrieval & RAG
   Why retrieve, chunking, the retrieve-then-read loop, and getting it right.
   Globals: React, Icon, nextOf, makeRefs. Exports: RAG_CH.
   CSS: rag-* classes copied from context-engineering.html <style>; ragw-*,
   ragc-*, ragk-* are new and live in retrieval-rag.html <style>. */

const { Cite, Footnotes } = makeRefs(["arxiv-2601-07190", "arxiv-2602-08316", "anthropic-context-eng", "logrocket-context"]);

/* =================================================== 1 · WHY RETRIEVE ====== */
function RagWhy() {
  return (
    <div>
      <div className="ragw-flow">
        <div className="ragw-stage ragw-corpus">
          <p className="ragw-h">Knowledge base</p>
          <div className="ragw-grid">
            {Array.from({ length: 28 }).map((_, i) => (
              <span key={i} className={"ragw-doc" + (i === 11 ? " is-pick" : "")} />
            ))}
          </div>
          <span className="ragw-note">far too big for the window</span>
        </div>
        <div className="ragw-step">
          <span className="ragw-arrow"><Icon name="arrow-right" size={16} stroke={2.2} /></span>
          <span className="ragw-op"><Icon name="database" size={12} stroke={2} />index</span>
        </div>
        <div className="ragw-stage ragw-index">
          <p className="ragw-h">Index</p>
          <div className="ragw-bars">
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className={"ragw-bar" + (i === 3 ? " is-pick" : "")} style={{ height: 12 + ((i * 13) % 26) + "px" }} />
            ))}
          </div>
          <span className="ragw-note">searchable in an instant</span>
        </div>
        <div className="ragw-step">
          <span className="ragw-arrow"><Icon name="arrow-right" size={16} stroke={2.2} /></span>
          <span className="ragw-op"><Icon name="search" size={12} stroke={2} />fetch</span>
        </div>
        <div className="ragw-stage ragw-window">
          <p className="ragw-h">Context window</p>
          <div className="ragw-win-fixed">system · question</div>
          <div className="ragw-slice"><Icon name="file-text" size={12} stroke={2} />the one relevant slice</div>
          <span className="ragw-note">small &amp; affordable</span>
        </div>
      </div>
      <p className="dg-read">The window can't hold a whole knowledge base — so don't try. Keep the corpus <b>outside</b> the model, <b>index</b> it once, and at question time <b>fetch</b> only the slice that's relevant.<Cite id="arxiv-2601-07190" /> The window stays small; the memory behind it is effectively unbounded.</p>
    </div>
  );
}

/* =================================================== 2 · CHUNKING ========== */
const RAG_DOC = "Returns are accepted within 30 days of delivery. To request a refund, open your account, choose the order, and select Refund. Approved refunds post to the original payment method within five business days.";
const RAG_WORDS = RAG_DOC.split(" ");
function RagChunk() {
  const [size, setSize] = React.useState(8);
  const chunks = [];
  for (let k = 0; k < RAG_WORDS.length; k += size) chunks.push(RAG_WORDS.slice(k, k + size));
  const pals = ["var(--concept-query)", "var(--concept-key)", "var(--concept-value)", "var(--concept-output)"];
  return (
    <div>
      <div className="ragc-doc">
        {chunks.map((words, ci) => (
          <span key={ci} className="ragc-chunk" style={{ "--cc": pals[ci % pals.length] }}>
            <span className="ragc-chunk-n">chunk {ci + 1}</span>
            <span className="ragc-text">{words.join(" ")}</span>
          </span>
        ))}
      </div>
      <div className="dg-slider" style={{ marginTop: "var(--sp-5)" }}>
        <label>Chunk size</label>
        <input type="range" min="4" max="20" step="1" value={size} onChange={e => setSize(parseInt(e.target.value))} />
        <span className="dg-readout">{size} words · {chunks.length} chunks</span>
      </div>
      <p className="dg-read">Before anything is indexed, documents are <b>split into chunks</b> — and where the cuts fall is a real tradeoff. Make chunks <b>too small</b> and a single idea is severed across boundaries; make them <b>too large</b> and each retrieved piece drags in unrelated text that crowds the window.<Cite id="logrocket-context" /> Slide the size and watch the seams move.</p>
    </div>
  );
}

/* =================================================== 3 · RETRIEVE-THEN-READ */
const RAG_QUERIES = [
  { id: "refund", label: "refund policy?", x: 26, y: 30 },
  { id: "reset",  label: "reset password?", x: 74, y: 64 },
  { id: "hours",  label: "support hours?", x: 50, y: 84 },
];
const RAG_CHUNKS = [
  { id: "c1", label: "Returns & refunds within 30 days", x: 20, y: 22, col: "var(--concept-value)" },
  { id: "c2", label: "How to request a refund",          x: 34, y: 40, col: "var(--concept-value)" },
  { id: "c3", label: "Reset your password",              x: 80, y: 58, col: "var(--concept-query)" },
  { id: "c4", label: "Two-factor & login help",          x: 66, y: 72, col: "var(--concept-query)" },
  { id: "c5", label: "Support hours & contact",          x: 44, y: 78, col: "var(--concept-key)" },
  { id: "c6", label: "Shipping & delivery times",        x: 58, y: 24, col: "var(--concept-output)" },
  { id: "c7", label: "Account billing FAQ",              x: 14, y: 60, col: "var(--concept-output)" },
];
const RAG_TOPK = 3;
function CtxRag() {
  const [qid, setQid] = React.useState("refund");
  const q = RAG_QUERIES.find(x => x.id === qid);
  const scored = RAG_CHUNKS.map(c => {
    const d = Math.hypot(c.x - q.x, c.y - q.y);
    return { ...c, sim: Math.max(0, 1 - d / 70) };
  }).sort((a, b) => b.sim - a.sim);
  const top = new Set(scored.slice(0, RAG_TOPK).map(c => c.id));
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-5)" }}>
        {RAG_QUERIES.map(x => (
          <button key={x.id} className={qid === x.id ? "on" : ""} onClick={() => setQid(x.id)}>{x.label}</button>
        ))}
      </div>
      <div className="rag-grid">
        <div className="rag-space">
          <svg className="rag-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {RAG_CHUNKS.filter(c => top.has(c.id)).map(c => (
              <line key={c.id} x1={q.x} y1={q.y} x2={c.x} y2={c.y} stroke="var(--accent)" strokeWidth="0.5" strokeDasharray="1.5 1.5" opacity="0.55" />
            ))}
          </svg>
          {RAG_CHUNKS.map(c => {
            const hit = top.has(c.id);
            return (
              <div key={c.id} className={"rag-dot" + (hit ? " is-hit" : "")} style={{ left: c.x + "%", top: c.y + "%", "--rc": c.col }} title={c.label}>
                <span className="rag-dot-lab">{c.label}</span>
              </div>
            );
          })}
          <div className="rag-query" style={{ left: q.x + "%", top: q.y + "%" }} title="query embedding">
            <Icon name="search" size={11} stroke={2.4} />
          </div>
        </div>
        <div className="rag-window">
          <p className="rag-window-h">Context window</p>
          <div className="rag-window-fixed">system · tools · question</div>
          {scored.slice(0, RAG_TOPK).map((c, i) => (
            <div key={c.id} className="rag-window-chunk" style={{ borderLeftColor: c.col }}>
              <span className="rag-window-rank">{i + 1}</span>{c.label}
              <span className="rag-window-sim">{Math.round(c.sim * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
      <p className="dg-read">This is the core RAG loop. The question is turned into a vector and dropped into the same space as every chunk; the <b>nearest neighbours by cosine similarity</b> get pulled into the window, and only then does the model read.<Cite id="arxiv-2602-08316" /> Switch the question and watch a different cluster light up.</p>
    </div>
  );
}

/* =================================================== 4 · GETTING IT RIGHT == */
/* relevance-ranked pool: high scores are on-topic, the tail is noise */
const RAGK_POOL = [
  { label: "How to request a refund",        rel: 0.94, on: true },
  { label: "Returns & refunds within 30 days", rel: 0.88, on: true },
  { label: "Refund timing & payment method", rel: 0.79, on: true },
  { label: "Account billing FAQ",            rel: 0.52, on: false },
  { label: "Support hours & contact",        rel: 0.41, on: false },
  { label: "Shipping & delivery times",      rel: 0.27, on: false },
  { label: "Newsletter sign-up",             rel: 0.14, on: false },
];
function RagTopK() {
  const [k, setK] = React.useState(3);
  const picked = RAGK_POOL.slice(0, k);
  const onCount = picked.filter(c => c.on).length;
  const precision = Math.round(onCount / k * 100);
  return (
    <div>
      <div className="ragk-list">
        {RAGK_POOL.map((c, i) => {
          const inK = i < k;
          const noise = inK && !c.on;
          return (
            <div key={i} className={"ragk-row" + (inK ? " is-in" : "") + (noise ? " is-noise" : "")}>
              <span className="ragk-rank">{i + 1}</span>
              <span className="ragk-lab">{c.label}</span>
              {inK ? <span className="ragk-tag">{noise ? "noise" : "relevant"}</span> : null}
              <span className="ragk-bar"><span className="ragk-fill" style={{ width: Math.round(c.rel * 100) + "%" }} /></span>
              {i === k - 1 ? <span className="ragk-cut">top-k cut</span> : null}
            </div>
          );
        })}
      </div>
      <div className="dg-slider" style={{ marginTop: "var(--sp-5)" }}>
        <label>top-k</label>
        <input type="range" min="1" max="7" step="1" value={k} onChange={e => setK(parseInt(e.target.value))} />
        <span className="dg-readout">{k} pulled · {precision}% on-topic</span>
      </div>
      <p className="dg-read">Retrieving more isn't retrieving better. Reach past the relevant few and <b>top-k</b> starts scooping up the long tail — chunks that are merely close, not useful. Each one is <b>noise</b> the model must read around, and (from the last chapter) a chunk buried in the middle is the easiest to miss.<Cite id="anthropic-context-eng" /> The craft is fetching <i>just enough</i>, then placing the strongest pieces where attention lands.<Cite id="logrocket-context" /></p>
      <Footnotes />
    </div>
  );
}

/* ================================================== CHAPTER CONFIG ========= */
const RAG_CH = {
  id: "retrieval-rag", title: "Retrieval & RAG", nextChapter: nextOf("retrieval-rag"),
  steps: [
    { eyebrow: "STEP 01 · RETRIEVAL & RAG", title: "Why retrieve at all", navTitle: "Why retrieve",
      lead: "A model only knows what's in its window — and a real knowledge base never fits.",
      Body: () => (<><p>A support handbook, a codebase, a year of docs: none of it fits in a context window, and stuffing in what does fit is wasteful and slow. The move is to <b>not hold it at all</b>.</p><p>Instead, keep the knowledge outside the model, build a searchable index, and at each question fetch only the slice you need. That's <b>retrieval-augmented generation</b> — RAG.</p></>),
      Diagram: RagWhy, wide: true, caption: "A large corpus is indexed once; only the relevant slice ever enters the window." },
    { eyebrow: "STEP 02 · RETRIEVAL & RAG", title: "First, cut it into chunks", navTitle: "Chunking",
      Body: () => (<><p>You can't index a whole document as one blob — retrieval works on pieces. So before anything else, each document is <b>split into chunks</b>: short passages that get indexed and fetched on their own.</p><p>Chunk size is a quiet but consequential dial. Drag it and watch where the boundaries land.</p></>),
      Diagram: RagChunk, caption: "One document, sliced into chunks. Chunk size decides what stays together and what gets severed." },
    { eyebrow: "STEP 03 · RETRIEVAL & RAG", title: "Retrieve, then read", navTitle: "Retrieve-then-read",
      Body: () => (<><p>Now the loop itself. The question is embedded into the same vector space as the chunks, the <b>closest</b> ones are pulled back, and only those join the window before the model answers.</p><p>Pick a question and watch the nearest chunks light up and flow into the window.</p></>),
      Diagram: CtxRag, caption: "The query embeds into vector space; the nearest chunks by similarity are read into the window." },
    { eyebrow: "STEP 04 · RETRIEVAL & RAG", title: "Getting it right", navTitle: "Getting it right",
      Body: () => (<><p>Retrieval that <i>runs</i> isn't retrieval that <i>helps</i>. Three dials decide quality: how many chunks you take (<b>top-k</b>), how <b>relevant</b> they actually are, and where you <b>place</b> them once assembled.</p><p>Raise top-k past the genuinely useful chunks and you trade precision for noise. Find the sweet spot.</p></>),
      Diagram: RagTopK, caption: "Past the relevant few, each extra chunk is noise — and placement decides what the model even notices." },
  ],
};

Object.assign(window, { RAG_CH });
