import assert from 'assert';
import { describe, it, before, after } from 'node:test';

const API_URL = 'http://localhost:3001/api/frameworks';

// Simple fetch wrapper since we are in Node 20+ context or using tsx
async function request(path: string, options: any = {}) {
    // Extract custom options so they aren't passed to fetch
    const { suppressLog, ...fetchOptions } = options;
    const res = await fetch(`${API_URL}${path}`, fetchOptions);

    if (path !== '' && !res.ok && fetchOptions.method !== 'DELETE' && !suppressLog) {
        // Log errors unless suppressed (e.g. for expected negative tests)
        console.error(`Request to ${path} failed: ${res.status} ${res.statusText}`);
    }
    return res;
}

describe('E2E API Flow: Framework Lifecycle', () => {
    let frameworkId: string;
    const testFramework = {
        name: "E2E Test Framework",
        project: {
            config: {
                projectName: "E2E_Project",
                baseUrl: "https://e2e-test.com",
                browser: "chrome",
                headless: true
            },
            pages: [],
            tests: []
        },
        lastUrls: ["https://e2e-test.com"]
    };

    it('should create a new framework', async () => {
        const res = await request('', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testFramework)
        });

        assert.strictEqual(res.status, 201);
        const data: any = await res.json();
        assert.ok(data.id, 'Framework should have an ID');
        assert.strictEqual(data.name, testFramework.name);

        frameworkId = data.id;
        console.log(`Created Framework ID: ${frameworkId}`);
    });

    it('should fetch the created framework by ID', async () => {
        assert.ok(frameworkId, 'Framework ID required');

        const res = await request(`/${frameworkId}`);
        assert.strictEqual(res.status, 200);

        const data: any = await res.json();
        assert.strictEqual(data.id, frameworkId);
        assert.strictEqual(data.name, testFramework.name);
    });

    it('should update the framework', async () => {
        assert.ok(frameworkId, 'Framework ID required');

        const updatedName = "E2E Test Framework (Updated)";
        const res = await request(`/${frameworkId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...testFramework,
                name: updatedName
            })
        });

        assert.strictEqual(res.status, 200);
        const data: any = await res.json();
        assert.strictEqual(data.name, updatedName);
    });

    it('should show up in the list of all frameworks', async () => {
        const res = await request('');
        assert.strictEqual(res.status, 200);

        const list = (await res.json()) as any[];
        assert.ok(Array.isArray(list), 'Response should be an array');
        const found = list.find((f: any) => f.id === frameworkId);
        assert.ok(found, 'Created framework should be in the list');
    });

    it('should delete the framework', async () => {
        assert.ok(frameworkId, 'Framework ID required');

        const res = await request(`/${frameworkId}`, {
            method: 'DELETE'
        });
        assert.strictEqual(res.status, 200);
    });

    it('should not find the deleted framework', async () => {
        // Retrieve framework with suppressLog: true since we EXPECT a 404
        const res = await request(`/${frameworkId}`, { suppressLog: true });
        assert.strictEqual(res.status, 404, 'Deleted framework should assume 404 not found');
    });
});
