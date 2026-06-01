/* aallms — chapter · Vectorless retrieval (PageIndex-style)
   Retrieval without an embedding index: the document keeps its own structure
   and the model reasons its way down a table-of-contents tree to the right
   section. Globals: React, Icon, StepReader, DeepDoc, nextOf, makeRefs.
   Seed lifted & expanded from _seeds.jsx (TreeSeed / BV_TREE). Exports: VECTORLESS_CH. */

const { Cite, Footnotes } = makeRefs(["openreview-x0alNh", "arxiv-2603-05344"]);

/* =================================================== 1 · EMBEDDING TROUBLE = */
/* Three queries, each landing on a chunk that's near in vector space but wrong
   in meaning — the failure modes of a pure similarity index. */
const VL_DRIFT = [
  { id: "java", q: "How do I brew java?",
    wrong: "Java: the JVM language", wRule: "rides the word, not the sense",
    right: "Coffee: pour-over brewing", tag: "semantic drift",
    note: "“Java” the language sits right next to “java” the coffee. The vector can't tell which sense you meant." },
  { id: "apple", q: "Is the apple ripe yet?",
    wrong: "Apple Inc. quarterly results", wRule: "brand beats the fruit",
    right: "Orchard: picking ripe fruit", tag: "opaque similarity",
    note: "A 0.81 cosine score looks confident — but you can't see why it scored high, or that it locked onto the company." },
  { id: "split", q: "What's the return window?",
    wrong: "…30 days. ¶ Returns must be", wRule: "answer cut by a chunk edge",
    right: "Returns: full 30-day window", tag: "arbitrary chunks",
    note: "The sentence that answers you was sliced across two fixed-size chunks, so neither one retrieves cleanly." },
];
function VlDrift() {
  const [id, setId] = React.useState("java");
  const d = VL_DRIFT.find(x => x.id === id);
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-5)" }}>
        {VL_DRIFT.map(x => (
          <button key={x.id} className={id === x.id ? "on" : ""} onClick={() => setId(x.id)}>{x.tag}</button>
        ))}
      </div>
      <div className="fp-plate rd-plate">
        <div className="vd-query"><Icon name="search" size={13} stroke={2.2} />{d.q}</div>
        <div className="vd-rail" aria-hidden="true"><span className="vd-rail-l">nearest in vector space</span></div>
        <div className="vd-pair">
          <div className="vd-card is-wrong">
            <span className="vd-card-h"><Icon name="x" size={12} stroke={2.6} />top match</span>
            <span className="vd-card-body">{d.wrong}</span>
            <span className="vd-card-why">{d.wRule}</span>
          </div>
          <div className="vd-card is-right">
            <span className="vd-card-h"><Icon name="check" size={12} stroke={2.6} />what you meant</span>
            <span className="vd-card-body">{d.right}</span>
            <span className="vd-card-why">never surfaced</span>
          </div>
        </div>
        <p className="vd-note">{d.note}</p>
      </div>
      <p className="dg-read">An embedding squeezes a chunk down to a point in space, and retrieval just grabs the <b>nearest</b> points. That's fast and fuzzy — but "near" isn't "right". Step through three ways it drifts: senses collide, scores stay <b>opaque</b>, and the answer gets cut at an <b>arbitrary chunk boundary</b>. Sometimes you don't want a vector index at all.</p>
    </div>
  );
}

/* =================================================== 2 · PAGEINDEX TREE ==== */
/* Expanded from TreeSeed: a real table-of-contents the model DESCENDS, choosing
   one branch per level with a short spoken reason, until it lands on a leaf to read. */
const VL_TREE = [
  { id: "root",     label: "Support Handbook",          depth: 0, parent: null,     leaf: false },
  { id: "billing",  label: "1 · Billing & payments",    depth: 1, parent: "root",   leaf: false },
  { id: "refunds",  label: "1.2 · Refunds & returns",   depth: 2, parent: "billing",leaf: true,
    body: "Items may be returned within a full 30-day window from delivery for a complete refund." },
  { id: "invoices", label: "1.1 · Invoices",            depth: 2, parent: "billing",leaf: true,
    body: "Invoices are issued monthly and emailed to the account owner." },
  { id: "accounts", label: "2 · Accounts & security",   depth: 1, parent: "root",   leaf: false },
  { id: "reset",    label: "2.1 · Reset your password", depth: 2, parent: "accounts",leaf: true,
    body: "Use the “Forgot password” link to receive a one-time reset email." },
  { id: "shipping", label: "3 · Shipping",              depth: 1, parent: "root",   leaf: false },
];
/* The reasoned descent toward "What is the return window?" — one pick per level. */
const VL_PATH = [
  { node: "root",    reason: "Start at the table of contents. The question is about getting money back after a purchase." },
  { node: "billing", reason: "“Refund” is money, not login or delivery — open Billing & payments." },
  { node: "refunds", reason: "Inside Billing, Refunds & returns is the exact match. Read here." },
];
function VlTree() {
  const [step, setStep] = React.useState(0);
  const cur = VL_PATH[step];
  const reached = VL_PATH.slice(0, step + 1).map(p => p.node);     // nodes already chosen
  const here = cur.node;
  const landed = step === VL_PATH.length - 1;
  /* a node is visible if it's on/under an already-opened parent (or a top-level child of an opened node) */
  const opened = new Set(reached);
  const visible = VL_TREE.filter(t =>
    t.depth === 0 || opened.has(t.parent) || (t.parent && reached.includes(t.parent))
  );
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="vt-grid">
          <div className="bv-tree vt-tree">
            {visible.map(t => {
              const onPath = reached.includes(t.id);
              const isHere = t.id === here;
              const icon = t.depth === 0 ? "book" : t.leaf ? (isHere && landed ? "file-text" : "file") : (onPath ? "folder-open" : "folder");
              return (
                <div key={t.id}
                  className={"bv-branch vt-branch" + (onPath ? " vt-on" : "") + (isHere ? " is-hit" : "")}
                  style={{ marginLeft: t.depth * 22 }}>
                  <Icon name={icon} size={13} stroke={2} />
                  {t.label}
                  {isHere && landed ? <span className="bv-here">read here</span> : null}
                  {isHere && !landed ? <span className="vt-cursor"><Icon name="corner-down-right" size={12} stroke={2.4} /></span> : null}
                </div>
              );
            })}
            <div className="bv-cap">descend a table-of-contents · reason over structure, no embeddings</div>
          </div>
          <div className="vt-side">
            <p className="vt-side-h"><Icon name="brain" size={13} stroke={2} />reasoning · level {step + 1}</p>
            <div className="vt-reason">{cur.reason}</div>
            {landed ? (
              <div className="vt-read">
                <span className="vt-read-h"><Icon name="file-text" size={12} stroke={2.2} />section text</span>
                {VL_TREE.find(t => t.id === here).body}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}><Icon name="arrow-left" size={14} stroke={2.2} />Up a level</button>
        <button className="dg-btn" onClick={() => setStep(s => Math.min(VL_PATH.length - 1, s + 1))} disabled={landed}><Icon name="arrow-down" size={14} stroke={2.2} />Descend</button>
        <button className="dg-btn" onClick={() => setStep(0)}><Icon name="rotate-ccw" size={14} stroke={2.2} />Reset</button>
        <span className="dg-readout">{landed ? "arrived" : "level " + (step + 1) + " / " + VL_PATH.length}</span>
      </div>
      <p className="dg-read">No vectors here. The document carries its own <b>structure</b> — a table-of-contents tree — and the model <b>navigates</b> it the way you'd flip through a handbook: read the headings, reason about which branch fits, open it, repeat.<Cite id="openreview-x0alNh" /> Descend level by level and watch each <b>reasoning</b> line justify the next turn, until it lands on the section worth reading.</p>
    </div>
  );
}

/* =================================================== 3 · VECTORS vs LESS === */
const VL_CMP = [
  { k: "Index", emb: "Embeddings in a vector DB", less: "The document's own TOC tree" },
  { k: "Match by", emb: "Nearest point — fuzzy, semantic", less: "Reasoned navigation — structural" },
  { k: "Strength", emb: "Fast over huge, messy corpora", less: "Interpretable, no chunk seams" },
  { k: "Why it chose", emb: "Opaque cosine score", less: "A readable chain of reasons" },
  { k: "Needs", emb: "An embedding model + store", less: "Clean, well-structured headings" },
  { k: "Falls down when", emb: "Senses collide; answers split", less: "Structure is flat or missing" },
];
const VL_WINS = [
  { side: "vec", icon: "zap", title: "Vectors win", body: "Large, loosely-organized text — wikis, chat logs, scraped pages — where there's no clean outline and fuzzy semantic recall is exactly what you need." },
  { side: "less", icon: "list-tree", title: "Vectorless wins", body: "Well-structured documents — manuals, contracts, filings, books — where headings already carve the meaning and you want an auditable reason for every hop.<Cite/>" },
  { side: "both", icon: "git-merge", title: "Hybrids win", body: "Route by reasoning to the right chapter, then embed within it — or retrieve fuzzily, then re-rank by structure. Most real systems blend the two." },
];
function VlCompare() {
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="vc-table">
          <div className="vc-row vc-head">
            <span className="vc-k" />
            <span className="vc-cell vc-emb"><Icon name="boxes" size={13} stroke={2} />Embeddings</span>
            <span className="vc-cell vc-less"><Icon name="list-tree" size={13} stroke={2} />Vectorless tree</span>
          </div>
          {VL_CMP.map((r, i) => (
            <div key={i} className="vc-row">
              <span className="vc-k">{r.k}</span>
              <span className="vc-cell vc-emb">{r.emb}</span>
              <span className="vc-cell vc-less">{r.less}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="vw-grid">
        {VL_WINS.map(w => (
          <div key={w.side} className={"vw-card vw-" + w.side}>
            <p className="vw-h"><Icon name={w.icon} size={15} stroke={2} />{w.title}</p>
            <p className="vw-b">
              {w.side === "less"
                ? <>Well-structured documents — manuals, contracts, filings, books — where headings already carve the meaning and you want an auditable reason for every hop.<Cite id="arxiv-2603-05344" /></>
                : w.body}
            </p>
          </div>
        ))}
      </div>
      <p className="dg-read">Neither approach is the winner — they trade the same coin from opposite sides. Embeddings buy <b>speed and fuzzy reach</b> over messy text at the cost of interpretability; a vectorless tree buys <b>structure and a readable rationale</b> at the cost of needing real structure to begin with. Pick by the shape of your documents — or, as most systems do, <b>blend</b> them.</p>
      <Footnotes />
    </div>
  );
}

/* ================================================== CHAPTER CONFIG ========= */
const VECTORLESS_CH = {
  id: "vectorless", title: "Vectorless retrieval", nextChapter: nextOf("vectorless"),
  steps: [
    { eyebrow: "STEP 01 · VECTORLESS RETRIEVAL", title: "The trouble with embeddings", navTitle: "Trouble with embeddings",
      lead: "Vector search is the default way to retrieve — and for messy text it's wonderful. But it pays in ways that aren't always worth it.",
      Body: () => (<><p>Retrieval usually means: embed every chunk into a point in space, embed the question, grab the <b>nearest</b> neighbors. It's quick and forgiving. It's also fuzzy in ways you can't see — <b>semantic drift</b> where word senses collide, an <b>opaque</b> similarity score you can't interrogate, and answers sliced at <b>arbitrary chunk boundaries</b>.</p><p>Step through the three failure modes below. They're a hint that, sometimes, you don't want a vector index at all.</p></>),
      Diagram: VlDrift, caption: "The same query lands on a chunk that's near in vector space but wrong in meaning — three ways a similarity index drifts." },
    { eyebrow: "STEP 02 · VECTORLESS RETRIEVAL", title: "PageIndex: let the document lead", navTitle: "PageIndex",
      lead: "Drop the embeddings. Keep the structure the document already has, and let the model reason its way to the right section.",
      Body: () => (<><p>A handbook, a contract, a filing — these already come carved into chapters and sections. <b>PageIndex</b> keeps that as a <b>table-of-contents tree</b> and asks the model to <b>navigate</b> it: read the headings, reason about which branch fits the question, open it, and repeat until it reaches a leaf worth reading.<Cite id="openreview-x0alNh" /> No vectors, no index to build — just structure and reasoning.</p><p>Descend the tree below. Each turn comes with a short line explaining <i>why</i> that branch.</p></>),
      Diagram: VlTree, wide: true, caption: "The model descends the table-of-contents one level at a time, justifying each branch, until it lands on the section to read." },
    { eyebrow: "STEP 03 · VECTORLESS RETRIEVAL", title: "Vectors vs vectorless", navTitle: "Vectors vs vectorless",
      lead: "Two ways to find the right passage, pulling against each other. Which one wins depends on the shape of your documents.",
      Body: () => (<><p>Side by side, the tradeoff is clean. Embeddings are <b>fast, fuzzy, and semantic</b> — built for sprawling, loosely-organized text. A vectorless tree is <b>structural, interpretable, and reasoning-driven</b> — but it leans entirely on the document having <b>good structure</b> to navigate.<Cite id="arxiv-2603-05344" /></p><p>Compare them below, then see when each wins — and why most real systems reach for a <b>hybrid</b>.</p></>),
      Diagram: VlCompare, wide: true, caption: "Embeddings trade interpretability for fuzzy reach; a vectorless tree trades flexibility for structure and a readable rationale." },
  ],
};

Object.assign(window, { VECTORLESS_CH });
