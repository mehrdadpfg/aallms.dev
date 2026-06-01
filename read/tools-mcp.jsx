/* aallms — chapter · Tools & MCP
   What a tool is, how to design one well, and how MCP turns tools into a
   shareable bundle. Lifts HarnessTools + HarnessMCP from the harness seed and
   expands them. Globals: React, Icon, nextOf. Exports: TOOLSMCP_CH. */

/* =================================================== 1 · TOOLS ============ */
const TM_TOOLS = [
  { id: "search", icon: "search", call: "web_search(query=\"aallms release date\")", result: "[3 results] \"aallms launched in 2026…\"" },
  { id: "code", icon: "terminal", call: "run_python(\"sum(range(101))\")", result: "5050" },
  { id: "file", icon: "file-text", call: "read_file(\"notes/spec.md\")", result: "\"# Spec\\n- must support dark mode…\"" },
];
function HarnessTools() {
  const [t, setT] = React.useState("search");
  const cur = TM_TOOLS.find(x => x.id === t);
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        {TM_TOOLS.map(x => <button key={x.id} className={t === x.id ? "on" : ""} onClick={() => setT(x.id)}>{x.id}</button>)}
      </div>
      <div className="fp-plate rd-plate ht-flow">
        <div className="ht-block ht-call"><span className="ht-lab" style={{ color: "var(--accent)" }}>model emits (just text)</span><code>{cur.call}</code></div>
        <div className="ht-mid"><span className="ht-tool"><Icon name={cur.icon} size={16} stroke={2} /></span><Icon name="arrow-down" size={16} stroke={2} /></div>
        <div className="ht-block ht-result"><span className="ht-lab" style={{ color: "var(--concept-key)" }}>harness runs it, pastes result back (as tokens)</span><code>{cur.result}</code></div>
      </div>
      <p className="dg-read">A <b>tool</b> is just a function the model is told it can call. It writes the call as text; the <b>harness</b> runs the real function and pastes the <b>result back into the context</b> as more tokens. The model can't actually <i>do</i> anything itself — it proposes, and the harness disposes.</p>
    </div>
  );
}

/* =================================================== 2 · TOOL DESIGN ====== */
/* Contrast a clear tool set with an overlapping, ambiguous one. The model is
   asked a single task; in the clear set the choice is obvious, in the muddy
   set several tools could plausibly apply and nothing is unambiguous. */
const TM_TASK = "Read the file notes/spec.md and tell me what's in it.";
const TM_SETS = {
  clear: {
    pick: "read_file",
    tools: [
      { name: "read_file", params: "path: string", note: "returns the file's text", hot: true },
      { name: "write_file", params: "path: string, text: string", note: "overwrites a file" },
      { name: "list_dir", params: "path: string", note: "lists a directory's entries" },
    ],
  },
  muddy: {
    pick: null,
    tools: [
      { name: "get_file", params: "name", note: "gets a file (maybe by name?)" },
      { name: "fetch", params: "target", note: "fetches a thing — file, url, or record" },
      { name: "open_resource", params: "id", note: "opens a resource by id" },
      { name: "read", params: "x", note: "reads x" },
    ],
  },
};
function ToolDesign() {
  const [set, setSet] = React.useState("clear");
  const S = TM_SETS[set];
  const clear = set === "clear";
  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        <button className={clear ? "on" : ""} onClick={() => setSet("clear")}>Clear tool set</button>
        <button className={!clear ? "on" : ""} onClick={() => setSet("muddy")}>Ambiguous tool set</button>
      </div>

      <div className="fp-plate rd-plate td-stage">
        <div className="td-task"><span className="td-task-lab">the task</span><code>{TM_TASK}</code></div>

        <div className="td-tools">
          {S.tools.map(t => (
            <div key={t.name} className={"td-tool" + (t.hot ? " is-pick" : "")}>
              <div className="td-tool-sig">
                <Icon name={t.hot ? "check" : (clear ? "wrench" : "help-circle")} size={13} stroke={2.2} />
                <code className="td-tool-name">{t.name}</code>
                <code className="td-tool-params">({t.params})</code>
              </div>
              <span className="td-tool-note">{t.note}</span>
            </div>
          ))}
        </div>

        <div className={"td-verdict" + (clear ? " is-ok" : " is-bad")}>
          <Icon name={clear ? "check-circle-2" : "alert-triangle"} size={15} stroke={2} />
          {clear
            ? <span>One tool obviously fits: <b>read_file(path)</b>. Names and parameters point straight at it.</span>
            : <span>Four tools could plausibly apply, and none is unambiguous. If an engineer can't pick, neither can the agent.</span>}
        </div>
      </div>

      <p className="dg-read">A good tool is <b>self-contained</b>, <b>robust to error</b>, and <b>extremely clear</b>: descriptive names, unambiguous parameters, and token-efficient returns. Just as important is the <i>set</i> — minimise overlap and keep it small. A bloated, overlapping tool set is a tax the model pays on every turn; if a human engineer can't tell which tool applies, the agent has no chance either.</p>
    </div>
  );
}

/* =================================================== 3 · TOOLS → MCP ====== */
const TM_SERVERS = [
  { id: "github", icon: "git-pull-request", tools: ["create_issue", "open_pr", "list_repos"] },
  { id: "filesystem", icon: "folder", tools: ["read_file", "write_file", "list_dir"] },
  { id: "search", icon: "search", tools: ["web_search", "fetch_url"] },
];
const TM_WIRED = [
  { id: "gh", icon: "git-pull-request", call: "create_issue" },
  { id: "fs", icon: "folder", call: "read_file" },
  { id: "sr", icon: "search", call: "web_search" },
  { id: "db", icon: "database", call: "run_query" },
];
function HarnessMCP() {
  const [mode, setMode] = React.useState("wired");   // "wired" | "mcp"
  const [phase, setPhase] = React.useState("done");  // "connecting" | "done"
  const isMcp = mode === "mcp";

  React.useEffect(() => {
    if (!isMcp) { setPhase("done"); return; }
    setPhase("connecting");
    const id = setTimeout(() => setPhase("done"), 1100);
    return () => clearTimeout(id);
  }, [isMcp]);

  return (
    <div>
      <div className="dg-seg" style={{ marginBottom: "var(--sp-4)" }}>
        <button className={!isMcp ? "on" : ""} onClick={() => setMode("wired")}>Hand-wired tools</button>
        <button className={isMcp ? "on" : ""} onClick={() => setMode("mcp")}>MCP</button>
      </div>

      <div className="fp-plate rd-plate mcp-stage">
        <div className="mcp-harness">
          <Icon name="box" size={18} stroke={1.9} />
          <b>harness</b>
          <span>{isMcp ? "MCP client" : "host program"}</span>
        </div>

        {!isMcp ? (
          <div className="mcp-wired">
            <div className="mcp-wired-rail" aria-hidden="true" />
            {TM_WIRED.map(t => (
              <div key={t.id} className="mcp-wtool">
                <span className="mcp-solder" aria-hidden="true" />
                <span className="mcp-chip"><Icon name={t.icon} size={14} stroke={2} /></span>
                <code>{t.call}()</code>
                <span className="mcp-wlab">bespoke</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mcp-net">
            <div className={"mcp-link" + (phase === "connecting" ? " is-handshake" : "")}>
              <Icon name="plug-zap" size={15} stroke={2} />
              <span>{phase === "connecting" ? "discovering…" : "standard protocol"}</span>
            </div>
            <div className="mcp-servers">
              {TM_SERVERS.map((s, si) => (
                <div key={s.id} className="mcp-server">
                  <div className="mcp-server-head">
                    <span className="mcp-socket" aria-hidden="true" />
                    <Icon name={s.icon} size={14} stroke={2} />
                    <b>{s.id}</b>
                    <span className="mcp-tag">server</span>
                  </div>
                  <div className="mcp-toolset">
                    {s.tools.map((tl, ti) => (
                      <code key={tl}
                        className={"mcp-pop" + (phase === "done" ? " is-in" : "")}
                        style={{ transitionDelay: phase === "done" ? (si * 90 + ti * 70) + "ms" : "0ms" }}>
                        {tl}
                      </code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mcp-readout">
        <div className={"mcp-card" + (!isMcp ? " is-active" : "")}>
          <span className="mcp-card-h">Hand-wired</span>
          <p><b className="mcp-ok">Simple.</b> No server, no protocol — just functions on the harness. <b className="mcp-no">But</b> every tool is re-implemented for every harness.</p>
        </div>
        <div className={"mcp-card" + (isMcp ? " is-active" : "")}>
          <span className="mcp-card-h">MCP</span>
          <p><b className="mcp-ok">Discoverable & reusable.</b> One server's tools work in <i>any</i> MCP client, found at connect time. <b className="mcp-no">But</b> there's a server + protocol to run.</p>
        </div>
      </div>

      <p className="dg-read"><b>MCP</b> (the Model Context Protocol) is an open standard. Instead of bolting each function into one harness by hand, an MCP <b>server</b> exposes a whole bundle of tools and resources over a standard interface that any MCP <b>client</b> can <b>discover at connect time</b>. A tool is the capability; MCP is how a harness plugs into a bundle of them — without bespoke glue.</p>
    </div>
  );
}

/* =================================================== 4 · IN PRACTICE ====== */
const TM_COMPARE = [
  { dim: "Setup", bespoke: "A function on the harness", mcp: "A server speaking the protocol" },
  { dim: "Discovery", bespoke: "Hand-wired, known in advance", mcp: "Listed by the server at connect time" },
  { dim: "Reuse", bespoke: "Re-implemented per harness", mcp: "One server, any MCP client" },
  { dim: "Moving parts", bespoke: "None beyond the harness", mcp: "A server + transport to run" },
  { dim: "Best when", bespoke: "A few tools, one app", mcp: "Shared tools across many clients" },
];
function ToolVsMcp() {
  return (
    <div>
      <div className="fp-plate rd-plate tv-stage">
        <div className="tv-grid">
          <div className="tv-head tv-dim" />
          <div className="tv-head tv-col-b"><Icon name="wrench" size={14} stroke={2} />Bespoke tool</div>
          <div className="tv-head tv-col-m"><Icon name="plug-zap" size={14} stroke={2} />MCP</div>
          {TM_COMPARE.map(r => (
            <React.Fragment key={r.dim}>
              <div className="tv-dim">{r.dim}</div>
              <div className="tv-cell tv-col-b">{r.bespoke}</div>
              <div className="tv-cell tv-col-m">{r.mcp}</div>
            </React.Fragment>
          ))}
        </div>
        <div className="tv-foot">
          <Icon name="git-merge" size={15} stroke={2} />
          <span>Complementary, not rivals — MCP is just a reusable package and transport for the same tools.</span>
        </div>
      </div>
      <p className="dg-read">Reach for a <b>bespoke tool</b> when you have a handful of capabilities living in one app: nothing extra to run, just functions. Reach for <b>MCP</b> when those capabilities should be <b>discoverable and shared</b> across many harnesses — at the cost of a server and a protocol. The same capability, built once, can be wired in directly <i>or</i> packaged behind MCP. They sit on a spectrum, not in opposition.</p>
    </div>
  );
}

/* ================================================== CHAPTER CONFIG ========= */
const TOOLSMCP_CH = {
  id: "tools-mcp", title: "Tools & MCP", nextChapter: nextOf("tools-mcp"),
  steps: [
    { eyebrow: "STEP 01 · TOOLS & MCP", title: "Tools turn tokens into actions", navTitle: "Tools",
      lead: "A bare model can only write text. A tool is how that text becomes a real action in the world.",
      Body: () => (<><p>The model can't browse, run code, or read a file — it can only emit tokens. A <b>tool</b> bridges that gap: it's a function the model is <i>told</i> it can call. The model writes the call as text, the harness executes the real function, and the result is pasted back into context as more tokens.</p><p>Pick a tool and watch the round-trip. The model proposes; the harness disposes.</p></>),
      Diagram: HarnessTools, caption: "The model emits a call as text; the harness runs the real function and feeds the result back as ordinary tokens." },

    { eyebrow: "STEP 02 · TOOLS & MCP", title: "Designing good tools", navTitle: "Tool design",
      Body: () => (<><p>Giving a model a tool isn't enough — the tool has to be <i>usable</i>. The best ones are <b>self-contained</b>, <b>robust to error</b>, and <b>extremely clear</b>: descriptive names, unambiguous parameters, and returns that don't flood the context.</p><p>And the set matters as much as each tool. Toggle between a clear set and an overlapping one to feel the difference.</p></>),
      Diagram: ToolDesign, caption: "Same task, two tool sets. Clear names and parameters make the choice obvious; overlap and vagueness leave the agent guessing." },

    { eyebrow: "STEP 03 · TOOLS & MCP", title: "From tools to MCP", navTitle: "MCP",
      Body: () => (<><p>You've seen a <b>tool</b>: one function the harness exposes. But who wires it in? In the simple case, the harness does — by hand, one integration at a time.</p><p><b>MCP</b> (the Model Context Protocol) offers another route: an open standard where a server advertises a whole bundle of tools, and any compatible client can discover them at connect time. Toggle the two and watch the wiring change.</p></>),
      Diagram: HarnessMCP, caption: "Bespoke wiring vs a standard socket. A tool is the capability; MCP is how a harness plugs into a bundle of them." },

    { eyebrow: "STEP 04 · TOOLS & MCP", title: "Tool vs MCP, in practice", navTitle: "In practice",
      Body: () => (<><p>So when do you reach for each? A <b>bespoke tool</b> is simplest — no extra moving parts — but gets re-implemented in every harness. <b>MCP</b> is discoverable and reusable across clients, at the cost of a server and a protocol to run.</p><p>They're complementary, not rivals: the same capability can be wired in directly or packaged behind MCP.</p></>),
      Diagram: ToolVsMcp, caption: "Bespoke tools and MCP trade simplicity for reuse. The same capability can live either way." },
  ],
};

Object.assign(window, { TOOLSMCP_CH });
