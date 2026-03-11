"""
Playwright Template Generator
Generates native Playwright Python test suites from pre-extracted DOM data.
Uses playwright.sync_api - pytest-playwright plugin fixtures (page, browser_context).
"""
import sys


class PlaywrightTemplateGenerator:
    """Generates Playwright Python tests using templates. No AI required."""

    ind = "    "  # 4-space indent

    # ─── Locator Helpers (Priority from playwright_locators_knowledge.md) ────────

    # ARIA role map — maps HTML element type/tag to ARIA role
    _ROLE_MAP = {
        "submit": "button", "button": "button", "reset": "button",
        "checkbox": "checkbox", "radio": "radio",
        "text": "textbox", "email": "textbox", "password": "textbox",
        "search": "searchbox", "tel": "textbox", "url": "textbox",
        "number": "spinbutton", "range": "slider",
        "select": "combobox", "textarea": "textbox",
        "link": "link", "a": "link",
        "img": "img", "image": "img",
    }

    def _var_name(self, element, suffix=""):
        """Derive a safe Python variable name from an element dict."""
        raw = (
            element.get("id")
            or element.get("name")
            or element.get("aria_label", "")
            or element.get("placeholder", "")
            or element.get("text", "")
            or element.get("type", "element")
        )
        name = str(raw).lower().replace("-", "_").replace(" ", "_").replace(".", "_")
        name = "".join(c for c in name if c.isalnum() or c == "_")
        if not name or name[0].isdigit():
            name = "el_" + name
        if suffix:
            name = f"{name}_{suffix}"
        return name

    def _pw_locator_call(self, element, is_button=False):
        """
        Return a Python expression string for the best Playwright locator.

        Priority (playwright_locators_knowledge.md):
          1. get_by_role(role, name=accessible_name)
          2. get_by_label(label_text)
          3. get_by_placeholder(placeholder_text)
          4. get_by_test_id(data-testid)
          5. CSS  #id
          6. CSS  [name="..."]
          7. CSS  input[type="..."]
          8. XPath (last resort)
        """
        tag = element.get("tag", element.get("type", "")).lower()
        aria_label = element.get("aria_label", "").strip()
        label = element.get("label", "").strip()
        placeholder = element.get("placeholder", "").strip()
        data_testid = element.get("data_testid", "").strip()
        btn_text = element.get("text", "").strip()
        elem_id = element.get("id", "").strip()
        elem_name = element.get("name", "").strip()
        elem_type = element.get("type", "").strip().lower()

        # 1. get_by_role
        if is_button:
            role = "button"
            name_param = aria_label or btn_text
            if name_param:
                safe = name_param.replace('"', '\\"')
                return f'page.get_by_role("button", name="{safe}")'
            return 'page.get_by_role("button")'

        role = self._ROLE_MAP.get(elem_type) or self._ROLE_MAP.get(tag)
        if role:
            # Prefer aria_label > label > placeholder as accessible name
            acc_name = aria_label or label
            if acc_name:
                safe = acc_name.replace('"', '\\"')
                return f'page.get_by_role("{role}", name="{safe}")'

        # 2. get_by_label
        if label:
            safe = label.replace('"', '\\"')
            return f'page.get_by_label("{safe}")'

        # 3. get_by_placeholder
        if placeholder:
            safe = placeholder.replace('"', '\\"')
            return f'page.get_by_placeholder("{safe}")'

        # 4. get_by_test_id
        if data_testid:
            safe = data_testid.replace('"', '\\"')
            return f'page.get_by_test_id("{safe}")'

        # 5. CSS #id
        if elem_id:
            safe = elem_id.replace('"', '\\"')
            return f'page.locator("#{safe}")'

        # 6. CSS [name=]
        if elem_name:
            safe = elem_name.replace('"', '\\"')
            return f'page.locator("[name=\\"{safe}\\"]")'

        # 7. CSS type
        if elem_type and elem_type not in ("hidden", "submit", "button", "reset"):
            return f'page.locator("input[type=\\"{elem_type}\\"]")'

        # 8. Fallback CSS
        return 'page.locator("input")'

    # ─── POM Class ────────────────────────────────────────────────────────────

    def generate_pom_class(self, dom_data, page_name="Page"):
        """Generate a Playwright Page Object Model class using get_by_* locators."""
        class_name = f"{page_name.replace(' ', '')}Page"
        i = self.ind
        ii = i * 2

        lines = [
            "from playwright.sync_api import Page, Locator, expect",
            "",
            "",
            f"class {class_name}:",
            f'{i}"""Page Object Model for {page_name} — Playwright (pytest-playwright)."""',
            "",
            f"{i}# ── Locator strategy: Priority 1→9 per playwright_locators_knowledge.md",
            f"{i}# ── 1.get_by_role → 2.get_by_label → 3.get_by_placeholder",
            f"{i}# ── → 4.get_by_test_id → 5.#id → 6.[name] → 7.type → 8.xpath",
            "",
            f"{i}def __init__(self, page: Page):",
            f"{ii}self.page = page",
            "",
        ]

        if dom_data.get("inputs"):
            lines.append(f"{ii}# ── Inputs ─────────────────────────────────────────")
            for inp in dom_data["inputs"]:
                vname = self._var_name(inp)
                loc_call = self._pw_locator_call(inp, is_button=False)
                lines.append(f"{ii}self.{vname} = {loc_call}")
            lines.append("")

        if dom_data.get("dropdowns"):
            lines.append(f"{ii}# ── Dropdowns ──────────────────────────────────────")
            for dd in dom_data["dropdowns"]:
                vname = self._var_name(dd)
                loc_call = self._pw_locator_call(dd, is_button=False)
                lines.append(f"{ii}self.{vname}_dropdown = {loc_call}")
            lines.append("")

        if dom_data.get("buttons"):
            lines.append(f"{ii}# ── Buttons ─────────────────────────────────────────")
            for btn in dom_data["buttons"]:
                vname = self._var_name(btn, "button")
                loc_call = self._pw_locator_call(btn, is_button=True)
                lines.append(f"{ii}self.{vname} = {loc_call}")
            lines.append("")

        # Methods
        lines.extend(self._generate_pom_methods(dom_data))
        return "\n".join(lines)

    def _generate_pom_methods(self, dom_data):
        i = self.ind
        ii = i * 2
        methods = [
            f"{i}# ── Page Actions ─────────────────────────────────",
            "",
            f"{i}def navigate(self, url: str):",
            f'{ii}"""Navigate to the given URL and wait for networkidle."""',
            f"{ii}self.page.goto(url)",
            f"{ii}self.page.wait_for_load_state('networkidle')",
            "",
        ]

        if dom_data.get("inputs"):
            for inp in dom_data["inputs"]:
                vname = self._var_name(inp)
                inp_type = inp.get("type", "text").lower()
                action = "check()" if inp_type in ("checkbox", "radio") else "fill(text)"
                param = "" if inp_type in ("checkbox", "radio") else "text: str"
                docstr = f"Toggle the {vname} checkbox." if inp_type in ("checkbox", "radio") else f"Fill the {vname} field."
                if inp_type in ("checkbox", "radio"):
                    methods += [
                        f"{i}def toggle_{vname}(self):",
                        f'{ii}"""{docstr}"""',
                        f"{ii}self.{vname}.check()",
                        "",
                    ]
                else:
                    methods += [
                        f"{i}def fill_{vname}(self, text: str):",
                        f'{ii}"""{docstr}"""',
                        f"{ii}self.{vname}.fill(text)",
                        "",
                        f"{i}def clear_{vname}(self):",
                        f'{ii}"""Clear the {vname} field."""',
                        f"{ii}self.{vname}.clear()",
                        "",
                    ]

        if dom_data.get("dropdowns"):
            for dd in dom_data["dropdowns"]:
                vname = self._var_name(dd)
                methods += [
                    f"{i}def select_{vname}(self, value: str):",
                    f'{ii}"""Select an option from the {vname} dropdown."""',
                    f"{ii}self.{vname}_dropdown.select_option(label=value)",
                    "",
                ]

        if dom_data.get("buttons"):
            for btn in dom_data["buttons"]:
                vname = self._var_name(btn, "button")
                methods += [
                    f"{i}def click_{vname}(self):",
                    f'{ii}"""Click the {vname}."""',
                    f"{ii}self.{vname}.click()",
                    "",
                ]

        # Generic helpers
        methods += [
            f"{i}def get_page_title(self) -> str:",
            f'{ii}"""Return the current page title."""',
            f"{ii}return self.page.title()",
            "",
            f"{i}def get_current_url(self) -> str:",
            f'{ii}"""Return the current browser URL."""',
            f"{ii}return self.page.url",
            "",
        ]

        return methods


    # ─── Conftest / Fixtures ─────────────────────────────────────────────────

    def generate_fixtures(self, dom_data):
        return """\
import pytest


@pytest.fixture
def valid_credentials():
    \"\"\"Provide valid test credentials.\"\"\"
    return {
        'username': 'testuser@example.com',
        'password': 'SecurePassword123!',
    }
"""

    # ─── Smoke Tests ──────────────────────────────────────────────────────────

    def generate_smoke_tests(self, dom_data, url, page_name="Page"):
        class_name = f"{page_name.replace(' ', '')}Page"
        title = dom_data.get("title", "")
        i = self.ind

        lines = [
            "import pytest",
            "from playwright.sync_api import Page, expect",
            f"from page_objects import {class_name}",
            "",
            "",
            "@pytest.mark.smoke",
            f"def test_{page_name.lower().replace(' ', '_')}_page_loads(page: Page):",
            f'{i}"""Smoke: Verify {page_name} loads successfully."""',
            f'{i}page.goto("{url}")',
            f'{i}page.wait_for_load_state("networkidle")',
        ]
        if title:
            lines += [
                f'{i}expect(page).to_have_title("{title}")',
            ]
        else:
            lines += [
                f"{i}assert page.title() is not None",
            ]
        lines.append("")

        if dom_data.get("inputs"):
            lines += [
                "@pytest.mark.smoke",
                "def test_critical_input_elements_visible(page: Page):",
                f'{i}"""Smoke: Verify critical input elements are visible."""',
                f'{i}pom = {class_name}(page)',
                f'{i}pom.navigate("{url}")',
                "",
            ]
            for inp in dom_data["inputs"][:3]:
                vname = self._var_name(inp)
                lines.append(f"{i}expect(page.locator(pom.{vname}_locator)).to_be_visible()")
            lines.append("")

        if dom_data.get("buttons"):
            lines += [
                "@pytest.mark.smoke",
                "def test_critical_button_elements_visible(page: Page):",
                f'{i}"""Smoke: Verify critical button elements are visible."""',
                f'{i}pom = {class_name}(page)',
                f'{i}pom.navigate("{url}")',
                "",
            ]
            for btn in dom_data["buttons"][:2]:
                vname = self._var_name(btn, "button")
                lines.append(f"{i}expect(page.locator(pom.{vname}_locator)).to_be_visible()")
            lines.append("")

        return "\n".join(lines)

    # ─── Functional Tests ─────────────────────────────────────────────────────

    def generate_functional_tests(self, dom_data, url, requirement, page_name="Page"):
        class_name = f"{page_name.replace(' ', '')}Page"
        i = self.ind
        lines = []

        has_password = any(inp.get("type") == "password" for inp in dom_data.get("inputs", []))
        if has_password:
            lines += [
                "",
                "@pytest.mark.functional",
                "def test_valid_login_flow(page: Page, valid_credentials):",
                f'{i}"""Functional: Successful login with valid credentials."""',
                f'{i}pom = {class_name}(page)',
                f'{i}pom.navigate("{url}")',
                "",
            ]
            for inp in dom_data.get("inputs", []):
                vname = self._var_name(inp)
                if inp.get("type") in ("text", "email"):
                    lines.append(f"{i}pom.enter_{vname}(valid_credentials['username'])")
                elif inp.get("type") == "password":
                    lines.append(f"{i}pom.enter_{vname}(valid_credentials['password'])")

            if dom_data.get("buttons"):
                btn_var = self._var_name(dom_data["buttons"][0], "button")
                lines.append(f"{i}pom.click_{btn_var}()")
            lines += [
                "",
                f'{i}# Verify we navigated away from the login page',
                f'{i}page.wait_for_load_state("networkidle")',
                f'{i}assert page.url != "{url}" or "dashboard" in page.url or "welcome" in page.url, \\',
                f'{i}    f"Expected redirect after login, but stayed at {{page.url}}"',
                "",
            ]

        # Test form field entry
        if dom_data.get("inputs"):
            lines += [
                "",
                "@pytest.mark.functional",
                "def test_input_fields_accept_text(page: Page):",
                f'{i}"""Functional: Verify all input fields accept text input."""',
                f'{i}pom = {class_name}(page)',
                f'{i}pom.navigate("{url}")',
                "",
            ]
            for inp in dom_data.get("inputs", []):
                vname = self._var_name(inp)
                inp_type = inp.get("type", "text")
                if inp_type == "email":
                    val = "test@example.com"
                elif inp_type == "password":
                    val = "TestPassword123!"
                elif inp_type == "number":
                    val = "42"
                elif inp_type == "tel":
                    val = "+1234567890"
                else:
                    val = "sample_text"
                lines += [
                    f'{i}pom.enter_{vname}("{val}")',
                    f"{i}expect(page.locator(pom.{vname}_locator)).to_have_value(\"{val}\")",
                ]
            lines.append("")

        return "\n".join(lines)

    # ─── Negative Tests ───────────────────────────────────────────────────────

    def generate_negative_tests(self, dom_data, url, page_name="Page"):
        class_name = f"{page_name.replace(' ', '')}Page"
        i = self.ind
        lines = []

        required_inputs = [inp for inp in dom_data.get("inputs", []) if inp.get("required")]
        if required_inputs:
            lines += [
                "",
                "@pytest.mark.negative",
                "def test_empty_required_fields_show_validation(page: Page):",
                f'{i}"""Negative: Submitting empty form should show validation errors."""',
                f'{i}pom = {class_name}(page)',
                f'{i}pom.navigate("{url}")',
                "",
            ]
            if dom_data.get("buttons"):
                btn_var = self._var_name(dom_data["buttons"][0], "button")
                lines += [
                    f"{i}# Click submit without filling required fields",
                    f"{i}pom.click_{btn_var}()",
                ]
            lines += [
                "",
                f"{i}# Check that page stays on the same url (form not submitted)",
                f'{i}assert page.url == "{url}" or "error" in page.content().lower() or "required" in page.content().lower(), \\',
                f'{i}    "Expected validation error for empty required fields"',
                "",
            ]

        email_inputs = [inp for inp in dom_data.get("inputs", []) if inp.get("type") == "email"]
        if email_inputs:
            invalid_emails = [
                ("empty_string", ""),
                ("no_at_sign", "notanemail"),
                ("no_domain", "test@"),
                ("no_local", "@example.com"),
            ]
            for label, bad_email in invalid_emails:
                evname = self._var_name(email_inputs[0])
                lines += [
                    "",
                    "@pytest.mark.negative",
                    f'@pytest.mark.parametrize("invalid_email", ["", "notanemail", "test@", "@example.com"])',
                    "def test_invalid_email_rejected(page: Page, invalid_email):",
                    f'{i}"""Negative: Invalid emails should not be accepted."""',
                    f'{i}pom = {class_name}(page)',
                    f'{i}pom.navigate("{url}")',
                    f"{i}pom.enter_{evname}(invalid_email)",
                ]
                if dom_data.get("buttons"):
                    btn_var = self._var_name(dom_data["buttons"][0], "button")
                    lines.append(f"{i}pom.click_{btn_var}()")
                lines += [
                    f"{i}content = page.content().lower()",
                    f'{i}has_error = ("invalid" in content or "error" in content or "required" in content or page.url == "{url}")',
                    f"{i}assert has_error, f\"Email '{{invalid_email}}' should be rejected\"",
                    "",
                ]
                break  # Use parametrize instead of loop

        return "\n".join(lines)

    # ─── Security Tests ───────────────────────────────────────────────────────

    def generate_security_tests(self, dom_data, url, page_name="Page"):
        class_name = f"{page_name.replace(' ', '')}Page"
        i = self.ind
        lines = [
            "",
            "import pytest",
            "from playwright.sync_api import Page, expect",
            f"from page_objects import {class_name}",
            "",
        ]

        if dom_data.get("inputs"):
            lines += [
                '@pytest.mark.security',
                '@pytest.mark.parametrize("xss_payload", [',
                '    \'<script>alert("XSS")</script>\',',
                '    \'"><img src=x onerror=alert(1)>\',',
                '    "javascript:alert(\'XSS\')",',
                '])',
                'def test_xss_payload_not_executed(page: Page, xss_payload):',
                f'{i}"""Security: XSS payloads in inputs should not execute."""',
                f'{i}pom = {class_name}(page)',
                f'{i}pom.navigate("{url}")',
                "",
            ]
            for inp in dom_data["inputs"][:2]:
                vname = self._var_name(inp)
                lines.append(f"{i}pom.enter_{vname}(xss_payload)")
            if dom_data.get("buttons"):
                btn_var = self._var_name(dom_data["buttons"][0], "button")
                lines.append(f"{i}pom.click_{btn_var}()")
            lines += [
                "",
                f'{i}page_source = page.content()',
                f"{i}assert '<script>alert' not in page_source.lower(), \\",
                f"{i}    'XSS payload was reflected into the page without sanitization'",
                "",
            ]

        if dom_data.get("inputs"):
            lines += [
                '@pytest.mark.security',
                '@pytest.mark.parametrize("sql_payload", [',
                "    \"' OR '1'='1\",",
                "    \"'; DROP TABLE users;--\",",
                "    \"' UNION SELECT NULL--\",",
                '])',
                'def test_sql_injection_rejected(page: Page, sql_payload):',
                f'{i}"""Security: SQL injection payloads should not bypass validation."""',
                f'{i}pom = {class_name}(page)',
                f'{i}pom.navigate("{url}")',
                "",
            ]
            for inp in dom_data["inputs"][:2]:
                vname = self._var_name(inp)
                lines.append(f"{i}pom.enter_{vname}(sql_payload)")
            if dom_data.get("buttons"):
                btn_var = self._var_name(dom_data["buttons"][0], "button")
                lines.append(f"{i}pom.click_{btn_var}()")
            lines += [
                "",
                f'{i}content = page.content().lower()',
                f"{i}assert 'sql syntax' not in content and 'mysql' not in content and 'database error' not in content, \\",
                f"{i}    'SQL injection may have caused a database error'",
                "",
            ]

        # Password masking check
        lines += [
            "@pytest.mark.security",
            "def test_password_fields_are_masked(page: Page):",
            f'{i}"""Security: Password fields should have type=password."""',
            f'{i}page.goto("{url}")',
            f"{i}page.wait_for_load_state('networkidle')",
            f"{i}plain_text_passwords = page.locator('input[type=text][name*=pass], input[type=text][name*=pwd]').all()",
            f"{i}assert len(plain_text_passwords) == 0, 'Found password-like fields using type=text instead of type=password'",
            "",
        ]

        return "\n".join(lines)

    # ─── Performance Tests ────────────────────────────────────────────────────

    def generate_performance_tests(self, dom_data, url, page_name="Page"):
        class_name = f"{page_name.replace(' ', '')}Page"
        i = self.ind
        lines = [
            "",
            "import pytest",
            "import time",
            "from playwright.sync_api import Page, expect",
            f"from page_objects import {class_name}",
            "",
            "@pytest.mark.performance",
            "def test_page_load_within_threshold(page: Page):",
            f'{i}"""Performance: Page should fully load within 5 seconds."""',
            f"{i}start = time.time()",
            f'{i}page.goto("{url}")',
            f"{i}page.wait_for_load_state('networkidle')",
            f"{i}elapsed = time.time() - start",
            f"{i}print(f'Page load time: {{elapsed:.2f}}s')",
            f"{i}assert elapsed < 5, f'Page load took {{elapsed:.2f}}s (threshold: 5s)'",
            "",
            "@pytest.mark.performance",
            "def test_dom_content_loaded_timing(page: Page):",
            f'{i}"""Performance: DOM content should be interactive within 3 seconds."""',
            f'{i}page.goto("{url}")',
            f"{i}timing = page.evaluate('window.performance.timing')",
            f"{i}dom_ready = (timing['domContentLoadedEventEnd'] - timing['navigationStart']) / 1000",
            f"{i}print(f'DOM Content Loaded in: {{dom_ready:.2f}}s')",
            f"{i}assert dom_ready < 3, f'DOM took {{dom_ready:.2f}}s to become interactive'",
            "",
            "@pytest.mark.performance",
            "def test_resource_count_within_limit(page: Page):",
            f'{i}"""Performance: Page should not load excessive resources."""',
            f'{i}page.goto("{url}")',
            f"{i}page.wait_for_load_state('networkidle')",
            f"{i}resource_count = page.evaluate('window.performance.getEntriesByType(\"resource\").length')",
            f"{i}print(f'Total resources: {{resource_count}}')",
            f"{i}assert resource_count < 100, f'Too many resources loaded ({{resource_count}}). Threshold: 100'",
            "",
        ]

        if dom_data.get("inputs"):
            inp = dom_data["inputs"][0]
            vname = self._var_name(inp)
            lines += [
                "@pytest.mark.performance",
                "def test_input_field_interactable_quickly(page: Page):",
                f'{i}"""Performance: First input field should be interactable within 2 seconds."""',
                f'{i}pom = {class_name}(page)',
                f'{i}pom.navigate("{url}")',
                f"{i}start = time.time()",
                f"{i}page.locator(pom.{vname}_locator).wait_for(state='visible', timeout=2000)",
                f"{i}elapsed = time.time() - start",
                f"{i}assert elapsed < 2, f'Input field took {{elapsed:.2f}}s to appear'",
                "",
            ]

        return "\n".join(lines)

    # ─── Accessibility Tests ──────────────────────────────────────────────────

    def generate_accessibility_tests(self, dom_data, url, page_name="Page"):
        i = self.ind
        lines = [
            "",
            "import pytest",
            "from playwright.sync_api import Page, expect",
            "",
            "@pytest.mark.accessibility",
            "def test_images_have_alt_text(page: Page):",
            f'{i}"""Accessibility: All images should have non-empty alt text."""',
            f'{i}page.goto("{url}")',
            f"{i}page.wait_for_load_state('networkidle')",
            f"{i}images = page.locator('img').all()",
            f"{i}images_missing_alt = []",
            f"{i}for img in images:",
            f"{i}{i}alt = img.get_attribute('alt')",
            f"{i}{i}if alt is None or alt.strip() == '':",
            f"{i}{i}{i}src = img.get_attribute('src') or 'unknown'",
            f"{i}{i}{i}images_missing_alt.append(src[:60])",
            f"{i}assert len(images_missing_alt) == 0, \\",
            f"{i}    f'{{len(images_missing_alt)}} image(s) missing alt text: {{images_missing_alt[:3]}}'",
            "",
            "@pytest.mark.accessibility",
            "def test_page_has_h1_heading(page: Page):",
            f'{i}"""Accessibility: Page should have at least one h1 heading."""',
            f'{i}page.goto("{url}")',
            f"{i}h1_count = page.locator('h1').count()",
            f"{i}assert h1_count >= 1, 'Page is missing an h1 heading'",
            "",
            "@pytest.mark.accessibility",
            "def test_main_landmark_present(page: Page):",
            f'{i}"""Accessibility: Page should have a main landmark for screen readers."""',
            f'{i}page.goto("{url}")',
            f"{i}main_count = page.locator('main, [role=main]').count()",
            f"{i}assert main_count >= 1, 'Page is missing a main content landmark'",
            "",
            "@pytest.mark.accessibility",
            "def test_nav_landmark_present(page: Page):",
            f'{i}"""Accessibility: Page should have a navigation landmark."""',
            f'{i}page.goto("{url}")',
            f"{i}nav_count = page.locator('nav, [role=navigation]').count()",
            f"{i}print(f'Navigation landmarks found: {{nav_count}}') # Not hard-fail — some SPAs differ",
            "",
        ]

        if dom_data.get("inputs"):
            lines += [
                "@pytest.mark.accessibility",
                "def test_interactive_elements_keyboard_focusable(page: Page):",
                f'{i}"""Accessibility: Interactive elements should be focusable via keyboard."""',
                f'{i}page.goto("{url}")',
                f"{i}page.wait_for_load_state('networkidle')",
                f"{i}# Tab through first 10 focusable elements",
                f"{i}focused_tags = set()",
                f"{i}for _ in range(10):",
                f"{i}{i}page.keyboard.press('Tab')",
                f"{i}{i}tag = page.evaluate('document.activeElement ? document.activeElement.tagName.toLowerCase() : \"\"')",
                f"{i}{i}if tag:",
                f"{i}{i}{i}focused_tags.add(tag)",
                f"{i}interactive_tags = {{'input', 'button', 'a', 'select', 'textarea'}}",
                f"{i}found = focused_tags & interactive_tags",
                f"{i}assert len(found) > 0, 'No interactive elements were reachable by Tab key'",
                "",
            ]

        return "\n".join(lines)

    # ─── Integration Tests ────────────────────────────────────────────────────

    def generate_integration_tests(self, dom_data, url, page_name="Page"):
        class_name = f"{page_name.replace(' ', '')}Page"
        i = self.ind
        lines = [
            "",
            "import pytest",
            "import time",
            "from playwright.sync_api import Page, expect",
            f"from page_objects import {class_name}",
            "",
        ]

        if dom_data.get("inputs") and dom_data.get("buttons"):
            lines += [
                "@pytest.mark.integration",
                "def test_form_submit_triggers_navigation_or_feedback(page: Page):",
                f'{i}"""Integration: Form submission should trigger feedback or redirect."""',
                f'{i}pom = {class_name}(page)',
                f'{i}pom.navigate("{url}")',
                f"{i}initial_url = page.url",
                "",
            ]
            for inp in dom_data["inputs"]:
                vname = self._var_name(inp)
                itype = inp.get("type", "text")
                val = "test@integration.com" if itype == "email" else "TestPassword1!" if itype == "password" else "integration_test_value"
                lines.append(f'{i}pom.enter_{vname}("{val}")')
            btn_var = self._var_name(dom_data["buttons"][0], "button")
            lines += [
                f"{i}pom.click_{btn_var}()",
                f"{i}page.wait_for_load_state('networkidle')",
                "",
                f"{i}content = page.content().lower()",
                f"{i}url_changed = page.url != initial_url",
                f"{i}has_feedback = 'success' in content or 'error' in content or 'invalid' in content",
                f"{i}assert url_changed or has_feedback, 'Form submission produced no visible feedback or navigation'",
                "",
            ]

        if dom_data.get("links"):
            lines += [
                "@pytest.mark.integration",
                "def test_navigation_links_not_broken(page: Page):",
                f'{i}"""Integration: Anchor links should lead to valid pages (no 404)."""',
                f'{i}page.goto("{url}")',
                f"{i}page.wait_for_load_state('networkidle')",
                f"{i}links = page.locator('a[href]').all()",
                f"{i}hrefs = [link.get_attribute('href') for link in links[:10]]",
                f"{i}hrefs = [h for h in hrefs if h and h.startswith('http') and '#' not in h]",
                f"{i}broken = []",
                f"{i}for href in hrefs[:5]:",
                f"{i}{i}try:",
                f"{i}{i}{i}page.goto(href)",
                f"{i}{i}{i}title = page.title().lower()",
                f"{i}{i}{i}if '404' in title or 'not found' in title:",
                f"{i}{i}{i}{i}broken.append(href)",
                f"{i}{i}except Exception:",
                f"{i}{i}{i}broken.append(href)",
                f"{i}assert len(broken) == 0, f'Broken links found: {{broken}}'",
                "",
            ]

        lines += [
            "@pytest.mark.integration",
            "def test_cookies_set_after_page_visit(page: Page):",
            f'{i}"""Integration: Visiting the page should set session cookies."""',
            f'{i}page.goto("{url}")',
            f"{i}page.wait_for_load_state('networkidle')",
            f"{i}cookies = page.context.cookies()",
            f"{i}print(f'Cookies set: {{[c[\"name\"] for c in cookies]}}')",
            f"{i}# Note: Some SPA pages may not set cookies until authenticated",
            "",
        ]

        return "\n".join(lines)

    # ─── Regression Tests ─────────────────────────────────────────────────────

    def generate_regression_tests(self, dom_data, url, page_name="Page"):
        class_name = f"{page_name.replace(' ', '')}Page"
        title = dom_data.get("title", "")
        i = self.ind
        input_count = len(dom_data.get("inputs", []))
        button_count = len(dom_data.get("buttons", []))

        lines = [
            "",
            "import pytest",
            "from playwright.sync_api import Page, expect",
            f"from page_objects import {class_name}",
            "",
            "@pytest.mark.regression",
            "def test_page_element_count_unchanged(page: Page):",
            f'{i}"""Regression: Page should have the expected count of form elements."""',
            f'{i}page.goto("{url}")',
            f"{i}page.wait_for_load_state('networkidle')",
            f"{i}inputs = page.locator('input:not([type=hidden]), textarea, select').count()",
            f"{i}buttons = page.locator('button, input[type=submit], input[type=button]').count()",
            f"{i}print(f'Found {{inputs}} inputs, {{buttons}} buttons')",
            f"{i}assert inputs >= {max(input_count - 2, 0)}, f'Expected ~{input_count} inputs, got {{inputs}}'",
            f"{i}assert buttons >= {max(button_count - 2, 0)}, f'Expected ~{button_count} buttons, got {{buttons}}'",
            "",
        ]

        if title:
            lines += [
                "@pytest.mark.regression",
                "def test_page_title_unchanged(page: Page):",
                f'{i}"""Regression: Page title should match expected baseline."""',
                f'{i}page.goto("{url}")',
                f'{i}expect(page).to_have_title("{title}")',
                "",
            ]

        if dom_data.get("inputs"):
            lines += [
                "@pytest.mark.regression",
                "def test_all_input_locators_still_resolve(page: Page):",
                f'{i}"""Regression: All known input locators should still be on the page."""',
                f'{i}pom = {class_name}(page)',
                f'{i}pom.navigate("{url}")',
                "",
            ]
            for inp in dom_data["inputs"]:
                vname = self._var_name(inp)
                lines += [
                    f"{i}try:",
                    f"{i}{i}expect(page.locator(pom.{vname}_locator)).to_be_visible()",
                    f"{i}except Exception as e:",
                    f"{i}{i}pytest.fail(f'Locator for {vname} is broken: {{e}}')",
                    "",
                ]

        if dom_data.get("buttons"):
            lines += [
                "@pytest.mark.regression",
                "def test_all_button_locators_still_resolve(page: Page):",
                f'{i}"""Regression: All known button locators should still be on the page."""',
                f'{i}pom = {class_name}(page)',
                f'{i}pom.navigate("{url}")',
                "",
            ]
            for btn in dom_data["buttons"]:
                vname = self._var_name(btn, "button")
                lines += [
                    f"{i}try:",
                    f"{i}{i}expect(page.locator(pom.{vname}_locator)).to_be_visible()",
                    f"{i}except Exception as e:",
                    f"{i}{i}pytest.fail(f'Locator for {vname} is broken: {{e}}')",
                    "",
                ]

        return "\n".join(lines)


# ─── Public Entry Point ───────────────────────────────────────────────────────

def generate_tests_without_api(dom_data, test_types, page_name="Login", framework_type="pytest-selenium"):
    """
    Generate a complete test suite without using the AI API.
    Routes to PlaywrightTemplateGenerator if framework_type == 'pytest-playwright',
    otherwise uses the Selenium TestTemplateGenerator.

    Args:
        dom_data: Pre-extracted DOM structure from the TypeScript backend service.
        test_types: List of test types, e.g. ['smoke', 'functional', 'negative'].
        page_name: Name for the POM page class.
        framework_type: 'pytest-playwright' or 'pytest-selenium'.
    """
    print(f"[Playwright Generator] Starting for {page_name} ({framework_type})", file=sys.stderr)
    url = dom_data.get("url", "N/A")

    gen = PlaywrightTemplateGenerator()

    pom_code = gen.generate_pom_class(dom_data, page_name)
    fixtures = gen.generate_fixtures(dom_data)

    smoke_tests         = gen.generate_smoke_tests(dom_data, url, page_name)        if "smoke"         in test_types else ""
    functional_tests    = gen.generate_functional_tests(dom_data, url, "", page_name) if "functional"    in test_types else ""
    negative_tests      = gen.generate_negative_tests(dom_data, url, page_name)     if "negative"      in test_types else ""
    security_tests      = gen.generate_security_tests(dom_data, url, page_name)     if "security"      in test_types else ""
    performance_tests   = gen.generate_performance_tests(dom_data, url, page_name)  if "performance"   in test_types else ""
    accessibility_tests = gen.generate_accessibility_tests(dom_data, url, page_name)if "accessibility" in test_types else ""
    integration_tests   = gen.generate_integration_tests(dom_data, url, page_name)  if "integration"   in test_types else ""
    regression_tests    = gen.generate_regression_tests(dom_data, url, page_name)   if "regression"    in test_types else ""

    test_sections = [
        ("SMOKE TESTS",         smoke_tests),
        ("FUNCTIONAL TESTS",    functional_tests),
        ("NEGATIVE TESTS",      negative_tests),
        ("SECURITY TESTS",      security_tests),
        ("PERFORMANCE TESTS",   performance_tests),
        ("ACCESSIBILITY TESTS", accessibility_tests),
        ("INTEGRATION TESTS",   integration_tests),
        ("REGRESSION TESTS",    regression_tests),
    ]

    header = f"""\
# ============================================================
# Generated Playwright Test Suite for {page_name}
# Framework: pytest-playwright
# URL: {url}
# Test Types: {', '.join(test_types)}
# ============================================================

# ─── PAGE OBJECT MODEL ───────────────────────────────────────────────────────

{pom_code}


# ─── CONFTEST FIXTURES ───────────────────────────────────────────────────────

{fixtures}"""

    sections = [header]
    for title, content in test_sections:
        if content and content.strip():
            sections.append(f"""

# ─── {title} {"─" * max(0, 61 - len(title))}

{content}""")

    sections.append("""

# ─── USAGE ───────────────────────────────────────────────────────────────────
# Install:          pip install pytest pytest-playwright && playwright install
# Run all tests:    pytest
# Run by category:  pytest -m smoke
# Run verbose:      pytest -v
""")

    return "\n".join(sections)
