/**
 * Backend DOM Extraction Service  
 * Uses Cheerio for fast HTML parsing (jQuery-like API for Node.js)
 */

import * as cheerio from 'cheerio';

interface ElementData {
    id: string;
    name: string;
    type?: string;
    placeholder?: string;
    text?: string;
    href?: string;
    locator: string;
    locator_type: string;
}

interface DomData {
    url: string;
    title: string;
    inputs: ElementData[];
    buttons: ElementData[];
    links: ElementData[];
}

// Helper: Clean text
const cleanText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
};

// Helper: Generate variable name
const generateVarName = (base: string, tag: string): string => {
    let name = base.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
    if (!name) name = `element_${Math.floor(Math.random() * 1000)}`;
    if (/^\d/.test(name)) name = `el_${name}`;
    return `${name}_${tag}`;
};

/**
 * Extract DOM structure from HTML using Cheerio
 */
export async function extractDomFromHtml(html: string, url: string): Promise<DomData> {
    const $ = cheerio.load(html);
    const title = $('title').text() || 'Page';

    const inputs: ElementData[] = [];
    const buttons: ElementData[] = [];
    const links: ElementData[] = [];

    // Extract inputs
    $('input:not([type="hidden"])').each((_idx, el) => {
        const $el = $(el);
        const id = $el.attr('id') || '';
        const name = $el.attr('name') || '';
        const type = $el.attr('type') || 'text';
        const placeholder = $el.attr('placeholder') || '';

        const varName = generateVarName(
            id || name || placeholder || type,
            'input'
        );

        // Generate locator
        let locator = '';
        let locator_type = 'css';

        if (id && $(`#${id}`).length === 1) {
            locator = id;
            locator_type = 'id';
        } else if (name) {
            locator = name;
            locator_type = 'name';
        } else if (placeholder) {
            locator = `input[placeholder="${placeholder}"]`;
        } else {
            locator = `input[type="${type}"]`;
        }

        inputs.push({
            id: id || varName,
            name: varName,
            type,
            placeholder,
            locator,
            locator_type
        });
    });

    // Extract buttons
    $('button, input[type="submit"], input[type="button"]').each((_idx, el) => {
        const $el = $(el);
        const id = $el.attr('id') || '';
        const text = cleanText($el.text() || $el.attr('value') || '');
        const type = $el.attr('type') || 'button';

        const varName = generateVarName(
            id || text || type,
            'button'
        );

        let locator = '';
        let locator_type = 'css';

        if (id && $(`#${id}`).length === 1) {
            locator = id;
            locator_type = 'id';
        } else if (text && text.length > 0) {
            // For cheerio, we'll use a CSS selector since :contains() isn't standard
            locator = `button, input[type="submit"], input[type="button"]`;
            locator_type = 'css';
        } else {
            locator = `button[type="${type}"], input[type="${type}"]`;
        }

        buttons.push({
            id: id || varName,
            name: varName,
            text,
            locator,
            locator_type
        });
    });

    // Extract links
    $('a[href]').each((_idx, el) => {
        const $el = $(el);
        const href = $el.attr('href') || '#';
        const text = cleanText($el.text());
        const id = $el.attr('id') || '';

        if (!text || text.length < 2) return; // Skip empty links

        const varName = generateVarName(text || href, 'link');

        let locator = '';
        let locator_type = 'css';

        if (id && $(`#${id}`).length === 1) {
            locator = id;
            locator_type = 'id';
        } else if (text) {
            locator = text;
            locator_type = 'linkText';
        } else {
            locator = `a[href="${href}"]`;
        }

        links.push({
            id: id || varName,
            name: varName,
            text,
            href,
            locator,
            locator_type
        });
    });

    return {
        url,
        title,
        inputs,
        buttons,
        links
    };
}
