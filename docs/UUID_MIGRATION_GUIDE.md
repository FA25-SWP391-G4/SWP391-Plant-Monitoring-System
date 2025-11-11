# UUID Migration Guide

## Overview

This guide covers the migration from auto-increment integer primary keys to UUID (Universally Unique Identifier) primary keys for the Plant Monitoring System database.

### Migration Scope

**Tables Affected:**
- `Users`: `user_id` SERIAL → UUID
- `Devices`: `device_id` (removed), `device_key` (UUID) becomes primary key
- All related tables with foreign keys: `AI_Models`, `Plants`, `Alerts`, `Payments`, `SensorData`, `WateringHistory`, `PumpSchedule`, `SystemLog`

### Benefits of UUID

1. **Security**: Non-sequential, non-guessable identifiers
2. **Distribution**: Generate IDs without database round-trip
3. **Scalability**: No ID collision in distributed systems
4. **Data Migration**: Easier sync across environments
5. **API Security**: No enumeration attacks on resource IDs

---

## Pre-Migration Checklist

**CRITICAL:** Complete ALL items before running migration

- [ ] **Backup Database**: Create full PostgreSQL dump
  ```bash
  pg_dump -U postgres -d plant_system -F c -f backup_before_uuid_migration.dump
  ```

- [ ] **Stop Application**: Ensure no active connections
  ```bash
  # Stop all services
  npm stop
  cd client && npm stop
  cd ../ai_service && pkill -f "python main.py"
  ```

- [ ] **Verify PostgreSQL Version**: Requires PostgreSQL 13+ for uuid-ossp extension
  ```sql
  SELECT version();
  ```

- [ ] **Check Disk Space**: Ensure 2x current database size available
  ```sql
  SELECT pg_database_size('plant_system') / 1024 / 1024 AS size_mb;
  ```

- [ ] **Test in Development**: Run full migration on dev/staging first

- [ ] **Code Changes Deployed**: Ensure all model updates are deployed
  - `models/User.js` - UUID generation and validation
  - `models/Device.js` - device_key as primary key
  - `utils/uuidGenerator.js` - UUID utility functions

---

## Migration Process

### Step 1: Review Migration Script

**File:** `migrations/uuid-migration.sql`

The script performs these operations in a single atomic transaction:

1. Enable PostgreSQL extensions (`uuid-ossp`, `pgcrypto`)
2. Add `user_uuid` column to Users table
3. Generate UUIDs for all existing users
4. Add temporary UUID foreign key columns to all related tables
5. Populate UUID foreign keys from integer relationships
6. Drop old foreign key constraints
7. Drop old integer primary key columns
8. Rename UUID columns to original names (`user_uuid` → `user_id`)
9. Create new primary keys on UUID columns
10. Migrate Devices table (drop `device_id`, make `device_key` primary)
11. Create indexes for performance
12. Verify data integrity

**Review the script:**
```bash
cat migrations/uuid-migration.sql | less
```

### Step 2: Backup Database

**Create timestamped backup:**
```bash
timestamp=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres -d plant_system -F c -f "backup_${timestamp}_pre_uuid.dump"

# Verify backup
pg_restore --list "backup_${timestamp}_pre_uuid.dump" | head -20
```

### Step 3: Run Migration

**Execute migration script:**
```bash
psql -U postgres -d plant_system -f migrations/uuid-migration.sql
```

**Expected output:**
```
-- Output lines showing:
NOTICE:  extension "uuid-ossp" already exists, skipping
ALTER TABLE
UPDATE 150  -- Number of existing users
ALTER TABLE
-- ... (many ALTER TABLE commands)
COMMIT  -- Transaction committed successfully
```

**If errors occur:**
- Transaction will rollback automatically
- Check error message carefully
- Fix issue and retry
- DO NOT run partial migrations

### Step 4: Verify Migration

**Run verification queries:**

```sql
-- 1. Check Users table structure
\d Users
-- Should show: user_id UUID PRIMARY KEY

-- 2. Check Devices table structure
\d Devices
-- Should show: device_key UUID PRIMARY KEY (no device_id)

-- 3. Verify no NULL UUIDs
SELECT COUNT(*) FROM Users WHERE user_id IS NULL;
-- Expected: 0

SELECT COUNT(*) FROM Devices WHERE device_key IS NULL;
-- Expected: 0

-- 4. Verify foreign key relationships
SELECT COUNT(*) FROM Plants p
LEFT JOIN Users u ON p.user_id = u.user_id
WHERE u.user_id IS NULL AND p.user_id IS NOT NULL;
-- Expected: 0 (no orphaned records)

-- 5. Verify UUID format
SELECT user_id, email FROM Users LIMIT 5;
-- Should show valid UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx

-- 6. Check all indexes created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('users', 'devices', 'plants', 'ai_models', 'alerts', 'payments')
ORDER BY tablename, indexname;
```

### Step 5: Update Application Code

**Already completed files (verify deployment):**

1. **UUID Generator Utility**
   - File: `utils/uuidGenerator.js`
   - Functions: `generateUUID()`, `isValidUUID()`, `generateMultipleUUIDs()`, `intToUUID()`

2. **User Model**
   - File: `models/User.js`
   - Changes:
     - Import UUID generator
     - Generate UUID in `save()` before INSERT
     - Validate UUID in `findById()`

3. **Device Model**
   - File: `models/Device.js`
   - Changes:
     - Remove `device_id` references
     - Use `device_key` as primary key
     - Validate UUIDs in all methods
     - Update `toJSON()` output

**Files still requiring updates:**

- [ ] `controllers/authController.js` - JWT token with UUID user_id
- [ ] `controllers/userController.js` - Handle UUID parameters
- [ ] `controllers/deviceController.js` - Handle UUID parameters
- [ ] `controllers/plantController.js` - Handle UUID foreign keys
- [ ] `middlewares/authMiddleware.js` - Decode UUID from JWT
- [ ] All test files - Update mocks and fixtures

### Step 6: Test Application

**Start services:**
```bash
# Backend
npm start

# Frontend (new terminal)
cd client && npm start

# AI Service (new terminal)
cd ai_service && python main.py
```

**Test critical paths:**

1. **User Registration**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123!@#",
       "family_name": "Test",
       "given_name": "User"
     }'
   
   # Response should include UUID user_id
   ```

2. **User Login & JWT**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123!@#"
     }'
   
   # Decode JWT token to verify UUID user_id
   ```

3. **Device Creation**
   ```bash
   curl -X POST http://localhost:5000/api/devices \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "device_name": "Test Device"
     }'
   
   # Response should include UUID device_key (no device_id)
   ```

4. **Google OAuth Flow**
   - Test Google login
   - Verify JWT contains UUID user_id
   - Check database for UUID in Users table

5. **Existing User Login**
   - Login with pre-migration user
   - Verify UUID is returned
   - Check all user operations work

---

## Rollback Procedure

### Option 1: Database Restore (RECOMMENDED)

**Restore from backup:**
```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE plant_system;"
psql -U postgres -c "CREATE DATABASE plant_system;"

# Restore from backup
pg_restore -U postgres -d plant_system backup_TIMESTAMP_pre_uuid.dump

# Verify restoration
psql -U postgres -d plant_system -c "SELECT COUNT(*) FROM Users;"
```

**Revert code changes:**
```bash
git checkout models/User.js
git checkout models/Device.js
git checkout utils/uuidGenerator.js
```

### Option 2: Rollback Script (DEV ONLY)

**WARNING:** This recreates the schema but **CANNOT** restore original integer IDs. All data relationships will be broken.

**File:** `migrations/uuid-migration-rollback.sql`

**DO NOT USE IN PRODUCTION** - Use database backup restore instead.

```bash
# Development/testing only
psql -U postgres -d plant_system -f migrations/uuid-migration-rollback.sql
```

---

## Common Issues & Solutions

### Issue 1: Migration Fails with "column already exists"

**Cause:** Previous partial migration attempt

**Solution:**
```sql
-- Check existing columns
\d Users

-- If user_uuid column exists, drop it
ALTER TABLE Users DROP COLUMN IF EXISTS user_uuid CASCADE;

-- Re-run migration
```

### Issue 2: NULL UUID values after migration

**Cause:** Missing data in original integer columns

**Solution:**
```sql
-- Find records with NULL user_id
SELECT * FROM Users WHERE user_id IS NULL;

-- Update or delete orphaned records before migration
```

### Issue 3: Foreign key constraint violations

**Cause:** Orphaned records in related tables

**Solution:**
```sql
-- Find orphaned plants
SELECT p.* FROM Plants p
LEFT JOIN Users u ON p.user_id = u.user_id
WHERE u.user_id IS NULL;

-- Delete or fix orphaned records
DELETE FROM Plants WHERE user_id NOT IN (SELECT user_id FROM Users);
```

### Issue 4: JWT authentication fails after migration

**Cause:** JWT still using old integer user_id

**Solution:**
- Clear all existing tokens (force re-login)
- Update `authController.js` to generate JWT with UUID
- Update `authMiddleware.js` to validate UUID format

### Issue 5: API returns 500 errors with "invalid input syntax for type uuid"

**Cause:** Controller passing non-UUID value to model

**Solution:**
```javascript
// Before calling model method, validate UUID
const { isValidUUID } = require('../utils/uuidGenerator');

if (!isValidUUID(req.params.id)) {
  return res.status(400).json({ error: 'Invalid ID format' });
}
```

---

## Performance Considerations

### Index Strategy

**Automatic indexes created by migration:**
- `users_pkey` - Primary key on user_id (UUID)
- `devices_pkey` - Primary key on device_key (UUID)
- `idx_plants_user_id` - Foreign key index on Plants.user_id
- `idx_devices_user_id` - Foreign key index on Devices.user_id
- `idx_sensor_data_device_key` - Foreign key index on SensorData.device_key

**UUID vs Integer Performance:**
- UUID primary keys: ~10-15% slower than SERIAL for INSERT
- UUID lookups: Similar performance with proper indexing
- JOIN operations: Minimal difference with indexes
- Index size: UUID indexes ~3x larger than integer

**Optimization tips:**
```sql
-- Monitor query performance
EXPLAIN ANALYZE SELECT * FROM Users WHERE user_id = 'uuid-here';

-- Rebuild indexes if needed
REINDEX TABLE Users;
REINDEX TABLE Devices;

-- Update statistics
ANALYZE Users;
ANALYZE Devices;
```

---

## Testing Checklist

After migration, verify these operations:

### User Operations
- [ ] Register new user (UUID generated)
- [ ] Login existing user (UUID returned)
- [ ] Login new user (JWT with UUID)
- [ ] Google OAuth registration (UUID created)
- [ ] Google OAuth login (UUID in JWT)
- [ ] Password reset (UUID in reset token)
- [ ] Update user profile (UUID in WHERE clause)
- [ ] Delete user (cascade to related tables)

### Device Operations
- [ ] Create new device (device_key UUID generated)
- [ ] List user devices (UUID foreign key)
- [ ] Update device status (device_key in WHERE)
- [ ] Delete device (device_key primary key)
- [ ] Device ping (last_seen update)

### Plant Operations
- [ ] Create plant with user_id UUID
- [ ] Create plant with device_key UUID
- [ ] List plants by user_id UUID
- [ ] Update plant (UUID foreign keys)

### Data Integrity
- [ ] No NULL UUIDs in primary keys
- [ ] No NULL UUIDs in foreign keys
- [ ] All foreign keys reference valid UUIDs
- [ ] No orphaned records

### API Endpoints
- [ ] All GET endpoints return UUIDs
- [ ] All POST endpoints accept UUIDs
- [ ] All PUT endpoints accept UUIDs
- [ ] All DELETE endpoints accept UUIDs
- [ ] JWT tokens contain UUID user_id

---

## Monitoring Post-Migration

### Database Health Checks

```sql
-- 1. Check for invalid UUID formats (should return 0)
SELECT COUNT(*) FROM Users 
WHERE user_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- 2. Check foreign key integrity
SELECT 
  'Plants' as table_name,
  COUNT(*) as orphaned_records
FROM Plants p
LEFT JOIN Users u ON p.user_id = u.user_id
WHERE u.user_id IS NULL AND p.user_id IS NOT NULL

UNION ALL

SELECT 
  'Devices' as table_name,
  COUNT(*) as orphaned_records
FROM Devices d
LEFT JOIN Users u ON d.user_id = u.user_id
WHERE u.user_id IS NULL;

-- 3. Monitor query performance
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
WHERE query LIKE '%Users%' OR query LIKE '%Devices%'
ORDER BY mean_time DESC
LIMIT 10;
```

### Application Logs

Monitor for these error patterns:
- "Invalid UUID format"
- "invalid input syntax for type uuid"
- "Foreign key violation"
- "JWT verification failed"

### Performance Metrics

Track these metrics before/after migration:
- Average response time for user lookup
- Average response time for device operations
- Database connection pool usage
- Memory usage (UUID indexes larger)

---

## Migration Timeline

**Recommended schedule for production:**

1. **Week 1**: Test migration in development
2. **Week 2**: Test migration in staging, performance testing
3. **Week 3**: Schedule production maintenance window
4. **Migration Day**:
   - 00:00 - Announce maintenance window
   - 00:15 - Stop application services
   - 00:30 - Create database backup
   - 01:00 - Run migration script
   - 01:30 - Verify migration success
   - 02:00 - Start application services
   - 02:30 - Run smoke tests
   - 03:00 - Monitor for issues
   - 04:00 - End maintenance window

**Estimated downtime:** 3-4 hours (depending on database size)

---

## Support & Troubleshooting

### Getting Help

1. **Check logs:**
   - PostgreSQL: `/var/log/postgresql/postgresql-*.log`
   - Application: `logs/app.log`
   - Migration output: saved during execution

2. **Review migration script:**
   - `migrations/uuid-migration.sql` - Step-by-step comments
   - Verification queries at end of script

3. **Database state inspection:**
   ```sql
   -- List all tables
   \dt
   
   -- Describe table structure
   \d Users
   \d Devices
   
   -- Check constraints
   SELECT conname, contype FROM pg_constraint WHERE conrelid = 'users'::regclass;
   ```

---

## Appendix

### UUID Format Specification

**RFC 4122 Version 4 (Random UUID):**
```
xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx

Where:
- x: Random hex digit (0-9, a-f)
- 4: Version indicator (always 4 for random UUIDs)
- y: Variant indicator (8, 9, a, or b)

Example: 550e8400-e29b-41d4-a716-446655440000
```

### PostgreSQL UUID Functions

```sql
-- Generate UUID (requires uuid-ossp extension)
SELECT uuid_generate_v4();

-- Cast between types
SELECT '550e8400-e29b-41d4-a716-446655440000'::uuid;

-- Validate UUID format
SELECT '550e8400-e29b-41d4-a716-446655440000'::uuid IS NOT NULL;
```

### Node.js UUID Generation

```javascript
const { generateUUID, isValidUUID } = require('./utils/uuidGenerator');

// Generate new UUID
const userId = generateUUID();

// Validate UUID
if (isValidUUID(userId)) {
  // Safe to use
}

// Batch generation
const deviceKeys = generateMultipleUUIDs(10);
```

---

## Document History

- **Version 1.0** (2024-01-XX): Initial migration guide created
- **Author**: Plant Monitoring System Team
- **Last Updated**: 2024-01-XX

---

## References

- [PostgreSQL UUID Type Documentation](https://www.postgresql.org/docs/current/datatype-uuid.html)
- [RFC 4122: UUID Specification](https://tools.ietf.org/html/rfc4122)
- [uuid-ossp Extension](https://www.postgresql.org/docs/current/uuid-ossp.html)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html#cryptorandomuuidoptions)
