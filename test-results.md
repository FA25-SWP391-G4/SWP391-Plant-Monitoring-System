# Test Results

_Generated on 08:04:53 9/10/2025_

## Environment Check

Node.js version: v24.5.0
npm version: 11.5.1

## Backend Tests

Found 17 test files:

- user-controller.test.js (priority)
- plant-controller.test.js (priority)
- sensor-controller.test.js (priority)
- payment-controller.test.js (priority)
- notification-controller.test.js (priority)
- ai-controller.test.js (priority)
- admin-controller.test.js (priority)
- vnpay.test.js (priority)
- language-controller.test.js (priority)
- admin.test.js
- auth-simplified.test.js
- email-comprehensive.test.js
- frontend-backend-mapping.test.js
- frontend-rendering-i18n.test.js
- language-api.test.js
- profile-premium.test.js
- user.test.js

### user-controller.test.js

✅ PASSED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: ⚙️  specify custom .env file path with { path: '/custom/path/.env' }

      at _log (node_modules/dotenv/lib/main.js:139:11)


```

### plant-controller.test.js

✅ PASSED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: 📡 version env with Radar: https://dotenvx.com/radar

      at _log (node_modules/dotenv/lib/main.js:139:11)


```

### sensor-controller.test.js

✅ PASSED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com

      at _log (node_modules/dotenv/lib/main.js:139:11)


```

### payment-controller.test.js

✅ PASSED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: ⚙️  override existing env vars with { override: true }

      at _log (node_modules/dotenv/lib/main.js:139:11)


```

### notification-controller.test.js

✅ PASSED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: ⚙️  suppress all logs with { quiet: true }

      at _log (node_modules/dotenv/lib/main.js:139:11)


```

### ai-controller.test.js

✅ PASSED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }

      at _log (node_modules/dotenv/lib/main.js:139:11)


```

### admin-controller.test.js

✅ PASSED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: ⚙️  suppress all logs with { quiet: true }

      at _log (node_modules/dotenv/lib/main.js:139:11)


```

### vnpay.test.js

✅ PASSED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }

      at _log (node_modules/dotenv/lib/main.js:139:11)


```

### language-controller.test.js

✅ PASSED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`

      at _log (node_modules/dotenv/lib/main.js:139:11)


```

### admin.test.js

❌ FAILED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild

      at _log (node_modules/dotenv/lib/main.js:139:11)

  console.log
    [dotenv@17.2.2] injecting env (0) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }

      at _log (node_modules/dotenv/lib/main.js:139:11)


FAIL tests/admin.test.js
  ● Test suite failed to run

    Route.put() requires a callback function but got a [object Undefined]

    [0m [90m 32 |[39m [90m * @access  Private[39m
     [90m 33 |[39m [90m */[39m
    [31m[1m>[22m[39m[90m 34 |[39m router[33m.[39mput([32m'/:notificationId/read'[39m[33m,[39m authenticate[33m,[39m notificationController[33m.[39mmarkNotificationAsRead)[33m;[39m
     [90m    |[39m        [31m[1m^[22m[39m
     [90m 35 |[39m
     [90m 36 |[39m [90m/**[39m
     [90m 37 |[39m [90m * @route   PUT /api/notifications/read-all[39m[0m

      at Route.<computed> [as put] (node_modules/express/lib/router/route.js:202:15)
      at router.proto.<computed> [as put] (node_modules/express/lib/router/index.js:510:19)
      at Object.put (routes/notifications.js:34:8)
      at Object.require (app.js:172:27)
      at Object.require (tests/admin.test.js:16:13)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.786 s
Ran all test suites matching C:\Users\Dang\Documents\plant-system\tests\admin.test.js.

```

```
[dotenv@17.2.2] injecting env (13) from .env -- tip: 🛠️  run anywhere with `dotenvx run -- yourcommand`

C:\Users\Dang\Documents\plant-system\node_modules\express\lib\router\route.js:202
        throw new Error(msg);
        ^

Error: Route.put() requires a callback function but got a [object Undefined]
    at Route.<computed> [as put] (C:\Users\Dang\Documents\plant-system\node_modules\express\lib\router\route.js:202:15)
    at proto.<computed> [as put] (C:\Users\Dang\Documents\plant-system\node_modules\express\lib\router\index.js:510:19)
    at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\routes\notifications.js:34:8)
    at Module._compile (node:internal/modules/cjs/loader:1738:14)
    at Object..js (node:internal/modules/cjs/loader:1871:10)
    at Module.load (node:internal/modules/cjs/loader:1470:32)
    at Module._load (node:internal/modules/cjs/loader:1290:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:238:24)
    at Module.require (node:internal/modules/cjs/loader:1493:12)

Node.js v24.5.0

```

### auth-simplified.test.js

✅ PASSED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }

      at _log (node_modules/dotenv/lib/main.js:139:11)


```

### email-comprehensive.test.js

❌ FAILED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit

      at _log (node_modules/dotenv/lib/main.js:139:11)

  console.error
    Forgot password error: TypeError: user.createPasswordResetToken is not a function
        at Object.createPasswordResetToken [as forgotPassword] (C:\Users\Dang\Documents\plant-system\controllers\authController.js:188:33)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:97:13)

    [0m [90m 228 |[39m
     [90m 229 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 230 |[39m         console[33m.[39merror([32m'Forgot password error:'[39m[33m,[39m error)[33m;[39m
     [90m     |[39m                 [31m[1m^[22m[39m
     [90m 231 |[39m         
     [90m 232 |[39m         [90m// Reset password reset fields if email failed[39m
     [90m 233 |[39m         [36mif[39m (req[33m.[39mbody[33m.[39memail) {[0m

      at Object.error [as forgotPassword] (controllers/authController.js:230:17)
      at Object.<anonymous> (tests/email-comprehensive.test.js:97:13)

  console.error
    Cleanup error: TypeError: user.updatePasswordResetFields is not a function
        at Object.updatePasswordResetFields [as forgotPassword] (C:\Users\Dang\Documents\plant-system\controllers\authController.js:237:32)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:97:13)

    [0m [90m 238 |[39m                 }
     [90m 239 |[39m             } [36mcatch[39m (cleanupError) {
    [31m[1m>[22m[39m[90m 240 |[39m                 console[33m.[39merror([32m'Cleanup error:'[39m[33m,[39m cleanupError)[33m;[39m
     [90m     |[39m                         [31m[1m^[22m[39m
     [90m 241 |[39m             }
     [90m 242 |[39m         }
     [90m 243 |[39m[0m

      at Object.error [as forgotPassword] (controllers/authController.js:240:25)
      at Object.<anonymous> (tests/email-comprehensive.test.js:97:13)

  console.error
    Forgot password error: TypeError: user.createPasswordResetToken is not a function
        at Object.createPasswordResetToken [as forgotPassword] (C:\Users\Dang\Documents\plant-system\controllers\authController.js:188:33)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:149:13)

    [0m [90m 228 |[39m
     [90m 229 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 230 |[39m         console[33m.[39merror([32m'Forgot password error:'[39m[33m,[39m error)[33m;[39m
     [90m     |[39m                 [31m[1m^[22m[39m
     [90m 231 |[39m         
     [90m 232 |[39m         [90m// Reset password reset fields if email failed[39m
     [90m 233 |[39m         [36mif[39m (req[33m.[39mbody[33m.[39memail) {[0m

      at Object.error [as forgotPassword] (controllers/authController.js:230:17)
      at Object.<anonymous> (tests/email-comprehensive.test.js:149:13)

  console.error
    Cleanup error: TypeError: user.updatePasswordResetFields is not a function
        at Object.updatePasswordResetFields [as forgotPassword] (C:\Users\Dang\Documents\plant-system\controllers\authController.js:237:32)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:149:13)

    [0m [90m 238 |[39m                 }
     [90m 239 |[39m             } [36mcatch[39m (cleanupError) {
    [31m[1m>[22m[39m[90m 240 |[39m                 console[33m.[39merror([32m'Cleanup error:'[39m[33m,[39m cleanupError)[33m;[39m
     [90m     |[39m                         [31m[1m^[22m[39m
     [90m 241 |[39m             }
     [90m 242 |[39m         }
     [90m 243 |[39m[0m

      at Object.error [as forgotPassword] (controllers/authController.js:240:25)
      at Object.<anonymous> (tests/email-comprehensive.test.js:149:13)

  console.error
    Forgot password error: TypeError: user.createPasswordResetToken is not a function
        at Object.createPasswordResetToken [as forgotPassword] (C:\Users\Dang\Documents\plant-system\controllers\authController.js:188:33)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:171:13)

    [0m [90m 228 |[39m
     [90m 229 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 230 |[39m         console[33m.[39merror([32m'Forgot password error:'[39m[33m,[39m error)[33m;[39m
     [90m     |[39m                 [31m[1m^[22m[39m
     [90m 231 |[39m         
     [90m 232 |[39m         [90m// Reset password reset fields if email failed[39m
     [90m 233 |[39m         [36mif[39m (req[33m.[39mbody[33m.[39memail) {[0m

      at Object.error [as forgotPassword] (controllers/authController.js:230:17)
      at Object.<anonymous> (tests/email-comprehensive.test.js:171:13)

  console.error
    Cleanup error: TypeError: user.updatePasswordResetFields is not a function
        at Object.updatePasswordResetFields [as forgotPassword] (C:\Users\Dang\Documents\plant-system\controllers\authController.js:237:32)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:171:13)

    [0m [90m 238 |[39m                 }
     [90m 239 |[39m             } [36mcatch[39m (cleanupError) {
    [31m[1m>[22m[39m[90m 240 |[39m                 console[33m.[39merror([32m'Cleanup error:'[39m[33m,[39m cleanupError)[33m;[39m
     [90m     |[39m                         [31m[1m^[22m[39m
     [90m 241 |[39m             }
     [90m 242 |[39m         }
     [90m 243 |[39m[0m

      at Object.error [as forgotPassword] (controllers/authController.js:240:25)
      at Object.<anonymous> (tests/email-comprehensive.test.js:171:13)

  console.error
    Reset password error: TypeError: Cannot destructure property 'token' of 'req.query' as it is undefined.
        at Object.token [as resetPassword] (C:\Users\Dang\Documents\plant-system\controllers\authController.js:253:17)
        at Object.resetPassword (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:206:34)
        at Promise.finally.completed (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:1557:28)
        at new Promise (<anonymous>)
        at callAsyncCircusFn (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:1497:10)
        at _callCircusTest (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:1007:40)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at _runTest (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:947:3)
        at C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:849:7
        at _runTestsForDescribeBlock (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:862:11)
        at _runTestsForDescribeBlock (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:857:11)
        at _runTestsForDescribeBlock (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:857:11)
        at run (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:761:3)
        at runAndTransformResultsToJestFormat (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:1918:21)
        at jestAdapter (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\runner.js:101:19)
        at runTestInternal (C:\Users\Dang\Documents\plant-system\node_modules\jest-runner\build\index.js:275:16)
        at runTest (C:\Users\Dang\Documents\plant-system\node_modules\jest-runner\build\index.js:343:7)

    [0m [90m 336 |[39m
     [90m 337 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 338 |[39m         console[33m.[39merror([32m'Reset password error:'[39m[33m,[39m error)[33m;[39m
     [90m     |[39m                 [31m[1m^[22m[39m
     [90m 339 |[39m         res[33m.[39mstatus([35m500[39m)[33m.[39mjson({ 
     [90m 340 |[39m             error[33m:[39m [32m'Failed to reset password. Please try again later.'[39m 
     [90m 341 |[39m         })[33m;[39m[0m

      at Object.error [as resetPassword] (controllers/authController.js:338:17)
      at Object.resetPassword (tests/email-comprehensive.test.js:206:34)

  console.error
    Forgot password error: TypeError: user.createPasswordResetToken is not a function
        at Object.createPasswordResetToken [as forgotPassword] (C:\Users\Dang\Documents\plant-system\controllers\authController.js:188:33)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:240:13)

    [0m [90m 228 |[39m
     [90m 229 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 230 |[39m         console[33m.[39merror([32m'Forgot password error:'[39m[33m,[39m error)[33m;[39m
     [90m     |[39m                 [31m[1m^[22m[39m
     [90m 231 |[39m         
     [90m 232 |[39m         [90m// Reset password reset fields if email failed[39m
     [90m 233 |[39m         [36mif[39m (req[33m.[39mbody[33m.[39memail) {[0m

      at Object.error [as forgotPassword] (controllers/authController.js:230:17)
      at Object.<anonymous> (tests/email-comprehensive.test.js:240:13)

  console.error
    Cleanup error: TypeError: user.updatePasswordResetFields is not a function
        at Object.updatePasswordResetFields [as forgotPassword] (C:\Users\Dang\Documents\plant-system\controllers\authController.js:237:32)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:240:13)

    [0m [90m 238 |[39m                 }
     [90m 239 |[39m             } [36mcatch[39m (cleanupError) {
    [31m[1m>[22m[39m[90m 240 |[39m                 console[33m.[39merror([32m'Cleanup error:'[39m[33m,[39m cleanupError)[33m;[39m
     [90m     |[39m                         [31m[1m^[22m[39m
     [90m 241 |[39m             }
     [90m 242 |[39m         }
     [90m 243 |[39m[0m

      at Object.error [as forgotPassword] (controllers/authController.js:240:25)
      at Object.<anonymous> (tests/email-comprehensive.test.js:240:13)

  console.error
    Forgot password error: TypeError: user.createPasswordResetToken is not a function
        at Object.createPasswordResetToken [as forgotPassword] (C:\Users\Dang\Documents\plant-system\controllers\authController.js:188:33)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:263:13)

    [0m [90m 228 |[39m
     [90m 229 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 230 |[39m         console[33m.[39merror([32m'Forgot password error:'[39m[33m,[39m error)[33m;[39m
     [90m     |[39m                 [31m[1m^[22m[39m
     [90m 231 |[39m         
     [90m 232 |[39m         [90m// Reset password reset fields if email failed[39m
     [90m 233 |[39m         [36mif[39m (req[33m.[39mbody[33m.[39memail) {[0m

      at Object.error [as forgotPassword] (controllers/authController.js:230:17)
      at Object.<anonymous> (tests/email-comprehensive.test.js:263:13)

  console.error
    Cleanup error: TypeError: user.updatePasswordResetFields is not a function
        at Object.updatePasswordResetFields [as forgotPassword] (C:\Users\Dang\Documents\plant-system\controllers\authController.js:237:32)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:263:13)

    [0m [90m 238 |[39m                 }
     [90m 239 |[39m             } [36mcatch[39m (cleanupError) {
    [31m[1m>[22m[39m[90m 240 |[39m                 console[33m.[39merror([32m'Cleanup error:'[39m[33m,[39m cleanupError)[33m;[39m
     [90m     |[39m                         [31m[1m^[22m[39m
     [90m 241 |[39m             }
     [90m 242 |[39m         }
     [90m 243 |[39m[0m

      at Object.error [as forgotPassword] (controllers/authController.js:240:25)
      at Object.<anonymous> (tests/email-comprehensive.test.js:263:13)

  console.error
    Forgot password error: TypeError: user.createPasswordResetToken is not a function
        at Object.createPasswordResetToken [as forgotPassword] (C:\Users\Dang\Documents\plant-system\controllers\authController.js:188:33)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:332:13)

    [0m [90m 228 |[39m
     [90m 229 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 230 |[39m         console[33m.[39merror([32m'Forgot password error:'[39m[33m,[39m error)[33m;[39m
     [90m     |[39m                 [31m[1m^[22m[39m
     [90m 231 |[39m         
     [90m 232 |[39m         [90m// Reset password reset fields if email failed[39m
     [90m 233 |[39m         [36mif[39m (req[33m.[39mbody[33m.[39memail) {[0m

      at Object.error [as forgotPassword] (controllers/authController.js:230:17)
      at Object.<anonymous> (tests/email-comprehensive.test.js:332:13)

  console.error
    Cleanup error: TypeError: user.updatePasswordResetFields is not a function
        at Object.updatePasswordResetFields [as forgotPassword] (C:\Users\Dang\Documents\plant-system\controllers\authController.js:237:32)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:332:13)

    [0m [90m 238 |[39m                 }
     [90m 239 |[39m             } [36mcatch[39m (cleanupError) {
    [31m[1m>[22m[39m[90m 240 |[39m                 console[33m.[39merror([32m'Cleanup error:'[39m[33m,[39m cleanupError)[33m;[39m
     [90m     |[39m                         [31m[1m^[22m[39m
     [90m 241 |[39m             }
     [90m 242 |[39m         }
     [90m 243 |[39m[0m

      at Object.error [as forgotPassword] (controllers/authController.js:240:25)
      at Object.<anonymous> (tests/email-comprehensive.test.js:332:13)

  console.error
    Forgot password error: TypeError: user.createPasswordResetToken is not a function
        at Object.createPasswordResetToken [as forgotPassword] (C:\Users\Dang\Documents\plant-system\controllers\authController.js:188:33)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:353:13)

    [0m [90m 228 |[39m
     [90m 229 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 230 |[39m         console[33m.[39merror([32m'Forgot password error:'[39m[33m,[39m error)[33m;[39m
     [90m     |[39m                 [31m[1m^[22m[39m
     [90m 231 |[39m         
     [90m 232 |[39m         [90m// Reset password reset fields if email failed[39m
     [90m 233 |[39m         [36mif[39m (req[33m.[39mbody[33m.[39memail) {[0m

      at Object.error [as forgotPassword] (controllers/authController.js:230:17)
      at Object.<anonymous> (tests/email-comprehensive.test.js:353:13)

  console.error
    Cleanup error: TypeError: user.updatePasswordResetFields is not a function
        at Object.updatePasswordResetFields [as forgotPassword] (C:\Users\Dang\Documents\plant-system\controllers\authController.js:237:32)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:353:13)

    [0m [90m 238 |[39m                 }
     [90m 239 |[39m             } [36mcatch[39m (cleanupError) {
    [31m[1m>[22m[39m[90m 240 |[39m                 console[33m.[39merror([32m'Cleanup error:'[39m[33m,[39m cleanupError)[33m;[39m
     [90m     |[39m                         [31m[1m^[22m[39m
     [90m 241 |[39m             }
     [90m 242 |[39m         }
     [90m 243 |[39m[0m

      at Object.error [as forgotPassword] (controllers/authController.js:240:25)
      at Object.<anonymous> (tests/email-comprehensive.test.js:353:13)


FAIL tests/email-comprehensive.test.js
  Email Service Tests
    Nodemailer Configuration
      × should create transporter with correct Gmail configuration (52 ms)
      √ should use environment variables for email configuration
    Password Reset Email
      × should send password reset email successfully (12 ms)
      × should not send email for non-existent user but return success for security (1 ms)
      × should handle email service failures gracefully (5 ms)
      × should include required security information in email (4 ms)
    Password Reset Confirmation Email
      × should send confirmation email after successful password reset (6 ms)
    Email Content Validation
      √ should generate correct reset URL format
      × should not expose sensitive information in emails (4 ms)
      × should use proper HTML email formatting (3 ms)
    Email Service Integration
      × should handle different email service providers (1 ms)
      × should default to gmail if no service specified
    Error Handling
      × should handle missing email in request (1 ms)
      × should handle invalid email format (3 ms)
      × should handle database connection errors (4 ms)

  ● Email Service Tests › Nodemailer Configuration › should create transporter with correct Gmail configuration

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: {"auth": {"pass": "daxcpvqzxuwrkdka", "user": "jamesdpkn.testing@gmail.com"}, "service": "gmail"}

    Number of calls: 0

    [0m [90m 64 |[39m     describe([32m'Nodemailer Configuration'[39m[33m,[39m () [33m=>[39m {
     [90m 65 |[39m         it([32m'should create transporter with correct Gmail configuration'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 66 |[39m             expect(mockCreateTransport)[33m.[39mtoHaveBeenCalledWith({
     [90m    |[39m                                         [31m[1m^[22m[39m
     [90m 67 |[39m                 service[33m:[39m [32m'gmail'[39m[33m,[39m
     [90m 68 |[39m                 auth[33m:[39m {
     [90m 69 |[39m                     user[33m:[39m [32m'jamesdpkn.testing@gmail.com'[39m[33m,[39m[0m

      at Object.toHaveBeenCalledWith (tests/email-comprehensive.test.js:66:41)

  ● Email Service Tests › Password Reset Email › should send password reset email successfully

    expect(jest.fn()).toHaveBeenCalledTimes(expected)

    Expected number of calls: 1
    Received number of calls: 0

    [0m [90m  98 |[39m
     [90m  99 |[39m             [90m// Verify email was sent[39m
    [31m[1m>[22m[39m[90m 100 |[39m             expect(mockSendMail)[33m.[39mtoHaveBeenCalledTimes([35m1[39m)[33m;[39m
     [90m     |[39m                                  [31m[1m^[22m[39m
     [90m 101 |[39m             
     [90m 102 |[39m             [36mconst[39m emailCall [33m=[39m mockSendMail[33m.[39mmock[33m.[39mcalls[[35m0[39m][[35m0[39m][33m;[39m
     [90m 103 |[39m             expect(emailCall[33m.[39m[36mfrom[39m)[33m.[39mtoBe([32m'jamesdpkn.testing@gmail.com'[39m)[33m;[39m[0m

      at Object.toHaveBeenCalledTimes (tests/email-comprehensive.test.js:100:34)

  ● Email Service Tests › Password Reset Email › should not send email for non-existent user but return success for security

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 200
    Received: 404

    Number of calls: 1

    [0m [90m 127 |[39m
     [90m 128 |[39m             [90m// Should still return success for security reasons[39m
    [31m[1m>[22m[39m[90m 129 |[39m             expect(mockResponse[33m.[39mstatus)[33m.[39mtoHaveBeenCalledWith([35m200[39m)[33m;[39m
     [90m     |[39m                                         [31m[1m^[22m[39m
     [90m 130 |[39m             expect(mockResponse[33m.[39mjson)[33m.[39mtoHaveBeenCalledWith({
     [90m 131 |[39m                 success[33m:[39m [36mtrue[39m[33m,[39m
     [90m 132 |[39m                 message[33m:[39m [32m'If the email exists, a reset link has been sent'[39m[0m

      at Object.toHaveBeenCalledWith (tests/email-comprehensive.test.js:129:41)

  ● Email Service Tests › Password Reset Email › should handle email service failures gracefully

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    - Expected
    + Received

      Object {
    -   "message": "Failed to send reset email. Please try again.",
    -   "success": false,
    +   "error": "Failed to send password reset email. Please try again later.",
      },

    Number of calls: 1

    [0m [90m 151 |[39m             [90m// Verify error response[39m
     [90m 152 |[39m             expect(mockResponse[33m.[39mstatus)[33m.[39mtoHaveBeenCalledWith([35m500[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 153 |[39m             expect(mockResponse[33m.[39mjson)[33m.[39mtoHaveBeenCalledWith({
     [90m     |[39m                                       [31m[1m^[22m[39m
     [90m 154 |[39m                 success[33m:[39m [36mfalse[39m[33m,[39m
     [90m 155 |[39m                 message[33m:[39m [32m'Failed to send reset email. Please try again.'[39m
     [90m 156 |[39m             })[33m;[39m[0m

      at Object.toHaveBeenCalledWith (tests/email-comprehensive.test.js:153:39)

  ● Email Service Tests › Password Reset Email › should include required security information in email

    TypeError: Cannot read properties of undefined (reading '0')

    [0m [90m 171 |[39m             [36mawait[39m authController[33m.[39mforgotPassword(mockRequest[33m,[39m mockResponse)[33m;[39m
     [90m 172 |[39m
    [31m[1m>[22m[39m[90m 173 |[39m             [36mconst[39m emailCall [33m=[39m mockSendMail[33m.[39mmock[33m.[39mcalls[[35m0[39m][[35m0[39m][33m;[39m
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 174 |[39m             
     [90m 175 |[39m             [90m// Check required security elements[39m
     [90m 176 |[39m             expect(emailCall[33m.[39mhtml)[33m.[39mtoContain([32m'This link will expire'[39m)[33m;[39m[0m

      at Object.<anonymous> (tests/email-comprehensive.test.js:173:57)

  ● Email Service Tests › Password Reset Confirmation Email › should send confirmation email after successful password reset

    expect(jest.fn()).toHaveBeenCalledTimes(expected)

    Expected number of calls: 1
    Received number of calls: 0

    [0m [90m 207 |[39m
     [90m 208 |[39m             [90m// Verify confirmation email was sent[39m
    [31m[1m>[22m[39m[90m 209 |[39m             expect(mockSendMail)[33m.[39mtoHaveBeenCalledTimes([35m1[39m)[33m;[39m
     [90m     |[39m                                  [31m[1m^[22m[39m
     [90m 210 |[39m             
     [90m 211 |[39m             [36mconst[39m emailCall [33m=[39m mockSendMail[33m.[39mmock[33m.[39mcalls[[35m0[39m][[35m0[39m][33m;[39m
     [90m 212 |[39m             expect(emailCall[33m.[39m[36mfrom[39m)[33m.[39mtoBe([32m'jamesdpkn.testing@gmail.com'[39m)[33m;[39m[0m

      at Object.toHaveBeenCalledTimes (tests/email-comprehensive.test.js:209:34)

  ● Email Service Tests › Email Content Validation › should not expose sensitive information in emails

    TypeError: Cannot read properties of undefined (reading '0')

    [0m [90m 240 |[39m             [36mawait[39m authController[33m.[39mforgotPassword(mockRequest[33m,[39m mockResponse)[33m;[39m
     [90m 241 |[39m
    [31m[1m>[22m[39m[90m 242 |[39m             [36mconst[39m emailCall [33m=[39m mockSendMail[33m.[39mmock[33m.[39mcalls[[35m0[39m][[35m0[39m][33m;[39m
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 243 |[39m             
     [90m 244 |[39m             [90m// Ensure sensitive data is not exposed[39m
     [90m 245 |[39m             expect(emailCall[33m.[39mhtml)[33m.[39mnot[33m.[39mtoContain(process[33m.[39menv[33m.[39m[33mJWT_SECRET[39m)[33m;[39m[0m

      at Object.<anonymous> (tests/email-comprehensive.test.js:242:57)

  ● Email Service Tests › Email Content Validation › should use proper HTML email formatting

    TypeError: Cannot read properties of undefined (reading '0')

    [0m [90m 263 |[39m             [36mawait[39m authController[33m.[39mforgotPassword(mockRequest[33m,[39m mockResponse)[33m;[39m
     [90m 264 |[39m
    [31m[1m>[22m[39m[90m 265 |[39m             [36mconst[39m emailCall [33m=[39m mockSendMail[33m.[39mmock[33m.[39mcalls[[35m0[39m][[35m0[39m][33m;[39m
     [90m     |[39m                                                         [31m[1m^[22m[39m
     [90m 266 |[39m             
     [90m 267 |[39m             [90m// Check HTML structure[39m
     [90m 268 |[39m             expect(emailCall[33m.[39mhtml)[33m.[39mtoContain([32m'<div'[39m)[33m;[39m[0m

      at Object.<anonymous> (tests/email-comprehensive.test.js:265:57)

  ● Email Service Tests › Email Service Integration › should handle different email service providers

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: {"auth": {"pass": "daxcpvqzxuwrkdka", "user": "jamesdpkn.testing@gmail.com"}, "service": "yahoo"}

    Number of calls: 0

    [0m [90m 282 |[39m             require([32m'../controllers/authController'[39m)[33m;[39m
     [90m 283 |[39m
    [31m[1m>[22m[39m[90m 284 |[39m             expect(mockCreateTransport)[33m.[39mtoHaveBeenCalledWith({
     [90m     |[39m                                         [31m[1m^[22m[39m
     [90m 285 |[39m                 service[33m:[39m [32m'yahoo'[39m[33m,[39m
     [90m 286 |[39m                 auth[33m:[39m {
     [90m 287 |[39m                     user[33m:[39m [32m'jamesdpkn.testing@gmail.com'[39m[33m,[39m[0m

      at Object.toHaveBeenCalledWith (tests/email-comprehensive.test.js:284:41)

  ● Email Service Tests › Email Service Integration › should default to gmail if no service specified

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: {"auth": {"pass": "daxcpvqzxuwrkdka", "user": "jamesdpkn.testing@gmail.com"}, "service": "gmail"}

    Number of calls: 0

    [0m [90m 301 |[39m             require([32m'../controllers/authController'[39m)[33m;[39m
     [90m 302 |[39m
    [31m[1m>[22m[39m[90m 303 |[39m             expect(mockCreateTransport)[33m.[39mtoHaveBeenCalledWith({
     [90m     |[39m                                         [31m[1m^[22m[39m
     [90m 304 |[39m                 service[33m:[39m [32m'gmail'[39m[33m,[39m
     [90m 305 |[39m                 auth[33m:[39m {
     [90m 306 |[39m                     user[33m:[39m [32m'jamesdpkn.testing@gmail.com'[39m[33m,[39m[0m

      at Object.toHaveBeenCalledWith (tests/email-comprehensive.test.js:303:41)

  ● Email Service Tests › Error Handling › should handle missing email in request

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    - Expected
    + Received

      Object {
    -   "message": "Email is required",
    -   "success": false,
    +   "error": "Email is required",
      },

    Number of calls: 1

    [0m [90m 321 |[39m
     [90m 322 |[39m             expect(mockResponse[33m.[39mstatus)[33m.[39mtoHaveBeenCalledWith([35m400[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 323 |[39m             expect(mockResponse[33m.[39mjson)[33m.[39mtoHaveBeenCalledWith({
     [90m     |[39m                                       [31m[1m^[22m[39m
     [90m 324 |[39m                 success[33m:[39m [36mfalse[39m[33m,[39m
     [90m 325 |[39m                 message[33m:[39m [32m'Email is required'[39m
     [90m 326 |[39m             })[33m;[39m[0m

      at Object.toHaveBeenCalledWith (tests/email-comprehensive.test.js:323:39)

  ● Email Service Tests › Error Handling › should handle invalid email format

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    Expected: 400
    Received: 500

    Number of calls: 1

    [0m [90m 332 |[39m             [36mawait[39m authController[33m.[39mforgotPassword(mockRequest[33m,[39m mockResponse)[33m;[39m
     [90m 333 |[39m
    [31m[1m>[22m[39m[90m 334 |[39m             expect(mockResponse[33m.[39mstatus)[33m.[39mtoHaveBeenCalledWith([35m400[39m)[33m;[39m
     [90m     |[39m                                         [31m[1m^[22m[39m
     [90m 335 |[39m             expect(mockResponse[33m.[39mjson)[33m.[39mtoHaveBeenCalledWith({
     [90m 336 |[39m                 success[33m:[39m [36mfalse[39m[33m,[39m
     [90m 337 |[39m                 message[33m:[39m [32m'Please provide a valid email address'[39m[0m

      at Object.toHaveBeenCalledWith (tests/email-comprehensive.test.js:334:41)

  ● Email Service Tests › Error Handling › should handle database connection errors

    expect(jest.fn()).toHaveBeenCalledWith(...expected)

    - Expected
    + Received

      Object {
    -   "message": "Internal server error",
    -   "success": false,
    +   "error": "Failed to send password reset email. Please try again later.",
      },

    Number of calls: 1

    [0m [90m 354 |[39m
     [90m 355 |[39m             expect(mockResponse[33m.[39mstatus)[33m.[39mtoHaveBeenCalledWith([35m500[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 356 |[39m             expect(mockResponse[33m.[39mjson)[33m.[39mtoHaveBeenCalledWith({
     [90m     |[39m                                       [31m[1m^[22m[39m
     [90m 357 |[39m                 success[33m:[39m [36mfalse[39m[33m,[39m
     [90m 358 |[39m                 message[33m:[39m [32m'Internal server error'[39m
     [90m 359 |[39m             })[33m;[39m[0m

      at Object.toHaveBeenCalledWith (tests/email-comprehensive.test.js:356:39)

Test Suites: 1 failed, 1 total
Tests:       13 failed, 2 passed, 15 total
Snapshots:   0 total
Time:        0.6 s
Ran all test suites matching C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js.

```

```

C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:7
const mockSendMail = jest.fn();
                     ^

ReferenceError: jest is not defined
    at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\email-comprehensive.test.js:7:22)
    at Module._compile (node:internal/modules/cjs/loader:1738:14)
    at Object..js (node:internal/modules/cjs/loader:1871:10)
    at Module.load (node:internal/modules/cjs/loader:1470:32)
    at Module._load (node:internal/modules/cjs/loader:1290:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:238:24)
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
    at node:internal/main/run_main_module:33:47

Node.js v24.5.0

```

### frontend-backend-mapping.test.js

❌ FAILED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }

      at _log (node_modules/dotenv/lib/main.js:139:11)

  console.log
    [dotenv@17.2.2] injecting env (0) from .env -- tip: ⚙️  enable debug logging with { debug: true }

      at _log (node_modules/dotenv/lib/main.js:139:11)


FAIL tests/frontend-backend-mapping.test.js
  ● Test suite failed to run

    Route.put() requires a callback function but got a [object Undefined]

    [0m [90m 32 |[39m [90m * @access  Private[39m
     [90m 33 |[39m [90m */[39m
    [31m[1m>[22m[39m[90m 34 |[39m router[33m.[39mput([32m'/:notificationId/read'[39m[33m,[39m authenticate[33m,[39m notificationController[33m.[39mmarkNotificationAsRead)[33m;[39m
     [90m    |[39m        [31m[1m^[22m[39m
     [90m 35 |[39m
     [90m 36 |[39m [90m/**[39m
     [90m 37 |[39m [90m * @route   PUT /api/notifications/read-all[39m[0m

      at Route.<computed> [as put] (node_modules/express/lib/router/route.js:202:15)
      at router.proto.<computed> [as put] (node_modules/express/lib/router/index.js:510:19)
      at Object.put (routes/notifications.js:34:8)
      at Object.require (app.js:172:27)
      at Object.require (tests/frontend-backend-mapping.test.js:15:13)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.785 s
Ran all test suites matching C:\Users\Dang\Documents\plant-system\tests\frontend-backend-mapping.test.js.

```

```
[dotenv@17.2.2] injecting env (13) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild

C:\Users\Dang\Documents\plant-system\node_modules\express\lib\router\route.js:202
        throw new Error(msg);
        ^

Error: Route.put() requires a callback function but got a [object Undefined]
    at Route.<computed> [as put] (C:\Users\Dang\Documents\plant-system\node_modules\express\lib\router\route.js:202:15)
    at proto.<computed> [as put] (C:\Users\Dang\Documents\plant-system\node_modules\express\lib\router\index.js:510:19)
    at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\routes\notifications.js:34:8)
    at Module._compile (node:internal/modules/cjs/loader:1738:14)
    at Object..js (node:internal/modules/cjs/loader:1871:10)
    at Module.load (node:internal/modules/cjs/loader:1470:32)
    at Module._load (node:internal/modules/cjs/loader:1290:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:238:24)
    at Module.require (node:internal/modules/cjs/loader:1493:12)

Node.js v24.5.0

```

### frontend-rendering-i18n.test.js

❌ FAILED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }

      at _log (node_modules/dotenv/lib/main.js:139:11)


FAIL tests/frontend-rendering-i18n.test.js
  ● Test suite failed to run

    Cannot find module '../src/auth/AuthContext' from 'tests/frontend-rendering-i18n.test.js'

    [0m [90m 14 |[39m
     [90m 15 |[39m [90m// Mock the authentication context and APIs[39m
    [31m[1m>[22m[39m[90m 16 |[39m jest[33m.[39mmock([32m'../src/auth/AuthContext'[39m[33m,[39m () [33m=>[39m {
     [90m    |[39m      [31m[1m^[22m[39m
     [90m 17 |[39m   [36mconst[39m mockAuthContext [33m=[39m {
     [90m 18 |[39m     user[33m:[39m { name[33m:[39m [32m'Test User'[39m[33m,[39m role[33m:[39m [32m'Premium'[39m }[33m,[39m
     [90m 19 |[39m     logout[33m:[39m jest[33m.[39mfn()[33m,[39m[0m

      at Resolver._throwModNotFoundError (node_modules/jest-resolve/build/index.js:863:11)
      at Object.mock (tests/frontend-rendering-i18n.test.js:16:6)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.505 s
Ran all test suites matching C:\Users\Dang\Documents\plant-system\tests\frontend-rendering-i18n.test.js.

```

```

file:///C:/Users/Dang/Documents/plant-system/tests/frontend-rendering-i18n.test.js:25
      <div data-testid="auth-provider">
      ^

SyntaxError: Unexpected token '<'
    at compileSourceTextModule (node:internal/modules/esm/utils:357:16)
    at ModuleLoader.moduleStrategy (node:internal/modules/esm/translators:108:18)
    at #translate (node:internal/modules/esm/loader:550:12)
    at ModuleLoader.loadAndTranslate (node:internal/modules/esm/loader:597:27)
    at async #link (node:internal/modules/esm/module_job:180:19)

Node.js v24.5.0

```

### language-api.test.js

❌ FAILED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild

      at _log (node_modules/dotenv/lib/main.js:139:11)

  console.log
    [dotenv@17.2.2] injecting env (0) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild

      at _log (node_modules/dotenv/lib/main.js:139:11)


FAIL tests/language-api.test.js
  ● Test suite failed to run

    Route.put() requires a callback function but got a [object Undefined]

    [0m [90m 32 |[39m [90m * @access  Private[39m
     [90m 33 |[39m [90m */[39m
    [31m[1m>[22m[39m[90m 34 |[39m router[33m.[39mput([32m'/:notificationId/read'[39m[33m,[39m authenticate[33m,[39m notificationController[33m.[39mmarkNotificationAsRead)[33m;[39m
     [90m    |[39m        [31m[1m^[22m[39m
     [90m 35 |[39m
     [90m 36 |[39m [90m/**[39m
     [90m 37 |[39m [90m * @route   PUT /api/notifications/read-all[39m[0m

      at Route.<computed> [as put] (node_modules/express/lib/router/route.js:202:15)
      at router.proto.<computed> [as put] (node_modules/express/lib/router/index.js:510:19)
      at Object.put (routes/notifications.js:34:8)
      at Object.require (app.js:172:27)
      at Object.require (tests/language-api.test.js:7:13)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.827 s
Ran all test suites matching C:\Users\Dang\Documents\plant-system\tests\language-api.test.js.

```

```
[dotenv@17.2.2] injecting env (13) from .env -- tip: ⚙️  enable debug logging with { debug: true }

C:\Users\Dang\Documents\plant-system\node_modules\express\lib\router\route.js:202
        throw new Error(msg);
        ^

Error: Route.put() requires a callback function but got a [object Undefined]
    at Route.<computed> [as put] (C:\Users\Dang\Documents\plant-system\node_modules\express\lib\router\route.js:202:15)
    at proto.<computed> [as put] (C:\Users\Dang\Documents\plant-system\node_modules\express\lib\router\index.js:510:19)
    at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\routes\notifications.js:34:8)
    at Module._compile (node:internal/modules/cjs/loader:1738:14)
    at Object..js (node:internal/modules/cjs/loader:1871:10)
    at Module.load (node:internal/modules/cjs/loader:1470:32)
    at Module._load (node:internal/modules/cjs/loader:1290:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:238:24)
    at Module.require (node:internal/modules/cjs/loader:1493:12)

Node.js v24.5.0

```

### profile-premium.test.js

❌ FAILED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit

      at _log (node_modules/dotenv/lib/main.js:139:11)

  console.error
    Get user profile error: Error: Database error
        at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\profile-premium.test.js:101:51)
        at Promise.finally.completed (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:1557:28)
        at new Promise (<anonymous>)
        at callAsyncCircusFn (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:1497:10)
        at _callCircusTest (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:1007:40)
        at processTicksAndRejections (node:internal/process/task_queues:105:5)
        at _runTest (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:947:3)
        at C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:849:7
        at _runTestsForDescribeBlock (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:862:11)
        at _runTestsForDescribeBlock (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:857:11)
        at _runTestsForDescribeBlock (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:857:11)
        at run (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:761:3)
        at runAndTransformResultsToJestFormat (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\jestAdapterInit.js:1918:21)
        at jestAdapter (C:\Users\Dang\Documents\plant-system\node_modules\jest-circus\build\runner.js:101:19)
        at runTestInternal (C:\Users\Dang\Documents\plant-system\node_modules\jest-runner\build\index.js:275:16)
        at runTest (C:\Users\Dang\Documents\plant-system\node_modules\jest-runner\build\index.js:343:7)

    [0m [90m 49 |[39m
     [90m 50 |[39m     } [36mcatch[39m (error) {
    [31m[1m>[22m[39m[90m 51 |[39m         console[33m.[39merror([32m'Get user profile error:'[39m[33m,[39m error)[33m;[39m
     [90m    |[39m                 [31m[1m^[22m[39m
     [90m 52 |[39m         res[33m.[39mstatus([35m500[39m)[33m.[39mjson({ 
     [90m 53 |[39m             success[33m:[39m [36mfalse[39m[33m,[39m
     [90m 54 |[39m             error[33m:[39m [32m'Failed to retrieve user profile'[39m [0m

      at error (controllers/userController.js:51:17)


FAIL tests/profile-premium.test.js
  Profile Management
    GET /users/profile
      × should get user profile successfully (39 ms)
      √ should return 404 if user not found (5 ms)
      √ should handle server errors (9 ms)
    PUT /users/profile
      √ should update user profile successfully (11 ms)
      √ should update notification preferences (3 ms)
      √ should handle user not found (3 ms)
    PUT /users/change-password
      √ should change password successfully (3 ms)
      √ should reject if current password is incorrect (4 ms)
      √ should validate password requirements (3 ms)
      √ should reject if passwords don't match (3 ms)
  Premium Upgrade
    POST /users/upgrade-to-premium
      √ should upgrade user to premium successfully (2 ms)
      √ should reject if payment not found (3 ms)
      √ should reject if payment belongs to another user (2 ms)
      √ should reject if payment is not completed (3 ms)
      √ should reject if user is already premium (4 ms)
    GET /users/premium-status
      √ should return regular status for non-premium users (3 ms)
      √ should return premium status and features for premium users (3 ms)
      √ should handle user not found (4 ms)

  ● Profile Management › GET /users/profile › should get user profile successfully

    expect(received).toEqual(expected) // deep equality

    - Expected  - 3
    + Received  + 0

    @@ -5,10 +5,7 @@
        "notification_prefs": Object {
          "email": true,
          "push": false,
        },
        "role": "Regular",
    -   "toJSON": [Function toJSON],
    -   "update": [Function mockConstructor],
    -   "updatePassword": [Function mockConstructor],
        "user_id": 1,
      }

    [0m [90m 84 |[39m       expect(response[33m.[39mstatus)[33m.[39mtoBe([35m200[39m)[33m;[39m
     [90m 85 |[39m       expect(response[33m.[39mbody[33m.[39msuccess)[33m.[39mtoBe([36mtrue[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 86 |[39m       expect(response[33m.[39mbody[33m.[39mdata)[33m.[39mtoEqual(mockUser[33m.[39mtoJSON())[33m;[39m
     [90m    |[39m                                  [31m[1m^[22m[39m
     [90m 87 |[39m       expect([33mUser[39m[33m.[39mfindById)[33m.[39mtoHaveBeenCalledWith(mockUser[33m.[39muser_id)[33m;[39m
     [90m 88 |[39m     })[33m;[39m
     [90m 89 |[39m     [0m

      at Object.toEqual (tests/profile-premium.test.js:86:34)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 17 passed, 18 total
Snapshots:   0 total
Time:        0.834 s
Ran all test suites matching C:\Users\Dang\Documents\plant-system\tests\profile-premium.test.js.

```

```

C:\Users\Dang\Documents\plant-system\tests\profile-premium.test.js:18
jest.mock('../models/User');
^

ReferenceError: jest is not defined
    at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\profile-premium.test.js:18:1)
    at Module._compile (node:internal/modules/cjs/loader:1738:14)
    at Object..js (node:internal/modules/cjs/loader:1871:10)
    at Module.load (node:internal/modules/cjs/loader:1470:32)
    at Module._load (node:internal/modules/cjs/loader:1290:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:238:24)
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
    at node:internal/main/run_main_module:33:47

Node.js v24.5.0

```

### user.test.js

❌ FAILED

```
  console.log
    [dotenv@17.2.2] injecting env (12) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit

      at _log (node_modules/dotenv/lib/main.js:139:11)


FAIL tests/user.test.js
  User Model Tests
    User.findByEmail
      × should find user by email (1 ms)
      × should return null for non-existent user
      × should handle database errors (1 ms)
    User.findById
      × should find user by ID
      × should return null for non-existent ID (1 ms)
    User.findByResetToken
      × should find user by valid reset token
      × should return null for expired token
    User instance methods
      validatePassword
        × should validate correct password
        × should reject incorrect password
      createPasswordResetToken
        × should create and return reset token (1 ms)
        × should set expiration to 1 hour from now
      updatePasswordResetFields
        × should update password reset fields in database
        × should clear reset fields when called with null
      updatePassword
        × should update password and clear reset fields
      toJSON
        × should exclude sensitive fields
    Password hashing
      × should hash passwords with bcrypt (2 ms)
      × should return existing password if no new password provided
    Email handling
      × should convert email to lowercase (1 ms)
    Role validation
      × should handle different user roles
      × should default to Regular role

  ● User Model Tests › User.findByEmail › should find user by email

    TypeError: pool.query.mockResolvedValue is not a function

    [0m [90m 32 |[39m     describe([32m'User.findByEmail'[39m[33m,[39m () [33m=>[39m {
     [90m 33 |[39m         it([32m'should find user by email'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 34 |[39m             pool[33m.[39mquery[33m.[39mmockResolvedValue({ rows[33m:[39m [dummyUser] })[33m;[39m
     [90m    |[39m                        [31m[1m^[22m[39m
     [90m 35 |[39m
     [90m 36 |[39m             [36mconst[39m user [33m=[39m [36mawait[39m [33mUser[39m[33m.[39mfindByEmail([32m'test@example.com'[39m)[33m;[39m
     [90m 37 |[39m[0m

      at Object.mockResolvedValue (tests/user.test.js:34:24)

  ● User Model Tests › User.findByEmail › should return null for non-existent user

    TypeError: pool.query.mockResolvedValue is not a function

    [0m [90m 46 |[39m
     [90m 47 |[39m         it([32m'should return null for non-existent user'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 48 |[39m             pool[33m.[39mquery[33m.[39mmockResolvedValue({ rows[33m:[39m [] })[33m;[39m
     [90m    |[39m                        [31m[1m^[22m[39m
     [90m 49 |[39m
     [90m 50 |[39m             [36mconst[39m user [33m=[39m [36mawait[39m [33mUser[39m[33m.[39mfindByEmail([32m'nonexistent@example.com'[39m)[33m;[39m
     [90m 51 |[39m[0m

      at Object.mockResolvedValue (tests/user.test.js:48:24)

  ● User Model Tests › User.findByEmail › should handle database errors

    TypeError: pool.query.mockRejectedValue is not a function

    [0m [90m 54 |[39m
     [90m 55 |[39m         it([32m'should handle database errors'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 56 |[39m             pool[33m.[39mquery[33m.[39mmockRejectedValue([36mnew[39m [33mError[39m([32m'Database connection failed'[39m))[33m;[39m
     [90m    |[39m                        [31m[1m^[22m[39m
     [90m 57 |[39m
     [90m 58 |[39m             [36mawait[39m expect([33mUser[39m[33m.[39mfindByEmail([32m'test@example.com'[39m))
     [90m 59 |[39m                 [33m.[39mrejects[33m.[39mtoThrow([32m'Database connection failed'[39m)[33m;[39m[0m

      at Object.mockRejectedValue (tests/user.test.js:56:24)

  ● User Model Tests › User.findById › should find user by ID

    TypeError: pool.query.mockResolvedValue is not a function

    [0m [90m 63 |[39m     describe([32m'User.findById'[39m[33m,[39m () [33m=>[39m {
     [90m 64 |[39m         it([32m'should find user by ID'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 65 |[39m             pool[33m.[39mquery[33m.[39mmockResolvedValue({ rows[33m:[39m [dummyUser] })[33m;[39m
     [90m    |[39m                        [31m[1m^[22m[39m
     [90m 66 |[39m
     [90m 67 |[39m             [36mconst[39m user [33m=[39m [36mawait[39m [33mUser[39m[33m.[39mfindById([35m1[39m)[33m;[39m
     [90m 68 |[39m[0m

      at Object.mockResolvedValue (tests/user.test.js:65:24)

  ● User Model Tests › User.findById › should return null for non-existent ID

    TypeError: pool.query.mockResolvedValue is not a function

    [0m [90m 76 |[39m
     [90m 77 |[39m         it([32m'should return null for non-existent ID'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 78 |[39m             pool[33m.[39mquery[33m.[39mmockResolvedValue({ rows[33m:[39m [] })[33m;[39m
     [90m    |[39m                        [31m[1m^[22m[39m
     [90m 79 |[39m
     [90m 80 |[39m             [36mconst[39m user [33m=[39m [36mawait[39m [33mUser[39m[33m.[39mfindById([35m999[39m)[33m;[39m
     [90m 81 |[39m[0m

      at Object.mockResolvedValue (tests/user.test.js:78:24)

  ● User Model Tests › User.findByResetToken › should find user by valid reset token

    TypeError: pool.query.mockResolvedValue is not a function

    [0m [90m 92 |[39m             }[33m;[39m
     [90m 93 |[39m
    [31m[1m>[22m[39m[90m 94 |[39m             pool[33m.[39mquery[33m.[39mmockResolvedValue({ rows[33m:[39m [userWithToken] })[33m;[39m
     [90m    |[39m                        [31m[1m^[22m[39m
     [90m 95 |[39m
     [90m 96 |[39m             [36mconst[39m user [33m=[39m [36mawait[39m [33mUser[39m[33m.[39mfindByResetToken([32m'valid-token-123'[39m)[33m;[39m
     [90m 97 |[39m[0m

      at Object.mockResolvedValue (tests/user.test.js:94:24)

  ● User Model Tests › User.findByResetToken › should return null for expired token

    TypeError: pool.query.mockResolvedValue is not a function

    [0m [90m 105 |[39m
     [90m 106 |[39m         it([32m'should return null for expired token'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 107 |[39m             pool[33m.[39mquery[33m.[39mmockResolvedValue({ rows[33m:[39m [] })[33m;[39m
     [90m     |[39m                        [31m[1m^[22m[39m
     [90m 108 |[39m
     [90m 109 |[39m             [36mconst[39m user [33m=[39m [36mawait[39m [33mUser[39m[33m.[39mfindByResetToken([32m'expired-token'[39m)[33m;[39m
     [90m 110 |[39m[0m

      at Object.mockResolvedValue (tests/user.test.js:107:24)

  ● User Model Tests › User instance methods › validatePassword › should validate correct password

    TypeError: User is not a constructor

    [0m [90m 117 |[39m
     [90m 118 |[39m         beforeEach(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 119 |[39m             user [33m=[39m [36mnew[39m [33mUser[39m(dummyUser)[33m;[39m
     [90m     |[39m                    [31m[1m^[22m[39m
     [90m 120 |[39m         })[33m;[39m
     [90m 121 |[39m
     [90m 122 |[39m         describe([32m'validatePassword'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.<anonymous> (tests/user.test.js:119:20)

  ● User Model Tests › User instance methods › validatePassword › should reject incorrect password

    TypeError: User is not a constructor

    [0m [90m 117 |[39m
     [90m 118 |[39m         beforeEach(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 119 |[39m             user [33m=[39m [36mnew[39m [33mUser[39m(dummyUser)[33m;[39m
     [90m     |[39m                    [31m[1m^[22m[39m
     [90m 120 |[39m         })[33m;[39m
     [90m 121 |[39m
     [90m 122 |[39m         describe([32m'validatePassword'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.<anonymous> (tests/user.test.js:119:20)

  ● User Model Tests › User instance methods › createPasswordResetToken › should create and return reset token

    TypeError: User is not a constructor

    [0m [90m 117 |[39m
     [90m 118 |[39m         beforeEach(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 119 |[39m             user [33m=[39m [36mnew[39m [33mUser[39m(dummyUser)[33m;[39m
     [90m     |[39m                    [31m[1m^[22m[39m
     [90m 120 |[39m         })[33m;[39m
     [90m 121 |[39m
     [90m 122 |[39m         describe([32m'validatePassword'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.<anonymous> (tests/user.test.js:119:20)

  ● User Model Tests › User instance methods › createPasswordResetToken › should set expiration to 1 hour from now

    TypeError: User is not a constructor

    [0m [90m 117 |[39m
     [90m 118 |[39m         beforeEach(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 119 |[39m             user [33m=[39m [36mnew[39m [33mUser[39m(dummyUser)[33m;[39m
     [90m     |[39m                    [31m[1m^[22m[39m
     [90m 120 |[39m         })[33m;[39m
     [90m 121 |[39m
     [90m 122 |[39m         describe([32m'validatePassword'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.<anonymous> (tests/user.test.js:119:20)

  ● User Model Tests › User instance methods › updatePasswordResetFields › should update password reset fields in database

    TypeError: User is not a constructor

    [0m [90m 117 |[39m
     [90m 118 |[39m         beforeEach(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 119 |[39m             user [33m=[39m [36mnew[39m [33mUser[39m(dummyUser)[33m;[39m
     [90m     |[39m                    [31m[1m^[22m[39m
     [90m 120 |[39m         })[33m;[39m
     [90m 121 |[39m
     [90m 122 |[39m         describe([32m'validatePassword'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.<anonymous> (tests/user.test.js:119:20)

  ● User Model Tests › User instance methods › updatePasswordResetFields › should clear reset fields when called with null

    TypeError: User is not a constructor

    [0m [90m 117 |[39m
     [90m 118 |[39m         beforeEach(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 119 |[39m             user [33m=[39m [36mnew[39m [33mUser[39m(dummyUser)[33m;[39m
     [90m     |[39m                    [31m[1m^[22m[39m
     [90m 120 |[39m         })[33m;[39m
     [90m 121 |[39m
     [90m 122 |[39m         describe([32m'validatePassword'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.<anonymous> (tests/user.test.js:119:20)

  ● User Model Tests › User instance methods › updatePassword › should update password and clear reset fields

    TypeError: User is not a constructor

    [0m [90m 117 |[39m
     [90m 118 |[39m         beforeEach(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 119 |[39m             user [33m=[39m [36mnew[39m [33mUser[39m(dummyUser)[33m;[39m
     [90m     |[39m                    [31m[1m^[22m[39m
     [90m 120 |[39m         })[33m;[39m
     [90m 121 |[39m
     [90m 122 |[39m         describe([32m'validatePassword'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.<anonymous> (tests/user.test.js:119:20)

  ● User Model Tests › User instance methods › toJSON › should exclude sensitive fields

    TypeError: User is not a constructor

    [0m [90m 117 |[39m
     [90m 118 |[39m         beforeEach(() [33m=>[39m {
    [31m[1m>[22m[39m[90m 119 |[39m             user [33m=[39m [36mnew[39m [33mUser[39m(dummyUser)[33m;[39m
     [90m     |[39m                    [31m[1m^[22m[39m
     [90m 120 |[39m         })[33m;[39m
     [90m 121 |[39m
     [90m 122 |[39m         describe([32m'validatePassword'[39m[33m,[39m () [33m=>[39m {[0m

      at Object.<anonymous> (tests/user.test.js:119:20)

  ● User Model Tests › Password hashing › should hash passwords with bcrypt

    TypeError: User is not a constructor

    [0m [90m 253 |[39m             jest[33m.[39mspyOn(bcrypt[33m,[39m [32m'hash'[39m)[33m.[39mmockResolvedValue([32m'$2b$12$mockHashedPassword'[39m)[33m;[39m
     [90m 254 |[39m             
    [31m[1m>[22m[39m[90m 255 |[39m             [36mconst[39m user [33m=[39m [36mnew[39m [33mUser[39m({ [33m...[39mdummyUser[33m,[39m password[33m:[39m [32m'plaintext123'[39m })[33m;[39m
     [90m     |[39m                          [31m[1m^[22m[39m
     [90m 256 |[39m             
     [90m 257 |[39m             [36mconst[39m hashedPassword [33m=[39m [36mawait[39m user[33m.[39mhashPassword([32m'plaintext123'[39m)[33m;[39m
     [90m 258 |[39m             [0m

      at Object.<anonymous> (tests/user.test.js:255:26)

  ● User Model Tests › Password hashing › should return existing password if no new password provided

    TypeError: User is not a constructor

    [0m [90m 266 |[39m
     [90m 267 |[39m         it([32m'should return existing password if no new password provided'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 268 |[39m             [36mconst[39m user [33m=[39m [36mnew[39m [33mUser[39m(dummyUser)[33m;[39m
     [90m     |[39m                          [31m[1m^[22m[39m
     [90m 269 |[39m             
     [90m 270 |[39m             [36mconst[39m result [33m=[39m [36mawait[39m user[33m.[39mhashPassword()[33m;[39m
     [90m 271 |[39m             [0m

      at Object.<anonymous> (tests/user.test.js:268:26)

  ● User Model Tests › Email handling › should convert email to lowercase

    TypeError: pool.query.mockResolvedValue is not a function

    [0m [90m 276 |[39m     describe([32m'Email handling'[39m[33m,[39m () [33m=>[39m {
     [90m 277 |[39m         it([32m'should convert email to lowercase'[39m[33m,[39m [36masync[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 278 |[39m             pool[33m.[39mquery[33m.[39mmockResolvedValue({ rows[33m:[39m [dummyUser] })[33m;[39m
     [90m     |[39m                        [31m[1m^[22m[39m
     [90m 279 |[39m
     [90m 280 |[39m             [36mawait[39m [33mUser[39m[33m.[39mfindByEmail([32m'TEST@EXAMPLE.COM'[39m)[33m;[39m
     [90m 281 |[39m[0m

      at Object.mockResolvedValue (tests/user.test.js:278:24)

  ● User Model Tests › Role validation › should handle different user roles

    TypeError: User is not a constructor

    [0m [90m 289 |[39m     describe([32m'Role validation'[39m[33m,[39m () [33m=>[39m {
     [90m 290 |[39m         it([32m'should handle different user roles'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 291 |[39m             [36mconst[39m regularUser [33m=[39m [36mnew[39m [33mUser[39m({ [33m...[39mdummyUser[33m,[39m role[33m:[39m [32m'Regular'[39m })[33m;[39m
     [90m     |[39m                                 [31m[1m^[22m[39m
     [90m 292 |[39m             [36mconst[39m premiumUser [33m=[39m [36mnew[39m [33mUser[39m({ [33m...[39mdummyUser[33m,[39m role[33m:[39m [32m'Premium'[39m })[33m;[39m
     [90m 293 |[39m             [36mconst[39m adminUser [33m=[39m [36mnew[39m [33mUser[39m({ [33m...[39mdummyUser[33m,[39m role[33m:[39m [32m'Admin'[39m })[33m;[39m
     [90m 294 |[39m[0m

      at Object.<anonymous> (tests/user.test.js:291:33)

  ● User Model Tests › Role validation › should default to Regular role

    TypeError: User is not a constructor

    [0m [90m 302 |[39m             [36mdelete[39m userData[33m.[39mrole[33m;[39m
     [90m 303 |[39m             
    [31m[1m>[22m[39m[90m 304 |[39m             [36mconst[39m user [33m=[39m [36mnew[39m [33mUser[39m(userData)[33m;[39m
     [90m     |[39m                          [31m[1m^[22m[39m
     [90m 305 |[39m             
     [90m 306 |[39m             expect(user[33m.[39mrole)[33m.[39mtoBe([32m'Regular'[39m)[33m;[39m
     [90m 307 |[39m         })[33m;[39m[0m

      at Object.<anonymous> (tests/user.test.js:304:26)

Test Suites: 1 failed, 1 total
Tests:       20 failed, 20 total
Snapshots:   0 total
Time:        0.533 s
Ran all test suites matching C:\Users\Dang\Documents\plant-system\tests\user.test.js.

```

```

C:\Users\Dang\Documents\plant-system\tests\user.test.js:4
jest.mock('../config/postgresql', () => ({
^

ReferenceError: jest is not defined
    at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\tests\user.test.js:4:1)
    at Module._compile (node:internal/modules/cjs/loader:1738:14)
    at Object..js (node:internal/modules/cjs/loader:1871:10)
    at Module.load (node:internal/modules/cjs/loader:1470:32)
    at Module._load (node:internal/modules/cjs/loader:1290:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:238:24)
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
    at node:internal/main/run_main_module:33:47

Node.js v24.5.0

```

## Frontend Tests

❌ FAILED

```

> client@0.1.0 test
> react-scripts test --watchAll=false


PASS src/tests/api-mapping.test.js
PASS src/tests/api-route-mapping.test.js
PASS src/tests/components.test.js
  ● Console

    console.error
      Warning: `ReactDOMTestUtils.act` is deprecated in favor of `React.act`. Import `act` from `react` instead of `react-dom/test-utils`. See https://react.dev/warnings/react-dom-test-utils for more info.

    [0m [90m 14 |[39m describe([32m'Navbar Component Test'[39m[33m,[39m () [33m=>[39m {
     [90m 15 |[39m   test([32m'Navbar component renders'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 16 |[39m     render(
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 17 |[39m       [33m<[39m[33mBrowserRouter[39m[33m>[39m
     [90m 18 |[39m         [33m<[39m[33mNavbar[39m [33m/[39m[33m>[39m
     [90m 19 |[39m       [33m<[39m[33m/[39m[33mBrowserRouter[39m[33m>[39m[0m

      at printWarning (node_modules/react-dom/cjs/react-dom-test-utils.development.js:71:30)
      at error (node_modules/react-dom/cjs/react-dom-test-utils.development.js:45:7)
      at actWithWarning (node_modules/react-dom/cjs/react-dom-test-utils.development.js:1736:7)
      at node_modules/@testing-library/react/dist/act-compat.js:63:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:159:26)
      at render (node_modules/@testing-library/react/dist/pure.js:246:10)
      at Object.<anonymous> (src/tests/components.test.js:16:11)

    console.warn
      ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.

    [0m [90m 14 |[39m describe([32m'Navbar Component Test'[39m[33m,[39m () [33m=>[39m {
     [90m 15 |[39m   test([32m'Navbar component renders'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 16 |[39m     render(
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 17 |[39m       [33m<[39m[33mBrowserRouter[39m[33m>[39m
     [90m 18 |[39m         [33m<[39m[33mNavbar[39m [33m/[39m[33m>[39m
     [90m 19 |[39m       [33m<[39m[33m/[39m[33mBrowserRouter[39m[33m>[39m[0m

      at warnOnce (node_modules/react-router/lib/deprecations.ts:9:13)
      at logDeprecation (node_modules/react-router/lib/deprecations.ts:14:3)
      at Object.logV6DeprecationWarnings [as UNSAFE_logV6DeprecationWarnings] (node_modules/react-router/lib/deprecations.ts:26:5)
      at node_modules/react-router-dom/index.tsx:816:25
      at commitHookEffectListMount (node_modules/react-dom/cjs/react-dom.development.js:23189:26)
      at commitPassiveMountOnFiber (node_modules/react-dom/cjs/react-dom.development.js:24970:11)
      at commitPassiveMountEffects_complete (node_modules/react-dom/cjs/react-dom.development.js:24930:9)
      at commitPassiveMountEffects_begin (node_modules/react-dom/cjs/react-dom.development.js:24917:7)
      at commitPassiveMountEffects (node_modules/react-dom/cjs/react-dom.development.js:24905:3)
      at flushPassiveEffectsImpl (node_modules/react-dom/cjs/react-dom.development.js:27078:3)
      at flushPassiveEffects (node_modules/react-dom/cjs/react-dom.development.js:27023:14)
      at node_modules/react-dom/cjs/react-dom.development.js:26808:9
      at flushActQueue (node_modules/react/cjs/react.development.js:2667:24)
      at act (node_modules/react/cjs/react.development.js:2582:11)
      at actWithWarning (node_modules/react-dom/cjs/react-dom-test-utils.development.js:1740:10)
      at node_modules/@testing-library/react/dist/act-compat.js:63:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:159:26)
      at render (node_modules/@testing-library/react/dist/pure.js:246:10)
      at Object.<anonymous> (src/tests/components.test.js:16:11)

    console.warn
      ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

    [0m [90m 14 |[39m describe([32m'Navbar Component Test'[39m[33m,[39m () [33m=>[39m {
     [90m 15 |[39m   test([32m'Navbar component renders'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 16 |[39m     render(
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 17 |[39m       [33m<[39m[33mBrowserRouter[39m[33m>[39m
     [90m 18 |[39m         [33m<[39m[33mNavbar[39m [33m/[39m[33m>[39m
     [90m 19 |[39m       [33m<[39m[33m/[39m[33mBrowserRouter[39m[33m>[39m[0m

      at warnOnce (node_modules/react-router/lib/deprecations.ts:9:13)
      at logDeprecation (node_modules/react-router/lib/deprecations.ts:14:3)
      at Object.logV6DeprecationWarnings [as UNSAFE_logV6DeprecationWarnings] (node_modules/react-router/lib/deprecations.ts:37:5)
      at node_modules/react-router-dom/index.tsx:816:25
      at commitHookEffectListMount (node_modules/react-dom/cjs/react-dom.development.js:23189:26)
      at commitPassiveMountOnFiber (node_modules/react-dom/cjs/react-dom.development.js:24970:11)
      at commitPassiveMountEffects_complete (node_modules/react-dom/cjs/react-dom.development.js:24930:9)
      at commitPassiveMountEffects_begin (node_modules/react-dom/cjs/react-dom.development.js:24917:7)
      at commitPassiveMountEffects (node_modules/react-dom/cjs/react-dom.development.js:24905:3)
      at flushPassiveEffectsImpl (node_modules/react-dom/cjs/react-dom.development.js:27078:3)
      at flushPassiveEffects (node_modules/react-dom/cjs/react-dom.development.js:27023:14)
      at node_modules/react-dom/cjs/react-dom.development.js:26808:9
      at flushActQueue (node_modules/react/cjs/react.development.js:2667:24)
      at act (node_modules/react/cjs/react.development.js:2582:11)
      at actWithWarning (node_modules/react-dom/cjs/react-dom-test-utils.development.js:1740:10)
      at node_modules/@testing-library/react/dist/act-compat.js:63:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:159:26)
      at render (node_modules/@testing-library/react/dist/pure.js:246:10)
      at Object.<anonymous> (src/tests/components.test.js:16:11)

FAIL src/tests/frontend-backend-integration.test.js
  ● Console

    console.error
      Warning: `ReactDOMTestUtils.act` is deprecated in favor of `React.act`. Import `act` from `react` instead of `react-dom/test-utils`. See https://react.dev/warnings/react-dom-test-utils for more info.

    [0m [90m 26 |[39m [90m// Helper function to render components with necessary providers[39m
     [90m 27 |[39m [36mconst[39m renderWithProviders [33m=[39m (component) [33m=>[39m {
    [31m[1m>[22m[39m[90m 28 |[39m   [36mreturn[39m render(
     [90m    |[39m                [31m[1m^[22m[39m
     [90m 29 |[39m     [33m<[39m[33mBrowserRouter[39m[33m>[39m
     [90m 30 |[39m       [33m<[39m[33mAuthProvider[39m[33m>[39m
     [90m 31 |[39m         {component}[0m

      at printWarning (node_modules/react-dom/cjs/react-dom-test-utils.development.js:71:30)
      at error (node_modules/react-dom/cjs/react-dom-test-utils.development.js:45:7)
      at actWithWarning (node_modules/react-dom/cjs/react-dom-test-utils.development.js:1736:7)
      at node_modules/@testing-library/react/dist/act-compat.js:63:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:159:26)
      at render (node_modules/@testing-library/react/dist/pure.js:246:10)
      at renderWithProviders (src/tests/frontend-backend-integration.test.js:28:16)
      at Object.<anonymous> (src/tests/frontend-backend-integration.test.js:54:7)

    console.log
      Auth initialization - Token exists: false User exists: false

      at src/auth/AuthContext.js:19:13

    console.warn
      ⚠️ React Router Future Flag Warning: React Router will begin wrapping state updates in `React.startTransition` in v7. You can use the `v7_startTransition` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_starttransition.

    [0m [90m 26 |[39m [90m// Helper function to render components with necessary providers[39m
     [90m 27 |[39m [36mconst[39m renderWithProviders [33m=[39m (component) [33m=>[39m {
    [31m[1m>[22m[39m[90m 28 |[39m   [36mreturn[39m render(
     [90m    |[39m                [31m[1m^[22m[39m
     [90m 29 |[39m     [33m<[39m[33mBrowserRouter[39m[33m>[39m
     [90m 30 |[39m       [33m<[39m[33mAuthProvider[39m[33m>[39m
     [90m 31 |[39m         {component}[0m

      at warnOnce (node_modules/react-router/lib/deprecations.ts:9:13)
      at logDeprecation (node_modules/react-router/lib/deprecations.ts:14:3)
      at Object.logV6DeprecationWarnings [as UNSAFE_logV6DeprecationWarnings] (node_modules/react-router/lib/deprecations.ts:26:5)
      at node_modules/react-router-dom/index.tsx:816:25
      at commitHookEffectListMount (node_modules/react-dom/cjs/react-dom.development.js:23189:26)
      at commitPassiveMountOnFiber (node_modules/react-dom/cjs/react-dom.development.js:24970:11)
      at commitPassiveMountEffects_complete (node_modules/react-dom/cjs/react-dom.development.js:24930:9)
      at commitPassiveMountEffects_begin (node_modules/react-dom/cjs/react-dom.development.js:24917:7)
      at commitPassiveMountEffects (node_modules/react-dom/cjs/react-dom.development.js:24905:3)
      at flushPassiveEffectsImpl (node_modules/react-dom/cjs/react-dom.development.js:27078:3)
      at flushPassiveEffects (node_modules/react-dom/cjs/react-dom.development.js:27023:14)
      at node_modules/react-dom/cjs/react-dom.development.js:26808:9
      at flushActQueue (node_modules/react/cjs/react.development.js:2667:24)
      at act (node_modules/react/cjs/react.development.js:2582:11)
      at actWithWarning (node_modules/react-dom/cjs/react-dom-test-utils.development.js:1740:10)
      at node_modules/@testing-library/react/dist/act-compat.js:63:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:159:26)
      at render (node_modules/@testing-library/react/dist/pure.js:246:10)
      at renderWithProviders (src/tests/frontend-backend-integration.test.js:28:16)
      at Object.<anonymous> (src/tests/frontend-backend-integration.test.js:54:7)

    console.warn
      ⚠️ React Router Future Flag Warning: Relative route resolution within Splat routes is changing in v7. You can use the `v7_relativeSplatPath` future flag to opt-in early. For more information, see https://reactrouter.com/v6/upgrading/future#v7_relativesplatpath.

    [0m [90m 26 |[39m [90m// Helper function to render components with necessary providers[39m
     [90m 27 |[39m [36mconst[39m renderWithProviders [33m=[39m (component) [33m=>[39m {
    [31m[1m>[22m[39m[90m 28 |[39m   [36mreturn[39m render(
     [90m    |[39m                [31m[1m^[22m[39m
     [90m 29 |[39m     [33m<[39m[33mBrowserRouter[39m[33m>[39m
     [90m 30 |[39m       [33m<[39m[33mAuthProvider[39m[33m>[39m
     [90m 31 |[39m         {component}[0m

      at warnOnce (node_modules/react-router/lib/deprecations.ts:9:13)
      at logDeprecation (node_modules/react-router/lib/deprecations.ts:14:3)
      at Object.logV6DeprecationWarnings [as UNSAFE_logV6DeprecationWarnings] (node_modules/react-router/lib/deprecations.ts:37:5)
      at node_modules/react-router-dom/index.tsx:816:25
      at commitHookEffectListMount (node_modules/react-dom/cjs/react-dom.development.js:23189:26)
      at commitPassiveMountOnFiber (node_modules/react-dom/cjs/react-dom.development.js:24970:11)
      at commitPassiveMountEffects_complete (node_modules/react-dom/cjs/react-dom.development.js:24930:9)
      at commitPassiveMountEffects_begin (node_modules/react-dom/cjs/react-dom.development.js:24917:7)
      at commitPassiveMountEffects (node_modules/react-dom/cjs/react-dom.development.js:24905:3)
      at flushPassiveEffectsImpl (node_modules/react-dom/cjs/react-dom.development.js:27078:3)
      at flushPassiveEffects (node_modules/react-dom/cjs/react-dom.development.js:27023:14)
      at node_modules/react-dom/cjs/react-dom.development.js:26808:9
      at flushActQueue (node_modules/react/cjs/react.development.js:2667:24)
      at act (node_modules/react/cjs/react.development.js:2582:11)
      at actWithWarning (node_modules/react-dom/cjs/react-dom-test-utils.development.js:1740:10)
      at node_modules/@testing-library/react/dist/act-compat.js:63:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:159:26)
      at render (node_modules/@testing-library/react/dist/pure.js:246:10)
      at renderWithProviders (src/tests/frontend-backend-integration.test.js:28:16)
      at Object.<anonymous> (src/tests/frontend-backend-integration.test.js:54:7)

    console.log
      Auth initialization - Token exists: false User exists: false

      at src/auth/AuthContext.js:19:13

    console.log
      Auth initialization - Token exists: false User exists: false

      at src/auth/AuthContext.js:19:13

    console.error
      Warning: An update to Register inside a test was not wrapped in act(...).
      
      When testing, code that causes React state updates should be wrapped into act(...):
      
      act(() => {
        /* fire events that update state */
      });
      /* assert on the output */
      
      This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
          at Register (C:\Users\Dang\Documents\plant-system\client\src\pages\Register.jsx:7:31)
          at AuthProvider (C:\Users\Dang\Documents\plant-system\client\src\auth\AuthContext.js:8:32)
          at Router (C:\Users\Dang\Documents\plant-system\client\node_modules\react-router\lib\components.tsx:421:13)
          at BrowserRouter (C:\Users\Dang\Documents\plant-system\client\node_modules\react-router-dom\index.tsx:789:3)

    [0m [90m 55 |[39m       setLoading([36mtrue[39m)[33m;[39m
     [90m 56 |[39m       [36mawait[39m authApi[33m.[39mregister(formData[33m.[39memail[33m,[39m formData[33m.[39mpassword[33m,[39m formData[33m.[39mconfirmPassword[33m,[39m formData[33m.[39mfull_name)[33m;[39m
    [31m[1m>[22m[39m[90m 57 |[39m       setLoading([36mfalse[39m)[33m;[39m
     [90m    |[39m       [31m[1m^[22m[39m
     [90m 58 |[39m       [90m// Show success message and redirect to login[39m
     [90m 59 |[39m       alert([32m"Registration successful! Please log in."[39m)[33m;[39m
     [90m 60 |[39m       navigate([32m"/login"[39m)[33m;[39m[0m

      at printWarning (node_modules/react-dom/cjs/react-dom.development.js:86:30)
      at error (node_modules/react-dom/cjs/react-dom.development.js:60:7)
      at warnIfUpdatesNotWrappedWithActDEV (node_modules/react-dom/cjs/react-dom.development.js:27628:9)
      at scheduleUpdateOnFiber (node_modules/react-dom/cjs/react-dom.development.js:25547:5)
      at setLoading (node_modules/react-dom/cjs/react-dom.development.js:16708:7)
      at handleSubmit (src/pages/Register.jsx:57:7)

    console.error
      Error: Not implemented: window.alert
          at module.exports (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\browser\not-implemented.js:9:17)
          at alert (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\browser\Window.js:866:7)
          at handleSubmit (C:\Users\Dang\Documents\plant-system\client\src\pages\Register.jsx:59:7)
          at processTicksAndRejections (node:internal/process/task_queues:105:5) undefined

    [0m [90m 57 |[39m       setLoading([36mfalse[39m)[33m;[39m
     [90m 58 |[39m       [90m// Show success message and redirect to login[39m
    [31m[1m>[22m[39m[90m 59 |[39m       alert([32m"Registration successful! Please log in."[39m)[33m;[39m
     [90m    |[39m       [31m[1m^[22m[39m
     [90m 60 |[39m       navigate([32m"/login"[39m)[33m;[39m
     [90m 61 |[39m     } [36mcatch[39m (err) {
     [90m 62 |[39m       setLoading([36mfalse[39m)[33m;[39m[0m

      at VirtualConsole.<anonymous> (node_modules/jsdom/lib/jsdom/virtual-console.js:29:45)
      at module.exports (node_modules/jsdom/lib/jsdom/browser/not-implemented.js:12:26)
      at alert (node_modules/jsdom/lib/jsdom/browser/Window.js:866:7)
      at handleSubmit (src/pages/Register.jsx:59:7)

    console.error
      Warning: An update to BrowserRouter inside a test was not wrapped in act(...).
      
      When testing, code that causes React state updates should be wrapped into act(...):
      
      act(() => {
        /* fire events that update state */
      });
      /* assert on the output */
      
      This ensures that you're testing the behavior the user would see in the browser. Learn more at https://reactjs.org/link/wrap-tests-with-act
          at BrowserRouter (C:\Users\Dang\Documents\plant-system\client\node_modules\react-router-dom\index.tsx:789:3)

    [0m [90m 58 |[39m       [90m// Show success message and redirect to login[39m
     [90m 59 |[39m       alert([32m"Registration successful! Please log in."[39m)[33m;[39m
    [31m[1m>[22m[39m[90m 60 |[39m       navigate([32m"/login"[39m)[33m;[39m
     [90m    |[39m       [31m[1m^[22m[39m
     [90m 61 |[39m     } [36mcatch[39m (err) {
     [90m 62 |[39m       setLoading([36mfalse[39m)[33m;[39m
     [90m 63 |[39m       setError(err[33m?[39m[33m.[39mresponse[33m?[39m[33m.[39mdata[33m?[39m[33m.[39merror [33m||[39m [32m"Registration failed. Please try again."[39m)[33m;[39m[0m

      at printWarning (node_modules/react-dom/cjs/react-dom.development.js:86:30)
      at error (node_modules/react-dom/cjs/react-dom.development.js:60:7)
      at warnIfUpdatesNotWrappedWithActDEV (node_modules/react-dom/cjs/react-dom.development.js:27628:9)
      at scheduleUpdateOnFiber (node_modules/react-dom/cjs/react-dom.development.js:25547:5)
      at setStateImpl (node_modules/react-dom/cjs/react-dom.development.js:16708:7)
      at listener (node_modules/react-router-dom/index.tsx:809:11)
      at push (node_modules/@remix-run/router/history.ts:664:7)
      at navigate (node_modules/react-router/lib/hooks.tsx:243:62)
      at handleSubmit (src/pages/Register.jsx:60:7)

    console.log
      Auth initialization - Token exists: false User exists: false

      at src/auth/AuthContext.js:19:13

  ● Frontend-Backend Integration Tests › Login Component Integration › Login form submits correct data to backend API

    TestingLibraryElementError: Unable to find a label with the text of: /email/i

    Ignored nodes: comments, script, style
    [36m<body>[39m
      [36m<div>[39m
        [36m<div[39m
          [33mstyle[39m=[32m"display: grid; place-items: center; height: 100vh;"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"sf-card"[39m
            [33mstyle[39m=[32m"width: 380px;"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"sf-card-header"[39m
            [36m>[39m
              [36m<div>[39m
                [36m<b>[39m
                  [0mSign in[0m
                [36m</b>[39m
              [36m</div>[39m
            [36m</div>[39m
            [36m<form[39m
              [33mclass[39m=[32m"d-grid gap-2"[39m
            [36m>[39m
              [36m<input[39m
                [33mclass[39m=[32m"sf-input"[39m
                [33mplaceholder[39m=[32m"Email"[39m
                [33mvalue[39m=[32m""[39m
              [36m/>[39m
              [36m<input[39m
                [33mclass[39m=[32m"sf-input"[39m
                [33mplaceholder[39m=[32m"Password"[39m
                [33mtype[39m=[32m"password"[39m
                [33mvalue[39m=[32m""[39m
              [36m/>[39m
              [36m<button[39m
                [33mclass[39m=[32m"sf-btn primary"[39m
                [33mtype[39m=[32m"submit"[39m
              [36m>[39m
                [0mLogin[0m
              [36m</button>[39m
              [36m<button[39m
                [33mclass[39m=[32m"sf-btn"[39m
                [33mtype[39m=[32m"button"[39m
              [36m>[39m
                [0mDev bypass (Premium)[0m
              [36m</button>[39m
            [36m</form>[39m
          [36m</div>[39m
        [36m</div>[39m
      [36m</div>[39m
    [36m</body>[39m

    [0m [90m 55 |[39m       
     [90m 56 |[39m       [90m// Fill out the login form[39m
    [31m[1m>[22m[39m[90m 57 |[39m       fireEvent[33m.[39mchange(screen[33m.[39mgetByLabelText([35m/email/i[39m)[33m,[39m {
     [90m    |[39m                               [31m[1m^[22m[39m
     [90m 58 |[39m         target[33m:[39m { value[33m:[39m [32m'test@example.com'[39m }
     [90m 59 |[39m       })[33m;[39m
     [90m 60 |[39m       [0m

      at Object.getElementError (node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/config.js:37:19)
      at getAllByLabelText (node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/queries/label-text.js:103:38)
      at node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/query-helpers.js:52:17
      at getByLabelText (node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/query-helpers.js:95:19)
      at Object.<anonymous> (src/tests/frontend-backend-integration.test.js:57:31)

  ● Frontend-Backend Integration Tests › Login Component Integration › Login displays error message on API failure

    TestingLibraryElementError: Unable to find a label with the text of: /email/i

    Ignored nodes: comments, script, style
    [36m<body>[39m
      [36m<div>[39m
        [36m<div[39m
          [33mstyle[39m=[32m"display: grid; place-items: center; height: 100vh;"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"sf-card"[39m
            [33mstyle[39m=[32m"width: 380px;"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"sf-card-header"[39m
            [36m>[39m
              [36m<div>[39m
                [36m<b>[39m
                  [0mSign in[0m
                [36m</b>[39m
              [36m</div>[39m
            [36m</div>[39m
            [36m<form[39m
              [33mclass[39m=[32m"d-grid gap-2"[39m
            [36m>[39m
              [36m<input[39m
                [33mclass[39m=[32m"sf-input"[39m
                [33mplaceholder[39m=[32m"Email"[39m
                [33mvalue[39m=[32m""[39m
              [36m/>[39m
              [36m<input[39m
                [33mclass[39m=[32m"sf-input"[39m
                [33mplaceholder[39m=[32m"Password"[39m
                [33mtype[39m=[32m"password"[39m
                [33mvalue[39m=[32m""[39m
              [36m/>[39m
              [36m<button[39m
                [33mclass[39m=[32m"sf-btn primary"[39m
                [33mtype[39m=[32m"submit"[39m
              [36m>[39m
                [0mLogin[0m
              [36m</button>[39m
              [36m<button[39m
                [33mclass[39m=[32m"sf-btn"[39m
                [33mtype[39m=[32m"button"[39m
              [36m>[39m
                [0mDev bypass (Premium)[0m
              [36m</button>[39m
            [36m</form>[39m
          [36m</div>[39m
        [36m</div>[39m
      [36m</div>[39m
    [36m</body>[39m

    [0m [90m 86 |[39m       
     [90m 87 |[39m       [90m// Fill out the form[39m
    [31m[1m>[22m[39m[90m 88 |[39m       fireEvent[33m.[39mchange(screen[33m.[39mgetByLabelText([35m/email/i[39m)[33m,[39m {
     [90m    |[39m                               [31m[1m^[22m[39m
     [90m 89 |[39m         target[33m:[39m { value[33m:[39m [32m'wrong@example.com'[39m }
     [90m 90 |[39m       })[33m;[39m
     [90m 91 |[39m       [0m

      at Object.getElementError (node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/config.js:37:19)
      at getAllByLabelText (node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/queries/label-text.js:103:38)
      at node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/query-helpers.js:52:17
      at getByLabelText (node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/query-helpers.js:95:19)
      at Object.<anonymous> (src/tests/frontend-backend-integration.test.js:88:31)

  ● Frontend-Backend Integration Tests › ForgotPassword Component Integration › Forgot Password form submits correct data to backend API

    TestingLibraryElementError: Unable to find an accessible element with the role "button" and name `/reset password/i`

    Here are the accessible roles:

      heading:

      Name "Forgot Password":
      [36m<h2[39m
        [33mclass[39m=[32m"text-center mb-4"[39m
      [36m/>[39m

      --------------------------------------------------
      textbox:

      Name "Email address":
      [36m<input[39m
        [33mclass[39m=[32m"form-control"[39m
        [33mid[39m=[32m"email"[39m
        [33mrequired[39m=[32m""[39m
        [33mtype[39m=[32m"email"[39m
        [33mvalue[39m=[32m"forgot@example.com"[39m
      [36m/>[39m

      --------------------------------------------------
      button:

      Name "Send Reset Link":
      [36m<button[39m
        [33mclass[39m=[32m"btn btn-primary w-100 mb-3"[39m
        [33mtype[39m=[32m"submit"[39m
      [36m/>[39m

      --------------------------------------------------
      link:

      Name "Back to Login":
      [36m<a[39m
        [33mhref[39m=[32m"/login"[39m
      [36m/>[39m

      --------------------------------------------------

    Ignored nodes: comments, script, style
    [36m<body>[39m
      [36m<div>[39m
        [36m<div[39m
          [33mclass[39m=[32m"container py-5"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"row justify-content-center"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"col-md-6"[39m
            [36m>[39m
              [36m<div[39m
                [33mclass[39m=[32m"card shadow"[39m
              [36m>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"card-body p-4"[39m
                [36m>[39m
                  [36m<h2[39m
                    [33mclass[39m=[32m"text-center mb-4"[39m
                  [36m>[39m
                    [0mForgot Password[0m
                  [36m</h2>[39m
                  [36m<form>[39m
                    [36m<p[39m
                      [33mclass[39m=[32m"text-muted mb-4"[39m
                    [36m>[39m
                      [0mEnter your email address below and we'll send you a link to reset your password.[0m
                    [36m</p>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"mb-3"[39m
                    [36m>[39m
                      [36m<label[39m
                        [33mclass[39m=[32m"form-label"[39m
                        [33mfor[39m=[32m"email"[39m
                      [36m>[39m
                        [0mEmail address[0m
                      [36m</label>[39m
                      [36m<input[39m
                        [33mclass[39m=[32m"form-control"[39m
                        [33mid[39m=[32m"email"[39m
                        [33mrequired[39m=[32m""[39m
                        [33mtype[39m=[32m"email"[39m
                        [33mvalue[39m=[32m"forgot@example.com"[39m
                      [36m/>[39m
                    [36m</div>[39m
                    [36m<button[39m
                      [33mclass[39m=[32m"btn btn-primary w-100 mb-3"[39m
                      [33mtype[39m=[32m"submit"[39m
                    [36m>[39m
                      [0mSend Reset Link[0m
                    [36m</button>[39m
                    [36m<div[39m
                      [33mclass[39m=[32m"text-center"[39m
                    [36m>[39m
                      [36m<a[39m
                        [33mhref[39m=[32m"/login"[39m
                      [36m>[39m
                        [0mBack to Login[0m
                      [36m</a>[39m
                    [36m</div>[39m
                  [36m</form>[39m
                [36m</div>[39m
              [36m</div>[39m
            [36m</div>[39m
          [36m</div>[39m
        [36m</div>[39m
      [36m</div>[39m
    [36m</body>[39m

    [0m [90m 163 |[39m       
     [90m 164 |[39m       [90m// Submit the form[39m
    [31m[1m>[22m[39m[90m 165 |[39m       fireEvent[33m.[39mclick(screen[33m.[39mgetByRole([32m'button'[39m[33m,[39m { name[33m:[39m [35m/reset password/i[39m }))[33m;[39m
     [90m     |[39m                              [31m[1m^[22m[39m
     [90m 166 |[39m       
     [90m 167 |[39m       [90m// Wait for the API call to be made[39m
     [90m 168 |[39m       [36mawait[39m waitFor(() [33m=>[39m {[0m

      at Object.getElementError (node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/config.js:37:19)
      at node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/query-helpers.js:76:38
      at node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/query-helpers.js:52:17
      at getByRole (node_modules/@testing-library/react/node_modules/@testing-library/dom/dist/query-helpers.js:95:19)
      at Object.<anonymous> (src/tests/frontend-backend-integration.test.js:165:30)

FAIL src/App.test.js
  ● Console

    console.error
      Error: Not implemented: HTMLCanvasElement.prototype.getContext (without installing the canvas npm package)
          at module.exports (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\browser\not-implemented.js:9:17)
          at HTMLCanvasElementImpl.getContext (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\nodes\HTMLCanvasElement-impl.js:42:5)
          at HTMLCanvasElement.getContext (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\generated\HTMLCanvasElement.js:131:58)
          at hasBrowserCanvas (C:\Users\Dang\Documents\plant-system\client\node_modules\jspdf\src\libs\png.js:479:36)
          at C:\Users\Dang\Documents\plant-system\client\node_modules\jspdf\src\libs\png.js:488:3
          at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\client\node_modules\jspdf\src\libs\png.js:28:11)
          at Runtime._execModule (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runtime\build\index.js:1646:24)
          at Runtime._loadModule (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runtime\build\index.js:1185:12)
          at Runtime.requireModule (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runtime\build\index.js:1009:12)
          at Runtime.require [as requireModuleOrMock] (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runtime\build\index.js:1210:21)
          at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\client\src\pages\Reports.jsx:7:1)
          at Runtime._execModule (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runtime\build\index.js:1646:24)
          at Runtime._loadModule (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runtime\build\index.js:1185:12)
          at Runtime.requireModule (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runtime\build\index.js:1009:12)
          at Runtime.require [as requireModuleOrMock] (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runtime\build\index.js:1210:21)
          at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\client\src\App.js:15:1)
          at Runtime._execModule (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runtime\build\index.js:1646:24)
          at Runtime._loadModule (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runtime\build\index.js:1185:12)
          at Runtime.requireModule (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runtime\build\index.js:1009:12)
          at Runtime.require [as requireModuleOrMock] (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runtime\build\index.js:1210:21)
          at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\client\src\App.test.js:4:1)
          at Runtime._execModule (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runtime\build\index.js:1646:24)
          at Runtime._loadModule (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runtime\build\index.js:1185:12)
          at Runtime.requireModule (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runtime\build\index.js:1009:12)
          at jestAdapter (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:79:13)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at runTestInternal (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runner\build\runTest.js:389:16)
          at runTest (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runner\build\runTest.js:475:34)
          at Object.worker (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runner\build\testWorker.js:133:12) undefined

    [0m [90m  5 |[39m [36mimport[39m { [33mChart[39m [36mas[39m [33mChartJS[39m[33m,[39m [33mLineElement[39m[33m,[39m [33mPointElement[39m[33m,[39m [33mLinearScale[39m[33m,[39m [33mCategoryScale[39m[33m,[39m [33mLegend[39m[33m,[39m [33mTooltip[39m } [36mfrom[39m [32m"chart.js"[39m[33m;[39m
     [90m  6 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mXLSX[39m [36mfrom[39m [32m"xlsx"[39m[33m;[39m
    [31m[1m>[22m[39m[90m  7 |[39m [36mimport[39m jsPDF [36mfrom[39m [32m"jspdf"[39m[33m;[39m
     [90m    |[39m [31m[1m^[22m[39m
     [90m  8 |[39m [36mimport[39m [32m"jspdf-autotable"[39m[33m;[39m
     [90m  9 |[39m [36mimport[39m reportsApi [36mfrom[39m [32m"../api/reportsApi"[39m[33m;[39m
     [90m 10 |[39m [36mimport[39m axiosClient [36mfrom[39m [32m"../api/axiosClient"[39m[33m;[39m[0m

      at VirtualConsole.<anonymous> (node_modules/jsdom/lib/jsdom/virtual-console.js:29:45)
      at module.exports (node_modules/jsdom/lib/jsdom/browser/not-implemented.js:12:26)
      at HTMLCanvasElementImpl.getContext (node_modules/jsdom/lib/jsdom/living/nodes/HTMLCanvasElement-impl.js:42:5)
      at HTMLCanvasElement.getContext (node_modules/jsdom/lib/jsdom/living/generated/HTMLCanvasElement.js:131:58)
      at hasBrowserCanvas (node_modules/jspdf/src/libs/png.js:479:36)
      at node_modules/jspdf/src/libs/png.js:488:3
      at Object.<anonymous> (node_modules/jspdf/src/libs/png.js:28:11)
      at Object.<anonymous> (src/pages/Reports.jsx:7:1)
      at Object.<anonymous> (src/App.js:15:1)
      at Object.<anonymous> (src/App.test.js:4:1)

    console.error
      Warning: `ReactDOMTestUtils.act` is deprecated in favor of `React.act`. Import `act` from `react` instead of `react-dom/test-utils`. See https://react.dev/warnings/react-dom-test-utils for more info.

    [0m [90m 33 |[39m
     [90m 34 |[39m test([32m'renders app without crashing'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 35 |[39m   render(
     [90m    |[39m         [31m[1m^[22m[39m
     [90m 36 |[39m     [33m<[39m[33mBrowserRouter[39m[33m>[39m
     [90m 37 |[39m       [33m<[39m[33mAuthProvider[39m[33m>[39m
     [90m 38 |[39m         [33m<[39m[33mApp[39m [33m/[39m[33m>[39m[0m

      at printWarning (node_modules/react-dom/cjs/react-dom-test-utils.development.js:71:30)
      at error (node_modules/react-dom/cjs/react-dom-test-utils.development.js:45:7)
      at actWithWarning (node_modules/react-dom/cjs/react-dom-test-utils.development.js:1736:7)
      at node_modules/@testing-library/react/dist/act-compat.js:63:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:159:26)
      at render (node_modules/@testing-library/react/dist/pure.js:246:10)
      at Object.<anonymous> (src/App.test.js:35:9)

    console.error
      Error: Uncaught [TypeError: Cannot destructure property 'isAuthenticated' of '(0 , _AuthContext.useAuth)(...)' as it is undefined.]
          at reportException (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\helpers\runtime-script-errors.js:66:24)
          at innerInvokeEventListeners (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:341:9)
          at invokeEventListeners (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:274:3)
          at HTMLUnknownElementImpl._dispatch (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:221:9)
          at HTMLUnknownElementImpl.dispatchEvent (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:94:17)
          at HTMLUnknownElement.dispatchEvent (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\generated\EventTarget.js:231:34)
          at Object.invokeGuardedCallbackDev (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:4213:16)
          at invokeGuardedCallback (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:4277:31)
          at beginWork$1 (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:27490:7)
          at performUnitOfWork (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:26599:12)
          at workLoopSync (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:26505:5)
          at renderRootSync (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:26473:7)
          at performConcurrentWorkOnRoot (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:25777:74)
          at flushActQueue (C:\Users\Dang\Documents\plant-system\client\node_modules\react\cjs\react.development.js:2667:24)
          at act (C:\Users\Dang\Documents\plant-system\client\node_modules\react\cjs\react.development.js:2582:11)
          at actWithWarning (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom-test-utils.development.js:1740:10)
          at C:\Users\Dang\Documents\plant-system\client\node_modules\@testing-library\react\dist\act-compat.js:63:25
          at renderRoot (C:\Users\Dang\Documents\plant-system\client\node_modules\@testing-library\react\dist\pure.js:159:26)
          at render (C:\Users\Dang\Documents\plant-system\client\node_modules\@testing-library\react\dist\pure.js:246:10)
          at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\client\src\App.test.js:35:9)
          at Promise.then.completed (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\utils.js:391:28)
          at new Promise (<anonymous>)
          at callAsyncCircusFn (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\utils.js:316:10)
          at _callCircusTest (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:218:40)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at _runTest (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:155:3)
          at _runTestsForDescribeBlock (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:66:9)
          at run (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:25:3)
          at runAndTransformResultsToJestFormat (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:170:21)
          at jestAdapter (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:82:19)
          at runTestInternal (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runner\build\runTest.js:389:16)
          at runTest (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runner\build\runTest.js:475:34)
          at Object.worker (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runner\build\testWorker.js:133:12) TypeError: Cannot destructure property 'isAuthenticated' of '(0 , _AuthContext.useAuth)(...)' as it is undefined.
          at App (C:\Users\Dang\Documents\plant-system\client\src\App.js:51:11)
          at renderWithHooks (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:15486:18)
          at mountIndeterminateComponent (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:20103:13)
          at beginWork (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:21626:16)
          at HTMLUnknownElement.callCallback (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:4164:14)
          at HTMLUnknownElement.callTheUserObjectsOperation (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\generated\EventListener.js:26:30)
          at innerInvokeEventListeners (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:338:25)
          at invokeEventListeners (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:274:3)
          at HTMLUnknownElementImpl._dispatch (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:221:9)
          at HTMLUnknownElementImpl.dispatchEvent (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:94:17)
          at HTMLUnknownElement.dispatchEvent (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\generated\EventTarget.js:231:34)
          at Object.invokeGuardedCallbackDev (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:4213:16)
          at invokeGuardedCallback (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:4277:31)
          at beginWork$1 (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:27490:7)
          at performUnitOfWork (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:26599:12)
          at workLoopSync (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:26505:5)
          at renderRootSync (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:26473:7)
          at performConcurrentWorkOnRoot (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:25777:74)
          at flushActQueue (C:\Users\Dang\Documents\plant-system\client\node_modules\react\cjs\react.development.js:2667:24)
          at act (C:\Users\Dang\Documents\plant-system\client\node_modules\react\cjs\react.development.js:2582:11)
          at actWithWarning (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom-test-utils.development.js:1740:10)
          at C:\Users\Dang\Documents\plant-system\client\node_modules\@testing-library\react\dist\act-compat.js:63:25
          at renderRoot (C:\Users\Dang\Documents\plant-system\client\node_modules\@testing-library\react\dist\pure.js:159:26)
          at render (C:\Users\Dang\Documents\plant-system\client\node_modules\@testing-library\react\dist\pure.js:246:10)
          at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\client\src\App.test.js:35:9)
          at Promise.then.completed (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\utils.js:391:28)
          at new Promise (<anonymous>)
          at callAsyncCircusFn (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\utils.js:316:10)
          at _callCircusTest (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:218:40)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at _runTest (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:155:3)
          at _runTestsForDescribeBlock (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:66:9)
          at run (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:25:3)
          at runAndTransformResultsToJestFormat (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:170:21)
          at jestAdapter (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:82:19)
          at runTestInternal (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runner\build\runTest.js:389:16)
          at runTest (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runner\build\runTest.js:475:34)
          at Object.worker (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runner\build\testWorker.js:133:12)

    [0m [90m 33 |[39m
     [90m 34 |[39m test([32m'renders app without crashing'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 35 |[39m   render(
     [90m    |[39m         [31m[1m^[22m[39m
     [90m 36 |[39m     [33m<[39m[33mBrowserRouter[39m[33m>[39m
     [90m 37 |[39m       [33m<[39m[33mAuthProvider[39m[33m>[39m
     [90m 38 |[39m         [33m<[39m[33mApp[39m [33m/[39m[33m>[39m[0m

      at VirtualConsole.<anonymous> (node_modules/jsdom/lib/jsdom/virtual-console.js:29:45)
      at reportException (node_modules/jsdom/lib/jsdom/living/helpers/runtime-script-errors.js:70:28)
      at innerInvokeEventListeners (node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:341:9)
      at invokeEventListeners (node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:274:3)
      at HTMLUnknownElementImpl._dispatch (node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:221:9)
      at HTMLUnknownElementImpl.dispatchEvent (node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:94:17)
      at HTMLUnknownElement.dispatchEvent (node_modules/jsdom/lib/jsdom/living/generated/EventTarget.js:231:34)
      at Object.invokeGuardedCallbackDev (node_modules/react-dom/cjs/react-dom.development.js:4213:16)
      at invokeGuardedCallback (node_modules/react-dom/cjs/react-dom.development.js:4277:31)
      at beginWork$1 (node_modules/react-dom/cjs/react-dom.development.js:27490:7)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom.development.js:26599:12)
      at workLoopSync (node_modules/react-dom/cjs/react-dom.development.js:26505:5)
      at renderRootSync (node_modules/react-dom/cjs/react-dom.development.js:26473:7)
      at performConcurrentWorkOnRoot (node_modules/react-dom/cjs/react-dom.development.js:25777:74)
      at flushActQueue (node_modules/react/cjs/react.development.js:2667:24)
      at act (node_modules/react/cjs/react.development.js:2582:11)
      at actWithWarning (node_modules/react-dom/cjs/react-dom-test-utils.development.js:1740:10)
      at node_modules/@testing-library/react/dist/act-compat.js:63:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:159:26)
      at render (node_modules/@testing-library/react/dist/pure.js:246:10)
      at Object.<anonymous> (src/App.test.js:35:9)

    console.error
      Error: Uncaught [TypeError: Cannot destructure property 'isAuthenticated' of '(0 , _AuthContext.useAuth)(...)' as it is undefined.]
          at reportException (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\helpers\runtime-script-errors.js:66:24)
          at innerInvokeEventListeners (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:341:9)
          at invokeEventListeners (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:274:3)
          at HTMLUnknownElementImpl._dispatch (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:221:9)
          at HTMLUnknownElementImpl.dispatchEvent (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:94:17)
          at HTMLUnknownElement.dispatchEvent (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\generated\EventTarget.js:231:34)
          at Object.invokeGuardedCallbackDev (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:4213:16)
          at invokeGuardedCallback (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:4277:31)
          at beginWork$1 (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:27490:7)
          at performUnitOfWork (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:26599:12)
          at workLoopSync (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:26505:5)
          at renderRootSync (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:26473:7)
          at recoverFromConcurrentError (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:25889:20)
          at performConcurrentWorkOnRoot (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:25789:22)
          at flushActQueue (C:\Users\Dang\Documents\plant-system\client\node_modules\react\cjs\react.development.js:2667:24)
          at act (C:\Users\Dang\Documents\plant-system\client\node_modules\react\cjs\react.development.js:2582:11)
          at actWithWarning (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom-test-utils.development.js:1740:10)
          at C:\Users\Dang\Documents\plant-system\client\node_modules\@testing-library\react\dist\act-compat.js:63:25
          at renderRoot (C:\Users\Dang\Documents\plant-system\client\node_modules\@testing-library\react\dist\pure.js:159:26)
          at render (C:\Users\Dang\Documents\plant-system\client\node_modules\@testing-library\react\dist\pure.js:246:10)
          at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\client\src\App.test.js:35:9)
          at Promise.then.completed (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\utils.js:391:28)
          at new Promise (<anonymous>)
          at callAsyncCircusFn (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\utils.js:316:10)
          at _callCircusTest (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:218:40)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at _runTest (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:155:3)
          at _runTestsForDescribeBlock (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:66:9)
          at run (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:25:3)
          at runAndTransformResultsToJestFormat (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:170:21)
          at jestAdapter (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:82:19)
          at runTestInternal (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runner\build\runTest.js:389:16)
          at runTest (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runner\build\runTest.js:475:34)
          at Object.worker (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runner\build\testWorker.js:133:12) TypeError: Cannot destructure property 'isAuthenticated' of '(0 , _AuthContext.useAuth)(...)' as it is undefined.
          at App (C:\Users\Dang\Documents\plant-system\client\src\App.js:51:11)
          at renderWithHooks (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:15486:18)
          at mountIndeterminateComponent (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:20103:13)
          at beginWork (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:21626:16)
          at HTMLUnknownElement.callCallback (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:4164:14)
          at HTMLUnknownElement.callTheUserObjectsOperation (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\generated\EventListener.js:26:30)
          at innerInvokeEventListeners (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:338:25)
          at invokeEventListeners (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:274:3)
          at HTMLUnknownElementImpl._dispatch (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:221:9)
          at HTMLUnknownElementImpl.dispatchEvent (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\events\EventTarget-impl.js:94:17)
          at HTMLUnknownElement.dispatchEvent (C:\Users\Dang\Documents\plant-system\client\node_modules\jsdom\lib\jsdom\living\generated\EventTarget.js:231:34)
          at Object.invokeGuardedCallbackDev (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:4213:16)
          at invokeGuardedCallback (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:4277:31)
          at beginWork$1 (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:27490:7)
          at performUnitOfWork (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:26599:12)
          at workLoopSync (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:26505:5)
          at renderRootSync (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:26473:7)
          at recoverFromConcurrentError (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:25889:20)
          at performConcurrentWorkOnRoot (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom.development.js:25789:22)
          at flushActQueue (C:\Users\Dang\Documents\plant-system\client\node_modules\react\cjs\react.development.js:2667:24)
          at act (C:\Users\Dang\Documents\plant-system\client\node_modules\react\cjs\react.development.js:2582:11)
          at actWithWarning (C:\Users\Dang\Documents\plant-system\client\node_modules\react-dom\cjs\react-dom-test-utils.development.js:1740:10)
          at C:\Users\Dang\Documents\plant-system\client\node_modules\@testing-library\react\dist\act-compat.js:63:25
          at renderRoot (C:\Users\Dang\Documents\plant-system\client\node_modules\@testing-library\react\dist\pure.js:159:26)
          at render (C:\Users\Dang\Documents\plant-system\client\node_modules\@testing-library\react\dist\pure.js:246:10)
          at Object.<anonymous> (C:\Users\Dang\Documents\plant-system\client\src\App.test.js:35:9)
          at Promise.then.completed (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\utils.js:391:28)
          at new Promise (<anonymous>)
          at callAsyncCircusFn (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\utils.js:316:10)
          at _callCircusTest (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:218:40)
          at processTicksAndRejections (node:internal/process/task_queues:105:5)
          at _runTest (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:155:3)
          at _runTestsForDescribeBlock (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:66:9)
          at run (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\run.js:25:3)
          at runAndTransformResultsToJestFormat (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapterInit.js:170:21)
          at jestAdapter (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-circus\build\legacy-code-todo-rewrite\jestAdapter.js:82:19)
          at runTestInternal (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runner\build\runTest.js:389:16)
          at runTest (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runner\build\runTest.js:475:34)
          at Object.worker (C:\Users\Dang\Documents\plant-system\client\node_modules\jest-runner\build\testWorker.js:133:12)

    [0m [90m 33 |[39m
     [90m 34 |[39m test([32m'renders app without crashing'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 35 |[39m   render(
     [90m    |[39m         [31m[1m^[22m[39m
     [90m 36 |[39m     [33m<[39m[33mBrowserRouter[39m[33m>[39m
     [90m 37 |[39m       [33m<[39m[33mAuthProvider[39m[33m>[39m
     [90m 38 |[39m         [33m<[39m[33mApp[39m [33m/[39m[33m>[39m[0m

      at VirtualConsole.<anonymous> (node_modules/jsdom/lib/jsdom/virtual-console.js:29:45)
      at reportException (node_modules/jsdom/lib/jsdom/living/helpers/runtime-script-errors.js:70:28)
      at innerInvokeEventListeners (node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:341:9)
      at invokeEventListeners (node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:274:3)
      at HTMLUnknownElementImpl._dispatch (node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:221:9)
      at HTMLUnknownElementImpl.dispatchEvent (node_modules/jsdom/lib/jsdom/living/events/EventTarget-impl.js:94:17)
      at HTMLUnknownElement.dispatchEvent (node_modules/jsdom/lib/jsdom/living/generated/EventTarget.js:231:34)
      at Object.invokeGuardedCallbackDev (node_modules/react-dom/cjs/react-dom.development.js:4213:16)
      at invokeGuardedCallback (node_modules/react-dom/cjs/react-dom.development.js:4277:31)
      at beginWork$1 (node_modules/react-dom/cjs/react-dom.development.js:27490:7)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom.development.js:26599:12)
      at workLoopSync (node_modules/react-dom/cjs/react-dom.development.js:26505:5)
      at renderRootSync (node_modules/react-dom/cjs/react-dom.development.js:26473:7)
      at recoverFromConcurrentError (node_modules/react-dom/cjs/react-dom.development.js:25889:20)
      at performConcurrentWorkOnRoot (node_modules/react-dom/cjs/react-dom.development.js:25789:22)
      at flushActQueue (node_modules/react/cjs/react.development.js:2667:24)
      at act (node_modules/react/cjs/react.development.js:2582:11)
      at actWithWarning (node_modules/react-dom/cjs/react-dom-test-utils.development.js:1740:10)
      at node_modules/@testing-library/react/dist/act-compat.js:63:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:159:26)
      at render (node_modules/@testing-library/react/dist/pure.js:246:10)
      at Object.<anonymous> (src/App.test.js:35:9)

    console.error
      The above error occurred in the <App> component:
      
          at App (C:\Users\Dang\Documents\plant-system\client\src\App.js:51:11)
          at AuthProvider (C:\Users\Dang\Documents\plant-system\client\src\auth\AuthContext.js:8:32)
          at Router (C:\Users\Dang\Documents\plant-system\client\node_modules\react-router\lib\components.tsx:421:13)
          at BrowserRouter (C:\Users\Dang\Documents\plant-system\client\node_modules\react-router-dom\index.tsx:789:3)
      
      Consider adding an error boundary to your tree to customize error handling behavior.
      Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.

    [0m [90m 33 |[39m
     [90m 34 |[39m test([32m'renders app without crashing'[39m[33m,[39m () [33m=>[39m {
    [31m[1m>[22m[39m[90m 35 |[39m   render(
     [90m    |[39m         [31m[1m^[22m[39m
     [90m 36 |[39m     [33m<[39m[33mBrowserRouter[39m[33m>[39m
     [90m 37 |[39m       [33m<[39m[33mAuthProvider[39m[33m>[39m
     [90m 38 |[39m         [33m<[39m[33mApp[39m [33m/[39m[33m>[39m[0m

      at logCapturedError (node_modules/react-dom/cjs/react-dom.development.js:18704:23)
      at update.callback (node_modules/react-dom/cjs/react-dom.development.js:18737:5)
      at callCallback (node_modules/react-dom/cjs/react-dom.development.js:15036:12)
      at commitUpdateQueue (node_modules/react-dom/cjs/react-dom.development.js:15057:9)
      at commitLayoutEffectOnFiber (node_modules/react-dom/cjs/react-dom.development.js:23430:13)
      at commitLayoutMountEffects_complete (node_modules/react-dom/cjs/react-dom.development.js:24727:9)
      at commitLayoutEffects_begin (node_modules/react-dom/cjs/react-dom.development.js:24713:7)
      at commitLayoutEffects (node_modules/react-dom/cjs/react-dom.development.js:24651:3)
      at commitRootImpl (node_modules/react-dom/cjs/react-dom.development.js:26862:5)
      at commitRoot (node_modules/react-dom/cjs/react-dom.development.js:26721:5)
      at finishConcurrentRender (node_modules/react-dom/cjs/react-dom.development.js:25931:9)
      at performConcurrentWorkOnRoot (node_modules/react-dom/cjs/react-dom.development.js:25848:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:2667:24)
      at act (node_modules/react/cjs/react.development.js:2582:11)
      at actWithWarning (node_modules/react-dom/cjs/react-dom-test-utils.development.js:1740:10)
      at node_modules/@testing-library/react/dist/act-compat.js:63:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:159:26)
      at render (node_modules/@testing-library/react/dist/pure.js:246:10)
      at Object.<anonymous> (src/App.test.js:35:9)

  ● renders app without crashing

    TypeError: Cannot destructure property 'isAuthenticated' of '(0 , _AuthContext.useAuth)(...)' as it is undefined.

    [0m [90m 49 |[39m
     [90m 50 |[39m [36mfunction[39m [33mApp[39m() {
    [31m[1m>[22m[39m[90m 51 |[39m   [36mconst[39m { isAuthenticated[33m,[39m user } [33m=[39m useAuth()[33m;[39m
     [90m    |[39m           [31m[1m^[22m[39m
     [90m 52 |[39m   
     [90m 53 |[39m   [90m// Debug point - Log authentication state[39m
     [90m 54 |[39m   console[33m.[39mlog([32m'App rendering - Authentication state:'[39m[33m,[39m { [0m

      at App (src/App.js:51:11)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom.development.js:15486:18)
      at mountIndeterminateComponent (node_modules/react-dom/cjs/react-dom.development.js:20103:13)
      at beginWork (node_modules/react-dom/cjs/react-dom.development.js:21626:16)
      at beginWork$1 (node_modules/react-dom/cjs/react-dom.development.js:27465:14)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom.development.js:26599:12)
      at workLoopSync (node_modules/react-dom/cjs/react-dom.development.js:26505:5)
      at renderRootSync (node_modules/react-dom/cjs/react-dom.development.js:26473:7)
      at recoverFromConcurrentError (node_modules/react-dom/cjs/react-dom.development.js:25889:20)
      at performConcurrentWorkOnRoot (node_modules/react-dom/cjs/react-dom.development.js:25789:22)
      at flushActQueue (node_modules/react/cjs/react.development.js:2667:24)
      at act (node_modules/react/cjs/react.development.js:2582:11)
      at actWithWarning (node_modules/react-dom/cjs/react-dom-test-utils.development.js:1740:10)
      at node_modules/@testing-library/react/dist/act-compat.js:63:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:159:26)
      at render (node_modules/@testing-library/react/dist/pure.js:246:10)
      at Object.<anonymous> (src/App.test.js:35:9)

Test Suites: 2 failed, 3 passed, 5 total
Tests:       4 failed, 15 passed, 19 total
Snapshots:   0 total
Time:        4.598 s
Ran all test suites.

```

## i18n Validation Tests

⚠️ SKIPPED: i18n validation script not found

## Summary

Backend Tests: 10 passed, 7 failed

