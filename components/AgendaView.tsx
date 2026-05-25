// Minimal, zero-dep markdown renderer for agenda output.
// Supports headings, bullets, numbered lists, blockquotes, bold, code, paragraphs.

function renderInline(line: string) {
  let s = escapeHtml(line);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return s;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderMarkdown(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let inBq = false;

  function closeLists() {
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (inOl) { out.push("</ol>"); inOl = false; }
    if (inBq) { out.push("</blockquote>"); inBq = false; }
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) { closeLists(); continue; }
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^###\s+(.*)/))) { closeLists(); out.push(`<h3>${renderInline(m[1])}</h3>`); continue; }
    if ((m = line.match(/^##\s+(.*)/))) { closeLists(); out.push(`<h2>${renderInline(m[1])}</h2>`); continue; }
    if ((m = line.match(/^#\s+(.*)/))) { closeLists(); out.push(`<h1>${renderInline(m[1])}</h1>`); continue; }
    if ((m = line.match(/^>\s?(.*)/))) {
      if (!inBq) { closeLists(); out.push("<blockquote>"); inBq = true; }
      out.push(`<p>${renderInline(m[1])}</p>`);
      continue;
    }
    if ((m = line.match(/^\s*[-*]\s+(.*)/))) {
      if (!inUl) { if (inOl) { out.push("</ol>"); inOl = false; } if (inBq) { out.push("</blockquote>"); inBq = false; } out.push("<ul>"); inUl = true; }
      out.push(`<li>${renderInline(m[1])}</li>`);
      continue;
    }
    if ((m = line.match(/^\s*\d+\.\s+(.*)/))) {
      if (!inOl) { if (inUl) { out.push("</ul>"); inUl = false; } if (inBq) { out.push("</blockquote>"); inBq = false; } out.push("<ol>"); inOl = true; }
      out.push(`<li>${renderInline(m[1])}</li>`);
      continue;
    }
    closeLists();
    out.push(`<p>${renderInline(line)}</p>`);
  }
  closeLists();
  return out.join("\n");
}

export function AgendaView({ markdown }: { markdown: string }) {
  return (
    <div
      className="prose-talk"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
    />
  );
}
