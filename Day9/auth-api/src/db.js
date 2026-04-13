const mongoose = require("mongoose")

let connected = false

async function connectDb(uri) {
  if (connected) return mongoose.connection
  if (!uri) throw new Error("MONGODB_URI missing")

  mongoose.set("strictQuery", true)
  await mongoose.connect(uri)
  connected = true
  return mongoose.connection
}

module.exports = { connectDb }

