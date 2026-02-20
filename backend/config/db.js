const mongoose = require('mongoose');

const connectDB = async () => {
  try {
<<<<<<< Updated upstream
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://maheshdhondge26_db_user:57479979@cluster0.aqrmujo.mongodb.net/?appName=Cluster0';
    
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
=======
<<<<<<< HEAD
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/document-signing';
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Don't exit immediately, let the app run but log the error
    console.log('Warning: App will run without database connection');
=======
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://maheshdhondge26_db_user:57479979@cluster0.aqrmujo.mongodb.net/?appName=Cluster0';
    
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
>>>>>>> Stashed changes
    console.error(`Error: ${error.message}`);
    // Don't exit on Vercel - allow server to run
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
<<<<<<< Updated upstream
=======
>>>>>>> bb360fa (added)
>>>>>>> Stashed changes
  }
};

module.exports = connectDB;
