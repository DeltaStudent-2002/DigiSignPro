const auditLogger = (req, res, next) => {
  const start = Date.now();
  
  // Capture original send
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log after response
    const duration = Date.now() - start;
    const logEntry = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString()
    };
    
    // Log to console (in production, you'd use a proper logging service)
    console.log('[AUDIT]', JSON.stringify(logEntry));
    
    // Call original send
    return originalSend.call(this, data);
  };
  
  next();
};

module.exports = auditLogger;
