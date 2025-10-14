(async () => {
  const keyword = 'traveloka.com';
  const base = location.origin;
  const seen = new Set();

  const manifest = window.__BUILD_MANIFEST || {};
  for (const [key, value] of Object.entries(manifest)) {
    if (key.startsWith('__')) continue; // skip __rewrites, __BUILD_MANIFEST_CB, etc
    if (Array.isArray(value)) {
      value.forEach(path => {
        if (typeof path === 'string' && path.endsWith('.js')) {
          const full = new URL(path, base).href;
          seen.add(full);
        }
      });
    }
  }

  console.log('Total JS from manifest:', seen.size);

  const results = [];
  for (const url of seen) {
    try {
      const r = await fetch(url, { cache: 'no-cache' });
      const text = await r.text();
      if (text.includes(keyword)) {
        console.group(`🔎 FOUND in ${url}`);
        const lines = text.split('\n');
        lines.forEach((l,i)=>{
          if (l.includes(keyword)) console.log(`Line ${i+1}:`, l.trim());
        });
        console.groupEnd();
        results.push(url);
      }
    } catch(e) {
      console.warn('❌ Failed:', url, e.message);
    }
  }

  console.log('✅ Done. Found matches in:', results.length, 'files.');
})();
