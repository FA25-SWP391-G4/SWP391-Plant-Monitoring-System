# Google OAuth Session Fix

## Problem

We were experiencing session state loss during the Google OAuth flow, specifically:
- `[GOOGLE AUTH] Session state: undefined` in the logs
- Receiving "Missing state parameters" errors 
- Getting redirected to `/login?error=missing_state`

The issue was caused by session data not being properly persisted between the initial OAuth request and the callback. 
Specifically, the session ID was changing between the initial request and the callback, resulting in:
```
[GOOGLE AUTH] Session ID: uzQzUfiaEsAiI1IRY8_pkujSqx3fl-jS  (initial request)
[GOOGLE AUTH] Session ID: 6RaKTfhf8ssjM30OT7GsvMJMZiE8NKM2  (callback)
```

## Solution Implemented

1. **Dual-Layer State Verification**
   - Added a database-backed OAuth state store (`oauth_states` table)
   - Implemented state verification that works even when sessions are lost
   - This allows the OAuth flow to succeed even if cookies aren't properly preserved

2. **Session Configuration Improvements**
   - Updated cookie settings to `SameSite: 'lax'` to allow cookies during redirects
   - Set custom session cookie name to avoid collisions
   - Set `resave: true` and `saveUninitialized: true` to ensure session persistence

3. **Enhanced CORS Configuration**
   - Added dynamic origin checking instead of fixed origin
   - Added Google's domain to allowed origins
   - Ensured credentials are properly allowed

4. **Improved Error Handling**
   - Added more specific error codes and messages
   - Enhanced logging to track session state throughout the flow
   - Implemented graceful fallbacks when sessions fail

## Technical Details

### Database Table Structure

```sql
CREATE TABLE oauth_states (
  state VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_oauth_states_created_at ON oauth_states (created_at);
```

### Session Settings

```javascript
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  name: 'plant_sid', // Custom name for the session cookie
  resave: true, 
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax', // Allow cookies during redirects
    maxAge: 24 * 60 * 60 * 1000
  }
}));
```

### State Verification Flow

1. Generate random state and store in both session and database
2. Redirect to Google with state parameter
3. When callback received, first check session for state
4. If session state is missing, fall back to database verification
5. Mark state as used in database after verification to prevent replay attacks

## Configuration

The session store now requires PostgreSQL connection details:

```javascript
// Environment variables required
DATABASE_URL=postgresql://username:password@localhost:5432/plant_system
SESSION_SECRET=your-secure-random-string
```

## Testing

To verify the fix:
1. Clear cookies and sessions in your browser
2. Attempt to log in via Google OAuth
3. Check server logs for session persistence
4. The callback should now properly maintain the state parameter

## Additional Notes

If you're running this in a load-balanced environment, ensure all instances share the same PostgreSQL database for sessions to maintain consistent session state across servers.

## Troubleshooting

If you still encounter session issues:
1. Check PostgreSQL connection and permissions
2. Verify that the `user_sessions` table exists and is properly indexed
3. Check for any network issues between the app server and PostgreSQL