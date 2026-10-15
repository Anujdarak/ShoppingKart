const mongoose = require("mongoose");

let mongoConnectionPromise;

const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is required");
  }

  if (
    !mongoConnectionPromise ||
    mongoose.connection.readyState === 0 ||
    mongoose.connection.readyState === 3
  ) {
    mongoConnectionPromise = mongoose.connect(process.env.MONGO_URI).catch((error) => {
      mongoConnectionPromise = undefined;
      throw error;
    });
  }

  await mongoConnectionPromise;
};

module.exports = connectToDatabase;
