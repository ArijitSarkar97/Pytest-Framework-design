import React, { useState } from 'react';
import { Folder, FolderOpen, File, FileCode, FileJson, FileText } from 'lucide-react';
import { TreeNode } from '../context/ProjectContext';

interface FileTreeNodeProps {
    node: TreeNode;
    level: number;
    selectedFile: string;
    onSelect: (path: string) => void;
}

const FileIcon = ({ name }: { name: string }) => {
    if (name.endsWith('.py')) return <FileCode size={16} className="text-blue-400" />;
    if (name.endsWith('.json')) return <FileJson size={16} className="text-yellow-400" />;
    if (name.endsWith('.ini') || name.endsWith('.txt')) return <FileText size={16} className="text-slate-400" />;
    return <File size={16} className="text-slate-500" />;
};

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

export { FileTreeNode, FileIcon };
export default FileTreeNode;
