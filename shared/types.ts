export type LocatorType = 'id' | 'css' | 'xpath' | 'name' | 'className' | 'linkText' | 'partialLinkText' | 'tagName';

export interface ElementDefinition {
    id: string;
    name: string; // e.g., "username_input"
    locatorType: LocatorType;
    locatorValue: string;
    description?: string;
    tagName?: string; // e.g., "input", "button", "a"
    attributes?: Record<string, string | boolean | null>; // Store extra attributes like type, placeholder, required
}

export interface PageDefinition {
    id: string;
    name: string; // e.g., "LoginPage"
    elements: ElementDefinition[];
}

export interface TestStep {
    id: string;
    action: 'navigate' | 'click' | 'input' | 'assert_text' | 'assert_visible';
    pageId?: string; // Reference to a PageDefinition
    elementId?: string; // Reference to an ElementDefinition
    value?: string; // For input or assertions
    description: string;
}

export interface TestCase {
    id: string;
    name: string; // e.g., "test_valid_login"
    type: 'smoke' | 'functional' | 'negative' | 'security' | 'performance' | 'accessibility' | 'integration' | 'regression';
    steps: TestStep[];
}

export interface ProjectConfig {
    projectName: string;
    baseUrl: string;
    browser: 'chrome' | 'firefox' | 'edge' | 'all';
    headless?: boolean;
    defaultTimeout?: number;
    retries?: number;
    retryDelay?: number;
    frameworkType: 'pytest-selenium' | 'pytest-playwright' | 'javascript-playwright';
}

export interface AutomationProject {
    config: ProjectConfig;
    pages: PageDefinition[];
    tests: TestCase[];
}

// For JSZip integration
declare global {
    interface Window {
        JSZip: any;
        saveAs: any;
    }
}
