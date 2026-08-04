import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable.');
}

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

const mongooseCache = global.mongoose;

export async function connectDB(): Promise<typeof mongoose> {
  if (mongooseCache.conn) {
    return mongooseCache.conn;
  }

  if (!mongooseCache.promise) {
    const opts = {
      bufferCommands: false,
    };

    // mongoose.connect accurately resolves to Promise<typeof mongoose>
    mongooseCache.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
  }
  
  try {
    mongooseCache.conn = await mongooseCache.promise;
  } catch (e: unknown) {
    mongooseCache.promise = null;
    throw e;
  }

  if (!mongooseCache.conn) {
    throw new Error('Failed to initialize database connection instance.');
  }

  return mongooseCache.conn;
}
