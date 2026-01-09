import { AutomationProject, PageDefinition, TestCase } from "../types";

export const generatePyTestFramework = (project: AutomationProject): Map<string, string> => {
    const files = new Map<string, string>();

    // 1. Root Config Files
    files.set('requirements.txt', `pytest==7.4.0\nselenium==4.10.0\nallure-pytest==2.13.2\ncolorlog==6.7.0\nwebdriver-manager==4.0.0\npytest-xdist==3.3.1\nPyYAML==6.0.1`);
    files.set('pytest.ini', `[pytest]\naddopts = --alluredir=./allure-results --clean-alluredir --log-cli-level=INFO\nlog_cli = true\nlog_cli_format = %(asctime)s [%(levelname)8s] %(message)s (%(filename)s:%(lineno)s)\nlog_cli_date_format = %Y-%m-%d %H:%M:%S\npython_files = test_*.py`);

    files.set('config/config.yaml', `
browser:
  default: "${project.config.browser || 'chrome'}"
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
    files.set('conftest.py', generateConftest());

    // 3. Utilities
    files.set('utils/__init__.py', '');
    files.set('utils/driver_factory.py', generateDriverFactory());
    // files.set('utils/base_page.py', generateBasePage()); // Moved to pages/
    files.set('utils/data_reader.py', generateDataReader());
    files.set('utils/logger.py', generateLogger());
    files.set('config/environment.py', generateEnvironment());

    // 4. Pages (One file per page)
    files.set('pages/__init__.py', '');
    files.set('pages/base_page.py', generateBasePage());
    project.pages.forEach(page => {
        files.set(`pages/${convertTitleToSnake(page.name)}.py`, generatePageObject(page));
    });

    // 5. Tests (One file per page/group)
    files.set('tests/__init__.py', '');
    files.set('tests/base_test.py', generateBaseTest());

    // Group tests by logic or fallback to 'test_scenarios.py'
    // For now, if we have multiple pages, we try to create test_page_name.py
    if (project.pages.length > 0) {
        project.pages.forEach(page => {
            // Find tests relevant to this page (heuristic: name match or generic)
            // Simpler approach: If we have generated tests specifically tagged for a page, use that. 
            // Currently tests are global. Let's create a 'test_{page_name}.py' that includes 
            // relevant tests if we can match them, otherwise all go to one.

            // Current Strategy: Create one overarching test file if 1 page, 
            // or try to split. For safety in this prompt, I will split if >1 page, 
            // but if tests are generic, they might be duplicated. 
            // BETTER: Create separate test files for *each* generated flow.
        });
    }

    // New Strategy: Split tests based on their name matching page names, or default to general.
    project.pages.forEach(page => {
        const snakePage = convertTitleToSnake(page.name);
        const relevantTests = project.tests.filter(t =>
            t.steps.some(s => s.description.toLowerCase().includes(page.name.toLowerCase())) ||
            t.name.toLowerCase().includes(page.name.toLowerCase()) ||
            t.name.includes(snakePage)
        );

        // If no specifically matched tests, but we have generic ones and this is the only page, add them.
        if (relevantTests.length === 0 && project.pages.length === 1) {
            relevantTests.push(...project.tests);
        }

        if (relevantTests.length > 0) {
            // Smart Naming for Test Files: test_{PageName}_{Flow}.py
            // Since we already shortened the page name in domAnalysisService, we can just use it.
            // Example: Page='AmazonBestPage' -> File='test_amazon_best_page.py' (or we can strip 'Page')

            const shortPageName = page.name.replace(/Page$/, ''); // Remove 'Page' suffix for test filenames
            files.set(`tests/test_${convertTitleToSnake(shortPageName)}.py`, generateTestFile(relevantTests, [page], project.config.projectName));
        }
    });

    // Catch-all for tests that didn't match specific pages (e.g. complex E2E)
    // For now, to ensure "smoke" tests (which are often generic) are included:
    const specificTestNames = new Set();
    // (Logic to track used tests - omitted for brevity/safety, avoiding duplicates might be tricky without complex logic)
    // Lets just ensure at least one test file exists.
    if (files.size === 0 || !Array.from(files.keys()).some(k => k.startsWith('tests/test_'))) {
        files.set('tests/test_main_flow.py', generateTestFile(project.tests, project.pages, project.config.projectName));
    }

    return files;
};

// --- Generators ---

const generateConftest = () => `import pytest
import json
import os
import logging
import allure
from colorlog import ColoredFormatter
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from webdriver_manager.microsoft import EdgeChromiumDriverManager
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.firefox.service import Service as FirefoxService

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
    config_path = os.path.join(os.path.dirname(__file__), 'config', 'config.json')
    with open(config_path) as f:
        return json.load(f)

@pytest.fixture(scope="function")
def driver(config):
    browser = config['browser'].lower()
    headless = config['headless']
    
    if browser == "chrome":
        options = webdriver.ChromeOptions()
        if headless: options.add_argument("--headless")
        svc = ChromeService(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=svc, options=options)
    elif browser == "firefox":
        options = webdriver.FirefoxOptions()
        if headless: options.add_argument("--headless")
        svc = FirefoxService(GeckoDriverManager().install())
        driver = webdriver.Firefox(service=svc, options=options)
    else:
        raise Exception(f"Browser {browser} not supported")

    driver.maximize_window()
    driver.implicitly_wait(config['implicit_wait'])
    yield driver
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
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service as ChromeService

def get_driver(browser="chrome", headless=True):
    if browser == "chrome":
        options = webdriver.ChromeOptions()
        if headless:
            options.add_argument("--headless")
        svc = ChromeService(ChromeDriverManager().install())
        return webdriver.Chrome(service=svc, options=options)
    raise ValueError(f"Browser {browser} not supported in this factory yet.")
`;

const generateBasePage = () => `from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import TimeoutException, StaleElementReferenceException, NoSuchElementException
import allure
import time
from utils.logger import get_logger

class BasePage:
    """
    BasePage class that contains common methods for all page objects.
    Integrated with Allure steps and custom logging.
    """
    def __init__(self, driver):
        self.driver = driver
        self.timeout = 10
        self.logger = get_logger(self.__class__.__name__)
    
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
        element.clear()
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
${page.elements.map(el => `    ${el.name.toUpperCase()}_LOCATOR = ("${mapLocatorType(el.locatorType)}", "${el.locatorValue}")`).join('\n')}

    def __init__(self, driver):
        super().__init__(driver)

    # --- Actions ---
${page.elements.map(el => {
    if (el.name.toLowerCase().includes('input') || el.name.toLowerCase().includes('field')) {
        return `    @allure.step("Fill ${el.name} with '{text}'")\n    def fill_${el.name}(self, text):\n        self.enter_text(self.${el.name.toUpperCase()}_LOCATOR, text)\n`;
    } else if (el.name.toLowerCase().includes('btn') || el.name.toLowerCase().includes('button') || el.name.toLowerCase().includes('link')) {
        return `    @allure.step("Click ${el.name}")\n    def click_${el.name}(self):\n        self.click(self.${el.name.toUpperCase()}_LOCATOR)\n`;
    } else {
        return `    @allure.step("Get ${el.name} text")\n    def get_${el.name}_text(self):\n        return self.get_text(self.${el.name.toUpperCase()}_LOCATOR)\n`;
    }
}).join('\n')}
`;

const generateTestFile = (tests: TestCase[], pages: PageDefinition[], projectName: string) => {
    // Helper function to generate actual method calls based on test steps
    const generateStepCode = (step: any, pages: PageDefinition[]): string => {
        const description = step.description.toLowerCase();
        const action = step.action;

        // Try to find relevant page and element based on description
        for (const page of pages) {
            const pageName = page.name.toLowerCase();

            for (const element of page.elements) {
                const elementName = element.name.toLowerCase();

                // Check if description mentions this element or page
                if (description.includes(elementName) || description.includes(element.description?.toLowerCase() || '')) {

                    // Determine the action type from description or action field
                    if (action === 'click' || description.includes('click') || description.includes('button') || description.includes('link')) {
                        return `        ${pageName}.click_${element.name}()`;
                    } else if (action === 'input' || description.includes('enter') || description.includes('type') || description.includes('input')) {
                        const value = step.value || 'test_data';
                        return `        ${pageName}.fill_${element.name}("${value}")`;
                    } else if (action === 'assert_text' || description.includes('verify') || description.includes('assert') || description.includes('check')) {
                        if (description.includes('visible') || description.includes('displayed')) {
                            return `        assert ${pageName}.find_element(${pageName}.${element.name.toUpperCase()}_LOCATOR).is_displayed(), "Element should be visible"`;
                        } else {
                            return `        result_text = ${pageName}.get_${element.name}_text()\n        assert result_text, "Text should be present"`;
                        }
                    }
                }
            }
        }

        // Fallback
        if (description.includes('navigate') || description.includes('open')) {
            return `        driver.get(config['base_url'])`;
        } else if (description.includes('wait')) {
            return `        import time\n        time.sleep(2)`;
        } else {
            return `        # ${step.description}\n        pass`;
        }
    };

    return `import pytest
import time
import allure
from tests.base_test import BaseTest
${pages.map(p => `from pages.${convertTitleToSnake(p.name)} import ${p.name}`).join('\n')}

@allure.epic("${projectName}")
@allure.feature("${pages[0]?.name || 'General'}")
class Test${pages[0]?.name || 'Flow'}(BaseTest):

${tests.map(test => `    @allure.story("${test.name}")
    @allure.title("${test.name}")
    @pytest.mark.${test.type}
    def ${test.name}(self, driver, config):
        """
        Test Case: ${test.name}
        Steps:
        ${test.steps.map((s, idx) => `${idx + 1}. ${s.description}`).join('\n        ')}
        """
        # Initialize Page Objects
        ${pages.map(p => `${p.name.toLowerCase()} = ${p.name}(driver)`).join('\n        ')}
        
        # Steps
${test.steps.map((step, idx) => {
        const code = generateStepCode(step, pages);
        return `        with allure.step("${step.description}"):\n${code}`;
    }).join('\n        \n')}
`).join('\n\n')}
`;
};


// --- Helpers ---
const mapLocatorType = (type: string) => type.toLowerCase();
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
This class implements the foundation for all test classes.
"""
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
import allure
import io
import logging
import time
from pathlib import Path


from utils.logger import get_logger
from config.environment import Environment

# --- NEW: Define Project Root as a Global Constant ---
# This is a robust way to get your project's root directory.
# It assumes this file (base_test.py) is inside a 'tests' folder,
# which is inside your project root.
PROJECT_ROOT = Path(__file__).parent.parent


class BaseTest:
    logger = get_logger()

    @pytest.fixture(scope="function", autouse=True)
    def setup_and_teardown(self, request):
        """
        Setup/teardown fixture. It no longer needs to calculate or pass paths.
        """
        self.logger.info(f"--- Starting test: {request.node.name} ---")

        log_stream = io.StringIO()
        stream_handler = logging.StreamHandler(log_stream)
        log_format = logging.Formatter('%(asctime)s - [%(levelname)s] - %(message)s')
        stream_handler.setFormatter(log_format)
        self.logger.addHandler(stream_handler)

        self.env = Environment()
        self.driver = self._setup_driver()
        request.cls.driver = self.driver

        with allure.step("Browser Setup"):
            self.driver.maximize_window()
            self.driver.implicitly_wait(self.env.config['browser']['implicit_wait'])
            # Check for page_load_timeout existence before setting
            if 'page_load_timeout' in self.env.config['browser']:
                self.driver.set_page_load_timeout(self.env.config['browser']['page_load_timeout'])


        yield

        with allure.step("Test Teardown"):
            if request.node.rep_call.failed:
                self._capture_allure_screenshot(request)

            log_content = log_stream.getvalue()
            allure.attach(log_content, name=f"Execution Log for {request.node.name}",
                          attachment_type=allure.attachment_type.TEXT)
            self.logger.removeHandler(stream_handler)

            self.logger.info(f"--- Finished test: {request.node.name} ---")
            if self.driver:
                self.driver.quit()

    def _setup_driver(self):
        """Sets up WebDriver. No longer needs arguments passed to it."""
        # Check if 'default' key exists, otherwise fallback to root 'browser'
        browser = self.env.config.get('browser', {}).get('default', self.env.config.get('browser', 'chrome')).lower()
        if isinstance(browser, dict): browser = 'chrome' # Safety fallback
        
        headless = self.env.config.get('browser', {}).get('headless', self.env.config.get('headless', True))
        
        self.logger.info(f"Setting up '{browser}' browser (Headless: {headless})")
        if browser == 'chrome':
            return self._setup_chrome_driver(headless)
        else:
            self.logger.error(f"Unsupported browser: {browser}")
            raise ValueError(f"Unsupported browser: {browser}")

    def _setup_chrome_driver(self, headless=False):
        """
        Sets up Chrome WebDriver using your comprehensive list of options.
        """
        options = ChromeOptions()
        options.page_load_strategy = 'eager'

        # Use the PROJECT_ROOT constant defined at the top of the file
        profile_path = PROJECT_ROOT / "automation_chrome_profile"
        options.add_argument(f"--user-data-dir={profile_path}")
        self.logger.info(f"Using dedicated Chrome profile: {profile_path}")

        # --- ADDING YOUR SUGGESTED OPTIONS TO SUPPRESS POPUPS ---
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        prefs = {
            "credentials_enable_service": False,
            "profile.default_content_setting_values.notifications": 2,
            "profile.password_manager_enabled": False,
            "profile.password_manager_leak_detection": False
        }
        options.add_experimental_option("prefs", prefs)

        if headless:
            options.add_argument('--headless')

        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--window-size=1920,1080')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--disable-extensions')

        service = ChromeService()
        driver = webdriver.Chrome(service=service, options=options)
        self.logger.info("Chrome WebDriver initialized with dedicated profile and popup suppression.")
        return driver

    def _capture_allure_screenshot(self, request):
        """Captures a unique, timestamped screenshot for the Allure report."""
        test_name = request.node.name
        self.logger.error(f"Test '{test_name}' failed. Capturing Allure screenshot.")

        timestamp = time.strftime("%Y%m%d_%H%M%S")
        # Use the PROJECT_ROOT constant to build the absolute path
        screenshot_folder = PROJECT_ROOT / "reports" / "screenshots"
        screenshot_folder.mkdir(parents=True, exist_ok=True)
        screenshot_path = screenshot_folder / f"failed_{test_name}_{timestamp}.png"

        try:
            time.sleep(1) # Short delay before screenshot
            self.driver.save_screenshot(str(screenshot_path))
            allure.attach.file(str(screenshot_path), name=f"Failure Screenshot: {test_name}",
                             attachment_type=allure.attachment_type.PNG)
            self.logger.info(f"Screenshot for Allure saved to: {screenshot_path}")
        except Exception as e:
            self.logger.error(f"Failed to capture Allure screenshot: {e}")
`;