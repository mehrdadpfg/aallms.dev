/* aallms — chapter · Harness engineering
   Agent = Model + Harness. What a harness is, the agent loop and its patterns,
   the environment it owns, the hooks real CLIs ship, and evals to keep it honest.
   Globals: React, Icon, nextOf. Exports: HARNESS_CH.
   The next three chapters in this section go deeper: Tools & MCP,
   Orchestration, and Meta-harness. The grand outer-shell recap lives there. */

/* =================================================== 1 · WHAT IT IS ======= */
/* A model maps text→text. The harness is everything else: the code, config,
   and execution logic that turns that mapping into action. */
const HN_PARTS = [
  { id: "loop", icon: "repeat", lab: "agent loop", note: "runs the model again and again" },
  { id: "tools", icon: "wrench", lab: "tools", note: "lets it touch the world" },
  { id: "ctx", icon: "layers", lab: "context assembly", note: "decides what it sees each turn" },
  { id: "env", icon: "folder", lab: "environment", note: "filesystem, sandbox, state" },
];
function HarnessAnatomy() {
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="hax-diagram">
          <div className="hax-core">
            <Icon name="brain" size={22} stroke={1.9} />
            <b>model</b>
            <span>text → text</span>
          </div>
          <div className="hax-ring" aria-hidden="true" />
          <div className="hax-parts">
            {HN_PARTS.map(p => (
              <div key={p.id} className="hax-part">
                <span className="hax-chip"><Icon name={p.icon} size={15} stroke={2} /></span>
                <div className="hax-part-txt"><b>{p.lab}</b><span>{p.note}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div className="hax-eq">
          <span className="hax-eq-term hax-eq-agent">Agent</span>
          <span className="hax-eq-op">=</span>
          <span className="hax-eq-term hax-eq-model">Model</span>
          <span className="hax-eq-op">+</span>
          <span className="hax-eq-term hax-eq-harness">Harness</span>
        </div>
      </div>
      <p className="dg-read">The model at the center is a brilliant but sealed mind: hand it text, it hands back text. It can't remember the last call, run a line of code, or check what's true right now. The <b>harness</b> is everything wrapped around it — the loop, the tools, the context it's fed, the environment it lives in. <b>Agent = Model + Harness.</b></p>
    </div>
  );
}

/* =================================================== 2 · AGENT LOOP ======= */
const AGENT_STEPS = [
  { station: 0, k: "think", t: "The user wants tomorrow's weather in Paris. I should look it up." },
  { station: 1, k: "act", t: "get_weather(city=\"Paris\", day=\"tomorrow\")" },
  { station: 2, k: "obs", t: "→ 18°C, light rain" },
  { station: 0, k: "think", t: "I have what I need. Time to answer." },
  { station: 1, k: "act", t: "respond(\"Pack an umbrella — 18°C and light rain in Paris tomorrow.\")" },
];
const AGENT_STATIONS = [{ name: "Model", sub: "decides", icon: "brain" }, { name: "Tools", sub: "acts", icon: "wrench" }, { name: "World", sub: "responds", icon: "globe" }];
const AGENT_KIND = { think: { lab: "think", col: "var(--concept-query)" }, act: { lab: "act", col: "var(--accent)" }, obs: { lab: "observe", col: "var(--concept-key)" } };
function HarnessLoop() {
  const [step, setStep] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setStep(v => { if (v >= AGENT_STEPS.length - 1) { setPlaying(false); return v; } return v + 1; }), 1200);
    return () => clearInterval(id);
  }, [playing]);
  const active = AGENT_STEPS[step].station;
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="ag-loop">
          {AGENT_STATIONS.map((s, i) => (
            <React.Fragment key={i}>
              <div className={"ag-node" + (i === active ? " is-on" : "")}>
                <Icon name={s.icon} size={20} stroke={1.9} />
                <b>{s.name}</b><span>{s.sub}</span>
              </div>
              {i < 2 ? <Icon name="arrow-right" size={16} stroke={2} /> : null}
            </React.Fragment>
          ))}
          <div className="ag-return"><Icon name="corner-down-left" size={14} stroke={2} /> loop</div>
        </div>
        <div className="ag-trace">
          {AGENT_STEPS.slice(0, step + 1).map((s, i) => (
            <div key={i} className={"ag-line" + (i === step ? " is-new" : "")}>
              <span className="ag-tag" style={{ background: AGENT_KIND[s.k].col }}>{AGENT_KIND[s.k].lab}</span>
              <code>{s.t}</code>
            </div>
          ))}
        </div>
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={() => { if (step >= AGENT_STEPS.length - 1) setStep(0); setPlaying(p => !p); }}><Icon name={playing ? "pause" : "play"} size={14} stroke={2.2} />{playing ? "Pause" : "Run the loop"}</button>
        <button className="dg-btn" onClick={() => { setPlaying(false); setStep(v => Math.min(AGENT_STEPS.length - 1, v + 1)); }} disabled={step >= AGENT_STEPS.length - 1}><Icon name="step-forward" size={14} stroke={2.2} />Step</button>
        <button className="dg-btn" onClick={() => { setPlaying(false); setStep(0); }}><Icon name="rotate-ccw" size={14} stroke={2.2} />Reset</button>
      </div>
      <p className="dg-read">A bare model only predicts tokens. A <b>harness</b> wraps it in a loop: the model <b style={{ color: "var(--concept-query)" }}>thinks</b>, emits an <b style={{ color: "var(--accent)" }}>action</b>, the world <b style={{ color: "var(--concept-key)" }}>responds</b>, and the observation is fed back in — until the task is done. This is the <b>ReAct</b> cycle, and the harness, not the model, drives every turn of it.</p>
    </div>
  );
}

/* =================================================== 3 · LOOP PATTERNS ==== */
/* Three shapes the single-agent loop can take. Each is a small node flow plus
   a one-line "fits / trade-off". Tokens only on the nodes — dark-mode safe. */
const LOOP_PATS = {
  react: {
    lab: "ReAct",
    nodes: [
      { k: "reason", lab: "reason", sub: "a little", icon: "brain", col: "var(--concept-query)" },
      { k: "act", lab: "act", sub: "one step", icon: "wrench", col: "var(--accent)" },
      { k: "obs", lab: "observe", sub: "real result", icon: "eye", col: "var(--concept-key)" },
    ],
    loops: true, loopLab: "re-plan every turn",
    blurb: "Reason a little, take one action, observe, repeat — re-planning after every real result.",
    fit: "Fits: messy, open-ended tasks where the next move depends on what just happened.",
    trade: "Trade-off: one model call per step — many round-trips, slower and pricier.",
  },
  plan: {
    lab: "Plan-execute",
    nodes: [
      { k: "plan", lab: "plan", sub: "all steps up front", icon: "list-checks", col: "var(--concept-query)" },
      { k: "s1", lab: "step 1", sub: "carry out", icon: "wrench", col: "var(--accent)" },
      { k: "s2", lab: "step 2", sub: "carry out", icon: "wrench", col: "var(--accent)" },
      { k: "s3", lab: "step 3", sub: "carry out", icon: "wrench", col: "var(--accent)" },
    ],
    loops: false, loopLab: "re-plan only on failure",
    blurb: "Make a full plan first, then carry out each step in order.",
    fit: "Fits: well-understood tasks with predictable steps — far fewer model calls.",
    trade: "Trade-off: less adaptive mid-stream; a wrong early assumption isn't caught until it fails.",
  },
  reflect: {
    lab: "Reflection",
    nodes: [
      { k: "draft", lab: "draft", sub: "first answer", icon: "pen-line", col: "var(--accent)" },
      { k: "crit", lab: "critique", sub: "judge own work", icon: "search-check", col: "var(--concept-output)" },
      { k: "revise", lab: "revise", sub: "then finalize", icon: "check-check", col: "var(--concept-key)" },
    ],
    loops: true, loopLab: "loop until good enough",
    blurb: "Add a step where the model critiques its own output and revises before finalizing.",
    fit: "Fits: high-stakes output — code, proofs, long writing — where errors are worth catching.",
    trade: "Trade-off: extra critique and revision passes cost more tokens and latency.",
  },
};
const LOOP_ORDER = ["react", "plan", "reflect"];
function HarnessLoopPatterns() {
  const [sel, setSel] = React.useState("react");
  const P = LOOP_PATS[sel];
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        {LOOP_ORDER.map(k => <button key={k} className={sel === k ? "on" : ""} onClick={() => setSel(k)}>{LOOP_PATS[k].lab}</button>)}
      </div>
      <div className="fp-plate rd-plate lp-stage">
        <p className="lp-blurb">{P.blurb}</p>
        <div className="lp-flow">
          {P.nodes.map((n, i) => (
            <React.Fragment key={n.k}>
              <div className="lp-node" style={{ borderColor: n.col }}>
                <span className="lp-node-ic" style={{ color: n.col }}><Icon name={n.icon} size={16} stroke={1.9} /></span>
                <b>{n.lab}</b><span>{n.sub}</span>
              </div>
              {i < P.nodes.length - 1 ? <span className="lp-arrow"><Icon name="arrow-right" size={14} stroke={2.2} /></span> : null}
            </React.Fragment>
          ))}
          {P.loops ? <span className={"lp-return" + (P.nodes.length > 3 ? " lp-return--wide" : "")}><Icon name="rotate-ccw" size={12} stroke={2.2} />{P.loopLab}</span> : <span className="lp-once"><Icon name="corner-down-right" size={12} stroke={2.2} />{P.loopLab}</span>}
        </div>
        <div className="lp-lines">
          <div className="lp-line lp-fit"><Icon name="check" size={13} stroke={2.4} /><span>{P.fit}</span></div>
          <div className="lp-line lp-trade"><Icon name="scale" size={13} stroke={2.2} /><span>{P.trade}</span></div>
        </div>
      </div>
      <p className="dg-read">The loop from the last step was <b>ReAct</b> — but it's not the only shape. <b style={{ color: "var(--concept-query)" }}>ReAct</b> re-plans after every real result, robust but chatty. <b style={{ color: "var(--concept-query)" }}>Plan-execute</b> commits to a full plan up front — fewer model calls, less able to adapt mid-stream. <b style={{ color: "var(--concept-output)" }}>Reflection</b> adds a step where the model critiques and revises its own work before finalizing, catching errors at the cost of extra tokens and time. Same building blocks, arranged for different tasks.</p>
    </div>
  );
}

/* =================================================== 4 · ENVIRONMENT ====== */
/* The harness owns what surrounds the model: the filesystem is the most
   foundational primitive, plus code execution / sandboxes and the rest of the
   runtime it sets up. */
const HN_ENV = [
  { id: "fs", icon: "folder", lab: "Filesystem", role: "the foundation",
    body: "Durable storage the model can read and write. It outlives any single call, holds state too big for the context window, and is the shared workspace where several agents leave notes for one another. The most foundational primitive a harness gives a model." },
  { id: "exec", icon: "terminal", lab: "Code execution", role: "a sandbox to act in",
    body: "A place to actually run things — shell commands, scripts, generated code — walled off so a mistake stays contained. The model proposes; the sandbox carries it out and reports back what happened." },
  { id: "state", icon: "database", lab: "Runtime & state", role: "everything else around the model",
    body: "Sessions, working directories, environment variables, network access, the tools that are wired in. The harness stands all of this up before the model takes its first turn, and tears it down after the last." },
];
function HarnessEnv() {
  const [sel, setSel] = React.useState("fs");
  const cur = HN_ENV.find(x => x.id === sel);
  return (
    <div>
      <div className="fp-plate rd-plate hev-stage">
        <div className="hev-world">
          <span className="hev-world-lab">the environment the harness sets up</span>
          <div className="hev-prims">
            {HN_ENV.map(p => (
              <button key={p.id} className={"hev-prim" + (sel === p.id ? " is-on" : "")} onClick={() => setSel(p.id)}>
                <span className="hev-prim-ic"><Icon name={p.icon} size={16} stroke={2} /></span>
                <b>{p.lab}</b>
                <span className="hev-prim-role">{p.role}</span>
              </button>
            ))}
          </div>
          <div className="hev-model"><Icon name="brain" size={16} stroke={1.9} /><span>model runs inside</span></div>
        </div>
        <div className="hev-detail">
          <div className="hev-detail-head"><Icon name={cur.icon} size={15} stroke={2} /><b>{cur.lab}</b></div>
          <p>{cur.body}</p>
        </div>
      </div>
      <p className="dg-read">Beyond the loop, the harness <b>owns the environment</b> the model acts in. Of all its pieces the <b>filesystem</b> is the most foundational — durable storage, a release valve for an overflowing context window, and the meeting ground for multiple agents. Around it sit code execution and the rest of the runtime. The chapters ahead open up the parts that make this work: <b>tools &amp; MCP</b> for reaching the world, <b>orchestration</b> for coordinating many steps, and the <b>meta-harness</b> that tunes the scaffold itself.</p>
    </div>
  );
}

/* ============================================ 5 · HOOKS & REAL HARNESSES === */
/* Two threads in one step. First: hook points around the loop you can toggle
   on to intercept/augment without touching the model. Second: the machinery
   real agent CLIs (Claude Code, Codex CLI, opencode) bolt on around a model. */
const HN_HOOKS = [
  { id: "start", icon: "power", point: "SessionStart", at: 0,
    verb: "inject", tone: "ok",
    does: "Load project memory into context",
    detail: "Pull in an instructions file so the agent starts the session already knowing the repo." },
  { id: "submit", icon: "message-square", point: "UserPromptSubmit", at: 1,
    verb: "inject", tone: "ok",
    does: "Add repo context to the prompt",
    detail: "Attach the current branch, open files, or house rules to whatever the user just typed." },
  { id: "pre", icon: "shield", point: "PreToolUse", at: 2,
    verb: "block", tone: "err",
    does: "Deny  rm -rf /  before it runs",
    detail: "Inspect the proposed tool call and refuse the dangerous ones — the model never gets to touch the world." },
  { id: "post", icon: "sparkles", point: "PostToolUse", at: 3,
    verb: "run", tone: "ok",
    does: "Run the formatter after an edit",
    detail: "Right after a file write, lint or format it so every change lands clean — no reminder needed." },
  { id: "stop", icon: "flag", point: "Stop", at: 4,
    verb: "observe", tone: "ok",
    does: "Log the turn for review",
    detail: "When the agent goes to rest, record what happened so the run can be audited later." },
];
const HOOK_STAGES = [
  { k: "start", lab: "session start", icon: "power" },
  { k: "prompt", lab: "user prompt", icon: "message-square" },
  { k: "decide", lab: "model decides", icon: "brain" },
  { k: "tool", lab: "tool runs", icon: "wrench" },
  { k: "stop", lab: "stop", icon: "flag" },
];
function HarnessHooks() {
  const [on, setOn] = React.useState({});
  const anyOn = HN_HOOKS.some(h => on[h.id]);
  return (
    <div>
      <div className="hk-plate">
        <div className="hk-rail">
          {HOOK_STAGES.map((s, i) => {
            const hook = HN_HOOKS.find(h => h.at === i);
            const lit = hook && on[hook.id];
            return (
              <React.Fragment key={s.k}>
                <div className="hk-stagecol">
                  <div className="hk-stage">
                    <Icon name={s.icon} size={16} stroke={1.9} />
                    <span>{s.lab}</span>
                  </div>
                  {hook ? (
                    <button
                      className={"hk-tap" + (lit ? " is-on hk-" + hook.tone : "")}
                      onClick={() => setOn(o => ({ ...o, [hook.id]: !o[hook.id] }))}
                      aria-pressed={!!lit}>
                      <span className="hk-tap-dot" />
                      <Icon name={hook.icon} size={12} stroke={2} />
                      <code>{hook.point}</code>
                    </button>
                  ) : <span className="hk-tap hk-empty" aria-hidden="true" />}
                </div>
                {i < HOOK_STAGES.length - 1 ? <span className="hk-arrow"><Icon name="arrow-right" size={13} stroke={2} /></span> : null}
              </React.Fragment>
            );
          })}
        </div>
        <div className="hk-out">
          {anyOn ? HN_HOOKS.filter(h => on[h.id]).map(h => (
            <div key={h.id} className={"hk-fire hk-" + h.tone}>
              <span className="hk-fire-tag">{h.point}</span>
              <Icon name={h.tone === "err" ? "ban" : "arrow-right"} size={13} stroke={2.2} />
              <div className="hk-fire-txt"><b>{h.verb} · {h.does.trim()}</b><span>{h.detail}</span></div>
            </div>
          )) : (
            <div className="hk-idle"><Icon name="mouse-pointer-click" size={14} stroke={2} />Toggle a hook point on the loop to see what it injects, blocks, or runs.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* The moving parts a production harness adds around the bare model. Kept
   general on purpose — these are the kinds of mechanisms, not exact flags. */
const HN_MECH = [
  { id: "mem", icon: "file-text", lab: "Memory / instructions files",
    note: "Project notes injected into context every session — CLAUDE.md, AGENTS.md and friends." },
  { id: "slash", icon: "terminal", lab: "Slash commands",
    note: "Reusable prompts and shortcuts the user can invoke by name to kick off common flows." },
  { id: "sub", icon: "users", lab: "Sub-agents / agent teams",
    note: "Spawn focused helper agents for a subtask, each with its own context and remit." },
  { id: "mcp", icon: "plug", lab: "MCP servers",
    note: "A standard way to plug in external tools and data sources the model can then call." },
  { id: "sandbox", icon: "shield", lab: "Sandboxing & permissions",
    note: "Approval modes and isolation that gate what may run and what stays walled off." },
  { id: "hooks", icon: "git-merge", lab: "Hooks",
    note: "The lifecycle taps from the panel above — your code woven into the loop's seams." },
];
const HN_CLIS = [
  { id: "cc", name: "Claude Code", by: "Anthropic" },
  { id: "codex", name: "Codex CLI", by: "OpenAI" },
  { id: "oc", name: "opencode", by: "open source" },
];
function HarnessReal() {
  const [sel, setSel] = React.useState("mem");
  const cur = HN_MECH.find(m => m.id === sel);
  return (
    <div>
      <div className="hr-plate">
        <div className="hr-clis">
          <span className="hr-clis-lab">real agent CLIs, same shape</span>
          <div className="hr-cli-row">
            {HN_CLIS.map(c => (
              <div key={c.id} className="hr-cli">
                <Icon name="box" size={14} stroke={1.9} />
                <b>{c.name}</b><span>{c.by}</span>
              </div>
            ))}
          </div>
          <span className="hr-clis-foot">around a bare model, each bolts on the same kinds of machinery:</span>
        </div>
        <div className="hr-grid">
          {HN_MECH.map(m => (
            <button key={m.id} className={"hr-mech" + (sel === m.id ? " is-on" : "")} onClick={() => setSel(m.id)}>
              <span className="hr-mech-ic"><Icon name={m.icon} size={15} stroke={2} /></span>
              <b>{m.lab}</b>
            </button>
          ))}
        </div>
        <div className="hr-detail">
          <Icon name={cur.icon} size={15} stroke={2} />
          <p><b>{cur.lab}.</b> {cur.note}</p>
        </div>
      </div>
    </div>
  );
}

/* The woven step: hook points (interactive) above, real-CLI machinery below,
   joined by a single seam and one closing read. */
function HarnessHooksAndReal() {
  return (
    <div>
      <div className="fp-plate rd-plate hkr-stack">
        <div className="hkr-band"><span className="hkr-band-lab">1 · hooks — taps on the loop</span></div>
        <HarnessHooks />
        <div className="hkr-seam"><span>same machinery, real tools</span></div>
        <div className="hkr-band"><span className="hkr-band-lab">2 · the parts a production harness adds</span></div>
        <HarnessReal />
      </div>
      <p className="dg-read">A harness exposes <b>hook points</b> all around the loop — seams where your own code steps in <i>without retraining or even prompting the model</i>: <b style={{ color: "var(--ok-500)" }}>inject</b> context, <b style={{ color: "var(--ok-500)" }}>run</b> a formatter, quietly <b style={{ color: "var(--ok-500)" }}>observe</b>, or outright <b style={{ color: "var(--err-500)" }}>block</b> a dangerous call. And none of this is unique to one tool. <b>Claude Code</b>, OpenAI's <b>Codex CLI</b>, and <b>opencode</b> are the same idea — a model wrapped in a harness — converging on the same moving parts: instruction files that seed context, slash commands, sub-agents, <b>MCP</b> servers for tools, sandboxing with permission prompts, and hooks. Learn the parts in one harness and you've learned them all.</p>
    </div>
  );
}

/* ============================================ 6 · EVALS =================== */
/* A fixed task suite that re-grades pass/fail when you "ship a change". Two
   versions of the harness produce two scores; the gauge shows before→after.
   pass→--ok-500, fail→--err-500 only — never --fg1 on a hardcoded light fill. */
const EVAL_TASKS = [
  { id: "t1", lab: "Read a file & summarize", v0: true,  v1: true },
  { id: "t2", lab: "Fix the failing test",    v0: false, v1: true },
  { id: "t3", lab: "Multi-step refactor",     v0: false, v1: true },
  { id: "t4", lab: "Use the search tool",     v0: true,  v1: true },
  { id: "t5", lab: "Stop when blocked",       v0: true,  v1: false },
  { id: "t6", lab: "Stay in the sandbox",     v0: true,  v1: true },
];
function HarnessEvals() {
  const [shipped, setShipped] = React.useState(false);
  const key = shipped ? "v1" : "v0";
  const passN = EVAL_TASKS.filter(t => t[key]).length;
  const beforeN = EVAL_TASKS.filter(t => t.v0).length;
  const afterN = EVAL_TASKS.filter(t => t.v1).length;
  const total = EVAL_TASKS.length;
  return (
    <div>
      <div className="fp-plate rd-plate ev-stage">
        <div className="ev-head">
          <span className="ev-suite-lab"><Icon name="clipboard-check" size={14} stroke={2} />task suite · {total} fixed tasks</span>
          <span className="ev-score">
            <b style={{ color: passN === total ? "var(--ok-500)" : "var(--fg1)" }}>{passN}</b>
            <span> / {total} pass</span>
          </span>
        </div>
        <div className="ev-grid">
          {EVAL_TASKS.map(t => {
            const ok = t[key];
            const changed = t.v0 !== t.v1;
            return (
              <div key={t.id} className={"ev-task" + (ok ? " is-pass" : " is-fail") + (shipped && changed ? " is-changed" : "")}>
                <Icon name={ok ? "check" : "x"} size={13} stroke={2.6} />
                <span className="ev-task-lab">{t.lab}</span>
                <span className="ev-task-state">{ok ? "pass" : "fail"}</span>
              </div>
            );
          })}
        </div>
        <div className="ev-result">
          <span className="ev-result-lab">score</span>
          <span className="ev-before">{beforeN}/{total}</span>
          <Icon name="arrow-right" size={14} stroke={2.2} />
          <span className={"ev-after" + (afterN > beforeN ? " is-up" : afterN < beforeN ? " is-down" : "")}>{shipped ? afterN : "?"}{shipped ? "/" + total : ""}</span>
          {shipped ? <span className="ev-delta">{afterN > beforeN ? "+" : ""}{afterN - beforeN} net</span> : null}
        </div>
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={() => setShipped(true)} disabled={shipped}><Icon name="git-commit" size={14} stroke={2.2} />Ship a change</button>
        <button className="dg-btn" onClick={() => setShipped(false)} disabled={!shipped}><Icon name="rotate-ccw" size={14} stroke={2.2} />Reset</button>
      </div>
      <p className="dg-read">An agent is a loop over a <b>stochastic</b> model, so a small change — a reworded prompt, a new tool, a swapped model — ripples in ways you can't eyeball. <b>Evals</b> are how you tell whether it actually helped: a <b>fixed task suite</b> with automatic grading, re-run on every change. Ship one here and watch some tasks improve while another quietly <b style={{ color: "var(--err-500)" }}>regresses</b> — the kind of trade you'd never have spotted by hand. Public benchmarks like <b>terminal-bench</b> and web-agent suites do this at scale. The harness is engineering; evals are how you keep it honest.</p>
    </div>
  );
}

/* ================================================== CHAPTER CONFIG ========= */
const HARNESS_CH = {
  id: "harness-engineering", title: "Harness engineering", nextChapter: nextOf("harness-engineering"),
  steps: [
    { eyebrow: "STEP 01 · HARNESS ENGINEERING", title: "Agent = Model + Harness", navTitle: "What a harness is",
      lead: "A model only maps text to text. Everything that makes it feel like an agent is the harness around it.",
      Body: () => (<><p>We've spent the journey so far looking <i>inward</i> — the transformer, the trained model, the context it reads. This is the layer that wraps all of it. The <b>harness</b> is every piece of code, configuration, and execution logic that <i>isn't</i> the model.</p><p>On its own, a model is a closed loop of prediction: text in, text out. It can't keep state between calls, run code, or check anything in the real world. The harness is what bridges that gap — and turns a string of tokens into an action.</p></>),
      Diagram: HarnessAnatomy, caption: "The model is the sealed core; the harness is everything wrapped around it. Agent = Model + Harness." },
    { eyebrow: "STEP 02 · HARNESS ENGINEERING", title: "The agent loop", navTitle: "The agent loop",
      Body: () => (<><p>The harness's first job is to run the model <i>repeatedly</i>. A single call can only produce text; a task gets solved by feeding that text back in, over and over, with the world's response mixed in each time.</p><p>That cycle has a name — <b>ReAct</b>: the model reasons, selects a tool, the harness executes it, the observation is injected back into context, and the loop turns again. Run it and watch a task get solved.</p></>),
      Diagram: HarnessLoop, caption: "Think → act → observe → repeat. The harness, not the model, drives the cycle." },
    { eyebrow: "STEP 03 · HARNESS ENGINEERING", title: "Loop patterns", navTitle: "Loop patterns",
      Body: () => (<><p>ReAct is one shape the loop can take, not the only one. The same building blocks — reason, act, observe — rearrange into different patterns, and which one fits depends on the task.</p><p><b>ReAct</b> re-plans after every real result. <b>Plan-execute</b> commits to a full plan first, then runs it. <b>Reflection</b> adds a self-critique step before finalizing. Toggle between them to see each flow and what it trades.</p></>),
      Diagram: HarnessLoopPatterns, caption: "ReAct, plan-execute, reflection — same parts, arranged for adaptiveness, cost, or quality." },
    { eyebrow: "STEP 04 · HARNESS ENGINEERING", title: "The harness owns the environment", navTitle: "The environment",
      Body: () => (<><p>A loop needs something to act <i>on</i>. The harness builds and owns the whole environment the model lives in — and the most foundational primitive of all is the <b>filesystem</b>.</p><p>Durable storage that survives between calls, a place to offload state that won't fit in the context window, and a shared workspace where multiple agents can collaborate: the filesystem is all three at once. Around it the harness stands up code execution, sandboxes, and the rest of the runtime. Pick a primitive to see what it gives the model.</p></>),
      Diagram: HarnessEnv, caption: "The filesystem, a sandbox, and the runtime — the world the harness sets up before the model takes a turn." },
    { eyebrow: "STEP 05 · HARNESS ENGINEERING", title: "Hooks & real harnesses", navTitle: "Hooks & real harnesses",
      Body: () => (<><p>So far the loop has run untouched. But a good harness leaves <b>seams</b> in it — <b>hook points</b> where your own code can intervene before or after a tool call, when a prompt is submitted, at session start, or on stop. You don't change the model; you change what happens <i>around</i> each turn.</p><p>That's how a harness enforces policy, blocks a dangerous command, formats a file after an edit, injects fresh context, or just logs what happened. Toggle the hooks on the loop to see each one fire — then look at the real CLIs that ship this machinery.</p></>),
      Diagram: HarnessHooksAndReal, caption: "Hooks wrap the loop — inject, run, observe, or block; the same machinery real agent CLIs ship around the model." },
    { eyebrow: "STEP 06 · HARNESS ENGINEERING", title: "Evals", navTitle: "Evals",
      Body: () => (<><p>You've now seen the harness as something you <i>build</i> — a loop, an environment, hooks, real machinery. But there's a catch: an agent is a loop over a <b>stochastic</b> model, so a small change ripples in ways you can't predict by reading the diff.</p><p>Reword a prompt, add a tool, swap the model, and some tasks get better while others quietly break. <b>Evals</b> — fixed task suites with automatic grading — are how you actually tell. Ship a change here and watch the score move; benchmarks like <b>terminal-bench</b> and web-agent suites do the same at scale.</p></>),
      Diagram: HarnessEvals, caption: "A fixed task suite re-graded on every change. The harness is engineering; evals keep it honest." },
  ],
};

Object.assign(window, { HARNESS_CH });
