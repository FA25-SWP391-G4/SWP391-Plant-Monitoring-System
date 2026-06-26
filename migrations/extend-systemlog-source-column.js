/**
 * Migration: Extend system_logs.source column length
 * 
 * Increases the VARCHAR(100) column to VARCHAR(255) to accommodate
 * longer source identifiers and error messages without truncation.
 * 
 * Run: node migrations/extend-systemlog-source-column.js
 */

const { pool } = require('../config/db');

async function up() {
    try {
        console.log('Starting migration: Extend system_logs.source column...');

        // Check current column type
        const checkQuery = `
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'system_logs' 
            AND column_name = 'source';
        `;
        
        const checkResult = await pool.query(checkQuery);
        
        if (checkResult.rows.length === 0) {
            console.error('❌ Column system_logs.source not found');
            return false;
        }

        const currentLength = checkResult.rows[0].character_maximum_length;
        console.log(`Current source column length: ${currentLength}`);

        if (currentLength >= 255) {
            console.log('✅ Column is already 255 or larger, no migration needed');
            return true;
        }

        // Alter the column to VARCHAR(255)
        const alterQuery = `
            ALTER TABLE system_logs 
            ALTER COLUMN source TYPE VARCHAR(255);
        `;

        await pool.query(alterQuery);
        console.log('✅ Successfully extended source column to VARCHAR(255)');

        // Verify the change
        const verifyResult = await pool.query(checkQuery);
        const newLength = verifyResult.rows[0].character_maximum_length;
        console.log(`New source column length: ${newLength}`);

        return true;
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    }
}

async function down() {
    try {
        console.log('Rolling back migration: Reverting system_logs.source column...');

        // Check if any existing data would be truncated
        const checkDataQuery = `
            SELECT COUNT(*) as count 
            FROM system_logs 
            WHERE LENGTH(source) > 100;
        `;
        
        const result = await pool.query(checkDataQuery);
        const affectedRows = parseInt(result.rows[0].count);

        if (affectedRows > 0) {
            console.warn(`⚠️ Warning: ${affectedRows} rows have source values longer than 100 characters`);
            console.warn('Rolling back will truncate these values');
        }

        // Revert to VARCHAR(100)
        const revertQuery = `
            ALTER TABLE system_logs 
            ALTER COLUMN source TYPE VARCHAR(100);
        `;

        await pool.query(revertQuery);
        console.log('✅ Successfully reverted source column to VARCHAR(100)');

        return true;
    } catch (error) {
        console.error('❌ Rollback failed:', error.message);
        throw error;
    }
}

// Run migration if called directly
if (require.main === module) {
    const command = process.argv[2] || 'up';

    const runMigration = async () => {
        try {
            if (command === 'up') {
                await up();
            } else if (command === 'down') {
                await down();
            } else {
                console.error('Invalid command. Use: node extend-systemlog-source-column.js [up|down]');
                process.exit(1);
            }
            
            process.exit(0);
        } catch (error) {
            console.error('Migration error:', error);
            process.exit(1);
        }
    };

    runMigration();
}

module.exports = { up, down };
