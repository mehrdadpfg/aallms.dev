/* aallms — chapter · Tokenizer
   A deterministic teaching tokenizer (greedy longest-match over a small vocab)
   + interactive diagrams + the chapter's step/deep-dive config.
   Globals: React, Icon, DeepSteps. Exports: TOKENIZER, SECTION_TRANSFORMER. */

/* ----------------------------------------------------------- the engine -- */
const TOK_WORDS = ("the of to and a in is it you that he was for on are with as I his they be at one have this from "
 + "or had by word but what some we can out other were all there when up use how said an each she which do their "
 + "time if will way about many then them would like so these her long make see him two has look more day could go "
 + "come did sound no most people my over know water than call first who may down side been now find any new work "
 + "part take get place made live where after back little only round man year came show every good me give our under "
 + "name very through just form great think say help line turn cause much mean before move right old same tell does "
 + "set want air well also play small end put home read hand large add even land here must big high such follow act "
 + "why ask men change went light kind need house try again animal point world near build self earth cat dog sat mat "
 + "sun moon star tree book write code data model token learn teach study brain language letter number context "
 + "attention memory tool agent prompt train vector").split(/\s+/);
const TOK_SUBS = ("ing ed er est ly tion ation ment ness able ible ful less ize ise ive ous ant ent al ic ity ty ar "
 + "or en es s un re pre dis over out non co de ex inter sub super trans anti ").split(/\s+/).filter(Boolean);

const TOK_VOCAB = (() => {
  const set = new Set();
  TOK_WORDS.forEach(w => { const lw = w.toLowerCase(); set.add(lw); set.add(" " + lw); });
  TOK_SUBS.forEach(s => set.add(s));
  "0123456789".split("").forEach(d => { set.add(d); set.add(" " + d); });
  ".,!?;:'\"()[]{}-_/\\*+=<>@#".split("").forEach(p => { set.add(p); set.add(" " + p); });
  return [...set].sort((a, b) => b.length - a.length);
})();

function tokenize(text) {
  const out = [];
  let pos = 0; const n = text.length;
  while (pos < n) {
    let len = 0;
    for (let k = 0; k < TOK_VOCAB.length; k++) {
      const e = TOK_VOCAB[k];
      if (e.length > n - pos) continue;
      if (text.substr(pos, e.length).toLowerCase() === e) { len = e.length; break; }
    }
    if (!len) len = 1;
    out.push(text.substr(pos, len));
    pos += len;
  }
  return out;
}
function tokId(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; } return h % 50257; }

const TOK_TINTS = ["var(--concept-query-tint)", "var(--concept-key-tint)", "var(--concept-value-tint)", "var(--concept-output-tint)", "var(--accent-tint)"];

/* render a token chip row (shared) */
function TokenRow({ tokens, showIds, dim }) {
  return (
    <div className="tk-row">
      {tokens.map((t, i) => {
        const lead = t[0] === " ";
        const disp = lead ? t.slice(1) : t;
        return (
          <span key={i} className="tk-tok" style={{ background: TOK_TINTS[i % TOK_TINTS.length], opacity: dim ? .5 : 1 }}>
            <span className="tk-glyph">{lead ? <span className="tk-sp">·</span> : null}{disp === "" ? "␣" : disp}</span>
            {showIds ? <span className="tk-id">{tokId(t)}</span> : null}
          </span>
        );
      })}
    </div>
  );
}

/* =================================================== 1 · LIVE TOKENIZER === */
const TOK_PRESETS = [
  { id: "plain", label: "A sentence", text: "The cat sat on the mat." },
  { id: "rare", label: "Rare words", text: "Tokenization splits unfamiliar terminology." },
  { id: "code", label: "Code", text: "def harness(model):\n    return model.run()" },
  { id: "made", label: "Made-up", text: "The blorptastic frizzlewump appeared." },
];
function TokLive() {
  const [text, setText] = React.useState(TOK_PRESETS[0].text);
  const [preset, setPreset] = React.useState("plain");
  const tokens = React.useMemo(() => tokenize(text), [text]);
  const chars = text.length;
  const ratio = tokens.length ? (chars / tokens.length).toFixed(1) : "0";
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        {TOK_PRESETS.map(p => (
          <button key={p.id} className={preset === p.id ? "on" : ""}
            onClick={() => { setPreset(p.id); setText(p.text); }}>{p.label}</button>
        ))}
      </div>
      <textarea className="input tk-input" value={text} spellCheck={false}
        onChange={e => { setText(e.target.value); setPreset(""); }} rows={2} />
      <div className="tk-meta">
        <span><b>{tokens.length}</b> tokens</span>
        <span><b>{chars}</b> characters</span>
        <span><b>{ratio}</b> chars / token</span>
      </div>
      <TokenRow tokens={tokens} />
      <p className="dg-read">Type or edit above and the split updates live. Common words stay whole; unfamiliar ones break into <b>subword pieces</b>, and truly novel strings fall back to single characters.</p>
    </div>
  );
}

/* =================================================== 2 · TOKEN IDS ======== */
function TokIds() {
  const tokens = tokenize("Attention is all you need.");
  const [hover, setHover] = React.useState(-1);
  return (
    <div>
      <div className="tk-row">
        {tokens.map((t, i) => {
          const lead = t[0] === " "; const disp = lead ? t.slice(1) : t;
          return (
            <button key={i} className={"tk-tok tk-tok--btn" + (hover === i ? " is-hot" : "")}
              style={{ background: TOK_TINTS[i % TOK_TINTS.length] }}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(-1)}>
              <span className="tk-glyph">{lead ? <span className="tk-sp">·</span> : null}{disp}</span>
              <span className="tk-id">{tokId(t)}</span>
            </button>
          );
        })}
      </div>
      <div className="tk-lookup">
        {hover < 0
          ? <span className="dg-read" style={{ margin: 0 }}>Hover a token. Each one is just an index into a fixed <b>vocabulary</b> of ~50,257 entries — the model only ever computes with these integers.</span>
          : <span className="dg-read" style={{ margin: 0 }}>Token <b className="tk-codeword">"{tokens[hover]}"</b> → id <b>{tokId(tokens[hover])}</b>. The model looks up row {tokId(tokens[hover])} of its embedding table to turn this id into a vector.</span>}
      </div>
    </div>
  );
}

/* =================================================== 3 · TRADE-OFF ======== */
const TOK_SENT = "Tokenization balances sequence length against vocabulary size.";
function TokTradeoff() {
  const [g, setG] = React.useState(1); // 0 char, 1 subword, 2 word
  const data = [
    { id: 0, label: "Characters", units: TOK_SENT.replace(/ /g, "·").split(""), seq: TOK_SENT.length, vocab: 256, vlabel: "~256", note: "Tiny vocabulary, but sequences get very long — the model must reassemble every word from scratch." },
    { id: 1, label: "Subwords", units: tokenize(TOK_SENT), seq: tokenize(TOK_SENT).length, vocab: 50257, vlabel: "~50K", note: "The sweet spot. Common words are one token; rare words split into reusable pieces. No word is ever unknown." },
    { id: 2, label: "Words", units: TOK_SENT.split(" "), seq: TOK_SENT.split(" ").length, vocab: 170000, vlabel: "~170K+", note: "Short sequences, but the vocabulary explodes and any unseen word becomes a single <unk> — meaning lost." },
  ];
  const cur = data[g];
  const maxSeq = TOK_SENT.length;
  const logv = v => Math.log10(v) / Math.log10(200000);
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-5)" }}>
        {data.map(d => <button key={d.id} className={g === d.id ? "on" : ""} onClick={() => setG(d.id)}>{d.label}</button>)}
      </div>
      <div className="tk-row" style={{ marginBottom: "var(--sp-5)" }}>
        {cur.units.map((u, i) => (
          <span key={i} className="tk-tok tk-tok--sm" style={{ background: TOK_TINTS[i % TOK_TINTS.length] }}>
            <span className="tk-glyph">{u === "" || u === "·" ? "␣" : u}</span>
          </span>
        ))}
      </div>
      <div className="tk-bars">
        <div className="tk-bar">
          <div className="tk-bar-lab"><span>Sequence length</span><b>{cur.seq} tokens</b></div>
          <div className="tk-bar-track"><div className="tk-bar-fill" style={{ width: (cur.seq / maxSeq * 100) + "%", background: "var(--concept-query)" }} /></div>
        </div>
        <div className="tk-bar">
          <div className="tk-bar-lab"><span>Vocabulary size</span><b>{cur.vlabel}</b></div>
          <div className="tk-bar-track"><div className="tk-bar-fill" style={{ width: (logv(cur.vocab) * 100) + "%", background: "var(--concept-output)" }} /></div>
        </div>
      </div>
      <p className="dg-read">{cur.note}</p>
    </div>
  );
}

/* =================================================== 4 · QUIRKS =========== */
const TOK_QUIRKS = [
  { id: "count", label: "Counting letters", text: "strawberry", note: "The model sees a few chunks, not ten letters. Asking \u201chow many r\u2019s?\u201d means reasoning about pieces it can\u2019t directly see." },
  { id: "space", label: "Whitespace", text: "    indented code", note: "Leading spaces become their own tokens — indentation literally costs tokens, which is why code can be expensive." },
  { id: "num", label: "Numbers", text: "1234567 + 89", note: "Long numbers split into fragments, so arithmetic happens over arbitrary chunks rather than digits." },
  { id: "case", label: "Casing", text: "GitHub github GITHUB", note: "Case changes the tokens — three visually similar words are three different inputs to the model." },
];
function TokQuirks() {
  const [q, setQ] = React.useState("count");
  const cur = TOK_QUIRKS.find(x => x.id === q);
  const tokens = tokenize(cur.text);
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)", flexWrap: "wrap" }}>
        {TOK_QUIRKS.map(x => <button key={x.id} className={q === x.id ? "on" : ""} onClick={() => setQ(x.id)}>{x.label}</button>)}
      </div>
      <div className="tk-strip"><span className="tk-strip-raw">{cur.text.replace(/ /g, "␣")}</span></div>
      <TokenRow tokens={tokens} />
      <p className="dg-read"><b>{tokens.length} tokens.</b> {cur.note}</p>
    </div>
  );
}

/* =================================================== 5 · TEASER → EMBED === */
function TokToEmbed() {
  const toks = ["model", "of", "language"];
  return (
    <div className="tk-embed">
      {toks.map((t, i) => (
        <div key={i} className="tk-embed-row">
          <span className="tk-tok" style={{ background: TOK_TINTS[i % TOK_TINTS.length] }}><span className="tk-glyph">{t}</span></span>
          <svg width="46" height="20" className="tk-embed-arrow"><path d="M2 10 L40 10" stroke="var(--border-strong)" strokeWidth="1.5" /><path d="M34 5 L41 10 L34 15" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="tk-vec">[{Array.from({ length: 8 }).map((_, k) => {
            const v = ((tokId(t) >> (k * 3)) % 19 - 9) / 9;
            return <span key={k} className="tk-vec-cell" title={v.toFixed(2)}><span className="tk-vec-bar" style={{ height: Math.abs(v) * 100 + "%", background: v >= 0 ? "var(--concept-key)" : "var(--concept-output)", alignSelf: v >= 0 ? "flex-end" : "flex-start" }} /></span>;
          })}]</span>
        </div>
      ))}
    </div>
  );
}

/* ============================================ DEEP DIVE · BPE merges ====== */
function learnBPE(words, num) {
  let toks = words.map(w => w.split(""));
  const merges = [];
  for (let m = 0; m < num; m++) {
    const pairs = {};
    toks.forEach(seq => { for (let i = 0; i < seq.length - 1; i++) { const p = seq[i] + "\u0001" + seq[i + 1]; pairs[p] = (pairs[p] || 0) + 1; } });
    let bp = null, bc = 1;
    for (const p in pairs) if (pairs[p] > bc) { bc = pairs[p]; bp = p; }
    if (!bp) break;
    const [a, b] = bp.split("\u0001"); const merged = a + b;
    merges.push({ a, b, merged, count: bc });
    toks = toks.map(seq => { const r = []; for (let i = 0; i < seq.length; i++) { if (i < seq.length - 1 && seq[i] === a && seq[i + 1] === b) { r.push(merged); i++; } else r.push(seq[i]); } return r; });
  }
  return merges;
}
const BPE_CORPUS = (() => {
  const counts = { low: 6, lower: 3, lowest: 2, slow: 2, newer: 4, newest: 5, wider: 2, widest: 3 };
  const arr = []; for (const w in counts) for (let i = 0; i < counts[w]; i++) arr.push(w);
  return arr;
})();
const BPE_MERGES = learnBPE(BPE_CORPUS, 8);
function applyMerges(word, merges) {
  let seq = word.split("");
  for (const mg of merges) { const r = []; for (let i = 0; i < seq.length; i++) { if (i < seq.length - 1 && seq[i] === mg.a && seq[i + 1] === mg.b) { r.push(mg.merged); i++; } else r.push(seq[i]); } seq = r; }
  return seq;
}
function TokBPEDeep() {
  const [k, setK] = React.useState(0); // merges applied
  const [playing, setPlaying] = React.useState(false);
  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setK(v => { if (v >= BPE_MERGES.length) { setPlaying(false); return v; } return v + 1; }), 900);
    return () => clearInterval(id);
  }, [playing]);
  const applied = BPE_MERGES.slice(0, k);
  const test = applyMerges("lowest", applied);
  const next = BPE_MERGES[k];
  return (
    <div>
      <div className="fp-plate rd-plate" style={{ marginBottom: "var(--sp-4)" }}>
        <p className="bpe-cap">Vocabulary starts as single characters. Each step merges the <b>most frequent adjacent pair</b> across the corpus into one new token.</p>
        <div className="bpe-merges">
          {applied.length === 0 ? <span className="bpe-empty">no merges yet — every token is one character</span> : null}
          {applied.map((mg, i) => (
            <span key={i} className="bpe-merge" style={{ opacity: i === applied.length - 1 ? 1 : .62 }}>
              <code>{mg.a}</code>+<code>{mg.b}</code><Icon name="arrow-right" size={11} stroke={2} /><code className="bpe-new">{mg.merged}</code>
              <span className="bpe-count">×{mg.count}</span>
            </span>
          ))}
        </div>
        <div className="bpe-test">
          <span className="bpe-test-lab">"lowest" →</span>
          <span className="tk-row" style={{ display: "inline-flex" }}>
            {test.map((t, i) => <span key={i} className="tk-tok tk-tok--sm" style={{ background: TOK_TINTS[i % TOK_TINTS.length] }}><span className="tk-glyph">{t}</span></span>)}
          </span>
          <span className="bpe-test-n">{test.length} tokens</span>
        </div>
      </div>
      <div className="dg-controls">
        <button className="dg-btn" onClick={() => { if (k >= BPE_MERGES.length) setK(0); setPlaying(p => !p); }}>
          <Icon name={playing ? "pause" : "play"} size={14} stroke={2.2} />{playing ? "Pause" : "Play merges"}
        </button>
        <button className="dg-btn" onClick={() => { setPlaying(false); setK(v => Math.min(BPE_MERGES.length, v + 1)); }} disabled={k >= BPE_MERGES.length}>
          <Icon name="step-forward" size={14} stroke={2.2} />Step
        </button>
        <button className="dg-btn" onClick={() => { setPlaying(false); setK(0); }}><Icon name="rotate-ccw" size={14} stroke={2.2} />Reset</button>
        <span className="dg-readout">{k} / {BPE_MERGES.length}</span>
      </div>
      <p className="dg-read">{next ? <>Next merge will be <b>{next.a}+{next.b}</b> ({next.count} occurrences).</> : <>Done. Real tokenizers run tens of thousands of these merges over a huge corpus — the result is the vocabulary every prompt is cut against.</>}</p>
    </div>
  );
}

/* ============================================ DEEP DIVE · byte-level ====== */
const BYTE_PRESETS = [{ c: "A", n: "ascii" }, { c: "é", n: "accent" }, { c: "中", n: "hanzi" }, { c: "🤖", n: "emoji" }];
function TokBytes() {
  const [s, setS] = React.useState("é");
  const bytes = Array.from(new TextEncoder().encode(s));
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        {BYTE_PRESETS.map(p => <button key={p.c} className={s === p.c ? "on" : ""} onClick={() => setS(p.c)}>{p.c} <span style={{ opacity: .6 }}>{p.n}</span></button>)}
      </div>
      <input className="input tk-input" style={{ minHeight: 0, fontSize: 16 }} value={s} maxLength={12} onChange={e => setS(e.target.value)} spellCheck={false} />
      <div className="by-flow">
        <span className="by-char">{s || "∅"}</span>
        <Icon name="arrow-right" size={18} stroke={2} />
        <div className="tk-row">
          {bytes.map((b, i) => <span key={i} className="tk-tok tk-tok--sm" style={{ background: aallmsHeatLite(i / Math.max(1, bytes.length - 1)), color: "#3a2f1e" }}><span className="tk-glyph">{b}</span></span>)}
          {bytes.length === 0 ? <span className="bpe-empty">type something</span> : null}
        </div>
      </div>
      <p className="dg-read"><b>{[...s].length} character{[...s].length !== 1 ? "s" : ""}</b> → <b>{bytes.length} byte{bytes.length !== 1 ? "s" : ""}</b>. The base of the vocabulary is the 256 possible byte values, so any script, accent, or emoji can always be spelled out one byte at a time. Nothing is ever <code className="code-inline">&lt;unk&gt;</code> — there is no such thing as an unknown character.</p>
    </div>
  );
}
function aallmsHeatLite(t) { const a = [244, 238, 226], b = [251, 217, 168]; const c = a.map((v, k) => Math.round(v + (b[k] - v) * Math.max(0, Math.min(1, t)))); return `rgb(${c[0]},${c[1]},${c[2]})`; }

/* ============================================ DEEP DIVE · vocab design ==== */
function TokVocabDesign() {
  const [v, setV] = React.useState(50000);
  const d = 4096;
  const tpw = Math.max(1.0, Math.min(2.6, 0.95 + 20000 / v));
  const params = 2 * v * d;
  const fmt = n => n >= 1e9 ? (n / 1e9).toFixed(1) + "B" : (n / 1e6).toFixed(0) + "M";
  return (
    <div>
      <div className="dg-slider" style={{ marginBottom: "var(--sp-5)" }}>
        <label>Vocabulary</label>
        <input type="range" min="8000" max="256000" step="1000" value={v} onChange={e => setV(parseInt(e.target.value))} />
        <span className="dg-readout">{(v / 1000).toFixed(0)}K</span>
      </div>
      <div className="tk-bars">
        <div className="tk-bar"><div className="tk-bar-lab"><span>Avg. tokens per word</span><b>≈ {tpw.toFixed(2)}</b></div><div className="tk-bar-track"><div className="tk-bar-fill" style={{ width: (tpw / 2.6 * 100) + "%", background: "var(--concept-query)" }} /></div></div>
        <div className="tk-bar"><div className="tk-bar-lab"><span>Embedding + output params</span><b>≈ {fmt(params)}</b></div><div className="tk-bar-track"><div className="tk-bar-fill" style={{ width: (params / (2 * 256000 * d) * 100) + "%", background: "var(--concept-output)" }} /></div></div>
      </div>
      <p className="dg-read">A bigger vocabulary means <b>shorter sequences</b> (cheaper attention) but a <b>larger embedding table</b> and more rarely-seen tokens that train poorly. Most modern models land between 32K and 256K. Designers also make deliberate choices: <b>split every digit</b> 0–9 so numbers are uniform, fold the leading space into the token, and balance scripts so one language doesn't dominate.</p>
    </div>
  );
}

/* ============================================ DEEP DIVE · templates ======= */
const TOK_CHAT = [
  { role: "system", text: "You are concise." },
  { role: "user", text: "Capital of France?" },
  { role: "assistant", text: "Paris." },
];
function TokTemplate() {
  const [special, setSpecial] = React.useState(true);
  const stream = [];
  if (special) stream.push({ k: "sp", v: "<bos>" });
  TOK_CHAT.forEach(m => {
    if (special) { stream.push({ k: "sp", v: "<|im_start|>" }); stream.push({ k: "role", v: m.role }); }
    tokenize((special ? "" : (stream.length ? " " : "")) + m.text).forEach(t => stream.push({ k: "txt", v: t }));
    if (special) stream.push({ k: "sp", v: "<|im_end|>" });
  });
  if (special) { stream.push({ k: "sp", v: "<|im_start|>" }); stream.push({ k: "role", v: "assistant" }); }
  return (
    <div>
      <label className="switch" style={{ marginBottom: "var(--sp-4)" }}>
        <input type="checkbox" checked={special} onChange={e => setSpecial(e.target.checked)} />
        <span className="switch-track"><span className="switch-knob" /></span>
        Show special tokens
      </label>
      <div className="tpl-stream">
        {stream.map((t, i) => {
          if (t.k === "sp") return <span key={i} className="tpl-tok tpl-sp">{t.v}</span>;
          if (t.k === "role") return <span key={i} className="tpl-tok tpl-role">{t.v}</span>;
          const lead = t.v[0] === " ";
          return <span key={i} className="tk-tok tk-tok--sm" style={{ background: TOK_TINTS[i % TOK_TINTS.length] }}><span className="tk-glyph">{lead ? <span className="tk-sp">·</span> : null}{lead ? t.v.slice(1) : t.v}</span></span>;
        })}
      </div>
      <p className="dg-read">A conversation is just one long token sequence. <b>Special tokens</b> — <code className="code-inline">&lt;bos&gt;</code>, <code className="code-inline">&lt;|im_start|&gt;</code>, role markers, <code className="code-inline">&lt;|im_end|&gt;</code> — mark the boundaries so the model knows who said what. Turn them off to see the raw text the template wraps. The trailing <code className="code-inline">&lt;|im_start|&gt;assistant</code> is the cue that tells the model it's now its turn to write.</p>
    </div>
  );
}

/* ============================================ APPENDIX · inside tokenizer = */
function TokDeepDoc() {
  return (
    <DeepDoc sections={[
      {
        id: "merge", label: "Merge process", title: "Building a vocabulary by merging",
        intro: "BPE doesn't start from words. It starts from single characters and earns every larger token.",
        render: () => (<><div className="rd-prose"><p>Take a big pile of text. Count every pair of adjacent symbols. Merge the <b>single most frequent pair</b> into one new symbol, add it to the vocabulary, and repeat — tens of thousands of times. Frequent letter sequences fuse into subwords; whole common words eventually become single tokens.</p></div><TokBPEDeep /></>),
      },
      {
        id: "bytes", label: "Byte-level BPE", title: "Why tokenizers work on bytes",
        intro: "Before any merging, text is reduced to raw bytes — the trick that makes the vocabulary universal.",
        render: () => (<><div className="rd-prose"><p>Modern tokenizers run BPE not over characters but over <b>UTF-8 bytes</b>. The starting alphabet is exactly the 256 byte values, and merges build up from there. Because every possible character decomposes into bytes, the model can represent <i>anything</i> — and never needs an "unknown" token.</p></div><TokBytes /></>),
      },
      {
        id: "vocab", label: "Vocabulary design", title: "Choosing the vocabulary",
        intro: "Vocabulary size is a real engineering dial, trading sequence length against model size.",
        render: () => (<><div className="rd-prose"><p>How many merges should you run? The answer sets the vocabulary size — and it's a balance, not a maximum.</p></div><TokVocabDesign /></>),
      },
      {
        id: "tmpl", label: "Templates & special tokens", title: "Turning a chat into a token stream",
        intro: "The model never sees 'a conversation' — it sees one flat sequence stitched together by special tokens.",
        render: () => (<><div className="rd-prose"><p>Roles, turn boundaries, and the start/end of generation are all encoded as reserved <b>special tokens</b> that no normal text can produce. The <i>chat template</i> is the rule for laying them out.</p></div><TokTemplate /></>),
      },
    ]} />
  );
}

/* ============================================ DEEP DIVE · miscount ======== */
function TokMiscount() {
  return (
    <div>
      <div className="rd-prose">
        <p>Here is the same word at three resolutions. The model only ever receives the bottom row.</p>
      </div>
      <div className="fp-plate rd-plate" style={{ margin: "var(--sp-4) 0" }}>
        <div className="mc-row"><span className="mc-lab">letters</span><div className="tk-row">{"strawberry".split("").map((c, i) => <span key={i} className="tk-tok tk-tok--sm" style={{ background: "var(--surface)" }}><span className="tk-glyph">{c}</span></span>)}</div></div>
        <div className="mc-row"><span className="mc-lab">tokens</span><TokenRow tokens={tokenize("strawberry")} /></div>
      </div>
      <p className="dg-read">There are <b>three r's</b> in the letters, but the model sees a handful of chunks with no letter-level structure. To answer "how many r's", it has to <b>reason</b> about spelling it was never shown directly — which is why even strong models stumble on it.</p>
    </div>
  );
}

/* ================================================== CHAPTER CONFIG ======== */
const TOKENIZER = {
  id: "tokenizer",
  title: "Tokenizer",
  nextChapter: nextOf("tokenizer"),
  steps: [
    {
      eyebrow: "STEP 01 · TOKENIZER",
      title: "The model never sees letters",
      navTitle: "The model never sees letters",
      lead: "Before any thinking happens, your text is chopped into tokens — the atoms a language model actually reads.",
      Body: () => (<><p>A model can't read a sentence the way you do. First, <span className="term">we</span> turn text into a sequence of <b>tokens</b>: short, reusable chunks drawn from a fixed vocabulary. A token might be a whole word, a fragment of one, a single character, or a space.</p><p>Try editing the text below. Watch how familiar words stay whole while unusual ones shatter into pieces.</p></>),
      Diagram: TokLive,
      caption: "Each colored cell is one token. Hover the presets to see plain prose, code, and invented words split differently.",
      deeper: [{ id: "inside", label: "Inside the tokenizer", kicker: "Appendix · tokenizer", title: "Inside the tokenizer", wide: true, Panel: TokDeepDoc }],
    },
    {
      eyebrow: "STEP 02 · TOKENIZER",
      title: "Every token is just a number",
      navTitle: "Every token is a number",
      Body: () => (<><p>Tokens aren't stored as text inside the model. Each one is an <b>id</b> — an index into the vocabulary. "Attention" might be token 8,421; a space-led " is" might be 318.</p><p>From here on, the model computes only with these integers. Hover a token to see its id and where it points.</p></>),
      Diagram: TokIds,
      caption: "The same lookup happens for every token: id → a row in the embedding table (the next chapter).",
    },
    {
      eyebrow: "STEP 03 · TOKENIZER",
      title: "Why pieces, not words?",
      navTitle: "Why pieces, not words?",
      Body: () => (<><p>Why not just give every word its own token? Because tokenization is a <b>trade-off</b> between two costs: how long the sequence gets, and how big the vocabulary must be.</p><p>Switch between the three granularities and watch both costs move in opposite directions.</p></>),
      Diagram: TokTradeoff,
      caption: "Subwords sit in the middle — short enough sequences, a manageable vocabulary, and no word is ever truly unknown.",
    },
    {
      eyebrow: "STEP 04 · TOKENIZER",
      title: "Where tokenization gets weird",
      navTitle: "Where it gets weird",
      Body: () => (<><p>Because the model reasons over tokens, not characters, tokenization quietly shapes what it finds easy or hard. A few classic surprises:</p></>),
      Diagram: TokQuirks,
      caption: "None of these are bugs — they're direct consequences of cutting text into subword pieces.",
      deeper: [{ id: "miscount", label: "Why models miscount letters", kicker: "Deep dive · tokenizer", title: "Why models miscount letters", Panel: TokMiscount }],
    },
    {
      eyebrow: "STEP 05 · TOKENIZER",
      title: "From tokens to meaning",
      navTitle: "From tokens to meaning",
      Body: () => (<><p>A token id by itself means nothing — 8,421 is just a number. To give it meaning, the model looks up a <b>vector</b> for each id: a long list of numbers that places the token in a space where similar meanings sit nearby.</p><p>That lookup is the <span className="term">embedding</span> — the next chapter, and the first place the model starts to "understand."</p></>),
      Diagram: TokToEmbed,
      caption: "Each token id is swapped for a learned vector. Those vectors are what attention will operate on next.",
    },
  ],
};

Object.assign(window, { TOKENIZER, tokenize, tokId, TokenRow });
