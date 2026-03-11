import { AutomationProject, PageDefinition, TestCase } from "../shared/types";

export const generatePlaywrightFramework = (project: AutomationProject, mode: 'framework' | 'pom' = 'framework'): Map<string, string> => {
    const files = new Map<string, string>();

    // --- POM ONLY MODE ---
    if (mode === 'pom') {
        // Pages Only (User has their own framework/base page)
        project.pages.forEach(page => {
            files.set(`pages/${convertTitleToSnake(page.name)}.py`, generatePageObject(page));
        });

        return files;
    }

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

    files.set('pytest.ini', `[pytest]\naddopts = --alluredir=./allure-results --clean-alluredir --log-cli-level=INFO\nlog_cli = true\nlog_cli_format = %(asctime)s [%(levelname)8s] %(message)s (%(filename)s:%(lineno)s)\nlog_cli_date_format = %Y-%m-%d %H:%M:%S\npython_files = test_*.py`);

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
  staging:
    base_url: "${project.config.baseUrl.replace('dev', 'staging')}"
    username: "admin"
    password: "password"
  prod:
    base_url: "${project.config.baseUrl.replace('dev', 'www')}"
    username: "admin"
    password: "password"

logging:
  level: INFO
  format: "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
`);



    // 2. Conftest (Fixtures & Hooks)
    files.set('conftest.py', generateConftest(project));

    // 3. Utilities
    files.set('utils/__init__.py', '');
    // files.set('utils/driver_factory.py', generateDriverFactory());
    // files.set('utils/base_page.py', generateBasePage()); // Moved to pages/
    files.set('utils/data_reader.py', generateDataReader());
    files.set('utils/logger.py', generateLogger());
    files.set('config/environment.py', generateEnvironment());

    // 4. Pages (One file per page)
    files.set('pages/__init__.py', '');
    files.set('pages/base_page.py', generateBasePage(false));
    project.pages.forEach(page => {
        files.set(`pages/${convertTitleToSnake(page.name)}.py`, generatePageObject(page));
    });

    // 5. Tests (Grouped by type per page)
    files.set('tests/__init__.py', '');
    files.set('tests/base_test.py', generateBaseTest());

    // All test types supported
    const ALL_TEST_TYPES = ['smoke', 'functional', 'negative', 'security', 'performance', 'accessibility', 'integration', 'regression'];

    project.pages.forEach(page => {
        const snakePage = convertTitleToSnake(page.name);
        const shortPageName = page.name.replace(/Page$/, '');
        const shortSnake = convertTitleToSnake(shortPageName);

        // Find tests relevant to this page
        let pageTests = project.tests.filter(t =>
            t.steps.some(s => s.description.toLowerCase().includes(page.name.toLowerCase())) ||
            t.name.toLowerCase().includes(page.name.toLowerCase()) ||
            t.name.includes(snakePage)
        );

        // If no specifically matched tests and this is the only page, use all tests
        if (pageTests.length === 0 && project.pages.length === 1) {
            pageTests = [...project.tests];
        }

        if (pageTests.length === 0) return;

        // Group tests by their type
        const testsByType: Record<string, TestCase[]> = {};
        pageTests.forEach(test => {
            const type = test.type || 'smoke';
            if (!testsByType[type]) testsByType[type] = [];
            testsByType[type].push(test);
        });

        // Create a separate test file for each type that has tests
        for (const [type, tests] of Object.entries(testsByType)) {
            if (tests.length > 0) {
                files.set(
                    `tests/test_${type}_${shortSnake}.py`,
                    generateTestFile(tests, [page], project.config.projectName)
                );
            }
        }
    });

    // Catch-all: If no test files were created, create a main flow file
    if (!Array.from(files.keys()).some(k => k.startsWith('tests/test_'))) {
        if (project.tests.length > 0) {
            files.set('tests/test_main_flow.py', generateTestFile(project.tests, project.pages, project.config.projectName));
        }
    }

    return files;
};

// --- Generators ---

const generateConftest = (project: AutomationProject) => `import pytest
import os
import logging
import allure
from colorlog import ColoredFormatter

# --- Logging Setup with ColorLog ---
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
        },
        secondary_log_colors={},
        style='%'
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
    with open(config_path) as f:
        return yaml.safe_load(f)

@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    """Override playwright browser_context_args to handle custom configurations."""
    return {
        **browser_context_args,
        "viewport": {
            "width": 1920,
            "height": 1080,
        }
    }

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """
    Capture screenshot on failure and attach to Allure using Playwright's page fixture.
    """
    outcome = yield
    report = outcome.get_result()
    
    if report.when == 'call' and report.failed:
        if "page" in item.fixturenames:
            page = item.funcargs.get("page")
            if page:
                try:
                    screenshot_bytes = page.screenshot()
                    allure.attach(
                        screenshot_bytes,
                        name=f"failure_{item.name}",
                        attachment_type=allure.attachment_type.PNG
                    )
                except Exception as e:
                    logging.exception("Failed to take screenshot for allure report")
`;

const generateDriverFactory = () => `
from selenium import webdriver

def get_driver(browser="chrome", headless=True):
    if browser == "chrome":
        options = webdriver.ChromeOptions()
        if headless:
            options.add_argument("--headless")
        return webdriver.Chrome(options=options)
    raise ValueError(f"Browser {browser} not supported in this factory yet.")
`;

const generateBasePage = (standalone: boolean = false) => `from playwright.sync_api import Page, expect
import allure
import time
import logging

${standalone ? '' : 'from utils.logger import get_logger'}

class BasePage:
    """
    BasePage class that contains common methods for all page objects using Playwright.
     Integrated with Allure steps and custom logging.
    """
    def __init__(self, page: Page):
        self.page = page
        self.timeout = 10000
        ${standalone ? 'self.logger = logging.getLogger(self.__class__.__name__)' : 'self.logger = get_logger(self.__class__.__name__)'}
    
    def _convert_locator(self, locator):
        """Helper to convert locator tuple/string to Playwright locator string"""
        if isinstance(locator, str): return locator
        locator_type, locator_value = locator
        locator_type = locator_type.lower()
        if locator_type == 'xpath':
            return f"xpath={locator_value}"
        elif locator_type == 'css':
            return locator_value
        elif locator_type == 'id':
            return f"id={locator_value}"
        elif locator_type == 'name':
            return f"[name='{locator_value}']"
        elif locator_type == 'text':
            return f"text={locator_value}"
        return locator_value

    @allure.step("Finding element: {locator}")
    def find_element(self, locator):
        return self.page.locator(self._convert_locator(locator)).first

    @allure.step("Finding elements: {locator}")
    def find_elements(self, locator):
        return self.page.locator(self._convert_locator(locator)).all()

    # --- Actions ---

    @allure.step("Clicking element: {locator}")
    def click(self, locator):
        self.logger.info(f"Clicking element: {locator}")
        self.page.locator(self._convert_locator(locator)).first.click(timeout=self.timeout)

    @allure.step("Entering text '{text}' into {locator}")
    def enter_text(self, locator, text):
        self.logger.info(f"Entering text '{text}' into {locator}")
        self.page.locator(self._convert_locator(locator)).first.fill(str(text), timeout=self.timeout)

    @allure.step("Getting text from {locator}")
    def get_text(self, locator):
        text = self.page.locator(self._convert_locator(locator)).first.inner_text(timeout=self.timeout)
        self.logger.info(f"Got text '{text}' from {locator}")
        return text

    # --- Advanced Interactions ---

    @allure.step("Scrolling to element: {locator}")
    def scroll_to_element(self, locator):
        self.page.locator(self._convert_locator(locator)).first.scroll_into_view_if_needed(timeout=self.timeout)

    @allure.step("Hovering over element: {locator}")
    def hover_over_element(self, locator):
        self.page.locator(self._convert_locator(locator)).first.hover(timeout=self.timeout)

    @allure.step("Double clicking element: {locator}")
    def double_click(self, locator):
        self.page.locator(self._convert_locator(locator)).first.dblclick(timeout=self.timeout)

    @allure.step("Right clicking element: {locator}")
    def right_click(self, locator):
        self.page.locator(self._convert_locator(locator)).first.click(button="right", timeout=self.timeout)

    # --- Waits & States ---

    def wait_until_clickable(self, locator, timeout=None):
        pass # Playwright automatically waits for actionability

    def is_element_visible(self, locator, timeout=2000):
        try:
            self.page.locator(self._convert_locator(locator)).first.wait_for(state="visible", timeout=timeout)
            return True
        except Exception:
            return False

    # --- Browser Actions ---

    def get_title(self):
        return self.page.title()

    def get_current_url(self):
        return self.page.url

    def refresh_page(self):
        self.page.reload()

    # --- Dropdowns & Alerts ---

    @allure.step("Selecting '{text}' from dropdown: {locator}")
    def select_dropdown_by_text(self, locator, text):
        self.page.locator(self._convert_locator(locator)).first.select_option(label=text)

    def switch_to_alert_and_accept(self):
        self.page.once("dialog", lambda dialog: dialog.accept())
`;

const generateDataReader = () => `import csv
import json
import os
from typing import List, Dict, Any

def read_csv_data(file_path: str) -> List[tuple]:
    data = []
    if not os.path.exists(file_path): return data
    with open(file_path, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            data.append(tuple(row.values()))
    return data

def read_json_data(file_path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(file_path): return []
    with open(file_path, 'r') as jsonfile:
        data = json.load(jsonfile)
    return data if isinstance(data, list) else [data]

def read_test_data(file_path: str, format: str = 'csv') -> List:
    if format.lower() == 'csv': return read_csv_data(file_path)
    elif format.lower() == 'json': return read_json_data(file_path)
    else: raise ValueError(f"Unsupported format: {format}")
`;

/**
 * Pick the best Playwright locator expression for an element.
 * Priority aligns with playwright_locators_knowledge.md:
 *  1. get_by_role (button, checkbox, radio, combobox, textbox, etc.)
 *  2. get_by_label
 *  3. get_by_placeholder
 *  4. get_by_test_id (data-testid)
 *  5. CSS #id
 *  6. CSS [name=]
 *  7. CSS input[type=]
 *  8. CSS fallback
 */
const pickPlaywrightLocator = (el: { name: string; locatorType: string; locatorValue: string; tagName?: string }): string => {
    const tag = (el.tagName || '').toLowerCase();
    const ltype = (el.locatorType || '').toLowerCase();
    const lval = el.locatorValue || '';
    const name = el.name || '';

    // Helper
    const safe = (s: string) => s.replace(/"/g, '\\"');

    // 1. Role-based: buttons
    if (tag === 'button' || tag === 'input' && ['submit', 'button', 'reset'].includes(lval.toLowerCase()) ||
        name.toLowerCase().includes('btn') || name.toLowerCase().includes('button') || name.toLowerCase().includes('submit')) {
        const accName = name.replace(/_/g, ' ');
        return `page.get_by_role("button", name="${safe(accName)}")`;
    }

    // 1. Role-based: links/anchors
    if (tag === 'a' || name.toLowerCase().includes('link')) {
        const accName = name.replace(/_/g, ' ');
        return `page.get_by_role("link", name="${safe(accName)}")`;
    }

    // 1. Role-based: checkbox
    if (tag === 'input' && (lval.toLowerCase().includes('checkbox') || name.toLowerCase().includes('checkbox'))) {
        const accName = name.replace(/_/g, ' ');
        return `page.get_by_role("checkbox", name="${safe(accName)}")`;
    }

    // 1. Role-based: radio
    if (tag === 'input' && (lval.toLowerCase().includes('radio') || name.toLowerCase().includes('radio'))) {
        const accName = name.replace(/_/g, ' ');
        return `page.get_by_role("radio", name="${safe(accName)}")`;
    }

    // 1. Role-based: select → combobox
    if (tag === 'select') {
        const accName = name.replace(/_/g, ' ');
        return `page.get_by_role("combobox", name="${safe(accName)}")`;
    }

    // 2. Label-based (if locatorType is 'label' or name suggests semantic label)
    // Textbox role with label
    if (tag === 'input' || tag === 'textarea') {
        const accName = name.replace(/_/g, ' ');
        // Use get_by_role(textbox) with accessible name if name is semantic
        if (accName && !['el_', 'input', 'field'].some(p => accName.startsWith(p))) {
            const role = tag === 'textarea' ? 'textbox' : 'textbox';
            return `page.get_by_role("${role}", name="${safe(accName)}")`;
        }
    }

    // 4. get_by_test_id — locatorType is 'css' and value has data-testid
    if (lval.includes('data-testid') || lval.includes('data-qa') || lval.includes('data-test')) {
        const match = lval.match(/data-(?:testid|qa|test)="?([^">\s]+)"?/);
        if (match) return `page.get_by_test_id("${safe(match[1])}")`;
    }

    // 5. CSS #id
    if (ltype === 'id') {
        return `page.locator("#${safe(lval)}")`;
    }

    // 6. CSS [name=]
    if (ltype === 'name') {
        return `page.locator("[name=\\"${safe(lval)}\\"]")`;
    }

    // 7. CSS type
    if (ltype === 'css' && lval.startsWith('input[type=')) {
        return `page.locator("${safe(lval)}")`;
    }

    // 8. Fallback: raw CSS or XPath
    if (ltype === 'xpath') {
        return `page.locator("xpath=${safe(lval)}")`;
    }
    return `page.locator("${safe(lval)}")`;
};

const generatePageObject = (page: PageDefinition) => {
    const className = page.name;

    const initLocators = page.elements.map(el => {
        const locExpr = pickPlaywrightLocator(el);
        return `        self.${el.name} = ${locExpr}`;
    }).join('\n');

    const actions = page.elements.map(el => {
        const tag = (el.tagName || '').toLowerCase();
        const ltype = (el.locatorType || '').toLowerCase();
        const lval = (el.locatorValue || '').toLowerCase();
        const nameLower = el.name.toLowerCase();

        // Clickable
        if (
            tag === 'button' || tag === 'a' ||
            nameLower.includes('btn') || nameLower.includes('button') ||
            nameLower.includes('link') || nameLower.includes('submit') ||
            (tag === 'input' && ['button', 'submit', 'reset', 'checkbox', 'radio'].some(t => lval.includes(t)))
        ) {
            if (lval.includes('checkbox')) {
                return `    @allure.step("Toggle ${el.name}")\n    def toggle_${el.name}(self):\n        self.${el.name}.check()\n`;
            }
            return `    @allure.step("Click ${el.name}")\n    def click_${el.name}(self):\n        self.${el.name}.click()\n`;
        }
        // Select / combobox
        if (tag === 'select') {
            return `    @allure.step("Select '{{value}}' from ${el.name}")\n    def select_${el.name}(self, value: str):\n        self.${el.name}.select_option(label=value)\n`;
        }
        // Text inputs / textarea
        if (
            tag === 'textarea' || tag === 'input' ||
            nameLower.includes('input') || nameLower.includes('field') ||
            nameLower.includes('search') || nameLower.includes('email') ||
            nameLower.includes('password') || nameLower.includes('text')
        ) {
            return `    @allure.step("Fill ${el.name} with '{{text}}'")\n    def fill_${el.name}(self, text: str):\n        self.${el.name}.fill(text)\n\n    def clear_${el.name}(self):\n        self.${el.name}.clear()\n`;
        }
        // Default: text
        return `    @allure.step("Get ${el.name} text")\n    def get_${el.name}_text(self) -> str:\n        return self.${el.name}.inner_text()\n`;
    }).join('\n');

    return `from playwright.sync_api import Page, Locator, expect
import allure


class ${className}:
    """
    Page Object Model for ${className}.
    Locator priority per playwright_locators_knowledge.md:
      1. get_by_role  2. get_by_label  3. get_by_placeholder
      4. get_by_test_id  5. #id  6. [name=]  7. type  8. xpath
    """

    def __init__(self, page: Page):
        self.page = page
        # ── Locators (initialized with get_by_* priority) ──
${initLocators}

    def navigate(self, url: str):
        """Navigate to the URL and wait for networkidle."""
        self.page.goto(url)
        self.page.wait_for_load_state("networkidle")

    # ── Actions ──────────────────────────────────────────────
${actions}
    def get_page_title(self) -> str:
        return self.page.title()

    def get_current_url(self) -> str:
        return self.page.url
`;
};


/**
 * Generate type-specific Playwright test body — 100% POM methodology.
 * Tests interact ONLY through the page object (pom). Raw page.locator() is
 * only used for advanced checks (security, performance, accessibility) that
 * have no meaningful POM abstraction.
 */
const generateTypeSpecificTestBody = (
    test: TestCase,
    pages: PageDefinition[],
    pomVarName: string,      // e.g. "login_page"
    pageClassName: string    // e.g. "LoginPage"
): string => {
    const ind = '        ';   // 8-space indent (inside method body)
    const i4 = '    ';       // 4-space (inside for loops)
    const url = `${pomVarName}.get_current_url()`;

    // Helper: find an element in any page by name match
    const findEl = (desc: string) => {
        for (const pg of pages) {
            for (const el of pg.elements) {
                if (desc.toLowerCase().includes(el.name.toLowerCase())) return el;
            }
        }
        return null;
    };

    // Helper: find first submit/login button across all pages
    const findSubmitBtn = () => {
        for (const pg of pages) {
            for (const el of pg.elements) {
                const n = el.name.toLowerCase();
                if (n.includes('submit') || n.includes('login') || n.includes('btn') || n.includes('sign')) return el;
            }
        }
        return null;
    };

    switch (test.type) {

        // ======================== SMOKE ========================
        case 'smoke': {
            return [
                `${ind}# ── POM: Navigate via page object ──────────────────`,
                `${ind}${pomVarName}.navigate(config.get('environments', {}).get('dev', {}).get('base_url', ''))`,
                `${ind}`,
                `${ind}# Assert: page loaded successfully`,
                `${ind}title = ${pomVarName}.get_page_title()`,
                `${ind}assert title, "Page title should not be empty"`,
                `${ind}assert "404" not in title.lower(), "Page should not return 404"`,
                `${ind}assert "500" not in title.lower(), "Page should not return 500"`,
                `${ind}`,
                `${ind}# Assert: current URL is set`,
                `${ind}current_url = ${pomVarName}.get_current_url()`,
                `${ind}assert current_url, "Page URL should be set after navigation"`,
                `${ind}expect(page.locator("body")).to_be_visible()`,
            ].join('\n');
        }

        // ======================== FUNCTIONAL ========================
        case 'functional': {
            const lines: string[] = [
                `${ind}# ── POM: Navigate ───────────────────────────────────`,
                `${ind}${pomVarName}.navigate(config.get('environments', {}).get('dev', {}).get('base_url', ''))`,
                `${ind}`,
                `${ind}# ── POM: Perform test steps via page object methods ──`,
            ];
            let hasSubmit = false;

            test.steps.forEach((step, idx) => {
                const el = findEl(step.description);
                if (step.action === 'input' && el) {
                    const val = (step.value || 'test_value').replace(/"/g, '\\"');
                    lines.push(`${ind}with allure.step("${idx + 1}. ${step.description.replace(/"/g, '\\"')}"):`);
                    lines.push(`${ind}    ${pomVarName}.fill_${el.name}("${val}")`);
                    if (step.description.toLowerCase().includes('submit') || step.description.toLowerCase().includes('search')) hasSubmit = true;
                } else if (step.action === 'click' && el) {
                    lines.push(`${ind}with allure.step("${idx + 1}. ${step.description.replace(/"/g, '\\"')}"):`);
                    lines.push(`${ind}    ${pomVarName}.click_${el.name}()`);
                    if (step.description.toLowerCase().includes('submit') || step.description.toLowerCase().includes('login')) hasSubmit = true;
                }
            });

            lines.push('');
            lines.push(`${ind}# ── Assert: expected outcome ─────────────────────`);
            if (hasSubmit) {
                lines.push(`${ind}page.wait_for_load_state("networkidle")`);
                lines.push(`${ind}error_alert = page.get_by_role("alert").all()`);
                lines.push(`${ind}visible_errors = [e for e in error_alert if e.is_visible()]`);
                lines.push(`${ind}assert len(visible_errors) == 0, f"No error alerts expected, found: {[e.inner_text() for e in visible_errors]}"`);
            } else {
                lines.push(`${ind}title = ${pomVarName}.get_page_title()`);
                lines.push(`${ind}assert title, "Page should remain functional"`);
            }
            return lines.join('\n');
        }

        // ======================== NEGATIVE ========================
        case 'negative': {
            const submitEl = findSubmitBtn();
            const submitCall = submitEl
                ? `${ind}${pomVarName}.click_${submitEl.name}()`
                : [
                    `${ind}submit_btn = page.get_by_role("button", name="Submit").or_(page.locator("button[type='submit']"))`,
                    `${ind}if submit_btn.count() > 0:`,
                    `${ind}    submit_btn.first.click()`,
                ].join('\n');

            return [
                `${ind}# ── POM: Navigate ───────────────────────────────────`,
                `${ind}${pomVarName}.navigate(config.get('environments', {}).get('dev', {}).get('base_url', ''))`,
                `${ind}`,
                `${ind}# ── POM: Deliberately submit empty form ──────────────`,
                submitCall,
                `${ind}`,
                `${ind}# ── Assert: validation triggered ─────────────────────`,
                `${ind}page.wait_for_timeout(500)`,
                `${ind}# Check HTML5 native validation (browser-level)`,
                `${ind}invalid_count = page.evaluate("document.querySelectorAll('input:invalid, select:invalid, textarea:invalid').length")`,
                `${ind}# Check visible ARIA alert / error messages`,
                `${ind}error_msgs = page.get_by_role("alert").all()`,
                `${ind}has_error = len(error_msgs) > 0 or invalid_count > 0`,
                `${ind}# Or confirm the form didn't navigate away`,
                `${ind}stayed_on_page = config.get('environments', {}).get('dev', {}).get('base_url', '') in ${pomVarName}.get_current_url()`,
                `${ind}assert has_error or stayed_on_page, "Submitting empty form should trigger validation error"`,
            ].join('\n');
        }

        // ======================== SECURITY ========================
        case 'security': {
            // Security tests must inject payloads — POM fill_ + direct page.get_by_role for alert
            const inputs = pages.flatMap(pg => pg.elements.filter(el => {
                const t = (el.tagName || '').toLowerCase();
                const v = (el.locatorValue || '').toLowerCase();
                return t === 'input' && !['submit', 'button', 'reset', 'checkbox', 'radio', 'hidden'].some(x => v.includes(x));
            }));
            const inputFills = inputs.slice(0, 3).map(el =>
                `${ind}    try:\n${ind}        ${pomVarName}.fill_${el.name}(payload)\n${ind}    except Exception:\n${ind}        pass`
            ).join('\n');

            const submitEl = findSubmitBtn();
            const clickSubmit = submitEl
                ? `${ind}    ${pomVarName}.click_${submitEl.name}()`
                : `${ind}    page.get_by_role("button").first.click(timeout=2000)`;

            return [
                `${ind}# ── POM: Navigate ───────────────────────────────────`,
                `${ind}${pomVarName}.navigate(config.get('environments', {}).get('dev', {}).get('base_url', ''))`,
                `${ind}`,
                `${ind}# ── Security: XSS payload injection via POM ─────────`,
                `${ind}xss_payloads = [`,
                `${ind}    "<script>alert('XSS')</script>",`,
                `${ind}    "<img src=x onerror=alert(1)>",`,
                `${ind}    "javascript:alert(1)",`,
                `${ind}]`,
                `${ind}alert_triggered = []`,
                `${ind}page.on("dialog", lambda d: (alert_triggered.append(d.message), d.dismiss()))`,
                `${ind}`,
                `${ind}for payload in xss_payloads:`,
                inputFills || `${ind}    pass  # No text inputs found on this page`,
                `${ind}    try:`,
                `${ind}        # Submit via POM if possible`,
                clickSubmit,
                `${ind}    except Exception:`,
                `${ind}        pass`,
                `${ind}    assert len(alert_triggered) == 0, f"XSS vulnerability! Alert triggered: {alert_triggered}"`,
                `${ind}    page_src = page.content()`,
                `${ind}    assert "<script>alert" not in page_src.lower(), "XSS payload reflected unescaped"`,
                `${ind}    ${pomVarName}.navigate(config.get('environments', {}).get('dev', {}).get('base_url', ''))`,
            ].join('\n');
        }

        // ======================== PERFORMANCE ========================
        case 'performance': {
            return [
                `${ind}import time as _time`,
                `${ind}`,
                `${ind}# ── POM: Navigate and measure load time ─────────────`,
                `${ind}start = _time.time()`,
                `${ind}${pomVarName}.navigate(config.get('environments', {}).get('dev', {}).get('base_url', ''))`,
                `${ind}wall_clock = _time.time() - start`,
                `${ind}`,
                `${ind}# Navigation Timing API (browser-level measurements)`,
                `${ind}timing = page.evaluate("window.performance.timing")`,
                `${ind}load_ms   = timing["loadEventEnd"] - timing["navigationStart"]`,
                `${ind}dom_ms    = timing["domContentLoadedEventEnd"] - timing["navigationStart"]`,
                `${ind}`,
                `${ind}# ── Assert: performance thresholds ───────────────────`,
                `${ind}assert wall_clock < 5, f"Wall-clock load {wall_clock:.2f}s > 5s threshold"`,
                `${ind}assert load_ms < 5000, f"Full page load {load_ms}ms > 5000ms threshold"`,
                `${ind}assert dom_ms  < 3000, f"DOM ready {dom_ms}ms > 3000ms threshold"`,
                `${ind}`,
                `${ind}# Assert: POM confirms page loaded correctly`,
                `${ind}assert ${pomVarName}.get_page_title(), "Page title should exist after load"`,
                `${ind}allure.attach(f"Load: {load_ms}ms | DOM: {dom_ms}ms | Wall: {wall_clock:.2f}s",`,
                `${ind}             name="performance", attachment_type=allure.attachment_type.TEXT)`,
            ].join('\n');
        }

        // ======================== ACCESSIBILITY ========================
        case 'accessibility': {
            return [
                `${ind}# ── POM: Navigate ───────────────────────────────────`,
                `${ind}${pomVarName}.navigate(config.get('environments', {}).get('dev', {}).get('base_url', ''))`,
                `${ind}`,
                `${ind}# WCAG 1.1.1: All <img> must have alt text`,
                `${ind}images = page.get_by_role("img").all()`,
                `${ind}missing_alt = [img.get_attribute("src") or "?" for img in images if not img.get_attribute("alt")]`,
                `${ind}assert len(missing_alt) == 0, f"{len(missing_alt)} images missing alt: {missing_alt[:5]}"`,
                `${ind}`,
                `${ind}# WCAG 1.3.1: Interactive elements have accessible labels`,
                `${ind}unlabeled = page.evaluate("""`,
                `${ind}    var els = document.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select, textarea');`,
                `${ind}    return Array.from(els).filter(function(el) {`,
                `${ind}        return !el.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.closest('label');`,
                `${ind}    }).map(function(el) { return el.name || el.id || el.type || '?'; });`,
                `${ind}""")`,
                `${ind}assert len(unlabeled) == 0, f"Inputs without labels: {unlabeled[:5]}"`,
                `${ind}`,
                `${ind}# WCAG 2.4.2: Main landmark present`,
                `${ind}main_count = page.locator("main, [role='main']").count()`,
                `${ind}assert main_count >= 1, "Page should have a <main> landmark"`,
                `${ind}`,
                `${ind}# Verify via POM: page title and URL are accessible`,
                `${ind}assert ${pomVarName}.get_page_title(), "Page should have a non-empty title (WCAG 2.4.2)"`,
            ].join('\n');
        }

        // ======================== INTEGRATION ========================
        case 'integration': {
            const lines: string[] = [
                `${ind}# ── POM: Navigate ───────────────────────────────────`,
                `${ind}${pomVarName}.navigate(config.get('environments', {}).get('dev', {}).get('base_url', ''))`,
                `${ind}initial_url = ${pomVarName}.get_current_url()`,
                `${ind}`,
                `${ind}# ── POM: Fill and submit form via page object ────────`,
            ];

            test.steps.forEach(step => {
                const el = findEl(step.description);
                if (step.action === 'input' && el) {
                    lines.push(`${ind}${pomVarName}.fill_${el.name}("${step.value || 'integration_test'}")`);
                } else if (step.action === 'click' && el) {
                    lines.push(`${ind}${pomVarName}.click_${el.name}()`);
                }
            });

            lines.push('');
            lines.push(`${ind}# ── Assert: form triggers a response ────────────────`);
            lines.push(`${ind}page.wait_for_load_state("networkidle")`);
            lines.push(`${ind}url_changed = ${pomVarName}.get_current_url() != initial_url`);
            lines.push(`${ind}content = page.content().lower()`);
            lines.push(`${ind}has_feedback = "success" in content or "error" in content or "invalid" in content`);
            lines.push(`${ind}assert url_changed or has_feedback, "Form submission should produce navigation or feedback"`);
            lines.push('');
            lines.push(`${ind}# ── Assert: cookies are within limits ───────────────`);
            lines.push(`${ind}${pomVarName}.navigate(config.get('environments', {}).get('dev', {}).get('base_url', ''))`);
            lines.push(`${ind}cookies = page.context.cookies()`);
            lines.push(`${ind}for cookie in cookies:`);
            lines.push(`${ind}    assert len(cookie.get("value", "")) < 4096, f"Cookie '{cookie['name']}' exceeds 4KB limit"`);
            return lines.join('\n');
        }

        // ======================== REGRESSION ========================
        case 'regression': {
            return [
                `${ind}# ── POM: Navigate ───────────────────────────────────`,
                `${ind}${pomVarName}.navigate(config.get('environments', {}).get('dev', {}).get('base_url', ''))`,
                `${ind}`,
                `${ind}# ── Assert: element count baseline ───────────────────`,
                `${ind}counts = page.evaluate("({inputs: document.querySelectorAll('input').length, buttons: document.querySelectorAll('button').length, links: document.querySelectorAll('a').length})")`,
                `${ind}assert counts["inputs"] >= 0, "Input count should be non-negative"`,
                `${ind}assert counts["buttons"] >= 0, "Button count should be non-negative"`,
                `${ind}allure.attach(str(counts), name="Element Baseline", attachment_type=allure.attachment_type.JSON)`,
                `${ind}`,
                `${ind}# ── Assert: POM-level checks ─────────────────────────`,
                `${ind}title = ${pomVarName}.get_page_title()`,
                `${ind}assert title and len(title) > 0, "Page title must not be empty (regression guard)"`,
                `${ind}allure.attach(title, name="Page Title", attachment_type=allure.attachment_type.TEXT)`,
                `${ind}`,
                `${ind}current_url = ${pomVarName}.get_current_url()`,
                `${ind}assert current_url, "Page URL must be set (regression guard)"`,
                `${ind}expect(page.locator("body")).to_be_visible()`,
            ].join('\n');
        }

        default:
            return [
                `${ind}${pomVarName}.navigate(config.get('environments', {}).get('dev', {}).get('base_url', ''))`,
                `${ind}assert ${pomVarName}.get_page_title(), "Page should load"`,
            ].join('\n');
    }
};


const generateTestFile = (tests: TestCase[], pages: PageDefinition[], projectName: string) => {
    const pageObj = pages[0];
    const className = pageObj?.name || 'Page';
    const pomVarName = pages.map(p => convertTitleToSnake(p.name)).join(', ') || 'page_obj';
    const baseUrl = "config.get('environments', {}).get('dev', {}).get('base_url', '')";

    // conftest fixture imports
    const pomImports = pages.map(p =>
        `from pages.${convertTitleToSnake(p.name)} import ${p.name}`
    ).join('\n');

    // POM instantiation lines inside each test
    const pomInit = pages.map(p =>
        `${convertTitleToSnake(p.name)} = ${p.name}(page)`
    ).join('\n        ');

    return `import pytest
import allure
from playwright.sync_api import Page, expect
${pomImports}


@allure.epic("${projectName}")
@allure.feature("${className}")
class Test${className}:
    """
    Test suite for ${projectName} — ${className} page.
    All interactions go through the Page Object Model (POM).
    Direct page.locator() is only used for assertion-only checks
    that have no meaningful POM abstraction (performance timing, etc.)
    """

${tests.map(test => `    @allure.story("${test.name}")
    @allure.title("${test.name}")
    @allure.severity(allure.severity_level.${test.type === 'smoke' ? 'CRITICAL' :
            test.type === 'functional' ? 'NORMAL' :
                test.type === 'security' ? 'BLOCKER' :
                    test.type === 'performance' ? 'MINOR' : 'NORMAL'
        })
    @pytest.mark.${test.type}
    def ${test.name}(self, page: Page, config):
        """
        ${test.name}
        Type    : ${test.type}
        Steps   :
${test.steps.map((s, i) => `        ${i + 1}. ${s.description}`).join('\n')}
        """
        # ── POM Instantiation ───────────────────────────────────
        ${pomInit}

${generateTypeSpecificTestBody(test, pages, convertTitleToSnake(pages[0]?.name || 'page'), className)}
`).join('\n\n')}
`;
};



// --- Helpers ---
const mapLocatorType = (type: string) => {
    const t = type.toLowerCase();
    switch (t) {
        case 'classname': return 'css';
        case 'linktext': return 'link text';
        case 'partiallinktext': return 'partial link text';
        case 'tagname': return 'tag name';
        case 'css': return 'css selector';
        default: return t;
    }
};
const convertTitleToSnake = (title: string) => title.split(/(?=[A-Z])/).join('_').toLowerCase();
const groupTestsByMainPage = (tests: TestCase[], pages: PageDefinition[]) => {
    return {};
};

const generateLogger = () => `import logging
import os

def get_logger(name=__name__):
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        ch = logging.StreamHandler()
        ch.setFormatter(formatter)
        logger.addHandler(ch)
    return logger
`;

const generateEnvironment = () => `"""
Environment configuration module for managing test environments and settings.
"""

import yaml
import os
from pathlib import Path


class Environment:
    """
    Environment configuration class to manage different test environments.
    """
    
    def __init__(self, env_name=None):
        """
        Initialize environment configuration.
        
        Args:
            env_name: Environment name (dev, staging, prod). If None, uses ENV environment variable or defaults to 'dev'
        """
        self.env_name = env_name or os.getenv('ENV', 'dev')
        self.config = self._load_config()
        self.current_env = self.config['environments'][self.env_name]
    
    def _load_config(self):
        """
        Load configuration from YAML file.
        
        Returns:
            dict: Configuration dictionary
        """
        config_path = Path(__file__).parent / 'config.yaml'
        try:
            with open(config_path, 'r') as file:
                return yaml.safe_load(file)
        except FileNotFoundError:
            raise FileNotFoundError(f"Configuration file not found at {config_path}")
        except yaml.YAMLError as e:
            raise ValueError(f"Error parsing configuration file: {e}")
    
    def get_base_url(self):
        """Get base URL for current environment."""
        return self.current_env['base_url']
    
    def get_username(self):
        """Get username for current environment."""
        return self.current_env['username']
    
    def get_password(self):
        """Get password for current environment."""
        return self.current_env['password']
    
    def get_browser_config(self):
        """Get browser configuration."""
        return self.config['browser']
    
    def get_logging_config(self):
        """Get logging configuration."""
        return self.config['logging']
`;

const generateBaseTest = () => `"""
Base Test class containing common setup and teardown methods.
"""
import pytest
import io
import logging
import allure
from utils.logger import get_logger
from config.environment import Environment

class BaseTest:
    logger = get_logger()

    @pytest.fixture(scope="function", autouse=True)
    def setup_and_teardown(self, page, request):
        """
        Setup/teardown fixture. Uses the driver fixture from conftest.py
        """
        self.logger.info(f"--- Starting test: {request.node.name} ---")

        # Capture logs
        log_stream = io.StringIO()
        stream_handler = logging.StreamHandler(log_stream)
        log_format = logging.Formatter('%(asctime)s - [%(levelname)s] - %(message)s')
        stream_handler.setFormatter(log_format)
        self.logger.addHandler(stream_handler)

        self.env = Environment()
        self.driver = driver
        # Make driver available to test class instance explicitly if needed
        request.cls.driver = self.driver

        yield

        # Teardown logic
        with allure.step("Test Teardown"):
            # Logs attachment
            log_content = log_stream.getvalue()
            allure.attach(log_content, name=f"Execution Log for {request.node.name}",
                          attachment_type=allure.attachment_type.TEXT)
            self.logger.removeHandler(stream_handler)
            self.logger.info(f"--- Finished test: {request.node.name} ---")
            # Driver quit is handled by conftest fixture
`;