const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    // Handle MongoDB connection errors
    if (err.name === 'MongooseError' || err.message.includes('buffering timed out')) {
      console.error('MongoDB Connection Error:', err.message);
      return res.status(503).json({
        message: 'Service temporarily unavailable',
        error: 'Database connection error'
      });
    }
    next(err);
  });
};

module.exports = asyncHandler;
