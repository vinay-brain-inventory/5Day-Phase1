const express = require("express")

const app = express()
const cache = new Map()

app.get("/leak", (req, res) => {
  const kb = Math.max(1, Math.min(512, Number(req.query.kb) || 64))
  const key = Date.now().toString(36) + Math.random().toString(36).slice(2)
  const buf = Buffer.alloc(kb * 1024, "a")
  cache.set(key, { buf, at: Date.now() })
  res.json({ ok: true, cacheSize: cache.size, kb })
})

app.get("/stats", (req, res) => {
  const m = process.memoryUsage()
  res.json({
    cacheSize: cache.size,
    rss: m.rss,
    heapTotal: m.heapTotal,
    heapUsed: m.heapUsed,
    external: m.external
  })
})

const port = Number(process.env.PORT) || 3000
app.listen(port, () => console.log("leaky server on " + port))

