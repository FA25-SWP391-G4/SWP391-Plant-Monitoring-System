# Screenshots Directory

This directory stores screenshots captured during E2E test execution.

Screenshots are automatically generated when tests fail or at specific checkpoints.

## Naming Convention

- `{testName}_{timestamp}.png`
- Example: `userLogin_2025-11-13_14-30-45.png`

## Usage

Screenshots are created using the `takeScreenshot()` helper function from `helpers/seleniumHelpers.js`.

```javascript
await takeScreenshot(driver, 'test-failure.png');
```
