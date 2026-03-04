import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';

const TestsTab: React.FC = () => {
    const { project, setProject } = useProjectContext();

    return (
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
    );
};

export default TestsTab;
