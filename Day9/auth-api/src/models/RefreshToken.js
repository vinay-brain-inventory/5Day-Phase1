const mongoose = require("mongoose")

const RefreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jti: { type: String, required: true, index: true, unique: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    replacedByJti: { type: String, default: null }
  },
  { timestamps: true }
)

RefreshTokenSchema.index({ userId: 1, jti: 1 })

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema)

