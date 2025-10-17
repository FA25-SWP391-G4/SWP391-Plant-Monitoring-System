const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123@127.0.0.1:5432/plant_system',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runImageAnalysisMigration() {
    try {
        console.log('Running image_analysis table migration...');
        
        // Read the migration file
        const migrationPath = path.join(__dirname, 'migrations', 'create_image_analysis_table.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute the migration
        await pool.query(migrationSQL);
        
        console.log('✅ Image analysis table migration completed successfully');
        
        // Verify the table was created
        const checkQuery = `
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'image_analysis' 
            ORDER BY ordinal_position;
        `;
        
        const result = await pool.query(checkQuery);
        console.log('\n📋 Image analysis table structure:');
        result.rows.forEach(row => {
            console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // Check indexes
        const indexQuery = `
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'image_analysis';
        `;
        
        const indexResult = await pool.query(indexQuery);
        console.log('\n🔍 Indexes created:');
        indexResult.rows.forEach(row => {
            console.log(`  - ${row.indexname}`);
        });
        
    } catch (error) {
        console.error('❌ Error running image analysis migration:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the migration
if (require.main === module) {
    runImageAnalysisMigration()
        .then(() => {
            console.log('\n🎉 Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = runImageAnalysisMigration;