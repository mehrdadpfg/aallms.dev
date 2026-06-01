/* aallms — shared citation system (inline markers + footnotes)
   The user's reading list lives here once, keyed by id. A chapter binds the
   subset it cites, in the order it wants them numbered:

     const { Cite, Footnotes } = makeRefs(["anthropic-context-eng", "lost-middle"]);
     ... <Cite id="anthropic-context-eng" /> ...      // renders a [1] superscript
     ... <Footnotes />                                  // the numbered list

   Cite renders nothing for ids not in the bound list, so prose never breaks.
   Exports to window: REF_DB, makeRefs. */

const REF_DB = {
  /* ---- video lectures ---- */
  "yt-llm-1":            { url: "https://youtu.be/IS_y40zY-hc",  source: "YouTube",     title: "LLM deep-dive lecture (video)" },
  "yt-llm-2":            { url: "https://youtu.be/Xxuxg8PcBvc",  source: "YouTube",     title: "LLM / agents lecture (video)" },
  "karpathy-skills":     { url: "https://github.com/multica-ai/andrej-karpathy-skills", source: "GitHub", title: "andrej-karpathy-skills" },

  /* ---- context engineering / memory / window ---- */
  "anthropic-context-eng": { url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents", source: "Anthropic", title: "Effective context engineering for AI agents" },
  "cc-dynamic-context":  { url: "https://pub.towardsai.net/engineering-dynamic-context-the-claude-code-architecture-that-survives-production-77ee1f2b0e45", source: "Towards AI", title: "Engineering dynamic context — the Claude Code architecture" },
  "cc-context-window":   { url: "https://code.claude.com/docs/en/context-window", source: "Claude Code docs", title: "Context window" },
  "cc-memory":           { url: "https://code.claude.com/docs/en/memory", source: "Claude Code docs", title: "Memory" },
  "compression-strats":  { url: "https://zylos.ai/research/2026-02-28-ai-agent-context-compression-strategies", source: "Zylos AI", title: "AI agent context-compression strategies" },
  "logrocket-context":   { url: "https://blog.logrocket.com/llm-context-problem-strategies-2026/", source: "LogRocket", title: "The LLM context problem — strategies (2026)" },
  "arxiv-2601-11868":    { url: "https://arxiv.org/html/2601.11868v1", source: "arXiv", title: "arXiv:2601.11868" },
  "arxiv-2601-07190":    { url: "https://arxiv.org/pdf/2601.07190",   source: "arXiv", title: "arXiv:2601.07190" },
  "arxiv-2602-08316":    { url: "https://arxiv.org/pdf/2602.08316",   source: "arXiv", title: "arXiv:2602.08316" },
  "arxiv-2505-19433":    { url: "https://arxiv.org/pdf/2505.19433",   source: "arXiv", title: "arXiv:2505.19433" },
  "arxiv-2603-05344":    { url: "https://arxiv.org/pdf/2603.05344",   source: "arXiv", title: "arXiv:2603.05344" },
  "openreview-x0alNh":   { url: "https://openreview.net/pdf?id=x0alNh5o8v", source: "OpenReview", title: "OpenReview x0alNh5o8v" },

  /* ---- harness / agents / tools ---- */
  "openai-harness-eng":  { url: "https://openai.com/index/harness-engineering/", source: "OpenAI", title: "Harness engineering" },
  "firecrawl-harness":   { url: "https://www.firecrawl.dev/blog/what-is-an-agent-harness", source: "Firecrawl", title: "What is an agent harness" },
  "langchain-harness":   { url: "https://www.langchain.com/blog/the-anatomy-of-an-agent-harness", source: "LangChain", title: "The anatomy of an agent harness" },
  "meta-harness":        { url: "https://github.com/stanford-iris-lab/meta-harness", source: "Stanford IRIS Lab", title: "meta-harness" },
  "tbench":              { url: "https://www.tbench.ai/", source: "tbench.ai", title: "Terminal-Bench" },
  "arxiv-2603-28052":    { url: "https://arxiv.org/abs/2603.28052",  source: "arXiv", title: "arXiv:2603.28052" },
  "arxiv-2603-03329":    { url: "https://arxiv.org/html/2603.03329v1", source: "arXiv", title: "arXiv:2603.03329" },
  "arxiv-2510-00615":    { url: "https://arxiv.org/pdf/2510.00615",  source: "arXiv", title: "arXiv:2510.00615" },
  "mad-debate":          { url: "https://arxiv.org/abs/2305.14325",  source: "arXiv", title: "Improving factuality & reasoning via multi-agent debate (MAD)" },
  "free-mad":            { url: "https://arxiv.org/abs/2509.11035",  source: "arXiv", title: "Free-MAD: consensus-free multi-agent debate" },
};

/* Sources now live on a dedicated page (references.html), not inline on the
   interactive chapters. `Cite` and `Footnotes` are kept as no-ops so existing
   chapter code stays valid but renders nothing on the animated pages. */
function makeRefs(_ids) {
  const Cite = () => null;
  const Footnotes = () => null;
  return { Cite, Footnotes, refOrder: [] };
}

/* Ordered groups for the references page. Every id maps to REF_DB. */
const REF_GROUPS = [
  { id: "foundations", title: "Foundations & lectures",
    note: "Big-picture talks and curricula on how LLMs and agents actually work.",
    ids: ["yt-llm-1", "yt-llm-2", "karpathy-skills"] },
  { id: "context", title: "Context, retrieval & memory",
    note: "Context as a finite resource — what fills the window, retrieval, compaction, and durable memory.",
    ids: ["anthropic-context-eng", "cc-context-window", "cc-memory", "cc-dynamic-context", "compression-strats", "logrocket-context", "arxiv-2601-07190", "arxiv-2602-08316", "arxiv-2505-19433", "arxiv-2603-05344", "openreview-x0alNh"] },
  { id: "harness", title: "Harness, agents & evaluation",
    note: "The loop around the model — tools, orchestration, self-improving harnesses, and the evals that keep them honest.",
    ids: ["openai-harness-eng", "firecrawl-harness", "langchain-harness", "meta-harness", "mad-debate", "free-mad", "tbench", "arxiv-2603-28052", "arxiv-2603-03329", "arxiv-2510-00615", "arxiv-2601-11868"] },
];

/* host shown as a small monospace tag, e.g. "arxiv.org" */
function refHost(url) {
  try { return new URL(url).host.replace(/^www\./, ""); } catch (e) { return ""; }
}

/* The references index — rendered by references.html. */
function RefIndex() {
  return (
    <div className="refidx">
      {REF_GROUPS.map(g => (
        <section key={g.id} className="refgrp">
          <h2 className="refgrp-h">{g.title}</h2>
          {g.note ? <p className="refgrp-note">{g.note}</p> : null}
          <ol className="reflist">
            {g.ids.filter(id => REF_DB[id]).map(id => {
              const r = REF_DB[id];
              return (
                <li key={id} className="refitem">
                  <a href={r.url} target="_blank" rel="noopener noreferrer">
                    <span className="refitem-ttl">{r.title}</span>
                    <span className="refitem-meta"><span className="refitem-src">{r.source}</span><span className="refitem-host">{refHost(r.url)}</span></span>
                  </a>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

Object.assign(window, { REF_DB, REF_GROUPS, makeRefs, RefIndex });
