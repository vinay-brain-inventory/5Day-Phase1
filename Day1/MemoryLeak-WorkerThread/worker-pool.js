const { Worker } = require("node:worker_threads")
const path = require("node:path")

class WorkerPool {
  constructor(opts) {
    opts = opts || {}
    this.size = Math.max(1, Number(opts.size) || 2)
    this.queueLimit = Math.max(1, Number(opts.queueLimit) || 100)
    this.workerFile = opts.workerFile || path.join(__dirname, "worker-task.js")
    this.workers = []
    this.free = []
    this.queue = []
    this.nextId = 1
    this.pending = new Map()
    for (let i = 0; i < this.size; i++) this._addWorker()
  }

  _addWorker() {
    const w = new Worker(this.workerFile)
    w.on("message", (msg) => this._onMessage(w, msg))
    w.on("error", (err) => this._onCrash(w, err))
    w.on("exit", (code) => {
      if (code !== 0) this._onCrash(w, new Error("worker exit " + code))
    })
    this.workers.push(w)
    this.free.push(w)
  }

  _onCrash(w, err) {
    for (const [id, p] of this.pending.entries()) {
      if (p.worker !== w) continue
      this.pending.delete(id)
      p.reject(err || new Error("worker crashed"))
    }
    const idx = this.workers.indexOf(w)
    if (idx >= 0) this.workers.splice(idx, 1)
    const fidx = this.free.indexOf(w)
    if (fidx >= 0) this.free.splice(fidx, 1)
    this._addWorker()
    this._drain()
  }

  _onMessage(w, msg) {
    if (!msg || !msg.id) return
    const p = this.pending.get(msg.id)
    if (!p) return
    this.pending.delete(msg.id)
    if (msg.type === "done") p.resolve(msg.result)
    else p.reject(new Error(msg.error || "worker error"))
    this.free.push(w)
    this._drain()
  }

  _drain() {
    while (this.free.length && this.queue.length) {
      const w = this.free.pop()
      const job = this.queue.shift()
      this.pending.set(job.id, { resolve: job.resolve, reject: job.reject, worker: w })
      w.postMessage({ type: "run", id: job.id, payload: job.payload })
    }
  }

  exec(payload) {
    if (this.queue.length + this.pending.size >= this.queueLimit) {
      return Promise.reject(new Error("queue full"))
    }
    const id = String(this.nextId++)
    return new Promise((resolve, reject) => {
      this.queue.push({ id, payload, resolve, reject })
      this._drain()
    })
  }

  async close() {
    const ws = this.workers.slice()
    this.workers = []
    this.free = []
    this.queue = []
    for (const w of ws) {
      try {
        await w.terminate()
      } catch (_) {}
    }
  }
}

module.exports = { WorkerPool }

