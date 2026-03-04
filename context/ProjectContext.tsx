import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { AutomationProject, PageDefinition, TestCase, ElementDefinition } from '../shared/types';
import { analyzeDomAndGenerateSchema } from '../services/domAnalysisService';
import { generatePyTestFramework } from '../services/pyGenerator';
import {
    apiService,
    type SavedFramework
} from '../services/apiService';
import { pomPageService, type PomPageSet } from '../services/pomPageService';
import ToastContainer, { type ToastMessage, type ToastType } from '../components/Toast';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// --- Default State ---
export const INITIAL_PROJECT: AutomationProject = {
    config: {
        projectName: 'MyAutomationProject',
        baseUrl: 'https://example.com',
        browser: 'chrome',
        headless: true,
    },
    pages: [],
    tests: []
};

export type TabType = 'ai' | 'pages' | 'tests' | 'preview' | 'frameworks' | 'pomsets' | 'rag' | 'runner' | 'analytics';

interface ProjectContextType {
    // Project State
    project: AutomationProject;
    setProject: React.Dispatch<React.SetStateAction<AutomationProject>>;

    // Tab State
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;

    // Generation State
    isGenerating: boolean;
    setIsGenerating: (v: boolean) => void;
    generationMode: 'pom' | 'framework';
    setGenerationMode: (mode: 'pom' | 'framework') => void;

    // URL State
    aiUrls: string[];
    setAiUrls: React.Dispatch<React.SetStateAction<string[]>>;
    handleUrlChange: (index: number, value: string) => void;
    handleAddUrl: () => void;
    handleRemoveUrl: (index: number) => void;

    // AI Context
    aiContext: string;
    setAiContext: (v: string) => void;
    testDataFile: File | null;
    setTestDataFile: (f: File | null) => void;

    // Framework Management
    savedFrameworks: SavedFramework[];
    setSavedFrameworks: React.Dispatch<React.SetStateAction<SavedFramework[]>>;
    activeFrameworkId: string | null;
    setActiveFrameworkId: (id: string | null) => void;
    frameworkName: string;
    setFrameworkName: (name: string) => void;
    handleSaveFramework: (forceNew?: boolean) => Promise<void>;
    handleLoadFramework: (id: string) => Promise<void>;
    handleDeleteFramework: (id: string) => Promise<void>;
    handleExportFramework: (id: string) => Promise<void>;
    handleImportFramework: (event: React.ChangeEvent<HTMLInputElement>) => void;

    // POM Management
    savedPomSets: PomPageSet[];
    setSavedPomSets: React.Dispatch<React.SetStateAction<PomPageSet[]>>;
    pomSetName: string;
    setPomSetName: (name: string) => void;
    handleSavePomSet: () => Promise<void>;
    handleLoadPomSet: (id: string) => Promise<void>;
    handleDeletePomSet: (id: string) => Promise<void>;

    // AI Generation
    handleAiGenerate: () => Promise<void>;

    // RAG State
    ragUrl: string;
    setRagUrl: (v: string) => void;
    ragTestTypes: string[];
    setRagTestTypes: React.Dispatch<React.SetStateAction<string[]>>;
    ragApiKey: string;
    setRagApiKey: (v: string) => void;
    ragStrategy: 'ai' | 'template';
    setRagStrategy: (s: 'ai' | 'template') => void;
    ragLog: string;
    setRagLog: (v: string) => void;
    ragCode: string;
    setRagCode: (v: string) => void;
    ragTests: TestCase[];
    setRagTests: React.Dispatch<React.SetStateAction<TestCase[]>>;
    ragViewMode: 'code' | 'scenarios';
    setRagViewMode: (v: 'code' | 'scenarios') => void;
    handleTestTypeToggle: (type: string) => void;
    handleRagGenerate: () => Promise<void>;

    // Preview State
    previewFiles: Map<string, string>;
    selectedPreviewFile: string;
    setSelectedPreviewFile: (path: string) => void;
    fileTree: TreeNode[];

    // Download
    handleDownload: () => Promise<void>;

    // Toast
    showToast: (type: ToastType, message: string) => void;
}

// Tree types (re-exported for components)
export interface TreeNode {
    name: string;
    path: string;
    children?: TreeNode[];
}

export const buildFileTree = (paths: string[]): TreeNode[] => {
    const root: TreeNode[] = [];

    paths.forEach(path => {
        const parts = path.split('/');
        let currentLevel = root;

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1;
            let existingNode = currentLevel.find(n => n.name === part);

            if (!existingNode) {
                existingNode = {
                    name: part,
                    path: isFile ? path : '',
                    children: isFile ? undefined : []
                };
                currentLevel.push(existingNode);
            }

            if (!isFile && existingNode.children) {
                currentLevel = existingNode.children;
            }
        });
    });

    const sortNodes = (nodes: TreeNode[]) => {
        nodes.sort((a, b) => {
            if (a.children && !b.children) return -1;
            if (!a.children && b.children) return 1;
            return a.name.localeCompare(b.name);
        });
        nodes.forEach(n => {
            if (n.children) sortNodes(n.children);
        });
    };

    sortNodes(root);
    return root;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjectContext = () => {
    const ctx = useContext(ProjectContext);
    if (!ctx) throw new Error('useProjectContext must be used within ProjectProvider');
    return ctx;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Core State
    const [project, setProject] = useState<AutomationProject>(INITIAL_PROJECT);
    const [activeTab, setActiveTab] = useState<TabType>('ai');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationMode, setGenerationMode] = useState<'pom' | 'framework'>('framework');

    // URL State
    const [aiUrls, setAiUrls] = useState<string[]>(['']);
    const [aiContext, setAiContext] = useState('');
    const [testDataFile, setTestDataFile] = useState<File | null>(null);

    // Preview State
    const [previewFiles, setPreviewFiles] = useState<Map<string, string>>(new Map());
    const [selectedPreviewFile, setSelectedPreviewFile] = useState<string>('');

    // Framework Management State
    const [savedFrameworks, setSavedFrameworks] = useState<SavedFramework[]>([]);
    const [activeFrameworkId, setActiveFrameworkId] = useState<string | null>(null);
    const [frameworkName, setFrameworkName] = useState('');

    // POM Pages State
    const [savedPomSets, setSavedPomSets] = useState<PomPageSet[]>([]);
    const [pomSetName, setPomSetName] = useState('');

    // RAG State
    const [ragUrl, setRagUrl] = useState('');
    const [ragTestTypes, setRagTestTypes] = useState<string[]>(['smoke', 'functional', 'negative']);
    const [ragApiKey, setRagApiKey] = useState('');
    const [ragStrategy, setRagStrategy] = useState<'ai' | 'template'>('template');
    const [ragLog, setRagLog] = useState('');
    const [ragCode, setRagCode] = useState('');
    const [ragTests, setRagTests] = useState<TestCase[]>([]);
    const [ragViewMode, setRagViewMode] = useState<'code' | 'scenarios'>('code');

    // Toast State
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const showToast = useCallback((type: ToastType, message: string) => {
        const id = Date.now().toString() + Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, type, message }]);
    }, []);
    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // URL Validation
    const isValidUrl = (url: string): boolean => {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    };

    // --- URL Handlers ---
    const handleUrlChange = (index: number, value: string) => {
        const newUrls = [...aiUrls];
        newUrls[index] = value;
        setAiUrls(newUrls);

        // Clear all previously generated data when URL changes
        setProject(prev => ({
            ...prev,
            pages: [],
            tests: [],
        }));
        setPreviewFiles(new Map());
        setSelectedPreviewFile('');
        setActiveFrameworkId(null);
    };

    const handleAddUrl = () => {
        setAiUrls([...aiUrls, '']);
    };

    const handleRemoveUrl = (index: number) => {
        if (aiUrls.length > 1) {
            const newUrls = aiUrls.filter((_, i) => i !== index);
            setAiUrls(newUrls);
        }
    };

    // --- Load saved frameworks and POM sets on mount ---
    useEffect(() => {
        const fetchFrameworks = async () => {
            try {
                const frameworks = await apiService.getAll();
                setSavedFrameworks(frameworks);

                const persistedId = localStorage.getItem('activeFrameworkId');
                if (persistedId) {
                    try {
                        const { framework, project } = await apiService.getById(persistedId);
                        setProject(project);
                        setFrameworkName(framework.name);
                        setActiveFrameworkId(persistedId);
                        if (framework.lastUrls && framework.lastUrls.length > 0) {
                            setAiUrls(framework.lastUrls);
                        }
                    } catch (e) {
                        console.error("Could not load active framework", e);
                        localStorage.removeItem('activeFrameworkId');
                    }
                }
            } catch (error) {
                console.error('Failed to load frameworks:', error);
            }
        };

        const fetchPomSets = async () => {
            try {
                const pomSets = await pomPageService.getAll();
                setSavedPomSets(pomSets);
            } catch (error) {
                console.error('Failed to load POM sets:', error);
            }
        };

        fetchFrameworks();
        fetchPomSets();
    }, []);

    // --- Framework Management ---
    const handleSaveFramework = async (forceNew: boolean = false) => {
        const name = frameworkName || `Framework_${new Date().toLocaleDateString()}`;
        const validUrls = aiUrls.filter(url => url.trim());

        if (activeFrameworkId && !forceNew) {
            await apiService.update(activeFrameworkId, name, project, validUrls);
            const frameworks = await apiService.getAll();
            setSavedFrameworks(frameworks);
            showToast('success', `Framework "${name}" updated successfully!`);
        } else {
            const saved = await apiService.create(name, project, validUrls);
            setSavedFrameworks(prev => [saved, ...prev]);
            setActiveFrameworkId(saved.id);
            localStorage.setItem('activeFrameworkId', saved.id);
            showToast('success', `Framework "${name}" saved successfully!`);
        }
    };

    const handleLoadFramework = async (id: string) => {
        try {
            const { framework, project } = await apiService.getById(id);
            setProject(project);
            setActiveFrameworkId(id);
            localStorage.setItem('activeFrameworkId', id);
            setFrameworkName(framework.name);

            if (framework.lastUrls && framework.lastUrls.length > 0) {
                setAiUrls(framework.lastUrls);
            }

            setActiveTab('pages');
            showToast('success', 'Framework loaded successfully!');
        } catch (error) {
            showToast('error', 'Failed to load framework');
            console.error(error);
        }
    };

    const handleDeleteFramework = async (id: string) => {
        if (confirm('Are you sure you want to delete this framework?')) {
            try {
                await apiService.delete(id);
                setSavedFrameworks(prev => prev.filter(f => f.id !== id));
                if (activeFrameworkId === id) {
                    setActiveFrameworkId(null);
                    localStorage.removeItem('activeFrameworkId');
                    setProject(INITIAL_PROJECT);
                }
            } catch (error) {
                showToast('error', 'Failed to delete framework');
                console.error(error);
            }
        }
    };

    const handleExportFramework = async (id: string) => {
        try {
            const { framework, project } = await apiService.getById(id);

            const exportData = {
                name: framework.name,
                project: project,
                version: framework.version,
                createdAt: framework.createdAt
            };

            const json = JSON.stringify(exportData, null, 2);

            const zip = new JSZip();
            const files = generatePyTestFramework(project, generationMode);

            files.forEach((content: string, path: string) => {
                zip.file(path, content);
            });

            const content = await zip.generateAsync({ type: "blob" });
            const filename = `${framework.name}_export.zip`;
            saveAs(content, filename);
        } catch (error) {
            showToast('error', 'Failed to export framework');
            console.error(error);
        }
    };

    const handleImportFramework = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            let importedData: any;

            if (file.name.endsWith('.zip')) {
                const zip = new JSZip();
                const loadedZip = await zip.loadAsync(file);
                const jsonFile = loadedZip.file('framework_export.json');

                if (!jsonFile) {
                    const files = Object.keys(loadedZip.files);
                    const jsonName = files.find(f => f.endsWith('.json') && !loadedZip.files[f].dir);
                    if (!jsonName) {
                        throw new Error('No framework JSON found in ZIP');
                    }
                    const jsonContent = await loadedZip.file(jsonName)?.async('string');
                    if (jsonContent) importedData = JSON.parse(jsonContent);
                } else {
                    const jsonContent = await jsonFile.async('string');
                    importedData = JSON.parse(jsonContent);
                }
            } else {
                const text = await file.text();
                importedData = JSON.parse(text);
            }

            if (!importedData || !importedData.project || !importedData.name) {
                throw new Error('Invalid framework structure');
            }

            const saved = await apiService.create(
                importedData.name + " (Imported)",
                importedData.project,
                []
            );

            setSavedFrameworks(prev => [saved, ...prev]);
            showToast('success', `Framework "${importedData.name}" imported successfully!`);
        } catch (error) {
            showToast('error', 'Failed to import framework. Invalid file format or server error.');
            console.error(error);
        }

        event.target.value = '';
    };

    // --- POM Management ---
    const handleSavePomSet = async () => {
        const validUrls = aiUrls.filter(url => url.trim());
        if (project.pages.length === 0) {
            showToast('warning', 'No pages to save. Generate pages first using the AI Architect.');
            return;
        }

        const name = pomSetName || `POM_${new Date().toLocaleString()}`;
        const sourceUrl = validUrls[0] || project.config.baseUrl;

        try {
            const saved = await pomPageService.create(name, sourceUrl, project.pages);
            setSavedPomSets(prev => [saved, ...prev]);
            setPomSetName('');
            showToast('success', `POM Pages "${name}" saved successfully!`);
        } catch (error) {
            showToast('error', 'Failed to save POM pages');
            console.error(error);
        }
    };

    const handleLoadPomSet = async (id: string) => {
        try {
            const pomSet = await pomPageService.getById(id);
            const loadedPages: PageDefinition[] = pomSet.pages.map((p: any) => ({
                id: p.id,
                name: p.name,
                elements: p.elements.map((e: any) => ({
                    id: e.id,
                    name: e.name,
                    locatorType: e.locatorType as any,
                    locatorValue: e.locatorValue,
                    description: e.description
                }))
            }));

            setProject(prev => ({
                ...prev,
                pages: [...prev.pages, ...loadedPages]
            }));

            if (pomSet.sourceUrl) {
                setAiUrls([pomSet.sourceUrl]);
            }

            setActiveTab('pages');
            showToast('success', `POM Pages loaded successfully! ${loadedPages.length} pages added.`);
        } catch (error) {
            showToast('error', 'Failed to load POM pages');
            console.error(error);
        }
    };

    const handleDeletePomSet = async (id: string) => {
        if (confirm('Are you sure you want to delete this POM set?')) {
            try {
                await pomPageService.delete(id);
                setSavedPomSets(prev => prev.filter(ps => ps.id !== id));
                showToast('success', 'POM set deleted successfully');
            } catch (error) {
                showToast('error', 'Failed to delete POM set');
                console.error(error);
            }
        }
    };

    // --- AI Generation ---
    const handleAiGenerate = async () => {
        const validUrls = aiUrls.filter(url => url.trim() !== '');

        if (validUrls.length === 0) {
            showToast('warning', 'Please enter at least one application URL');
            return;
        }
        setIsGenerating(true);
        try {
            const allPages: PageDefinition[] = [];
            const allTests: TestCase[] = [];

            for (const url of validUrls) {
                let htmlContent = "";
                try {
                    htmlContent = await apiService.fetchPageDom(url);
                    console.log(`Fetched DOM for ${url}: ${htmlContent.length} chars`);

                    const result = await analyzeDomAndGenerateSchema(htmlContent, url);

                    if (result.pages) allPages.push(...result.pages);
                    if (generationMode === 'framework' && result.tests) {
                        allTests.push(...result.tests);
                    }
                } catch (e) {
                    console.warn(`Failed to process ${url}`, e);
                    const msg = e instanceof Error ? e.message : String(e);
                    showToast('error', `Error processing ${url}: ${msg}`);
                }
            }

            if (generationMode === 'pom') {
                const name = pomSetName || `POM_${Date.now()}`;
                const sourceUrl = validUrls[0];

                try {
                    const saved = await pomPageService.create(name, sourceUrl, allPages);
                    setSavedPomSets(prev => [saved, ...prev]);
                    setPomSetName('');

                    setProject(prev => ({
                        ...prev,
                        config: { ...prev.config, baseUrl: validUrls[0] },
                        pages: allPages,
                        tests: []
                    }));

                    showToast('success', `POM Pages "${name}" saved successfully to POM Library!`);
                    setActiveTab('pomsets');
                } catch (err) {
                    console.error("Failed to save POM pages:", err);
                    showToast('error', 'Failed to save POM pages. Please try again.');
                }
            } else {
                let finalPages = allPages;
                let finalTests = allTests;

                if (activeFrameworkId) {
                    finalPages = [...project.pages, ...allPages];
                    finalTests = [...project.tests, ...allTests];
                }

                const newProject = {
                    ...project,
                    config: { ...project.config, baseUrl: validUrls[0] },
                    pages: finalPages,
                    tests: finalTests
                };

                setProject(newProject);

                try {
                    if (activeFrameworkId) {
                        await apiService.update(activeFrameworkId, frameworkName, newProject, validUrls);
                        showToast('success', `Framework "${frameworkName}" updated successfully!`);
                    } else {
                        const saved = await apiService.create(
                            frameworkName || `Framework_${Date.now()}`,
                            newProject,
                            validUrls
                        );
                        setActiveFrameworkId(saved.id);
                        localStorage.setItem('activeFrameworkId', saved.id);
                        setSavedFrameworks(prev => [saved, ...prev]);
                        showToast('success', `Framework "${saved.name}" saved successfully!`);
                    }

                    const frameworks = await apiService.getAll();
                    setSavedFrameworks(frameworks);
                    setActiveTab('frameworks');
                } catch (err) {
                    console.error("Auto-save failed:", err);
                    showToast('warning', 'Framework generated but failed to save to backend. Check console for details.');
                    setActiveTab('pages');
                }
            }
        } catch (error) {
            showToast('error', 'Failed to generate structure. Please check the URLs.');
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- RAG Handlers ---
    const handleTestTypeToggle = (type: string) => {
        setRagTestTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const handleRagGenerate = async () => {
        if (!ragUrl) {
            showToast('warning', 'Please provide a URL');
            return;
        }
        if (ragTestTypes.length === 0) {
            showToast('warning', 'Please select at least one test type');
            return;
        }
        setIsGenerating(true);
        setRagCode('');

        try {
            if (ragStrategy === 'template') {
                setRagLog('Running Template Engine... Investigating DOM patterns...');
                let derivedName = 'GeneratedPage';
                try {
                    const urlObj = new URL(ragUrl);
                    const pathSegments = urlObj.pathname.split('/').filter(p => p.trim() !== '');
                    if (pathSegments.length > 0) {
                        derivedName = pathSegments[pathSegments.length - 1];
                        derivedName = derivedName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
                    } else {
                        derivedName = urlObj.hostname.replace(/[^a-zA-Z0-9_-]/g, "_");
                    }
                } catch (e) {
                    console.warn('Could not parse URL for page name, using default', e);
                }

                if (!derivedName || derivedName.trim() === '') derivedName = 'TestPage';

                console.log('[FRONTEND] Calls generateTemplateTest with:', {
                    url: ragUrl,
                    testTypes: ragTestTypes.join(','),
                    pageName: derivedName
                });
                const resp = await apiService.generateTemplateTest(ragUrl, ragTestTypes.join(','), derivedName);
                setRagCode(resp.code);
                setRagTests(resp.tests || []);
                if (resp.tests && resp.tests.length > 0) {
                    setRagViewMode('scenarios');
                }
                setRagLog(`⚡️ Generated instantly using Template Engine! (${(resp.tests || []).length} scenarios found)`);
            } else {
                setRagLog('Initializing AI Agent... Capturing page context (Screenshots + DOM)...');
                const requirement = `Generate ${ragTestTypes.join(', ')} tests`;
                const code = await apiService.generateComprehensiveTest(ragUrl, requirement, ragApiKey);
                setRagCode(code);
                setRagLog('✨ Generated using AI Reasoning!');
            }
        } catch (e) {
            console.error(e);
            setRagLog(`Error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Preview Files ---
    useEffect(() => {
        if (activeTab === 'preview') {
            const files = generatePyTestFramework(project, generationMode);
            setPreviewFiles(files);
            if (!selectedPreviewFile || !files.has(selectedPreviewFile)) {
                const allFiles = Array.from(files.keys());
                const preferred = allFiles.find(f => f.startsWith('tests/test_') && !f.includes('__init__')) ||
                    allFiles.find(f => f.startsWith('pages/') && !f.includes('base_page') && !f.includes('__init__')) ||
                    allFiles[0];

                setSelectedPreviewFile(preferred || '');
            }
        }
    }, [activeTab, project, generationMode]);

    const fileTree = useMemo(() => {
        return buildFileTree(Array.from(previewFiles.keys()));
    }, [previewFiles]);

    // --- Download ---
    const handleDownload = async () => {
        const zip = new JSZip();
        const files = generatePyTestFramework(project, generationMode);

        const rootFolder = zip.folder(project.config.projectName);

        if (rootFolder) {
            files.forEach((content: string, path: string) => {
                rootFolder.file(path, content);
            });
        }

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `${project.config.projectName}_framework.zip`);
    };

    const value: ProjectContextType = {
        project, setProject,
        activeTab, setActiveTab,
        isGenerating, setIsGenerating,
        generationMode, setGenerationMode,
        aiUrls, setAiUrls, handleUrlChange, handleAddUrl, handleRemoveUrl,
        aiContext, setAiContext,
        testDataFile, setTestDataFile,
        savedFrameworks, setSavedFrameworks,
        activeFrameworkId, setActiveFrameworkId,
        frameworkName, setFrameworkName,
        handleSaveFramework, handleLoadFramework, handleDeleteFramework,
        handleExportFramework, handleImportFramework,
        savedPomSets, setSavedPomSets,
        pomSetName, setPomSetName,
        handleSavePomSet, handleLoadPomSet, handleDeletePomSet,
        handleAiGenerate,
        ragUrl, setRagUrl,
        ragTestTypes, setRagTestTypes,
        ragApiKey, setRagApiKey,
        ragStrategy, setRagStrategy,
        ragLog, setRagLog,
        ragCode, setRagCode,
        ragTests, setRagTests,
        ragViewMode, setRagViewMode,
        handleTestTypeToggle, handleRagGenerate,
        previewFiles, selectedPreviewFile, setSelectedPreviewFile, fileTree,
        handleDownload,
        showToast,
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ProjectContext.Provider>
    );
};
