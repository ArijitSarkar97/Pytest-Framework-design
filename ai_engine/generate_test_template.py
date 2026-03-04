"""
CLI for Template-Based Test Generation (No API Required)
"""

import argparse
import sys
from template_test_generator import generate_tests_without_api


def main():
    parser = argparse.ArgumentParser(
        description='Generate comprehensive tests without AI API - uses templates'
    )
    parser.add_argument('--dom-json', required=True, help='Pre-extracted DOM structure as JSON string')
    parser.add_argument('--test-types', required=True, help='Comma-separated test types: smoke,functional,negative,security,performance,accessibility,integration,regression')
    parser.add_argument('--page-name', default='Login', help='Page name for generated classes')
    
    args = parser.parse_args()
    
    # Parse DOM data and test types
    import json
    dom_data = json.loads(args.dom_json)
    test_types = [t.strip() for t in args.test_types.split(',')]
    
    try:
        print("=" * 60, file=sys.stderr)
        print("TEMPLATE-BASED TEST GENERATION (NO API REQUIRED)", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        print(f"URL: {dom_data.get('url', 'N/A')}", file=sys.stderr)
        print(f"Test Types: {', '.join(test_types)}", file=sys.stderr)
        print(f"Page Name: {args.page_name}", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        print(file=sys.stderr)
        
        test_suite = generate_tests_without_api(
            dom_data=dom_data,
            test_types=test_types,
            page_name=args.page_name
        )
        
        print("\n" + "=" * 60, file=sys.stderr)
        print("GENERATED TEST SUITE", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        print(test_suite)
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
