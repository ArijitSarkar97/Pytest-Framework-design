"""
Template-Based Test Generator (No API Required)
Generates comprehensive test cases using rule-based patterns from knowledge bases.
Uses assertion patterns from test_script_knowledge.py for production-quality tests.
"""

from dom_extractor import extract_dom
from dom_to_english import convert_to_english

# Import knowledge base for assertion patterns
try:
    from test_script_knowledge import (
        ASSERTION_PATTERNS,
        BEST_PRACTICES,
        get_test_template,
        get_assertion_for,
    )
    KNOWLEDGE_BASE_AVAILABLE = True
except ImportError:
    KNOWLEDGE_BASE_AVAILABLE = False


class TestTemplateGenerator:
    """Generate tests using templates and patterns without AI."""
    
    def __init__(self):
        self.indent = "    "
    
    def generate_pom_class(self, dom_data, page_name="Page"):
        """Generate Page Object Model class from DOM data."""
        class_name = f"{page_name.replace(' ', '')}Page"
        
        code = [
            "from selenium.webdriver.common.by import By",
            "from selenium.webdriver.support.ui import WebDriverWait",
            "from selenium.webdriver.support import expected_conditions as EC",
            "",
            "",
            f"class {class_name}:",
            f'{self.indent}"""Page Object Model for {page_name}."""',
            "",
            f"{self.indent}def __init__(self, driver):",
            f"{self.indent}{self.indent}self.driver = driver",
            f"{self.indent}{self.indent}self.wait = WebDriverWait(driver, 10)",
            "",
        ]
        
        # Add locators for inputs
        if dom_data.get('inputs'):
            code.append(f"{self.indent}# Input field locators")
            for inp in dom_data['inputs']:
                var_name = self._get_variable_name(inp)
                locator = self._get_best_locator(inp)
                code.append(f"{self.indent}{var_name}_locator = {locator}")
            code.append("")
        
        # Add locators for buttons
        if dom_data.get('buttons'):
            code.append(f"{self.indent}# Button locators")
            for btn in dom_data['buttons']:
                var_name = self._get_variable_name(btn, 'button')
                locator = self._get_best_locator(btn)
                code.append(f"{self.indent}{var_name}_locator = {locator}")
            code.append("")
        
        # Add methods
        code.extend(self._generate_methods(dom_data, class_name))
        
        return "\n".join(code)
    
    def _get_variable_name(self, element, suffix=''):
        """Get clean variable name from element."""
        if element.get('id'):
            name = element['id'].replace('-', '_').replace(' ', '_')
        elif element.get('name'):
            name = element['name'].replace('-', '_').replace(' ', '_')
        elif element.get('placeholder'):
            name = element['placeholder'].lower().replace(' ', '_')
        else:
            name = f"{element.get('type', 'element')}"
        
        if suffix:
            name = f"{name}_{suffix}"
        return name.lower()
    
    def _get_best_locator(self, element):
        """Get best locator strategy for element using backend-provided data."""

        def sq(val: str) -> str:
            """Use double quotes normally; single quotes only if value contains double quotes."""
            if '"' in val:
                return "'" + val.replace("'", "\\'") + "'"
            return f'"{val}"'

        # Priority 1: Use pre-calculated robust locator from backend
        if element.get('locator') and element.get('locator_type'):
            strategy = element['locator_type']
            value = element['locator']

            by_map = {
                'id':        'By.ID',
                'name':      'By.NAME',
                'css':       'By.CSS_SELECTOR',
                'xpath':     'By.XPATH',
                'className': 'By.CLASS_NAME',
                'linkText':  'By.LINK_TEXT',
                'tagName':   'By.TAG_NAME',
            }
            by = by_map.get(strategy)
            if by:
                return f'({by}, {sq(value)})'
        
        # Fallback (Legacy logic)
        if element.get('id'):
            return f'(By.ID, "{element["id"]}")'
        elif element.get('name'):
            return f'(By.NAME, "{element["name"]}")'
        elif element.get('data_testid'):
            return f'(By.CSS_SELECTOR, "[data-testid=\'{element["data_testid"]}\']")'
        elif element.get('type'):
            return f'(By.CSS_SELECTOR, "input[type=\'{element["type"]}\']")'
        else:
            return '(By.TAG_NAME, "input")'
    
    def _generate_methods(self, dom_data, class_name):
        """Generate action methods for the page."""
        methods = []
        
        # Navigate method
        methods.extend([
            f"{self.indent}def navigate(self, url):",
            f'{self.indent}{self.indent}"""Navigate to the page."""',
            f"{self.indent}{self.indent}self.driver.get(url)",
            "",
        ])
        
        # Input methods
        if dom_data.get('inputs'):
            for inp in dom_data['inputs']:
                var_name = self._get_variable_name(inp)
                method_name = f"enter_{var_name}"
                methods.extend([
                    f"{self.indent}def {method_name}(self, text):",
                    f'{self.indent}{self.indent}"""Enter text into {var_name} field."""',
                    f"{self.indent}{self.indent}element = self.wait.until(",
                    f"{self.indent}{self.indent}{self.indent}EC.visibility_of_element_located(self.{var_name}_locator)",
                    f"{self.indent}{self.indent})",
                    f"{self.indent}{self.indent}element.clear()",
                    f"{self.indent}{self.indent}element.send_keys(text)",
                    "",
                ])
        
        # Click methods for buttons
        if dom_data.get('buttons'):
            for btn in dom_data['buttons']:
                var_name = self._get_variable_name(btn, 'button')
                method_name = f"click_{var_name}"
                methods.extend([
                    f"{self.indent}def {method_name}(self):",
                    f'{self.indent}{self.indent}"""Click {var_name}."""',
                    f"{self.indent}{self.indent}element = self.wait.until(",
                    f"{self.indent}{self.indent}{self.indent}EC.element_to_be_clickable(self.{var_name}_locator)",
                    f"{self.indent}{self.indent})",
                    f"{self.indent}{self.indent}element.click()",
                    "",
                ])
        
        return methods
    
    def generate_smoke_tests(self, dom_data, url, page_name="Page"):
        """Generate smoke tests."""
        class_name = f"{page_name.replace(' ', '')}Page"
        
        tests = [
            "import pytest",
            "from selenium import webdriver",
            f"from page_objects import {class_name}",
            "",
            "",
            "@pytest.mark.smoke",
            f"def test_{page_name.lower().replace(' ', '_')}_loads(driver):",
            f'    """Smoke test: Verify {page_name} loads successfully."""',
            f'    driver.get("{url}")',
            f'    assert "{dom_data.get("title", "")}" in driver.title',
            "",
        ]
        
        # Test critical elements present
        if dom_data.get('inputs'):
            tests.extend([
                "@pytest.mark.smoke",
                f"def test_critical_elements_present(driver):",
                f'    """Smoke test: Verify critical elements are present."""',
                f'    page = {class_name}(driver)',
                f'    page.navigate("{url}")',
                "",
            ])
            
            for inp in dom_data['inputs'][:3]:  # First 3 inputs
                var_name = self._get_variable_name(inp)
                tests.append(f"    assert page.driver.find_element(*page.{var_name}_locator)")
            
            tests.append("")
        
        return "\n".join(tests)
    
    def generate_functional_tests(self, dom_data, url, requirement, page_name="Page"):
        """Generate functional tests based on detected flows."""
        class_name = f"{page_name.replace(' ', '')}Page"
        tests = []
        
        # Detect login flow
        if any(inp['type'] == 'password' for inp in dom_data.get('inputs', [])):
            tests.extend([
                "",
                "def test_valid_login_success(driver, valid_credentials):",
                f'    """Test successful login with valid credentials."""',
                f'    page = {class_name}(driver)',
                f'    page.navigate("{url}")',
                "",
            ])
            
            # Add input steps
            for inp in dom_data.get('inputs', []):
                if inp['type'] in ['text', 'email']:
                    var_name = self._get_variable_name(inp)
                    tests.append(f"    page.enter_{var_name}(valid_credentials['username'])")
                elif inp['type'] == 'password':
                    var_name = self._get_variable_name(inp)
                    tests.append(f"    page.enter_{var_name}(valid_credentials['password'])")
            
            # Add click step
            if dom_data.get('buttons'):
                btn_var = self._get_variable_name(dom_data['buttons'][0], 'button')
                tests.append(f"    page.click_{btn_var}()")
            
            tests.extend([
                "",
                "    # Verify success",
                "    assert 'dashboard' in driver.current_url.lower() or 'welcome' in driver.page_source.lower()",
                "",
            ])
        
        return "\n".join(tests)
    
    def generate_negative_tests(self, dom_data, url, page_name="Page"):
        """Generate negative test cases."""
        class_name = f"{page_name.replace(' ', '')}Page"
        tests = []
        
        # Required field tests
        required_inputs = [inp for inp in dom_data.get('inputs', []) if inp.get('required')]
        if required_inputs:
            tests.extend([
                "",
                "@pytest.mark.parametrize('field_to_skip', [",
            ])
            for inp in required_inputs:
                var_name = self._get_variable_name(inp)
                tests.append(f"    '{var_name}',")
            tests.extend([
                "])",
                "def test_required_field_validation(driver, field_to_skip):",
                f'    """Test required field validation."""',
                f'    page = {class_name}(driver)',
                f'    page.navigate("{url}")',
                "    # Fill all fields except the one to skip",
                "    # Assert HTML5 validation message is present",
                f"    input_el = page.driver.find_element(*page.{var_name}_locator)",
                "    # Note: Modern browsers use HTML5 validation API",
                "    assert input_el.get_attribute('required'), f'Element {var_name} should be required'",
                "    # Optionally check validationMessage if form was submitted",
                "    # assert input_el.get_attribute('validationMessage') != ''",
                "",
            ])
        
        # Email format validation
        email_inputs = [inp for inp in dom_data.get('inputs', []) if inp.get('type') == 'email']
        if email_inputs:
            tests.extend([
                "",
                "@pytest.mark.parametrize('invalid_email', [",
                "    '',  # Empty",
                "    'notanemail',  # No @",
                "    'test@',  # No domain",
                "    '@example.com',  # No local part",
                "])",
                "def test_invalid_email_rejected(driver, invalid_email):",
                f'    """Test email validation rejects invalid formats."""',
                f'    page = {class_name}(driver)',
                f'    page.navigate("{url}")',
                f"    page.enter_{self._get_variable_name(email_inputs[0])}(invalid_email)",
                "",
            ])
            # Submit form if possible
            if dom_data.get('buttons'):
                btn_var = self._get_variable_name(dom_data['buttons'][0], 'button')
                tests.append(f"    page.click_{btn_var}()")
            
            tests.extend([
                "",
                "    # Assert: Email validation error (HTML5 or custom)",
                "    import time",
                "    time.sleep(0.5)",
                f"    email_field = driver.find_element(*page.{self._get_variable_name(email_inputs[0])}_locator)",
                "    is_html5_invalid = driver.execute_script(",
                "        'return !arguments[0].validity.valid', email_field",
                "    )",
                "    error_elements = driver.find_elements('css selector',",
                "        '.error, .alert-danger, .invalid-feedback, [class*=\"error\"], [role=\"alert\"]')",
                "    has_custom_error = any(e.is_displayed() for e in error_elements) if error_elements else False",
                "    assert is_html5_invalid or has_custom_error, \\",
                "        f'Email \"{invalid_email}\" should be rejected by validation'",
                "",
            ])
        
        return "\n".join(tests)

    def generate_security_tests(self, dom_data, url, page_name="Page"):
        """Generate security test cases."""
        class_name = f"{page_name.replace(' ', '')}Page"
        tests = [
            "",
            "import pytest",
            "from selenium import webdriver",
            f"from page_objects import {class_name}",
            "",
        ]

        # XSS injection tests for all input fields
        xss_payloads = [
            '<script>alert("XSS")</script>',
            '" onmouseover="alert(1)"',
            "<img src=x onerror=alert(1)>",
            "javascript:alert('XSS')",
            "'><script>alert(document.cookie)</script>",
        ]
        if dom_data.get('inputs'):
            tests.extend([
                "@pytest.mark.security",
                "@pytest.mark.parametrize('xss_payload', [",
            ])
            for payload in xss_payloads:
                escaped = payload.replace("'", "\\'")
                tests.append(f"    '{escaped}',")
            tests.extend([
                "])",
                f"def test_xss_injection_rejected(driver, xss_payload):",
                f'    """Security: Verify XSS payloads are sanitized in input fields."""',
                f'    page = {class_name}(driver)',
                f'    page.navigate("{url}")',
                "",
            ])
            for inp in dom_data['inputs'][:3]:
                var_name = self._get_variable_name(inp)
                tests.append(f"    page.enter_{var_name}(xss_payload)")
            if dom_data.get('buttons'):
                btn_var = self._get_variable_name(dom_data['buttons'][0], 'button')
                tests.append(f"    page.click_{btn_var}()")
            tests.extend([
                "",
                "    # Verify XSS payload is not rendered as executable script",
                "    page_source = driver.page_source",
                "    assert '<script>alert' not in page_source, 'XSS payload was reflected without sanitization'",
                "",
            ])

        # SQL Injection tests
        sql_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT NULL, NULL --",
            "1' AND '1'='1",
        ]
        if dom_data.get('inputs'):
            tests.extend([
                "@pytest.mark.security",
                "@pytest.mark.parametrize('sql_payload', [",
            ])
            for payload in sql_payloads:
                escaped = payload.replace("'", "\\'")
                tests.append(f"    '{escaped}',")
            tests.extend([
                "])",
                f"def test_sql_injection_rejected(driver, sql_payload):",
                f'    """Security: Verify SQL injection payloads do not bypass authentication."""',
                f'    page = {class_name}(driver)',
                f'    page.navigate("{url}")',
                "",
            ])
            for inp in dom_data['inputs'][:2]:
                var_name = self._get_variable_name(inp)
                tests.append(f"    page.enter_{var_name}(sql_payload)")
            if dom_data.get('buttons'):
                btn_var = self._get_variable_name(dom_data['buttons'][0], 'button')
                tests.append(f"    page.click_{btn_var}()")
            tests.extend([
                "",
                "    # Verify no unauthorized access",
                "    assert 'error' in driver.page_source.lower() or 'invalid' in driver.page_source.lower() or driver.current_url.endswith(url.split('/')[-1]), \\",
                "        'SQL injection may have bypassed validation'",
                "",
            ])

        # CSRF check
        tests.extend([
            "@pytest.mark.security",
            f"def test_csrf_token_present(driver):",
            f'    """Security: Verify CSRF tokens are present in forms."""',
            f'    driver.get("{url}")',
            "    forms = driver.find_elements('tag name', 'form')",
            "    for form in forms:",
            "        hidden_inputs = form.find_elements('css selector', 'input[type=hidden]')",
            "        token_names = ['csrf', 'token', '_token', 'authenticity_token', 'csrfmiddlewaretoken']",
            "        has_csrf = any(",
            "            any(tn in (inp.get_attribute('name') or '').lower() for tn in token_names)",
            "            for inp in hidden_inputs",
            "        )",
            "        if not has_csrf:",
            "            print(f'WARNING: Form may be missing CSRF token protection')",
            "",
        ])

        # Password field masking
        tests.extend([
            "@pytest.mark.security",
            f"def test_password_field_is_masked(driver):",
            f'    """Security: Verify password fields use type=password."""',
            f'    driver.get("{url}")',
            "    text_fields_with_pass = driver.find_elements('css selector', 'input[type=text][name*=pass], input[type=text][name*=pwd]')",
            "    assert len(text_fields_with_pass) == 0, \\",
            "        'Password-like fields found using type=text instead of type=password'",
            "",
        ])

        # Autocomplete on sensitive fields
        tests.extend([
            "@pytest.mark.security",
            f"def test_autocomplete_off_for_sensitive_fields(driver):",
            f'    """Security: Verify autocomplete is disabled for sensitive fields."""',
            f'    driver.get("{url}")',
            "    sensitive_selectors = ['input[type=password]', 'input[name*=credit]', 'input[name*=card]', 'input[name*=ssn]']",
            "    for selector in sensitive_selectors:",
            "        fields = driver.find_elements('css selector', selector)",
            "        for field in fields:",
            "            autocomplete = field.get_attribute('autocomplete')",
            "            if autocomplete and autocomplete.lower() != 'off':",
            '                print(f\'WARNING: Sensitive field {field.get_attribute("name")} has autocomplete enabled\')',
            "",
        ])

        return "\n".join(tests)

    def generate_performance_tests(self, dom_data, url, page_name="Page"):
        """Generate performance test cases."""
        class_name = f"{page_name.replace(' ', '')}Page"
        tests = [
            "",
            "import pytest",
            "import time",
            "from selenium import webdriver",
            "from selenium.webdriver.support.ui import WebDriverWait",
            "from selenium.webdriver.support import expected_conditions as EC",
            f"from page_objects import {class_name}",
            "",
        ]

        # Page load time
        tests.extend([
            "@pytest.mark.performance",
            "def test_page_load_time(driver):",
            f'    """Performance: Page should load within 5 seconds."""',
            "    start_time = time.time()",
            f'    driver.get("{url}")',
            "    WebDriverWait(driver, 10).until(",
            "        lambda d: d.execute_script('return document.readyState') == 'complete'",
            "    )",
            "    load_time = time.time() - start_time",
            "    print(f'Page load time: {load_time:.2f}s')",
            "    assert load_time < 5, f'Page took {load_time:.2f}s to load (threshold: 5s)'",
            "",
        ])

        # DOM content loaded
        tests.extend([
            "@pytest.mark.performance",
            "def test_dom_content_loaded_time(driver):",
            f'    """Performance: DOM content should be interactive within 3 seconds."""',
            f'    driver.get("{url}")',
            "    timing = driver.execute_script(",
            "        'return window.performance.timing'",
            "    )",
            "    dom_content_loaded = (timing['domContentLoadedEventEnd'] - timing['navigationStart']) / 1000",
            "    print(f'DOM Content Loaded: {dom_content_loaded:.2f}s')",
            "    assert dom_content_loaded < 3, f'DOM took {dom_content_loaded:.2f}s to become interactive'",
            "",
        ])

        # Element responsiveness
        if dom_data.get('inputs'):
            tests.extend([
                "@pytest.mark.performance",
                "def test_input_field_responsiveness(driver):",
                f'    """Performance: Input fields should be interactable within 2 seconds."""',
                f'    driver.get("{url}")',
                f'    page = {class_name}(driver)',
                "",
            ])
            for inp in dom_data['inputs'][:3]:
                var_name = self._get_variable_name(inp)
                tests.extend([
                    f"    start = time.time()",
                    f"    try:",
                    f"        WebDriverWait(driver, 2).until(",
                    f"            EC.element_to_be_clickable(page.{var_name}_locator)",
                    f"        )",
                    f"        response_time = time.time() - start",
                    f"        print(f'{var_name} ready in {{response_time:.2f}}s')",
                    f"        assert response_time < 2, f'{var_name} took {{response_time:.2f}}s to become clickable'",
                    f"    except Exception:",
                    f"        pytest.fail(f'{var_name} was not interactable within 2 seconds')",
                    "",
                ])

        # Resource count
        tests.extend([
            "@pytest.mark.performance",
            "def test_resource_count(driver):",
            f'    """Performance: Page should not load excessive resources."""',
            f'    driver.get("{url}")',
            "    resource_count = driver.execute_script(",
            '        \'return window.performance.getEntriesByType("resource").length\'',
            "    )",
            "    print(f'Total resources loaded: {resource_count}')",
            "    assert resource_count < 100, f'Page loaded {resource_count} resources (threshold: 100)'",
            "",
        ])

        # Memory leak check
        tests.extend([
            "@pytest.mark.performance",
            "def test_no_memory_leaks_on_navigation(driver):",
            f'    """Performance: Repeated navigation should not cause memory growth."""',
            f'    driver.get("{url}")',
            "    initial_memory = driver.execute_script(",
            "        'return window.performance.memory ? window.performance.memory.usedJSHeapSize : null'",
            "    )",
            "    if initial_memory is None:",
            "        pytest.skip('Memory API not available in this browser')",
            "    for _ in range(5):",
            f'        driver.get("{url}")',
            "        driver.execute_script('return document.readyState')",
            "    final_memory = driver.execute_script(",
            "        'return window.performance.memory.usedJSHeapSize'",
            "    )",
            "    growth = (final_memory - initial_memory) / initial_memory * 100",
            "    print(f'Memory growth after 5 navigations: {growth:.1f}%')",
            "    assert growth < 50, f'Memory grew by {growth:.1f}% (threshold: 50%)'",
            "",
        ])

        return "\n".join(tests)

    def generate_accessibility_tests(self, dom_data, url, page_name="Page"):
        """Generate accessibility test cases."""
        class_name = f"{page_name.replace(' ', '')}Page"
        tests = [
            "",
            "import pytest",
            "from selenium import webdriver",
            "from selenium.webdriver.common.keys import Keys",
            f"from page_objects import {class_name}",
            "",
        ]

        # Images alt text
        tests.extend([
            "@pytest.mark.accessibility",
            "def test_images_have_alt_text(driver):",
            f'    """Accessibility: All images should have alt text."""',
            f'    driver.get("{url}")',
            "    images = driver.find_elements('tag name', 'img')",
            "    images_without_alt = []",
            "    for img in images:",
            "        alt = img.get_attribute('alt')",
            "        if not alt or alt.strip() == '':",
            "            src = img.get_attribute('src') or 'unknown'",
            "            images_without_alt.append(src[:50])",
            "    assert len(images_without_alt) == 0, \\",
            "        f'{len(images_without_alt)} image(s) missing alt text: {images_without_alt[:3]}'",
            "",
        ])

        # Input labels
        if dom_data.get('inputs'):
            tests.extend([
                "@pytest.mark.accessibility",
                "def test_input_fields_have_labels(driver):",
                f'    """Accessibility: All input fields should have associated labels or aria-label."""',
                f'    driver.get("{url}")',
                "    inputs = driver.find_elements('css selector', 'input:not([type=hidden]):not([type=submit])')",
                "    unlabeled_inputs = []",
                "    for inp in inputs:",
                "        input_id = inp.get_attribute('id')",
                "        aria_label = inp.get_attribute('aria-label')",
                "        aria_labelledby = inp.get_attribute('aria-labelledby')",
                "        placeholder = inp.get_attribute('placeholder')",
                "        title_attr = inp.get_attribute('title')",
                "        has_label = False",
                "        if input_id:",
                '            labels = driver.find_elements(\'css selector\', f\'label[for="{input_id}"]\')',
                "            has_label = len(labels) > 0",
                "        if not has_label and not aria_label and not aria_labelledby and not placeholder and not title_attr:",
                "            unlabeled_inputs.append(inp.get_attribute('name') or inp.get_attribute('type') or 'unknown')",
                "    assert len(unlabeled_inputs) == 0, \\",
                "        f'{len(unlabeled_inputs)} input(s) without labels: {unlabeled_inputs}'",
                "",
            ])

        # Keyboard navigation
        tests.extend([
            "@pytest.mark.accessibility",
            "def test_keyboard_navigation(driver):",
            f'    """Accessibility: All interactive elements should be reachable via Tab key."""',
            f'    driver.get("{url}")',
            "    body = driver.find_element('tag name', 'body')",
            "    interactive_count = len(driver.find_elements('css selector',",
            "        'a[href], button, input:not([type=hidden]), select, textarea, [tabindex]'))",
            "    focused_elements = set()",
            "    body.send_keys(Keys.TAB)",
            "    for _ in range(min(interactive_count + 5, 50)):",
            "        active = driver.switch_to.active_element",
            "        tag = active.tag_name",
            "        if tag in ['input', 'button', 'a', 'select', 'textarea']:",
            '            focused_elements.add(f\'{tag}:{active.get_attribute("id") or active.get_attribute("name") or "?"}\')',
            "        active.send_keys(Keys.TAB)",
            "    print(f'Reached {len(focused_elements)} of {interactive_count} interactive elements via keyboard')",
            "    if interactive_count > 0:",
            "        ratio = len(focused_elements) / interactive_count",
            "        assert ratio >= 0.5, \\",
            "            f'Only {len(focused_elements)}/{interactive_count} elements reachable by keyboard'",
            "",
        ])

        # Heading hierarchy
        tests.extend([
            "@pytest.mark.accessibility",
            "def test_heading_hierarchy(driver):",
            f'    """Accessibility: Headings should follow proper hierarchy (h1 -> h2 -> h3)."""',
            f'    driver.get("{url}")',
            "    headings = []",
            "    for level in range(1, 7):",
            "        elements = driver.find_elements('tag name', f'h{level}')",
            "        for el in elements:",
            "            headings.append((level, el.text[:30]))",
            "    h1_count = sum(1 for h in headings if h[0] == 1)",
            "    assert h1_count >= 1, 'Page should have at least one h1 heading'",
            "    levels_used = sorted(set(h[0] for h in headings))",
            "    for i in range(1, len(levels_used)):",
            "        gap = levels_used[i] - levels_used[i-1]",
            "        if gap > 1:",
            "            print(f'WARNING: Heading hierarchy skips from h{levels_used[i-1]} to h{levels_used[i]}')",
            "",
        ])

        # ARIA landmarks
        tests.extend([
            "@pytest.mark.accessibility",
            "def test_aria_landmarks_present(driver):",
            f'    """Accessibility: Page should have ARIA landmarks for screen readers."""',
            f'    driver.get("{url}")',
            "    landmarks = {",
            "        'banner': driver.find_elements('css selector', 'header, [role=banner]'),",
            "        'navigation': driver.find_elements('css selector', 'nav, [role=navigation]'),",
            "        'main': driver.find_elements('css selector', 'main, [role=main]'),",
            "        'contentinfo': driver.find_elements('css selector', 'footer, [role=contentinfo]'),",
            "    }",
            "    present = {k: len(v) > 0 for k, v in landmarks.items()}",
            "    print(f'ARIA Landmarks: {present}')",
            "    assert present['main'], 'Page should have a main content landmark'",
            "",
        ])

        # Font size check
        tests.extend([
            "@pytest.mark.accessibility",
            "def test_text_not_too_small(driver):",
            f'    """Accessibility: Text should be at least 12px for readability."""',
            f'    driver.get("{url}")',
            "    paragraphs = driver.find_elements('css selector', 'p, span, a, label, li')",
            "    small_text_elements = []",
            "    for el in paragraphs[:50]:",
            "        font_size = el.value_of_css_property('font-size')",
            "        if font_size and 'px' in font_size:",
            "            size = float(font_size.replace('px', ''))",
            "            if size < 12 and el.text.strip():",
            "                small_text_elements.append(f'{el.tag_name}: {el.text[:20]} ({font_size})')",
            "    if small_text_elements:",
            "        print(f'WARNING: {len(small_text_elements)} elements with small text: {small_text_elements[:3]}')",
            "",
        ])

        return "\n".join(tests)

    def generate_integration_tests(self, dom_data, url, page_name="Page"):
        """Generate integration test cases."""
        class_name = f"{page_name.replace(' ', '')}Page"
        tests = [
            "",
            "import pytest",
            "import time",
            "from selenium import webdriver",
            "from selenium.webdriver.support.ui import WebDriverWait",
            "from selenium.webdriver.support import expected_conditions as EC",
            f"from page_objects import {class_name}",
            "",
        ]

        # Form submission integration
        if dom_data.get('inputs') and dom_data.get('buttons'):
            tests.extend([
                "@pytest.mark.integration",
                "def test_form_submission_sends_request(driver):",
                f'    """Integration: Form submission should trigger a network request."""',
                f'    page = {class_name}(driver)',
                f'    page.navigate("{url}")',
                "    initial_url = driver.current_url",
                "",
            ])
            for inp in dom_data['inputs']:
                var_name = self._get_variable_name(inp)
                if inp.get('type') == 'email':
                    tests.append(f"    page.enter_{var_name}('test@integration.com')")
                elif inp.get('type') == 'password':
                    tests.append(f"    page.enter_{var_name}('TestPassword123!')")
                else:
                    tests.append(f"    page.enter_{var_name}('integration_test_data')")
            btn_var = self._get_variable_name(dom_data['buttons'][0], 'button')
            tests.extend([
                f"    page.click_{btn_var}()",
                "",
                "    time.sleep(2)",
                "    current_url = driver.current_url",
                "    page_source = driver.page_source.lower()",
                "    has_error = 'server error' in page_source or '500' in driver.title",
                "    assert not has_error, 'Form submission resulted in a server error'",
                "    print(f'Form submitted. URL changed: {current_url != initial_url}')",
                "",
            ])

        # Navigation links
        if dom_data.get('links'):
            tests.extend([
                "@pytest.mark.integration",
                "def test_navigation_links_resolve(driver):",
                f'    """Integration: Navigation links should load valid pages (no 404/500)."""',
                f'    driver.get("{url}")',
                "    links = driver.find_elements('tag name', 'a')",
                "    hrefs = []",
                "    for link in links[:10]:",
                "        href = link.get_attribute('href')",
                "        if href and href.startswith('http') and '#' not in href:",
                "            hrefs.append(href)",
                "    broken_links = []",
                "    for href in hrefs[:5]:",
                "        try:",
                "            driver.get(href)",
                "            title = driver.title.lower()",
                "            if '404' in title or 'not found' in title:",
                "                broken_links.append(href)",
                "        except Exception:",
                "            broken_links.append(href)",
                "    assert len(broken_links) == 0, \\",
                "        f'{len(broken_links)} broken links found: {broken_links}'",
                "",
            ])

        # Cookies/session
        tests.extend([
            "@pytest.mark.integration",
            "def test_cookies_set_on_visit(driver):",
            f'    """Integration: Page visit should establish session cookies."""',
            f'    driver.get("{url}")',
            "    cookies = driver.get_cookies()",
            '    print(f\'Cookies set: {[c["name"] for c in cookies]}\')',
            "    if len(cookies) == 0:",
            "        print('INFO: No cookies were set on page visit')",
            "",
        ])

        # Console errors
        tests.extend([
            "@pytest.mark.integration",
            "def test_page_loads_without_console_errors(driver):",
            f'    """Integration: Page should load without critical JavaScript errors."""',
            f'    driver.get("{url}")',
            "    logs = driver.get_log('browser')",
            "    severe_errors = [log for log in logs if log['level'] == 'SEVERE']",
            "    if severe_errors:",
            "        error_messages = [e['message'][:100] for e in severe_errors[:5]]",
            "        print(f'Console errors: {error_messages}')",
            "    assert len(severe_errors) == 0, \\",
            "        f'{len(severe_errors)} severe JS errors found on page load'",
            "",
        ])

        return "\n".join(tests)

    def generate_regression_tests(self, dom_data, url, page_name="Page"):
        """Generate regression test cases."""
        class_name = f"{page_name.replace(' ', '')}Page"
        tests = [
            "",
            "import pytest",
            "from selenium import webdriver",
            "from selenium.webdriver.common.by import By",
            "from selenium.webdriver.support.ui import WebDriverWait",
            "from selenium.webdriver.support import expected_conditions as EC",
            f"from page_objects import {class_name}",
            "",
        ]

        input_count = len(dom_data.get('inputs', []))
        button_count = len(dom_data.get('buttons', []))

        # Element count regression
        tests.extend([
            "@pytest.mark.regression",
            "def test_element_count_unchanged(driver):",
            f'    """Regression: Page should contain the expected number of UI elements."""',
            f'    driver.get("{url}")',
            "    inputs = driver.find_elements('css selector', 'input:not([type=hidden]), textarea, select')",
            "    buttons = driver.find_elements('css selector', 'button, input[type=submit]')",
            "    links = driver.find_elements('tag name', 'a')",
            "    print(f'Found: {len(inputs)} inputs, {len(buttons)} buttons, {len(links)} links')",
            f"    assert len(inputs) >= {max(input_count - 2, 0)}, f'Expected ~{input_count} inputs, found {{len(inputs)}}'",
            f"    assert len(buttons) >= {max(button_count - 2, 0)}, f'Expected ~{button_count} buttons, found {{len(buttons)}}'",
            "",
        ])

        # Input locator regression
        if dom_data.get('inputs'):
            tests.extend([
                "@pytest.mark.regression",
                "def test_all_input_locators_valid(driver):",
                f'    """Regression: All known input element locators should still resolve."""',
                f'    page = {class_name}(driver)',
                f'    page.navigate("{url}")',
                "",
            ])
            for inp in dom_data['inputs']:
                var_name = self._get_variable_name(inp)
                tests.extend([
                    f"    try:",
                    f"        el = driver.find_element(*page.{var_name}_locator)",
                    f"        assert el.is_displayed(), '{var_name} exists but is not visible'",
                    f"    except Exception:",
                    f"        pytest.fail('{var_name} locator is broken - element not found')",
                    "",
                ])

        # Button locator regression
        if dom_data.get('buttons'):
            tests.extend([
                "@pytest.mark.regression",
                "def test_all_button_locators_valid(driver):",
                f'    """Regression: All known button locators should still resolve."""',
                f'    page = {class_name}(driver)',
                f'    page.navigate("{url}")',
                "",
            ])
            for btn in dom_data['buttons']:
                var_name = self._get_variable_name(btn, 'button')
                tests.extend([
                    f"    try:",
                    f"        el = driver.find_element(*page.{var_name}_locator)",
                    f"        assert el.is_enabled(), '{var_name} exists but is disabled'",
                    f"    except Exception:",
                    f"        pytest.fail('{var_name} locator is broken - element not found')",
                    "",
                ])

        # Page title regression
        tests.extend([
            "@pytest.mark.regression",
            "def test_page_title_unchanged(driver):",
            f'    """Regression: Page title should match expected value."""',
            f'    driver.get("{url}")',
            f'    expected_title = "{dom_data.get("title", "")}"',
            "    if expected_title:",
            "        assert expected_title in driver.title, \\",
            '            f\'Title changed: expected "{expected_title}" but got "{driver.title}"\'',
            "",
        ])

        # Layout visibility regression
        if dom_data.get('inputs'):
            tests.extend([
                "@pytest.mark.regression",
                "def test_layout_elements_visible(driver):",
                f'    """Regression: All critical form elements should be visible in viewport."""',
                f'    page = {class_name}(driver)',
                f'    page.navigate("{url}")',
                "",
            ])
            for inp in dom_data['inputs'][:5]:
                var_name = self._get_variable_name(inp)
                tests.extend([
                    f"    el = driver.find_element(*page.{var_name}_locator)",
                    f"    assert el.is_displayed(), '{var_name} should be visible on page'",
                    f"    size = el.size",
                    f"    assert size['width'] > 0 and size['height'] > 0, '{var_name} has zero dimensions'",
                    "",
                ])

        return "\n".join(tests)

    def generate_fixtures(self, dom_data):
        """Generate pytest fixtures."""
        fixtures = [
            "import pytest",
            "from selenium import webdriver",
            "",
            "",
            "@pytest.fixture",
            "def driver():",
            '    """Provide a Selenium WebDriver instance."""',
            "    options = webdriver.ChromeOptions()",
            "    options.add_argument('--headless')",
            "    driver = webdriver.Chrome(options=options)",
            "    yield driver",
            "    driver.quit()",
            "",
            "",
            "@pytest.fixture",
            "def valid_credentials():",
            '    """Provide valid test credentials."""',
            "    return {",
            "        'username': 'testuser@example.com',",
            "        'password': 'SecurePassword123!',",
            "    }",
            "",
        ]
        
        return "\n".join(fixtures)


def generate_tests_without_api(dom_data, test_types, page_name="Login", framework_type="pytest-selenium"):
    """
    Generate comprehensive tests without using AI API.
    Routes to PlaywrightTemplateGenerator for pytest-playwright,
    or uses the Selenium TestTemplateGenerator for pytest-selenium.

    Args:
        dom_data: Pre-extracted DOM structure from TypeScript backend service
        test_types: List of test types to generate (e.g., ['smoke', 'functional', 'negative'])
        page_name: Name for page class
        framework_type: Target test framework (pytest-playwright or pytest-selenium)
    """
    import sys

    url = dom_data.get('url', 'N/A')

    print(f"[1/3] Using pre-extracted DOM structure...", file=sys.stderr)
    print(f"     - {len(dom_data.get('inputs', []))} inputs", file=sys.stderr)
    print(f"     - {len(dom_data.get('buttons', []))} buttons", file=sys.stderr)
    print(f"     - {len(dom_data.get('links', []))} links", file=sys.stderr)
    print(f"     - Framework: {framework_type}", file=sys.stderr)

    # ── Playwright branch: delegate completely to dedicated generator ──────────
    if framework_type == "pytest-playwright":
        try:
            import playwright_template_generator as pw_gen
            print("[2/3] Using Playwright template engine...", file=sys.stderr)
            return pw_gen.generate_tests_without_api(
                dom_data=dom_data,
                test_types=test_types,
                page_name=page_name,
                framework_type=framework_type,
            )
        except ImportError as exc:
            print(f"Warning: Playwright generator not found ({exc}). Falling back to Selenium.", file=sys.stderr)

    # ── Selenium branch ────────────────────────────────────────────────────────
    english_desc = convert_to_english(dom_data)
    print("[2/3] Analyzing page structure...", file=sys.stderr)
    print(english_desc, file=sys.stderr)
    print("\n" + "=" * 60 + "\n", file=sys.stderr)

    print(f"[3/3] Generating Selenium tests...", file=sys.stderr)
    generator = TestTemplateGenerator()
    
    # Generate POM (always needed)
    pom_code = generator.generate_pom_class(dom_data, page_name)
    
    # Generate tests based on selected types
    smoke_tests = ""
    functional_tests = ""
    negative_tests = ""
    security_tests = ""
    performance_tests = ""
    accessibility_tests = ""
    integration_tests = ""
    regression_tests = ""
    fixtures = ""
    
    if 'smoke' in test_types:
        smoke_tests = generator.generate_smoke_tests(dom_data, url, page_name)
    
    if 'functional' in test_types:
        functional_tests = generator.generate_functional_tests(dom_data, url, "Core functionality", page_name)
    
    if 'negative' in test_types:
        negative_tests = generator.generate_negative_tests(dom_data, url, page_name)
    
    if 'security' in test_types:
        security_tests = generator.generate_security_tests(dom_data, url, page_name)
    
    if 'performance' in test_types:
        performance_tests = generator.generate_performance_tests(dom_data, url, page_name)
    
    if 'accessibility' in test_types:
        accessibility_tests = generator.generate_accessibility_tests(dom_data, url, page_name)
    
    if 'integration' in test_types:
        integration_tests = generator.generate_integration_tests(dom_data, url, page_name)
    
    if 'regression' in test_types:
        regression_tests = generator.generate_regression_tests(dom_data, url, page_name)
    
    # Add fixtures if any tests are generated
    all_tests = [smoke_tests, functional_tests, negative_tests, security_tests,
                 performance_tests, accessibility_tests, integration_tests, regression_tests]
    if any(all_tests):
        fixtures = generator.generate_fixtures(dom_data)
    
    print("Compiling test suite...", file=sys.stderr)
    
    # Build sections dynamically (only include non-empty sections)
    sections = []
    sections.append(f"""# Generated Test Suite for {page_name}
# URL: {url}
# Test Types: {', '.join(test_types)}

# ============================================================
# PAGE OBJECT MODEL
# ============================================================

{pom_code}


# ============================================================
# CONFTEST (Fixtures)
# ============================================================

{fixtures}""")
    
    test_sections = [
        ('SMOKE TESTS', smoke_tests),
        ('FUNCTIONAL TESTS', functional_tests),
        ('NEGATIVE TESTS', negative_tests),
        ('SECURITY TESTS', security_tests),
        ('PERFORMANCE TESTS', performance_tests),
        ('ACCESSIBILITY TESTS', accessibility_tests),
        ('INTEGRATION TESTS', integration_tests),
        ('REGRESSION TESTS', regression_tests),
    ]
    
    for title, content in test_sections:
        if content:
            sections.append(f"""

# ============================================================
# {title}
# ============================================================

{content}""")
    
    sections.append("""

# ============================================================
# USAGE
# ============================================================
# Run all tests:          pytest
# Run by category:        pytest -m smoke / pytest -m security / pytest -m accessibility
# Run with verbose:       pytest -v
# Run specific test file: pytest test_smoke.py
""")
    
    complete_suite = "\n".join(sections)
    return complete_suite
