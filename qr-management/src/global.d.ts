import mongoose from 'mongoose';

// Create an isolated alias referencing the library instance types 
// outside of the global namespace container block
type MongooseModuleInstance = typeof mongoose;

declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: MongooseModuleInstance | null;
    promise: Promise<MongooseModuleInstance> | null;
  } | undefined;
}

export {};
