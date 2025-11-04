# UUID Migration - Remaining Work Checklist

## ✅ Completed Work

### Core Infrastructure
- [x] UUID Generator Utility (`utils/uuidGenerator.js`)
  - generateUUID() function
  - isValidUUID() function
  - generateMultipleUUIDs() function
  - intToUUID() migration helper

### Database Scripts
- [x] Migration Script (`migrations/uuid-migration.sql`)
  - 11-step atomic migration
  - Data integrity verification
  - Index creation
  - Performance optimization

- [x] Rollback Script (`migrations/uuid-migration-rollback.sql`)
  - Emergency rollback (dev only)
  - Warnings and recommendations

### Model Updates
- [x] User Model (`models/User.js`)
  - Import UUID generator
  - Generate UUID in save() method
  - Validate UUID in findById() method

- [x] Device Model (`models/Device.js`)
  - Import UUID generator
  - Remove device_id references
  - Use device_key as primary key
  - Update all CRUD methods
  - Update toJSON() output

### Documentation
- [x] Migration Guide (`docs/UUID_MIGRATION_GUIDE.md`)
- [x] Implementation Summary (`docs/UUID_MIGRATION_SUMMARY.md`)

---

## 🔄 In Progress / Not Started

### Models (Priority: HIGH)

#### Plant Model
**File**: `models/Plant.js`

- [ ] Import UUID generator
- [ ] Update findByUserId() - validate UUID parameter
- [ ] Update findByDeviceKey() - validate UUID parameter
- [ ] Update save() - handle UUID foreign keys
- [ ] Update all queries to accept UUID user_id and device_key

**Code Pattern:**
```javascript
const { generateUUID, isValidUUID } = require('../utils/uuidGenerator');

static async findByUserId(userId) {
  if (!userId || !isValidUUID(userId)) {
    console.error('[PLANT] Invalid user UUID');
    return [];
  }
  // ... rest of method
}
```

#### Alert Model
**File**: `models/Alert.js`

- [ ] Import UUID generator
- [ ] Update findByUserId() - validate UUID parameter
- [ ] Update save() - handle UUID user_id foreign key
- [ ] Update all queries with UUID validation

#### Payment Model
**File**: `models/Payment.js`

- [ ] Import UUID generator
- [ ] Update findByUserId() - validate UUID parameter
- [ ] Update save() - handle UUID user_id foreign key
- [ ] Update payment processing to use UUID

#### SensorData Model
**File**: `models/SensorData.js`

- [ ] Import UUID generator
- [ ] Update findByDeviceKey() - validate UUID parameter
- [ ] Update save() - handle UUID device_key foreign key
- [ ] Update aggregation queries for UUID

#### WateringHistory Model
**File**: `models/WateringHistory.js`

- [ ] Import UUID generator
- [ ] Update findByDeviceKey() - validate UUID parameter
- [ ] Update save() - handle UUID device_key foreign key

#### AIModel Model
**File**: `models/AIModel.js`

- [ ] Import UUID generator
- [ ] Update findByUserId() - validate UUID parameter
- [ ] Update save() - handle UUID user_id foreign key

---

### Controllers (Priority: HIGH)

#### Auth Controller
**File**: `controllers/authController.js`

**Critical Changes:**

- [ ] Update generateToken() function (line ~177)
  ```javascript
  const generateToken = (user) => {
    return jwt.sign(
      { 
        user_id: user.user_id,  // Now UUID instead of integer
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  };
  ```

- [ ] Update register() method
  - Verify UUID returned from User.save()
  - Log UUID for debugging

- [ ] Update login() method
  - Accept UUID in request body (if explicitly passed)
  - Return UUID in response

- [ ] Update googleAuth() method
  - Verify UUID in Google user creation
  - Log UUID for OAuth debugging

- [ ] Update resetPassword() method
  - Handle UUID in password reset token

#### User Controller
**File**: `controllers/userController.js`

- [ ] Update getProfile() - req.user.user_id is now UUID
- [ ] Update updateProfile() - validate UUID parameter
- [ ] Update deleteUser() - validate UUID parameter
- [ ] Update getAllUsers() - return UUIDs in response
- [ ] Update getUserById() - validate UUID parameter

**Validation Pattern:**
```javascript
const { isValidUUID } = require('../utils/uuidGenerator');

const getUserById = async (req, res) => {
  const { id } = req.params;
  
  if (!isValidUUID(id)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }
  
  try {
    const user = await User.findById(id);
    // ... rest of method
  } catch (error) {
    // ... error handling
  }
};
```

#### Device Controller
**File**: `controllers/deviceController.js`

- [ ] Update getDevices() - filter by user UUID
- [ ] Update getDeviceById() - validate device_key UUID
- [ ] Update createDevice() - generate device_key UUID
- [ ] Update updateDevice() - validate device_key UUID
- [ ] Update deleteDevice() - validate device_key UUID
- [ ] Update deviceStatus() - use device_key instead of device_id

#### Plant Controller
**File**: `controllers/plantController.js`

- [ ] Update getPlants() - filter by user UUID
- [ ] Update getPlantById() - validate UUID parameters
- [ ] Update createPlant() - handle UUID foreign keys (user_id, device_key)
- [ ] Update updatePlant() - validate UUID parameters
- [ ] Update deletePlant() - validate UUID parameters

#### Dashboard Controller
**File**: `controllers/dashboardController.js`

- [ ] Update getDashboard() - use UUID for user lookup
- [ ] Update getStats() - handle UUID in aggregations
- [ ] Update getRecentActivity() - filter by user UUID
- [ ] Update all queries to work with UUID foreign keys

#### IoT Controller
**File**: `controllers/iotController.js`

- [ ] Update MQTT topic subscriptions - use device_key UUID
- [ ] Update device authentication - validate device_key UUID
- [ ] Update sensor data processing - handle UUID device_key

#### Report Controller
**File**: `controllers/reportController.js`

- [ ] Update generateReport() - filter by user UUID
- [ ] Update report queries to handle UUID joins

---

### Middleware (Priority: HIGH)

#### Auth Middleware
**File**: `middlewares/authMiddleware.js`

**Critical Changes:**

- [ ] Update JWT verification
  ```javascript
  const authMiddleware = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // decoded.user_id is now UUID
      if (!isValidUUID(decoded.user_id)) {
        return res.status(401).json({ error: 'Invalid token format' });
      }
      
      const user = await User.findById(decoded.user_id);
      // ... rest of middleware
    } catch (error) {
      // ... error handling
    }
  };
  ```

#### Validation Middleware
**File**: `middlewares/validationMiddleware.js`

- [ ] Add UUID validation rules
  ```javascript
  const { isValidUUID } = require('../utils/uuidGenerator');
  
  const validateUUID = (paramName) => {
    return (req, res, next) => {
      const id = req.params[paramName] || req.body[paramName];
      
      if (!isValidUUID(id)) {
        return res.status(400).json({ 
          error: `Invalid ${paramName} format. Expected UUID.` 
        });
      }
      
      next();
    };
  };
  
  module.exports = { validateUUID };
  ```

- [ ] Update existing validation rules to accept UUID
- [ ] Add UUID format to API validation schemas

---

### Routes (Priority: MEDIUM)

#### User Routes
**File**: `routes/userRoutes.js`

- [ ] Add UUID validation middleware to routes
  ```javascript
  const { validateUUID } = require('../middlewares/validationMiddleware');
  
  router.get('/:id', validateUUID('id'), userController.getUserById);
  router.put('/:id', validateUUID('id'), userController.updateUser);
  router.delete('/:id', validateUUID('id'), userController.deleteUser);
  ```

#### Device Routes
**File**: `routes/deviceRoutes.js`

- [ ] Add UUID validation for device_key parameter
- [ ] Update route documentation with UUID examples

#### Plant Routes
**File**: `routes/plantRoutes.js`

- [ ] Add UUID validation for plant_id parameter
- [ ] Add UUID validation for user_id and device_key query params

---

### Tests (Priority: MEDIUM)

#### Model Tests

**User Model Tests**
- [ ] Update fixtures with UUID format
- [ ] Test UUID generation in save()
- [ ] Test UUID validation in findById()
- [ ] Test findByEmail() returns user with UUID
- [ ] Test password reset with UUID user_id

**Device Model Tests**
- [ ] Update fixtures with device_key UUIDs
- [ ] Test device_key generation
- [ ] Test findById() with device_key
- [ ] Test findByUserId() with user UUID
- [ ] Test CRUD operations with UUIDs

**Plant Model Tests**
- [ ] Update fixtures with UUID foreign keys
- [ ] Test plant creation with user UUID and device_key
- [ ] Test queries with UUID parameters

#### Controller Tests

**Auth Controller Tests**
- [ ] Test register returns UUID in response
- [ ] Test login returns JWT with UUID user_id
- [ ] Test JWT token contains valid UUID
- [ ] Test Google OAuth creates user with UUID
- [ ] Test password reset with UUID user_id

**User Controller Tests**
- [ ] Test getUserById() with valid UUID
- [ ] Test getUserById() with invalid UUID returns 400
- [ ] Test updateUser() with UUID parameter
- [ ] Test deleteUser() with UUID parameter

**Device Controller Tests**
- [ ] Test createDevice() generates device_key UUID
- [ ] Test getDeviceById() with device_key
- [ ] Test device CRUD with UUIDs

#### Integration Tests

- [ ] Test full user registration flow (UUID returned)
- [ ] Test full login flow (JWT with UUID)
- [ ] Test Google OAuth flow (UUID in database)
- [ ] Test device creation and management
- [ ] Test plant CRUD operations
- [ ] Test dashboard with UUID filtering

---

### Frontend Updates (Priority: LOW - Different repo)

**Note**: Frontend is separate Next.js app, coordinate with frontend team

- [ ] Update API client to handle UUID responses
- [ ] Update type definitions (TypeScript interfaces)
- [ ] Update URL routes to accept UUID format
- [ ] Update form validation for UUID inputs
- [ ] Update mock data with UUID format
- [ ] Test API integration with UUID responses

---

### Database Migration (Priority: CRITICAL)

#### Development Environment

- [ ] Create database backup
  ```bash
  pg_dump -U postgres -d plant_system_dev -F c -f backup_dev_pre_uuid.dump
  ```

- [ ] Run migration script
  ```bash
  psql -U postgres -d plant_system_dev -f migrations/uuid-migration.sql
  ```

- [ ] Verify migration
  ```sql
  -- Check Users table
  \d Users
  SELECT user_id, email FROM Users LIMIT 5;
  
  -- Check Devices table
  \d Devices
  SELECT device_key, device_name FROM Devices LIMIT 5;
  
  -- Verify no NULLs
  SELECT COUNT(*) FROM Users WHERE user_id IS NULL;
  SELECT COUNT(*) FROM Devices WHERE device_key IS NULL;
  ```

- [ ] Test application with migrated database
- [ ] Run full test suite

#### Staging Environment

- [ ] Create database backup
- [ ] Run migration script
- [ ] Verify migration
- [ ] Deploy updated code
- [ ] Test critical paths
- [ ] Performance testing
- [ ] Load testing with UUIDs

#### Production Environment

- [ ] Schedule maintenance window
- [ ] Notify users of maintenance
- [ ] Create database backup
- [ ] Stop application services
- [ ] Run migration script
- [ ] Verify migration success
- [ ] Deploy updated code
- [ ] Start application services
- [ ] Monitor logs for errors
- [ ] Test critical paths
- [ ] Verify JWT tokens work
- [ ] End maintenance window

---

## Priority Order

### Phase 1: Core Updates (Week 1)
1. Auth Controller - JWT with UUID ⚠️ CRITICAL
2. Auth Middleware - JWT verification ⚠️ CRITICAL
3. User Controller - UUID parameters
4. Device Controller - UUID parameters

### Phase 2: Extended Models (Week 2)
5. Plant Model - UUID foreign keys
6. Alert Model - UUID foreign keys
7. Payment Model - UUID foreign keys
8. SensorData Model - UUID device_key
9. WateringHistory Model - UUID device_key

### Phase 3: Testing (Week 2-3)
10. Update model tests with UUID fixtures
11. Update controller tests
12. Integration testing
13. Performance testing

### Phase 4: Deployment (Week 4)
14. Run migration in development
15. Run migration in staging
16. Production migration (maintenance window)
17. Post-deployment monitoring

---

## Quick Command Reference

### Database Backup
```bash
# Development
pg_dump -U postgres -d plant_system_dev -F c -f backup_dev_$(date +%Y%m%d_%H%M%S).dump

# Production
pg_dump -U postgres -d plant_system -F c -f backup_prod_$(date +%Y%m%d_%H%M%S).dump
```

### Run Migration
```bash
# Development
psql -U postgres -d plant_system_dev -f migrations/uuid-migration.sql

# Production
psql -U postgres -d plant_system -f migrations/uuid-migration.sql
```

### Verify Migration
```sql
-- Check table structures
\d Users
\d Devices

-- Verify data
SELECT user_id, email FROM Users LIMIT 5;
SELECT device_key, device_name FROM Devices LIMIT 5;

-- Check for NULLs
SELECT 
  (SELECT COUNT(*) FROM Users WHERE user_id IS NULL) as null_users,
  (SELECT COUNT(*) FROM Devices WHERE device_key IS NULL) as null_devices;
```

### Rollback (Emergency Only)
```bash
# Restore from backup (RECOMMENDED)
psql -U postgres -c "DROP DATABASE plant_system_dev;"
psql -U postgres -c "CREATE DATABASE plant_system_dev;"
pg_restore -U postgres -d plant_system_dev backup_dev_TIMESTAMP.dump

# Use rollback script (DEV ONLY - Data loss)
psql -U postgres -d plant_system_dev -f migrations/uuid-migration-rollback.sql
```

---

## Success Metrics

After completing all tasks:

- [ ] All models use UUID primary/foreign keys
- [ ] All controllers handle UUID parameters
- [ ] All middleware validates UUID format
- [ ] All tests pass with UUID fixtures
- [ ] JWT tokens contain UUID user_id
- [ ] No NULL UUIDs in database
- [ ] No orphaned foreign key records
- [ ] API response times within 20% of baseline
- [ ] Zero increase in error rate
- [ ] User registration/login works
- [ ] Google OAuth works
- [ ] Device management works
- [ ] Plant CRUD operations work

---

## Notes

- UUID format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- Always validate UUID before database queries
- Log UUID generation for debugging
- Include UUID in error messages for support
- Test JWT token changes thoroughly
- Coordinate frontend updates with backend deployment
- Monitor performance after migration
- Keep backups for at least 30 days after migration

---

## Contact & Support

For questions or issues during migration:

1. **Check Documentation**:
   - `docs/UUID_MIGRATION_GUIDE.md` - Full migration guide
   - `docs/UUID_MIGRATION_SUMMARY.md` - Implementation summary

2. **Review Migration Script**:
   - `migrations/uuid-migration.sql` - Step-by-step comments

3. **Check Logs**:
   - PostgreSQL logs: `/var/log/postgresql/`
   - Application logs: `logs/app.log`
   - Migration output: Review console output

---

**Last Updated**: 2024-01-XX  
**Status**: Models updated, controllers pending  
**Next Milestone**: Complete auth controller and middleware updates
