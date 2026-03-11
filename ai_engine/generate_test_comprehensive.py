"""
Comprehensive Test Case Generator - CLI Entry Point
Integrates DOM extraction, English conversion, and knowledge base for intelligent test generation.
"""

import argparse
import sys
from test_case_generator import generate_comprehensive_tests


def main():
    parser = argparse.ArgumentParser(
        description='Generate comprehensive test cases using knowledge-based AI approach'
    )
    parser.add_argument('--url', required=True, help='Target webpage URL')
    parser.add_argument('--requirement', required=True, help='Testing requirements')
    parser.add_argument('--framework-type', required=False, default='pytest-selenium', help='Framework type (pytest-selenium or pytest-playwright)')
    parser.add_argument('--api-key', required=False, help='Gemini API key (optional if env var set)')
    
    args = parser.parse_args()
    
    try:
        print(f"Generating comprehensive tests for: {args.url} using {args.framework_type}", file=sys.stderr)
        print(f"Requirement: {args.requirement}", file=sys.stderr)
        print("-" * 60, file=sys.stderr)
        
        test_code = generate_comprehensive_tests(
            url=args.url,
            user_requirement=args.requirement,
            framework_type=args.framework_type,
            api_key=args.api_key
        )
        
        # Output test code to stdout (captured by backend)
        print(test_code)
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
