import { AutomationProject } from '../types';


const getApiUrl = () => {
    // Falls back to localhost for local dev if env var not set
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const API_BASE_URL = `${getApiUrl()}/api/frameworks`;


export interface SavedFramework {
    id: string;
    name: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    projectName: string;
    baseUrl: string;
    browser: string;
    headless: boolean;
    totalPages: number;
    totalTests: number;
    lastUrls: string[];
}

// Convert backend format to frontend AutomationProject if needed
// The backend stores the project structure, we might need to map it back 
// if the explicit 'project' field isn't returned exactly as expected.
// Based on the controller, 'project' is flattened into the Framework model.
// We need a helper to reconstruct AutomationProject from the backend response.

export const mapFrameworkToProject = (framework: any): AutomationProject => {
    return {
        config: {
            projectName: framework.projectName,
            baseUrl: framework.baseUrl,
            browser: framework.browser,
            headless: framework.headless
        },
        pages: framework.pages.map((p: any) => ({
            name: p.name,
            elements: p.elements.map((e: any) => ({
                name: e.name,
                locatorType: e.locatorType,
                locatorValue: e.locatorValue,
                description: e.description
            }))
        })),
        tests: framework.tests.map((t: any) => ({
            name: t.name,
            type: t.type,
            steps: t.steps.sort((a: any, b: any) => a.order - b.order).map((s: any) => ({
                action: s.action,
                description: s.description,
                value: s.value,
                pageId: s.pageId,
                elementId: s.elementId
            }))
        }))
    };
};

export const apiService = {
    getAll: async (): Promise<SavedFramework[]> => {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) throw new Error('Failed to fetch frameworks');
        return response.json();
    },

    getById: async (id: string): Promise<{ framework: SavedFramework, project: AutomationProject }> => {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch framework');
        const data = await response.json();
        return {
            framework: data, // The raw data includes metadata
            project: mapFrameworkToProject(data)
        };
    },

    create: async (name: string, project: AutomationProject, lastUrls: string[]): Promise<SavedFramework> => {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, project, lastUrls })
        });
        if (!response.ok) throw new Error('Failed to create framework');
        return response.json();
    },

    update: async (id: string, name: string, project: AutomationProject, lastUrls: string[]): Promise<SavedFramework> => {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, project, lastUrls })
        });
        if (!response.ok) throw new Error('Failed to update framework');
        return response.json();
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete framework');
    },

    fetchPageDom: async (url: string): Promise<string> => {
        // Note: calling /api/fetch-url (sibling to /api/frameworks)
        const response = await fetch(`${getApiUrl()}/api/fetch-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        if (!response.ok) {
            // Fallback: if backend fetch fails, return empty string so AI just tries to guess
            // or we could throw. Let's return empty to be graceful? 
            // No, user explicitly requested "inspect DOM", so throwing is better.
            const err = await response.json().catch(() => ({ error: 'Unknown fetch error' }));
            throw new Error(err.error || 'Failed to fetch page DOM');
        }
        const data = await response.json();
        return data.html || '';
    }
};
