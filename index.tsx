import React from 'react';
import { createRoot } from 'react-dom/client';
import { ProjectProvider } from './context/ProjectContext';
import App from './App';

const root = createRoot(document.getElementById('root')!);
root.render(
    <ProjectProvider>
        <App />
    </ProjectProvider>
);
