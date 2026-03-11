import React from 'react';
import { Layers, Layout, Code2, Save, Upload, Trash2 } from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';

const PomLibraryTab: React.FC = () => {
    const {
        project, savedPomSets,
        pomSetName, setPomSetName,
        handleSavePomSet, handleLoadPomSet, handleDeletePomSet
    } = useProjectContext();

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Layers className="text-cyan-400" />
                    POM Library
                </h2>
                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={pomSetName}
                        onChange={(e) => setPomSetName(e.target.value)}
                        placeholder="POM Set Name"
                        className="bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleSavePomSet}
                        disabled={project.pages.length === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${project.pages.length === 0
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                            }`}
                    >
                        <Save size={16} />
                        Save Current Pages
                    </button>
                </div>
            </div>

            <div className="bg-slate-800/30 border border-slate-700 p-4 rounded-lg mb-6">
                <p className="text-sm text-slate-400">
                    <span className="text-cyan-400 font-medium">POM Library</span> stores your analyzed page objects separately,
                    allowing you to reuse them across different frameworks. Save pages after generating them with AI Architect,
                    then load them into any framework.
                </p>
            </div>

            {savedPomSets.length === 0 ? (
                <div className="text-center py-20">
                    <Layers size={64} className="mx-auto mb-4 text-slate-700" />
                    <h3 className="text-xl font-semibold text-slate-400 mb-2">No Saved POM Sets</h3>
                    <p className="text-slate-500">
                        Generate pages using AI Architect, then save them here for reuse across frameworks.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {savedPomSets.map((pomSet) => (
                        <div
                            key={pomSet.id}
                            className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl hover:border-cyan-500/50 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-cyan-400 mb-1">{pomSet.name}</h3>
                                    <div className="flex gap-4 text-sm text-slate-400">
                                        <span className="flex items-center gap-1"><Layout size={14} />{pomSet.pages.length} pages</span>
                                        <span className="flex items-center gap-1">
                                            <Code2 size={14} />{pomSet.pages.reduce((acc: number, p: any) => acc + p.elements.length, 0)} elements
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 mb-4">
                                        <div>Source: <span className="font-mono text-slate-400">{pomSet.sourceUrl}</span></div>
                                        <div>Framework: <span className="font-mono text-indigo-400">{pomSet.frameworkType === 'javascript-playwright' ? '⚡ JS Playwright' : pomSet.frameworkType === 'pytest-playwright' ? '🎭 Playwright' : '🐍 Selenium'}</span></div>
                                        <div>Created: {new Date(pomSet.createdAt).toLocaleString()}</div>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-xs text-slate-500 mb-2">Pages included:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {pomSet.pages.slice(0, 5).map((page: any) => (
                                                <span key={page.id} className="bg-slate-700/50 text-slate-300 px-2 py-1 rounded text-xs">
                                                    {page.name}
                                                </span>
                                            ))}
                                            {pomSet.pages.length > 5 && (
                                                <span className="text-slate-500 text-xs">+{pomSet.pages.length - 5} more</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleLoadPomSet(pomSet.id)}
                                            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Upload size={14} /> Load into Project
                                        </button>
                                        <button
                                            onClick={() => handleDeletePomSet(pomSet.id)}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors"
                                            title="Delete POM Set"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PomLibraryTab;
