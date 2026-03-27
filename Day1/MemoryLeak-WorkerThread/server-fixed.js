const express = require("express")

const app = express()
const cache = new Map()
const MAX_ITEMS = Number(process.env.MAX_ITEMS) || 200
const TTL_MS = Number(process.env.TTL_MS) || 60_000

function cleanup(now) {
  for (const [k, v] of cache) {
    if (now - v.at > TTL_MS) cache.delete(k)
  }
  while (cache.size > MAX_ITEMS) {
    const k = cache.keys().next().value
    if (k === undefined) break
    cache.delete(k)
  }
}

app.get("/cache", (req, res) => {
  const kb = Math.max(1, Math.min(512, Number(req.query.kb) || 64))
  const key = req.query.key ? String(req.query.key) : "item:" + ((Date.now() / 1000) | 0)
  const now = Date.now()
  cleanup(now)
  if (!cache.has(key)) {
    const buf = Buffer.alloc(kb * 1024, "a")
    cache.set(key, { buf, at: now })
  } else {
    cache.get(key).at = now
  }
  res.json({ ok: true, cacheSize: cache.size, kb, key })
})

app.get("/stats", (req, res) => {
  cleanup(Date.now())
  const m = process.memoryUsage()
  res.json({
    cacheSize: cache.size,
    maxItems: MAX_ITEMS,
    ttlMs: TTL_MS,
    rss: m.rss,
    heapTotal: m.heapTotal,
    heapUsed: m.heapUsed,
    external: m.external
  })
})

const port = Number(process.env.PORT) || 3000
app.listen(port, () => console.log("fixed server on " + port))

