(() => {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (raw && (raw.startsWith("/api/jobs?search=") || raw.startsWith("/api/jobs/suggestions?"))) {
      const url = new URL(raw, window.location.origin);
      url.searchParams.set("cw_search", "2");
      return originalFetch(url.pathname + url.search, { ...init, cache: "no-store" });
    }
    return originalFetch(input, init);
  };
})();
