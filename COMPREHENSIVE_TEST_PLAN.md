# Comprehensive Test Plan - Plant Monitoring System

## Critical Test Paths and Edge Cases

### Core Functionality Paths
1. **User Authentication Flow**
   - Registration → Email Verification → Login → Password Reset
   - Session Management → Token Refresh → Logout
   - Multi-factor Authentication → Recovery Flow

2. **Device Management Flow**
   - Device Registration → Certificate Installation → Connection
   - Configuration → Shadow State → Monitoring
   - Firmware Update → Reboot → Recovery

3. **Data Collection Flow**
   - Sensor Reading → Data Validation → Storage
   - Real-time Updates → Historical Data → Analytics
   - Backup → Archive → Restoration

4. **Automation Flow**
   - Schedule Creation → Validation → Execution
   - Alert Triggering → Notification → Action
   - Rule Processing → Device Control → Feedback

### Common Edge Cases
1. **Network Issues**
   - Connection Loss During Operations
   - Intermittent Connectivity
   - High Latency Scenarios
   - Partial Data Transmission

2. **Data Anomalies**
   - Invalid Sensor Readings
   - Corrupted Data Packets
   - Incomplete Transactions
   - Version Conflicts

3. **Resource Constraints**
   - Memory Limitations
   - Storage Capacity
   - CPU Utilization
   - Battery Life

4. **Security Scenarios**
   - Token Expiration
   - Invalid Certificates
   - Permission Conflicts
   - Rate Limiting

### Error Recovery Paths
1. **Device Recovery**
   - Connection Recovery
   - State Synchronization
   - Configuration Rollback

2. **Data Recovery**
   - Transaction Rollback
   - Data Reconciliation
   - Cache Invalidation

3. **User Session Recovery**
   - Session Restoration
   - State Recovery
   - Preference Synchronization

## Team Structure and Responsibilities

- IoT Engineer: Device connectivity, sensor data, and hardware integration tests
- Backend Engineer: API endpoints, database operations, and business logic tests
- Frontend Engineers (2): UI components, user interactions, and integration tests
- AI Engineer: Machine learning models, predictions, and AI service integration tests

## Test Categories and Tools

### Test Frameworks
- **Backend Testing**
  - Jest + Supertest: Express.js API testing
  - Jest + AWS SDK Mock: AWS service integration testing
  - Jest + MongoDB Memory Server: Database testing
- **Frontend Testing**
  - Jest + React Testing Library: Next.js component testing
  - Jest + MSW: API mocking for frontend tests
  - Cypress: End-to-end testing
- **IoT Testing**
  - Arduino Test Framework: Device firmware testing
  - AWS IoT Device SDK Test Suite: Device integration testing
  - MQTT.js: Message protocol testing
- **AI Testing**
  - Jest + AWS SDK Mock: SageMaker integration testing
  - Jest + OpenRouter SDK: AI API integration testing
  - Python unittest: AI model testing

### Test Tools
1. **Development Testing**
   - Postman: API development and testing
   - AWS IoT Test Tool: Device shadow and certificate testing
   - MQTT Explorer: IoT message monitoring
2. **Automation Testing**
   - Selenium WebDriver: UI automation testing
   - Cypress: End-to-end testing
   - GitHub Actions: CI/CD pipeline testing
3. **Project Management**
   - Jira: Test case management and bug tracking
   - TestRail: Test execution tracking
   - Confluence: Test documentation
4. **Security Testing**
   - OWASP ZAP: Security testing
   - SSL Labs: Certificate testing
   - AWS IAM Policy Simulator: Permission testing

### Technology-Specific Testing Tools

1. **Express.js & Node.js Testing**
   - Jest: Unit and integration testing
   - Supertest: HTTP endpoint testing
   - Nock: HTTP request mocking
   - Istanbul: Code coverage
   - ESLint: Code quality

2. **Next.js & React Testing**
   - React Testing Library: Component testing
   - Jest: JavaScript testing
   - MSW: API mocking
   - Cypress: E2E testing
   - Storybook: Component documentation

3. **AWS Service Testing**
   - AWS SDK Mock: Service mocking
   - LocalStack: Local AWS simulation
   - AWS SAM CLI: Lambda testing
   - AWS IoT Device Simulator
   - DynamoDB Local

4. **Arduino & IoT Testing**
   - Arduino CLI: Command line testing
   - PlatformIO: Unit testing
   - Mosquitto: MQTT broker testing
   - FreeRTOS simulator
   - Logic analyzer tools

5. **Database Testing**
   - PostgreSQL test containers
   - Redis Memory Server
   - Database cleaner
   - Migration testing tools
   - Seed data generators

6. **Performance Testing**
   - Artillery: Load testing
   - Lighthouse: Frontend performance
   - Node.js profiler
   - AWS CloudWatch
   - Grafana dashboards

7. **Monitoring & Debugging**
   - Winston: Logging
   - Debug: Debug logging
   - PM2: Process monitoring
   - New Relic: APM
   - Sentry: Error tracking



## Test Organization and Coverage

### Module Overview
1. **Core System Modules**
   - Authentication & Authorization
   - User Management
   - System Configuration

2. **IoT & Device Modules**
   - Device Management
   - Sensor Integration
   - Real-time Communication

3. **Data Management Modules**
   - Data Collection & Storage
   - Analytics & Reporting
   - Backup & Recovery

4. **Integration Modules**
   - AWS Services Integration
   - Arduino Device Integration
   - External API Integration

5. **Frontend Modules**
   - User Interface Components
   - State Management
   - Real-time Updates

### Test Types by Module
1. **Unit Tests**
   - Component Functions
   - Business Logic
   - Data Models

2. **Integration Tests**
   - API Endpoints
   - Service Communications
   - Database Operations

3. **End-to-End Tests**
   - User Workflows
   - Device Operations
   - System Processes

4. **Performance Tests**
   - Load Testing
   - Stress Testing
   - Scalability Testing

### Integration Points Testing
1. **AWS Service Integration**
   - **IoT Core**
     * Device Shadow State Management
     * Certificate Management
     * MQTT Message Broker
   - **DynamoDB**
     * Sensor Data Storage
     * Device State History
     * System Logs
   - **SageMaker**
     * AI Model Deployment
     * Prediction Endpoints
     * Model Monitoring
   - **SNS/SES**
     * Notification Delivery
     * Email Communications
     * Alert Broadcasting

2. **Arduino Device Integration**
   - **Hardware Interfaces**
     * Sensor Reading
     * Actuator Control
     * Power Management
   - **Communication Protocol**
     * MQTT Client
     * Data Formatting
     * Error Handling
   - **Firmware Management**
     * OTA Updates
     * Version Control
     * Bootloader Operations

3. **External API Integration**
   - **Weather Services**
     * Data Fetching
     * Update Scheduling
     * Error Handling
   - **OpenRouter AI**
     * API Authentication
     * Request/Response Handling
     * Rate Limiting

4. **Database Integration**
   - **PostgreSQL**
     * CRUD Operations
     * Transaction Management
     * Connection Pooling
   - **Redis Cache**
     * Data Caching
     * Session Storage
     * Real-time Updates

5. **Frontend Integration**
   - **Next.js API Routes**
     * Data Fetching
     * Server-side Props
     * API Middleware
   - **WebSocket**
     * Real-time Updates
     * Connection Management
     * Reconnection Handling

## Testing Techniques by Use Case

### Authentication Module (Express.js Backend)

#### 1. Register Account
**Test Framework**: Jest + Supertest

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Input Email | Input Password | Valid Format | User Exists | Test Scenario | Expected Result | Test Type |
|--------------|-------------|----------------|--------------|-------------|---------------|-----------------|-----------|
| REG-001      | Valid       | Valid          | Yes          | No          | Primary: New user registration | Success + JWT Token | Integration |
| REG-002      | Invalid     | Valid          | No           | No          | Exception: Email format validation | Format Error 400 | Unit |
| REG-003      | Valid       | Invalid        | No           | No          | Exception: Password requirements | Format Error 400 | Unit |
| REG-004      | Valid       | Valid          | Yes          | Yes         | Alternative: Duplicate registration | Conflict Error 409 | Integration |
| REG-005      | Valid       | Valid          | Yes          | No          | Exception: Database connection failure | Server Error 500 | Integration |

**Testing Approach:**
```javascript
describe('Registration API', () => {
  it('should register new user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'ValidPass123!'
      });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
  });
  // Additional test cases following pattern
});
```

**Test Tools:**
- Jest for unit/integration testing
- Supertest for API testing
- MongoDB Memory Server for database testing
  - Primary scenario: New user registration with valid data
  - Alternative scenarios: 
    * Email verification required
    * Password complexity requirements
    * Duplicate email handling
  - Exception scenarios: 
    * Network failure during registration
    * Database connection issues
- **Decision Table Testing**: Already defined in test cases
- **Test Tools**: 
  - NUnit for backend validation
  - Selenium for form interaction
  - Postman for API testing

#### 2. User Login
**Test Framework**: Jest + React Testing Library (Frontend) + Jest + Supertest (Backend)

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Email Exists | Password Match | Session Valid | Test Scenario | Expected Result | Test Type |
|--------------|-------------|----------------|---------------|---------------|-----------------|-----------|
| LOGIN-001    | Yes         | Yes            | N/A           | Primary: Valid credentials | Success + JWT | Integration |
| LOGIN-002    | Yes         | No             | N/A           | Exception: Invalid password | Auth Error 401 | Unit |
| LOGIN-003    | No          | Any            | N/A           | Exception: Unknown user | Not Found 404 | Unit |
| LOGIN-004    | Yes         | Yes            | Expired       | Alternative: Session refresh | New Token | Integration |

**Testing Approach:**
```javascript
// Backend Test (Jest + Supertest)
describe('Login API', () => {
  it('should authenticate user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'ValidPass123!'
      });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});

// Frontend Test (React Testing Library)
describe('Login Component', () => {
  it('should handle successful login', async () => {
    render(<Login />);
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'ValidPass123!');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(await screen.findByText(/welcome/i)).toBeInTheDocument();
  });
});
```

**Test Tools:**
- Jest + React Testing Library for frontend
- Jest + Supertest for backend API
- MSW (Mock Service Worker) for API mocking
- Next.js Testing Utils for page testing
  - Primary scenario: Valid credentials login
  - Alternative scenarios:
    * Remember me functionality
    * Multi-factor authentication
  - Exception scenarios:
    * Account locked after failed attempts
    * Session timeout handling
- **Test Tools**:
  - JUnit for session management
  - Selenium for login flow
  - Jira for test case tracking

#### 3. Logout (Express.js + Next.js)
**Test Framework**: Jest + React Testing Library + Next.js Testing

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Token Valid | Multiple Sessions | Active Requests | Test Scenario | Expected Result | Test Type |
|--------------|-------------|-------------------|-----------------|---------------|-----------------|-----------|
| LOGOUT-001   | Yes         | No                | No              | Primary: Clean logout | Success 200 | Integration |
| LOGOUT-002   | Yes         | Yes               | No              | Alternative: Multi-device | All Sessions Ended | Integration |
| LOGOUT-003   | No          | Any               | Any             | Exception: Invalid token | Unauthorized 401 | Unit |
| LOGOUT-004   | Yes         | Any               | Yes             | Exception: Pending requests | Graceful completion | Integration |

**Testing Approach:**
```javascript
// Backend Test
describe('Logout API', () => {
  it('should invalidate user session', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${validToken}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logged out successfully');
  });
});

// Frontend Test
describe('Logout Component', () => {
  it('should handle logout and redirect', async () => {
    const router = useRouter();
    render(<LogoutButton />);
    await userEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(router).toHaveBeenCalledWith('/login');
  });
});
```

**Test Tools:**
- Jest for backend testing
- React Testing Library for component testing
- Next.js Router mocking
- Redux state testing
  - Primary scenario: Clean logout
  - Alternative scenarios:
    * Logout from multiple devices
    * Session expiration logout
  - Exception scenarios:
    * Network disconnect during logout
    * Pending operations handling
- **Test Tools**:
  - Selenium for logout flow
  - Postman for session API testing

### Dashboard Module

#### 4. View Dashboard + Reports (Next.js + AWS Integration)
**Test Framework**: Jest + React Testing Library + AWS SDK Testing

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Data Source | User Role | AWS Connection | Test Scenario | Expected Result | Test Type |
|--------------|-------------|-----------|----------------|---------------|-----------------|-----------|
| DASH-001     | All         | Admin     | Connected      | Primary: Full dashboard | Complete View | E2E |
| DASH-002     | Partial     | User      | Connected      | Alternative: Limited data | Filtered View | Integration |
| DASH-003     | Any         | Any       | Failed         | Exception: AWS error | Error Handling | Integration |
| DASH-004     | Historical  | Premium   | Connected      | Alternative: Analytics | Advanced Charts | Unit |

**Testing Approach:**
```javascript
// Dashboard Component Test
describe('Dashboard Component', () => {
  it('should render all dashboard widgets for admin', async () => {
    mockAwsData.mockResolvedValueOnce(sampleData);
    render(<Dashboard userRole="admin" />);
    expect(await screen.findByTestId('sensor-stats')).toBeInTheDocument();
    expect(await screen.findByTestId('plant-health')).toBeInTheDocument();
  });
});

// AWS Integration Test
describe('AWS Data Integration', () => {
  it('should fetch sensor data from DynamoDB', async () => {
    const data = await fetchSensorData({
      timeRange: 'last24hours',
      deviceId: 'TEST001'
    });
    expect(data).toHaveProperty('items');
    expect(data.items.length).toBeGreaterThan(0);
  });
});

// API Route Test (Next.js)
describe('/api/dashboard', () => {
  it('should aggregate data from multiple sources', async () => {
    const response = await fetchDashboardData();
    expect(response).toHaveProperty('sensors');
    expect(response).toHaveProperty('alerts');
  });
});
```

**Test Tools:**
- Jest for component and integration testing
- React Testing Library for UI testing
- AWS SDK Mock for AWS service testing
- Next.js API route testing
- Chart.js testing utilities
  - Primary scenario: Load dashboard with all data
  - Alternative scenarios:
    * Filtered view based on permissions
    * Custom date range selection
  - Exception scenarios:
    * Partial data availability
    * Data loading timeout
- **Test Tools**:
  - Selenium for dashboard interaction
  - JUnit for data aggregation
  - Katalon for UI testing

### Plant Control Module

#### 5. Manual Irrigation Control (Arduino + AWS IoT + Express.js)
**Test Framework**: Arduino Test Framework + AWS IoT SDK + Jest

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Device Online | Water Level | Pump Status | Test Scenario | Expected Result | Test Type |
|--------------|---------------|-------------|-------------|---------------|-----------------|-----------|
| IRR-001     | Yes           | Sufficient  | Ready       | Primary: Manual activation | Success + AWS Log | E2E |
| IRR-002     | Yes           | Low         | Ready       | Exception: Resource check | Warning + Stop | Integration |
| IRR-003     | No            | Any         | Any         | Exception: Offline device | Error Response | Unit |
| IRR-004     | Yes           | Sufficient  | Error       | Exception: Hardware fault | Alert Generated | Integration |

**Testing Approach:**
```cpp
// Arduino Device Test
void test_pump_control() {
  // Test pump activation
  digitalWrite(PUMP_PIN, HIGH);
  delay(100);
  assertEqual(digitalRead(PUMP_SENSOR), HIGH);
  
  // Test pump deactivation
  digitalWrite(PUMP_PIN, LOW);
  delay(100);
  assertEqual(digitalRead(PUMP_SENSOR), LOW);
}

// AWS IoT Integration Test
describe('AWS IoT Device Shadow', () => {
  it('should update device shadow state', async () => {
    const shadowUpdate = {
      state: {
        desired: {
          pumpActive: true,
          duration: 30
        }
      }
    };
    const result = await updateDeviceShadow('TEST001', shadowUpdate);
    expect(result.state.reported.pumpActive).toBe(true);
  });
});

// Express.js API Test
describe('Irrigation Control API', () => {
  it('should send control command to device', async () => {
    const response = await request(app)
      .post('/api/irrigation/control')
      .send({
        deviceId: 'TEST001',
        action: 'START',
        duration: 30
      });
    expect(response.status).toBe(200);
    expect(response.body.command).toBe('ACKNOWLEDGED');
  });
});
```

**Test Tools:**
- Arduino IDE for hardware testing
- AWS IoT Device SDK for cloud integration
- Jest + Supertest for API testing
- MQTT.js for message testing
- AWS SDK Mock for shadow testing
  - Primary scenario: Manual watering execution
  - Alternative scenarios:
    * Schedule override
    * Emergency stop
  - Exception scenarios:
    * Device offline handling
    * Water pressure issues
- **Test Tools**:
  - NUnit for control logic
  - Postman for device API
  - Jira for issue tracking

### Notification Module

#### 6. View Alerts + Notifications (Next.js + AWS SNS)
**Test Framework**: Jest + React Testing Library + AWS SDK Testing

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Alert Type | AWS SNS Status | User Subscription | Test Scenario | Expected Result | Test Type |
|--------------|------------|----------------|-------------------|---------------|-----------------|-----------|
| NOTIF-001    | Emergency  | Active         | Subscribed       | Primary: Critical alert | Instant Push | E2E |
| NOTIF-002    | Regular    | Active         | Preferences Off  | Alternative: User prefs | No Alert | Integration |
| NOTIF-003    | Any        | Failed         | Any              | Exception: SNS failure | Fallback SMS | Integration |
| NOTIF-004    | Regular    | Active         | Subscribed       | Alternative: Batched | Grouped Alert | Unit |

**Testing Approach:**
```javascript
// Notification Component Test
describe('NotificationCenter', () => {
  it('should display real-time alerts', async () => {
    mockAwsSNS.mockImplementation(() => ({
      publish: jest.fn().mockResolvedValue({ MessageId: '123' })
    }));

    render(<NotificationCenter />);
    
    // Simulate incoming notification
    await act(async () => {
      mockWebSocket.emit('notification', {
        type: 'EMERGENCY',
        message: 'Water level critical'
      });
    });

    expect(screen.getByText('Water level critical')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('emergency');
  });
});

// AWS SNS Integration Test
describe('AWS SNS Integration', () => {
  it('should publish notifications to SNS topic', async () => {
    const notification = {
      type: 'EMERGENCY',
      message: 'Water level critical',
      deviceId: 'TEST001'
    };

    const result = await publishToSNS(notification);
    expect(result).toHaveProperty('MessageId');
  });
});

// Express Notification API Test
describe('/api/notifications', () => {
  it('should handle notification preferences', async () => {
    const response = await request(app)
      .post('/api/notifications/preferences')
      .send({
        userId: 'user123',
        preferences: {
          emergency: true,
          regular: false
        }
      });
    expect(response.status).toBe(200);
  });
});
```

**Test Tools:**
- Jest for component and API testing
- AWS SDK Mock for SNS testing
- WebSocket testing utilities
- React Testing Library
- Next.js API route testing
  - Primary scenario: Real-time alert display
  - Alternative scenarios:
    * Alert prioritization
    * Notification grouping
  - Exception scenarios:
    * System overload handling
    * Missing notification recovery
- **Test Tools**:
  - Selenium for notification UI
  - JUnit for alert logic
  - Katalon for end-to-end testing

### Profile Management

#### 7-8. View/Edit Profile
- **Use Case Testing**
  - Primary scenario: Profile information update
  - Alternative scenarios:
    * Partial update handling
    * Avatar management
  - Exception scenarios:
    * Concurrent edit handling
    * File upload failures
- **Test Tools**:
  - Selenium for profile forms
  - Postman for profile API
  - Jira for change tracking

### Security Module

#### 9. Change Password
- **Use Case Testing**
  - Primary scenario: Successful password update
  - Alternative scenarios:
    * Password history validation
    * Security question verification
  - Exception scenarios:
    * Session expiration during change
    * Database update failures
- **Test Tools**:
  - NUnit for security logic
  - Selenium for password forms
  - Jira for security testing

### Premium Features

#### 10. Upgrade to Premium Account
- **Use Case Testing**
  - Primary scenario: Successful payment and upgrade
  - Alternative scenarios:
    * Promo code application
    * Upgrade from trial
  - Exception scenarios:
    * Payment failure handling
    * Incomplete transaction recovery
- **Test Tools**:
  - Selenium for payment flow
  - Postman for payment API
  - JUnit for subscription logic

#### 11. Set Up Automatic Irrigation Schedule (AWS IoT + Arduino + Express.js)
**Test Framework**: Jest + AWS IoT SDK + Arduino Test Framework

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Schedule Type | Device Status | Conflicts | Test Scenario | Expected Result | Test Type |
|--------------|---------------|---------------|-----------|---------------|-----------------|-----------|
| SCHED-001    | Daily         | Online        | None      | Primary: New schedule | Success + IoT Update | E2E |
| SCHED-002    | Weekly        | Online        | Exists    | Alternative: Resolve conflict | Merged Schedule | Integration |
| SCHED-003    | Custom        | Offline       | None      | Exception: Device offline | Queued Schedule | Integration |
| SCHED-004    | Daily         | Online        | Invalid   | Exception: Time validation | Validation Error | Unit |

**Testing Approach:**
```javascript
// Schedule Creation Test
describe('Irrigation Schedule', () => {
  it('should create new watering schedule', async () => {
    const schedule = {
      deviceId: 'TEST001',
      schedule: {
        frequency: 'DAILY',
        time: '08:00',
        duration: 15
      }
    };

    const response = await request(app)
      .post('/api/schedule/create')
      .send(schedule);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('scheduleId');
  });
});

// AWS IoT Rule Test
describe('AWS IoT Rules Engine', () => {
  it('should create IoT rule for schedule', async () => {
    const rule = {
      name: 'daily_irrigation_TEST001',
      sql: "SELECT * FROM 'irrigation/schedule' WHERE deviceId = 'TEST001'",
      actions: [{
        lambda: {
          functionArn: 'arn:aws:lambda:region:account:function:irrigation-trigger'
        }
      }]
    };

    const result = await createIoTRule(rule);
    expect(result).toHaveProperty('ruleArn');
  });
});

// Arduino Schedule Handler
void test_schedule_execution() {
  // Test schedule parsing
  Schedule schedule;
  schedule.frequency = DAILY;
  schedule.hour = 8;
  schedule.duration = 15;
  
  // Verify schedule execution
  assertEqual(shouldExecuteSchedule(schedule), true);
  assertEqual(calculateNextExecution(schedule), expectedTime);
}

// Frontend Schedule Component
describe('ScheduleForm', () => {
  it('should validate schedule inputs', async () => {
    render(<ScheduleForm deviceId="TEST001" />);
    
    // Input invalid time
    await userEvent.type(screen.getByLabelText(/time/i), '25:00');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    expect(screen.getByText(/invalid time/i)).toBeInTheDocument();
  });
});
```

**Test Tools:**
- Jest for API and component testing
- AWS IoT Device SDK for rule testing
- Arduino IDE for device scheduling
- React Testing Library for UI
- AWS SDK Mock for IoT rules
  - Primary scenario: Create new watering schedule
  - Alternative scenarios:
    * Schedule modification
    * Conflict resolution
  - Exception scenarios:
    * Device offline handling
    * Schedule overlap resolution
- **Test Tools**:
  - NUnit for scheduling logic
  - Katalon for schedule UI
  - Jira for schedule tracking

#### 12. Receive Notifications via Email/SMS
- **Use Case Testing**
  - Primary scenario: Multi-channel notification delivery
  - Alternative scenarios:
    * Channel preference management
    * Notification batching
  - Exception scenarios:
    * Delivery failure handling
    * Rate limit management
- **Test Tools**:
  - JUnit for notification service
  - Postman for notification API
  - Selenium for preference settings

### Analytics Module

#### 13. View Advanced Statistics + History (Next.js + AWS DynamoDB + AWS QuickSight)
**Test Framework**: Jest + AWS SDK Testing + React Testing Library

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Data Range | Premium User | Query Complexity | Test Scenario | Expected Result | Test Type |
|--------------|------------|--------------|------------------|---------------|-----------------|-----------|
| STATS-001    | 30 Days    | Yes          | Simple          | Primary: Basic stats | Full Dataset | E2E |
| STATS-002    | Custom     | Yes          | Complex         | Alternative: Custom analysis | Aggregated Data | Integration |
| STATS-003    | Any        | No           | Any             | Exception: Non-premium | Limited Access | Unit |
| STATS-004    | 1 Year     | Yes          | Complex         | Exception: Large dataset | Paginated Result | Integration |

**Testing Approach:**
```javascript
// DynamoDB Query Test
describe('Historical Data Retrieval', () => {
  it('should fetch and aggregate sensor data', async () => {
    const params = {
      TableName: 'plant-sensor-data',
      KeyConditionExpression: 'deviceId = :did AND #ts BETWEEN :start AND :end',
      ExpressionAttributeNames: {
        '#ts': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':did': 'TEST001',
        ':start': Date.now() - (30 * 24 * 60 * 60 * 1000),
        ':end': Date.now()
      }
    };

    const result = await queryDynamoDB(params);
    expect(result.Items.length).toBeGreaterThan(0);
  });
});

// QuickSight Dashboard Test
describe('Analytics Dashboard', () => {
  it('should embed QuickSight dashboard', async () => {
    const dashboardURL = await getQuickSightEmbedURL({
      dashboardId: 'plant-analytics',
      userArn: 'test-user-arn',
      allowIAMUser: true
    });

    expect(dashboardURL).toMatch(/quicksight.amazonaws.com/);
  });
});

// Statistics Component Test
describe('StatisticsView', () => {
  it('should render charts with historical data', async () => {
    const mockData = generateMockTimeSeriesData(30);
    render(
      <StatisticsView 
        data={mockData}
        timeRange="30D"
        isPremium={true}
      />
    );

    expect(await screen.findByTestId('moisture-trend')).toBeInTheDocument();
    expect(await screen.findByTestId('temperature-chart')).toBeInTheDocument();
  });

  it('should handle premium feature restrictions', async () => {
    render(
      <StatisticsView 
        data={[]}
        timeRange="30D"
        isPremium={false}
      />
    );

    expect(screen.getByText(/upgrade to premium/i)).toBeInTheDocument();
  });
});

// API Route Test
describe('/api/statistics', () => {
  it('should handle large dataset pagination', async () => {
    const response = await request(app)
      .get('/api/statistics')
      .query({
        deviceId: 'TEST001',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 1,
        limit: 100
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('hasMore');
    expect(response.body).toHaveProperty('nextCursor');
  });
});
```

**Test Tools:**
- Jest for component and API testing
- AWS SDK Mock for DynamoDB
- QuickSight embedding testing
- Chart.js testing utilities
- React Testing Library
  - Primary scenario: Complete statistics view
  - Alternative scenarios:
    * Custom date range analysis
    * Data export functionality
  - Exception scenarios:
    * Large dataset handling
    * Missing data periods
- **Test Tools**:
  - Selenium for analytics UI
  - JUnit for data processing
  - Katalon for report generation

### AI Features

#### 14. Basic AI Consultation (AWS SageMaker + Express.js)
**Test Framework**: Jest + AWS SDK + SageMaker Testing

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Image Quality | Model Status | AWS Connection | Test Scenario | Expected Result | Test Type |
|--------------|---------------|--------------|----------------|---------------|-----------------|-----------|
| AI-001       | High          | Deployed     | Active         | Primary: Disease detection | Accurate Analysis | E2E |
| AI-002       | Low           | Deployed     | Active         | Alternative: Poor image | Basic Analysis | Integration |
| AI-003       | Any           | Training     | Active         | Exception: Model unavailable | Fallback Response | Integration |
| AI-004       | High          | Deployed     | Failed         | Exception: AWS error | Local Processing | Unit |

**Testing Approach:**
```javascript
// SageMaker Model Test
describe('Plant Disease Model', () => {
  it('should analyze plant image successfully', async () => {
    const mockImage = Buffer.from('test-image');
    const result = await analyzePlantImage({
      image: mockImage,
      modelEndpoint: 'plant-disease-endpoint'
    });
    
    expect(result).toHaveProperty('predictions');
    expect(result.predictions[0]).toHaveProperty('confidence');
  });
});

// Image Processing API Test
describe('/api/ai/analyze', () => {
  it('should handle image analysis request', async () => {
    const response = await request(app)
      .post('/api/ai/analyze')
      .attach('image', 'test-image.jpg')
      .field('plantType', 'tomato');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('analysis');
  });
});

// Fallback Handler Test
describe('Local AI Processing', () => {
  it('should use local model when AWS is unavailable', async () => {
    mockAWS.mockImplementation(() => {
      throw new Error('AWS Connection Failed');
    });

    const result = await processPlantImage('test-image.jpg');
    expect(result).toHaveProperty('localPrediction');
  });
});
```

**Test Tools:**
- Jest for API testing
- AWS SDK Mock for SageMaker
- Image processing testing utilities
- Express.js endpoint testing
- Local model testing framework
  - Primary scenario: Plant health analysis
  - Alternative scenarios:
    * Multiple plant analysis
    * Historical comparison
  - Exception scenarios:
    * Model unavailability
    * Low confidence results
- **Test Tools**:
  - NUnit for AI service
  - Postman for AI API
  - Jira for model tracking

### Admin Features

#### 15-16. User Management & System-Wide Reports
- **Use Case Testing**
  - Primary scenario: User role management
  - Alternative scenarios:
    * Bulk user operations
    * Custom report generation
  - Exception scenarios:
    * Permission conflicts
    * Report generation timeout
- **Test Tools**:
  - Selenium for admin interface
  - JUnit for admin logic
  - Katalon for reporting

#### 17-18. System Configuration & Logs
- **Use Case Testing**
  - Primary scenario: System settings modification
  - Alternative scenarios:
    * Configuration backup
    * Log analysis
  - Exception scenarios:
    * Configuration conflicts
    * Log storage overflow
- **Test Tools**:
  - NUnit for system config
  - Postman for admin API
  - Jira for system tracking

### Data Management

#### 19. Data Backup and Restore
- **Use Case Testing**
  - Primary scenario: Full system backup
  - Alternative scenarios:
    * Incremental backup
    * Selective restore
  - Exception scenarios:
    * Backup corruption handling
    * Storage space management
- **Test Tools**:
  - JUnit for backup service
  - Selenium for backup UI
  - Katalon for restore testing

#### 20. Manage Plant Database
- **Use Case Testing**
  - Primary scenario: Plant data maintenance
  - Alternative scenarios:
    * Bulk data import
    * Data validation
  - Exception scenarios:
    * Duplicate handling
    * Image storage issues
- **Test Tools**:
  - NUnit for database logic
  - Postman for plant API
  - Jira for data tracking

### IoT Features

#### 21-23. Automatic Irrigation & IoT Integration (Arduino + AWS IoT)
**Test Framework**: Arduino IDE Test + AWS IoT Device SDK + Jest

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Sensor Status | Connection State | Water Level | Test Scenario | Expected Result | Test Type |
|--------------|---------------|------------------|-------------|---------------|-----------------|-----------|
| IOT-001      | Active        | Connected        | Sufficient  | Primary: Normal operation | Watering Success | E2E |
| IOT-002      | Active        | Disconnected     | Any         | Exception: Connection loss | Queue Commands | Integration |
| IOT-003      | Error         | Connected        | Any         | Exception: Sensor failure | Alert Generated | Unit |
| IOT-004      | Active        | Connected        | Low         | Alternative: Low water | Warning + Stop | Integration |

**Testing Approach:**
```cpp
// Arduino Test
void test_moisture_sensor() {
  int reading = readMoistureSensor();
  assertEqual(reading >= 0 && reading <= 1023, true);
}

// AWS IoT Integration Test
describe('AWS IoT Integration', () => {
  it('should publish sensor data to AWS IoT', async () => {
    const message = {
      deviceId: 'TEST001',
      moisture: 450,
      timestamp: Date.now()
    };
    const result = await publishToAWS(message);
    expect(result.published).toBe(true);
  });
});

// Backend Handler Test
describe('IoT Data Handler', () => {
  it('should process incoming sensor data', async () => {
    const data = {
      deviceId: 'TEST001',
      moisture: 450
    };
    const response = await request(app)
      .post('/api/iot/data')
      .send(data);
    expect(response.status).toBe(200);
  });
});
```

**Test Tools:**
- Arduino IDE for device testing
- AWS IoT Device SDK for cloud integration
- MQTT.js for message testing
- Jest for backend integration
  - Primary scenario: Automated watering execution
  - Alternative scenarios:
    * Manual override
    * Sensor calibration
  - Exception scenarios:
    * Sensor failure handling
    * Communication loss recovery
- **Test Tools**:
  - JUnit for IoT logic
  - Postman for device API
  - Katalon for automation testing

### Advanced Features

#### 24-25. Advanced AI & Historical Data
- **Use Case Testing**
  - Primary scenario: AI-powered analysis
  - Alternative scenarios:
    * Model retraining
    * Data archival
  - Exception scenarios:
    * Model performance degradation
    * Storage optimization
- **Test Tools**:
  - NUnit for AI pipeline
  - Selenium for analysis UI
  - Jira for model tracking

#### 26. Forgot Password (Express.js + AWS SES + Next.js)
**Test Framework**: Jest + AWS SDK Testing + React Testing Library

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Email Exists | Token Status | Email Delivery | Test Scenario | Expected Result | Test Type |
|--------------|-------------|--------------|----------------|---------------|-----------------|-----------|
| FORGOT-001   | Yes         | Valid        | Success        | Primary: Reset flow | Reset Success | E2E |
| FORGOT-002   | No          | N/A          | N/A            | Exception: Unknown email | Not Found 404 | Unit |
| FORGOT-003   | Yes         | Expired      | Success        | Exception: Expired token | Token Error | Integration |
| FORGOT-004   | Yes         | Valid        | Failed         | Exception: Email failure | Retry Logic | Integration |

**Testing Approach:**
```javascript
// Password Reset Flow Test
describe('Password Reset Process', () => {
  it('should initiate password reset', async () => {
    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'user@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/reset link sent/i);
  });
});

// AWS SES Email Test
describe('Email Service', () => {
  it('should send reset email via SES', async () => {
    const emailParams = {
      to: 'user@example.com',
      template: 'PASSWORD_RESET',
      data: {
        resetToken: 'valid-token',
        expiryTime: '1 hour'
      }
    };

    const result = await sendEmail(emailParams);
    expect(result.MessageId).toBeDefined();
  });
});

// Reset Token Validation
describe('Token Validation', () => {
  it('should validate reset token', async () => {
    const response = await request(app)
      .post('/api/auth/validate-reset-token')
      .send({ token: 'valid-token' });

    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(true);
  });
});

// Frontend Reset Form
describe('ResetPasswordForm', () => {
  it('should handle password reset submission', async () => {
    render(<ResetPasswordForm token="valid-token" />);

    await userEvent.type(
      screen.getByLabelText(/new password/i),
      'NewSecurePass123!'
    );
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      'NewSecurePass123!'
    );
    await userEvent.click(screen.getByRole('button', { name: /reset/i }));

    expect(await screen.findByText(/password updated/i)).toBeInTheDocument();
  });
});
```

**Test Tools:**
- Jest for API testing
- AWS SDK Mock for SES
- React Testing Library
- Token validation utilities
- Email template testing
  - Primary scenario: Password reset flow
  - Alternative scenarios:
    * Multiple reset requests
    * Security verification
  - Exception scenarios:
    * Token expiration
    * Email delivery issues
- **Test Tools**:
  - JUnit for reset logic
  - Selenium for reset flow
  - Postman for reset API

#### 27. Connect IoT Device (Arduino + AWS IoT Core + Express.js)
**Test Framework**: Arduino Test Framework + AWS IoT SDK + Jest

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Device Type | Network Status | Auth Status | Test Scenario | Expected Result | Test Type |
|--------------|-------------|----------------|-------------|---------------|-----------------|-----------|
| DEV-001      | Sensor      | Online         | Valid       | Primary: New device connection | Connected + Registered | E2E |
| DEV-002      | Sensor      | Online         | Invalid     | Exception: Auth failure | Connection Rejected | Unit |
| DEV-003      | Sensor      | Offline        | Valid       | Exception: Network issue | Retry + Queue | Integration |
| DEV-004      | Actuator    | Online         | Valid       | Alternative: Different device | Custom Config | Integration |

**Testing Approach:**
```javascript
// Arduino Device Connection Test
void test_device_connection() {
  // Test WiFi connection
  assertEqual(WiFi.status(), WL_CONNECTED);
  
  // Test AWS IoT connection
  assertTrue(client.connected());
  
  // Test device certificate
  assertTrue(validateCertificate());
}

// AWS IoT Connection Test
describe('AWS IoT Core Integration', () => {
  it('should connect device with valid certificate', async () => {
    const deviceParams = {
      thingName: 'TEST001',
      certificateId: 'test-cert-001',
      policyName: 'plant-device-policy'
    };
    
    const connection = await connectDevice(deviceParams);
    expect(connection.status).toBe('ACTIVE');
    expect(connection.connected).toBe(true);
  });

  it('should handle invalid certificate', async () => {
    const deviceParams = {
      thingName: 'TEST002',
      certificateId: 'invalid-cert',
      policyName: 'plant-device-policy'
    };
    
    await expect(connectDevice(deviceParams))
      .rejects.toThrow('Certificate validation failed');
  });
});

// Device Registration API Test
describe('/api/devices/register', () => {
  it('should register new device in system', async () => {
    const deviceInfo = {
      deviceId: 'TEST001',
      type: 'SENSOR',
      location: 'Zone A',
      capabilities: ['moisture', 'temperature']
    };

    const response = await request(app)
      .post('/api/devices/register')
      .send(deviceInfo);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('deviceId');
    expect(response.body).toHaveProperty('certificateArn');
  });
});

// Device Shadow Management
describe('Device Shadow Handler', () => {
  it('should update device shadow state', async () => {
    const shadowUpdate = {
      state: {
        reported: {
          moisture: 450,
          temperature: 25,
          batteryLevel: 85
        }
      }
    };

    const result = await updateDeviceShadow('TEST001', shadowUpdate);
    expect(result.state.reported).toMatchObject(shadowUpdate.state.reported);
  });

  it('should handle shadow synchronization', async () => {
    const desired = {
      state: {
        desired: {
          sensorInterval: 300,
          reportingEnabled: true
        }
      }
    };

    await updateDeviceShadow('TEST001', desired);
    const shadow = await getDeviceShadow('TEST001');
    
    expect(shadow.state.desired).toMatchObject(desired.state.desired);
  });
});
```

**Test Tools:**
- Arduino IDE for device testing
- AWS IoT Device SDK for cloud integration
- Jest for API and integration testing
- MQTT.js for connection testing
- AWS SDK Mock for IoT Core testing
  - Primary scenario: New device connection
  - Alternative scenarios:
    * Device reconnection
    * Multi-device management
  - Exception scenarios:
    * Certificate revocation
    * Network interruption
- **Test Tools**:
  - Arduino Test Framework
  - AWS IoT Test Tool
  - Postman for device API

#### 28. Device Registration (Express.js + AWS IoT Core)
**Test Framework**: Jest + AWS SDK Testing

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Device Info | User Role | AWS Status | Test Scenario | Expected Result | Test Type |
|--------------|-------------|-----------|------------|---------------|-----------------|-----------|
| REG-001      | Complete    | Admin     | Available  | Primary: New device | Success + Certs | E2E |
| REG-002      | Incomplete  | Admin     | Available  | Exception: Invalid data | Validation Error | Unit |
| REG-003      | Complete    | User      | Available  | Exception: No permission | Access Denied | Integration |
| REG-004      | Complete    | Admin     | Error      | Exception: AWS failure | System Error | Integration |

**Testing Approach:**
```javascript
// Device Registration Service Test
describe('Device Registration Service', () => {
  it('should register new device with certificates', async () => {
    const deviceInfo = {
      name: 'Garden Zone A Sensor',
      type: 'MOISTURE_SENSOR',
      location: 'Garden Zone A',
      owner: 'admin@example.com'
    };

    const result = await registerDevice(deviceInfo);
    expect(result).toHaveProperty('thingName');
    expect(result).toHaveProperty('certificateArn');
    expect(result).toHaveProperty('privateKey');
  });

  it('should validate device information', async () => {
    const invalidDevice = {
      name: 'Invalid Device'
      // Missing required fields
    };

    await expect(registerDevice(invalidDevice))
      .rejects.toThrow('Invalid device information');
  });
});

// AWS IoT Thing Creation Test
describe('AWS IoT Thing Management', () => {
  it('should create IoT thing with policy', async () => {
    const thingParams = {
      thingName: 'TEST003',
      thingTypeName: 'MOISTURE_SENSOR',
      attributes: {
        location: 'Garden Zone A',
        owner: 'admin@example.com'
      }
    };

    const result = await createIoTThing(thingParams);
    expect(result).toHaveProperty('thingArn');
    expect(result).toHaveProperty('thingId');
  });

  it('should attach policy to certificate', async () => {
    const params = {
      policyName: 'plant-device-policy',
      target: 'arn:aws:iot:region:account:cert/test-cert-id'
    };

    const result = await attachPolicy(params);
    expect(result.attached).toBe(true);
  });
});

// API Endpoint Test
describe('/api/devices', () => {
  it('should handle device registration request', async () => {
    const response = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Sensor',
        type: 'MOISTURE_SENSOR',
        location: 'Garden Zone B'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('deviceConfig');
    expect(response.body.deviceConfig).toHaveProperty('certificateId');
  });

  it('should enforce role-based access', async () => {
    const response = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'New Sensor',
        type: 'MOISTURE_SENSOR'
      });

    expect(response.status).toBe(403);
  });
});

// Frontend Registration Form
describe('DeviceRegistrationForm', () => {
  it('should handle device registration flow', async () => {
    render(<DeviceRegistrationForm />);

    await userEvent.type(
      screen.getByLabelText(/device name/i),
      'Garden Zone A Sensor'
    );
    await userEvent.selectOptions(
      screen.getByLabelText(/device type/i),
      'MOISTURE_SENSOR'
    );
    await userEvent.type(
      screen.getByLabelText(/location/i),
      'Garden Zone A'
    );

    await userEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/device registered/i)).toBeInTheDocument();
    expect(await screen.findByText(/download certificate/i)).toBeInTheDocument();
  });
});
```

**Test Tools:**
- Jest for API and service testing
- AWS SDK Mock for IoT Core
- React Testing Library
- Express API testing
- Certificate validation tools
  - Primary scenario: Complete device registration
  - Alternative scenarios:
    * Bulk device registration
    * Certificate renewal
  - Exception scenarios:
    * Policy attachment failure
    * Certificate generation error
- **Test Tools**:
  - AWS IoT Test Tool
  - Postman for registration API
  - Jira for device tracking

#### 29. Device Configuration Management (Express.js + AWS IoT Core)
**Test Framework**: Jest + AWS SDK Testing + React Testing Library

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Config Type | Device Status | User Role | Test Scenario | Expected Result | Test Type |
|--------------|-------------|---------------|-----------|---------------|-----------------|-----------|
| CFG-001      | Basic       | Online        | Admin     | Primary: Update config | Success + Applied | E2E |
| CFG-002      | Advanced    | Online        | User      | Exception: No access | Permission Error | Unit |
| CFG-003      | Basic       | Offline       | Admin     | Alternative: Queue update | Pending Status | Integration |
| CFG-004      | Invalid     | Any           | Admin     | Exception: Validation | Config Error | Integration |

**Testing Approach:**
```javascript
// Device Configuration Service
describe('Device Configuration Service', () => {
  it('should update device settings', async () => {
    const config = {
      deviceId: 'TEST001',
      settings: {
        sensorInterval: 300,
        moistureThreshold: 40,
        reportingEnabled: true
      }
    };

    const result = await updateDeviceConfig(config);
    expect(result.applied).toBe(true);
    expect(result.version).toBeGreaterThan(0);
  });

  it('should validate configuration values', async () => {
    const invalidConfig = {
      deviceId: 'TEST001',
      settings: {
        sensorInterval: -1 // Invalid value
      }
    };

    await expect(updateDeviceConfig(invalidConfig))
      .rejects.toThrow('Invalid configuration value');
  });
});

// AWS IoT Configuration Management
describe('AWS IoT Device Management', () => {
  it('should update device shadow configuration', async () => {
    const configUpdate = {
      state: {
        desired: {
          settings: {
            sensorInterval: 300,
            moistureThreshold: 40
          }
        }
      }
    };

    const shadow = await updateDeviceShadow('TEST001', configUpdate);
    expect(shadow.state.desired).toMatchObject(configUpdate.state.desired);
  });

  it('should handle offline device configuration', async () => {
    const offlineConfig = {
      deviceId: 'OFFLINE001',
      settings: {
        sensorInterval: 600
      }
    };

    const result = await queueDeviceConfig(offlineConfig);
    expect(result.status).toBe('PENDING');
    expect(result.queuePosition).toBeDefined();
  });
});

// Configuration API Test
describe('/api/devices/config', () => {
  it('should handle configuration updates', async () => {
    const response = await request(app)
      .put('/api/devices/TEST001/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        settings: {
          sensorInterval: 300,
          moistureThreshold: 40
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.applied).toBe(true);
  });

  it('should enforce role-based configuration access', async () => {
    const response = await request(app)
      .put('/api/devices/TEST001/config')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        settings: {
          sensorInterval: 300
        }
      });

    expect(response.status).toBe(403);
  });
});

// Frontend Configuration Component
describe('DeviceConfigurationForm', () => {
  it('should handle configuration updates', async () => {
    render(<DeviceConfigurationForm deviceId="TEST001" />);

    await userEvent.type(
      screen.getByLabelText(/sensor interval/i),
      '300'
    );
    await userEvent.type(
      screen.getByLabelText(/moisture threshold/i),
      '40'
    );

    await userEvent.click(screen.getByRole('button', { name: /update/i }));

    expect(await screen.findByText(/configuration updated/i)).toBeInTheDocument();
  });

  it('should validate configuration inputs', async () => {
    render(<DeviceConfigurationForm deviceId="TEST001" />);

    await userEvent.type(
      screen.getByLabelText(/sensor interval/i),
      '-1'
    );
    await userEvent.click(screen.getByRole('button', { name: /update/i }));

    expect(screen.getByText(/invalid interval/i)).toBeInTheDocument();
  });
});
```

**Test Tools:**
- Jest for service testing
- AWS SDK Mock for IoT Core
- React Testing Library
- Express endpoint testing
- Configuration validation utilities
  - Primary scenario: Device settings update
  - Alternative scenarios:
    * Batch configuration
    * Template-based config
  - Exception scenarios:
    * Validation failures
    * Offline device handling
- **Test Tools**:
  - AWS IoT Device Management Console
  - Postman for config API
  - Jira for config tracking

#### 30. Certificate Management (AWS IoT Core + Express.js)
**Test Framework**: Jest + AWS SDK Testing

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Cert Status | Device Status | Action Type | Test Scenario | Expected Result | Test Type |
|--------------|-------------|---------------|-------------|---------------|-----------------|-----------|
| CERT-001     | Valid       | Active        | Rotation    | Primary: Cert rotation | Success + Updated | E2E |
| CERT-002     | Expired     | Active        | Renewal     | Alternative: Renewal | New Certificate | Integration |
| CERT-003     | Valid       | Compromised   | Revocation  | Exception: Security | Cert Revoked | Integration |
| CERT-004     | Any         | Inactive      | Deletion    | Alternative: Cleanup | Resources Freed | Unit |

**Testing Approach:**
```javascript
// Certificate Management Service
describe('Certificate Management Service', () => {
  it('should rotate device certificate', async () => {
    const params = {
      deviceId: 'TEST001',
      rotationType: 'SCHEDULED'
    };

    const result = await rotateCertificate(params);
    expect(result).toHaveProperty('newCertificateArn');
    expect(result).toHaveProperty('previousCertificateId');
  });

  it('should handle certificate renewal', async () => {
    const params = {
      deviceId: 'TEST002',
      expiryDays: 365
    };

    const result = await renewCertificate(params);
    expect(result.status).toBe('ACTIVE');
    expect(result.expiryDate).toBeGreaterThan(Date.now());
  });
});

// AWS IoT Certificate Operations
describe('AWS IoT Certificate Management', () => {
  it('should create and attach certificate', async () => {
    const certParams = {
      setAsActive: true,
      templateName: 'plant-device-template'
    };

    const cert = await createCertificate(certParams);
    expect(cert).toHaveProperty('certificateArn');
    expect(cert).toHaveProperty('privateKey');
  });

  it('should revoke compromised certificate', async () => {
    const revokeParams = {
      certificateId: 'test-cert-id',
      revokeReason: 'SECURITY_COMPROMISE'
    };

    const result = await revokeCertificate(revokeParams);
    expect(result.status).toBe('REVOKED');
  });
});

// Certificate API Test
describe('/api/certificates', () => {
  it('should handle certificate operations', async () => {
    const response = await request(app)
      .post('/api/certificates/rotate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        deviceId: 'TEST001',
        rotationType: 'IMMEDIATE'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('newCertificate');
  });

  it('should manage certificate lifecycle', async () => {
    // Create certificate
    const createResponse = await request(app)
      .post('/api/certificates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        deviceId: 'TEST001',
        certificateType: 'DEFAULT'
      });

    expect(createResponse.status).toBe(201);

    // Revoke certificate
    const revokeResponse = await request(app)
      .post(`/api/certificates/${createResponse.body.certificateId}/revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reason: 'SECURITY_COMPROMISE'
      });

    expect(revokeResponse.status).toBe(200);
  });
});

// Certificate Monitoring
describe('Certificate Monitor', () => {
  it('should check certificate expiration', async () => {
    const monitor = new CertificateMonitor();
    const expiringCerts = await monitor.checkExpiringCertificates({
      daysThreshold: 30
    });

    expect(Array.isArray(expiringCerts)).toBe(true);
    expiringCerts.forEach(cert => {
      expect(cert).toHaveProperty('deviceId');
      expect(cert).toHaveProperty('daysToExpiry');
    });
  });

  it('should handle automatic renewal', async () => {
    const monitor = new CertificateMonitor();
    const renewalResult = await monitor.handleAutoRenewal({
      certificateId: 'test-cert-id',
      deviceId: 'TEST001'
    });

    expect(renewalResult.status).toBe('RENEWED');
    expect(renewalResult).toHaveProperty('newExpiryDate');
  });
});
```

**Test Tools:**
- Jest for service testing
- AWS SDK Mock for IoT Core
- Certificate validation utilities
- X.509 certificate testing tools
- AWS IoT security testing
  - Primary scenario: Certificate rotation
  - Alternative scenarios:
    * Automatic renewal
    * Bulk certificate management
  - Exception scenarios:
    * Revocation handling
    * Failed rotation recovery
- **Test Tools**:
  - AWS IoT Certificate Manager
  - OpenSSL for cert testing
  - Jira for security tracking

#### 31. Device Shadow Management (AWS IoT Core + Express.js)
**Test Framework**: Jest + AWS SDK Testing + MQTT Testing

**Combined Decision Table and Test Scenarios:**
| Test Case ID | Device State | Shadow State | Connection | Test Scenario | Expected Result | Test Type |
|--------------|--------------|--------------|------------|---------------|-----------------|-----------|
| SHADOW-001   | Online       | Synced       | Active     | Primary: State sync | Success + Match | E2E |
| SHADOW-002   | Offline      | Delta        | None       | Alternative: Queue delta | Pending Update | Integration |
| SHADOW-003   | Online       | Conflict     | Active     | Exception: Version mismatch | Resolve Conflict | Integration |
| SHADOW-004   | Recovering   | Stale        | Intermittent | Exception: Recovery | State Restored | Unit |

**Testing Approach:**
```javascript
// Shadow State Service
describe('Device Shadow Service', () => {
  it('should synchronize device state', async () => {
    const deviceState = {
      state: {
        reported: {
          moisture: 450,
          temperature: 25,
          lastReading: Date.now()
        }
      }
    };

    const result = await updateDeviceShadow('TEST001', deviceState);
    expect(result.state.reported).toMatchObject(deviceState.state.reported);
    expect(result.metadata).toBeDefined();
  });

  it('should handle delta updates', async () => {
    const desiredState = {
      state: {
        desired: {
          sensorInterval: 300
        }
      }
    };

    await updateDeviceShadow('TEST001', desiredState);
    const delta = await getDeviceShadowDelta('TEST001');
    expect(delta).toHaveProperty('state');
    expect(delta.state).toHaveProperty('sensorInterval');
  });
});

// MQTT Shadow Communication
describe('Shadow MQTT Handler', () => {
  it('should subscribe to shadow updates', async () => {
    const handler = new ShadowHandler('TEST001');
    await handler.subscribe();
    
    // Simulate shadow update
    const update = {
      state: {
        reported: {
          moisture: 460
        }
      }
    };

    await publishToShadowTopic('TEST001', update);
    
    const shadowState = await handler.getCurrentState();
    expect(shadowState.state.reported.moisture).toBe(460);
  });

  it('should handle shadow delta resolution', async () => {
    const handler = new ShadowHandler('TEST001');
    
    // Create a delta state
    await updateDeviceShadow('TEST001', {
      state: {
        desired: {
          sensorInterval: 400
        }
      }
    });

    // Resolve delta
    await handler.resolveDelta({
      state: {
        reported: {
          sensorInterval: 400
        }
      }
    });

    const shadow = await getDeviceShadow('TEST001');
    expect(shadow.state.desired).toEqual(shadow.state.reported);
  });
});

// Shadow API Test
describe('/api/shadow', () => {
  it('should get device shadow state', async () => {
    const response = await request(app)
      .get('/api/devices/TEST001/shadow')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('state');
  });

  it('should update shadow state', async () => {
    const response = await request(app)
      .patch('/api/devices/TEST001/shadow')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        state: {
          desired: {
            sensorInterval: 300
          }
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.state.desired.sensorInterval).toBe(300);
  });
});

// Shadow Persistence
describe('Shadow Persistence Handler', () => {
  it('should persist shadow history', async () => {
    const history = await getShadowHistory('TEST001', {
      startTime: Date.now() - (24 * 60 * 60 * 1000), // Last 24 hours
      limit: 100
    });

    expect(Array.isArray(history)).toBe(true);
    history.forEach(entry => {
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('state');
    });
  });

  it('should handle shadow version conflicts', async () => {
    const handler = new ShadowHandler('TEST001');
    
    // Create parallel updates
    const update1 = handler.updateShadow({
      state: {
        reported: {
          moisture: 470
        }
      }
    });

    const update2 = handler.updateShadow({
      state: {
        reported: {
          moisture: 480
        }
      }
    });

    await expect(Promise.all([update1, update2]))
      .rejects.toThrow('Version conflict');
  });
});
```

**Test Tools:**
- Jest for service testing
- AWS SDK Mock for IoT Core
- MQTT.js for message testing
- Shadow state validation
- Version conflict resolution
  - Primary scenario: Shadow synchronization
  - Alternative scenarios:
    * Offline updates
    * Batch state updates
  - Exception scenarios:
    * Version conflicts
    * Connection recovery
- **Test Tools**:
  - AWS IoT Device Shadow
  - MQTT Explorer
  - Jira for state tracking
| IOT-CON-001  | Supported   | Connected      | Valid       | Primary: New device | Connected + Registered | E2E |
| IOT-CON-002  | Supported   | Connected      | Invalid     | Exception: Auth fail | Connection Rejected | Integration |
| IOT-CON-003  | Supported   | Disconnected   | Valid       | Exception: Network | Retry Logic | Integration |
| IOT-CON-004  | Unsupported | Any           | Any         | Exception: Compatibility | Not Supported | Unit |

**Testing Approach:**
```cpp
// Arduino Device Test
void test_device_connection() {
  WiFiClient client;
  
  // Test WiFi connection
  assertEqual(WiFi.status(), WL_CONNECTED);
  
  // Test MQTT connection
  assertTrue(client.connect(AWS_IOT_ENDPOINT, 8883));
  
  // Test device registration
  String registrationPayload = createRegistrationPayload();
  assertTrue(client.publish("device/register", registrationPayload));
}

// AWS IoT Core Test
describe('AWS IoT Device Registration', () => {
  it('should register new device in IoT Core', async () => {
    const deviceInfo = {
      thingName: 'PLANT001',
      thingTypeName: 'MOISTURE_SENSOR',
      attributes: {
        placement: 'indoor',
        version: '1.0.0'
      }
    };

    const result = await registerIoTDevice(deviceInfo);
    expect(result).toHaveProperty('thingArn');
    expect(result).toHaveProperty('thingId');
  });
});

// Device Provisioning API
describe('/api/devices', () => {
  it('should handle device provisioning', async () => {
    const response = await request(app)
      .post('/api/devices/provision')
      .send({
        deviceId: 'PLANT001',
        type: 'MOISTURE_SENSOR',
        location: 'Indoor Garden'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('certificates');
    expect(response.body).toHaveProperty('endpoint');
  });
});

// Certificate Management
describe('Device Certificates', () => {
  it('should generate and store device certificates', async () => {
    const certs = await generateDeviceCertificates('PLANT001');
    
    expect(certs).toHaveProperty('certificateArn');
    expect(certs).toHaveProperty('privateKey');
    expect(certs).toHaveProperty('publicKey');
  });
});

// Frontend Device Setup
describe('DeviceSetupWizard', () => {
  it('should guide through device setup process', async () => {
    render(<DeviceSetupWizard />);

    // Step 1: Device Information
    await userEvent.type(
      screen.getByLabelText(/device name/i),
      'Kitchen Plant Monitor'
    );
    await userEvent.click(screen.getByRole('button', { name: /next/i }));

    // Step 2: Network Setup
    expect(screen.getByText(/network configuration/i)).toBeInTheDocument();
    
    // Step 3: Verification
    await userEvent.click(screen.getByRole('button', { name: /verify/i }));
    expect(await screen.findByText(/device online/i)).toBeInTheDocument();
  });
});
```

**Test Tools:**
- Arduino IDE for device testing
- AWS IoT Device SDK
- MQTT.js for message testing
- Certificate management utilities
- Network simulation tools
  - Primary scenario: New device pairing
  - Alternative scenarios:
    * Device replacement
    * Firmware update
  - Exception scenarios:
    * Connection timeout
    * Authentication failure
- **Test Tools**:
  - NUnit for device logic
  - Postman for connection API
  - Jira for device tracking

## Test Schedule (Sep 8th - Nov 16th)

### Phase 1: Setup and Unit Testing (Sep 8 - Sep 22)

#### Week 1 (Sep 8 - Sep 14)
- **Backend Engineer**
  - Setup test environment
  - Authentication module unit tests
  - Database operations testing

- **Frontend Engineers**
  - Setup Jest and React Testing Library
  - Component unit testing setup
  - Basic component tests

- **IoT Engineer**
  - Sensor simulation setup
  - Basic device communication tests
  - Hardware interface unit tests

- **AI Engineer**
  - AI service test environment setup
  - Basic model loading tests
  - Initial prediction testing

#### Week 2 (Sep 15 - Sep 22)
- Complete remaining unit tests
- Code coverage analysis
- First round of bug fixes

### Phase 2: Integration Testing (Sep 23 - Oct 13)

#### Week 3-4 (Sep 23 - Oct 6)
- **Backend Engineer**
  - API endpoint integration tests
  - Database transaction tests
  - Error handling validation

- **Frontend Engineers**
  - Component integration tests
  - State management testing
  - API integration validation

- **IoT Engineer**
  - Device-server communication tests
  - Data flow validation
  - Error recovery testing

- **AI Engineer**
  - Model integration tests
  - Service API testing
  - Performance validation

#### Week 5 (Oct 7 - Oct 13)
- Cross-component integration testing
- Integration bug fixes
- Performance optimization

### Phase 3: System Testing (Oct 14 - Oct 27)

#### Week 6-7 (Oct 14 - Oct 27)
- **Backend Engineer**
  - Full system flow testing
  - Security testing
  - Load testing

- **Frontend Engineers**
  - End-to-end UI testing
  - Cross-browser testing
  - Responsive design validation

- **IoT Engineer**
  - Full device lifecycle testing
  - Long-running stability tests
  - Edge case scenarios

- **AI Engineer**
  - Full prediction pipeline testing
  - Resource utilization testing
  - Error handling scenarios

### Phase 4: User Acceptance Testing (Oct 28 - Nov 10)

#### Week 8-9 (Oct 28 - Nov 10)
- **All Team Members**
  - User scenario testing
  - Feature validation
  - Bug fixing
  - Performance tuning

### Phase 5: Final Testing and Documentation (Nov 11 - Nov 16)

#### Week 10 (Nov 11 - Nov 16)
- **All Team Members**
  - Final regression testing
  - Documentation completion
  - Test report generation
  - Release preparation

### Individual Presentation Schedule (Nov 16)

1. **IoT Engineer (8 minutes)**
   - Device connectivity testing results
   - Sensor data validation results
   - System stability metrics

2. **Backend Engineer (8 minutes)**
   - API testing results
   - Database performance metrics
   - Security test findings

3. **Frontend Engineer 1 (8 minutes)**
   - UI component test results
   - Integration test findings
   - User experience metrics

4. **Frontend Engineer 2 (8 minutes)**
   - Cross-browser testing results
   - Responsive design validation
   - Performance test metrics

5. **AI Engineer (8 minutes)**
   - Model accuracy results
   - Prediction performance metrics
   - Integration test findings

## Conclusion

This comprehensive test plan covers all 26 use cases with detailed decision tables and test cases. Each component has been analyzed for various scenarios and edge cases, ensuring thorough testing coverage across the entire system.