const { WorkerPool } = require("./worker-pool")

async function main() {
  const pool = new WorkerPool({ size: 2, queueLimit: 10 })
  const nums = [35, 36, 37, 35, 36]
  try {
    const results = await Promise.all(nums.map((n) => pool.exec({ n })))
    for (let i = 0; i < results.length; i++) {
      console.log("fib(" + nums[i] + ") =", results[i])
    }
  } finally {
    await pool.close()
    process.exit(0)
  }
}

main().catch((e) => {
  console.error(e && e.message ? e.message : e)
  process.exit(1)
})

