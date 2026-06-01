/* aallms — chapter · Reasoning models
   Test-time compute, how reasoning is trained, and hidden chains of thought.
   Globals: React, Icon, DeepDoc, nextOf. Exports: REASONING_CH. */

/* =================================================== 1 · BUDGET =========== */
function RlmBudget() {
  const [budget, setBudget] = React.useState(2000);
  // Accuracy: saturating curve — buys you accuracy with diminishing returns.
  const acc = Math.round(38 + 56 * (1 - Math.exp(-budget / 2400)));
  // Latency and cost scale roughly linearly with thinking tokens.
  const latency = (0.4 + budget / 1000 * 1.7).toFixed(1);
  const cost = (budget / 1000 * 0.9 + 0.2).toFixed(2);
  // SVG curve points across the full budget range.
  const MAXB = 8000, W = 320, H = 120, PAD = 6;
  const pts = Array.from({ length: 41 }).map((_, i) => {
    const b = (i / 40) * MAXB;
    const a = 38 + 56 * (1 - Math.exp(-b / 2400));
    const x = PAD + (b / MAXB) * (W - 2 * PAD);
    const y = H - PAD - ((a - 30) / 70) * (H - 2 * PAD);
    return [x, y];
  });
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const nowX = PAD + (Math.min(budget, MAXB) / MAXB) * (W - 2 * PAD);
  const nowY = H - PAD - ((acc - 30) / 70) * (H - 2 * PAD);
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="ttc-head">
          <span className="ttc-head-lab"><Icon name="brain" size={13} stroke={2} />thinking budget</span>
          <b className="ttc-head-tok">{budget.toLocaleString()} tokens</b>
        </div>
        <svg className="ttc-svg" viewBox={"0 0 " + W + " " + H} preserveAspectRatio="none" role="img" aria-label="accuracy vs thinking budget curve">
          <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} className="ttc-axis" />
          <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} className="ttc-axis" />
          <path d={path + " L " + nowX.toFixed(1) + " " + (H - PAD) + " L " + PAD + " " + (H - PAD) + " Z"} className="ttc-area" />
          <path d={path} className="ttc-line" />
          <line x1={nowX} y1={PAD} x2={nowX} y2={H - PAD} className="ttc-now" />
          <circle cx={nowX} cy={nowY} r="4.5" className="ttc-dot" />
        </svg>
        <div className="ttc-axlab"><span>accuracy ↑</span><span>more thinking →</span></div>
        <div className="ttc-reads">
          <div className="ttc-read"><span className="ttc-read-lab">accuracy</span><b className="ttc-read-v" style={{ color: "var(--ok-500)" }}>{acc}%</b></div>
          <div className="ttc-read"><span className="ttc-read-lab">latency</span><b className="ttc-read-v" style={{ color: "var(--warn-500)" }}>{latency}s</b></div>
          <div className="ttc-read"><span className="ttc-read-lab">cost / answer</span><b className="ttc-read-v" style={{ color: "var(--err-500)" }}>${cost}</b></div>
        </div>
      </div>
      <div className="dg-slider" style={{ marginTop: "var(--sp-5)" }}>
        <label>Thinking budget</label>
        <input type="range" min="100" max="8000" step="100" value={budget} onChange={e => setBudget(parseInt(e.target.value))} />
        <span className="dg-readout">{budget < 1200 ? "terse" : budget < 4000 ? "deliberate" : "exhaustive"}</span>
      </div>
      <p className="dg-read">Make the model think longer and accuracy climbs — but with <b>diminishing returns</b>, while latency and cost rise steadily. This is <b>test-time compute</b>: for an RLM you can <i>buy</i> accuracy at answer time, a scaling axis separate from making the model bigger. Slide the budget and watch the trade-off move.</p>
    </div>
  );
}

/* =================================================== 2 · RLVR ============== */
const RLVR_CHAINS = [
  { id: 0, steps: ["2x = 0.10", "x = 0.05"], ans: "$0.05", ok: true },
  { id: 1, steps: ["bat = 1.00", "ball = 0.10"], ans: "$0.10", ok: false },
  { id: 2, steps: ["x + (x+1) = 1.10", "x = 0.05"], ans: "$0.05", ok: true },
  { id: 3, steps: ["1.10 − 1.00", "= 0.10"], ans: "$0.10", ok: false },
];
function RlmRlvr() {
  const [phase, setPhase] = React.useState(0); // 0 idle, 1 sampled, 2 graded
  const sampled = phase >= 1;
  const graded = phase >= 2;
  const next = () => setPhase(p => Math.min(2, p + 1));
  return (
    <div>
      <div className="fwd-ctx" style={{ marginBottom: "var(--sp-4)" }}><span className="fwd-ctx-lab">problem</span><code>ball = ?  (verifiable answer: $0.05)</code></div>
      <div className="fp-plate rd-plate">
        <div className="rlvr-grid">
          {RLVR_CHAINS.map(c => (
            <div key={c.id} className={"rlvr-chain" + (sampled ? " in" : "") + (graded ? (c.ok ? " keep" : " drop") : "")} style={{ transitionDelay: (c.id * 70) + "ms" }}>
              <div className="rlvr-chain-head">chain {c.id + 1}</div>
              {sampled ? c.steps.map((s, i) => <div key={i} className="rlvr-step">{s}</div>) : <div className="rlvr-step rlvr-dim">sampling…</div>}
              <div className={"rlvr-ans" + (graded ? (c.ok ? " ok" : " no") : "")}>
                {c.ans}
                {graded ? <Icon name={c.ok ? "check" : "x"} size={13} stroke={2.6} /> : null}
              </div>
              {graded ? <div className={"rlvr-tag " + (c.ok ? "rew" : "pen")}>{c.ok ? "+ reward" : "no reward"}</div> : null}
            </div>
          ))}
        </div>
        {graded ? <div className="rlvr-verdict"><Icon name="git-merge" size={14} stroke={2} />Gradients pull the model toward the <b>verified-correct</b> chains.</div> : null}
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={next} disabled={graded}>
          <Icon name={phase === 0 ? "shuffle" : "check-check"} size={14} stroke={2.2} />
          {phase === 0 ? "Sample chains" : "Grade & reward"}
        </button>
        <button className="dg-btn" onClick={() => setPhase(0)}><Icon name="rotate-ccw" size={14} stroke={2.2} />Reset</button>
      </div>
      <p className="dg-read">Reasoning is learned with <b>verifiable rewards</b> (RLVR): sample many candidate chains for a problem whose answer can be <i>checked</i>, then reinforce only the ones that land on the right result. No human grades each step — the checker does. Over millions of problems, the model learns to think in ways that actually <i>work</i>. Sample, then grade.</p>
    </div>
  );
}

/* ============================================ APPENDIX · rlm =============== */
function RlmDeepDoc() {
  return (
    <DeepDoc sections={[
      { id: "ttc", label: "Test-time compute", title: "Paying with thinking, not size", intro: "RLMs trade a bigger model for more computation at answer time.", render: () => (<div className="rd-prose"><p>Instead of only scaling parameters, reasoning models scale <b>test-time compute</b> — they're allowed to generate long internal chains before answering. More thinking tokens reliably improves hard-problem accuracy, a different axis of scaling than just "make the model bigger".</p></div>) },
      { id: "train", label: "How they're trained", title: "Reward the correct chain", intro: "Reasoning is learned with RL on problems that can be checked.", render: () => (<div className="rd-prose"><p>Take math and coding tasks with verifiable answers, let the model produce many long reasoning attempts, and reinforce the ones that reach the right result. The model learns to think in a way that <i>works</i> — not just sounds plausible.</p></div>) },
      { id: "hide", label: "Hidden vs shown", title: "Why you often can't see it", intro: "The reasoning trace is usually kept private.", render: () => (<div className="rd-prose"><p>Providers often hide the raw chain of thought — it can be messy, and exposing it has safety and competitive downsides. You typically see a clean final answer (and sometimes a tidied summary of the reasoning), not the full scratchpad.</p></div>) },
    ]} />
  );
}

/* =================================================== 3 · HIDDEN =========== */
function RlmHidden() {
  const [show, setShow] = React.useState(false);
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="hid-stack">
          <div className={"hid-cot" + (show ? " is-open" : "")}>
            <div className="hid-cot-head"><Icon name={show ? "eye" : "eye-off"} size={13} stroke={2} /><span>raw chain of thought</span><span className="hid-cot-tag">{show ? "exposed" : "hidden by provider"}</span></div>
            {show ? (
              <div className="hid-cot-body">
                <div className="hid-line">Let the ball cost x…</div>
                <div className="hid-line">bat = x + 1.00, so 2x + 1.00 = 1.10</div>
                <div className="hid-line">wait — recheck: 2x = 0.10</div>
                <div className="hid-line">x = 0.05 ✓</div>
              </div>
            ) : (
              <div className="hid-cot-body hid-masked">
                <span className="hid-dots">• • • • • • • • • • •</span>
                <span className="hid-dots">• • • • • • • •</span>
                <span className="hid-dots">• • • • • • • • • •</span>
              </div>
            )}
          </div>
          <div className="hid-arrow"><Icon name="arrow-down" size={15} stroke={2.2} /></div>
          <div className="hid-out">
            <span className="hid-out-lab">what you see</span>
            <div className="hid-out-ans">The ball costs <b>$0.05</b>.</div>
          </div>
        </div>
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={() => setShow(s => !s)}>
          <Icon name={show ? "eye-off" : "eye"} size={14} stroke={2.2} />
          {show ? "Hide the trace" : "Reveal the trace"}
        </button>
      </div>
      <p className="dg-read">In practice the model's working is usually a <b>private scratchpad</b>. Providers often hide the raw chain of thought — it can be messy, wander, and exposing it carries safety and competitive downsides. You get a clean final answer, sometimes with a tidied summary of the reasoning, but rarely the full trace. Toggle it to see what's normally kept behind the curtain.</p>
    </div>
  );
}

/* ================================================== CHAPTER CONFIG ========= */
const REASONING_CH = {
  id: "reasoning-models", title: "Reasoning models", nextChapter: nextOf("reasoning-models"),
  steps: [
    { eyebrow: "STEP 01 · REASONING MODELS", title: "Buy accuracy with thinking", navTitle: "Thinking budget",
      lead: "Scaling a model isn't only about parameters. An RLM has a second dial — how long it's allowed to think.",
      Body: () => (<><p>A reasoning model can spend more or fewer tokens <i>before</i> it answers. That budget is a knob you control at answer time: more thinking, more accuracy — up to a point — but also more latency and more cost.</p><p>Drag the thinking budget and watch all three move together.</p></>),
      Diagram: RlmBudget, caption: "Accuracy rises with thinking, but with diminishing returns — while latency and cost keep climbing.",
      deeper: [{ id: "rlm-appx", label: "Test-time compute & training", kicker: "Appendix · RLMs", title: "How reasoning models work", wide: true, Panel: RlmDeepDoc }] },
    { eyebrow: "STEP 02 · REASONING MODELS", title: "How reasoning is learned", navTitle: "Verifiable rewards",
      Body: () => (<><p>Where does the habit of thinking come from? Not from imitating human scratchpads — from <b>reinforcement learning on verifiable problems</b>. The model samples many reasoning chains, and the ones that reach a checkably-correct answer get reinforced.</p><p>Sample several chains, then grade them and see which get rewarded.</p></>),
      Diagram: RlmRlvr, caption: "Many chains are sampled; only the verified-correct ones earn reward and shape the weights." },
    { eyebrow: "STEP 03 · REASONING MODELS", title: "The trace you don't see", navTitle: "Hidden thinking",
      Body: () => (<><p>All that thinking happens somewhere — but you usually can't read it. Providers tend to keep the raw chain of thought <b>private</b>, surfacing only a clean answer or a tidied summary.</p><p>Toggle the trace to see what normally stays hidden.</p></>),
      Diagram: RlmHidden, caption: "The raw reasoning is usually masked; you receive the polished result." },
  ],
};

Object.assign(window, { REASONING_CH });
