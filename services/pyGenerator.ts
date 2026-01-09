import { AutomationProject, PageDefinition, TestCase } from "../types";

export const generatePyTestFramework = (project: AutomationProject): Map<string, string> => {
    const files = new Map<string, string>();

    // 1. Root Config Files
    files.set('requirements.txt', `pytest==7.4.0\nselenium==4.10.0\nallure-pytest==2.13.2\ncolorlog==6.7.0\nwebdriver-manager==4.0.0\npytest-xdist==3.3.1`);
    files.set('pytest.ini', `[pytest]\naddopts = --alluredir=./allure-results --clean-alluredir --log-cli-level=INFO\nlog_cli = true\nlog_cli_format = %(asctime)s [%(levelname)8s] %(message)s (%(filename)s:%(lineno)s)\nlog_cli_date_format = %Y-%m-%d %H:%M:%S\npython_files = test_*.py`);

    files.set('config/config.json', JSON.stringify({
        base_url: project.config.baseUrl,
        browser: project.config.browser,
        headless: project.config.headless,
        implicit_wait: 10
    }, null, 4));

    // 2. Conftest (Fixtures & Hooks)
    files.set('conftest.py', generateConftest());

    // 3. Utilities
    files.set('utils/__init__.py', '');
    files.set('utils/driver_factory.py', generateDriverFactory());
    files.set('utils/base_page.py', generateBasePage());
    files.set('utils/data_reader.py', generateDataReader());

    // 4. Pages (One file per page)
    files.set('pages/__init__.py', '');
    project.pages.forEach(page => {
        files.set(`pages/${convertTitleToSnake(page.name)}.py`, generatePageObject(page));
    });

    // 5. Tests (One file per page/group)
    files.set('tests/__init__.py', '');

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
import allure

class BasePage:
    """
    BasePage class that contains common methods for all page objects.
    Integrated with Allure steps.
    """
    def __init__(self, driver):
        self.driver = driver
        self.timeout = 10
    
    def _convert_locator(self, locator):
        locator_type, locator_value = locator
        if hasattr(locator_type, '__name__'): return locator
        
        locator_map = {
            'id': By.ID,
            'css': By.CSS_SELECTOR,
            'xpath': By.XPATH,
            'name': By.NAME,
            'classname': By.CLASS_NAME,
            'linktext': By.LINK_TEXT,
            'partiallinktext': By.PARTIAL_LINK_TEXT,
            'tagname': By.TAG_NAME
        }
        by_type = locator_map.get(locator_type.lower(), By.ID)
        return (by_type, locator_value)

    @allure.step("Finding element: {locator}")
    def find_element(self, locator):
        converted_locator = self._convert_locator(locator)
        return WebDriverWait(self.driver, self.timeout).until(
            EC.visibility_of_element_located(converted_locator)
        )

    @allure.step("Clicking element: {locator}")
    def click(self, locator):
        element = self.find_element(locator)
        element.click()

    @allure.step("Entering text '{text}' into {locator}")
    def enter_text(self, locator, text):
        element = self.find_element(locator)
        element.clear()
        element.send_keys(text)

    @allure.step("Getting text from {locator}")
    def get_text(self, locator):
        return self.find_element(locator).text
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

const generatePageObject = (page: PageDefinition) => `from utils.base_page import BasePage
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
${pages.map(p => `from pages.${convertTitleToSnake(p.name)} import ${p.name}`).join('\n')}

@allure.epic("${projectName}")
@allure.feature("${pages[0]?.name || 'General'}")
@pytest.mark.usefixtures("driver")
class Test${pages[0]?.name || 'Flow'}:

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
        
        # Setup
        driver.get(config['base_url'])
        
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