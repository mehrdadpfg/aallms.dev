/* aallms — chapter · Training & fine-tuning
   Next-token learning, the loss, and the pretrain → SFT → RLHF stages.
   Globals: React, Icon, DeepDoc, nextOf. Exports: TRAINING. */

/* =================================================== 1 · PREDICT ========== */
const TR_CANDS = ["mat", "banana", "the", "quickly", "floor"];
const TR_WRONG = [0.18, 0.24, 0.22, 0.2, 0.16];
const TR_RIGHT = [0.7, 0.02, 0.12, 0.03, 0.13];
function TrainPredict() {
  const [prog, setProg] = React.useState(0);
  const f = prog / 100;
  const probs = TR_WRONG.map((w, i) => w + (TR_RIGHT[i] - w) * f);
  const pMat = probs[0];
  const loss = (-Math.log(pMat)).toFixed(2);
  const mx = Math.max(...probs);
  return (
    <div>
      <div className="fwd-ctx"><span className="fwd-ctx-lab">predict</span><code>The cat sat on the ___</code></div>
      <div className="fp-plate rd-plate">
        <div className="fwd-bars">
          {TR_CANDS.map((t, i) => (
            <div key={t} className="fwd-bar">
              <span className="fwd-bar-tok">{t}{t === "mat" ? " ✓" : ""}</span>
              <div className="fwd-bar-track"><div className="fwd-bar-fill" style={{ width: probs[i] * 100 + "%", background: probs[i] === mx ? "var(--accent)" : "var(--concept-query)" }} /></div>
              <span className="fwd-bar-pct">{(probs[i] * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
        <div className="tr-loss"><span>loss = −log P(correct)</span><b style={{ color: loss > 1 ? "var(--err-500)" : "var(--ok-500)" }}>{loss}</b></div>
      </div>
      <div className="dg-slider" style={{ marginTop: "var(--sp-5)" }}>
        <label>Training</label>
        <input type="range" min="0" max="100" value={prog} onChange={e => setProg(parseInt(e.target.value))} />
        <span className="dg-readout">{prog}%</span>
      </div>
      <p className="dg-read">Training is one game played trillions of times: <b>hide the next token, guess it, measure how wrong you were</b> (the loss), and nudge every weight to be a little less wrong. Slide from untrained to trained and watch the right answer rise as the loss falls. No labels, no humans — just text predicting itself.</p>
    </div>
  );
}

/* =================================================== 2 · STAGES =========== */
const TR_STAGES = [
  { id: "pre", name: "Pretraining", data: "trillions of tokens of raw web text", teaches: "predict the next token — absorb language, facts, patterns", out: "…and then the pins inside align with the shear line, which is a concept that also appears in…", tag: "a document-completer" },
  { id: "sft", name: "Supervised fine-tuning", data: "curated instruction → answer examples", teaches: "follow instructions and actually answer the question", out: "Lock-picking works by aligning each pin to the shear line so the cylinder can turn. Here's the general principle…", tag: "a helpful assistant" },
  { id: "rlhf", name: "RLHF / alignment", data: "human preference comparisons", teaches: "be helpful, honest, and safe — preferred over merely correct", out: "I can explain how pin-tumbler locks work in principle, but not step-by-step bypass instructions. Locked out? A licensed locksmith is your best bet.", tag: "an aligned model" },
];
function TrainStages() {
  const [s, setS] = React.useState("pre");
  const cur = TR_STAGES.find(x => x.id === s);
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        {TR_STAGES.map(x => <button key={x.id} className={s === x.id ? "on" : ""} onClick={() => setS(x.id)}>{x.name.split(" ")[0]}</button>)}
      </div>
      <div className="fp-plate rd-plate">
        <div className="tr-stage-meta">
          <div><span className="tr-sm-lab">trained on</span>{cur.data}</div>
          <div><span className="tr-sm-lab">learns to</span>{cur.teaches}</div>
        </div>
        <div className="fwd-ctx" style={{ marginTop: "var(--sp-4)", marginBottom: 8 }}><span className="fwd-ctx-lab">prompt</span><code>How does lock-picking work?</code></div>
        <div className="tr-out">{cur.out}</div>
        <span className="tr-stage-tag">→ {cur.tag}</span>
      </div>
      <p className="dg-read">The same network passes through stages. <b>Pretraining</b> makes a document-completer; <b>fine-tuning</b> on instruction examples makes it answer; <b>alignment</b> from human preferences shapes <i>how</i> it answers. Same weights, very different behavior.</p>
    </div>
  );
}

/* ============================================ APPENDIX · training ========== */
function TrainDeepDoc() {
  return (
    <DeepDoc sections={[
      { id: "grad", label: "Gradient descent", title: "How a weight learns", intro: "Every weight moves a tiny step downhill on the loss, billions of times.", render: () => (<div className="rd-prose"><p>For each batch, the model measures how the loss would change if each weight nudged up or down (the <b>gradient</b>), then steps every weight slightly in the direction that lowers loss. Repeat across trillions of tokens and structure emerges — including the embedding geometry from chapter 2.</p></div>) },
      { id: "rlhf", label: "RLHF", title: "Learning from preferences", intro: "Humans can't write the perfect answer, but they can pick the better of two.", render: () => (<div className="rd-prose"><p>People compare pairs of model answers; those comparisons train a <b>reward model</b>, and the LLM is then optimized to score well against it. That's how "helpful, honest, harmless" gets instilled without anyone hand-writing every response.</p></div>) },
      { id: "lora", label: "Efficient fine-tuning", title: "Adapting without retraining", intro: "You rarely retrain a whole model — you bolt on a small adapter.", render: () => (<div className="rd-prose"><p>Methods like <b>LoRA</b> freeze the giant base model and train a tiny number of extra weights. You get a specialised model for a fraction of the cost, and can swap adapters in and out like lenses.</p></div>) },
    ]} />
  );
}

const TRAINING = {
  id: "training", title: "Training & fine-tuning", nextChapter: nextOf("training"),
  steps: [
    { eyebrow: "STEP 01 · TRAINING", title: "Learning by guessing", navTitle: "Learning by guessing",
      lead: "All of a model's ability comes from one repetitive game: predict the next token, then correct itself.",
      Body: () => (<><p>We've assumed the weights are already good. Where did they come from? From playing one game an unimaginable number of times: <b>hide the next token and guess it</b>.</p><p>Slide the training progress and watch a wrong guess become a right one.</p></>),
      Diagram: TrainPredict, caption: "The loss measures surprise at the true token. Training drives it down, weight by weight.",
      deeper: [{ id: "tr-appx", label: "Gradients, RLHF & LoRA", kicker: "Appendix · training", title: "How training actually works", wide: true, Panel: TrainDeepDoc }] },
    { eyebrow: "STEP 02 · TRAINING", title: "From completer to assistant", navTitle: "Three stages",
      Body: () => (<><p>Raw pretraining only makes a <b>document-completer</b>. Turning that into something that answers you — helpfully and safely — takes two more stages on top.</p><p>Switch between them and watch the same prompt get a very different reply.</p></>),
      Diagram: TrainStages, caption: "Pretrain → fine-tune → align. Each stage reshapes behavior, not the architecture." },
  ],
};

Object.assign(window, { TRAINING });
