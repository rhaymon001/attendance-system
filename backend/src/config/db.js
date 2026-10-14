const mongoose = require('mongoose');

/**
 * connectDB
 * ---------
 * Connects to MongoDB Atlas using the MONGO_URI environment variable.
 * Logs connection status or errors.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
