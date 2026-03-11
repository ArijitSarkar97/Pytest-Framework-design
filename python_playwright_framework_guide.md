# Python Playwright Framework Guide
## Gathered from GitHub repos & Official Playwright Docs (2024-2025)

---

## 1. Project Directory Structure

```
my_playwright_project/
├── conftest.py                  # Root-level fixtures (browser, context, page, auth)
├── pytest.ini                   # Pytest config: markers, base-url, options
├── requirements.txt             # All dependencies
├── .env                         # Environment variables (baseUrl, credentials)
├── pages/                       # Page Object Model classes
│   ├── __init__.py
│   ├── base_page.py             # BasePage class — shared helpers
│   ├── login_page.py
│   ├── home_page.py
│   └── checkout_page.py
├── tests/                       # Test files
│   ├── __init__.py
│   ├── conftest.py              # Test-level fixtures
│   ├── test_login.py
│   ├── test_checkout.py
│   └── test_home.py
├── utils/                       # Helpers, helpers.py, data_factory.py
│   ├── __init__.py
│   ├── helpers.py
│   └── data_factory.py
├── data/                        # Test data (JSON / YAML / CSV)
│   └── test_data.json
├── config/                      # Environment configs
│   └── config.py
└── reports/                     # Allure report output
```

---

## 2. requirements.txt

```
playwright>=1.40.0
pytest>=7.0.0
pytest-playwright>=0.4.0
pytest-xdist>=3.0.0          # Parallel execution
allure-pytest>=2.13.0
python-dotenv>=1.0.0
pytest-html>=4.0.0
Faker>=20.0.0                 # Test data generation
```

Install:
```bash
pip install -r requirements.txt
playwright install
```

---

## 3. pytest.ini

```ini
[pytest]
addopts =
    --headed
    --browser chromium
    --screenshot=only-on-failure
    --video=retain-on-failure
    --trace=retain-on-failure
    --alluredir=reports/allure-results
    -v

base_url = https://your-app.com

markers =
    smoke: Smoke tests - critical path
    regression: Full regression suite
    login: Login-related tests
    checkout: Checkout flow tests
    api: API tests
    visual: Visual regression tests

testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
```

---

## 4. conftest.py (Root Level)

```python
import pytest
import allure
import os
from dotenv import load_dotenv
from playwright.sync_api import Page, BrowserContext, Browser, Playwright, sync_playwright

load_dotenv()

# ─────────────────────────────────────────────
# Browser & Context Configuration
# ─────────────────────────────────────────────

@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    """Override default browser context options."""
    return {
        **browser_context_args,
        "viewport": {"width": 1920, "height": 1080},
        "ignore_https_errors": True,
        "record_video_dir": "reports/videos/",
    }

@pytest.fixture(scope="session")
def browser_type_launch_args(browser_type_launch_args):
    """Override browser launch options."""
    return {
        **browser_type_launch_args,
        "headless": os.getenv("HEADLESS", "true").lower() == "true",
        "slow_mo": int(os.getenv("SLOW_MO", "0")),
        "args": ["--no-sandbox", "--disable-setuid-sandbox"],
    }

# ─────────────────────────────────────────────
# Authentication Fixture (Session-Scoped)
# ─────────────────────────────────────────────

@pytest.fixture(scope="session")
def authenticated_context(browser: Browser):
    """Create a browser context with saved authentication state."""
    context = browser.new_context()
    page = context.new_page()
    
    # Perform login once
    page.goto(os.getenv("BASE_URL", "https://your-app.com") + "/login")
    page.get_by_label("Email").fill(os.getenv("TEST_USER_EMAIL", "test@example.com"))
    page.get_by_label("Password").fill(os.getenv("TEST_USER_PASSWORD", "password"))
    page.get_by_role("button", name="Login").click()
    page.wait_for_url("**/dashboard")
    
    # Save state
    context.storage_state(path="auth_state.json")
    page.close()
    context.close()
    
    # Return context factory using saved state
    context2 = browser.new_context(storage_state="auth_state.json")
    yield context2
    context2.close()

@pytest.fixture
def logged_in_page(authenticated_context: BrowserContext):
    """Provide a pre-authenticated page for each test."""
    page = authenticated_context.new_page()
    yield page
    page.close()

# ─────────────────────────────────────────────
# Allure Attachments on Failure
# ─────────────────────────────────────────────

@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    
    if rep.when == "call" and rep.failed:
        page: Page = item.funcargs.get("page")
        if page:
            # Screenshot on failure
            screenshot = page.screenshot(full_page=True)
            allure.attach(
                screenshot,
                name="screenshot_on_failure",
                attachment_type=allure.attachment_type.PNG
            )
            # Page HTML on failure
            allure.attach(
                page.content(),
                name="page_source",
                attachment_type=allure.attachment_type.HTML
            )
```

---

## 5. base_page.py (BasePage Class)

```python
from playwright.sync_api import Page, Locator, expect
import allure
import re


class BasePage:
    """
    Base Page Object — all page classes inherit from this.
    Provides shared navigation, wait, assertion helpers.
    """
    
    BASE_URL: str = ""  # Override in each page class
    
    def __init__(self, page: Page) -> None:
        self.page = page
    
    # ─────────────────────────────────────────────
    # Navigation
    # ─────────────────────────────────────────────
    
    def navigate(self, path: str = "") -> None:
        """Navigate to the page URL."""
        url = f"{self.BASE_URL}{path}" if path else self.BASE_URL
        with allure.step(f"Navigate to {url}"):
            self.page.goto(url)
            self.page.wait_for_load_state("networkidle")
    
    def get_current_url(self) -> str:
        return self.page.url
    
    def go_back(self) -> None:
        self.page.go_back()
    
    # ─────────────────────────────────────────────
    # Waiting
    # ─────────────────────────────────────────────
    
    def wait_for_url(self, url_pattern: str) -> None:
        self.page.wait_for_url(url_pattern)
    
    def wait_for_load_state(self, state: str = "networkidle") -> None:
        self.page.wait_for_load_state(state)
    
    # ─────────────────────────────────────────────
    # Element Interactions
    # ─────────────────────────────────────────────
    
    def click(self, locator: Locator) -> None:
        with allure.step(f"Click element"):
            locator.click()
    
    def fill(self, locator: Locator, value: str) -> None:
        with allure.step(f"Fill with '{value}'"):
            locator.clear()
            locator.fill(value)
    
    def select_option(self, locator: Locator, value: str) -> None:
        with allure.step(f"Select option '{value}'"):
            locator.select_option(value)
    
    def hover(self, locator: Locator) -> None:
        locator.hover()
    
    def scroll_into_view(self, locator: Locator) -> None:
        locator.scroll_into_view_if_needed()
    
    # ─────────────────────────────────────────────
    # Assertions (use Playwright expect, not assert)
    # ─────────────────────────────────────────────
    
    def assert_visible(self, locator: Locator) -> None:
        expect(locator).to_be_visible()
    
    def assert_text(self, locator: Locator, text: str) -> None:
        expect(locator).to_have_text(text)
    
    def assert_url(self, url_pattern: str) -> None:
        expect(self.page).to_have_url(re.compile(url_pattern))
    
    def assert_title(self, title: str) -> None:
        expect(self.page).to_have_title(re.compile(title))
    
    def take_screenshot(self, name: str) -> None:
        screenshot = self.page.screenshot(full_page=True)
        allure.attach(screenshot, name=name, attachment_type=allure.attachment_type.PNG)
```

---

## 6. Page Object Example — login_page.py

```python
from playwright.sync_api import Page, Locator, expect
import allure
from pages.base_page import BasePage


class LoginPage(BasePage):
    """Page Object for the Login page."""
    
    BASE_URL = "https://your-app.com/login"
    
    def __init__(self, page: Page) -> None:
        super().__init__(page)
        
        # ── Locators (defined in __init__ using Playwright's recommended get_by_* methods)
        # Priority order: get_by_role > get_by_label > get_by_placeholder > get_by_test_id > CSS
        self.email_input: Locator = page.get_by_label("Email")
        self.password_input: Locator = page.get_by_label("Password")
        self.login_button: Locator = page.get_by_role("button", name="Login")
        self.forgot_password_link: Locator = page.get_by_role("link", name="Forgot Password")
        self.error_message: Locator = page.get_by_role("alert")
        self.remember_me_checkbox: Locator = page.get_by_label("Remember me")
    
    # ── Actions (business-level, not raw clicks)
    
    @allure.step("Fill email: {email}")
    def fill_email(self, email: str) -> None:
        self.email_input.fill(email)
    
    @allure.step("Fill password")
    def fill_password(self, password: str) -> None:
        self.password_input.fill(password)
    
    @allure.step("Click Login button")
    def click_login(self) -> None:
        self.login_button.click()
    
    @allure.step("Login with credentials")
    def login(self, email: str, password: str) -> None:
        """High-level login action — fills and submits the form."""
        self.navigate()
        self.fill_email(email)
        self.fill_password(password)
        self.click_login()
    
    @allure.step("Login and expect dashboard")
    def login_and_wait_for_dashboard(self, email: str, password: str) -> None:
        self.login(email, password)
        self.page.wait_for_url("**/dashboard")
    
    # ── Assertions  (kept in page object for reuse across tests)
    
    def assert_error_message(self, message: str) -> None:
        expect(self.error_message).to_be_visible()
        expect(self.error_message).to_contain_text(message)
    
    def assert_login_page_loaded(self) -> None:
        expect(self.login_button).to_be_visible()
        expect(self.email_input).to_be_visible()
```

---

## 7. Page Object Example — home_page.py

```python
from playwright.sync_api import Page, Locator, expect
import allure
from pages.base_page import BasePage


class HomePage(BasePage):
    """Page Object for the Home/Dashboard page."""
    
    BASE_URL = "https://your-app.com/dashboard"
    
    def __init__(self, page: Page) -> None:
        super().__init__(page)
        
        # ── Locators
        self.welcome_heading: Locator = page.get_by_role("heading", name="Welcome")
        self.user_menu: Locator = page.get_by_role("button", name="User Menu")
        self.logout_button: Locator = page.get_by_role("menuitem", name="Logout")
        self.search_input: Locator = page.get_by_placeholder("Search...")
        self.nav_links: Locator = page.get_by_role("navigation").get_by_role("link")
    
    # ── Actions
    
    @allure.step("Search for: {query}")
    def search(self, query: str) -> None:
        self.search_input.fill(query)
        self.search_input.press("Enter")
    
    @allure.step("Logout")
    def logout(self) -> None:
        self.user_menu.click()
        self.logout_button.click()
        self.page.wait_for_url("**/login")
    
    # ── Assertions
    
    def assert_dashboard_loaded(self) -> None:
        expect(self.welcome_heading).to_be_visible()
        self.assert_url(".*/dashboard.*")
```

---

## 8. Test File Example — test_login.py

```python
import pytest
import allure
from playwright.sync_api import Page, expect
from pages.login_page import LoginPage
from pages.home_page import HomePage


@allure.feature("Authentication")
@allure.story("Login")
class TestLogin:
    """Tests for the login functionality."""
    
    @pytest.fixture(autouse=True)
    def setup(self, page: Page):
        """Setup: instantiate page objects before each test."""
        self.login_page = LoginPage(page)
        self.home_page = HomePage(page)
        self.login_page.navigate()
    
    @allure.title("Successful login with valid credentials")
    @allure.severity(allure.severity_level.CRITICAL)
    @pytest.mark.smoke
    def test_successful_login(self, page: Page):
        self.login_page.fill_email("test@example.com")
        self.login_page.fill_password("validpassword")
        self.login_page.click_login()
        
        # Assert redirect to dashboard
        expect(page).to_have_url("https://your-app.com/dashboard")
        self.home_page.assert_dashboard_loaded()
    
    @allure.title("Login fails with invalid password")
    @allure.severity(allure.severity_level.NORMAL)
    @pytest.mark.regression
    def test_invalid_password(self):
        self.login_page.fill_email("test@example.com")
        self.login_page.fill_password("wrongpassword")
        self.login_page.click_login()
        
        self.login_page.assert_error_message("Invalid credentials")
    
    @allure.title("Login fails with empty email")
    @pytest.mark.regression
    def test_empty_email(self):
        self.login_page.fill_password("somepassword")
        self.login_page.click_login()
        
        self.login_page.assert_error_message("Email is required")
    
    @allure.title("Login with empty fields shows validation")
    @pytest.mark.smoke
    def test_empty_form_validation(self, page: Page):
        self.login_page.click_login()
        
        # Check HTML5 validation
        expect(self.login_page.email_input).to_be_focused()
    
    @allure.title("Remember me checkbox works")
    @pytest.mark.regression
    def test_remember_me(self):
        self.login_page.remember_me_checkbox.check()
        expect(self.login_page.remember_me_checkbox).to_be_checked()
        
        self.login_page.login("test@example.com", "validpassword")


@allure.feature("Authentication")
@allure.story("Login - Parametrized")
class TestLoginParametrized:
    """Parametrized login tests."""
    
    @pytest.mark.parametrize("email,password,expected_error", [
        ("", "password", "Email is required"),
        ("invalid-email", "password", "Invalid email format"),
        ("test@example.com", "", "Password is required"),
        ("test@example.com", "wrong", "Invalid credentials"),
    ])
    @pytest.mark.regression
    def test_login_validation_cases(self, page: Page, email, password, expected_error):
        login_page = LoginPage(page)
        login_page.navigate()
        login_page.fill_email(email)
        login_page.fill_password(password)
        login_page.click_login()
        login_page.assert_error_message(expected_error)
```

---

## 9. conftest.py (tests/ Level — Page Object Fixtures)

```python
import pytest
from playwright.sync_api import Page
from pages.login_page import LoginPage
from pages.home_page import HomePage


@pytest.fixture
def login_page(page: Page) -> LoginPage:
    """Fixture that provides a LoginPage instance."""
    return LoginPage(page)


@pytest.fixture
def home_page(page: Page) -> HomePage:
    """Fixture that provides a HomePage instance."""
    return HomePage(page)


@pytest.fixture
def logged_in_home(page: Page) -> HomePage:
    """Fixture that logs in and returns the HomePage."""
    login_page = LoginPage(page)
    login_page.login_and_wait_for_dashboard(
        email="test@example.com",
        password="validpassword"
    )
    return HomePage(page)
```

---

## 10. Locator Priority Order (from playwright_locators_knowledge.md)

```python
# PRIORITY 1 — Role (most preferred, user-visible)
page.get_by_role("button", name="Submit")
page.get_by_role("textbox", name="Email")
page.get_by_role("link", name="Sign in")
page.get_by_role("heading", name="Welcome")
page.get_by_role("checkbox", name="Accept")

# PRIORITY 2 — Label
page.get_by_label("Email address")
page.get_by_label("Password")

# PRIORITY 3 — Placeholder
page.get_by_placeholder("Enter your email")
page.get_by_placeholder("Search products...")

# PRIORITY 4 — Text content
page.get_by_text("Sign in")
page.get_by_text("Welcome back")

# PRIORITY 5 — Alt text (images)
page.get_by_alt_text("Company logo")

# PRIORITY 6 — Test ID (data-testid attribute)
page.get_by_test_id("login-submit-btn")
page.get_by_test_id("email-input")

# PRIORITY 7 — CSS (ID first, then class, then attribute)
page.locator("#submit-button")
page.locator("[name='email']")
page.locator("[type='submit']")

# PRIORITY 8 — XPath (last resort)
page.locator("//button[@type='submit']")
page.locator("//input[@name='email']")

# CHAINING (narrow scope)
page.get_by_role("form", name="Login").get_by_label("Email")
page.locator(".modal").get_by_role("button", name="Confirm")
```

---

## 11. Common Assertions Reference

```python
from playwright.sync_api import expect

# Visibility
expect(locator).to_be_visible()
expect(locator).to_be_hidden()

# Text
expect(locator).to_have_text("Exact text")
expect(locator).to_contain_text("partial")
expect(locator).to_have_value("input value")

# State
expect(locator).to_be_enabled()
expect(locator).to_be_disabled()
expect(locator).to_be_checked()
expect(locator).to_be_focused()

# Count
expect(locator).to_have_count(3)

# Attributes
expect(locator).to_have_attribute("href", "/dashboard")
expect(locator).to_have_class("active")
expect(locator).to_have_id("submit-btn")

# Page-level
expect(page).to_have_url("https://example.com/dashboard")
expect(page).to_have_url(re.compile(r".*/dashboard.*"))
expect(page).to_have_title("Dashboard - My App")
expect(page).not_to_have_url("https://example.com/login")
```

---

## 12. Allure Integration Patterns

```python
import allure

# ── Decorators on test class / method
@allure.feature("Shopping Cart")
@allure.story("Add to Cart")
@allure.title("User can add item to cart from PDP")
@allure.severity(allure.severity_level.CRITICAL)  # BLOCKER, CRITICAL, NORMAL, MINOR, TRIVIAL
@allure.tag("smoke", "regression")

# ── Inside test: steps
with allure.step("Open product page"):
    page.goto("/products/123")

with allure.step("Click Add to Cart"):
    page.get_by_role("button", name="Add to Cart").click()

# ── On methods (use decorator instead of with-block)
@allure.step("Fill email: {email}")
def fill_email(self, email: str) -> None:
    self.email_input.fill(email)

# ── Attach screenshots
allure.attach(
    page.screenshot(),
    name="screenshot",
    attachment_type=allure.attachment_type.PNG
)

# ── Attach text data
allure.attach(
    str({"email": "test@test.com"}),
    name="test_data",
    attachment_type=allure.attachment_type.JSON
)

# ── Dynamic title
allure.dynamic.title(f"Login test for {email}")
```

---

## 13. pytest.ini Markers Usage

```python
# Mark individual tests
@pytest.mark.smoke
@pytest.mark.regression
@pytest.mark.login
@pytest.mark.xfail(reason="Known bug PW-123")
@pytest.mark.skip(reason="Feature not yet implemented")
@pytest.mark.parametrize("browser_name", ["chromium", "firefox", "webkit"])

# Run by marker
# pytest -m smoke
# pytest -m "smoke or regression"
# pytest -m "not slow"
```

---

## 14. Data-Driven Testing Patterns

```python
# Using Faker for dynamic data
from faker import Faker
fake = Faker()

test_user = {
    "email": fake.email(),
    "password": fake.password(length=12),
    "name": fake.name()
}

# Using JSON file
import json
with open("data/test_data.json") as f:
    test_data = json.load(f)

# Parametrize from data
@pytest.mark.parametrize("user_data", test_data["valid_users"])
def test_valid_logins(page, user_data):
    ...
```

---

## 15. Running Tests

```bash
# Run all tests
pytest

# Run with specific browser
pytest --browser firefox
pytest --browser webkit

# Run specific markers
pytest -m smoke
pytest -m "smoke and not slow"

# Run in parallel (pytest-xdist)
pytest --numprocesses auto
pytest -n 4

# With Allure report
pytest --alluredir=reports/allure-results
allure serve reports/allure-results

# Headed mode (see browser)
pytest --headed

# With video recording
pytest --video=on

# Specific file
pytest tests/test_login.py

# Specific test
pytest tests/test_login.py::TestLogin::test_successful_login

# Debug mode (slow motion)
pytest --headed --slowmo=1000
```

---

## 16. Anti-Patterns to Avoid

```python
# ❌ BAD — raw locators in tests
def test_login(page):
    page.locator("input[type='email']").fill("test@example.com")
    page.locator("button#submit").click()

# ✅ GOOD — through page object
def test_login(page):
    login_page = LoginPage(page)
    login_page.login("test@example.com", "password")

# ❌ BAD — time.sleep
import time
time.sleep(3)

# ✅ GOOD — Playwright handles waits automatically
page.wait_for_url("**/dashboard")
expect(locator).to_be_visible()

# ❌ BAD — fragile XPath
page.locator("//div[3]/table/tbody/tr[1]/td[2]")

# ✅ GOOD — semantic locator
page.get_by_role("cell", name="John Doe")

# ❌ BAD — assertions inside page objects
def click_login(self):
    self.login_button.click()
    assert "dashboard" in self.page.url  # Don't do this in POM

# ✅ GOOD — assertions in page objects only via expect(), or in tests
def assert_logged_in(self):
    expect(self.page).to_have_url(re.compile(".*/dashboard"))
```

---

## 17. CI/CD — GitHub Actions Example

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

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
        run: |
          pip install -r requirements.txt
          playwright install --with-deps chromium
      
      - name: Run Playwright tests
        run: pytest --alluredir=reports/allure-results -m smoke
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      
      - name: Upload Allure results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: allure-results
          path: reports/allure-results
```
