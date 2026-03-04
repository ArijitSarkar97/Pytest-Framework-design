import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';

const PagesTab: React.FC = () => {
    const { project, setProject } = useProjectContext();

    return (
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
    );
};

export default PagesTab;
