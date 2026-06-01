# aallms.dev

An explorable, step-by-step guide to large language models — from the **transformer** at the core, out to the **harness** around it.

Tokenizer · Embedding · Attention · Forward pass · Training · Modern techniques · Quantization · Inference · LLMs vs RLMs · Reasoning models · Context engineering · Retrieval & RAG · Vector databases · Graph retrieval · Vectorless retrieval · Memory · Harness engineering · Tools & MCP · Orchestration · Meta-harness.

Each chapter is a discrete-step reader with interactive diagrams you can drag, scrub, toggle, and steer. A dark/light theme toggle persists across pages, and the landing hero shows the nested model (Transformer → LLM → Context → Harness).

## Running locally

It's a fully static site — no build step. Serve the folder with any static server:

```bash
python3 -m http.server 8731
# then open http://localhost:8731/index.html
```

## How it's built

Plain HTML + CSS, with React 18 + Babel-standalone loaded from CDN (no bundler). Shared design tokens live in `lib/colors_and_type.css`; the reader shell and chapter modules live in `read/`. Sources for every chapter are gathered on the [Sources page](read/references.html).

## Credits

Built on the shoulders of giants — see the [Sources & further reading](read/references.html) page for the papers, talks, docs, and open-source projects this guide leans on.
