import {
  AutomationProject,
  PageDefinition,
  TestCase,
  TestStep,
} from "../shared/types";

export const generateJavascriptPlaywrightFramework = (
  configProject: AutomationProject,
  mode: "framework" | "pom" = "framework",
): Map<string, string> => {
  const files = new Map<string, string>();
  const project = { ...configProject };

  if (project.pages.length === 0 && project.tests.length === 0 && mode === "framework") {
    project.pages = [
      {
        id: "example-page-1",
        name: "LoginPage",
        elements: [
          {
            id: "elem-1",
            name: "UsernameInput",
            locatorType: "css",
            locatorValue: "#username",
            description: "Username field",
          },
          {
            id: "elem-2",
            name: "PasswordInput",
            locatorType: "css",
            locatorValue: "#password",
            description: "Password field",
          },
          {
            id: "elem-3",
            name: "LoginButton",
            locatorType: "css",
            locatorValue: "button[type='submit']",
            description: "Login button",
          },
        ],
      },
    ];
    project.tests = [
      {
        id: "example-test-1",
        name: "Successful login with valid credentials",
        type: "smoke",
        steps: [
          { id: "step-1", action: "navigate", description: "Navigate to login page", value: "/login" },
          { id: "step-2", action: "input", description: "Enter username", value: "admin" },
          { id: "step-3", action: "input", description: "Enter password", value: "password123" },
          { id: "step-4", action: "click", description: "Click login button", value: "" },
        ],
      },
    ];
  }

  if (mode === "pom") {
    project.pages.forEach((page) => {
      files.set(`pages/${page.name}.ts`, generatePageObject(page));
    });
    return files;
  }

  // 1. Root Config Files
  files.set("package.json", generatePackageJson(project));
  files.set("playwright.config.ts", generatePlaywrightConfig(project));
  files.set("tsconfig.json", generateTsConfig());
  files.set("README.md", generateReadme());
  files.set(
    ".gitignore",
    "node_modules/\ntest-results/\nplaywright-report/\nblob-report/\nallure-results/\nallure-report/\n.env\n",
  );

  // 2. Configuration & Utilities
  files.set("config/env.config.ts", generateEnvConfig());
  files.set("utils/logger.ts", generateLogger());
  files.set("utils/dataLoader.ts", generateDataLoader());
  files.set("test-data/users.json", generateUsersJson());

  // 3. Base Fixtures and Utils
  files.set("fixtures/base.fixture.ts", generateBaseFixture(project));

  // 3. Page Object Model (POM)
  files.set("pages/BasePage.ts", generateBasePage());
  project.pages.forEach((page) => {
    files.set(`pages/${page.name}.ts`, generatePageObject(page));
  });

  // 5. API Tests
  files.set("tests/api/example-api.spec.ts", generateApiTest());

  // 6. UI Test Files

  project.pages.forEach((page) => {
    const shortPageName = page.name.replace(/Page$/, "");
    const kebabPage = convertTitleToKebab(shortPageName);

    let pageTests = project.tests.filter(
      (t) =>
        t.steps.some((s: TestStep) =>
          s.description.toLowerCase().includes(page.name.toLowerCase()),
        ) ||
        t.name.toLowerCase().includes(page.name.toLowerCase()) ||
        t.name.toLowerCase().includes(kebabPage),
    );

    if (pageTests.length === 0 && project.pages.length === 1) {
      pageTests = [...project.tests];
    }

    if (pageTests.length === 0) return;

    const testsByType: Record<string, TestCase[]> = {};
    pageTests.forEach((test) => {
      const type = test.type || "smoke";
      if (!testsByType[type]) testsByType[type] = [];
      testsByType[type].push(test);
    });

    for (const [type, tests] of Object.entries(testsByType)) {
      if (tests.length > 0) {
        files.set(
          `tests/ui/${kebabPage}-${type}.spec.ts`,
          generateTestFile(tests, [page]),
        );
      }
    }
  });

  if (!Array.from(files.keys()).some((k) => k.startsWith("tests/ui/"))) {
    if (project.tests.length > 0) {
      const pagesToUse = project.pages.length > 0 ? project.pages : [];
      files.set(
        "tests/ui/main-flow.spec.ts",
        generateTestFile(project.tests, pagesToUse),
      );
    }
  }

  files.set(".github/workflows/playwright.yml", generateGithubAction());

  return files;
};

const generatePackageJson = (project: AutomationProject): string => `{
  "name": "${project.config.projectName.toLowerCase().replace(/\\s+/g, "-")}",
  "version": "1.0.0",
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test tests/ui",
    "test:api": "playwright test tests/api",
    "report": "allure generate allure-results --clean -o allure-report && allure open allure-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.42.0",
    "@types/node": "^20.11.24",
    "allure-commandline": "^2.27.0",
    "allure-playwright": "^2.15.1",
    "dotenv": "^16.4.5",
    "winston": "^3.12.0"
  }
}`;

const generatePlaywrightConfig = (
  project: AutomationProject,
): string => `import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
    testDir: './tests',
    timeout: ${project.config.defaultTimeout || 30000},
    fullyParallel: true,
    retries: ${project.config.retries || 0},
    reporter: [
    ['html'],
    ['junit', { outputFile: 'junit-report.xml' }],
    ['allure-playwright']
],
    use: {
    baseURL: process.env.BASE_URL || '${project.config.baseUrl}',
    headless: ${project.config.headless},
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
    projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
],
});
`;

const generateTsConfig = (): string => `{
    "compilerOptions": {
        "target": "ES2022",
            "module": "CommonJS",
                "strict": true
    }
} `;

const generateReadme = (): string =>
  `# Playwright / TypeScript Automation\n\nGenerated framework.`;

const lowerFirst = (str: string): string =>
  str ? str.charAt(0).toLowerCase() + str.slice(1) : str;
const capitalize = (str: string): string =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
const convertTitleToKebab = (title: string) =>
  title
    .split(/(?=[A-Z])/)
    .join("-")
    .toLowerCase();

const generateBaseFixture = (project: AutomationProject): string => {
  const pages = project.pages;
  const imports = pages
    .map((p) => `import { ${p.name} } from '../pages/${p.name}'; `)
    .join("\n");
  const types = pages
    .map((p) => `  ${lowerFirst(p.name)}: ${p.name}; `)
    .join("\n");
  const fixtures = pages
    .map(
      (p) => `  ${lowerFirst(p.name)}: async ({ page }, use) => {
    await use(new ${p.name}(page));
}, `,
    )
    .join("\n");

  return `import { test as baseTest } from '@playwright/test';
${imports}

type MyFixtures = {
${types}
};

export const test = baseTest.extend<MyFixtures>({
    ${fixtures}
});

export const expect = test.expect;
`;
};

const generateBasePage = (): string => `import { Page } from '@playwright/test';
export abstract class BasePage {
    constructor(public readonly page: Page) { }
}
`;

const generatePageObject = (page: PageDefinition): string => {
  const lines: string[] = [];
  lines.push(`import { Page, Locator } from '@playwright/test'; `);
  lines.push(`import { BasePage } from './BasePage'; \n`);
  lines.push(`export class $ {page.name } extends BasePage {
    `);

  page.elements.forEach((el) => {
    lines.push(`    readonly ${lowerFirst(el.name)}: Locator; `);
  });
  lines.push("");

  lines.push(`    constructor(page: Page) {
        `);
  lines.push(`        super(page); `);
  page.elements.forEach((el) => {
    lines.push(
      `        this.${lowerFirst(el.name)} = ${mapToTsLocator(el.locatorType, el.locatorValue)}; `,
    );
  });
  lines.push(`    } `);
  lines.push("");

  page.elements.forEach((el) => {
    const nameLower = el.name.toLowerCase();
    const safeName = lowerFirst(el.name);
    if (
      nameLower.includes("btn") ||
      nameLower.includes("button") ||
      nameLower.includes("submit")
    ) {
      lines.push(`    async click${capitalize(el.name)} () {
        `);
      lines.push(`        await this.${safeName}.click(); `);
      lines.push(`    }`);
    } else if (
      nameLower.includes("input") ||
      nameLower.includes("field") ||
      nameLower.includes("txt")
    ) {
      lines.push(`    async fill${capitalize(el.name)} (text: string) {
        `);
      lines.push(`        await this.${safeName}.fill(text); `);
      lines.push(`    }`);
    } else {
      lines.push(
        `    async get${capitalize(el.name)} Text(): Promise < string > {`,
      );
      lines.push(`        return await this.${safeName}.innerText(); `);
      lines.push(`    } `);
    }
  });

  lines.push(`}\n`);
  return lines.join("\n");
};

const generateTestFile = (
  tests: TestCase[],
  pages: PageDefinition[],
): string => {
  const indent = "    ";
  let content = `import { test, expect } from '../fixtures/base.fixture'; \n\n`;

  tests.forEach((testCase) => {
    content += `test('${testCase.name}', async({ page, ${pages.map((p) => lowerFirst(p.name)).join(", ")} }) => { \n`;
    testCase.steps.forEach((step, index) => {
      content += `${indent}// Step ${index + 1}: ${step.description}\n`;
      content += `${generateTsStepCode(step, pages)}\n`;
    });
    if (!content.includes("expect(")) {
      content += `\n${indent}// Basic assertion\n`;
      content += `${indent}await expect(page).toHaveTitle(/.*|.*/);\n`;
    }
    content += `});\n\n`;
  });

  return content;
};

const generateTsStepCode = (
  step: TestStep,
  pages: PageDefinition[],
): string => {
  const indent = "    ";
  const desc = step.description.toLowerCase();

  if (step.action === "input") {
    for (const pg of pages) {
      for (const el of pg.elements) {
        if (
          desc.includes(el.name.toLowerCase()) ||
          desc.includes("input") ||
          desc.includes("enter") ||
          desc.includes("fill")
        ) {
          const safeValue = (step.value || "test").replace(/"/g, '\\"');
          const methodName = `fill${capitalize(el.name)}`;
          return `${indent}await ${lowerFirst(pg.name)}.${methodName}("${safeValue}");`;
        }
      }
    }
    return `${indent}await page.fill('input', '${(step.value || "test").replace(/"/g, '\\"')}');`;
  }

  if (step.action === "click") {
    for (const pg of pages) {
      for (const el of pg.elements) {
        if (
          desc.includes(el.name.toLowerCase()) ||
          desc.includes("button") ||
          desc.includes("click")
        ) {
          const methodName = `click${capitalize(el.name)}`;
          return `${indent}await ${lowerFirst(pg.name)}.${methodName}();`;
        }
      }
    }
    return `${indent}await page.click('button');`;
  }

  if (
    step.action === "navigate" ||
    desc.includes("navigate") ||
    desc.includes("go to")
  ) {
    const url = step.value || "/";
    return `${indent}await page.goto('${url.replace(/'/g, "\\'")}');`;
  }

  return `${indent}// TODO: Implement step automatically - ${step.action}: ${step.description}`;
};

const generateGithubAction = (): string => `# CI Config\n`;

const mapToTsLocator = (locatorType: string, locatorValue: string): string => {
  const val = locatorValue.replace(/'/g, "\\'");
  switch (locatorType.toLowerCase()) {
    case "id":
      return `this.page.locator('#${val}')`;
    case "name":
      return `this.page.locator('[name="${val.replace(/"/g, '\\"')}"]')`;
    case "xpath":
      return `this.page.locator('xpath=${val}')`;
    case "css":
      return `this.page.locator('${val}')`;
    case "text":
    case "linktext":
      return `this.page.getByText('${val}')`;
    case "role":
      if (val.includes(",") || val.includes("="))
        return `this.page.locator('${val}')`;
      return `this.page.getByRole('${val}' as any)`;
    default:
      return `this.page.locator('${val}')`;
  }
};

const generateEnvConfig = (): string => `export const ENV = {
    BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
    API_URL: process.env.API_URL || 'http://localhost:3001/api',
    ENVIRONMENT: process.env.ENV || 'LOCAL',
};
`;

const generateLogger = (): string => `import winston from 'winston';

const customFormat = winston.format.printf(({ level, message, timestamp }) => {
    return \`[\${timestamp}] [\${level.toUpperCase()}]: \${message}\`;
});

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        customFormat
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'test-results/test-run.log' })
    ]
});
`;

const generateDataLoader = (): string => `import fs from 'fs';
import path from 'path';

export const loadTestData = (fileName: string) => {
    const filePath = path.join(__dirname, '..', 'test-data', fileName);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
};
`;

const generateUsersJson = (): string => `{
  "validUser": {
    "username": "admin",
    "password": "password123"
  },
  "invalidUser": {
    "username": "testuser",
    "password": "wrongpassword"
  }
}
`;

const generateApiTest =
  (): string => `import { test, expect } from '@playwright/test';

test.describe('API Testing Example', () => {

  test('GET public API user details', async ({ request }) => {
    // Note: uses Playwright's native APIRequestContext instead of UI Page
    const response = await request.get('https://reqres.in/api/users/2');
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    expect(responseBody.data.id).toBe(2);
    expect(responseBody.data.email).toContain('@');
  });

});
`;
