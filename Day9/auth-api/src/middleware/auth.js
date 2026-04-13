const { verifyAccessToken } = require("../tokens")

function getBearer(req) {
  const h = req.headers.authorization || ""
  const parts = h.split(" ")
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") return parts[1]
  return null
}

function auth(cfg) {
  return function (req, res, next) {
    const token = getBearer(req)
    if (!token) return res.status(401).json({ message: "missing token" })

    try {
      const payload = verifyAccessToken(token, cfg)
      req.user = { id: payload.sub, email: payload.email }
      next()
    } catch (e) {
      return res.status(401).json({ message: "invalid token" })
    }
  }
}

module.exports = { auth }

