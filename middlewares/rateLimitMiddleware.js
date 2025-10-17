/**
 * Rate limiting configuration for API endpoints
 * Trong môi trường development, tất cả rate limit đều bị bỏ qua
 */

// Dummy middleware không thực hiện rate limit
const dummyMiddleware = (req, res, next) => {
    next();
};

// Sử dụng dummy middleware cho tất cả các rate limiter trong môi trường development
module.exports = {
    imageUploadLimiter: dummyMiddleware,
    imageUploadSpeedLimiter: dummyMiddleware,
    aiAnalysisLimiter: dummyMiddleware,
    generalApiLimiter: dummyMiddleware
};