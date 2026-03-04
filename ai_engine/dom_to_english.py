"""
DOM-to-English Converter
Converts raw DOM extraction data into structured human-readable descriptions.
"""

def convert_to_english(dom_data):
    """
    Convert DOM extraction data to comprehensive English description.
    
    Args:
        dom_data: Dictionary from dom_extractor.extract_dom()
        
    Returns:
        str: Structured English description of the page
    """
    sections = []
    
    # Page header
    sections.append(f"=== PAGE ANALYSIS ===")
    sections.append(f"Page Title: {dom_data['title']}")
    sections.append(f"URL: {dom_data['url']}")
    sections.append("")
    
    # Input fields
    if dom_data['inputs']:
        sections.append("--- INPUT FIELDS ---")
        for idx, inp in enumerate(dom_data['inputs'], 1):
            sections.append(f"\n{idx}. {describe_input(inp)}")
        sections.append("")
    
    # Buttons
    if dom_data['buttons']:
        sections.append("--- BUTTONS & ACTIONS ---")
        for idx, btn in enumerate(dom_data['buttons'], 1):
            sections.append(f"\n{idx}. {describe_button(btn)}")
        sections.append("")
    
    # Links
    if dom_data['links']:
        sections.append(f"--- NAVIGATION LINKS ---")
        sections.append(f"Total Links: {len(dom_data['links'])}")
        # Show first 5 meaningful links
        meaningful_links = [l for l in dom_data['links'] if l['text'] and len(l['text']) > 0][:5]
        for idx, link in enumerate(meaningful_links, 1):
            sections.append(f"{idx}. \"{link['text']}\" → {link['href']}")
        sections.append("")
    
    # Forms
    if dom_data['forms']:
        sections.append("--- FORMS ---")
        for idx, form in enumerate(dom_data['forms'], 1):
            sections.append(f"\n{idx}. {describe_form(form)}")
        sections.append("")
    
    # Dropdowns
    if dom_data['dropdowns']:
        sections.append("--- DROPDOWN MENUS ---")
        for idx, dd in enumerate(dom_data['dropdowns'], 1):
            sections.append(f"\n{idx}. {describe_dropdown(dd)}")
        sections.append("")
    
    # Tables
    if dom_data['tables']:
        sections.append("--- DATA TABLES ---")
        for idx, table in enumerate(dom_data['tables'], 1):
            sections.append(f"\n{idx}. {describe_table(table)}")
        sections.append("")
    
    # Modals
    if dom_data['modals']:
        sections.append("--- MODAL DIALOGS ---")
        sections.append(f"Detected {len(dom_data['modals'])} modal(s)")
        sections.append("")
    
    # Validations
    if dom_data['validations']:
        sections.append("--- VALIDATION RULES ---")
        for idx, val in enumerate(dom_data['validations'], 1):
            sections.append(f"{idx}. {describe_validation(val)}")
        sections.append("")
    
    # User flows
    if dom_data['user_flows']:
        sections.append("--- DETECTED USER FLOWS ---")
        for idx, flow in enumerate(dom_data['user_flows'], 1):
            sections.append(f"\n{idx}. {flow['name']}")
            sections.append(f"   Steps:")
            for step_idx, step in enumerate(flow['steps'], 1):
                sections.append(f"   {step_idx}. {step}")
        sections.append("")
    
    return "\n".join(sections)


def describe_input(inp):
    """Create human-readable description of input field."""
    parts = []
    
    # Type and label
    field_type = inp['type'].upper() if inp['type'] != 'text' else 'Text'
    parts.append(f"{field_type} Input Field")
    
    # Identification
    if inp['id']:
        parts.append(f"\n   ID: {inp['id']}")
    if inp['name']:
        parts.append(f"\n   Name: {inp['name']}")
    if inp['placeholder']:
        parts.append(f"\n   Placeholder: \"{inp['placeholder']}\"")
    if inp['data_testid']:
        parts.append(f"\n   Test ID: {inp['data_testid']}")
    
    # Validation rules
    rules = []
    if inp['required']:
        rules.append("Required")
    if inp['pattern']:
        rules.append(f"Pattern: {inp['pattern']}")
    if inp['min_length']:
        rules.append(f"Min Length: {inp['min_length']}")
    if inp['max_length']:
        rules.append(f"Max Length: {inp['max_length']}")
    
    if rules:
        parts.append(f"\n   Validation: {', '.join(rules)}")
    
    return "".join(parts)


def describe_button(btn):
    """Create human-readable description of button."""
    parts = []
    
    # Button text/label
    text = btn['text'] or btn['aria_label'] or 'Unlabeled Button'
    parts.append(f"Button: \"{text}\"")
    
    # Identification
    if btn['id']:
        parts.append(f"\n   ID: {btn['id']}")
    if btn['type'] and btn['type'] != 'button':
        parts.append(f"\n   Type: {btn['type']}")
    if btn['data_testid']:
        parts.append(f"\n   Test ID: {btn['data_testid']}")
    
    # State
    if btn['disabled']:
        parts.append(f"\n   State: Disabled")
    
    return "".join(parts)


def describe_form(form):
    """Create human-readable description of form."""
    parts = []
    
    parts.append(f"Form")
    if form['id']:
        parts.append(f" (ID: {form['id']})")
    
    parts.append(f"\n   Method: {form['method']}")
    if form['action']:
        parts.append(f"\n   Action: {form['action']}")
    parts.append(f"\n   Contains: {form['input_count']} input(s), {form['button_count']} button(s)")
    
    return "".join(parts)


def describe_dropdown(dd):
    """Create human-readable description of dropdown."""
    parts = []
    
    parts.append(f"Dropdown")
    if dd['id']:
        parts.append(f" (ID: {dd['id']})")
    if dd['name']:
        parts.append(f" (Name: {dd['name']})")
    
    if dd['options']:
        parts.append(f"\n   Options ({len(dd['options'])}): {', '.join(dd['options'][:5])}")
        if len(dd['options']) > 5:
            parts.append("...")
    
    return "".join(parts)


def describe_table(table):
    """Create human-readable description of table."""
    parts = []
    
    parts.append(f"Data Table")
    if table['id']:
        parts.append(f" (ID: {table['id']})")
    
    parts.append(f"\n   Rows: {table['row_count']}")
    if table['headers']:
        parts.append(f"\n   Columns: {', '.join(table['headers'][:5])}")
    
    return " ".join(parts)


def describe_validation(val):
    """Create human-readable description of validation rule."""
    if val['type'] == 'email_validation':
        return f"Email Format Validation ({val['count']} field(s))"
    elif val['type'] == 'required_fields':
        return f"Required Field Validation ({val['count']} field(s))"
    elif val['type'] == 'pattern_validation':
        return f"Pattern Validation for '{val['field']}': {val['pattern']}"
    else:
        return val.get('description', 'Unknown validation')


def create_test_context(dom_data, user_requirement):
    """
    Create comprehensive test context for Gemini prompt.
    
    Args:
        dom_data: DOM extraction dictionary
        user_requirement: User's testing requirement
        
    Returns:
        str: Complete context for test generation
    """
    english_description = convert_to_english(dom_data)
    
    context = f"""
{english_description}

=== USER TESTING REQUIREMENTS ===
{user_requirement}

=== TEST GENERATION CONTEXT ===
Based on the above page structure and requirements, generate comprehensive test cases that cover:
1. All interactive elements
2. All validation rules
3. All identified user flows
4. Positive and negative scenarios
5. Boundary value testing
6. Error handling
"""
    
    return context
