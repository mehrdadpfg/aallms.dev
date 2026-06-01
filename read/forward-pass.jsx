/* aallms — chapter · The forward pass
   Stack of blocks → a sharpening prediction → logits → softmax → next token.
   Globals: React, Icon, DeepDoc, nextOf. Exports: FORWARD. */

function fwdMix(a, b, t) { return a.map((x, i) => x + (b[i] - x) * t); }
function fwdNorm(v) { const s = v.reduce((a, b) => a + b, 0); return v.map(x => x / s); }

/* =================================================== 1 · FLOW ============= */
function FwdFlow() {
  const toks = ["The", "cat", "sat"];
  return (
    <div>
      <div className="fp-plate rd-plate fwd-flow">
        <div className="fwd-col"><span className="fwd-coltag">input vectors</span>{toks.map((t, i) => <span key={i} className="emb-tok emb-tok--sm">{t}</span>)}</div>
        <div className="fwd-pipe">
          {[0, 1, 2].map(i => <div key={i} className="fwd-block" style={{ animationDelay: i * 0.4 + "s" }}><span>block {i + 1}</span><em>attention + FFN</em></div>)}
          <div className="fwd-dots">⋯ × N</div>
        </div>
        <div className="fwd-col"><span className="fwd-coltag">next token</span><span className="emb-tok emb-tok--out">on</span></div>
      </div>
      <p className="dg-read">The vectors enter a <b>stack of identical blocks</b>. Each block lets tokens attend to one another, then refines every token with a small network. Same shape in, same shape out — so the model just stacks the block dozens of times. Only the <b>last position's</b> vector is used to predict what comes next.</p>
    </div>
  );
}

/* =================================================== 2 · LAYERS (scrub) === */
const FWD_CANDS = ["mat", "floor", "rug", "couch", "ground"];
const FWD_FINAL = [0.6, 0.16, 0.12, 0.07, 0.05];
const FWD_LMAX = 12;
function FwdLayers() {
  const [L, setL] = React.useState(0);
  const f = Math.pow(L / FWD_LMAX, 1.4);
  const uniform = FWD_CANDS.map(() => 1 / FWD_CANDS.length);
  const probs = fwdNorm(fwdMix(uniform, FWD_FINAL, f));
  const order = probs.map((p, i) => ({ p, t: FWD_CANDS[i] })).sort((a, b) => b.p - a.p);
  const top = order[0];
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="fwd-bars">
          {FWD_CANDS.map((t, i) => (
            <div key={t} className="fwd-bar">
              <span className="fwd-bar-tok">{t}</span>
              <div className="fwd-bar-track"><div className="fwd-bar-fill" style={{ width: probs[i] * 100 + "%", background: (f > 0.06 && probs[i] === Math.max(...probs)) ? "var(--accent)" : "var(--concept-query)" }} /></div>
              <span className="fwd-bar-pct">{(probs[i] * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="dg-slider" style={{ marginTop: "var(--sp-5)" }}>
        <label>Layer</label>
        <input type="range" min="0" max={FWD_LMAX} step="1" value={L} onChange={e => setL(parseInt(e.target.value))} />
        <span className="dg-readout">{L === 0 ? "embed" : L + " / " + FWD_LMAX}</span>
      </div>
      <p className="dg-read">Peek at the model's guess <b>after each layer</b> (the "logit lens"). Early on it's nearly a coin-flip; layer by layer the evidence accumulates until it commits. {L === 0 ? <>At the <b>embedding</b>, before any block has run, every candidate is about equally likely.</> : <>By layer <b>{L}</b> the best guess is <b>"{top.t}"</b> at {(top.p * 100).toFixed(0)}%{L >= FWD_LMAX ? " — decided" : ""}.</>}</p>
    </div>
  );
}

/* =================================================== 3 · SOFTMAX ========== */
const FWD_CTX = [
  { id: "sat", ctx: "The cat sat on the", cands: [["mat", 0.55], ["floor", 0.18], ["rug", 0.14], ["sofa", 0.08], ["roof", 0.05]] },
  { id: "paris", ctx: "The capital of France is", cands: [["Paris", 0.86], ["a", 0.05], ["the", 0.04], ["located", 0.03], ["home", 0.02]] },
  { id: "code", ctx: "def add(a, b):\\n    return", cands: [["a", 0.42], ["sum", 0.22], ["(", 0.16], ["result", 0.12], ["b", 0.08]] },
];
function FwdSoftmax() {
  const [c, setC] = React.useState("sat");
  const cur = FWD_CTX.find(x => x.id === c);
  const mx = Math.max(...cur.cands.map(x => x[1]));
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        {FWD_CTX.map(x => <button key={x.id} className={c === x.id ? "on" : ""} onClick={() => setC(x.id)}>{x.id}</button>)}
      </div>
      <div className="fwd-ctx"><span className="fwd-ctx-lab">context</span><code>{cur.ctx.replace("\\n", "↵")}</code><span className="fwd-ctx-cursor">▮</span></div>
      <div className="fp-plate rd-plate">
        <div className="fwd-bars">
          {cur.cands.map(([t, p]) => (
            <div key={t} className="fwd-bar">
              <span className="fwd-bar-tok">{t}</span>
              <div className="fwd-bar-track"><div className="fwd-bar-fill" style={{ width: p * 100 + "%", background: p === mx ? "var(--accent)" : "var(--concept-query)" }} /></div>
              <span className="fwd-bar-pct">{(p * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
      <p className="dg-read">The final vector is multiplied by the vocabulary to score <b>every possible next token</b>, and softmax turns those scores into probabilities. The model isn't certain — it produces a <b>distribution</b>. How we pick from it is the job of <i>sampling</i> (the Inference chapter).</p>
    </div>
  );
}

/* =================================================== 4 · LOOP ============= */
const FWD_GEN = ["The", " cat", " sat", " on", " the", " mat", "."];
function FwdLoop() {
  const [n, setN] = React.useState(3);
  const [playing, setPlaying] = React.useState(false);
  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setN(v => { if (v >= FWD_GEN.length) { setPlaying(false); return v; } return v + 1; }), 650);
    return () => clearInterval(id);
  }, [playing]);
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="fwd-gen">
          {FWD_GEN.slice(0, n).map((t, i) => <span key={i} className={"fwd-gentok" + (i === n - 1 ? " is-new" : "")}>{t}</span>)}
          {n < FWD_GEN.length ? <span className="fwd-caret">▮</span> : <span className="fwd-done">done</span>}
        </div>
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={() => { if (n >= FWD_GEN.length) setN(1); setPlaying(p => !p); }}><Icon name={playing ? "pause" : "play"} size={14} stroke={2.2} />{playing ? "Pause" : "Generate"}</button>
        <button className="dg-btn" onClick={() => { setPlaying(false); setN(v => Math.min(FWD_GEN.length, v + 1)); }} disabled={n >= FWD_GEN.length}><Icon name="step-forward" size={14} stroke={2.2} />One token</button>
        <button className="dg-btn" onClick={() => { setPlaying(false); setN(1); }}><Icon name="rotate-ccw" size={14} stroke={2.2} />Reset</button>
      </div>
      <p className="dg-read">One forward pass predicts <b>one token</b>. To write a sentence, the model appends its pick to the input and <b>runs the whole pass again</b> — over and over. That loop is what "generating" actually is, and it's why longer answers cost more.</p>
    </div>
  );
}

/* ============================================ APPENDIX · forward pass ====== */
function FwdDeepDoc() {
  return (
    <DeepDoc sections={[
      { id: "res", label: "The residual stream", title: "A shared highway of meaning", intro: "Each block doesn't replace the vector — it adds to it.", render: () => (<div className="rd-prose"><p>Every block <b>adds</b> its output back onto the token's vector rather than overwriting it. This "residual stream" is a running tally that each layer reads from and writes to, so information can travel untouched from the bottom to the top when it needs to.</p><p>It's also what makes very deep stacks trainable at all — gradients have a clean path back down.</p></div>) },
      { id: "lens", label: "The logit lens", title: "Reading a half-formed thought", intro: "You can decode the prediction at any depth, not just the end.", render: () => (<div className="rd-prose"><p>Because the residual stream lives in the same space as the output, you can apply the final unembedding to an <i>intermediate</i> layer and see what the model "would say" so far. That's the slider in the diagram: early layers guess generic words, deep layers commit.</p></div>) },
      { id: "ffn", label: "The feed-forward half", title: "What the other half does", intro: "Attention moves information between tokens. The FFN thinks about each token alone.", render: () => (<div className="rd-prose"><p>After attention mixes tokens, a <b>feed-forward network</b> processes each position independently — a wide layer that acts like a big lookup of learned patterns and facts. It's where a lot of a model's raw "knowledge" is stored.</p><p>Attention + FFN, repeated with residual adds: that's the whole transformer block.</p></div>) },
    ]} />
  );
}

/* ================================================== CHAPTER CONFIG ========= */
const FORWARD = {
  id: "forward-pass", title: "The forward pass", nextChapter: nextOf("forward-pass"),
  steps: [
    { eyebrow: "STEP 01 · THE FORWARD PASS", title: "A stack of identical blocks", navTitle: "A stack of blocks",
      lead: "Vectors go in at the bottom; a prediction comes out the top. In between is the same block, repeated.",
      Body: () => (<><p>We have a row of vectors carrying meaning and position. The <b>forward pass</b> is what happens when they flow up through the network.</p><p>Each layer is the same transformer block — attention, then a small network. The model just stacks it, sometimes a hundred times deep.</p></>),
      Diagram: FwdFlow, caption: "Same shape in, same shape out — so the block can be repeated to any depth." },
    { eyebrow: "STEP 02 · THE FORWARD PASS", title: "Watch a prediction form", navTitle: "Watch it form",
      Body: () => (<><p>The prediction doesn't appear all at once. Each layer nudges the answer. Drag through the layers and watch a near-random guess sharpen into a confident one.</p></>),
      Diagram: FwdLayers, caption: "The model's best guess after each layer — uncertain at first, decisive by the end.",
      deeper: [{ id: "fwd-appx", label: "Residual stream & the FFN", kicker: "Appendix · forward pass", title: "Inside the forward pass", wide: true, Panel: FwdDeepDoc }] },
    { eyebrow: "STEP 03 · THE FORWARD PASS", title: "From a vector to a vocabulary", navTitle: "Vector to vocabulary",
      Body: () => (<><p>At the top, the last token's vector is scored against the entire vocabulary, and softmax turns those scores into probabilities. The model never outputs "the answer" — it outputs a <b>distribution</b> over every possible next token.</p></>),
      Diagram: FwdSoftmax, caption: "Different contexts, different distributions — sometimes confident, sometimes a close call." },
    { eyebrow: "STEP 04 · THE FORWARD PASS", title: "Pick one, then do it all again", navTitle: "Then do it again",
      Body: () => (<><p>The model picks a token, appends it to the input, and runs the entire forward pass again to get the next one. Generation is just this loop.</p><p>Everything after this chapter — sampling, the KV cache, context limits — is about making this loop <span className="term">smart and cheap</span>.</p></>),
      Diagram: FwdLoop, caption: "Autoregression: one pass, one token, repeat. The output becomes the next input." },
  ],
};

Object.assign(window, { FORWARD });
