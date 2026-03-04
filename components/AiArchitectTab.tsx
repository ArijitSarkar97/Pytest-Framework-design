import React from 'react';
import {
    Bot, Database, Loader2, Plus, Trash2, Settings, AlertCircle, Layers
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';

const AiArchitectTab: React.FC = () => {
    const {
        aiUrls, handleUrlChange, handleAddUrl, handleRemoveUrl,
        aiContext, setAiContext,
        testDataFile, setTestDataFile,
        generationMode, setGenerationMode,
        frameworkName, setFrameworkName,
        pomSetName, setPomSetName,
        project, setProject,
        isGenerating, handleAiGenerate
    } = useProjectContext();

    return (
        <div className="animate-fade-in space-y-8">
            <div className="text-center space-y-4 mb-12">
                <h2 className="text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 glow-text">
                    AI-Powered Automation Architect
                </h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
                    Enter your application URL below. Our <b>Smart DOM Engine</b> will analyze the page and generate robust, stable locators automatically. <span className="text-cyan-400 font-bold glow-text">No API Key Required.</span>
                </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl">
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
                                className="block w-full pl-10 glass-input rounded-lg py-3 px-4"
                            />
                        </div>
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
                                        className="block w-full pl-10 glass-input rounded-lg py-3 px-4"
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
                        <label className="block text-sm font-medium text-slate-300 mb-2">Generation Mode</label>
                        <select
                            value={generationMode}
                            onChange={(e) => setGenerationMode(e.target.value as 'pom' | 'framework')}
                            className="block w-full glass-input rounded-lg py-3 px-4"
                        >
                            <option value="framework">🚀 Full Framework (Pages + Tests)</option>
                            <option value="pom">📄 POM Pages Only</option>
                        </select>
                        <p className="mt-1 text-xs text-slate-500">
                            {generationMode === 'framework'
                                ? 'Generates page objects, test cases, and saves to Frameworks'
                                : 'Generates only page objects and saves to POM Library'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {generationMode === 'framework' ? 'Framework Name' : 'POM Set Name'}
                            <span className="ml-2 text-xs text-slate-500">(Optional - for saving)</span>
                        </label>
                        <input
                            type="text"
                            value={generationMode === 'framework' ? frameworkName : pomSetName}
                            onChange={(e) => generationMode === 'framework'
                                ? setFrameworkName(e.target.value)
                                : setPomSetName(e.target.value)}
                            placeholder={generationMode === 'framework' ? 'My Automation Framework' : 'My POM Pages'}
                            className="block w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Driver Configuration Section */}
                    {generationMode === 'framework' && (
                        <div className="border-t border-slate-700 pt-6 mt-2">
                            <label className="block text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                                <Settings size={16} className="text-indigo-400" />
                                Driver Configuration
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-500">Browser</label>
                                    <select
                                        value={project.config.browser}
                                        onChange={(e) => setProject({ ...project, config: { ...project.config, browser: e.target.value as any } })}
                                        className="w-full glass-input rounded-lg py-2.5 px-3 text-sm"
                                    >
                                        <option value="all">🌍 All Browsers</option>
                                        <option value="chrome">🌐 Chrome</option>
                                        <option value="firefox">🦊 Firefox</option>
                                        <option value="edge">🔷 Edge</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-500">Project Name</label>
                                    <input
                                        value={project.config.projectName}
                                        onChange={(e) => setProject({ ...project, config: { ...project.config, projectName: e.target.value } })}
                                        placeholder="MyAutomationProject"
                                        className="w-full glass-input rounded-lg py-2.5 px-3 text-sm"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-4 w-full cursor-pointer hover:border-indigo-500 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={project.config.headless}
                                            onChange={(e) => setProject({ ...project, config: { ...project.config, headless: e.target.checked } })}
                                            className="w-4 h-4 accent-indigo-500"
                                        />
                                        <span className="text-sm text-slate-300">Headless Mode</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Additional Context (Optional)</label>
                        <textarea
                            value={aiContext}
                            onChange={(e) => setAiContext(e.target.value)}
                            placeholder="e.g., 'This is a banking app. The login requires MFA which we mock. Focus on the transfer funds flow.'"
                            className="block w-full glass-input rounded-lg py-3 px-4 h-24 resize-none"
                        />
                    </div>

                    <button
                        onClick={handleAiGenerate}
                        disabled={isGenerating || !aiUrls.some(url => url.trim())}
                        className={`w-full py-4 rounded-xl font-bold font-display text-lg flex items-center justify-center gap-3 transition-all ${isGenerating || !aiUrls.some(url => url.trim())
                            ? 'bg-slate-800/50 cursor-not-allowed text-slate-500 border border-white/5'
                            : generationMode === 'framework'
                                ? 'btn-glow bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white border border-indigo-400/30'
                                : 'btn-glow bg-gradient-to-r from-cyan-600 to-teal-600 text-white border border-cyan-400/30'
                            }`}
                    >
                        {isGenerating ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>{generationMode === 'framework' ? 'Architecting Solution...' : 'Generating POM Pages...'}</span>
                                </div>
                                <div className="flex gap-1 mt-1">
                                    <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 rounded-full bg-white animate-bounce"></span>
                                </div>
                                <span className="text-xs font-normal opacity-80">
                                    Analyzing DOM structure & generating resilient locators
                                </span>
                            </div>
                        ) : (
                            <>
                                {generationMode === 'framework' ? <Bot size={24} /> : <Layers size={24} />}
                                {generationMode === 'framework' ? 'Generate Framework' : 'Generate POM Pages'}
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
    );
};

export default AiArchitectTab;
