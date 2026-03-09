const mongoose = require('mongoose');

mongoose.set('bufferTimeoutMS', 5001);

let isConnected = false;

const connectDB = async () => {
  // If already connected, reuse connection (important for Vercel)
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return mongoose.connection;
  }

  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('MONGODB_URI not found in environment variables');
      return null;
    }

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5,
    });

    isConnected = true;

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    return conn;
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    isConnected = false;
    return null;
  }
};

module.exports = connectDB;

module.exports.isConnected = () => {
  return mongoose.connection.readyState === 1;
};
