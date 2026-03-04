import React from 'react';
import { Code2 } from 'lucide-react';
import { FileTreeNode } from './FileTree';
import { useProjectContext } from '../context/ProjectContext';

const PreviewTab: React.FC = () => {
    const {
        project, previewFiles, selectedPreviewFile, setSelectedPreviewFile, fileTree
    } = useProjectContext();

    return (
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
    );
};

export default PreviewTab;
