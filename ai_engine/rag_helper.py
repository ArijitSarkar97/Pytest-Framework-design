import base64
import os
from selenium import webdriver
from bs4 import BeautifulSoup
from google import genai
from google.genai import types

def capture_page_context(url, output_img="screenshot.png"):
    """
    Captures the page screenshot and pruned DOM for context.
    """
    options = webdriver.ChromeOptions()
    options.add_argument("--headless") 
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=options)
    try:
        driver.get(url)
        
        # 1. Capture Screenshot for visual reasoning
        driver.save_screenshot(output_img)
        
        # 2. Capture and Prune DOM
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        for tag in soup(["script", "style", "svg", "path"]):
            tag.decompose()
            
        # Focus only on interactive elements to save tokens
        interactive_elements = []
        for element in soup.find_all(['button', 'input', 'a', 'select']):
            interactive_elements.append({
                "tag": element.name,
                "text": element.get_text(strip=True),
                "attributes": {k: v for k, v in element.attrs.items() if k in ['id', 'name', 'data-testid', 'placeholder']}
            })
        
        return interactive_elements, output_img
    finally:
        driver.quit()

def ask_gemini_to_write_test(dom_json, screenshot_path, user_requirement, api_key=None):
    """
    Sends the DOM and screenshot to Gemini to generate a test case.
    """
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("API Key is required. Pass it as argument or set GEMINI_API_KEY env var.")

    client = genai.Client(api_key=key)

    # Load the screenshot
    try:
        with open(screenshot_path, "rb") as f:
            image_bytes = f.read()
    except FileNotFoundError:
        print(f"Error: Screenshot not found at {screenshot_path}")
        return None

    system_instruction = """
    You are a Senior Automation Engineer. Create a Pytest + Selenium test.
    - Use Page Object Model (POM).
    - Prioritize 'data-testid' for locators.
    - Use Explicit Waits (WebDriverWait).
    - Ensure the code is PEP8 compliant.
    """

    import time
    from google.api_core import exceptions

    max_retries = 3
    retry_delay = 20 # Seconds

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.1 # Low temperature for precise code
                ),
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/png"),
                    f"DOM Structure: {dom_json}",
                    f"Requirement: {user_requirement}"
                ]
            )
            return response.text
        except Exception as e:
            is_rate_limit = "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e)
            if is_rate_limit and attempt < max_retries - 1:
                print(f"Rate limit hit. Retrying in {retry_delay} seconds... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(retry_delay)
                continue
            else:
                print(f"Error communicating with Gemini: {e}")
                return str(e)

