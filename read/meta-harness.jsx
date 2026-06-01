/* aallms — chapter · Meta-harness
   The outer optimizer that treats the harness CONFIG itself as a search space
   and improves it automatically against an eval signal — and the harness as the
   outermost shell of the whole machine.
   Globals: React, Icon, nextOf. Exports: METAHARNESS_CH. */

/* ============================================ 1 · WHAT A META-HARNESS IS === */
/* A small static diagram: the self-referential loop where the scaffold
   improves itself — propose config variants, score on evals, promote the best,
   feed it back as the next baseline. */
function MetaLoop() {
  const stages = [
    { id: "propose", label: "propose", sub: "variant configs", icon: "git-branch", color: "var(--concept-query)" },
    { id: "score",   label: "score",   sub: "run the evals",   icon: "gauge",     color: "var(--concept-key)" },
    { id: "promote", label: "promote", sub: "keep the winner", icon: "trophy",    color: "var(--ok-500)" },
  ];
  return (
    <div className="ml-stage">
      <div className="ml-config">
        <span className="ml-config-lab">harness config = the search space</span>
        <div className="ml-genes">
          <span className="ml-gene">tools</span>
          <span className="ml-gene">loop policy</span>
          <span className="ml-gene">prompts</span>
          <span className="ml-gene">orchestration</span>
        </div>
      </div>

      <div className="ml-flow">
        {stages.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="ml-node" style={{ borderColor: s.color }}>
              <span className="ml-node-ic" style={{ color: s.color }}><Icon name={s.icon} size={16} stroke={2} /></span>
              <b>{s.label}</b>
              <span className="ml-node-sub">{s.sub}</span>
            </div>
            {i < stages.length - 1 ? <Icon name="arrow-right" size={15} stroke={2.2} /> : null}
          </React.Fragment>
        ))}
      </div>

      <div className="ml-return">
        <Icon name="corner-down-left" size={13} stroke={2} />
        the winner becomes the next baseline — the scaffold improves itself
      </div>
    </div>
  );
}

/* ===================================================== 2 · WATCH IT SEARCH = */
/* A deterministic "evolutionary search over harness configs" sim. Each
   candidate is a harness variant; its score is a stable pseudo-fitness so the
   animation is reproducible. The best candidate is promoted as next baseline. */
const MH_GENES = {
  tools:   ["search", "search+code", "search+code+files"],
  loop:    ["react", "plan-execute"],
  reflect: ["off", "on"],
  subs:    ["single", "sub-agents"],
};
function mhFitness(c, gen) {
  // hand-tuned monotone-ish scoring so search visibly climbs, capped < 100
  let s = 38;
  s += c.tools === "search+code+files" ? 16 : c.tools === "search+code" ? 9 : 0;
  s += c.loop === "plan-execute" ? 6 : 3;
  s += c.reflect === "on" ? 11 : 0;
  s += c.subs === "sub-agents" ? 8 : 0;
  // tiny deterministic jitter per generation so candidates differ within a round
  const h = (c.tools.length * 7 + c.loop.length * 3 + c.reflect.length * 5 + c.subs.length * 2 + gen * 13) % 9;
  return Math.min(96, s + h);
}
function mhSample(gen, k) {
  // deterministic pseudo-random pick spread across the gene space
  const pick = (arr, salt) => arr[(gen * 5 + k * 3 + salt) % arr.length];
  return { tools: pick(MH_GENES.tools, 0), loop: pick(MH_GENES.loop, 1), reflect: pick(MH_GENES.reflect, 2), subs: pick(MH_GENES.subs, 4) };
}
function HarnessMeta() {
  const GENS = 4, POP = 3;
  const [gen, setGen] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [best, setBest] = React.useState(null);     // promoted baseline {cfg, score}
  const [cands, setCands] = React.useState([]);      // current generation's candidates

  // build one generation: keep the running best as candidate 0 (elitism), sample the rest
  const buildGen = React.useCallback((g, carry) => {
    const list = [];
    if (carry) list.push({ ...carry.cfg, score: carry.score, kept: true });
    for (let k = list.length; k < POP; k++) {
      const cfg = mhSample(g, k);
      list.push({ ...cfg, score: mhFitness(cfg, g), kept: false });
    }
    return list;
  }, []);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setGen(g => {
        if (g >= GENS) { setRunning(false); return g; }
        const ng = g + 1;
        setBest(prevBest => {
          const list = buildGen(ng, prevBest);
          setCands(list);
          const top = list.reduce((a, b) => (b.score > a.score ? b : a));
          return { cfg: { tools: top.tools, loop: top.loop, reflect: top.reflect, subs: top.subs }, score: top.score };
        });
        return ng;
      });
    }, 1400);
    return () => clearInterval(id);
  }, [running, buildGen]);

  const start = () => {
    if (gen >= GENS) { setGen(0); setBest(null); setCands([]); }
    setRunning(true);
  };
  const reset = () => { setRunning(false); setGen(0); setBest(null); setCands([]); };
  const maxScore = cands.length ? Math.max(...cands.map(c => c.score)) : 0;

  return (
    <div>
      <div className="fp-plate rd-plate mh-stage">
        <div className="mh-head">
          <div className="mh-gen"><span>generation</span><b>{gen}<i> / {GENS}</i></b></div>
          <div className="mh-meter">
            <span className="mh-meter-lab">best score on the eval suite</span>
            <div className="mh-meter-track"><div className="mh-meter-fill" style={{ width: (best ? best.score : 0) + "%" }} /></div>
            <b className="mh-meter-pct">{best ? best.score : 0}</b>
          </div>
        </div>

        <div className="mh-pop">
          {cands.length === 0 ? (
            <div className="mh-empty">Press <b>Search</b> — the optimizer will propose harness variants, score each against the evals, and promote the winner.</div>
          ) : cands.map((c, i) => {
            const isTop = c.score === maxScore;
            return (
              <div key={i} className={"mh-cand" + (isTop ? " is-top" : "") + (c.kept ? " is-kept" : "")}>
                <div className="mh-cand-head">
                  <span className="mh-cand-id">variant {String.fromCharCode(65 + i)}</span>
                  {c.kept ? <span className="mh-badge mh-badge-keep">baseline</span> : null}
                  {isTop ? <span className="mh-badge mh-badge-win"><Icon name="trophy" size={11} stroke={2.2} />promoted</span> : null}
                </div>
                <div className="mh-genes">
                  <span className="mh-gene" style={{ background: "var(--concept-key-tint)", color: "var(--concept-key)" }}>{c.tools}</span>
                  <span className="mh-gene" style={{ background: "var(--concept-query-tint)", color: "var(--concept-query)" }}>{c.loop}</span>
                  <span className="mh-gene" style={{ background: "var(--concept-value-tint)", color: "var(--concept-value)" }}>reflect:{c.reflect}</span>
                  <span className="mh-gene" style={{ background: "var(--concept-output-tint)", color: "var(--concept-output)" }}>{c.subs}</span>
                </div>
                <div className="mh-score">
                  <div className="mh-score-track"><div className="mh-score-fill" style={{ width: c.score + "%" }} /></div>
                  <b>{c.score}</b>
                </div>
              </div>
            );
          })}
        </div>

        {best && gen >= 1 ? (
          <div className="mh-feedback"><Icon name="corner-down-left" size={13} stroke={2} /> winner becomes next generation's baseline</div>
        ) : null}
      </div>

      <div className="dg-controls">
        <button className="dg-btn" onClick={start} disabled={running}><Icon name={gen >= GENS && !running ? "rotate-ccw" : "play"} size={14} stroke={2.2} />{gen >= GENS && !running ? "Search again" : "Search harnesses"}</button>
        <button className="dg-btn" onClick={reset}><Icon name="x" size={14} stroke={2.2} />Reset</button>
      </div>

      <p className="dg-read">Each <b>variant</b> is a whole harness config — a choice of tools, loop policy, and orchestration. The optimizer scores each one against the same <b>eval suite</b>, promotes the highest, and carries it forward as the next generation's baseline. Watch the best score climb: the gains are coming from the <b>scaffold tuning itself</b>, not from a bigger model. It stays grounded — the climb is bounded by what the evals can actually measure, and a narrow suite just teaches the optimizer to game it.</p>
    </div>
  );
}

/* ================================================== CHAPTER CONFIG ========= */
const METAHARNESS_CH = {
  id: "meta-harness", title: "Meta-harness", nextChapter: nextOf("meta-harness"),
  steps: [
    { eyebrow: "STEP 01 · META-HARNESS", title: "The harness that writes harnesses", navTitle: "Meta-harness",
      lead: "A normal harness is hand-engineered. A meta-harness treats the harness itself as something to search over and improve automatically.",
      Body: () => (<><p>So far a human picked every part — the tools, the loop policy, the prompts, how sub-agents are orchestrated. A <b>meta-harness</b> (or auto-harness) takes the next step out: it treats the harness <i>configuration itself</i> as a <b>search space</b>, and improves it automatically against an eval signal.</p><p>An outer optimizer <b>proposes</b> variant configs, <b>scores</b> each on the evals, <b>promotes</b> the best as the next baseline, and iterates. That's the self-referential loop — the scaffold improving itself, one generation at a time.</p></>),
      Diagram: MetaLoop, caption: "Propose configs, score them on the evals, promote the winner as the next baseline. The harness config is the search space; the eval suite is the fitness signal." },
    { eyebrow: "STEP 02 · META-HARNESS", title: "Watch it search", navTitle: "Watch it search",
      Body: () => (<><p>Here's that loop running. Each <b>generation</b> proposes a few candidate harness configs, grades them against the eval suite, and keeps the highest scorer as the baseline for the next round.</p><p>Press Search and watch the best score rise as the optimizer climbs through the space of scaffolds.</p></>),
      Diagram: HarnessMeta, caption: "An outer loop searches over harness configs, scored by the evals. The harness stops being purely hand-written and starts improving itself." },
    { eyebrow: "STEP 03 · META-HARNESS", title: "The shell around everything", navTitle: "The outer shell",
      Body: () => (<><p>Step all the way back out. A <b>transformer</b> at the core, trained into an <b>LLM</b>, fed a carefully engineered <b>context</b>, and driven by a <b>harness</b> — that's the whole nested machine you started with on the cover.</p><p>The harness is the outermost discipline: the loop, the tools, the orchestration, the evals that keep it honest, and — at the edge — the search that lets it improve itself. Each shell is a craft of its own. Now you've seen them all, from the inside out.</p></>),
      Diagram: () => (
        <div className="hn-shells">
          <div className="hn-shell" style={{ borderColor: "var(--concept-output)" }}><span style={{ color: "var(--concept-output)" }}>Harness</span>
            <div className="hn-shell" style={{ borderColor: "var(--concept-query)" }}><span style={{ color: "var(--concept-query)" }}>Context + Prompt</span>
              <div className="hn-shell" style={{ borderColor: "var(--concept-key)" }}><span style={{ color: "var(--concept-key)" }}>LLM</span>
                <div className="hn-shell hn-core" style={{ borderColor: "var(--accent)" }}><span style={{ color: "var(--accent)" }}>Transformer</span></div>
              </div>
            </div>
          </div>
        </div>
      ),
      caption: "Transformer → LLM → Context → Harness. The same nesting you saw on the landing — now understood end to end." },
  ],
};

Object.assign(window, { METAHARNESS_CH });
