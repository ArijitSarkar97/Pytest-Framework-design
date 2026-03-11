import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fetch from 'node-fetch';
import { extractDomFromHtml } from '../services/domService';
import { analyzeDomAndGenerateSchema } from '../services/domAnalysisService';

const router = express.Router();

// Helper function to map TypeScript DOM format to Python-compatible format
function mapDomDataForPython(tsData: any, url: string) {
    const page = tsData.pages?.[0];
    if (!page) {
        return {
            url,
            title: '',
            inputs: [],
            buttons: [],
            links: []
        };
    }

    const elements = page.elements || [];

    return {
        url,
        title: page.name || '',
        inputs: elements
            .filter((el: any) => el.tagName === 'input' || el.tagName === 'textarea' || el.tagName === 'select')
            .map((el: any) => ({
                id: el.attributes?.id || el.name.split('_input')[0],
                type: el.attributes?.type || 'text',
                name: el.attributes?.name || el.name,
                placeholder: el.attributes?.placeholder || '',
                required: !!el.attributes?.required,
                disabled: !!el.attributes?.disabled,
                pattern: el.attributes?.pattern || null,
                min_length: el.attributes?.min || null,
                max_length: el.attributes?.max || null,
                data_testid: el.attributes?.dataTestId || null,
                locator: el.locatorValue,
                locator_type: el.locatorType
            })),
        buttons: elements
            .filter((el: any) => el.tagName === 'button' || el.attributes?.type === 'submit' || el.name.includes('button'))
            .map((el: any) => ({
                id: el.attributes?.id || el.name.split('_button')[0],
                text: el.description || el.attributes?.value || el.name,
                name: el.name,
                type: el.attributes?.type || 'button',
                disabled: !!el.attributes?.disabled,
                data_testid: el.attributes?.dataTestId || null,
                aria_label: el.attributes?.ariaLabel || null,
                locator: el.locatorValue,
                locator_type: el.locatorType
            })),
        links: elements
            .filter((el: any) => el.tagName === 'a')
            .map((el: any) => ({
                text: el.attributes?.title || el.description,
                href: el.attributes?.href || '#',
                name: el.name,
                locator: el.locatorValue,
                locator_type: el.locatorType
            })),
        dropdowns: [], // Not explicitly separated in current service, mapped to inputs/buttons usually or ignored
        forms: [],     // Not extracting form tags yet
        tables: [],    // Not extracting tables yet
        modals: [],    // Not extracting modals yet
        validations: [],
        user_flows: []
    };
}

// Existing RAG endpoint (legacy)
router.post('/generate', async (req, res) => {
    const { url, requirement, apiKey } = req.body;

    if (!url || !requirement) {
        return res.status(400).json({ error: 'URL and requirement are required' });
    }

    try {
        const scriptPath = path.resolve(process.cwd(), '../ai_engine/generate_test.py');
        const pythonPath = path.resolve(process.cwd(), '../venv/bin/python');

        const args = [
            scriptPath,
            '--url', url,
            '--requirement', requirement
        ];

        if (apiKey) {
            args.push('--api-key', apiKey);
        }

        console.log(`Executing RAG with: ${pythonPath} ${scriptPath}`);
        const pythonProcess = spawn(pythonPath, args);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                console.error(`Stderr: ${errorString}`);
                return res.status(500).json({ error: 'Failed to generate test', details: errorString });
            }

            res.json({ code: dataString });
        });

    } catch (error) {
        console.error('Error executing RAG generation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// NEW: Comprehensive knowledge-based test generation
router.post('/generate-comprehensive', async (req, res) => {
    const { url, requirement, frameworkType, apiKey } = req.body;

    if (!url || !requirement) {
        return res.status(400).json({ error: 'URL and requirement are required' });
    }

    try {
        const scriptPath = path.resolve(process.cwd(), '../ai_engine/generate_test_comprehensive.py');
        const pythonPath = path.resolve(process.cwd(), '../venv/bin/python');

        const args = [
            scriptPath,
            '--url', url,
            '--requirement', requirement
        ];

        if (frameworkType) {
            args.push('--framework-type', frameworkType);
        }

        if (apiKey) {
            args.push('--api-key', apiKey);
        }

        console.log(`Executing Comprehensive Test Generation: ${pythonPath} ${scriptPath}`);
        const pythonProcess = spawn(pythonPath, args);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            // Log progress to console, but still accumulate
            console.log(`[Progress] ${data.toString()}`);
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                console.error(`Stderr: ${errorString}`);
                return res.status(500).json({
                    error: 'Failed to generate comprehensive tests',
                    details: errorString
                });
            }

            res.json({ code: dataString });
        });

    } catch (error) {
        console.error('Error executing comprehensive test generation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// NEW: API-Free Template-based test generation
router.post('/generate-template', async (req, res) => {
    const { url, testTypes, pageName, frameworkType } = req.body;

    console.log('[DEBUG] Received template generation request:', { url, testTypes, pageName, frameworkType });

    const missingParams = [];
    if (!url) missingParams.push('url');
    if (!testTypes) missingParams.push('testTypes');
    if (!pageName) missingParams.push('pageName');

    if (missingParams.length > 0) {
        console.error('[ERROR] Missing parameters:', missingParams);
        return res.status(400).json({
            error: `Missing required parameters: ${missingParams.join(', ')}`,
            received: { url, testTypes, pageName }
        });
    }

    try {
        // Step 1: Fetch HTML content
        console.log(`[1/3] Fetching HTML from ${url}...`);
        const htmlResponse = await fetch(url);
        const html = await htmlResponse.text();

        // Step 2: Extract DOM using TypeScript service
        console.log('[2/3] Extracting DOM with domAnalysisService...');
        const tsdomData = await analyzeDomAndGenerateSchema(html, url);

        // Step 3: Map to Python-compatible format
        const pythonDom = mapDomDataForPython(tsdomData, url);
        console.log(`Extracted ${pythonDom.inputs.length} inputs, ${pythonDom.buttons.length} buttons, ${pythonDom.links.length} links`);

        // Step 4: Prepare Python script execution
        const scriptPath = path.resolve(process.cwd(), '../ai_engine/generate_test_template.py');
        const pythonPath = path.resolve(process.cwd(), '../venv/bin/python');

        const args = [
            scriptPath,
            '--dom-json', JSON.stringify(pythonDom),
            '--test-types', testTypes,
            '--page-name', pageName
        ];

        if (frameworkType) {
            args.push('--framework-type', frameworkType);
        }

        console.log(`[3/3] Executing Template Generation: ${pythonPath} ${scriptPath}`);
        console.log(`[DEBUG] Args log excluded (too large)`);
        const pythonProcess = spawn(pythonPath, args);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.log(`[Template Progress] ${data.toString()}`);
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                console.error(`Stderr: ${errorString}`);
                return res.status(500).json({
                    error: 'Failed to generate template tests',
                    details: errorString
                });
            }

            res.json({
                code: dataString,
                tests: tsdomData.tests || []
            });
        });

    } catch (error) {
        console.error('Error executing template generation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
