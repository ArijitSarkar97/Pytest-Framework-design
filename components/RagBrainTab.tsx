import React from 'react';
import { Bot, Zap, Loader2, Code2, Play } from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';

const RagBrainTab: React.FC = () => {
    const {
        ragUrl, setRagUrl,
        ragTestTypes, handleTestTypeToggle,
        ragApiKey, setRagApiKey,
        ragStrategy, setRagStrategy,
        ragLog, ragCode, ragTests,
        ragViewMode, setRagViewMode,
        isGenerating, handleRagGenerate
    } = useProjectContext();

    const testTypeOptions = [
        { key: 'smoke', label: '✅ Smoke Tests', desc: 'Critical path verification' },
        { key: 'functional', label: '✅ Functional Tests', desc: 'Happy path scenarios' },
        { key: 'negative', label: '✅ Negative Tests', desc: 'Validation & error handling' },
        { key: 'security', label: '🔒 Security Tests', desc: 'XSS, SQL injection, auth' },
        { key: 'performance', label: '⚡ Performance Tests', desc: 'Load time, responsiveness' },
        { key: 'accessibility', label: '♿ Accessibility Tests', desc: 'ARIA, keyboard navigation' },
        { key: 'integration', label: '🔗 Integration Tests', desc: 'API calls, DB interactions' },
        { key: 'regression', label: '🔄 Regression Tests', desc: 'Existing functionality' },
    ];

    return (
        <div className="animate-fade-in space-y-8">
            <div className="text-center space-y-4 mb-8">
                <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                    Generative Test Engine
                </h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Choose your generation strategy: <b>Speed & Free</b> or <b>Deep AI Reasoning</b>.
                </p>
            </div>

            {/* Strategy Selector */}
            <div className="flex justify-center gap-4 mb-8">
                <button
                    onClick={() => setRagStrategy('template')}
                    className={`flex items-center gap-3 px-6 py-4 rounded-xl border transition-all ${ragStrategy === 'template'
                        ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500 shadow-lg shadow-yellow-900/20'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-800/80'
                        }`}
                >
                    <Zap size={24} />
                    <div className="text-left">
                        <div className="font-bold">Template Engine</div>
                        <div className="text-xs opacity-80">Free • Instant • Offline</div>
                    </div>
                </button>

                <button
                    onClick={() => setRagStrategy('ai')}
                    className={`flex items-center gap-3 px-6 py-4 rounded-xl border transition-all ${ragStrategy === 'ai'
                        ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-lg shadow-purple-900/20'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-800/80'
                        }`}
                >
                    <Bot size={24} />
                    <div className="text-left">
                        <div className="font-bold">AI Reasoning</div>
                        <div className="text-xs opacity-80">Visual • Comprehensive • Smart</div>
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Target URL</label>
                        <input
                            type="url"
                            value={ragUrl}
                            onChange={(e) => setRagUrl(e.target.value)}
                            placeholder="https://example.com/login"
                            className="block w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                        <label className="block text-sm font-medium text-slate-300 mb-4">Select Test Types</label>
                        <div className="grid grid-cols-2 gap-3">
                            {testTypeOptions.map(opt => (
                                <label key={opt.key} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg cursor-pointer hover:bg-slate-900 transition-colors border border-slate-700/50 hover:border-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={ragTestTypes.includes(opt.key)}
                                        onChange={() => handleTestTypeToggle(opt.key)}
                                        className="mt-1 w-4 h-4 text-indigo-600 bg-slate-800 border-slate-600 rounded focus:ring-indigo-500"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-slate-200">{opt.label}</div>
                                        <div className="text-xs text-slate-400">{opt.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {ragStrategy === 'ai' && (
                        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl animate-fade-in">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Gemini API Key (Optional)</label>
                            <input
                                type="password"
                                value={ragApiKey}
                                onChange={(e) => setRagApiKey(e.target.value)}
                                placeholder="Leave empty if set in backend .env"
                                className="block w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 text-white focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                        </div>
                    )}

                    <button
                        onClick={handleRagGenerate}
                        disabled={isGenerating}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-3
              ${isGenerating ? 'bg-slate-700 cursor-not-allowed' :
                                ragStrategy === 'template'
                                    ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:scale-[1.02] active:scale-[0.98] text-white'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                    >
                        {isGenerating ? <Loader2 className="animate-spin" /> : (ragStrategy === 'template' ? <Zap /> : <Bot />)}
                        {isGenerating ? 'Generating...' : (ragStrategy === 'template' ? 'Generate with Templates (Free)' : 'Generate with AI Reasoning')}
                    </button>

                    {ragLog && (
                        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-400 whitespace-pre-wrap">
                            {ragLog}
                        </div>
                    )}
                </div>

                {/* Output Area */}
                {(ragCode || ragTests.length > 0) && (
                    <div className="space-y-4">
                        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg w-fit">
                            <button
                                onClick={() => setRagViewMode('code')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${ragViewMode === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Code2 className="inline mr-2" size={16} />
                                Generated Code
                            </button>
                            <button
                                onClick={() => setRagViewMode('scenarios')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${ragViewMode === 'scenarios' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Play className="inline mr-2" size={16} />
                                Test Scenarios ({ragTests.length})
                            </button>
                        </div>

                        {ragViewMode === 'code' ? (
                            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                                <div className="bg-slate-900 p-3 border-b border-slate-800 flex justify-between items-center">
                                    <span className="text-sm font-medium text-slate-400">Generated Python Code</span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(ragCode);
                                            alert('Copied to clipboard!');
                                        }}
                                        className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-purple-400"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <div className="p-4 overflow-auto max-h-[600px]">
                                    {ragCode ? (
                                        <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">{ragCode}</pre>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 py-12">
                                            <Code2 size={48} className="opacity-20" />
                                            <p>Code will appear here</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {ragTests.map((test) => (
                                    <div key={test.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                                        <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${test.type === 'smoke' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {test.type === 'smoke' ? <Zap size={16} /> : <Play size={16} />}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-200">{test.name}</h3>
                                                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                                                        {test.type} TEST
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <table className="w-full text-left text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-700 text-slate-500">
                                                        <th className="pb-2 font-medium w-12">#</th>
                                                        <th className="pb-2 font-medium w-24">Action</th>
                                                        <th className="pb-2 font-medium">Description</th>
                                                        <th className="pb-2 font-medium">Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-700/50">
                                                    {test.steps.map((step, idx) => (
                                                        <tr key={step.id} className="hover:bg-slate-700/20">
                                                            <td className="py-3 text-slate-500">{idx + 1}</td>
                                                            <td className="py-3">
                                                                <span className={`px-2 py-1 rounded text-xs font-mono ${step.action === 'click'
                                                                    ? 'bg-blue-500/20 text-blue-300'
                                                                    : step.action === 'input'
                                                                        ? 'bg-yellow-500/20 text-yellow-300'
                                                                        : step.action.includes('assert')
                                                                            ? 'bg-green-500/20 text-green-300'
                                                                            : 'bg-slate-700 text-slate-300'
                                                                    }`}>
                                                                    {step.action}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 text-slate-300">{step.description}</td>
                                                            <td className="py-3 font-mono text-slate-400 text-xs">{step.value || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                                {ragTests.length === 0 && (
                                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-700 rounded-xl">
                                        No structured scenarios found. Try generating again.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RagBrainTab;
