import { useState } from 'react';
import { useGraphStore, newEdgeId } from '../store/useGraphStore';
import { useT } from '../i18n';
import type { GraphEdge } from '../types';

const colorPresets = [
  '#4A90D9', '#50C878', '#FF7F50', '#9B59B6', '#E74C3C',
  '#F39C12', '#1ABC9C', '#34495E', '#95A5A6', '#E91E63',
];


export default function PropertyPanel() {
  const t = useT();
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const selectedEdgeId = useGraphStore((s) => s.selectedEdgeId);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const updateNode = useGraphStore((s) => s.updateNode);
  const updateEdge = useGraphStore((s) => s.updateEdge);
  const deleteNode = useGraphStore((s) => s.deleteNode);
  const deleteEdge = useGraphStore((s) => s.deleteEdge);
  const addEdge = useGraphStore((s) => s.addEdge);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);
  const setSelectedEdgeId = useGraphStore((s) => s.setSelectedEdgeId);
  const darkMode = useGraphStore((s) => s.darkMode);
  const pathStartId = useGraphStore((s) => s.pathStartId);
  const pathMode = useGraphStore((s) => s.pathMode);
  const pathNodeIds = useGraphStore((s) => s.pathNodeIds);
  const getConnectedNodes = useGraphStore((s) => s.getConnectedNodes);

  const [showAddEdge, setShowAddEdge] = useState(false);
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeLabel, setEdgeLabel] = useState('');
  const [edgeSearch, setEdgeSearch] = useState('');
  const linkingMode = useGraphStore((s) => s.linkingMode);
  const setLinkingMode = useGraphStore((s) => s.setLinkingMode);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  // Reset add-edge state when selection changes
  const resetEdgeForm = () => {
    setShowAddEdge(false);
    setEdgeTarget('');
    setEdgeLabel('');
    setEdgeSearch('');
    setLinkingMode(false);
  };

  const handleAddEdgeFromNode = () => {
    if (!selectedNode || !edgeTarget || selectedNode.id === edgeTarget) return;
    const newEdge: GraphEdge = {
      id: newEdgeId(),
      source: selectedNode.id,
      target: edgeTarget,
      label: edgeLabel || t('panel.node.defaultEdgeLabel'),
      color: '#999',
      width: 1.5,
      style: 'solid',
    };
    addEdge(newEdge);
    resetEdgeForm();
  };

  // Nothing selected — hide panel entirely
  if (!selectedNode && !selectedEdge) return null;

  if (selectedNode) {
    const connectedIds = getConnectedNodes(selectedNode.id);
    const isPathStart = pathStartId === selectedNode.id;
    const isInPath = pathNodeIds.has(selectedNode.id);

    return (
      <div className={`side-panel property-panel ${darkMode ? 'dark' : ''}`}>
        <div className="panel-header">
          <h3>{t('panel.node.title')}</h3>
          <button
            className="delete-btn"
            onClick={() => { deleteNode(selectedNode.id); setSelectedNodeId(null); }}
            title={t('panel.node.delete')}
          >
            🗑
          </button>
        </div>
        <div className="property-form">
          <label>
            {t('panel.node.name')}
            <input
              type="text"
              value={selectedNode.label}
              onChange={(e) => updateNode(selectedNode.id, { label: e.target.value })}
            />
          </label>
          <label>
            {t('panel.node.group')}
            <input
              type="text"
              value={selectedNode.group}
              onChange={(e) => updateNode(selectedNode.id, { group: e.target.value })}
            />
          </label>
          <label>
            {t('panel.node.description')}
            <textarea
              value={selectedNode.description}
              onChange={(e) => updateNode(selectedNode.id, { description: e.target.value })}
              rows={3}
            />
          </label>
          <label>
            {t('panel.node.color')}
            <div className="color-row">
              <input
                type="color"
                value={selectedNode.color}
                onChange={(e) => updateNode(selectedNode.id, { color: e.target.value })}
              />
              <div className="color-presets">
                {colorPresets.map((c) => (
                  <button
                    key={c}
                    className={`color-preset ${selectedNode.color === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => updateNode(selectedNode.id, { color: c })}
                  />
                ))}
              </div>
            </div>
          </label>
          <label>
            {t('panel.node.size')}
            <div className="shape-options">
              {[
                { value: 24, key: 'panel.node.size.small' as const },
                { value: 32, key: 'panel.node.size.medium' as const },
                { value: 40, key: 'panel.node.size.large' as const },
              ].map((opt) => (
                <button
                  key={opt.value}
                  className={selectedNode.size === opt.value ? 'active' : ''}
                  onClick={() => updateNode(selectedNode.id, { size: opt.value })}
                >
                  {t(opt.key)}
                </button>
              ))}
            </div>
          </label>

          {pathMode && (
            <div className="path-hint" style={{ marginTop: 8, borderTop: 'none' }}>
              {isPathStart
                ? t('panel.node.pathStart')
                : isInPath
                  ? t('panel.node.inPath')
                  : t('panel.node.clickToSetPath')}
            </div>
          )}

          {/* Add connection from this node */}
          <div className="add-edge-section">
            {!showAddEdge ? (
              <button className="add-edge-btn" onClick={() => setShowAddEdge(true)}>
                {t('panel.node.addEdge')}
              </button>
            ) : linkingMode ? (
              <div className="add-edge-form">
                <div className="linking-hint">
                  <span className="linking-icon">🎯</span>
                  {t('panel.node.linkingHint')}
                </div>
                <div className="add-edge-from">
                  <span className="from-node" style={{ color: selectedNode.color }}>{t('panel.node.from')}</span>
                  <span className="from-node-name">{selectedNode.label}</span>
                </div>
                <button className="btn-cancel" onClick={() => setLinkingMode(false)}>
                  {t('panel.node.cancel')}
                </button>
              </div>
            ) : (
              <div className="add-edge-form">
                <div className="add-edge-from">
                  <span className="from-node" style={{ color: selectedNode.color }}>{t('panel.node.from')}</span>
                  <span className="from-node-name">{selectedNode.label}</span>
                  <span className="arrow">→</span>
                </div>

                {/* Search box to filter target nodes */}
                <label>
                  {t('panel.node.searchTarget')}
                  <input
                    type="text"
                    className="node-search-input"
                    placeholder={t('panel.node.searchPlaceholder')}
                    value={edgeSearch}
                    onChange={(e) => setEdgeSearch(e.target.value)}
                  />
                </label>

                {/* Candidate list */}
                <div className="node-candidate-list">
                  {nodes
                    .filter((n) => {
                      if (n.id === selectedNode.id) return false;
                      if (!edgeSearch.trim()) return true;
                      const q = edgeSearch.toLowerCase();
                      return (
                        n.label.toLowerCase().includes(q) ||
                        n.group.toLowerCase().includes(q) ||
                        n.description.toLowerCase().includes(q)
                      );
                    })
                    .map((n) => (
                      <div
                        key={n.id}
                        className={`node-candidate-item ${edgeTarget === n.id ? 'selected' : ''}`}
                        onClick={() => setEdgeTarget(n.id)}
                      >
                        <span className="node-color" style={{ background: n.color }} />
                        <span>{n.label}</span>
                      </div>
                    ))
                  }
                </div>

                {edgeTarget && (
                  <div className="edge-target-chosen">
                    <span>{t('panel.node.target')}</span>
                    <strong>{nodes.find(n => n.id === edgeTarget)?.label}</strong>
                    <button className="clear-target" onClick={() => setEdgeTarget('')}>✕</button>
                  </div>
                )}

                <label>
                  {t('panel.node.edgeLabel')}
                  <input
                    type="text"
                    placeholder={t('panel.node.edgeLabelPlaceholder')}
                    value={edgeLabel}
                    onChange={(e) => setEdgeLabel(e.target.value)}
                  />
                </label>

                <button
                  className="canvas-pick-btn"
                  onClick={() => setLinkingMode(true, selectedNode.id)}
                >
                  {t('panel.node.pickFromCanvas')}
                </button>

                <div className="add-edge-actions">
                  <button className="btn-primary" onClick={handleAddEdgeFromNode} disabled={!edgeTarget}>
                    {t('panel.node.add')}
                  </button>
                  <button className="btn-cancel" onClick={resetEdgeForm}>
                    {t('panel.node.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {connectedIds.length > 0 && (
            <div className="connected-nodes">
              <label>{t('panel.node.connected', { count: connectedIds.length })}</label>
              <div className="connected-list">
                {connectedIds.map((cid) => {
                  const cn = nodes.find((n) => n.id === cid);
                  if (!cn) return null;
                  return (
                    <div
                      key={cid}
                      className="connected-item"
                      onClick={() => setSelectedNodeId(cid)}
                    >
                      <span className="node-color" style={{ background: cn.color }} />
                      <span>{cn.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedEdge) {
    const sourceNode = nodes.find((n) => n.id === selectedEdge.source);
    const targetNode = nodes.find((n) => n.id === selectedEdge.target);
    return (
      <div className={`side-panel property-panel ${darkMode ? 'dark' : ''}`}>
        <div className="panel-header">
          <h3>{t('panel.edge.title')}</h3>
          <button
            className="delete-btn"
            onClick={() => { deleteEdge(selectedEdge.id); setSelectedEdgeId(null); }}
            title={t('panel.edge.delete')}
          >
            🗑
          </button>
        </div>
        <div className="property-form">
          <div className="edge-endpoints">
            <span className="endpoint" style={{ color: sourceNode?.color }}>
              {sourceNode?.label}
            </span>
            <span className="arrow">→</span>
            <span className="endpoint" style={{ color: targetNode?.color }}>
              {targetNode?.label}
            </span>
          </div>
          <label>
            {t('panel.edge.label')}
            <input
              type="text"
              value={selectedEdge.label}
              onChange={(e) => updateEdge(selectedEdge.id, { label: e.target.value })}
            />
          </label>
          <label>
            {t('panel.edge.color')}
            <div className="color-row">
              <input
                type="color"
                value={selectedEdge.color}
                onChange={(e) => updateEdge(selectedEdge.id, { color: e.target.value })}
              />
              <div className="color-presets">
                {colorPresets.map((c) => (
                  <button
                    key={c}
                    className={`color-preset ${selectedEdge.color === c ? 'active' : ''}`}
                    style={{ background: c }}
                    onClick={() => updateEdge(selectedEdge.id, { color: c })}
                  />
                ))}
              </div>
            </div>
          </label>
          <label>
            {t('panel.edge.width', { width: selectedEdge.width })}
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={selectedEdge.width}
              onChange={(e) => updateEdge(selectedEdge.id, { width: Number(e.target.value) })}
            />
          </label>
          <label>
            {t('panel.edge.style')}
            <div className="shape-options">
              {(['solid', 'dashed', 'dotted'] as const).map((s) => (
                <button
                  key={s}
                  className={selectedEdge.style === s ? 'active' : ''}
                  onClick={() => updateEdge(selectedEdge.id, { style: s })}
                >
                  {s === 'solid' ? t('panel.edge.style.solid') : s === 'dashed' ? t('panel.edge.style.dashed') : t('panel.edge.style.dotted')}
                </button>
              ))}
            </div>
          </label>
        </div>
      </div>
    );
  }

  return null;
}
