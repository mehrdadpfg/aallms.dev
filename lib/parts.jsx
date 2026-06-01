/* aallms — website UI kit · shared parts
   TopBar, ChapterRail, StepNav, ThemeToggle, Eyebrow, Caption, Figure, Icon.
   Exposed on window for the inline app script in index.html. */

/* --- Lucide icon wrapper (uses the CDN UMD global) --- */
function Icon({ name, size = 18, stroke = 2 }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const i = document.createElement("i");
    i.setAttribute("data-lucide", name);
    i.setAttribute("width", size);
    i.setAttribute("height", size);
    i.setAttribute("stroke-width", stroke);
    ref.current.appendChild(i);
    if (window.lucide) window.lucide.createIcons({ nameAttr: "data-lucide" });
  }, [name, size, stroke]);
  return <span className="ic" ref={ref} style={{ width: size, height: size, display: "inline-flex" }} />;
}

/* --- eyebrow / step label (mono, uppercase, tracked) --- */
function Eyebrow({ children }) {
  return <p className="eyebrow">{children}</p>;
}

/* --- diagram caption (italic serif) --- */
function Caption({ children }) {
  return <p className="caption"><span className="caption-mark">Fig.</span> {children}</p>;
}

/* --- a framed schematic figure on the graph-paper plate --- */
function Figure({ children, wide, caption }) {
  return (
    <figure className={"figure" + (wide ? " figure--wide" : "")}>
      <div className="fp-plate plate-pad">{children}</div>
      {caption ? <Caption>{caption}</Caption> : null}
    </figure>
  );
}

/* --- theme toggle --- */
function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="theme-btn" onClick={onToggle} aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}>
      <Icon name={theme === "dark" ? "sun" : "moon"} size={17} stroke={1.9} />
    </button>
  );
}

/* --- top bar: brand · live chapter · progress meter · theme --- */
function TopBar({ chapter, progress, theme, onToggle }) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <a className="brand" href="#top">
          <span className="brand-chev">
            <svg viewBox="0 0 20 42" width="15" height="30"><path d="M5 11 L13 21 L5 31" stroke="var(--accent)" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".4"/></svg>
            <svg viewBox="0 0 20 42" width="15" height="30"><path d="M5 11 L13 21 L5 31" stroke="var(--accent)" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".7"/></svg>
            <svg viewBox="0 0 20 42" width="15" height="30"><path d="M5 11 L13 21 L5 31" stroke="var(--accent)" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <span className="brand-word">aa<span className="brand-llm">llm</span>s<span className="brand-dev">.dev</span></span>
        </a>
        <div className="topbar-mid">
          <span className="topbar-chapter">{chapter}</span>
          <div className="topbar-meter"><div className="topbar-meter-fill" style={{ width: progress + "%" }} /></div>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggle} />
      </div>
    </header>
  );
}

/* --- left chapter rail --- */
function ChapterRail({ chapters, current, onJump }) {
  return (
    <nav className="rail" aria-label="Chapters">
      <p className="rail-title">The guide</p>
      <ol className="rail-list">
        {chapters.map((c, i) => (
          <li key={c.id}
              className={"rail-item" + (i === current ? " is-current" : "") + (i < current ? " is-done" : "")}
              onClick={() => onJump(i)}>
            <span className="rail-num">{String(i + 1).padStart(2, "0")}</span>
            <span className="rail-label">{c.title}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* --- bottom step navigation --- */
function StepNav({ prev, next, onPrev, onNext }) {
  return (
    <nav className="stepnav">
      <button className="stepnav-btn stepnav-prev" disabled={!prev} onClick={onPrev}>
        {prev ? (<><span className="stepnav-k"><Icon name="arrow-left" size={13} stroke={2} /> Previous</span><span className="stepnav-ti">{prev}</span></>) : null}
      </button>
      <button className="stepnav-btn stepnav-next" disabled={!next} onClick={onNext}>
        {next ? (<><span className="stepnav-k">Next <Icon name="arrow-right" size={13} stroke={2} /></span><span className="stepnav-ti">{next}</span></>) : null}
      </button>
    </nav>
  );
}

/* --- site footer (GitHub / LinkedIn / Sources) ---
   EDIT these two URLs to your real profiles. */
const SOCIAL = {
  github: "https://github.com/mehrdadpfg",
  linkedin: "https://www.linkedin.com/in/mehrdadpfg",
};
const GH_SVG = "M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-1.8c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.7.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.9 18.3 5.2 18.3 5.2c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z";
const LI_SVG = "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.74v20.5C0 23.2.8 24 1.77 24h20.45c.98 0 1.78-.8 1.78-1.76V1.74C24 .78 23.2 0 22.22 0z";
function SiteFooter({ refsHref = "references.html" }) {
  return (
    <footer className="site-foot">
      <div className="site-foot-inner">
        <span className="site-foot-brand">aa<span className="brand-llm">llm</span>s<span className="brand-dev">.dev</span></span>
        <nav className="site-foot-links" aria-label="Footer">
          <a className="site-foot-link" href={refsHref}>About</a>
          <a className="site-foot-ic" href={SOCIAL.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d={GH_SVG} /></svg>
          </a>
          <a className="site-foot-ic" href={SOCIAL.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d={LI_SVG} /></svg>
          </a>
        </nav>
      </div>
    </footer>
  );
}

Object.assign(window, { Icon, Eyebrow, Caption, Figure, ThemeToggle, TopBar, ChapterRail, StepNav, SiteFooter, SOCIAL });
