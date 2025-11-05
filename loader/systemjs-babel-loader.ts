declare const System: any;
declare const Babel: any; // Babel Standalone is globally available

(function() {
  const originalFetch = System.constructor.prototype.fetch;

  System.constructor.prototype.fetch = function(url: string, opts: RequestInit) {
    if (url.endsWith('.ts') || url.endsWith('.tsx')) {
      return originalFetch.call(this, url, opts)
        .then((response: Response) => {
          if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
          return response.text();
        })
        .then((source: string) => {
          try {
            const transformed = Babel.transform(source, {
              presets: ['typescript', 'react'],
              filename: url,
              sourceMaps: 'inline',
              retainLines: true,
            });
            // Create a Blob URL for the transpiled JavaScript
            const blob = new Blob([transformed.code], { type: 'application/javascript' });
            // Return a Response object containing the transpiled JS blob with correct Content-Type
            return new Response(blob, { headers: { 'Content-Type': 'application/javascript' } });
          } catch (e) {
            console.error(`Babel transformation failed for ${url}:`, e);
            throw e;
          }
        });
    }
    return originalFetch.call(this, url, opts);
  };
})();