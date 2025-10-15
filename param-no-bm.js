(async () => {
  const keyword = 'xxx.com';
  const results = [];
  const failed = [];
  const seen = new Set();

  // ambil semua <script src=...>
  document.querySelectorAll('script[src]').forEach(s => seen.add(s.src));

  // ambil semua resource yang terdaftar di Performance API (termasuk preloaded js)
  performance.getEntriesByType('resource')
    .filter(r => r.name.endsWith('.js'))
    .forEach(r => seen.add(r.name));

  // ambil dari import map / module preload (kalau ada)
  document.querySelectorAll('link[rel="modulepreload"][href]')
    .forEach(l => seen.add(l.href));

  console.log('🔍 Total JS files found:', seen.size);

  // fungsi bantu cari context
  const findWithContext = (text, kw, ctx = 3) => {
    const lines = text.split(/\r?\n/);
    const out = [];
    lines.forEach((ln, i) => {
      if (ln.includes(kw)) {
        const start = Math.max(0, i - ctx);
        const end = Math.min(lines.length - 1, i + ctx);
        out.push({
          line: i + 1,
          snippet: lines.slice(start, end + 1).join('\n')
        });
      }
    });
    return out;
  };

  for (const url of seen) {
    try {
      const resp = await fetch(url, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      if (text.includes(keyword)) {
        const hits = findWithContext(text, keyword);
        results.push({ url, hits });
        console.group(`✅ FOUND in ${url}`);
        hits.forEach(h =>
          console.log(`Line ${h.line}:\n${h.snippet}\n---`)
        );
        console.groupEnd();
      }
    } catch (err) {
      failed.push({ url, error: err.message });
    }
  }

  console.log(`✅ Done. Found ${results.length} matching JS files.`);
  if (failed.length) {
    console.warn('⚠️ Some JS could not be fetched (CORS):');
    console.table(failed.slice(0, 30));
  }
})();
