/* aallms — chapter · Memory
   The transcript grows but the window doesn't. Memory is what the agent
   durably learns about you and the task — short-term working context vs a
   long-term external store, the write/read/update tools that maintain it, and
   the curation that keeps it useful. Globals: React, Icon, DeepDoc, nextOf,
   makeRefs. Lifts the seed CtxMemory + MEM_TURNS from _seeds.jsx.
   Exports: MEMORY_CH. */

const { Cite, Footnotes } = makeRefs(["cc-memory", "cc-dynamic-context", "anthropic-context-eng", "compression-strats"]);

/* =================================================== 1 · WHY MEMORY ======= */
/* the transcript climbs forever; the window is fixed. Drag turns on. */
function MemWhy() {
  const [turns, setTurns] = React.useState(3);
  const WINDOW = 6;            // window holds this many turns
  const visible = Math.min(turns, WINDOW);
  const dropped = Math.max(0, turns - WINDOW);
  return (
    <div>
      <div className="mw-rows">
        <div className="mw-row">
          <p className="mw-row-h"><Icon name="messages-square" size={12} stroke={2} />Transcript <span className="mem-small">grows every turn</span></p>
          <div className="mw-track">
            {Array.from({ length: turns }).map((_, i) => (
              <span key={i} className={"mw-cell" + (i < dropped ? " is-gone" : "")}>{i + 1}</span>
            ))}
          </div>
        </div>
        <div className="mw-row">
          <p className="mw-row-h"><Icon name="square" size={12} stroke={2} />Context window <span className="mem-small">fixed — last {WINDOW}</span></p>
          <div className="mw-track mw-track--fixed">
            {Array.from({ length: WINDOW }).map((_, i) => {
              const filled = i < visible;
              return <span key={i} className={"mw-cell" + (filled ? " is-in" : " is-empty")}>{filled ? dropped + i + 1 : ""}</span>;
            })}
          </div>
        </div>
        {dropped > 0 ? (
          <div className="mw-note"><Icon name="arrow-down" size={12} stroke={2.2} />turns 1–{dropped} have slid off — gone, unless something <b>remembered</b> them</div>
        ) : <div className="mw-note mw-note--ok"><Icon name="check" size={12} stroke={2.2} />everything still fits</div>}
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={() => setTurns(t => t + 1)}><Icon name="plus" size={14} stroke={2.2} />Add a turn</button>
        <button className="dg-btn" onClick={() => setTurns(3)}><Icon name="rotate-ccw" size={14} stroke={2.2} />Reset</button>
        <span className="dg-readout">{turns} turns · {dropped} off-screen</span>
      </div>
      <p className="dg-read">A conversation only ever gets <b>longer</b>; the window stays the same size. Keep adding turns and the earliest ones fall off the edge. <b>Compaction</b> summarised them to save space — but memory is a different move: deciding which facts are worth <b>keeping on purpose</b>, durably, so they survive no matter how the transcript churns.</p>
    </div>
  );
}

/* =================================================== 2 · SHORT vs LONG ===== */
const MEM_SORT = [
  { id: "name",   label: "User's name is Dee",            home: "long",  why: "stable identity" },
  { id: "units",  label: "Prefers metric units",          home: "long",  why: "durable preference" },
  { id: "goal",   label: "Project goal: ship the API v2", home: "long",  why: "spans sessions" },
  { id: "draft",  label: "Current paragraph being edited",home: "short", why: "this exchange only" },
  { id: "scroll", label: "Scrolled to line 240 just now",  home: "short", why: "ephemeral state" },
  { id: "clip",   label: "Just-pasted error log",          home: "short", why: "raw, in-the-moment" },
];
function MemShortLong() {
  const [placed, setPlaced] = React.useState({});
  const next = MEM_SORT.find(f => placed[f.id] == null);
  const place = (home) => { if (next) setPlaced(p => ({ ...p, [next.id]: { home, correct: home === next.home } })); };
  const done = !next;
  const col = (home) => MEM_SORT.filter(f => placed[f.id] && placed[f.id].home === home);
  return (
    <div>
      <div className="sl-grid">
        <div className="sl-bin">
          <p className="sl-bin-h"><Icon name="cpu" size={13} stroke={2} />Short-term<span className="mem-small">working context · this session</span></p>
          <div className="sl-bin-body">
            {col("short").map(f => (
              <div key={f.id} className={"sl-chip" + (placed[f.id].correct ? "" : " is-wrong")}>
                <Icon name={placed[f.id].correct ? "check" : "x"} size={11} stroke={2.4} />{f.label}
              </div>
            ))}
            {!col("short").length ? <span className="sl-hint">live transcript, scratch state, raw inputs</span> : null}
          </div>
        </div>
        <div className="sl-bin">
          <p className="sl-bin-h"><Icon name="hard-drive" size={13} stroke={2} />Long-term<span className="mem-small">durable store · across sessions</span></p>
          <div className="sl-bin-body">
            {col("long").map(f => (
              <div key={f.id} className={"sl-chip" + (placed[f.id].correct ? "" : " is-wrong")}>
                <Icon name={placed[f.id].correct ? "check" : "x"} size={11} stroke={2.4} />{f.label}
              </div>
            ))}
            {!col("long").length ? <span className="sl-hint">identity, preferences, goals, decisions</span> : null}
          </div>
        </div>
      </div>
      <div className="sl-deck">
        {next ? (
          <>
            <div className="sl-card"><Icon name="file-question" size={14} stroke={2} />{next.label}<span className="sl-why">{next.why}</span></div>
            <div className="dg-controls" style={{ marginTop: "var(--sp-3)" }}>
              <button className="dg-btn" onClick={() => place("short")}><Icon name="cpu" size={14} stroke={2.2} />Short-term</button>
              <button className="dg-btn" onClick={() => place("long")}><Icon name="hard-drive" size={14} stroke={2.2} />Long-term</button>
              <span className="dg-readout">{Object.keys(placed).length} / {MEM_SORT.length} sorted</span>
            </div>
          </>
        ) : (
          <div className="dg-controls">
            <span className="sl-done"><Icon name="check-check" size={14} stroke={2.2} />all sorted — durable facts go in the store, the moment's churn stays in the window</span>
            <button className="dg-btn" onClick={() => setPlaced({})}><Icon name="rotate-ccw" size={14} stroke={2.2} />Reset</button>
          </div>
        )}
      </div>
      <p className="dg-read">Two homes for what the agent knows. <b>Short-term</b> is the working context of this very session — the live transcript, scratch state, whatever just got pasted in. <b>Long-term</b> is a durable external store that outlives any one conversation.<Cite id="cc-dynamic-context" /> The art is routing each fact to the right one: the ephemeral stuff can churn freely, while identity, preferences, and goals are written down to last.</p>
    </div>
  );
}

/* =================================================== 3 · MEMORY TOOLS ===== */
/* lifted + expanded from the _seeds.jsx CtxMemory: now surfaces the actual
   write_memory / read_memory / update_memory tool call for each turn. */
const MEM_TURNS = [
  { user: "I'm Dana, I prefer metric units.", act: "write", note: "name = Dana", note2: "units = metric", ctx: 2 },
  { user: "Plan a 5 km run route near me.", act: "read", uses: "units = metric", ctx: 2 },
  { user: "Actually, call me Dee.", act: "update", note: "name = Dee", ctx: 2 },
  { user: "Remind me what we set up.", act: "read", uses: "name = Dee · units = metric", ctx: 2 },
];
const MEM_CALL = {
  write:  { fn: "write_memory",  icon: "plus",   verb: "writes" },
  update: { fn: "update_memory", icon: "pencil", verb: "updates" },
  read:   { fn: "read_memory",   icon: "search", verb: "reads" },
};
function CtxMemory() {
  const [t, setT] = React.useState(0);
  const mem = [];
  for (let k = 0; k <= t; k++) {
    const tn = MEM_TURNS[k];
    if (tn.note) {
      const key = tn.note.split(" = ")[0];
      const ix = mem.findIndex(m => m.startsWith(key + " ="));
      if (ix >= 0) mem[ix] = tn.note; else mem.push(tn.note);
    }
    if (tn.note2 && !mem.includes(tn.note2)) mem.push(tn.note2);
  }
  const cur = MEM_TURNS[t];
  const call = MEM_CALL[cur.act];
  const arg = cur.act === "read" ? cur.uses : [cur.note, cur.note2].filter(Boolean).join(" · ");
  return (
    <div>
      <div className="mem-grid">
        <div className="mem-col">
          <p className="mem-col-h"><Icon name="message-square" size={12} stroke={2} />Context window <span className="mem-small">small &amp; fixed</span></p>
          <div className="mem-window">
            <div className="cmp-turn">turn {t + 1} only</div>
            <div className="mem-turn-user">{cur.user}</div>
            {cur.act === "read" ? <div className="mem-pull"><Icon name="arrow-down" size={11} stroke={2.2} />reads: {cur.uses}</div> : null}
          </div>
          <div className={"mc-call mc-call--" + cur.act}>
            <span className="mc-call-fn"><Icon name={call.icon} size={11} stroke={2.2} />{call.fn}(</span>
            <span className="mc-call-arg">"{arg}"</span>
            <span className="mc-call-fn">)</span>
          </div>
        </div>
        <div className="mem-col">
          <p className="mem-col-h"><Icon name="hard-drive" size={12} stroke={2} />Memory store <span className="mem-small">persists</span></p>
          <div className="mem-store">
            {mem.length ? mem.map((m, i) => {
              const justWrote = (cur.act === "write" || cur.act === "update") && (m === cur.note || m === cur.note2);
              const justRead = cur.act === "read" && cur.uses.includes(m);
              return <div key={i} className={"mem-fact" + (justWrote ? " is-new" : "") + (justRead ? " is-read" : "")}>{justWrote ? <Icon name={cur.act === "update" ? "pencil" : "plus"} size={11} stroke={2.2} /> : <Icon name="check" size={11} stroke={2.2} />}{m}</div>;
            }) : <div className="mem-empty">empty</div>}
          </div>
        </div>
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={() => setT(v => Math.max(0, v - 1))} disabled={t === 0}><Icon name="arrow-left" size={14} stroke={2.2} />Back</button>
        <button className="dg-btn" onClick={() => setT(v => Math.min(MEM_TURNS.length - 1, v + 1))} disabled={t === MEM_TURNS.length - 1}><Icon name="arrow-right" size={14} stroke={2.2} />Next turn</button>
        <button className="dg-btn" onClick={() => setT(0)}><Icon name="rotate-ccw" size={14} stroke={2.2} />Reset</button>
        <span className="dg-readout">turn {t + 1} / {MEM_TURNS.length} · {call.verb}</span>
      </div>
      <p className="dg-read">The window only ever holds the <b>current</b> turn — yet the agent stays consistent. Each turn it issues a tool call: <b>write</b> a new fact, <b>update</b> one that changed, or <b>read</b> back what it needs.<Cite id="cc-memory" /> Step through and watch the store accumulate while the window stays small. When "Dana" becomes "Dee", an <b>update</b> overwrites the old fact in place — the agent learns, durably, without the transcript growing.</p>
    </div>
  );
}

/* =================================================== 4 · WHAT TO REMEMBER == */
const MEM_CANDIDATES = [
  { id: "pref",  label: "Prefers concise answers",       keep: true,  tag: "preference" },
  { id: "tz",    label: "Timezone is CET",               keep: true,  tag: "stable fact" },
  { id: "joke",  label: "Laughed at a pun once",         keep: false, tag: "noise" },
  { id: "typo",  label: "Typed 'teh' instead of 'the'",  keep: false, tag: "noise" },
  { id: "stack", label: "Codebase is Rust + Postgres",   keep: true,  tag: "project fact" },
  { id: "weather", label: "Asked the weather yesterday", keep: false, tag: "one-off" },
];
function MemCurate() {
  const [kept, setKept] = React.useState(() => MEM_CANDIDATES.filter(c => c.keep).map(c => c.id));
  const toggle = (id) => setKept(k => k.includes(id) ? k.filter(x => x !== id) : [...k, id]);
  const score = MEM_CANDIDATES.reduce((s, c) => {
    const on = kept.includes(c.id);
    if (on && c.keep) return s + 1;       // good keep
    if (!on && !c.keep) return s + 1;     // good skip
    return s;                              // wrong call
  }, 0);
  return (
    <div>
      <div className="cu-list">
        {MEM_CANDIDATES.map(c => {
          const on = kept.includes(c.id);
          const good = on === c.keep;
          return (
            <button key={c.id} className={"cu-item" + (on ? " is-kept" : "") + (good ? "" : " is-bad")} onClick={() => toggle(c.id)}>
              <span className="cu-box"><Icon name={on ? "check" : "minus"} size={11} stroke={2.6} /></span>
              <span className="cu-label">{c.label}</span>
              <span className={"cu-tag cu-tag--" + (c.keep ? "keep" : "drop")}>{c.tag}</span>
            </button>
          );
        })}
      </div>
      <div className="cu-meter">
        <span className="mem-meter-lab">curation quality</span>
        <div className="lm-meter-track" style={{ flex: 1 }}><div className="lm-meter-fill" style={{ width: (score / MEM_CANDIDATES.length * 100) + "%", background: score >= 5 ? "var(--ok-500)" : score >= 3 ? "var(--warn-500)" : "var(--err-500)" }} /></div>
        <b className="dg-readout">{score} / {MEM_CANDIDATES.length}</b>
      </div>
      <div className="cu-pitfall">
        <p className="cu-pitfall-h"><Icon name="alert-triangle" size={13} stroke={2.2} />The pitfall: stale &amp; contradictory facts</p>
        <div className="cu-stale">
          <span className="cu-stale-old"><Icon name="x" size={11} stroke={2.4} />name = Dana <em>(never updated)</em></span>
          <Icon name="arrow-right" size={13} stroke={2} />
          <span className="cu-stale-new"><Icon name="check" size={11} stroke={2.4} />name = Dee <em>(current)</em></span>
        </div>
        <p className="cu-pitfall-note">Keep both and the agent contradicts itself. Memory must be <b>pruned and reconciled</b>, not just appended.</p>
      </div>
      <p className="dg-read">Not everything is worth a slot. Good curation <b>keeps</b> the durable signal — preferences, stable facts, project state — and <b>drops</b> the noise of one-off chatter.<Cite id="anthropic-context-eng" /> Just as important is pulling the <b>right</b> memory back at the right moment, which is exactly the <b>retrieval</b> problem from earlier in this section. And the quiet danger is rot: a store full of stale or contradictory facts is worse than none, because the agent trusts it. Unlike <b>compaction</b>, which lossily compresses the transcript, memory is a deliberate, editable record — and it only stays useful if you tend it.<Cite id="compression-strats" /></p>
      <Footnotes />
    </div>
  );
}

/* ================================================== CHAPTER CONFIG ========= */
const MEMORY_CH = {
  id: "memory", title: "Memory", nextChapter: nextOf("memory"),
  steps: [
    { eyebrow: "STEP 01 · MEMORY", title: "What outlasts the conversation", navTitle: "Why memory",
      lead: "A model has no memory between calls — only what's in the window. The transcript grows every turn, but the window doesn't. Memory is what the agent durably learns about you and the task, beyond one conversation.",
      Body: () => (<><p>We've seen the window has an edge, and that <b>compaction</b> buys room by summarising old turns. But summarising is still about <i>this</i> conversation. <b>Memory</b> asks a bigger question: what should the agent carry into the <i>next</i> one?</p><p>Add turns until the early ones slide off, and notice what's lost.</p></>),
      Diagram: MemWhy, wide: true, caption: "The transcript climbs without bound while the window holds only the most recent turns. Whatever isn't remembered on purpose is gone." },
    { eyebrow: "STEP 02 · MEMORY", title: "Short-term and long-term", navTitle: "Short vs long",
      Body: () => (<><p>Memory splits in two. <b>Working context</b> is short-term: everything live in this session's window. A <b>durable store</b> is long-term: facts that should survive across sessions, held outside the model entirely.<Cite id="cc-dynamic-context" /></p><p>Sort each fact into the home where it belongs.</p></>),
      Diagram: MemShortLong, caption: "Ephemeral, in-the-moment state stays in the working window; durable identity, preferences, and goals are written to the long-term store." },
    { eyebrow: "STEP 03 · MEMORY", title: "Writing facts down on purpose", navTitle: "Memory tools",
      Body: () => (<><p>The mechanism is a small set of tools. Each turn, the agent can <b>write</b> a new fact, <b>read</b> back what it needs, or <b>update</b> one that changed — all against an external store, while the window stays small.<Cite id="cc-memory" /></p><p>Step through the turns and watch the store and the tool calls.</p></>),
      Diagram: CtxMemory, wide: true, caption: "write_memory / read_memory / update_memory maintain a durable store across turns while the context window holds only the current exchange." },
    { eyebrow: "STEP 04 · MEMORY", title: "Deciding what's worth keeping", navTitle: "What to remember",
      Body: () => (<><p>A store is only as good as what's in it. Curation is the editorial act of choosing what earns a slot, retrieving the <b>right</b> memory when it's relevant, and guarding against rot.<Cite id="anthropic-context-eng" /></p><p>Toggle what to keep, and read the pitfall below.</p></>),
      Diagram: MemCurate, caption: "Keep the durable signal, drop the noise — and prune contradictions, or the agent will confidently trust a stale fact." },
  ],
};

Object.assign(window, { MEMORY_CH });
