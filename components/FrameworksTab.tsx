import React from 'react';
import { Database, Layout, Play, Clock, Upload, Download, Trash2 } from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';

const FrameworksTab: React.FC = () => {
    const {
        savedFrameworks, activeFrameworkId,
        handleLoadFramework, handleExportFramework, handleDeleteFramework, handleImportFramework
    } = useProjectContext();

    return (
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
                        accept=".json,.zip"
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
                                        <span className="flex items-center gap-1"><Layout size={14} />{fw.totalPages} pages</span>
                                        <span className="flex items-center gap-1"><Play size={14} />{fw.totalTests} tests</span>
                                        <span className="flex items-center gap-1"><Clock size={14} />v{fw.version}</span>
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
                                        {fw.lastUrls.slice(0, 3).map((url: string, i: number) => (
                                            <div key={i} className="text-slate-400 truncate font-mono text-xs">{url}</div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button onClick={() => handleLoadFramework(fw.id)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                    <Upload size={14} /> Load
                                </button>
                                <button onClick={() => handleExportFramework(fw.id)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                    <Download size={14} /> Export
                                </button>
                                <button onClick={() => handleDeleteFramework(fw.id)} className="bg-red-900/50 hover:bg-red-900 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FrameworksTab;
