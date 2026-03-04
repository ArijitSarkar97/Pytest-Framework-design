import argparse
import json
import sys
from rag_helper import capture_page_context, ask_gemini_to_write_test

def main():
    parser = argparse.ArgumentParser(description='Generate Selenium tests using RAG (Visual + DOM).')
    parser.add_argument('--url', required=True, help='Target URL')
    parser.add_argument('--requirement', required=True, help='User requirement for the test')
    parser.add_argument('--api-key', required=False, help='Gemini API Key')
    
    args = parser.parse_args()

    try:
        # 1. Capture Context
        # print(f"Capturing context for {args.url}...", file=sys.stderr)
        interactive_elements, screenshot_path = capture_page_context(args.url)
        
        # print("Context captured. Querying Gemini...", file=sys.stderr)
        
        # 2. Generate Test
        # Convert elements to JSON string for the prompt
        dom_json = json.dumps(interactive_elements, indent=2)
        
        test_code = ask_gemini_to_write_test(
            dom_json=dom_json,
            screenshot_path=screenshot_path,
            user_requirement=args.requirement,
            api_key=args.api_key
        )
        
        if test_code:
            print(test_code) # Output only the code to stdout
        else:
            print("Error: No code generated.", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
