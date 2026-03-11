# Playwright Element Locating — Complete Knowledge Base

> **Source**: playwright.dev official documentation + best-practices research (2024–2025)

---

## 🎯 Core Philosophy

Playwright's locator system is **user-centric**. It mimics how real users and assistive
technologies (screen readers) perceive the page. This means:

- Prefer locators that reflect visible, meaningful content.
- Every locator must resolve to **exactly one element** (strict mode is the default).
- All locators come with **auto-waiting** built in — you never need `time.sleep()`.

---

## 🏆 Locator Priority Order (Highest → Lowest)

Follow this sequence strictly. Only fall back to the next level when the current level
cannot produce a **unique**, **reliable** locator.

### Priority 1 — `get_by_role()` ✅ PREFERRED
```python
page.get_by_role("button", name="Submit")
page.get_by_role("textbox", name="Email")
page.get_by_role("checkbox", name="Remember me")
page.get_by_role("link", name="Forgot password?")
page.get_by_role("heading", name="Sign in", level=1)
page.get_by_role("combobox", name="Country")        # <select>
page.get_by_role("dialog", name="Confirm delete")   # modal
```
**Why first?** ARIA roles are defined by the browser's accessibility tree, not DOM
structure. They survive CSS rewrites, class renames, and component library upgrades.

Common roles: `button`, `link`, `textbox`, `checkbox`, `radio`, `combobox`, `listbox`,
`menuitem`, `tab`, `dialog`, `alert`, `heading`, `img`, `row`, `cell`, `grid`.

---

### Priority 2 — `get_by_label()` ✅ Excellent for form inputs
```python
page.get_by_label("Email address")
page.get_by_label("Password")
page.get_by_label("Date of birth")
```
**Why second?** Works for any `<input>` / `<select>` / `<textarea>` associated to a
`<label>` — either via `for`/`id` binding, `aria-label`, or `aria-labelledby`.
Extremely stable since label text is user-visible.

---

### Priority 3 — `get_by_placeholder()` ✅ Good for unlabelled inputs
```python
page.get_by_placeholder("Enter your email")
page.get_by_placeholder("Search...")
page.get_by_placeholder("YYYY-MM-DD")
```
**Why third?** Placeholder text is visible to users in empty fields. Stable when labels
are absent. Avoid if placeholder text changes dynamically.

---

### Priority 4 — `get_by_text()` ✅ Good for static content & buttons
```python
page.get_by_text("Welcome back")
page.get_by_text("Sign in", exact=True)
page.get_by_text("Terms of Service")
```
**Why fourth?** Text content is human-readable but can break if copywriters change wording.
Use `exact=True` to prevent partial-match false positives.

---

### Priority 5 — `get_by_alt_text()` ✅ For images
```python
page.get_by_alt_text("Company logo")
page.get_by_alt_text("User profile picture")
```
Use specifically when an `<img>` or icon must be located.

---

### Priority 6 — `get_by_title()` ✅ For tooltip / title attributes
```python
page.get_by_title("Close dialog")
page.get_by_title("Open calendar")
```
Lower priority because `title` attributes are often developer-added, not always visible.

---

### Priority 7 — `get_by_test_id()` ⚙️ Explicit test contract
```python
page.get_by_test_id("submit-button")
page.get_by_test_id("email-input")
page.get_by_test_id("login-form")
```
**When to use:** When user-facing locators aren't unique or the team has explicitly added
`data-testid` attributes. Requires developer collaboration. Configure the attribute:
```python
playwright.selectors.set_test_id_attribute("data-qa")  # custom attribute
```

---

### Priority 8 — CSS Selector ⚠️ Use sparingly
```python
page.locator("#email")                    # id attribute
page.locator("[name='password']")         # name attribute
page.locator("input[type='email']")       # type attribute
page.locator(".login-btn")               # class (fragile!)
page.locator("[data-testid='submit']")    # explicit data attribute
```
**When to use:** When no `get_by_*` produces a unique match and the element has a stable
`id`, `name`, or `type`. Avoid class-based selectors entirely.

---

### Priority 9 — XPath ❌ Last resort only
```python
page.locator("xpath=//button[@type='submit']")
page.locator("//form[@id='login']//input[@name='email']")
```
**When to use:** Only for elements unreachable by any other method (e.g., shadow DOM
workarounds, dynamically generated structure). XPath is extremely fragile.

---

## 🔬 Decision Algorithm (Use This to Pick a Locator)

```
1. Does the element have a clear ARIA role + accessible name?
   → get_by_role(role, name=...)

2. Is the element a form field with a visible <label>?
   → get_by_label("Label text")

3. Is the element an input with placeholder but no label?
   → get_by_placeholder("placeholder text")

4. Is the element identified by its visible text?
   → get_by_text("text", exact=True)

5. Is it an image with alt text?
   → get_by_alt_text("alt text")

6. Does the element have a title attribute?
   → get_by_title("title")

7. Does the element have a data-testid / data-qa attribute?
   → get_by_test_id("testid-value")

8. Does the element have a stable id or name attribute?
   → locator("#id") or locator("[name='value']")

9. Does the element have a stable type attribute (inputs)?
   → locator("input[type='email']")

10. Nothing else works?
    → locator("xpath=...")  ← document why
```

---

## 🔗 Chaining & Filtering (Handle Non-Unique Results)

When a locator matches **multiple** elements, do NOT fall back to XPath. Instead:

```python
# Chain: scope to a parent container first
form = page.locator("form#login-form")
email_input = form.get_by_label("Email")

# Filter by text
row = page.get_by_role("row").filter(has_text="Project Alpha")

# Filter by child element
row = page.get_by_role("row").filter(has=page.get_by_role("button", name="Edit"))

# Get nth match (use sparingly)
page.get_by_role("button", name="Delete").nth(0)   # first
page.get_by_role("button", name="Delete").last     # last
```

---

## ⚡ Auto-Waiting Cheat Sheet

Playwright auto-waits for these conditions before acting:
| Action | Auto-waits for |
|--------|---------------|
| `click()` | Visible, stable, not obscured, enabled |
| `fill()` | Visible, enabled, editable |
| `check()` | Visible, enabled |
| `select_option()` | Visible, enabled |
| `wait_for(state=...)` | Can specify: `"visible"`, `"hidden"`, `"attached"`, `"detached"` |

**Never use** `time.sleep()` or `page.wait_for_timeout()` in production tests.
Use `locator.wait_for(state="visible")` or `expect(locator).to_be_visible()` instead.

---

## ✅ Assertions (expect API)

```python
from playwright.sync_api import expect

expect(page).to_have_title("Login - MyApp")
expect(page).to_have_url("https://app.example.com/dashboard")

expect(locator).to_be_visible()
expect(locator).to_be_hidden()
expect(locator).to_be_enabled()
expect(locator).to_be_disabled()
expect(locator).to_be_checked()
expect(locator).to_have_text("Welcome")
expect(locator).to_have_value("user@example.com")
expect(locator).to_have_attribute("type", "email")
expect(locator).to_have_count(3)
```

---

## 📐 POM (Page Object Model) Pattern — Best Practice

```python
from playwright.sync_api import Page, expect

class LoginPage:
    # --- Locators (Priority 1 → 9) ---
    # Buttons: get_by_role first
    submit_btn      = "button:has-text('Sign in')"   # CSS fallback if needed
    # Inputs: get_by_label or get_by_placeholder
    # Store as string selectors for page.locator(), or use methods

    def __init__(self, page: Page):
        self.page = page
        # Use get_by_* as locator properties (preferred)
        self.email_input    = page.get_by_label("Email")
        self.password_input = page.get_by_label("Password")
        self.login_button   = page.get_by_role("button", name="Sign in")
        self.error_message  = page.get_by_role("alert")

    def navigate(self, url: str):
        self.page.goto(url)
        self.page.wait_for_load_state("networkidle")

    def login(self, email: str, password: str):
        self.email_input.fill(email)
        self.password_input.fill(password)
        self.login_button.click()

    def get_error_text(self) -> str:
        return self.error_message.inner_text()
```

---

## 🚫 Anti-Patterns to Avoid

| ❌ Anti-Pattern | ✅ Correct Approach |
|---|---|
| `page.locator(".btn-primary")` | `page.get_by_role("button", name="Submit")` |
| `page.locator("//div[3]/input")` | `page.get_by_label("Email")` |
| `time.sleep(2)` | `expect(locator).to_be_visible()` |
| `driver.find_element(By.ID, "...")` | `page.locator("#id")` or `page.get_by_role(...)` |
| `page.locator("input")[2]` | `page.get_by_label("Password")` |
| Hardcoding absolute XPath | Use role/label/placeholder/testid |

---

## 📊 Locator Comparison Table

| Locator | Stability | User-Facing | When to Use |
|---------|-----------|-------------|-------------|
| `get_by_role` | ⭐⭐⭐⭐⭐ | ✅ Yes | Interactive elements with clear ARIA role |
| `get_by_label` | ⭐⭐⭐⭐⭐ | ✅ Yes | Form inputs with associated label |
| `get_by_placeholder` | ⭐⭐⭐⭐ | ✅ Yes | Unlabelled inputs |
| `get_by_text` | ⭐⭐⭐⭐ | ✅ Yes | Static text / button text |
| `get_by_alt_text` | ⭐⭐⭐⭐ | ✅ Yes | Images |
| `get_by_title` | ⭐⭐⭐ | ⚠️ Partial | Tooltip elements |
| `get_by_test_id` | ⭐⭐⭐⭐ | ❌ No | Explicit test contracts (data-testid) |
| CSS `#id` | ⭐⭐⭐ | ❌ No | Stable IDs (not auto-generated) |
| CSS `[name=]` | ⭐⭐⭐ | ❌ No | Form fields with name attribute |
| CSS class | ⭐⭐ | ❌ No | Avoid — very fragile |
| XPath | ⭐ | ❌ No | Last resort only |
