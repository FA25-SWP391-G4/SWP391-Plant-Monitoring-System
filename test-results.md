# Test Results

_Generated on 00:24:07 29/9/2025_

## Environment Check

Node.js version: v22.20.0
npm version: 10.9.3

## Backend Tests

Found 9 test files:

- auth.test.js
- email-comprehensive.test.js
- email-simple.test.js
- email.test.js
- frontend-backend-mapping.test.js
- frontend-rendering-i18n.test.js
- language-api.test.js
- profile-premium.test.js
- user.test.js

### auth.test.js

❌ FAILED

```

node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module 'C:\Users\l\AppData\Roaming\npm\node_modules\jest\bin\jest.js'
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v22.20.0

```

```

node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module 'supertest'
Require stack:
- C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\auth.test.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Module.require (node:internal/modules/cjs/loader:1463:12)
    at require (node:internal/modules/helpers:147:16)
    at Object.<anonymous> (C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\auth.test.js:1:17)
    at Module._compile (node:internal/modules/cjs/loader:1706:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    'C:\\Users\\l\\OneDrive\\DUE\\Project\\SWP391-Plant-Monitoring-System\\plant-system\\tests\\auth.test.js'
  ]
}

Node.js v22.20.0

```

### email-comprehensive.test.js

❌ FAILED

```

node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module 'C:\Users\l\AppData\Roaming\npm\node_modules\jest\bin\jest.js'
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v22.20.0

```

```

C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\email-comprehensive.test.js:7
const mockSendMail = jest.fn();
                     ^

ReferenceError: jest is not defined
    at Object.<anonymous> (C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\email-comprehensive.test.js:7:22)
    at Module._compile (node:internal/modules/cjs/loader:1706:14)
    at Object..js (node:internal/modules/cjs/loader:1839:10)
    at Module.load (node:internal/modules/cjs/loader:1441:32)
    at Function._load (node:internal/modules/cjs/loader:1263:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49

Node.js v22.20.0

```

### email-simple.test.js

❌ FAILED

```

node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module 'C:\Users\l\AppData\Roaming\npm\node_modules\jest\bin\jest.js'
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v22.20.0

```

```

C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\email-simple.test.js:7
const mockSendMail = jest.fn();
                     ^

ReferenceError: jest is not defined
    at Object.<anonymous> (C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\email-simple.test.js:7:22)
    at Module._compile (node:internal/modules/cjs/loader:1706:14)
    at Object..js (node:internal/modules/cjs/loader:1839:10)
    at Module.load (node:internal/modules/cjs/loader:1441:32)
    at Function._load (node:internal/modules/cjs/loader:1263:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49

Node.js v22.20.0

```

### email.test.js

❌ FAILED

```

node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module 'C:\Users\l\AppData\Roaming\npm\node_modules\jest\bin\jest.js'
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v22.20.0

```

```

C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\email.test.js:7
jest.mock('nodemailer', () => ({
^

ReferenceError: jest is not defined
    at Object.<anonymous> (C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\email.test.js:7:1)
    at Module._compile (node:internal/modules/cjs/loader:1706:14)
    at Object..js (node:internal/modules/cjs/loader:1839:10)
    at Module.load (node:internal/modules/cjs/loader:1441:32)
    at Function._load (node:internal/modules/cjs/loader:1263:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49

Node.js v22.20.0

```

### frontend-backend-mapping.test.js

❌ FAILED

```

node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module 'C:\Users\l\AppData\Roaming\npm\node_modules\jest\bin\jest.js'
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v22.20.0

```

```

node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module 'supertest'
Require stack:
- C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\frontend-backend-mapping.test.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Module.require (node:internal/modules/cjs/loader:1463:12)
    at require (node:internal/modules/helpers:147:16)
    at Object.<anonymous> (C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\frontend-backend-mapping.test.js:14:17)
    at Module._compile (node:internal/modules/cjs/loader:1706:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    'C:\\Users\\l\\OneDrive\\DUE\\Project\\SWP391-Plant-Monitoring-System\\plant-system\\tests\\frontend-backend-mapping.test.js'
  ]
}

Node.js v22.20.0

```

### frontend-rendering-i18n.test.js

❌ FAILED

```

node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module 'C:\Users\l\AppData\Roaming\npm\node_modules\jest\bin\jest.js'
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v22.20.0

```

```

file:///C:/Users/l/OneDrive/DUE/Project/SWP391-Plant-Monitoring-System/plant-system/tests/frontend-rendering-i18n.test.js:25
      <div data-testid="auth-provider">
      ^

SyntaxError: Unexpected token '<'
    at compileSourceTextModule (node:internal/modules/esm/utils:346:16)
    at ModuleLoader.moduleStrategy (node:internal/modules/esm/translators:107:18)
    at #translate (node:internal/modules/esm/loader:546:20)
    at afterLoad (node:internal/modules/esm/loader:596:29)
    at ModuleLoader.loadAndTranslate (node:internal/modules/esm/loader:601:12)
    at #createModuleJob (node:internal/modules/esm/loader:624:36)
    at #getJobFromResolveResult (node:internal/modules/esm/loader:343:34)
    at ModuleLoader.getModuleJobForImport (node:internal/modules/esm/loader:311:41)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:664:25)

Node.js v22.20.0

```

### language-api.test.js

❌ FAILED

```

node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module 'C:\Users\l\AppData\Roaming\npm\node_modules\jest\bin\jest.js'
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v22.20.0

```

```

node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module 'supertest'
Require stack:
- C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\language-api.test.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Module.require (node:internal/modules/cjs/loader:1463:12)
    at require (node:internal/modules/helpers:147:16)
    at Object.<anonymous> (C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\language-api.test.js:6:17)
    at Module._compile (node:internal/modules/cjs/loader:1706:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    'C:\\Users\\l\\OneDrive\\DUE\\Project\\SWP391-Plant-Monitoring-System\\plant-system\\tests\\language-api.test.js'
  ]
}

Node.js v22.20.0

```

### profile-premium.test.js

❌ FAILED

```

node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module 'C:\Users\l\AppData\Roaming\npm\node_modules\jest\bin\jest.js'
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v22.20.0

```

```

node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module 'supertest'
Require stack:
- C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\profile-premium.test.js
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Module.require (node:internal/modules/cjs/loader:1463:12)
    at require (node:internal/modules/helpers:147:16)
    at Object.<anonymous> (C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\profile-premium.test.js:13:17)
    at Module._compile (node:internal/modules/cjs/loader:1706:14) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    'C:\\Users\\l\\OneDrive\\DUE\\Project\\SWP391-Plant-Monitoring-System\\plant-system\\tests\\profile-premium.test.js'
  ]
}

Node.js v22.20.0

```

### user.test.js

❌ FAILED

```

node:internal/modules/cjs/loader:1386
  throw err;
  ^

Error: Cannot find module 'C:\Users\l\AppData\Roaming\npm\node_modules\jest\bin\jest.js'
    at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function._load (node:internal/modules/cjs/loader:1192:37)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v22.20.0

```

```

C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\user.test.js:4
jest.mock('../config/postgresql', () => ({
^

ReferenceError: jest is not defined
    at Object.<anonymous> (C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\tests\user.test.js:4:1)
    at Module._compile (node:internal/modules/cjs/loader:1706:14)
    at Object..js (node:internal/modules/cjs/loader:1839:10)
    at Module.load (node:internal/modules/cjs/loader:1441:32)
    at Function._load (node:internal/modules/cjs/loader:1263:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49

Node.js v22.20.0

```

## Frontend Tests

❌ FAILED

```

> client@0.1.0 test
> react-scripts test --watchAll=false


FAIL src/App.test.js
  ● Test suite failed to run

    Jest encountered an unexpected token

    Jest failed to parse a file. This happens e.g. when your code or its dependencies use non-standard JavaScript syntax, or when Jest is not configured to support such syntax.

    Out of the box Jest supports Babel, which will be used to transform your files into valid JS based on your Babel configuration.

    By default "node_modules" folder is ignored by transformers.

    Here's what you can do:
     • If you are trying to use ECMAScript Modules, see https://jestjs.io/docs/ecmascript-modules for how to enable it.
     • If you are trying to use TypeScript, see https://jestjs.io/docs/getting-started#using-typescript
     • To have some of your "node_modules" files transformed, you can specify a custom "transformIgnorePatterns" in your config.
     • If you need a custom transformation specify a "transform" option in your config.
     • If you simply want to mock your non-JS modules (e.g. binary assets) you can stub them out with the "moduleNameMapper" config option.

    You'll find more details and examples of these config options in the docs:
    https://jestjs.io/docs/configuration
    For information about custom transformations, see:
    https://jestjs.io/docs/code-transformation

    Details:

    C:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system\client\node_modules\axios\index.js:1
    ({"Object.<anonymous>":function(module,exports,require,__dirname,__filename,jest){import axios from './lib/axios.js';
                                                                                      ^^^^^^

    SyntaxError: Cannot use import statement outside a module

    [0m [90m 1 |[39m [90m// src/api/axiosClient.js[39m
    [31m[1m>[22m[39m[90m 2 |[39m [36mimport[39m axios [36mfrom[39m [32m"axios"[39m[33m;[39m
     [90m   |[39m [31m[1m^[22m[39m
     [90m 3 |[39m
     [90m 4 |[39m [36mconst[39m axiosClient [33m=[39m axios[33m.[39mcreate({
     [90m 5 |[39m   withCredentials[33m:[39m [36mtrue[39m[33m,[39m [90m// if backend uses cookies[39m[0m

      at Runtime.createScriptFromCode (node_modules/jest-runtime/build/index.js:1728:14)
      at Object.<anonymous> (src/api/axiosClient.js:2:1)
      at Object.<anonymous> (src/api/languageApi.js:5:1)
      at Object.<anonymous> (src/components/LanguageSwitcher.jsx:5:1)
      at Object.<anonymous> (src/components/Navbar.jsx:4:1)
      at Object.<anonymous> (src/App.jsx:2:1)
      at Object.<anonymous> (src/App.test.js:2:1)
      at TestScheduler.scheduleTests (node_modules/@jest/core/build/TestScheduler.js:333:13)
      at runJest (node_modules/@jest/core/build/runJest.js:404:19)
      at _run10000 (node_modules/@jest/core/build/cli/index.js:320:7)
      at runCLI (node_modules/@jest/core/build/cli/index.js:173:3)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        1.51 s
Ran all test suites.

```

## i18n Validation Tests

⚠️ SKIPPED: i18n validation script not found

## Summary

Backend Tests: 0 passed, 9 failed

