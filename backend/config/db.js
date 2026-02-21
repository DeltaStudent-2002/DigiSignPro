const mongoose = require('mongoose');

mongoose.set('bufferTimeoutMS', 30000);

// Track connection state
let isConnected = false;

const connectDB = async () => {
  // If already connected, don't reconnect
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return mongoose.connection;
  }

  try {
    // Use environment variable or default to MongoDB Atlas connection
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('Please provide MONGODB_URI in .env file');
      console.log('Get your free MongoDB Atlas connection string at: https://www.mongodb.com/cloud/atlas');
      // Don't exit in serverless - just log warning
      if (!process.env.VERCEL) {
        process.exit(1);
      }
      return null;
    }
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      maxPoolSize: 1,
      minPoolSize: 0,
      retryWrites: false,
      retryReads: false,
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });
    
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
      isConnected = true;
    });
    
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    isConnected = false;
    
    // In serverless, don't retry - just return null
    if (process.env.VERCEL) {
      console.log('Running in serverless mode - skipping retry');
      return null;
    }
    
    // In non-serverless, retry after delay
    setTimeout(() => {
      console.log('Retrying MongoDB connection in 5 seconds...');
      connectDB();
    }, 5000);
    
    return null;
  }
};

// Export function that checks connection before each request
module.exports = connectDB;

// Export helper to check if DB is connected
module.exports.isConnected = () => {
  return mongoose.connection.readyState === 1;
};
