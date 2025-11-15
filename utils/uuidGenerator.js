/**
 * ============================================================================
 * UUID GENERATOR UTILITY
 * ============================================================================
 * 
 * Provides UUID v4 generation for database primary keys and unique identifiers
 * Used across the application for:
 * - User IDs (replacing auto-increment integers)
 * - Device keys (already using UUID format)
 * - Any other unique identifiers needed
 * 
 * UUID Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * Example: 550e8400-e29b-41d4-a716-446655440000
 * 
 * Benefits:
 * - Globally unique across distributed systems
 * - No database round-trip needed for ID generation
 * - Better security (no sequential IDs to guess)
 * - Easier data migration and replication
 */

const crypto = require('crypto');

/**
 * Generate a UUID v4 (random UUID)
 * 
 * @returns {string} UUID in format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * 
 * @example
 * const { generateUUID } = require('./utils/uuidGenerator');
 * const userId = generateUUID();
 * // => '550e8400-e29b-41d4-a716-446655440000'
 */
function generateUUID() {
    // Generate 16 random bytes
    const bytes = crypto.randomBytes(16);
    
    // Set version (4) and variant bits according to RFC 4122
    // Version 4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
    
    // Convert to hex string and format as UUID
    const hex = bytes.toString('hex');
    
    return [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20, 32)
    ].join('-');
}

/**
 * Validate if a string is a valid UUID v4
 * 
 * @param {string} uuid - String to validate
 * @returns {boolean} True if valid UUID v4, false otherwise
 * 
 * @example
 * const { isValidUUID } = require('./utils/uuidGenerator');
 * isValidUUID('550e8400-e29b-41d4-a716-446655440000'); // => true
 * isValidUUID('not-a-uuid'); // => false
 * isValidUUID(12345); // => false
 */
function isValidUUID(uuid) {
    if (typeof uuid !== 'string') {
        return false;
    }
    
    // UUID v4 regex pattern
    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    return uuidV4Pattern.test(uuid);
}

/**
 * Generate multiple UUIDs at once
 * Useful for batch operations or seeding data
 * 
 * @param {number} count - Number of UUIDs to generate
 * @returns {string[]} Array of UUIDs
 * 
 * @example
 * const { generateMultipleUUIDs } = require('./utils/uuidGenerator');
 * const userIds = generateMultipleUUIDs(10);
 * // => ['550e8400...', '6ba7b810...', ...]
 */
function generateMultipleUUIDs(count) {
    if (typeof count !== 'number' || count < 1) {
        throw new Error('Count must be a positive number');
    }
    
    const uuids = [];
    for (let i = 0; i < count; i++) {
        uuids.push(generateUUID());
    }
    
    return uuids;
}

/**
 * Convert integer ID to UUID format (for migration purposes)
 * This creates a deterministic UUID from an integer ID
 * 
 * WARNING: This is ONLY for migration! New records should use generateUUID()
 * 
 * @param {number} id - Integer ID to convert
 * @returns {string} UUID format (not a true UUID, but compatible format)
 * 
 * @example
 * const { intToUUID } = require('./utils/uuidGenerator');
 * intToUUID(12345); // => '00000000-0000-4000-8000-000000003039'
 */
function intToUUID(id) {
    if (typeof id !== 'number' || id < 0) {
        throw new Error('ID must be a non-negative number');
    }
    
    // Pad the number to 12 hex characters (max: 281,474,976,710,655)
    const hex = id.toString(16).padStart(12, '0');
    
    // Format as UUID v4 with proper version and variant bits
    return `00000000-0000-4000-8${hex.substring(0, 3)}-${hex.substring(3, 12)}`;
}

module.exports = {
    generateUUID,
    isValidUUID,
    generateMultipleUUIDs,
    intToUUID
};
