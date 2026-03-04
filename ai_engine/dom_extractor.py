"""
Enhanced DOM Extraction Module
Extracts comprehensive DOM elements with semantic analysis for test generation.
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import json


def extract_dom(url, driver=None):
    """
    Extract comprehensive DOM structure with semantic analysis.
    
    Args:
        url: Target webpage URL
        driver: Optional existing Selenium driver
        
    Returns:
        dict: Structured DOM data with elements, flows, and validations
    """
    close_driver = False
    if driver is None:
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        driver = webdriver.Chrome(options=options)
        close_driver = True
    
    try:
        driver.get(url)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        
        # Get page source and parse with BeautifulSoup
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        
        # Extract comprehensive data
        dom_data = {
            'url': url,
            'title': driver.title,
            'inputs': extract_inputs(soup),
            'buttons': extract_buttons(soup),
            'links': extract_links(soup),
            'forms': extract_forms(soup),
            'modals': extract_modals(soup),
            'dropdowns': extract_dropdowns(soup),
            'tables': extract_tables(soup),
            'navigation': extract_navigation(soup),
            'validations': detect_validations(soup),
            'user_flows': detect_user_flows(soup)
        }
        
        return dom_data
        
    finally:
        if close_driver:
            driver.quit()


def extract_inputs(soup):
    """Extract all input fields with attributes."""
    inputs = []
    for input_elem in soup.find_all(['input', 'textarea']):
        input_data = {
            'type': input_elem.get('type', 'text'),
            'id': input_elem.get('id', ''),
            'name': input_elem.get('name', ''),
            'placeholder': input_elem.get('placeholder', ''),
            'required': input_elem.get('required') is not None,
            'pattern': input_elem.get('pattern', ''),
            'min_length': input_elem.get('minlength', ''),
            'max_length': input_elem.get('maxlength', ''),
            'aria_label': input_elem.get('aria-label', ''),
            'data_testid': input_elem.get('data-testid', ''),
            'class': ' '.join(input_elem.get('class', [])),
        }
        inputs.append(input_data)
    return inputs


def extract_buttons(soup):
    """Extract all buttons and clickable elements."""
    buttons = []
    for btn in soup.find_all(['button', 'input']):
        if btn.name == 'input' and btn.get('type') not in ['submit', 'button', 'reset']:
            continue
            
        button_data = {
            'type': btn.get('type', 'button'),
            'id': btn.get('id', ''),
            'text': btn.get_text(strip=True) or btn.get('value', ''),
            'name': btn.get('name', ''),
            'data_testid': btn.get('data-testid', ''),
            'aria_label': btn.get('aria-label', ''),
            'class': ' '.join(btn.get('class', [])),
            'disabled': btn.get('disabled') is not None,
        }
        buttons.append(button_data)
    return buttons


def extract_links(soup):
    """Extract all hyperlinks."""
    links = []
    for link in soup.find_all('a', href=True):
        link_data = {
            'href': link.get('href', ''),
            'text': link.get_text(strip=True),
            'id': link.get('id', ''),
            'class': ' '.join(link.get('class', [])),
            'data_testid': link.get('data-testid', ''),
        }
        links.append(link_data)
    return links


def extract_forms(soup):
    """Extract form structures."""
    forms = []
    for form in soup.find_all('form'):
        form_data = {
            'id': form.get('id', ''),
            'action': form.get('action', ''),
            'method': form.get('method', 'get').upper(),
            'input_count': len(form.find_all(['input', 'textarea', 'select'])),
            'button_count': len(form.find_all('button')),
        }
        forms.append(form_data)
    return forms


def extract_modals(soup):
    """Detect modal/dialog elements."""
    modals = []
    # Look for common modal patterns
    modal_selectors = ['[role="dialog"]', '.modal', '[aria-modal="true"]']
    for selector in modal_selectors:
        for modal in soup.select(selector):
            modal_data = {
                'id': modal.get('id', ''),
                'class': ' '.join(modal.get('class', [])),
                'aria_label': modal.get('aria-label', ''),
            }
            modals.append(modal_data)
    return modals


def extract_dropdowns(soup):
    """Extract select/dropdown elements."""
    dropdowns = []
    for select in soup.find_all('select'):
        options = [opt.get_text(strip=True) for opt in select.find_all('option')]
        dropdown_data = {
            'id': select.get('id', ''),
            'name': select.get('name', ''),
            'options': options,
            'data_testid': select.get('data-testid', ''),
        }
        dropdowns.append(dropdown_data)
    return dropdowns


def extract_tables(soup):
    """Extract table structures."""
    tables = []
    for table in soup.find_all('table'):
        headers = [th.get_text(strip=True) for th in table.find_all('th')]
        row_count = len(table.find_all('tr'))
        table_data = {
            'id': table.get('id', ''),
            'headers': headers,
            'row_count': row_count,
        }
        tables.append(table_data)
    return tables


def extract_navigation(soup):
    """Extract navigation elements."""
    nav_items = []
    for nav in soup.find_all(['nav', '[role="navigation"]']):
        links = nav.find_all('a', href=True)
        nav_data = {
            'id': nav.get('id', ''),
            'link_count': len(links),
            'links': [{'text': link.get_text(strip=True), 'href': link.get('href')} for link in links[:10]]
        }
        nav_items.append(nav_data)
    return nav_items


def detect_validations(soup):
    """Detect validation patterns from HTML."""
    validations = []
    
    # Email fields
    email_inputs = soup.find_all('input', type='email')
    if email_inputs:
        validations.append({
            'type': 'email_validation',
            'count': len(email_inputs),
            'description': 'Email format validation required'
        })
    
    # Required fields
    required = soup.find_all(attrs={'required': True})
    if required:
        validations.append({
            'type': 'required_fields',
            'count': len(required),
            'description': 'Required field validation'
        })
    
    # Pattern validations
    pattern_inputs = soup.find_all('input', attrs={'pattern': True})
    for inp in pattern_inputs:
        validations.append({
            'type': 'pattern_validation',
            'pattern': inp.get('pattern'),
            'field': inp.get('id') or inp.get('name'),
        })
    
    return validations


def detect_user_flows(soup):
    """Detect potential user flows based on page structure."""
    flows = []
    
    # Login flow detection
    if soup.find('input', type='password'):
        flows.append({
            'name': 'Login Flow',
            'steps': ['Enter credentials', 'Submit form', 'Navigate to dashboard']
        })
    
    # Registration flow detection
    if soup.find('input', placeholder=lambda x: x and 'confirm' in x.lower()):
        flows.append({
            'name': 'Registration Flow',
            'steps': ['Fill registration form', 'Confirm password', 'Submit', 'Verify email']
        })
    
    # Checkout flow detection
    if any(btn.get_text(strip=True).lower() in ['checkout', 'buy now', 'purchase'] 
           for btn in soup.find_all('button')):
        flows.append({
            'name': 'Checkout Flow',
            'steps': ['Add to cart', 'View cart', 'Enter shipping', 'Payment', 'Confirm order']
        })
    
    return flows
