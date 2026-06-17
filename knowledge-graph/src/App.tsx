import { useState, useRef, useEffect, useCallback } from 'react';
import { saveAs } from 'file-saver';
import Toolbar from './components/Toolbar';
import GraphCanvas from './components/GraphCanvas';
import PropertyPanel from './components/PropertyPanel';
import StatusBar from './components/StatusBar';
import TableView from './components/TableView';
import { useGraphStore, newNodeId } from './store/useGraphStore';
import { useT } from './i18n';
import type { GraphData, GraphNode } from './types';
import './App.css';

function App() {
  const [showTableView, setShowTableView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const darkMode = useGraphStore((s) => s.darkMode);
  const importData = useGraphStore((s) => s.importData);
  const exportData = useGraphStore((s) => s.exportData);
  const addNode = useGraphStore((s) => s.addNode);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId);
  const t = useT();

  const updateCanvasSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCanvasSize({ width: rect.width, height: rect.height });
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize, showTableView]);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(text) as GraphData;
          if (data.nodes && data.edges) {
            importData(data);
          } else {
            alert(t('app.import.missingFields'));
          }
        } else {
          alert(t('app.import.jsonOnly'));
        }
      } catch (err) {
        console.error('Import failed:', err);
        alert(t('app.import.failed') + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportJSON = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    saveAs(blob, `${data.metadata.name || 'knowledge-graph'}.json`);
  };

  const handleAddNode = () => {
    const { nodes } = useGraphStore.getState();
    const newNode: GraphNode = {
      id: newNodeId(),
      label: `${t('app.newNodePrefix')}${nodes.length + 1}`,
      group: t('app.defaultGroup'),
      color: '#4A90D9',
      size: 32,
      shape: 'rect',
      description: '',
    };
    addNode(newNode);
  };

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Toolbar
        onToggleTableView={() => setShowTableView(!showTableView)}
        onImport={handleImport}
        onExportJSON={handleExportJSON}
      />
      <div className="main-area">
        <div className="canvas-container" ref={containerRef}>
          <GraphCanvas width={canvasSize.width} height={canvasSize.height} />
          {showTableView && <TableView onClose={() => setShowTableView(false)} />}
          <button className="fab-add-node" onClick={handleAddNode} title={t('app.addNode')}>+</button>
        </div>
        {(selectedNodeId || selectedEdgeId) && <PropertyPanel />}
      </div>
      <StatusBar />
    </div>
  );
}

export default App;
