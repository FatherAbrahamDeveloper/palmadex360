// Small, safe Markdown renderer for Knowledge Base articles.
// All text is HTML-escaped first, so article content can never inject scripts.
const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(text) {
  let s = escape(text);
  s = s.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-[0.9em]">$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, (m, label, url) =>
    `<a href="${url}" class="text-primary underline" ${url.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`);
  return s;
}

export function renderMarkdown(src = "") {
  const lines = String(src).replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let list = null;
  let para = [];
  let code = null;

  const flushPara = () => { if (para.length) { out.push(`<p class="mb-3 leading-relaxed">${inline(para.join(" "))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.type} class="mb-3 ml-5 space-y-1 ${list.type === "ol" ? "list-decimal" : "list-disc"}">${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.type}>`); list = null; } };

  for (const line of lines) {
    if (code !== null) {
      if (line.startsWith("```")) { out.push(`<pre class="mb-3 p-3 rounded-lg bg-muted overflow-x-auto text-sm"><code>${escape(code.join("\n"))}</code></pre>`); code = null; }
      else code.push(line);
      continue;
    }
    if (line.startsWith("```")) { flushPara(); flushList(); code = []; continue; }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      flushPara(); flushList();
      const size = ["text-2xl", "text-xl", "text-lg", "text-base"][h[1].length - 1];
      out.push(`<h${h[1].length + 1} class="${size} font-heading font-bold mt-5 mb-2">${inline(h[2])}</h${h[1].length + 1}>`);
      continue;
    }
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      flushPara();
      const type = ul ? "ul" : "ol";
      if (!list || list.type !== type) { flushList(); list = { type, items: [] }; }
      list.items.push((ul || ol)[1]);
      continue;
    }
    if (/^>\s?/.test(line)) { flushPara(); flushList(); out.push(`<blockquote class="mb-3 border-l-4 border-primary/40 pl-3 text-muted-foreground">${inline(line.replace(/^>\s?/, ""))}</blockquote>`); continue; }
    if (/^---+$/.test(line.trim())) { flushPara(); flushList(); out.push('<hr class="my-4 border-border" />'); continue; }
    if (!line.trim()) { flushPara(); flushList(); continue; }
    flushList();
    para.push(line.trim());
  }
  if (code !== null) out.push(`<pre class="mb-3 p-3 rounded-lg bg-muted overflow-x-auto text-sm"><code>${escape(code.join("\n"))}</code></pre>`);
  flushPara(); flushList();
  return out.join("\n");
}
