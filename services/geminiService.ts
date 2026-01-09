import { GoogleGenAI, Type } from "@google/genai";
import { AutomationProject, PageDefinition, TestCase } from "../types";

export const analyzeUrlAndGenerateSchema = async (
  url: string,
  context: string = "",
  apiKey: string,
  htmlContent: string = ""
): Promise<Partial<AutomationProject>> => {
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-1.5-pro"; // Upgraded model for better context handling

  const prompt = `
    You are a Senior QA Automation Architect and an expert in using **SelectorsHub** and **PyTest**. 
    Analyze the following website context and HTML DOM structure to generate a Page Object Model (POM) structure.
    
    Target URL: ${url}
    Additional Context: ${context}
    
    ${htmlContent ? `
    IMPORTANT: Here is the actual HTML DOM content of the page. 
    USE THIS DOM to derive the locators. Do NOT guess. Use the visible elements and their attributes from this HTML.
    
    --- START OF HTML DOM ---
    ${htmlContent.substring(0, 50000)}
    --- END OF HTML DOM ---
    ` : 'No DOM content provided, please infer structure from URL and standard patterns.'}

    I need you to generate **EXACT, ROBUST, and UNIQUE** web elements based on the provided DOM.
    
    Rules:
    1. Create logical Page Objects (e.g., LoginPage, HomePage, DashboardPage).
       - If HTML is provided, map the elements found in the HTML to the page object.
    2. **Locators (True SelectorsHub Strategy)**: 
       - **Golden Rule**: Stability & Uniqueness > Shortness.
       - **Attribute Priority**:
         1. **ID** (if stable, e.g., 'id="user"'). IGNORE if dynamic (contains numbers/random strings like 'id="ext-gen124"').
         2. **Name** (e.g., 'name="email"').
         3. **Class** (only if specific/unique, e.g., 'class="login-btn"'). Avoid generic classes like 'class="btn btn-primary"'.
         4. **Placeholder** (e.g., 'placeholder="Enter Password"').
         5. **Data Attributes** (e.g., 'data-test', 'data-cy', 'data-testid' - HIGH PRIORITY if present).
         6. **Aria-label** (e.g., 'aria-label="Submit"').
         7. **Title** / **Alt** (for images).
       - **XPath Strategy**:
         - **Text**: Use '//tag[normalize-space()="Text"]' to handle whitespace.
         - **Contains**: Use '//tag[contains(@attr, "partial")]' for attributes with dynamic prefixes/suffixes.
         - **Axes (Crucial)**: If direct attributes are missing/dynamic, use axes relative to a stable neighbor: '//label[text()="Email"]/following-sibling::input'.
       - **CSS Strategy**:
         - Use 'tag#id', 'tag.class', or 'tag[attr="val"]'.
         - Use '>' for direct children to be precise: 'div.header > nav > a'.
       - **Strictly AVOID**: Absolute XPaths ('/html/body...') and fragile indices ('div[3]') unless absolutely necessary.
       - **Output**: Ensure "locatorValue" is the *exact, ready-to-use* string.
    3. Define realistic test cases (e.g., valid login, invalid login, navigation check).
    4. Return ONLY JSON.
  `;

  // Define the expected output schema explicitly
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "ClassName like LoginPage" },
                elements: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: "Variable name like username_input" },
                      locatorType: { type: Type.STRING, enum: ["id", "css", "xpath", "name"] },
                      locatorValue: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["name", "locatorType", "locatorValue"]
                  }
                }
              },
              required: ["name", "elements"]
            }
          },
          tests: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Function name like test_login_success" },
                type: { type: Type.STRING, enum: ["smoke", "regression"] },
                stepsDescription: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Plain text steps for the user to review" }
              },
              required: ["name", "type", "stepsDescription"]
            }
          }
        },
        required: ["pages", "tests"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  try {
    const data = JSON.parse(text);

    // Map response to our internal types with IDs
    const pages: PageDefinition[] = data.pages.map((p: any) => ({
      id: crypto.randomUUID(),
      name: p.name,
      elements: p.elements.map((e: any) => ({
        id: crypto.randomUUID(),
        name: e.name,
        locatorType: e.locatorType,
        locatorValue: e.locatorValue,
        description: e.description
      }))
    }));

    // We convert the AI's "stepsDescription" into a simplified placeholder structure
    // fully detailed steps are hard to auto-guess without DOM access, so we create generic steps
    const tests: TestCase[] = data.tests.map((t: any) => ({
      id: crypto.randomUUID(),
      name: t.name,
      type: t.type,
      steps: t.stepsDescription.map((desc: string) => ({
        id: crypto.randomUUID(),
        action: 'input', // Default fallback
        description: desc,
        value: 'DATA_PLACEHOLDER'
      }))
    }));

    return { pages, tests };
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Failed to generate valid project structure.");
  }
};
