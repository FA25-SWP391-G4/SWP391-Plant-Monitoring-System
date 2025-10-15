# Security and Error Handling Tests Documentation

## Overview

This document describes the comprehensive security and error handling tests implemented for the AI Service. These tests ensure that all security measures, data protection features, and error handling mechanisms work correctly according to the requirements.

## Test Coverage

### 1. Rate Limiting Tests

**Purpose**: Verify that rate limiting prevents abuse and ensures fair usage of AI services.

**Tests Implemented**:
- ✅ Allow requests within rate limit
- ✅ Block requests exceeding rate limit  
- ✅ Different rate limits for different endpoints
- ✅ Rate limit reset after window expires

**Rate Limits Tested**:
- General API: 100 requests/minute
- Chatbot: 30 requests/minute
- Image Upload: 10 requests/minute
- Health Check: 60 requests/minute

**Requirements Covered**: 5.2 (Rate limiting for AI endpoints)

### 2. Authentication Tests

**Purpose**: Ensure proper authentication and authorization mechanisms.

**Tests Implemented**:
- ✅ Allow requests with valid API key
- ✅ Reject requests with invalid API key
- ✅ Allow requests without API key in development
- ✅ Validate JWT token format

**Authentication Methods Tested**:
- API Key authentication (x-api-key header)
- JWT Bearer token validation
- Environment-based authentication requirements

**Requirements Covered**: 5.2 (JWT authentication for protected endpoints)

### 3. Input Validation and Sanitization Tests

**Purpose**: Prevent XSS, injection attacks, and ensure data integrity.

**Tests Implemented**:
- ✅ Sanitize malicious string input (XSS prevention)
- ✅ Validate message content (length, suspicious patterns)
- ✅ Validate user ID (type, range validation)
- ✅ Validate plant ID with defaults
- ✅ Validate file upload (size, type, filename security)

**Security Features Tested**:
- XSS pattern detection and removal
- Script tag filtering
- File type validation
- Directory traversal prevention
- Executable file rejection

**Requirements Covered**: 5.2 (Input validation and sanitization)

### 4. AI-Specific Security Validation Tests

**Purpose**: Ensure AI endpoints have proper validation for their specific use cases.

**Tests Implemented**:
- ✅ Validate chatbot requests (message, user context)
- ✅ Reject invalid chatbot requests
- ✅ Validate irrigation requests (sensor data ranges)
- ✅ Reject irrigation requests with invalid sensor data

**AI-Specific Validations**:
- Plant-related content detection
- Sensor data range validation (0-100% humidity, -50°C to 80°C temperature)
- Language validation (vi/en only)
- Session ID format validation

**Requirements Covered**: 1.3, 2.1, 3.3 (Content filtering and validation)

### 5. Error Handling and Fallback Tests

**Purpose**: Ensure graceful degradation when AI services fail.

**Tests Implemented**:
- ✅ Handle AIServiceError correctly
- ✅ Provide chatbot fallback responses
- ✅ Provide disease detection fallback
- ✅ Provide irrigation prediction fallback
- ✅ Handle validation errors
- ✅ Handle multer file size errors

**Fallback Strategies Tested**:
- Rule-based chatbot responses when AI is unavailable
- Basic plant care advice when disease detection fails
- Sensor-based irrigation rules when ML prediction fails
- User-friendly error messages in Vietnamese

**Requirements Covered**: 4.2, 4.4 (Graceful degradation and fallback systems)

### 6. Data Encryption and Privacy Tests

**Purpose**: Ensure sensitive data is properly encrypted and protected.

**Tests Implemented**:
- ✅ Encrypt and decrypt data correctly (AES-256-GCM)
- ✅ Hash data with salt (PBKDF2)
- ✅ Encrypt chat history
- ✅ Encrypt and store images securely
- ✅ Anonymize user data
- ✅ Generate privacy report

**Encryption Features Tested**:
- AES-256-GCM encryption for sensitive data
- PBKDF2 hashing with salt for one-way data protection
- Secure filename generation for encrypted files
- Chat history encryption with version tracking
- User data anonymization for GDPR compliance

**Requirements Covered**: 5.1, 5.3, 5.4 (Data encryption and privacy measures)

### 7. Privacy Middleware Tests

**Purpose**: Ensure GDPR compliance and privacy protection features.

**Tests Implemented**:
- ✅ Log data access for audit trail
- ✅ Validate user consent
- ✅ Minimize response data
- ✅ Add privacy headers
- ✅ Handle data subject requests

**Privacy Features Tested**:
- Data access logging with anonymization
- User consent validation
- Automatic removal of sensitive fields from responses
- Privacy-related HTTP headers
- GDPR data subject rights (access, deletion, portability)

**Requirements Covered**: 5.1, 5.3, 5.4 (Privacy measures and GDPR compliance)

### 8. Data Retention Tests

**Purpose**: Ensure proper data lifecycle management and automatic cleanup.

**Tests Implemented**:
- ✅ Correct retention policies configuration
- ✅ Perform manual cleanup
- ✅ Reject invalid cleanup types
- ✅ Start and stop retention service

**Retention Policies Tested**:
- Chat History: 90 days
- Image Analysis: 30 days
- Sensor Data: 365 days
- Error Logs: 30 days
- Access Logs: 90 days

**Requirements Covered**: 5.1, 5.4 (Data retention policies)

### 9. Security Headers and CORS Tests

**Purpose**: Ensure proper HTTP security headers and CORS configuration.

**Tests Implemented**:
- ✅ Add security headers (CSP, XSS protection, etc.)
- ✅ Validate CORS origins

**Security Headers Tested**:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy
- Strict-Transport-Security
- Referrer-Policy

**Requirements Covered**: 5.2, 5.5 (Security headers and CORS configuration)

### 10. File Upload Security Tests

**Purpose**: Ensure uploaded files are safe and properly validated.

**Tests Implemented**:
- ✅ Validate image file headers
- ✅ Reject files with invalid headers

**File Security Features Tested**:
- Magic number validation for image files
- JPEG, PNG, WebP header verification
- Rejection of files with mismatched headers
- Protection against file type spoofing

**Requirements Covered**: 3.3, 3.4 (Image validation and content filtering)

### 11. Integration Security Tests

**Purpose**: Ensure all security measures work together correctly.

**Tests Implemented**:
- ✅ Handle complete security pipeline
- ✅ Handle security violations gracefully

**Integration Features Tested**:
- Multiple middleware layers working together
- Error propagation through security stack
- Graceful handling of security violations
- Comprehensive logging and monitoring

**Requirements Covered**: All security requirements (5.1, 5.2, 5.3, 5.4, 5.5)

## Test Execution

### Running the Tests

```bash
# Run all security tests
node ai-service/run-security-tests.js

# Run specific test file
npx jest ai-service/tests/security-error-handling.test.js --verbose

# Run with coverage
npx jest ai-service/tests/security-error-handling.test.js --coverage
```

### Test Environment Setup

The tests automatically:
1. Set up test directories for file operations
2. Configure test environment variables
3. Create mock data and files
4. Clean up after test completion

### Prerequisites

- Node.js and npm installed
- Jest testing framework
- Supertest for HTTP testing
- All AI service dependencies installed

## Security Test Results

### Expected Outcomes

When all tests pass, you should see:

```
✅ All security and error handling tests passed!

📊 Test Summary:
- ✅ Rate Limiting Tests
- ✅ Authentication Tests  
- ✅ Input Validation and Sanitization Tests
- ✅ AI-Specific Security Validation Tests
- ✅ Error Handling and Fallback Tests
- ✅ Data Encryption and Privacy Tests
- ✅ Privacy Middleware Tests
- ✅ Data Retention Tests
- ✅ Security Headers and CORS Tests
- ✅ File Upload Security Tests
- ✅ Integration Security Tests
```

### Security Features Verified

- **Rate Limiting**: Prevents API abuse with configurable limits
- **Authentication**: API key and JWT token validation
- **Input Sanitization**: XSS and injection attack prevention
- **File Security**: Malware protection and content validation
- **Data Encryption**: AES-256-GCM encryption for sensitive data
- **Privacy Compliance**: GDPR-compliant data handling
- **Error Handling**: Graceful degradation with fallback responses
- **Data Retention**: Automatic cleanup and lifecycle management
- **Security Headers**: Comprehensive HTTP security headers
- **Content Filtering**: Plant-related content validation only

## Troubleshooting

### Common Issues

1. **Test Directory Permissions**: Ensure the test runner can create/delete files in test directories
2. **Environment Variables**: Some tests require specific environment variables to be set
3. **Port Conflicts**: Ensure no other services are running on test ports
4. **File System Access**: Tests need read/write access to uploads and logs directories

### Debug Mode

Run tests with debug output:
```bash
DEBUG=* node ai-service/run-security-tests.js
```

### Individual Test Debugging

Run specific test suites:
```bash
npx jest ai-service/tests/security-error-handling.test.js -t "Rate Limiting Tests"
```

## Security Compliance

These tests verify compliance with:

- **OWASP Top 10**: Protection against common web vulnerabilities
- **GDPR**: Data protection and privacy requirements
- **Security Best Practices**: Industry-standard security measures
- **AI Safety**: Responsible AI deployment practices

## Continuous Security Testing

### Integration with CI/CD

Add to your CI/CD pipeline:
```yaml
- name: Run Security Tests
  run: node ai-service/run-security-tests.js
```

### Regular Security Audits

- Run security tests before each deployment
- Schedule weekly comprehensive security scans
- Monitor security test results and trends
- Update tests when new security features are added

## Conclusion

The comprehensive security test suite ensures that the AI Service meets all security requirements and provides robust protection against common threats. Regular execution of these tests helps maintain security posture and compliance with privacy regulations.

For questions or issues with security tests, refer to the troubleshooting section or contact the development team.