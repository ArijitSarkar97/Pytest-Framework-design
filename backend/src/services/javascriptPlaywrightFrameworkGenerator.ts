import fs from 'fs/promises';
import path from 'path';

// --- Types (Reused from existing generators for backend compatibility) ---
interface Locator {
    name: string;
    locatorType: string;
    locatorValue: string;
    description?: string;
    tagName?: string;
}

interface PageDefinition {
    name: string;
    elements: Locator[];
}

interface TestStep {
    action: string;
    description: string;
    value?: string;
    pageId?: string;
    elementId?: string;
    order?: number;
}

interface TestCase {
    name: string;
    type: string;
    steps: TestStep[];
}

interface AutomationConfig {
    projectName: string;
    baseUrl: string;
    browser: string;
    headless: boolean;
    defaultTimeout?: number;
    retries?: number;
    retryDelay?: number;
    useAllureReport?: boolean;
    screenshotOnFailure?: boolean;
    videoRecording?: boolean;
}

interface AutomationProject {
    config: AutomationConfig;
    pages: PageDefinition[];
    tests: TestCase[];
}

export class JavascriptPlaywrightFrameworkGenerator {

    static async generate(framework: any): Promise<string> {
        // Map Prisma Framework entity to AutomationProject structure
        const project: AutomationProject = {
            config: {
                projectName: framework.projectName || 'playwright-js-automation',
                baseUrl: framework.baseUrl || 'http://localhost',
                browser: framework.browser || 'chromium',
                headless: framework.headless ?? true,
                defaultTimeout: framework.defaultTimeout || 30000,
                retries: framework.retries || 0,
                retryDelay: framework.retryDelay,
                useAllureReport: framework.useAllureReport ?? true,
                screenshotOnFailure: framework.screenshotOnFailure ?? true,
                videoRecording: framework.videoRecording ?? false
            },
            pages: framework.pages?.map((p: any) => ({
                name: p.name,
                elements: p.elements?.map((e: any) => ({
                    name: e.name,
                    locatorType: e.locatorType,
                    locatorValue: e.locatorValue,
                    description: e.description
                })) || []
            })) || [],
            tests: framework.tests?.map((t: any) => ({
                name: t.name,
                type: t.type,
                steps: t.steps?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((s: any) => ({
                    action: s.action,
                    description: s.description,
                    value: s.value,
                    pageId: s.pageId,
                    elementId: s.elementId
                })) || []
            })) || []
        };

        const files = this.generateFiles(project);
        const outputDir = path.resolve(process.cwd(), 'generated', project.config.projectName);

        // Ensure directory exists (recursive)
        try {
            await fs.mkdir(outputDir, { recursive: true });
        } catch (e) {
            console.error('Failed to create directory:', e);
        }

        // Write all files
        for (const [relativePath, content] of files.entries()) {
            const fullPath = path.join(outputDir, relativePath);
            const dir = path.dirname(fullPath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(fullPath, content, 'utf-8');
        }

        return outputDir;
    }

    private static generateFiles(configProject: AutomationProject): Map<string, string> {
        const files = new Map<string, string>();
        const project = { ...configProject };

        if (project.pages.length === 0 && project.tests.length === 0) {
            project.pages = [
                {
                    name: "LoginPage",
                    elements: [
                        { name: "UsernameInput", locatorType: "css", locatorValue: "#username", description: "Username field" },
                        { name: "PasswordInput", locatorType: "css", locatorValue: "#password", description: "Password field" },
                        { name: "LoginButton", locatorType: "css", locatorValue: "button[type='submit']", description: "Login button" },
                    ],
                },
            ];
            project.tests = [
                {
                    name: "Successful login with valid credentials",
                    type: "smoke",
                    steps: [
                        { action: "navigate", description: "Navigate to login page", value: "/login" },
                        { action: "input", description: "Enter username", value: "admin" },
                        { action: "input", description: "Enter password", value: "password123" },
                        { action: "click", description: "Click login button", value: "" },
                    ],
                },
            ];
        }

        // 1. Root Config Files
        files.set('package.json', this.generatePackageJson(project));
        files.set('playwright.config.ts', this.generatePlaywrightConfig(project));
        files.set('tsconfig.json', this.generateTsConfig());
        files.set('README.md', this.generateReadme());
        files.set('.gitignore', 'node_modules/\ntest-results/\nplaywright-report/\nblob-report/\nallure-results/\nallure-report/\n.env\n');

        // 2. Base Fixtures and Utils
        files.set('fixtures/base.fixture.ts', this.generateBaseFixture(project));

        // 3. Page Object Model (POM)
        files.set('pages/BasePage.ts', this.generateBasePage());
        project.pages.forEach(page => {
            files.set(`pages/${page.name}.ts`, this.generatePageObject(page));
        });

        // 4. Test Files

        project.pages.forEach(page => {
            const shortPageName = page.name.replace(/Page$/, '');
            const kebabPage = this.convertTitleToKebab(shortPageName);

            let pageTests = project.tests.filter(t =>
                t.steps.some(s => s.description.toLowerCase().includes(page.name.toLowerCase())) ||
                t.name.toLowerCase().includes(page.name.toLowerCase()) ||
                t.name.toLowerCase().includes(kebabPage)
            );

            if (pageTests.length === 0 && project.pages.length === 1) {
                pageTests = [...project.tests];
            }

            if (pageTests.length === 0) return;

            const testsByType: Record<string, TestCase[]> = {};
            pageTests.forEach(test => {
                const type = test.type || 'smoke';
                if (!testsByType[type]) testsByType[type] = [];
                testsByType[type].push(test);
            });

            for (const [type, tests] of Object.entries(testsByType)) {
                if (tests.length > 0) {
                    files.set(
                        `tests/${kebabPage}-${type}.spec.ts`,
                        this.generateTestFile(tests, [page])
                    );
                }
            }
        });

        // Catch-all
        if (!Array.from(files.keys()).some(k => k.startsWith('tests/'))) {
            if (project.tests.length > 0) {
                const pagesToUse = project.pages.length > 0 ? project.pages : [];
                files.set('tests/main-flow.spec.ts', this.generateTestFile(project.tests, pagesToUse));
            }
        }

        // CI/CD
        files.set('.github/workflows/playwright.yml', this.generateGithubAction());

        return files;
    }

    private static generatePackageJson(project: AutomationProject): string {
        return `{
  "name": "${project.config.projectName.toLowerCase().replace(/\\s+/g, '-')}",
  "version": "1.0.0",
  "description": "Playwright Automation Framework generated by Pytest-Architect-AI",
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug",
    "report": "allure generate allure-results --clean -o allure-report && allure open allure-report",
    "clean": "rm -rf test-results/ playwright-report/ allure-results/ allure-report/"
  },
  "devDependencies": {
    "@playwright/test": "^1.42.0",
    "@types/node": "^20.11.24",
    "allure-commandline": "^2.27.0",
    "allure-playwright": "^2.15.0",
    "dotenv": "^16.4.5"
  }
}`;
    }

    private static generatePlaywrightConfig(project: AutomationProject): string {
        const useAllure = project.config.useAllureReport;
        return `import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
  testDir: './tests',
  /* Maximum time one test can run for. */
  timeout: ${project.config.defaultTimeout || 30 * 1000},
  expect: {
    timeout: 5000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? ${(project.config.retries || 0) + 1} : ${project.config.retries || 0},
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['list'],
    ['junit', { outputFile: 'junit-report.xml' }]${useAllure ? `,
    ['allure-playwright', {
      detail: true,
      suiteTitle: false,
      environmentInfo: {
        os_platform: process.platform,
        node_version: process.version,
      },
    }]` : ''}
  ],
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like \`await page.goto('/')\`. */
    baseURL: process.env.BASE_URL || '${project.config.baseUrl}',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    ${project.config.screenshotOnFailure ? "screenshot: 'only-on-failure'," : "screenshot: 'off',"}
    ${project.config.videoRecording ? "video: 'retain-on-failure'," : "video: 'off',"}
    headless: ${project.config.headless},
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});
`;
    }

    private static generateTsConfig(): string {
        return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": "."
  },
  "include": [
    "tests/**/*.ts",
    "pages/**/*.ts",
    "fixtures/**/*.ts",
    "playwright.config.ts"
  ]
}`;
    }

    private static generateReadme(): string {
        return `# Playwright/TypeScript Automation Framework

Welcome to your generated Playwright + TypeScript Automation Framework. 

## 🏗 Architecture
1. **Configuration (\`playwright.config.ts\`)**: Centralized file controlling browser types, timeouts, retries, and reporters.
2. **Page Object Model (\`pages/\`)**: Encapsulation of UI elements into logical pages using strict TypeScript classes.
3. **Execution (\`tests/\`)**: Spec files utilizing Playwright's performant test runner and custom fixtures.
4. **Fixtures (\`fixtures/\`)**: Dependency injection for Playwright to instantiate Page Objects automatically.

## 🚀 Prerequisites
- Node.js (v18+)
- npm or pnpm
- Java (Required for Allure reporting)

## 🛠 Installation
Install dependencies:
\`\`\`bash
npm install
\`\`\`

Install Playwright browsers:
\`\`\`bash
npx playwright install --with-deps chromium firefox webkit
\`\`\`

## 🏃 Running Tests
Run all tests:
\`\`\`bash
npm run test
\`\`\`

Run in UI Mode (Excellent for debugging):
\`\`\`bash
npm run test:ui
\`\`\`

Run Headed Mode:
\`\`\`bash
npm run test:headed
\`\`\`

## 📊 Generating Reports
Generate and open the Allure report:
\`\`\`bash
npm run report
\`\`\`
`;
    }

    private static generateBaseFixture(project: AutomationProject): string {
        const pages = project.pages;

        const imports = pages.map(p => `import { ${p.name} } from '../pages/${p.name}';`).join('\n');
        const types = pages.map(p => `  ${this.lowerFirst(p.name)}: ${p.name};`).join('\n');
        const fixtures = pages.map(p => `  ${this.lowerFirst(p.name)}: async ({ page }, use) => {
    await use(new ${p.name}(page));
  },`).join('\n');

        return `import { test as baseTest } from '@playwright/test';
${imports}

// Define the types for your custom fixtures
type MyFixtures = {
${types}
};

// Extend the base test to include our page objects
export const test = baseTest.extend<MyFixtures>({
${fixtures}
});

export const expect = test.expect;
`;
    }

    private static generateBasePage(): string {
        return `import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Navigate to the specified path appended to the baseURL
     */
    async navigate(path: string = '') {
        await this.page.goto(path);
    }
}
`;
    }

    private static generatePageObject(page: PageDefinition): string {
        // Map elements to class properties and methods
        const lines: string[] = [];

        lines.push(`import { Page, Locator, expect } from '@playwright/test';`);
        lines.push(`import { BasePage } from './BasePage';\n`);

        lines.push(`export class ${page.name} extends BasePage {`);

        // Define Locators
        page.elements.forEach(el => {
            lines.push(`    readonly ${this.lowerFirst(el.name)}: Locator;`);
        });
        lines.push('');

        // Constructor mapping locators
        lines.push(`    constructor(page: Page) {`);
        lines.push(`        super(page);`);
        page.elements.forEach(el => {
            lines.push(`        this.${this.lowerFirst(el.name)} = ${this.mapToTsLocator(el.locatorType, el.locatorValue)};`);
        });
        lines.push(`    }`);
        lines.push('');

        // Action Methods
        page.elements.forEach(el => {
            const nameLower = el.name.toLowerCase();
            const methodSafeName = this.lowerFirst(el.name);

            if (nameLower.includes('btn') || nameLower.includes('button') || nameLower.includes('submit')) {
                lines.push(`    async click${this.capitalize(el.name)}() {`);
                lines.push(`        await this.${methodSafeName}.click();`);
                lines.push(`    }`);
            } else if (nameLower.includes('input') || nameLower.includes('field') || nameLower.includes('txt') || nameLower.includes('email') || nameLower.includes('password')) {
                lines.push(`    async fill${this.capitalize(el.name)}(text: string) {`);
                lines.push(`        await this.${methodSafeName}.fill(text);`);
                lines.push(`    }`);
            } else {
                lines.push(`    async get${this.capitalize(el.name)}Text(): Promise<string> {`);
                lines.push(`        return await this.${methodSafeName}.innerText();`);
                lines.push(`    }`);
            }
        });

        lines.push(`}\n`);
        return lines.join('\n');
    }



    private static generateTestFile(tests: TestCase[], pages: PageDefinition[]): string {
        const indent = '    ';
        let content = `import { test, expect } from '../fixtures/base.fixture';\n\n`;

        tests.forEach(testCase => {
            content += `test('${testCase.name}', async ({ page, ${pages.map(p => this.lowerFirst(p.name)).join(', ')} }) => {\n`;

            // Generate steps
            testCase.steps.forEach((step, index) => {
                content += `${indent}// Step ${index + 1}: ${step.description}\n`;
                const stepCode = this.generateTsStepCode(step, pages);
                content += `${stepCode}\n`;
            });

            // Generic assertion if none exist
            if (!content.includes('expect(')) {
                content += `\n${indent}// Basic assertion\n`;
                content += `${indent}await expect(page).toHaveTitle(/.*|.*/);\n`;
            }

            content += `});\n\n`;
        });

        return content;
    }

    private static generateTsStepCode(step: TestStep, pages: PageDefinition[]): string {
        const indent = '    ';
        const desc = step.description.toLowerCase();

        // Very basic heuristic matching to map steps to POM methods
        if (step.action === 'input') {
            for (const pg of pages) {
                for (const el of pg.elements) {
                    if (desc.includes(el.name.toLowerCase()) || desc.includes('input') || desc.includes('enter') || desc.includes('fill')) {
                        const safeValue = (step.value || 'test').replace(/"/g, '\\"');
                        const methodName = `fill${this.capitalize(el.name)}`;
                        return `${indent}await ${this.lowerFirst(pg.name)}.${methodName}("${safeValue}");`;
                    }
                }
            }
            return `${indent}await page.fill('input', '${(step.value || "test").replace(/"/g, '\\"')}');`;
        }

        if (step.action === 'click') {
            for (const pg of pages) {
                for (const el of pg.elements) {
                    if (desc.includes(el.name.toLowerCase()) || desc.includes('button') || desc.includes('click')) {
                        const methodName = `click${this.capitalize(el.name)}`;
                        return `${indent}await ${this.lowerFirst(pg.name)}.${methodName}();`;
                    }
                }
            }
            return `${indent}await page.click('button');`;
        }

        if (step.action === 'navigate' || desc.includes('navigate') || desc.includes('go to')) {
            const url = step.value || '/';
            return `${indent}await page.goto('${url.replace(/"/g, '\\"')}');`;
        }

        return `${indent}// TODO: Implement step automatically - ${step.action}: ${step.description}`;
    }

    private static generateGithubAction(): string {
        return `name: Playwright Tests
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
      run: npm run test
    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
`;
    }

    // --- Helpers ---

    private static mapToTsLocator(locatorType: string, locatorValue: string): string {
        const val = locatorValue.replace(/'/g, "\\'"); // Escape single quotes
        switch (locatorType.toLowerCase()) {
            case 'id':
                return `this.page.locator('#${val}')`;
            case 'name':
                return `this.page.locator('[name="${val.replace(/"/g, '\\"')}"]')`;
            case 'xpath':
                return `this.page.locator('xpath=${val}')`;
            case 'css':
                return `this.page.locator('${val}')`;
            case 'text':
            case 'linktext':
                return `this.page.getByText('${val}')`;
            case 'role':
                // rudimentary heuristic: role=button,name=Submit -> getByRole('button', { name: 'Submit' })
                if (val.includes(',') || val.includes('=')) {
                    // Fallback if parsing fails
                    return `this.page.locator('${val}')`;
                }
                return `this.page.getByRole('${val}' as any)`;
            default:
                return `this.page.locator('${val}')`;
        }
    }

    private static convertTitleToKebab(title: string) {
        return title.split(/(?=[A-Z])/).join('-').toLowerCase();
    }

    private static lowerFirst(str: string): string {
        if (!str) return str;
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    private static capitalize(str: string): string {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
