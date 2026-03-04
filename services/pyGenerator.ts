import { AutomationProject, PageDefinition, TestCase } from "../shared/types";

export const generatePyTestFramework = (project: AutomationProject, mode: 'framework' | 'pom' = 'framework'): Map<string, string> => {
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
    files.set('requirements.txt', `pytest==9.0.2\nselenium==4.41.0\nallure-pytest==2.15.3\ncolorlog==6.10.1\npytest-xdist==3.8.0\nPyYAML==6.0.3`);

    files.set('README.md', `# Pytest Automation Framework

Welcome to your generated Pytest + Selenium 4 Automation Framework. 

## 🏗 Architecture
1. **Configuration (\`config/config.yaml\`)**: Centralized YAML file controlling browser types, timeouts, and environments.
2. **Page Object Model (\`pages/\`)**: Clean encapsulation of UI elements into logical pages.
3. **Execution (\`tests/\`)**: Pytest scripts utilizing powerful \`@pytest.fixture\` and native Selenium 4 WebDriver management.
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
    files.set('utils/driver_factory.py', generateDriverFactory());
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
import json
import os
import logging
import allure
from colorlog import ColoredFormatter
from selenium import webdriver

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

def pytest_addoption(parser):
    parser.addoption("--browser", action="store", default=None, help="Browser to run tests on (chrome, firefox, edge)")
    parser.addoption("--headless", action="store_true", default=None, help="Run tests in headless mode")

@pytest.fixture(scope="session")
def config():
    import yaml
    config_path = os.path.join(os.path.dirname(__file__), 'config', 'config.yaml')
    with open(config_path) as f:
        return yaml.safe_load(f)

@pytest.fixture(scope="function"${project.config.browser === 'all' ? ', params=["chrome", "firefox", "edge"]' : ''})
def driver(request, config):
    # Determine browser: either from CLI param, fixture param, or config file
    cli_browser = request.config.getoption("--browser")
    browser = cli_browser if cli_browser else (request.param if hasattr(request, 'param') else config.get('browser', {}).get('default', 'chrome'))
    if not browser:
        browser = 'chrome'
    browser = browser.lower()
    
    cli_headless = request.config.getoption("--headless")
    headless = True if cli_headless else config.get('browser', {}).get('headless', False)
    
    driver = None
    if browser == "chrome":
        options = webdriver.ChromeOptions()
        if headless:
            options.add_argument("--headless=new")  # Chrome 112+ requires --headless=new
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1920,1080")
        # Add common options to avoid issues
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-extensions")
        try:
            driver = webdriver.Chrome(options=options)
        except Exception as e:
            raise RuntimeError(
                f"Failed to start Chrome. Make sure Google Chrome is installed.\\n"
                f"Error: {e}"
            )
    elif browser == "firefox":
        options = webdriver.FirefoxOptions()
        if headless: options.add_argument("--headless")
        driver = webdriver.Firefox(options=options)
    elif browser == "edge":
        options = webdriver.EdgeOptions()
        if headless: options.add_argument("--headless=new")
        driver = webdriver.Edge(options=options)
    else:
        raise Exception(f"Browser {browser} not supported")

    driver.maximize_window()
    if 'implicit_wait' in config['browser']:
        driver.implicitly_wait(config['browser']['implicit_wait'])
    
    yield driver
    
    if driver:
        driver.quit()

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """
    Capture screenshot on failure and attach to Allure
    """
    outcome = yield
    report = outcome.get_result()
    
    if report.when == 'call' and report.failed:
        if "driver" in item.funcargs:
            driver = item.funcargs["driver"]
            allure.attach(
                driver.get_screenshot_as_png(),
                name=f"failure_{item.name}",
                attachment_type=allure.attachment_type.PNG
            )
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

const generateBasePage = (standalone: boolean = false) => `from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException, NoSuchElementException
import allure
import time
import logging

${standalone ? '' : 'from utils.logger import get_logger'}

class BasePage:
    """
    BasePage class that contains common methods for all page objects.
    Integrated with Allure steps and custom logging.
    """
    def __init__(self, driver):
        self.driver = driver
        self.timeout = 10
        ${standalone ? 'self.logger = logging.getLogger(self.__class__.__name__)' : 'self.logger = get_logger(self.__class__.__name__)'}
    
    def _convert_locator(self, locator):
        """Helper to convert locator tuple/string to (By, value)"""
        if isinstance(locator, tuple): return locator
        
        # If locator came as a custom object or needs mapping (fallback)
        locator_type, locator_value = locator
        locator_map = {
            'id': By.ID,
            'css': By.CSS_SELECTOR,
            'xpath': By.XPATH,
            'name': By.NAME,
            'class_name': By.CLASS_NAME,
            'link_text': By.LINK_TEXT,
            'partial_link_text': By.PARTIAL_LINK_TEXT,
            'tag_name': By.TAG_NAME
        }
        return (locator_map.get(locator_type.lower(), By.ID), locator_value)

    @allure.step("Finding element: {locator}")
    def find_element(self, locator):
        converted_locator = self._convert_locator(locator)
        try:
            return WebDriverWait(self.driver, self.timeout).until(
                EC.visibility_of_element_located(converted_locator)
            )
        except TimeoutException:
            self.logger.error(f"Element not found within {self.timeout}s: {locator}")
            raise

    @allure.step("Finding elements: {locator}")
    def find_elements(self, locator):
        converted_locator = self._convert_locator(locator)
        return WebDriverWait(self.driver, self.timeout).until(
            EC.presence_of_all_elements_located(converted_locator)
        )

    # --- Actions ---

    @allure.step("Clicking element: {locator}")
    def click(self, locator):
        self.logger.info(f"Clicking element: {locator}")
        try:
            element = self.find_element(locator)
            self.wait_until_clickable(locator)
            element.click()
        except StaleElementReferenceException:
            self.logger.warning(f"StaleElementReferenceException for {locator}, retrying...")
            element = self.find_element(locator)
            element.click()

    @allure.step("Entering text '{text}' into {locator}")
    def enter_text(self, locator, text):
        self.logger.info(f"Entering text '{text}' into {locator}")
        element = self.find_element(locator)
        if element.get_attribute("type") in ["checkbox", "radio"]:
            if str(text).lower() in ["true", "checked", "yes", "1"] and not element.is_selected():
                element.click()
            elif str(text).lower() in ["false", "unchecked", "no", "0"] and element.is_selected():
                element.click()
        else:
            try: element.clear()
            except: pass
            element.send_keys(text)

    @allure.step("Getting text from {locator}")
    def get_text(self, locator):
        text = self.find_element(locator).text
        self.logger.info(f"Got text '{text}' from {locator}")
        return text

    # --- Advanced Interactions ---

    @allure.step("Scrolling to element: {locator}")
    def scroll_to_element(self, locator):
        self.logger.info(f"Scrolling to element: {locator}")
        element = self.find_element(locator)
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
        time.sleep(0.5) # Allow smooth scroll stability

    @allure.step("Hovering over element: {locator}")
    def hover_over_element(self, locator):
        self.logger.info(f"Hovering over element: {locator}")
        element = self.find_element(locator)
        ActionChains(self.driver).move_to_element(element).perform()

    @allure.step("Double clicking element: {locator}")
    def double_click(self, locator):
        self.logger.info(f"Double clicking element: {locator}")
        element = self.find_element(locator)
        ActionChains(self.driver).double_click(element).perform()

    @allure.step("Right clicking element: {locator}")
    def right_click(self, locator):
        self.logger.info(f"Right clicking element: {locator}")
        element = self.find_element(locator)
        ActionChains(self.driver).context_click(element).perform()

    # --- Waits & States ---

    def wait_until_clickable(self, locator, timeout=None):
        timeout = timeout or self.timeout
        converted_locator = self._convert_locator(locator)
        return WebDriverWait(self.driver, timeout).until(
            EC.element_to_be_clickable(converted_locator)
        )

    def is_element_visible(self, locator, timeout=2):
        converted_locator = self._convert_locator(locator)
        try:
            WebDriverWait(self.driver, timeout).until(
                EC.visibility_of_element_located(converted_locator)
            )
            return True
        except TimeoutException:
            return False

    # --- Browser Actions ---

    def get_title(self):
        return self.driver.title

    def get_current_url(self):
        return self.driver.current_url

    def refresh_page(self):
        self.driver.refresh()

    # --- Dropdowns & Alerts ---

    @allure.step("Selecting '{text}' from dropdown: {locator}")
    def select_dropdown_by_text(self, locator, text):
        self.logger.info(f"Selecting '{text}' from dropdown: {locator}")
        element = self.find_element(locator)
        select = Select(element)
        select.select_by_visible_text(text)

    def switch_to_alert_and_accept(self):
        try:
            alert = self.driver.switch_to.alert
            alert.accept()
            self.logger.info("Accepted alert")
        except:
            self.logger.warning("No alert found to accept")
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

const generatePageObject = (page: PageDefinition) => `from pages.base_page import BasePage
import allure

class ${page.name}(BasePage):
    # --- Locators (format: "locator_type", "locator_value") ---
${page.elements.map(el => { const v = el.locatorValue; const quoted = v.includes('"') ? `'${v.replace(/'/g, "\\'")}'` : `"${v}"`; return `    ${el.name.toUpperCase()}_LOCATOR = ("${mapLocatorType(el.locatorType)}", ${quoted})`; }).join('\n')}

    def __init__(self, driver):
        super().__init__(driver)

    # --- Actions ---
    # --- Actions ---
${page.elements.map(el => {
    const tag = el.tagName || '';
    const nameLower = el.name.toLowerCase();

    // 1. Clickable Elements (Button, Link, Checkbox, Radio, Submit)
    if (
        tag === 'button' ||
        tag === 'a' ||
        (tag === 'input' && ['button', 'submit', 'checkbox', 'radio', 'image'].some(t => nameLower.includes(t) || el.locatorValue.toLowerCase().includes(t))) ||
        nameLower.includes('btn') ||
        nameLower.includes('button') ||
        nameLower.includes('link')
    ) {
        return `    @allure.step("Click ${el.name}")\n    def click_${el.name}(self):\n        self.click(self.${el.name.toUpperCase()}_LOCATOR)\n`;
    }
    // 2. Text Input Elements (Input, Textarea) - Excluding non-text types
    else if (
        tag === 'textarea' ||
        (tag === 'input' && !['checkbox', 'radio', 'submit', 'button', 'hidden', 'file'].some(t => nameLower.includes(t) || el.locatorValue.toLowerCase().includes(t))) ||
        nameLower.includes('input') ||
        nameLower.includes('field') ||
        nameLower.includes('textarea') ||
        nameLower.includes('search') ||
        nameLower.includes('password') ||
        nameLower.includes('email')
    ) {
        return `    @allure.step("Fill ${el.name} with '{text}'")\n    def fill_${el.name}(self, text):\n        self.enter_text(self.${el.name.toUpperCase()}_LOCATOR, text)\n`;
    }
    // 3. Dropdowns (Select)
    else if (tag === 'select') {
        return `    @allure.step("Select '{text}' from ${el.name}")\n    def select_${el.name}(self, text):\n        self.select_dropdown_by_text(self.${el.name.toUpperCase()}_LOCATOR, text)\n`;
    }
    // 4. Default: Get Text
    else {
        return `    @allure.step("Get ${el.name} text")\n    def get_${el.name}_text(self):\n        return self.get_text(self.${el.name.toUpperCase()}_LOCATOR)\n`;
    }
}).join('\n')}
`;

/**
 * Generate type-specific test body code based on test type.
 * Uses knowledge base patterns for proper assertions per test category.
 */
const generateTypeSpecificTestBody = (
    test: TestCase,
    pages: PageDefinition[],
    pageName: string,
    pageClassName: string
): string => {
    const indent = '        ';
    const url = "config.get('environments', {}).get('dev', {}).get('base_url', '')";

    switch (test.type) {
        // ======================== SMOKE ========================
        case 'smoke': {
            if (test.name.includes('page_loads')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}# Assert page loaded (title is not empty)`,
                    `${indent}WebDriverWait(driver, 10).until(lambda d: d.title != "")`,
                    `${indent}assert driver.title, "Page title should not be empty after load"`,
                    `${indent}`,
                    `${indent}# Assert no error page`,
                    `${indent}assert "404" not in driver.title.lower(), "Page should not be a 404 error"`,
                    `${indent}assert "500" not in driver.page_source[:500].lower(), "Page should not have server error"`,
                    `${indent}`,
                    `${indent}# Assert body is visible`,
                    `${indent}body = driver.find_element(By.TAG_NAME, "body")`,
                    `${indent}assert body.is_displayed(), "Page body should be visible"`,
                ].join('\n');
            } else if (test.name.includes('elements_visible') || test.name.includes('key_elements')) {
                const checks = test.steps.map(step => {
                    const elName = step.value || step.description.split(' ').pop() || 'element';
                    return [
                        `${indent}try:`,
                        `${indent}    el = WebDriverWait(driver, 5).until(`,
                        `${indent}        EC.presence_of_element_located((By.CSS_SELECTOR, "[id*='${elName}'], [name*='${elName}'], [class*='${elName}']"))`,
                        `${indent}    )`,
                        `${indent}    assert el.is_displayed(), "Element '${elName}' should be visible"`,
                        `${indent}except TimeoutException:`,
                        `${indent}    allure.attach(f"Element '${elName}' not found", name="warning", attachment_type=allure.attachment_type.TEXT)`,
                    ].join('\n');
                });
                return [`${indent}driver.get(${url})`, '', ...checks].join('\n');
            } else if (test.name.includes('login_flow')) {
                const steps: string[] = [`${indent}driver.get(${url})`];
                test.steps.forEach((step, index) => {
                    const desc = step.description.toLowerCase();
                    if (step.action === 'input') {
                        for (const page of pages) {
                            for (const el of page.elements) {
                                if (desc.includes(el.name.toLowerCase())) {
                                    steps.push(`${indent}with allure.step(f"${index + 1}. ${step.description.replace(/"/g, '\\"')} \\n"):`);
                                    steps.push(`${indent}    ${pageName}.fill_${el.name}("${step.value || 'test'}")`);
                                    steps.push(`${indent}    self.logger.info("${step.description} executed successfully")`);
                                    return;
                                }
                            }
                        }
                    } else if (step.action === 'click') {
                        for (const page of pages) {
                            for (const el of page.elements) {
                                if (desc.includes(el.name.toLowerCase())) {
                                    steps.push(`${indent}with allure.step(f"${index + 1}. ${step.description.replace(/"/g, '\\"')} \\n"):`);
                                    steps.push(`${indent}    ${pageName}.click_${el.name}()`);
                                    steps.push(`${indent}    self.logger.info("${step.description} executed successfully")`);
                                    return;
                                }
                            }
                        }
                    }
                });
                steps.push('');
                steps.push(`${indent}# Assert successful login`);
                steps.push(`${indent}WebDriverWait(driver, 10).until(`);
                steps.push(`${indent}    lambda d: d.current_url != ${url} or`);
                steps.push(`${indent}    len(d.find_elements(By.CSS_SELECTOR, ".success, .dashboard, [class*='welcome']")) > 0`);
                steps.push(`${indent})`);
                steps.push(`${indent}assert "error" not in driver.page_source.lower()[:500], "Login should not show error for valid credentials"`);
                return steps.join('\n');
            }
            // Generic smoke fallback
            return [
                `${indent}driver.get(${url})`,
                `${indent}WebDriverWait(driver, 10).until(lambda d: d.title != "")`,
                `${indent}assert driver.title, "Page should have a title"`,
            ].join('\n');
        }

        // ======================== FUNCTIONAL ========================
        case 'functional': {
            const steps: string[] = [`${indent}driver.get(${url})`];
            let hasSubmit = false;

            test.steps.forEach((step, index) => {
                const desc = step.description.toLowerCase();
                if (step.action === 'input') {
                    for (const page of pages) {
                        for (const el of page.elements) {
                            if (desc.includes(el.name.toLowerCase())) {
                                const safeValue = (step.value || 'test').replace(/"/g, '\\"');
                                steps.push(`${indent}with allure.step(f"${index + 1}. ${step.description.replace(/"/g, '\\"')} \\n"):`);
                                steps.push(`${indent}    ${pageName}.fill_${el.name}("${safeValue}")`);
                                steps.push(`${indent}    self.logger.info("${step.description} executed successfully")`);
                                if (desc.includes('search') || desc.includes('submit')) hasSubmit = true;
                                return;
                            }
                        }
                    }
                    // Fallback input if no matching element found
                    steps.push(`${indent}with allure.step(f"${index + 1}. ${step.description.replace(/"/g, '\\"')} (Fallback Input) \\n"):`);
                    steps.push(`${indent}    self.logger.warning("No specific element found for input: ${step.description}")`);
                } else if (step.action === 'click') {
                    for (const page of pages) {
                        for (const el of page.elements) {
                            if (desc.includes(el.name.toLowerCase())) {
                                steps.push(`${indent}with allure.step(f"${index + 1}. ${step.description.replace(/"/g, '\\"')} \\n"):`);
                                steps.push(`${indent}    ${pageName}.click_${el.name}()`);
                                steps.push(`${indent}    self.logger.info("${step.description} executed successfully")`);
                                if (desc.includes('submit') || desc.includes('login') || desc.includes('search')) hasSubmit = true;
                                return;
                            }
                        }
                    }
                    // Fallback click if no matching element found
                    steps.push(`${indent}with allure.step(f"${index + 1}. ${step.description.replace(/"/g, '\\"')} (Fallback Click) \\n"):`);
                    steps.push(`${indent}    self.logger.warning("No specific element found for click: ${step.description}")`);
                } else if (step.action === 'assert_visible') {
                    steps.push(`${indent}with allure.step(f"${index + 1}. Verify: ${step.description.replace(/"/g, '\\"')} \\n"):`);
                    steps.push(`${indent}    # This step requires specific element identification to assert visibility`);
                    steps.push(`${indent}    self.logger.info("Verification step: ${step.description}")`);
                }
            });

            steps.push('');
            if (hasSubmit) {
                steps.push(`${indent}# Assert success outcome (URL change, success message, or no errors)`);
                steps.push(`${indent}time.sleep(1)  # Brief wait for response`);
                steps.push(`${indent}error_elements = driver.find_elements(By.CSS_SELECTOR, ".error, .alert-danger, .alert-error, [class*='error']")`);
                steps.push(`${indent}visible_errors = [e for e in error_elements if e.is_displayed()]`);
                steps.push(`${indent}assert len(visible_errors) == 0, \\`);
                steps.push(`${indent}    f"No error messages should appear after valid input, found: {[e.text for e in visible_errors]}"`);
            } else {
                steps.push(`${indent}# Assert elements are interactive`);
                steps.push(`${indent}body = driver.find_element(By.TAG_NAME, "body")`);
                steps.push(`${indent}assert body.is_displayed(), "Page should remain functional"`);
            }
            return steps.join('\n');
        }

        // ======================== NEGATIVE ========================
        case 'negative': {
            if (test.name.includes('empty_form') || test.name.includes('empty_submit')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}# Submit without filling any fields`,
                    ...(() => {
                        for (const page of pages) {
                            for (const el of page.elements) {
                                if (el.name.toLowerCase().includes('submit') || el.name.toLowerCase().includes('login') || el.name.toLowerCase().includes('btn')) {
                                    return [`${indent}${pageName}.click_${el.name}()`];
                                }
                            }
                        }
                        return [`${indent}submit_btns = driver.find_elements(By.CSS_SELECTOR, "button[type='submit'], input[type='submit'], button")`,
                        `${indent}if submit_btns:`,
                        `${indent}    submit_btns[0].click()`];
                    })(),
                    `${indent}`,
                    `${indent}# Assert validation error appears`,
                    `${indent}time.sleep(1)`,
                    `${indent}error_selectors = [`,
                    `${indent}    ".error", ".alert-danger", ".invalid-feedback",`,
                    `${indent}    "[class*='error']", "[role='alert']", ".help-block"`,
                    `${indent}]`,
                    `${indent}error_found = False`,
                    `${indent}for selector in error_selectors:`,
                    `${indent}    errors = driver.find_elements(By.CSS_SELECTOR, selector)`,
                    `${indent}    if any(e.is_displayed() for e in errors):`,
                    `${indent}        error_found = True`,
                    `${indent}        break`,
                    `${indent}`,
                    `${indent}# Check HTML5 validation as fallback`,
                    `${indent}if not error_found:`,
                    `${indent}    invalid_count = driver.execute_script(`,
                    `${indent}        "return document.querySelectorAll('input:invalid, select:invalid, textarea:invalid').length"`,
                    `${indent}    )`,
                    `${indent}    error_found = invalid_count > 0`,
                    `${indent}`,
                    `${indent}# Check URL hasn't changed (form didn't actually submit)`,
                    `${indent}if not error_found:`,
                    `${indent}    error_found = ${url} in driver.current_url`,
                    `${indent}`,
                    `${indent}assert error_found, "Validation error should appear when form is submitted empty"`,
                ].join('\n');
            }
            // Invalid input (special chars, long strings, etc.)
            const inputValue = test.steps.find(s => s.action === 'input')?.value || '!@#$%^&*()';
            return [
                `${indent}driver.get(${url})`,
                `${indent}`,
                `${indent}# Enter invalid data`,
                `${indent}invalid_data = "${inputValue.substring(0, 50).replace(/"/g, '\\"')}"`,
                ...(() => {
                    const lines: string[] = [];
                    test.steps.forEach(step => {
                        if (step.action === 'input') {
                            for (const page of pages) {
                                for (const el of page.elements) {
                                    if (step.description.toLowerCase().includes(el.name.toLowerCase())) {
                                        lines.push(`${indent}${pageName}.fill_${el.name}(invalid_data)`);
                                        return;
                                    }
                                }
                            }
                        } else if (step.action === 'click') {
                            for (const page of pages) {
                                for (const el of page.elements) {
                                    if (step.description.toLowerCase().includes(el.name.toLowerCase())) {
                                        lines.push(`${indent}${pageName}.click_${el.name}()`);
                                        return;
                                    }
                                }
                            }
                        }
                    });
                    return lines;
                })(),
                `${indent}`,
                `${indent}# Assert: App does NOT crash (no unhandled error page)`,
                `${indent}assert "500" not in driver.page_source[:500], "Server should not crash with invalid input"`,
                `${indent}assert "Internal Server Error" not in driver.page_source[:500], "No server errors with invalid input"`,
                `${indent}`,
                `${indent}# Assert: Error is handled gracefully`,
                `${indent}error_elements = driver.find_elements(By.CSS_SELECTOR, ".error, .alert-danger, [class*='error'], [class*='invalid']")`,
                `${indent}url_unchanged = ${url} in driver.current_url`,
                `${indent}has_error_msg = any(e.is_displayed() for e in error_elements) if error_elements else False`,
                `${indent}assert has_error_msg or url_unchanged, \\`,
                `${indent}    "Application should show validation error or reject the invalid input"`,
            ].join('\n');
        }

        // ======================== SECURITY ========================
        case 'security': {
            if (test.name.includes('xss')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}xss_payloads = [`,
                    `${indent}    "<script>alert('XSS')</script>",`,
                    `${indent}    "<img src=x onerror=alert(1)>",`,
                    `${indent}    "'\\"><script>alert(1)</script>",`,
                    `${indent}    "<svg onload=alert(1)>",`,
                    `${indent}    "javascript:alert(1)",`,
                    `${indent}]`,
                    `${indent}`,
                    `${indent}for payload in xss_payloads:`,
                    `${indent}    # Inject payload into each input field`,
                    `${indent}    inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='text'], input[type='email'], input:not([type='hidden']):not([type='submit']):not([type='password']), textarea")`,
                    `${indent}    for inp in inputs[:3]:`,
                    `${indent}        try:`,
                    `${indent}            inp.clear()`,
                    `${indent}            inp.send_keys(payload)`,
                    `${indent}        except Exception:`,
                    `${indent}            pass`,
                    `${indent}    `,
                    `${indent}    # Try to submit`,
                    `${indent}    submit_btns = driver.find_elements(By.CSS_SELECTOR, "button[type='submit'], input[type='submit'], button")`,
                    `${indent}    if submit_btns:`,
                    `${indent}        try:`,
                    `${indent}            submit_btns[0].click()`,
                    `${indent}        except Exception:`,
                    `${indent}            pass`,
                    `${indent}    `,
                    `${indent}    # Assert: No JavaScript alert was triggered`,
                    `${indent}    try:`,
                    `${indent}        alert = driver.switch_to.alert`,
                    `${indent}        alert_text = alert.text`,
                    `${indent}        alert.dismiss()`,
                    `${indent}        pytest.fail(f"XSS vulnerability! Alert triggered with text: {alert_text}")`,
                    `${indent}    except Exception:`,
                    `${indent}        pass  # Good - no alert means XSS was blocked`,
                    `${indent}    `,
                    `${indent}    # Assert: Payload is NOT rendered as executable HTML`,
                    `${indent}    page_source = driver.page_source`,
                    `${indent}    assert "<script>alert" not in page_source.lower(), \\`,
                    `${indent}        f"XSS payload should be escaped, not rendered as HTML"`,
                    `${indent}    `,
                    `${indent}    # Reset for next payload`,
                    `${indent}    driver.get(${url})`,
                ].join('\n');
            } else if (test.name.includes('sql')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}sql_payloads = [`,
                    `${indent}    "' OR 1=1 --",`,
                    `${indent}    "1; DROP TABLE users --",`,
                    `${indent}    "' UNION SELECT * FROM users --",`,
                    `${indent}    "admin'--",`,
                    `${indent}    "1' OR '1'='1",`,
                    `${indent}]`,
                    `${indent}`,
                    `${indent}initial_url = driver.current_url`,
                    `${indent}`,
                    `${indent}for payload in sql_payloads:`,
                    `${indent}    inputs = driver.find_elements(By.CSS_SELECTOR, "input[type='text'], input[type='email'], input:not([type='hidden']):not([type='submit']), textarea")`,
                    `${indent}    for inp in inputs[:2]:`,
                    `${indent}        try:`,
                    `${indent}            inp.clear()`,
                    `${indent}            inp.send_keys(payload)`,
                    `${indent}        except Exception:`,
                    `${indent}            pass`,
                    `${indent}    `,
                    `${indent}    submit_btns = driver.find_elements(By.CSS_SELECTOR, "button[type='submit'], input[type='submit'], button")`,
                    `${indent}    if submit_btns:`,
                    `${indent}        try:`,
                    `${indent}            submit_btns[0].click()`,
                    `${indent}        except Exception:`,
                    `${indent}            pass`,
                    `${indent}    `,
                    `${indent}    # Assert: Should NOT bypass authentication / show unauthorized content`,
                    `${indent}    time.sleep(1)`,
                    `${indent}    error_indicators = driver.find_elements(By.CSS_SELECTOR,`,
                    `${indent}        ".error, .alert-danger, [class*='error'], [class*='invalid']")`,
                    `${indent}    url_safe = initial_url in driver.current_url or ${url} in driver.current_url`,
                    `${indent}    has_error = any(e.is_displayed() for e in error_indicators) if error_indicators else False`,
                    `${indent}    `,
                    `${indent}    assert url_safe or has_error, \\`,
                    `${indent}        f"SQL injection payload '{payload}' should NOT grant unauthorized access"`,
                    `${indent}    `,
                    `${indent}    driver.get(${url})  # Reset`,
                ].join('\n');
            } else if (test.name.includes('password_masking') || test.name.includes('password')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}# Find all password-like fields`,
                    `${indent}password_fields = driver.find_elements(By.CSS_SELECTOR,`,
                    `${indent}    "input[type='password'], input[name*='pass'], input[id*='pass']")`,
                    `${indent}`,
                    `${indent}for field in password_fields:`,
                    `${indent}    input_type = field.get_attribute("type")`,
                    `${indent}    assert input_type == "password", \\`,
                    `${indent}        f"Password field should have type='password', got '{input_type}'"`,
                    `${indent}    `,
                    `${indent}    # Verify autocomplete is secure`,
                    `${indent}    autocomplete = field.get_attribute("autocomplete")`,
                    `${indent}    if autocomplete:`,
                    `${indent}        assert autocomplete in ["off", "new-password", "current-password"], \\`,
                    `${indent}            f"Password autocomplete should be secure, got '{autocomplete}'"`,
                    `${indent}`,
                    `${indent}# Also check no text fields are named like passwords`,
                    `${indent}exposed_pass = driver.find_elements(By.CSS_SELECTOR,`,
                    `${indent}    "input[type='text'][name*='pass'], input[type='text'][name*='pwd']")`,
                    `${indent}assert len(exposed_pass) == 0, \\`,
                    `${indent}    "Password-like fields found using type='text' instead of type='password'"`,
                ].join('\n');
            }
            // Generic security fallback
            return [
                `${indent}driver.get(${url})`,
                `${indent}assert "error" not in driver.title.lower(), "No security errors on page"`,
            ].join('\n');
        }

        // ======================== PERFORMANCE ========================
        case 'performance': {
            if (test.name.includes('load_time') || test.name.includes('page_load')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}# Use Navigation Timing API for precise measurement`,
                    `${indent}load_time = driver.execute_script("""`,
                    `${indent}    var perf = window.performance.timing;`,
                    `${indent}    return perf.loadEventEnd - perf.navigationStart;`,
                    `${indent}""")`,
                    `${indent}`,
                    `${indent}# If loadEventEnd hasn't fired yet, wait and retry`,
                    `${indent}if load_time <= 0:`,
                    `${indent}    time.sleep(2)`,
                    `${indent}    load_time = driver.execute_script("""`,
                    `${indent}        var perf = window.performance.timing;`,
                    `${indent}        return perf.loadEventEnd - perf.navigationStart;`,
                    `${indent}    """)`,
                    `${indent}`,
                    `${indent}max_load_time_ms = 5000  # 5 seconds threshold`,
                    `${indent}assert load_time > 0, "Load time should be measurable (> 0)"`,
                    `${indent}assert load_time < max_load_time_ms, \\`,
                    `${indent}    f"Page load time {load_time}ms exceeds threshold {max_load_time_ms}ms"`,
                    `${indent}allure.attach(f"Page Load Time: {load_time}ms", name="performance", attachment_type=allure.attachment_type.TEXT)`,
                ].join('\n');
            } else if (test.name.includes('dom_content')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}# Measure DOM Content Loaded time via Navigation Timing API`,
                    `${indent}dom_ready_time = driver.execute_script("""`,
                    `${indent}    var perf = window.performance.timing;`,
                    `${indent}    return perf.domContentLoadedEventEnd - perf.navigationStart;`,
                    `${indent}""")`,
                    `${indent}`,
                    `${indent}max_dom_ready_ms = 3000  # 3 seconds threshold`,
                    `${indent}assert dom_ready_time > 0, "DOM ready time should be measurable"`,
                    `${indent}assert dom_ready_time < max_dom_ready_ms, \\`,
                    `${indent}    f"DOM interactive time {dom_ready_time}ms exceeds {max_dom_ready_ms}ms"`,
                    `${indent}allure.attach(f"DOM Ready: {dom_ready_time}ms", name="dom_ready", attachment_type=allure.attachment_type.TEXT)`,
                ].join('\n');
            } else if (test.name.includes('responsiveness') || test.name.includes('input_response')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}# Measure Time to First Byte (TTFB)`,
                    `${indent}ttfb = driver.execute_script("""`,
                    `${indent}    var perf = window.performance.timing;`,
                    `${indent}    return perf.responseStart - perf.navigationStart;`,
                    `${indent}""")`,
                    `${indent}`,
                    `${indent}max_ttfb_ms = 1500  # 1.5 seconds`,
                    `${indent}assert ttfb > 0, "TTFB should be measurable"`,
                    `${indent}assert ttfb < max_ttfb_ms, \\`,
                    `${indent}    f"Time to First Byte {ttfb}ms exceeds threshold {max_ttfb_ms}ms"`,
                    `${indent}`,
                    `${indent}# Verify inputs respond quickly`,
                    `${indent}inputs = driver.find_elements(By.CSS_SELECTOR, "input:not([type='hidden'])")`,
                    `${indent}for inp in inputs[:3]:`,
                    `${indent}    start = time.time()`,
                    `${indent}    try:`,
                    `${indent}        WebDriverWait(driver, 2).until(EC.element_to_be_clickable(inp))`,
                    `${indent}        response_time = time.time() - start`,
                    `${indent}        assert response_time < 2, f"Input took {response_time:.2f}s to become clickable"`,
                    `${indent}    except TimeoutException:`,
                    `${indent}        pytest.fail("Input was not interactable within 2 seconds")`,
                ].join('\n');
            }
            // Generic performance (resource count etc.)
            return [
                `${indent}driver.get(${url})`,
                `${indent}`,
                `${indent}resource_count = driver.execute_script(`,
                `${indent}    "return window.performance.getEntriesByType('resource').length"`,
                `${indent})`,
                `${indent}`,
                `${indent}max_resources = 100`,
                `${indent}assert resource_count < max_resources, \\`,
                `${indent}    f"Page loads {resource_count} resources, exceeds {max_resources} threshold"`,
                `${indent}allure.attach(f"Resources: {resource_count}", name="resource_count", attachment_type=allure.attachment_type.TEXT)`,
            ].join('\n');
        }

        // ======================== ACCESSIBILITY ========================
        case 'accessibility': {
            if (test.name.includes('alt_text') || test.name.includes('images')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}# WCAG 1.1.1: All images must have alt text`,
                    `${indent}images = driver.find_elements(By.TAG_NAME, "img")`,
                    `${indent}images_without_alt = []`,
                    `${indent}for img in images:`,
                    `${indent}    alt = img.get_attribute("alt")`,
                    `${indent}    src = img.get_attribute("src") or "unknown"`,
                    `${indent}    if alt is None:  # Missing alt attribute entirely`,
                    `${indent}        images_without_alt.append(src[-50:])`,
                    `${indent}`,
                    `${indent}assert len(images_without_alt) == 0, \\`,
                    `${indent}    f"{len(images_without_alt)} images missing alt attribute: {images_without_alt[:5]}"`,
                ].join('\n');
            } else if (test.name.includes('labels') || test.name.includes('input')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}# WCAG 1.3.1: All form inputs must have associated labels`,
                    `${indent}unlabeled = driver.execute_script("""`,
                    `${indent}    var inputs = document.querySelectorAll('input, select, textarea');`,
                    `${indent}    var unlabeled = [];`,
                    `${indent}    inputs.forEach(function(input) {`,
                    `${indent}        if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') return;`,
                    `${indent}        var id = input.id;`,
                    `${indent}        var hasLabel = id && document.querySelector('label[for="' + id + '"]');`,
                    `${indent}        var hasAriaLabel = input.getAttribute('aria-label');`,
                    `${indent}        var hasAriaLabelledBy = input.getAttribute('aria-labelledby');`,
                    `${indent}        var hasTitle = input.getAttribute('title');`,
                    `${indent}        var wrappedInLabel = input.closest('label');`,
                    `${indent}        if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle && !wrappedInLabel) {`,
                    `${indent}            unlabeled.push(input.name || input.id || input.type || 'unknown');`,
                    `${indent}        }`,
                    `${indent}    });`,
                    `${indent}    return unlabeled;`,
                    `${indent}""")`,
                    `${indent}`,
                    `${indent}assert len(unlabeled) == 0, \\`,
                    `${indent}    f"{len(unlabeled)} inputs missing labels: {unlabeled[:5]}"`,
                ].join('\n');
            } else if (test.name.includes('heading') || test.name.includes('hierarchy')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}# WCAG 1.3.1: Heading tags must follow proper hierarchy`,
                    `${indent}headings = driver.execute_script("""`,
                    `${indent}    var items = document.querySelectorAll('h1, h2, h3, h4, h5, h6');`,
                    `${indent}    var levels = [];`,
                    `${indent}    items.forEach(function(h) { levels.push(parseInt(h.tagName[1])); });`,
                    `${indent}    return levels;`,
                    `${indent}""")`,
                    `${indent}`,
                    `${indent}if len(headings) > 0:`,
                    `${indent}    # Should start with h1`,
                    `${indent}    assert headings[0] == 1, f"First heading should be h1, got h{headings[0]}"`,
                    `${indent}    `,
                    `${indent}    # No heading should skip more than one level`,
                    `${indent}    for i in range(1, len(headings)):`,
                    `${indent}        diff = headings[i] - headings[i-1]`,
                    `${indent}        assert diff <= 1, \\`,
                    `${indent}            f"Heading hierarchy broken at position {i}: h{headings[i-1]} -> h{headings[i]}"`,
                ].join('\n');
            } else if (test.name.includes('keyboard')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}# WCAG 2.1.1: Interactive elements must be keyboard accessible`,
                    `${indent}body = driver.find_element(By.TAG_NAME, "body")`,
                    `${indent}body.send_keys(Keys.TAB)`,
                    `${indent}`,
                    `${indent}focused = driver.switch_to.active_element`,
                    `${indent}assert focused is not None, "Tab key should move focus to an element"`,
                    `${indent}assert focused.tag_name != "body", \\`,
                    `${indent}    "Focus should move from body to an interactive element"`,
                    `${indent}`,
                    `${indent}# Verify focus is visible (element has outline or visible indicator)`,
                    `${indent}allure.attach(f"First focused: {focused.tag_name}#{focused.get_attribute('id') or ''}", `,
                    `${indent}    name="keyboard_nav", attachment_type=allure.attachment_type.TEXT)`,
                ].join('\n');
            } else if (test.name.includes('aria') || test.name.includes('landmark')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}# WCAG 1.3.1: ARIA landmark roles should be present`,
                    `${indent}landmarks = driver.execute_script("""`,
                    `${indent}    var roles = ['banner', 'navigation', 'main', 'contentinfo'];`,
                    `${indent}    var found = {};`,
                    `${indent}    roles.forEach(function(role) {`,
                    `${indent}        found[role] = document.querySelectorAll('[role="' + role + '"]').length > 0 ||`,
                    `${indent}            document.querySelectorAll(`,
                    `${indent}                role === 'banner' ? 'header' :`,
                    `${indent}                role === 'navigation' ? 'nav' :`,
                    `${indent}                role === 'main' ? 'main' : 'footer'`,
                    `${indent}            ).length > 0;`,
                    `${indent}    });`,
                    `${indent}    return found;`,
                    `${indent}""")`,
                    `${indent}`,
                    `${indent}assert landmarks.get("main", False), \\`,
                    `${indent}    "Page should have a <main> element or role='main' landmark"`,
                ].join('\n');
            }
            // Generic accessibility
            return [
                `${indent}driver.get(${url})`,
                `${indent}# Font size check`,
                `${indent}small_text = driver.execute_script("""`,
                `${indent}    var all = document.querySelectorAll('p, span, a, li, td, label');`,
                `${indent}    var tooSmall = [];`,
                `${indent}    all.forEach(function(el) {`,
                `${indent}        var size = parseFloat(window.getComputedStyle(el).fontSize);`,
                `${indent}        if (size < 12 && el.textContent.trim().length > 0) {`,
                `${indent}            tooSmall.push({tag: el.tagName, size: size});`,
                `${indent}        }`,
                `${indent}    });`,
                `${indent}    return tooSmall.slice(0, 5);`,
                `${indent}""")`,
                `${indent}assert len(small_text) == 0, f"Text below 12px found: {small_text}"`,
            ].join('\n');
        }

        // ======================== INTEGRATION ========================
        case 'integration': {
            if (test.name.includes('form_submission') || test.name.includes('form_submit')) {
                const steps: string[] = [
                    `${indent}driver.get(${url})`,
                    `${indent}initial_url = driver.current_url`,
                ];
                test.steps.forEach(step => {
                    if (step.action === 'input') {
                        for (const page of pages) {
                            for (const el of page.elements) {
                                if (step.description.toLowerCase().includes(el.name.toLowerCase())) {
                                    steps.push(`${indent}${pageName}.fill_${el.name}("${step.value || 'integration_test'}")`);
                                    return;
                                }
                            }
                        }
                    } else if (step.action === 'click') {
                        for (const page of pages) {
                            for (const el of page.elements) {
                                if (step.description.toLowerCase().includes(el.name.toLowerCase())) {
                                    steps.push(`${indent}${pageName}.click_${el.name}()`);
                                    return;
                                }
                            }
                        }
                    }
                });
                steps.push('');
                steps.push(`${indent}# Assert: Response received (URL changed OR success element appeared)`);
                steps.push(`${indent}time.sleep(2)`);
                steps.push(`${indent}url_changed = driver.current_url != initial_url`);
                steps.push(`${indent}success_elements = driver.find_elements(By.CSS_SELECTOR,`);
                steps.push(`${indent}    ".success, .alert-success, .confirmation, [class*='success']")`);
                steps.push(`${indent}has_success = any(e.is_displayed() for e in success_elements) if success_elements else False`);
                steps.push(`${indent}`);
                steps.push(`${indent}assert url_changed or has_success, \\`);
                steps.push(`${indent}    "Form submission should produce a response (URL change or success message)"`);
                return steps.join('\n');
            } else if (test.name.includes('navigation_links') || test.name.includes('links')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}# Verify navigation links resolve (no 404)`,
                    `${indent}links = driver.find_elements(By.CSS_SELECTOR, "nav a[href], .nav a[href], header a[href]")`,
                    `${indent}broken_links = []`,
                    `${indent}`,
                    `${indent}for link in links[:10]:  # Test first 10 links`,
                    `${indent}    href = link.get_attribute("href")`,
                    `${indent}    if not href or href.startswith("javascript:") or href.startswith("#"):`,
                    `${indent}        continue`,
                    `${indent}    `,
                    `${indent}    driver.get(href)`,
                    `${indent}    if "404" in driver.title.lower() or "not found" in driver.title.lower():`,
                    `${indent}        broken_links.append(href)`,
                    `${indent}    driver.back()`,
                    `${indent}`,
                    `${indent}assert len(broken_links) == 0, \\`,
                    `${indent}    f"Found {len(broken_links)} broken links: {broken_links}"`,
                ].join('\n');
            } else if (test.name.includes('console_errors') || test.name.includes('console')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}# Verify no JavaScript errors in browser console`,
                    `${indent}try:`,
                    `${indent}    logs = driver.get_log("browser")`,
                    `${indent}    severe_errors = [log for log in logs if log.get("level") == "SEVERE"]`,
                    `${indent}    `,
                    `${indent}    # Filter acceptable errors (favicon 404, etc.)`,
                    `${indent}    real_errors = [`,
                    `${indent}        log for log in severe_errors`,
                    `${indent}        if "favicon" not in log.get("message", "").lower()`,
                    `${indent}    ]`,
                    `${indent}    `,
                    `${indent}    assert len(real_errors) == 0, \\`,
                    `${indent}        f"Found {len(real_errors)} console errors: {[e['message'][:100] for e in real_errors]}"`,
                    `${indent}except Exception:`,
                    `${indent}    pass  # Some drivers don't support get_log`,
                ].join('\n');
            }
            // Generic integration (cookies)
            return [
                `${indent}driver.get(${url})`,
                `${indent}`,
                `${indent}# Verify cookies are set correctly`,
                `${indent}cookies = driver.get_cookies()`,
                `${indent}for cookie in cookies:`,
                `${indent}    assert len(cookie.get("value", "")) < 4096, \\`,
                `${indent}        f"Cookie '{cookie['name']}' value exceeds 4KB limit"`,
            ].join('\n');
        }

        // ======================== REGRESSION ========================
        case 'regression': {
            if (test.name.includes('element_count') || test.name.includes('baseline')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}# Verify interactive elements count baseline`,
                    `${indent}counts = driver.execute_script("""`,
                    `${indent}    return {`,
                    `${indent}        'inputs': document.querySelectorAll('input').length,`,
                    `${indent}        'buttons': document.querySelectorAll('button').length,`,
                    `${indent}        'links': document.querySelectorAll('a').length,`,
                    `${indent}        'forms': document.querySelectorAll('form').length,`,
                    `${indent}        'images': document.querySelectorAll('img').length`,
                    `${indent}    };`,
                    `${indent}""")`,
                    `${indent}`,
                    `${indent}# Assert minimum expected elements exist`,
                    `${indent}assert counts["inputs"] >= 0, "Input count should be non-negative"`,
                    `${indent}assert counts["buttons"] >= 0, "Button count should be non-negative"`,
                    `${indent}`,
                    `${indent}# Log counts for baseline tracking`,
                    `${indent}allure.attach(`,
                    `${indent}    str(counts),`,
                    `${indent}    name="Element Counts Baseline",`,
                    `${indent}    attachment_type=allure.attachment_type.JSON`,
                    `${indent})`,
                ].join('\n');
            } else if (test.name.includes('title') || test.name.includes('consistency')) {
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}`,
                    `${indent}# Verify page title matches expected baseline`,
                    `${indent}title = driver.title`,
                    `${indent}assert title and len(title) > 0, "Page title should not be empty"`,
                    `${indent}allure.attach(title, name="Page Title", attachment_type=allure.attachment_type.TEXT)`,
                ].join('\n');
            } else if (test.name.includes('locators') || test.name.includes('valid')) {
                const checks = test.steps.map(step => {
                    const elName = step.value || step.description.split(' ').pop() || 'element';
                    return [
                        `${indent}try:`,
                        `${indent}    el = driver.find_element(By.CSS_SELECTOR, "[id*='${elName}'], [name*='${elName}'], [class*='${elName}']")`,
                        `${indent}    assert el, f"Locator for '${elName}' should still find an element"`,
                        `${indent}except NoSuchElementException:`,
                        `${indent}    invalid_locators.append("${elName}")`,
                    ].join('\n');
                });
                return [
                    `${indent}driver.get(${url})`,
                    `${indent}invalid_locators = []`,
                    '',
                    ...checks,
                    '',
                    `${indent}assert len(invalid_locators) == 0, \\`,
                    `${indent}    f"{len(invalid_locators)} locators no longer valid: {invalid_locators}"`,
                ].join('\n');
            }
            // Generic regression
            return [
                `${indent}driver.get(${url})`,
                `${indent}`,
                `${indent}# Verify major layout elements are visible`,
                `${indent}body = driver.find_element(By.TAG_NAME, "body")`,
                `${indent}assert body.is_displayed(), "Page body should be visible"`,
                `${indent}`,
                `${indent}main_content = driver.find_elements(By.CSS_SELECTOR, "main, #main, .main, [role='main'], #content")`,
                `${indent}visible = [e for e in main_content if e.is_displayed()]`,
                `${indent}assert len(visible) > 0 or body.is_displayed(), "Layout should have visible content"`,
            ].join('\n');
        }

        default:
            return `${indent}driver.get(${url})\n${indent}assert driver.title, "Page should load"`;
    }
};


const generateTestFile = (tests: TestCase[], pages: PageDefinition[], projectName: string) => {
    const pageName = pages[0]?.name.toLowerCase() || 'page';
    const pageClassName = pages[0]?.name || 'Page';

    return `import pytest
import time
import allure
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from tests.base_test import BaseTest
${pages.map(p => `from pages.${convertTitleToSnake(p.name)} import ${p.name}`).join('\n')}

@allure.epic("${projectName}")
@allure.feature("${pageClassName}")
class Test${pageClassName}(BaseTest):

${tests.map(test => `    @allure.story("${test.name}")
    @allure.title("${test.name} Execution")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.${test.type}
    def ${test.name}(self, driver, config):
        """
        Test Case: ${test.name}
        Type: ${test.type}
        Steps:
        ${test.steps.map((s, idx) => `${idx + 1}. ${s.description}`).join('\n        ')}
        """
        # Initialize Page Objects
        ${pages.map(p => `${p.name.toLowerCase()} = ${p.name}(driver)`).join('\n        ')}
        
${generateTypeSpecificTestBody(test, pages, pageName, pageClassName)}
`).join('\n\n')}
`;
};


// --- Helpers ---
const mapLocatorType = (type: string) => {
    const t = type.toLowerCase();
    switch (t) {
        case 'classname': return 'class name';
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
    def setup_and_teardown(self, driver, request):
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