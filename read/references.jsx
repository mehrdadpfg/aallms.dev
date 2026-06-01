/* aallms — Sources page
   Standalone page that gathers every reference (was inline on the chapters).
   Globals: React, RdBrand, ThemeToggle, Icon, SECTIONS, RefIndex. */

function ReferencesPage() {
  const readTheme = () => {
    try { const t = localStorage.getItem("aallms:theme"); if (t === "light" || t === "dark") return t; } catch (e) {}
    return "dark";
  };
  const [theme, setTheme] = React.useState(readTheme);
  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("aallms:theme", theme); } catch (e) {}
    const reassert = () => { document.documentElement.dataset.theme = theme; };
    window.addEventListener("pageshow", reassert);
    return () => window.removeEventListener("pageshow", reassert);
  }, [theme]);

  const sections = (typeof window !== "undefined" && window.SECTIONS) ? window.SECTIONS : [];

  return (
    <div className="rd">
      <header className="rd-top">
        <div className="rd-top-inner">
          <RdBrand />
          <nav className="rd-chapnav" aria-label="Sections">
            {sections.map((s) => (
              <a key={s.id} href={s.chapters[0].href} className="rd-chaplink">
                <span className="rd-chaplink-dot" data-ring={s.ring} />
                <span className="rd-chaplink-t">{s.title}</span>
              </a>
            ))}
          </nav>
          <a className="rd-toplink is-current" href="references.html" aria-current="page">About</a>
          <ThemeToggle theme={theme} onToggle={() => setTheme(t => t === "dark" ? "light" : "dark")} />
        </div>
      </header>

      <div className="rd-body">
        <main className="rd-main">
          <div className="rd-step-head">
            <p className="rd-eyebrow">About</p>
            <h1 className="rd-title">Standing on the shoulders of giants</h1>
          </div>
          <div className="rd-prose" style={{ maxWidth: "68ch" }}>
            <p>It's easy to stand on the shoulders of giants. None of this would have been possible without the work and effort of everyone who publishes their projects open-source, puts their research into papers, and shares what they've learned along the way. This guide doesn't try to cover everything in detail — it's meant as a good place to grasp the overall <i>shape</i> of what's going on, alongside some of the very latest papers and research I've been most interested in. Hopefully it keeps getting updated regularly as I read more and new ideas come to light.</p>
          </div>
          <h2 className="ref-sources-h">Sources &amp; further reading</h2>
          <p className="ref-sources-note">The papers, talks, docs, and posts this guide leans on — grouped by theme, every entry links out. This list grows as I read more.</p>
          <RefIndex />
          <p className="ref-foot"><a href="../index.html"><Icon name="arrow-left" size={14} stroke={2.2} /> Back to the guide</a></p>
        </main>
      </div>
      <SiteFooter refsHref="references.html" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ReferencesPage />);
