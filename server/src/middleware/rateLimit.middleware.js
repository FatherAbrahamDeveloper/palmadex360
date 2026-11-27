// Small in-memory fixed-window rate limiter. Good for a single Node process (one Render instance).
// If the API ever runs on several processes, move this to a shared store.
export const rateLimit = ({ windowMs, max, message = "Too many requests. Please wait and try again.", key }) => {
  const hits = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
  }, Math.min(windowMs, 60_000)).unref();

  return (req, res, next) => {
    const id = key ? key(req) : req.ip;
    const now = Date.now();
    let entry = hits.get(id);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(id, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ message });
    }
    next();
  };
};
