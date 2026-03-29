import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectMongo() {
  await mongoose.connect(env.mongoUri, {
    minPoolSize: env.mongoMinPoolSize,
    maxPoolSize: env.mongoMaxPoolSize,
    serverSelectionTimeoutMS: 5_000
  });
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}

