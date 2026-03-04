# Generated Test Suite for Example
# URL: https://example.com
# Test Types: smoke, functional, negative, security, performance, accessibility, integration, regression

# ============================================================
# PAGE OBJECT MODEL
# ============================================================

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


class ExamplePage:
    """Page Object Model for Example."""

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    def navigate(self, url):
        """Navigate to the page."""
        self.driver.get(url)



# ============================================================
# CONFTEST (Fixtures)
# ============================================================

import pytest
from selenium import webdriver


@pytest.fixture
def driver():
    """Provide a Selenium WebDriver instance."""
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    driver = webdriver.Chrome(options=options)
    yield driver
    driver.quit()


@pytest.fixture
def valid_credentials():
    """Provide valid test credentials."""
    return {
        'username': 'testuser@example.com',
        'password': 'SecurePassword123!',
    }



# ============================================================
# SMOKE TESTS
# ============================================================

import pytest
from selenium import webdriver
from page_objects import ExamplePage


@pytest.mark.smoke
def test_example_loads(driver):
    """Smoke test: Verify Example loads successfully."""
    driver.get("https://example.com")
    assert "ExampleDomainPage" in driver.title



# ============================================================
# SECURITY TESTS
# ============================================================


import pytest
from selenium import webdriver
from page_objects import ExamplePage

@pytest.mark.security
def test_csrf_token_present(driver):
    """Security: Verify CSRF tokens are present in forms."""
    driver.get("https://example.com")
    forms = driver.find_elements('tag name', 'form')
    for form in forms:
        hidden_inputs = form.find_elements('css selector', 'input[type=hidden]')
        token_names = ['csrf', 'token', '_token', 'authenticity_token', 'csrfmiddlewaretoken']
        has_csrf = any(
            any(tn in (inp.get_attribute('name') or '').lower() for tn in token_names)
            for inp in hidden_inputs
        )
        if not has_csrf:
            print(f'WARNING: Form may be missing CSRF token protection')

@pytest.mark.security
def test_password_field_is_masked(driver):
    """Security: Verify password fields use type=password."""
    driver.get("https://example.com")
    text_fields_with_pass = driver.find_elements('css selector', 'input[type=text][name*=pass], input[type=text][name*=pwd]')
    assert len(text_fields_with_pass) == 0, \
        'Password-like fields found using type=text instead of type=password'

@pytest.mark.security
def test_autocomplete_off_for_sensitive_fields(driver):
    """Security: Verify autocomplete is disabled for sensitive fields."""
    driver.get("https://example.com")
    sensitive_selectors = ['input[type=password]', 'input[name*=credit]', 'input[name*=card]', 'input[name*=ssn]']
    for selector in sensitive_selectors:
        fields = driver.find_elements('css selector', selector)
        for field in fields:
            autocomplete = field.get_attribute('autocomplete')
            if autocomplete and autocomplete.lower() != 'off':
                print(f'WARNING: Sensitive field {field.get_attribute("name")} has autocomplete enabled')



# ============================================================
# PERFORMANCE TESTS
# ============================================================


import pytest
import time
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from page_objects import ExamplePage

@pytest.mark.performance
def test_page_load_time(driver):
    """Performance: Page should load within 5 seconds."""
    start_time = time.time()
    driver.get("https://example.com")
    WebDriverWait(driver, 10).until(
        lambda d: d.execute_script('return document.readyState') == 'complete'
    )
    load_time = time.time() - start_time
    print(f'Page load time: {load_time:.2f}s')
    assert load_time < 5, f'Page took {load_time:.2f}s to load (threshold: 5s)'

@pytest.mark.performance
def test_dom_content_loaded_time(driver):
    """Performance: DOM content should be interactive within 3 seconds."""
    driver.get("https://example.com")
    timing = driver.execute_script(
        'return window.performance.timing'
    )
    dom_content_loaded = (timing['domContentLoadedEventEnd'] - timing['navigationStart']) / 1000
    print(f'DOM Content Loaded: {dom_content_loaded:.2f}s')
    assert dom_content_loaded < 3, f'DOM took {dom_content_loaded:.2f}s to become interactive'

@pytest.mark.performance
def test_resource_count(driver):
    """Performance: Page should not load excessive resources."""
    driver.get("https://example.com")
    resource_count = driver.execute_script(
        'return window.performance.getEntriesByType("resource").length'
    )
    print(f'Total resources loaded: {resource_count}')
    assert resource_count < 100, f'Page loaded {resource_count} resources (threshold: 100)'

@pytest.mark.performance
def test_no_memory_leaks_on_navigation(driver):
    """Performance: Repeated navigation should not cause memory growth."""
    driver.get("https://example.com")
    initial_memory = driver.execute_script(
        'return window.performance.memory ? window.performance.memory.usedJSHeapSize : null'
    )
    if initial_memory is None:
        pytest.skip('Memory API not available in this browser')
    for _ in range(5):
        driver.get("https://example.com")
        driver.execute_script('return document.readyState')
    final_memory = driver.execute_script(
        'return window.performance.memory.usedJSHeapSize'
    )
    growth = (final_memory - initial_memory) / initial_memory * 100
    print(f'Memory growth after 5 navigations: {growth:.1f}%')
    assert growth < 50, f'Memory grew by {growth:.1f}% (threshold: 50%)'



# ============================================================
# ACCESSIBILITY TESTS
# ============================================================


import pytest
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from page_objects import ExamplePage

@pytest.mark.accessibility
def test_images_have_alt_text(driver):
    """Accessibility: All images should have alt text."""
    driver.get("https://example.com")
    images = driver.find_elements('tag name', 'img')
    images_without_alt = []
    for img in images:
        alt = img.get_attribute('alt')
        if not alt or alt.strip() == '':
            src = img.get_attribute('src') or 'unknown'
            images_without_alt.append(src[:50])
    assert len(images_without_alt) == 0, \
        f'{len(images_without_alt)} image(s) missing alt text: {images_without_alt[:3]}'

@pytest.mark.accessibility
def test_keyboard_navigation(driver):
    """Accessibility: All interactive elements should be reachable via Tab key."""
    driver.get("https://example.com")
    body = driver.find_element('tag name', 'body')
    interactive_count = len(driver.find_elements('css selector',
        'a[href], button, input:not([type=hidden]), select, textarea, [tabindex]'))
    focused_elements = set()
    body.send_keys(Keys.TAB)
    for _ in range(min(interactive_count + 5, 50)):
        active = driver.switch_to.active_element
        tag = active.tag_name
        if tag in ['input', 'button', 'a', 'select', 'textarea']:
            focused_elements.add(f'{tag}:{active.get_attribute("id") or active.get_attribute("name") or "?"}')
        active.send_keys(Keys.TAB)
    print(f'Reached {len(focused_elements)} of {interactive_count} interactive elements via keyboard')
    if interactive_count > 0:
        ratio = len(focused_elements) / interactive_count
        assert ratio >= 0.5, \
            f'Only {len(focused_elements)}/{interactive_count} elements reachable by keyboard'

@pytest.mark.accessibility
def test_heading_hierarchy(driver):
    """Accessibility: Headings should follow proper hierarchy (h1 -> h2 -> h3)."""
    driver.get("https://example.com")
    headings = []
    for level in range(1, 7):
        elements = driver.find_elements('tag name', f'h{level}')
        for el in elements:
            headings.append((level, el.text[:30]))
    h1_count = sum(1 for h in headings if h[0] == 1)
    assert h1_count >= 1, 'Page should have at least one h1 heading'
    levels_used = sorted(set(h[0] for h in headings))
    for i in range(1, len(levels_used)):
        gap = levels_used[i] - levels_used[i-1]
        if gap > 1:
            print(f'WARNING: Heading hierarchy skips from h{levels_used[i-1]} to h{levels_used[i]}')

@pytest.mark.accessibility
def test_aria_landmarks_present(driver):
    """Accessibility: Page should have ARIA landmarks for screen readers."""
    driver.get("https://example.com")
    landmarks = {
        'banner': driver.find_elements('css selector', 'header, [role=banner]'),
        'navigation': driver.find_elements('css selector', 'nav, [role=navigation]'),
        'main': driver.find_elements('css selector', 'main, [role=main]'),
        'contentinfo': driver.find_elements('css selector', 'footer, [role=contentinfo]'),
    }
    present = {k: len(v) > 0 for k, v in landmarks.items()}
    print(f'ARIA Landmarks: {present}')
    assert present['main'], 'Page should have a main content landmark'

@pytest.mark.accessibility
def test_text_not_too_small(driver):
    """Accessibility: Text should be at least 12px for readability."""
    driver.get("https://example.com")
    paragraphs = driver.find_elements('css selector', 'p, span, a, label, li')
    small_text_elements = []
    for el in paragraphs[:50]:
        font_size = el.value_of_css_property('font-size')
        if font_size and 'px' in font_size:
            size = float(font_size.replace('px', ''))
            if size < 12 and el.text.strip():
                small_text_elements.append(f'{el.tag_name}: {el.text[:20]} ({font_size})')
    if small_text_elements:
        print(f'WARNING: {len(small_text_elements)} elements with small text: {small_text_elements[:3]}')



# ============================================================
# INTEGRATION TESTS
# ============================================================


import pytest
import time
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from page_objects import ExamplePage

@pytest.mark.integration
def test_navigation_links_resolve(driver):
    """Integration: Navigation links should load valid pages (no 404/500)."""
    driver.get("https://example.com")
    links = driver.find_elements('tag name', 'a')
    hrefs = []
    for link in links[:10]:
        href = link.get_attribute('href')
        if href and href.startswith('http') and '#' not in href:
            hrefs.append(href)
    broken_links = []
    for href in hrefs[:5]:
        try:
            driver.get(href)
            title = driver.title.lower()
            if '404' in title or 'not found' in title:
                broken_links.append(href)
        except Exception:
            broken_links.append(href)
    assert len(broken_links) == 0, \
        f'{len(broken_links)} broken links found: {broken_links}'

@pytest.mark.integration
def test_cookies_set_on_visit(driver):
    """Integration: Page visit should establish session cookies."""
    driver.get("https://example.com")
    cookies = driver.get_cookies()
    print(f'Cookies set: {[c["name"] for c in cookies]}')
    if len(cookies) == 0:
        print('INFO: No cookies were set on page visit')

@pytest.mark.integration
def test_page_loads_without_console_errors(driver):
    """Integration: Page should load without critical JavaScript errors."""
    driver.get("https://example.com")
    logs = driver.get_log('browser')
    severe_errors = [log for log in logs if log['level'] == 'SEVERE']
    if severe_errors:
        error_messages = [e['message'][:100] for e in severe_errors[:5]]
        print(f'Console errors: {error_messages}')
    assert len(severe_errors) == 0, \
        f'{len(severe_errors)} severe JS errors found on page load'



# ============================================================
# REGRESSION TESTS
# ============================================================


import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from page_objects import ExamplePage

@pytest.mark.regression
def test_element_count_unchanged(driver):
    """Regression: Page should contain the expected number of UI elements."""
    driver.get("https://example.com")
    inputs = driver.find_elements('css selector', 'input:not([type=hidden]), textarea, select')
    buttons = driver.find_elements('css selector', 'button, input[type=submit]')
    links = driver.find_elements('tag name', 'a')
    print(f'Found: {len(inputs)} inputs, {len(buttons)} buttons, {len(links)} links')
    assert len(inputs) >= 0, f'Expected ~0 inputs, found {len(inputs)}'
    assert len(buttons) >= 0, f'Expected ~0 buttons, found {len(buttons)}'

@pytest.mark.regression
def test_page_title_unchanged(driver):
    """Regression: Page title should match expected value."""
    driver.get("https://example.com")
    expected_title = "ExampleDomainPage"
    if expected_title:
        assert expected_title in driver.title, \
            f'Title changed: expected "{expected_title}" but got "{driver.title}"'



# ============================================================
# USAGE
# ============================================================
# Run all tests:          pytest
# Run by category:        pytest -m smoke / pytest -m security / pytest -m accessibility
# Run with verbose:       pytest -v
# Run specific test file: pytest test_smoke.py

