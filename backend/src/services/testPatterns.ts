
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
    }
};
