/**
 * UPDATE USER ROLES MIGRATION
 * Adds 'Ultimate' to allowed user roles
 * Run with: node migrations/002_update_user_roles.js
 */

const { pool } = require('../config/db');

async function updateUserRoles() {
    try {
        console.log('Updating user roles to include Ultimate...');
        
        // Drop the existing CHECK constraint
        await pool.query(`
            ALTER TABLE users 
            DROP CONSTRAINT IF EXISTS users_role_check;
        `);
        
        // Add new CHECK constraint with Ultimate role
        await pool.query(`
            ALTER TABLE users 
            ADD CONSTRAINT users_role_check 
            CHECK (role IN ('Regular', 'Premium', 'Ultimate', 'Admin'));
        `);
        
        console.log('✅ User roles updated successfully');
        console.log('   Available roles: Regular, Premium, Ultimate, Admin');
        
    } catch (error) {
        console.error('❌ Error updating user roles:', error);
        throw error;
    }
}

// Run migration if called directly
if (require.main === module) {
    updateUserRoles()
        .then(() => {
            console.log('🎉 User roles migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { updateUserRoles };