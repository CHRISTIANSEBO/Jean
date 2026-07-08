// Minimal Markdown -> HTML renderer for assistant messages.
// Supports code blocks, headings (1-3), unordered/ordered lists, inline
// code/bold/italic, and paragraphs. Input is HTML-escaped before formatting.
export function parseMarkdown(text: string): string {
  function esc(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function inline(s: string) {
    return s.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  }
  const lines = text.split('\n'); const out: string[] = []; let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      const cl: string[] = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { cl.push(esc(lines[i])); i++; }
      i++; out.push(`<pre><code>${cl.join('\n')}</code></pre>`); continue;
    }
    const hm = line.match(/^(#{1,3}) (.+)/);
    if (hm) { out.push(`<h${hm[1].length}>${inline(esc(hm[2]))}</h${hm[1].length}>`); i++; continue; }
    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(`<li>${inline(esc(lines[i].replace(/^[-*] /, '')))}</li>`); i++; }
      out.push(`<ul>${items.join('')}</ul>`); continue;
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(`<li>${inline(esc(lines[i].replace(/^\d+\. /, '')))}</li>`); i++; }
      out.push(`<ol>${items.join('')}</ol>`); continue;
    }
    if (line.trim() === '') { i++; continue; }
    const pl: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^[-*] /.test(lines[i]) && !/^\d+\. /.test(lines[i]) && !/^#{1,3} /.test(lines[i]) && !lines[i].trim().startsWith('```')) {
      pl.push(inline(esc(lines[i]))); i++;
    }
    if (pl.length) out.push(`<p>${pl.join('<br>')}</p>`);
  }
  return out.join('');
}
