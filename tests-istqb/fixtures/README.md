# Test Data Fixtures

## User Fixtures

### Regular User
```json
{
  "email": "regular.user@test.com",
  "password": "RegularPass123!",
  "username": "regularuser",
  "role": "Regular"
}
```

### Premium User
```json
{
  "email": "premium.user@test.com",
  "password": "PremiumPass123!",
  "username": "premiumuser",
  "role": "Premium"
}
```

### Admin User
```json
{
  "email": "admin.user@test.com",
  "password": "AdminPass123!",
  "username": "adminuser",
  "role": "Admin"
}
```

## Plant Fixtures

### Healthy Plant
```json
{
  "plant_name": "Test Monstera",
  "species": "Monstera Deliciosa",
  "location": "Living Room",
  "health_status": "healthy"
}
```

### Plant Needing Water
```json
{
  "plant_name": "Thirsty Fern",
  "species": "Boston Fern",
  "location": "Bathroom",
  "health_status": "needs_water"
}
```

## Zone Fixtures

### Living Room Zone
```json
{
  "zone_name": "Living Room",
  "description": "Main living area with bright indirect light"
}
```

### Garden Zone
```json
{
  "zone_name": "Garden",
  "description": "Outdoor garden area"
}
```

## Sensor Data Fixtures

### Normal Readings
```json
{
  "moisture": 65.5,
  "temperature": 22.3,
  "humidity": 55.0,
  "light": 450.0
}
```

### Low Moisture Alert
```json
{
  "moisture": 15.0,
  "temperature": 24.0,
  "humidity": 40.0,
  "light": 380.0
}
```

## Subscription Plans

### Free Plan
```json
{
  "name": "Free",
  "price": 0,
  "features": ["5 plants", "Basic monitoring"]
}
```

### Premium Plan
```json
{
  "name": "Premium",
  "price": 99000,
  "features": ["Unlimited plants", "AI features", "Advanced analytics"]
}
```
