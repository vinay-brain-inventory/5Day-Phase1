require("dotenv").config()

const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const { connectDb } = require("./db")
const authRoutes = require("./routes/auth")
const meRoutes = require("./routes/me")

const cfg = {
  PORT: process.env.PORT || 5050,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "access",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh",
  ACCESS_TOKEN_TTL_SECONDS: process.env.ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS: process.env.REFRESH_TOKEN_TTL_SECONDS,
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173"
}

async function main() {
  await connectDb(cfg.MONGODB_URI)

  const app = express()
  app.use(express.json({ limit: "200kb" }))
  app.use(cookieParser())
  app.use(
    cors({
      origin: cfg.CORS_ORIGIN,
      credentials: true
    })
  )

  app.get("/health", (req, res) => res.json({ ok: true }))
  app.use("/api/auth", authRoutes(cfg))
  app.use("/api", meRoutes(cfg))

  app.use((req, res) => res.status(404).json({ message: "not found" }))

  app.listen(cfg.PORT, () => {
    console.log("auth api on", cfg.PORT)
  })
}

main().catch((e) => {
  console.error(e && e.message ? e.message : e)
  process.exit(1)
})

