"""
Comprehensive Test Case Generator
Integrates DOM extraction, English conversion, and test case design brain knowledge
to generate complete, production-ready test suites.
"""

import os
from dom_extractor import extract_dom
from dom_to_english import create_test_context
from google import genai
from google.genai import types


def load_knowledge_base():
    """Load test case design brain knowledge."""
    knowledge_base_path = os.path.join(
        os.path.dirname(__file__), 
        "..", 
        ".gemini", 
        "antigravity", 
        "brain", 
        "940423cc-e6ae-44b6-b843-1d9ff2223e18",
        "test_case_design_brain.md"
    )
    
    try:
        with open(knowledge_base_path, 'r') as f:
            return f.read()
    except FileNotFoundError:
        # Fallback to simplified knowledge if file not found
        return """
Test Case Design Principles:
- Use AAA pattern (Arrange-Act-Assert)
- Follow FIRST principles (Fast, Independent, Repeatable, Self-validating, Timely)
- Apply Boundary Value Analysis for edge cases
- Use Equivalence Partitioning for input validation
- Implement Page Object Model for UI tests
- Write clear, descriptive test names: test_feature_scenario_result
"""


def build_comprehensive_prompt(test_context, knowledge_base):
    """
    Build comprehensive prompt incorporating knowledge base.
    
    Args:
        test_context: Structured page description + requirements
        knowledge_base: Test case design brain content
        
    Returns:
        str: Complete prompt for Gemini
    """
    prompt = f"""You are an expert test automation engineer with deep expertise in:
- Test case design principles and patterns
- Pytest framework and best practices  
- Page Object Model architecture
- Boundary Value Analysis and Equivalence Partitioning
- Comprehensive test coverage strategies

=== TEST CASE DESIGN KNOWLEDGE BASE ===
{knowledge_base}

=== PAGE TO TEST ===
{test_context}

=== YOUR TASK ===
Generate a COMPLETE, PRODUCTION-READY test suite with the following structure:

1. **Page Object Model Class**
   - Clean, maintainable page object for all elements
   - Descriptive method names
   - Proper locator strategies (prefer ID > CSS > XPath)

2. **Smoke Tests**
   - Critical path verification
   - Page loads successfully
   - Key elements present

3. **Functional Tests**
   - All positive scenarios
   - Happy path flows
   - Feature completeness

4. **Negative Tests**
   - Invalid inputs
   - Error handling
   - Validation failures

5. **Boundary Value Tests**
   - Min/max boundaries
   - Edge cases
   - Off-by-one scenarios

6. **Fixtures and Setup**
   - Proper test data setup
   - Cleanup teardown
   - Reusable fixtures

=== REQUIREMENTS ===
- Use Pytest framework
- Follow naming convention: test_feature_scenario_result()
- Include docstrings for all test methods
- Use parametrized tests where appropriate
- Implement proper waits (WebDriverWait, not sleep)
- Add clear assertions with descriptive messages
- Ensure test independence
- Include TODO comments for manual verification steps

Generate the complete test suite as Python code with all necessary imports and proper structure.
"""
    return prompt


def generate_comprehensive_tests(url, user_requirement, api_key=None):
    """
    Main entry point: Generate comprehensive test cases from URL.
    
    Args:
        url: Target webpage URL
        user_requirement: User's testing requirements
        api_key: Optional Gemini API key (falls back to env var)
        
    Returns:
        str: Complete test suite code
    """
    print(f"[1/4] Extracting DOM from {url}...")
    dom_data = extract_dom(url)
    
    print("[2/4] Converting DOM to structured description...")
    test_context = create_test_context(dom_data, user_requirement)
    
    print("[3/4] Loading test case design knowledge...")
    knowledge_base = load_knowledge_base()
    
    print("[4/4] Generating comprehensive test cases with AI...")
    prompt = build_comprehensive_prompt(test_context, knowledge_base)
    
    # Generate with Gemini
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("API Key required. Set GEMINI_API_KEY or pass api_key parameter.")
    
    client = genai.Client(api_key=key)
    
    system_instruction = """You are a senior test automation engineer specializing in Pytest.
Generate clean, maintainable, production-ready test code following all best practices.
Include comprehensive comments and docstrings.
Ensure all tests are independent and can run in parallel."""
    
    # Retry logic for rate limits
    max_retries = 3
    retry_delay = 20
    
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.2,  # Lower temperature for more consistent code
                ),
                contents=[prompt]
            )
            return response.text
        except Exception as e:
            is_rate_limit = "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e)
            if is_rate_limit and attempt < max_retries - 1:
                print(f"Rate limit hit. Waiting {retry_delay}s before retry... (Attempt {attempt + 1}/{max_retries})")
                import time
                time.sleep(retry_delay)
                continue
            else:
                print(f"Error generating tests: {e}")
                return f"# Error: {str(e)}\n# Please try again or check your API key and quota."
