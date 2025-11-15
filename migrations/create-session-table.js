require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createSessionTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("sid")
      )
      WITH (OIDS=FALSE);
      
      CREATE INDEX IF NOT EXISTS "IDX_user_sessions_expire" ON "user_sessions" ("expire");
    `);
    
    console.log('Session table created successfully');
  } catch (error) {
    console.error('Error creating session table:', error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createSessionTable()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}