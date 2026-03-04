import React from 'react';
import { useProjectContext } from './context/ProjectContext';
import ErrorBoundary from './components/ErrorBoundary';

// Tab Components
import Sidebar from './components/Sidebar';
import AiArchitectTab from './components/AiArchitectTab';
import PagesTab from './components/PagesTab';
import TestsTab from './components/TestsTab';
import PreviewTab from './components/PreviewTab';
import FrameworksTab from './components/FrameworksTab';
import PomLibraryTab from './components/PomLibraryTab';
import RagBrainTab from './components/RagBrainTab';
import TestRunnerTab from './components/TestRunnerTab';
import AnalyticsTab from './components/AnalyticsTab';

const App: React.FC = () => {
  const { activeTab } = useProjectContext();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex font-sans">
        <Sidebar />

        <main className="ml-64 flex-1 p-8 bg-slate-900 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'rag' && <RagBrainTab />}
            {activeTab === 'ai' && <AiArchitectTab />}
            {activeTab === 'pages' && <PagesTab />}
            {activeTab === 'tests' && <TestsTab />}
            {activeTab === 'preview' && <PreviewTab />}
            {activeTab === 'frameworks' && <FrameworksTab />}
            {activeTab === 'pomsets' && <PomLibraryTab />}
            {activeTab === 'runner' && <TestRunnerTab />}
            {activeTab === 'analytics' && <AnalyticsTab />}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;