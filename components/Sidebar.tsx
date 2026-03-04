import React from 'react';
import {
    Bot, Layout, Code2, Play, Database, Layers, Save, Plus, Download, Activity, BarChart2
} from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';

const SidebarItem = ({ active, onClick, icon, label, badge }: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    badge?: number;
}) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 ${active
            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
            }`}>
        <div className="flex items-center gap-3">
            {icon}
            <span className="font-medium text-sm">{label}</span>
        </div>
        {badge !== undefined && (
            <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full text-slate-400 font-mono border border-white/5">{badge}</span>
        )}
    </button>
);

const Sidebar: React.FC = () => {
    const {
        activeTab, setActiveTab, project,
        savedFrameworks, savedPomSets,
        activeFrameworkId,
        handleSaveFramework, handleDownload
    } = useProjectContext();

    return (
        <aside className="w-64 glass-panel border-r border-white/5 flex flex-col fixed h-full z-10">
            <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-slate-900/50">
                <Bot className="w-8 h-8 text-cyan-400 glow-text" />
                <h1 className="font-display font-bold text-xl tracking-tight text-white">PyTest<span className="text-cyan-400">AI</span></h1>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <SidebarItem active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} icon={<Bot size={20} />} label="AI Architect" />
                <SidebarItem active={activeTab === 'pages'} onClick={() => setActiveTab('pages')} icon={<Layout size={20} />} label="Page Objects" badge={project.pages.length} />
                <SidebarItem active={activeTab === 'tests'} onClick={() => setActiveTab('tests')} icon={<Play size={20} />} label="Test Cases" badge={project.tests.length} />
                <SidebarItem active={activeTab === 'preview'} onClick={() => setActiveTab('preview')} icon={<Code2 size={20} />} label="Code Preview" />
                <SidebarItem active={activeTab === 'frameworks'} onClick={() => setActiveTab('frameworks')} icon={<Database size={20} />} label="Saved Frameworks" badge={savedFrameworks.length} />
                <SidebarItem active={activeTab === 'runner'} onClick={() => setActiveTab('runner')} icon={<Play size={20} />} label="Run Tests" />
                <SidebarItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart2 size={20} />} label="Analytics" />
                <SidebarItem active={activeTab === 'pomsets'} onClick={() => setActiveTab('pomsets')} icon={<Layers size={20} />} label="POM Library" badge={savedPomSets.length} />
                <SidebarItem active={activeTab === 'rag'} onClick={() => setActiveTab('rag')} icon={<Bot size={20} />} label="RAG Brain" />
            </nav>

            <div className="p-4 border-t border-white/5 bg-slate-900/50 space-y-2">
                {activeFrameworkId ? (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleSaveFramework(false)}
                            className="flex-1 flex items-center justify-center gap-1 bg-green-600/80 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-all text-sm backdrop-blur-sm">
                            <Save size={16} />
                            Update
                        </button>
                        <button
                            onClick={() => handleSaveFramework(true)}
                            className="flex-1 flex items-center justify-center gap-1 bg-emerald-600/80 hover:bg-emerald-600 text-white py-3 rounded-lg font-medium transition-all text-sm backdrop-blur-sm"
                            title="Save as New Framework">
                            <Plus size={16} />
                            New
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => handleSaveFramework(false)}
                        className="w-full flex items-center justify-center gap-2 bg-green-600/80 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-all backdrop-blur-sm border border-white/10">
                        <Save size={18} />
                        Save Framework
                    </button>
                )}

                <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 btn-glow bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-3 rounded-lg font-medium border border-cyan-400/20">
                    <Download size={18} />
                    Download ZIP
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
