import { AutomationProject } from '../types';

export interface SavedFramework {
    id: string;
    name: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    project: AutomationProject;
    metadata: {
        totalPages: number;
        totalTests: number;
        lastUrls: string[];
    };
}

export interface FrameworkHistory {
    frameworks: SavedFramework[];
    activeFrameworkId: string | null;
}

const STORAGE_KEY = 'pytest_framework_history';
const MAX_FRAMEWORKS = 20; // Keep last 20 frameworks

export const getFrameworkHistory = (): FrameworkHistory => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : { frameworks: [], activeFrameworkId: null };
    } catch (error) {
        console.error('Error reading framework history:', error);
        return { frameworks: [], activeFrameworkId: null };
    }
};

export const saveFramework = (
    framework: AutomationProject,
    name: string,
    urls: string[] = []
): SavedFramework => {
    const history = getFrameworkHistory();

    const saved: SavedFramework = {
        id: crypto.randomUUID(),
        name: name || `Framework_${new Date().toLocaleDateString()}`,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        project: framework,
        metadata: {
            totalPages: framework.pages.length,
            totalTests: framework.tests.length,
            lastUrls: urls
        }
    };

    history.frameworks.push(saved);
    history.activeFrameworkId = saved.id;

    // Keep only MAX_FRAMEWORKS most recent
    if (history.frameworks.length > MAX_FRAMEWORKS) {
        history.frameworks = history.frameworks.slice(-MAX_FRAMEWORKS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return saved;
};

export const loadFramework = (id: string): AutomationProject | null => {
    const history = getFrameworkHistory();
    const saved = history.frameworks.find(f => f.id === id);

    if (saved) {
        history.activeFrameworkId = id;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        return saved.project;
    }

    return null;
};

export const updateFramework = (
    id: string,
    project: AutomationProject,
    urls: string[] = []
): boolean => {
    const history = getFrameworkHistory();
    const index = history.frameworks.findIndex(f => f.id === id);

    if (index === -1) return false;

    const existing = history.frameworks[index];
    history.frameworks[index] = {
        ...existing,
        version: existing.version + 1,
        updatedAt: new Date().toISOString(),
        project,
        metadata: {
            totalPages: project.pages.length,
            totalTests: project.tests.length,
            lastUrls: urls
        }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return true;
};

export const deleteFramework = (id: string): boolean => {
    const history = getFrameworkHistory();
    const initialLength = history.frameworks.length;

    history.frameworks = history.frameworks.filter(f => f.id !== id);

    if (history.activeFrameworkId === id) {
        history.activeFrameworkId = null;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return history.frameworks.length < initialLength;
};

export const setActiveFramework = (id: string | null): void => {
    const history = getFrameworkHistory();
    history.activeFrameworkId = id;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

export const getActiveFramework = (): SavedFramework | null => {
    const history = getFrameworkHistory();
    if (!history.activeFrameworkId) return null;

    return history.frameworks.find(f => f.id === history.activeFrameworkId) || null;
};

export const exportFramework = (id: string): Blob | null => {
    const history = getFrameworkHistory();
    const framework = history.frameworks.find(f => f.id === id);

    if (!framework) return null;

    const json = JSON.stringify(framework, null, 2);
    return new Blob([json], { type: 'application/json' });
};

export const importFramework = (jsonString: string): SavedFramework | null => {
    try {
        const framework: SavedFramework = JSON.parse(jsonString);

        // Validate structure
        if (!framework.project || !framework.name) {
            throw new Error('Invalid framework structure');
        }

        // Generate new ID and timestamps
        framework.id = crypto.randomUUID();
        framework.createdAt = new Date().toISOString();
        framework.updatedAt = new Date().toISOString();

        const history = getFrameworkHistory();
        history.frameworks.push(framework);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

        return framework;
    } catch (error) {
        console.error('Error importing framework:', error);
        return null;
    }
};
