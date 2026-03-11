# Python Selenium Framework Guide
## Gathered from GitHub repos & Official Selenium Python Docs (2024-2025)

---

## 1. Project Directory Structure

```
my_selenium_project/
├── conftest.py                  # Root-level fixtures (driver init/teardown)
├── pytest.ini                   # Pytest config: markers, options
├── requirements.txt             # All dependencies
├── .env                         # Environment variables (BASE_URL, credentials)
├── pages/                       # Page Object Model classes
│   ├── __init__.py
│   ├── base_page.py             # BasePage — shared driver helpers + waits
│   ├── login_page.py
│   ├── home_page.py
│   └── checkout_page.py
├── locators/                    # Separate locator classes (keep locators out of pages)
│   ├── __init__.py
│   ├── login_locators.py
│   └── home_locators.py
├── tests/                       # Test files
│   ├── __init__.py
│   ├── conftest.py              # Test-level fixtures (page object factories)
│   ├── test_login.py
│   ├── test_checkout.py
│   └── test_home.py
├── utils/                       # Utilities: WebDriver factory, wait helpers
│   ├── __init__.py
│   ├── driver_factory.py        # Browser/driver creation
│   ├── helpers.py
│   └── data_factory.py
├── data/                        # Test data (JSON / YAML / CSV)
│   └── test_data.json
├── config/                      # Environment config
│   └── config.py
└── reports/                     # Allure report output
```

---

## 2. requirements.txt

```
selenium>=4.15.0
pytest>=7.0.0
pytest-xdist>=3.0.0          # Parallel execution
allure-pytest>=2.13.0
webdriver-manager>=4.0.0     # Auto-downloads ChromeDriver / GeckoDriver
python-dotenv>=1.0.0
pytest-html>=4.0.0
Faker>=20.0.0                 # Test data generation
```

Install:
```bash
pip install -r requirements.txt
```

---

## 3. pytest.ini

```ini
[pytest]
addopts =
    --alluredir=reports/allure-results
    -v
    --tb=short

markers =
    smoke: Smoke tests — critical path
    regression: Full regression suite
    login: Login-related tests
    checkout: Checkout flow tests
    sanity: Quick sanity checks

testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
```

---

## 4. utils/driver_factory.py — WebDriver Factory

```python
import os
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from webdriver_manager.microsoft import EdgeChromiumDriverManager


def create_driver(browser: str = "chrome", headless: bool = False) -> webdriver.Remote:
    """
    WebDriver Factory — creates and returns a configured WebDriver instance.
    Supports: chrome, firefox, edge
    """
    browser = browser.lower()
    
    if browser == "chrome":
        options = ChromeOptions()
        if headless:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-gpu")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)
        driver = webdriver.Chrome(
            service=ChromeService(ChromeDriverManager().install()),
            options=options
        )
    
    elif browser == "firefox":
        options = FirefoxOptions()
        if headless:
            options.add_argument("--headless")
        driver = webdriver.Firefox(
            service=FirefoxService(GeckoDriverManager().install()),
            options=options
        )
    
    elif browser == "edge":
        driver = webdriver.Edge(
            service=EdgeService(EdgeChromiumDriverManager().install())
        )
    
    else:
        raise ValueError(f"Unsupported browser: {browser}. Use chrome, firefox, or edge.")
    
    driver.maximize_window()
    driver.implicitly_wait(int(os.getenv("IMPLICIT_WAIT", "10")))
    return driver
```

---

## 5. conftest.py (Root Level) — Driver Fixture

```python
import pytest
import allure
import os
from dotenv import load_dotenv
from selenium.webdriver.remote.webdriver import WebDriver
from utils.driver_factory import create_driver

load_dotenv()

# ─────────────────────────────────────────────
# Driver Fixture
# ─────────────────────────────────────────────

@pytest.fixture(scope="function")
def driver():
    """
    Function-scoped fixture — creates a fresh browser for each test.
    Yields the driver and quits after each test (setup/teardown).
    """
    browser = os.getenv("BROWSER", "chrome")
    headless = os.getenv("HEADLESS", "false").lower() == "true"
    
    drv = create_driver(browser=browser, headless=headless)
    drv.get(os.getenv("BASE_URL", "https://your-app.com"))
    
    yield drv
    
    drv.quit()


@pytest.fixture(scope="class")
def class_driver(request):
    """
    Class-scoped driver — shared across all tests in a class.
    Use when tests are sequential and share state within a class.
    """
    browser = os.getenv("BROWSER", "chrome")
    headless = os.getenv("HEADLESS", "false").lower() == "true"
    
    drv = create_driver(browser=browser, headless=headless)
    drv.get(os.getenv("BASE_URL", "https://your-app.com"))
    
    request.cls.driver = drv  # Attach to class
    yield drv
    
    drv.quit()

# ─────────────────────────────────────────────
# Allure Screenshot on Failure
# ─────────────────────────────────────────────

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    
    if rep.when == "call" and rep.failed:
        driver: WebDriver = item.funcargs.get("driver") or getattr(item.cls, "driver", None)
        if driver:
            screenshot = driver.get_screenshot_as_png()
            allure.attach(
                screenshot,
                name="screenshot_on_failure",
                attachment_type=allure.attachment_type.PNG
            )
```

---

## 6. pages/base_page.py — BasePage Class

```python
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import Select
import allure
import os


class BasePage:
    """
    Base Page Object — all page classes inherit from this.
    Provides shared wait, find, action helpers.
    """
    
    BASE_URL: str = ""          # Override in each page class
    DEFAULT_TIMEOUT: int = 10
    
    def __init__(self, driver: WebDriver) -> None:
        self.driver = driver
        self.wait = WebDriverWait(driver, self.DEFAULT_TIMEOUT)
    
    # ─────────────────────────────────────────────
    # Navigation
    # ─────────────────────────────────────────────
    
    def navigate(self, path: str = "") -> None:
        url = f"{self.BASE_URL}{path}" if path else self.BASE_URL
        with allure.step(f"Navigate to {url}"):
            self.driver.get(url)
    
    def get_current_url(self) -> str:
        return self.driver.current_url
    
    def get_title(self) -> str:
        return self.driver.title
    
    def go_back(self) -> None:
        self.driver.back()
    
    def refresh(self) -> None:
        self.driver.refresh()
    
    # ─────────────────────────────────────────────
    # Element Finders (with Explicit Waits)
    # ─────────────────────────────────────────────
    
    def find_element(self, locator: tuple) -> WebElement:
        """Wait for element to be present, then return it."""
        return self.wait.until(EC.presence_of_element_located(locator))
    
    def find_visible_element(self, locator: tuple) -> WebElement:
        """Wait for element to be visible, then return it."""
        return self.wait.until(EC.visibility_of_element_located(locator))
    
    def find_clickable_element(self, locator: tuple) -> WebElement:
        """Wait for element to be clickable, then return it."""
        return self.wait.until(EC.element_to_be_clickable(locator))
    
    def find_elements(self, locator: tuple) -> list[WebElement]:
        """Wait for all elements matching locator."""
        self.wait.until(EC.presence_of_all_elements_located(locator))
        return self.driver.find_elements(*locator)
    
    # ─────────────────────────────────────────────
    # Actions
    # ─────────────────────────────────────────────
    
    def click(self, locator: tuple) -> None:
        with allure.step(f"Click element: {locator}"):
            self.find_clickable_element(locator).click()
    
    def fill(self, locator: tuple, value: str) -> None:
        with allure.step(f"Fill '{value}' into {locator}"):
            element = self.find_visible_element(locator)
            element.clear()
            element.send_keys(value)
    
    def select_by_visible_text(self, locator: tuple, text: str) -> None:
        with allure.step(f"Select '{text}' from dropdown"):
            select = Select(self.find_visible_element(locator))
            select.select_by_visible_text(text)
    
    def select_by_value(self, locator: tuple, value: str) -> None:
        select = Select(self.find_visible_element(locator))
        select.select_by_value(value)
    
    def hover(self, locator: tuple) -> None:
        element = self.find_visible_element(locator)
        ActionChains(self.driver).move_to_element(element).perform()
    
    def scroll_into_view(self, locator: tuple) -> None:
        element = self.find_element(locator)
        self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
    
    def js_click(self, locator: tuple) -> None:
        """JavaScript click — fallback when regular click is intercepted."""
        element = self.find_element(locator)
        self.driver.execute_script("arguments[0].click();", element)
    
    # ─────────────────────────────────────────────
    # Getters
    # ─────────────────────────────────────────────
    
    def get_text(self, locator: tuple) -> str:
        return self.find_visible_element(locator).text
    
    def get_attribute(self, locator: tuple, attribute: str) -> str:
        return self.find_element(locator).get_attribute(attribute)
    
    def is_displayed(self, locator: tuple) -> bool:
        try:
            return self.find_element(locator).is_displayed()
        except Exception:
            return False
    
    def is_enabled(self, locator: tuple) -> bool:
        return self.find_element(locator).is_enabled()
    
    # ─────────────────────────────────────────────
    # Wait Helpers
    # ─────────────────────────────────────────────
    
    def wait_for_url_contains(self, partial_url: str, timeout: int = 10) -> None:
        WebDriverWait(self.driver, timeout).until(EC.url_contains(partial_url))
    
    def wait_for_element_to_disappear(self, locator: tuple, timeout: int = 10) -> None:
        WebDriverWait(self.driver, timeout).until(EC.invisibility_of_element_located(locator))
    
    # ─────────────────────────────────────────────
    # Screenshot
    # ─────────────────────────────────────────────
    
    def take_screenshot(self, name: str) -> None:
        screenshot = self.driver.get_screenshot_as_png()
        allure.attach(screenshot, name=name, attachment_type=allure.attachment_type.PNG)
```

---

## 7. locators/login_locators.py — Separate Locator Class

```python
from selenium.webdriver.common.by import By


class LoginLocators:
    """
    Centralized locators for the Login page.
    Locator priority: ID > Name > CSS Selector > XPath

    If the UI changes, update ONLY here — not in tests or page objects.
    """
    
    # ── Input Fields
    EMAIL_INPUT      = (By.ID, "email")
    PASSWORD_INPUT   = (By.ID, "password")
    
    # ── Buttons
    LOGIN_BUTTON     = (By.CSS_SELECTOR, "button[type='submit']")
    FORGOT_PASSWORD  = (By.LINK_TEXT, "Forgot Password?")
    
    # ── Checkboxes
    REMEMBER_ME      = (By.NAME, "remember_me")
    
    # ── Messages
    ERROR_MESSAGE    = (By.CSS_SELECTOR, "[role='alert'], .error-message, .alert-danger")
    SUCCESS_MESSAGE  = (By.CSS_SELECTOR, ".alert-success, .success-message")
    
    # ── Validation
    EMAIL_ERROR      = (By.ID, "email-error")
    PASSWORD_ERROR   = (By.ID, "password-error")
```

---

## 8. Selenium 4 Locator Priority Order

```python
from selenium.webdriver.common.by import By

# ── PRIORITY ORDER (most stable → least stable)

# PRIORITY 1 — ID (unique, fastest)
(By.ID, "login-button")
(By.ID, "email-input")

# PRIORITY 2 — Name attribute
(By.NAME, "username")
(By.NAME, "password")

# PRIORITY 3 — CSS Selector (fast, readable)
(By.CSS_SELECTOR, "button[type='submit']")
(By.CSS_SELECTOR, ".login-form input[type='email']")
(By.CSS_SELECTOR, "[data-testid='login-btn']")    # data-testid (most stable)
(By.CSS_SELECTOR, "#submit-button")               # ID via CSS
(By.CSS_SELECTOR, ".btn.btn-primary")             # class

# PRIORITY 4 — Link Text (for <a> elements)
(By.LINK_TEXT, "Forgot Password?")
(By.PARTIAL_LINK_TEXT, "Login")

# PRIORITY 5 — Tag Name (for unique elements)
(By.TAG_NAME, "h1")

# PRIORITY 6 — XPath (most powerful, but slowest — use when nothing else works)
(By.XPATH, "//button[@type='submit']")
(By.XPATH, "//input[@placeholder='Enter email']")
(By.XPATH, "//form[@id='login']//button")         # Relative XPath (preferred)
(By.XPATH, "//td[contains(text(),'John')]")       # Text-based
(By.XPATH, "(//button)[2]")                       # Index-based (fragile — avoid)

# ── Selenium 4 Relative Locators (new in Selenium 4)
from selenium.webdriver.support.relative_locator import locate_with

# Find element above/below/near/left/right of another
locate_with(By.TAG_NAME, "input").above(submit_btn)
locate_with(By.TAG_NAME, "label").to_left_of(email_field)
locate_with(By.TAG_NAME, "input").near(some_element)
```

---

## 9. pages/login_page.py — Full POM Example

```python
import allure
from selenium.webdriver.remote.webdriver import WebDriver
from pages.base_page import BasePage
from locators.login_locators import LoginLocators


class LoginPage(BasePage):
    """Page Object for the Login page."""
    
    BASE_URL = "https://your-app.com/login"
    
    def __init__(self, driver: WebDriver) -> None:
        super().__init__(driver)
    
    # ── Actions (business-level)
    
    @allure.step("Fill email: {email}")
    def fill_email(self, email: str) -> None:
        self.fill(LoginLocators.EMAIL_INPUT, email)
    
    @allure.step("Fill password")
    def fill_password(self, password: str) -> None:
        self.fill(LoginLocators.PASSWORD_INPUT, password)
    
    @allure.step("Click Login button")
    def click_login_button(self) -> None:
        self.click(LoginLocators.LOGIN_BUTTON)
    
    @allure.step("Check Remember Me")
    def check_remember_me(self) -> None:
        checkbox = self.find_element(LoginLocators.REMEMBER_ME)
        if not checkbox.is_selected():
            checkbox.click()
    
    @allure.step("Login with credentials: {email}")
    def login(self, email: str, password: str) -> None:
        """High-level login: navigate, fill, submit."""
        self.navigate()
        self.fill_email(email)
        self.fill_password(password)
        self.click_login_button()
    
    @allure.step("Login and wait for dashboard")
    def login_and_wait_for_dashboard(self, email: str, password: str) -> None:
        self.login(email, password)
        self.wait_for_url_contains("/dashboard")
    
    # ── Assertions
    
    def get_error_message(self) -> str:
        return self.get_text(LoginLocators.ERROR_MESSAGE)
    
    def is_error_displayed(self) -> bool:
        return self.is_displayed(LoginLocators.ERROR_MESSAGE)
    
    def is_login_page_loaded(self) -> bool:
        return self.is_displayed(LoginLocators.LOGIN_BUTTON)
```

---

## 10. pages/home_page.py — Dashboard POM Example

```python
import allure
from selenium.webdriver.common.by import By
from selenium.webdriver.remote.webdriver import WebDriver
from pages.base_page import BasePage


class HomePageLocators:
    WELCOME_HEADING  = (By.CSS_SELECTOR, "h1.welcome")
    USER_MENU        = (By.CSS_SELECTOR, "[data-testid='user-menu']")
    LOGOUT_ITEM      = (By.LINK_TEXT, "Logout")
    SEARCH_INPUT     = (By.NAME, "search")
    SEARCH_BUTTON    = (By.CSS_SELECTOR, "button[aria-label='Search']")


class HomePage(BasePage):
    """Page Object for the Dashboard/Home page."""
    
    BASE_URL = "https://your-app.com/dashboard"
    
    def __init__(self, driver: WebDriver) -> None:
        super().__init__(driver)
    
    @allure.step("Search for: {query}")
    def search(self, query: str) -> None:
        self.fill(HomePageLocators.SEARCH_INPUT, query)
        self.click(HomePageLocators.SEARCH_BUTTON)
    
    @allure.step("Logout")
    def logout(self) -> None:
        self.click(HomePageLocators.USER_MENU)
        self.click(HomePageLocators.LOGOUT_ITEM)
        self.wait_for_url_contains("/login")
    
    def is_dashboard_loaded(self) -> bool:
        return self.is_displayed(HomePageLocators.WELCOME_HEADING)
    
    def get_welcome_text(self) -> str:
        return self.get_text(HomePageLocators.WELCOME_HEADING)
```

---

## 11. tests/test_login.py — Full Test File

```python
import pytest
import allure
from pages.login_page import LoginPage
from pages.home_page import HomePage


@allure.feature("Authentication")
@allure.story("Login")
@pytest.mark.usefixtures("class_driver")       # Use class-scoped driver
class TestLogin:
    """Login test suite — all tests share one browser instance."""
    
    @pytest.fixture(autouse=True)
    def setup_pages(self):
        self.login_page = LoginPage(self.driver)
        self.home_page  = HomePage(self.driver)
        self.login_page.navigate()
    
    @allure.title("Valid login redirects to dashboard")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.smoke
    def test_successful_login(self):
        self.login_page.fill_email("test@example.com")
        self.login_page.fill_password("validpassword")
        self.login_page.click_login_button()
        
        assert self.home_page.is_dashboard_loaded(), "Dashboard should be visible"
        assert "/dashboard" in self.driver.current_url

    @allure.title("Invalid credentials shows error message")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.regression
    def test_invalid_password_shows_error(self):
        self.login_page.fill_email("test@example.com")
        self.login_page.fill_password("wrongpassword")
        self.login_page.click_login_button()
        
        assert self.login_page.is_error_displayed(), "Error message should appear"
        assert "Invalid" in self.login_page.get_error_message()
    
    @allure.title("Empty form shows validation")
    @pytest.mark.smoke
    def test_empty_form_submission(self):
        self.login_page.click_login_button()
        # HTML5 validation — should stay on login page
        assert "/login" in self.driver.current_url
    
    @allure.title("Forgot password link is present and clickable")
    @pytest.mark.regression
    def test_forgot_password_link(self):
        from locators.login_locators import LoginLocators
        assert self.login_page.is_displayed(LoginLocators.FORGOT_PASSWORD)


@allure.feature("Authentication")
@allure.story("Login - Parametrized")
@pytest.mark.parametrize("email, password, expected_error", [
    ("", "password", "Email is required"),
    ("invalid", "password", "Invalid email"),
    ("test@example.com", "", "Password is required"),
    ("test@example.com", "wrong", "Invalid credentials"),
])
def test_login_validation(driver, email, password, expected_error):
    """Parametrized login validation — uses function-scoped driver fixture."""
    login_page = LoginPage(driver)
    login_page.navigate()
    login_page.fill_email(email)
    login_page.fill_password(password)
    login_page.click_login_button()
    
    assert login_page.is_error_displayed()
    assert expected_error.lower() in login_page.get_error_message().lower()
```

---

## 12. tests/conftest.py — Page Object Fixtures

```python
import pytest
from selenium.webdriver.remote.webdriver import WebDriver
from pages.login_page import LoginPage
from pages.home_page import HomePage
import os


@pytest.fixture
def login_page(driver: WebDriver) -> LoginPage:
    return LoginPage(driver)


@pytest.fixture
def home_page(driver: WebDriver) -> HomePage:
    return HomePage(driver)


@pytest.fixture
def logged_in_driver(driver: WebDriver) -> WebDriver:
    """Fixture that logs in before returning the driver."""
    login_page = LoginPage(driver)
    login_page.login_and_wait_for_dashboard(
        email=os.getenv("TEST_USER_EMAIL", "test@example.com"),
        password=os.getenv("TEST_USER_PASSWORD", "validpassword")
    )
    return driver
```

---

## 13. Explicit Wait Patterns Reference

```python
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

wait = WebDriverWait(driver, 10)

# ── Presence (in DOM, not necessarily visible)
wait.until(EC.presence_of_element_located((By.ID, "my-id")))
wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".item")))

# ── Visibility (in DOM and visible)
wait.until(EC.visibility_of_element_located((By.ID, "my-id")))
wait.until(EC.visibility_of_all_elements_located((By.CSS_SELECTOR, ".item")))

# ── Clickability (visible + enabled)
wait.until(EC.element_to_be_clickable((By.ID, "submit-btn")))

# ── Text content
wait.until(EC.text_to_be_present_in_element((By.ID, "title"), "Welcome"))
wait.until(EC.text_to_be_present_in_element_value((By.ID, "input"), "value"))

# ── URL
wait.until(EC.url_contains("/dashboard"))
wait.until(EC.url_matches(r".*/dashboard.*"))
wait.until(EC.url_to_be("https://example.com/dashboard"))

# ── Title
wait.until(EC.title_contains("Dashboard"))
wait.until(EC.title_is("My App - Dashboard"))

# ── Invisibility
wait.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, ".spinner")))

# ── Alert
wait.until(EC.alert_is_present())

# ── Frame
wait.until(EC.frame_to_be_available_and_switch_to_it((By.ID, "iframe-id")))

# ── Custom
wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, ".item")) > 3)
```

---

## 14. Allure Integration Patterns

```python
import allure

# ── Class/method decorators
@allure.feature("Shopping Cart")
@allure.story("Add to Cart")
@allure.title("User can add product to cart")
@allure.severity(allure.severity_level.CRITICAL)  # BLOCKER, CRITICAL, NORMAL, MINOR, TRIVIAL
@allure.tag("smoke", "regression")
@allure.link("https://jira.com/PW-123", name="Jira Ticket")
@allure.issue("PW-123")

# ── Steps inside tests
with allure.step("Open product page"):
    driver.get("/products/123")

with allure.step("Click Add to Cart"):
    driver.find_element(By.ID, "add-to-cart").click()

# ── Step decorator on methods
@allure.step("Fill email: {email}")  # {email} is auto-substituted from args
def fill_email(self, email: str) -> None:
    self.fill(LoginLocators.EMAIL_INPUT, email)

# ── Attach screenshot
allure.attach(
    driver.get_screenshot_as_png(),
    name="screenshot",
    attachment_type=allure.attachment_type.PNG
)

# ── Attach text/data
allure.attach(
    '{"email": "test@test.com"}',
    name="test_data",
    attachment_type=allure.attachment_type.JSON
)

# ── Dynamic title/description inside test
allure.dynamic.title(f"Login test for {email}")
allure.dynamic.description("Tests that login fails with wrong password")
```

---

## 15. Pytest Markers & Execution Commands

```python
# Mark tests
@pytest.mark.smoke
@pytest.mark.regression
@pytest.mark.login
@pytest.mark.xfail(reason="Known bug SEL-456")
@pytest.mark.skip(reason="Not implemented yet")
@pytest.mark.parametrize("browser", ["chrome", "firefox", "edge"])
```

```bash
# Run all tests
pytest

# Run by marker
pytest -m smoke
pytest -m "smoke or regression"
pytest -m "not slow"

# Run specific file or test
pytest tests/test_login.py
pytest tests/test_login.py::TestLogin::test_successful_login

# Run in parallel
pip install pytest-xdist
pytest -n 4
pytest -n auto

# With Allure
pytest --alluredir=reports/allure-results
allure serve reports/allure-results

# Run in specific browser (via env var)
BROWSER=firefox pytest
BROWSER=edge pytest

# Headless mode
HEADLESS=true pytest

# Set base URL
BASE_URL=https://staging.example.com pytest

# Verbose + short traceback
pytest -v --tb=short

# Stop on first failure
pytest -x

# Show test durations
pytest --durations=10
```

---

## 16. Data-Driven Testing

```python
# ── JSON test data
import json
with open("data/test_data.json") as f:
    users = json.load(f)["valid_users"]

@pytest.mark.parametrize("user", users)
def test_valid_logins(driver, user):
    login_page = LoginPage(driver)
    login_page.login(user["email"], user["password"])
    ...

# ── Faker for dynamic data
from faker import Faker
fake = Faker()

new_user = {
    "email": fake.email(),
    "password": fake.password(length=12, special_chars=True),
    "name": fake.name(),
    "phone": fake.phone_number()
}

# ── CSV via pytest-csv (or manual)
import csv
def load_csv(path):
    with open(path) as f:
        return list(csv.DictReader(f))

@pytest.mark.parametrize("row", load_csv("data/login_cases.csv"))
def test_from_csv(driver, row):
    ...
```

---

## 17. Anti-Patterns to Avoid

```python
# ❌ BAD — time.sleep (creates flaky tests)
import time
time.sleep(5)

# ✅ GOOD — explicit waits
wait.until(EC.visibility_of_element_located(locator))

# ❌ BAD — fragile XPath with absolute paths
(By.XPATH, "/html/body/div[2]/div/form/div[1]/input")

# ✅ GOOD — relative XPath or CSS
(By.XPATH, "//form[@id='login']//input[@name='email']")
(By.CSS_SELECTOR, "form#login input[name='email']")

# ❌ BAD — raw locators scattered in test files
def test_login(driver):
    driver.find_element(By.ID, "email").send_keys("x")
    driver.find_element(By.ID, "password").send_keys("y")
    driver.find_element(By.ID, "submit").click()

# ✅ GOOD — through page object
def test_login(driver):
    LoginPage(driver).login("x@x.com", "password")

# ❌ BAD — implicit waits mixed with explicit waits (causes unreliable timing)
driver.implicitly_wait(10)  # never mix with explicit waits for the same element

# ✅ GOOD — use only explicit waits in page objects

# ❌ BAD — assertions in page objects
def click_login(self):
    self.click(LoginLocators.LOGIN_BUTTON)
    assert "dashboard" in self.driver.current_url  # ← don't assert inside POM

# ✅ GOOD — page object only returns data; test file asserts
def click_login(self):
    self.click(LoginLocators.LOGIN_BUTTON)

# In test:
login_page.click_login()
assert "/dashboard" in driver.current_url
```

---

## 18. CI/CD — GitHub Actions Example

```yaml
# .github/workflows/selenium.yml
name: Selenium Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.11"
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Install Chrome
        uses: browser-actions/setup-chrome@latest
      
      - name: Run Selenium Tests
        run: pytest -m smoke --alluredir=reports/allure-results
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
          HEADLESS: "true"
          BROWSER: "chrome"
      
      - name: Upload Allure results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: allure-results
          path: reports/allure-results
```
