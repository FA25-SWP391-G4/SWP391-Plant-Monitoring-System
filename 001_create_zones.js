const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/plant_system',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createZonesTable() {
    try {
        console.log('Creating zones table...');
        
        // Create zones table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS zones (
                zone_id SERIAL PRIMARY KEY,
                zone_name VARCHAR(100) NOT NULL,
                user_id UUID NOT NULL,
                plant_id INTEGER NULL,
                description TEXT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_zones_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT fk_zones_plant FOREIGN KEY (plant_id) REFERENCES plants (plant_id) ON DELETE SET NULL ON UPDATE CASCADE,
                CONSTRAINT unique_zone_name_per_user UNIQUE (user_id, zone_name)
            );
        `);
        
        // Add zone_id column to plants table if it doesn't exist
        await pool.query(`
            ALTER TABLE plants 
            ADD COLUMN IF NOT EXISTS zone_id INTEGER,
            ADD COLUMN IF NOT EXISTS notes TEXT,
            ADD COLUMN IF NOT EXISTS image TEXT,
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'healthy',
            ADD CONSTRAINT fk_plants_zone FOREIGN KEY (zone_id) REFERENCES zones (zone_id) ON DELETE SET NULL;
        `);
        
        // Create indexes for performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_zones_user_id ON zones(user_id);
            CREATE INDEX IF NOT EXISTS idx_zones_plant_id ON zones(plant_id);
            CREATE INDEX IF NOT EXISTS idx_plants_zone_id ON plants(zone_id);
        `);
        
        console.log('✅ Zones table created successfully');
        console.log('✅ Plants table updated with zone_id, notes, image, status columns');
        
    } catch (error) {
        console.error('❌ Error creating zones table:', error);
        throw error;
    }
}

// Run migration if called directly
if (require.main === module) {
    createZonesTable()
        .then(() => {
            console.log('🎉 Zones migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { createZonesTable };