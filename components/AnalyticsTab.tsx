import React, { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { useProjectContext } from '../context/ProjectContext';
import { Loader2 } from 'lucide-react';

const COLORS = ['#4ade80', '#f87171', '#facc15', '#a78bfa'];

const AnalyticsTab: React.FC = () => {
    const { activeFrameworkId } = useProjectContext();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!activeFrameworkId) return;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:3001/api/executions/history/${activeFrameworkId}`);
                if (res.ok) {
                    const data = await res.json();
                    // Process data for charts
                    const processed = data.map((run: any) => ({
                        date: new Date(run.startTime).toLocaleDateString(),
                        time: new Date(run.startTime).toLocaleTimeString(),
                        pass: run.passCount,
                        fail: run.failCount,
                        duration: run.duration ? (run.duration / 1000).toFixed(2) : 0,
                    })).reverse(); // Oldest first for line chart
                    setHistory(processed);
                }
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [activeFrameworkId]);

    if (!activeFrameworkId) return <div className="text-center text-slate-400 mt-20">Select a framework to view analytics</div>;
    if (loading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-cyan-400" size={32} /></div>;

    // Calculate aggregate stats
    const totalRuns = history.length;
    const avgPassRate = totalRuns > 0
        ? (history.reduce((acc, curr) => acc + (curr.pass / (curr.pass + curr.fail || 1)), 0) / totalRuns * 100).toFixed(1)
        : 0;

    return (
        <div className="animate-fade-in space-y-8">
            <h2 className="text-3xl font-display font-bold text-white">Test Analytics</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-xl border-l-4 border-cyan-500">
                    <div className="text-slate-400 text-sm uppercase tracking-wide">Total Executions</div>
                    <div className="text-4xl font-bold text-white mt-1">{totalRuns}</div>
                </div>
                <div className="glass-panel p-6 rounded-xl border-l-4 border-green-500">
                    <div className="text-slate-400 text-sm uppercase tracking-wide">Avg Pass Rate</div>
                    <div className="text-4xl font-bold text-green-400 mt-1">{avgPassRate}%</div>
                </div>
                <div className="glass-panel p-6 rounded-xl border-l-4 border-purple-500">
                    <div className="text-slate-400 text-sm uppercase tracking-wide">Recent Trend</div>
                    <div className="text-sm text-slate-300 mt-2">
                        Last 5 runs: {history.slice(-5).map(h => h.fail === 0 ? '✅' : '❌').join(' ')}
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-lg font-medium text-slate-300 mb-6">Pass/Fail Trend</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                <Legend />
                                <Line type="monotone" dataKey="pass" stroke="#4ade80" strokeWidth={2} activeDot={{ r: 8 }} />
                                <Line type="monotone" dataKey="fail" stroke="#f87171" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-lg font-medium text-slate-300 mb-6">Execution Duration (sec)</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                <Bar dataKey="duration" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsTab;
