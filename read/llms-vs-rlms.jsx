/* aallms — chapter · LLMs vs RLMs
   Answer-now models vs reason-first models, and when to use each.
   Globals: React, Icon, nextOf. Exports: LLMRLM. */

/* =================================================== 1 · COMPARE ========== */
const RLM_TRACE = [
  "Let the ball cost x dollars.",
  "Then the bat costs x + 1.00.",
  "Together: x + (x + 1.00) = 1.10.",
  "So 2x = 0.10, meaning x = 0.05.",
];
function RlmCompare() {
  const [step, setStep] = React.useState(0);
  const done = step >= RLM_TRACE.length;
  return (
    <div>
      <div className="fwd-ctx" style={{ marginBottom: "var(--sp-4)" }}><span className="fwd-ctx-lab">prompt</span><code>A bat and ball cost $1.10. The bat costs $1 more than the ball. How much is the ball?</code></div>
      <div className="rl-cols">
        <div className="rl-col">
          <div className="rl-col-head"><span className="rl-badge llm">LLM</span>answers immediately</div>
          <div className="rl-ans wrong"><b>$0.10</b><Icon name="x" size={15} stroke={2.5} /></div>
          <p className="rl-note">Fast, fluent — and wrong. It pattern-matches to the obvious-looking answer.</p>
        </div>
        <div className="rl-col">
          <div className="rl-col-head"><span className="rl-badge rlm">RLM</span>thinks first</div>
          <div className="rl-think">
            {RLM_TRACE.slice(0, step).map((t, i) => <div key={i} className="rl-think-line">{t}</div>)}
            {!done ? <button className="rl-think-btn" onClick={() => setStep(s => s + 1)}><Icon name="brain" size={13} stroke={2} />{step === 0 ? "Let it think" : "Next step"}</button> : null}
          </div>
          {done ? <div className="rl-ans right"><b>$0.05</b><Icon name="check" size={15} stroke={2.5} /></div> : null}
        </div>
      </div>
      <p className="dg-read">Same engine, same prompt. An <b>LLM</b> emits the answer token-by-token with no scratchpad and often takes the bait. A <b>reasoning model (RLM)</b> spends tokens reasoning first — slower, but it catches the trap. Step its thinking and watch it arrive at the right answer.</p>
    </div>
  );
}

/* =================================================== 2 · WHEN ============= */
const RLM_TASKS = {
  quick: { label: "Quick fact", llm: { spd: 95, acc: 96 }, rlm: { spd: 35, acc: 97 }, note: "For easy questions the LLM is just as accurate and far faster. Reasoning is wasted latency and cost." },
  hard: { label: "Hard reasoning", llm: { spd: 95, acc: 52 }, rlm: { spd: 30, acc: 91 }, note: "For multi-step problems, the RLM's thinking pays for itself — far more accurate, even though each answer is slower." },
};
function RlmWhen() {
  const [t, setT] = React.useState("hard");
  const cur = RLM_TASKS[t];
  const Bars = ({ who, d, col }) => (
    <div className="rl-when-row"><span className="rl-when-who" style={{ color: col }}>{who}</span>
      <div className="rl-when-bars">
        <div className="q-mini"><span className="q-mini-lab">speed</span><div className="q-mini-track"><div className="q-mini-fill" style={{ width: d.spd + "%", background: col }} /></div></div>
        <div className="q-mini"><span className="q-mini-lab">accuracy</span><div className="q-mini-track"><div className="q-mini-fill" style={{ width: d.acc + "%", background: col }} /></div></div>
      </div>
    </div>
  );
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        {Object.keys(RLM_TASKS).map(k => <button key={k} className={t === k ? "on" : ""} onClick={() => setT(k)}>{RLM_TASKS[k].label}</button>)}
      </div>
      <div className="fp-plate rd-plate">
        <Bars who="LLM" d={cur.llm} col="var(--concept-key)" />
        <Bars who="RLM" d={cur.rlm} col="var(--concept-output)" />
      </div>
      <p className="dg-read">{cur.note}</p>
    </div>
  );
}

/* =================================================== 3 · BRIDGE =========== */
function RlmBridge() {
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="brg-flow">
          <div className="brg-node">
            <span className="brg-node-ic"><Icon name="message-square" size={16} stroke={2} /></span>
            <span className="brg-node-lab">prompt</span>
          </div>
          <span className="brg-arrow"><Icon name="arrow-right" size={15} stroke={2.2} /></span>
          <div className="brg-node brg-think">
            <span className="brg-node-ic"><Icon name="brain" size={16} stroke={2} /></span>
            <span className="brg-node-lab">hidden thinking</span>
            <span className="brg-node-sub">costs tokens · time · money</span>
          </div>
          <span className="brg-arrow"><Icon name="arrow-right" size={15} stroke={2.2} /></span>
          <div className="brg-node">
            <span className="brg-node-ic"><Icon name="check" size={16} stroke={2} /></span>
            <span className="brg-node-lab">answer</span>
          </div>
        </div>
        <div className="brg-asks">
          <div className="brg-ask"><Icon name="gauge" size={14} stroke={2} /><span>How much does thinking cost — and can you dial it?</span></div>
          <div className="brg-ask"><Icon name="git-merge" size={14} stroke={2} /><span>Where does the habit of thinking even come from?</span></div>
        </div>
      </div>
      <p className="dg-read">That middle box — the <b>thinking</b> — is the whole story of a reasoning model. It isn't free: every reasoning token is latency and cost, and the trace is usually hidden from you. The next chapter, <b>Reasoning models</b>, opens that box: how you can <i>buy</i> accuracy with more thinking, and how the habit is trained in the first place.</p>
    </div>
  );
}

/* ================================================== CHAPTER CONFIG ========= */
const LLMRLM = {
  id: "llms-vs-rlms", title: "LLMs vs RLMs", nextChapter: nextOf("llms-vs-rlms"),
  steps: [
    { eyebrow: "STEP 01 · LLMS VS RLMS", title: "Answer now, or think first", navTitle: "Answer vs think",
      lead: "Zoom out one shell. The same transformer core powers two very different kinds of model.",
      Body: () => (<><p>Everything so far describes a <b>large language model</b> — given context, predict the next token, fast. A <b>reasoning language model</b> is the same machine trained to do something extra: spend tokens <i>thinking</i> before it answers.</p><p>Watch them tackle a classic trick question.</p></>),
      Diagram: RlmCompare, caption: "The LLM takes the bait; the RLM reasons past it. Same weights-shaped engine, different habit." },
    { eyebrow: "STEP 02 · LLMS VS RLMS", title: "Which one, when?", navTitle: "Which one, when?",
      Body: () => (<><p>Reasoning isn't always better — it's slower and costs more tokens. The right choice depends entirely on the task.</p><p>Compare the two on an easy lookup versus a hard multi-step problem.</p></>),
      Diagram: RlmWhen, caption: "Match the model to the task: speed for the easy, deliberation for the hard." },
    { eyebrow: "STEP 03 · LLMS VS RLMS", title: "What thinking costs", navTitle: "Into reasoning",
      lead: "An RLM buys its accuracy with a hidden middle step — and that step has a price.",
      Body: () => (<><p>The difference between the two models lives entirely in one place: the <b>thinking</b> that happens before the answer. It's powerful, but it isn't free — every reasoning token adds latency and cost, and you usually never see the trace itself.</p><p>That raises two questions the next chapter answers in full: what thinking costs and how to control it, and how a model ever learns to think.</p></>),
      Diagram: RlmBridge, caption: "The hidden thinking step is where reasoning models earn their accuracy — and spend their budget." },
  ],
};

Object.assign(window, { LLMRLM });
