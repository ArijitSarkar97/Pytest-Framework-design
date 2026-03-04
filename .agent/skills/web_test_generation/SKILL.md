---
name: Web Test Generation
description: A specialized skill for analyzing web page DOM structures, extracting robust locators, and generating comprehensive Selenium/PyTest test cases using heuristic and semantic analysis.
---

# Web Test Generation Skill

This skill provides a systematic approach to analyzing web pages and generating robust automated tests. It encapsulates best practices for DOM traversal, locator strategy, and test casing.

## 1. DOM Analysis Strategy

When analyzing a web page for test automation, do not rely on simple string parsing. Use a proper DOM parser (e.g., `JSDOM` in Node.js or `BeautifulSoup`/`lxml` in Python) to understand the document structure.

### Key Extraction Rules:
- **Interactive Elements Only**: Focus on `input`, `button`, `a` (links), `select`, `textarea`, and elements with `role="button"` or `onclick` handlers.
- **Hidden Element Filtering**: Always check for `type="hidden"`, `style="display: none"`, or `visibility: hidden` to avoid generating tests for invisible elements.
- **Attribute Enrichment**: Extract semantic attributes beyond just identifiers:
  - `type` (e.g., `submit`, `email`, `password`) - Critical for determining interaction type.
  - `placeholder` & `aria-label` - Useful for generating meaningful variable names.
  - `required`, `disabled`, `readonly` - Essential for boundary and negative testing.
  - `data-testid`, `data-cy`, `id` - High-priority attributes for stable locators.

## 2. Robust Locator Strategy

Use a fallback mechanism to generate the most stable locator possible. Priorities should be:

1.  **Resilient Attributes**: `id`, `data-testid`, `data-test`, `data-cy` (Score: 100)
    - *Constraint*: Must be unique in the document.
2.  **Semantic Attributes**: `name` (for form fields), `placeholder` (if unique) (Score: 90)
3.  **Link Text**: Exact match for `<a>` tags (Score: 85)
4.  **CSS Classes**: Specific, non-generic classes (avoid Tailwind utility classes like `p-4`, `flex`) (Score: 70)
5.  **Relative XPath**: Use relationship to stable anchors (Score: 60)
    - *Pattern*: `//label[text()="Username"]/following-sibling::input`
    - *Pattern*: `//div[@class="card" and .//h3[text()="Product X"]]//button`
6.  **Absolute XPath**: usage of indexes (Score: 10) - *Avoid whenever possible*.

## 3. Heuristic Test Identification

Do not just generate "click x, click y". Analyze the collection of elements to infer user flows.

### Patterns:
-   **Login Flow**:
    -   *Detection*: Presence of `input[type="password"]` AND `input[name="username|email"]` AND `button[type="submit"]`.
    -   *Test Case*: "Smoke Test: Valid Login", "Negative Test: Invalid Password".
-   **Search Flow**:
    -   *Detection*: `input[name="q|search"]` near a `button` with icon/text "Search".
    -   *Test Case*: "Functional User: Perform Search".
-   **Form Submission**:
    -   *Detection*: `<form>` tag or grouped inputs with a submit button.
    -   *Test Case*: "Validation Test: Required Fields", "Functional: Successful Submission".

## 4. Code Generation (PyTest + Selenium)

When generating code, follow the **Page Object Model (POM)** pattern:

### Structure:
1.  **Page Class**: Encapsulates locators and actions.
    ```python
    class LoginPage:
        def __init__(self, driver):
            self.driver = driver
            self.username_input = (By.ID, "user-name")
            self.password_input = (By.NAME, "password")
            self.login_btn = (By.XPATH, "//input[@type='submit']")

        def login(self, user, pwd):
            self.driver.find_element(*self.username_input).send_keys(user)
            self.driver.find_element(*self.password_input).send_keys(pwd)
            self.driver.find_element(*self.login_btn).click()
    ```

2.  **Test Function**: Proper assertions and naming.
    ```python
    def test_valid_login(driver):
        page = LoginPage(driver)
        page.login("standard_user", "secret_sauce")
        assert "inventory" in driver.current_url
    ```

## 5. Usage in This Project

This project implements this skill via:
-   **Backend**: `backend/src/services/domAnalysisService.ts` (Uses JSDOM for analysis).
-   **API**: `backend/src/routes/rag.ts` (Maps internal schema to AI payloads).
-   **AI Engine**: `ai_engine/generate_test_template.py` (Generates Python code from JSON schema).

To improve this skill, update the heuristics in `domAnalysisService.ts` or the template generation logic in `ai_engine/`.
