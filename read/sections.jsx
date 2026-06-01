/* aallms — shared section + chapter manifest
   The single source of truth for navigation. Flip `soon:false` as chapters
   ship. Each section maps to one shell of the landing's nested model.
   Exports to window: SECTIONS, SEC_TRANSFORMER, SEC_LLM, SEC_CONTEXT, SEC_HARNESS, secByChapter */

const SECTIONS = [
  {
    id: "transformer", title: "Transformer", ring: "transformer",
    chapters: [
      { num: "01", id: "tokenizer", title: "Tokenizer", href: "tokenizer.html" },
      { num: "02", id: "embedding", title: "Embedding", href: "embedding.html" },
      { num: "03", id: "attention", title: "Attention", href: "attention.html" },
      { num: "04", id: "forward-pass", title: "The forward pass", href: "forward-pass.html" },
      { num: "05", id: "training", title: "Training & fine-tuning", href: "training.html" },
      { num: "06", id: "modern", title: "Modern techniques", href: "modern.html" },
      { num: "07", id: "quantization", title: "Quantization", href: "quantization.html" },
      { num: "08", id: "inference", title: "Inference", href: "inference.html" },
    ],
  },
  {
    id: "llm", title: "The LLM", ring: "llm",
    chapters: [
      { num: "01", id: "llms-vs-rlms", title: "LLMs vs RLMs", href: "llms-vs-rlms.html" },
      { num: "02", id: "reasoning-models", title: "Reasoning models", href: "reasoning-models.html" },
    ],
  },
  {
    id: "context", title: "Context + Prompt", ring: "context",
    chapters: [
      { num: "01", id: "context-engineering", title: "Context engineering", href: "context-engineering.html" },
      { num: "02", id: "retrieval-rag", title: "Retrieval & RAG", href: "retrieval-rag.html" },
      { num: "03", id: "vector-databases", title: "Vector databases", href: "vector-databases.html" },
      { num: "04", id: "graph-retrieval", title: "Graph retrieval", href: "graph-retrieval.html" },
      { num: "05", id: "vectorless", title: "Vectorless retrieval", href: "vectorless.html" },
      { num: "06", id: "memory", title: "Memory", href: "memory.html" },
    ],
  },
  {
    id: "harness", title: "Harness", ring: "harness",
    chapters: [
      { num: "01", id: "harness-engineering", title: "Harness engineering", href: "harness-engineering.html" },
      { num: "02", id: "tools-mcp", title: "Tools & MCP", href: "tools-mcp.html" },
      { num: "03", id: "orchestration", title: "Orchestration", href: "orchestration.html" },
      { num: "04", id: "meta-harness", title: "Meta-harness", href: "meta-harness.html" },
    ],
  },
];

const SEC_TRANSFORMER = SECTIONS[0];
const SEC_LLM = SECTIONS[1];
const SEC_CONTEXT = SECTIONS[2];
const SEC_HARNESS = SECTIONS[3];

function secByChapter(chapterId) {
  return SECTIONS.find(s => s.chapters.some(c => c.id === chapterId)) || SECTIONS[0];
}
/* set the next-chapter link for a chapter (within its section) */
function nextOf(chapterId) {
  const s = secByChapter(chapterId);
  const idx = s.chapters.findIndex(c => c.id === chapterId);
  const n = s.chapters[idx + 1];
  return n && !n.soon ? { title: n.title, href: n.href } : null;
}

Object.assign(window, { SECTIONS, SEC_TRANSFORMER, SEC_LLM, SEC_CONTEXT, SEC_HARNESS, secByChapter, nextOf });
