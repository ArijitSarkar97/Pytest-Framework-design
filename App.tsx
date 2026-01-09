import React, { useState, useEffect, useMemo } from 'react';
import { AutomationProject, PageDefinition, TestCase, ElementDefinition } from './types';
import { analyzeDomAndGenerateSchema } from './services/domAnalysisService';
import { generatePyTestFramework } from './services/pyGenerator';
import {
  apiService,
  mapFrameworkToProject,
  type SavedFramework
} from './services/apiService';
import {
  Bot, Layout, Code2, Play, Download, Settings,
  Plus, Trash2, FileJson, ChevronRight, Loader2, Database, AlertCircle,
  Folder, FolderOpen, File, FileCode, FileText, Save, Upload, Clock
} from 'lucide-react';

// --- Default State ---
const INITIAL_PROJECT: AutomationProject = {
  config: {
    projectName: 'MyAutomationProject',
    baseUrl: 'https://example.com',
    browser: 'chrome',
    headless: true,
  },
  pages: [],
  tests: []
};

// --- Tree Helper ---
interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
}

const buildFileTree = (paths: string[]): TreeNode[] => {
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
          path: isFile ? path : '', // Folders don't strictly need paths for this UI, but useful for keys
          children: isFile ? undefined : []
        };
        currentLevel.push(existingNode);
      }

      if (!isFile && existingNode.children) {
        currentLevel = existingNode.children;
      }
    });
  });

  // Sort: Folders first, then files alphabetically
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

// --- Tree Component ---
interface FileTreeNodeProps {
  node: TreeNode;
  level: number;
  selectedFile: string;
  onSelect: (path: string) => void;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, level, selectedFile, onSelect }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isFolder = !!node.children;
  const isSelected = !isFolder && node.path === selectedFile;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-3 cursor-pointer select-none transition-colors border-l-2 ${isSelected
          ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500'
          : 'hover:bg-slate-800 text-slate-400 border-transparent'
          }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => {
          if (isFolder) setIsOpen(!isOpen);
          else onSelect(node.path);
        }}
      >
        <span className="opacity-70">
          {isFolder ? (
            isOpen ? <FolderOpen size={16} className="text-indigo-400" /> : <Folder size={16} className="text-slate-500" />
          ) : (
            <FileIcon name={node.name} />
          )}
        </span>
        <span className={`text-sm truncate ${isSelected ? 'font-medium text-indigo-100' : ''}`}>{node.name}</span>
      </div>
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.name + child.path}
              node={child}
              level={level + 1}
              selectedFile={selectedFile}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileIcon = ({ name }: { name: string }) => {
  if (name.endsWith('.py')) return <FileCode size={16} className="text-blue-400" />;
  if (name.endsWith('.json')) return <FileJson size={16} className="text-yellow-400" />;
  if (name.endsWith('.ini') || name.endsWith('.txt')) return <FileText size={16} className="text-slate-400" />;
  return <File size={16} className="text-slate-500" />;
};


const App: React.FC = () => {
  const [project, setProject] = useState<AutomationProject>(INITIAL_PROJECT);
  const [activeTab, setActiveTab] = useState<'setup' | 'ai' | 'pages' | 'tests' | 'preview' | 'frameworks'>('ai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiUrls, setAiUrls] = useState<string[]>(['']); // Support multiple URLs
  const [aiContext, setAiContext] = useState('');
  // Removed: const [apiKey, setApiKey] = useState(''); -> No longer needed!
  const [testDataFile, setTestDataFile] = useState<File | null>(null); // For data-driven testing
  const [previewFiles, setPreviewFiles] = useState<Map<string, string>>(new Map());
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<string>('');

  // Framework Management State
  const [savedFrameworks, setSavedFrameworks] = useState<SavedFramework[]>([]);
  const [activeFrameworkId, setActiveFrameworkId] = useState<string | null>(null);
  const [frameworkName, setFrameworkName] = useState('');

  // URL Management Handlers
  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...aiUrls];
    newUrls[index] = value;
    setAiUrls(newUrls);
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

  // Load saved frameworks on mount
  useEffect(() => {
    const fetchFrameworks = async () => {
      try {
        const frameworks = await apiService.getAll();
        setSavedFrameworks(frameworks);

        // Restore active framework from localStorage if preserved
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
            localStorage.removeItem('activeFrameworkId'); // Clear invalid ID
          }
        }
      } catch (error) {
        console.error('Failed to load frameworks:', error);
      }
    };

    fetchFrameworks();
  }, []);

  // Framework Management Handlers
  const handleSaveFramework = async (forceNew: boolean = false) => {
    const name = frameworkName || `Framework_${new Date().toLocaleDateString()}`;
    const validUrls = aiUrls.filter(url => url.trim());

    if (activeFrameworkId && !forceNew) {
      // Update existing
      await apiService.update(activeFrameworkId, name, project, validUrls);
      const frameworks = await apiService.getAll();
      setSavedFrameworks(frameworks);
      alert(`Framework "${name}" updated successfully!`);
    } else {
      // Save new
      const saved = await apiService.create(name, project, validUrls);
      setSavedFrameworks(prev => [saved, ...prev]);
      setActiveFrameworkId(saved.id);
      localStorage.setItem('activeFrameworkId', saved.id);
      alert(`Framework "${name}" saved successfully!`);
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
      alert('Framework loaded successfully!');
    } catch (error) {
      alert('Failed to load framework');
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
        alert('Failed to delete framework');
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
      const blob = new Blob([json], { type: 'application/json' });
      const filename = `${framework.name}_export.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export framework');
      console.error(error);
    }
  };

  const handleImportFramework = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);

        if (!importedData.project || !importedData.name) {
          throw new Error('Invalid framework structure');
        }

        const saved = await apiService.create(
          importedData.name + " (Imported)",
          importedData.project,
          []
        );

        setSavedFrameworks(prev => [saved, ...prev]);
        alert(`Framework "${importedData.name}" imported successfully!`);
      } catch (error) {
        alert('Failed to import framework. Invalid file format or server error.');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  // AI Generation Handler
  const handleAiGenerate = async () => {
    const validUrls = aiUrls.filter(url => url.trim() !== '');

    if (validUrls.length === 0) {
      alert("Please enter at least one application URL");
      return;
    }
    // No API check needed
    setIsGenerating(true);
    try {
      // Process all URLs and aggregate results
      const allPages: PageDefinition[] = [];
      const allTests: TestCase[] = [];

      for (const url of validUrls) {
        let htmlContent = "";
        try {
          htmlContent = await apiService.fetchPageDom(url);
          console.log(`Fetched DOM for ${url}: ${htmlContent.length} chars`);

          // Use LOCAL heuristic engine instead of AI
          const result = await analyzeDomAndGenerateSchema(htmlContent, url);

          if (result.pages) allPages.push(...result.pages);
          if (result.tests) allTests.push(...result.tests);
        } catch (e) {
          console.warn(`Failed to process ${url}`, e);
          const msg = e instanceof Error ? e.message : String(e);
          alert(`Error processing ${url}: ${msg}`);
        }
      }

      // Merge with existing if active framework
      let finalPages = allPages;
      let finalTests = allTests;

      if (activeFrameworkId) {
        // Merge with existing framework
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

      setProject(newProject);

      // Auto-save to Backend
      try {
        if (activeFrameworkId) {
          await apiService.update(activeFrameworkId, frameworkName, newProject, validUrls);
        } else {
          const saved = await apiService.create(
            frameworkName || `Framework_${Date.now()}`,
            newProject,
            validUrls
          );
          setActiveFrameworkId(saved.id);
          localStorage.setItem('activeFrameworkId', saved.id);
          setSavedFrameworks(prev => [saved, ...prev]);
        }

        // Refresh list to hold strict sync
        const frameworks = await apiService.getAll();
        setSavedFrameworks(frameworks);
      } catch (err) {
        console.error("Auto-save failed:", err);
        // Don't block UI if auto-save fails
      }



      setActiveTab('pages'); // Move to pages to review
    } catch (error) {
      alert("Failed to generate structure. Please check the URLs or API Key.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Files for Preview
  useEffect(() => {
    if (activeTab === 'preview') {
      const files = generatePyTestFramework(project);
      setPreviewFiles(files);
      // Select the first file (usually requirements or init) or main test file if available
      if (!selectedPreviewFile || !files.has(selectedPreviewFile)) {
        // Prefer test file or readme
        const firstFile = files.keys().next().value || '';
        setSelectedPreviewFile(firstFile);
      }
    }
  }, [activeTab, project]);

  const fileTree = useMemo(() => {
    return buildFileTree(Array.from(previewFiles.keys()));
  }, [previewFiles]);

  // Download Handler
  const handleDownload = async () => {
    if (!window.JSZip) {
      alert("JSZip library not loaded.");
      return;
    }
    const zip = new window.JSZip();
    const files = generatePyTestFramework(project);

    // Create folder structure
    const rootFolder = zip.folder(project.config.projectName);

    files.forEach((content, path) => {
      rootFolder.file(path, content);
    });

    const content = await zip.generateAsync({ type: "blob" });
    window.saveAs(content, `${project.config.projectName}_framework.zip`);
  };

  // --- Render Helpers ---

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col fixed h-full z-10 shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
          <Bot className="w-8 h-8 text-indigo-500" />
          <h1 className="font-bold text-xl tracking-tight">PyTest<span className="text-indigo-500">AI</span></h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem
            active={activeTab === 'ai'}
            onClick={() => setActiveTab('ai')}
            icon={<Bot size={20} />}
            label="AI Architect"
          />
          <SidebarItem
            active={activeTab === 'setup'}
            onClick={() => setActiveTab('setup')}
            icon={<Settings size={20} />}
            label="Project Setup"
          />
          <SidebarItem
            active={activeTab === 'pages'}
            onClick={() => setActiveTab('pages')}
            icon={<Layout size={20} />}
            label="Page Objects"
            badge={project.pages.length}
          />
          <SidebarItem
            active={activeTab === 'tests'}
            onClick={() => setActiveTab('tests')}
            icon={<Play size={20} />}
            label="Test Cases"
            badge={project.tests.length}
          />
          <SidebarItem
            active={activeTab === 'preview'}
            onClick={() => setActiveTab('preview')}
            icon={<Code2 size={20} />}
            label="Code Preview"
          />
          <SidebarItem
            active={activeTab === 'frameworks'}
            onClick={() => setActiveTab('frameworks')}
            icon={<Database size={20} />}
            label="Saved Frameworks"
            badge={savedFrameworks.length}
          />
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
          {activeFrameworkId ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleSaveFramework(false)}
                className="flex-1 flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-all text-sm">
                <Save size={16} />
                Update
              </button>
              <button
                onClick={() => handleSaveFramework(true)}
                className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-medium transition-all text-sm"
                title="Save as New Framework">
                <Plus size={16} />
                New
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleSaveFramework(false)}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-all">
              <Save size={18} />
              Save Framework
            </button>
          )}

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-all shadow-lg shadow-indigo-900/20">
            <Download size={18} />
            Download ZIP
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8 bg-slate-900 overflow-y-auto">
        <div className="max-w-6xl mx-auto">

          {/* AI Architect Tab */}
          {activeTab === 'ai' && (
            <div className="animate-fade-in space-y-8">
              <div className="text-center space-y-4 mb-12">
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                  AI-Powered Automation Architect
                </h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                  Enter your application URL below. Our <b>Smart DOM Engine</b> (mimicking SelectorsHub) will analyze the page and generate robust, stable locators automatically. <span className="text-green-400 font-bold">No API Key Required.</span>
                </p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl shadow-xl backdrop-blur-sm">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Application URL</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Database className="h-5 w-5 text-slate-500" />
                      </div>
                      <input
                        type="url"
                        value={aiUrls[0]}
                        onChange={(e) => handleUrlChange(0, e.target.value)}
                        placeholder="https://your-app.com/login"
                        className="block w-full pl-10 bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    {/* Additional URLs */}
                    {aiUrls.slice(1).map((url, index) => (
                      <div key={index + 1} className="relative flex gap-2 mt-3">
                        <div className="relative flex-1">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Database className="h-5 w-5 text-slate-500" />
                          </div>
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => handleUrlChange(index + 1, e.target.value)}
                            placeholder={`https://your-app.com/page${index + 2}`}
                            className="block w-full pl-10 bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveUrl(index + 1)}
                          className="px-3 bg-slate-800 hover:bg-red-900/50 border border-slate-700 hover:border-red-700 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                          title="Remove URL"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddUrl}
                      className="w-full mt-3 py-2 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-lg text-slate-500 hover:text-indigo-400 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={16} />
                      Add Another URL
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Test Data File (Optional)
                      <span className="ml-2 text-xs text-slate-500">For data-driven testing</span>
                    </label>
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={(e) => setTestDataFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer cursor-pointer bg-slate-900 border border-slate-700 rounded-lg"
                    />
                    <p className="mt-1 text-xs text-slate-500">Upload CSV or JSON file with test data for parametrized tests</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Framework Name
                      <span className="ml-2 text-xs text-slate-500">(Optional - for saving)</span>
                    </label>
                    <input
                      type="text"
                      value={frameworkName}
                      onChange={(e) => setFrameworkName(e.target.value)}
                      placeholder="My Automation Framework"
                      className="block w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* API Key section Removed */}

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Additional Context (Optional)</label>
                    <textarea
                      value={aiContext}
                      onChange={(e) => setAiContext(e.target.value)}
                      placeholder="e.g., 'This is a banking app. The login requires MFA which we mock. Focus on the transfer funds flow.'"
                      className="block w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleAiGenerate}
                    disabled={isGenerating || !aiUrls.some(url => url.trim())}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${isGenerating || !aiUrls.some(url => url.trim())
                      ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-900/50 transform hover:-translate-y-0.5'
                      }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Architecting Solution...
                      </>
                    ) : (
                      <>
                        <Bot size={24} />
                        Generate Framework
                      </>
                    )}
                  </button>

                  {project.pages.length > 0 && !isGenerating && (
                    <div className="mt-4 p-4 bg-green-900/20 border border-green-800 rounded-lg flex items-center gap-3 text-green-400">
                      <AlertCircle size={20} />
                      <span>Project generated! Check the <b>Pages</b> and <b>Tests</b> tabs to review.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Setup Tab */}
          {activeTab === 'setup' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-slate-800 pb-4">Project Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Project Name" value={project.config.projectName} onChange={(v) => setProject({ ...project, config: { ...project.config, projectName: v } })} />
                <InputGroup label="Base URL" value={project.config.baseUrl} onChange={(v) => setProject({ ...project, config: { ...project.config, baseUrl: v } })} />
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Browser</label>
                  <select
                    value={project.config.browser}
                    onChange={(e) => setProject({ ...project, config: { ...project.config, browser: e.target.value as any } })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="chrome">Chrome</option>
                    <option value="firefox">Firefox</option>
                    <option value="edge">Edge</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3 pt-8">
                  <input
                    type="checkbox"
                    id="headless"
                    checked={project.config.headless}
                    onChange={(e) => setProject({ ...project, config: { ...project.config, headless: e.target.checked } })}
                    className="w-5 h-5 accent-indigo-500"
                  />
                  <label htmlFor="headless" className="font-medium">Run Headless</label>
                </div>
              </div>
            </div>
          )}

          {/* Pages Tab */}
          {activeTab === 'pages' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold">Page Objects Model</h2>
                <button
                  onClick={() => setProject(p => ({ ...p, pages: [...p.pages, { id: crypto.randomUUID(), name: 'NewPage', elements: [] }] }))}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Plus size={16} /> Add Page
                </button>
              </div>

              <div className="grid gap-6">
                {project.pages.length === 0 && <div className="text-center text-slate-500 py-10">No pages defined. Use AI or add manually.</div>}
                {project.pages.map((page, pIndex) => (
                  <div key={page.id} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                    <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                      <input
                        value={page.name}
                        onChange={(e) => {
                          const newPages = [...project.pages];
                          newPages[pIndex].name = e.target.value;
                          setProject({ ...project, pages: newPages });
                        }}
                        className="bg-transparent font-bold text-lg text-indigo-400 focus:outline-none"
                        placeholder="Page Name"
                      />
                      <button
                        onClick={() => {
                          const newPages = project.pages.filter((_, i) => i !== pIndex);
                          setProject({ ...project, pages: newPages });
                        }}
                        className="text-slate-500 hover:text-red-400">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="p-4 space-y-4">
                      {page.elements.map((el, eIndex) => (
                        <div key={el.id} className="flex gap-3 items-center bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                          <input
                            value={el.name}
                            onChange={(e) => {
                              const newPages = [...project.pages];
                              newPages[pIndex].elements[eIndex].name = e.target.value;
                              setProject({ ...project, pages: newPages });
                            }}
                            placeholder="Element Name"
                            className="bg-transparent border-b border-slate-700 w-1/4 focus:border-indigo-500 outline-none text-sm"
                          />
                          <select
                            value={el.locatorType}
                            onChange={(e) => {
                              const newPages = [...project.pages];
                              newPages[pIndex].elements[eIndex].locatorType = e.target.value as any;
                              setProject({ ...project, pages: newPages });
                            }}
                            className="bg-slate-800 text-xs rounded border border-slate-700 p-1 text-slate-300">
                            <option value="id">ID</option>
                            <option value="css">CSS</option>
                            <option value="xpath">XPath</option>
                            <option value="name">Name</option>
                            <option value="className">Class</option>
                            <option value="linkText">Link Text</option>
                            <option value="partialLinkText">Partial Link</option>
                            <option value="tagName">Tag</option>
                          </select>
                          <input
                            value={el.locatorValue}
                            onChange={(e) => {
                              const newPages = [...project.pages];
                              newPages[pIndex].elements[eIndex].locatorValue = e.target.value;
                              setProject({ ...project, pages: newPages });
                            }}
                            placeholder="Locator Value"
                            className="bg-transparent border-b border-slate-700 flex-1 focus:border-indigo-500 outline-none text-sm font-mono text-slate-400"
                          />
                          <button
                            onClick={() => {
                              const newPages = [...project.pages];
                              newPages[pIndex].elements = newPages[pIndex].elements.filter((_, i) => i !== eIndex);
                              setProject({ ...project, pages: newPages });
                            }}
                            className="text-slate-600 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newPages = [...project.pages];
                          newPages[pIndex].elements.push({ id: crypto.randomUUID(), name: 'new_element', locatorType: 'id', locatorValue: '' });
                          setProject({ ...project, pages: newPages });
                        }}
                        className="w-full py-2 border border-dashed border-slate-700 rounded text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 text-sm transition-colors">
                        + Add Element
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tests Tab */}
          {activeTab === 'tests' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold">Test Scenarios</h2>
                <button
                  onClick={() => setProject(p => ({ ...p, tests: [...p.tests, { id: crypto.randomUUID(), name: 'test_new_scenario', type: 'regression', steps: [] }] }))}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Plus size={16} /> Add Test
                </button>
              </div>
              <div className="grid gap-4">
                {project.tests.map((test, i) => (
                  <div key={test.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <input
                          value={test.name}
                          onChange={(e) => {
                            const newTests = [...project.tests];
                            newTests[i].name = e.target.value;
                            setProject({ ...project, tests: newTests });
                          }}
                          className="bg-transparent text-lg font-bold text-green-400 focus:outline-none w-96"
                        />
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${test.type === 'smoke' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {test.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newTests = project.tests.filter((_, idx) => idx !== i);
                          setProject({ ...project, tests: newTests });
                        }}
                        className="text-slate-500 hover:text-red-400">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3 text-sm text-slate-400 font-mono">
                      {test.steps.length > 0 ? (
                        <ul className="list-decimal list-inside space-y-1">
                          {test.steps.map(step => (
                            <li key={step.id}>{step.description}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="italic opacity-50">No detailed steps defined yet.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Code2 className="text-indigo-400" />
                  Framework Preview
                </h2>
                <div className="text-sm text-slate-500 font-mono bg-slate-800 px-3 py-1 rounded-full">
                  {project.config.projectName}
                </div>
              </div>

              <div className="flex-1 flex border border-slate-700 rounded-xl overflow-hidden shadow-2xl bg-slate-950">
                {/* File Tree Sidebar */}
                <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
                  <div className="p-3 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Project Explorer
                  </div>
                  <div className="flex-1 overflow-y-auto py-2">
                    {fileTree.map(node => (
                      <FileTreeNode
                        key={node.name + node.path}
                        node={node}
                        level={0}
                        selectedFile={selectedPreviewFile}
                        onSelect={setSelectedPreviewFile}
                      />
                    ))}
                  </div>
                </div>

                {/* Code Viewer */}
                <div className="flex-1 overflow-hidden flex flex-col bg-[#0d1117]">
                  {selectedPreviewFile ? (
                    <>
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50 text-xs text-slate-400 font-mono">
                        <span>{selectedPreviewFile}</span>
                        <span className="opacity-50">Read-only</span>
                      </div>
                      <div className="flex-1 overflow-auto p-6">
                        <pre className="font-mono text-sm leading-relaxed text-slate-300">
                          <code>{previewFiles.get(selectedPreviewFile)}</code>
                        </pre>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                      <Code2 size={48} className="mb-4 opacity-20" />
                      <p>Select a file to view content</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Saved Frameworks Tab */}
          {activeTab === 'frameworks' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Database className="text-indigo-400" />
                  Saved Frameworks
                </h2>
                <label className="cursor-pointer flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  <Upload size={16} />
                  Import Framework
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportFramework}
                    className="hidden"
                  />
                </label>
              </div>

              {savedFrameworks.length === 0 ? (
                <div className="text-center py-20">
                  <Database size={64} className="mx-auto mb-4 text-slate-700" />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">No Saved Frameworks</h3>
                  <p className="text-slate-500">
                    Generate a framework using AI Architect and it will be automatically saved here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {savedFrameworks.map((fw) => (
                    <div
                      key={fw.id}
                      className={`bg-slate-800/50 border ${activeFrameworkId === fw.id ? 'border-indigo-500' : 'border-slate-700'
                        } p-6 rounded-xl hover:border-indigo-500/50 transition-all`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-indigo-400 mb-1">{fw.name}</h3>
                          <div className="flex gap-4 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <Layout size={14} />
                              {fw.totalPages} pages
                            </span>
                            <span className="flex items-center gap-1">
                              <Play size={14} />
                              {fw.totalTests} tests
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              v{fw.version}
                            </span>
                          </div>
                          {activeFrameworkId === fw.id && (
                            <span className="inline-block mt-2 text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 mb-4">
                        <div>Created: {new Date(fw.createdAt).toLocaleString()}</div>
                        <div>Updated: {new Date(fw.updatedAt).toLocaleString()}</div>
                      </div>

                      {fw.lastUrls && fw.lastUrls.length > 0 && (
                        <div className="mb-4 text-sm">
                          <p className="text-slate-500 mb-1">Last analyzed URLs:</p>
                          <div className="space-y-1">
                            {fw.lastUrls.slice(0, 3).map((url, i) => (
                              <div key={i} className="text-slate-400 truncate font-mono text-xs">
                                {url}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadFramework(fw.id)}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Upload size={14} />
                          Load
                        </button>
                        <button
                          onClick={() => handleExportFramework(fw.id)}
                          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Download size={14} />
                          Export
                        </button>
                        <button
                          onClick={() => handleDeleteFramework(fw.id)}
                          className="bg-red-900/50 hover:bg-red-900 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;

const SidebarItem = ({ active, onClick, icon, label, badge }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${active
      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}>
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </div>
    {badge !== undefined && (
      <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full text-slate-400 font-mono">{badge}</span>
    )}
  </button>
);

const InputGroup = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div className="space-y-2">
    <label className="text-sm text-slate-400">{label}</label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
    />
  </div>
);