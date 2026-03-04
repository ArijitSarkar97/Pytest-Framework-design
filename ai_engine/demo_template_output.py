"""
Demo: Template-Based Test Generation (No API Required)
Shows sample output without needing ChromeDriver
"""

# Sample output generated from template-based generator
sample_output = """# Generated Test Suite for Login
# URL: https://the-internet.herokuapp.com/login  
# Requirement: Test login functionality

# ============================================================
# PAGE OBJECT MODEL
# ============================================================

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class LoginPage:
    \"\"\"Page Object Model for Login.\"\"\"
    
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)
    
    # Input field locators
    username_locator = (By.ID, "username")
    password_locator = (By.ID, "password")
    
    # Button locators
    login_button_locator = (By.CSS_SELECTOR, "button[type='submit']")
    
    def navigate(self, url):
        \"\"\"Navigate to the page.\"\"\"
        self.driver.get(url)
    
    def enter_username(self, text):
        \"\"\"Enter text into username field.\"\"\"
        element = self.wait.until(
            EC.presence_of_element_located(self.username_locator)
        )
        element.clear()
        element.send_keys(text)
    
    def enter_password(self, text):
        \"\"\"Enter text into password field.\"\"\"
        element = self.wait.until(
            EC.presence_of_element_located(self.password_locator)
        )
        element.clear()
        element.send_keys(text)
    
    def click_login_button(self):
        \"\"\"Click login_button.\"\"\"
        element = self.wait.until(
            EC.element_to_be_clickable(self.login_button_locator)
        )
        element.click()


# ============================================================
# CONFTEST (Fixtures)
# ============================================================

import pytest
from selenium import webdriver


@pytest.fixture
def driver():
    \"\"\"Provide a Selenium WebDriver instance.\"\"\"
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    driver = webdriver.Chrome(options=options)
    yield driver
    driver.quit()


@pytest.fixture
def valid_credentials():
    \"\"\"Provide valid test credentials.\"\"\"
    return {
        'username': 'tomsmith',
        'password': 'SuperSecretPassword!',
    }


# ============================================================
# SMOKE TESTS
# ============================================================

import pytest
from selenium import webdriver
from page_objects import LoginPage


@pytest.mark.smoke
def test_login_loads(driver):
    \"\"\"Smoke test: Verify Login loads successfully.\"\"\"
    driver.get("https://the-internet.herokuapp.com/login")
    assert "Login Page" in driver.title


@pytest.mark.smoke
def test_critical_elements_present(driver):
    \"\"\"Smoke test: Verify critical elements are present.\"\"\"
    page = LoginPage(driver)
    page.navigate("https://the-internet.herokuapp.com/login")
    
    assert page.driver.find_element(*page.username_locator)
    assert page.driver.find_element(*page.password_locator)


# ============================================================
# FUNCTIONAL TESTS
# ============================================================


def test_valid_login_success(driver, valid_credentials):
    \"\"\"Test successful login with valid credentials.\"\"\"
    page = LoginPage(driver)
    page.navigate("https://the-internet.herokuapp.com/login")
    
    page.enter_username(valid_credentials['username'])
    page.enter_password(valid_credentials['password'])
    page.click_login_button()
    
    # Verify success
    assert 'secure' in driver.current_url.lower() or 'welcome' in driver.page_source.lower()


# ============================================================
# NEGATIVE TESTS
# ============================================================


@pytest.mark.parametrize('invalid_email', [
    '',  # Empty
    'notanemail',  # No @
    'test@',  # No domain
    '@example.com',  # No local part
])
def test_invalid_email_rejected(driver, invalid_email):
    \"\"\"Test email validation rejects invalid formats.\"\"\"
    page = LoginPage(driver)
    page.navigate("https://the-internet.herokuapp.com/login")
    page.enter_username(invalid_email)
    # Assert error message shown
    pass  # TODO: Check for error message


@pytest.mark.parametrize('username,password,expected_error', [
    ('', 'password123', 'username required'),
    ('testuser', '', 'password required'),
    ('invalid', 'wrong', 'invalid credentials'),
])
def test_invalid_login_shows_error(driver, username, password, expected_error):
    \"\"\"Test that invalid login attempts show appropriate error messages.\"\"\"
    page = LoginPage(driver)
    page.navigate("https://the-internet.herokuapp.com/login")
    
    page.enter_username(username)
    page.enter_password(password)
    page.click_login_button()
    
    # Verify error message is shown
    error_element = driver.find_element(By.CSS_SELECTOR, ".flash.error")
    assert error_element.is_displayed()


# ============================================================
# USAGE
# ============================================================
# Run all tests: pytest
# Run smoke tests only: pytest -m smoke
# Run with verbose: pytest -v  
# Run specific test: pytest test_login.py::test_valid_login_success
"""

print(sample_output)
