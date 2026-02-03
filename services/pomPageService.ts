const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface PomPageSet {
    id: string;
    name: string;
    sourceUrl: string;
    createdAt: string;
    updatedAt: string;
    pages: Array<{
        id: string;
        name: string;
        elements: Array<{
            id: string;
            name: string;
            locatorType: string;
            locatorValue: string;
            description: string;
        }>;
    }>;
}

export const pomPageService = {
    getAll: async (): Promise<PomPageSet[]> => {
        const response = await fetch(`${API_URL}/api/pom-pages`);
        if (!response.ok) throw new Error('Failed to fetch POM sets');
        return response.json();
    },

    getById: async (id: string): Promise<PomPageSet> => {
        const response = await fetch(`${API_URL}/api/pom-pages/${id}`);
        if (!response.ok) throw new Error('Failed to fetch POM set');
        return response.json();
    },

    create: async (name: string, sourceUrl: string, pages: any[]): Promise<PomPageSet> => {
        const response = await fetch(`${API_URL}/api/pom-pages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, sourceUrl, pages })
        });
        if (!response.ok) throw new Error('Failed to create POM set');
        return response.json();
    },

    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_URL}/api/pom-pages/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete POM set');
    }
};
