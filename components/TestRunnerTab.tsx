import React, { useState, useEffect, useMemo } from 'react';
import { Play, Loader2, Search, CheckCircle, XCircle, AlertCircle, Clock, FileCode, Terminal } from 'lucide-react';
import { useProjectContext } from '../context/ProjectContext';
import { generatePyTestFramework } from '../services/pyGenerator';

interface TestFile {
    name: string;
    path: string;
    status: 'idle' | 'running' | 'passed' | 'failed' | 'error';
    lastDuration?: number;
}

const TestRunnerTab: React.FC = () => {
    const { activeFrameworkId, project, generationMode } = useProjectContext();
    const [executionId, setExecutionId] = useState<string | null>(null);
    const [globalStatus, setGlobalStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [results, setResults] = useState<any>(null);
    const [testFiles, setTestFiles] = useState<TestFile[]>([]);
    const [activeFile, setActiveFile] = useState<string | null>(null); // Currently running or selected file

    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

    // Load test files from project
    useEffect(() => {
        if (project) {
            const files = generatePyTestFramework(project, generationMode);
            const suiteFiles: TestFile[] = [];
            files.forEach((_, path) => {
                if (path.startsWith('tests/test_') && path.endsWith('.py')) {
                    suiteFiles.push({
                        name: path.split('/').pop() || path,
                        path: path,
                        status: 'idle'
                    });
                }
            });
            setTestFiles(suiteFiles.sort((a, b) => a.name.localeCompare(b.name)));
        }
    }, [project, generationMode]);

    const toggleFileSelection = (path: string) => {
        const newSet = new Set(selectedFiles);
        if (newSet.has(path)) {
            newSet.delete(path);
        } else {
            newSet.add(path);
        }
        setSelectedFiles(newSet);
    };

    const handleRunTest = async (target?: string | string[]) => {
        if (!activeFrameworkId) return;

        let filesToRun: string[] = [];
        if (typeof target === 'string') {
            filesToRun = [target];
        } else if (Array.isArray(target)) {
            filesToRun = target;
        } else {
            // Run all
            filesToRun = testFiles.map(f => f.path);
        }

        if (filesToRun.length === 0) return;

        setGlobalStatus('running');
        setActiveFile(filesToRun.length === 1 ? filesToRun[0] : (filesToRun.length === testFiles.length ? 'all' : 'selected'));
        setLogs(prev => ['']); // Clear logs on new run

        const mode = filesToRun.length > 1 ? 'Parallel' : 'Sequential';
        setLogs(prev => [...prev, `Initializing ${mode} test run for ${filesToRun.length} files...`]);
        setResults(null);

        // Update file status
        setTestFiles(prev => prev.map(f => filesToRun.includes(f.path) ? { ...f, status: 'running' } : { ...f, status: 'idle' }));

        try {
            const res = await fetch('http://localhost:3001/api/executions/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    frameworkId: activeFrameworkId,
                    testFiles: filesToRun
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to start test execution');
            }

            const data = await res.json();
            setExecutionId(data.executionId);
            setLogs(prev => [...prev, `Execution started: ${data.executionId}`]);
        } catch (error) {
            setGlobalStatus('error');
            setLogs(prev => [...prev, `Error: ${String(error)}`]);
            setTestFiles(prev => prev.map(f => filesToRun.includes(f.path) ? { ...f, status: 'error' } : f));
        }
    };

    // Poll for status
    useEffect(() => {
        if (globalStatus !== 'running' || !executionId) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`http://localhost:3001/api/executions/${executionId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'passed' || data.status === 'failed' || data.status === 'error') {
                        setGlobalStatus('completed');
                        setResults(data);
                        setLogs(prev => [...prev, `Execution finished with status: ${data.status}`]);

                        // Update all running files
                        setTestFiles(prev => prev.map(f => {
                            if (f.status === 'running') {
                                return { ...f, status: data.status, lastDuration: data.duration };
                            }
                            return f;
                        }));
                    }
                }
            } catch (error) {
                console.error("Polling error", error);
            }
        }, 1000); // Poll faster (1s)

        return () => clearInterval(interval);
    }, [globalStatus, executionId]);

    if (!activeFrameworkId) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                <AlertCircle size={48} className="mb-4 text-slate-600" />
                <p>Please select or generate a framework first.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in h-[calc(100vh-8rem)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white">Test Runner</h2>
                    <p className="text-slate-400">Execute suites individually or run full regression.</p>
                </div>
                <div className="flex gap-3">
                    {selectedFiles.size > 0 && (
                        <button
                            onClick={() => handleRunTest(Array.from(selectedFiles))}
                            disabled={globalStatus === 'running'}
                            className={`px-6 py-3 rounded-xl font-bold font-display flex items-center gap-2 transition-all ${globalStatus === 'running'
                                ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20 hover:-translate-y-0.5'
                                }`}
                        >
                            {globalStatus === 'running' ? <Loader2 className="animate-spin" /> : <Play size={20} />}
                            Run Selected ({selectedFiles.size})
                        </button>
                    )}
                    <button
                        onClick={() => handleRunTest()}
                        disabled={globalStatus === 'running'}
                        className={`px-6 py-3 rounded-xl font-bold font-display flex items-center gap-2 transition-all ${globalStatus === 'running'
                            ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                            : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 hover:-translate-y-0.5'
                            }`}
                    >
                        {globalStatus === 'running' && activeFile === 'all' ? <Loader2 className="animate-spin" /> : <Play size={20} />}
                        Run All Tests
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* Test Suites List */}
                <div className="col-span-4 glass-panel rounded-xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-slate-900/50">
                        <h3 className="font-medium text-slate-300 flex items-center gap-2">
                            <FileCode size={18} className="text-cyan-400" />
                            Test Suites ({testFiles.length})
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {testFiles.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                No test files found. Generate tests first.
                            </div>
                        ) : (
                            testFiles.map((file) => (
                                <div
                                    key={file.path}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${activeFile === file.path || (activeFile === 'selected' && selectedFiles.has(file.path))
                                        ? 'bg-cyan-900/20 border-cyan-500/30'
                                        : 'bg-slate-800/30 border-white/5 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <input
                                            type="checkbox"
                                            checked={selectedFiles.has(file.path)}
                                            onChange={() => toggleFileSelection(file.path)}
                                            className="w-4 h-4 rounded border-slate-600 bg-slate-900/50 text-cyan-500 focus:ring-cyan-500/20"
                                        />
                                        <div className={`p-1.5 rounded-full ${file.status === 'passed' ? 'text-green-400 bg-green-900/20' :
                                            file.status === 'failed' ? 'text-red-400 bg-red-900/20' :
                                                file.status === 'running' ? 'text-cyan-400 bg-cyan-900/20' :
                                                    'text-slate-500 bg-slate-800'
                                            }`}>
                                            {file.name.includes('ui') ? <Search size={14} /> : <FileCode size={14} />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-slate-200 truncate pr-2 text-sm" title={file.name}>
                                                {file.name}
                                            </div>
                                            {file.lastDuration && (
                                                <div className="text-xs text-slate-500">
                                                    {(file.lastDuration / 1000).toFixed(2)}s
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRunTest(file.path)}
                                        disabled={globalStatus === 'running'}
                                        title="Run this suite"
                                        className={`p-2 rounded-lg transition-colors ${globalStatus === 'running'
                                            ? 'text-slate-600 cursor-not-allowed'
                                            : 'text-slate-400 hover:text-green-400 hover:bg-green-900/20'
                                            }`}
                                    >
                                        {file.status === 'running' ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Console & Results */}
                <div className="col-span-8 flex flex-col gap-6 min-h-0">
                    {/* Console Output */}
                    <div className="glass-panel flex-1 rounded-xl flex flex-col overflow-hidden min-h-[300px]">
                        <div className="p-3 border-b border-white/5 bg-slate-950 flex justify-between items-center">
                            <h3 className="font-mono text-sm text-slate-400 flex items-center gap-2">
                                <Terminal size={14} /> Console Output
                            </h3>
                            {globalStatus === 'running' && (
                                <span className="text-xs text-cyan-400 animate-pulse flex items-center gap-1">
                                    <Loader2 size={12} className="animate-spin" />
                                    Executing {activeFile === 'all' ? 'All Tests' : activeFile === 'selected' ? `Selected (${selectedFiles.size})` : activeFile}...
                                </span>
                            )}
                        </div>
                        <div className="flex-1 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-y-auto whitespace-pre-wrap">
                            {logs.length === 0 && <span className="text-slate-600 italic">Ready to run tests...</span>}
                            {logs.map((log, i) => (
                                <div key={i} className="mb-0.5">{log}</div>
                            ))}
                            <div id="log-end" />
                        </div>
                    </div>

                    {/* Results Preview (Compact) */}
                    {results && (
                        <div className="h-48 glass-panel rounded-xl p-4 overflow-y-auto">
                            <div className="flex items-center gap-4 mb-4">
                                <h3 className="text-sm font-medium text-slate-300">Run Results</h3>
                                <div className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${results.status === 'passed' ? 'bg-green-500/20 text-green-400' :
                                    results.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'
                                    }`}>
                                    {results.status}
                                </div>
                                <span className="text-xs text-slate-500">
                                    Passed: <span className="text-green-400">{results.passCount}</span> |
                                    Failed: <span className="text-red-400">{results.failCount}</span>
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {results.results?.map((res: any, idx: number) => (
                                    <div key={idx} className={`p-2 rounded flex items-center justify-between text-xs border ${res.status === 'failed' ? 'bg-red-900/10 border-red-500/20' : 'bg-slate-800/50 border-white/5'
                                        }`}>
                                        <div className="flex items-center gap-2 truncate">
                                            {res.status === 'passed' ? <CheckCircle size={12} className="text-green-500" /> :
                                                <XCircle size={12} className="text-red-500" />}
                                            <span className="truncate" title={res.testName}>{res.testName}</span>
                                        </div>
                                        <span className="text-slate-500 ml-2">{res.duration}ms</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestRunnerTab;
