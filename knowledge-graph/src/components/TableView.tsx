import { useState } from 'react';
import { useGraphStore, newNodeId, newEdgeId } from '../store/useGraphStore';
import { useT } from '../i18n';
import type { GraphNode, GraphEdge, EdgeStyle } from '../types';

type Tab = 'nodes' | 'edges';

export default function TableView({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('nodes');
  const t = useT();
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const updateNode = useGraphStore((s) => s.updateNode);
  const updateEdge = useGraphStore((s) => s.updateEdge);
  const addNode = useGraphStore((s) => s.addNode);
  const addEdge = useGraphStore((s) => s.addEdge);
  const deleteNode = useGraphStore((s) => s.deleteNode);
  const deleteEdge = useGraphStore((s) => s.deleteEdge);
  const darkMode = useGraphStore((s) => s.darkMode);

  const handleAddNode = () => {
    const node: GraphNode = {
      id: newNodeId(),
      label: `${t('table.defaultNode')}${nodes.length + 1}`,
      group: 'Default',
      color: '#4A90D9',
      size: 32,
      shape: 'rect',
      description: '',
    };
    addNode(node);
  };

  const handleAddEdge = () => {
    if (nodes.length < 2) return;
    const edge: GraphEdge = {
      id: newEdgeId(),
      source: nodes[0].id,
      target: nodes[1].id,
      label: t('table.defaultEdge'),
      color: '#999',
      width: 1.5,
      style: 'solid' as EdgeStyle,
    };
    addEdge(edge);
  };

  return (
    <div className={`table-view ${darkMode ? 'dark' : ''}`}>
      <div className="table-header">
        <div className="table-tabs">
          <button className={tab === 'nodes' ? 'active' : ''} onClick={() => setTab('nodes')}>
            {t('table.nodes', { count: nodes.length })}
          </button>
          <button className={tab === 'edges' ? 'active' : ''} onClick={() => setTab('edges')}>
            {t('table.edges', { count: edges.length })}
          </button>
        </div>
        <div className="table-actions">
          {tab === 'nodes' ? (
            <button onClick={handleAddNode}>{t('table.addNode')}</button>
          ) : (
            <button onClick={handleAddEdge}>{t('table.addEdge')}</button>
          )}
          <button onClick={onClose}>{t('table.close')}</button>
        </div>
      </div>

      <div className="table-content">
        {tab === 'nodes' ? (
          <table>
            <thead>
              <tr>
                <th>{t('table.th.color')}</th>
                <th>{t('table.th.name')}</th>
                <th>{t('table.th.group')}</th>
                <th>{t('table.th.size')}</th>
                <th>{t('table.th.description')}</th>
                <th>{t('table.th.action')}</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <tr key={node.id}>
                  <td>
                    <input
                      type="color"
                      value={node.color}
                      onChange={(e) => updateNode(node.id, { color: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={node.label}
                      onChange={(e) => updateNode(node.id, { label: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={node.group}
                      onChange={(e) => updateNode(node.id, { group: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={node.size}
                      onChange={(e) => updateNode(node.id, { size: Number(e.target.value) })}
                    >
                      <option value={24}>{t('panel.node.size.small')}</option>
                      <option value={32}>{t('panel.node.size.medium')}</option>
                      <option value={40}>{t('panel.node.size.large')}</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={node.description}
                      onChange={(e) => updateNode(node.id, { description: e.target.value })}
                    />
                  </td>
                  <td>
                    <button className="delete-row" onClick={() => deleteNode(node.id)}>{t('table.delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('table.th.color')}</th>
                <th>{t('table.th.source')}</th>
                <th>{t('table.th.target')}</th>
                <th>{t('table.th.label')}</th>
                <th>{t('table.th.width')}</th>
                <th>{t('table.th.style')}</th>
                <th>{t('table.th.action')}</th>
              </tr>
            </thead>
            <tbody>
              {edges.map((edge) => (
                <tr key={edge.id}>
                  <td>
                    <input
                      type="color"
                      value={edge.color}
                      onChange={(e) => updateEdge(edge.id, { color: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={edge.source}
                      onChange={(e) => updateEdge(edge.id, { source: e.target.value })}
                    >
                      {nodes.map((n) => (
                        <option key={n.id} value={n.id}>{n.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={edge.target}
                      onChange={(e) => updateEdge(edge.id, { target: e.target.value })}
                    >
                      {nodes.map((n) => (
                        <option key={n.id} value={n.id}>{n.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={edge.label}
                      onChange={(e) => updateEdge(edge.id, { label: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={edge.width}
                      min={0.5}
                      max={5}
                      step={0.5}
                      onChange={(e) => updateEdge(edge.id, { width: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <select
                      value={edge.style}
                      onChange={(e) => updateEdge(edge.id, { style: e.target.value as EdgeStyle })}
                    >
                      <option value="solid">{t('panel.edge.style.solid')}</option>
                      <option value="dashed">{t('panel.edge.style.dashed')}</option>
                      <option value="dotted">{t('panel.edge.style.dotted')}</option>
                    </select>
                  </td>
                  <td>
                    <button className="delete-row" onClick={() => deleteEdge(edge.id)}>{t('table.delete')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
