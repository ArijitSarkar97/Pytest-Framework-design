import fs from 'fs/promises';
import path from 'path';

// --- Types ---
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

export class PlaywrightFrameworkGenerator {

    static async generate(framework: any): Promise<string> {
        // Map Prisma Framework entity to AutomationProject structure
        const project: AutomationProject = {
            config: {
                projectName: framework.projectName || 'pytest-automation',
                baseUrl: framework.baseUrl,
                browser: framework.browser,
                headless: framework.headless,
                defaultTimeout: framework.defaultTimeout,
                retries: framework.retries,
                retryDelay: framework.retryDelay,
                useAllureReport: framework.useAllureReport,
                screenshotOnFailure: framework.screenshotOnFailure,
                videoRecording: framework.videoRecording
            },
            pages: framework.pages.map((p: any) => ({
                name: p.name,
                elements: p.elements.map((e: any) => ({
                    name: e.name,
                    locatorType: e.locatorType,
                    locatorValue: e.locatorValue,
                    description: e.description
                }))
            })),
            tests: framework.tests.map((t: any) => ({
                name: t.name,
                type: t.type,
                steps: t.steps.sort((a: any, b: any) => a.order - b.order).map((s: any) => ({
                    action: s.action,
                    description: s.description,
                    value: s.value,
                    pageId: s.pageId,
                    elementId: s.elementId
                }))
            }))
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

    private static generateFiles(project: AutomationProject): Map<string, string> {
        const files = new Map<string, string>();

        // 1. Root Config Files
        files.set('requirements.txt', `pytest==8.0.0\npytest-playwright==0.4.4\nplaywright==1.41.0\nallure-pytest==2.13.2\ncolorlog==6.8.2\npytest-xdist==3.5.0\nPyYAML==6.0.1`);

        files.set('README.md', `# Pytest Automation Framework

Welcome to your generated Pytest + Playwright Automation Framework. 

## 🏗 Architecture
1. **Configuration (\`config/config.yaml\`)**: Centralized YAML file controlling browser types, timeouts, and environments.
2. **Page Object Model (\`pages/\`)**: Clean encapsulation of UI elements into logical pages.
3. **Execution (\`tests/\`)**: Pytest scripts utilizing powerful \`@pytest.fixture\` and native Playwright browser contexts.
4. **Visual Flow (\`architecture_flow.html\`)**: Open this included HTML file in your browser to view a sleek dashboard of how this framework operates.

## 🚀 Prerequisites
- Python 3.12+
- Google Chrome, Firefox, or Edge installed on your machine
- [Allure Commandline](https://docs.qameta.io/allure/#_installing_a_commandline) (Optional, for generating visual test reports)

## 🛠 Installation
Create a virtual environment:
\`\`\`bash
python3 -m venv venv
source venv/bin/activate
\`\`\`

Install dependencies:
\`\`\`bash
pip install -r requirements.txt
playwright install chromium firefox msedge
\`\`\`

## 🏃 Running Tests
Run all tests in Chrome (default):
\`\`\`bash
pytest tests/
\`\`\`

Run in Headless mode:
\`\`\`bash
pytest tests/ --headless
\`\`\`

Run on Firefox or Edge:
\`\`\`bash
pytest tests/ --browser=firefox
pytest tests/ --browser=edge
\`\`\`

Run multiple tests in parallel (xdist):
\`\`\`bash
pytest tests/ -n auto
\`\`\`

## 📊 Generating Reports
Generate a clean visual dashboard of your test runs using Allure:
\`\`\`bash
allure serve allure-results
\`\`\`
`);
        files.set('architecture_flow.html', `<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Pytest Framework Architecture Flow</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "primary": "#25aff4",
                        "accent-success": "#00ff88",
                        "background-light": "#f5f7f8",
                        "background-dark": "#0a0e10",
                        "surface-dark": "#161e22",
                    },
                    fontFamily: {
                        "display": ["Space Grotesk", "sans-serif"]
                    },
                    borderRadius: {"DEFAULT": "0.5rem", "lg": "1rem", "xl": "1.5rem", "full": "9999px"},
                },
            },
        }
    </script>
<style>
        body {
            font-family: 'Space Grotesk', sans-serif;
            -webkit-tap-highlight-color: transparent;
        }
        .glass {
            background: rgba(37, 175, 244, 0.05);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(37, 175, 244, 0.1);
        }
        .grid-bg {
            background-image: radial-gradient(circle at 2px 2px, rgba(37, 175, 244, 0.05) 1px, transparent 0);
            background-size: 24px 24px;
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
<div class="flex-1 flex flex-col overflow-y-auto grid-bg pb-24">
<!-- Header -->
<header class="sticky top-0 z-10 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 border-b border-slate-200 dark:border-slate-800">
<div class="flex size-10 shrink-0 items-center justify-center text-primary">
<span class="material-symbols-outlined">arrow_back</span>
</div>
<div class="flex-1 px-3">
<h1 class="text-lg font-bold leading-tight tracking-tight">Pytest Architecture</h1>
<p class="text-xs text-slate-500 dark:text-slate-400">Framework Topology v2.4</p>
</div>
<div class="flex size-10 items-center justify-end text-primary">
<span class="material-symbols-outlined">info</span>
</div>
</header>
<!-- Main Flow Container -->
<main class="flex-1 px-4 py-6 space-y-6">
<!-- Flow Node 1 -->
<div class="relative group">
<div class="glass p-5 rounded-xl border-l-4 border-primary shadow-lg shadow-primary/5">
<div class="flex items-start gap-4">
<div class="bg-primary/20 p-3 rounded-lg text-primary">
<span class="material-symbols-outlined text-3xl">settings_input_component</span>
</div>
<div class="flex-1">
<h3 class="text-primary font-bold text-lg">User Configuration (YAML)</h3>
<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Defines environment variables, hooks, and global setup parameters.</p>
</div>
</div>
</div>
<!-- Connector Arrow -->
<div class="flex justify-center my-2">
<div class="w-1 h-8 bg-gradient-to-b from-primary to-accent-success/50 rounded-full"></div>
</div>
</div>
<!-- Flow Node 2 -->
<div class="relative group">
<div class="bg-surface-dark/40 border border-accent-success/30 p-5 rounded-xl shadow-lg shadow-accent-success/5">
<div class="flex items-start gap-4">
<div class="bg-accent-success/20 p-3 rounded-lg text-accent-success">
<span class="material-symbols-outlined text-3xl">terminal</span>
</div>
<div class="flex-1">
<h3 class="text-accent-success font-bold text-lg">Pytest Execution Engine</h3>
<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Core logic managing discovery, fixtures, and parallel execution threads.</p>
<div class="mt-3 flex gap-2">
<span class="text-[10px] px-2 py-0.5 rounded bg-accent-success/10 border border-accent-success/20 text-accent-success">conftest.py</span>
<span class="text-[10px] px-2 py-0.5 rounded bg-accent-success/10 border border-accent-success/20 text-accent-success">pytest-xdist</span>
</div>
</div>
</div>
</div>
<!-- Connector Arrow -->
<div class="flex justify-center my-2">
<div class="w-1 h-8 bg-gradient-to-b from-accent-success/50 to-primary/50 rounded-full"></div>
</div>
</div>
<!-- Flow Node 3 -->
<div class="relative group">
<div class="glass p-5 rounded-xl border border-primary/20 shadow-lg">
<div class="flex items-start gap-4">
<div class="bg-primary/20 p-3 rounded-lg text-primary">
<span class="material-symbols-outlined text-3xl">layers</span>
</div>
<div class="flex-1">
<h3 class="text-primary font-bold text-lg">Selenium 4 (POM)</h3>
<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Abstraction layer for UI elements using Page Object Model design.</p>
</div>
</div>
</div>
<!-- Connector Arrow -->
<div class="flex justify-center my-2">
<div class="w-1 h-8 bg-gradient-to-b from-primary/50 to-slate-500 rounded-full"></div>
</div>
</div>
<!-- Flow Node 4 -->
<div class="relative group">
<div class="bg-surface-dark border border-slate-700/50 p-5 rounded-xl shadow-lg">
<div class="flex items-start gap-4">
<div class="bg-slate-700/30 p-3 rounded-lg text-slate-300">
<span class="material-symbols-outlined text-3xl">cloud_done</span>
</div>
<div class="flex-1">
<h3 class="text-slate-100 font-bold text-lg">Headless Browsers</h3>
<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Cross-browser execution for Chrome, Firefox, and Edge.</p>
<div class="flex gap-4 mt-4">
<div class="bg-slate-800 p-2 rounded-lg border border-slate-700">
<span class="material-symbols-outlined text-xl opacity-80">public</span>
</div>
<div class="bg-slate-800 p-2 rounded-lg border border-slate-700">
<span class="material-symbols-outlined text-xl opacity-80">language</span>
</div>
<div class="bg-slate-800 p-2 rounded-lg border border-slate-700">
<span class="material-symbols-outlined text-xl opacity-80">web</span>
</div>
</div>
</div>
</div>
</div>
<!-- Connector Arrow -->
<div class="flex justify-center my-2">
<div class="w-1 h-8 bg-gradient-to-b from-slate-500 to-primary rounded-full"></div>
</div>
</div>
<!-- Flow Node 5 -->
<div class="relative group">
<div class="glass p-5 rounded-xl border-t-4 border-primary shadow-xl shadow-primary/20">
<div class="flex items-start gap-4">
<div class="bg-primary p-3 rounded-lg text-white">
<span class="material-symbols-outlined text-3xl">bar_chart</span>
</div>
<div class="flex-1">
<h3 class="text-primary font-bold text-lg">Allure Reporting</h3>
<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Visual test analysis, history tracking, and failure screenshots.</p>
</div>
</div>
</div>
</div>
<!-- Summary Stats -->
<div class="pt-8 pb-4">
<h2 class="text-slate-900 dark:text-slate-100 text-lg font-bold mb-4 flex items-center gap-2">
<span class="material-symbols-outlined text-primary">analytics</span>
                    Performance Overview
                </h2>
<div class="grid grid-cols-2 gap-3">
<div class="bg-surface-dark border border-slate-800 p-4 rounded-xl">
<p class="text-xs text-slate-400 mb-1">Total Tests</p>
<p class="text-2xl font-bold">1,248</p>
<span class="text-accent-success text-xs font-medium flex items-center mt-1">
<span class="material-symbols-outlined text-sm">trending_up</span>
                            +12.4%
                        </span>
</div>
<div class="bg-surface-dark border border-slate-800 p-4 rounded-xl">
<p class="text-xs text-slate-400 mb-1">Stability</p>
<p class="text-2xl font-bold">99.2%</p>
<span class="text-primary text-xs font-medium flex items-center mt-1">
<span class="material-symbols-outlined text-sm">check_circle</span>
                            Healthy
                        </span>
</div>
</div>
</div>
</main>
</div>
<!-- Bottom Nav Bar -->
<nav class="fixed bottom-0 w-full bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 px-2 pb-6 pt-2 z-20">
<div class="max-w-md mx-auto flex justify-around items-center">
<a class="flex flex-col items-center gap-1 text-primary" href="#">
<span class="material-symbols-outlined fill-[1]">dashboard</span>
<span class="text-[10px] font-medium font-display">Dashboard</span>
</a>
<a class="flex flex-col items-center gap-1 text-slate-500" href="#">
<span class="material-symbols-outlined">play_circle</span>
<span class="text-[10px] font-medium font-display">Execute</span>
</a>
<a class="flex flex-col items-center gap-1 text-slate-500" href="#">
<span class="material-symbols-outlined">description</span>
<span class="text-[10px] font-medium font-display">Logs</span>
</a>
<a class="flex flex-col items-center gap-1 text-slate-500" href="#">
<span class="material-symbols-outlined">settings</span>
<span class="text-[10px] font-medium font-display">Settings</span>
</a>
</div>
</nav>
</body></html>`);

        files.set('pytest.ini', `[pytest]\naddopts = --alluredir=./allure-results --clean-alluredir --log-cli-level=INFO\nlog_cli = true\nlog_cli_format = %(asctime)s [%(levelname)8s] %(message)s (%(filename)s:%(lineno)s)\nlog_cli_date_format = %Y-%m-%d %H:%M:%S\npython_files = test_*.py\nmarkers =\n    accessibility: Accessibility tests\n    functional: Functional tests\n    integration: Integration tests\n    performance: Performance tests\n    regression: Regression tests\n    security: Security tests\n    smoke: Smoke tests\n    negative: Negative tests`);

        files.set('config/config.yaml', `
browser:
  default: "${project.config.browser === 'all' ? 'chrome' : (project.config.browser || 'chrome')}"
  headless: ${project.config.headless ?? true}
  implicit_wait: 10
  page_load_timeout: 30

environments:
  dev:
    base_url: "${project.config.baseUrl}"
    username: "admin"
    password: "password"
`);



        // 2. Conftest
        files.set('conftest.py', this.generateConftest(project));

        // 3. Utilities
        files.set('utils/__init__.py', '');
        files.set('utils/driver_factory.py', this.generateDriverFactory());
        files.set('utils/data_reader.py', this.generateDataReader());
        files.set('utils/logger.py', this.generateLogger());
        files.set('config/environment.py', this.generateEnvironment());

        // 4. Pages
        files.set('pages/__init__.py', '');
        files.set('pages/base_page.py', this.generateBasePage(false));
        project.pages.forEach(page => {
            files.set(`pages/${this.convertTitleToSnake(page.name)}.py`, this.generatePageObject(page));
        });

        // 5. Tests
        files.set('tests/__init__.py', '');
        files.set('tests/base_test.py', this.generateBaseTest());

        if (project.pages.length === 0) {
            // Fallback if no pages
        }

        project.pages.forEach(page => {
            const snakePage = this.convertTitleToSnake(page.name);
            const shortPageName = page.name.replace(/Page$/, '');
            const shortSnake = this.convertTitleToSnake(shortPageName);

            let pageTests = project.tests.filter(t =>
                t.steps.some(s => s.description.toLowerCase().includes(page.name.toLowerCase())) ||
                t.name.toLowerCase().includes(page.name.toLowerCase()) ||
                t.name.includes(snakePage)
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
                        `tests/test_${type}_${shortSnake}.py`,
                        this.generateTestFile(tests, [page], project.config.projectName)
                    );
                }
            }
        });

        // Catch-all
        if (!Array.from(files.keys()).some(k => k.startsWith('tests/test_'))) {
            if (project.tests.length > 0) {
                // If we possess pages, use them, else empty array
                const pagesToUse = project.pages.length > 0 ? project.pages : [];
                files.set('tests/test_main_flow.py', this.generateTestFile(project.tests, pagesToUse, project.config.projectName));
            }
        }

        return files;
    }

    private static mapToPlaywrightLocator(locatorType: string, locatorValue: string): string {
        const val = locatorValue.replace(/"/g, '\\"');
        switch (locatorType.toLowerCase()) {
            case 'id': return `self.page.locator("#${val}")`;
            case 'name': return `self.page.locator("[name='${val}']")`;
            case 'xpath': return `self.page.locator("xpath=${val}")`;
            case 'linktext': return `self.page.get_by_role("link", name="${val}")`;
            case 'partiallinktext': return `self.page.get_by_role("link", name="${val}")`;
            default: return `self.page.locator("${val}")`;
        }
    }

    private static convertTitleToSnake(title: string) {
        return title.split(/(?=[A-Z])/).join('_').toLowerCase();
    }

    private static generateConftest(project: AutomationProject) {
        return `import pytest
import os
import allure
import logging
from colorlog import ColoredFormatter

@pytest.hookimpl(tryfirst=True)
def pytest_configure(config):
    formatter = ColoredFormatter(
        "%(log_color)s%(levelname)-8s%(reset)s %(white)s%(message)s",
        datefmt=None,
        reset=True,
        log_colors={
            'DEBUG':    'cyan',
            'INFO':     'green',
            'WARNING':  'yellow',
            'ERROR':    'red',
            'CRITICAL': 'red,bg_white',
        }
    )
    handler = logging.StreamHandler()
    handler.setFormatter(formatter)
    logger = logging.getLogger()
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

@pytest.fixture(scope="session")
def config():
    import yaml
    config_path = os.path.join(os.path.dirname(__file__), 'config', 'config.yaml')
    if os.path.exists(config_path):
        with open(config_path) as f:
            return yaml.safe_load(f)
    return {}

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.when == 'call' and report.failed:
        # pytest-playwright automatically exposes a 'page' fixture
        page = item.funcargs.get('page')
        if page:
            try:
                screenshot_bytes = page.screenshot()
                allure.attach(
                    screenshot_bytes,
                    name=f"failure_{item.name}",
                    attachment_type=allure.attachment_type.PNG
                )
            except Exception as e:
                logging.error(f"Failed to capture allure screenshot: {e}")
`;
    }

    private static generateDriverFactory() {
        return `# Playwright handles browsers intrinsically via pytest-playwright plugin.
# Run with CLI args like: pytest --browser=chromium --headless
def get_driver():
    pass
`;
    }

    private static generateBasePage(standalone: boolean = false) {
        return `from playwright.sync_api import Page, expect
import allure
import logging
import os

${standalone ? '' : 'from utils.logger import get_logger'}

class BasePage:
    def __init__(self, page: Page):
        self.page = page
        ${standalone ? 'self.logger = logging.getLogger(self.__class__.__name__)' : 'self.logger = get_logger(self.__class__.__name__)'}

    @allure.step("Clicking element")
    def click(self, locator):
        self.logger.info(f"Clicking element")
        locator.click()

    @allure.step("Entering text '{text}'")
    def enter_text(self, locator, text: str):
        self.logger.info(f"Filling element with '{text}'")
        if "file" in str(text).lower() and os.path.exists(str(text)):
            locator.set_input_files(text)
        else:
            locator.fill(str(text))
    
    @allure.step("Get text")
    def get_text(self, locator) -> str:
        return locator.inner_text()

    @allure.step("Select '{text}' from dropdown")
    def select_dropdown_by_text(self, locator, text: str):
        locator.select_option(label=text)
`;
    }

    private static generateDataReader() {
        return `import csv
import json
import os

def read_csv_data(file_path):
    data = []
    if not os.path.exists(file_path): return data
    with open(file_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader: data.append(tuple(row.values()))
    return data
`;
    }

    private static generatePageObject(page: PageDefinition) {
        return `from pages.base_page import BasePage
import allure

class ${page.name}(BasePage):
    def __init__(self, page):
        super().__init__(page)
${page.elements.map(el => `        self.${el.name.toUpperCase()}_LOCATOR = ${this.mapToPlaywrightLocator(el.locatorType, el.locatorValue)}`).join('\n')}

${page.elements.map(el => {
            const nameLower = el.name.toLowerCase();
            if (nameLower.includes('btn') || nameLower.includes('button') || nameLower.includes('link')) {
                return `    @allure.step("Click ${el.name}")\n    def click_${el.name}(self):\n        self.click(self.${el.name.toUpperCase()}_LOCATOR)\n`;
            }
            if (nameLower.includes('input') || nameLower.includes('field') || nameLower.includes('textarea') || nameLower.includes('search')) {
                return `    @allure.step("Fill ${el.name} with '{text}'")\n    def fill_${el.name}(self, text):\n        self.enter_text(self.${el.name.toUpperCase()}_LOCATOR, text)\n`;
            }
            return `    @allure.step("Get ${el.name} text")\n    def get_${el.name}_text(self):\n        return self.get_text(self.${el.name.toUpperCase()}_LOCATOR)\n`;
        }).join('\n')}
`;
    }

    private static generateTypeSpecificTestBody(test: TestCase, pages: PageDefinition[], pageName: string, pageClassName: string): string {
        const indent = '        ';
        // Simplified test body generation logic
        const baseUrl = pages[0] ? '' : 'http://localhost';
        const steps = [`${indent}page.goto(config.get('environments', {}).get('dev', {}).get('base_url', '${baseUrl}'))`];

        test.steps.forEach((step, index) => {
            const desc = step.description.toLowerCase();
            if (step.action === 'input') {
                for (const pg of pages) {
                    for (const el of pg.elements) {
                        if (desc.includes(el.name.toLowerCase()) || desc.includes('input')) {
                            const safeValue = (step.value || 'test').replace(/"/g, '\\"');
                            const safeDesc = step.description.replace(/"/g, '\\\\\\"');
                            steps.push(`${indent}with allure.step(f"${index + 1}. ${safeDesc.replace(/\\\\\"/g, '\\"')} \\n"):`);
                            steps.push(`${indent}    ${pg.name.toLowerCase()}.fill_${el.name}("${safeValue}")`);
                            steps.push(`${indent}    self.logger.info("${safeDesc} executed successfully")`);
                            return;
                        }
                    }
                }
            } else if (step.action === 'click') {
                for (const pg of pages) {
                    for (const el of pg.elements) {
                        if (desc.includes(el.name.toLowerCase()) || desc.includes('button')) {
                            const safeDesc = step.description.replace(/"/g, '\\\\\\"');
                            steps.push(`${indent}with allure.step(f"${index + 1}. ${safeDesc.replace(/\\\\\"/g, '\\"')} \\n"):`);
                            steps.push(`${indent}    ${pg.name.toLowerCase()}.click_${el.name}()`);
                            steps.push(`${indent}    self.logger.info("${safeDesc} executed successfully")`);
                            return;
                        }
                    }
                }
            }
        });

        steps.push(`${indent}from playwright.sync_api import expect`);
        steps.push(`${indent}expect(page).to_have_title(re.compile(r".*")) # generic assertion`);
        return steps.join('\n');
    }

    private static generateTestFile(tests: TestCase[], pages: PageDefinition[], projectName: string) {
        const pageClassName = pages[0]?.name || 'App';

        return `import pytest
import re
import allure
from tests.base_test import BaseTest
${pages.map(p => `from pages.${this.convertTitleToSnake(p.name)} import ${p.name}`).join('\n')}

@allure.epic("${projectName}")
class Test${pageClassName}(BaseTest):

${tests.map(test => `    @allure.story("${test.name}")
    @allure.title("${test.name} Execution")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.${test.type}
    def ${test.name}(self, page, config):
        # Initialize Page Objects
        ${pages.map(p => `${p.name.toLowerCase()} = ${p.name}(page)`).join('\n        ')}
        
${this.generateTypeSpecificTestBody(test, pages, pages[0]?.name.toLowerCase() || 'page', pageClassName)}
`).join('\n\n')}
`;
    }

    private static generateLogger() {
        return `import logging
def get_logger(name=__name__):
    return logging.getLogger(name)
`;
    }

    private static generateEnvironment() {
        return `class Environment:\n    pass`;
    }

    private static generateBaseTest() {
        return `import pytest
import logging
from utils.logger import get_logger

class BaseTest:
    logger = get_logger()
    @pytest.fixture(autouse=True)
    def setup_and_teardown(self, page):
        self.page = page
        yield
`;
    }
}
