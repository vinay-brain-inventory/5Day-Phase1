const { parentPort } = require("node:worker_threads")

function fib(n) {
  if (n < 2) return n
  return fib(n - 1) + fib(n - 2)
}

parentPort.on("message", (msg) => {
  if (!msg || msg.type !== "run") return
  const { id, payload } = msg
  try {
    const n = Number(payload && payload.n)
    if (!Number.isFinite(n) || n < 0) throw new Error("bad input")
    const result = fib(n)
    parentPort.postMessage({ type: "done", id, result })
  } catch (err) {
    parentPort.postMessage({ type: "error", id, error: String(err && err.message ? err.message : err) })
  }
})

