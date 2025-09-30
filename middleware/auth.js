const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ error: "Access token is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from Postgres
    const result = await pool.query(
      "SELECT user_id, email, full_name, role FROM users WHERE user_id = $1",
      [decoded.id]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid token - user not found" });
    }

    req.user = user; // attach to request
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Middleware to check user roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
