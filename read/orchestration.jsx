/* aallms — chapter · Orchestration
   When one loop isn't enough: decomposition, sub-agents with clean context,
   and choosing an orchestration shape. Globals: React, Icon, nextOf, makeRefs.
   Shared classes: hg-* (in reader.css). New css lives in orchestration.html.
   Exports: ORCH_CH. */

const { Cite, Footnotes } = makeRefs(["meta-harness", "langchain-harness", "arxiv-2601-11868"]);

/* =================================================== 1 · ONE LOOP ========= */
/* The planner → focused sub-tasks → synthesizer graph, lifted from the harness
   seed and expanded: animated flow particles travel plan→sub and sub→synth. */
function OrchGraph() {
  const W = 580, H = 300;
  const plan = { x: 92, y: 150 }, synth = { x: 488, y: 150 };
  const subs = [
    { x: 290, y: 64, n: "research", s: "gather" },
    { x: 290, y: 150, n: "draft", s: "write" },
    { x: 290, y: 236, n: "check", s: "verify" },
  ];
  const edge = (a, b) => `M ${a.x} ${a.y} C ${(a.x + b.x) / 2} ${a.y}, ${(a.x + b.x) / 2} ${b.y}, ${b.x} ${b.y}`;
  return (
    <div>
      <div className="fp-plate rd-plate" style={{ padding: "var(--sp-4)" }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
          {/* edges */}
          {subs.map((s, i) => <path key={"a" + i} className="hg-edge" d={edge(plan, s)} />)}
          {subs.map((s, i) => <path key={"b" + i} className="hg-edge" d={edge(s, synth)} />)}
          {/* hidden motion paths */}
          {subs.map((s, i) => <path key={"hpa" + i} id={`orchpa-${i}`} d={edge(plan, s)} fill="none" stroke="none" />)}
          {subs.map((s, i) => <path key={"hpb" + i} id={`orchpb-${i}`} d={edge(s, synth)} fill="none" stroke="none" />)}
          {/* outbound particles: plan → sub (the task fans out) */}
          {subs.map((s, i) => (
            <circle key={"po" + i} r="3.5" fill="var(--accent)">
              <animateMotion dur="2.4s" begin={i * 0.45 + "s"} repeatCount="indefinite"><mpath href={`#orchpa-${i}`} /></animateMotion>
            </circle>
          ))}
          {/* return particles: sub → synth (condensed results flow back) */}
          {subs.map((s, i) => (
            <circle key={"pr" + i} r="3.5" fill="var(--concept-output)">
              <animateMotion dur="2.4s" begin={i * 0.45 + 1.2 + "s"} repeatCount="indefinite"><mpath href={`#orchpb-${i}`} /></animateMotion>
            </circle>
          ))}
          {/* planner */}
          <g className="hg-node hg-ctrl"><rect x={plan.x - 52} y={plan.y - 27} width="104" height="54" rx="9" /><text x={plan.x} y={plan.y - 3} textAnchor="middle" className="hg-t">planner</text><text x={plan.x} y={plan.y + 13} textAnchor="middle" className="hg-s">decompose</text></g>
          {/* sub-tasks */}
          {subs.map((s, i) => <g key={i} className="hg-node hg-sub"><rect x={s.x - 50} y={s.y - 23} width="100" height="46" rx="8" /><text x={s.x} y={s.y - 2} textAnchor="middle" className="hg-t">{s.n}</text><text x={s.x} y={s.y + 13} textAnchor="middle" className="hg-s">{s.s}</text></g>)}
          {/* synthesizer */}
          <g className="hg-node hg-ctrl"><rect x={synth.x - 52} y={synth.y - 27} width="104" height="54" rx="9" /><text x={synth.x} y={synth.y - 3} textAnchor="middle" className="hg-t">synthesize</text><text x={synth.x} y={synth.y + 13} textAnchor="middle" className="hg-s">combine</text></g>
        </svg>
        <div className="orch-legend">
          <span><i className="orch-dot" style={{ background: "var(--accent)" }} />task fans out</span>
          <span><i className="orch-dot" style={{ background: "var(--concept-output)" }} />results flow back</span>
        </div>
      </div>
      <p className="dg-read">A single loop carries a single line of attention — fine for one tidy task, but a hard job has parts that pull in different directions. The harness <b>decomposes</b> it: a <b style={{ color: "var(--accent)" }}>planner</b> splits the goal into focused sub-tasks, each runs on its own, and a <b style={{ color: "var(--concept-output)" }}>synthesizer</b> stitches the pieces back together.<Cite id="arxiv-2601-11868" /> The work no longer has to fit in one context or one pass.</p>
    </div>
  );
}

/* =================================================== 2 · SUB-AGENTS ======= */
/* Main agent fans out to specialized sub-agents. Each sub-agent does deep work
   in an isolated, clean context and returns a small distilled summary. Click a
   sub-agent to peek at the heavy private context it keeps to itself. */
const ORCH_SUBS = [
  {
    id: "search", icon: "search", name: "Researcher", role: "web search",
    deep: 41200,
    raw: ["fetched 38 pages", "scanned 11 PDFs", "followed 24 links", "dropped 9 dead ends", "cross-checked 6 sources"],
    summary: "Three primary sources agree the launch was 2026; one outlier (2025) is a mislabeled draft. Confidence: high.",
    out: 1280,
  },
  {
    id: "code", icon: "terminal", name: "Coder", role: "run + test",
    deep: 28600,
    raw: ["wrote 3 scripts", "ran 47 test cases", "hit 5 stack traces", "patched 2 edge cases", "profiled the hot loop"],
    summary: "Implementation passes all 47 tests; the O(n²) merge was the bottleneck — replaced with a heap, 9× faster.",
    out: 940,
  },
  {
    id: "read", icon: "file-text", name: "Reader", role: "read the corpus",
    deep: 53400,
    raw: ["opened 22 files", "read 14k lines", "traced 6 call graphs", "noted 31 TODOs", "mapped the module tree"],
    summary: "The auth flow lives in 3 modules; tokens are minted in session.py and never rotated — likely the bug's root.",
    out: 1610,
  },
];
function OrchSubAgents() {
  const [open, setOpen] = React.useState(null);
  const [dispatched, setDispatched] = React.useState(false);
  const cur = ORCH_SUBS.find(s => s.id === open);
  const fmt = n => n.toLocaleString();
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="sa-stage">
          {/* main agent */}
          <div className={"sa-main" + (dispatched ? " is-live" : "")}>
            <span className="sa-main-ic"><Icon name="git-merge" size={18} stroke={1.9} /></span>
            <b>main agent</b>
            <span className="sa-main-sub">holds the plan</span>
          </div>

          {/* fan-out rail */}
          <div className="sa-fan">
            {ORCH_SUBS.map((s, i) => (
              <button
                key={s.id}
                className={"sa-sub" + (open === s.id ? " is-open" : "") + (dispatched ? " is-in" : "")}
                style={{ transitionDelay: dispatched ? i * 90 + "ms" : "0ms" }}
                onClick={() => setOpen(o => o === s.id ? null : s.id)}
              >
                <span className="sa-sub-head">
                  <span className="sa-sub-ic"><Icon name={s.icon} size={14} stroke={2} /></span>
                  <b>{s.name}</b>
                  <span className="sa-sub-role">{s.role}</span>
                </span>
                <span className="sa-sub-ctx">
                  <span className="sa-ctx-lab">clean context · private</span>
                  <span className="sa-ctx-bar"><i style={{ width: Math.min(100, s.deep / 600) + "%" }} /></span>
                  <span className="sa-ctx-tok">{fmt(s.deep)} tok of deep work</span>
                </span>
                <span className="sa-sub-ret">
                  <Icon name="corner-down-left" size={11} stroke={2} />
                  returns ~{fmt(s.out)} tok
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* the peek: what stays isolated vs what comes back */}
        <div className={"sa-peek" + (cur ? " is-shown" : "")}>
          {cur ? (
            <>
              <div className="sa-peek-col sa-peek-iso">
                <span className="sa-peek-h"><Icon name="eye-off" size={12} stroke={2} /> stays in the sub-agent</span>
                <ul className="sa-peek-raw">
                  {cur.raw.map((r, k) => <li key={k}>{r}</li>)}
                </ul>
                <span className="sa-peek-tok">{fmt(cur.deep)} tokens — never touches the main context</span>
              </div>
              <div className="sa-peek-arrow"><Icon name="arrow-right" size={16} stroke={2} /></div>
              <div className="sa-peek-col sa-peek-back">
                <span className="sa-peek-h"><Icon name="package" size={12} stroke={2} /> comes back to main</span>
                <p className="sa-peek-sum">{cur.summary}</p>
                <span className="sa-peek-tok is-small">~{fmt(cur.out)} tokens — distilled</span>
              </div>
            </>
          ) : (
            <p className="sa-peek-hint">Pick a sub-agent to see what it keeps private and what it hands back.</p>
          )}
        </div>
      </div>

      <div className="dg-controls">
        <button className="dg-btn" onClick={() => setDispatched(d => !d)}>
          <Icon name={dispatched ? "rotate-ccw" : "send"} size={14} stroke={2.2} />
          {dispatched ? "Reset" : "Dispatch sub-agents"}
        </button>
      </div>

      <p className="dg-read">Instead of cramming every search and side-quest into one window, the main agent <b>spins up specialized sub-agents</b>, each with a <b>clean context</b> of its own. A sub-agent can read hundreds of pages or run dozens of tests in isolation, then hand back a tight, <b>distilled summary</b> — often just <b>1,000–2,000 tokens</b>. The heavy detail stays sealed in the sub-agent; the main agent gets the answer, not the mess. That clear <b>separation of concerns</b> is what keeps long, branching work from drowning the top-level context.</p>
    </div>
  );
}

/* =================================================== 3 · HIVE-MIND ======== */
/* A shared blackboard several agents read from and write to. No planner tree —
   coordination is emergent: each agent picks up what others left and adds to it.
   Run it and watch contributions accumulate and get built on. */
const HIVE_AGENTS = [
  { id: "a", name: "Scout", icon: "compass", col: "var(--concept-query)" },
  { id: "b", name: "Builder", icon: "hammer", col: "var(--concept-key)" },
  { id: "c", name: "Critic", icon: "search-check", col: "var(--concept-value)" },
  { id: "d", name: "Scribe", icon: "pen-line", col: "var(--concept-output)" },
];
// scripted run: each note is posted by an agent, some building on a prior note
const HIVE_SCRIPT = [
  { by: "a", text: "found 3 candidate APIs", build: null },
  { by: "b", text: "wired a prototype on API #2", build: 0 },
  { by: "c", text: "API #2 rate-limits at 60/min — flag", build: 1 },
  { by: "a", text: "API #1 has no such limit", build: 2 },
  { by: "b", text: "re-pointed prototype to API #1", build: 3 },
  { by: "d", text: "drafted the writeup from the board", build: 4 },
];
function OrchHive() {
  const [n, setN] = React.useState(0); // how many notes are on the board
  const [running, setRunning] = React.useState(false);
  const timer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const tick = React.useCallback(() => {
    setN(prev => {
      const next = prev + 1;
      if (next < HIVE_SCRIPT.length) timer.current = setTimeout(tick, 1050);
      else setRunning(false);
      return next;
    });
  }, []);
  const run = () => {
    clearTimeout(timer.current);
    if (n >= HIVE_SCRIPT.length) { setN(0); }
    setRunning(true);
    timer.current = setTimeout(tick, 250);
  };
  const reset = () => { clearTimeout(timer.current); setRunning(false); setN(0); };
  const agentOf = id => HIVE_AGENTS.find(a => a.id === id);
  const notes = HIVE_SCRIPT.slice(0, n);
  const lastBy = n > 0 ? HIVE_SCRIPT[n - 1].by : null;
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="hv-stage">
          {/* ring of agents, all pointing at one board */}
          <div className="hv-ring">
            {HIVE_AGENTS.map(a => {
              const wrote = notes.filter(x => x.by === a.id).length;
              return (
                <div key={a.id} className={"hv-agent" + (lastBy === a.id ? " is-active" : "")}>
                  <span className="hv-agent-ic" style={{ color: a.col, background: "color-mix(in srgb, " + a.col + " 16%, transparent)" }}>
                    <Icon name={a.icon} size={15} stroke={2} />
                  </span>
                  <b>{a.name}</b>
                  <span className="hv-agent-meta">{wrote ? wrote + " posted" : "watching"}</span>
                </div>
              );
            })}
          </div>
          {/* the shared board */}
          <div className="hv-board">
            <div className="hv-board-h">
              <span className="hv-board-ic"><Icon name="clipboard-list" size={13} stroke={2} /></span>
              shared board
              <span className="hv-board-count">{n} / {HIVE_SCRIPT.length}</span>
            </div>
            <div className="hv-board-body">
              {notes.length === 0 ? (
                <p className="hv-empty">Empty. Run the swarm — every agent reads and writes here.</p>
              ) : notes.map((note, i) => {
                const a = agentOf(note.by);
                return (
                  <div key={i} className={"hv-note" + (i === n - 1 ? " is-new" : "")}
                    style={{ borderLeftColor: a.col }}>
                    <span className="hv-note-by" style={{ color: a.col }}>{a.name}</span>
                    {note.build != null ? <span className="hv-note-build"><Icon name="corner-down-right" size={10} stroke={2} />builds on {agentOf(HIVE_SCRIPT[note.build].by).name}</span> : null}
                    <span className="hv-note-txt">{note.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={run} disabled={running}>
          <Icon name={running ? "loader" : "play"} size={14} stroke={2.2} />
          {n >= HIVE_SCRIPT.length ? "Run again" : running ? "Running…" : "Run the swarm"}
        </button>
        <button className="dg-btn" onClick={reset} disabled={running && n === 0}>
          <Icon name="rotate-ccw" size={14} stroke={2.2} />Reset
        </button>
      </div>
      <p className="dg-read">Drop the planner-and-workers tree and you get a different shape entirely: many agents share one <b>blackboard</b> — a common memory or filesystem — and coordinate <i>through</i> it. Each one reads what others wrote and adds its own contribution; useful work <b>accumulates</b> on the board and gets built on, turn after turn. No one is in charge, yet a coherent result emerges from the shared state — a <b>hive mind</b>, or swarm. The tradeoff is the mirror image of the previous step: sub-agents prize <b>clean isolation</b>, while a swarm prizes <b>shared state</b> — more cross-pollination, but also more noise and contention over the same board.</p>
    </div>
  );
}

/* =================================================== 4 · BFT / VOTE ======== */
/* The same task is sent to N redundant agents; a quorum tallies their answers
   and the majority wins. Flip agents to "faulty" and watch consensus hold —
   until more than a third are bad and it breaks (the >2/3-honest threshold). */
const BFT_N = 7;
const BFT_GOOD = "ISO-8601";   // the correct answer the honest majority converges on
const BFT_BAD = "RFC-2822";    // what a faulty/adversarial agent emits
function OrchBFT() {
  // which agents are flipped faulty (by index)
  const [faulty, setFaulty] = React.useState(() => new Set());
  const toggle = i => setFaulty(s => {
    const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n;
  });
  const answers = Array.from({ length: BFT_N }, (_, i) => faulty.has(i) ? BFT_BAD : BFT_GOOD);
  const goodCount = answers.filter(a => a === BFT_GOOD).length;
  const badCount = BFT_N - goodCount;
  const need = Math.floor(BFT_N / 2) + 1;       // simple majority quorum
  const honestThreshold = Math.floor(2 * BFT_N / 3); // classic >2/3 honest
  const consensus = goodCount >= need ? BFT_GOOD : badCount >= need ? BFT_BAD : null;
  const held = consensus === BFT_GOOD;
  const safe = goodCount > honestThreshold; // comfortably above the BFT bound
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="bft-grid">
          {answers.map((ans, i) => {
            const bad = faulty.has(i);
            return (
              <button key={i} className={"bft-agent" + (bad ? " is-faulty" : " is-ok")}
                onClick={() => toggle(i)} title={bad ? "click to make honest" : "click to make faulty"}>
                <span className="bft-agent-ic"><Icon name={bad ? "bug" : "bot"} size={15} stroke={2} /></span>
                <span className="bft-agent-ans">{ans}</span>
                <span className="bft-agent-tag">{bad ? "faulty" : "honest"}</span>
              </button>
            );
          })}
        </div>

        <div className="bft-quorum">
          <span className="bft-q-ic" style={{ color: held ? "var(--ok-500)" : "var(--err-500)" }}>
            <Icon name={held ? "gavel" : "alert-octagon"} size={16} stroke={2} />
          </span>
          <div className="bft-q-tally">
            <div className="bft-q-row">
              <span className="bft-q-lab" style={{ color: "var(--ok-500)" }}>{BFT_GOOD}</span>
              <span className="bft-q-track"><i style={{ width: (goodCount / BFT_N * 100) + "%", background: "var(--ok-500)" }} /></span>
              <b>{goodCount}</b>
            </div>
            <div className="bft-q-row">
              <span className="bft-q-lab" style={{ color: "var(--err-500)" }}>{BFT_BAD}</span>
              <span className="bft-q-track"><i style={{ width: (badCount / BFT_N * 100) + "%", background: "var(--err-500)" }} /></span>
              <b>{badCount}</b>
            </div>
          </div>
          <div className="bft-q-out">
            <span className="bft-q-out-lab">consensus · need {need}/{BFT_N}</span>
            <b className="bft-q-out-val" style={{ color: held ? "var(--ok-500)" : "var(--err-500)" }}>
              {consensus || "split — no quorum"}
            </b>
          </div>
        </div>

        <p className={"bft-status" + (held && safe ? " is-safe" : held ? " is-warn" : " is-broken")}>
          {held && safe
            ? "Consensus holds: a comfortable honest majority. A few bad agents can't move the result."
            : held
              ? "Still holding — but barely. One more faulty agent and the quorum tips."
              : "Consensus broken: too many faulty agents. The bad answer now wins the vote."}
        </p>
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={() => setFaulty(new Set())} disabled={badCount === 0}>
          <Icon name="rotate-ccw" size={14} stroke={2.2} />All honest
        </button>
        <span className="bft-hint">Click an agent to flip it faulty. Honest needed above {honestThreshold} of {BFT_N}.</span>
      </div>
      <p className="dg-read">A single LLM agent is an unreliable narrator — it can hallucinate or wander off the rails on any given run. Borrowing straight from distributed systems: run the <b>same task</b> on several redundant agents and take a <b>consensus</b> — a majority vote or quorum — so a handful of faulty or adversarial agents can't decide the outcome. Flip agents to faulty and the result <b>still holds</b>, right up until too many go bad and the quorum tips; classically you need more than <b>two-thirds honest</b> to stay safe. The lightweight cousin of this is <b>self-consistency</b>: sample one model many times and vote across the chains — same idea, redundancy turned into reliability.</p>
    </div>
  );
}

/* =================================================== 5 · MAD / DEBATE ===== */
/* Voting tolerated faulty agents; debate goes further — agents read each other
   and revise. Four agents answer "How many r's in strawberry?". Toggle between
   Classic MAD (multi-round, last-round majority vote — a wrong agent can infect
   the others) and Free-MAD (anti-conformity resists the bad answer, and a
   trajectory score over the whole debate picks the winner in a single round). */
const MAD_QUESTION = "How many r's in “strawberry”?";
const MAD_RIGHT = "3";
const MAD_WRONG = "2";
const MAD_AGENTS = ["Agent A", "Agent B", "Agent C", "Agent D"];
// Classic MAD: 3 rounds. Agent C starts confidently wrong and, by majority
// pressure, sways A and B toward the wrong answer (error propagation). The
// last-round majority vote then lands on the wrong answer — random/unfair.
const MAD_CLASSIC = [
  { ans: [MAD_RIGHT, MAD_RIGHT, MAD_WRONG, MAD_RIGHT], note: "independent first pass — C miscounts" },
  { ans: [MAD_RIGHT, MAD_WRONG, MAD_WRONG, MAD_WRONG], note: "C insists loudly; B and D conform to it" },
  { ans: [MAD_WRONG, MAD_WRONG, MAD_WRONG, MAD_RIGHT], note: "the wrong answer has spread — A flips too" },
];
// Free-MAD: a single round. Anti-conformity makes peers actively hunt flaws in
// C's reasoning rather than conform; the trajectory score over the whole debate
// rewards the agent whose reasoning held up — the right answer wins, in 1 round.
const MAD_FREE = [
  { ans: [MAD_RIGHT, MAD_RIGHT, MAD_WRONG, MAD_RIGHT], note: "independent first pass — C miscounts" },
  { ans: [MAD_RIGHT, MAD_RIGHT, MAD_RIGHT, MAD_RIGHT], note: "peers find C's flaw instead of conforming — C is corrected" },
];
function OrchMAD() {
  const [mode, setMode] = React.useState("classic"); // classic | free
  const [round, setRound] = React.useState(0);
  const script = mode === "classic" ? MAD_CLASSIC : MAD_FREE;
  const cur = script[Math.min(round, script.length - 1)];
  const prev = round > 0 ? script[round - 1].ans : null;
  const atEnd = round >= script.length - 1;
  const setModeReset = m => { setMode(m); setRound(0); };
  // Classic: last-round MAJORITY vote (can be wrong/unfair).
  // Free: TRAJECTORY score — reward agents whose answer held steady & correct.
  const last = script[script.length - 1].ans;
  const tally = a => last.filter(x => x === a).length;
  let final, finalRight;
  if (mode === "classic") {
    final = tally(MAD_RIGHT) > tally(MAD_WRONG) ? MAD_RIGHT
      : tally(MAD_WRONG) > tally(MAD_RIGHT) ? MAD_WRONG : "tie";
    finalRight = final === MAD_RIGHT;
  } else {
    // trajectory score: count how consistently each agent held the answer it
    // ends on across every round; the highest-scoring answer wins.
    const score = ans => script.reduce((s, r) =>
      s + r.ans.filter((x, i) => x === ans && last[i] === ans).length, 0);
    final = score(MAD_RIGHT) >= score(MAD_WRONG) ? MAD_RIGHT : MAD_WRONG;
    finalRight = final === MAD_RIGHT;
  }
  const rounds = script.length;
  // rough token contrast: classic pays per round, free runs once
  const tokens = mode === "classic" ? rounds * 4 * 700 : 1 * 4 * 700;
  const fmt = n => n.toLocaleString();
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        <button className={mode === "classic" ? "on" : ""} onClick={() => setModeReset("classic")}>Classic MAD</button>
        <button className={mode === "free" ? "on" : ""} onClick={() => setModeReset("free")}>Free-MAD</button>
      </div>

      <div className="fp-plate rd-plate">
        <div className="mad-q">
          <span className="mad-q-ic"><Icon name="help-circle" size={14} stroke={2} /></span>
          <span className="mad-q-txt">{MAD_QUESTION}</span>
          <span className="mad-q-ans">answer: <b>{MAD_RIGHT}</b></span>
        </div>

        <div className="mad-roundbar">
          <span className="mad-round-lab">
            round <b>{Math.min(round, rounds - 1) + 1}</b> / {rounds}
            {mode === "free" ? <i className="mad-tag mad-tag-free">single round</i>
              : <i className="mad-tag mad-tag-classic">multi-round</i>}
          </span>
          <span className="mad-round-note">{cur.note}</span>
        </div>

        <div className="mad-grid">
          {MAD_AGENTS.map((name, i) => {
            const a = cur.ans[i];
            const ok = a === MAD_RIGHT;
            const changed = prev && prev[i] !== a;
            const swayed = mode === "classic" && changed && !ok;     // infected
            const resisted = mode === "free" && changed && ok;       // corrected
            return (
              <div key={i} className={"mad-agent" + (ok ? " is-right" : " is-wrong")
                + (changed ? " is-changed" : "")}>
                <span className="mad-agent-top">
                  <span className="mad-agent-ic"><Icon name={ok ? "bot" : "bot"} size={14} stroke={2} /></span>
                  <b>{name}</b>
                  {changed ? <span className={"mad-flip" + (swayed ? " is-bad" : resisted ? " is-good" : "")}>
                    <Icon name={swayed ? "trending-down" : "refresh-cw"} size={10} stroke={2} />
                    {swayed ? "swayed" : resisted ? "corrected" : "revised"}
                  </span> : null}
                </span>
                <span className="mad-agent-ans">{a}<span className="mad-agent-rs"> r's</span></span>
                <span className="mad-agent-tag">{ok ? "matches the count" : "miscounted"}</span>
              </div>
            );
          })}
        </div>

        <div className="mad-decide">
          <div className="mad-decide-how">
            <span className="mad-decide-h">
              <Icon name={mode === "classic" ? "vote" : "git-commit-horizontal"} size={13} stroke={2} />
              {mode === "classic" ? "last-round majority vote" : "score over the whole trajectory"}
            </span>
            <span className="mad-decide-sub">
              {mode === "classic"
                ? "only the final round counts — ties broken by chance"
                : "rewards reasoning that held up across every round"}
            </span>
          </div>
          <div className="mad-decide-out">
            <span className="mad-decide-lab">final answer</span>
            <b className="mad-decide-val" style={{ color: finalRight ? "var(--ok-500)" : "var(--err-500)" }}>
              {final === "tie" ? "tie — coin flip" : final + " r's"}
            </b>
            <span className="mad-decide-verdict" style={{ color: finalRight ? "var(--ok-500)" : "var(--err-500)" }}>
              {finalRight ? "correct" : "wrong"}
            </span>
          </div>
        </div>

        <div className="mad-meters">
          <div className="mad-meter">
            <span className="mad-meter-lab">debate cost</span>
            <b className="mad-meter-val">~{fmt(tokens)} tok</b>
            <span className="mad-meter-sub">{rounds} round{rounds > 1 ? "s" : ""} × {MAD_AGENTS.length} agents</span>
          </div>
          <div className="mad-meter">
            <span className="mad-meter-lab">outcome</span>
            <b className="mad-meter-val" style={{ color: finalRight ? "var(--ok-500)" : "var(--err-500)" }}>
              {finalRight ? "right answer survives" : "error propagated"}
            </b>
            <span className="mad-meter-sub">{mode === "classic" ? "majority pressure can mislead" : "anti-conformity resists the bad answer"}</span>
          </div>
        </div>
      </div>

      <div className="dg-controls">
        <button className="dg-btn" onClick={() => setRound(r => Math.min(r + 1, rounds - 1))} disabled={atEnd}>
          <Icon name="play" size={14} stroke={2.2} />
          {atEnd ? "Debate settled" : "Next round"}
        </button>
        <button className="dg-btn" onClick={() => setRound(0)} disabled={round === 0}>
          <Icon name="rotate-ccw" size={14} stroke={2.2} />Reset rounds
        </button>
        <span className="mad-hint">
          {mode === "classic"
            ? "Step through and watch C's wrong answer spread."
            : "Step through and watch peers correct C instead of conforming."}
        </span>
      </div>

      <p className="dg-read">Voting tolerates faulty agents; <b>debate</b> goes one step further — agents read <i>each other's</i> answers and revise. In <b>Multi-Agent Debate (MAD)</b>, several agents answer independently, then over one or more <b>rounds</b> they critique and update, which sharpens factuality and reasoning beyond a lone agent. But plain MAD has cracks: extra rounds burn <b>tokens</b> and scale poorly, and a wrong agent can <b>infect</b> the others through majority pressure — error propagation — while a <b>last-round majority vote</b> is itself a weak, somewhat random way to decide. <b>Free-MAD</b> closes those gaps: an <b>anti-conformity</b> push makes agents hunt for flaws in their peers instead of conforming, and a <b>score over the whole debate trajectory</b> — how each agent's reasoning evolved — replaces the final-round vote. The result is comparable or better accuracy in a <b>single round</b>, with far fewer tokens (reported gains of roughly <b>13–16.5%</b> over baselines). Toggle the two and step through the rounds.</p>
    </div>
  );
}

/* =================================================== 6 · SHAPES =========== */
/* Three orchestration shapes side by side, each with a tiny topology sketch and
   a tradeoff readout (latency / cost / coordination vs parallelism / focus). */
const ORCH_SHAPES = {
  loop: {
    label: "Single loop", icon: "repeat", tag: "one agent, one context",
    blurb: "One agent thinks, acts, and observes in a single rolling context until it's done. Nothing to coordinate, nothing to merge.",
    good: ["Cheapest path", "Lowest latency", "Nothing to coordinate"],
    cost: ["Everything shares one window", "Can't parallelize", "Long tasks crowd the context"],
    bars: { parallelism: 8, focus: 30, coordination: 6, latency: 22 },
  },
  plan: {
    label: "Plan → execute", icon: "list-checks", tag: "plan first, then run steps",
    blurb: "The harness drafts a full plan up front, then executes each step in turn — re-planning only if a step fails. Structure before action.",
    good: ["Clear, auditable steps", "Re-plan on failure", "Predictable shape"],
    cost: ["Planning adds latency", "Rigid if the task shifts", "Still mostly sequential"],
    bars: { parallelism: 28, focus: 62, coordination: 38, latency: 55 },
  },
  fan: {
    label: "Multi-agent fan-out", icon: "git-fork", tag: "many sub-agents in parallel",
    blurb: "A coordinator splits the goal across specialized sub-agents that run in parallel, each in its own clean context, then synthesizes their results.",
    good: ["Real parallelism", "Each agent stays focused", "Isolated contexts"],
    cost: ["Highest token cost", "Coordination overhead", "Results must be merged"],
    bars: { parallelism: 92, focus: 88, coordination: 80, latency: 48 },
  },
};
const SHAPE_ORDER = ["loop", "plan", "fan"];
const BAR_META = [
  { k: "parallelism", lab: "parallelism", col: "var(--concept-output)", up: true },
  { k: "focus", lab: "per-step focus", col: "var(--concept-key)", up: true },
  { k: "coordination", lab: "coordination cost", col: "var(--warn-500)", up: false },
  { k: "latency", lab: "latency", col: "var(--err-500)", up: false },
];
function ShapeSketch({ kind }) {
  // tiny topology diagrams
  if (kind === "loop") {
    return (
      <svg viewBox="0 0 120 70" className="sh-sketch">
        <circle cx="60" cy="35" r="13" className="sh-node sh-ctrl" />
        <path d="M 60 18 A 28 28 0 1 1 59 18" className="sh-edge" markerEnd="url(#sh-arrow)" />
        <defs><marker id="sh-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="var(--border-strong)" /></marker></defs>
      </svg>
    );
  }
  if (kind === "plan") {
    return (
      <svg viewBox="0 0 120 70" className="sh-sketch">
        <circle cx="20" cy="35" r="9" className="sh-node sh-ctrl" />
        <line x1="29" y1="35" x2="43" y2="35" className="sh-edge" />
        <circle cx="52" cy="35" r="9" className="sh-node sh-sub" />
        <line x1="61" y1="35" x2="75" y2="35" className="sh-edge" />
        <circle cx="84" cy="35" r="9" className="sh-node sh-sub" />
        <line x1="93" y1="35" x2="107" y2="35" className="sh-edge" />
        <circle cx="110" cy="35" r="6" className="sh-node sh-sub" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 70" className="sh-sketch">
      <circle cx="20" cy="35" r="9" className="sh-node sh-ctrl" />
      {[14, 35, 56].map((y, i) => <line key={i} x1="29" y1="35" x2="51" y2={y} className="sh-edge" />)}
      {[14, 35, 56].map((y, i) => <circle key={i} cx="60" cy={y} r="8" className="sh-node sh-sub" />)}
      {[14, 35, 56].map((y, i) => <line key={i} x1="69" y1={y} x2="91" y2="35" className="sh-edge" />)}
      <circle cx="100" cy="35" r="9" className="sh-node sh-ctrl" />
    </svg>
  );
}
function OrchShapes() {
  const [pick, setPick] = React.useState("fan");
  const s = ORCH_SHAPES[pick];
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        {SHAPE_ORDER.map(k => (
          <button key={k} className={pick === k ? "on" : ""} onClick={() => setPick(k)}>{ORCH_SHAPES[k].label}</button>
        ))}
      </div>

      <div className="fp-plate rd-plate sh-stage">
        <div className="sh-top">
          <div className="sh-id">
            <span className="sh-id-ic"><Icon name={s.icon} size={18} stroke={1.9} /></span>
            <div>
              <b>{s.label}</b>
              <span className="sh-id-tag">{s.tag}</span>
            </div>
          </div>
          <ShapeSketch kind={pick} />
        </div>

        <p className="sh-blurb">{s.blurb}</p>

        <div className="sh-bars">
          {BAR_META.map(b => (
            <div key={b.k} className="sh-bar">
              <span className="sh-bar-lab">{b.lab}<i className={"sh-bar-dir " + (b.up ? "up" : "down")}>{b.up ? "more is better" : "more is costlier"}</i></span>
              <span className="sh-bar-track"><i style={{ width: s.bars[b.k] + "%", background: b.col }} /></span>
            </div>
          ))}
        </div>

        <div className="sh-cols">
          <div className="sh-col sh-col-good">
            <span className="sh-col-h"><Icon name="check" size={12} stroke={2.4} /> buys you</span>
            <ul>{s.good.map((g, k) => <li key={k}>{g}</li>)}</ul>
          </div>
          <div className="sh-col sh-col-cost">
            <span className="sh-col-h"><Icon name="alert-triangle" size={12} stroke={2.2} /> costs you</span>
            <ul>{s.cost.map((c, k) => <li key={k}>{c}</li>)}</ul>
          </div>
        </div>
      </div>

      <p className="dg-read">There's no single right shape — only tradeoffs. A <b>single loop</b> is cheap and quick but can't split its attention. <b>Plan-execute</b> adds structure and auditability at the price of up-front latency and some rigidity. <b>Multi-agent fan-out</b> buys real parallelism and focus, but you pay in tokens, coordination, and the work of merging results back together. Whichever you choose, the <b>harness owns the plan, the routing, and what context each step gets to see</b> — that ownership is what makes the shape hold.<Cite id="langchain-harness" /></p>
      <Footnotes />
    </div>
  );
}

/* ================================================== CHAPTER CONFIG ========= */
const ORCH_CH = {
  id: "orchestration", title: "Orchestration", nextChapter: nextOf("orchestration"),
  steps: [
    { eyebrow: "STEP 01 · ORCHESTRATION", title: "One loop isn't enough", navTitle: "Beyond one loop",
      lead: "A single agent loop can only hold one line of attention. Hard tasks have parts that won't fit in one pass.",
      Body: () => (<><p>Everything so far has run inside <i>one</i> loop — one context, one rolling train of thought. That's plenty for a tidy task. But a real problem often has pieces that pull in different directions: research <i>and</i> drafting <i>and</i> checking, each wanting its own focus.</p><p>When a job outgrows a single context, the harness <b>decomposes</b> it. Watch the work fan out and come back.</p></>),
      Diagram: OrchGraph, caption: "A planner decomposes the goal; focused sub-tasks execute; a synthesizer combines. The harness routes every hop." },
    { eyebrow: "STEP 02 · ORCHESTRATION", title: "Sub-agents with clean context", navTitle: "Sub-agents",
      Body: () => (<><p>Decomposition gets real teeth when each sub-task runs as its own <b>sub-agent</b> — a fresh agent with a <b>clean context window</b>. It can do deep, sprawling work in isolation: read a whole corpus, run a wall of tests, chase dead ends — without any of that spilling into the main agent's window.</p><p>When it's done, it returns a short, distilled summary. Dispatch the sub-agents, then peek at what each one keeps private versus what comes back.</p></>),
      Diagram: OrchSubAgents, caption: "The main agent fans out; each sub-agent works in isolation and returns a ~1,000–2,000 token summary. The detail stays sealed away." },
    { eyebrow: "STEP 03 · ORCHESTRATION", title: "Hive-mind: a shared blackboard", navTitle: "Hive-mind",
      Body: () => (<><p>Sub-agents win by staying <i>apart</i> — but you can flip that instinct. Instead of a strict planner-and-workers tree, let many agents share one common workspace: a <b>blackboard</b>, a shared memory, a shared filesystem. They coordinate entirely <b>through</b> it — each reads what the others wrote and adds its own piece.</p><p>No one directs the work, yet a coherent result emerges as contributions pile up and get built on. Run the swarm and watch the board fill.</p></>),
      Diagram: OrchHive, caption: "Four agents share one board; each reads what others left and adds to it. Coordination is emergent — a hive mind." },
    { eyebrow: "STEP 04 · ORCHESTRATION", title: "Consensus for unreliable agents", navTitle: "Consensus / BFT",
      Body: () => (<><p>LLM agents are unreliable narrators: any single run can hallucinate or drift. Distributed systems have long dealt with unreliable nodes by <b>voting</b> — run the same task on several redundant agents and take a <b>consensus</b>, so a few faulty or adversarial ones can't decide the answer.</p><p>This is <b>Byzantine fault tolerance</b>: the result holds as long as enough agents are honest — classically more than two-thirds. Flip some agents faulty and watch where it breaks.</p></>),
      Diagram: OrchBFT, caption: "Seven agents answer the same task; a quorum tallies them. Consensus holds until more than a third go faulty." },
    { eyebrow: "STEP 05 · ORCHESTRATION", title: "Multi-Agent Debate and Free-MAD", navTitle: "Debate / Free-MAD",
      lead: "Voting tolerates faulty agents. Debate goes further — agents read each other and revise. But naive majority voting is itself a weak point.",
      Body: () => (<><p>Consensus let a quorum <i>outvote</i> a few bad agents. <b>Debate</b> raises the stakes: in <b>Multi-Agent Debate (MAD)</b>, agents answer independently, then over one or more <b>rounds</b> they read each other's answers and critique and revise their own — which improves factuality and reasoning over any single agent.</p><p>But plain MAD struggles: rounds cost tokens and scale poorly, a wrong agent can <b>sway</b> the others, and the closing <b>majority vote</b> is a weak way to decide. <b>Free-MAD</b> fixes this with an <b>anti-conformity</b> push and a <b>trajectory score</b> — comparable accuracy in a single round. Toggle the two and step through.</p></>),
      Diagram: OrchMAD, caption: "Four agents debate a simple count. Classic MAD lets a wrong agent infect the others; Free-MAD's anti-conformity resists it and scores the whole trajectory." },
    { eyebrow: "STEP 06 · ORCHESTRATION", title: "Choosing an orchestration shape", navTitle: "Choosing a shape",
      Body: () => (<><p>So how should the work be arranged? There's a spectrum: a plain <b>single loop</b>, a <b>plan-execute</b> pipeline, or a <b>multi-agent fan-out</b>. Each trades latency, cost, and coordination overhead against parallelism and focus.</p><p>Compare the three and weigh what each one buys — and what it costs.</p></>),
      Diagram: OrchShapes, caption: "Single loop, plan-execute, or fan-out — three shapes, three tradeoffs. The harness owns the plan, the routing, and what each step sees." },
  ],
};

Object.assign(window, { ORCH_CH });
