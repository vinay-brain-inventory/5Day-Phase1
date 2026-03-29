import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    _id: { type: String }, // jti
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    replacedByTokenId: { type: String, default: null },
    userAgent: { type: String, default: null },
    ip: { type: String, default: null }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

refreshTokenSchema.index({ userId: 1, expiresAt: 1 });

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

