/* aallms — chapter · Modern techniques
   Mixture-of-Experts routing and reasoning models.
   Globals: React, Icon, DeepDoc, nextOf. Exports: MODERN. */

/* FNV-1a hash with the expert id woven in early, so each token routes to a
   genuinely different pair of experts (a plain trailing digit made the score
   linear in e, which always picked the last two experts). */
function moeScore(t, e) { let h = 2166136261 >>> 0; const s = "e" + e + "::" + t; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h % 100; }

/* =================================================== 1 · MoE ============== */
const MOE_TOKENS = ["The", "cat", "runs", "swiftly", "home"];
const MOE_N = 8;
function MoE() {
  const [ti, setTi] = React.useState(1);
  const tok = MOE_TOKENS[ti];
  const scores = Array.from({ length: MOE_N }, (_, e) => ({ e, s: moeScore(tok, e) })).sort((a, b) => b.s - a.s);
  const chosen = new Set(scores.slice(0, 2).map(x => x.e));
  const total = scores.slice(0, 2).reduce((a, b) => a + b.s, 0);
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        {MOE_TOKENS.map((t, i) => <button key={i} className={ti === i ? "on" : ""} onClick={() => setTi(i)}>{t}</button>)}
      </div>
      <div className="fp-plate rd-plate">
        <div className="moe-router"><span className="emb-tok emb-tok--sm">{tok}</span><Icon name="arrow-right" size={16} stroke={2} /><span className="moe-rlab">router</span></div>
        <div className="moe-grid">
          {Array.from({ length: MOE_N }, (_, e) => {
            const on = chosen.has(e); const w = on ? Math.round(scores.find(x => x.e === e).s / total * 100) : 0;
            return <div key={e} className={"moe-exp" + (on ? " is-on" : "")}><span className="moe-exp-n">expert {e + 1}</span>{on ? <span className="moe-exp-w">{w}%</span> : <span className="moe-exp-off">idle</span>}</div>;
          })}
        </div>
      </div>
      <p className="dg-read">A <b>Mixture-of-Experts</b> layer holds many parallel "expert" networks but, for each token, a <b>router</b> activates only the top few (here 2 of 8). The model can hold enormous knowledge while only paying to run a slice of it per token. Pick different tokens — the routing changes.</p>
    </div>
  );
}

/* =================================================== 2 · REASONING ======== */
const RE_TRACE = [
  "The question asks for r's in \"strawberry\".",
  "Spell it: s-t-r-a-w-b-e-r-r-y.",
  "Mark the r's: position 3, 8, 9.",
  "Count them: that's 3.",
];
function Reasoning() {
  const [show, setShow] = React.useState(true);
  const [budget, setBudget] = React.useState(75);
  const shownSteps = Math.max(1, Math.round(budget / 100 * RE_TRACE.length));
  const acc = Math.round(40 + 55 * (1 - Math.pow(1 - budget / 100, 1.5)));
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="fwd-ctx" style={{ marginBottom: 10 }}><span className="fwd-ctx-lab">prompt</span><code>How many r's in "strawberry"?</code></div>
        {show ? (
          <div className="re-think">
            <span className="re-think-lab"><Icon name="brain" size={12} stroke={2} /> thinking ({shownSteps} steps)</span>
            {RE_TRACE.slice(0, shownSteps).map((t, i) => <div key={i} className="re-think-line">{t}</div>)}
          </div>
        ) : <div className="re-hidden">— reasoning hidden —</div>}
        <div className="re-answer"><span className="re-ans-lab">answer</span><b>{budget < 40 ? "2" : "3"}</b></div>
      </div>
      <div className="dg-controls">
        <label className="switch"><input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} /><span className="switch-track"><span className="switch-knob" /></span>Show thinking</label>
        <div className="dg-slider"><label>Think budget</label><input type="range" min="0" max="100" value={budget} onChange={e => setBudget(parseInt(e.target.value))} /><span className="dg-readout">{acc}% acc</span></div>
      </div>
      <p className="dg-read">A <b>reasoning model</b> spends extra tokens working through a problem <i>before</i> answering — a private scratchpad the user usually doesn't see. More thinking budget buys more accuracy on hard problems, up to a point. Give it too little and it rushes to the wrong answer.</p>
    </div>
  );
}

/* ============================================ APPENDIX · modern =========== */
function ModernDeepDoc() {
  return (
    <DeepDoc sections={[
      { id: "moe", label: "Why MoE", title: "Capacity without the cost", intro: "Experts let a model grow its knowledge without growing its per-token compute.", render: () => (<div className="rd-prose"><p>A dense model uses every weight on every token. An <b>MoE</b> model can have 10× the parameters but route each token through only a couple of experts — so it's far cheaper to run than its size suggests. The trade-off is memory and the routing's own quirks (load balancing across experts).</p></div>) },
      { id: "reason", label: "How reasoning is trained", title: "Rewarding the right answer", intro: "Reasoning ability is largely taught with reinforcement learning on checkable problems.", render: () => (<div className="rd-prose"><p>Take problems with verifiable answers (math, code), let the model generate long chains of thought, and reward the chains that reach the correct result. Over time it learns to <b>think before answering</b> — and to think longer when a problem is hard.</p></div>) },
      { id: "ctx", label: "Longer context", title: "Stretching the window", intro: "Position tricks let models read far more than they were trained on.", render: () => (<div className="rd-prose"><p>Because modern models use rotary positions (RoPE), the rotation can be <b>interpolated</b> to handle far longer sequences than training used — pushing context windows from thousands to millions of tokens, though quality still sags in the middle.</p></div>) },
    ]} />
  );
}

const MODERN = {
  id: "modern", title: "Modern techniques", nextChapter: nextOf("modern"),
  steps: [
    { eyebrow: "STEP 01 · MODERN TECHNIQUES", title: "Many experts, a few at a time", navTitle: "Mixture of Experts",
      lead: "The plain transformer is the foundation. The frontier adds tricks for scale and for thinking.",
      Body: () => (<><p>The biggest models today aren't one dense network. They're a <b>Mixture of Experts</b>: many specialist sub-networks, with a router that picks just a couple for each token.</p><p>Choose a token and see which experts light up.</p></>),
      Diagram: MoE, caption: "Only the top-2 experts run per token — huge capacity, modest per-token cost.",
      deeper: [{ id: "mod-appx", label: "MoE, reasoning & long context", kicker: "Appendix · modern", title: "Frontier techniques", wide: true, Panel: ModernDeepDoc }] },
    { eyebrow: "STEP 02 · MODERN TECHNIQUES", title: "Thinking before answering", navTitle: "Reasoning models",
      Body: () => (<><p>A <b>reasoning model</b> doesn't blurt the first token of an answer. It first writes out a chain of intermediate steps — a scratchpad — and only then commits.</p><p>Adjust how much it's allowed to think, and toggle whether you see the scratchpad.</p></>),
      Diagram: Reasoning, caption: "More thinking tokens, more accuracy on hard problems — at the cost of latency." },
  ],
};

Object.assign(window, { MODERN });
