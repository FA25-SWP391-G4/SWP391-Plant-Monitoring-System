# ISTQB Test Structure

```
tests-istqb/
│
├── README.md                           # Main documentation
├── COVERAGE.md                         # Coverage tracking
├── package.json                        # Test dependencies
├── jest.config.js                      # Jest configuration
├── jest.config.e2e.js                  # E2E Jest configuration
│
├── config/                             # Test configurations
│   ├── jest.setup.js                   # Jest setup
│   ├── jest.setup.e2e.js               # E2E setup
│   └── selenium.config.js              # Selenium configuration
│
├── helpers/                            # Test utilities
│   ├── testDatabase.js                 # Database helpers
│   ├── testDataGenerator.js            # Test data generators
│   ├── seleniumHelpers.js              # Selenium utilities
│   └── apiHelpers.js                   # API test utilities
│
├── fixtures/                           # Test data fixtures
│   └── (to be added)
│
├── screenshots/                        # E2E test screenshots
│   └── (auto-generated)
│
├── unit/                               # Unit Tests (ISTQB Level 1)
│   ├── models/                         # 17 model tests
│   │   ├── AIModel.test.js
│   │   ├── AIPrediction.test.js
│   │   ├── Alert.test.js
│   │   ├── ChatHistory.test.js
│   │   ├── Device.test.js
│   │   ├── ImageAnalysis.test.js
│   │   ├── Payment.test.js
│   │   ├── Plan.test.js
│   │   ├── Plant.test.js
│   │   ├── PlantProfile.test.js
│   │   ├── PumpSchedule.test.js
│   │   ├── SensorData.test.js
│   │   ├── Subscription.test.js
│   │   ├── SystemLog.test.js
│   │   ├── User.test.js
│   │   ├── WateringHistory.test.js
│   │   └── Zone.test.js
│   │
│   ├── controllers/                    # 10 controller tests
│   │   ├── authController.test.js
│   │   ├── plantController.test.js
│   │   ├── zoneController.test.js
│   │   ├── dashboardController.test.js
│   │   ├── aiController.test.js
│   │   ├── paymentController.test.js
│   │   ├── subscriptionController.test.js
│   │   ├── deviceController.test.js
│   │   ├── sensorController.test.js
│   │   └── notificationController.test.js
│   │
│   ├── services/                       # 5 service tests
│   │   ├── emailService.test.js
│   │   ├── notificationService.test.js
│   │   ├── vnpayService.test.js
│   │   ├── subscriptionService.test.js
│   │   └── aiCacheService.test.js
│   │
│   ├── middlewares/                    # 3 middleware tests
│   │   ├── authMiddleware.test.js
│   │   ├── accessMiddleware.test.js
│   │   └── rateLimitMiddleware.test.js
│   │
│   ├── ai-service/                     # 4 AI service tests
│   │   ├── controllers/
│   │   │   ├── chatbotController.test.js
│   │   │   ├── diseaseController.test.js
│   │   │   └── wateringController.test.js
│   │   └── services/
│   │       └── openRouterService.test.js
│   │
│   └── frontend/                       # 6 frontend tests
│       ├── components/
│       │   ├── LoginPage.test.jsx
│       │   ├── DashboardPage.test.jsx
│       │   ├── PlantList.test.jsx
│       │   ├── ZoneManagement.test.jsx
│       │   └── LanguageSwitcher.test.jsx
│       └── api/
│           └── axiosClient.test.js
│
├── integration/                        # Integration Tests (ISTQB Level 2)
│   ├── routes/                         # 5 route integration tests
│   │   ├── auth.integration.test.js
│   │   ├── plants.integration.test.js
│   │   ├── zones.integration.test.js
│   │   ├── payment.integration.test.js
│   │   └── ai.integration.test.js
│   │
│   └── database/                       # Database integration
│       └── database.integration.test.js
│
├── system/                             # System Tests (ISTQB Level 3)
│   └── (future system tests)
│
├── e2e/                                # E2E Tests (ISTQB Level 4)
│   ├── auth/
│   │   └── userRegistrationLogin.e2e.js
│   ├── plants/
│   │   └── plantManagement.e2e.js
│   ├── zones/
│   │   └── zoneManagement.e2e.js
│   ├── payment/
│   │   └── paymentSubscription.e2e.js
│   ├── ai/
│   │   └── aiFeatures.e2e.js
│   ├── dashboard/
│   │   └── dashboardMonitoring.e2e.js
│   └── i18n/
│       └── multiLanguage.e2e.js
│
└── acceptance/                         # Acceptance Tests (ISTQB Level 5)
    └── plantCareManagement.acceptance.js
```

## Total Test Files: 65

- Unit Tests: 51 files
- Integration Tests: 6 files
- E2E Tests: 7 files
- Acceptance Tests: 1 file

## Configuration Files: 10

- 3 Jest configs
- 3 Setup files
- 4 Helper utilities
