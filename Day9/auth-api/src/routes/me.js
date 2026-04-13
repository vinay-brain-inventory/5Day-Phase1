const express = require("express")
const User = require("../models/User")
const { auth } = require("../middleware/auth")

function meRoutes(cfg) {
  const r = express.Router()

  r.get("/me", auth(cfg), async (req, res) => {
    const user = await User.findById(req.user.id).select("_id email name createdAt")
    if (!user) return res.status(404).json({ message: "not found" })
    return res.json({ user })
  })

  return r
}

module.exports = meRoutes

