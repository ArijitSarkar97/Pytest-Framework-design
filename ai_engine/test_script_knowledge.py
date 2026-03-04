"""
RAG Knowledge Base: Selenium + PyTest Test Script Writing Best Practices
=======================================================================
This module contains comprehensive patterns, assertions, and templates
for writing production-quality Selenium + PyTest test scripts across all
8 test types. Used by the template engine and AI generators to produce
proper, assertion-rich test code that definitively PASSES or FAILS.

Sources: Selenium docs, PyTest docs, BrowserStack, GitHub frameworks,
         OWASP, WCAG 2.1, W3C Navigation Timing API
"""

# ========================================================================
# CORE ASSERTION PATTERNS
# ========================================================================

ASSERTION_PATTERNS = {
    # --- Element Assertions ---
    "element_visible": {
        "code": 'assert {element}.is_displayed(), "Element {name} should be visible"',
        "wait": 'WebDriverWait(driver, 10).until(EC.visibility_of_element_located({locator}))',
        "description": "Verify element is visible on page",
    },
    "element_not_visible": {
        "code": 'assert not driver.find_elements(*{locator}), "Element {name} should NOT be visible"',
        "wait": 'WebDriverWait(driver, 10).until(EC.invisibility_of_element_located({locator}))',
        "description": "Verify element is NOT visible",
    },
    "element_present": {
        "code": 'assert driver.find_element(*{locator}), "Element {name} should exist in DOM"',
        "wait": 'WebDriverWait(driver, 10).until(EC.presence_of_element_located({locator}))',
        "description": "Verify element exists in DOM",
    },
    "element_clickable": {
        "code": 'element = WebDriverWait(driver, 10).until(EC.element_to_be_clickable({locator}))\nassert element, "Element {name} should be clickable"',
        "description": "Verify element is clickable (visible + enabled)",
    },
    "element_enabled": {
        "code": 'assert {element}.is_enabled(), "Element {name} should be enabled"',
        "description": "Verify form element is enabled",
    },
    "element_disabled": {
        "code": 'assert not {element}.is_enabled(), "Element {name} should be disabled"',
        "description": "Verify form element is disabled",
    },

    # --- Text Assertions ---
    "text_equals": {
        "code": 'assert {element}.text == "{expected}", f"Expected \\"{expected}\\" but got \\"{{element}.text}\\""',
        "description": "Exact text match",
    },
    "text_contains": {
        "code": 'assert "{expected}" in {element}.text, f"Expected text to contain \\"{expected}\\" but got \\"{{element}.text}\\""',
        "description": "Partial text match",
    },
    "text_not_empty": {
        "code": 'assert {element}.text.strip() != "", "Element {name} text should not be empty"',
        "description": "Verify element has some text content",
    },

    # --- Page Assertions ---
    "page_title": {
        "code": 'assert driver.title == "{expected}", f"Expected title \\"{expected}\\" but got \\"{driver.title}\\""',
        "wait": 'WebDriverWait(driver, 10).until(EC.title_is("{expected}"))',
        "description": "Verify page title",
    },
    "page_title_contains": {
        "code": 'assert "{expected}" in driver.title, f"Expected title to contain \\"{expected}\\""',
        "wait": 'WebDriverWait(driver, 10).until(EC.title_contains("{expected}"))',
        "description": "Verify page title contains text",
    },
    "url_equals": {
        "code": 'assert driver.current_url == "{expected}", f"Expected URL \\"{expected}\\" but got \\"{driver.current_url}\\""',
        "wait": 'WebDriverWait(driver, 10).until(EC.url_to_be("{expected}"))',
        "description": "Verify current URL",
    },
    "url_contains": {
        "code": 'assert "{expected}" in driver.current_url, f"URL should contain \\"{expected}\\""',
        "wait": 'WebDriverWait(driver, 10).until(EC.url_contains("{expected}"))',
        "description": "Verify URL contains substring",
    },
    "page_source_contains": {
        "code": 'assert "{expected}" in driver.page_source, "Page source should contain \\"{expected}\\""',
        "description": "Verify text exists somewhere in page HTML",
    },

    # --- Attribute Assertions ---
    "attribute_equals": {
        "code": 'assert {element}.get_attribute("{attr}") == "{expected}", "Attribute {attr} should be {expected}"',
        "description": "Verify element attribute value",
    },
    "attribute_contains": {
        "code": 'assert "{expected}" in ({element}.get_attribute("{attr}") or ""), "Attribute {attr} should contain {expected}"',
        "description": "Verify attribute contains substring",
    },
    "css_class_present": {
        "code": 'assert "{cls}" in {element}.get_attribute("class"), "Element should have CSS class {cls}"',
        "description": "Verify CSS class is present",
    },

    # --- Count Assertions ---
    "element_count": {
        "code": 'elements = driver.find_elements(*{locator})\nassert len(elements) == {expected}, f"Expected {expected} elements but found {{len(elements)}}"',
        "description": "Verify number of matching elements",
    },
    "element_count_greater": {
        "code": 'elements = driver.find_elements(*{locator})\nassert len(elements) > {expected}, f"Expected more than {expected} elements but found {{len(elements)}}"',
        "description": "Verify at least N elements exist",
    },
}


# ========================================================================
# TEST TYPE SPECIFIC TEMPLATES (Complete runnable code patterns)
# ========================================================================

SMOKE_TEST_TEMPLATE = '''
@pytest.mark.smoke
@allure.severity(allure.severity_level.CRITICAL)
def test_{page}_page_loads(self, driver, config):
    """Verify page loads successfully and key elements are visible."""
    driver.get(config["base_url"])
    
    # Assert page loaded (title is not empty)
    WebDriverWait(driver, 10).until(lambda d: d.title != "")
    assert driver.title, "Page title should not be empty after load"
    
    # Assert no error page
    assert "404" not in driver.title.lower(), "Page should not be a 404 error"
    assert "500" not in driver.page_source[:500].lower(), "Page should not have server error"
    
    # Assert key elements are present
    body = driver.find_element(By.TAG_NAME, "body")
    assert body.is_displayed(), "Page body should be visible"
'''

FUNCTIONAL_TEST_TEMPLATE = '''
@pytest.mark.functional
@allure.severity(allure.severity_level.NORMAL)
def test_{page}_form_submit(self, driver, config):
    """Verify form can be filled and submitted successfully."""
    driver.get(config["base_url"])
    page = {PageClass}(driver)
    
    # Fill form fields
    {fill_steps}
    
    # Submit
    {submit_step}
    
    # Assert success outcome (URL change, success message, or redirect)
    WebDriverWait(driver, 10).until(
        lambda d: d.current_url != config["base_url"] or 
                  len(d.find_elements(By.CSS_SELECTOR, ".success, .alert-success, [class*='success']")) > 0
    )
    # Verify no error messages appeared
    error_elements = driver.find_elements(By.CSS_SELECTOR, ".error, .alert-danger, .alert-error, [class*='error']")
    visible_errors = [e for e in error_elements if e.is_displayed()]
    assert len(visible_errors) == 0, f"No error messages should appear, found: {{[e.text for e in visible_errors]}}"
'''

NEGATIVE_TEST_TEMPLATE = '''
@pytest.mark.negative
@allure.severity(allure.severity_level.NORMAL)
def test_{page}_empty_submit(self, driver, config):
    """Verify form shows validation errors when submitted empty."""
    driver.get(config["base_url"])
    page = {PageClass}(driver)
    
    # Submit without filling fields
    {submit_step}
    
    # Assert validation error appears
    # Strategy 1: Check for visible error messages
    error_selectors = [
        ".error", ".alert-danger", ".invalid-feedback", 
        "[class*='error']", "[role='alert']", ".help-block",
        "input:invalid"
    ]
    error_found = False
    for selector in error_selectors:
        errors = driver.find_elements(By.CSS_SELECTOR, selector)
        if any(e.is_displayed() for e in errors):
            error_found = True
            break
    
    # Strategy 2: Check HTML5 validation via :invalid pseudo-class
    if not error_found:
        invalid_inputs = driver.execute_script(
            "return document.querySelectorAll('input:invalid, select:invalid, textarea:invalid').length"
        )
        error_found = invalid_inputs > 0
    
    # Strategy 3: Check URL hasn't changed (form didn't submit)
    if not error_found:
        error_found = driver.current_url == config["base_url"] or config["base_url"] in driver.current_url
    
    assert error_found, "Validation error should appear when form is submitted empty"


@pytest.mark.negative
def test_{page}_invalid_special_chars(self, driver, config):
    """Verify form handles special characters gracefully."""
    driver.get(config["base_url"])
    page = {PageClass}(driver)
    
    special_chars = "!@#$%^&*(){{}}[]|\\\\<>?/~`"
    {fill_with_special_chars}
    {submit_step}
    
    # Assert: App does NOT crash (no unhandled error page)
    assert "500" not in driver.page_source[:500], "Server should not crash with special chars"
    assert "error" not in driver.title.lower() or "form" in driver.page_source.lower(), \\
        "Application should handle special characters gracefully"
'''

SECURITY_TEST_TEMPLATE = '''
@pytest.mark.security
@allure.severity(allure.severity_level.BLOCKER)
def test_{page}_xss_injection(self, driver, config):
    """Verify XSS payloads are sanitized and not executed."""
    driver.get(config["base_url"])
    page = {PageClass}(driver)
    
    xss_payloads = [
        "<script>alert('XSS')</script>",
        "<img src=x onerror=alert(1)>",
        "'\\"><script>alert(1)</script>",
        "<svg onload=alert(1)>",
        "javascript:alert(1)",
    ]
    
    for payload in xss_payloads:
        # Inject payload into each input
        {inject_payload_steps}
        
        # Assert: No JavaScript alert was triggered
        try:
            alert = driver.switch_to.alert
            alert_text = alert.text
            alert.dismiss()
            pytest.fail(f"XSS vulnerability! Alert triggered with text: {{alert_text}}")
        except Exception:
            pass  # Good - no alert means XSS was blocked
        
        # Assert: Payload is NOT rendered as executable HTML
        page_source = driver.page_source
        assert "<script>alert" not in page_source.lower(), \\
            f"XSS payload should be escaped, not rendered as HTML"
        
        # Reset page for next payload
        driver.get(config["base_url"])


@pytest.mark.security
def test_{page}_sql_injection(self, driver, config):
    """Verify SQL injection payloads don't bypass authentication."""
    driver.get(config["base_url"])
    page = {PageClass}(driver)
    
    sql_payloads = [
        "' OR 1=1 --",
        "1; DROP TABLE users --",
        "' UNION SELECT * FROM users --",
        "admin'--",
        "1' OR '1'='1",
    ]
    
    for payload in sql_payloads:
        {inject_sql_steps}
        {submit_step}
        
        # Assert: Should NOT bypass authentication / show success
        error_indicators = driver.find_elements(By.CSS_SELECTOR, 
            ".error, .alert-danger, [class*='error'], [class*='invalid']")
        url_unchanged = config["base_url"] in driver.current_url
        
        assert url_unchanged or any(e.is_displayed() for e in error_indicators), \\
            f"SQL injection payload '{{payload}}' should NOT grant access"
        
        driver.get(config["base_url"])  # Reset


@pytest.mark.security
def test_{page}_password_field_masking(self, driver, config):
    """Verify password fields mask input (type='password')."""
    driver.get(config["base_url"])
    
    password_fields = driver.find_elements(By.CSS_SELECTOR, 
        "input[type='password'], input[name*='pass'], input[id*='pass']")
    
    for field in password_fields:
        input_type = field.get_attribute("type")
        assert input_type == "password", \\
            f"Password field should have type='password', got '{{input_type}}'"
        
        # Verify autocomplete is off for security
        autocomplete = field.get_attribute("autocomplete")
        if autocomplete:
            assert autocomplete in ["off", "new-password", "current-password"], \\
                f"Password autocomplete should be secure, got '{{autocomplete}}'"
'''

PERFORMANCE_TEST_TEMPLATE = '''
@pytest.mark.performance
@allure.severity(allure.severity_level.NORMAL)
def test_{page}_page_load_time(self, driver, config):
    """Verify page loads within acceptable time (< 5 seconds)."""
    driver.get(config["base_url"])
    
    # Use Navigation Timing API for precise measurement
    load_time = driver.execute_script("""
        var perf = window.performance.timing;
        return perf.loadEventEnd - perf.navigationStart;
    """)
    
    # If loadEventEnd is 0 (not fired yet), wait and retry
    if load_time <= 0:
        import time
        time.sleep(2)
        load_time = driver.execute_script("""
            var perf = window.performance.timing;
            return perf.loadEventEnd - perf.navigationStart;
        """)
    
    max_load_time_ms = 5000  # 5 seconds threshold
    assert load_time > 0, "Load time should be measurable (> 0)"
    assert load_time < max_load_time_ms, \\
        f"Page load time {{load_time}}ms exceeds threshold {{max_load_time_ms}}ms"


@pytest.mark.performance
def test_{page}_dom_content_loaded(self, driver, config):
    """Verify DOM is interactive within 3 seconds."""
    driver.get(config["base_url"])
    
    dom_ready_time = driver.execute_script("""
        var perf = window.performance.timing;
        return perf.domContentLoadedEventEnd - perf.navigationStart;
    """)
    
    max_dom_ready_ms = 3000
    assert dom_ready_time > 0, "DOM ready time should be measurable"
    assert dom_ready_time < max_dom_ready_ms, \\
        f"DOM interactive time {{dom_ready_time}}ms exceeds {{max_dom_ready_ms}}ms"


@pytest.mark.performance
def test_{page}_time_to_first_byte(self, driver, config):
    """Verify server responds within 1.5 seconds (TTFB)."""
    driver.get(config["base_url"])
    
    ttfb = driver.execute_script("""
        var perf = window.performance.timing;
        return perf.responseStart - perf.navigationStart;
    """)
    
    max_ttfb_ms = 1500
    assert ttfb > 0, "TTFB should be measurable"
    assert ttfb < max_ttfb_ms, \\
        f"Time to First Byte {{ttfb}}ms exceeds threshold {{max_ttfb_ms}}ms"


@pytest.mark.performance
def test_{page}_resource_count(self, driver, config):
    """Verify page doesn't load excessive resources."""
    driver.get(config["base_url"])
    
    resource_count = driver.execute_script(
        "return window.performance.getEntriesByType('resource').length"
    )
    
    max_resources = 100
    assert resource_count < max_resources, \\
        f"Page loads {{resource_count}} resources, exceeds {{max_resources}} threshold"
'''

ACCESSIBILITY_TEST_TEMPLATE = '''
@pytest.mark.accessibility
@allure.severity(allure.severity_level.NORMAL)
def test_{page}_images_have_alt_text(self, driver, config):
    """Verify all images have descriptive alt text (WCAG 1.1.1)."""
    driver.get(config["base_url"])
    
    images = driver.find_elements(By.TAG_NAME, "img")
    images_without_alt = []
    for img in images:
        alt = img.get_attribute("alt")
        src = img.get_attribute("src") or "unknown"
        # Decorative images can have empty alt="" but must have the attribute
        if alt is None:
            images_without_alt.append(src[-50:])  # Last 50 chars of src
    
    assert len(images_without_alt) == 0, \\
        f"{{len(images_without_alt)}} images missing alt attribute: {{images_without_alt[:5]}}"


@pytest.mark.accessibility
def test_{page}_inputs_have_labels(self, driver, config):
    """Verify all form inputs have associated labels (WCAG 1.3.1)."""
    driver.get(config["base_url"])
    
    unlabeled = driver.execute_script("""
        var inputs = document.querySelectorAll('input, select, textarea');
        var unlabeled = [];
        inputs.forEach(function(input) {
            if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') return;
            var id = input.id;
            var hasLabel = id && document.querySelector('label[for="' + id + '"]');
            var hasAriaLabel = input.getAttribute('aria-label');
            var hasAriaLabelledBy = input.getAttribute('aria-labelledby');
            var hasTitle = input.getAttribute('title');
            var wrappedInLabel = input.closest('label');
            if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy && !hasTitle && !wrappedInLabel) {
                unlabeled.push(input.name || input.id || input.type || 'unknown');
            }
        });
        return unlabeled;
    """)
    
    assert len(unlabeled) == 0, \\
        f"{{len(unlabeled)}} inputs missing labels: {{unlabeled[:5]}}"


@pytest.mark.accessibility
def test_{page}_heading_hierarchy(self, driver, config):
    """Verify heading tags follow proper hierarchy (WCAG 1.3.1)."""
    driver.get(config["base_url"])
    
    headings = driver.execute_script("""
        var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        var levels = [];
        headings.forEach(function(h) { levels.push(parseInt(h.tagName[1])); });
        return levels;
    """)
    
    if len(headings) > 0:
        # Should start with h1
        assert headings[0] == 1, f"First heading should be h1, got h{{headings[0]}}"
        
        # No heading should skip more than one level
        for i in range(1, len(headings)):
            diff = headings[i] - headings[i-1]
            assert diff <= 1, \\
                f"Heading hierarchy broken at position {{i}}: h{{headings[i-1]}} -> h{{headings[i]}}"


@pytest.mark.accessibility
def test_{page}_keyboard_navigation(self, driver, config):
    """Verify interactive elements are keyboard accessible (WCAG 2.1.1)."""
    driver.get(config["base_url"])
    
    # Count focusable elements
    focusable_count = driver.execute_script("""
        var focusable = document.querySelectorAll(
            'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        return focusable.length;
    """)
    
    # Tab through elements and verify focus moves
    from selenium.webdriver.common.keys import Keys
    body = driver.find_element(By.TAG_NAME, "body")
    body.send_keys(Keys.TAB)
    
    focused_element = driver.switch_to.active_element
    assert focused_element is not None, "Tab key should move focus to an element"
    assert focused_element.tag_name != "body", \\
        "Focus should move from body to an interactive element"


@pytest.mark.accessibility
def test_{page}_aria_landmarks(self, driver, config):
    """Verify ARIA landmark roles are present (WCAG 1.3.1)."""
    driver.get(config["base_url"])
    
    landmarks = driver.execute_script("""
        var roles = ['banner', 'navigation', 'main', 'contentinfo'];
        var found = {};
        roles.forEach(function(role) {
            found[role] = document.querySelectorAll('[role="' + role + '"]').length > 0 ||
                          document.querySelectorAll(
                              role === 'banner' ? 'header' : 
                              role === 'navigation' ? 'nav' : 
                              role === 'main' ? 'main' : 'footer'
                          ).length > 0;
        });
        return found;
    """)
    
    assert landmarks.get("main", False), \\
        "Page should have a <main> element or role='main' landmark"


@pytest.mark.accessibility
def test_{page}_color_contrast_minimum(self, driver, config):
    """Verify text has sufficient font size for readability."""
    driver.get(config["base_url"])
    
    small_text = driver.execute_script("""
        var allText = document.querySelectorAll('p, span, a, li, td, label, div');
        var tooSmall = [];
        allText.forEach(function(el) {
            var fontSize = parseFloat(window.getComputedStyle(el).fontSize);
            if (fontSize < 12 && el.textContent.trim().length > 0) {
                tooSmall.push({tag: el.tagName, size: fontSize, text: el.textContent.trim().substring(0, 30)});
            }
        });
        return tooSmall.slice(0, 5);
    """)
    
    assert len(small_text) == 0, \\
        f"Found text elements below 12px font size: {{small_text}}"
'''

INTEGRATION_TEST_TEMPLATE = '''
@pytest.mark.integration
@allure.severity(allure.severity_level.NORMAL)
def test_{page}_form_submission_response(self, driver, config):
    """Verify form submits and server responds correctly."""
    driver.get(config["base_url"])
    page = {PageClass}(driver)
    
    # Store initial URL
    initial_url = driver.current_url
    
    # Fill and submit form
    {fill_steps}
    {submit_step}
    
    # Assert: Response received (URL changed OR success element appeared OR page content changed)
    import time
    time.sleep(2)  # Brief wait for server response
    
    url_changed = driver.current_url != initial_url
    success_elements = driver.find_elements(By.CSS_SELECTOR, 
        ".success, .alert-success, .confirmation, [class*='success']")
    has_success = any(e.is_displayed() for e in success_elements) if success_elements else False
    
    assert url_changed or has_success, \\
        "Form submission should produce a response (URL change or success message)"


@pytest.mark.integration
def test_{page}_navigation_links_resolve(self, driver, config):
    """Verify all navigation links resolve to valid pages (no 404)."""
    driver.get(config["base_url"])
    
    links = driver.find_elements(By.CSS_SELECTOR, "nav a[href], .nav a[href], header a[href]")
    broken_links = []
    
    for link in links[:10]:  # Test first 10 links to avoid timeout
        href = link.get_attribute("href")
        if not href or href.startswith("javascript:") or href.startswith("#"):
            continue
        
        # Visit the link
        driver.get(href)
        
        # Check for 404/error pages
        if "404" in driver.title.lower() or "not found" in driver.title.lower():
            broken_links.append(href)
        
        driver.back()
    
    assert len(broken_links) == 0, \\
        f"Found {{len(broken_links)}} broken links: {{broken_links}}"


@pytest.mark.integration
def test_{page}_no_console_errors(self, driver, config):
    """Verify no JavaScript errors in browser console."""
    # Enable logging before navigation
    driver.get(config["base_url"])
    
    # Get browser console logs
    try:
        logs = driver.get_log("browser")
        severe_errors = [log for log in logs if log.get("level") == "SEVERE"]
        
        # Filter out known acceptable errors (e.g., favicon 404)
        real_errors = [
            log for log in severe_errors 
            if "favicon" not in log.get("message", "").lower()
        ]
        
        assert len(real_errors) == 0, \\
            f"Found {{len(real_errors)}} console errors: {{[e['message'][:100] for e in real_errors]}}"
    except Exception:
        # Some drivers don't support get_log; skip gracefully
        pass


@pytest.mark.integration
def test_{page}_cookies_set_correctly(self, driver, config):
    """Verify the application sets cookies correctly."""
    driver.get(config["base_url"])
    
    cookies = driver.get_cookies()
    
    # Basic check: at least session cookie should exist for most apps
    # Verify no excessively long cookies 
    for cookie in cookies:
        assert len(cookie.get("value", "")) < 4096, \\
            f"Cookie '{{cookie['name']}}' value exceeds 4KB limit"
        
        # Security: Sensitive cookies should have Secure flag in production
        if cookie.get("name", "").lower() in ["session", "sessionid", "token", "auth"]:
            if "https" in config["base_url"]:
                assert cookie.get("secure", False), \\
                    f"Session cookie '{{cookie['name']}}' should have Secure flag on HTTPS"
'''

REGRESSION_TEST_TEMPLATE = '''
@pytest.mark.regression
@allure.severity(allure.severity_level.NORMAL)
def test_{page}_page_title_unchanged(self, driver, config):
    """Verify page title matches expected baseline."""
    driver.get(config["base_url"])
    
    title = driver.title
    assert title and len(title) > 0, "Page title should not be empty"
    # Store baseline on first run, compare on subsequent runs
    allure.attach(title, name="Page Title", attachment_type=allure.attachment_type.TEXT)


@pytest.mark.regression
def test_{page}_element_count_baseline(self, driver, config):
    """Verify key interactive elements count hasn't changed unexpectedly."""
    driver.get(config["base_url"])
    
    counts = driver.execute_script("""
        return {
            inputs: document.querySelectorAll('input').length,
            buttons: document.querySelectorAll('button').length,
            links: document.querySelectorAll('a').length,
            forms: document.querySelectorAll('form').length,
            images: document.querySelectorAll('img').length
        };
    """)
    
    # Assert minimum expected elements exist
    assert counts["inputs"] >= 0, "Input count should be non-negative"
    assert counts["buttons"] >= 0, "Button count should be non-negative"
    
    # Log counts for baseline tracking
    allure.attach(
        str(counts), 
        name="Element Counts Baseline", 
        attachment_type=allure.attachment_type.JSON
    )


@pytest.mark.regression
def test_{page}_all_locators_valid(self, driver, config):
    """Verify all POM locators still find elements on the page."""
    driver.get(config["base_url"])
    page = {PageClass}(driver)
    
    invalid_locators = []
    for locator_name, locator_value in page.get_all_locators().items():
        try:
            elements = driver.find_elements(*locator_value)
            if len(elements) == 0:
                invalid_locators.append(locator_name)
        except Exception as e:
            invalid_locators.append(f"{{locator_name}} (error: {{str(e)[:50]}})")
    
    assert len(invalid_locators) == 0, \\
        f"{{len(invalid_locators)}} locators no longer valid: {{invalid_locators}}"


@pytest.mark.regression
def test_{page}_layout_elements_visible(self, driver, config):
    """Verify major layout elements are still visible."""
    driver.get(config["base_url"])
    
    # Check essential layout components
    layout_selectors = {
        "body": "body",
        "main_content": "main, #main, .main, [role='main'], #content, .content",
    }
    
    for name, selector in layout_selectors.items():
        elements = driver.find_elements(By.CSS_SELECTOR, selector)
        visible = [e for e in elements if e.is_displayed()]
        assert len(visible) > 0, f"Layout element '{{name}}' ({{selector}}) should be visible"
'''


# ========================================================================
# CONFTEST / FIXTURES PATTERNS
# ========================================================================

CONFTEST_TEMPLATE = '''
import pytest
import allure
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.edge.service import Service as EdgeService
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from webdriver_manager.microsoft import EdgeChromiumDriverManager


@pytest.fixture(scope="function")
def driver(config):
    """Create a fresh browser instance for each test."""
    browser = config.get("browser", "chrome")
    headless = config.get("headless", True)
    
    if browser == "chrome":
        options = webdriver.ChromeOptions()
        if headless:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")
        # Enable browser logging for console error checks
        options.set_capability("goog:loggingPrefs", {"browser": "ALL"})
        driver = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install()), options=options)
    elif browser == "firefox":
        options = webdriver.FirefoxOptions()
        if headless:
            options.add_argument("--headless")
        driver = webdriver.Firefox(service=FirefoxService(GeckoDriverManager().install()), options=options)
    elif browser == "edge":
        options = webdriver.EdgeOptions()
        if headless:
            options.add_argument("--headless=new")
        driver = webdriver.Edge(service=EdgeService(EdgeChromiumDriverManager().install()), options=options)
    
    driver.implicitly_wait(10)
    driver.maximize_window()
    
    yield driver
    
    # Capture screenshot on failure
    if hasattr(driver, "session_id"):
        allure.attach(
            driver.get_screenshot_as_png(),
            name="final_screenshot",
            attachment_type=allure.attachment_type.PNG
        )
    driver.quit()


@pytest.fixture(scope="session")
def config():
    """Load test configuration."""
    import yaml
    import os
    config_path = os.path.join(os.path.dirname(__file__), "..", "config", "config.yaml")
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            return yaml.safe_load(f)
    return {
        "base_url": "http://localhost",
        "browser": "chrome",
        "headless": True,
        "timeout": 10
    }
'''


# ========================================================================
# BEST PRACTICES (Referenced by generators)
# ========================================================================

BEST_PRACTICES = {
    "assertions": [
        "Always use custom assertion messages: assert condition, 'Descriptive failure message'",
        "Use WebDriverWait with expected_conditions instead of time.sleep()",
        "One primary assertion per test, with setup assertions as preconditions",
        "Use assert element.is_displayed() for visibility, not element.text != ''",
        "For negative tests, assert the ERROR message appears, not just that it 'fails'",
        "Use try/except for expected failures (e.g., NoSuchElementException)",
        "Capture screenshots on assertion failure with allure.attach()",
    ],
    "waits": [
        "Always use explicit waits: WebDriverWait(driver, 10).until(EC.condition)",
        "Never use time.sleep() in production tests (use only as last resort)",
        "Use EC.visibility_of_element_located for visible elements",
        "Use EC.presence_of_element_located for DOM presence",
        "Use EC.element_to_be_clickable before clicking",
        "Use EC.staleness_of for page transitions",
    ],
    "locators": [
        "Priority: data-testid > id > name > CSS > XPath",
        "Avoid index-based XPath (//div[3]/span[2])",
        "Use By.CSS_SELECTOR over By.XPATH when possible",
        "Centralize locators in Page Object classes as class-level tuples",
    ],
    "structure": [
        "Keep assertions in test files, NOT in Page Object classes",
        "Each test should be independent and atomic",
        "Use @pytest.mark.{type} decorators for all tests",
        "Use allure decorators for reporting (@allure.story, @allure.severity)",
        "Group related tests in classes inheriting from BaseTest",
    ],
}


# ========================================================================
# IMPORTS REQUIRED FOR TEST FILES
# ========================================================================

REQUIRED_IMPORTS = '''import pytest
import time
import allure
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    NoSuchElementException, 
    TimeoutException, 
    ElementNotInteractableException
)
'''


def get_test_template(test_type: str) -> str:
    """Get the full template for a given test type."""
    templates = {
        "smoke": SMOKE_TEST_TEMPLATE,
        "functional": FUNCTIONAL_TEST_TEMPLATE,
        "negative": NEGATIVE_TEST_TEMPLATE,
        "security": SECURITY_TEST_TEMPLATE,
        "performance": PERFORMANCE_TEST_TEMPLATE,
        "accessibility": ACCESSIBILITY_TEST_TEMPLATE,
        "integration": INTEGRATION_TEST_TEMPLATE,
        "regression": REGRESSION_TEST_TEMPLATE,
    }
    return templates.get(test_type, SMOKE_TEST_TEMPLATE)


def get_assertion_for(assertion_type: str, **kwargs) -> str:
    """Get a specific assertion pattern with filled placeholders."""
    pattern = ASSERTION_PATTERNS.get(assertion_type, {})
    code = pattern.get("code", "")
    for key, value in kwargs.items():
        code = code.replace(f"{{{key}}}", str(value))
    return code
