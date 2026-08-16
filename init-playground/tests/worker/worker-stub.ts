/// Phase E — minimal main worker for the Worker-boundary test config.
///
/// Exists only so `cloudflareTest()` has a `main` to bind; the tests that drive
/// D1 read `env.DB` directly from the test isolate (via `cloudflare:test`),
/// which are the same bindings the fetch path would use. We do NOT load the
/// heavy `entry-server.tsx` (TanStack Start SSR) here — Phase E's D1/runtime
/// invariants do not need the SSR tree, and shipping a tiny stub keeps the
/// §6.8 "ship what you use" boundary intact. The full worker fetch path is
/// covered separately via `SELF` in the fetch suite.
const worker: ExportedHandler = {
  fetch() {
    return Response.json({ ok: true });
  },
};

export default worker;
