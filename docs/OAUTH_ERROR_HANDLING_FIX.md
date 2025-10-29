# OAuth Error Handling - Moved to LoginForm Component

## Change Summary

Moved OAuth error handling from `login/page.jsx` to `LoginForm.jsx` component to ensure proper error display and handling.

## Why This Change?

**Problem**: The login page doesn't have direct access to the LoginForm's error handling mechanism.

**Solution**: Move OAuth error detection and display directly into the LoginForm component where the error state is managed.

## Changes Made

### 1. LoginForm.jsx - Added OAuth Error Handling

#### Import Changes
```javascript
// Added useSearchParams and toast
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
```

#### State Changes
```javascript
const [errors, setErrors] = useState({
  email: '',
  password: '',
  form: '',
  oauth: '' // NEW: OAuth error from URL parameters
});

const searchParams = useSearchParams(); // NEW: To read URL params
```

#### New useEffect Hook for OAuth Errors
```javascript
// Handle OAuth errors from URL parameters
useEffect(() => {
  const error = searchParams.get('error');
  const email = searchParams.get('email');
  
  if (error) {
    console.log('[LOGIN FORM] OAuth error detected:', error);
    
    if (error === 'account_not_linked') {
      const message = `This email (${email}) is already registered with a password...`;
      setErrors(prev => ({ ...prev, oauth: message }));
      toast.error('Account not linked to Google');
    } else if (error === 'google_id_mismatch') {
      const message = 'Google account mismatch...';
      setErrors(prev => ({ ...prev, oauth: message }));
      toast.error('Google account mismatch');
    } else if (error === 'account_not_found') {
      const message = 'No account found...';
      setErrors(prev => ({ ...prev, oauth: message }));
      toast.error('Account not found');
      
      // Auto-redirect to registration after 2 seconds
      setTimeout(() => {
        router.push(`/register?email=${encodeURIComponent(email || '')}&google=true`);
      }, 2000);
    } else {
      const message = `Authentication error: ${error}`;
      setErrors(prev => ({ ...prev, oauth: message }));
      toast.error(`Login failed: ${error}`);
    }
  }
}, [searchParams, router]);
```

#### Error Display in JSX
```jsx
{/* Display OAuth errors from URL parameters */}
{errors.oauth && (
  <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-4">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-600 mt-0.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div className="ml-3">
        <h4 className="text-sm font-semibold text-red-900 mb-1">Authentication Error</h4>
        <p className="text-sm text-red-800">{errors.oauth}</p>
      </div>
    </div>
  </div>
)}

{/* Display form-level errors */}
{errors.form && (
  ...existing form error display...
)}
```

#### Error Reset in handleSubmit
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Clear previous errors (including OAuth errors)
  setErrors({
    email: '',
    password: '',
    form: '',
    oauth: '' // Clear OAuth errors on new submission
  });
  
  // ... rest of form handling
};
```

### 2. login/page.jsx - Reverted to Simple Version

The login page no longer handles OAuth errors. It's now a simple wrapper that:
- Checks if user is already logged in
- Displays the LoginForm component
- Shows the page layout (header, footer, etc.)

## Error Flow

### Before (Broken)
```
Backend redirects → /login?error=account_not_linked
                    ↓
                login/page.jsx tries to handle error
                    ↓
                But LoginForm.jsx has the error display logic
                    ↓
                ❌ Error not shown to user
```

### After (Fixed)
```
Backend redirects → /login?error=account_not_linked
                    ↓
                LoginForm.jsx detects error from URL
                    ↓
                Sets errors.oauth state
                    ↓
                Displays error in form UI
                    ✅ Shows toast notification
                    ✅ Shows error alert in form
```

## Error Types Handled

| Error Code | Display Message | Action |
|------------|----------------|--------|
| `account_not_linked` | "This email (email@example.com) is already registered with a password. Please log in with your password, or link your Google account in settings." | Show error, allow password login |
| `google_id_mismatch` | "Google account mismatch. This email is linked to a different Google account." | Show error, prompt to use correct Google account |
| `account_not_found` | "No account found with this Google email. Please register first." | Show error for 2 seconds, then auto-redirect to registration |
| Other errors | "Authentication error: {error}" | Show generic error message |

## Visual Display

The OAuth error appears above the login form with:
- Red background (`bg-red-50`)
- Red border (`border-red-200`)
- Warning icon (circle with exclamation mark)
- Bold title: "Authentication Error"
- Descriptive message explaining the issue

## Testing

### Test Case 1: Account Not Linked
```
URL: /login?error=account_not_linked&email=test@example.com

Expected:
✅ Red error alert appears above form
✅ Message: "This email (test@example.com) is already registered with a password..."
✅ Toast notification: "Account not linked to Google"
✅ User can still log in with password
```

### Test Case 2: New User
```
URL: /login?error=account_not_found&email=newuser@gmail.com&google=true

Expected:
✅ Red error alert appears above form
✅ Message: "No account found with this Google email..."
✅ Toast notification: "Account not found"
✅ After 2 seconds, auto-redirects to /register?email=newuser@gmail.com&google=true
```

### Test Case 3: Error Cleared on Submit
```
1. User lands on /login?error=account_not_linked
2. Error displayed
3. User types email/password and submits

Expected:
✅ OAuth error clears when form is submitted
✅ Only validation/login errors shown after submission
```

## Files Modified

| File | Changes |
|------|---------|
| `client/src/components/LoginForm.jsx` | - Added `useSearchParams` import<br>- Added `toast` import<br>- Added `oauth` to errors state<br>- Added OAuth error detection useEffect<br>- Added OAuth error display in JSX<br>- Updated error clearing in handleSubmit |
| `client/src/app/login/page.jsx` | - Reverted to simple version (no OAuth error handling) |

## Benefits

1. **Proper Separation of Concerns**: Error display happens where error state is managed
2. **Better UX**: Toast notifications + inline error alerts
3. **Auto-redirect**: New users automatically sent to registration
4. **Error Clearing**: OAuth errors clear when user submits form
5. **Consistency**: Uses same error display pattern as form validation errors

## Related Documentation

- `docs/GOOGLE_OAUTH_COOKIE_FIX.md` - Complete OAuth cookie and redirect fix
- `docs/GOOGLE_OAUTH_FLOW.md` - Full OAuth flow documentation
- `docs/GOOGLE_OAUTH_LOGIN_FIX.md` - Initial redirect fix
