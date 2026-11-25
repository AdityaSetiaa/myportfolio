import mongoose from "mongoose";

const state = globalThis as typeof globalThis & { portfolioMongo?: Promise<typeof mongoose> };

export const mongoUri = () => process.env.MONGODB_URI || process.env.MONGO_URI;

export async function mongo() {
  const uri = mongoUri();
  if (!uri) throw new Error("MongoDB is not configured.");
  const dbName = process.env.MONGODB_DB || (new URL(uri).pathname.length > 1 ? undefined : "portfolio");
  state.portfolioMongo ??= mongoose.connect(uri, {
    dbName, serverSelectionTimeoutMS: 6000, bufferCommands: false, maxPoolSize: 10,
  }).catch(error => {
    delete state.portfolioMongo;
    throw error;
  });
  return (await state.portfolioMongo).connection;
}

const unavailableErrors = new Set([
  "MongooseServerSelectionError",
  "MongoServerSelectionError",
  "MongoNetworkError",
  "MongoNetworkTimeoutError",
  "MongoNotConnectedError",
  "MongoTopologyClosedError",
  "MongoPoolClearedError",
]);

export function isMongoUnavailable(error: unknown): error is Error {
  if (!(error instanceof Error)) return false;
  if (unavailableErrors.has(error.name)) return true;
  if ("syscall" in error && (error.syscall === "querySrv" || error.syscall === "queryTxt")) return true;
  return error.name === "MongooseError" && mongoose.connection.readyState !== 1;
}
