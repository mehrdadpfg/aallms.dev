/* aallms — chapter · Graph retrieval
   When the answer lives across linked facts, not in any single chunk. A small
   knowledge graph, a multi-hop GraphRAG traversal, and when a graph earns its
   keep next to (or alongside) vector search. Globals: React, Icon, DeepDoc,
   nextOf, makeRefs. Seed lifted: GraphSeed + BV_NODES/BV_EDGES/BV_HOPS.
   Exports: GRAPH_CH. */

const { Cite, Footnotes } = makeRefs(["arxiv-2603-05344", "arxiv-2602-08316"]);

/* ====================================== shared graph data (lifted seed) ==== */
const GR_NODES = [
  { id: "n2", label: "Customer", x: 50, y: 18 },
  { id: "n1", label: "Order #4471", x: 22, y: 30 },
  { id: "n3", label: "Refund rule", x: 78, y: 38 },
  { id: "n4", label: "Policy doc", x: 64, y: 76 },
  { id: "n5", label: "Payment", x: 30, y: 72 },
];
const GR_EDGES = [
  ["n2", "n1", "placed"],
  ["n1", "n3", "governed by"],
  ["n3", "n4", "defined in"],
  ["n1", "n5", "paid via"],
];
const GR_HOPS = ["n2", "n1", "n3"];
/* the answer each hop contributes, assembled as the path lights up */
const GR_FRAGMENTS = {
  n2: "Dana is the customer who",
  n1: "placed order #4471,",
  n3: "which falls under the 30-day refund rule — so yes, it qualifies.",
};

function nodeById(id) { return GR_NODES.find(n => n.id === id); }

/* ====================================== 1 · WHEN VECTORS AREN'T ENOUGH ===== */
const GR_FACTS = [
  { id: "f1", text: "Dana placed order #4471.", tag: "orders" },
  { id: "f2", text: "Order #4471 is governed by the 30-day refund rule.", tag: "rules" },
  { id: "f3", text: "The 30-day refund rule allows returns within a month.", tag: "policy" },
];
function GrMultiHop() {
  const [revealed, setRevealed] = React.useState(0);
  const q = "Can Dana still get a refund on her order?";
  const done = revealed >= GR_FACTS.length;
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="gr-ask">
          <span className="gr-ask-icon"><Icon name="help-circle" size={14} stroke={2.2} /></span>
          <span className="gr-ask-q">{q}</span>
        </div>
        <p className="gr-note">A vector search rewards chunks that <i>look like</i> the question. But no
          single chunk holds the answer — it's strung across three separate facts:</p>
        <div className="gr-facts">
          {GR_FACTS.map((f, i) => {
            const on = i < revealed;
            return (
              <div key={f.id} className={"gr-fact" + (on ? " is-on" : "")}>
                <span className="gr-fact-n">{i + 1}</span>
                <span className="gr-fact-t">{f.text}</span>
                <span className="gr-fact-tag">{f.tag}</span>
              </div>
            );
          })}
        </div>
        <div className={"gr-verdict" + (done ? " is-on" : "")}>
          {done
            ? <><Icon name="check-circle" size={14} stroke={2.2} />Chain complete — only by linking all three do you reach the answer.</>
            : <><Icon name="link" size={14} stroke={2.2} />Reveal the facts one by one. Notice none answers on its own.</>}
        </div>
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={() => setRevealed(r => Math.min(GR_FACTS.length, r + 1))} disabled={done}>
          <Icon name="plus" size={14} stroke={2.2} />Reveal a fact
        </button>
        <button className="dg-btn" onClick={() => setRevealed(0)}><Icon name="rotate-ccw" size={14} stroke={2.2} />Reset</button>
        <span className="dg-readout">{revealed} / {GR_FACTS.length} facts</span>
      </div>
      <p className="dg-read">This is a <b>multi-hop</b> question. The answer isn't <i>in</i> any chunk; it lives in the
        <b> connections between</b> them. Similarity search<Cite id="arxiv-2602-08316" /> can surface each fact, but it has no
        notion of <i>follow this link, then that one</i> — so it rarely lines them up in order.</p>
    </div>
  );
}

/* ====================================== 2 · THE KNOWLEDGE GRAPH ============ */
function GrGraph() {
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="bv-stage">
          <div className="bv-space">
            <svg className="bv-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {GR_EDGES.map(([a, b], i) => {
                const na = nodeById(a), nb = nodeById(b);
                return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke="var(--border-strong)" strokeWidth="0.45" />;
              })}
            </svg>
            {GR_EDGES.map(([a, b, rel], i) => {
              const na = nodeById(a), nb = nodeById(b);
              return (
                <span key={i} className="gr-edge-lab" style={{ left: (na.x + nb.x) / 2 + "%", top: (na.y + nb.y) / 2 + "%" }}>{rel}</span>
              );
            })}
            {GR_NODES.map(n => (
              <div key={n.id} className="bv-node" style={{ left: n.x + "%", top: n.y + "%" }}>{n.label}</div>
            ))}
          </div>
        </div>
      </div>
      <p className="dg-read">A <b>knowledge graph</b> stores facts as structure: <b>entities</b> become nodes
        (<i>Customer</i>, <i>Order&nbsp;#4471</i>, <i>Refund rule</i>) and <b>relations</b> become labelled edges
        between them (<i>placed</i>, <i>governed by</i>). Where a vector store sees a flat pile of text, the graph
        keeps the wiring — and that wiring is exactly what a multi-hop question needs to walk.</p>
    </div>
  );
}

/* ====================================== 3 · GRAPHRAG TRAVERSAL ============= */
function GrTraversal() {
  const [step, setStep] = React.useState(0); // 0 = none lit, up to GR_HOPS.length
  const litCount = step;
  const litSet = new Set(GR_HOPS.slice(0, litCount));
  const current = litCount > 0 ? GR_HOPS[litCount - 1] : null;
  const done = step >= GR_HOPS.length;
  const answer = GR_HOPS.slice(0, litCount).map(id => GR_FRAGMENTS[id]).join(" ");
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="gr-stage">
          <div className="bv-space">
            <svg className="bv-edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {GR_EDGES.map(([a, b], i) => {
                const na = nodeById(a), nb = nodeById(b);
                const ia = GR_HOPS.indexOf(a), ib = GR_HOPS.indexOf(b);
                const onPath = ia >= 0 && ib >= 0 && Math.abs(ia - ib) === 1;
                const lit = onPath && litSet.has(a) && litSet.has(b);
                return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                  stroke={lit ? "var(--accent)" : "var(--border-strong)"} strokeWidth={lit ? "0.8" : "0.4"}
                  style={{ transition: "stroke .3s" }} />;
              })}
            </svg>
            {GR_NODES.map(n => {
              const hop = GR_HOPS.indexOf(n.id);
              const lit = litSet.has(n.id);
              const isCur = n.id === current;
              return (
                <div key={n.id} className={"bv-node" + (lit ? " is-hop" : "") + (isCur ? " is-current" : "")} style={{ left: n.x + "%", top: n.y + "%" }}>
                  {hop >= 0 && lit ? <span className="bv-hop">{hop + 1}</span> : null}{n.label}
                </div>
              );
            })}
          </div>
          <div className="gr-answer">
            <p className="gr-answer-h"><Icon name="sparkles" size={12} stroke={2} />Answer, assembled from the path</p>
            <div className="gr-answer-body">
              {litCount === 0
                ? <span className="gr-answer-empty">Run the query to walk the graph, hop by hop.</span>
                : GR_HOPS.slice(0, litCount).map((id, i) => (
                    <span key={id} className="gr-frag" style={{ animationDelay: (i * 40) + "ms" }}>{GR_FRAGMENTS[id]} </span>
                  ))}
            </div>
            {done ? <div className="gr-answer-done"><Icon name="check" size={12} stroke={2.4} />3 hops · Customer → Order&nbsp;#4471 → Refund rule</div> : null}
          </div>
        </div>
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={() => setStep(s => Math.min(GR_HOPS.length, s + 1))} disabled={done}>
          <Icon name={litCount === 0 ? "play" : "chevron-right"} size={14} stroke={2.2} />{litCount === 0 ? "Run query" : "Step"}
        </button>
        <button className="dg-btn" onClick={() => setStep(0)}><Icon name="rotate-ccw" size={14} stroke={2.2} />Reset</button>
        <span className="dg-readout">hop {litCount} / {GR_HOPS.length}</span>
      </div>
      <p className="dg-read">This is <b>GraphRAG</b><Cite id="arxiv-2603-05344" /> traversal. Start at the entity the question
        names, then <b>hop</b> along relations — <i>Customer</i> → <i>Order&nbsp;#4471</i> → <i>Refund rule</i> — gathering one fact
        at each step. The running answer is <b>assembled from the hops</b>: each node hands over its piece, and the path itself
        is the reasoning.</p>
    </div>
  );
}

/* ====================================== 4 · WHEN TO REACH FOR A GRAPH ====== */
const GR_TRADE = [
  { id: "precision", label: "Precision", icon: "crosshair", vec: 55, graph: 92, note: "exact relations, no fuzzy near-misses" },
  { id: "multihop", label: "Multi-hop reasoning", icon: "git-merge", vec: 30, graph: 95, note: "follow links across several facts" },
  { id: "build", label: "Build & maintenance", icon: "wrench", vec: 80, graph: 38, note: "graph needs extraction & curation" },
  { id: "fuzzy", label: "Fuzzy / open-ended recall", icon: "search", vec: 90, graph: 50, note: "vectors shine on “sounds like”" },
];
function GrTradeoffs() {
  const [hybrid, setHybrid] = React.useState(false);
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="gr-trade-head">
          <span className="gr-trade-leg"><span className="gr-swatch gr-swatch--vec" />Vector search</span>
          <span className="gr-trade-leg"><span className="gr-swatch gr-swatch--graph" />Graph retrieval</span>
        </div>
        <div className="gr-trade">
          {GR_TRADE.map(t => (
            <div key={t.id} className="gr-trow">
              <div className="gr-trow-head"><Icon name={t.icon} size={13} stroke={2} /><span className="gr-trow-lab">{t.label}</span></div>
              <div className="gr-bars">
                <div className="gr-bar"><span className="gr-bar-fill gr-bar-fill--vec" style={{ width: t.vec + "%" }} /></div>
                <div className="gr-bar"><span className="gr-bar-fill gr-bar-fill--graph" style={{ width: t.graph + "%" }} /></div>
              </div>
              <span className="gr-trow-note">{t.note}</span>
            </div>
          ))}
        </div>
        {hybrid ? (
          <div className="gr-hybrid">
            <Icon name="combine" size={14} stroke={2.2} />
            <span><b>Hybrid</b> — vectors cast a wide net to find the entry points, then the graph walks the
              precise links from there. You get fuzzy recall <i>and</i> multi-hop precision.</span>
          </div>
        ) : null}
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={() => setHybrid(h => !h)}>
          <Icon name={hybrid ? "eye-off" : "combine"} size={14} stroke={2.2} />{hybrid ? "Hide hybrid" : "Show the hybrid"}
        </button>
      </div>
      <p className="dg-read">No free lunch. Graphs buy <b>precision</b> and <b>multi-hop</b> reasoning, but you pay to build and
        maintain the schema — entities and relations don't extract themselves. Vectors stay cheap and forgiving for
        open-ended recall.<Cite id="arxiv-2602-08316" /> In practice the two are often <b>combined</b>: a hybrid system retrieves
        with vectors, then walks the graph to nail the links.<Cite id="arxiv-2603-05344" /></p>
      <Footnotes />
    </div>
  );
}

/* ====================================== CHAPTER CONFIG ===================== */
const GRAPH_CH = {
  id: "graph-retrieval", title: "Graph retrieval", nextChapter: nextOf("graph-retrieval"),
  steps: [
    { eyebrow: "STEP 01 · GRAPH RETRIEVAL", title: "When vectors aren't enough", navTitle: "Where vectors stall",
      lead: "Some questions can't be answered by any single chunk — the answer lives in the links between several facts.",
      Body: () => (<><p>Vector retrieval is a similarity engine: it finds the passages that most <i>resemble</i> your
        question and hands them over. That works beautifully when the answer sits inside one passage. But ask
        something whose answer is <b>spread across linked facts</b> — Dana's order, the rule that governs it, what
        that rule allows — and there's no single chunk to retrieve.</p><p>Walk the example below and watch the gap open up.</p></>),
      Diagram: GrMultiHop, caption: "A multi-hop question: no single fact answers it; the answer is the chain that links all three." },
    { eyebrow: "STEP 02 · GRAPH RETRIEVAL", title: "The knowledge graph", navTitle: "The knowledge graph",
      Body: () => (<><p>If the answer lives in the connections, store the connections. A <b>knowledge graph</b> turns
        your facts into a network: <b>entities</b> are nodes, <b>relations</b> are the labelled edges between them.</p>
        <p>Here's the same customer-support world as a graph. Trace an edge and you're reading a fact — <i>Customer</i>
        <b> placed</b> <i>Order&nbsp;#4471</i>, which is <b>governed by</b> the <i>Refund rule</i>.</p></>),
      Diagram: GrGraph, caption: "Entities as nodes, relations as labelled edges. The structure is the knowledge." },
    { eyebrow: "STEP 03 · GRAPH RETRIEVAL", title: "GraphRAG traversal", navTitle: "Traversal",
      Body: () => (<><p>With the wiring in place, answering becomes a <b>walk</b>. Anchor on the entity the question
        names, then hop along relations, collecting a fact at every node. This is <b>GraphRAG</b>: retrieval as
        graph traversal rather than nearest-neighbour lookup.</p><p>Run the query and step through the path — the
        answer is built up one hop at a time.</p></>),
      Diagram: GrTraversal, caption: "Run query, then step the hop path; the answer is assembled node by node as the path lights up." },
    { eyebrow: "STEP 04 · GRAPH RETRIEVAL", title: "When to reach for a graph", navTitle: "Graph vs vectors",
      Body: () => (<><p>A graph isn't a free upgrade. It pays off when you need <b>precision</b> and <b>multi-hop</b>
        reasoning over structured relationships — and it costs you the work of <b>building and maintaining</b> that
        structure. Vectors remain the better tool for fuzzy, open-ended recall.</p><p>So the honest answer is
        usually <b>both</b>: vectors to find the door, the graph to walk the hallway behind it.</p></>),
      Diagram: GrTradeoffs, caption: "Precision and multi-hop favour the graph; cheap fuzzy recall favours vectors — hybrid systems use each for what it's best at." },
  ],
};

Object.assign(window, { GRAPH_CH });
