const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "plant_system",
  password: process.env.DB_PASS || "123456",
  port: process.env.DB_PORT || 5432,
});

// test connection once at startup
pool.connect()
  .then(() => console.log("PostgreSQL Connected successfully"))
  .catch(err => console.error("❌ PostgreSQL connection error:", err));

module.exports = pool;
