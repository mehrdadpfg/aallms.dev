/* aallms — reader shell · StepReader + deep-dive drawer
   Linear spine of steps with an opt-in deep-dive panel per step.
   Globals used (from parts.jsx): Icon, ThemeToggle.
   Exports to window: StepReader, DeepSteps, useMounted. */

function useMounted() {
  const [m, setM] = React.useState(false);
  React.useEffect(() => { const id = setTimeout(() => setM(true), 50); return () => clearTimeout(id); }, []);
  return m;
}

/* ---- brand (links home) ------------------------------------------------- */
function RdBrand() {
  return (
    <a className="brand" href="../index.html">
      <span className="brand-chev">
        <svg viewBox="0 0 20 42" width="13" height="26"><path d="M5 11 L13 21 L5 31" stroke="var(--accent)" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".4"/></svg>
        <svg viewBox="0 0 20 42" width="13" height="26"><path d="M5 11 L13 21 L5 31" stroke="var(--accent)" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".7"/></svg>
        <svg viewBox="0 0 20 42" width="13" height="26"><path d="M5 11 L13 21 L5 31" stroke="var(--accent)" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
      <span className="brand-word">aa<span className="brand-llm">llm</span>s<span className="brand-dev">.dev</span></span>
    </a>
  );
}

/* ---- section rail (+ cross-section switcher) ----------------------------- */
function RdRail({ section, currentId }) {
  const sections = (typeof window !== "undefined" && window.SECTIONS) ? window.SECTIONS : [section];
  return (
    <nav className="rd-rail" aria-label="Chapters">
      <div className="rl-secnav">
        {sections.map(s => (
          <a key={s.id} href={s.chapters[0].href} className={"rl-sec" + (s.id === section.id ? " is-on" : "")} title={s.title}>
            <span className="rl-secdot" data-ring={s.ring} />{s.title}
          </a>
        ))}
      </div>
      <p className="rd-rail-title">{section.title}</p>
      <ol className="rd-rail-list">
        {section.chapters.map((c) => {
          const cur = c.id === currentId;
          const inner = (
            <>
              <span className="rd-rail-num">{c.num}</span>
              <span className="rd-rail-label">{c.title}</span>
              {c.soon ? <span className="rd-rail-soon">soon</span> : null}
            </>
          );
          return c.soon
            ? <li key={c.id} className="rd-rail-item is-soon">{inner}</li>
            : <a key={c.id} href={c.href} className={"rd-rail-item" + (cur ? " is-current" : "")}>{inner}</a>;
        })}
      </ol>
    </nav>
  );
}

/* ---- a single step (re-reveals on change) ------------------------------- */
function RdStep({ step, onDeeper }) {
  const m = useMounted();
  const Body = step.Body, Diagram = step.Diagram;
  return (
    <article className={"rd-step" + (m ? "" : " is-pre")}>
      <div className="rd-step-head">
        <p className="rd-eyebrow">{step.eyebrow}</p>
        <h1 className="rd-title">{step.title}</h1>
        {step.lead ? <p className="rd-lead">{step.lead}</p> : null}
      </div>
      {Body ? <div className="rd-prose"><Body /></div> : null}
      {Diagram ? (
        <figure className={"rd-figure" + (step.wide ? " rd-figure--wide" : "")}>
          <div className="fp-plate rd-plate"><Diagram /></div>
          {step.caption ? <figcaption className="rd-cap"><b>Fig</b>{step.caption}</figcaption> : null}
        </figure>
      ) : null}
      {step.deeper && step.deeper.length ? (
        <div className="deeper-bar">
          <span className="deeper-lead">Go deeper</span>
          {step.deeper.map(d => (
            <button key={d.id} className="deeper-btn" onClick={() => onDeeper(d)}>
              <Icon name="git-branch" size={15} stroke={2} />{d.label}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

/* ---- bottom step nav ---------------------------------------------------- */
function RdNav({ i, steps, onGo, nextChapter }) {
  const total = steps.length;
  const prev = i > 0 ? steps[i - 1] : null;
  const next = i < total - 1 ? steps[i + 1] : null;
  return (
    <nav className="rd-nav">
      <button className="rd-navbtn prev" disabled={!prev} onClick={() => onGo(i - 1)}>
        {prev ? (<><span className="k"><Icon name="arrow-left" size={12} stroke={2} /> Previous</span><span className="ti">{prev.navTitle || prev.title}</span></>) : null}
      </button>
      <div className="rd-navmid">
        <div className="rd-dots">
          {steps.map((s, k) => (
            <button key={k} className={"rd-dot" + (k < i ? " done" : "") + (k === i ? " now" : "")}
              onClick={() => onGo(k)} aria-label={"Step " + (k + 1)} title={s.title} />
          ))}
        </div>
        <span className="lbl">{i + 1} / {total}</span>
      </div>
      {next ? (
        <button className="rd-navbtn next" onClick={() => onGo(i + 1)}>
          <span className="k">Next <Icon name="arrow-right" size={12} stroke={2} /></span>
          <span className="ti">{next.navTitle || next.title}</span>
        </button>
      ) : nextChapter ? (
        <a className="rd-navbtn next" href={nextChapter.href} style={{ textDecoration: "none" }}>
          <span className="k">Next chapter <Icon name="arrow-right" size={12} stroke={2} /></span>
          <span className="ti">{nextChapter.title}</span>
        </a>
      ) : (
        <span className="rd-navbtn next" style={{ opacity: 0 }} />
      )}
    </nav>
  );
}

/* ---- deep-dive drawer --------------------------------------------------- */
function DeepDive({ dive, onClose }) {
  const open = !!dive;
  const [cur, setCur] = React.useState(dive);
  React.useEffect(() => { if (dive) setCur(dive); }, [dive]);
  React.useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const Panel = cur && cur.Panel;
  return (
    <>
      <div className={"dd-scrim" + (open ? " is-open" : "")} onClick={onClose} />
      <aside className={"dd-panel" + (open ? " is-open" : "") + (cur && cur.wide ? " is-wide" : "")} aria-hidden={!open}>
        {cur ? (
          <>
            <div className="dd-head">
              <div style={{ minWidth: 0 }}>
                <p className="dd-kicker"><Icon name="git-branch" size={13} stroke={2} /> {cur.kicker || "Deep dive"}</p>
                <h2 className="dd-title">{cur.title || cur.label}</h2>
              </div>
              <button className="dd-close" onClick={onClose} aria-label="Close deep dive"><Icon name="x" size={18} stroke={2} /></button>
            </div>
            <div className="dd-body">{Panel ? <Panel /> : null}</div>
          </>
        ) : null}
      </aside>
    </>
  );
}

/* ---- a reusable mini-stepper for inside deep-dive panels ----------------- */
function DeepSteps({ steps }) {
  const [j, setJ] = React.useState(0);
  const S = steps[j];
  return (
    <div>
      <div>{typeof S.render === "function" ? S.render() : S.render}</div>
      <div className="dd-subnav">
        <button disabled={j === 0} onClick={() => setJ(j - 1)}><Icon name="arrow-left" size={14} stroke={2} /> Back</button>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg3)" }}>{S.label || `${j + 1} / ${steps.length}`}</span>
        <button disabled={j === steps.length - 1} onClick={() => setJ(j + 1)}>Next <Icon name="arrow-right" size={14} stroke={2} /></button>
      </div>
    </div>
  );
}

/* ---- DeepDoc: a sectioned, tabbed deep-dive document --------------------
   For long appendices: a sticky sub-nav of sections + Back/Next, one rich
   section (prose + diagram) at a time. Pass to a deep dive as its Panel:
     Panel: () => <DeepDoc sections={[{id,label,title,intro?,render}]} />        */
function DeepDoc({ sections }) {
  const [k, setK] = React.useState(0);
  const railRef = React.useRef(null);
  const S = sections[k];
  const go = (n) => { setK(Math.max(0, Math.min(sections.length - 1, n))); };
  React.useEffect(() => { const b = railRef.current && railRef.current.closest(".dd-body"); if (b) b.scrollTo({ top: 0 }); }, [k]);
  return (
    <div className="dd-doc">
      <div className="dd-tabs">
        {sections.map((s, i) => (
          <button key={s.id} className={"dd-tab" + (i === k ? " on" : "")} onClick={() => go(i)}>
            <span className="dd-tab-n">{String(i + 1).padStart(2, "0")}</span>{s.label}
          </button>
        ))}
      </div>
      <div className="dd-sec" key={k} ref={railRef}>
        <h3 className="dd-sec-title">{S.title}</h3>
        {S.intro ? <p className="dd-sec-intro">{S.intro}</p> : null}
        <div className="dd-sec-body">{typeof S.render === "function" ? S.render() : S.render}</div>
      </div>
      <div className="dd-subnav">
        <button disabled={k === 0} onClick={() => go(k - 1)}><Icon name="arrow-left" size={14} stroke={2} /> {k > 0 ? sections[k - 1].label : "Back"}</button>
        <span className="dd-subnav-pos">{k + 1} / {sections.length}</span>
        <button disabled={k === sections.length - 1} onClick={() => go(k + 1)}>{k < sections.length - 1 ? sections[k + 1].label : "Done"} <Icon name="arrow-right" size={14} stroke={2} /></button>
      </div>
    </div>
  );
}

/* ---- the reader shell --------------------------------------------------- */
function StepReader({ chapter, section }) {
  const steps = chapter.steps;
  const total = steps.length;

  const readInitial = () => {
    // Only honour an explicit deep-link hash (#3). We deliberately do NOT
    // remember the last step in storage — leaving a chapter and returning
    // starts fresh at step 1.
    const h = (location.hash || "").match(/(\d+)/);
    if (h) { const n = parseInt(h[1], 10) - 1; if (n >= 0 && n < total) return n; }
    return 0;
  };

  const readTheme = () => {
    try { const t = localStorage.getItem("aallms:theme"); if (t === "light" || t === "dark") return t; } catch (e) {}
    return "dark";
  };

  const [i, setI] = React.useState(readInitial);
  const [theme, setTheme] = React.useState(readTheme);
  const [dive, setDive] = React.useState(null);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("aallms:theme", theme); } catch (e) {}
    const reassert = () => { document.documentElement.dataset.theme = theme; };
    window.addEventListener("pageshow", reassert);
    return () => window.removeEventListener("pageshow", reassert);
  }, [theme]);
  React.useEffect(() => {
    history.replaceState(null, "", "#" + (i + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [i, chapter.id]);

  const go = React.useCallback((n) => setI(Math.max(0, Math.min(total - 1, n))), [total]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (dive) return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); setI(v => Math.min(total - 1, v + 1)); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); setI(v => Math.max(0, v - 1)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dive, total]);

  const progress = ((i + 1) / total) * 100;

  return (
    <div className="rd">
      <div className="rd-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div className="rd-progress-fill" style={{ width: progress + "%" }} />
      </div>
      <header className="rd-top">
        <div className="rd-top-inner">
          <RdBrand />
          <nav className="rd-chapnav" aria-label="Sections">
            {(window.SECTIONS || [section]).map((s) => {
              const cur = s.id === section.id;
              return (
                <a key={s.id} href={s.chapters[0].href}
                   className={"rd-chaplink" + (cur ? " is-current" : "")}
                   aria-current={cur ? "page" : undefined}>
                  <span className="rd-chaplink-dot" data-ring={s.ring} />
                  <span className="rd-chaplink-t">{s.title}</span>
                </a>
              );
            })}
          </nav>
          <a className="rd-toplink" href="references.html">About</a>
          <ThemeToggle theme={theme} onToggle={() => setTheme(t => t === "dark" ? "light" : "dark")} />
        </div>
      </header>
      <div className="rd-chapstrip-wrap">
        <nav className="rd-chapstrip" aria-label={section.title + " chapters"}>
          <span className="rd-chapstrip-sec">{section.title}</span>
          {section.chapters.map((c) => {
            const cur = c.id === chapter.id;
            const cls = "rd-chapchip" + (cur ? " is-current" : "") + (c.soon ? " is-soon" : "");
            const inner = (<><span className="rd-chapchip-n">{c.num}</span>{c.title}</>);
            return c.soon
              ? <span key={c.id} className={cls} title={c.title + " — soon"}>{inner}</span>
              : <a key={c.id} href={c.href} className={cls} aria-current={cur ? "page" : undefined}>{inner}</a>;
          })}
        </nav>
      </div>

      <div className="rd-body">
        <main className="rd-main">
          <RdStep key={i} step={steps[i]} onDeeper={setDive} />
          <RdNav i={i} steps={steps} onGo={go} nextChapter={chapter.nextChapter} />
        </main>
      </div>

      <SiteFooter refsHref="references.html" />
      <DeepDive dive={dive} onClose={() => setDive(null)} />
    </div>
  );
}

Object.assign(window, { StepReader, DeepDive, DeepSteps, DeepDoc, useMounted, RdBrand });
