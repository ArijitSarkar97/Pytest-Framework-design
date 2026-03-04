
// --- PyTest & Page Object Model Best Practices (Gathered Knowledge) ---

export const TEST_PATTERNS = {
    naming: {
        convention: "snake_case",
        prefixes: ["test_", "verify_", "should_"],
        // GIVEN_WHEN_THEN style or Action_Result style
        templates: [
            "test_verify_{action}_successful",
            "test_should_{outcome}_when_{condition}",
            "test_{feature}_workflow"
        ]
    },

    structure: {
        standard: `
    def test_{name}(self, driver):
        """
        Test Case: {description}
        Steps:
        {steps_doc}
        """
        # 1. Arrange: Initialize Page Objects
        {page_init}
        
        # 2. Act: Perform Actions
        {actions}
        
        # 3. Assert: Verify Outcomes
        {assertions}
    `
    },

    heuristics: {
        // Detection logic for common flows
        login: {
            keywords: ['login', 'signin', 'auth', 'user', 'password'],
            required_elements: ['input[type="text|email"]', 'input[type="password"]', 'button'],
            test_name: "test_valid_login_flow",
            description: "Verify that a user can log in with valid credentials.",
            steps: [
                { action: 'input', target: 'username', value: 'standard_user' },
                { action: 'input', target: 'password', value: 'secret_sauce' },
                { action: 'click', target: 'submit' },
                { action: 'assert', target: 'url_or_dashboard', value: 'visible' }
            ]
        },
        search: {
            keywords: ['search', 'find', 'query'],
            required_elements: ['input[type="search|text"]', 'button'],
            test_name: "test_search_functionality",
            description: "Verify that searching returns relevant results.",
            steps: [
                { action: 'input', target: 'search_box', value: 'test item' },
                { action: 'click', target: 'search_button' },
                { action: 'assert', target: 'results_list', value: 'visible' }
            ]
        },
        navigation: {
            keywords: ['nav', 'menu', 'link', 'href'],
            test_name: "test_navigation_links",
            description: "Verify all navigation links work correctly."
        }
    },

    // --- Test Type Generators ---
    // These define what kind of tests to generate for each category
    testTypes: {
        smoke: {
            description: "Quick page load and visibility checks",
            markers: ["smoke"],
        },
        functional: {
            description: "Core user workflows (forms, inputs, buttons)",
            markers: ["functional"],
        },
        negative: {
            description: "Invalid inputs, empty forms, boundary values",
            markers: ["negative"],
            invalidInputs: [
                { label: "empty_string", value: "" },
                { label: "special_chars", value: "!@#$%^&*()" },
                { label: "long_string", value: "a".repeat(256) },
                { label: "sql_injection", value: "' OR 1=1 --" },
                { label: "xss_payload", value: "<script>alert(1)</script>" },
            ]
        },
        security: {
            description: "XSS, SQL injection, password masking, CSRF",
            markers: ["security"],
            xssPayloads: [
                "<script>alert('XSS')</script>",
                "<img src=x onerror=alert(1)>",
                "javascript:alert(1)",
                "'\"><script>alert(1)</script>",
                "<svg onload=alert(1)>",
            ],
            sqlPayloads: [
                "' OR 1=1 --",
                "1; DROP TABLE users --",
                "' UNION SELECT * FROM users --",
                "admin'--",
            ]
        },
        performance: {
            description: "Page load time, DOM readiness, resource counts",
            markers: ["performance"],
            thresholds: {
                pageLoadMs: 5000,
                domReadyMs: 3000,
                maxResources: 100,
            }
        },
        accessibility: {
            description: "Alt text, labels, ARIA, heading structure, keyboard nav",
            markers: ["accessibility"],
        },
        integration: {
            description: "Form submit flow, link resolution, cookies, console errors",
            markers: ["integration"],
        },
        regression: {
            description: "Element counts, locator validity, title, layout stability",
            markers: ["regression"],
        }
    }
};
