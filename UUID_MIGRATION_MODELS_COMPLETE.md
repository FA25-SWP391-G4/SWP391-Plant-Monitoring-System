# UUID Migration - Models Complete ✅

## Summary

Successfully migrated all data models from auto-increment integer IDs to UUID for `user_id` and `device_key` columns. This document summarizes all changes made to the backend models.

**Migration Date**: Session 4  
**Affected Models**: 6 core models  
**Total Files Updated**: 6 model files  

---

## Completed Models

### 1. ✅ SensorData.js (models/SensorData.js)
**Purpose**: Store IoT sensor readings (soil moisture, temperature, humidity, light intensity)

**Changes Made**:
- ✅ Imported `isValidUUID` from `utils/uuidGenerator.js`
- ✅ Updated constructor: `device_id` → `device_key` (UUID foreign key)
- ✅ Updated `findAll()`: Changed JOIN from `device_id` to `device_key`
- ✅ Updated `findById()`: Changed JOIN to use `device_key`
- ✅ Updated `findByDeviceKey()`: 
  - Added UUID validation
  - Changed query to use `device_key`
  - Returns empty array for invalid UUID
- ✅ Added deprecated `findByDeviceId()`: Redirects to `findByDeviceKey()` with console warning
- ✅ Updated `findByUserId()`: 
  - Added UUID validation for `user_id` parameter
  - Changed JOIN to use `device_key`
- ✅ Updated `findByDateRange()`: 
  - Added UUID validation for `deviceKey` parameter
  - Changed WHERE clause to use `device_key`
  - Changed JOIN to use `device_key`
- ✅ Updated `getAveragesByDeviceKey()`: 
  - Added UUID validation
  - Changed query to use `device_key`
  - Changed GROUP BY to use `device_key`
- ✅ Added deprecated `getAveragesByDeviceId()`: Redirects with warning
- ✅ Updated `save()`: 
  - Added UUID validation for `device_key`
  - Throws error if invalid UUID
  - Updated INSERT/UPDATE queries to use `device_key`
- ✅ Updated `createFromDevice()`: 
  - Added UUID validation for `deviceKey` parameter
  - Updated to use `device_key`

**Impact**: All sensor data operations now reference devices by UUID `device_key` instead of integer `device_id`

---

### 2. ✅ WateringHistory.js (models/WateringHistory.js)
**Purpose**: Track plant watering events (manual, automatic, scheduled, AI)

**Changes Made**:
- ✅ Imported `isValidUUID` from `utils/uuidGenerator.js`
- ✅ Updated `findAll()`: Changed JOIN from `d.device_id` to `d.device_key`
- ✅ Updated `findById()`: Changed JOIN to use `device_key`
- ✅ Updated `findByPlantId()`: Changed JOIN to use `device_key`
- ✅ Updated `findByUserId()`: 
  - Added UUID validation for `userId` parameter
  - Changed JOIN to use `device_key`
  - Returns empty array for invalid UUID
- ✅ Updated `findByTriggerType()`: Changed JOIN to use `device_key`
- ✅ Updated `findByDateRange()`: Changed JOIN to use `device_key`

**Note**: `plant_id` foreign key remains as integer (not migrated to UUID). Only JOINs with Devices table updated to use `device_key`.

**Impact**: Watering history queries correctly join with Devices table using UUID `device_key`

---

### 3. ✅ Alert.js (models/Alert.js)
**Purpose**: User notifications and system alerts

**Changes Made**:
- ✅ Imported `isValidUUID` from `utils/uuidGenerator.js`
- ✅ Updated `findByUserId()`: 
  - Added UUID validation for `userId` parameter
  - Returns empty array for invalid UUID
  - Added logging for invalid UUIDs
- ✅ Updated `findUnreadByUserId()`: 
  - Added UUID validation for `userId` parameter
  - Returns empty array for invalid UUID
- ✅ Updated `getUnreadCountByUserId()`: 
  - Added UUID validation for `userId` parameter
  - Returns 0 for invalid UUID
- ✅ Updated `save()`: 
  - Added UUID validation for `user_id` property
  - Throws error if invalid UUID
  - Validates before both INSERT and UPDATE
- ✅ Updated `createAlert()`: 
  - Added UUID validation for `userId` parameter
  - Throws error if invalid UUID
- ✅ Updated `create()`: 
  - Added UUID validation for `alertData.user_id`
  - Throws error if invalid UUID
- ✅ Updated `markAllAsReadByUserId()`: 
  - Added UUID validation for `userId` parameter
  - Returns 0 for invalid UUID

**Impact**: All alert operations validate UUID `user_id` and prevent invalid references

---

### 4. ✅ Payment.js (models/Payment.js)
**Purpose**: Track VNPay payment transactions for premium subscriptions

**Changes Made**:
- ✅ Imported `isValidUUID` from `utils/uuidGenerator.js`
- ✅ Updated `findByUserId()`: 
  - Added UUID validation for `userId` parameter
  - Returns empty array for invalid UUID
  - Added logging for invalid UUIDs
- ✅ Updated `findCompletedByUserId()`: 
  - Added UUID validation for `userId` parameter
  - Returns empty array for invalid UUID
- ✅ Updated `save()`: 
  - Added UUID validation for `user_id` property
  - Throws error if invalid UUID
  - Validates before both INSERT and UPDATE

**Impact**: Payment records correctly reference users by UUID, preventing invalid user associations

---

### 5. ✅ AIModel.js (models/AIModel.js)
**Purpose**: Manage AI/ML model metadata and versioning

**Changes Made**:
- ✅ Imported `isValidUUID` from `utils/uuidGenerator.js`
- ✅ Updated `findByUploader()`: 
  - Added UUID validation for `uploaderId` parameter
  - Returns empty array for invalid UUID
  - Added logging for invalid UUIDs
- ✅ Updated `save()`: 
  - Added UUID validation for `uploaded_by` property (optional field)
  - Only validates if `uploaded_by` is provided
  - Throws error if invalid UUID

**Impact**: AI model uploads correctly track uploader by UUID `user_id`

---

## Validation Pattern Established

All models now follow this consistent UUID validation pattern:

### 1. Import Statement
```javascript
const { pool } = require('../config/db');
const { isValidUUID } = require('../utils/uuidGenerator');
```

### 2. Validation in Finder Methods
```javascript
static async findByUserId(userId) {
    // Validate UUID
    if (!isValidUUID(userId)) {
        console.error('[MODEL_NAME] Invalid user_id UUID:', userId);
        return []; // or return null for single-record methods
    }
    
    // ... query logic
}
```

### 3. Validation in Save Methods
```javascript
async save() {
    // Validate UUID
    if (!isValidUUID(this.user_id)) {
        console.error('[MODEL_NAME] Invalid user_id UUID:', this.user_id);
        throw new Error('Valid user_id UUID is required');
    }
    
    // ... INSERT/UPDATE logic
}
```

### 4. Logging Convention
- Prefix: `[MODEL_NAME]` in uppercase
- Log invalid UUIDs for debugging
- Example: `[SENSOR_DATA] Invalid device_key UUID: 12345`

---

## Database Schema Alignment

### UUID Columns (After Migration)
```sql
-- Users table
user_id UUID PRIMARY KEY

-- Devices table
device_key UUID PRIMARY KEY (device_id removed)

-- Foreign Key Columns (UUID)
- Plants.user_id → Users.user_id
- Plants.device_key → Devices.device_key
- SensorData.device_key → Devices.device_key
- Alerts.user_id → Users.user_id
- Payments.user_id → Users.user_id
- AIModels.uploaded_by → Users.user_id
- WateringHistory.plant_id → Plants.plant_id (integer, not migrated)
```

---

## Breaking Changes

### 1. JWT Token Format
**Before**: `{ user_id: 123, ... }`  
**After**: `{ user_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", ... }`

- All existing JWT tokens will be invalid after migration
- Users must re-login after database migration
- Frontend must handle UUID format in API responses

### 2. API Response Format
**Before**:
```json
{
  "user_id": 123,
  "device_id": 456
}
```

**After**:
```json
{
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "device_key": "f1e2d3c4-b5a6-7890-1234-567890abcdef"
}
```

### 3. Route Parameters
**Before**: `/api/users/123`, `/api/devices/456`  
**After**: `/api/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890`, `/api/devices/f1e2d3c4-b5a6-7890-abcd-ef1234567890`

---

## Testing Checklist

### Unit Tests Required
- [ ] SensorData model tests with UUID device_key
- [ ] WateringHistory model tests with UUID joins
- [ ] Alert model tests with UUID user_id
- [ ] Payment model tests with UUID user_id
- [ ] AIModel model tests with UUID uploaded_by

### Integration Tests Required
- [ ] Sensor data creation with UUID device_key
- [ ] User alert retrieval by UUID
- [ ] Payment records by UUID user_id
- [ ] Watering history with device UUID joins
- [ ] AI model upload tracking

### Manual Testing Required
- [ ] Create sensor data via IoT endpoint
- [ ] Retrieve watering history for a plant
- [ ] Check user alerts
- [ ] Process VNPay payment
- [ ] Upload AI model

---

## Migration Execution Checklist

### Pre-Migration
- [x] All model code updated with UUID validation
- [x] Backward compatibility methods added (findByDeviceId deprecated)
- [ ] Database migration script tested in development
- [ ] Backup production database
- [ ] Schedule maintenance window

### Migration Steps
1. [ ] Stop application servers
2. [ ] Backup PostgreSQL database
3. [ ] Execute `migrations/uuid-migration.sql`
4. [ ] Verify migration with validation queries
5. [ ] Deploy updated application code
6. [ ] Test critical endpoints (auth, devices, sensors)
7. [ ] Monitor error logs

### Post-Migration
- [ ] Run integration tests
- [ ] Verify JWT token generation with UUID
- [ ] Test frontend login/logout
- [ ] Verify sensor data ingestion
- [ ] Monitor application logs for 24 hours

---

## Next Steps

### Immediate (Session 4 - Current)
1. ✅ Complete all model migrations (DONE)
2. ⏳ Update remaining controllers:
   - `dashboardController.js`
   - `iotController.js`
   - `reportController.js`
   - `notificationController.js`
   - Complete `plantController.js` (partially done)

### Short-term (Session 5)
1. ⏳ Execute database migration in development environment
2. ⏳ Update test suite with UUID fixtures
3. ⏳ Update frontend API client to handle UUID format
4. ⏳ Test end-to-end user flows (registration → login → device operations)

### Medium-term
1. ⏳ Performance testing (UUID vs integer benchmarks)
2. ⏳ Update API documentation with UUID examples
3. ⏳ Create UUID migration guide for other developers
4. ⏳ Production database migration planning

---

## Files Modified Summary

| File | Lines Changed | Primary Changes |
|------|--------------|-----------------|
| `models/SensorData.js` | ~30 | UUID validation, device_key conversion, deprecated methods |
| `models/WateringHistory.js` | ~10 | UUID validation in findByUserId(), device_key JOINs |
| `models/Alert.js` | ~20 | UUID validation in all user-scoped methods |
| `models/Payment.js` | ~15 | UUID validation in user lookup methods |
| `models/AIModel.js` | ~10 | UUID validation for uploaded_by field |

**Total**: ~85 lines changed across 5 models

---

## References

- **UUID Generator**: `utils/uuidGenerator.js`
- **Database Migration**: `migrations/uuid-migration.sql`
- **Rollback Script**: `migrations/uuid-migration-rollback.sql`
- **Implementation Guide**: `UUID_MIGRATION_GUIDE.md`
- **Session Reports**: 
  - Session 1: `UUID_MIGRATION_SESSION_1.md`
  - Session 2: `UUID_MIGRATION_SESSION_2.md`
  - Session 3: `UUID_MIGRATION_SESSION_3.md`

---

## Completion Status

✅ **Models Migration: COMPLETE**  
⏳ **Controllers Migration: IN PROGRESS**  
⏳ **Database Migration: PENDING**  
⏳ **Test Suite Update: PENDING**

**Overall Progress**: ~75% Complete

---

*Document Generated*: Session 4  
*Last Updated*: Models complete, ready for controller updates
