const express = require("express")
const bcrypt = require("bcryptjs")
const User = require("../models/User")
const RefreshToken = require("../models/RefreshToken")
const { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } = require("../tokens")

function cleanEmail(v) {
  if (!v) return ""
  return String(v).trim().toLowerCase()
}

function pickRefreshFromReq(req) {
  const fromCookie = req.cookies && req.cookies.refresh
  const fromBody = req.body && req.body.refreshToken
  return fromBody || fromCookie || ""
}

function setRefreshCookie(res, token) {
  res.cookie("refresh", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/api/auth/refresh"
  })
}

function clearRefreshCookie(res) {
  res.clearCookie("refresh", { path: "/api/auth/refresh" })
}

function authRoutes(cfg) {
  const r = express.Router()

  r.post("/register", async (req, res) => {
    const email = cleanEmail(req.body.email)
    const password = String(req.body.password || "")
    const name = String(req.body.name || "").trim()

    if (!email || !password || password.length < 6) {
      return res.status(400).json({ message: "bad input" })
    }

    const exists = await User.findOne({ email })
    if (exists) return res.status(409).json({ message: "email already used" })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ email, passwordHash, name })

    const accessToken = signAccessToken({ userId: user._id, email: user.email }, cfg)
    const rt = signRefreshToken({ userId: user._id }, cfg)
    await RefreshToken.create({
      userId: user._id,
      jti: rt.jti,
      tokenHash: hashToken(rt.token),
      expiresAt: rt.expiresAt
    })

    setRefreshCookie(res, rt.token)
    return res.status(201).json({
      user: { id: String(user._id), email: user.email, name: user.name },
      accessToken,
      refreshToken: rt.token
    })
  })

  r.post("/login", async (req, res) => {
    const email = cleanEmail(req.body.email)
    const password = String(req.body.password || "")
    if (!email || !password) return res.status(400).json({ message: "bad input" })

    const user = await User.findOne({ email })
    if (!user) return res.status(401).json({ message: "wrong creds" })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ message: "wrong creds" })

    const accessToken = signAccessToken({ userId: user._id, email: user.email }, cfg)
    const rt = signRefreshToken({ userId: user._id }, cfg)
    await RefreshToken.create({
      userId: user._id,
      jti: rt.jti,
      tokenHash: hashToken(rt.token),
      expiresAt: rt.expiresAt
    })

    setRefreshCookie(res, rt.token)
    return res.json({
      user: { id: String(user._id), email: user.email, name: user.name },
      accessToken,
      refreshToken: rt.token
    })
  })

  r.post("/refresh", async (req, res) => {
    const token = pickRefreshFromReq(req)
    if (!token) return res.status(401).json({ message: "missing refresh token" })

    let payload
    try {
      payload = verifyRefreshToken(token, cfg)
    } catch (e) {
      return res.status(401).json({ message: "invalid refresh token" })
    }

    const jti = payload.jti
    const userId = payload.sub
    if (!jti || !userId) return res.status(401).json({ message: "invalid refresh token" })

    const doc = await RefreshToken.findOne({ jti, userId })
    if (!doc) return res.status(401).json({ message: "refresh not found" })
    if (doc.revokedAt) return res.status(401).json({ message: "refresh revoked" })
    if (doc.expiresAt.getTime() <= Date.now()) return res.status(401).json({ message: "refresh expired" })

    const same = doc.tokenHash === hashToken(token)
    if (!same) return res.status(401).json({ message: "refresh mismatch" })

    const user = await User.findById(userId)
    if (!user) return res.status(401).json({ message: "user missing" })

    const accessToken = signAccessToken({ userId: user._id, email: user.email }, cfg)
    const nextRt = signRefreshToken({ userId: user._id }, cfg)

    doc.revokedAt = new Date()
    doc.replacedByJti = nextRt.jti
    await doc.save()

    await RefreshToken.create({
      userId: user._id,
      jti: nextRt.jti,
      tokenHash: hashToken(nextRt.token),
      expiresAt: nextRt.expiresAt
    })

    setRefreshCookie(res, nextRt.token)
    return res.json({ accessToken, refreshToken: nextRt.token })
  })

  r.post("/logout", async (req, res) => {
    const token = pickRefreshFromReq(req)
    clearRefreshCookie(res)

    if (!token) return res.json({ ok: true })

    try {
      const payload = verifyRefreshToken(token, cfg)
      const doc = await RefreshToken.findOne({ jti: payload.jti, userId: payload.sub })
      if (doc && !doc.revokedAt) {
        doc.revokedAt = new Date()
        await doc.save()
      }
    } catch (e) {}

    return res.json({ ok: true })
  })

  return r
}

module.exports = authRoutes

