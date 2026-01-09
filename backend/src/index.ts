import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import frameworkRoutes from './routes/frameworks';
// @ts-ignore
import puppeteer from 'puppeteer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/frameworks', frameworkRoutes);

// Helper endpoint to fetch raw HTML (bypass CORS / context for AI)
app.post('/api/fetch-url', async (req, res) => {
    const { url } = req.body;
    console.log(`[Backend] Fetching URL with Puppeteer: ${url}`);

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Set User Agent to avoid bot detection
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate and wait for network idle (simulates page load complete)
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Expand Shadow DOM and iFrames (Flattening for Analysis)
        // We use a raw string here to prevent TypeScript/esbuild from injecting
        // helper functions (like __name) that crash the browser execution context.
        await page.evaluate(`
            (function() {
                const flatten = (node) => {
                    // 1. Shadow DOM
                    if (node.shadowRoot) {
                        try {
                            const shadowHost = document.createElement('div');
                            shadowHost.setAttribute('data-shadow-host', 'true');
                            shadowHost.innerHTML = node.shadowRoot.innerHTML;
                            node.appendChild(shadowHost);
                            flatten(shadowHost); // Recurse
                        } catch (e) {
                            console.warn('Shadow DOM expansion failed', e);
                        }
                    }
                    
                    // 2. iFrames (Best Effort)
                    if (node.tagName === 'IFRAME') {
                        try {
                            const iframeDoc = node.contentDocument;
                            if (iframeDoc && iframeDoc.body) {
                                const iframeContent = document.createElement('div');
                                iframeContent.setAttribute('data-iframe-src', node.src || 'embedded');
                                iframeContent.innerHTML = iframeDoc.body.innerHTML;
                                node.parentElement?.appendChild(iframeContent);
                                flatten(iframeContent); // Recurse
                            }
                        } catch (e) {
                            console.warn('Cross-origin iframe access blocked');
                        }
                    }

                    // Recurse children
                    if (node.children) {
                        const children = Array.from(node.children);
                        children.forEach(child => flatten(child));
                    }
                };
                
                if (document.body) {
                    flatten(document.body);
                }
            })();
        `);

        // Get rendered HTML (now includes flattened shadow/iframe content)
        const html = await page.content();

        console.log(`[Backend] Fetched ${html.length} bytes`);
        res.json({ html });
    } catch (error) {
        console.error('[Backend] Puppeteer Fetch Error:', error);
        res.status(500).json({ error: String(error) });
    } finally {
        if (browser) await browser.close();
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend server is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api/frameworks`);
});
