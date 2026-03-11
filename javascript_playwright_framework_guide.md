# Playwright + JavaScript/TypeScript Best Practices & Framework Architecture

This guide synthesizes best practices from official documentation, GitHub repositories, and industry standards for building robust, scalable, and maintainable end-to-end testing frameworks using Playwright and Node.js.

## 1. Project Structure & Architecture

A well-structured repository is critical for maintaining tests as the application scales.

```text
├── playwright.config.ts    # Centralized Playwright configuration
├── package.json
├── package-lock.json
├── .github/
│   └── workflows/
│       └── playwright.yml  # CI/CD pipelines (GitHub Actions)
├── tests/
│   ├── e2e/                # End-to-end test suites
│   ├── api/                # API tests
│   └── visual/             # Visual regression tests
├── pages/                  # Page Object Model (POM) classes
│   ├── BasePage.ts         # Common methods (click, type, wait)
│   ├── LoginPage.ts
│   └── DashboardPage.ts
├── fixtures/               # Custom fixtures for setup/teardown
│   ├── auth.fixture.ts     # Handles login state
│   └── db.fixture.ts       # Database seeding/cleanup
├── utils/                  # Helper functions
│   ├── envHelper.ts        # Environment variable management
│   └── dataProvider.ts     # Test data loaders (JSON, CSV)
├── data/                   # Static test data
│   └── users.json
└── test-results/           # (GitIgnored) Playwright output and reports
```

## 2. Page Object Model (POM) Best Practices

The POM design pattern abstracts web pages into classes, making tests more readable and UI changes easier to manage.

### Do's:
*   **Encapsulate Selectors:** Locate all elements within the page class. Do not expose locators directly in the test.
*   **Return Actions:** Methods should represent user actions (e.g., `login(user, pass)`) rather than literal clicks (`clickEmail()`, `clickPassword()`).
*   **Composition over Inheritance:** For complex pages, compose smaller component objects (like `HeaderComponent`, `SidebarComponent`) within your main Page Object.
*   **Use `async/await` Properly:** Ensure all Playwright actions are awaited.

### Don'ts:
*   **No Assertions in POM:** Assertions (e.g., `expect(page).toHaveTitle()`) belong in the **test files**, not inside the Page Objects. The only exception is quick sanity checks inside a method like `verifyOnPage()`.

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Log in' });
  }

  async navigate() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

## 3. Locators: Resiliency is Key

Using robust locators prevents "flaky" tests caused by minor UI tweaks.

*   **Priority 1: User-Facing Locators.** Use Playwright's built-in role/text locators. They mimic how real users find elements.
    *   `page.getByRole('button', { name: 'Submit' })`
    *   `page.getByText('Welcome back')`
    *   `page.getByLabel('Password')`
*   **Priority 2: Test IDs.** If elements lack clear semantic roles, add and use `data-testid`.
    *   `page.getByTestId('submit-btn')`
*   **Avoid:** CSS classes and XPath unless absolutely necessary, as they are highly coupled to the DOM structure and prone to breaking.

## 4. Test Isolation & Fixtures

Playwright shines with its built-in fixture system. Tests should be isolated; one test's failure should not affect another.

*   **State Management:** Do not sequentially rely on state. If Test B needs a user created in Test A, Test B should create its own user or use an API to set up the state.
*   **Custom Fixtures:** Use fixtures to encapsulate setup and teardown logic.

```typescript
// fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

type AuthFixtures = {
  loginPage: LoginPage;
  loggedInPage: any; // Setup authenticated state
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  loggedInPage: async ({ page }, use) => {
    // Example: Inject auth token via API or quickly login via UI
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login('admin', 'password');
    // Yield the page to the test
    await use(page);
  }
});
```

*   **Global Setup for Auth:** If login is slow, use Playwright's `storageState` feature to authenticate once in a `globalSetup` script, save the cookies/localStorage to a JSON file, and have all subsequent tests reuse that state.

## 5. Playwright Configuration (`playwright.config.ts`)

A robust configuration optimizes execution speed and error capture.

*   **Fully Parallel:** Set `fullyParallel: true` to run all tests simultaneously (if tests are properly isolated).
*   **Retries & Traces:** Configure retries for CI and always record a trace on the first retry. Traces are invaluable for debugging headless CI failures.
*   **Projects:** Define multiple projects to run across different browsers (Chromium, Firefox, WebKit) or viewports (Mobile Safari).

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
      ['list'],
      ['html', { open: 'never' }],
      ['allure-playwright'] // Allure integration
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
```

## 6. CI/CD Integration (GitHub Actions)

Running tests automatically on every Pull Request provides immediate feedback.

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests
on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: lts/*
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    - name: Run Playwright tests
      run: npx playwright test
    - name: Upload Report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

## 7. Advanced: Allure Reporting

While Playwright's built-in HTML reporter is excellent, Allure provides advanced analytics, trend tracking, and executive-level dashboards.

**Setup Requirements:**
1.  `npm install -D allure-playwright allure-commandline`
2.  Add to reporters in config: `reporter: [['allure-playwright']]`
3.  Add decorators in tests to categorize reports:

```typescript
import { test, expect } from '@playwright/test';
import { allure } from 'allure-playwright';

test('Verify successful login', async ({ page }) => {
    await allure.epic('Authentication');
    await allure.feature('Login');
    await allure.story('Valid Credentials');
    await allure.severity('critical');

    // ... test logic ...
});
```
4. Generate report: `npx allure generate ./allure-results --clean`
5. Open report: `npx allure open ./allure-report`

## Summary Checklist for Code Reviews

- [ ] Does the test use `page.getByRole()` or `data-testid` instead of XPath/CSS?
- [ ] Are all UI interactions hidden behind Page Object methods?
- [ ] Are assertions made in the test file, not the Page Object?
- [ ] Is the test isolated (doesn't depend on the previous test's state)?
- [ ] Is `await` used before every Playwright action?
- [ ] Are hardcoded waits (`page.waitForTimeout()`) removed in favor of auto-waiting (`waitForSelector()`, web assertions)?
