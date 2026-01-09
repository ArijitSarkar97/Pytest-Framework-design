import { TEST_PATTERNS } from './testPatterns';
import { AutomationProject, PageDefinition, TestCase, ElementDefinition } from "../types";

// --- SelectorsHub Strategy Constants ---
const ATTRIBUTE_PRIORITY = [
    'id',
    'name',
    'data-testid',
    'data-test',
    'data-cy',
    'placeholder',
    'aria-label',
    'title',
    'alt', // for images
    'class' // lowest priority due to multi-class and duplication issues
];

const INTERACTIVE_TAGS = ['input', 'button', 'a', 'select', 'textarea'];

// --- Helper: Clean Text ---
const cleanText = (text: string | null): string => {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
};

// --- Helper: Generate variable name from string ---
const generateVarName = (base: string, tag: string): string => {
    let name = base.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
    if (!name) name = `element_${Math.floor(Math.random() * 1000)}`;
    return `${name}_${tag}`; // e.g., "submit_button"
};

// --- Helper: Generate Relative XPath (Dependent/Independent) ---
const generateRelativeXPath = (el: Element, doc: Document): { value: string, score: number } | null => {
    // Strategy: Find a unique sibling or parent-sibling (anchor)
    const tag = el.tagName.toLowerCase();

    // 1. Preceding Sibling with Text (e.g., Label -> Input)
    let sibling = el.previousElementSibling;
    while (sibling) {
        const text = cleanText(sibling.textContent);
        if (text && text.length > 2) {
            const anchorXpath = `//${sibling.tagName.toLowerCase()}[normalize-space()='${text}']`;
            if (evaluateXpath(anchorXpath, doc) === 1) {
                // Check if this anchor + following-sibling identifies our element uniquely
                const relativeXpath = `${anchorXpath}/following-sibling::${tag}`;
                if (evaluateXpath(relativeXpath, doc) === 1) {
                    return { value: relativeXpath, score: 95 }; // Very high confidence for dependent elements
                }
            }
        }
        sibling = sibling.previousElementSibling;
    }

    // 2. Parent's Sibling (e.g., Product Title -> Price in a card)
    const parent = el.parentElement;
    if (parent) {
        // Look inside the same parent for a unique element (Anchor)
        const siblings = Array.from(parent.children).filter(c => c !== el);
        for (const sib of siblings) {
            const text = cleanText(sib.textContent);
            if (text && text.length > 2 && text.length < 50) {
                const anchorXpath = `//${sib.tagName.toLowerCase()}[normalize-space()='${text}']`;
                if (evaluateXpath(anchorXpath, doc) === 1) {
                    // We found a unique anchor in the same container.
                    // Now construct path from anchor to el. 
                    // Simplest: parent of anchor -> child el? No, purely relative.
                    // //anchor/..//tag ?
                    const relativeXpath = `${anchorXpath}/..//${tag}`;
                    // Check if this locates our target exactly
                    // But we must be careful: if there are multiple 'tag' in that parent, this is vague.
                    if (evaluateXpath(relativeXpath, doc) === 1) {
                        return { value: relativeXpath, score: 92 }; // High score
                    }
                }
            }
        }
    }

    return null;
};

// --- Core Logic: Generate Robust Locator ---
const generateLocator = (el: Element, doc: Document): { type: 'id' | 'css' | 'xpath' | 'name' | 'linkText' | 'partialLinkText' | 'className' | 'tagName', value: string, score: number } => {
    const tag = el.tagName.toLowerCase();

    // 1. ID Strategy (Highest Priority)
    const id = el.getAttribute('id');
    if (id && !/\d/.test(id) && !/ext|gen/.test(id)) {
        if (doc.querySelectorAll(`#${id}`).length === 1) {
            return { type: 'id', value: id, score: 100 };
        }
    }

    // 2. Name Strategy (Input/Form elements mostly)
    const name = el.getAttribute('name');
    if (name) {
        if (doc.querySelectorAll(`[name="${name}"]`).length === 1) {
            return { type: 'name', value: name, score: 95 };
        }
    }

    // 3. Link Text (Only for <a>)
    const text = cleanText(el.textContent);
    if (tag === 'a' && text && text.length < 60) {
        const xpathLink = `//a[normalize-space()='${text}']`;
        if (evaluateXpath(xpathLink, doc) === 1) {
            return { type: 'linkText', value: text, score: 90 };
        }
    }

    // 4. Partial Link Text (Only for <a>)
    if (tag === 'a' && text && text.length > 5) {
        const partialText = text.substring(0, 15);
        const xpathPartial = `//a[contains(text(), '${partialText}')]`;
        if (evaluateXpath(xpathPartial, doc) === 1) {
            return { type: 'partialLinkText', value: partialText, score: 85 };
        }
    }

    // 5. CSS Selectors (Special attributes)
    for (const attr of ATTRIBUTE_PRIORITY) {
        if (['id', 'class', 'name'].includes(attr)) continue;
        const val = el.getAttribute(attr);
        if (val) {
            const selector = `${tag}[${attr}="${val}"]`;
            if (doc.querySelectorAll(selector).length === 1) {
                return { type: 'css', value: selector, score: 80 };
            }
        }
    }

    // 6. Class Name
    const className = el.getAttribute('class');
    if (className) {
        const classes = className.split(/\s+/).filter(c => c && !['btn', 'form-control', 'input'].includes(c));
        for (const c of classes) {
            try {
                if (doc.querySelectorAll(`.${c}`).length === 1) {
                    return { type: 'className', value: c, score: 75 };
                }
            } catch (e) { continue; }
        }
    }

    // 7. Tag Name
    if (doc.getElementsByTagName(tag).length === 1) {
        return { type: 'tagName', value: tag, score: 70 };
    }

    // 8. XPath (Text based, Relative, then Absolute)

    // A. Text XPath (for non-links)
    if (text && text.length > 2 && text.length < 60) {
        const xpathExact = `//${tag}[normalize-space()='${text}']`;
        const count = evaluateXpath(xpathExact, doc);
        if (count === 1) return { type: 'xpath', value: xpathExact, score: 60 };
        if (count > 1) {
            const result = doc.evaluate(xpathExact, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            for (let i = 0; i < result.snapshotLength; i++) {
                if (result.snapshotItem(i) === el) return { type: 'xpath', value: `(${xpathExact})[${i + 1}]`, score: 55 };
            }
        }
    }

    // B. Relative XPath
    const relative = generateRelativeXPath(el, doc);
    if (relative) return { type: 'xpath', value: relative.value, score: 50 };

    // C. Absolute/Indexed XPath (Fallback)
    return { type: 'xpath', value: getAbsoluteXPath(el), score: 10 };
};

// --- Helper: Evaluate XPath Count ---
const evaluateXpath = (xpath: string, doc: Document): number => {
    try {
        const result = doc.evaluate(xpath, doc, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        return result.snapshotLength;
    } catch (e) {
        return 0;
    }
};

// --- Helper: Absolute XPath (Fallback) ---
const getAbsoluteXPath = (element: Element): string => {
    if (element.id !== '') return `//*[@id="${element.id}"]`;
    if (element === document.body) return '/html/body';

    const parent = element.parentNode;
    if (!parent || parent.nodeType !== 1) return `/${element.tagName.toLowerCase()}`; // unlikely fallback

    const sameTagSiblings = Array.from(parent.childNodes).filter(node =>
        node.nodeType === 1 && (node as Element).tagName === element.tagName
    );

    if (sameTagSiblings.length === 1) {
        // Unique among siblings of same tag -> No index needed
        return `${getAbsoluteXPath(parent as Element)}/${element.tagName.toLowerCase()}`;
    }

    // Need indexing
    let ix = 0;
    const siblings = parent.childNodes;
    for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i] as Element;
        if (sibling === element) {
            return `${getAbsoluteXPath(parent as Element)}/${element.tagName.toLowerCase()}[${ix + 1}]`;
        }
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
    }
    return '';
};


// --- Main Service Function ---
export const analyzeDomAndGenerateSchema = async (
    html: string,
    url: string
): Promise<Partial<AutomationProject>> => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // --- Page Naming Logic (Smart Shortening) ---
    let derivedName = "HomePage";
    try {
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split('/').filter(p => p.length > 0);

        // Strategy 1: URL Path (Last meaningful segment)
        // Filter out segments that are just numbers or UUID-like strings
        const meaningfulSegments = pathSegments.filter(s => !/^\d+$/.test(s) && s.length < 30);

        if (meaningfulSegments.length > 0) {
            const lastSegment = meaningfulSegments[meaningfulSegments.length - 1];
            // Capitalize and clean
            derivedName = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/[^a-zA-Z0-9]/g, '');
        } else if (doc.title) {
            // Strategy 2: Title (First 3 words)
            const cleanTitle = doc.title.split(/[-|]/)[0].trim().replace(/[^a-zA-Z0-9\s]/g, '');
            const words = cleanTitle.split(/\s+/).filter(w => w.length > 2);
            derivedName = words.slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
        }

        // Final Safety: Truncate and Ensure Suffix
        if (!derivedName) derivedName = "HomePage";

        // Cap length at 20 chars (leaving room for 'Page' suffix = 24 chars)
        if (derivedName.length > 20) {
            derivedName = derivedName.substring(0, 20);
        }

        if (!derivedName.endsWith('Page')) derivedName += 'Page';

    } catch (e) {
        if (doc.title) {
            const simpleTitle = doc.title.replace(/[^a-zA-Z0-9]/g, '');
            derivedName = (simpleTitle.length > 15 ? simpleTitle.substring(0, 15) : simpleTitle) + "Page";
        }
    }

    const elements: ElementDefinition[] = [];
    const tests: TestCase[] = [];

    // Scrape Interactive Elements
    const nodes = doc.querySelectorAll(INTERACTIVE_TAGS.join(', '));

    nodes.forEach((el) => {
        // Filter out hidden input types or irrelevant elements
        if (el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'hidden') return;

        // Generate Locator
        const loc = generateLocator(el, doc);

        // Generate Name
        let nameBase = el.getAttribute('id') || el.getAttribute('name') || el.getAttribute('placeholder') || el.textContent || el.getAttribute('aria-label') || el.tagName;
        const name = generateVarName(cleanText(nameBase), el.tagName.toLowerCase());

        // Deduplicate
        if (!elements.find(e => e.name === name)) {
            elements.push({
                id: crypto.randomUUID(),
                name,
                locatorType: loc.type,
                locatorValue: loc.value,
                description: `Auto-generated for <${el.tagName.toLowerCase()}>`
            });
        }
    });

    // --- Intelligent Test Generation Logic ---
    const generatedTests: TestCase[] = [];
    const snakePage = derivedName.split(/(?=[A-Z])/).join('_').toLowerCase();

    // heuristic: Detect Login Flow
    const userInputs = elements.filter(e => e.name.includes('user') || e.name.includes('email') || e.name.includes('login'));
    const passInputs = elements.filter(e => e.name.includes('pass'));
    const submitBtns = elements.filter(e => e.name.includes('submit') || e.name.includes('login') || e.name.includes('sign_in'));

    if (userInputs.length > 0 && passInputs.length > 0 && submitBtns.length > 0) {
        generatedTests.push({
            id: crypto.randomUUID(),
            name: `test_${snakePage}_login_flow`,
            type: "smoke",
            steps: [
                { id: crypto.randomUUID(), action: 'input', value: 'standard_user', description: `Enter username into ${userInputs[0].name}` },
                { id: crypto.randomUUID(), action: 'input', value: 'secret_sauce', description: `Enter password into ${passInputs[0].name}` },
                { id: crypto.randomUUID(), action: 'click', value: '', description: `Click ${submitBtns[0].name}` },
                { id: crypto.randomUUID(), action: 'assert_visible', value: 'dashboard', description: 'Verify successful login location' }
            ]
        });
    }

    // heuristic: Detect Search Flow
    const searchInputs = elements.filter(e => e.name.includes('search') || e.name.includes('query'));
    if (searchInputs.length > 0) {
        generatedTests.push({
            id: crypto.randomUUID(),
            name: `test_${snakePage}_search`,
            type: "regression",
            steps: [
                { id: crypto.randomUUID(), action: 'input', value: 'Test Item', description: `Type search query in ${searchInputs[0].name}` },
                { id: crypto.randomUUID(), action: 'click', value: 'Enter', description: 'Submit search' },
                { id: crypto.randomUUID(), action: 'assert_visible', value: 'results', description: 'Verify results appear' }
            ]
        });
    }

    // If no specific flows detected, fallback to Generic Smoke
    if (generatedTests.length === 0 && elements.length > 0) {
        generatedTests.push({
            id: crypto.randomUUID(),
            name: `test_${snakePage}_basic_interactions`,
            type: "smoke",
            steps: elements.slice(0, 4).map(el => ({
                id: crypto.randomUUID(),
                action: el.name.includes('input') ? 'input' : 'click',
                value: el.name.includes('input') ? 'test_data' : undefined,
                description: `Interact with ${el.name}`
            }))
        });
    }

    // Add generated tests
    tests.push(...generatedTests);

    const pages: PageDefinition[] = [{
        id: crypto.randomUUID(),
        name: derivedName,
        elements
    }];

    return { pages, tests };
};
