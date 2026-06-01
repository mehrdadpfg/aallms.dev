/* aallms — chapter · Context engineering
   The window, what fills it, position effects, and compaction.
   Retrieval, vector/graph/vectorless search, and memory now live in their own
   chapters in this section. Globals: React, Icon, DeepDoc, ContextWindow (kit),
   nextOf, makeRefs. Exports: CONTEXTENG. */

const { Cite, Footnotes } = makeRefs(["cc-context-window", "anthropic-context-eng", "logrocket-context", "compression-strats"]);

/* =================================================== 2 · BUDGET =========== */
const CTX_PARTS = [
  { id: "system", label: "System prompt", tok: 320, col: "var(--concept-query)" },
  { id: "tools", label: "Tool definitions", tok: 1400, col: "var(--concept-key)" },
  { id: "docs", label: "Retrieved documents", tok: 4200, col: "var(--concept-value)" },
  { id: "history", label: "Conversation history", tok: 2800, col: "var(--concept-output)" },
  { id: "query", label: "User's question", tok: 180, col: "var(--accent)", locked: true },
];
const CTX_LIMIT = 8192;
function CtxBudget() {
  const [on, setOn] = React.useState({ system: true, tools: true, docs: true, history: true, query: true });
  const total = CTX_PARTS.reduce((s, p) => s + (on[p.id] ? p.tok : 0), 0);
  const over = total > CTX_LIMIT;
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="ctxb-head"><span>Token budget</span><b className={over ? "is-over" : ""}>{total.toLocaleString()} / {CTX_LIMIT.toLocaleString()}</b></div>
        <div className="ctxb-bar">
          {CTX_PARTS.map(p => on[p.id] ? <div key={p.id} className="ctxb-seg" style={{ flexGrow: p.tok, background: p.col }} title={p.label + " · " + p.tok} /> : null)}
          {over ? <div className="ctxb-overflow" title="over the limit">overflow</div> : null}
        </div>
        <div className="ctxb-legend">
          {CTX_PARTS.map(p => (
            <button key={p.id} className={"ctxb-chip" + (on[p.id] ? " on" : "") + (p.locked ? " locked" : "")}
              onClick={() => !p.locked && setOn(o => ({ ...o, [p.id]: !o[p.id] }))}>
              <span className="ctxb-dot" style={{ background: on[p.id] ? p.col : "var(--border-strong)" }} />{p.label}<span className="ctxb-tok">{p.tok}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="dg-read">The "prompt" the model sees is <b>assembled</b> from many parts, all sharing one budget. Toggle pieces on and off. Retrieved documents and history are the greedy ones — <b>context engineering</b> is deciding what's worth its slot, and what to leave out.</p>
    </div>
  );
}

/* =================================================== 3 · LOST IN MIDDLE === */
function CtxLostMiddle() {
  const [pos, setPos] = React.useState(50);
  const p = pos / 100;
  const recall = Math.round((0.5 + 0.5 * Math.abs(2 * p - 1)) * 100); // U-shape
  const ticks = 40; const needle = Math.round(p * (ticks - 1));
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="lm-strip">
          {Array.from({ length: ticks }).map((_, i) => <span key={i} className={"lm-tick" + (i === needle ? " is-key" : "")} />)}
        </div>
        <div className="lm-meter">
          <span className="lm-meter-lab">recall of the buried fact</span>
          <div className="lm-meter-track"><div className="lm-meter-fill" style={{ width: recall + "%", background: recall > 75 ? "var(--ok-500)" : recall > 55 ? "var(--warn-500)" : "var(--err-500)" }} /></div>
          <b className="lm-meter-pct">{recall}%</b>
        </div>
      </div>
      <div className="dg-slider" style={{ marginTop: "var(--sp-5)" }}>
        <label>Fact position</label>
        <input type="range" min="0" max="100" step="1" value={pos} onChange={e => setPos(parseInt(e.target.value))} />
        <span className="dg-readout">{pos < 18 ? "start" : pos > 82 ? "end" : "middle"}</span>
      </div>
      <p className="dg-read">A model attends most strongly to the <b>beginning</b> and <b>end</b> of its context. Slide a key fact into the middle and watch recall sag — the "<b>lost in the middle</b>" effect. Where you place information matters as much as whether it's there.</p>
    </div>
  );
}

/* =================================================== 4 · COMPACTION ======= */
function CtxCompact() {
  const [turns, setTurns] = React.useState(4);
  const [summarized, setSummarized] = React.useState(0); // turns folded into the summary
  const perTurn = 700, summaryTok = 600;
  const recent = turns - summarized;                     // turns still kept verbatim
  const compacted = summarized > 0;
  const total = (compacted ? summaryTok : 0) + recent * perTurn;
  const pct = Math.min(100, total / CTX_LIMIT * 100);
  const canCompact = recent >= 3;                        // worth folding only with spare recent turns
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="cmp-stream">
          {compacted ? <span className="cmp-summary"><Icon name="layers" size={13} stroke={2} />summary of {summarized} earlier turns</span> : null}
          {Array.from({ length: recent }).map((_, i) => <span key={i} className="cmp-turn">turn {summarized + i + 1}</span>)}
        </div>
        <div className="ctxb-head" style={{ marginTop: "var(--sp-4)" }}><span>used</span><b className={pct > 95 ? "is-over" : ""}>{total.toLocaleString()} tok</b></div>
        <div className="ctxb-bar"><div className="ctxb-seg" style={{ flexGrow: 1, background: compacted ? "var(--concept-key)" : "var(--concept-output)", maxWidth: pct + "%" }} /></div>
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={() => setTurns(t => t + 1)}><Icon name="plus" size={14} stroke={2.2} />Add a turn</button>
        <button className="dg-btn" onClick={() => setSummarized(turns - 2)} disabled={!canCompact}><Icon name="minimize-2" size={14} stroke={2.2} />Compact</button>
        <button className="dg-btn" onClick={() => { setTurns(4); setSummarized(0); }}><Icon name="rotate-ccw" size={14} stroke={2.2} />Reset</button>
      </div>
      <p className="dg-read">Conversations only grow, but the window doesn't. <b>Compaction</b> replaces old turns with a short summary — keeping the gist while freeing space for what's next. Add turns until it's heavy, then compact and watch the budget drop.</p>
      <Footnotes />
    </div>
  );
}

/* ============================================ APPENDIX · compaction ======== */
/* A tiny three-tag strip naming, for one method: how it treats data
   (drop / rewrite in place / move out), how much fidelity it keeps, and how
   much space it frees. Tokens only — safe in dark mode. */
const CMP_FATE = {
  drop:    { lab: "drops it",        ic: "trash-2",   cls: "is-drop" },
  inplace: { lab: "rewrites in place", ic: "minimize-2", cls: "is-inplace" },
  out:     { lab: "moves out, recalls", ic: "external-link", cls: "is-out" },
  keep:    { lab: "keeps in context", ic: "check",     cls: "is-keep" },
};
function CmpTags({ fate, fidelity, space, cost }) {
  const f = CMP_FATE[fate];
  return (
    <div className="cmp-sum">
      <span className={"cmp-fate " + f.cls}><Icon name={f.ic} size={12} stroke={2.2} />{f.lab}</span>
      <span className="cmp-sum-stats">
        <span className="cmp-stat"><span className="cmp-stat-k">fidelity</span><span className="cmp-stat-v">{fidelity}</span></span>
        <span className="cmp-stat"><span className="cmp-stat-k">space saved</span><span className="cmp-stat-v">{space}</span></span>
        <span className="cmp-stat"><span className="cmp-stat-k">cost</span><span className="cmp-stat-v">{cost}</span></span>
      </span>
    </div>
  );
}

/* The comparison matrix — every method on the two axes that matter:
   what it preserves (fidelity) vs space freed, plus where the data ends up. */
const CMP_ROWS = [
  { m: "Truncation / sliding window", fate: "drop",    fid: 1, spc: 5, note: "early setup lost outright" },
  { m: "Tool-result eviction",        fate: "drop",    fid: 4, spc: 4, note: "drops bulky outputs, keeps reasoning" },
  { m: "Summarization",               fate: "inplace", fid: 3, spc: 4, note: "gist survives, details blur" },
  { m: "Hierarchical summarization",  fate: "inplace", fid: 2, spc: 5, note: "coherent for hours, more blur" },
  { m: "Retrieval offload (RAG)",     fate: "out",     fid: 5, spc: 5, note: "full text recallable on demand" },
  { m: "Structured memory",           fate: "out",     fid: 5, spc: 4, note: "durable, curated; most work" },
  { m: "Importance scoring",          fate: "drop",    fid: 3, spc: 3, note: "keep signal, drop filler" },
  { m: "Semantic dedup",              fate: "drop",    fid: 5, spc: 2, note: "only removes redundancy" },
];
function Pips({ n, col }) {
  return (<span className="cmp-pips" title={n + " / 5"}>{Array.from({ length: 5 }).map((_, i) =>
    <span key={i} className={"cmp-pip" + (i < n ? " on" : "")} style={i < n ? { background: col } : null} />)}</span>);
}
function CmpMatrix() {
  return (
    <div className="rd-prose">
      <p>The eight methods aren't rivals so much as points on a map. Two questions place any of them: <b>how much does it preserve</b> (fidelity), and <b>where does the data end up</b> — does it stay in-context, get dropped, or move out to be recalled later?</p>
      <div className="cmp-axes">
        <span className="cmp-axis-fate is-drop"><Icon name="trash-2" size={12} stroke={2.2} />drop — gone for good</span>
        <span className="cmp-axis-fate is-inplace"><Icon name="minimize-2" size={12} stroke={2.2} />rewrite in place — lossy, stays</span>
        <span className="cmp-axis-fate is-out"><Icon name="external-link" size={12} stroke={2.2} />move out — recall on demand</span>
      </div>
      <div className="cmp-table-wrap">
        <table className="cmp-table">
          <thead><tr><th>Method</th><th>Data fate</th><th>Preserves</th><th>Space freed</th></tr></thead>
          <tbody>
            {CMP_ROWS.map(r => {
              const f = CMP_FATE[r.fate];
              return (
                <tr key={r.m}>
                  <th scope="row"><span className="cmp-m">{r.m}</span><span className="cmp-m-note">{r.note}</span></th>
                  <td><span className={"cmp-fate " + f.cls}><Icon name={f.ic} size={12} stroke={2.2} />{f.lab}</span></td>
                  <td><Pips n={r.fid} col="var(--ok-500)" /></td>
                  <td><Pips n={r.spc} col="var(--accent)" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p>Read the difference plainly: <b>summarize</b> is lossy but stays in the window; <b>evict / truncate</b> drops material with no way back; <b>offload / retrieve</b> moves the full text out of the window yet keeps it recallable. The robust setups combine them — evict the bulky and redundant first, summarize what's left, and offload anything you might genuinely need again.</p>
    </div>
  );
}

function CtxDeepDoc() {
  return (
    <DeepDoc sections={[
      { id: "trunc", label: "Truncation", title: "Just drop the oldest", intro: "The simplest strategy: when full, evict the earliest tokens.", render: () => (<div className="rd-prose"><p>A <b>sliding window</b> keeps the most recent N tokens and lets the rest fall off — exactly the eviction you dragged earlier. There's no model call and no bookkeeping: the oldest tokens simply scroll out of view.</p><p><b>Preserves vs loses:</b> recent turns stay verbatim; anything said early — the original goal, a constraint set up at the start — is gone with no trace. <b>When to use:</b> open-ended chit-chat where only the recent thread matters; dangerous for tasks whose setup matters.</p><CmpTags fate="drop" fidelity="low for old turns" space="high" cost="≈ free" /></div>) },
      { id: "evict", label: "Tool-result eviction", title: "Clear the bulky tool outputs", intro: "Drop heavy raw tool results from deep history — keep the reasoning around them.", render: () => (<div className="rd-prose"><p>Agentic runs fill the window with raw tool output: full file dumps, API responses, search results. Once the agent has read and acted on them, it rarely needs the <i>raw</i> text again — only its own conclusions. <b>Eviction</b> (or "context clearing") deletes those bulky blocks from deep history while keeping the surrounding thoughts and decisions.</p><p><b>Preserves vs loses:</b> the chain of reasoning stays intact; only re-readable raw data leaves. That makes it a remarkably safe <i>first</i> step — usually the biggest space win for the least damage. <b>When to use:</b> almost always, before reaching for anything lossier.</p><CmpTags fate="drop" fidelity="high (reasoning kept)" space="high" cost="cheap (rules)" /></div>) },
      { id: "summ", label: "Summarization", title: "Compress, don't delete", intro: "Replace a span of history with a model-written summary of it.", render: () => (<div className="rd-prose"><p>Instead of dropping old turns, ask the model to <b>summarize</b> them into a compact note, then keep the note in place of the originals. The conversation's thread survives even as its detail thins.</p><p><b>Preserves vs loses:</b> the gist, the decisions, the open threads — but exact wording, numbers, and edge cases blur. A summary can also quietly drop the one detail you'll need later. <b>Cost:</b> an extra LLM call per compaction. <b>When to use:</b> long single sessions where the narrative matters more than verbatim recall.</p><CmpTags fate="inplace" fidelity="medium" space="high" cost="1 LLM call" /></div>) },
      { id: "hier", label: "Hierarchical", title: "Summaries of summaries", intro: "Recursively re-summarize, so the window stays bounded for hours.", render: () => (<div className="rd-prose"><p>One round of summarization buys time; eventually even the summaries fill the window. <b>Hierarchical</b> (recursive) summarization folds old summaries into higher-level ones — a summary of summaries — so a run can continue for hours without the window ever growing.</p><p><b>Preserves vs loses:</b> a coherent through-line at every level, but each layer compounds the blur — the distant past becomes a faint sketch. <b>Cost:</b> repeated LLM calls, periodically. <b>When to use:</b> very long-running agents and multi-hour sessions where pure summarization would itself overflow.</p><CmpTags fate="inplace" fidelity="low→medium" space="very high" cost="repeated calls" /></div>) },
      { id: "rag", label: "Retrieval (RAG)", title: "Fetch only what's needed", intro: "Don't hold everything — store it outside and pull back the relevant slice.", render: () => (<div className="rd-prose"><p>Keep the full history or knowledge base in an <b>external store</b>, embed it, and at each step <b>retrieve</b> just the few chunks relevant to the current question. The crucial difference from the methods above: nothing is destroyed — it's <i>moved out</i> of the window and recalled on demand.</p><p><b>Preserves vs loses:</b> full fidelity is recoverable, but only for what the retriever actually surfaces; a bad query can miss the right slice. The window stays small while "memory" is effectively unbounded. <b>Cost:</b> embedding + a vector store + a retrieval step. <b>When to use:</b> large corpora or long histories you might need verbatim later. Covered in full in the next chapter.</p><CmpTags fate="out" fidelity="high (if retrieved)" space="very high" cost="store + index" /></div>) },
      { id: "mem", label: "Structured memory", title: "Write facts down on purpose", intro: "Let the agent curate an explicit, editable store of durable facts.", render: () => (<div className="rd-prose"><p>Rather than compress raw transcript, the agent maintains a curated <b>memory</b>: key facts, decisions, and state written to a structured store it reads and updates deliberately — a to-do list, a profile, a set of notes. Like retrieval it lives out-of-context, but the agent <i>authors</i> it rather than indexing raw text.</p><p><b>Preserves vs loses:</b> exactly what the agent chose to record, durably and at high fidelity — and nothing it forgot to write down. It's the most robust approach and the most work: the agent must decide what's worth keeping. <b>When to use:</b> agents that persist across sessions or accumulate long-lived state. The <b>Memory</b> chapter goes deep on this.</p><CmpTags fate="out" fidelity="very high (curated)" space="high" cost="agent effort" /></div>) },
      { id: "score", label: "Importance scoring", title: "Keep the signal, drop the filler", intro: "Retain turns by scored relevance, not just by recency.", render: () => (<div className="rd-prose"><p>Pure truncation keeps recent turns regardless of worth. <b>Importance / recency scoring</b> instead ranks each turn by a blend of signals — relevance to the current goal, recency, whether it states a decision or constraint — and keeps the high-scorers while evicting filler, no matter when it was said.</p><p><b>Preserves vs loses:</b> the load-bearing moments survive even if old; chatter and dead ends go. The risk is a mis-scored turn that mattered. <b>Cost:</b> a scoring pass (heuristics or a small model). <b>When to use:</b> long conversations with a mix of crucial decisions and noise.</p><CmpTags fate="drop" fidelity="selective" space="medium" cost="scoring pass" /></div>) },
      { id: "dedup", label: "Dedup", title: "Collapse the repeats", intro: "Remove repeated or near-duplicate content before anything lossier.", render: () => (<div className="rd-prose"><p><b>Semantic deduplication</b> finds spans that say the same thing — a re-pasted file, a restated requirement, near-identical tool results — and collapses them to a single copy. Because it only removes <i>redundancy</i>, it loses essentially no unique information.</p><p><b>Preserves vs loses:</b> every distinct idea is kept; only copies disappear. The trade-off is its ceiling — if the history isn't repetitive, there's little to reclaim. <b>Cost:</b> a similarity pass over the history. <b>When to use:</b> as a cheap, near-lossless cleanup before truncating or summarizing.</p><CmpTags fate="drop" fidelity="very high" space="low→medium" cost="similarity pass" /></div>) },
      { id: "compare", label: "Compare", title: "Which one, when?", intro: "All eight on two axes that matter: fidelity preserved vs space freed — and where the data ends up.", render: () => <CmpMatrix /> },
    ]} />
  );
}

/* ================================================== CHAPTER CONFIG ========= */
const CONTEXTENG = {
  id: "context-engineering", title: "Context engineering", nextChapter: nextOf("context-engineering"),
  steps: [
    { eyebrow: "STEP 01 · CONTEXT ENGINEERING", title: "The window has an edge", navTitle: "The window's edge",
      lead: "A model has no memory between calls. Everything it knows in the moment must fit inside its context window.",
      Body: () => (<><p>Up to now we've followed tokens <i>through</i> the model. Step back: the model can only see a fixed-size <b>context window</b> of tokens at once.<Cite id="cc-context-window" /> Too many, and the oldest silently fall away.</p><p>Drag the window and watch tokens drop out of view.</p></>),
      Diagram: () => <ContextWindow />, wide: true, caption: "A finite window slides over the text. Whatever falls outside is, to the model, forgotten." },
    { eyebrow: "STEP 02 · CONTEXT ENGINEERING", title: "What you put in the window", navTitle: "What goes in",
      Body: () => (<><p>The window isn't just the conversation. It's <b>assembled</b> from the system prompt, tool definitions, retrieved documents, history, and the actual question — all competing for the same budget.<Cite id="anthropic-context-eng" /></p><p>Toggle the pieces and watch the budget fill.</p></>),
      Diagram: CtxBudget, caption: "Every part shares one budget. Choosing what earns a slot is the core of the craft." },
    { eyebrow: "STEP 03 · CONTEXT ENGINEERING", title: "Where you put it matters", navTitle: "Position matters",
      Body: () => (<><p>Filling the window isn't enough — <b>position</b> changes what the model actually uses. Information at the very start or very end lands; the same fact buried in the middle can be missed entirely.<Cite id="logrocket-context" /></p></>),
      Diagram: CtxLostMiddle, caption: "Recall is highest at the edges of the context and dips in the middle." },
    { eyebrow: "STEP 04 · CONTEXT ENGINEERING", title: "When it's full, compact", navTitle: "Compaction",
      Body: () => (<><p>Conversations grow without bound; the window doesn't. The fix is <b>compaction</b>: summarize or set aside old material so the important parts survive in less space.<Cite id="compression-strats" /></p><p>And "summarize" is only one move. The methods differ sharply in <i>what they do with the data</i> — some <b>drop</b> it (truncation, tool-result eviction), some <b>rewrite it in place</b> and lose detail (summarization, hierarchical), and some <b>move it out</b> of the window to recall later (retrieval, structured memory) — with selective scoring and deduplication in between. Each trades fidelity against space differently. The appendix lays out all eight side by side, with a comparison so the differences are crisp. The chapters that follow then go deeper on <b>retrieval</b> and <b>memory</b>.</p></>),
      Diagram: CtxCompact, caption: "Old turns collapse into a summary, freeing the budget for what comes next.",
      deeper: [{ id: "ctx-appx", label: "Compaction methods, compared", kicker: "Appendix · context", title: "Ways to fit more in", wide: true, Panel: CtxDeepDoc }] },
  ],
};

Object.assign(window, { CONTEXTENG });
