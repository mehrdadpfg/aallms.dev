/* aallms — chapter · Quantization
   Trading numeric precision for size & speed.
   Globals: React, Icon, DeepDoc, nextOf. Exports: QUANT. */

const Q_FMTS = {
  fp32: { name: "fp32", bits: 32, bytes: 4, q: 100, levels: 0 },
  fp16: { name: "fp16", bits: 16, bytes: 2, q: 99.6, levels: 0 },
  int8: { name: "int8", bits: 8, bytes: 1, q: 98, levels: 256 },
  int4: { name: "int4", bits: 4, bytes: 0.5, q: 93, levels: 16 },
};
const Q_WEIGHTS = [0.82, -0.41, 0.13, -0.67, 0.95, -0.22, 0.55, -0.88, 0.31, -0.05, 0.74, -0.49, 0.18, -0.71, 0.62, -0.34];
function qSnap(v, levels) { if (!levels) return v; const step = 2 / (levels - 1); return Math.round((v + 1) / step) * step - 1; }

/* =================================================== 1 · PRECISION ======== */
function QuantPrecision() {
  const [f, setF] = React.useState("int8");
  const fmt = Q_FMTS[f];
  const params = 7e9;
  const sizeGB = (params * fmt.bytes / 1e9).toFixed(1);
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        {Object.keys(Q_FMTS).map(k => <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{Q_FMTS[k].name}</button>)}
      </div>
      <div className="fp-plate rd-plate">
        <div className="q-grid">
          {Q_WEIGHTS.map((w, i) => {
            const sv = qSnap(w, fmt.levels);
            return <span key={i} className="q-cell"><span className="q-bar" style={{ height: Math.abs(sv) * 100 + "%", alignSelf: sv >= 0 ? "flex-end" : "flex-start", background: sv >= 0 ? "var(--concept-key)" : "var(--concept-output)" }} /></span>;
          })}
        </div>
        <div className="q-stats">
          <div className="q-stat"><span className="q-stat-lab">per weight</span><b>{fmt.bits} bits</b></div>
          <div className="q-stat"><span className="q-stat-lab">a 7B model</span><b>{sizeGB} GB</b></div>
          <div className="q-stat"><span className="q-stat-lab">quality kept</span><b style={{ color: fmt.q > 97 ? "var(--ok-500)" : fmt.q > 94 ? "var(--warn-500)" : "var(--err-500)" }}>{fmt.q}%</b></div>
        </div>
      </div>
      <p className="dg-read">Weights are just numbers, and you can store them with fewer bits. <b>Quantization</b> snaps each weight to a coarse grid — from 32-bit floats down to 4-bit integers. The model shrinks by <b>8×</b> and runs faster, while the values barely move. Watch the bars snap to levels as precision drops.</p>
    </div>
  );
}

/* =================================================== 2 · TRADE-OFF ======== */
function QuantTradeoff() {
  const keys = Object.keys(Q_FMTS);
  return (
    <div>
      <div className="fp-plate rd-plate">
        <div className="q-rows">
          {keys.map(k => {
            const fmt = Q_FMTS[k]; const sizePct = fmt.bytes / 4 * 100;
            return (
              <div key={k} className="q-trow">
                <span className="q-trow-name">{fmt.name}</span>
                <div className="q-trow-bars">
                  <div className="q-mini"><span className="q-mini-lab">size</span><div className="q-mini-track"><div className="q-mini-fill" style={{ width: sizePct + "%", background: "var(--concept-query)" }} /></div><span className="q-mini-v">{(7 * fmt.bytes / 4).toFixed(1)}GB</span></div>
                  <div className="q-mini"><span className="q-mini-lab">quality</span><div className="q-mini-track"><div className="q-mini-fill" style={{ width: fmt.q + "%", background: "var(--ok-500)" }} /></div><span className="q-mini-v">{fmt.q}%</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="dg-read">The sweet spot is steep: going from fp16 to <b>int8</b> halves the size for almost no quality loss, and <b>int4</b> is often worth the small hit to fit a model on a single GPU — or your laptop. Below 4 bits, quality starts to fall off a cliff.</p>
    </div>
  );
}

/* ============================================ APPENDIX · quantization ====== */
function QuantDeepDoc() {
  return (
    <DeepDoc sections={[
      { id: "ptq", label: "PTQ vs QAT", title: "Two ways to quantize", intro: "Quantize after training, or train the model to expect it.", render: () => (<div className="rd-prose"><p><b>Post-training quantization</b> (PTQ) shrinks a finished model in minutes — easy, and usually good enough. <b>Quantization-aware training</b> (QAT) bakes the rounding into training so the model adapts to it, recovering more quality at low bit-widths, for more effort.</p></div>) },
      { id: "outlier", label: "Outliers", title: "The few weights that matter most", intro: "A handful of large values wreck a naïve quantization.", render: () => (<div className="rd-prose"><p>Most weights are small, but a few <b>outliers</b> are huge — and rounding them coarsely hurts badly. Methods like <b>GPTQ</b> and <b>AWQ</b> protect the important weights (keeping them higher precision or scaling around them) so int4 stays usable.</p></div>) },
      { id: "kv", label: "Quantizing the cache", title: "Not just the weights", intro: "The KV cache can be quantized too — and at long context, it's the bottleneck.", render: () => (<div className="rd-prose"><p>At long context lengths the <b>KV cache</b> (from the Inference chapter) can dwarf the weights in memory. Quantizing the cache to 8 or 4 bits is increasingly how very long contexts are made to fit at all.</p></div>) },
    ]} />
  );
}

const QUANT = {
  id: "quantization", title: "Quantization", nextChapter: nextOf("quantization"),
  steps: [
    { eyebrow: "STEP 01 · QUANTIZATION", title: "Fewer bits per weight", navTitle: "Fewer bits",
      lead: "A model is billions of numbers. Storing them more coarsely is how big models fit on small machines.",
      Body: () => (<><p>Every weight we've trained is stored as a number with some precision. Full precision is wasteful — the model barely notices if you round.</p><p>Drop the precision and watch the size collapse while the values hold their shape.</p></>),
      Diagram: QuantPrecision, caption: "Lower precision snaps weights to a coarser grid. Big size win, small quality cost.",
      deeper: [{ id: "q-appx", label: "PTQ, outliers & KV quant", kicker: "Appendix · quantization", title: "Quantization in practice", wide: true, Panel: QuantDeepDoc }] },
    { eyebrow: "STEP 02 · QUANTIZATION", title: "The size–quality curve", navTitle: "The trade-off",
      Body: () => (<><p>How far can you push it? Compare the formats side by side. The first cuts are nearly free; the last ones start to bite.</p></>),
      Diagram: QuantTradeoff, caption: "int8 is almost free; int4 fits more on less; below that, quality drops sharply." },
  ],
};

Object.assign(window, { QUANT });
